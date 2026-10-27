import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ServerStore, AVATARS, COLORS } from '../../packages/storage/src/server.js';
import type { Connection, Database, Row } from '../../packages/storage/src/database.js';
import { errorPayload, Invalid, parseWireJson, pythonString, readJsonField } from '@letsduck/domain';

const root = resolve(import.meta.dirname, '../..');
const python = process.env.PYTHON || (existsSync(join(root, '.venv/bin/python')) ? join(root, '.venv/bin/python') : 'python3');
const PARTS = ['P1-01', 'P1-02', 'P2-01'];
const DESIGN = { colors: Object.fromEntries(PARTS.map(id => [id, '#aBcD09'])), assignments: Object.fromEntries(PARTS.map(id => [id, 'pla-white'])) };
const NORMALIZED = { ...DESIGN, colors: Object.fromEntries(PARTS.map(id => [id, '#ABCD09'])), finishes: {} };
const mysql = process.env.DUCK_TEST_DATABASE_URL;

function guardedMySql(value: string): string {
  const url = new URL(value.replace(/^mysql\+pymysql:/, 'mysql:'));
  if (url.protocol !== 'mysql:' || !/^duck_test_[^/]+$/.test(decodeURIComponent(url.pathname.slice(1)))) throw new Error('Tests require a disposable MySQL database named duck_test_*');
  return value;
}
if (mysql) guardedMySql(mysql);

function checkError(code: string, message?: string) {
  return (error: unknown) => {
    assert.ok(error instanceof Invalid);
    assert.equal(error.code, code);
    if (message !== undefined) assert.equal(error.message, message);
    return true;
  };
}

function interceptRows(db: Database, observe: (sql: string, rows: Row[], connection: Connection) => Promise<void> | void): () => void {
  const original = db.transaction.bind(db);
  db.transaction = (body, write) => original(connection => body({
    dialect: connection.dialect,
    run: connection.run.bind(connection),
    rows: async (sql, params) => { const rows = await connection.rows(sql, params); await observe(sql, rows, connection); return rows; },
  }), write);
  return () => { db.transaction = original; };
}

