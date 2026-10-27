import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { ExportManager } from '@letsduck/exporter';
import type { DuckRuntime } from '@letsduck/devices';
import { writeSyntheticAssets } from './synthetic-assets.js';

function fakeRuntime(onStatus?: () => Promise<unknown>) {
  const calls: string[] = [];
  const runtime: DuckRuntime = {
    serial: null, port: null,
    async connect() { calls.push('connect'); runtime.serial = 'fixture-board'; return runtime.serial; },
    async request(method, path) { calls.push(method + ' ' + path); return onStatus ? onStatus() : { feedback: { age_ms: 0 }, imu_ok: false, enabled: false, mode: 'shadow', active_servo_ids: [] }; },
    async halt() { calls.push('halt'); }, async close() { calls.push('close'); runtime.port = null; },
  };
  return { runtime, calls };
}

test('validated worker metadata reaches the host without a second archive reader', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-worker-metadata-'));
  writeSyntheticAssets(root); const manager = new ExportManager({ assets: root });
  try {
    await manager.ready; assert.equal(manager.available, true);
    const model: unknown = JSON.parse(await readFile(join(root, 'model.json'), 'utf8'));
    assert.ok(model && typeof model === 'object' && 'source_sha256' in model);
    assert.equal(manager.metadata?.sourceSha256, model.source_sha256);
    assert.equal(manager.metadata?.partIds.length, 35);
    assert.ok(manager.metadata?.catalog.products.length);
  } finally { await manager.close(); await rm(root, { recursive: true, force: true }); }
});

test('Cordis host supports missing assets and closes without device discovery', async () => {
  const { startHost } = await import('../../packages/host/src/application.js');
  const root = await mkdtemp(join(tmpdir(), 'duck-host-missing-')), fake = fakeRuntime();
  const host = await startHost({ assets: join(root, 'missing'), frontend: root, database: join(root, 'personal.db'), runtime: fake.runtime, port: 0 });
  try {
    assert.deepEqual(fake.calls, []);
    const health = await fetch(host.url + 'api/health').then(response => response.json());
    assert.deepEqual(health, { version: '3.1.0', export: false, source_sha256: null });
    assert.deepEqual(await fetch(host.url + 'api/schemes').then(response => response.json()), []);
  } finally { await host.close(); await rm(root, { recursive: true, force: true }); }
  assert.deepEqual(fake.calls, ['close']);
});

test('host close drains an accepted device read before closing its forward and database', async () => {
  const { startHost } = await import('../../packages/host/src/application.js');
  const root = await mkdtemp(join(tmpdir(), 'duck-host-close-'));
  let entered!: () => void, release!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  const fake = fakeRuntime(async () => { entered(); await gate; return { feedback: { age_ms: 0 }, imu_ok: false, enabled: false, mode: 'shadow', active_servo_ids: [] }; });
  const host = await startHost({ assets: join(root, 'missing'), frontend: root, database: join(root, 'personal.db'), runtime: fake.runtime, port: 0 });
  try {
    const pending = fetch(host.url + 'api/duck-debug/status'); await started;
    const stopped = host.close(); assert.equal(host.close(), stopped);
    await new Promise<void>(resolve => setImmediate(resolve)); assert.equal(fake.calls.includes('close'), false);
    release(); const response = await pending; assert.equal(response.status, 200); await response.json();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { assert.equal(await Promise.race([stopped.then(() => true), new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), 1000); })]), true, 'accepted response must not retain a keep-alive socket during shutdown'); }
    finally { clearTimeout(timer); }
    assert.equal(fake.calls.filter(call => call === 'close').length, 1);
    assert.equal(fake.calls.includes('halt'), false);
    await assert.rejects(fetch(host.url + 'api/health'));
  } finally { release(); host.http.server.closeAllConnections(); await host.close(); await rm(root, { recursive: true, force: true }); }
});

test('host retries the next port and unwinds resources when every bind fails', async () => {
  const { startHost } = await import('../../packages/host/src/application.js');
  const root = await mkdtemp(join(tmpdir(), 'duck-host-bind-')), occupied = createServer();
  occupied.listen(0, '127.0.0.1'); await once(occupied, 'listening');
  const address = occupied.address(); assert.ok(address && typeof address !== 'string');
  const failed = fakeRuntime();
  try {
    await assert.rejects(startHost({ assets: join(root, 'missing'), frontend: root, database: join(root, 'failure.db'), runtime: failed.runtime, port: address.port, search: 1 }), /EADDRINUSE/);
    assert.deepEqual(failed.calls, ['close']);
    const next = fakeRuntime(), host = await startHost({ assets: join(root, 'missing'), frontend: root, database: join(root, 'next.db'), runtime: next.runtime, port: address.port, search: 20 });
    try { assert.ok(new URL(host.url).port !== String(address.port)); assert.equal((await fetch(host.url + 'api/site')).status, 200); }
    finally { await host.close(); }
    assert.deepEqual(next.calls, ['close']);
  } finally { await new Promise<void>((resolve, reject) => occupied.close(error => error ? reject(error) : resolve())); await rm(root, { recursive: true, force: true }); }
});
