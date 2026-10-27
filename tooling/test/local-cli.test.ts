import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PersonalStore, jsonStringify } from '@letsduck/storage';
import { writeSyntheticAssets } from './synthetic-assets.js';

const repo = resolve(import.meta.dirname, '../..');
for (const signal of ['SIGTERM', 'SIGHUP'] as const) test(`Node local CLI uses packaged renderer/manifest without Python and drains ${signal}${process.platform === 'win32' ? ' handler via test IPC' : ''}`, async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-local-cli-')), assets = join(root, 'assets'), database = join(root, 'personal.db');
  await mkdir(assets); writeSyntheticAssets(assets); await writeFile(join(assets, 'geometry.bin'), '');
  const frontend = join(root, 'runtime/frontend'), manifest = join(root, 'runtime/assembly-assets.json');
  await mkdir(join(frontend, 'assemble'), { recursive: true }); await mkdir(join(assets, 'assembly'));
  await writeFile(join(frontend, 'home.html'), '<!doctype html><title>Owned portable renderer</title>');
  await writeFile(join(frontend, 'assemble/index.html'), '<!doctype html><title>Owned portable assembly</title>');
  await writeFile(join(assets, 'assembly/portable.bin'), 'portable assembly bytes');
  await writeFile(manifest, JSON.stringify({ files: { 'portable.bin': 'owned synthetic fixture' } }));
  const adb = join(root, process.platform === 'win32' ? 'adb.exe' : 'adb');
  await writeFile(adb, process.platform === 'win32' ? 'owned invalid executable' : '#!/bin/sh\nexit 1\n'); await chmod(adb, 0o755);
  const cli = ['--host', '127.0.0.1', '--port', '+0', '--no-open'];
  // Windows kill() forcibly terminates processes. This test IPC invokes the real
  // CLI signal handler; POSIX additionally exercises actual OS signal delivery.
  const args = process.platform === 'win32' ? ['--input-type=module', '--eval', `import {main} from ${JSON.stringify(pathToFileURL(join(repo, 'apps/local/dist/main.js')).href)};process.once('message',()=>{process.disconnect();process.emit(${JSON.stringify(signal)});});await main(${JSON.stringify(cli)});`] : ['apps/local/dist/main.js', ...cli];
  const child = spawn(process.execPath, args, { cwd: repo, env: { ...process.env, PATH: '', DUCK_ADB: adb, DUCK_ASSETS: assets, DUCK_FRONTEND: frontend, DUCK_ASSEMBLY_MANIFEST: manifest, DUCK_PERSONAL_DB: database, DUCK_DB: join(root, 'missing-legacy.db') }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  const out = child.stdout, err = child.stderr; assert.ok(out && err);
  const exited = once(child, 'exit'); let stdout = '', stderr = '';
  out.setEncoding('utf8'); out.on('data', text => { stdout += text; });
  err.setEncoding('utf8'); err.on('data', text => { stderr += text; });
  try {
    const url = await new Promise<string>((done, reject) => {
      const timer = setTimeout(() => reject(new Error('CLI startup timed out: ' + stdout + stderr)), 8_000);
      const inspect = () => { const found = /已启动：(http:\/\/[^\s]+)/u.exec(stdout); if (found?.[1]) { clearTimeout(timer); done(found[1]); } };
      out.on('data', inspect); child.once('exit', () => { clearTimeout(timer); reject(new Error('CLI exited before ready: ' + stderr)); }); inspect();
    });
    assert.match(await (await fetch(url)).text(), /Owned portable renderer/);
    assert.equal((await (await fetch(url + 'api/site')).json() as { assembly: boolean }).assembly, true);
    const assembly = await fetch(url + 'assemble/assets/portable.bin');
    assert.equal(assembly.status, 200); assert.equal(await assembly.text(), 'portable assembly bytes');
    const ids = Array.from({ length: 35 }, (_, index) => 'p' + index);
    const body = jsonStringify({ name: 'CLI', design: { colors: Object.fromEntries(ids.map(id => [id, '#FFFFFF'])), assignments: Object.fromEntries(ids.map(id => [id, null])), finishes: {} }, voiceSalt: 9007199254740993n });
    const response = await fetch(url + 'api/schemes/cli', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, 200); assert.match(await response.text(), /9007199254740993/);
    assert.equal((await fetch(url + 'api/health')).status, 200);
    if (process.platform === 'win32') child.send('stop'); else child.kill(signal);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { assert.deepEqual(await Promise.race([exited, new Promise<never>((_done, reject) => { timer = setTimeout(() => reject(new Error('CLI did not drain ' + signal)), 3_000); })]), [0, null]); }
    finally { clearTimeout(timer); }
    assert.ok(child.pid); assert.throws(() => process.kill(child.pid!, 0), { code: 'ESRCH' });
    const store = new PersonalStore({ path: database, partIds: [] });
    try { assert.equal(store.schemes()[0]?.voiceSalt, 9007199254740993n); } finally { store.close(); }
  } finally {
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited; }
    await rm(root, { recursive: true, force: true });
  }
});

test('source launcher help needs no assets, database, listener or Python',()=>{
 const result=spawnSync(process.execPath,['apps/local/dist/main.js','--help'],{cwd:repo,encoding:'utf8',env:{...process.env,PATH:'',PYTHON:'absent-python'}});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/--port/);assert.match(result.stdout,/--no-open/);assert.doesNotMatch(result.stdout,/http:\/\/127/);
});
