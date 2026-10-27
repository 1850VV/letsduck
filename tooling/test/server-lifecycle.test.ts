import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, connect } from 'node:net';
import { ServerStore } from '@letsduck/storage';
import { once } from 'node:events';
import { startServer } from '../../packages/host/src/server-application.js';
import type { SourceModel } from '@letsduck/contracts';
import { PNG } from 'pngjs';
import { ZipArchive } from '@letsduck/exporter';
import { writeSyntheticAssets } from './synthetic-assets.js';

test('server Cordis lifecycle starts missing assets, serves DB health and closes idempotently', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-server-lifecycle-'));
  const server = await startServer({ assets: join(root, 'missing'), database: join(root, 'server.db'), port: 0, quiet: true });
  try {
    assert.deepEqual(await fetch(server.url + 'api/health').then(r => r.json()), { version: '3.1.0', export: false, source_sha256: null });
    assert.deepEqual(await fetch(server.url + 'api/site').then(r => r.json()), { publicUrl: '', edition: 'server' });
    const registration = await fetch(server.url + 'api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":"lifecycle","password":"password-123"}' }); assert.equal(registration.status, 200); await registration.json();
    const stopped = server.close(); assert.equal(server.close(), stopped); await stopped;
    await assert.rejects(fetch(server.url + 'api/health'));
  } finally { await server.close(); await rm(root, { recursive: true, force: true }); }
});

test('server gets validated planning metadata without another archive and can plan/export', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-server-planner-')); writeSyntheticAssets(root); const model = JSON.parse(await readFile(join(root, 'model.json'), 'utf8')) as SourceModel;
  const server = await startServer({ assets: root, database: join(root, 'server.db'), port: 0, quiet: true });
  try {
    const health = await fetch(server.url + 'api/health').then(r => r.json()); assert.equal(health.export, true); assert.equal(health.source_sha256, model.source_sha256);
    const payload = { source_sha256: model.source_sha256, assignments: Object.fromEntries(model.parts.map(part => [part.id, part.material.startsWith('TPU') ? 'bambu-GFU03-51103' : 'bambu-GFA00-10100'])), name: 'server fixture' };
    const planned = await fetch(server.url + 'api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }); assert.equal(planned.status, 200); assert.equal((await planned.json()).name, 'server fixture');
    const image = PNG.sync.write(new PNG({ width: 512, height: 512 }));
    const names = ['cover', ...Array.from({ length: 6 }, (_, index) => ['plate' + (index + 1), 'top' + (index + 1)]).flat()];
    const thumbnails = Object.fromEntries(names.map(name => [name, 'data:image/png;base64,' + image.toString('base64')]));
    const exported = await fetch(server.url + 'api/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, thumbnails }) }); assert.equal(exported.status, 200); assert.equal(exported.headers.get('content-type'), 'model/3mf');
    const jsonZip = new ZipArchive(Buffer.from(await exported.arrayBuffer())); assert.ok(jsonZip.read('3D/model.model').equals(new ZipArchive(await readFile(join(root, 'source.3mf'))).read('3D/model.model')));
    const form = new FormData(); form.set('plan', JSON.stringify(payload)); for (const name of names) form.set(name, new Blob([new Uint8Array(image)], { type: 'image/png' }), name + '.png');
    const multipart = await fetch(server.url + 'api/export', { method: 'POST', body: form }); assert.equal(multipart.status, 200); const multipartZip = new ZipArchive(Buffer.from(await multipart.arrayBuffer())); assert.deepEqual(multipartZip.read('3D/model.model'), jsonZip.read('3D/model.model'));
    assert.deepEqual([...multipartZip.entries.keys()].sort(),[...jsonZip.entries.keys()].sort());
    for(const name of jsonZip.entries.keys()){
      const a=jsonZip.read(name),b=multipartZip.read(name);
      if(name==='Metadata/duck_studio_materials.json'){const left=JSON.parse(a.toString()) as Record<string,unknown>,right=JSON.parse(b.toString()) as Record<string,unknown>;delete left.createdAt;delete right.createdAt;assert.deepEqual(left,right,name);}
      else assert.deepEqual(a,b,name);
    }


  } finally { await server.close(); await rm(root, { recursive: true, force: true }); }
});

test('occupied server port fails once and fully unwinds instead of trying another port', async () => {
  const blocker = createServer(); blocker.listen(0, '127.0.0.1'); await once(blocker, 'listening'); const address = blocker.address(); assert.ok(address && typeof address !== 'string');
  const root = await mkdtemp(join(tmpdir(), 'duck-server-port-'));
  try { await assert.rejects(startServer({ assets: root, database: join(root, 'server.db'), port: address.port, quiet: true }), { code: 'EADDRINUSE' }); }
  finally { await new Promise<void>(resolve => blocker.close(() => resolve())); await rm(root, { recursive: true, force: true }); }
});

test('server close flushes both accepted pipelined replies before closing storage', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-server-pipeline-'));
  const server = await startServer({ assets: root, database: join(root, 'server.db'), port: 0, quiet: true });
  const session = await fetch(server.url + 'api/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":"pipeline-user","password":"password-123"}' }).then(r => r.json());
  let entered = 0, release!: () => void, accepted!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }), both = new Promise<void>(resolve => { accepted = resolve; });
  const original = ServerStore.prototype.schemes;
  ServerStore.prototype.schemes = async function (id) { entered++; if (entered === 2) accepted(); await gate; return original.call(this, id); };
  const url = new URL(server.url), socket = connect({ host: '127.0.0.1', port: Number(url.port) });
  let raw = ''; socket.setEncoding('utf8'); socket.on('data', chunk => { raw += chunk; });
  try {
    await once(socket, 'connect');
    const message = 'GET /api/schemes HTTP/1.1\r\nHost: ' + url.host + '\r\nAuthorization: Bearer ' + session.token + '\r\nConnection: keep-alive\r\n\r\n';
    socket.write(message + message); await both;
    const stopped = server.close(); let done = false; void stopped.then(() => { done = true; });
    await new Promise<void>(resolve => setImmediate(resolve)); assert.equal(done, false);
    const closed = once(socket, 'close'); release(); await stopped; await closed;
    assert.equal((raw.match(/HTTP\/1.1 200 OK/g) ?? []).length, 2, raw);
  } finally { release(); socket.destroy(); ServerStore.prototype.schemes = original; await server.close(); await rm(root, { recursive: true, force: true }); }
});
