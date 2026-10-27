/** Verified, transactional import of the original server SQLite fields. */
import { createHash } from 'node:crypto';
import { existsSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { JsonNumericValue, pythonString } from '@letsduck/domain';
import { backupSqlite, databaseTarget, nameKey, openDatabase } from './database.js';
import type { Cell, Connection, Row } from './database.js';
import { jsonStringify, safeInteger } from './json.js';

// Keep this projection independent of schema additions, matching Python COLUMNS.
export const COLUMNS = {
  users: ['id', 'name', 'pw_salt', 'pw_hash', 'avatar', 'color', 'created'],
  sessions: ['token', 'user_id', 'created'],
  schemes: ['id', 'user_id', 'name', 'design', 'provenance', 'voice_salt', 'created', 'updated'],
  works: ['id', 'user_id', 'title', 'description', 'design', 'provenance', 'parent_id', 'scheme_id', 'created'],
  ratings: ['work_id', 'user_id', 'stars'],
} as const;
export type MigrationTable = keyof typeof COLUMNS;
export type MigrationData = Record<MigrationTable, Row[]>;
export type MigrationCounts = Record<MigrationTable, number>;
export interface MigrationResult {
  status: 'migrated' | 'already_migrated';
  counts: MigrationCounts;
  fingerprint: string;
  backup: string;
  database: 'sqlite' | 'mysql';
}
class MigrationError extends Error {}
const tables = Object.keys(COLUMNS) as MigrationTable[];

function codepointCompare(left: string, right: string): number {
  const a = Array.from(left), b = Array.from(right);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const difference = a[i]!.codePointAt(0)! - b[i]!.codePointAt(0)!;
    if (difference) return difference;
  }
  return a.length - b.length;
}
function compareRows(table: MigrationTable, left: Row, right: Row): number {
  for (const key of COLUMNS[table]) {
    const difference = codepointCompare(pythonString(left[key]), pythonString(right[key]));
    if (difference) return difference;
  }
  return 0;
}
export function fingerprint(data: MigrationData): string {
  const normalized: Partial<Record<MigrationTable, unknown[]>> = {};
  for (const table of tables) {
    normalized[table] = [...data[table]].sort((a, b) => compareRows(table, a, b)).map(row =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
        typeof value === 'number' && !Number.isInteger(value) ? new JsonNumericValue(value, pythonString(value)) : value,
      ])));
  }
  return createHash('sha256').update(jsonStringify(normalized, true), 'utf8').digest('hex');
}

export async function snapshotSqlite(source: string, backup?: string): Promise<{ backup: string; data: MigrationData }> {
  const path = await backupSqlite(source, backup);
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const integrity = db.prepare('PRAGMA integrity_check').get();
    if (!integrity || Object.values(integrity)[0] !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) {
      throw new MigrationError('Source database integrity check failed; backup retained');
    }
    const data = {} as MigrationData;
    try {
      for (const table of tables) {
        const statement = db.prepare('SELECT ' + COLUMNS[table].join(',') + ' FROM ' + table);
        statement.setReadBigInts(true);
        data[table] = statement.all().map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
          if (value instanceof Uint8Array) throw new MigrationError('Source contains an unsupported binary field; backup retained');
          return [key, typeof value === 'bigint' ? safeInteger(value) : value];
        })));
      }
    } catch (error) {
      if (error instanceof MigrationError) throw error;
      throw new MigrationError('Source is not a complete letsduck database; backup retained', { cause: error });
    }
    return { backup: path, data };
  } finally { db.close(); }
}
export async function targetData(connection: Connection): Promise<MigrationData> {
  const data = {} as MigrationData;
  for (const table of tables) data[table] = await connection.rows('SELECT ' + COLUMNS[table].join(',') + ' FROM ' + table);
  return data;
}
const canonical = (path: string) => existsSync(path) ? realpathSync(path) : resolve(path);

export async function migrateSqlite(source: string, target?: string, backup?: string): Promise<MigrationResult> {
  source = resolve(source);
  const destination = databaseTarget(target);
  if (destination.dialect === 'sqlite' && destination.path !== ':memory:' && canonical(destination.path) === canonical(source)) {
    throw new MigrationError('Source and destination must differ');
  }
  const snapshot = await snapshotSqlite(source, backup);
  const digest = fingerprint(snapshot.data);
  const counts = Object.fromEntries(tables.map(table => [table, snapshot.data[table].length])) as MigrationCounts;
  const database = await openDatabase(destination.dialect === 'sqlite' ? destination.path : destination.url);
  try {
    const status = await database.transaction(async connection => {
      const previous = await connection.rows('SELECT fingerprint FROM migration_runs WHERE fingerprint=?', [digest]);
      if (previous.length) {
        if (fingerprint(await targetData(connection)) !== digest) {
          throw new MigrationError('This snapshot was imported, but destination has changed; no data was replayed');
        }
        return 'already_migrated' as const;
      }
      for (const table of tables) {
        const rows = await connection.rows('SELECT COUNT(*) AS count FROM ' + table);
        if (rows[0]?.count !== 0 && rows[0]?.count !== 0n) {
          throw new MigrationError('Destination is not empty; refusing to merge or overwrite existing data');
        }
      }
      for (const table of tables) {
        const columns: readonly string[] = table === 'users' ? [...COLUMNS.users, 'name_key'] : COLUMNS[table];
        for (const row of snapshot.data[table]) {
          const values: Cell[] = columns.map(column => column === 'name_key' ? nameKey(String(row.name)) : row[column]!);
          await connection.run('INSERT INTO ' + table + ' (' + columns.join(',') + ') VALUES (' + columns.map(() => '?').join(',') + ')', values);
        }
      }
      if (fingerprint(await targetData(connection)) !== digest) {
        throw new MigrationError('Destination verification failed; import rolled back');
      }
      await connection.run('INSERT INTO migration_runs (fingerprint,counts,created) VALUES (?,?,?)', [digest, jsonStringify(counts), Date.now()]);
      return 'migrated' as const;
    }, true);
    return { status, counts, fingerprint: digest, backup: snapshot.backup, database: database.dialect };
  } catch (error) {
    if (error instanceof MigrationError) throw error;
    throw new MigrationError('Import was not confirmed. Original and backup are retained; rerun the same snapshot to reconcile before changing the destination.', { cause: error });
  } finally { await database.close(); }
}
