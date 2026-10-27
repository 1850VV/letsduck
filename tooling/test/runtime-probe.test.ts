import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');

test('the selected stack can serve a typed response and release its HTTP listener and SQLite database', () => {
  const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/runtime-probe.ts'], { cwd: root, encoding: 'utf8', timeout: 15_000 });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.status, 'passed');
  assert.equal(result.http.databaseValue, 'preserved');
  assert.equal(result.listenerClosed, true);
  assert.equal(result.databaseReopened, true);
  assert.equal(result.mysqlDriver, 'loaded');
  assert.equal(result.electron, null);
});

test('a requested missing Electron executable fails the compatibility check', () => {
  const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/runtime-probe.ts', '--electron', resolve(root, 'absent-electron')], { cwd: root, encoding: 'utf8', timeout: 15_000 });
  assert.notEqual(run.status, 0);
});
