#!/usr/bin/env node
// Real Docker acceptance, intended for CI. All assets and databases are disposable.
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, writeFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

interface ContainerPayload { name: string; source_sha256: string; assignments: Record<string, string>; thumbnails: Record<string, string> }
interface RunningServer { name: string; url: string }
interface Session { token: string; user: { id: string; [key: string]: unknown } }

const root = fileURLToPath(new URL('../../', import.meta.url));
let parsed: ReturnType<typeof parseArgs<{ options: { image: { type: 'string' }; help: { type: 'boolean' } } }>>;
try {
  parsed = parseArgs({ options: { image: { type: 'string' }, help: { type: 'boolean' } } });
  if (parsed.values.help) {
    console.log('Usage: npx tsx tooling/test/server-container.ts [--image EXISTING_IMAGE]\nBuilds the backend and checks context exclusion, Node workers, permissions, persistence and migration.\nDUCK_TEST_DATABASE_URL optionally selects a disposable duck_test_* MySQL database; otherwise owns MySQL 8.4.');
    process.exit(0);
  }
  if (parsed.values.image && !/^[A-Za-z0-9][A-Za-z0-9/_.:@-]*$/.test(parsed.values.image)) throw new Error('Invalid image reference');
  if (process.env.DUCK_TEST_DATABASE_URL) {
    const url = new URL(process.env.DUCK_TEST_DATABASE_URL.replace(/^mysql\+[^:]+:/, 'mysql:'));
    if (url.protocol !== 'mysql:' || !/^\/duck_test_[A-Za-z0-9_]+$/.test(url.pathname)) throw new Error('DUCK_TEST_DATABASE_URL must name a disposable duck_test_* MySQL database');
  }
} catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exit(2); }

const id = `duck-phase5-${process.pid}-${randomBytes(5).toString('hex')}`;
const image = parsed.values.image ?? `${id}:test`;
const probeImage = `${id}:context`;
const network = `${id}-net`, volume = `${id}-data`;
const containers: string[] = [], images: string[] = [], volumes: string[] = [], networks: string[] = [], canaries: string[] = [], directories: string[] = [];
const abort = new AbortController(), children = new Set<ChildProcess>();
const onSignal = () => { abort.abort(); for (const child of children) child.kill('SIGTERM'); };
process.on('SIGINT', onSignal); process.on('SIGTERM', onSignal);

