import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { PersonalStore, defaultDatabasePath } from '../src/services/schemes.js';
import { validateDesign } from '../src/rules.js';

const design = { colors: { a: '#aabbcc', b: '#112233' }, assignments: { a: 'pla', b: null }, finishes: { a: 'matte', other: 'silk' } };

test('normalizes colors and retains only known finish assignments', () => {
  assert.deepEqual(validateDesign(design, ['a', 'b']), { ...design, colors: { a: '#AABBCC', b: '#112233' }, finishes: { a: 'matte' } });
  for (const [input, code] of [[null, 'validation.1'], [{ ...design, colors: { a: '#ffffff' } }, 'validation.2'], [{ ...design, colors: { a: 'white', b: '#112233' } }, 'validation.18'], [{ ...design, finishes: { a: 'metal' } }, 'validation.3']] as const) {
    assert.throws(() => validateDesign(input, ['a', 'b']), (e: any) => e.code === code);
  }
});

test('opens a Python-created personal database and preserves existing identity and timestamps on update', () => {
  const dir = mkdtempSync(join(tmpdir(), 'duck-schemes-')); const path = join(dir, 'personal.db');
  execFileSync(process.env.PYTHON || 'python3', ['-c', `import sqlite3,sys,json
c=sqlite3.connect(sys.argv[1]);c.execute('CREATE TABLE schemes(id TEXT PRIMARY KEY,name TEXT NOT NULL,design TEXT NOT NULL,provenance TEXT,voice_salt INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL,updated INTEGER NOT NULL)')
c.execute('INSERT INTO schemes VALUES(?,?,?,?,?,?,?)',('original','原方案',json.dumps(json.loads(sys.argv[2])),json.dumps({'author':'示例'}),17,100,200));c.commit();c.close()`, path, JSON.stringify(design)]);
  let store: PersonalStore | undefined;
  try {
    store = new PersonalStore(path, ['a', 'b']);
    assert.equal(store.schemes()[0]!.created, 100);
    const row = store.save('original', { name: ' 修改 ', design, voiceSalt: 23, provenance: { author: '示例' } });
    assert.equal(row.created, 100); assert.equal(row.name, '修改'); assert.equal(row.voiceSalt, 23);
    store.close(); store = undefined;
    const output = execFileSync(process.env.PYTHON || 'python3', ['-c', "import sqlite3,sys,json;c=sqlite3.connect(sys.argv[1]);print(json.dumps(c.execute('SELECT name,voice_salt,created FROM schemes').fetchone()))", path], { encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), ['修改', 23, 100]);
  } finally { store?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('limits new schemes to 30 but allows overwriting and deleting at capacity', () => {
  const store = new PersonalStore(':memory:', ['a', 'b']);
  try {
    for (let i = 0; i < 30; i++) store.save(`s${i}`, { name: `${i}`, design });
    assert.throws(() => store.save('extra', { name: '满了', design }), (e: any) => e.code === 'validation.11');
    store.save('s0', { name: '覆盖', design }); store.delete('s1');
    store.save('extra', { name: '补充', design }); assert.equal(store.schemes().length, 30);
    assert.throws(() => store.save('bad', { name: '', design }), (e: any) => e.code === 'validation.4');
    assert.throws(() => store.save('s0', { name: '保留', design, voiceSalt: '1e3' }));
    assert.equal(store.schemes().find(s => s.id === 's0')!.name, '覆盖');
  } finally { store.close(); }
});

test('keeps the original macOS and Windows database locations', () => {
  assert.equal(defaultDatabasePath('darwin', '/users/test', {}), '/users/test/Library/Application Support/DoodleDuck/personal.db');
  assert.equal(defaultDatabasePath('win32', 'C:\\Users\\test', { APPDATA: 'C:\\Users\\test\\AppData\\Roaming' }), 'C:\\Users\\test\\AppData\\Roaming\\DoodleDuck\\personal.db');
  assert.equal(defaultDatabasePath('darwin', '/users/test', { DUCK_PERSONAL_DB: '/tmp/explicit.db' }), '/tmp/explicit.db');
});
