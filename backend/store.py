"""Accounts, schemes, works and ratings on SQLite (local) or MySQL (server)."""
import hashlib
import json
import secrets
import time
from contextlib import contextmanager
from sqlalchemy import delete, func, insert, select, update
from sqlalchemy.exc import IntegrityError
from database import name_key, open_database, ratings, schemes, sessions, users, works

AVATARS = ['🦆', '🐤', '🐥', '🪿', '🐣', '🦢', '🐧', '🦜']
COLORS = ['#4d6bfe', '#ff7a59', '#2fb37a', '#f2b51d', '#9b6bff', '#ef5da8', '#2aa8c9', '#5c6a85']
FINISHES = {'basic', 'matte', 'silk', 'translucent', 'tpu'}
MAX_SCHEMES = 30

from errors import LocalizedError

class Invalid(LocalizedError):
    """A request the client can fix."""

class Store:
    def __init__(self, path=None, part_ids=None, *, database_url=None):
        self.engine = open_database(database_url if database_url is not None else path)
        self.part_ids = set(part_ids or [])

    def close(self):
        self.engine.dispose()

    def personal_owner(self):
        """A storage namespace, with no password or session usable through account APIs."""
        uid = 'personal-owner'
        with self.transaction(write=True) as conn:
            if not conn.execute(select(users.c.id).where(users.c.id == uid)).first():
                # Longer than the account API's 20-character nickname limit, and no
                # usable password. Keep existing account-owned schemes separate.
                name = 'personal-' + secrets.token_hex(20)
                conn.execute(insert(users).values(id=uid, name=name, name_key=name,
                    pw_salt=secrets.token_hex(16), pw_hash=secrets.token_hex(32),
                    avatar='🦆', color=COLORS[0], created=self._now()))
        return uid

    @contextmanager
    def transaction(self, write=False):
        with self.engine.connect() as conn:
            if write and self.engine.dialect.name == 'sqlite':
                conn.exec_driver_sql('BEGIN IMMEDIATE')
            try:
                yield conn
                conn.commit()
            except BaseException:
                conn.rollback()
                raise

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
            raise Invalid('配色必须包含全部 %d 个零件' % len(self.part_ids), code='validation.2', params={'v0':len(self.part_ids)})
        for value in colors.values():
            if not (isinstance(value, str) and len(value) == 7 and value[0] == '#' and all(c in '0123456789abcdefABCDEF' for c in value[1:])):
                raise Invalid('颜色格式不对', code='validation.18')
        for value in assignments.values():
            if value is not None and (not isinstance(value, str) or len(value) > 80):
                raise Invalid('耗材编号格式不对', code='validation.19')
        finishes = design.get('finishes') or {}
        if not isinstance(finishes, dict) or any(v not in FINISHES for v in finishes.values()):
            raise Invalid('质感格式不对', code='validation.3')
        return {'colors': {k: v.upper() for k, v in colors.items()}, 'assignments': assignments,
                'finishes': {k: v for k, v in finishes.items() if k in colors}}

    @staticmethod
    def _text(value, limit, field, required=True):
        value = str(value or '').strip()
        if required and not value:
            raise Invalid(field + '不能为空', code='validation.4', params={'v0':field})
        return value[:limit]

    @staticmethod
    def user_json(row):
        return {k: row[k] for k in ('id', 'name', 'avatar', 'color', 'created')}

    def _session(self, conn, uid):
        token = secrets.token_urlsafe(32)
        conn.execute(insert(sessions).values(token=token, user_id=uid, created=self._now()))
        row = conn.execute(select(users).where(users.c.id == uid)).mappings().one()
        return {'token': token, 'user': self.user_json(row)}

    def register(self, name, password):
        name = self._text(name, 20, '昵称')
        if not isinstance(password, str) or len(password) < 4:
            raise Invalid('密码至少 4 位', code='auth.password_short')
        salt = secrets.token_hex(16)
        uid = 'u-' + secrets.token_hex(6)
        hashed = self._hash(password, salt)
        try:
            with self.transaction(write=True) as conn:
                conn.execute(insert(users).values(id=uid, name=name, name_key=name_key(name), pw_salt=salt,
                    pw_hash=hashed, avatar=secrets.choice(AVATARS), color=secrets.choice(COLORS), created=self._now()))
                return self._session(conn, uid)
        except IntegrityError as exc:
            raise Invalid('这个昵称已经有人用了，换一个吧', code='auth.name_taken') from exc

    def login(self, name, password):
        with self.transaction() as conn:
            row = conn.execute(select(users).where(users.c.name_key == name_key(str(name or '').strip()))).mappings().first()
        if not row or not secrets.compare_digest(row['pw_hash'], self._hash(str(password or ''), row['pw_salt'])):
            raise Invalid('昵称或密码不对', code='auth.invalid_credentials')
        with self.transaction(write=True) as conn:
            return self._session(conn, row['id'])

    def user_for(self, token):
        if not token:
            return None
        with self.transaction() as conn:
            row = conn.execute(select(users).join(sessions, users.c.id == sessions.c.user_id)
                .where(sessions.c.token == token)).mappings().first()
            return self.user_json(row) if row else None

    def logout(self, token):
        with self.transaction(write=True) as conn:
            conn.execute(delete(sessions).where(sessions.c.token == token))

    def update_user(self, uid, data):
        try:
            with self.transaction(write=True) as conn:
                row = conn.execute(select(users).where(users.c.id == uid).with_for_update()).mappings().one()
                name = self._text(data.get('name', row['name']), 20, '昵称')
                avatar, color = data.get('avatar', row['avatar']), data.get('color', row['color'])
                if avatar not in AVATARS or color not in COLORS:
                    raise Invalid('头像或颜色不在可选范围内', code='validation.8')
                values = dict(name=name, name_key=name_key(name), avatar=avatar, color=color)
                if data.get('password'):
                    password = data['password']
                    if not isinstance(password, str) or len(password) < 4:
                        raise Invalid('密码至少 4 位', code='auth.password_short')
                    salt = secrets.token_hex(16)
                    values.update(pw_salt=salt, pw_hash=self._hash(password, salt))
                conn.execute(update(users).where(users.c.id == uid).values(**values))
                return self.user_json(conn.execute(select(users).where(users.c.id == uid)).mappings().one())
        except IntegrityError as exc:
            raise Invalid('这个昵称已经有人用了，换一个吧', code='auth.name_taken') from exc

    @staticmethod
    def scheme_json(row):
        return {'id': row['id'], 'name': row['name'], 'design': json.loads(row['design']),
            'provenance': json.loads(row['provenance']) if row['provenance'] else None,
            'voiceSalt': row['voice_salt'], 'created': row['created'], 'updated': row['updated']}

    def schemes(self, uid):
        with self.transaction() as conn:
            return [self.scheme_json(r) for r in conn.execute(select(schemes).where(schemes.c.user_id == uid)
                .order_by(schemes.c.updated.desc(), schemes.c.id.desc())).mappings()]

    def save_scheme(self, uid, sid, data):
        if not isinstance(sid, str) or not 1 <= len(sid) <= 64:
            raise Invalid('方案编号不对', code='validation.9')
        name = self._text(data.get('name'), 40, '方案名称')
        design = self.validate_design(data.get('design'))
        values = dict(name=name, design=json.dumps(design),
            provenance=json.dumps(data['provenance'], ensure_ascii=False) if data.get('provenance') else None,
            voice_salt=int(data.get('voiceSalt') or 0), updated=self._now())
        try:
            with self.transaction(write=True) as conn:
                conn.execute(select(users.c.id).where(users.c.id == uid).with_for_update()).one()
                # The user lock guards updates/quota. A missing scheme needs no gap lock:
                # the primary key arbitrates cross-user insert races without deadlocking.
                existing = conn.execute(select(schemes).where(schemes.c.id == sid)).mappings().first()
                if existing and existing['user_id'] != uid:
                    raise Invalid('这个方案不属于你', code='schemes.not_owner')
                if existing:
                    conn.execute(update(schemes).where(schemes.c.id == sid).values(**values))
                else:
                    count = conn.scalar(select(func.count()).select_from(schemes).where(schemes.c.user_id == uid))
                    if count >= MAX_SCHEMES:
                        raise Invalid('最多保存 %d 套方案，先删掉一些' % MAX_SCHEMES, code='validation.11', params={'v0':MAX_SCHEMES})
                    conn.execute(insert(schemes).values(id=sid, user_id=uid, created=values['updated'], **values))
                return self.scheme_json(conn.execute(select(schemes).where(schemes.c.id == sid)).mappings().one())
        except IntegrityError as exc:
            raise Invalid('这个方案不属于你', code='schemes.not_owner') from exc

    def delete_scheme(self, uid, sid):
        with self.transaction(write=True) as conn:
            conn.execute(delete(schemes).where(schemes.c.id == sid, schemes.c.user_id == uid))

    def _work_rows(self, conn, rows, viewer=None):
        if not rows:
            return []
        ids = [r['id'] for r in rows]
        stats = {r.work_id: (int(r.n), float(r.avg)) for r in conn.execute(
            select(ratings.c.work_id, func.count().label('n'), func.avg(ratings.c.stars).label('avg'))
            .where(ratings.c.work_id.in_(ids)).group_by(ratings.c.work_id))}
        mine = dict(conn.execute(select(ratings.c.work_id, ratings.c.stars)
            .where(ratings.c.work_id.in_(ids), ratings.c.user_id == viewer)).tuples().all()) if viewer else {}
        forks = dict(conn.execute(select(works.c.parent_id, func.count())
            .where(works.c.parent_id.in_(ids)).group_by(works.c.parent_id)).tuples().all())
        return [{'id': r['id'], 'title': r['title'], 'description': r['description'], 'design': json.loads(r['design']),
            'provenance': json.loads(r['provenance']) if r['provenance'] else None, 'parentId': r['parent_id'],
            'schemeId': r['scheme_id'] if viewer == r['user_id'] else None, 'created': r['created'],
            'author': {k: r['user_id'] if k == 'id' else r[k] for k in ('id', 'name', 'avatar', 'color')},
            'rating': {'count': stats.get(r['id'], (0, 0))[0], 'average': round(stats.get(r['id'], (0, 0))[1], 2),
                       'mine': mine.get(r['id'], 0)}, 'forks': int(forks.get(r['id'], 0))} for r in rows]

    @staticmethod
    def _work_select():
        return select(works, users.c.name, users.c.avatar, users.c.color).join(users, works.c.user_id == users.c.id)

    def works(self, viewer=None, author=None, limit=200, offset=0):
        if not 1 <= limit <= 200 or offset < 0:
            raise Invalid('分页范围不对', code='request.pagination')
        query = self._work_select().order_by(works.c.created.desc(), works.c.id.desc()).limit(limit).offset(offset)
        if author:
            query = query.where(works.c.user_id == author)
        with self.transaction() as conn:
            return self._work_rows(conn, conn.execute(query).mappings().all(), viewer)

    def _work(self, conn, wid, viewer=None):
        rows = conn.execute(self._work_select().where(works.c.id == wid)).mappings().all()
        if not rows:
            raise Invalid('作品不存在', code='validation.15')
        return self._work_rows(conn, rows, viewer)[0]

    def work(self, wid, viewer=None):
        with self.transaction() as conn:
            return self._work(conn, wid, viewer)

    def publish(self, uid, data):
        title = self._text(data.get('title'), 40, '作品名称')
        design = self.validate_design(data.get('design'))
        if any(v is None for v in design['assignments'].values()):
            raise Invalid('发布前请为全部零件匹配真实耗材', code='validation.13')
        with self.transaction(write=True) as conn:
            parent = data.get('parentId')
            if parent and not conn.scalar(select(works.c.id).where(works.c.id == parent).with_for_update()):
                parent = None
            wid = 'w-' + secrets.token_hex(6)
            conn.execute(insert(works).values(id=wid, user_id=uid, title=title,
                description=self._text(data.get('description'), 240, '', False), design=json.dumps(design),
                provenance=json.dumps(data['provenance'], ensure_ascii=False) if data.get('provenance') else None,
                parent_id=parent, scheme_id=data.get('schemeId'), created=self._now()))
            return self._work(conn, wid, uid)

    def delete_work(self, uid, wid):
        with self.transaction(write=True) as conn:
            owner = conn.scalar(select(works.c.user_id).where(works.c.id == wid).with_for_update())
            if owner != uid:
                raise Invalid('只能删除自己的作品', code='validation.14')
            conn.execute(update(works).where(works.c.parent_id == wid).values(parent_id=None))
            conn.execute(delete(works).where(works.c.id == wid))

    def rate(self, uid, wid, stars):
        if type(stars) is not int or not 1 <= stars <= 5:
            raise Invalid('评分必须是 1 到 5 星', code='validation.17')
        with self.transaction(write=True) as conn:
            owner = conn.scalar(select(works.c.user_id).where(works.c.id == wid).with_for_update())
            if not owner:
                raise Invalid('作品不存在', code='validation.15')
            if owner == uid:
                raise Invalid('不能给自己的作品评分', code='validation.16')
            condition = (ratings.c.work_id == wid, ratings.c.user_id == uid)
            if conn.scalar(select(ratings.c.stars).where(*condition)) is not None:
                conn.execute(update(ratings).where(*condition).values(stars=stars))
            else:
                conn.execute(insert(ratings).values(work_id=wid, user_id=uid, stars=stars))
            return self._work(conn, wid, uid)
