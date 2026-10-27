import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase, backupSqlite, databaseTarget, nameKey } from '../../packages/storage/src/database.js';

test('server SQLite has original schema, exact integers, atomic rollback and serialized async transactions', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'duck-storage-driver-'));
  const db = await openDatabase(join(directory, 'server.db'));
  try {
    const tables = await db.transaction(c => c.rows("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"));
    assert.deepEqual(tables.map(row => row.name), ['migration_runs', 'ratings', 'schemes', 'sessions', 'users', 'works']);
    for (const table of ['users', 'sessions', 'schemes', 'works', 'migration_runs']) {
      const columns = await db.transaction(c => c.rows(`PRAGMA table_info(${table})`));
      assert.ok(columns.filter(column => column.pk).every(column => column.notnull === 1), `${table} primary keys must reject NULL like the original server schema`);
    }
    await db.transaction(c => c.run('CREATE TABLE counter(value INTEGER NOT NULL)'));
    await db.transaction(c => c.run('INSERT INTO counter VALUES(?)', [9007199254740993n]), true);
    assert.equal((await db.transaction(c => c.rows('SELECT value FROM counter')))[0]!.value, 9007199254740993n);
    await assert.rejects(db.transaction(async c => { await c.run('UPDATE counter SET value=0'); throw new Error('rollback'); }, true), /rollback/);
    assert.equal((await db.transaction(c => c.rows('SELECT value FROM counter')))[0]!.value, 9007199254740993n);
    await db.transaction(c => c.run('UPDATE counter SET value=0'), true);
    await Promise.all(Array.from({ length: 8 }, () => db.transaction(async c => { const value = (await c.rows('SELECT value FROM counter'))[0]!.value; assert.equal(typeof value, 'number'); await Promise.resolve(); await c.run('UPDATE counter SET value=?', [Number(value) + 1]); }, true)));
    assert.equal((await db.transaction(c => c.rows('SELECT value FROM counter')))[0]!.value, 8);
    await assert.rejects(db.transaction(c => c.run('INSERT INTO counter VALUES(?)', [1n << 80n]), true), /integer|range|large/i);
  } finally { await db.close(); rmSync(directory, { recursive: true, force: true }); }
});

test('legacy server lookup upgrade keeps a private consistent pre-ALTER backup', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'duck-storage-upgrade-')), path = join(directory, 'legacy.db');
  const old = new DatabaseSync(path);
  old.exec('CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT UNIQUE COLLATE NOCASE,pw_salt TEXT,pw_hash TEXT,avatar TEXT,color TEXT,created INTEGER)');
  old.prepare('INSERT INTO users VALUES(?,?,?,?,?,?,?)').run('u-a', 'ALPHA🦆', '01'.repeat(16), '02'.repeat(32), '🦆', '#4d6bfe', 1); old.close();
  try {
    const db = await openDatabase(path);
    try { assert.equal((await db.transaction(c => c.rows('SELECT name_key FROM users')))[0]!.name_key, 'alpha🦆'); } finally { await db.close(); }
    const files = readdirSync(join(directory, 'backups')); assert.equal(files.length, 1);
    const copy = join(directory, 'backups', files[0]!); assert.equal(statSync(copy).mode & 0o777, 0o600);
    const read = new DatabaseSync(copy, { readOnly: true });
    try { assert.ok(!read.prepare('PRAGMA table_info(users)').all().some(row => row.name === 'name_key')); } finally { read.close(); }
    await assert.rejects(backupSqlite(path, path), /differ/);
    await assert.rejects(backupSqlite(path, copy), /exist|EEXIST/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('database configuration and name identity retain existing paths and ASCII-only case folding', () => {
  assert.deepEqual(databaseTarget('sqlite:///:memory:'), { dialect: 'sqlite', path: ':memory:' });
  for (const target of ['sqlite:///:memory:?timeout=15', 'sqlite://?timeout=15', 'sqlite:///']) assert.deepEqual(databaseTarget(target), { dialect: 'sqlite', path: ':memory:' });
  assert.deepEqual(databaseTarget('sqlite:////tmp/duck-file.db'), { dialect: 'sqlite', path: '/tmp/duck-file.db' });
  assert.equal(databaseTarget('mysql+pymysql://duck:example@localhost/duck_test_ci').dialect, 'mysql');
  assert.throws(() => databaseTarget('postgresql://localhost/db'), /SQLite|MySQL/);
  assert.equal(nameKey('ABCÄΣ🦆'), 'abcÄΣ🦆');
});

test('SQLite URL options reopen the existing database instead of splitting account writes', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'duck-storage-url-')), path = join(directory, 'existing.db');
  try {
    const original = await openDatabase(path);
    try { await original.transaction(c => c.run('INSERT INTO users VALUES(?,?,?,?,?,?,?,?)', ['u-existing', 'Existing', '01'.repeat(16), '02'.repeat(32), '🦆', '#4d6bfe', 1, 'existing']), true); }
    finally { await original.close(); }
    const configured = await openDatabase('sqlite:///' + path + '?timeout=15');
    try { assert.equal((await configured.transaction(c => c.rows('SELECT id FROM users')))[0]?.id, 'u-existing'); }
    finally { await configured.close(); }
    assert.equal(existsSync(path + '?timeout=15'), false);
    assert.deepEqual(databaseTarget('sqlite:////tmp/a%20b#part.db?timeout=15'), { dialect: 'sqlite', path: '/tmp/a%20b#part.db' });
    assert.deepEqual(databaseTarget(path + '?literal=true'), { dialect: 'sqlite', path: path + '?literal=true' });
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
