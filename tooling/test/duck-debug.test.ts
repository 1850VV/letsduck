import {frozenOracle} from './fixtures/frozen-oracle.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { PersonalStore } from '@letsduck/storage';
import { DebugSetup, Firmware } from './duck-debug-fixture.js';
import { IDS, MAP_VERSION } from '../../packages/devices/src/shared.js';
const modules = async () => {
  const m = await import('../../packages/devices/src/duck-debug.js');
  assert.equal(typeof m?.DuckDebug, 'function', 'The asynchronous DuckDebug module is missing');
  return m!;
};
const temporary = (t: { after(fn: () => void): void }) => {
  const path = mkdtempSync(resolve(tmpdir(), 'duck-debug-'));
  const store = new PersonalStore({ path: resolve(path, 'personal.db'), partIds: [] });
  t.after(() => { store.close(); rmSync(path, { recursive: true, force: true }); });
  return store;
};
function record(store: PersonalStore, id: number): void {
  store.saveServoRecord('test-board', { id, sourceId: id, state: 'verified', mapVersion: MAP_VERSION, profile: { kp: 5, kd: id },
    readback: { ok: true, target_id: id, kp: 5, kd: id, raw_pos: 2200 }, verifiedAt: 'today', midEvidence: 'existing' });
}
test('passive status and numbering history never claim or write the controller', async t => {
  const store = temporary(t), rt = new Firmware(), setup = new DebugSetup(rt), { DuckDebug } = await modules();
  const debug = new DuckDebug(store, setup); t.after(() => debug.close());
  for (const id of IDS) record(store, id);
  assert.equal(debug.numbering().ready, true); assert.equal(rt.calls.length, 0);
  const status = await debug.status();
  assert.equal(status.numbering.ready, true); assert.deepEqual(status.onlineIds, [12, 13, 14]);
  assert.equal(status.boards.arduino.connected, true); assert.equal(status.boards.expansion.connected, true);
  assert.ok(rt.calls.every(call => call.method === 'GET')); assert.equal(setup.writeRequested, false);
});