for (const dialect of ['sqlite', 'mysql'] as const) describe(`${dialect} server storage contract`, { skip: dialect === 'mysql' && !mysql ? 'DUCK_TEST_DATABASE_URL not configured' : false }, () => {
  let directory: string, database: string, store: ServerStore;
  let a: Awaited<ReturnType<ServerStore['register']>>, b: Awaited<ReturnType<ServerStore['register']>>;
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'duck-server-test-'));
    database = dialect === 'sqlite' ? join(directory, 'server.db') : guardedMySql(mysql!);
    store = await ServerStore.open({ database, partIds: PARTS });
    if (dialect === 'mysql') await store.db.transaction(async conn => {
      for (const table of ['ratings', 'works', 'schemes', 'sessions', 'users', 'migration_runs']) await conn.run(`DELETE FROM ${table}`);
    }, true);
    a = await store.register('小鸭A', 'pass-a');
    b = await store.register('小鸭B', 'pass-b');
  });
  afterEach(async () => { await store?.close(); if (directory) await rm(directory, { recursive: true, force: true }); });

  test('passwords, session creation/logout and reopen preserve the original account contract', async () => {
    assert.match(a.token, /^[\w-]{43}$/);
    assert.match(a.user.id, /^u-[\da-f]{12}$/);
    assert.ok(AVATARS.includes(a.user.avatar)); assert.ok(COLORS.includes(a.user.color));
    const rows = await store.db.transaction(conn => conn.rows('SELECT pw_salt,pw_hash FROM users WHERE id = ?', [a.user.id]));
    assert.match(String(rows[0]!.pw_salt), /^[\da-f]{32}$/);
    assert.match(String(rows[0]!.pw_hash), /^[\da-f]{64}$/);
    await assert.rejects(store.login('小鸭A', 'wrong'), checkError('auth.invalid_credentials'));
    const login = await store.login('\u0085小鸭a\u3000', 'pass-a');
    assert.deepEqual(login.user, a.user);
    assert.deepEqual(await store.userFor(login.token), a.user);
    assert.equal(await store.userFor(null), null);
    assert.equal(await store.userFor(''), null);
    await store.logout(login.token); await store.logout(login.token);
    assert.equal(await store.userFor(login.token), null);
    await store.close(); store = await ServerStore.open({ database, partIds: PARTS });
    assert.deepEqual(await store.userFor(a.token), a.user);
  });

  test('account validation keeps ASCII-only case folding and Unicode codepoint limits', async () => {
    await assert.rejects(store.register('小鸭a', 'okay'), checkError('auth.name_taken'));
    for (const password of ['abc', '🦆🦆🦆', 1234, null]) await assert.rejects(store.register('Short', password), checkError('auth.password_short'));
    await assert.rejects(store.register(' \u0085', 'okay'), checkError('validation.4', '昵称不能为空'));
    const unicode = await store.register('\u001c' + '🦆'.repeat(22) + '\u3000', '🦆🦆🦆🦆');
    assert.equal(unicode.user.name, '🦆'.repeat(20));
    const upper = await store.register('Ä', 'okay'), lower = await store.register('ä', 'okay');
    assert.notEqual(upper.user.id, lower.user.id);
    const numeric = await store.register(parseWireJson('1.0'), 'okay');
    assert.equal(numeric.user.name, '1.0');
    assert.equal((await store.login(parseWireJson('1.0'), 'okay')).user.id, numeric.user.id);
    const coercion = await store.register(true, 'True');
    assert.equal((await store.login(true, true)).user.id, coercion.user.id);
  });

  test('profile updates are atomic and existing sessions accept a changed password', async () => {
    await assert.rejects(store.updateUser(a.user.id, { name: 'Changed', password: 'x' }), checkError('auth.password_short'));
    assert.deepEqual(await store.userFor(a.token), a.user);
    await assert.rejects(store.updateUser(a.user.id, { name: b.user.name }), checkError('auth.name_taken'));
    await assert.rejects(store.updateUser(a.user.id, { name: 'Changed', avatar: 'invalid' }), checkError('validation.8'));
    assert.deepEqual(await store.userFor(a.token), a.user);
    const updated = await store.updateUser(a.user.id, { name: '新名字', avatar: AVATARS[0], color: COLORS[0], password: 'new-password' });
    assert.deepEqual(updated, { ...a.user, name: '新名字', avatar: AVATARS[0], color: COLORS[0] });
    assert.deepEqual(await store.userFor(a.token), updated);
    await assert.rejects(store.login('新名字', 'pass-a'), checkError('auth.invalid_credentials'));
    assert.deepEqual((await store.login('新名字', 'new-password')).user, updated);
    assert.deepEqual(await store.updateUser(a.user.id, { password: [] }), updated);
  });

  test('private schemes preserve exact integers, Unicode/provenance, ordering and ownership', async () => {
    const data = parseWireJson('{"name":1.0,"voiceSalt":9007199254740993,"provenance":{"n":9007199254740993,"float":1.0,"note":"🦆"}}') as Record<string, unknown>;
    data.design = DESIGN;
    const first = await store.saveScheme(a.user.id, 's-1', data);
    assert.equal(first.name, '1.0'); assert.equal(first.voiceSalt, 9007199254740993n);
    assert.deepEqual(first.design, NORMALIZED);
    assert.equal((first.provenance as Record<string, unknown>).n, 9007199254740993n);
    assert.equal(pythonString(readJsonField(first.provenance as object, 'float')), '1.0');
    assert.deepEqual(await store.schemes(a.user.id), [first]); assert.deepEqual(await store.schemes(b.user.id), []);
    await assert.rejects(store.saveScheme(b.user.id, 's-1', { name: '偷', design: DESIGN }), checkError('schemes.not_owner'));
    await store.deleteScheme(b.user.id, 's-1'); assert.deepEqual(await store.schemes(a.user.id), [first]);
    const large = { note: '🦆'.repeat(25000), nested: [9007199254740993n] };
    await store.saveScheme(a.user.id, 's-2', { name: '大方案', design: DESIGN, provenance: large });
    assert.deepEqual((await store.schemes(a.user.id)).find(x => x.id === 's-2')!.provenance, large);
    await store.db.transaction(async c => { await c.run('UPDATE schemes SET updated = ? WHERE user_id = ?', [123, a.user.id]); }, true);
    assert.deepEqual((await store.schemes(a.user.id)).map(x => x.id), ['s-2', 's-1']);
    const update = await store.saveScheme(a.user.id, 's-1', { name: '改名', design: DESIGN, provenance: [] });
    assert.equal(update.created, first.created); assert.equal(update.provenance, null);
    await store.deleteScheme(a.user.id, 's-1'); assert.deepEqual((await store.schemes(a.user.id)).map(x => x.id), ['s-2']);
    await assert.rejects(store.saveScheme(a.user.id, '', { name: '坏', design: DESIGN }), checkError('validation.9'));
    await assert.rejects(store.saveScheme(a.user.id, 'bad', { name: '坏', design: { colors: {}, assignments: {} } }), checkError('validation.2'));
  });

  test('concurrent saves enforce account quota and allow updates when full', async () => {
    for (let i = 0; i < 29; i++) await store.saveScheme(a.user.id, `old-${i}`, { name: '旧', design: DESIGN });
    const result = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => store.saveScheme(a.user.id, `new-${i}`, { name: '新', design: DESIGN })));
    assert.equal(result.filter(x => x.status === 'fulfilled').length, 1);
    for (const item of result) if (item.status === 'rejected') assert.ok(checkError('validation.11')(item.reason));
    assert.equal((await store.schemes(a.user.id)).length, 30);
    assert.equal((await store.saveScheme(a.user.id, 'old-0', { name: '改', design: DESIGN })).name, '改');
  });

  test('two accounts racing to insert one scheme produce exactly one owner', async () => {
    let arrivals = 0, release: () => void = () => {};
    const barrier = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('The concurrent scheme saves did not overlap within 5 seconds')), 5000);
      timeout.unref(); release = () => { clearTimeout(timeout); resolve(); };
    });
    const stop = interceptRows(store.db, async (sql, rows) => {
      if (dialect === 'mysql' && /SELECT .* FROM schemes WHERE id = \?/i.test(sql) && rows.length === 0) { if (++arrivals === 2) release(); await barrier; }
    });
    try {
      const results = await Promise.allSettled([a, b].map(account => store.saveScheme(account.user.id, 'same-new-id', { name: '独有', design: DESIGN })));
      assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
      const rejected = results.find(x => x.status === 'rejected'); assert.ok(rejected?.status === 'rejected'); checkError('schemes.not_owner')(rejected.reason);
      const owned = await Promise.all([a, b].map(account => store.schemes(account.user.id)));
      assert.equal(owned.flat().length, 1);
    } finally { release(); stop(); }
  });

  test('publish, ratings, forks and deletion retain permissions and relationship behavior', async () => {
    const original = await store.publish(a.user.id, { title: ' 蓝白 ', description: ' 描述 ', design: DESIGN, schemeId: 'private', provenance: { source: '原作' } });
    assert.match(original.id, /^w-[\da-f]{12}$/); assert.equal(original.title, '蓝白'); assert.equal(original.description, '描述');
    assert.equal(original.schemeId, 'private'); assert.deepEqual(original.design, NORMALIZED);
    assert.deepEqual(original.rating, { count: 0, average: 0, mine: 0 });
    assert.equal((await store.work(original.id)).schemeId, null);
    await assert.rejects(store.rate(a.user.id, original.id, 5), checkError('validation.16'));
    for (const stars of [0, 6, true, '4', 4.1, parseWireJson('4.0'), readJsonField(parseWireJson('{"stars":4.0}') as object, 'stars')]) await assert.rejects(store.rate(b.user.id, original.id, stars), checkError('validation.17'));
    assert.deepEqual((await store.rate(b.user.id, original.id, readJsonField(parseWireJson('{"stars":5}') as object, 'stars'))).rating, { count: 1, average: 5, mine: 5 });
    assert.deepEqual((await store.rate(b.user.id, original.id, 4)).rating, { count: 1, average: 4, mine: 4 });
    assert.deepEqual((await store.rate(b.user.id, original.id, 2)).rating, { count: 1, average: 2, mine: 2 });
    const fork = await store.publish(b.user.id, { title: '改编', design: DESIGN, parentId: original.id });
    assert.equal(fork.parentId, original.id); assert.equal((await store.work(original.id)).forks, 1);
    const orphan = await store.publish(b.user.id, { title: '不存在来源', design: DESIGN, parentId: 'gone' }); assert.equal(orphan.parentId, null);
    await assert.rejects(store.deleteWork(b.user.id, original.id), checkError('validation.14'));
    await store.deleteWork(a.user.id, original.id);
    assert.equal((await store.work(fork.id)).parentId, null);
    assert.equal((await store.db.transaction(c => c.rows('SELECT * FROM ratings WHERE work_id = ?', [original.id]))).length, 0);
    await assert.rejects(store.work(original.id), checkError('validation.15'));
    await assert.rejects(store.rate(b.user.id, original.id, 3), checkError('validation.15'));
    await assert.rejects(store.deleteWork(a.user.id, original.id), checkError('validation.14'));
    await assert.rejects(store.publish(a.user.id, { title: '未匹配', design: { ...DESIGN, assignments: { ...DESIGN.assignments, 'P1-01': null } } }), checkError('validation.13'));
    const large = { note: '🦆'.repeat(25000) }; assert.deepEqual((await store.publish(a.user.id, { title: '长', design: DESIGN, provenance: large })).provenance, large);
  });

  test('gallery pagination, stable ordering and author filtering use at most four SELECTs', async () => {
    const original = await store.publish(a.user.id, { title: 'Root', design: DESIGN, schemeId: 'private' }); await store.rate(b.user.id, original.id, 4);
    for (let i = 0; i < 20; i++) await store.publish(b.user.id, { title: `Fork ${i}`, design: DESIGN, parentId: original.id });
    await store.db.transaction(c => c.run('UPDATE works SET created = ?', [42]), true);
    const statements: string[] = []; const stop = interceptRows(store.db, sql => { if (/^\s*SELECT/i.test(sql)) statements.push(sql); });
    let works;
    try { works = await store.works(b.user.id); } finally { stop(); }
    assert.ok(statements.length <= 4, `gallery used ${statements.length} queries`);
    const row = works.find(w => w.id === original.id)!;
    assert.deepEqual(row.rating, { count: 1, average: 4, mine: 4 }); assert.equal(row.forks, 20); assert.equal(row.schemeId, null);
    assert.deepEqual(works.map(w => w.id), works.map(w => w.id).sort().reverse());
    assert.deepEqual((await store.works(undefined, undefined, 3, 2)).map(w => w.id), works.slice(2, 5).map(w => w.id));
    assert.deepEqual((await store.works(a.user.id, a.user.id)).map(w => w.id), [original.id]);
    assert.equal((await store.works(undefined, undefined, 1, 500)).length, 0);
    for (const [limit, offset] of [[0, 0], [201, 0], [2, -1]]) await assert.rejects(store.works(undefined, undefined, limit, offset), checkError('request.pagination'));
  });

  test('concurrent ratings and forks cannot survive deletion with stale relationships', async () => {
    const work = await store.publish(a.user.id, { title: 'Race', design: DESIGN });
    const [fork, rating, deletion] = await Promise.allSettled([
      store.publish(b.user.id, { title: 'Concurrent fork', design: DESIGN, parentId: work.id }),
      store.rate(b.user.id, work.id, 4),
      store.deleteWork(a.user.id, work.id),
    ]);
    assert.equal(deletion.status, 'fulfilled'); assert.equal(fork.status, 'fulfilled');
    if (fork.status === 'fulfilled') assert.equal((await store.work(fork.value.id)).parentId, null);
    if (rating.status === 'rejected') checkError('validation.15')(rating.reason);
    assert.equal((await store.db.transaction(c => c.rows('SELECT * FROM ratings WHERE work_id = ?', [work.id]))).length, 0);
  });

  test('rating average matches Python binary rounding for exact and inexact decimal ties', async () => {
    const examples = [{ n: 40, threes: 27, result: 2.67 }, { n: 8, threes: 5, result: 2.62 }, { n: 8, threes: 1, result: 2.12 }];
    for (const [index, example] of examples.entries()) {
      const work = await store.publish(a.user.id, { title: `Round ${index}`, design: DESIGN });
      await store.db.transaction(async c => {
        for (let i = 0; i < example.n; i++) {
          const id = `rating-${index}-${i}`;
          await c.run('INSERT INTO users (id,name,name_key,pw_salt,pw_hash,avatar,color,created) VALUES (?,?,?,?,?,?,?,?)', [id, id, id, '00'.repeat(16), '00'.repeat(32), '🦆', '#4d6bfe', 0]);
          await c.run('INSERT INTO ratings (work_id,user_id,stars) VALUES (?,?,?)', [work.id, id, i < example.threes ? 3 : 2]);
        }
      }, true);
      assert.equal((await store.work(work.id)).rating.average, example.result);
    }
  });

  test('current Python errors and request coercions match in server use cases', async () => {
    const code = String.raw`
import sys,json,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(sys.argv[1])/'backend'))
from store import Store
from errors import payload
with tempfile.TemporaryDirectory() as d:
 s=Store(Path(d)/'oracle.db',part_ids=['P1-01','P1-02','P2-01']);u=s.register('Oracle','pass')['user']['id'];out=[]
 for case in json.load(sys.stdin):
  try:
   name,args=case['method'],case['args']
   if name in ('update_user','save_scheme','publish'):args=[u]+args
   result=getattr(s,name)(*args)
   out.append({'value':result['name'] if name=='update_user' else result})
  except Exception as e:out.append({'failure':payload(e)})
 s.close();print(json.dumps(out,ensure_ascii=False))
`;
    const cases = [
      { method: 'register', args: [null, 'pass'] }, { method: 'register', args: ['Empty', true] },
      { method: 'login', args: [[], {}] }, { method: 'update_user', args: [{ name: [] }] },
      { method: 'update_user', args: [{ avatar: [] }] }, { method: 'update_user', args: [{ password: true }] },
      { method: 'update_user', args: [[]] }, { method: 'publish', args: [[]] },
      { method: 'publish', args: [{ title: null, design: DESIGN }] },
      { method: 'publish', args: [{ title: 'Bad', design: null }] },
      { method: 'save_scheme', args: ['bad', []] },
      { method: 'save_scheme', args: ['bad', { name: 'Bad', design: DESIGN, voiceSalt: '3.5' }] },
    ];
    const run = spawnSync(python, ['-I', '-c', code, root], { input: JSON.stringify(cases), encoding: 'utf8' }); assert.equal(run.status, 0, run.stderr);
    const expected = JSON.parse(run.stdout); const actual: unknown[] = [];
    for (const entry of cases) {
      try {
        let result;
        if (entry.method === 'register') result = await store.register(entry.args[0], entry.args[1]);
        else if (entry.method === 'login') result = await store.login(entry.args[0], entry.args[1]);
        else if (entry.method === 'update_user') result = (await store.updateUser(a.user.id, entry.args[0])).name;
        else if (entry.method === 'save_scheme') result = await store.saveScheme(a.user.id, entry.args[0], entry.args[1]);
        else result = await store.publish(a.user.id, entry.args[0]);
        actual.push({ value: result });
      } catch (error) { actual.push({ failure: errorPayload(error) }); }
    }
    assert.deepEqual(actual, expected);
  });

  test('Python-created password/token work unchanged and Python reads TS profile, scheme and work writes', async () => {
    const create = String.raw`
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(sys.argv[1])/'backend'))
from store import Store
s=Store(database_url=sys.argv[2],part_ids=['P1-01','P1-02','P2-01']);a=s.register('旧鸭🦆','old-password');print(json.dumps(a,ensure_ascii=False));s.close()
`;
    const pythonTarget = dialect === 'mysql' ? database.replace(/^mysql:/, 'mysql+pymysql:') : 'sqlite:///' + database;
    const created = spawnSync(python, ['-I', '-c', create, root, pythonTarget], { encoding: 'utf8' }); assert.equal(created.status, 0, created.stderr);
    const account = JSON.parse(created.stdout);
    assert.deepEqual(await store.userFor(account.token), account.user);
    assert.deepEqual((await store.login('旧鸭🦆', 'old-password')).user, account.user);
    await store.updateUser(account.user.id, { name: '新鸭🦆', password: 'new-password' });
    const scheme = await store.saveScheme(account.user.id, 'python-roundtrip', { name: '往返🦆', design: DESIGN, voiceSalt: 9007199254740993n, provenance: { note: '🦆', n: 9007199254740993n } });
    const work = await store.publish(account.user.id, { title: 'TS作品', design: DESIGN, schemeId: scheme.id });
    const readback = String.raw`
import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(sys.argv[1])/'backend'))
from store import Store
s=Store(database_url=sys.argv[2],part_ids=['P1-01','P1-02','P2-01']);u=s.user_for(sys.argv[3]);assert u['name']=='新鸭🦆';assert s.login('新鸭🦆','new-password')['user']==u
x=s.schemes(u['id'])[0];assert x['name']=='往返🦆' and x['voiceSalt']==9007199254740993 and x['provenance']['n']==9007199254740993
w=s.work(sys.argv[4],u['id']);assert w['schemeId']==x['id'] and w['title']=='TS作品';s.close();print('python-readback-ok')
`;
    const read = spawnSync(python, ['-I', '-c', readback, root, pythonTarget, account.token, work.id], { encoding: 'utf8' }); assert.equal(read.status, 0, read.stderr); assert.match(read.stdout, /python-readback-ok/);
  });
});
