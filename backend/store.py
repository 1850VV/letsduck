"""SQLite storage for DoodleDuck: accounts, private schemes, published works and ratings.

One file database (DUCK_DB, default backend/data/doodleduck.db). Python standard library only.
Accounts are a nickname plus a simple password for a small circle of friends; passwords are
still salted and hashed so the database never holds them in plain text.
"""
import hashlib, json, os, secrets, sqlite3, threading, time
from pathlib import Path

DB_PATH = Path(os.environ.get('DUCK_DB', Path(__file__).resolve().parent / 'data' / 'doodleduck.db'))
AVATARS = ['🦆', '🐤', '🐥', '🪿', '🐣', '🦢', '🐧', '🦜']
COLORS = ['#4d6bfe', '#ff7a59', '#2fb37a', '#f2b51d', '#9b6bff', '#ef5da8', '#2aa8c9', '#5c6a85']
FINISHES = {'basic', 'matte', 'silk', 'translucent', 'tpu'}
MAX_SCHEMES = 30

SCHEMA = """
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, pw_salt TEXT NOT NULL, pw_hash TEXT NOT NULL, avatar TEXT NOT NULL, color TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS schemes(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, design TEXT NOT NULL, provenance TEXT, voice_salt INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS works(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', design TEXT NOT NULL, provenance TEXT, parent_id TEXT, scheme_id TEXT, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS ratings(work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5), PRIMARY KEY(work_id, user_id));
CREATE INDEX IF NOT EXISTS schemes_user ON schemes(user_id, updated DESC);
CREATE INDEX IF NOT EXISTS works_created ON works(created DESC);
"""


from errors import LocalizedError

class Invalid(LocalizedError):
    """A request the client can fix (bad input, taken name, wrong password...)."""


