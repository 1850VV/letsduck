import {personalMimeProfiles,isPersonalMimeProfile,personalMimeInput} from './fixtures/personal-http-mime.js';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {frozenOracle} from './fixtures/frozen-oracle.js';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile, readdir, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConnection } from 'node:net';
import { PersonalStore } from '@letsduck/storage';
import { DebugError, SetupError } from '@letsduck/devices';
import { ExportBusy } from '@letsduck/exporter';
import { JsonNumericValue } from '@letsduck/domain';
import type { HostExporter } from '../../packages/host/src/http-types.js';

import { createPersonalHttp as factory } from '../../packages/host/src/http.js';
async function fixture(options: { exporter?: HostExporter | null; uiOrigin?: string } = {}) {
  assert.equal(typeof factory, 'function', 'personal HTTP adapter is missing');
  const root = await mkdtemp(join(tmpdir(), 'duck-personal-http-'));
  const frontend = join(root, 'frontend'), assets = join(root, 'assets');
  await Promise.all([mkdir(join(frontend, 'assemble'), { recursive: true }), mkdir(join(frontend, 'empty'), { recursive: true }), mkdir(join(assets, 'assembly', 'horn-reference'), { recursive: true })]);
  await Promise.all(Object.entries({ 'home.html': 'HOME', 'index.html': 'PAINT', 'module.mjs': 'export{}', 'settings.conf': 'fixture', 'file.py': 'print(1)', 'page.HTM': 'PAGE', 'assemble/index.html': 'ASSEMBLE' }).map(([name, value]) => writeFile(join(frontend, name), value)));
  await Promise.all([writeFile(join(assets, 'model.json'), '{"sample":true}'), writeFile(join(assets, 'source.3mf'), 'PRIVATE'), writeFile(join(assets, 'assembly', 'clip.mp4'), '0123456789'), writeFile(join(assets, 'assembly', 'horn-reference/main.jpg'), 'JPEG')]);
  async function stableDates(path:string):Promise<void>{for(const entry of await readdir(path,{withFileTypes:true})){const file=join(path,entry.name);if(entry.isDirectory())await stableDates(file);else await utimes(file,1700000000,1700000000);}}
  await stableDates(frontend);await stableDates(assets);
  const store = new PersonalStore({ path: join(root, 'personal.db') });
  const observed: { action: string; input?: unknown }[] = [];
  let ready = false, debugFailure: Error | undefined, setupFailure: Error | undefined;
  const snapshot = { phase: 'idle', running: false, records: [], telemetry: {} };
  const setup = {
    inspect: () => { observed.push({ action: 'inspect' }); return snapshot; },
    start: (input: unknown) => { if (setupFailure) throw setupFailure; observed.push({ action: 'start', input }); return snapshot; },
    pause: () => { observed.push({ action: 'pause' }); return snapshot; },
    halt: () => { observed.push({ action: 'halt' }); return snapshot; },
    refresh: () => { observed.push({ action: 'refresh' }); return snapshot; },
    audit: (input: unknown) => { observed.push({ action: 'audit', input }); return snapshot; },
    repair: (input: unknown) => { observed.push({ action: 'repair', input }); return snapshot; },
    queue: (input: unknown) => { observed.push({ action: 'queue', input }); return snapshot; },
  };
  const debug = {
    numbering: () => ({ ready, verifiedIds: ready ? [10] : [], records: [] }),
    status: () => { observed.push({ action: 'status' }); return { connected: false, transport: 'usb', error: null, devices: [], numbering: { ready } }; },
    action: (input: Record<string, unknown>) => { if (debugFailure) throw debugFailure; observed.push({ action: 'debug', input }); return { ok: true, input }; },
  };
  const app = factory!({ frontend, assets, store, setup, debug, exporter: options.exporter ?? null, assemblyManifest: { files: { 'clip.mp4': {} }, optionalFiles: { 'horn-reference/main.jpg': {} } }, ...options });
  await app.ready();
  return { app, store, root, assets, observed, setReady: (value: boolean) => { ready = value; }, debugFailure: (value: Error) => { debugFailure = value; }, setupFailure: (value: Error) => { setupFailure = value; }, close: async () => { await app.close(); assert.equal(app.server.address(), null); store.close(); await rm(root, { recursive: true, force: true }); } };
}
const design = { colors: { part: '#ffffff' }, assignments: { part: null } };

