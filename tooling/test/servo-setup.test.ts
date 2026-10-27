import { test } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setImmediate as immediate, setTimeout as delay } from 'node:timers/promises';
import { parseWireJson, readJsonField } from '@letsduck/domain';
import { PersonalStore } from '../../packages/storage/src/personal.js';
import { Cancelled, Offline, SetupError } from '../../packages/devices/src/errors.js';
import { IoBus } from '../../packages/devices/src/bus.js';
import { IDS, MAP_VERSION, cloneJson } from '../../packages/devices/src/shared.js';
import type { DuckRuntime } from '../../packages/devices/src/types.js';

type Body = Record<string, unknown>;
class Runtime implements DuckRuntime {
  serial = 'uno-q-test'; port: number | null = 49152;
  servos = new Map<number, Body>(); actions: Body[] = []; calls: { method: string; path: string; body?: unknown }[] = [];
  online = true; loseAfter: string | null = null; rejectGains = false; closeCalls = 0; haltCalls = 0;
  status: Body = { mode: 'shadow', enabled: false, feedback_age_ms: 10, mcu_servo_debug: false, servo_scan_version: 2, imu_ok: true };
  html = '<input id="kp" value="5"><input id="kd" value="10">';
  before: ((method: string, path: string, body?: Body) => Promise<void> | void) | undefined;
  onConnect: (() => void) | undefined;
  constructor(ids = [1]) { for (const id of ids) this.servos.set(id, { raw_pos: 457, center_pos: 2047, kp: 5, kd: 10 }); }
  async connect() { this.onConnect?.(); if (!this.online) throw new Offline('设备已断开'); return this.serial; }
  async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    await this.connect(); const b = body as Body | undefined;
    this.calls.push({ method, path, ...(body === undefined ? {} : { body: cloneJson(body) }) });
    await this.before?.(method, path, b);
    if (path === '/servo.html') return this.html;
    if (path === '/api/status') return cloneJson(this.status);
    if (path === '/api/servo/enter') { Object.assign(this.status, { mode: 'servo_debug', mcu_servo_debug: true }); return { mode: 'servo_debug' }; }
    if (path === '/api/servo/exit') { Object.assign(this.status, { mode: 'shadow', mcu_servo_debug: false }); return { mode: 'shadow' }; }
    assert.equal(path, '/api/servo'); assert.equal(method, 'POST'); assert.ok(b);
    const action = b.action as string, sid = b.target_id as number;
    this.actions.push(cloneJson(b));
    const reply = { op: 7, target_id: sid, ok: this.servos.has(sid), raw_pos: 0, center_pos: 2047, kp: 0, kd: 0 };
    if (action === 'ping') return reply;
    const servo = this.servos.get(sid); if (!servo) throw new SetupError('舵机未响应');
    if (action === 'read') return { ...reply, ...servo, op: 6 };
    if (action === 'set_gains' && !this.rejectGains) Object.assign(servo, { kp: b.kp, kd: b.kd });
    if (action === 'set_id') { assert.ok(!this.servos.has(b.new_id as number)); this.servos.set(b.new_id as number, servo); this.servos.delete(sid); }
    if (action === this.loseAfter) { this.online = false; this.loseAfter = null; throw new Offline('写入后 USB 断开'); }
    return { ...reply, ok: true };
  }
  async halt() { this.haltCalls++; this.online = false; }
  async close() { this.closeCalls++; this.port = null; }
  writes() { return this.actions.filter(b => b.action !== 'ping' && b.action !== 'read').map(b => b.action); }
}
async function module() {
  assert.ok(existsSync(resolve(import.meta.dirname, '../../packages/devices/src/servo-setup.ts')), 'ServoSetup is not implemented');
  return await import('../../packages/devices/src/servo-setup.js');
}
async function fixture(t: TestContext, ids = [1], timing: { now?: () => number; monotonic?: () => number } = {}) {
  const { ServoSetup } = await module(), directory = mkdtempSync(join(tmpdir(), 'letsduck-setup-'));
  const path = join(directory, 'personal.db'), store = new PersonalStore({ path }), runtime = new Runtime(ids), io = new IoBus();
  const setup = new ServoSetup(store, runtime, { io, timing: { ...timing, sleep: async (ms, signal) => {
    try { await delay(Math.min(ms, 2), undefined, signal ? { signal } : undefined); }
    catch (error) { if (signal?.aborted) throw new Cancelled('paused'); throw error; }
  } } });
  t.after(async () => { await setup.close(); store.close(); rmSync(directory, { recursive: true, force: true }); });
  return { setup, runtime, store, io, path };
}
function record(store: PersonalStore, id: number, state = 'verified', source = id) {
  const saved = { id, sourceId: source, state, mapVersion: MAP_VERSION, midEvidence: 'existing',
    readback: { kp: 5, kd: 10 }, profile: { kp: 5, kd: 10 }, oldIdAbsent: true };
  store.saveServoRecord('uno-q-test', saved); return saved;
}
async function until(predicate: () => boolean, detail: () => unknown = () => null) {
  const deadline = Date.now() + 5000;
  while (!predicate() && Date.now() < deadline) await immediate();
  assert.ok(predicate(), JSON.stringify(detail()));
}