async function harness(t: Parameters<typeof temporary>[0], ids?: number[], timing: Record<string, () => number> = {}) {
  const directory = mkdtempSync(resolve(tmpdir(), 'duck-debug-'));
  const store = new PersonalStore({ path: resolve(directory, 'personal.db'), partIds: [] });
  const rt = new Firmware(ids), setup = new DebugSetup(rt), { DuckDebug } = await modules();
  const debug = new DuckDebug(store, setup, timing);
  t.after(async () => { await debug.close(); store.close(); rmSync(directory, { recursive: true, force: true }); });
  return { store, rt, setup, debug, action: (action: string, args: Record<string, unknown> = {}) => debug.action({ action, ...args }) };
}
const writes = (rt: Firmware, action: string) => rt.calls.filter(call => call.body?.action === action);
const until = async (check: () => boolean) => {
  const deadline = performance.now() + 2000;
  while (!check()) { assert.ok(performance.now() < deadline, 'background operation did not progress'); await new Promise(resolve => setTimeout(resolve, 1)); }
};
test('stale feedback clears online claims while persisted numbering stays ready', async t => {
  const { store, rt, debug } = await harness(t); for (const id of IDS) record(store, id);
  rt.state.feedback_age_ms = 800;
  const status = await debug.status(); assert.deepEqual(status.onlineIds, []); assert.equal(status.boards.expansion.connected, false); assert.equal(status.numbering.ready, true);
});
test('individual read verifies without resetting midpoint and rejects a mismatched target', async t => {
  const { rt, debug, action } = await harness(t);
  await action('read', { id: 12 }); assert.ok(debug.numbering().verifiedIds.includes(12)); assert.equal(writes(rt, 'reset_mid').length, 0);
  rt.wrong = true; await assert.rejects(action('read', { id: 13 })); assert.ok(!debug.numbering().verifiedIds.includes(13));
});
test('single rename invalidates departed ID, preserves gains and records target readback', async t => {
  const { store, rt, debug, action } = await harness(t); record(store, 12); record(store, 22);
  await action('parameters', { id: 12, new_id: 22, kp: 5, kd: 12 });
  assert.deepEqual(rt.motors.get(22), { kp: 5, kd: 12, pos: 2212 }); assert.ok(!debug.numbering().verifiedIds.includes(12)); assert.ok(debug.numbering().verifiedIds.includes(22));
});
test('occupied rename target is rejected before EEPROM writes', async t => {
  const { rt, action } = await harness(t);
  await assert.rejects(action('parameters', { id: 12, new_id: 13, kp: 5, kd: 12 }));
  assert.equal(writes(rt, 'set_id').length + writes(rt, 'set_gains').length, 0);
});
test('cyclic remap uses one free temporary address without midpoint or gain writes', async t => {
  const { rt, action } = await harness(t), original = structuredClone(rt.motors);
  const result = await action('remap', { plan: [{ fromId: 12, toId: 13 }, { fromId: 13, toId: 12 }] });
  assert.deepEqual(rt.motors.get(13), original.get(12)); assert.deepEqual(rt.motors.get(12), original.get(13));
  assert.equal(writes(rt, 'set_id').length, 3); assert.equal(writes(rt, 'set_id')[0]?.body?.new_id, 253);
  assert.equal(writes(rt, 'reset_mid').length + writes(rt, 'set_gains').length, 0); assert.equal(result.ok, true);
});
test('lost ID-write acknowledgement is not replayed or counted as verified', async t => {
  const { store, rt, debug, action } = await harness(t); record(store, 12); rt.fail = 'set_id';
  await assert.rejects(action('parameters', { id: 12, new_id: 22, kp: 5, kd: 12 }), /未自动重试/);
  assert.equal(writes(rt, 'set_id').length, 1); assert.ok(!debug.numbering().verifiedIds.includes(12)); assert.ok(!debug.numbering().verifiedIds.includes(22));
});
test('invalid actions, ranges and nonfinite values make zero controller requests', async t => {
  const { rt, action } = await harness(t);
  for (const [name, args] of [
    ['jog', { id: 12, delta: 11 }], ['jog', { id: 12, delta: 0 }], ['parameters', { id: 254, new_id: 2, kp: 5, kd: 20 }],
    ['mode', { mode: 'unknown' }], ['command', { twist: [NaN, 0, 0] }], ['protection', { current_a: -1 }],
    ['remap', { plan: [{ fromId: 12, toId: 13 }, { fromId: 14, toId: 13 }] }], ['read', { id: true }],
  ] as const) { const before = rt.calls.length; await assert.rejects(action(name, args)); assert.equal(rt.calls.length, before); }
});
test('control requires fresh control readiness but does not require all fifteen records', async t => {
  const { rt, setup, action } = await harness(t); await action('mode', { mode: 'policy' }); assert.equal(rt.state.mode, 'policy'); assert.equal(setup.writeRequested, true);
  await action('release'); rt.calls = []; rt.state.control_ready = false;
  await assert.rejects(action('mode', { mode: 'hold' }), /控制反馈尚未就绪/); assert.equal(rt.calls.filter(call => call.path === '/api/mode').length, 0);
});
test('protection broadcasts never verify numbering and check op target and broadcast flag', async t => {
  const { rt, debug, action } = await harness(t);
  const result = await action('protection', { enabled: true }); assert.equal(result.individuallyVerified, false); assert.deepEqual(debug.numbering().verifiedIds, []);
  assert.equal(writes(rt, 'set_protection').length, 1);
  const request = rt.request.bind(rt); rt.request = async (method, path, body) => {
    const result = await request(method, path, body);
    if ((body as Record<string, unknown> | undefined)?.action === 'set_protection_current') return { ok: true, op: 9, target_id: 254, broadcast: true };
    return result;
  };
  await assert.rejects(action('protection', { current_a: 2 }), /保护广播回执不匹配/);
});
test('calibration uses the fixed mapping index and validates the hold-position receipt', async t => {
  const { rt, action } = await harness(t); await action('cal-enter'); await action('cal-center', { id: 34 });
  assert.ok(rt.calls.some(call => call.path === '/api/cal/center' && call.body?.index === 14));
  const request = rt.request.bind(rt); rt.request = async (method, path, body) => path === '/api/cal/center' ? { ok: true, index: 14, id: 34, hold_pos: 2047 } : request(method, path, body);
  await assert.rejects(action('cal-center', { id: 34 }), /中位保持回执不匹配/);
  await action('leave'); assert.equal(rt.state.mode, 'shadow');
});
test('leave preserves retained policy mode, zeros only twist and revokes subsequent commands', async t => {
  const { rt, setup, action } = await harness(t); await action('mode', { mode: 'policy' }); await action('leave');
  assert.equal(rt.state.mode, 'policy'); assert.deepEqual(rt.calls.at(-1), { method: 'POST', path: '/api/command', body: { twist: [0, 0, 0] } });
  const before = rt.calls.length; await assert.rejects(action('command', { twist: [.2, 0, 0] })); assert.equal(rt.calls.length, before); assert.equal(setup.writeRequested, true);
});
test('jog reads back its bounded motion, unloads held state and preserves gains', async t => {
  const { rt, debug, action } = await harness(t); const result = await action('jog', { id: 12, delta: 1 });
  assert.equal((result.readback as Record<string, unknown>).raw_pos, 2213);
  assert.equal((await debug.status()).devices.find(device => device.id === 12)?.held, false); assert.equal(rt.motors.get(12)?.kd, 12);
});
test('offline restart keeps previous numbering without discovering hardware', async t => {
  const store = temporary(t); for (const id of IDS) record(store, id);
  const rt = new Firmware(), { DuckDebug } = await modules(), debug = new DuckDebug(store, new DebugSetup(rt)); t.after(() => debug.close());
  assert.equal(debug.numbering().ready, true); assert.equal(rt.calls.length, 0);
});
test('enabling control exits an exclusive mode and rereads readiness first', async t => {
  const { rt, action } = await harness(t); await action('read', { id: 12 }); rt.calls = []; await action('mode', { mode: 'policy' });
  assert.equal(rt.state.mode, 'policy');
  const modes = rt.calls.filter(call => call.path === '/api/mode').map(call => call.body?.mode); assert.deepEqual(modes, ['shadow', 'policy']);
});
test('asynchronous full scan stops with partial discoveries and allows status before completion', async t => {
  const { rt, debug, action } = await harness(t); rt.pingDelay = 2;
  await action('scan'); await until(() => debug.scan.checked >= 15);
  const started = performance.now(), status = await debug.status(); await action('scan-stop'); await debug.close();
  assert.equal(status.scan.active, true); assert.ok(performance.now() - started < 500); assert.equal(debug.scan.active, false); assert.equal(debug.scan.stopped, true);
  assert.deepEqual(debug.scan.found, [12, 13, 14]); assert.ok(debug.scan.checked < 254);
});
test('manual ownership awaits setup pause outside the shared bus and refuses a surviving task', async t => {
  const { setup, action } = await harness(t); let acquired = false;
  setup.pauseHook = async () => { await setup.io.run(async () => { acquired = true; }); };
  await action('read', { id: 12 }); assert.equal(acquired, true);
  setup.running = true; await assert.rejects(action('read', { id: 13 }), /舵机准备任务尚未停止/);
});
test('inspection never reclaims an external controller mode', async t => {
  const { rt, action } = await harness(t); await action('read', { id: 12 });
  assert.equal((await action('inspect', { id: 12 }).then(value => value.readback) as Record<string, unknown>).target_id, 12);
  rt.state.mode = 'policy'; const before = rt.calls.length;
  await assert.rejects(action('inspect', { id: 12 }), /读取已暂停/); assert.ok(rt.calls.slice(before).every(call => call.method === 'GET'));
});
test('unknown discovered IDs remain selectable after readback freshness expires', async t => {
  let now = 0; const { rt, debug, action } = await harness(t, undefined, { monotonic: () => now });
  rt.motors.set(1, { kp: 32, kd: 40, pos: 300 }); await action('read', { id: 1 }); rt.motors.delete(1); now = 3000;
  const device = (await debug.status()).devices.find(device => device.id === 1);
  assert.equal(device?.online, false); assert.equal(device?.kp, 32); assert.equal(device?.parametersLive, true); assert.equal(device?.pos, null);
});
test('reset midpoint stays pending until an individual readback without fabricating new proof', async t => {
  const { debug, action } = await harness(t); await action('read', { id: 12 }); await action('reset-mid', { id: 12 });
  assert.equal((await debug.status()).devices.find(device => device.id === 12)?.readbackPending, true);
  await action('read', { id: 12 }); assert.equal((await debug.status()).devices.find(device => device.id === 12)?.readbackPending, false);
});
test('partial remap failure preserves unchanged members and includes actual completed and remaining work', async t => {
  const { rt, store, debug, action } = await harness(t); record(store, 14); rt.fail = 'set_id';
  await assert.rejects(action('remap', { plan: [{ fromId: 12, toId: 22 }, { fromId: 14, toId: 14 }] }), error => {
    assert.ok(error instanceof Error && 'details' in error);
    const details = error.details as Record<string, unknown>; assert.deepEqual(details.completed, []); assert.deepEqual(details.remaining, [{ current: 12, target: 22, original: 12 }]); return true;
  });
  assert.ok(debug.numbering().verifiedIds.includes(14)); assert.equal(writes(rt, 'set_id').length, 1);
});
test('parallel passive status polls serialize on the same existing runtime bus', async t => {
  const { rt, debug } = await harness(t); let active = 0, peak = 0;
  const request = rt.request.bind(rt); rt.request = async (method, path, body) => {
    active++; peak = Math.max(peak, active); try { await new Promise(resolve => setTimeout(resolve, 5)); return await request(method, path, body); } finally { active--; }
  };
  await Promise.all([debug.status(), debug.status()]); assert.equal(peak, 1);
});
test('absolute target uses the newest encoder position and retains original gains', async t => {
  const { rt, action } = await harness(t); rt.motors.get(12)!.pos = 2215;
  const result = await action('move', { id: 12, target: 2218 }); assert.equal((result.readback as Record<string, unknown>).raw_pos, 2218);
  assert.equal(writes(rt, 'jog').at(-1)?.body?.delta, 3); assert.deepEqual(rt.motors.get(12), { kp: 5, kd: 12, pos: 2218 });
});
test('absolute target outside the ten-count window never sends jog', async t => {
  const { rt, action } = await harness(t); await assert.rejects(action('move', { id: 12, target: 2230 })); assert.equal(writes(rt, 'jog').length, 0);
});
test('already-reached target returns the current read without zero jog', async t => {
  const { rt, action } = await harness(t); const result = await action('move', { id: 12, target: 2212 });
  assert.equal((result.readback as Record<string, unknown>).raw_pos, 2212); assert.equal(writes(rt, 'jog').length, 0);
});
test('closing an unowned debug session sends no controller request or transport close', async t => {
  const { rt, debug } = await harness(t); await debug.status(); await debug.close(); await debug.close();
  assert.ok(rt.calls.every(call => call.method === 'GET')); assert.equal(rt.closed, 0); assert.equal(rt.halted, 0);
});