test('personal HTTP keeps missing-assets health, raw scheme integers and API dispatch', async () => {
  const f = await fixture();
  try {
    assert.deepEqual((await f.app.inject('/api/health///?q=1')).json(), { version: '3.1.0', export: false, source_sha256: null });
    const saved = await f.app.inject({ method: 'PUT', url: '/api/schemes/personal-1', headers: { 'content-type': 'application/json' }, payload: '{"name":9007199254740993,"voiceSalt":9007199254740993,"design":{"colors":{"part":"#ffffff"},"assignments":{"part":null}}}' });
    assert.equal(saved.statusCode, 200); assert.match(saved.body, /"voiceSalt":9007199254740993/); assert.equal(saved.json().name, '9007199254740993');
    const listed = await f.app.inject('/api/schemes'); assert.match(listed.body, /9007199254740993/); assert.equal(listed.headers['cache-control'], 'no-store');
    const head = await f.app.inject({ method: 'HEAD', url: '/api/schemes' }); assert.equal(head.body, ''); assert.equal(head.headers['content-length'], listed.headers['content-length']);
    assert.deepEqual((await f.app.inject({ method: 'DELETE', url: '/api/schemes/personal-1' })).json(), { ok: true });
    for (const url of ['/api/me', '/api/schemes/a%20b', '/api/schemes/%E9%B8%AD']) {
      const result = await f.app.inject({ method: 'PUT', url, payload: 'broken', headers: { 'content-type': 'bad' } }); assert.equal(result.statusCode, 404); assert.equal(result.json().code, 'request.not_found');
    }
    const unknown = await f.app.inject({ method: 'POST', url: '/paint', payload: 'broken' }); assert.equal(unknown.statusCode, 404);
    for (const url of ['/api/plan', '/api/export']) { const result = await f.app.inject({ method: 'POST', url, payload: 'bad', headers: { 'content-type': 'text/plain' } }); assert.equal(result.statusCode, 422); assert.equal(result.json().code, 'validation.31'); }
    assert.equal((await f.app.inject('/api/catalog')).json().code, 'validation.29');
  } finally { await f.close(); }
});

test('JSON body failures preserve content type, object and size checks', async () => {
  const f = await fixture();
  try {
    const cases = [
      { type: 'Application/JSON', body: '{}', status: 415, code: 'request.content_type' },
      { type: 'application/json', body: '{oops', status: 400, code: 'request.json' },
      { type: 'application/json', body: '[]', status: 400, code: 'request.format' },
      { type: 'application/json', body: 'null', status: 400, code: 'request.format' },
      { type: 'application/json', body: ' '.repeat(8_000_001), status: 413, code: 'request.too_large' },
    ];
    for (const c of cases) { const result = await f.app.inject({ method: 'PUT', url: '/api/schemes/x', payload: c.body, headers: { 'content-type': c.type } }); assert.equal(result.statusCode, c.status); assert.equal(result.json().code, c.code); }
    const utf16 = Buffer.concat([Buffer.from([255, 254]), Buffer.from(JSON.stringify({ name: '中文', design }), 'utf16le')]);
    assert.equal((await f.app.inject({ method: 'PUT', url: '/api/schemes/utf', payload: utf16, headers: { 'content-type': ' application/json ; charset=utf-16' } })).statusCode, 200);
    const empty = await f.app.inject({ method: 'PUT', url: '/api/schemes/empty', headers: { 'content-type': 'application/json' } }); assert.equal(empty.statusCode, 422); assert.equal(empty.json().code, 'validation.4');
  } finally { await f.close(); }
});

