import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { TestContext } from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const design = { colors: { p: '#abcdef' }, assignments: { p: null }, finishes: { p: 'matte' } };
const normalizedDesign = { colors: { p: '#ABCDEF' }, assignments: { p: null }, finishes: { p: 'matte' } };
const data = { name: ' 我的方案 🦆 ', design, voiceSalt: 7, provenance: { author: '示例' } };
const python = process.env.PYTHON || (existsSync(join(root, '.venv/bin/python')) ? join(root, '.venv/bin/python') : 'python3');

async function storage() {
  assert.ok(existsSync(join(root, 'packages/storage/src/personal.ts')), 'Personal SQLite adapter is not implemented');
  return await import('../../packages/storage/src/personal.js');
}
function temp(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'letsduck-personal-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}
function query(path: string, sql: string) {
  const db = new DatabaseSync(path);
  try { return db.prepare(sql).all(); } finally { db.close(); }
}
function pythonRun(path: string, code: string, input?: unknown): unknown {
  const source = `import sys,json,sqlite3\nfrom pathlib import Path\nsys.path[:0]=[str(Path(sys.argv[1])/'personal'),str(Path(sys.argv[1])/'backend')]\nfrom schemes import PersonalStore\np=Path(sys.argv[2])\n${code}`;
  const run = spawnSync(python, ['-I', '-c', source, root, path], { input: JSON.stringify(input ?? null), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trim() ? JSON.parse(run.stdout) : undefined;
}

test('personal schemes survive reopen, preserve created time, normalize design and sort deterministically', async t => {
  const { PersonalStore } = await storage(), path = join(temp(t), 'nested', 'personal.db');
  let store = new PersonalStore({ path, partIds: ['p'] });
  try {
    const saved = store.saveScheme('a', data);
    assert.equal(saved.name, '我的方案 🦆');
    assert.deepEqual(saved.design, normalizedDesign);
    assert.equal(saved.voiceSalt, 7);
    store.saveScheme('b', data);
    store.close();
    store = new PersonalStore({ path, partIds: ['p'] });
    const renamed = store.saveScheme('a', { ...data, name: '改名' });
    assert.equal(renamed.created, saved.created);
    assert.equal(renamed.name, '改名');
    const db = new DatabaseSync(path);
    try { db.exec('UPDATE schemes SET updated=123'); } finally { db.close(); }
    assert.deepEqual(store.schemes().map(scheme => scheme.id), ['b', 'a']);
    store.deleteScheme('missing'); store.deleteScheme('b');
    assert.deepEqual(store.schemes().map(scheme => scheme.id), ['a']);
  } finally { store.close(); }
  assert.deepEqual(query(path, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").map(row => row.name), ['schemes', 'servo_preparation', 'servo_setup']);
  assert.equal(query(path, 'PRAGMA journal_mode')[0]?.journal_mode, 'wal');
  assert.equal(query(path, 'PRAGMA integrity_check')[0]?.integrity_check, 'ok');
});

test('personal quota rejects only new schemes and failed validation leaves saved data unchanged', async t => {
  const { PersonalStore } = await storage(), store = new PersonalStore({ path: join(temp(t), 'personal.db'), partIds: ['p'] });
  try {
    for (let i = 0; i < 30; i++) store.saveScheme('s' + i, data);
    assert.throws(() => store.saveScheme('overflow', data), { code: 'validation.11', params: { v0: 30 } });
    const renamed = store.saveScheme('s0', { ...data, name: 'Quota rename' });
    assert.equal(renamed.name, 'Quota rename');
    const before = store.schemes();
    assert.throws(() => store.saveScheme('s0', { ...data, design: { colors: { p: 'red' }, assignments: { p: null } } }), { code: 'validation.18' });
    assert.deepEqual(store.schemes(), before);
    store.deleteScheme('s1');
    store.saveScheme('replacement', data);
    assert.equal(store.schemes().length, 30);
  } finally { store.close(); }
});

test('servo records keep board identity, numeric order, replacement and most recently written board', async t => {
  const { PersonalStore } = await storage(), path = join(temp(t), 'personal.db');
  let store = new PersonalStore({ path });
  try {
    assert.deepEqual(store.servoRecords(), []);
    store.saveServoRecord('板卡 A', { id: 20, state: 'reported', details: { serial: 'A🦆', n: 9007199254740993n } });
    store.saveServoRecord('板卡 A', { id: 10, state: 'verified' });
    store.saveServoRecord('板卡 B', { id: 30, state: 'review' });
    const db = new DatabaseSync(path);
    try { db.exec("UPDATE servo_setup SET updated=1 WHERE board='板卡 A'; UPDATE servo_setup SET updated=2 WHERE board='板卡 B'"); } finally { db.close(); }
    assert.deepEqual(store.servoRecords(), [{ id: 30, state: 'review' }]);
    assert.deepEqual(store.servoRecords(''), []);
    assert.deepEqual(store.servoRecords('板卡 A').map(record => record.id), [10, 20]);
    store.saveServoRecord('板卡 A', { id: 10, state: 'review', original: false });
    store.close(); store = new PersonalStore({ path });
    assert.deepEqual(store.servoRecords('板卡 A'), [{ id: 10, state: 'review', original: false }, { id: 20, state: 'reported', details: { serial: 'A🦆', n: 9007199254740993n } }]);
  } finally { store.close(); }
});

test('preparation defaults and partial updates persist independently of numbering and schemes', async t => {
  const { PersonalStore } = await storage(), path = join(temp(t), 'personal.db');
  let store = new PersonalStore({ path });
  try {
    const scheme = store.saveScheme('saved', data), record = { id: 10, state: 'verified', readback: { ok: true } };
    store.saveServoRecord('board', record);
    assert.deepEqual(store.servoPreparationRecords(), []);
    const initial = store.saveServoPreparation([{ id: 14 }, { id: 12, state: 'picked', preparedLeads: ['线🦆'] }]);
    assert.deepEqual(initial.map(({ id, state, preparedLeads }) => ({ id, state, preparedLeads })), [{ id: 12, state: 'picked', preparedLeads: ['线🦆'] }, { id: 14, state: 'available', preparedLeads: [] }]);
    store.saveServoPreparation([{ id: 12, state: 'installed' }, { id: 14, preparedLeads: ['short'] }]);
    store.close(); store = new PersonalStore({ path });
    assert.deepEqual(store.servoPreparationRecords().map(({ id, state, preparedLeads }) => ({ id, state, preparedLeads })), [{ id: 12, state: 'installed', preparedLeads: ['线🦆'] }, { id: 14, state: 'available', preparedLeads: ['short'] }]);
    assert.deepEqual(store.servoRecords('board'), [record]);
    assert.deepEqual(store.schemes(), [scheme]);
    assert.equal(store.saveServoPreparation([]).length, 2);
  } finally { store.close(); }
});

test('a failed preparation batch rolls back earlier rows and leaves the connection usable', async t => {
  const { PersonalStore } = await storage(), store = new PersonalStore({ path: join(temp(t), 'personal.db') });
  try {
    store.saveServoPreparation([{ id: 10, state: 'picked' }]);
    const before = store.servoPreparationRecords();
    assert.throws(() => store.saveServoPreparation([{ id: 10, state: 'installed' }, { id: 12, state: null }]));
    assert.deepEqual(store.servoPreparationRecords(), before);
    assert.equal(store.saveServoPreparation([{ id: 10, state: 'available' }])[0]?.state, 'available');
  } finally { store.close(); }
});

test('SQLite integer overflow is rejected without rounding, partial batches or stale transactions', async t => {
  const { PersonalStore } = await storage(), store = new PersonalStore({ path: join(temp(t), 'personal.db') });
  try {
    assert.throws(() => store.saveScheme('overflow', { ...data, voiceSalt: '9223372036854775808' }), RangeError);
    assert.deepEqual(store.schemes(), []);
    assert.throws(() => store.saveServoRecord('board', { id: 9223372036854775808n }), RangeError);
    assert.throws(() => store.saveServoPreparation([{ id: 10, state: 'picked' }, { id: -9223372036854775809n }]), RangeError);
    assert.deepEqual(store.servoPreparationRecords(), []);
    assert.equal(store.saveScheme('valid', data).voiceSalt, 7);
  } finally { store.close(); }
});

test('Python-created records in all three tables retain exact integers through Node edits and old Python reads', async t => {
  const { PersonalStore } = await storage(), path = join(temp(t), 'personal.db');
  pythonRun(path, `s=PersonalStore(p,part_ids=['p'])\ns.save_scheme('python',dict(name='Python🦆',design=dict(colors={'p':'#abcdef'},assignments={'p':None}),voiceSalt=9007199254740993,provenance={'nested':9007199254740995}))\ns.save_servo_record('Python板',dict(id=10,state='verified',evidence={'counter':9007199254740997}))\ns.save_servo_preparation([dict(id=12,state='picked',preparedLeads=['线'])])\ns.db.execute('UPDATE schemes SET created=?,updated=?',(9007199254740999,9007199254741001))\ns.db.execute('UPDATE servo_preparation SET updated=?',(9007199254741003,))\ns.close()`);
  const store = new PersonalStore({ path, partIds: ['p'] });
  try {
    const saved = store.schemes()[0]!;
    assert.equal(saved.voiceSalt, 9007199254740993n);
    assert.equal(saved.created, 9007199254740999n);
    assert.equal(saved.updated, 9007199254741001n);
    assert.deepEqual(saved.provenance, { nested: 9007199254740995n });
    assert.deepEqual(store.servoRecords('Python板'), [{ id: 10, state: 'verified', evidence: { counter: 9007199254740997n } }]);
    assert.equal(store.servoPreparationRecords()[0]?.updatedAt, 9007199254741003n);
    store.saveScheme('python', { ...saved, name: 'Node🦆' });
    store.saveServoRecord('Node板', { id: 20, state: 'review', evidence: { counter: -9007199254741005n } });
    store.saveServoPreparation([{ id: 12, state: 'installed' }, { id: 14, preparedLeads: [9007199254741007n] }]);
  } finally { store.close(); }
  const result = pythonRun(path, `s=PersonalStore(p,part_ids=['p'])\nv=s.schemes()[0]\nassert v['name']=='Node🦆' and v['voiceSalt']==9007199254740993 and v['created']==9007199254740999\nassert v['provenance']=={'nested':9007199254740995}\nassert s.servo_records('Python板')[0]['evidence']['counter']==9007199254740997\nassert s.servo_records('Node板')[0]['evidence']['counter']==-9007199254741005\nr=s.servo_preparation_records()\nassert [(v['id'],v['state'],v['preparedLeads']) for v in r]==[(12,'installed',['线']),(14,'available',[9007199254741007])]\nassert s.db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'\nprint(json.dumps({'schemes':len(s.schemes()),'servo':s.db.execute('SELECT count(*) FROM servo_setup').fetchone()[0],'preparation':len(r)}))\ns.close()`);
  assert.deepEqual(result, { schemes: 1, servo: 2, preparation: 2 });
});

test('fresh stores import only the latest 30 legacy-owner schemes without writing the source', async t => {
  const { PersonalStore } = await storage(), directory = temp(t), legacy = join(directory, 'legacy.db'), path = join(directory, 'personal.db');
  pythonRun(legacy, `db=sqlite3.connect(p)\ndb.execute('CREATE TABLE schemes(id TEXT PRIMARY KEY,user_id TEXT,name TEXT,design TEXT,provenance TEXT,voice_salt INTEGER,created INTEGER,updated INTEGER)')\nfor n in range(35):\n db.execute('INSERT INTO schemes VALUES(?,?,?,?,?,?,?,?)',('old-%02d'%n,'personal-owner','旧🦆',json.dumps({'colors':{},'assignments':{}}),json.dumps({'n':9007199254740993}),9007199254740995,9007199254740997,n))\ndb.execute('INSERT INTO schemes VALUES(?,?,?,?,?,?,?,?)',('other','another-owner','Other','{}',None,0,1,999))\ndb.commit();db.close()`);
  const before = readFileSync(legacy);
  let store = new PersonalStore({ path, legacy });
  try {
    assert.equal(store.imported, 30);
    assert.equal(store.schemes()[0]?.id, 'old-34');
    assert.equal(store.schemes().at(-1)?.id, 'old-05');
    assert.equal(store.schemes()[0]?.voiceSalt, 9007199254740995n);
    assert.equal(store.schemes()[0]?.created, 9007199254740997n);
    assert.deepEqual(store.schemes()[0]?.provenance, { n: 9007199254740993n });
    for (const scheme of store.schemes()) store.deleteScheme(scheme.id);
    store.close(); store = new PersonalStore({ path, legacy });
    assert.equal(store.imported, 0);
    assert.deepEqual(store.schemes(), []);
  } finally { store.close(); }
  assert.deepEqual(readFileSync(legacy), before);
});

test('missing, malformed and ownerless legacy sources are ignored, and existing empty files never import', async t => {
  const { PersonalStore } = await storage(), directory = temp(t);
  for (const [index, legacy] of [join(directory, 'missing.db'), join(directory, 'malformed.db'), join(directory, 'ownerless.db')].entries()) {
    if (index === 1) writeFileSync(legacy, 'not SQLite');
    if (index === 2) { const db = new DatabaseSync(legacy); try { db.exec('CREATE TABLE schemes(id TEXT)'); } finally { db.close(); } }
    const store = new PersonalStore({ path: join(directory, 'new-' + index + '.db'), legacy });
    try { assert.equal(store.imported, 0); assert.deepEqual(store.schemes(), []); } finally { store.close(); }
  }
  const legacy = join(directory, 'valid.db');
  pythonRun(legacy, `db=sqlite3.connect(p)\ndb.execute('CREATE TABLE schemes(id TEXT,user_id TEXT,name TEXT,design TEXT,provenance TEXT,voice_salt INTEGER,created INTEGER,updated INTEGER)')\ndb.execute("INSERT INTO schemes VALUES('old','personal-owner','old','{}',NULL,0,1,2)")\ndb.commit();db.close()`);
  const existing = join(directory, 'already-exists.db'); writeFileSync(existing, '');
  const store = new PersonalStore({ path: existing, legacy });
  try { assert.equal(store.imported, 0); assert.deepEqual(store.schemes(), []); } finally { store.close(); }
});

test('default paths preserve the original macOS, Windows, Linux and environment conventions', async () => {
  const { defaultPersonalPath } = await storage();
  assert.equal(defaultPersonalPath('darwin', {}, '/home/example'), '/home/example/Library/Application Support/DoodleDuck/personal.db');
  assert.equal(defaultPersonalPath('linux', {}, '/home/example'), '/home/example/.local/share/doodleduck/personal.db');
  assert.equal(defaultPersonalPath('linux', { XDG_DATA_HOME: '/tmp/xdg' }, '/home/example'), '/tmp/xdg/doodleduck/personal.db');
  assert.equal(defaultPersonalPath('win32', {}, 'C:\\Users\\example'), 'C:\\Users\\example\\AppData\\Roaming\\DoodleDuck\\personal.db');
  assert.equal(defaultPersonalPath('win32', { APPDATA: 'D:\\Profile' }, 'C:\\Users\\example'), 'D:\\Profile\\DoodleDuck\\personal.db');
  assert.equal(defaultPersonalPath('darwin', { DUCK_PERSONAL_DB: './custom.db' }, '/home/example'), './custom.db');
  assert.equal(defaultPersonalPath('linux', { DUCK_PERSONAL_DB: '', XDG_DATA_HOME: '' }, '/home/example'), '/home/example/.local/share/doodleduck/personal.db');
});

test('closing the personal store releases its database and permits repeated cleanup like Python', async t => {
  const { PersonalStore } = await storage(), store = new PersonalStore({ path: join(temp(t), 'personal.db') });
  store.close();
  assert.throws(() => store.schemes());
  assert.doesNotThrow(() => store.close());
});

test('personal SQLite preserves the Python five-second busy wait', async t => {
  const { PersonalStore } = await storage(), path = join(temp(t), 'personal.db');
  assert.equal(pythonRun(path, "s=PersonalStore(p)\nprint(s.db.execute('PRAGMA busy_timeout').fetchone()[0])\ns.close()"), 5000);
  const store = new PersonalStore({ path });
  try { assert.equal(store.db.prepare('PRAGMA busy_timeout').get()?.timeout, 5000); }
  finally { store.close(); }
});
