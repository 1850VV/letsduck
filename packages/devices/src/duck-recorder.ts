/**
 * Flight recorder: while the debug duck page is open, every board status is saved to the computer so any stretch
 * (a fall, a check, a skate) can be looked at later. One gzip file per sitting; a board restart starts a new one:
 *   <dir>/2026-11-08/103312.jsonl.gz
 * Lines: {"t":ms,"start":{...}} once, then {"t":ms,"s":{changed status fields}} per reading (a field that disappears
 * is null), and {"t":ms,"event":"action"|"done"|"offline"|"online",...} for what the person did. t is Unix time in ms;
 * the board's own mcu_seq counts 10 ms frames exactly. The file is flushed every second, so it can be read while recording.
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, type WriteStream } from 'node:fs';
import { join } from 'node:path';
import { constants, createGzip, type Gzip } from 'node:zlib';
import type { DeviceTiming } from './types.js';
import { deviceTiming } from './shared.js';
import { JsonNumericValue } from '@letsduck/domain';
import { CheckupMeter, checkup, mergeCheckup, type CheckupData, type Trip } from './duck-checkup.js';

type JsonRecord = Record<string, unknown>;
export interface RecorderOptions {
  /** Folder that holds one sub-folder per day. */
  dir: string;
  /** Reads one board status (GET /api/status). */
  read(): Promise<unknown>;
  timing?: Partial<DeviceTiming>;
  /** Stop this long after the page last asked for status. */
  idleMs?: number;
  /** Oldest sittings are deleted beyond this many bytes. */
  maxBytes?: number;
}
export interface RecorderStatus { active: boolean; file: string | null; rows: number; bytes: number }
/** What one sitting holds, kept beside it as <HHMMSS>.json so the checkup page need not unpack recordings. */
export interface SittingSummary { file: string; start: number; end: number; rows: number; /** Power-on time (Unix ms), from the board's uptime. */ boot: number | null; actions: Record<string, number>; checkup: CheckupData }


const FAST_MS = 20, SLOW_MS = 500, FLUSH_MS = 1000, SUMMARY_MS = 5000;
// Boot times computed from uptime jitter by the request time; a restart moves them by at least the time it takes.
const SAME_BOOT_MS = 10_000;
// With servos limp nothing is driven, so 2 readings a second are plenty.
const LIMP = new Set(['off', 'shadow']);

/** Numbers to 3 decimals: far below what the servos (0.088°) or IMU resolve, and it keeps the file small. */
function compact(value: unknown): unknown {
  if (typeof value === 'number') return Number.isInteger(value) ? value : Math.round(value * 1000) / 1000;
  if (typeof value === 'bigint') return Number(value);
  if (value instanceof JsonNumericValue) return compact(value.value);
  if (Array.isArray(value)) return value.map(compact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, compact(v)]));
  return value;
}
const two = (n: number) => String(n).padStart(2, '0');