test('device routes use socket peers, guard Origin before bodies, and preserve wire numeric types', async () => {
  const f = await fixture({ uiOrigin: 'duck://app' });
  try {
    for (const url of ['/api/duck-debug/status', '/api/duck-debug/unknown', '/api/servo-setup', '/api/servo-setup/unknown', '/api/servo-preparation']) {
      const reply = await f.app.inject({ url, remoteAddress: '192.168.10.20', headers: { 'x-forwarded-for': '127.0.0.1' } }); assert.equal(reply.statusCode, 403); assert.deepEqual(Object.keys(reply.json()), ['error']);
    }
    const remoteSite = await f.app.inject({ url: '/api/site', remoteAddress: '192.168.10.20' }); assert.equal(remoteSite.json().servoSetup, false);
    const site = await f.app.inject('/api/site'); assert.equal(site.json().servoSetup, true); assert.equal(site.json().assembly, true);
    for (const url of ['/api/duck-debug/action', '/api/servo-setup/start', '/api/servo-preparation']) {
      const denied = await f.app.inject({ method: 'POST', url, payload: 'bad', headers: { origin: 'http://evil.test', host: 'evil.test', 'content-type': 'bad' } }); assert.equal(denied.statusCode, 403); assert.deepEqual(Object.keys(denied.json()), ['error']);
    }
    const started = await f.app.inject({ method: 'POST', url: '/api/servo-setup/start', payload: '{"targetId":10.0}', headers: { origin: 'duck://app', 'content-type': 'application/json' } }); assert.equal(started.statusCode, 200);
    assert.ok(f.observed.find(row => row.action === 'start')?.input instanceof JsonNumericValue);
    const debug = await f.app.inject({ method: 'POST', url: '/api/duck-debug/action', payload: '{"action":"inspect","id":9007199254740993}', headers: { 'content-type': 'application/json' } }); assert.equal(debug.statusCode, 200); assert.match(debug.body, /9007199254740993/);
    for (const action of ['pause', 'halt', 'refresh', 'audit', 'repair', 'queue']) assert.equal((await f.app.inject({ method: 'POST', url: '/api/servo-setup/' + action, payload: '{"id":10}', headers: { 'content-type': 'application/json' } })).statusCode, 200);
    assert.equal((await f.app.inject('/api/servo-setup')).json().phase, 'idle'); assert.equal((await f.app.inject('/api/duck-debug/status')).json().connected, false);
    f.debugFailure(new DebugError('不允许', { reply: { reason: 'sample' }, completed: [10], remaining: [11] }));
    const failure = await f.app.inject({ method: 'POST', url: '/api/duck-debug/action', payload: '{}', headers: { 'content-type': 'application/json' } }); assert.deepEqual(failure.json(), { error: '不允许', reply: { reason: 'sample' }, completed: [10], remaining: [11] }); assert.equal(failure.statusCode, 422);
    f.setupFailure(new SetupError('请先扫描')); const setup = await f.app.inject({ method: 'POST', url: '/api/servo-setup/start', payload: '{}', headers: { 'content-type': 'application/json' } }); assert.deepEqual(setup.json(), { error: '请先扫描', code: 'request.invalid', params: {} });
  } finally { await f.close(); }
});

test('preparation persistence validates independently without touching device APIs', async () => {
  const f = await fixture();
  try {
    const result = await f.app.inject({ method: 'POST', url: '/api/servo-preparation', payload: { ids: [10], state: 'picked' } }); assert.equal(result.statusCode, 200); assert.equal(result.json().records[0].state, 'picked');
    assert.deepEqual((await f.app.inject('/api/servo-preparation')).json(), result.json());
    assert.deepEqual((await f.app.inject('/api/servo-setup/records')).json(), { records: [] }); assert.equal(f.observed.length, 0);
    const invalid = await f.app.inject({ method: 'POST', url: '/api/servo-preparation', payload: '{"ids":[10.0],"state":"installed"}', headers: { 'content-type': 'application/json' } }); assert.equal(invalid.statusCode, 422); assert.equal(invalid.json().code, 'request.invalid');
    assert.equal(f.store.servoPreparationRecords()[0]?.state, 'picked');
  } finally { await f.close(); }
});

