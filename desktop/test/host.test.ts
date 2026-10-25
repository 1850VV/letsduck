import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fixture, png } from './fixtures.js';
import { startHost } from '../dist/application.js';

test('Cordis host serves the existing API, files, video ranges and export formats', async () => {
  const f = fixture(); const host = await startHost({ assets: f.assets, frontend: f.frontend, db: join(f.root, 'personal.db'), assembly: ['video.mp4'], version: 'test' });
  const call = (path: string, init?: RequestInit) => fetch(host.url + path, init);
  try {
    assert.deepEqual(await (await call('/api/site')).json(), { publicUrl: '', edition: 'personal', assembly: true });
    assert.equal((await (await call('/api/health')).json()).export, true);
    assert.match(await (await call('/')).text(), /来做鸭/); assert.match(await (await call('/paint')).text(), /涂装/);
    assert.match((await call('/module.mjs')).headers.get('content-type')!, /javascript/);
    assert.equal((await call('/assets/source.3mf')).status, 404);
    const catalog = await call('/assets/catalog.json'); assert.equal((await call('/assets/catalog.json', { headers: { 'if-modified-since': catalog.headers.get('last-modified')! } })).status, 304);
    for (const [range, body] of [['bytes=2-4', '234'], ['bytes=-2', '89'], ['bytes=7-', '789']]) {
      const response = await call('/assemble/assets/video.mp4', { headers: { range: range! } }); assert.equal(response.status, 206); assert.equal(await response.text(), body);
    }
    assert.equal((await call('/assemble/assets/video.mp4', { headers: { range: 'bytes=20-' } })).status, 416);
    const design = { colors: Object.fromEntries(f.model.parts.map(p => [p.id, p.color])), assignments: f.payload.assignments };
    const saved = await call('/api/schemes/test', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '测试', design }) });
    assert.equal(saved.status, 200); assert.equal((await (await call('/api/schemes')).json()).length, 1);
    assert.equal((await call('/api/schemes/' + encodeURIComponent('测试_2'), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '测试', design }) })).status, 200);
    const rejected = await call('/api/schemes/test', { method: 'PUT', body: '{}' }); assert.equal(rejected.status, 415);
    const result = await call('/api/export', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f.payload) }); assert.equal(result.status, 200); assert.equal(result.headers.get('content-type'), 'model/3mf'); assert.ok((await result.arrayBuffer()).byteLength > 1000);
    const form = new FormData(); const { thumbnails, ...plan } = f.payload; form.set('plan', JSON.stringify(plan));
    for (const name of Object.keys(thumbnails)) form.set(name, new Blob([png()], { type: 'image/png' }), 'preview.png');
    const multipart = await call('/api/export', { method: 'POST', body: form }); assert.equal(multipart.status, 200); await multipart.arrayBuffer();
    form.append('plan', '{}'); assert.equal((await call('/api/export', { method: 'POST', body: form })).status, 400);
    assert.equal((await call('/api/account')).status, 404);
  } finally { await host.close(); rmSync(f.root, { recursive: true, force: true }); }
  await assert.rejects(() => fetch(host.url + '/api/site'));
});

test('a missing asset pack leaves schemes and the homepage available without claiming export readiness', async () => {
  const f = fixture(); rmSync(f.assets, { recursive: true });
  const host = await startHost({ assets: f.assets, frontend: f.frontend, db: ':memory:', assembly: ['video.mp4'], version: 'test' });
  try {
    assert.deepEqual(await (await fetch(host.url + '/api/health')).json(), { version: 'test', export: false, source_sha256: null });
    assert.equal((await fetch(host.url + '/')).status, 200);
    assert.equal((await fetch(host.url + '/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 422);
  } finally { await host.close(); rmSync(f.root, { recursive: true, force: true }); }
});
