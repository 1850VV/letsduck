import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PersonalStore, jsonStringify } from '@letsduck/storage';
import { writeSyntheticAssets } from './synthetic-assets.js';

const repo = resolve(import.meta.dirname, '../..');
test('Node local CLI starts without Python, accepts legacy integer ports and drains SIGTERM', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-local-cli-')), assets = join(root, 'assets'), database = join(root, 'personal.db');
  await mkdir(assets); writeSyntheticAssets(assets); await writeFile(join(assets, 'geometry.bin'), '');
  const child = spawn(process.execPath, ['apps/local/dist/main.js', '--host', '127.0.0.1', '--port', '+0', '--no-open'], { cwd: repo, env: { ...process.env, PATH: '', DUCK_ASSETS: assets, DUCK_PERSONAL_DB: database, DUCK_DB: join(root, 'missing-legacy.db') }, stdio: ['ignore', 'pipe', 'pipe'] });
  const exited = once(child, 'exit'); let stdout = '', stderr = '';
  child.stdout.setEncoding('utf8'); child.stdout.on('data', text => { stdout += text; });
  child.stderr.setEncoding('utf8'); child.stderr.on('data', text => { stderr += text; });
  try {
    const url = await new Promise<string>((done, reject) => {
      const timer = setTimeout(() => reject(new Error('CLI startup timed out: ' + stdout + stderr)), 8_000);
      const inspect = () => { const found = /已启动：(http:\/\/[^\s]+)/u.exec(stdout); if (found?.[1]) { clearTimeout(timer); done(found[1]); } };
      child.stdout.on('data', inspect); child.once('exit', () => { clearTimeout(timer); reject(new Error('CLI exited before ready: ' + stderr)); }); inspect();
    });
    const ids = Array.from({ length: 35 }, (_, index) => 'p' + index);
    const body = jsonStringify({ name: 'CLI', design: { colors: Object.fromEntries(ids.map(id => [id, '#FFFFFF'])), assignments: Object.fromEntries(ids.map(id => [id, null])), finishes: {} }, voiceSalt: 9007199254740993n });
    const response = await fetch(url + 'api/schemes/cli', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(response.status, 200); assert.match(await response.text(), /9007199254740993/);
    assert.equal((await fetch(url + 'api/health')).status, 200);
    child.kill('SIGTERM'); let timer: ReturnType<typeof setTimeout> | undefined;
    try { assert.deepEqual(await Promise.race([exited, new Promise<never>((_done, reject) => { timer = setTimeout(() => reject(new Error('CLI did not exit after SIGTERM')), 3_000); })]), [0, null]); }
    finally { clearTimeout(timer); }
    assert.ok(child.pid); assert.throws(() => process.kill(child.pid!, 0), { code: 'ESRCH' });
    const store = new PersonalStore({ path: database, partIds: [] });
    try { assert.equal(store.schemes()[0]?.voiceSalt, 9007199254740993n); } finally { store.close(); }
  } finally {
    if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await exited; }
    await rm(root, { recursive: true, force: true });
  }
});
