"""Shared schema and connections: SQLite locally, MySQL on servers."""
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import (BigInteger, CheckConstraint, Column, ForeignKey, Index,
                        Integer, MetaData, String, Table, Text, create_engine, event, inspect)
from sqlalchemy.engine import URL, make_url
from sqlalchemy.dialects.mysql import LONGTEXT

ROOT = Path(__file__).resolve().parent
metadata = MetaData()
OPTIONS = {'mysql_engine': 'InnoDB', 'mysql_charset': 'utf8mb4', 'mysql_collate': 'utf8mb4_bin'}
users = Table('users', metadata,
    Column('id', String(64), primary_key=True), Column('name', String(80), nullable=False),
    Column('pw_salt', String(32), nullable=False), Column('pw_hash', String(64), nullable=False),
    Column('avatar', String(32), nullable=False), Column('color', String(16), nullable=False),
    Column('created', BigInteger, nullable=False), Column('name_key', String(80), nullable=False), **OPTIONS)
Index('users_name_key', users.c.name_key, unique=True)
sessions = Table('sessions', metadata,
    Column('token', String(128), primary_key=True),
    Column('user_id', String(64), ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    Column('created', BigInteger, nullable=False), **OPTIONS)
schemes = Table('schemes', metadata,
    Column('id', String(64), primary_key=True),
    Column('user_id', String(64), ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    Column('name', Text, nullable=False), Column('design', Text().with_variant(LONGTEXT(), 'mysql'), nullable=False),
    Column('provenance', Text().with_variant(LONGTEXT(), 'mysql')),
    Column('voice_salt', BigInteger, nullable=False, server_default='0'),
    Column('created', BigInteger, nullable=False), Column('updated', BigInteger, nullable=False), **OPTIONS)
Index('schemes_user', schemes.c.user_id, schemes.c.updated)
works = Table('works', metadata,
    Column('id', String(64), primary_key=True),
    Column('user_id', String(64), ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    Column('title', Text, nullable=False), Column('description', Text, nullable=False),
    Column('design', Text().with_variant(LONGTEXT(), 'mysql'), nullable=False),
    Column('provenance', Text().with_variant(LONGTEXT(), 'mysql')),
    Column('parent_id', String(64)), Column('scheme_id', String(64)),
    Column('created', BigInteger, nullable=False), **OPTIONS)
Index('works_created', works.c.created, works.c.id)
Index('works_user_created', works.c.user_id, works.c.created, works.c.id)
Index('works_parent', works.c.parent_id)
ratings = Table('ratings', metadata,
    Column('work_id', String(64), ForeignKey('works.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', String(64), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('stars', Integer, nullable=False), CheckConstraint('stars BETWEEN 1 AND 5', name='rating_stars'), **OPTIONS)
migrations = Table('migration_runs', metadata,
    Column('fingerprint', String(64), primary_key=True), Column('counts', Text, nullable=False),
    Column('created', BigInteger, nullable=False), **OPTIONS)

def name_key(name):
    # Match old SQLite NOCASE: ASCII case folds, non-ASCII stays distinct.
    return name.translate(str.maketrans('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'))

def database_url(value=None):
    if value is not None:
        if isinstance(value, Path) or (isinstance(value, str) and '://' not in value):
            return URL.create('sqlite', database=str(Path(value).resolve()))
        return make_url(value) if isinstance(value, str) else value
    if os.environ.get('DUCK_DATABASE_URL'):
        return make_url(os.environ['DUCK_DATABASE_URL'])
    mode = os.environ.get('DUCK_DB_ENGINE', 'sqlite')
    if mode == 'mysql':
        return URL.create('mysql+pymysql', username=os.environ.get('DUCK_DB_USER', 'duck'),
            password=os.environ.get('DUCK_DB_PASSWORD', ''), host=os.environ.get('DUCK_DB_HOST', '127.0.0.1'),
            port=int(os.environ.get('DUCK_DB_PORT', '3306')), database=os.environ.get('DUCK_DB_NAME', 'doodleduck'),
            query={'charset': 'utf8mb4'})
    if mode != 'sqlite':
        raise ValueError('DUCK_DB_ENGINE must be sqlite or mysql')
    return URL.create('sqlite', database=str(Path(os.environ.get('DUCK_DB', ROOT / 'data' / 'doodleduck.db')).resolve()))

def backup_sqlite(source, backup=None):
    source = Path(source).resolve()
    if not source.is_file():
        raise ValueError('SQLite source does not exist')
    backup = Path(backup).resolve() if backup else source.parent / 'backups' / (
        source.stem + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ') + '-' + uuid.uuid4().hex[:8] + '.db')
    if backup == source:
        raise ValueError('Backup must differ from source')
    backup.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(backup, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    os.close(fd)
    src = sqlite3.connect(source.as_uri() + '?mode=ro', uri=True)
    dst = sqlite3.connect(backup)
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()
    return backup

def open_database(value=None):
    url = database_url(value)
    if url.get_backend_name() not in ('sqlite', 'mysql'):
        raise ValueError('Only SQLite and MySQL are supported')
    if url.get_backend_name() == 'sqlite':
        if url.database and url.database != ':memory:':
            Path(url.database).parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, connect_args={'check_same_thread': False, 'timeout': 15}, pool_pre_ping=True)
        @event.listens_for(engine, 'connect')
        def sqlite_pragmas(dbapi, record):
            cursor = dbapi.cursor()
            cursor.execute('PRAGMA foreign_keys=ON')
            cursor.execute('PRAGMA journal_mode=WAL')
            cursor.close()
    else:
        engine = create_engine(url, pool_pre_ping=True, pool_recycle=1800,
            pool_size=5, max_overflow=5, pool_timeout=15,
            connect_args={'connect_timeout': 10, 'read_timeout': 30, 'write_timeout': 30})
    metadata.create_all(engine)
    # Add a lookup key in place; keep every existing row and original field.
    if 'name_key' not in {c['name'] for c in inspect(engine).get_columns('users')}:
        if url.get_backend_name() == 'sqlite' and url.database != ':memory:':
            backup_sqlite(url.database)
        with engine.begin() as conn:
            conn.exec_driver_sql('ALTER TABLE users ADD COLUMN name_key VARCHAR(80)')
    # A prior interruption may have added the column without completing its backfill.
    with engine.begin() as conn:
        rows = conn.execute(users.select().where(users.c.name_key.is_(None))).mappings().all()
        for row in rows:
            conn.execute(users.update().where(users.c.id == row['id']).values(name_key=name_key(row['name'])))
    for table in metadata.tables.values():
        for index in table.indexes:
            index.create(engine, checkfirst=True)
    return engine
