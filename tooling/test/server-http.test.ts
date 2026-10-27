import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { Invalid } from '@letsduck/domain';
import { ExportBusy } from '@letsduck/exporter';
import { ServerStore } from '@letsduck/storage';
import { createServerHttp } from '../../packages/host/src/server-http.js';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'duck-server-http-'));
  await mkdir(join(root, 'gallery')); await writeFile(join(root, 'index.html'), '<h1>studio</h1>'); await writeFile(join(root, 'gallery/index.html'), '<h1>gallery</h1>');
  const store = await ServerStore.open({ database: ':memory:' });
  const app = createServerHttp({ store, assets: root, frontend: root, quiet: true });
  return { root, store, app, async close() { await app.waitRequests(); await app.close(); await store.close(); await rm(root, { recursive: true, force: true }); } };
}

test('server health checks the database, site stays server, hardware routes stay absent', async () => {
  const f = await fixture();
  try {
    const health = await f.app.inject('/api/health'); assert.equal(health.statusCode, 200); assert.deepEqual(health.json(), { version: '3.1.0', export: false, source_sha256: null });
    assert.equal(health.headers['cache-control'], 'no-store'); assert.equal(health.headers['x-content-type-options'], 'nosniff');
    assert.deepEqual((await f.app.inject('/api/site')).json(), { publicUrl: '', edition: 'server' });
    for (const path of ['/api/duck-debug/status', '/api/servo-setup', '/api/servo-preparation']) assert.equal((await f.app.inject(path)).statusCode, 404);
  } finally { await f.close(); }
});

test('server supports studio and gallery static entries without personal redirects', async () => {
  const f = await fixture();
  try {
    assert.match((await f.app.inject('/')).body, /studio/);
    const gallery = await f.app.inject('/gallery/'); assert.equal(gallery.statusCode, 200); assert.match(gallery.body, /gallery/);
    const directory = await f.app.inject('/gallery'); assert.equal(directory.statusCode, 307); assert.match(String(directory.headers.location), /\/gallery\/$/);
    assert.equal((await f.app.inject('/assets/source.3mf')).statusCode, 404);
    assert.equal((await f.app.inject({ method: 'POST', url: '/' })).statusCode, 404);
  } finally { await f.close(); }
});

test('server method, slash and body precedence preserves FastAPI behavior', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.app.inject({ method: 'HEAD', url: '/api/health' })).statusCode, 404);
    const slash = await f.app.inject('/api/health/?x=1'); assert.equal(slash.statusCode, 404);
    assert.equal((await f.app.inject({ method: 'POST', url: '/api/plan', headers: { 'content-type': 'application/json' }, payload: '{' })).statusCode, 400);
    const absent = await f.app.inject({ method: 'POST', url: '/api/plan', headers: { 'content-type': 'application/json' }, payload: '{}' }); assert.equal(absent.statusCode, 422); assert.equal(absent.json().code, 'validation.31');
    const media = await f.app.inject({ method: 'POST', url: '/api/plan', headers: { 'content-type': 'application/json ; charset=utf-8' }, payload: '{}' }); assert.equal(media.statusCode, 415);
    assert.equal((await f.app.inject({ method: 'POST', url: '/api/auth/logout', headers: { 'content-type': 'text/plain' }, payload: 'bad' })).statusCode, 401);
  } finally { await f.close(); }
});