test('static aliases, readiness gate, allowlists, directory and method errors match personal mode', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.app.inject('/?q=1')).body, 'HOME'); assert.equal((await f.app.inject('/paint')).body, 'PAINT'); assert.equal((await f.app.inject('/module.mjs')).headers['content-type'], 'text/javascript');
    const configuration = await f.app.inject('/settings.conf');
    assert.equal(configuration.statusCode, 200); assert.equal(configuration.body, 'fixture');
    // Exact .conf MIME comes from the platform; the Python HTTP differential checks it.
    assert.ok(configuration.headers['content-type']);
    for (const [path, kind] of [['/file.py', 'text/x-python'], ['/page.HTM', 'text/html']]) assert.equal((await f.app.inject(path!)).headers['content-type'], kind);
    for (const method of ['GET', 'HEAD'] as const) { const result = await f.app.inject({ method, url: '/paint/?q=1' }); assert.equal(result.statusCode, 308); assert.equal(result.headers.location, '/paint'); assert.equal(result.body, ''); }
    for (const url of ['/gallery', '/gallery/', '/gallery/a']) { const result = await f.app.inject(url); assert.equal(result.statusCode, 303); assert.equal(result.headers.location, '/'); }
    for (const url of ['/assemble', '/assemble/', '/assemble/index.html///']) { const result = await f.app.inject(url); assert.equal(result.statusCode, 303); assert.equal(result.headers.location, '/debug/?from=assemble'); }
    assert.equal((await f.app.inject('/assemble/assets/clip.mp4')).statusCode, 200);
    f.setReady(true); assert.equal((await f.app.inject('/assemble/')).body, 'ASSEMBLE'); const redirect = await f.app.inject('/assemble?q=1'); assert.equal(redirect.statusCode, 301); assert.equal(redirect.headers.location, '/assemble/?q=1');
    for (const url of ['/assets/source.3mf', '/assets/%6dodel.json', '/assemble/assets/%2e%2e%2fclip.mp4']) assert.equal((await f.app.inject(url)).json().code, 'request.asset_missing');
    if (process.platform !== 'win32') { await symlink('private-loop.bin', join(f.assets, 'private-loop.bin')); assert.equal((await f.app.inject('/assets/private-loop.bin')).statusCode, 404); }
    assert.equal((await f.app.inject('/assets/model.json')).statusCode, 200); assert.equal((await f.app.inject('/assemble/assets/horn-reference/main.jpg')).headers['content-type'], 'application/octet-stream');
    const directory = await f.app.inject('/empty/'); assert.equal(directory.statusCode, 404); assert.equal(directory.json().error, '文件不存在');
    const missing = await f.app.inject('/missing'); assert.equal(missing.statusCode, 404); assert.match(missing.body, /File not found/);
    const options = await f.app.inject({ method: 'OPTIONS', url: '/api/site' }); assert.equal(options.statusCode, 501); assert.match(options.body, /Unsupported method/); assert.equal(options.headers.connection, 'close');
    assert.equal(missing.headers['cache-control'], 'no-cache'); assert.equal(options.headers['cache-control'], 'no-store'); assert.equal(options.headers['x-content-type-options'], 'nosniff');
    await rm(join(f.assets, 'assembly', 'clip.mp4')); assert.equal((await f.app.inject('/api/site')).json().assembly, false);
  } finally { await f.close(); }
});

test('asset and frontend conditional caching retain their different semantics', async () => {
  const f = await fixture();
  try {
    const model = await f.app.inject('/assets/model.json'), stamp = String(model.headers['last-modified']);
    const cached = await f.app.inject({ url: '/assets/model.json', headers: { 'if-modified-since': stamp } }); assert.equal(cached.statusCode, 304); assert.equal(cached.headers['last-modified'], stamp); assert.equal(cached.headers['content-length'], undefined);
    assert.equal((await f.app.inject({ url: '/assets/model.json', headers: { 'if-modified-since': 'Wed, 01 Jan 2100 00:00:00 GMT' } })).statusCode, 200);
    const page = await f.app.inject('/paint'), pageStamp = String(page.headers['last-modified']);
    const pageCached = await f.app.inject({ url: '/paint', headers: { 'if-modified-since': pageStamp } }); assert.equal(pageCached.statusCode, 304); assert.equal(pageCached.headers['last-modified'], undefined);
    assert.equal((await f.app.inject({ url: '/paint', headers: { 'if-modified-since': pageStamp, 'if-none-match': 'anything' } })).statusCode, 200);
    assert.equal((await f.app.inject({ url: '/paint', headers: { 'if-modified-since': '9999' } })).statusCode, 200);
    assert.equal(model.headers.etag, undefined); assert.equal(model.headers['content-encoding'], undefined);
  } finally { await f.close(); }
});

