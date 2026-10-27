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

test('shutdown drains both accepted pipelined requests before closing SQLite', async () => {
  const { startHost } = await import('../../packages/host/src/application.js');
  const { createConnection } = await import('node:net');
  const root = await mkdtemp(join(tmpdir(), 'duck-host-pipeline-'));
  let first!: () => void, second!: () => void, releaseFirst!: () => void, releaseSecond!: () => void, calls = 0;
  const enteredFirst = new Promise<void>(resolve => { first = resolve; }), enteredSecond = new Promise<void>(resolve => { second = resolve; });
  const firstGate = new Promise<void>(resolve => { releaseFirst = resolve; }), secondGate = new Promise<void>(resolve => { releaseSecond = resolve; });
  const fake = fakeRuntime(async () => { if (calls++ === 0) { first(); await firstGate; } else { second(); await secondGate; } return { feedback_age_ms: 0, mode: 'shadow', enabled: false, servo_ids: [] }; });
  const host = await startHost({ assets: join(root, 'missing'), frontend: root, database: join(root, 'personal.db'), runtime: fake.runtime, port: 0 });
  const socket = createConnection({ host: '127.0.0.1', port: Number(new URL(host.url).port) });
  let raw = ''; socket.on('data', data => { raw += data; }); socket.on('error', () => {});
  const ended = once(socket, 'close');
  try {
    await once(socket, 'connect');
    socket.write('GET /api/duck-debug/status HTTP/1.1\r\nHost: localhost\r\n\r\nGET /api/duck-debug/status HTTP/1.1\r\nHost: localhost\r\n\r\n');
    await enteredFirst; await new Promise(resolve => setTimeout(resolve, 20));
    let closed = false; const closing = host.close().then(() => { closed = true; });
    releaseFirst(); await enteredSecond; await new Promise(resolve => setTimeout(resolve, 40));
    assert.equal(closed, false); assert.equal(fake.calls.includes('close'), false);
    releaseSecond(); await closing; await ended;
    assert.equal((raw.match(/HTTP\/1\.1 200/g) ?? []).length, 2, raw);
    assert.equal(fake.calls.filter(call => call === 'close').length, 1);
  } finally { releaseFirst(); releaseSecond(); socket.destroy(); host.http.server.closeAllConnections(); await host.close(); await rm(root, { recursive: true, force: true }); }
});

test('client disconnect does not close the database before its accepted handler settles', async () => {
  const { startHost } = await import('../../packages/host/src/application.js');
  const { createConnection } = await import('node:net');
  const root = await mkdtemp(join(tmpdir(), 'duck-host-abort-'));
  let entered!: () => void, release!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
  const fake = fakeRuntime(async () => { entered(); await gate; return { feedback_age_ms: 0, mode: 'shadow', enabled: false, servo_ids: [] }; });
  const host = await startHost({ assets: join(root, 'missing'), frontend: root, database: join(root, 'personal.db'), runtime: fake.runtime, port: 0 });
  const socket = createConnection({ host: '127.0.0.1', port: Number(new URL(host.url).port) }); socket.on('error', () => {});
  try {
    await once(socket, 'connect'); socket.write('GET /api/duck-debug/status HTTP/1.1\r\nHost: localhost\r\n\r\n'); await started;
    socket.destroy(); let closed = false; const closing = host.close().then(() => { closed = true; });
    await new Promise(resolve => setTimeout(resolve, 30)); assert.equal(closed, false); assert.equal(fake.calls.includes('close'), false);
    release(); await closing; assert.equal(fake.calls.filter(call => call === 'close').length, 1);
  } finally { release(); socket.destroy(); host.http.server.closeAllConnections(); await host.close(); await rm(root, { recursive: true, force: true }); }
});

test('real HTTP JSON plan and multipart export keep the body stream alive through the worker', async () => {
  const { startHost } = await import('../../packages/host/src/application.js');
  const { PNG } = await import('pngjs'), { THUMBNAILS, ZipArchive } = await import('@letsduck/exporter');
  const root = await mkdtemp(join(tmpdir(), 'duck-host-post-'));
  writeSyntheticAssets(root);
  const model = JSON.parse(await readFile(join(root, 'model.json'), 'utf8')) as { source_sha256: string; parts: { id: string; material: string; color: string }[] };
  const catalog = JSON.parse(await readFile(join(root, 'catalog.json'), 'utf8')) as { products: { id: string; series: string; hex: string }[] };
  const payload = { name: 'HTTP fixture', source_sha256: model.source_sha256, assignments: Object.fromEntries(model.parts.map(part => [part.id, catalog.products.find(product => product.series === part.material && product.hex === part.color)!.id])) };
  const host = await startHost({ assets: root, frontend: root, database: join(root, 'personal.db'), runtime: fakeRuntime().runtime, port: 0 });
  try {
    const plan = await fetch(host.url + 'api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    assert.equal(plan.status, 200, await plan.clone().text());
    assert.equal((await plan.json() as { source_sha256: string }).source_sha256, model.source_sha256);
    const form = new FormData(); form.set('plan', JSON.stringify(payload));
    const image = PNG.sync.write(new PNG({ width: 512, height: 512 }));
    for (const name of THUMBNAILS) form.set(name, new Blob([new Uint8Array(image)], { type: 'image/png' }), name + '.png');
    const response = await fetch(host.url + 'api/export', { method: 'POST', body: form });
    assert.equal(response.status, 200, await response.clone().text()); assert.equal(response.headers.get('content-type'), 'model/3mf');
    const content = Buffer.from(await response.arrayBuffer()), archive = new ZipArchive(content);
    assert.ok(archive.read('Metadata/project_settings.config').length);
  } finally { await host.close(); await rm(root, { recursive: true, force: true }); }
});
