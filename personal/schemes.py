"""Personal edition storage: named schemes in one local SQLite file. Python standard library only.

The file lives in the user's data folder, not the app folder, so unzipping a newer version keeps it.
"""
import json
import os
import sqlite3
import sys
import threading
import time
from pathlib import Path

from rules import MAX_SCHEMES, Invalid, scheme_values

SCHEMA = '''CREATE TABLE IF NOT EXISTS schemes(id TEXT PRIMARY KEY, name TEXT NOT NULL, design TEXT NOT NULL,
  provenance TEXT, voice_salt INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL)'''
# The earlier all-in-one backend kept personal schemes under this storage owner.
LEGACY_OWNER = 'personal-owner'


def default_path():
    if os.environ.get('DUCK_PERSONAL_DB'):
        return Path(os.environ['DUCK_PERSONAL_DB'])
    home = Path.home()
    if sys.platform == 'darwin':
        base = home / 'Library' / 'Application Support' / 'DoodleDuck'
    elif os.name == 'nt':
        base = Path(os.environ.get('APPDATA') or home / 'AppData' / 'Roaming') / 'DoodleDuck'
    else:
        base = Path(os.environ.get('XDG_DATA_HOME') or home / '.local' / 'share') / 'doodleduck'
    return base / 'personal.db'


class PersonalStore:
    def __init__(self, path=None, part_ids=(), legacy=None):
        self.path = Path(path or default_path())
        self.path.parent.mkdir(parents=True, exist_ok=True)
        fresh = not self.path.exists()
        self.db = sqlite3.connect(str(self.path), check_same_thread=False, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute(SCHEMA)
        self.db.execute('CREATE TABLE IF NOT EXISTS servo_setup(board TEXT NOT NULL, id INTEGER NOT NULL, record TEXT NOT NULL, '
                        'updated INTEGER NOT NULL, PRIMARY KEY(board,id))')
        self.db.execute('CREATE TABLE IF NOT EXISTS servo_preparation(id INTEGER PRIMARY KEY, state TEXT NOT NULL, '
                        'prepared_leads TEXT NOT NULL, updated INTEGER NOT NULL)')
        self.lock = threading.Lock()
        self.part_ids = set(part_ids or ())
        self.imported = self._import_legacy(Path(legacy)) if fresh and legacy and Path(legacy).is_file() else 0

    def close(self):
        self.db.close()

    @staticmethod
    def _now():
        return int(time.time() * 1000)

    @staticmethod
    def scheme_json(row):
        return {'id': row['id'], 'name': row['name'], 'design': json.loads(row['design']),
                'provenance': json.loads(row['provenance']) if row['provenance'] else None,
                'voiceSalt': row['voice_salt'], 'created': row['created'], 'updated': row['updated']}

    def schemes(self):
        with self.lock:
            rows = self.db.execute('SELECT * FROM schemes ORDER BY updated DESC, id DESC').fetchall()
        return [self.scheme_json(r) for r in rows]

    def save_scheme(self, sid, data):
        v = scheme_values(sid, data, self.part_ids)
        now = self._now()
        values = (v['name'], json.dumps(v['design']), json.dumps(v['provenance'], ensure_ascii=False) if v['provenance'] else None, v['voiceSalt'])
        with self.lock:
            self.db.execute('BEGIN IMMEDIATE')
            try:
                if self.db.execute('SELECT 1 FROM schemes WHERE id=?', (sid,)).fetchone():
                    self.db.execute('UPDATE schemes SET name=?, design=?, provenance=?, voice_salt=?, updated=? WHERE id=?', (*values, now, sid))
                else:
                    if self.db.execute('SELECT COUNT(*) FROM schemes').fetchone()[0] >= MAX_SCHEMES:
                        raise Invalid('最多保存 %d 套方案，先删掉一些' % MAX_SCHEMES, code='validation.11', params={'v0': MAX_SCHEMES})
                    self.db.execute('INSERT INTO schemes VALUES(?,?,?,?,?,?,?)', (sid, *values, now, now))
                row = self.db.execute('SELECT * FROM schemes WHERE id=?', (sid,)).fetchone()
                self.db.execute('COMMIT')
            except BaseException:
                self.db.execute('ROLLBACK')
                raise
        return self.scheme_json(row)

    def delete_scheme(self, sid):
        with self.lock:
            self.db.execute('DELETE FROM schemes WHERE id=?', (sid,))

    def servo_records(self, board=None):
        with self.lock:
            if board is None:
                last = self.db.execute('SELECT board FROM servo_setup ORDER BY updated DESC LIMIT 1').fetchone()
                board = last['board'] if last else ''
            rows = self.db.execute('SELECT record FROM servo_setup WHERE board=? ORDER BY id', (board,)).fetchall()
        return [json.loads(r['record']) for r in rows]

    def save_servo_record(self, board, record):
        with self.lock:
            self.db.execute('INSERT OR REPLACE INTO servo_setup VALUES(?,?,?,?)',
                            (board, record['id'], json.dumps(record, ensure_ascii=False), self._now()))

    @staticmethod
    def preparation_json(row):
        return dict(id=row['id'], state=row['state'], preparedLeads=json.loads(row['prepared_leads']), updatedAt=row['updated'])

    def servo_preparation_records(self):
        with self.lock:
            return [self.preparation_json(row) for row in self.db.execute('SELECT * FROM servo_preparation ORDER BY id')]

    def save_servo_preparation(self, updates):
        with self.lock:
            self.db.execute('BEGIN IMMEDIATE')
            try:
                for update in updates:
                    old = self.db.execute('SELECT * FROM servo_preparation WHERE id=?', (update['id'],)).fetchone()
                    state = update.get('state', old['state'] if old else 'available')
                    leads = json.dumps(update['preparedLeads']) if 'preparedLeads' in update else old['prepared_leads'] if old else '[]'
                    self.db.execute('INSERT OR REPLACE INTO servo_preparation VALUES(?,?,?,?)',
                                    (update['id'], state, leads, self._now()))
                self.db.execute('COMMIT')
            except BaseException:
                self.db.execute('ROLLBACK')
                raise
            return [self.preparation_json(row) for row in self.db.execute('SELECT * FROM servo_preparation ORDER BY id')]

    def _import_legacy(self, legacy):
        """One-time copy of schemes saved by the earlier personal mode (read-only on the old file)."""
        try:
            with sqlite3.connect(legacy.resolve().as_uri() + '?mode=ro', uri=True) as old:
                rows = old.execute('SELECT id, name, design, provenance, voice_salt, created, updated FROM schemes WHERE user_id=? '
                                   'ORDER BY updated DESC LIMIT ?', (LEGACY_OWNER, MAX_SCHEMES)).fetchall()
        except sqlite3.Error:
            return 0
        with self.lock:
            self.db.executemany('INSERT OR IGNORE INTO schemes VALUES(?,?,?,?,?,?,?)', rows)
        return len(rows)