async function command(binary: string, args: string[], { allowFailure = false, cleanup = false }: { allowFailure?: boolean; cleanup?: boolean } = {}): Promise<{ output: string; error: string; code: number | null }> {
  if (abort.signal.aborted && !cleanup) throw new Error('Interrupted');
  return new Promise((accept, reject) => {
    const child = spawn(binary, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }); children.add(child);
    let output = '', error = '';
    child.stdout.on('data', value => { output = (output + value).slice(-2_000_000); });
    child.stderr.on('data', value => { error = (error + value).slice(-2_000_000); });
    const timer = setTimeout(() => child.kill('SIGKILL'), 15 * 60_000); timer.unref();
    child.once('error', failure => { clearTimeout(timer); children.delete(child); reject(failure); });
    child.once('exit', code => {
      clearTimeout(timer); children.delete(child);
      if (code === 0 || allowFailure) accept({ output, error, code });
      else reject(new Error(`${binary} ${args[0]} failed (${code}): ${error || output}`));
    });
  });
}
const docker = (...args: string[]) => command('docker', args);
async function createDirectory(path: string) {
  if (!existsSync(path)) { await mkdir(path); directories.push(path); }
}
async function prepareCanaries() {
  for (const directory of ['.ryugi', 'assets']) await createDirectory(join(root, directory));
  for (const path of [`.ryugi/${id}.txt`, `assets/${id}.3mf`, `.env.${id}`, `${id}.db`, `packages/host/src/.env.${id}`]) {
    await writeFile(join(root, path), 'Public CI canary: no model, credential or user data.\n', { flag: 'wx' }); canaries.push(path);
  }
}
async function checkContext(temporary: string) {
  const code = `const fs=require('node:fs');for(const p of ${JSON.stringify(canaries)})if(fs.existsSync('/context/'+p))throw Error('Private build context path included: '+p);`;
  const dockerfile = join(temporary, 'context.Dockerfile');
  await writeFile(dockerfile, `FROM ${image}\nUSER 0\nCOPY . /context\nRUN ${JSON.stringify(["node", "-e", code])}\n`);
  images.push(probeImage); await docker('build', '--file', dockerfile, '--tag', probeImage, root);
  console.log('PASS: model/env/database/private-context canaries excluded before COPY');
}
async function generateAssets(directory: string): Promise<ContainerPayload> {
  await mkdir(directory);
  const source = `import {writeSyntheticAssets} from ${JSON.stringify(pathToFileURL(join(root, 'tooling/test/synthetic-assets.ts')).href)};writeSyntheticAssets(process.argv[1]);`;
  await command(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', source, directory]);
  const model = JSON.parse(await readFile(join(directory, 'model.json'), 'utf8')) as { source_sha256: string; parts: { id: string; material: string; color: string }[] };
  const catalog = JSON.parse(await readFile(join(directory, 'catalog.json'), 'utf8')) as { products: { id: string; series: string; hex: string }[] };
  const { PNG } = await import('pngjs');
  const thumbnail = 'data:image/png;base64,' + PNG.sync.write(new PNG({ width: 512, height: 512 })).toString('base64');
  return { name: 'Container smoke', source_sha256: model.source_sha256,
    assignments: Object.fromEntries(model.parts.map(part => [part.id, catalog.products.find(product => product.series === part.material && product.hex === part.color)!.id])),
    thumbnails: Object.fromEntries(['cover', ...Array.from({ length: 6 }, (_, index) => [`plate${index + 1}`, `top${index + 1}`]).flat()].map(name => [name, thumbnail])) };
}
const environment = (values: Record<string, string>) => Object.entries(values).flatMap(([key, value]) => ['--env', `${key}=${value}`]);
let backendCount = 0;
async function startBackend(assets: string, database: string, legacy = database): Promise<RunningServer> {
  const name = `${id}-api-${++backendCount}`; containers.push(name);
  await docker('run', '--detach', '--name', name, '--network', network,
    '--add-host', 'host.docker.internal:host-gateway', '--publish', '127.0.0.1::8876',
    '--mount', `type=volume,source=${volume},target=/data`, '--mount', `type=bind,source=${assets},target=/assets,readonly`,
    ...environment({ DUCK_QUIET: '1', DUCK_DATABASE_URL: database, DUCK_DB: legacy }), image);
  const address = (await docker('port', name, '8876/tcp')).output.trim();
  assert.match(address, /^127\.0\.0\.1:\d+$/);
  const url = `http://${address}`;
  const deadline = performance.now() + 60_000;
  while (performance.now() < deadline) {
    if (abort.signal.aborted) throw new Error('Interrupted');
    try { if ((await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1_000) })).status === 200) return { name, url }; } catch {}
    await delay(100);
  }
  throw new Error(`Container did not become healthy: ${(await docker('logs', name)).output}`);
}
async function stopBackend(server: RunningServer) {
  await docker('stop', '--time', '15', server.name);
  assert.equal((await docker('inspect', '--format', '{{.State.ExitCode}}', server.name)).output.trim(), '0');
}
async function jsonRequest<T = Record<string, unknown>>(url: string, path: string, body?: unknown, token?: string, method?: string): Promise<T> {
  const response = await fetch(url + path, { method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30_000) });
  const value = await response.json(); assert.equal(response.status, 200, JSON.stringify(value)); return value as T;
}
async function checkApi(server: RunningServer, payload: ContainerPayload) {
  const health = await jsonRequest(server.url, '/api/health');
  assert.equal(health.version, '3.1.0'); assert.equal(health.export, true); assert.equal(health.source_sha256, payload.source_sha256);
  assert.equal((await jsonRequest(server.url, '/api/site')).edition, 'server');
  assert.equal((await fetch(`${server.url}/api/duck-debug/status`)).status, 404);
  assert.equal((await fetch(`${server.url}/assets/source.3mf`)).status, 404);
  assert.equal((await jsonRequest<{ parts: unknown[] }>(server.url, '/api/plan', payload)).parts.length, 35);
  const exported = await fetch(`${server.url}/api/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(30_000) });
  assert.equal(exported.status, 200); const content = Buffer.from(await exported.arrayBuffer());
  assert.ok(content.length > 1_000); assert.equal(content.subarray(0, 4).toString('hex'), '504b0304');
  // Exercise the Docker healthcheck command, independently of our host HTTP probe.
  const healthcheck = JSON.parse((await docker('inspect', '--format', '{{json .Config.Healthcheck.Test}}', server.name)).output);
  assert.equal(healthcheck.shift(), 'CMD'); await docker('exec', server.name, ...healthcheck);
}
async function checkPermissions(server: RunningServer) {
  const code = `import assert from 'node:assert/strict';import fs from 'node:fs';import {spawnSync} from 'node:child_process';
assert.equal(process.getuid(),10001);assert.equal(process.versions.node.split('.')[0],'24');
for(const executable of ['python','python3','adb'])assert.equal(spawnSync(executable,['--version']).error?.code,'ENOENT',executable);
fs.writeFileSync('/data/permission-probe','temporary');assert.equal(fs.readFileSync('/data/permission-probe','utf8'),'temporary');fs.unlinkSync('/data/permission-probe');
for(const directory of ['/app','/assets'])assert.throws(()=>fs.writeFileSync(directory+'/permission-probe','forbidden'),error=>['EACCES','EROFS'].includes(String((error as NodeJS.ErrnoException).code)));
for(const path of ['/app/.ryugi','/app/.env','/app/backend/server.py','/app/assets/source.3mf','/app/node_modules/tsx','/app/node_modules/typescript'])assert.equal(fs.existsSync(path),false,path);`;
  await docker('exec', server.name, 'node', '--input-type=module', '-e', code);
  await docker('exec', server.name, 'node', 'tooling/dist/migrate-database.js', '--help');
  console.log('PASS: Node 24 UID10001, read-only app/assets, writable data, no Python/ADB/dev tools');
}
async function migrate(source: string, target: string, backup: string) {
  const name = `${id}-migrate-${containers.length}`; containers.push(name);
  const result = await docker('run', '--name', name, '--network', network, '--add-host', 'host.docker.internal:host-gateway',
    '--mount', `type=volume,source=${volume},target=/data`, ...environment({ DUCK_DATABASE_URL: target }),
    image, 'node', 'tooling/dist/migrate-database.js', source, '--backup', backup);
  const value = JSON.parse(result.output); assert.equal(value.status, 'migrated'); assert.equal(value.counts.users, 1); assert.match(value.fingerprint, /^[a-f0-9]{64}$/);
}
async function mysqlUrl() {
  if (process.env.DUCK_TEST_DATABASE_URL) {
    const url = new URL(process.env.DUCK_TEST_DATABASE_URL.replace(/^mysql\+[^:]+:/, 'mysql:'));
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) url.hostname = 'host.docker.internal';
    return { url: url.href, owned: false };
  }
  const name = `${id}-mysql`, password = randomBytes(18).toString('hex'); containers.push(name);
  await docker('run', '--detach', '--name', name, '--network', network, '--network-alias', 'mysql',
    ...environment({ MYSQL_DATABASE: 'duck_test_container', MYSQL_USER: 'duck', MYSQL_PASSWORD: password, MYSQL_ROOT_PASSWORD: randomBytes(18).toString('hex') }),
    'mysql:8.4', '--innodb-buffer-pool-size=128M', '--performance-schema=OFF');
  const deadline = performance.now() + 120_000;
  while (performance.now() < deadline) {
    const result = await command('docker', ['exec', '--env', `MYSQL_PWD=${password}`, name, 'mysql', '--protocol=TCP', '-h127.0.0.1', '-uduck', 'duck_test_container', '-e', 'SELECT 1'], { allowFailure: true });
    if (result.code === 0) return { url: `mysql://duck:${password}@mysql:3306/duck_test_container`, owned: true };
    await delay(500);
  }
  throw new Error('Disposable MySQL did not become ready');
}

