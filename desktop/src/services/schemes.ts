import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, win32, posix } from 'node:path';
import { homedir } from 'node:os';
import { Invalid, MAX_SCHEMES, schemeValues, type JsonObject } from '../rules.js';

export function defaultDatabasePath(platform = process.platform, home = homedir(), env: NodeJS.ProcessEnv = process.env) {
  if (env.DUCK_PERSONAL_DB) return env.DUCK_PERSONAL_DB;
  if (platform === 'win32') return win32.join(env.APPDATA || win32.join(home, 'AppData', 'Roaming'), 'DoodleDuck', 'personal.db');
  return platform === 'darwin' ? posix.join(home, 'Library', 'Application Support', 'DoodleDuck', 'personal.db') : posix.join(env.XDG_DATA_HOME || posix.join(home, '.local', 'share'), 'doodleduck', 'personal.db');
}

export class PersonalStore {
  private db: DatabaseSync;
  readonly imported: number;
  constructor(readonly path = defaultDatabasePath(), private partIds: string[] = [], legacy?: string) {
    const fresh = !existsSync(path);
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    try {
      // Preserve the existing database mode; this is the Python personal edition's schema.
      this.db.exec('CREATE TABLE IF NOT EXISTS schemes(id TEXT PRIMARY KEY, name TEXT NOT NULL, design TEXT NOT NULL, provenance TEXT, voice_salt INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL)');
      this.imported = fresh && legacy && existsSync(legacy) ? this.importLegacy(legacy) : 0;
    } catch (e) { this.db.close(); throw e; }
  }
  private row(row: any) {
    return { id: row.id as string, name: row.name as string, design: JSON.parse(row.design), provenance: row.provenance ? JSON.parse(row.provenance) : null, voiceSalt: Number(row.voice_salt), created: Number(row.created), updated: Number(row.updated) };
  }
  schemes() { return this.db.prepare('SELECT * FROM schemes ORDER BY updated DESC, id DESC').all().map(r => this.row(r)); }
  save(id: string, data: JsonObject) {
    const v = schemeValues(id, data, this.partIds), now = Date.now();
    const values = [v.name, JSON.stringify(v.design), v.provenance === null ? null : JSON.stringify(v.provenance), v.voiceSalt];
    this.db.exec('BEGIN IMMEDIATE');
    try {
      if (this.db.prepare('SELECT 1 FROM schemes WHERE id=?').get(id)) this.db.prepare('UPDATE schemes SET name=?,design=?,provenance=?,voice_salt=?,updated=? WHERE id=?').run(...values, now, id);
      else {
        if (Number(this.db.prepare('SELECT COUNT(*) AS count FROM schemes').get()!.count) >= MAX_SCHEMES) throw new Invalid(`最多保存 ${MAX_SCHEMES} 套方案，先删掉一些`, 'validation.11', { v0: MAX_SCHEMES });
        this.db.prepare('INSERT INTO schemes VALUES(?,?,?,?,?,?,?)').run(id, ...values, now, now);
      }
      const result = this.row(this.db.prepare('SELECT * FROM schemes WHERE id=?').get(id));
      this.db.exec('COMMIT'); return result;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
  delete(id: string) { this.db.prepare('DELETE FROM schemes WHERE id=?').run(id); }
  close() { this.db.close(); }
  private importLegacy(path: string) {
    let old: DatabaseSync | undefined; let rows: any[];
    try {
      old = new DatabaseSync(path, { readOnly: true });
      rows = old.prepare('SELECT id,name,design,provenance,voice_salt,created,updated FROM schemes WHERE user_id=? ORDER BY updated DESC LIMIT ?').all('personal-owner', MAX_SCHEMES);
    } catch { return 0; } finally { old?.close(); }
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const insert = this.db.prepare('INSERT OR IGNORE INTO schemes VALUES(?,?,?,?,?,?,?)');
      for (const r of rows) insert.run(r.id, r.name, r.design, r.provenance, r.voice_salt, r.created, r.updated);
      this.db.exec('COMMIT'); return rows.length;
    } catch (e) { this.db.exec('ROLLBACK'); throw e; }
  }
}
