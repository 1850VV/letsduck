"""Verified, transactional SQLite import. Original files and credentials are preserved."""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import time

from sqlalchemy import func, insert, select
from sqlalchemy.exc import SQLAlchemyError
from database import backup_sqlite, database_url, metadata, migrations, name_key, open_database

# Project only the original fields so snapshots from both schema versions compare equally.
COLUMNS = {
    'users': ('id','name','pw_salt','pw_hash','avatar','color','created'),
    'sessions': ('token','user_id','created'),
    'schemes': ('id','user_id','name','design','provenance','voice_salt','created','updated'),
    'works': ('id','user_id','title','description','design','provenance','parent_id','scheme_id','created'),
    'ratings': ('work_id','user_id','stars'),
}


def fingerprint(data):
    normalized = {name: sorted(rows, key=lambda r: tuple(str(r[k]) for k in COLUMNS[name]))
                  for name, rows in data.items()}
    return hashlib.sha256(json.dumps(normalized, ensure_ascii=False, sort_keys=True,
        separators=(',', ':')).encode()).hexdigest()


def snapshot_sqlite(source, backup=None):
    backup = backup_sqlite(source, backup)
    with sqlite3.connect(backup.as_uri() + '?mode=ro', uri=True) as conn:
        conn.row_factory = sqlite3.Row
        if conn.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or conn.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Source database integrity check failed; backup retained')
        try:
            data = {name: [dict(r) for r in conn.execute('SELECT ' + ','.join(columns) + ' FROM ' + name)]
                    for name, columns in COLUMNS.items()}
        except sqlite3.DatabaseError as exc:
            raise ValueError('Source is not a complete DoodleDuck database; backup retained') from exc
    return backup, data


def target_data(conn):
    return {name: [dict(row) for row in conn.execute(select(*(metadata.tables[name].c[k] for k in columns))).mappings()]
            for name, columns in COLUMNS.items()}


def migrate_sqlite(source, target=None, backup=None):
    source = Path(source).resolve()
    url = database_url(target)
    if url.get_backend_name() == 'sqlite' and Path(url.database).resolve() == source:
        raise ValueError('Source and destination must differ')
    backup, data = snapshot_sqlite(source, backup)
    digest = fingerprint(data)
    counts = {name: len(rows) for name, rows in data.items()}
    engine = open_database(url)
    try:
        with engine.begin() as conn:
            record = conn.execute(select(migrations).where(migrations.c.fingerprint == digest)).mappings().first()
            if record:
                if fingerprint(target_data(conn)) != digest:
                    raise ValueError('This snapshot was imported, but destination has changed; no data was replayed')
                status = 'already_migrated'
            else:
                if any(conn.scalar(select(func.count()).select_from(metadata.tables[name])) for name in COLUMNS):
                    raise ValueError('Destination is not empty; refusing to merge or overwrite existing data')
                for name, rows in data.items():
                    if not rows:
                        continue
                    rows = [{**r, 'name_key': name_key(r['name'])} for r in rows] if name == 'users' else rows
                    conn.execute(insert(metadata.tables[name]), rows)
                if fingerprint(target_data(conn)) != digest:
                    raise ValueError('Destination verification failed; import rolled back')
                conn.execute(insert(migrations).values(fingerprint=digest,
                    counts=json.dumps(counts), created=int(time.time() * 1000)))
                status = 'migrated'
        return {'status': status, 'counts': counts, 'fingerprint': digest,
                'backup': str(backup), 'database': engine.dialect.name}
    except SQLAlchemyError as exc:
        raise ValueError('Import was not confirmed. Original and backup are retained; rerun the same snapshot to reconcile before changing the destination.') from exc
    finally:
        engine.dispose()


def main():
    parser = argparse.ArgumentParser(description='Copy a SQLite snapshot into an empty configured database and verify every original field')
    parser.add_argument('source', type=Path)
    parser.add_argument('--backup', type=Path)
    args = parser.parse_args()
    try:
        result = migrate_sqlite(args.source, backup=args.backup)
    except (ValueError, OSError, sqlite3.Error) as exc:
        parser.exit(2, str(exc) + '\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
