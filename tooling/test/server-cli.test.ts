import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { waitAndOpen, main } from '../../apps/server/src/main.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const entry = join(root, 'apps/server/src/main.ts');
const temporary = async () => mkdtemp(join(tmpdir(), 'duck-server-cli-'));
async function listen(server: Server): Promise<string> {
  await new Promise<void>(accept => server.listen(0, '127.0.0.1', accept));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
async function close(server: Server): Promise<void> {
  await new Promise<void>((accept, reject) => server.close(error => error ? reject(error) : accept()));
}
function cli(args: string[], directory: string, extra: NodeJS.ProcessEnv = {}) {
  const env = { ...process.env, HOST: '127.0.0.1', PORT: '0', DUCK_DB_ENGINE: 'sqlite',
    DUCK_DATABASE_URL: join(directory, 'server.db'), DUCK_DB: join(directory, 'legacy-missing.db'),
    DUCK_ASSETS: join(directory, 'assets-missing'), DUCK_QUIET: '1', ...extra };
  const child = spawn(process.execPath, ['--import', 'tsx', entry, ...args], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = ''; let error = '';
  child.stdout.on('data', data => { output += String(data); }); child.stderr.on('data', data => { error += String(data); });
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(accept => {
    child.once('exit', (code, signal) => accept({ code, signal }));
  });
  async function exit() {
    const timeout = setTimeout(() => { child.kill('SIGKILL'); }, 10_000); timeout.unref();
    try { return await exited; } finally { clearTimeout(timeout); }
  }
  return { child, exit, output: () => output, error: () => error, async stop() {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); await exit();
  }, async ready() {
    const deadline = performance.now() + 10_000;
    while (performance.now() < deadline) {
      const match = /letsduck server ready: (http:\/\/\S+)/.exec(output);
      if (match?.[1]) return match[1].replace(/\/$/, '');
      if (child.exitCode !== null || child.signalCode !== null) break;
      await delay(10);
    }
    throw new Error(`CLI did not become ready: ${output}\n${error}`);
  } };
}

test('Node server CLI exists without starting a service on import', () => { assert.equal(typeof main, 'function'); });
test('browser opens only after a real health response is 200', async () => {
  let requests = 0; const opened: string[] = [];
  const server = createServer((request, response) => {
    assert.equal(request.url, '/api/health'); requests++;
    response.writeHead(requests < 3 ? 503 : 200); response.end('{}');
  });
  const url = await listen(server);
  try {
    assert.equal(await waitAndOpen(url, async value => { assert.equal(requests, 3); opened.push(value); }, { timeoutMs: 500, pollMs: 1 }), true);
    assert.deepEqual(opened, [url]);
  } finally { await close(server); }
});
test('health non-200 and cancellation never open a browser', async () => {
  const server = createServer((_request, response) => { response.writeHead(201); response.end(); });
  const url = await listen(server); let opened = false;
  try {
    assert.equal(await waitAndOpen(url, async () => { opened = true; }, { timeoutMs: 40, pollMs: 1 }), false);
    assert.equal(await waitAndOpen(url, async () => { opened = true; }, { signal: AbortSignal.abort() }), false);
    assert.equal(opened, false);
  } finally { await close(server); }
});
test('CLI help and invalid arguments exit without opening a database', async () => {
  const directory = await temporary();
  try {
    const help = cli(['--help'], directory); assert.equal((await help.exit()).code, 0);
    assert.match(help.output(), /--host HOST.*--port PORT.*--static DIR.*--open/s);
    for (const args of [['--port', 'invalid'], ['--port', '-1'], ['--port', '2.5'], ['--port', '65536'], ['--unknown'], ['--static']]) {
      const invalid = cli(args, directory); assert.equal((await invalid.exit()).code, 2, invalid.error());
    }
    assert.deepEqual(await readdir(directory), []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('actual server CLI honors HOST/PORT/static, serves API, and drains on SIGTERM', async () => {
  const directory = await temporary(); const frontend = join(directory, 'frontend');
  await mkdir(frontend); await writeFile(join(frontend, 'index.html'), '<!doctype html><title>Server CLI fixture</title>');
  const process = cli(['--static', frontend], directory, { PORT: ' +0 ' }); let url: string | undefined;
  try {
    url = await process.ready();
    const response = await fetch(`${url}/api/health`); assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { version: '3.1.0', export: false, source_sha256: null });
    assert.match(await (await fetch(`${url}/`)).text(), /Server CLI fixture/);
    assert.equal((await fetch(`${url}/api/duck-debug/status`)).status, 404);
    process.child.kill('SIGTERM'); assert.equal((await process.exit()).code, 0, process.error());
    await assert.rejects(fetch(`${url}/api/health`));
  } finally { await process.stop(); await rm(directory, { recursive: true, force: true }); }
});
test('occupied requested port fails without falling back', async () => {
  const directory = await temporary(); const occupied = createServer((_request, response) => response.end('owned fixture'));
  const url = await listen(occupied); const port = new URL(url).port;
  const process = cli(['--port', port], directory);
  try {
    assert.equal((await process.exit()).code, 1); assert.match(process.error(), /EADDRINUSE|in use/i);
    assert.equal(await (await fetch(url)).text(), 'owned fixture'); assert.equal(process.output(), '');
  } finally { await process.stop(); await close(occupied); await rm(directory, { recursive: true, force: true }); }
});

test('container acceptance rejects a non-test database before Docker or data setup', async () => {
  const directory = await temporary();
  try {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/test/server-container.ts'], {
      cwd: root, env: { ...process.env, PATH: directory, DUCK_TEST_DATABASE_URL: 'mysql://ci:ci@127.0.0.1/production' }, encoding: 'utf8', timeout: 5_000,
    });
    assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /disposable duck_test_\*/);
    assert.deepEqual(await readdir(directory), []);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