test('server preflight stays before bounded admission, plan stays outside queue', async () => {
  const f = await fixture(); let admitted = 0;
  const app = createServerHttp({ store: f.store, assets: f.root, quiet: true, exporter: {
    available: true, catalog: { products: [] }, sourceSha256: 'fixture',
    plan(body) { if (body && typeof body === 'object' && 'bad' in body) throw new Invalid('bad source', 'export.20'); return { fixture: true }; },
    async run() { admitted++; throw new ExportBusy(); },
  } });
  try {
    const invalid = await app.inject({ method: 'POST', url: '/api/export', headers: { 'content-type': 'application/json' }, payload: '{"bad":true}' }); assert.equal(invalid.statusCode, 422); assert.equal(admitted, 0);
    const busy = await app.inject({ method: 'POST', url: '/api/export', headers: { 'content-type': 'application/json' }, payload: '{}' }); assert.equal(busy.statusCode, 503); assert.equal(busy.headers['retry-after'], '2'); assert.equal(admitted, 1);
    assert.equal((await app.inject({ method: 'POST', url: '/api/plan', headers: { 'content-type': 'application/json' }, payload: '{}' })).statusCode, 200); assert.equal(admitted, 1);
  } finally { await app.waitRequests(); await app.close(); await f.close(); }
});

test('server reads chunked JSON and caps actual stream size even without Content-Length', async () => {
  const f = await fixture();
  await f.app.listen({ host: '127.0.0.1', port: 0 }); const address = f.app.server.address(); assert.ok(address && typeof address !== 'string');
  const send = (chunks: string[]) => new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port: address.port, path: '/api/auth/register', method: 'POST', headers: { 'content-type': 'application/json', 'transfer-encoding': 'chunked' } }, res => { let body = ''; res.setEncoding('utf8'); res.on('data', bytes => { body += bytes; }); res.on('end', () => resolve({ status: res.statusCode!, body })); });
    req.on('error', reject); for (const chunk of chunks) req.write(chunk); req.end();
  });
  try {
    const valid = await send(['{"name":"chunked-user",', '"password":"password-123"}']); assert.equal(valid.status, 200); assert.ok(JSON.parse(valid.body).token);
    const huge = await send(['{"name":"', 'x'.repeat(8_000_000), '"}']); assert.equal(huge.status, 413); assert.equal(JSON.parse(huge.body).code, 'request.too_large');
  } finally { await f.close(); }
});

test('server concurrency control rejects overload without starting another database request', async () => {
  const f = await fixture(), session = await f.store.register('admission-user', 'password-123');
  const app = createServerHttp({ store: f.store, assets: f.root, httpLimit: 2, quiet: true });
  let enter!: () => void, release!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
  const original = f.store.schemes.bind(f.store); let calls = 0;
  f.store.schemes = async id => { calls++; enter(); await gate; return original(id); };
  await app.listen({ host: '127.0.0.1', port: 0 }); const address = app.server.address(); assert.ok(address && typeof address !== 'string');
  const send = () => new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = httpRequest({ host: '127.0.0.1', port: address.port, path: '/api/schemes', agent: false, headers: { authorization: 'Bearer ' + session.token } }, res => { let body = ''; res.setEncoding('utf8'); res.on('data', part => { body += part; }); res.on('end', () => resolve({ status: res.statusCode!, body })); }); req.on('error', reject); req.end();
  });
  try {
    const accepted = send(); await entered;
    const busy = await send(); assert.equal(busy.status, 503); assert.equal(busy.body, 'Service Unavailable'); assert.equal(calls, 1);
    release(); const finished = await accepted; assert.equal(finished.status, 200); assert.equal(finished.body, '[]');
  } finally { release(); await app.waitRequests(); await app.close(); await f.close(); }
});

test('multipart HEAD calculates its length without allocating the selected file contents', async () => {
  const f = await fixture();
  try {
    const { open } = await import('node:fs/promises'); const file = await open(join(f.root, 'video.mp4'), 'w');
    try { await file.truncate(64 * 1024 * 1024); } finally { await file.close(); }
    const before = process.memoryUsage().arrayBuffers;
    const response = await f.app.inject({ method: 'HEAD', url: '/video.mp4', headers: { range: 'bytes=0-33554431,33554433-' } });
    const allocated = process.memoryUsage().arrayBuffers - before;
    assert.equal(response.statusCode, 206); assert.equal(response.body, ''); assert.equal(Number(response.headers['content-length']), 67109102);
    assert.ok(allocated < 8 * 1024 * 1024, 'HEAD should not allocate selected payload bytes: ' + allocated);
  } finally { await f.close(); }
});
