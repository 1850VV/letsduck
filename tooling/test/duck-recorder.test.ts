import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { DuckRecorder } from '../../packages/devices/src/duck-recorder.js';

const folder = (t: { after(fn: () => void): void }) => { const dir = mkdtempSync(join(tmpdir(), 'duck-rec-')); t.after(() => rmSync(dir, { recursive: true, force: true })); return dir; };
const files = (dir: string) => readdirSync(dir).flatMap(day => readdirSync(join(dir, day)).filter(name => name.endsWith('.jsonl.gz')).map(name => join(dir, day, name)));
const lines = (path: string) => gunzipSync(readFileSync(path)).toString().trim().split('\n').map(l => JSON.parse(l) as Record<string, unknown>);
const until = async (ok: () => boolean) => { for (let i = 0; i < 200 && !ok(); i++) await new Promise(r => setTimeout(r, 10)); };

test('records changed status fields and marked events, then stops once the page is gone', async t => {
  const dir = folder(t); let seq = 0;
  const rec = new DuckRecorder({ dir, idleMs: 150, read: async () => ({ mode: 'hold', mcu_seq: ++seq, angles: [1.23456, 2], deployment: { big: 'static' } }) });
  rec.touch(); await until(() => rec.status().rows >= 3);
  rec.mark('action', { action: 'mode', mode: 'policy' });
  await until(() => !rec.status().active); await rec.close();
  const [file] = files(dir); assert.ok(file?.endsWith('.jsonl.gz'));
  const all = lines(file!), rows = all.filter(l => l.s) as { s: Record<string, unknown> }[];
  assert.ok(all[0]!.start, 'starts with a header');
  assert.deepEqual(rows[0]!.s, { mode: 'hold', mcu_seq: 1, angles: [1.235, 2], deployment: { big: 'static' } }, 'first row is complete, 3 decimals');
  assert.deepEqual(rows[1]!.s, { mcu_seq: 2 }, 'later rows only carry what changed');
  assert.ok(all.some(l => l.event === 'action' && l.mode === 'policy'));
});

test('no file while the board does not answer', async t => {
  const dir = folder(t);
  const rec = new DuckRecorder({ dir, idleMs: 100, read: async () => { throw new Error('offline'); } });
  rec.touch(); await new Promise(r => setTimeout(r, 200)); await rec.close();
  assert.deepEqual(readdirSync(dir).length ? files(dir) : [], []);
});

test('oldest sittings are deleted beyond the size cap', async t => {
  const dir = folder(t); mkdirSync(join(dir, '2026-01-01'));
  writeFileSync(join(dir, '2026-01-01', '000000.jsonl.gz'), Buffer.alloc(5000));
  const rec = new DuckRecorder({ dir, idleMs: 50, maxBytes: 1000, read: async () => ({ mode: 'off' }) });
  rec.touch(); await until(() => rec.status().active); await rec.close();
  assert.equal(files(dir).some(f => f.includes('2026-01-01')), false);
  assert.equal(files(dir).length, 1);
});

const LEGS = [0, -5, -22, 0, 22, 0, 5, 22, 0, -22, 20, 20, 0, 0, 0];
test('a sitting summary carries its checkup and is listed as a trip after it ends', async t => {
  const dir = folder(t); let n = 0;
  const read = async () => { n++; return { mode: 'policy', uptime_s: 100 + n * .02, command: [0.2, 0, 0], recovery: { phase: n > 5 && n < 9 ? 'default_pose' : 'walk' }, gravity: [0, 0, -1], angles: LEGS, targets: LEGS }; };
  const rec = new DuckRecorder({ dir, idleMs: 300, read });
  rec.touch(); await until(() => rec.status().rows >= 12);
  const live = rec.sittings(); assert.equal(live.length, 1); assert.equal(live[0]!.checkup.falls.length, 1);
  await until(() => !rec.status().active); await rec.close();
  const [saved] = rec.sittings(); assert.equal(saved!.checkup.falls.length, 1); assert.ok(saved!.checkup.walkS > 0.1); assert.ok(saved!.boot! > 0);
  const [trip] = rec.trips(); assert.equal(trip!.checkup.rows.length, 7); assert.equal(trip!.files.length, 1);
  assert.ok(lines(files(dir).find(f => f.endsWith('.gz'))!).some(l => l.event === 'fall'));
});

test('a board restart starts a new trip; reopening the page during one power-on stays the same trip', async t => {
  const dir = folder(t); let boot = Date.now() - 500_000;
  const make = () => new DuckRecorder({ dir, idleMs: 200, read: async () => ({ mode: 'hold', uptime_s: (Date.now() - boot) / 1000 }) });
  let rec = make(); rec.touch(); await until(() => rec.status().rows >= 3);
  boot = Date.now();// Restarted: uptime starts over.
  rec.touch(); await until(() => files(dir).length === 2 && rec.status().rows >= 3);
  await until(() => !rec.status().active); await rec.close();
  assert.equal(files(dir).length, 2); assert.equal(rec.trips().length, 2);
  rec = make(); rec.touch(); await until(() => rec.status().rows >= 3); await until(() => !rec.status().active); await rec.close();
  assert.equal(files(dir).length, 3); assert.equal(rec.trips().length, 2, 'same power-on, same trip'); assert.equal(rec.trips()[0]!.files.length, 2);
});