import { jsonParse, jsonStringify } from '@letsduck/storage';
async function differential(t: Parameters<typeof temporary>[0], raw: string[]): Promise<void> {
  const { rt, debug } = await harness(t);
  const input='{"state":'+JSON.stringify(rt.state)+',"motors":'+JSON.stringify([...rt.motors])+',"operations":['+raw.join(',')+']}';
  const run=frozenOracle('duck-debug',input);assert.equal(run.status,0,run.stderr);
  const output: unknown[] = [];
  for (const text of raw) {
    const body = jsonParse(text) as Record<string, unknown>;
    try {
      const result = body.action === '$status' ? await debug.status() : body.action === '$numbering' ? debug.numbering() : await debug.action(body);
      const pack = JSON.parse(jsonStringify(result)) as Record<string, unknown>;
      const numberings = ['records' in pack ? pack : undefined, pack.numbering].filter(value => value !== undefined) as Record<string, unknown>[];
      for (const item of numberings) for (const record of item.records as Record<string, unknown>[]) if ('verifiedAt' in record) record.verifiedAt = '<time>';
      output.push({ value: pack });
    } catch (error) {
      assert.ok(error instanceof Error && 'details' in error); output.push({ failure: { error: error.message, details: error.details } });
    }
  }
  assert.deepEqual({ output, calls: rt.calls.map(call => [call.method, call.path, call.body ?? null]) }, JSON.parse(run.stdout));
}
test('passive status retains every Python field including null unread parameters', async t => {
  await differential(t, ['{"action":"$status"}']);
});
test('debug action results, RPC order and strict raw-number errors match original Python', async t => {
  await differential(t, [
    '{"action":"read","id":12.0}', '{"action":"read","id":true}', '{"action":"jog","id":12,"delta":0}',
    '{"action":"read","id":12}', '{"action":"inspect","id":12}', '{"action":"move","id":12,"target":2215}',
    '{"action":"torque-off","id":12}', '{"action":"parameters","id":12,"new_id":22,"kp":5,"kd":20}',
    '{"action":"protection","enabled":false}', '{"action":"mode","mode":"policy"}', '{"action":"command","twist":[0.2,0,0]}',
    '{"action":"roller","enabled":true}', '{"action":"action-scale","scale":1.0}', '{"action":"filter","leg":0.2,"head":0.3}',
    '{"action":"imu-filter","gyro_alpha":0.4,"gravity_tau_s":0.2}', '{"action":"pick"}', '{"action":"roulade"}',
    '{"action":"leave"}', '{"action":"command","twist":[0.2,0,0]}', '{"action":"$numbering"}',
    '{"action":"cal-enter"}', '{"action":"cal-heartbeat"}', '{"action":"cal-center","id":34}', '{"action":"cal-exit"}',
  ]);
});