test('assembly Range supports suffix, clamping, invalid fallback and huge integer boundaries', async () => {
  const f = await fixture();
  try {
    const cases = [
      ['bytes=2-5', 206, '2345', 'bytes 2-5/10'], ['bytes=-3', 206, '789', 'bytes 7-9/10'], ['bytes=8-20', 206, '89', 'bytes 8-9/10'],
      ['bytes=10-', 416, '', 'bytes */10'], ['bytes=-0', 416, '', 'bytes */10'], ['bytes=5-2', 416, '', 'bytes */10'],
      ['bytes=9999999999999999999999999999999-', 416, '', 'bytes */10'], ['bytes=-999999999999999999999999999999', 206, '0123456789', 'bytes 0-9/10'],
      ['bytes=0-1,4-5', 200, '0123456789', undefined], ['bytes=-', 200, '0123456789', undefined],
    ] as const;
    for (const [range, status, body, contentRange] of cases) { const result = await f.app.inject({ url: '/assemble/assets/clip.mp4', headers: { range, 'if-modified-since': 'anything' } }); assert.equal(result.statusCode, status, range); assert.equal(result.body, body); assert.equal(result.headers['content-range'], contentRange); if (status !== 200) assert.equal(result.headers['last-modified'], undefined); }
    const head = await f.app.inject({ method: 'HEAD', url: '/assemble/assets/clip.mp4', headers: { range: 'bytes=2-5' } }); assert.equal(head.statusCode, 206); assert.equal(head.headers['content-length'], '4'); assert.equal(head.body, '');
    await writeFile(join(f.assets, 'assembly', 'clip.mp4'), Buffer.alloc(4 * 1024 * 1024 + 2, 42)); const capped = await f.app.inject({ url: '/assemble/assets/clip.mp4', headers: { range: 'bytes=0-' } }); assert.equal(capped.rawPayload.length, 4 * 1024 * 1024); assert.equal(capped.headers['content-range'], 'bytes 0-4194303/4194306');
    await writeFile(join(f.assets, 'assembly', 'clip.mp4'), ''); assert.equal((await f.app.inject({ url: '/assemble/assets/clip.mp4', headers: { range: 'bytes=0-' } })).statusCode, 416);
  } finally { await f.close(); }
});

test('export adapter returns plan, binary attachment and bounded-worker busy response', async () => {
  const run: HostExporter['run'] = (async (method: 'plan' | 'export', body: unknown) => { if ((body as { busy?: unknown }).busy) throw new ExportBusy(); return method === 'export' ? Buffer.from('3MF') : { sample: body }; }) as HostExporter['run'];
  const f = await fixture({ exporter: { available: true, sourceSha256: 'sample-sha', catalog: { colors: ['sample'] }, run } });
  try {
    assert.deepEqual((await f.app.inject('/api/health')).json(), { version: '3.1.0', export: true, source_sha256: 'sample-sha' }); assert.deepEqual((await f.app.inject('/api/catalog')).json(), { colors: ['sample'] });
    const plan = await f.app.inject({ method: 'POST', url: '/api/plan', payload: { name: '方案' } }); assert.deepEqual(plan.json(), { sample: { name: '方案' } });
    const result = await f.app.inject({ method: 'POST', url: '/api/export', payload: {} }); assert.equal(result.body, '3MF'); assert.equal(result.headers['content-type'], 'model/3mf'); assert.equal(result.headers['content-disposition'], 'attachment; filename="XGO-Duck-materials.3mf"');
    const busy = await f.app.inject({ method: 'POST', url: '/api/export', payload: { busy: true } }); assert.equal(busy.statusCode, 503); assert.equal(busy.headers['retry-after'], '2'); assert.equal(busy.json().code, 'export.busy');
    const malformed = await f.app.inject({ method: 'POST', url: '/api/export', payload: 'wrong', headers: { 'content-type': 'multipart/form-data; boundary=test' } }); assert.equal(malformed.statusCode, 400); assert.equal(malformed.json().code, 'request.format');
  } finally { await f.close(); }
});


function rawCall(port: number, request: string): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host: '127.0.0.1', port }); const chunks: Buffer[] = [];
    socket.setTimeout(5000, () => { socket.destroy(); reject(new Error('HTTP fixture timed out')); });
    socket.on('connect', () => socket.write(request)); socket.on('data', chunk => chunks.push(chunk)); socket.on('error', reject);
    socket.on('end', () => { const raw = Buffer.concat(chunks).toString('utf8'), split = raw.indexOf('\r\n\r\n'), head = raw.slice(0, split).split('\r\n'); resolve({ status: Number(head[0]?.split(' ')[1]), headers: Object.fromEntries(head.slice(1).map(line => { const colon = line.indexOf(':'); return [line.slice(0, colon).toLowerCase(), line.slice(colon + 1).trim()]; })), body: raw.slice(split + 4) }); });
  });
}