export class DuckRecorder {
  private readonly timing: DeviceTiming;
  private readonly idleMs: number;
  private readonly maxBytes: number;
  private touched = -Infinity;
  private loop: Promise<void> | undefined;
  private closed = false;
  private file: string | null = null;
  private gzip: Gzip | null = null;
  private out: WriteStream | null = null;
  private rows = 0;
  private written = 0;
  private last: Record<string, string> = {};
  private summary: SittingSummary | null = null;
  private meter = new CheckupMeter();
  constructor(private readonly options: RecorderOptions) {
    this.timing = deviceTiming(options.timing ?? {});
    this.idleMs = options.idleMs ?? 15000; this.maxBytes = options.maxBytes ?? 2_000_000_000;
  }
  /** The page is open: keep recording (start if needed). */
  touch(): void {
    this.touched = this.timing.monotonic();
    if (!this.closed && !this.loop) this.loop = this.run().finally(() => { this.loop = undefined; });
  }
  /** Something the person did; ignored when not recording. */
  mark(event: string, data: JsonRecord = {}): void {
    if (!this.gzip) return;
    if (event === 'action' && typeof data.action === 'string') this.summary!.actions[data.action] = (this.summary!.actions[data.action] ?? 0) + 1;
    this.line({ t: this.timing.now(), event, ...(compact(data) as JsonRecord) });
  }
  status(): RecorderStatus { return { active: this.gzip !== null, file: this.file, rows: this.rows, bytes: this.written }; }
  /** Summaries of the saved sittings, newest first, plus the one being recorded. */
  sittings(limit = 300): SittingSummary[] {
    const out: SittingSummary[] = this.summary ? [{ ...this.summary, actions: { ...this.summary.actions }, checkup: this.meter.data() }] : [];
    try {
      for (const day of readdirSync(this.options.dir).filter(n => /^\d{4}-\d\d-\d\d$/.test(n)).sort().reverse()) {
        const found: SittingSummary[] = [];
        for (const name of readdirSync(join(this.options.dir, day)).filter(n => n.endsWith('.json'))) {
          try { found.push(JSON.parse(readFileSync(join(this.options.dir, day, name), 'utf8')) as SittingSummary); } catch { /* A half-written summary is skipped. */ }
        }
        for (const summary of found.sort((a, b) => b.start - a.start)) { if (out.length >= limit) return out; if (summary.file !== this.summary?.file) out.push(summary); }
      }
    } catch { /* No recordings yet. */ }
    return out;
  }
  /** Sittings grouped by power-on, newest first, each with its checkup. */
  trips(limit = 30): Trip[] {
    const groups: SittingSummary[][] = [];
    for (const s of this.sittings()) {
      if (!s.checkup) continue;// Sittings recorded before the checkup existed.
      const group = groups.find(g => s.boot !== null && g[0]!.boot !== null && Math.abs(g[0]!.boot - s.boot) < SAME_BOOT_MS);
      if (group) group.push(s); else if (groups.length < limit) groups.push([s]);
    }
    return groups.map(g => {
      const parts = [...g].sort((a, b) => a.start - b.start), data = mergeCheckup(parts.map(p => p.checkup)), actions: Record<string, number> = {};
      for (const p of parts) for (const [k, n] of Object.entries(p.actions)) actions[k] = (actions[k] ?? 0) + n;
      return { boot: parts[0]!.boot, start: parts[0]!.start, end: parts.at(-1)!.end, files: parts.map(p => p.file), actions, data, checkup: checkup(data) };
    });
  }
  async close(): Promise<void> { this.closed = true; await this.loop; }