test('echoed float tokens and arbitrary historical fields remain lossless after adding proof fields', async t => {
  const { store, rt, action } = await harness(t), request = rt.request.bind(rt);
  rt.request = async (method, path, body) => path === '/api/action-scale' ? jsonParse('{"scale":1.0}') : request(method, path, body);
  const reply = await action('action-scale', { scale: 1 });
  assert.equal(jsonStringify(reply), '{"scale":1.0,"ok":true}');
  const previous = jsonParse('{"id":12,"state":"reported","custom":1.0,"huge":9007199254740993}') as Record<string, unknown>;
  store.saveServoRecord('test-board', previous); await action('read', { id: 12 });
  const saved = store.servoRecords('test-board').find(record => record.id === 12);
  assert.ok(saved); assert.match(jsonStringify(saved), /"custom":1\.0/); assert.match(jsonStringify(saved), /"huge":9007199254740993/);
});
test('queued commands recheck ownership after leave settles on the bus', async t => {
  const { setup, rt, action } = await harness(t); await action('mode', { mode: 'policy' });
  let release!: () => void; const blocked = new Promise<void>(resolve => { release = resolve; });
  const held = setup.io.run(() => blocked);
  const leaving = action('leave'); const rejected = assert.rejects(action('command', { twist: [.2, 0, 0] }), /请选择|请先选择/);
  release(); await held; await leaving; await rejected;
  const commands = rt.calls.filter(call => call.path === '/api/command'); assert.equal(commands.length, 1); assert.deepEqual(commands[0]?.body, { twist: [0, 0, 0] });
});
test('scan stop waits for its in-flight probe and permanently prevents observer restart without closing transport', async t => {
  const { rt, debug, action } = await harness(t);
  let entered!: () => void, release!: () => void; const started = new Promise<void>(resolve => { entered = resolve; }), blocked = new Promise<void>(resolve => { release = resolve; });
  rt.before = async (_method, _path, body) => { if ((body as Record<string, unknown> | undefined)?.action === 'ping') { entered(); await blocked; } };
  await action('scan'); await started; let settled = false; const stopping = debug.stopBackground().then(() => { settled = true; });
  await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false); release(); await stopping;
  const count = rt.calls.length; await new Promise(resolve => setTimeout(resolve, 5)); assert.equal(rt.calls.length, count);
  assert.equal(debug.scan.active, false); assert.equal(rt.closed, 0); assert.equal(rt.halted, 0); await assert.rejects(action('scan'), /已停止/);
});
test('scan yields to the real event loop even if injected sleeps settle immediately', async t => {
  const { debug, action } = await harness(t);
  await action('scan'); await new Promise(resolve => setImmediate(resolve));
  assert.equal(debug.scan.active, true); assert.ok(debug.scan.checked < 254); await action('scan-stop'); await debug.close();
});
test('raw floating readback gains never become integer numbering evidence', async t => {
  const { rt, debug, action } = await harness(t), request = rt.request.bind(rt);
  rt.request = async (method, path, body) => (body as Record<string, unknown> | undefined)?.action === 'read' ? jsonParse('{"ok":true,"target_id":12,"op":6,"kp":5.0,"kd":12,"raw_pos":2212}') : request(method, path, body);
  await assert.rejects(action('read', { id: 12 }), /参数读回不完整/); assert.deepEqual(debug.numbering().verifiedIds, []);
});
test('numbering preserves its own historical proof predicate without requiring setup profile or old-ID evidence', async t => {
  const { store, debug } = await harness(t); record(store, 12);
  const original = store.servoRecords('test-board')[0]!;
  store.saveServoRecord('test-board', { ...original, sourceId: 1, oldIdAbsent: false, profile: { kp: 5, kd: 12 } });
  assert.ok(debug.numbering().verifiedIds.includes(12));
  store.saveServoRecord('test-board', { ...original, verifiedAt: null }); assert.ok(!debug.numbering().verifiedIds.includes(12));
});
test('verify reads reported live IDs without midpoint writes or assuming all fifteen are present', async t => {
  const { rt, debug, action } = await harness(t); const result = await action('verify');
  assert.deepEqual((result.numbering as ReturnType<typeof debug.numbering>).verifiedIds, [12, 13, 14]);
  assert.equal(writes(rt, 'read').length, 3); assert.equal(writes(rt, 'ping').length + writes(rt, 'reset_mid').length + writes(rt, 'set_gains').length, 0);
});
test('string record IDs never promote stored numbering or parameter history', async t => {
  const { store, debug } = await harness(t); record(store, 12);
  const old = store.servoRecords('test-board')[0]!;
  store.saveServoRecord('test-board', { ...old, id: '12' });
  assert.deepEqual(debug.numbering().verifiedIds, []);
  const device = (await debug.status()).devices.find(device => device.id === 12); assert.equal(device?.kp, null);
});
test('real setup and debug share one bus and runtime while manual ownership pauses the observer', async t => {
  const directory = mkdtempSync(resolve(tmpdir(), 'duck-debug-'));
  const store = new PersonalStore({ path: resolve(directory, 'personal.db'), partIds: [] });
  const rt = new Firmware(), { ServoSetup } = await import('../../packages/devices/src/servo-setup.js'), { DuckDebug } = await modules();
  const setup = new ServoSetup(store, rt), debug = new DuckDebug(store, setup);
  t.after(async () => { await debug.close(); await setup.close(); store.close(); rmSync(directory, { recursive: true, force: true }); });
  rt.pingDelay = 2; await setup.inspect(); await until(() => rt.calls.some(call => call.body?.action === 'ping'));
  assert.equal(setup.running, true); assert.equal(debug.runtime, setup.runtime); assert.equal(debug.setup.io, setup.io);
  await debug.action({ action: 'mode', mode: 'policy' }); assert.equal(setup.running, false); assert.equal(rt.state.mode, 'policy');
  assert.equal(setup.writeRequested, true); const count = rt.calls.length; await setup.inspect();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(rt.calls.length, count);
  assert.equal(writes(rt, 'reset_mid').length + writes(rt, 'set_gains').length + writes(rt, 'set_id').length, 0);
});
