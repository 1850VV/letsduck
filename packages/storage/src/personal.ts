import { existsSync, mkdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, win32 } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue, SQLOutputValue, StatementSync } from 'node:sqlite';
import { Invalid, JsonNumericValue, MAX_SCHEMES, readJsonField, schemeValues } from '@letsduck/domain';
import { jsonParse, jsonStringify, safeInteger } from './json.js';
import type { ExactInteger } from './json.js';

const schema = `CREATE TABLE IF NOT EXISTS schemes(id TEXT PRIMARY KEY, name TEXT NOT NULL, design TEXT NOT NULL,
  provenance TEXT, voice_salt INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS servo_setup(board TEXT NOT NULL, id INTEGER NOT NULL, record TEXT NOT NULL,
  updated INTEGER NOT NULL, PRIMARY KEY(board,id));
CREATE TABLE IF NOT EXISTS servo_preparation(id INTEGER PRIMARY KEY, state TEXT NOT NULL,
  prepared_leads TEXT NOT NULL, updated INTEGER NOT NULL)`;
type SqlRow = Record<string, SQLOutputValue>;

export interface PersonalStoreOptions { path?: string; partIds?: Iterable<string>; legacy?: string; }
export interface PersonalScheme {
  id: string; name: string; design: unknown; provenance: unknown;
  voiceSalt: ExactInteger; created: ExactInteger; updated: ExactInteger;
}
export type ServoRecord = Record<string, unknown>;
export interface PreparationUpdate { id: unknown; state?: unknown; preparedLeads?: unknown; }
export interface PreparationRecord { id: ExactInteger; state: string; preparedLeads: unknown; updatedAt: ExactInteger; }

/** Preserve the personal Python edition's external data location on each platform. */
export function defaultPersonalPath(platform: NodeJS.Platform = process.platform, env: NodeJS.ProcessEnv = process.env, home = homedir()): string {
  if (env.DUCK_PERSONAL_DB) return env.DUCK_PERSONAL_DB;
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'DoodleDuck', 'personal.db');
  if (platform === 'win32') return win32.join(env.APPDATA || win32.join(home, 'AppData', 'Roaming'), 'DoodleDuck', 'personal.db');
  return join(env.XDG_DATA_HOME || join(home, '.local', 'share'), 'doodleduck', 'personal.db');
}

function sqliteValue(value: unknown): SQLInputValue {
  const fromWire = value instanceof JsonNumericValue;
  if (value instanceof JsonNumericValue) value = value.isInteger ? BigInt(value.source) : value.value;
  if (typeof value === 'bigint') {
    if (value < -9223372036854775808n || value > 9223372036854775807n) throw new RangeError('Integer exceeds the SQLite signed 64-bit range');
    return value;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value) && !Number.isSafeInteger(value) && !fromWire) throw new RangeError('Numeric precision is unavailable; use an exact integer');
    return value;
  }
  if (typeof value === 'boolean') return Number(value);
  if (value === null || typeof value === 'string' || value instanceof Uint8Array) return value;
  throw new TypeError('Unsupported SQLite value');
}
function integerCell(row: SqlRow, key: string): ExactInteger {
  const value = row[key];
  if (typeof value === 'bigint') return safeInteger(value);
  if (typeof value === 'number') return value;
  throw new TypeError('Expected a SQLite integer in ' + key);
}
function stringCell(row: SqlRow, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new TypeError('Expected SQLite text in ' + key);
  return value;
}
function schemeJson(row: SqlRow): PersonalScheme {
  return { id: stringCell(row, 'id'), name: stringCell(row, 'name'), design: jsonParse(stringCell(row, 'design')),
    provenance: row.provenance ? jsonParse(stringCell(row, 'provenance')) : null,
    voiceSalt: integerCell(row, 'voice_salt'), created: integerCell(row, 'created'), updated: integerCell(row, 'updated') };
}
function preparationJson(row: SqlRow): PreparationRecord {
  return { id: integerCell(row, 'id'), state: stringCell(row, 'state'), preparedLeads: jsonParse(stringCell(row, 'prepared_leads')), updatedAt: integerCell(row, 'updated') };
}

/** Synchronous local storage; the original three tables and WAL remain Python-readable. */
export class PersonalStore {
  readonly path: string;
  readonly partIds: ReadonlySet<string>;
  readonly imported: number;
  readonly db: DatabaseSync;

  constructor(options: PersonalStoreOptions = {}) {
    this.path = options.path || defaultPersonalPath();
    this.partIds = new Set(options.partIds || []);
    mkdirSync(dirname(this.path), { recursive: true });
    const fresh = !existsSync(this.path);
    this.db = new DatabaseSync(this.path, { timeout: 5000 });
    try {
      this.db.exec('PRAGMA journal_mode=WAL');
      this.db.exec(schema);
      this.imported = fresh && options.legacy && existsSync(options.legacy) && statSync(options.legacy).isFile() ? this.importLegacy(options.legacy) : 0;
    } catch (error) { this.db.close(); throw error; }
  }

