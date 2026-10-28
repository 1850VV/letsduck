import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { PersonalStore } from '@letsduck/storage';
import { parseWireJson } from '@letsduck/domain';
import { DuckDebug } from '../../packages/devices/src/duck-debug.js';
import { IDS } from '../../packages/devices/src/shared.js';
import { DebugSetup, Firmware } from './duck-debug-fixture.js';

class GuideFirmware extends Firmware {
  active = false;
  target: number[] | null = null;
  session: string | null = null;
  guideVersion = 1;
  rawAge = 10;
  mask = 0x7fff;
  seq = 0;
  phase = 'holding';
  constructor() { super(IDS); this.state.guide_version = 1; }
  guide(): Record<string, unknown> {
    return { ok: true, supported: true, version: this.guideVersion, active: this.active, state: this.active ? this.phase : 'inactive',
      paused: true, session_id: this.session, ids: [...IDS], actual_raw: IDS.map(id => this.motors.get(id)!.pos), target_raw: this.target,
      raw_mask: this.mask, feedback_age_ms: this.state.feedback_age_ms, raw_age_ms: this.rawAge, imu_ok: this.state.imu_ok,
      sample_seq: 30, command_seq: this.seq, acknowledged_seq: this.seq, max_delta: 10, heartbeat_timeout_ms: 1000,
      raw_source: 'DQS1_angles_to_raw', arming: false, enabled: this.active || Boolean(this.state.enabled), error: '' };
  }
  override async request(method: 'GET' | 'POST', path: string, raw?: unknown): Promise<unknown> {
    if (!path.startsWith('/api/guide/')) return super.request(method, path, raw);
    const body = raw as Record<string, unknown> | undefined;
    this.calls.push({ method, path, body: body === undefined ? undefined : structuredClone(body) });
    if (method === 'GET') return parseWireJson(JSON.stringify(this.guide()));
    if (path === '/api/guide/hold') { this.active = true; this.session = 'guide-test-1'; this.state.mode = 'guide'; this.target = IDS.map(id => this.motors.get(id)!.pos); }
    else {
      if (!this.active || body?.session_id !== this.session) throw new Error('guide session expired');
      if (path === '/api/guide/step') for (const step of body.deltas as { id: number; delta: number }[]) this.target![IDS.indexOf(step.id)] = this.motors.get(step.id)!.pos + step.delta;
      if (path === '/api/guide/pause') this.target = IDS.map(id => this.motors.get(id)!.pos);
      if (path === '/api/guide/release') { this.active = false; this.session = null; this.target = null; this.state.mode = 'off'; }
    }
    this.seq++;
    return parseWireJson(JSON.stringify(this.guide()));
  }
}

function harness(t: { after(fn: () => Promise<void>): void }, rt: Firmware = new GuideFirmware(), clock?: () => number) {
  const directory = mkdtempSync(resolve(tmpdir(), 'duck-guide-'));
  const store = new PersonalStore({ path: resolve(directory, 'personal.db'), partIds: [] });
  const setup = new DebugSetup(rt), debug = new DuckDebug(store, setup, clock ? { monotonic: clock } : {});
  t.after(async () => { await debug.close(); store.close(); rmSync(directory, { recursive: true, force: true }); });
  return { rt, setup, debug, action: (action: string, fields: Record<string, unknown> = {}) => debug.action({ action, ...fields }) };
}
const postCalls = (rt: Firmware) => rt.calls.filter(call => call.method === 'POST');
const session = { session_id: 'guide-test-1' };

