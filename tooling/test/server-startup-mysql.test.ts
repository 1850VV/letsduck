import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ServerStore, databaseTarget } from '@letsduck/storage';
import { startServer } from '../../packages/host/src/server-application.js';
const url = process.env.DUCK_TEST_DATABASE_URL;

test('real MySQL server refuses unmigrated or malformed legacy SQLite and leaves it unchanged', { skip: !url && 'DUCK_TEST_DATABASE_URL not configured' }, async () => {
  const target = databaseTarget(url); assert.equal(target.dialect, 'mysql'); assert.ok(target.dialect === 'mysql' && /^duck_test_[a-zA-Z0-9_]+$/.test(target.database), 'Only disposable duck_test_ databases are allowed');
  const reset = await ServerStore.open({ database: url! });
  try { await reset.db.transaction(async db => { for (const table of ['ratings', 'works', 'schemes', 'sessions', 'users', 'migration_runs']) await db.run('DELETE FROM ' + table); }, true); }
  finally { await reset.close(); }
  const root = await mkdtemp(join(tmpdir(), 'duck-server-mysql-guard-')), legacy = join(root, 'legacy.db');
  const options = { assets: join(root, 'missing-assets'), database: url!, legacy, port: 0, quiet: true };
  try {
    const sqlite = new DatabaseSync(legacy); sqlite.exec('CREATE TABLE users(id TEXT PRIMARY KEY); INSERT INTO users VALUES (\'old-user\')'); sqlite.close();
    const before = await readFile(legacy), entries = await readdir(root);
    await assert.rejects(startServer(options), /Existing SQLite accounts require node tooling\/dist\/migrate-database.js/);
    assert.deepEqual(await readFile(legacy), before); assert.deepEqual(await readdir(root), entries);
    const store = await ServerStore.open({ database: url! });
    try { await store.register('already-migrated-user', 'password-123'); } finally { await store.close(); }
    const existing = await startServer(options); try { assert.equal((await fetch(existing.url + 'api/health')).status, 200); } finally { await existing.close(); }
    await writeFile(legacy, 'invalid-sqlite'); const malformed = await readFile(legacy);
    await assert.rejects(startServer(options)); assert.deepEqual(await readFile(legacy), malformed);
    await rm(legacy);
    const missing = await startServer(options); try { assert.equal((await fetch(missing.url + 'api/health')).status, 200); } finally { await missing.close(); }
  } finally { await rm(root, { recursive: true, force: true }); }
});
