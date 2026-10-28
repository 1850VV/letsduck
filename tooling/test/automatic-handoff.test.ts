import assert from 'node:assert/strict';
import test from 'node:test';
import type { TestContext } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setImmediate as immediate, setTimeout as delay } from 'node:timers/promises';
import { PersonalStore } from '@letsduck/storage';
import { DuckDebug } from '../../packages/devices/src/duck-debug.js';
import { ServoSetup } from '../../packages/devices/src/servo-setup.js';
import { Cancelled } from '../../packages/devices/src/errors.js';
import { createPersonalHttp } from '../../packages/host/src/http.js';
import { Firmware } from './duck-debug-fixture.js';

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), 'duck-automatic-handoff-'));
  const store = new PersonalStore({ path: join(directory, 'personal.db'), partIds: [] });
  const runtime = new Firmware([12]);
  const setup = new ServoSetup(store, runtime, { timing: { sleep: async (ms, signal) => {
    try { await delay(Math.min(ms, 2), undefined, signal ? { signal } : undefined); }
    catch (error) { if (signal?.aborted) throw new Cancelled('paused'); throw error; }
  } } });
  const debug = new DuckDebug(store, setup);
  const app = createPersonalHttp({ frontend: directory, assets: directory, store, setup, debug, exporter: null });
  await app.ready();
  t.after(async () => { await app.close(); await debug.close(); await setup.close(); store.close(); await rm(directory, { recursive: true, force: true }); });
  const post = (url: string, payload: Record<string, unknown> = {}) => app.inject({ method: 'POST', url, payload });
  return { app, store, runtime, setup, debug, post };
}

test('automatic state reads never begin discovery, claim ownership, or write hardware', async t => {
  const { app, runtime, setup, debug } = await fixture(t);
  for (const method of ['GET', 'HEAD'] as const) {
    const result = await app.inject({ method, url: '/api/servo-setup/state' });
    assert.equal(result.statusCode, 200);
    if (method === 'GET') { assert.equal(result.json().phase, 'idle'); assert.equal(result.json().profile, null); }
    assert.equal(result.headers['cache-control'], 'no-store');
  }
  await immediate();
  assert.deepEqual(runtime.calls, []); assert.equal(setup.running, false); assert.equal(debug.owned, false);
  assert.equal((await app.inject({ url: '/api/servo-setup/state', remoteAddress: '192.168.1.9' })).statusCode, 403);
  assert.deepEqual(runtime.calls, []);
});

test('policy to automatic handoff unloads before writes and returns current gains to manual', async t => {
  const { app, runtime, setup, debug, post } = await fixture(t);
  assert.equal((await post('/api/duck-debug/action', { action: 'read', id: 12 })).statusCode, 200);
  assert.equal((await debug.status()).devices.find(device => device.id === 12)?.kd, 12);
  assert.equal((await post('/api/duck-debug/action', { action: 'mode', mode: 'policy' })).statusCode, 200);
  assert.equal((await post('/api/duck-debug/action', { action: 'release' })).statusCode, 200);
  const started = await post('/api/servo-setup/start', { targetId: 12 });
  assert.equal(started.statusCode, 200);
  const deadline = Date.now() + 5000;
  while (setup.snapshot().phase !== 'success' && Date.now() < deadline) await immediate();
  assert.equal(setup.snapshot().phase, 'success', JSON.stringify(setup.snapshot()));
  assert.equal((await post('/api/servo-setup/pause')).statusCode, 200);
  const returned = (await app.inject('/api/duck-debug/status')).json();
  const device = returned.devices.find((entry: { id: number }) => entry.id === 12);
  assert.equal(device.kd, 10, 'manual must not prefer the old KD12 readback after automatic KD10 write');
  assert.equal(device.parametersLive, false, 'saved automatic proof is history until a new manual read');
  assert.equal(debug.owned, false); assert.equal(setup.running, false);
  const modeOff = runtime.calls.findIndex(call => call.path === '/api/mode' && call.body?.mode === 'off');
  const gains = runtime.calls.findIndex(call => call.body?.action === 'set_gains');
  assert.ok(modeOff >= 0 && gains > modeOff, 'mode off must finish before automatic gain writes');
  const writes = runtime.calls.filter(call => ['reset_mid', 'set_gains', 'set_id'].includes(String(call.body?.action)));
  await delay(10);
  assert.deepEqual(runtime.calls.filter(call => ['reset_mid', 'set_gains', 'set_id'].includes(String(call.body?.action))), writes);
  assert.equal(runtime.halted, 0); assert.equal(runtime.closed, 0);
});
