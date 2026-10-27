/** Server storage with the same schema, account hashes and business rules as backend/store.py. */
import { pbkdf2, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Design } from '@letsduck/contracts';
import { Invalid, MAX_SCHEMES, JsonNumericValue, isJsonObject, pythonString, pythonStrip, pythonTruthy, readJsonField, schemeValues, text, validateDesign } from '@letsduck/domain';
import { nameKey, openDatabase } from './database.js';
import type { Cell, Connection, Database, Row } from './database.js';
import { jsonParse, jsonStringify, safeInteger } from './json.js';
import type { ExactInteger } from './json.js';
import type { ServerScheme, ServerSession, ServerStoreOptions, ServerUser, ServerWork } from './server-types.js';

export const AVATARS: readonly string[] = ['🦆', '🐤', '🐥', '🪿', '🐣', '🦢', '🐧', '🦜'];
export const COLORS: readonly string[] = ['#4d6bfe', '#ff7a59', '#2fb37a', '#f2b51d', '#9b6bff', '#ef5da8', '#2aa8c9', '#5c6a85'];
const hashAsync = promisify(pbkdf2);
const now = () => Date.now();
const workSelect = 'SELECT works.*, users.name, users.avatar, users.color FROM works JOIN users ON works.user_id = users.id';

function typeName(value: unknown): string {
  if (value === null || value === undefined) return 'NoneType';
  if (value instanceof JsonNumericValue) return value.isInteger ? 'int' : 'float';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'bigint') return 'int';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'string') return 'str';
  return Array.isArray(value) ? 'list' : 'dict';
}
function mapping(value: unknown): Record<string, unknown> {
  if (!isJsonObject(value)) throw new TypeError(`'${typeName(value)}' object has no attribute 'get'`);
  return value;
}
function cell(value: unknown): Cell {
  if (value === undefined || value === null) return null;
  if (value instanceof JsonNumericValue) return value.isInteger ? BigInt(value.source) : value.value;
  if (typeof value === 'boolean') return Number(value);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') return value;
  throw new TypeError('Unsupported database parameter');
}
function stringCell(row: Row, key: string): string {
  const value = row[key];
  if (typeof value !== 'string') throw new TypeError(`Expected text in ${key}`);
  return value;
}
function nullableString(row: Row, key: string): string | null { return row[key] === null ? null : stringCell(row, key); }
function integerCell(row: Row, key: string): ExactInteger {
  const value = row[key];
  if (typeof value === 'bigint') return safeInteger(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
  // COUNT may be supplied as a decimal string by a MySQL aggregate column.
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return safeInteger(BigInt(value));
  throw new TypeError(`Expected an exact integer in ${key}`);
}
function one(rows: Row[]): Row {
  if (rows.length !== 1) throw new Error('No row was found when one was required');
  return rows[0]!;
}
function integrity(error: unknown): boolean {
  if (!isJsonObject(error)) return false;
  return (typeof error.code === 'string' && error.code.startsWith('SQLITE_CONSTRAINT')) ||
    (typeof error.errcode === 'number' && (error.errcode & 255) === 19) || error.sqlState === '23000' ||
    (typeof error.errno === 'number' && [1048, 1062, 1451, 1452, 3819, 4025].includes(error.errno));
}
function hash(password: string, salt: string): Promise<Buffer> { return hashAsync(password, Buffer.from(salt, 'hex'), 120_000, 32, 'sha256'); }
function checkPassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || Array.from(password).length < 4) throw new Invalid('密码至少 4 位', 'auth.password_short');
}
function notOwner(): Invalid { return new Invalid('这个方案不属于你', 'schemes.not_owner'); }
function nameTaken(): Invalid { return new Invalid('这个昵称已经有人用了，换一个吧', 'auth.name_taken'); }

/** Round the actual IEEE-754 value to two decimals, with Python's ties-to-even rule.
 * Multiplying a double by 100 first would turn 2.675 into a false exact tie. */
function ratingRound(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 5) throw new TypeError('Invalid rating average');
  if (value === 0) return 0;
  const bytes = new DataView(new ArrayBuffer(8)); bytes.setFloat64(0, value);
  const bits = bytes.getBigUint64(0), exponent = Number((bits >> 52n) & 0x7ffn);
  const mantissa = (bits & 0xfffffffffffffn) | (exponent ? 0x10000000000000n : 0n);
  const shift = (exponent || 1) - 1023 - 52;
  let numerator = mantissa * 100n, denominator = 1n;
  if (shift >= 0) numerator <<= BigInt(shift); else denominator <<= BigInt(-shift);
  let rounded = numerator / denominator; const remainder = numerator % denominator;
  if (remainder * 2n > denominator || (remainder * 2n === denominator && rounded % 2n !== 0n)) rounded++;
  // The rating range above bounds this conversion to 0..500.
  return Number(rounded) / 100;
}