  close(): void { if (this.db.isOpen) this.db.close(); }

  private statement(sql: string, db = this.db): StatementSync {
    const statement = db.prepare(sql);
    statement.setReadBigInts(true);
    return statement;
  }
  private transaction<T>(body: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = body(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  schemes(): PersonalScheme[] {
    return this.statement('SELECT * FROM schemes ORDER BY updated DESC, id DESC').all().map(schemeJson);
  }

  saveScheme(id: string, data: unknown): PersonalScheme {
    const value = schemeValues(id, data, this.partIds), now = Date.now();
    const values = [value.name, jsonStringify(value.design), value.provenance === null ? null : jsonStringify(value.provenance), sqliteValue(value.voiceSalt)] satisfies SQLInputValue[];
    return this.transaction(() => {
      if (this.statement('SELECT 1 FROM schemes WHERE id=?').get(id)) {
        this.statement('UPDATE schemes SET name=?, design=?, provenance=?, voice_salt=?, updated=? WHERE id=?').run(...values, now, id);
      } else {
        const count = this.statement('SELECT COUNT(*) AS count FROM schemes').get()!;
        if (integerCell(count, 'count') >= MAX_SCHEMES) throw new Invalid(`最多保存 ${MAX_SCHEMES} 套方案，先删掉一些`, 'validation.11', { v0: MAX_SCHEMES });
        this.statement('INSERT INTO schemes VALUES(?,?,?,?,?,?,?)').run(id, ...values, now, now);
      }
      return schemeJson(this.statement('SELECT * FROM schemes WHERE id=?').get(id)!);
    });
  }

  deleteScheme(id: string): void { this.statement('DELETE FROM schemes WHERE id=?').run(id); }

  /** The board whose servo records changed most recently. */
  lastServoBoard(): string | null {
    const last = this.statement('SELECT board FROM servo_setup ORDER BY updated DESC LIMIT 1').get();
    return last ? stringCell(last, 'board') : null;
  }

  servoRecords(board?: string | null): ServoRecord[] {
    if (board === undefined || board === null) board = this.lastServoBoard() ?? '';
    return this.statement('SELECT record FROM servo_setup WHERE board=? ORDER BY id').all(board).map(row => jsonParse(stringCell(row, 'record')) as ServoRecord);
  }

  saveServoRecord(board: string, record: ServoRecord): void {
    this.statement('INSERT OR REPLACE INTO servo_setup VALUES(?,?,?,?)').run(board, sqliteValue(readJsonField(record, 'id')), jsonStringify(record), Date.now());
  }

  servoPreparationRecords(): PreparationRecord[] {
    return this.statement('SELECT * FROM servo_preparation ORDER BY id').all().map(preparationJson);
  }

  saveServoPreparation(updates: Iterable<PreparationUpdate>): PreparationRecord[] {
    this.transaction(() => {
      for (const update of updates) {
        const id = sqliteValue(readJsonField(update, 'id'));
        const old = this.statement('SELECT * FROM servo_preparation WHERE id=?').get(id);
        const state = Object.hasOwn(update, 'state') ? sqliteValue(readJsonField(update, 'state')) : old ? stringCell(old, 'state') : 'available';
        const leads = Object.hasOwn(update, 'preparedLeads') ? jsonStringify(update.preparedLeads) : old ? stringCell(old, 'prepared_leads') : '[]';
        this.statement('INSERT OR REPLACE INTO servo_preparation VALUES(?,?,?,?)').run(id, state, leads, Date.now());
      }
    });
    return this.servoPreparationRecords();
  }

  private importLegacy(legacy: string): number {
    let old: DatabaseSync | undefined, rows: SqlRow[];
    try {
      old = new DatabaseSync(resolve(legacy), { readOnly: true, timeout: 5000 });
      rows = this.statement('SELECT id,name,design,provenance,voice_salt,created,updated FROM schemes WHERE user_id=? ORDER BY updated DESC LIMIT ?', old).all('personal-owner', MAX_SCHEMES);
    } catch (error) {
      if (error instanceof Error && 'code' in error && typeof error.code === 'string' && error.code.startsWith('ERR_SQLITE')) return 0;
      throw error;
    } finally { old?.close(); }
    const insert = this.statement('INSERT OR IGNORE INTO schemes VALUES(?,?,?,?,?,?,?)');
    for (const row of rows) insert.run(...['id', 'name', 'design', 'provenance', 'voice_salt', 'created', 'updated'].map(key => sqliteValue(row[key])));
    return rows.length;
  }
}