test('browser Origin uses the bound port and configured listener instead of Host or forwarded headers', async () => {
  const f = await fixture();
  try {
    await f.app.listen({ host: '127.0.0.1', port: 0 }); const address = f.app.server.address(); assert.ok(address && typeof address === 'object'); const port = address.port;
    for (const origin of [`http://127.0.0.1:${port}`, `http://localhost:${port}`]) {
      const result = await rawCall(port, `POST /api/servo-setup/start HTTP/1.1\r\nHost: forged.invalid\r\nOrigin: ${origin}\r\nContent-Type: application/json\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}`); assert.equal(result.status, 200);
    }
    for (const origin of ['http://forged.invalid', `http://127.0.0.1:${port + 1}`]) {
      const result = await rawCall(port, `POST /api/servo-setup/start HTTP/1.1\r\nHost: forged.invalid\r\nOrigin: ${origin}\r\nX-Forwarded-Host: 127.0.0.1:${port}\r\nContent-Type: bad\r\nContent-Length: 3\r\nConnection: close\r\n\r\nbad`); assert.equal(result.status, 403); assert.deepEqual(Object.keys(JSON.parse(result.body)), ['error']);
    }
    const traversal = await rawCall(port, 'GET /assets/../source.3mf HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'); assert.equal(traversal.status, 404); assert.equal(JSON.parse(traversal.body).code, 'request.asset_missing');
    assert.deepEqual(await Promise.all(Array.from({ length: 60 }, async () => (await fetch(`http://127.0.0.1:${port}/module.mjs`)).status)), Array(60).fill(200));
  } finally { await f.close(); }
});

test('wire framing returns personal errors for invalid or excessive declared lengths and does not decode chunked JSON', async () => {
  const f = await fixture();
  try {
    await f.app.listen({ host: '127.0.0.1', port: 0 }); const address = f.app.server.address(); assert.ok(address && typeof address === 'object'); const port = address.port;
    for (const [length, status, code] of [['garbage', 400, 'request.format'], ['-1', 413, 'request.too_large'], ['8000001', 413, 'request.too_large']] as const) {
      const result = await rawCall(port, `PUT /api/schemes/x HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nContent-Length: ${length}\r\nConnection: close\r\n\r\n`); assert.equal(result.status, status); assert.equal(JSON.parse(result.body).code, code); assert.equal(result.headers['cache-control'], 'no-store');
    }
    const chunked = await rawCall(port, 'PUT /api/schemes/x HTTP/1.1\r\nHost: localhost\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n2\r\n{}\r\n0\r\n\r\n'); assert.equal(chunked.status, 422); assert.equal(JSON.parse(chunked.body).code, 'validation.4');
  } finally { await f.close(); }
});