test('new servo writes midpoint, gains, ID then persists only readback proof', async t => {
  const { setup, runtime, path } = await fixture(t);
  await setup.configureOnce(); assert.deepEqual([...runtime.servos.keys()], [10]);
  assert.deepEqual(runtime.writes(), ['reset_mid', 'set_gains', 'set_id']);
  const saved = setup.snapshot().records[0]!;
  assert.equal(saved.state, 'verified'); assert.equal(saved.sourceId, 1); assert.equal(saved.oldIdAbsent, true); assert.equal(saved.midEvidence, 'acknowledged');
  const other = new PersonalStore({ path }); try { assert.deepEqual(other.servoRecords(runtime.serial), [saved]); } finally { other.close(); }
});
test('two responding IDs never receive configuration writes', async t => {
  const { setup, runtime } = await fixture(t, [1, 10]); await assert.rejects(setup.configureOnce(), /多个/);
  assert.deepEqual(runtime.writes(), []); assert.deepEqual(setup.snapshot().records, []);
});
test('reconnected assigned ID is read without becoming next ID', async t => {
  const { setup, runtime } = await fixture(t, [10]); await setup.configureOnce(); await setup.configureOnce();
  assert.deepEqual([...runtime.servos.keys()], [10]); assert.deepEqual(runtime.writes(), []);
  assert.equal(setup.snapshot().targetId, 11); assert.equal(setup.snapshot().records[0]?.midEvidence, 'existing');
});
test('reported existing ID stays reserved without fabricated verification', async t => {
  const { setup, runtime, store } = await fixture(t); record(store, 10, 'reported'); await setup.configureOnce();
  assert.deepEqual([...runtime.servos.keys()], [11]); assert.deepEqual(setup.snapshot().records.map(r => r.state), ['reported', 'verified']); assert.equal(setup.snapshot().targetId, 12);
});
test('lost ID acknowledgement is pending then read first without replaying writes', async t => {
  const { setup, runtime } = await fixture(t); runtime.loseAfter = 'set_id'; await assert.rejects(setup.configureOnce(), Offline);
  assert.equal(setup.snapshot().records[0]?.state, 'pending'); runtime.online = true;
  await setup.configureOnce(); assert.deepEqual(runtime.writes(), ['reset_mid', 'set_gains', 'set_id']); assert.equal(setup.snapshot().records[0]?.state, 'verified');
});
test('unknown runtime profile blocks all servo writes', async t => {
  const { setup, runtime } = await fixture(t); runtime.html = '<input id="kp" value="7"><input id="kd" value="99">';
  await assert.rejects(setup.configureOnce(), /配置档/); assert.deepEqual(runtime.writes(), []);
});
test('armed runtime cannot be repurposed by setup', async t => {
  const { setup, runtime } = await fixture(t); Object.assign(runtime.status, { mode: 'policy', enabled: true });
  await assert.rejects(setup.configureOnce(), /卸载/); assert.equal(runtime.status.mode, 'policy'); assert.deepEqual(runtime.writes(), []);
});
test('failed gain readback stays pending and recovery repairs only gains', async t => {
  const { setup, runtime } = await fixture(t); runtime.servos.get(1)!.kd = 20; runtime.rejectGains = true;
  await assert.rejects(setup.configureOnce(), /读回/); assert.equal(setup.snapshot().records[0]?.state, 'pending');
  runtime.rejectGains = false; await setup.configureOnce(); assert.deepEqual(runtime.writes(), ['reset_mid', 'set_gains', 'set_id', 'set_gains']);
});
test('interrupted midpoint is never replayed or claimed as mechanical verification', async t => {
  const { setup, runtime } = await fixture(t); runtime.loseAfter = 'reset_mid'; await assert.rejects(setup.configureOnce(), Offline);
  runtime.online = true; await setup.configureOnce(); assert.equal(runtime.writes().filter(a => a === 'reset_mid').length, 1);
  assert.equal(setup.snapshot().records[0]?.midEvidence, 'unconfirmed'); assert.equal(setup.snapshot().records[0]?.state, 'verified');
});
test('stale MCU feedback prevents writes', async t => {
  const { setup, runtime } = await fixture(t); runtime.status.feedback_age_ms = 9999; await assert.rejects(setup.configureOnce(), /反馈/); assert.deepEqual(runtime.writes(), []);
});
test('pause during discovery stops before opening runtime session', async t => {
  const { setup, runtime } = await fixture(t); runtime.onConnect = () => { void setup.pause(); };
  await assert.rejects(setup.configureOnce(), Cancelled); assert.deepEqual(runtime.calls, []);
});
test('last verified servo ends batch and retains explicit halt action', async t => {
  const { setup, runtime, store } = await fixture(t); for (const id of IDS.slice(0, -1)) record(store, id);
  await setup.start(); await until(() => !setup.running, () => setup.snapshot());
  assert.equal(setup.snapshot().phase, 'success'); assert.equal(setup.snapshot().running, false);
  await setup.halt(); assert.equal(runtime.haltCalls, 1); assert.equal(runtime.online, false);
});
test('observed online IDs are independent of historical success', async t => {
  const { setup, runtime, store } = await fixture(t, [20]); record(store, 10); await setup.observeOnce(true);
  assert.deepEqual(setup.snapshot().telemetry.ids, [20]); assert.equal(setup.snapshot().telemetry.known, true);
  assert.equal(setup.snapshot().records.find(r => r.id === 10)?.state, 'verified'); assert.deepEqual(runtime.writes(), []);
});
test('unchanged reads preserve historical verification evidence', async t => {
  const { setup, store } = await fixture(t, [10]); const old = { ...record(store, 10), verifiedAt: 123 }; store.saveServoRecord('uno-q-test', old);
  await setup.observeOnce(true); assert.deepEqual(store.servoRecords('uno-q-test'), [old]);
});
test('unknown replacement profile clears previous profile and live claims', async t => {
  const { setup, runtime } = await fixture(t); await setup.observeOnce(true); runtime.html = '<input id="kp" value="7"><input id="kd" value="99">';
  await assert.rejects(setup.observeOnce(), /配置档/); assert.equal(setup.snapshot().profile, null); assert.equal(setup.snapshot().telemetry.known, false); assert.deepEqual(runtime.writes(), []);
});
test('expired telemetry cannot leave inspection claiming live data', async t => {
  let now = 10000; const { setup } = await fixture(t, [10], { now: () => now });
  await setup.audit(10); await until(() => !setup.running); now += 5001;
  const s = setup.snapshot(); assert.equal(s.telemetry.known, false); assert.equal(s.inspection?.status, 'unknown'); assert.equal(s.inspection?.readback, null);
});
test('finished batch can be inspected after shutdown interval and reconnection', async t => {
  let now = Date.now(); const { setup, runtime } = await fixture(t, [10], { now: () => now });
  await setup.configureOnce(); await setup.halt(); now += 15001; runtime.online = true;
  await setup.inspect(); await until(() => !setup.running); assert.equal(setup.snapshot().telemetry.known, true);
});
test('readonly scan supports multiple servos and selected real reading', async t => {
  const { setup, runtime } = await fixture(t, [10, 20]); runtime.servos.get(20)!.raw_pos = 20;
  await setup.audit(20); await until(() => !setup.running); await setup.observeOnce(true);
  const s = setup.snapshot(); assert.deepEqual(s.telemetry.ids, [10, 20]); assert.equal(s.inspection?.id, 20); assert.equal(s.inspection?.readback?.raw_pos, 20); assert.deepEqual(runtime.writes(), []);
});
test('disconnect clears live claims but preserves verified record', async t => {
  const { setup, runtime, store } = await fixture(t, [10]); const old = record(store, 10); await setup.observeOnce(true);
  runtime.online = false; await assert.rejects(setup.observeOnce(), Offline); assert.equal(setup.snapshot().telemetry.known, false); assert.deepEqual(setup.snapshot().telemetry.ids, []); assert.deepEqual(store.servoRecords('uno-q-test'), [old]);
});
test('readonly audit promotes reported ID, revokes bad gains, and repair changes only gains', async t => {
  const { setup, runtime, store } = await fixture(t, [10]); record(store, 10, 'reported'); await setup.observeOnce(true);
  assert.equal(store.servoRecords('uno-q-test')[0]?.state, 'verified'); runtime.servos.get(10)!.kd = 40; await setup.observeOnce(); assert.equal(store.servoRecords('uno-q-test')[0]?.state, 'review');
  await setup.repair(10); assert.deepEqual(runtime.writes(), ['set_gains']); assert.equal(store.servoRecords('uno-q-test')[0]?.state, 'verified');
});
test('pending record requires old ID absence before readonly promotion', async t => {
  const { setup, runtime, store } = await fixture(t, [1, 10]); record(store, 10, 'pending', 1); await setup.observeOnce(true); assert.equal(store.servoRecords('uno-q-test')[0]?.state, 'review');
  runtime.servos.delete(1); await setup.observeOnce(); assert.equal(store.servoRecords('uno-q-test')[0]?.state, 'verified'); assert.deepEqual(runtime.writes(), []);
});
test('explicit target then default order preserves reserved reported ID', async t => {
  const { setup, runtime, store } = await fixture(t); record(store, 10, 'reported'); await setup.configureOnce(14);
  runtime.servos = new Map([[1, { raw_pos: 392, center_pos: 2047, kp: 32, kd: 40 }]]); await setup.configureOnce();
  assert.deepEqual([...runtime.servos.keys()], [11]); assert.equal(store.servoRecords('uno-q-test')[0]?.state, 'reported');
});
test('requested target is visible before discovery and start returns working promptly', async t => {
  const { setup, runtime } = await fixture(t); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  runtime.before = async (_method, path) => { if (path === '/api/status') await gate; };
  try { const s = await setup.start(14); assert.equal(s.phase, 'working'); assert.equal(s.activeTarget, 14); assert.equal(s.currentId, null); }
  finally { release(); await setup.pause(); }
});
async function queued(t: TestContext, when: 'working' | 'waiting', interrupted = false) {
  const { setup, runtime, store } = await fixture(t); record(store, 10, 'reported'); let queued = false;
  runtime.before = async (_method, _path, body) => { if (when === 'working' && !queued && body?.action === 'set_gains') { queued = true; await setup.queue(20); } };
  if (interrupted) runtime.loseAfter = 'set_gains'; await setup.start(14);
  if (interrupted) { await until(() => setup.snapshot().phase === 'offline'); runtime.online = true; }
  await until(() => setup.snapshot().phase === 'success' && setup.snapshot().currentId === 14, () => setup.snapshot());
  if (when === 'waiting') await setup.queue(20); assert.equal(setup.snapshot().queuedTarget, 20);
  runtime.online = false; await until(() => !setup.snapshot().online); runtime.servos = new Map([[1, { raw_pos: 392, center_pos: 2047, kp: 32, kd: 40 }]]); runtime.online = true;
  await until(() => setup.snapshot().phase === 'success' && setup.snapshot().currentId === 20, () => setup.snapshot());
  await setup.pause(); assert.deepEqual(store.servoRecords('uno-q-test').filter(r => r.state === 'verified').map(r => r.id), [14, 20]);
  runtime.servos = new Map([[1, { raw_pos: 392, center_pos: 2047, kp: 32, kd: 40 }]]);
  await setup.start(); await until(() => setup.snapshot().phase === 'success' && setup.snapshot().currentId === 11); await setup.pause();
}
test('queued target survives current operation then returns to default order', async t => queued(t, 'working'));
test('next target can be queued while waiting to swap servos', async t => queued(t, 'waiting'));
test('queued target survives interrupted current servo read-first recovery', async t => queued(t, 'working', true));
test('selecting another target never renumbers an assigned servo', async t => {
  const { setup, runtime, store } = await fixture(t, [10]); record(store, 10); await assert.rejects(setup.configureOnce(14), /已编号/); assert.deepEqual(runtime.writes(), []);
});
test('target with history is never reused for fresh servo', async t => {
  const { setup, runtime, store } = await fixture(t); record(store, 14); await assert.rejects(setup.configureOnce(14), /记录/); assert.deepEqual(runtime.writes(), []);
});
test('audit during write defers without retargeting current operation', async t => {
  const { setup, runtime } = await fixture(t); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let entered = false; runtime.before = async (_m, _p, body) => { if (body?.action === 'set_gains') { entered = true; await gate; } };
  await setup.start(14); await until(() => entered);
  try { const s = await setup.audit(10); assert.equal(s.currentId, 14); assert.equal(s.inspection?.status, 'deferred'); }
  finally { release(); await setup.pause(); }
});
test('raw float and boolean target IDs are rejected before runtime discovery', async t => {
  const { setup, runtime } = await fixture(t); const raw = parseWireJson('{"id":10.0}') as Body;
  for (const id of [true, '10', readJsonField(raw, 'id'), 99]) await assert.rejects(setup.start(id), SetupError);
  assert.deepEqual(runtime.calls, []);
});
test('observer yields to timers and other bus users between scan probes', async t => {
  const { setup, runtime, io } = await fixture(t); let checkedAtTimer = -1, busRanAt = -1;
  const observing = setup.observeOnce(true);
  await delay(0); checkedAtTimer = setup.snapshot().scan.checked;
  await io.run(async () => { busRanAt = setup.snapshot().scan.checked; }); await observing;
  assert.ok(checkedAtTimer < 254); assert.ok(busRanAt < 254); assert.ok(runtime.actions.length >= 254);
});
test('pause awaits an in-flight probe and prevents all later servo writes', async t => {
  const { setup, runtime } = await fixture(t); let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; }); let entered = false;
  runtime.before = async (_m, _p, b) => { if (!entered && b?.action === 'ping') { entered = true; await gate; } };
  await setup.start(14); await until(() => entered); let settled = false; const paused = setup.pause().then(() => { settled = true; });
  await immediate(); assert.equal(settled, false); release(); await paused; assert.equal(setup.running, false); assert.deepEqual(runtime.writes(), []); assert.equal(setup.snapshot().phase, 'paused');
});
test('concurrent starts reserve one worker and do not retarget active operation', async t => {
  const { setup, runtime } = await fixture(t); await Promise.all([setup.start(14), setup.start(20)]);
  await until(() => setup.snapshot().phase === 'success'); await setup.pause(); assert.deepEqual([...runtime.servos.keys()], [14]); assert.equal(runtime.writes().filter(a => a === 'set_id').length, 1);
});
test('stopBackground awaits observer permanently, keeps forward, and close owns final runtime cleanup', async t => {
  const { setup, runtime } = await fixture(t); await setup.refresh(); await setup.stopBackground(); const count = runtime.calls.length;
  await setup.inspect(); await setup.refresh(); await immediate(); assert.equal(runtime.calls.length, count); assert.equal(runtime.closeCalls, 0); assert.equal(runtime.port, 49152); assert.equal(setup.running, false);
  await Promise.all([setup.close(), setup.close()]); assert.equal(runtime.closeCalls, 1); assert.equal(runtime.haltCalls, 0); assert.deepEqual(runtime.writes(), []);
});
test('snapshot is isolated and historical evidence retains exact JSON integers', async t => {
  const { setup, store } = await fixture(t, [10]); const old = { ...record(store, 10), evidence: 9007199254740993n }; store.saveServoRecord('uno-q-test', old);
  const before = setup.snapshot(); before.records[0]!.state = 'tampered'; before.telemetry.ids.push(99);
  assert.equal(setup.snapshot().records[0]?.state, 'verified'); assert.equal(setup.snapshot().records[0]?.evidence, 9007199254740993n); assert.deepEqual(setup.snapshot().telemetry.ids, []);
});
test('lookalike HTML input tags cannot authorize a runtime profile', async t => {
  const { setup, runtime } = await fixture(t); runtime.html = '<input-other id="kp" value="5"><input-other id="kd" value="10">';
  await assert.rejects(setup.configureOnce(), /配置档/); assert.deepEqual(runtime.writes(), []);
});
test('non-string runtime mode cannot be coerced into an unloaded mode', async t => {
  const { setup, runtime } = await fixture(t); runtime.status.mode = ['off'];
  await assert.rejects(setup.configureOnce(), /卸载/); assert.deepEqual(runtime.writes(), []);
});
test('halt waits for the current observation and prevents rediscovery during its shutdown window', async t => {
  let now = Date.now(); const { setup, runtime } = await fixture(t, [1], { now: () => now });
  let entered = false, release!: () => void, connectsAfterHalt = 0; const gate = new Promise<void>(resolve => { release = resolve; });
  runtime.onConnect = () => { if (runtime.haltCalls) connectsAfterHalt++; };
  runtime.before = async (_m, _p, b) => { if (!entered && setup.snapshot().phase === 'success' && b?.action === 'ping') { entered = true; await gate; } };
  await setup.start(14); await until(() => entered); const halting = setup.halt(); release(); await halting;
  for (let i = 0; i < 10; i++) await immediate();
  assert.equal(runtime.haltCalls, 1); assert.equal(connectsAfterHalt, 0); assert.equal(setup.snapshot().phase, 'shutdown'); assert.equal(setup.snapshot().running, true);
  now += 15001; await setup.pause();
});
