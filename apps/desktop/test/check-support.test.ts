import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { desktopScope } from '../scripts/check-support.js';

test('desktop launch environment excludes unrelated credentials before tracing and keeps owned resources', async () => {
  const key = 'DUCK_UNNECESSARY_CREDENTIAL_CANARY';
  const original = process.env[key];
  process.env[key] = 'desktop-trace-isolation-canary-61e4d2';
  const scope = await desktopScope('duck-safe-env-');
  try {
    assert.equal(Object.hasOwn(scope.env, key), false, 'Unneeded host environment must not enter Electron launch metadata');
    assert.equal(scope.env.DUCK_PERSONAL_DB, join(scope.temporary, 'personal.db'));
    assert.equal(scope.env.DUCK_DESKTOP_DATA, join(scope.temporary, 'profile'));
    assert.equal(scope.env.DUCK_ADB, scope.fakeAdb);
    assert.ok(existsSync(scope.fakeAdb), 'ADB override must exist to prevent fallback');
    assert.equal(scope.env.DUCK_DB, undefined);
    assert.equal(scope.env.DUCK_DATABASE_URL, undefined);
    assert.equal(scope.env.DUCK_TEST_DATABASE_URL, undefined);
  } finally {
    await scope.dispose();
    if (original === undefined) delete process.env[key]; else process.env[key] = original;
  }
  assert.equal(existsSync(scope.temporary), false);
});
