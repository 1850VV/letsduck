import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = resolve(import.meta.dirname, '../..');

test('captures the old API in an owned temporary database and cleans up the service', () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-baseline-test-'));
  const assets = join(dir, 'assets'), output = join(dir, 'evidence'), sentinel = join(dir, 'user.db');
  mkdirSync(assets); writeFileSync(sentinel, 'Do not open the real database.');
  try {
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/baseline.ts', '--assets', assets, '--output', output, '--save-samples', '2', '--export-samples', '0'], {
      cwd: root, encoding: 'utf8', timeout: 30_000, env: { ...process.env, DUCK_PERSONAL_DB: sentinel, DUCK_DB: sentinel, DUCK_LEGACY_DB: sentinel },
    });
    assert.equal(run.status, 0, run.stderr);
    const result = JSON.parse(readFileSync(join(output, 'baseline.json'), 'utf8'));
    assert.equal(result.schema, 'letsduck-baseline/1');
    assert.equal(result.responses.site.body.edition, 'personal');
    assert.equal(result.responses.health.body.export, false);
    assert.equal(result.responses.catalog.status, 422);
    assert.equal(result.responses.saved.status, 200);
    assert.equal(result.responses.list.body.length, 1);
    assert.equal(result.responses.deleted.body.ok, true);
    assert.equal(result.responses.afterDelete.body.length, 0);
    assert.equal(result.timings.saveMs.n, 2);
    assert.equal(result.timings.exportMs, null);
    assert.equal(result.browser.status, 'not_requested');
    assert.equal(result.isolation.database, 'temporary');
    assert.equal(existsSync(result.isolation.temporaryDirectory), false);
    assert.throws(() => process.kill(result.isolation.servicePid, 0), { code: 'ESRCH' });
    assert.equal(readFileSync(sentinel, 'utf8'), 'Do not open the real database.');
    assert.deepEqual(readdirSync(assets), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an unavailable Python runtime cannot produce successful baseline evidence', () => {
  const dir = mkdtempSync(join(tmpdir(), 'letsduck-baseline-failure-'));
  try {
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/baseline.ts', '--output', dir, '--python', join(dir, 'absent-python')], { cwd: root, encoding: 'utf8', timeout: 15_000 });
    assert.notEqual(run.status, 0);
    assert.equal(existsSync(join(dir, 'baseline.json')), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
