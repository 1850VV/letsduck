import { DatabaseSync, backup } from 'node:sqlite';
import { createPool, type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';
import { closeSync, existsSync, mkdirSync, openSync, realpathSync, statSync } from 'node:fs';
import { dirname, resolve, basename, extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { safeInteger } from './json.js';

export type Cell = string | number | bigint | null;
export type Row = Record<string, Cell>;
export interface Connection {
  readonly dialect: 'sqlite' | 'mysql';
  rows(sql: string, params?: readonly Cell[]): Promise<Row[]>;
  run(sql: string, params?: readonly Cell[]): Promise<void>;
}
export interface Database {
  readonly dialect: 'sqlite' | 'mysql';
  transaction<T>(body: (connection: Connection) => Promise<T>, write?: boolean): Promise<T>;
  close(): Promise<void>;
}
export type DatabaseTarget = { dialect: 'sqlite'; path: string } | { dialect: 'mysql'; url: string };
export const nameKey = (name: string) => name.replace(/[A-Z]/g, char => char.toLowerCase());
export function databaseTarget(target?: string): DatabaseTarget {
  if (target === undefined) {
    if (process.env.DUCK_DATABASE_URL) return databaseTarget(process.env.DUCK_DATABASE_URL);
    const engine = process.env.DUCK_DB_ENGINE || 'sqlite';
    if (engine === 'mysql') {
      const url = new URL('mysql://127.0.0.1');
      url.hostname = process.env.DUCK_DB_HOST || '127.0.0.1'; url.port = process.env.DUCK_DB_PORT || '3306';
      url.username = process.env.DUCK_DB_USER || 'duck'; url.password = process.env.DUCK_DB_PASSWORD || '';
      url.pathname = '/' + (process.env.DUCK_DB_NAME || 'doodleduck'); url.searchParams.set('charset', 'utf8mb4');
      return { dialect: 'mysql', url: url.href };
    }
    if (engine !== 'sqlite') throw new Error('Only SQLite and MySQL are supported');
    target = process.env.DUCK_DB || resolve(import.meta.dirname, '../../../backend/data/doodleduck.db');
  }
  if (/^mysql(?:\+[^:]+)?:\/\//.test(target)) return { dialect: 'mysql', url: target.replace(/^mysql\+[^:]+:/, 'mysql:') };
  if (target === 'sqlite://' || target === ':memory:' || target === 'sqlite:///:memory:') return { dialect: 'sqlite', path: ':memory:' };
  if (/^sqlite(?:\+[^:]+)?:\/\/\//.test(target)) target = target.replace(/^sqlite(?:\+[^:]+)?:\/\/\//, '');
  else if (target.includes('://')) throw new Error('Only SQLite and MySQL are supported');
  return { dialect: 'sqlite', path: resolve(target) };
}
export async function backupSqlite(source: string, destination?: string): Promise<string> {
  source = realpathSync(resolve(source));
  if (!statSync(source).isFile()) throw new Error('SQLite source does not exist');
  const suffix = new Date().toISOString().replaceAll(/[-:.]/g, '').replace(/\d{3}Z$/, 'Z') + '-' + randomUUID().slice(0, 8);
  const path = resolve(destination || join(dirname(source), 'backups', basename(source, extname(source)) + '-' + suffix + '.db'));
  if (path === source || (existsSync(path) && realpathSync(path) === source)) throw new Error('Backup must differ from source');
  mkdirSync(dirname(path), { recursive: true }); closeSync(openSync(path, 'wx', 0o600));
  const db = new DatabaseSync(source, { readOnly: true });
  try { await backup(db, path); } finally { db.close(); }
  return path;
}

const tables: Record<string, string> = {
  users: 'id VARCHAR(64) NOT NULL PRIMARY KEY,name VARCHAR(80) NOT NULL,pw_salt VARCHAR(32) NOT NULL,pw_hash VARCHAR(64) NOT NULL,avatar VARCHAR(32) NOT NULL,color VARCHAR(16) NOT NULL,created BIGINT NOT NULL,name_key VARCHAR(80) NOT NULL',
  sessions: 'token VARCHAR(128) NOT NULL PRIMARY KEY,user_id VARCHAR(64) NOT NULL,created BIGINT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  schemes: 'id VARCHAR(64) NOT NULL PRIMARY KEY,user_id VARCHAR(64) NOT NULL,name TEXT NOT NULL,design {JSON} NOT NULL,provenance {JSON},voice_salt BIGINT NOT NULL DEFAULT 0,created BIGINT NOT NULL,updated BIGINT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  works: 'id VARCHAR(64) NOT NULL PRIMARY KEY,user_id VARCHAR(64) NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL,design {JSON} NOT NULL,provenance {JSON},parent_id VARCHAR(64),scheme_id VARCHAR(64),created BIGINT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  ratings: 'work_id VARCHAR(64) NOT NULL,user_id VARCHAR(64) NOT NULL,stars INTEGER NOT NULL,PRIMARY KEY(work_id,user_id),CONSTRAINT rating_stars CHECK(stars BETWEEN 1 AND 5),FOREIGN KEY(work_id) REFERENCES works(id) ON DELETE CASCADE,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  migration_runs: 'fingerprint VARCHAR(64) NOT NULL PRIMARY KEY,counts TEXT NOT NULL,created BIGINT NOT NULL',
};
const indexes = [
  ['users_name_key', 'users', 'name_key', true], ['schemes_user', 'schemes', 'user_id,updated', false],
  ['works_created', 'works', 'created,id', false], ['works_user_created', 'works', 'user_id,created,id', false], ['works_parent', 'works', 'parent_id', false],
] as const;
function bind(values: readonly Cell[]) {
  return values.map(value => {
    if (typeof value === 'bigint' && (value < -(1n << 63n) || value >= 1n << 63n)) throw new RangeError('Integer exceeds signed 64-bit range');
    if (typeof value === 'number' && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) throw new RangeError('Integer precision is unavailable');
    return value;
  });
}
function sqliteDatabase(path: string): Database {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { timeout: 15_000, readBigInts: true });
  db.exec('PRAGMA foreign_keys=ON;PRAGMA journal_mode=WAL');
  const connection: Connection = {
    dialect: 'sqlite',
    async rows(sql, params = []) {
      return db.prepare(sql).all(...bind(params)).map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => {
        if (value instanceof Uint8Array) throw new TypeError('Unexpected binary database value');
        return [key, typeof value === 'bigint' ? safeInteger(value) : value];
      })));
    },
    async run(sql, params = []) { db.prepare(sql).run(...bind(params)); },
  };
  let tail = Promise.resolve(), closing = false, closed: Promise<void> | undefined;
  return {
    dialect: 'sqlite',
    transaction<T>(body: (connection: Connection) => Promise<T>, write = false) {
      if (closing) return Promise.reject(new Error('Database is closed'));
      const task = tail.then(async () => {
        db.exec(write ? 'BEGIN IMMEDIATE' : 'BEGIN');
        try { const result = await body(connection); db.exec('COMMIT'); return result; }
        catch (error) { db.exec('ROLLBACK'); throw error; }
      });
      tail = task.then(() => {}, () => {}); return task;
    },
    close() { closing = true; return closed ??= tail.then(() => { db.close(); }); },
  };
}
function mysqlConnection(connection: PoolConnection): Connection {
  return {
    dialect: 'mysql',
    async rows(sql, params = []) {
      const [rows, fields] = await connection.execute<RowDataPacket[]>({ sql, timeout: 30_000 }, bind(params));
      const integerFields = new Set(fields.filter(field => field.columnType === 8).map(field => field.name));
      return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]: [string, unknown]) => {
        if (integerFields.has(key) && typeof value === 'string') return [key, safeInteger(BigInt(value))];
        if (value === null || typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint') return [key, value];
        throw new TypeError('Unexpected database value');
      })));
    },
    async run(sql, params = []) { await connection.execute({ sql, timeout: 30_000 }, bind(params)); },
  };
}
function mysqlDatabase(url: string): Database {
  const target = new URL(url);
  const pool: Pool = createPool({ host: target.hostname, port: Number(target.port || 3306), user: decodeURIComponent(target.username), password: decodeURIComponent(target.password), database: decodeURIComponent(target.pathname.slice(1)), charset: target.searchParams.get('charset') || 'utf8mb4', connectionLimit: 10, connectTimeout: 10_000, supportBigNumbers: true, bigNumberStrings: true });
  let closing = false;
  return {
    dialect: 'mysql',
    async transaction<T>(body: (connection: Connection) => Promise<T>) {
      if (closing) throw new Error('Database is closed');
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        try { const result = await body(mysqlConnection(connection)); await connection.commit(); return result; }
        catch (error) { await connection.rollback(); throw error; }
      } finally { connection.release(); }
    },
    async close() { closing = true; await pool.end(); },
  };
}
export async function openDatabase(target?: string): Promise<Database> {
  const config = databaseTarget(target), db = config.dialect === 'sqlite' ? sqliteDatabase(config.path) : mysqlDatabase(config.url);
  try {
    await db.transaction(async connection => {
      for (const [name, columns] of Object.entries(tables)) await connection.run(`CREATE TABLE IF NOT EXISTS ${name} (${columns.replaceAll('{JSON}', db.dialect === 'mysql' ? 'LONGTEXT' : 'TEXT')})` + (db.dialect === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin' : ''));
    });
    const columns = await db.transaction(c => c.rows(db.dialect === 'sqlite' ? 'PRAGMA table_info(users)' : "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'"));
    if (!columns.some(column => column.name === 'name_key')) {
      if (config.dialect === 'sqlite' && config.path !== ':memory:') await backupSqlite(config.path);
      await db.transaction(c => c.run('ALTER TABLE users ADD COLUMN name_key VARCHAR(80)'), true);
    }
    await db.transaction(async connection => {
      for (const row of await connection.rows('SELECT id,name FROM users WHERE name_key IS NULL')) await connection.run('UPDATE users SET name_key=? WHERE id=?', [nameKey(String(row.name)), row.id!]);
      for (const [name, table, columns, unique] of indexes) {
        const existing = await connection.rows(db.dialect === 'sqlite' ? "SELECT name FROM sqlite_master WHERE type='index' AND name=?" : 'SELECT INDEX_NAME AS name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND INDEX_NAME=?', db.dialect === 'sqlite' ? [name] : [table, name]);
        if (!existing.length) await connection.run(`CREATE ${unique ? 'UNIQUE ' : ''}INDEX ${name} ON ${table} (${columns})`);
      }
    }, true);
    return db;
  } catch (error) { await db.close(); throw error; }
}