test('guide capability inspection is passive and unsupported runtimes never receive a write', async t => {
  const rt = new Firmware(), { action, setup } = harness(t, rt);
  const status = await action('guide-status'); assert.equal(status.supported, false);
  await assert.rejects(action('guide-hold'), /不支持|升级/);
  assert.equal(setup.paused, 0); assert.equal(postCalls(rt).length, 0);
});
test('guide hold captures measured all-joint raw positions without a home, jog or midpoint command', async t => {
  const rt = new GuideFirmware(), { action, setup } = harness(t, rt);
  const result = await action('guide-hold');
  assert.equal(result.active, true); assert.equal(result.session_id, 'guide-test-1'); assert.equal(result.board, 'test-board');
  assert.equal((result.actual_raw as number[])[2], 2212); assert.equal((result.target_raw as number[])[2], 2212);
  assert.equal(setup.paused, 1); assert.deepEqual(postCalls(rt).map(call => call.path), ['/api/guide/hold']);
});
test('stale, incomplete and invalid-IMU captures never enable guide hold', async t => {
  for (const change of [
    (rt: GuideFirmware) => { rt.state.feedback_age_ms = 150; },
    (rt: GuideFirmware) => { rt.rawAge = 150; },
    (rt: GuideFirmware) => { rt.mask = 0x3fff; },
    (rt: GuideFirmware) => { rt.state.imu_ok = false; },
    (rt: GuideFirmware) => { rt.guideVersion = 2; },
  ]) {
    const rt = new GuideFirmware(); change(rt); const { action } = harness(t, rt);
    await assert.rejects(action('guide-hold'), /反馈|IMU|版本|完整|不支持/); assert.equal(postCalls(rt).length, 0);
  }
});
test('invalid grouped deltas are rejected before any controller request', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold');
  for (const deltas of [[], [{ id: 12, delta: 11 }], [{ id: 12, delta: 0 }], [{ id: 12, delta: true }], [{ id: 12, delta: .5 }], [{ id: 99, delta: 1 }], [{ id: 34, delta: 1 }], [{ id: 12, delta: 1 }, { id: 12, delta: -1 }]]) {
    const before = rt.calls.length; await assert.rejects(action('guide-step', { ...session, deltas })); assert.equal(rt.calls.length, before);
  }
});
test('one group uses fresh actual raw and returns separate measured and commanded positions', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold'); rt.motors.get(12)!.pos = 2214;
  const result = await action('guide-step', { ...session, deltas: [{ id: 12, delta: 3 }, { id: 22, delta: -2 }] });
  assert.equal((result.actual_raw as number[])[2], 2214); assert.equal((result.target_raw as number[])[2], 2217);
  assert.equal((result.target_raw as number[])[7], 2220); assert.equal((result.target_raw as number[])[0], 2210);
  assert.deepEqual(postCalls(rt).at(-1), { method: 'POST', path: '/api/guide/step', body: { ...session, deltas: [{ id: 12, delta: 3 }, { id: 22, delta: -2 }] } });
});
test('encoder edges and fresh-feedback loss block grouped movement before a write', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold'); rt.motors.get(12)!.pos = 4095;
  let before = postCalls(rt).length; await assert.rejects(action('guide-step', { ...session, deltas: [{ id: 12, delta: 1 }] })); assert.equal(postCalls(rt).length, before);
  rt.motors.get(12)!.pos = 2212; rt.rawAge = 160; before = postCalls(rt).length;
  await assert.rejects(action('guide-step', { ...session, deltas: [{ id: 12, delta: -1 }] })); assert.equal(postCalls(rt).length, before);
});
test('pause holds latest measured raw rather than continuing to an unfinished target', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold');
  await action('guide-step', { ...session, deltas: [{ id: 12, delta: 5 }] }); rt.motors.get(12)!.pos = 2213;
  const result = await action('guide-pause', session); assert.equal((result.target_raw as number[])[2], 2213); assert.equal(result.active, true);
});
test('session and calibration exclusivity prevent delayed or persistent-zero writes during guide control', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold'); const before = postCalls(rt).length;
  for (const [name, fields] of [['guide-step', { session_id: 'old-session', deltas: [{ id: 12, delta: 1 }] }], ['guide-pause', {}], ['cal-enter', {}], ['cal-center', { id: 12 }], ['reset-mid', { id: 12 }], ['mode', { mode: 'hold' }]] as const) await assert.rejects(action(name, fields));
  assert.equal(postCalls(rt).length, before);
});
test('active calibration cannot be silently unloaded by guide hold', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('cal-enter'); const before = postCalls(rt).length;
  await assert.rejects(action('guide-hold'), /校准|退出/); assert.equal(postCalls(rt).length, before);
});
test('leaving guide releases its session and prevents a later old step', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold'); await action('leave');
  assert.deepEqual(postCalls(rt).at(-1), { method: 'POST', path: '/api/guide/release', body: session }); assert.equal(rt.active, false);
  const before = postCalls(rt).length; await assert.rejects(action('guide-step', { ...session, deltas: [{ id: 12, delta: 1 }] })); assert.equal(postCalls(rt).length, before);
});
test('heartbeat expiry cannot be renewed by a delayed movement request', async t => {
  let now = 0; const rt = new GuideFirmware(), { action } = harness(t, rt, () => now); await action('guide-hold'); now = 1001;
  const before = postCalls(rt).length; await assert.rejects(action('guide-step', { ...session, deltas: [{ id: 12, delta: 1 }] }));
  assert.equal(postCalls(rt).slice(before).some(call => call.path === '/api/guide/step'), false);
});
test('closing an owned guide releases it, while status-only close stays passive', async t => {
  const rt = new GuideFirmware(), { action, debug } = harness(t, rt); await action('guide-hold'); await debug.close(); assert.equal(rt.active, false);
  const observer = new GuideFirmware(), observed = harness(t, observer); await observed.action('guide-status'); await observed.debug.close(); assert.equal(postCalls(observer).length, 0);
});
test('a runtime-expired guide revokes local ownership during passive inspection', async t => {
  const rt = new GuideFirmware(), { action, debug } = harness(t, rt); await action('guide-hold');
  rt.active = false; rt.session = null; rt.state.mode = 'off'; const before = postCalls(rt).length;
  const result = await action('guide-status'); assert.equal(result.active, false); assert.equal(debug.owned, false);
  await assert.rejects(action('guide-step', { ...session, deltas: [{ id: 12, delta: 1 }] })); assert.equal(postCalls(rt).length, before);
});
test('release accepts an already-expired owned session without replaying an unload on another mode', async t => {
  const rt = new GuideFirmware(), { action, debug } = harness(t, rt); await action('guide-hold');
  rt.active = false; rt.session = null; rt.state.mode = 'off'; const before = postCalls(rt).length;
  const result = await action('guide-release', session); assert.equal(result.active, false); assert.equal(debug.owned, false);
  assert.equal(postCalls(rt).length, before);
});
test('leave after runtime heartbeat expiry cleans local ownership without replaying a stale session', async t => {
  const rt = new GuideFirmware(), { action, debug } = harness(t, rt); await action('guide-hold');
  rt.active = false; rt.session = null; rt.state.mode = 'off'; const before = postCalls(rt).length;
  await action('leave'); assert.equal(debug.owned, false); assert.equal(postCalls(rt).length, before);
});
test('guide hold refuses a running normal controller without silently switching its mode', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); rt.state.mode = 'hold'; rt.state.enabled = true;
  await assert.rejects(action('guide-hold'), /卸载|退出/); assert.equal(postCalls(rt).length, 0);
});
test('leaving while a hold waits to claim prevents that delayed hold from enabling motors', async t => {
  const rt = new GuideFirmware(), { action, setup } = harness(t, rt);
  let resume: (() => void) | undefined, entered: (() => void) | undefined;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  setup.pauseHook = () => new Promise<void>(resolve => { resume = resolve; entered!(); });
  const hold = action('guide-hold'); await waiting; await action('leave'); resume!();
  await assert.rejects(hold, /离开|取消/); assert.equal(postCalls(rt).length, 0);
});
test('a moving guide must pause or reach its target before accepting another group', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); await action('guide-hold'); rt.phase = 'moving'; const before = postCalls(rt).length;
  await assert.rejects(action('guide-step', { ...session, deltas: [{ id: 12, delta: 1 }] }), /暂停|尚未到达/); assert.equal(postCalls(rt).length, before);
});
test('an un-tokened repeated hold cannot replace the current session or enable again', async t => {
  const rt = new GuideFirmware(), { action, setup } = harness(t, rt); await action('guide-hold');
  await assert.rejects(action('guide-hold'), /已经.*保持/);
  assert.equal(setup.paused, 1); assert.deepEqual(postCalls(rt).map(call => call.path), ['/api/guide/hold']);
});
test('leaving while ARM confirmation is in flight releases the returned session before completing leave', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); const request = rt.request.bind(rt);
  let resume: (() => void) | undefined, entered: (() => void) | undefined;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  rt.request = async (method, path, body) => {
    const reply = await request(method, path, body);
    if (path === '/api/guide/hold') await new Promise<void>(resolve => { resume = resolve; entered!(); });
    return reply;
  };
  const holding = action('guide-hold'); await waiting; const leaving = action('leave'); resume!();
  await Promise.all([holding, leaving]); assert.equal(rt.active, false);
  assert.deepEqual(postCalls(rt).map(call => call.path), ['/api/guide/hold', '/api/guide/release']);
});
test('a calibration queued behind ARM cannot write midpoint mode after guide ownership is established', async t => {
  const rt = new GuideFirmware(), { action } = harness(t, rt); const request = rt.request.bind(rt);
  let resume: (() => void) | undefined, entered: (() => void) | undefined;
  const waiting = new Promise<void>(resolve => { entered = resolve; });
  rt.request = async (method, path, body) => {
    const reply = await request(method, path, body);
    if (path === '/api/guide/hold') await new Promise<void>(resolve => { resume = resolve; entered!(); });
    return reply;
  };
  const holding = action('guide-hold'); await waiting; const calibrating = action('cal-enter'); resume!();
  await holding; await assert.rejects(calibrating, /释放坐姿向导/);
  assert.deepEqual(postCalls(rt).map(call => call.path), ['/api/guide/hold']);
});
