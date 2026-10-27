import test from 'node:test';
import assert from 'node:assert/strict';

test('physical bus keeps operations ordered and releases after errors', async () => {
  const { IoBus } = await import('../../packages/devices/src/bus.js');
  const bus = new IoBus(), seen: number[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const first = bus.run(async () => { seen.push(1); await gate; throw new Error('fixture'); });
  const rejected = assert.rejects(first, /fixture/);
  const second = bus.run(async () => { seen.push(2); return 42; });
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.deepEqual(seen, [1]); release(); await rejected;
  assert.equal(await second, 42); await bus.idle(); assert.deepEqual(seen, [1, 2]);
});

import { mkdtemp, writeFile, readFile, rm, mkdir, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { jsonStringify } from '@letsduck/storage';

const model = 'Arduino UNO Q\0\n';
function commands(port = '12345', boardModel = model) {
  const calls: string[][] = [];
  return { calls, execute: async (args: readonly string[]) => {
    calls.push([...args]);
    if (args[0] === 'devices') return 'List of devices attached\nboard-1 device product:test\nphone unauthorized\n';
    if (args.includes('cat')) return boardModel;
    if (args.includes('tcp:0')) return port;
    return '';
  } };
}

test('ADB identifies only one UNO Q and removes only its dynamic forward', async () => {
  const { AdbRuntime } = await import('../../packages/devices/src/runtime.js');
  const fake = commands(), runtime = new AdbRuntime({ command: fake.execute });
  assert.equal(runtime.serial, null); assert.equal(fake.calls.length, 0);
  assert.equal(await runtime.connect(), 'board-1'); assert.equal(runtime.port, 12345);
  await runtime.connect(); assert.equal(fake.calls.filter(args => args.includes('tcp:0')).length, 1);
  await Promise.all([runtime.close(), runtime.close()]);
  assert.deepEqual(fake.calls.at(-1), ['-s', 'board-1', 'forward', '--remove', 'tcp:12345']);
  assert.equal(fake.calls.filter(args => args.includes('--remove')).length, 1);
  assert.equal(runtime.port, null); assert.equal(runtime.serial, 'board-1');
  assert.equal(fake.calls.some(args => args.includes('kill-server')), false);
});

test('ADB refuses non-UNO Q, multiple boards and invalid ports', async () => {
  const { AdbRuntime } = await import('../../packages/devices/src/runtime.js');
  const wrong = commands('12345', 'Android phone');
  await assert.rejects(new AdbRuntime({ command: wrong.execute }).connect(), /尚未发现 UNO Q/);
  assert.equal(wrong.calls.some(args => args.includes('forward')), false);
  const many = commands();
  await assert.rejects(new AdbRuntime({ command: async args => args[0] === 'devices' ? 'List of devices attached\na device\nb device\n' : many.execute(args) }).connect(), /请只连接一块/);
  for (const port of ['0', '65536', 'bad']) await assert.rejects(new AdbRuntime({ command: commands(port).execute }).connect(), /无法建立/);
});

test('halt rechecks the identified board and never targets the host', async () => {
  const { AdbRuntime } = await import('../../packages/devices/src/runtime.js');
  const fake = commands(), runtime = new AdbRuntime({ command: fake.execute });
  await runtime.halt();
  assert.deepEqual(fake.calls.at(-2), ['-s', 'board-1', 'shell', 'sudo', '-n', 'halt']);
  let checks = 0; const changed = commands();
  const rejected = new AdbRuntime({ command: args => args.includes('cat') && ++checks > 1 ? Promise.resolve('Other board') : changed.execute(args) });
  try { await assert.rejects(rejected.halt(), /无法确认板卡身份/); assert.equal(changed.calls.some(args => args.includes('halt')), false); }
  finally { await rejected.close(); }
});

test('runtime HTTP bypasses proxies, preserves numeric tokens and cleans failed connections', async () => {
  const { AdbRuntime } = await import('../../packages/devices/src/runtime.js');
  const requests: { path: string; body: string }[] = [];
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk));
    requests.push({ path: request.url ?? '', body: Buffer.concat(chunks).toString() });
    if (request.url === '/reject') { response.writeHead(422).end('{}'); return; }
    if (request.url === '/invalid') { response.end('not-json'); return; }
    if (request.url === '/utf8') { response.end(Buffer.from([255])); return; }
    if (request.url === '/servo.html') { response.end('<input id="kp" value="5">'); return; }
    response.setHeader('Content-Type', 'application/json'); response.end('{"id":9007199254740993,"gain":1.0}');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const fake = commands(String(address.port)), runtime = new AdbRuntime({ command: fake.execute, env: { HTTP_PROXY: 'http://127.0.0.1:1', NODE_USE_ENV_PROXY: '1' } });
  try {
    assert.equal(jsonStringify(await runtime.request('POST', '/api/status', { id: 9007199254740993n })), '{"id":9007199254740993,"gain":1.0}');
    assert.equal(requests[0]?.body, '{"id":9007199254740993}');
    assert.match(String(await runtime.request('GET', '/servo.html')), /input/);
    await assert.rejects(runtime.request('POST', '/reject', {}), /运行端拒绝/); assert.equal(runtime.port, address.port);
    await assert.rejects(runtime.request('GET', '/invalid'), /暂未就绪/); assert.equal(runtime.port, null);
    await assert.rejects(runtime.request('GET', '/utf8'), /暂未就绪/); assert.equal(runtime.port, null);
  } finally { await runtime.close(); server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});

test('ADB executable discovery keeps configured, PATH and Arduino version priority', async () => {
  const { AdbRuntime } = await import('../../packages/devices/src/runtime.js');
  const root = await mkdtemp(join(tmpdir(), 'duck-adb-discovery-'));
  try {
    const paths = ['configured', 'path/adb', 'Library/Arduino15/packages/arduino/tools/adb/2/adb', 'Library/Arduino15/packages/arduino/tools/adb/9/adb'];
    for (const path of paths) { const file = join(root, path); await mkdir(join(file, '..'), { recursive: true }); await writeFile(file, '#!/bin/sh\n'); await chmod(file, 0o755); }
    const env = { DUCK_ADB: join(root, 'configured'), PATH: join(root, 'path') };
    assert.equal(await AdbRuntime.executable({ env, home: root }), join(root, 'configured'));
    delete (env as { DUCK_ADB?: string }).DUCK_ADB;
    assert.equal(await AdbRuntime.executable({ env, home: root }), join(root, 'path/adb'));
    env.PATH = ''; assert.equal(await AdbRuntime.executable({ env, home: root }), join(root, paths[3]!));
    await assert.rejects(AdbRuntime.executable({ env: { PATH: '' }, home: join(root, 'missing') }), /没有找到 ADB/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('timed out ADB child is killed and reaped before returning', async () => {
  const { AdbRuntime } = await import('../../packages/devices/src/runtime.js');
  const root = await mkdtemp(join(tmpdir(), 'duck-adb-child-')), pidFile = join(root, 'child.pid');
  const runtime = new AdbRuntime({ executable: process.execPath, commandTimeoutMs: 1000 });
  try {
    await assert.rejects(runtime.command('--eval', `require('node:fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setInterval(() => {}, 1000)`), /USB 连接没有响应/);
    const pid = Number(await readFile(pidFile, 'utf8'));
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  } finally { await runtime.close(); await rm(root, { recursive: true, force: true }); }
});