export class ServerStore {
  private constructor(readonly db: Database, private readonly partIds: ReadonlySet<string>) {}
  static async open(options: ServerStoreOptions = {}): Promise<ServerStore> {
    return new ServerStore(await openDatabase(options.database), new Set(options.partIds));
  }
  close(): Promise<void> { return this.db.close(); }
  private lock(connection: Connection): string { return connection.dialect === 'mysql' ? ' FOR UPDATE' : ''; }
  private userJson(row: Row): ServerUser {
    return { id: stringCell(row, 'id'), name: stringCell(row, 'name'), avatar: stringCell(row, 'avatar'), color: stringCell(row, 'color'), created: integerCell(row, 'created') };
  }
  private async session(connection: Connection, uid: string): Promise<ServerSession> {
    const token = randomBytes(32).toString('base64url');
    await connection.run('INSERT INTO sessions (token,user_id,created) VALUES (?,?,?)', [token, uid, now()]);
    return { token, user: this.userJson(one(await connection.rows('SELECT * FROM users WHERE id = ?', [uid]))) };
  }
  async register(name: unknown, password: unknown): Promise<ServerSession> {
    const normalized = text(name, 20, '昵称'); checkPassword(password);
    const salt = randomBytes(16).toString('hex'), uid = 'u-' + randomBytes(6).toString('hex'), hashed = (await hash(password, salt)).toString('hex');
    try {
      return await this.db.transaction(async connection => {
        await connection.run('INSERT INTO users (id,name,name_key,pw_salt,pw_hash,avatar,color,created) VALUES (?,?,?,?,?,?,?,?)',
          [uid, normalized, nameKey(normalized), salt, hashed, AVATARS[randomInt(AVATARS.length)]!, COLORS[randomInt(COLORS.length)]!, now()]);
        return this.session(connection, uid);
      }, true);
    } catch (error) { if (integrity(error)) throw nameTaken(); throw error; }
  }
  async login(name: unknown, password: unknown): Promise<ServerSession> {
    const key = nameKey(pythonStrip(pythonString(pythonTruthy(name) ? name : '')));
    const row = (await this.db.transaction(connection => connection.rows('SELECT * FROM users WHERE name_key = ?', [key])))[0];
    let matches = false;
    if (row) {
      const expected = Buffer.from(stringCell(row, 'pw_hash'), 'hex'), actual = await hash(pythonString(pythonTruthy(password) ? password : ''), stringCell(row, 'pw_salt'));
      matches = expected.length === actual.length && timingSafeEqual(expected, actual);
    }
    if (!row || !matches) throw new Invalid('昵称或密码不对', 'auth.invalid_credentials');
    return this.db.transaction(connection => this.session(connection, stringCell(row, 'id')), true);
  }
  async userFor(token?: string | null): Promise<ServerUser | null> {
    if (!token) return null;
    return this.db.transaction(async connection => {
      const row = (await connection.rows('SELECT users.* FROM users JOIN sessions ON users.id = sessions.user_id WHERE sessions.token = ?', [token]))[0];
      return row ? this.userJson(row) : null;
    });
  }
  async logout(token: string): Promise<void> { await this.db.transaction(connection => connection.run('DELETE FROM sessions WHERE token = ?', [token]), true); }
  async updateUser(uid: string, input: unknown): Promise<ServerUser> {
    try {
      return await this.db.transaction(async connection => {
        const row = one(await connection.rows('SELECT * FROM users WHERE id = ?' + this.lock(connection), [uid]));
        const data = mapping(input), value = (key: string) => Object.hasOwn(data, key) ? readJsonField(data, key) : row[key];
        const name = text(value('name'), 20, '昵称'), avatar = value('avatar'), color = value('color');
        if (typeof avatar !== 'string' || !AVATARS.includes(avatar) || typeof color !== 'string' || !COLORS.includes(color)) throw new Invalid('头像或颜色不在可选范围内', 'validation.8');
        let sql = 'UPDATE users SET name = ?, name_key = ?, avatar = ?, color = ?', params: Cell[] = [name, nameKey(name), avatar, color];
        const password = readJsonField(data, 'password');
        if (pythonTruthy(password)) {
          checkPassword(password); const salt = randomBytes(16).toString('hex');
          sql += ', pw_salt = ?, pw_hash = ?'; params.push(salt, (await hash(password, salt)).toString('hex'));
        }
        await connection.run(sql + ' WHERE id = ?', [...params, uid]);
        return this.userJson(one(await connection.rows('SELECT * FROM users WHERE id = ?', [uid])));
      }, true);
    } catch (error) { if (integrity(error)) throw nameTaken(); throw error; }
  }
  private schemeJson(row: Row): ServerScheme {
    return { id: stringCell(row, 'id'), name: stringCell(row, 'name'), design: jsonParse(stringCell(row, 'design')) as Design,
      provenance: row.provenance ? jsonParse(stringCell(row, 'provenance')) : null, voiceSalt: integerCell(row, 'voice_salt'), created: integerCell(row, 'created'), updated: integerCell(row, 'updated') };
  }
  async schemes(uid: string): Promise<ServerScheme[]> {
    return this.db.transaction(async connection => (await connection.rows('SELECT * FROM schemes WHERE user_id = ? ORDER BY updated DESC, id DESC', [uid])).map(row => this.schemeJson(row)));
  }
  async saveScheme(uid: string, sid: unknown, input: unknown): Promise<ServerScheme> {
    const values = schemeValues(sid, input, this.partIds), timestamp = now();
    const fields: Cell[] = [values.name, jsonStringify(values.design), pythonTruthy(values.provenance) ? jsonStringify(values.provenance) : null, values.voiceSalt, timestamp];
    try {
      return await this.db.transaction(async connection => {
        one(await connection.rows('SELECT id FROM users WHERE id = ?' + this.lock(connection), [uid]));
        // Lock the account for quota, but do not gap-lock missing scheme IDs. The PK arbitrates ownership races.
        const existing = (await connection.rows('SELECT * FROM schemes WHERE id = ?', [cell(sid)]))[0];
        if (existing && existing.user_id !== uid) throw notOwner();
        if (existing) await connection.run('UPDATE schemes SET name = ?, design = ?, provenance = ?, voice_salt = ?, updated = ? WHERE id = ?', [...fields, cell(sid)]);
        else {
          const count = integerCell(one(await connection.rows('SELECT COUNT(*) AS n FROM schemes WHERE user_id = ?', [uid])), 'n');
          if (count >= MAX_SCHEMES) throw new Invalid(`最多保存 ${MAX_SCHEMES} 套方案，先删掉一些`, 'validation.11', { v0: MAX_SCHEMES });
          await connection.run('INSERT INTO schemes (id,user_id,name,design,provenance,voice_salt,updated,created) VALUES (?,?,?,?,?,?,?,?)', [cell(sid), uid, ...fields, timestamp]);
        }
        return this.schemeJson(one(await connection.rows('SELECT * FROM schemes WHERE id = ?', [cell(sid)])));
      }, true);
    } catch (error) { if (integrity(error)) throw notOwner(); throw error; }
  }
  async deleteScheme(uid: string, sid: string): Promise<void> {
    await this.db.transaction(connection => connection.run('DELETE FROM schemes WHERE id = ? AND user_id = ?', [sid, uid]), true);
  }
  private async workRows(connection: Connection, rows: Row[], viewer?: string): Promise<ServerWork[]> {
    if (!rows.length) return [];
    const ids = rows.map(row => stringCell(row, 'id')), placeholders = ids.map(() => '?').join(',');
    const stats = new Map((await connection.rows(`SELECT work_id, COUNT(*) AS n, AVG(stars) AS average FROM ratings WHERE work_id IN (${placeholders}) GROUP BY work_id`, ids)).map(row => [stringCell(row, 'work_id'), row]));
    const mine = new Map(viewer ? (await connection.rows(`SELECT work_id, stars FROM ratings WHERE work_id IN (${placeholders}) AND user_id = ?`, [...ids, viewer])).map(row => [stringCell(row, 'work_id'), integerCell(row, 'stars')]) : []);
    const forks = new Map((await connection.rows(`SELECT parent_id, COUNT(*) AS n FROM works WHERE parent_id IN (${placeholders}) GROUP BY parent_id`, ids)).map(row => [stringCell(row, 'parent_id'), integerCell(row, 'n')]));
    return rows.map(row => {
      const id = stringCell(row, 'id'), rating = stats.get(id), average = rating ? Number(rating.average) : 0;
      return { id, title: stringCell(row, 'title'), description: stringCell(row, 'description'), design: jsonParse(stringCell(row, 'design')) as Design,
        provenance: row.provenance ? jsonParse(stringCell(row, 'provenance')) : null, parentId: nullableString(row, 'parent_id'), schemeId: viewer === row.user_id ? nullableString(row, 'scheme_id') : null,
        created: integerCell(row, 'created'), author: { id: stringCell(row, 'user_id'), name: stringCell(row, 'name'), avatar: stringCell(row, 'avatar'), color: stringCell(row, 'color') },
        rating: { count: rating ? integerCell(rating, 'n') : 0, average: ratingRound(average), mine: mine.get(id) ?? 0 }, forks: forks.get(id) ?? 0 };
    });
  }
  async works(viewer?: string, author?: string, limit: number | bigint = 200, offset: number | bigint = 0): Promise<ServerWork[]> {
    if (!(limit >= 1 && limit <= 200) || offset < 0) throw new Invalid('分页范围不对', 'request.pagination');
    // Integer LIMIT/OFFSET are literals because MySQL prepared LIMIT parameters differ across versions.
    if ((typeof limit !== 'bigint' && !Number.isSafeInteger(limit)) || (typeof offset !== 'bigint' && !Number.isSafeInteger(offset))) throw new TypeError('LIMIT and OFFSET must be exact integers');
    const filter = author ? ' WHERE works.user_id = ?' : '';
    return this.db.transaction(async connection => this.workRows(connection, await connection.rows(workSelect + filter + ` ORDER BY works.created DESC, works.id DESC LIMIT ${limit} OFFSET ${offset}`, author ? [author] : []), viewer));
  }
  private async workIn(connection: Connection, wid: string, viewer?: string): Promise<ServerWork> {
    const rows = await connection.rows(workSelect + ' WHERE works.id = ?', [wid]);
    if (!rows.length) throw new Invalid('作品不存在', 'validation.15');
    return (await this.workRows(connection, rows, viewer))[0]!;
  }
  async work(wid: string, viewer?: string): Promise<ServerWork> { return this.db.transaction(connection => this.workIn(connection, wid, viewer)); }
  async publish(uid: string, input: unknown): Promise<ServerWork> {
    const data = mapping(input), title = text(readJsonField(data, 'title'), 40, '作品名称'), design = validateDesign(data.design, this.partIds);
    if (Object.values(design.assignments).some(value => value === null)) throw new Invalid('发布前请为全部零件匹配真实耗材', 'validation.13');
    return this.db.transaction(async connection => {
      let parent = readJsonField(data, 'parentId');
      if (pythonTruthy(parent) && !(await connection.rows('SELECT id FROM works WHERE id = ?' + this.lock(connection), [cell(parent)])).length) parent = null;
      const id = 'w-' + randomBytes(6).toString('hex'), provenance = readJsonField(data, 'provenance');
      await connection.run('INSERT INTO works (id,user_id,title,description,design,provenance,parent_id,scheme_id,created) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, uid, title, text(readJsonField(data, 'description'), 240, '', false), jsonStringify(design), pythonTruthy(provenance) ? jsonStringify(provenance) : null, cell(parent), cell(readJsonField(data, 'schemeId')), now()]);
      return this.workIn(connection, id, uid);
    }, true);
  }
  async deleteWork(uid: string, wid: string): Promise<void> {
    await this.db.transaction(async connection => {
      const row = (await connection.rows('SELECT user_id FROM works WHERE id = ?' + this.lock(connection), [wid]))[0];
      if (row?.user_id !== uid) throw new Invalid('只能删除自己的作品', 'validation.14');
      await connection.run('UPDATE works SET parent_id = NULL WHERE parent_id = ?', [wid]);
      await connection.run('DELETE FROM works WHERE id = ?', [wid]);
    }, true);
  }
  async rate(uid: string, wid: string, stars: unknown): Promise<ServerWork> {
    if (stars instanceof JsonNumericValue && stars.isInteger) stars = BigInt(stars.source);
    if (!((typeof stars === 'number' && Number.isInteger(stars)) || typeof stars === 'bigint') || stars < 1 || stars > 5) throw new Invalid('评分必须是 1 到 5 星', 'validation.17');
    return this.db.transaction(async connection => {
      const owner = (await connection.rows('SELECT user_id FROM works WHERE id = ?' + this.lock(connection), [wid]))[0]?.user_id;
      if (!owner) throw new Invalid('作品不存在', 'validation.15');
      if (owner === uid) throw new Invalid('不能给自己的作品评分', 'validation.16');
      if ((await connection.rows('SELECT stars FROM ratings WHERE work_id = ? AND user_id = ?', [wid, uid])).length) await connection.run('UPDATE ratings SET stars = ? WHERE work_id = ? AND user_id = ?', [stars, wid, uid]);
      else await connection.run('INSERT INTO ratings (work_id,user_id,stars) VALUES (?,?,?)', [wid, uid, stars]);
      return this.workIn(connection, wid, uid);
    }, true);
  }
}
