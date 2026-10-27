import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(import.meta.dirname, '../..');
const python = process.env.PYTHON || (existsSync(resolve(root, '.venv/bin/python')) ? resolve(root, '.venv/bin/python') : 'python3');
const oracle = String.raw`
import hashlib,json,sqlite3,sys
from pathlib import Path
sys.path.insert(0,str(Path(sys.argv[1])/'backend'))
sys.path.insert(0,str(Path(sys.argv[1])/'tests'))
from test_migration import legacy_database,DESIGN
from migrate_database import COLUMNS,fingerprint,target_data,migrate_sqlite
from database import open_database
from store import Store
op=sys.argv[2]
p=Path(sys.argv[3])
if op=='create':
 legacy_database(p)
 with sqlite3.connect(p) as c:
  c.execute('UPDATE schemes SET voice_salt=?,created=?,updated=?',(9223372036854775807,9007199254740993,9007199254740995))
  c.execute('UPDATE works SET description=? WHERE id=?',('中文\\n\u2028🦆','w-root'))
elif op=='snapshot':
 c=sqlite3.connect(p);c.row_factory=sqlite3.Row
 data={name:[dict(r) for r in c.execute('SELECT '+','.join(columns)+' FROM '+name)] for name,columns in COLUMNS.items()}
 data={name:sorted(rows,key=lambda r:tuple(str(r[k]) for k in COLUMNS[name])) for name,rows in data.items()}
 print(json.dumps({'fingerprint':fingerprint(data),'data':data},ensure_ascii=False,separators=(',',':')))
 c.close()
elif op=='target':
 e=open_database(sys.argv[3])
 try:
  with e.connect() as c:data=target_data(c)
  data={name:sorted(rows,key=lambda r:tuple(str(r[k]) for k in COLUMNS[name])) for name,rows in data.items()}
  print(json.dumps({'fingerprint':fingerprint(data),'data':data},ensure_ascii=False,separators=(',',':')))
 finally:e.dispose()
elif op=='fingerprint': print(fingerprint(json.load(sys.stdin)))
elif op=='migrate': print(json.dumps(migrate_sqlite(p,sys.argv[4])))
elif op=='rollback':
 s=Store(sys.argv[3],part_ids=['P1-01'])
 try:
  assert s.login('alpha','legacy-pass')['user']['id']=='u-a'
  assert s.user_for('retained-token-b')['id']=='u-b'
  rows=s.schemes('u-a');assert any(r['id']=='node-added' and r['name']=='Node 写入🦆' and r['voiceSalt']==9007199254740993 for r in rows)
  assert s.work('w-root','u-b')['rating']=={'count':1,'average':4.0,'mine':4}
  assert s.work('w-fork')['parentId']=='w-root'
  s.save_scheme('u-a','python-added',{'name':'Python 回退写入','design':DESIGN,'voiceSalt':9007199254740995})
  print(json.dumps({'ok':True}))
 finally:s.close()
`;
function py(op: string, source: string, ...extra: string[]): string {
  const run = spawnSync(python, ['-I', '-c', oracle, root, op, source, ...extra], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim();
}
function temporary(t: { after(fn: () => void): void }): { directory: string; source: string; target: string; backup: string } {
  const directory = mkdtempSync(resolve(tmpdir(), 'duck-migration-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const source = resolve(directory, 'legacy.db');
  py('create', source);
  return { directory, source, target: resolve(directory, 'target.db'), backup: resolve(directory, 'backup.db') };
}
const modules = async () => {
  const migration = await import('../../packages/storage/src/migration.js');
  assert.equal(typeof migration?.migrateSqlite, 'function', 'The verified TypeScript SQLite migration is missing');
  return migration!;
};
const hash = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
function sqlite(path: string, body: (db: DatabaseSync) => void): void {
  const db = new DatabaseSync(path); try { body(db); } finally { db.close(); }
}
function empty(path: string): void {
  sqlite(path, db => {
    for (const table of ['users', 'sessions', 'schemes', 'works', 'ratings', 'migration_runs']) {
      assert.equal(db.prepare('SELECT COUNT(*) AS count FROM ' + table).get()?.count, 0, table);
    }
  });
}

test('migration preserves every Python original field and exact large integer in a retained backup', async t => {
  const { source, target, backup } = temporary(t), before = hash(source), m = await modules();
  const result = await m.migrateSqlite(source, target, backup);
  assert.equal(result.status, 'migrated');
  assert.equal(result.database, 'sqlite');
  assert.deepEqual(result.counts, { users: 2, sessions: 2, schemes: 1, works: 2, ratings: 1 });
  assert.equal(result.backup, backup);
  assert.equal(hash(source), before);
  const original = py('snapshot', source), copied = py('snapshot', target);
  assert.equal(copied, original, 'Python must see identical original fields, IDs, hashes, tokens and relationships');
  assert.equal(py('snapshot', backup), original);
  assert.equal(result.fingerprint, JSON.parse(original).fingerprint);
});

test('fingerprint matches Python str tuple sorting, Unicode code points and compact UTF-8 JSON', async () => {
  const m = await modules();
  const data = {
    users: [
      { id: '🦆', name: '非 ASCII', pw_salt: 'a', pw_hash: 'b', avatar: '\u2028', color: '#FFFFFF', created: 9223372036854775807n },
      { id: '\ue000', name: 'line\ncontrol\u0000', pw_salt: 'a', pw_hash: 'b', avatar: '🦆', color: '#FFFFFF', created: -9007199254740993n },
      { id: 'same', name: 'same', pw_salt: 'a', pw_hash: 'b', avatar: '🦆', color: '#FFFFFF', created: 10 },
      { id: 'same', name: 'same', pw_salt: 'a', pw_hash: 'b', avatar: '🦆', color: '#FFFFFF', created: 2 },
    ], sessions: [], schemes: [], works: [], ratings: [],
  };
  // The oracle receives literal integer tokens; JSON.stringify would round or reject them.
  const literal = JSON.stringify(data, (_key, value: unknown) => typeof value === 'bigint' ? '__INT_' + String(value) + '__' : value)
    .replace(/"__INT_(-?\d+)__"/g, '$1');
  const run = spawnSync(python, ['-I', '-c', oracle, root, 'fingerprint', 'unused'], { cwd: root, input: literal, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(m.fingerprint(data), run.stdout.trim());
  assert.equal(m.fingerprint({ ...data, users: [...data.users].reverse() }), run.stdout.trim());
});

for (const dialect of ['sqlite', 'mysql'] as const) {
  const mysql = process.env.DUCK_TEST_DATABASE_URL;
  const options = { skip: dialect === 'mysql' && !mysql ? 'DUCK_TEST_DATABASE_URL not configured' : false };
  async function destination(t: Parameters<typeof temporary>[0], fixture: ReturnType<typeof temporary>): Promise<string> {
    if (dialect === 'sqlite') return fixture.target;
    assert.ok(mysql);
    const url = new URL(mysql.replace(/^mysql\+pymysql:/, 'mysql:'));
    assert.equal(url.protocol, 'mysql:', 'Tests require a MySQL URL');
    assert.match(decodeURIComponent(url.pathname), /^\/duck_test_[^/]+$/, 'Tests require a disposable duck_test_* database');
    const clean = async () => {
      const { openDatabase } = await import('../../packages/storage/src/database.js');
      const database = await openDatabase(mysql);
      try {
        await database.transaction(async connection => {
          for (const table of ['ratings', 'works', 'schemes', 'sessions', 'users', 'migration_runs']) await connection.run('DELETE FROM ' + table);
        });
      } finally { await database.close(); }
    };
    await clean(); t.after(() => clean());
    return mysql;
  }
  async function assertEmpty(target: string): Promise<void> {
    if (dialect === 'sqlite') return empty(target);
    const { openDatabase } = await import('../../packages/storage/src/database.js');
    const database = await openDatabase(target);
    try {
      await database.transaction(async connection => {
        for (const table of ['users', 'sessions', 'schemes', 'works', 'ratings', 'migration_runs']) {
          assert.equal((await connection.rows('SELECT COUNT(*) AS count FROM ' + table))[0]?.count, 0, table);
        }
      });
    } finally { await database.close(); }
  }
  test(dialect + ': repeated snapshots reconcile once and changed targets refuse replay', options, async t => {
    const fixture = temporary(t), target = await destination(t, fixture), m = await modules();
    const first = await m.migrateSqlite(fixture.source, target);
    const repeated = await m.migrateSqlite(fixture.source, target);
    assert.equal(first.status, 'migrated'); assert.equal(repeated.status, 'already_migrated');
    assert.equal(first.fingerprint, repeated.fingerprint);
    const { openDatabase } = await import('../../packages/storage/src/database.js');
    const database = await openDatabase(target);
    try { await database.transaction(async connection => {
      await connection.run('UPDATE users SET color=? WHERE id=?', ['#000000', 'u-a']);
    }); } finally { await database.close(); }
    await assert.rejects(m.migrateSqlite(fixture.source, target), /destination has changed/);
    if (dialect === 'sqlite') sqlite(target, db => assert.equal(db.prepare('SELECT color FROM users WHERE id=?').get('u-a')?.color, '#000000'));
  });
  test(dialect + ': another snapshot cannot merge into an occupied target', options, async t => {
    const fixture = temporary(t), target = await destination(t, fixture), m = await modules();
    await m.migrateSqlite(fixture.source, target);
    sqlite(fixture.source, db => db.prepare('UPDATE users SET name=? WHERE id=?').run('Changed', 'u-a'));
    await assert.rejects(m.migrateSqlite(fixture.source, target), /Destination is not empty/);
  });
  test(dialect + ': invalid imported ratings roll back every table and retain original and backup', options, async t => {
    const fixture = temporary(t), target = await destination(t, fixture), m = await modules();
    sqlite(fixture.source, db => db.exec('UPDATE ratings SET stars=9'));
    const before = hash(fixture.source);
    await assert.rejects(m.migrateSqlite(fixture.source, target, fixture.backup), /Import was not confirmed/);
    await assertEmpty(target);
    assert.equal(hash(fixture.source), before);
    assert.equal(py('snapshot', fixture.backup), py('snapshot', fixture.source));
  });
  test(dialect + ': exact data survives Node writes, old Python rollback reads and Python writes', options, async t => {
    const fixture = temporary(t), target = await destination(t, fixture), m = await modules();
    const original = py('snapshot', fixture.source);
    const imported = await m.migrateSqlite(fixture.source, target);
    assert.equal(imported.fingerprint, JSON.parse(original).fingerprint);
    assert.equal(py('target', target), original, 'Python independently reads every original field from the target');
    const { openDatabase } = await import('../../packages/storage/src/database.js');
    const database = await openDatabase(target);
    const design = '{"colors":{"P1-01":"#FFFFFF"},"assignments":{"P1-01":"pla-white"},"finishes":{}}';
    try { await database.transaction(async connection => {
      await connection.run('INSERT INTO schemes (id,user_id,name,design,provenance,voice_salt,created,updated) VALUES (?,?,?,?,?,?,?,?)',
        ['node-added', 'u-a', 'Node 写入🦆', design, null, 9007199254740993n, 1720000000008, 1720000000009]);
    }); } finally { await database.close(); }
    assert.deepEqual(JSON.parse(py('rollback', target)), { ok: true });
    const reread = await openDatabase(target);
    try { await reread.transaction(async connection => {
      assert.deepEqual(await connection.rows('SELECT id,voice_salt FROM schemes WHERE id=?', ['python-added']), [{ id: 'python-added', voice_salt: 9007199254740995n }]);
      assert.equal((await connection.rows('SELECT id FROM schemes WHERE id=?', ['node-added'])).length, 1);
    }); } finally { await reread.close(); }
    await assert.rejects(m.migrateSqlite(fixture.source, target), /destination has changed/);
  });
}

test('Python migration receipts and TypeScript migration receipts reconcile in both directions', async t => {
  const fixture = temporary(t), m = await modules();
  const legacy = JSON.parse(py('migrate', fixture.source, fixture.target));
  assert.equal(legacy.status, 'migrated');
  assert.equal((await m.migrateSqlite(fixture.source, fixture.target)).status, 'already_migrated');
  const nodeTarget = resolve(fixture.directory, 'node-target.db');
  assert.equal((await m.migrateSqlite(fixture.source, nodeTarget)).status, 'migrated');
  assert.equal(JSON.parse(py('migrate', fixture.source, nodeTarget)).status, 'already_migrated');
});

test('fingerprint refuses unsafe Number integers instead of silently rounding identity', async () => {
  const m = await modules();
  assert.throws(() => m.fingerprint({ users: [], sessions: [{ token: 't', user_id: 'u', created: 9007199254740992 }], schemes: [], works: [], ratings: [] }), /precision|safe|integer/i);
});

test('migration refuses direct, URL, configured and symbolic-link targets pointing to the source', async t => {
  const { source, directory } = temporary(t), m = await modules(), before = hash(source);
  const link = resolve(directory, 'source-link.db'); symlinkSync(source, link);
  for (const target of [source, 'sqlite:///' + source, link]) await assert.rejects(m.migrateSqlite(source, target), /Source and destination must differ/);
  assert.equal(hash(source), before);
  assert.equal(existsSync(resolve(directory, 'backups')), false);
  const run = spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/migrate-database.ts', source], {
    cwd: root, env: { ...process.env, DUCK_DATABASE_URL: 'sqlite:///' + source }, encoding: 'utf8',
  });
  assert.equal(run.status, 2, run.stderr); assert.match(run.stderr, /Source and destination must differ/);
  assert.equal(hash(source), before);
});

test('incomplete and foreign-key-invalid sources retain backups without creating targets', async t => {
  const fixture = temporary(t), m = await modules();
  sqlite(fixture.source, db => db.exec('DROP TABLE ratings'));
  const before = hash(fixture.source);
  await assert.rejects(m.migrateSqlite(fixture.source, fixture.target, fixture.backup), /not a complete letsduck database/);
  assert.ok(existsSync(fixture.backup)); assert.equal(hash(fixture.source), before); assert.equal(existsSync(fixture.target), false);
  const bad = resolve(fixture.directory, 'foreign.db'), backup = resolve(fixture.directory, 'foreign-backup.db');
  sqlite(bad, db => db.exec('CREATE TABLE parent(id INTEGER PRIMARY KEY); CREATE TABLE child(parent_id INTEGER REFERENCES parent(id)); PRAGMA foreign_keys=OFF; INSERT INTO child VALUES(8)'));
  await assert.rejects(m.migrateSqlite(bad, fixture.target, backup), /integrity check failed/);
  assert.ok(existsSync(backup)); assert.equal(existsSync(fixture.target), false);
});

test('snapshot backup includes committed WAL rows while preserving the original schema', async t => {
  const fixture = temporary(t), m = await modules();
  const db = new DatabaseSync(fixture.source);
  try {
    db.exec('PRAGMA journal_mode=WAL');
    db.prepare('UPDATE schemes SET name=? WHERE id=?').run('已提交 WAL🦆', 's-old');
    await m.migrateSqlite(fixture.source, fixture.target, fixture.backup);
    assert.equal(py('snapshot', fixture.backup), py('snapshot', fixture.source));
    assert.equal(py('snapshot', fixture.target), py('snapshot', fixture.source));
    assert.equal(db.prepare('PRAGMA table_info(users)').all().some(row => row.name === 'name_key'), false);
  } finally { db.close(); }
});

test('CLI uses the configured target, prints a verified receipt and exits 2 for invalid arguments or source', async t => {
  const fixture = temporary(t);
  const invoke = (args: string[]) => spawnSync(process.execPath, ['--import', 'tsx', 'tooling/src/migrate-database.ts', ...args], {
    cwd: root, env: { ...process.env, DUCK_DATABASE_URL: 'sqlite:///' + fixture.target }, encoding: 'utf8',
  });
  const run = invoke([fixture.source, '--backup', fixture.backup]);
  assert.equal(run.status, 0, run.stderr);
  const result: unknown = JSON.parse(run.stdout);
  assert.ok(result && typeof result === 'object');
  assert.equal(Reflect.get(result, 'status'), 'migrated');
  assert.equal(Reflect.get(result, 'fingerprint'), JSON.parse(py('snapshot', fixture.source)).fingerprint);
  for (const args of [[], [fixture.source, '--unknown'], [resolve(fixture.directory, 'missing.db')], [fixture.source, '--backup']]) {
    const rejected = invoke(args);
    assert.equal(rejected.status, 2, rejected.stderr); assert.ok(rejected.stderr.trim());
  }
});

test('fingerprint keeps Python scientific notation for fractional legacy SQLite cells', async () => {
  const m = await modules();
  const data = { users: [], sessions: [{ token: 't', user_id: 'u', created: 1e-7 }], schemes: [], works: [], ratings: [] };
  const run = spawnSync(python, ['-I', '-c', oracle, root, 'fingerprint', 'unused'], { cwd: root, input: JSON.stringify(data), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(m.fingerprint(data), run.stdout.trim());
});