test('frozen Python handler and TypeScript HTTP agree on synthetic routes, errors, caches and byte ranges', async context => {
  const profile=process.env.DUCK_PERSONAL_HTTP_MIME_PROFILE;
  if(profile===undefined){
    // MIME tables are host configuration. Each child reads controlled system files
    // through the unchanged production algorithm; historical Python supplies every expected response.
    for(const name of Object.keys(personalMimeProfiles))await context.test(name,async()=>{
      const env:NodeJS.ProcessEnv={...process.env,DUCK_PERSONAL_HTTP_MIME_PROFILE:name};delete env.NODE_TEST_CONTEXT;
      const child=spawn(process.execPath,['--import','tsx','--import',fileURLToPath(new URL('./fixtures/personal-http-mime.ts',import.meta.url)),'--test','--test-name-pattern','^frozen Python handler',fileURLToPath(import.meta.url)],{env});
      let stdout='',stderr='';child.stdout.on('data',(bytes:Buffer)=>{stdout+=bytes.toString();});child.stderr.on('data',(bytes:Buffer)=>{stderr+=bytes.toString();});
      const status=await new Promise<number|null>((done,reject)=>{child.once('error',reject);child.once('exit',done);});
      assert.equal(status,0,stdout+stderr);assert.match(stdout,new RegExp('Controlled MIME profile: '+name));assert.match(stdout,/Frozen Python HTTP reference: 52 requests replayed against Node/);
      context.diagnostic('Independent Python MIME profile '+name+': 52 requests; child exited 0');
    });
    return;
  }
  assert.ok(isPersonalMimeProfile(profile));
  context.diagnostic('Controlled MIME profile: '+profile);
  const f = await fixture();
  try {
    await f.app.listen({ host: '127.0.0.1', port: 0 }); const address = f.app.server.address(); assert.ok(address && typeof address === 'object');
    const cases: { method?: string; path: string; body?: string; headers?: string }[] = [
      { path: '/api/health///?query=1' }, { path: '/api/site' }, { path: '/api/catalog' }, { path: '/api/schemes' },
      { method: 'PUT', path: '/api/schemes/a%20b', body: 'bad', headers: 'Content-Type: bad\r\n' },
      { method: 'PUT', path: '/api/schemes/x', body: '{oops', headers: 'Content-Type: application/json\r\n' },
      { method: 'PUT', path: '/api/schemes/x', body: '[]', headers: 'Content-Type: application/json\r\n' },
      { method: 'POST', path: '/api/plan', body: 'bad', headers: 'Content-Type: bad\r\n' },
      { method: 'POST', path: '/api/export', body: 'bad', headers: 'Content-Type: bad\r\n' },
      { method: 'POST', path: '/api/auth/login', body: 'bad', headers: 'Content-Type: bad\r\n' },
      { method: 'DELETE', path: '/api/schemes/missing' }, { path: '/api/duck-debug/status' }, { path: '/api/duck-debug/numbering' }, { path: '/api/servo-setup' }, { path: '/api/servo-setup/records' },
      { method: 'POST', path: '/api/duck-debug/action', body: '{"action":"inspect","id":10.0}', headers: 'Content-Type: application/json\r\n' },
      { method: 'POST', path: '/api/servo-setup/start', body: '{}', headers: 'Content-Type: application/json; junk=broken\r\n' },
      { method: 'POST', path: '/api/servo-preparation', body: '{"ids":[10.0],"state":"picked"}', headers: 'Content-Type: application/json\r\n' },
      { path: '/' }, { path: '/?launcher=true' }, { path: '/paint' }, { path: '/paint/?q=1' }, { path: '/gallery/path' }, { path: '/assemble' }, { path: '/assemble/index.html///' }, { method: 'HEAD', path: '/assemble/' }, { path: '/module.mjs' }, { path: '/settings.conf' }, { path: '/file.py' }, { path: '/page.HTM' }, { path: '/paint', headers: 'If-Modified-Since: 9999\r\n' }, { path: '/empty/' }, { path: '/missing' }, { path: '/assets/source.3mf' }, { path: '/assets/../source.3mf' }, { path: '/assets/%6dodel.json' }, { path: '/assets/model.json' }, { path: '/assemble/assets/horn-reference/main.jpg' },
      ...['bytes=2-5', 'bytes=-3', 'bytes=8-20', 'bytes=10-', 'bytes=-0', 'bytes=5-2', 'bytes=9999999999999999999999999999-', 'bytes=-9999999999999999999999999999', 'bytes=-', 'bytes=0-1,4-5'].map(range => ({ path: '/assemble/assets/clip.mp4', headers: `Range: ${range}\r\n` })),
      { method: 'OPTIONS', path: '/api/site' },
      { path: '/assets/%zz' }, { path: '/%zz' }, { method: 'PUT', path: '/api/schemes/%zz', body: 'bad', headers: 'Content-Type: bad\r\n' },
    ];
    const snapshot=frozenOracle('personal-http',personalMimeInput(cases,profile));assert.equal(snapshot.status,0,snapshot.stderr);
    const expectedRows:Awaited<ReturnType<typeof rawCall>>[]=JSON.parse(snapshot.stdout);assert.equal(expectedRows.length,cases.length);
    context.diagnostic(`Frozen Python HTTP reference: ${cases.length} requests replayed against Node`);
    for (const [index,item] of cases.entries()) {
      const method = item.method ?? 'GET', body = item.body ?? '', request = `${method} ${item.path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n${item.headers ?? ''}${body ? 'Content-Length: ' + Buffer.byteLength(body) + '\r\n' : ''}\r\n${body}`;
      const expected=expectedRows[index]!;const actual=await rawCall(address.port,request);
      assert.equal(actual.status, expected.status, method + ' ' + item.path);
      for (const name of ['content-type', 'cache-control', 'x-content-type-options', 'location', 'content-range', 'accept-ranges', 'last-modified']) assert.equal(actual.headers[name], expected.headers[name], method + ' ' + item.path + ' ' + name);
      if (method !== 'HEAD' && expected.headers['content-type']?.startsWith('application/json')) assert.deepEqual(JSON.parse(actual.body), JSON.parse(expected.body), method + ' ' + item.path);
      else assert.equal(actual.body, expected.body, method + ' ' + item.path);
    }
    assert.equal(snapshot.stderr, '');
  } finally {
    await f.close();
  }
});