let temporary: string | undefined, failure: unknown;
try {
  temporary = await mkdtemp(join(tmpdir(), `${id}-`)); const assets = join(temporary, 'assets');
  const payload = await generateAssets(assets); await prepareCanaries();
  if (!parsed.values.image) { images.push(image); await docker('build', '--file', 'backend/Dockerfile', '--tag', image, root); }
  await checkContext(temporary);
  networks.push(network); await docker('network', 'create', network);
  volumes.push(volume); await docker('volume', 'create', volume);
  const original = await startBackend(assets, '/data/original.db'); await checkApi(original, payload); await checkPermissions(original);
  const credentials = { name: `ci${randomBytes(5).toString('hex')}`, password: 'temporary-CI-password' };
  const session = await jsonRequest<Session>(original.url, '/api/auth/register', credentials);
  await stopBackend(original);
  await migrate('/data/original.db', '/data/copied.db', '/data/sqlite-retained.db');
  const copied = await startBackend(assets, '/data/copied.db');
  assert.deepEqual((await jsonRequest<Session>(copied.url, '/api/auth/login', credentials)).user, session.user);
  assert.deepEqual(await jsonRequest(copied.url, '/api/me', undefined, session.token), session.user);
  await stopBackend(copied);
  console.log('PASS: SQLite restart, compiled migration, retained account/password/session');
  const mysql = await mysqlUrl();
  if (mysql.owned) await migrate('/data/original.db', mysql.url, '/data/mysql-retained.db');
  const server = await startBackend(assets, mysql.url, mysql.owned ? '/data/original.db' : '/data/no-legacy.db');
  await checkApi(server, payload);
  if (mysql.owned) {
    assert.deepEqual((await jsonRequest<Session>(server.url, '/api/auth/login', credentials)).user, session.user);
    assert.deepEqual(await jsonRequest(server.url, '/api/me', undefined, session.token), session.user);
  } else {
    const external = await jsonRequest<Session>(server.url, '/api/auth/register', credentials);
    try { assert.deepEqual((await jsonRequest<Session>(server.url, '/api/auth/login', credentials)).user, external.user); }
    finally {
      const code = `import {openDatabase} from '@letsduck/storage';const db=await openDatabase();try{await db.transaction(c=>c.run('DELETE FROM users WHERE id = ?',[process.argv[1]]),true);}finally{await db.close();}`;
      await docker('exec', server.name, 'node', '--input-type=module', '-e', code, external.user.id);
    }
  }
  await stopBackend(server);
  console.log(`PASS: real MySQL API/worker export${mysql.owned ? ', SQLite-to-MySQL migration and original sessions' : ' (guarded external test database)'}`);
} catch (error) { failure = error; }
finally {
  const cleanupFailures = [];
  for (const [kind, names] of [['container', containers.reverse()], ['volume', volumes], ['network', networks], ['image', images.reverse()]] as const) {
    for (const name of names) {
      const args = kind === 'container' ? ['rm', '--force', '--volumes', name] : kind === 'image' ? ['image', 'rm', '--force', name] : [kind, 'rm', name];
      try {
        const result = await command('docker', args, { allowFailure: true, cleanup: true });
        if (result.code !== 0 && !/No such (?:container|volume|network|image)/i.test(result.error + result.output)) cleanupFailures.push(`${kind} ${name}`);
      } catch { cleanupFailures.push(`${kind} ${name}`); }
    }
  }
  for (const path of canaries) await rm(join(root, path), { force: true });
  for (const directory of directories.reverse()) await rmdir(directory).catch(error => { if (!['ENOTEMPTY', 'ENOENT'].includes(String((error as NodeJS.ErrnoException).code))) throw error; });
  if (temporary) await rm(temporary, { recursive: true, force: true });
  process.off('SIGINT', onSignal); process.off('SIGTERM', onSignal);
  if (cleanupFailures.length) {
    const cleanup = new Error(`Cleanup failed: ${cleanupFailures.join(', ')}`);
    console.error(cleanup.message); failure ??= cleanup;
  }
  else console.log('PASS: owned containers/volumes/network/images/canaries/temp assets cleaned');
}
if (failure) { console.error(failure instanceof Error ? failure.message : String(failure)); process.exitCode = 1; }
