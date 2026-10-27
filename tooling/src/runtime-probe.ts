import { Context } from '@deepseek-ai/cordis';
import Fastify from 'fastify';
import mysql from 'mysql2/promise';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify, parseArgs } from 'node:util';
import { execFile } from 'node:child_process';

const { values } = parseArgs({ options: { electron: { type: 'string' } } });
const directory = await mkdtemp(join(tmpdir(), 'letsduck-runtime-'));
const path = join(directory, 'compatibility.db'), context = new Context();
const http = Fastify({ logger: false });
const db = new DatabaseSync(path);
let address = '';
try {
  await context.plugin(ctx => {
    db.exec("CREATE TABLE preserved(id TEXT PRIMARY KEY, value TEXT NOT NULL); INSERT INTO preserved VALUES('original','preserved')");
    ctx.effect(() => () => db.close());
  });
  http.get('/probe', () => ({ databaseValue: db.prepare('SELECT value FROM preserved WHERE id=?').get('original')?.['value'] }));
  address = await http.listen({ host: '127.0.0.1', port: 0 });
  const response: unknown = await (await fetch(address + '/probe')).json();
  let electron: { node: string; sqlite: string; preserved: boolean } | null = null;
  if (values.electron) {
    const fixture = join(directory, 'electron-sqlite.cjs');
    await writeFile(fixture, `const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[2]);const row=db.prepare('SELECT value FROM preserved WHERE id=?').get('original');db.prepare('UPDATE preserved SET value=? WHERE id=?').run('electron','original');db.close();console.log(JSON.stringify({node:process.version,sqlite:process.versions.sqlite,preserved:row.value==='preserved'}));`);
    const result = await promisify(execFile)(values.electron, [fixture, path], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, timeout: 10_000 });
    const parsed: unknown = JSON.parse(result.stdout);
    if (!parsed || typeof parsed !== 'object' || !('preserved' in parsed) || parsed.preserved !== true || !('node' in parsed) || typeof parsed.node !== 'string' || !('sqlite' in parsed) || typeof parsed.sqlite !== 'string') throw new Error('Electron did not preserve the SQLite fixture');
    if (db.prepare('SELECT value FROM preserved WHERE id=?').get('original')?.['value'] !== 'electron') throw new Error('Node could not read the Electron write');
    electron = { node: parsed.node, sqlite: parsed.sqlite, preserved: true };
  }
  await http.close(); await context.fiber.dispose();
  let listenerClosed = false;
  try { await fetch(address + '/probe'); } catch { listenerClosed = true; }
  if (!listenerClosed) throw new Error('Runtime probe left its listener open');
  const reopened = new DatabaseSync(path); reopened.exec('BEGIN IMMEDIATE; ROLLBACK'); reopened.close();
  // Importing mysql2 verifies the selected ESM boundary; actual MySQL is a separate test gate.
  if (typeof mysql.createPool !== 'function') throw new Error('MySQL Promise driver is unavailable');
  console.log(JSON.stringify({ status: 'passed', node: process.version, sqlite: process.versions.sqlite, http: response, listenerClosed, databaseReopened: true, mysqlDriver: 'loaded', mysqlServer: 'not_tested', electron }));
} finally {
  await http.close(); await context.fiber.dispose();
  if (db.isOpen) db.close();
  await rm(directory, { recursive: true, force: true });
}
