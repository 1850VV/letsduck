"""Legacy SQLite import must preserve identities and roll back incomplete copies."""
import hashlib
import importlib.util
import json
import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from store import Store

# Original seven-column users table deliberately has no new lookup key.
SCHEMA = '''
CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT UNIQUE COLLATE NOCASE,pw_salt TEXT,pw_hash TEXT,avatar TEXT,color TEXT,created INTEGER);
CREATE TABLE sessions(token TEXT PRIMARY KEY,user_id TEXT,created INTEGER);
CREATE TABLE schemes(id TEXT PRIMARY KEY,user_id TEXT,name TEXT,design TEXT,provenance TEXT,voice_salt INTEGER,created INTEGER,updated INTEGER);
CREATE TABLE works(id TEXT PRIMARY KEY,user_id TEXT,title TEXT,description TEXT,design TEXT,provenance TEXT,parent_id TEXT,scheme_id TEXT,created INTEGER);
CREATE TABLE ratings(work_id TEXT,user_id TEXT,stars INTEGER,PRIMARY KEY(work_id,user_id));
'''
DESIGN = {'colors': {'P1-01': '#FFFFFF'}, 'assignments': {'P1-01': 'pla-white'}, 'finishes': {}}


def legacy_database(path):
    conn = sqlite3.connect(path)
    conn.executescript(SCHEMA)
    salt = '01' * 16
    password = hashlib.pbkdf2_hmac('sha256', b'legacy-pass', bytes.fromhex(salt), 120_000).hex()
    conn.executemany('INSERT INTO users VALUES(?,?,?,?,?,?,?)', [
        ('u-a', 'Alpha', salt, password, '🦆', '#4d6bfe', 1720000000000),
        ('u-b', 'Beta', salt, password, '🐤', '#ff7a59', 1720000000001)])
    conn.executemany('INSERT INTO sessions VALUES(?,?,?)', [('retained-token-a', 'u-a', 1720000000002), ('retained-token-b', 'u-b', 1720000000003)])
    conn.execute('INSERT INTO schemes VALUES(?,?,?,?,?,?,?,?)', ('s-old','u-a','方案🦆',json.dumps(DESIGN),'{"workId":"official-1"}',17,1720000000004,1720000000005))
    conn.executemany('INSERT INTO works VALUES(?,?,?,?,?,?,?,?,?)', [
        ('w-root','u-a','原作🦆','保留描述',json.dumps(DESIGN),None,None,'s-old',1720000000006),
        ('w-fork','u-b','改编','',json.dumps(DESIGN),'{"workId":"w-root"}','w-root',None,1720000000007)])
    conn.execute('INSERT INTO ratings VALUES(?,?,?)', ('w-root','u-b',4))
    conn.commit()
    conn.close()


class MigrationTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.source = Path(self.tmp.name) / 'legacy.db'
        legacy_database(self.source)
        self.target = 'sqlite:///' + self.tmp.name + '/target.db'

    def tearDown(self):
        self.tmp.cleanup()

    def migrate(self, **kwargs):
        self.assertIsNotNone(importlib.util.find_spec('migrate_database'), 'verified SQLite migration is missing')
        from migrate_database import migrate_sqlite
        return migrate_sqlite(self.source, self.target, **kwargs)

    def test_import_preserves_every_row_hash_token_and_relationship(self):
        source_hash = hashlib.sha256(self.source.read_bytes()).hexdigest()
        result = self.migrate(backup=Path(self.tmp.name) / 'backup.db')
        self.assertEqual(result['counts'], {'users': 2, 'sessions': 2, 'schemes': 1, 'works': 2, 'ratings': 1})
        self.assertEqual(result['status'], 'migrated')
        self.assertEqual(hashlib.sha256(self.source.read_bytes()).hexdigest(), source_hash)
        self.assertTrue(Path(result['backup']).is_file())
        store = Store(database_url=self.target)
        try:
            self.assertEqual(store.user_for('retained-token-a')['id'], 'u-a')
            self.assertEqual(store.login('alpha', 'legacy-pass')['user']['id'], 'u-a')
            scheme = store.schemes('u-a')[0]
            self.assertEqual((scheme['voiceSalt'],scheme['created'],scheme['updated']), (17,1720000000004,1720000000005))
            self.assertEqual(scheme['provenance'], {'workId': 'official-1'})
            self.assertEqual(store.work('w-root','u-b')['rating'], {'count':1,'average':4.0,'mine':4})
            self.assertEqual(store.work('w-root')['forks'], 1)
            self.assertEqual(store.work('w-fork')['parentId'], 'w-root')
        finally:
            store.close()

    def test_repeat_is_idempotent_and_never_merges_into_nonempty_database(self):
        self.assertEqual(self.migrate()['status'], 'migrated')
        self.assertEqual(self.migrate()['status'], 'already_migrated')
        store = Store(database_url=self.target)
        try:
            store.register('New', 'new-pass')
        finally:
            store.close()
        with self.assertRaises(ValueError):
            self.migrate()
        other = Path(self.tmp.name) / 'other.db'
        legacy_database(other)
        with sqlite3.connect(other) as conn:
            conn.execute("UPDATE users SET name='Changed' WHERE id='u-a'")
        from migrate_database import migrate_sqlite
        with self.assertRaises(ValueError):
            migrate_sqlite(other, self.target)

    def test_invalid_source_rolls_back_every_imported_table(self):
        with sqlite3.connect(self.source) as conn:
            conn.execute('UPDATE ratings SET stars=9')
        with self.assertRaises(ValueError):
            self.migrate()
        from sqlalchemy import func, select
        from database import metadata
        store = Store(database_url=self.target)
        try:
            with store.engine.connect() as conn:
                self.assertTrue(all(conn.scalar(select(func.count()).select_from(t)) == 0 for t in metadata.sorted_tables))
        finally:
            store.close()

    def test_existing_sqlite_upgrades_without_losing_legacy_accounts(self):
        store = Store(self.source)
        try:
            self.assertEqual(store.user_for('retained-token-a')['id'], 'u-a')
            self.assertEqual(store.login('ALPHA','legacy-pass')['user']['id'], 'u-a')
            self.assertEqual(store.schemes('u-a')[0]['name'], '方案🦆')
            backups = list((self.source.parent / 'backups').glob('*.db'))
            self.assertEqual(len(backups), 1, 'in-place schema upgrade needs a consistent SQLite backup')
            with sqlite3.connect(backups[0]) as conn:
                self.assertEqual(conn.execute('SELECT COUNT(*) FROM users').fetchone()[0], 2)
        finally:
            store.close()

    def test_interrupted_lookup_key_upgrade_is_repaired_on_restart(self):
        with sqlite3.connect(self.source) as conn:
            conn.execute('ALTER TABLE users ADD COLUMN name_key VARCHAR(80)')
        store = Store(self.source)
        try:
            self.assertEqual(store.login('ALPHA','legacy-pass')['user']['id'], 'u-a')
        finally:
            store.close()


if __name__ == '__main__':
    unittest.main()