  private line(record: JsonRecord): void {
    const text = JSON.stringify(record) + '\n'; this.written += text.length; this.gzip!.write(text);
  }
  private open(): void {
    const now = new Date(this.timing.now()), day = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
    mkdirSync(join(this.options.dir, day), { recursive: true });
    this.prune();
    const stem = join(this.options.dir, day, `${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`);
    let n = 1; this.file = `${stem}.jsonl.gz`;
    while (existsSync(this.file)) this.file = `${stem}-${++n}.jsonl.gz`;// Two sittings in one second (a quick restart).
    this.gzip = createGzip(); this.out = createWriteStream(this.file); this.gzip.pipe(this.out);
    this.rows = 0; this.written = 0; this.last = {}; this.meter = new CheckupMeter();
    this.summary = { file: join(day, this.file.split('/').pop()!), start: this.timing.now(), end: this.timing.now(), rows: 0, boot: null, actions: {}, checkup: this.meter.data() };
    this.line({ t: this.timing.now(), start: { version: 1, at: now.toISOString() } });
  }
  private async finish(): Promise<void> {
    this.writeSummary();
    const gzip = this.gzip, out = this.out; this.gzip = null; this.out = null; this.summary = null;
    if (!gzip || !out) return;
    await new Promise<void>(resolve => { out.once('close', () => resolve()); out.once('error', () => resolve()); gzip.end(); });
  }
  /** Also written every few seconds, so a sitting cut off by closing 来做鸭 still shows up. */
  private writeSummary(): void {
    if (this.summary && this.file) try { writeFileSync(this.file.replace(/\.jsonl\.gz$/, '.json'), JSON.stringify({ ...this.summary, checkup: this.meter.data() })); } catch { /* The recording itself is kept. */ }
  }
  /** Keep the newest sittings within maxBytes. */
  private prune(): void {
    try {
      const files: { path: string; size: number }[] = [];
      for (const day of readdirSync(this.options.dir).sort()) {
        const folder = join(this.options.dir, day);
        if (!statSync(folder).isDirectory()) continue;
        for (const name of readdirSync(folder).filter(n => n.endsWith('.jsonl.gz')).sort()) files.push({ path: join(folder, name), size: statSync(join(folder, name)).size });
      }
      let total = files.reduce((sum, f) => sum + f.size, 0);
      for (const f of files) { if (total <= this.maxBytes) break; rmSync(f.path, { force: true }); rmSync(f.path.replace(/\.jsonl\.gz$/, '.json'), { force: true }); total -= f.size; }
    } catch { /* A full disk only stops pruning, not recording. */ }
  }
  private async run(): Promise<void> {
    let online: boolean | null = null, flushed = this.timing.monotonic(), summarized = flushed;
    try {
      while (!this.closed && this.timing.monotonic() - this.touched < this.idleMs) {
        const began = this.timing.monotonic();
        let status: unknown = null;
        try { status = await this.options.read(); } catch { status = null; }
        const ok = status !== null && typeof status === 'object' && !Array.isArray(status);
        if (ok && this.gzip && this.restarted(status as JsonRecord)) { await this.finish(); online = null; }
        if (ok && !this.gzip) this.open();
        if (this.gzip && ok !== online) { if (online !== null || !ok) this.mark(ok ? 'online' : 'offline'); online = ok; }
        if (ok) this.save(status as JsonRecord);
        if (this.gzip && this.timing.monotonic() - flushed > FLUSH_MS) { this.gzip.flush(constants.Z_SYNC_FLUSH); flushed = this.timing.monotonic(); }
        if (this.gzip && this.timing.monotonic() - summarized > SUMMARY_MS) { this.writeSummary(); summarized = this.timing.monotonic(); }
        const mode = ok ? (status as JsonRecord).mode : null, wait = (ok && !LIMP.has(String(mode)) ? FAST_MS : SLOW_MS) - (this.timing.monotonic() - began);
        if (wait > 0) await this.timing.sleep(wait);
      }
    } finally { await this.finish(); }
  }
  private bootOf(status: JsonRecord): number | null {
    const up = status.uptime_s instanceof JsonNumericValue ? Number(status.uptime_s.value) : status.uptime_s;
    return typeof up === 'number' && Number.isFinite(up) ? Math.round(this.timing.now() - up * 1000) : null;
  }
  /** The board came back with a new power-on time: that is a new trip. */
  private restarted(status: JsonRecord): boolean {
    const boot = this.bootOf(status), was = this.summary?.boot ?? null;
    return boot !== null && was !== null && Math.abs(boot - was) >= SAME_BOOT_MS;
  }
  private save(status: JsonRecord): void {
    const changed: JsonRecord = {}, seen = new Set<string>();
    for (const [key, raw] of Object.entries(status)) {
      seen.add(key); const value = compact(raw), text = JSON.stringify(value);
      if (this.last[key] !== text) { changed[key] = value; this.last[key] = text; }
    }
    for (const key of Object.keys(this.last)) if (!seen.has(key)) { changed[key] = null; delete this.last[key]; }
    const now = this.timing.now(), summary = this.summary!;
    this.line({ t: now, s: changed }); this.rows++;
    summary.boot ??= this.bootOf(status);
    if (this.meter.add(compact(status) as JsonRecord, now)) this.line({ t: now, event: 'fall', gravity: compact(status.gravity) });
    summary.end = now; summary.rows = this.rows;
  }
}