class Store:
    def __init__(self, path=DB_PATH, part_ids=None):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path), check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.executescript(SCHEMA)
        self.lock = threading.Lock()
        self.part_ids = set(part_ids or [])

    # ---- helpers ----
    def _q(self, sql, args=(), one=False):
        with self.lock:
            cur = self.db.execute(sql, args)
            rows = cur.fetchall()
            self.db.commit()
        return (rows[0] if rows else None) if one else rows

    @staticmethod
    def _hash(password, salt):
        return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 120_000).hex()

    @staticmethod
    def _now():
        return int(time.time() * 1000)

    def validate_design(self, design):
        if not isinstance(design, dict) or not isinstance(design.get('colors'), dict) or not isinstance(design.get('assignments'), dict):
            raise Invalid('配色数据格式不对', code='validation.1')
        colors, assignments = design['colors'], design['assignments']
        if self.part_ids and (set(colors) != self.part_ids or set(assignments) != self.part_ids):
            raise Invalid('配色必须包含全部 %d 个零件' % len(self.part_ids), code='validation.2', params={'v0': len(self.part_ids)})
        for value in colors.values():
            if not (isinstance(value, str) and len(value) == 7 and value[0] == '#' and all(c in '0123456789abcdefABCDEF' for c in value[1:])):
                raise Invalid('颜色格式不对', code='validation.18')
        for value in assignments.values():
            if value is not None and (not isinstance(value, str) or len(value) > 80):
                raise Invalid('耗材编号格式不对', code='validation.19')
        finishes = design.get('finishes') or {}
        if not isinstance(finishes, dict) or any(v not in FINISHES for v in finishes.values()):
            raise Invalid('质感格式不对', code='validation.3')
        return {'colors': {k: v.upper() for k, v in colors.items()}, 'assignments': assignments, 'finishes': {k: v for k, v in finishes.items() if k in colors}}

    @staticmethod
    def _text(value, limit, field, required=True):
        value = str(value or '').strip()
        if required and not value:
            raise Invalid(field + '不能为空', code='validation.4', params={'v0': field})
        return value[:limit]

    # ---- accounts ----
    def user_json(self, row):
        return {'id': row['id'], 'name': row['name'], 'avatar': row['avatar'], 'color': row['color'], 'created': row['created']}

    def register(self, name, password):
        name = self._text(name, 20, '昵称')
        if len(str(password or '')) < 4:
            raise Invalid('密码至少 4 位', code='auth.password_short')
        if self._q('SELECT 1 FROM users WHERE name=?', (name,), one=True):
            raise Invalid('这个昵称已经有人用了，换一个吧', code='auth.name_taken')
        salt = secrets.token_hex(16)
        uid = 'u-' + secrets.token_hex(6)
        self._q('INSERT INTO users VALUES(?,?,?,?,?,?,?)', (uid, name, salt, self._hash(password, salt), secrets.choice(AVATARS), secrets.choice(COLORS), self._now()))
        return self._session(uid)

    def login(self, name, password):
        row = self._q('SELECT * FROM users WHERE name=?', (str(name or '').strip(),), one=True)
        if not row or not secrets.compare_digest(row['pw_hash'], self._hash(str(password or ''), row['pw_salt'])):
            raise Invalid('昵称或密码不对', code='auth.invalid_credentials')
        return self._session(row['id'])

    def _session(self, uid):
        token = secrets.token_urlsafe(32)
        self._q('INSERT INTO sessions VALUES(?,?,?)', (token, uid, self._now()))
        return {'token': token, 'user': self.user_json(self._q('SELECT * FROM users WHERE id=?', (uid,), one=True))}

    def user_for(self, token):
        if not token:
            return None
        row = self._q('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=?', (token,), one=True)
        return self.user_json(row) if row else None

    def logout(self, token):
        self._q('DELETE FROM sessions WHERE token=?', (token,))

    def update_user(self, uid, data):
        row = self._q('SELECT * FROM users WHERE id=?', (uid,), one=True)
        name = self._text(data.get('name', row['name']), 20, '昵称')
        if name.lower() != row['name'].lower() and self._q('SELECT 1 FROM users WHERE name=?', (name,), one=True):
            raise Invalid('这个昵称已经有人用了，换一个吧', code='auth.name_taken')
        avatar = data.get('avatar', row['avatar'])
        color = data.get('color', row['color'])
        if avatar not in AVATARS or color not in COLORS:
            raise Invalid('头像或颜色不在可选范围内', code='validation.8')
        self._q('UPDATE users SET name=?, avatar=?, color=? WHERE id=?', (name, avatar, color, uid))
        if data.get('password'):
            if len(data['password']) < 4:
                raise Invalid('密码至少 4 位', code='auth.password_short')
            salt = secrets.token_hex(16)
            self._q('UPDATE users SET pw_salt=?, pw_hash=? WHERE id=?', (salt, self._hash(data['password'], salt), uid))
        return self.user_json(self._q('SELECT * FROM users WHERE id=?', (uid,), one=True))

    # ---- private schemes ----
    @staticmethod
    def scheme_json(row):
        return {'id': row['id'], 'name': row['name'], 'design': json.loads(row['design']), 'provenance': json.loads(row['provenance']) if row['provenance'] else None,
                'voiceSalt': row['voice_salt'], 'created': row['created'], 'updated': row['updated']}

    def schemes(self, uid):
        return [self.scheme_json(r) for r in self._q('SELECT * FROM schemes WHERE user_id=? ORDER BY updated DESC', (uid,))]

    def save_scheme(self, uid, sid, data):
        if not isinstance(sid, str) or not 1 <= len(sid) <= 64:
            raise Invalid('方案编号不对', code='validation.9')
        name = self._text(data.get('name'), 40, '方案名称')
        design = self.validate_design(data.get('design'))
        provenance = data.get('provenance')
        salt = int(data.get('voiceSalt') or 0)
        existing = self._q('SELECT user_id, created FROM schemes WHERE id=?', (sid,), one=True)
        if existing and existing['user_id'] != uid:
            raise Invalid('这个方案不属于你', code='schemes.not_owner')
        if not existing and self._q('SELECT COUNT(*) n FROM schemes WHERE user_id=?', (uid,), one=True)['n'] >= MAX_SCHEMES:
            raise Invalid('最多保存 %d 套方案，先删掉一些' % MAX_SCHEMES, code='validation.11', params={'v0': MAX_SCHEMES})
        now = self._now()
        self._q('INSERT INTO schemes VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, design=excluded.design, provenance=excluded.provenance, voice_salt=excluded.voice_salt, updated=excluded.updated',
                (sid, uid, name, json.dumps(design), json.dumps(provenance, ensure_ascii=False) if provenance else None, salt, existing['created'] if existing else now, now))
        return self.scheme_json(self._q('SELECT * FROM schemes WHERE id=?', (sid,), one=True))

    def delete_scheme(self, uid, sid):
        self._q('DELETE FROM schemes WHERE id=? AND user_id=?', (sid, uid))

    # ---- published works ----
    def work_json(self, row, viewer=None):
        stats = self._q('SELECT COUNT(*) n, AVG(stars) avg FROM ratings WHERE work_id=?', (row['id'],), one=True)
        mine = self._q('SELECT stars FROM ratings WHERE work_id=? AND user_id=?', (row['id'], viewer), one=True) if viewer else None
        forks = self._q('SELECT COUNT(*) n FROM works WHERE parent_id=?', (row['id'],), one=True)['n']
        return {'id': row['id'], 'title': row['title'], 'description': row['description'], 'design': json.loads(row['design']),
                'provenance': json.loads(row['provenance']) if row['provenance'] else None, 'parentId': row['parent_id'], 'schemeId': row['scheme_id'] if viewer == row['user_id'] else None,
                'created': row['created'], 'author': {'id': row['user_id'], 'name': row['name'], 'avatar': row['avatar'], 'color': row['color']},
                'rating': {'count': stats['n'], 'average': round(stats['avg'] or 0, 2), 'mine': mine['stars'] if mine else 0}, 'forks': forks}

    _WORK = 'SELECT works.*, users.name, users.avatar, users.color FROM works JOIN users ON users.id=works.user_id'

    def works(self, viewer=None, author=None, limit=200):
        if author:
            rows = self._q(self._WORK + ' WHERE works.user_id=? ORDER BY works.created DESC LIMIT ?', (author, limit))
        else:
            rows = self._q(self._WORK + ' ORDER BY works.created DESC LIMIT ?', (limit,))
        return [self.work_json(r, viewer) for r in rows]

    def work(self, wid, viewer=None):
        row = self._q(self._WORK + ' WHERE works.id=?', (wid,), one=True)
        if not row:
            raise Invalid('作品不存在', code='validation.12')
        return self.work_json(row, viewer)

    def publish(self, uid, data):
        title = self._text(data.get('title'), 40, '作品名称')
        design = self.validate_design(data.get('design'))
        if any(v is None for v in design['assignments'].values()):
            raise Invalid('发布前请为全部零件匹配真实耗材', code='validation.13')
        parent = data.get('parentId')
        if parent and not self._q('SELECT 1 FROM works WHERE id=?', (parent,), one=True):
            parent = None
        wid = 'w-' + secrets.token_hex(6)
        provenance = data.get('provenance')
        self._q('INSERT INTO works VALUES(?,?,?,?,?,?,?,?,?)', (wid, uid, title, self._text(data.get('description'), 240, '', False), json.dumps(design),
                                                         json.dumps(provenance, ensure_ascii=False) if provenance else None, parent, data.get('schemeId'), self._now()))
        return self.work(wid, uid)

    def delete_work(self, uid, wid):
        row = self._q('SELECT user_id FROM works WHERE id=?', (wid,), one=True)
        if not row or row['user_id'] != uid:
            raise Invalid('只能删除自己的作品', code='validation.14')
        self._q('UPDATE works SET parent_id=NULL WHERE parent_id=?', (wid,))
        self._q('DELETE FROM works WHERE id=?', (wid,))

    def rate(self, uid, wid, stars):
        row = self._q('SELECT user_id FROM works WHERE id=?', (wid,), one=True)
        if not row:
            raise Invalid('作品不存在', code='validation.15')
        if row['user_id'] == uid:
            raise Invalid('不能给自己的作品评分', code='validation.16')
        if not isinstance(stars, int) or not 1 <= stars <= 5:
            raise Invalid('评分必须是 1 到 5 星', code='validation.17')
        self._q('INSERT INTO ratings VALUES(?,?,?) ON CONFLICT(work_id, user_id) DO UPDATE SET stars=excluded.stars', (wid, uid, stars))
        return self.work(wid, uid)
