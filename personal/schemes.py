"""Personal edition storage: named schemes in one local SQLite file. Python standard library only.

The file lives in the user's data folder, not the app folder, so unzipping a newer version keeps it.
"""
import json
import uuid
from backup import seal, validate, digest
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
        self.lock = threading.Lock()
        self.db.execute('CREATE TABLE IF NOT EXISTS backup_recovery(id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, after_revision TEXT NOT NULL)')
        self.part_ids = set(part_ids or ())
        self.imported = self._import_legacy(Path(legacy)) if fresh and legacy and Path(legacy).is_file() else 0

    def close(self):
        self.db.close()

    @staticmethod
    def _now():
        return int(time.time() * 1000)

    @staticmethod
    def scheme_json(row):
        value = {'id': row['id'], 'name': row['name'], 'design': json.loads(row['design']),
                'provenance': json.loads(row['provenance']) if row['provenance'] else None,
                'voiceSalt': row['voice_salt'], 'created': row['created'], 'updated': row['updated']}
        value['revision'] = digest(value)
        return value

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
                existing = self.db.execute('SELECT * FROM schemes WHERE id=?', (sid,)).fetchone()
                if 'expectedRevision' in data and data['expectedRevision'] != (self.scheme_json(existing)['revision'] if existing else None):
                    raise ValueError('backup.stale')
                if existing:
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

    def delete_scheme(self, sid, expected=None):
        with self.lock:
            row = self.db.execute('SELECT * FROM schemes WHERE id=?', (sid,)).fetchone()
            if expected is not None and expected != (self.scheme_json(row)['revision'] if row else None): raise ValueError('backup.stale')
            self.db.execute('DELETE FROM schemes WHERE id=?', (sid,))

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

    def _rows(self):
        return [self.scheme_json(r) for r in self.db.execute('SELECT * FROM schemes ORDER BY id')]

    def export_backup(self, browser):
        with self.lock:
            value = seal(self._rows(), browser)
            validate(value, self.part_ids)
            return value

    def preview_backup(self, bundle):
        value = validate(bundle, self.part_ids)
        with self.lock:
            rows = self._rows()
            return {'revision': digest(rows), 'conflicts': [
                {'incoming': incoming, 'existing': row} for incoming in value['schemes']
                for row in rows if incoming['name'] == row['name']],
                'schemes': len(value['schemes']), 'draft': value['browser']['draft'] is not None,
                'progress': len(value['browser']['progress'])}

    def import_backup(self, bundle, mode, revision, operation=None):
        value = validate(bundle, self.part_ids)
        if operation is not None and (not isinstance(operation,str) or not __import__('re').fullmatch(r'[a-f0-9]{32}', operation)): raise ValueError('backup.operation')
        if mode not in ('keep', 'overwrite'): raise ValueError('backup.mode')
        with self.lock:
            self.db.execute('BEGIN IMMEDIATE')
            try:
                before = self._rows()
                if digest(before) != revision: raise ValueError('backup.stale')
                names = {row['name']: row for row in before}
                mapping, targets = {}, set()
                for row in value['schemes']:
                    if mode == 'overwrite' and sum(item['name'] == row['name'] for item in before)>1: raise ValueError('backup.ambiguous_names')
                    old = names.get(row['name']) if mode == 'overwrite' else None
                    sid = old['id'] if old else 's-' + uuid.uuid4().hex
                    if sid in targets: raise ValueError('backup.ambiguous_names')
                    targets.add(sid); mapping[row['id']] = sid
                total = len(before) + len(targets - {row['id'] for row in before})
                if total > MAX_SCHEMES: raise ValueError('backup.limit')
                for row in value['schemes']:
                    v = scheme_values(row['id'], row, self.part_ids)
                    sid = mapping[row['id']]
                    name = v['name']
                    if mode == 'keep' and name in names:
                        # Keep both names distinguishable without losing the original.
                        base = name[:28]; n = 2
                        while name in names:
                            name = base + ' (' + str(n) + ')'; n += 1
                    names[name] = {'id':sid}
                    now = self._now()
                    self.db.execute('INSERT OR REPLACE INTO schemes VALUES(?,?,?,?,?,?,?)',
                        (sid, name, json.dumps(v['design']), json.dumps(v['provenance']) if v['provenance'] else None,
                         v['voiceSalt'], now, now))
                token = operation or uuid.uuid4().hex
                self.db.execute('INSERT INTO backup_recovery VALUES(?,?,?)', (token, json.dumps(before), digest(self._rows())))
                self.db.execute('COMMIT')
                return {'idMap': mapping, 'recovery': token}
            except BaseException:
                self.db.execute('ROLLBACK'); raise

    def restore_backup(self, token):
        with self.lock:
            self.db.execute('BEGIN IMMEDIATE')
            try:
                row = self.db.execute('SELECT * FROM backup_recovery WHERE id=?', (token,)).fetchone()
                if not row:
                    self.db.execute('COMMIT')
                    return {'ok': True, 'restored': False}
                if digest(self._rows()) != row['after_revision']: raise ValueError('backup.stale')
                self.db.execute('DELETE FROM schemes')
                for old in json.loads(row['snapshot']):
                    self.db.execute('INSERT INTO schemes VALUES(?,?,?,?,?,?,?)',
                        (old['id'], old['name'], json.dumps(old['design']), json.dumps(old['provenance']) if old['provenance'] else None,
                         old['voiceSalt'], old['created'], old['updated']))
                self.db.execute('DELETE FROM backup_recovery WHERE id=?', (token,))
                self.db.execute('COMMIT')
                return {'ok': True}
            except BaseException:
                self.db.execute('ROLLBACK'); raise

    def recovery_backup(self, token, browser):
        with self.lock:
            row = self.db.execute('SELECT snapshot FROM backup_recovery WHERE id=?', (token,)).fetchone()
            value = seal(json.loads(row['snapshot']) if row else self._rows(), browser)
            validate(value, self.part_ids)
            return value
