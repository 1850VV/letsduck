import {deviceMessage,deviceFailure,reviewDescriptor} from './messages.js';
import type {DeviceMessage} from './messages.js';
/** Manual debug operations and historical numbering share Setup's physical bus. */
import { JsonNumericValue, pythonTruthy, readJsonField } from '@letsduck/domain';
import type { DeviceStore, DuckRuntime, DeviceTiming } from './types.js';
import type { IoBus } from './bus.js';
import { DebugError } from './errors.js';
import { IDS, MAP_VERSION, cloneJson, deviceTiming, yieldToEventLoop } from './shared.js';

type JsonRecord = Record<string, unknown>;
export interface DebugSetupBridge { readonly runtime: DuckRuntime; readonly io: IoBus; writeRequested: boolean; readonly running: boolean; pause(): Promise<unknown>; }
export interface DebugScan { active: boolean; checked: number; total: number; found: number[]; stopped: boolean; error: string; errorCode?:string;errorParams?:Record<string,unknown> }
export interface DebugNumbering { board: string | null; mapVersion: string; ready: boolean; expectedIds: number[]; verifiedIds: number[]; missingIds: number[]; reviewIds: number[]; records: JsonRecord[] }
export interface DebugDevice { uid: string; id: number; online: boolean; pos: unknown; kp: unknown; kd: unknown; parametersLive: boolean; held: boolean; readbackPending: boolean }
export interface DebugStatus { connected: boolean; board: string | null; transport: 'usb'; status: JsonRecord; error: string; errorCode?:string;errorParams?:Record<string,unknown>; onlineIds: number[]; devices: DebugDevice[]; numbering: DebugNumbering; boards: { arduino: { connected: boolean }; expansion: { connected: boolean } }; scan: DebugScan }
const object = (value: unknown): value is JsonRecord => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof JsonNumericValue);
const value = (record: JsonRecord, key: string) => readJsonField(record, key);
const wireCopy = (record: JsonRecord): JsonRecord => Object.fromEntries(Object.keys(record).map(key => [key, value(record, key)]));
const numeric = (item: unknown): unknown => item instanceof JsonNumericValue ? item.isInteger ? BigInt(item.source) : item.value : item;
const recordId = (item: unknown): number => { const raw = numeric(item); return typeof raw === 'number' || typeof raw === 'bigint' ? Number(raw) : NaN; };
function isInteger(item: unknown): boolean { return item instanceof JsonNumericValue ? item.isInteger : typeof item === 'bigint' || typeof item === 'number' && Number.isSafeInteger(item); }
function equal(a: unknown, b: unknown): boolean {
  a = numeric(a); b = numeric(b);
  if ((typeof a === 'number' || typeof a === 'bigint' || typeof a === 'boolean') && (typeof b === 'number' || typeof b === 'bigint' || typeof b === 'boolean')) return a == b;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => equal(item, b[index]));
  if (object(a) && object(b)) return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => Object.hasOwn(b, key) && equal(value(a, key), value(b, key)));
  return a === b;
}
function integer(item: unknown, low: number, high: number, name: string): number {
  const n = Number(numeric(item));
  if (!isInteger(item) || n < low || n > high) throw new DebugError(deviceMessage('device.debug.integer',{name,low,high}));
  return n;
}
function number(item: unknown, low: number, high: number, name: string): number {
  const raw = numeric(item), n = Number(raw);
  if (!['number', 'bigint'].includes(typeof raw) || !Number.isFinite(n) || n < low || n > high) throw new DebugError(deviceMessage('device.debug.range',{name,low,high}));
  return n;
}
function vector(item: unknown, bounds: readonly (readonly [number, number])[], name: string): void {
  if (!Array.isArray(item) || item.length !== bounds.length) throw new DebugError(deviceMessage('device.debug.vector',{name}));
  item.forEach((_part, index) => number(readJsonField(item, String(index)), ...bounds[index]!, name));
}
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
const recordOrEmpty = (item: unknown): JsonRecord => object(item) ? item : {};

export class DuckDebug {
  readonly runtime: DuckRuntime;
  board: string | null = null;
  readonly readbacks = new Map<number, { reply: JsonRecord; at: number }>();
  readonly held = new Set<number>();
  readonly pendingReadback = new Set<number>();
  owned = false;
  calibrating = false;
  scan: DebugScan = { active: false, checked: 0, total: 254, found: [], stopped: false, error: '' };
  private scanStopped = false;
  private scanTask: Promise<void> | undefined;
  private stopped = false;
  private closing: Promise<void> | undefined;
  private readonly timing: DeviceTiming;
  constructor(readonly store: DeviceStore, readonly setup: DebugSetupBridge, timing: Partial<DeviceTiming> = {}) {
    this.runtime = setup.runtime; this.timing = deviceTiming(timing);
  }
  private async connect(): Promise<string> {
    const board = await this.runtime.connect();
    if (this.board && this.board !== board) { this.readbacks.clear(); this.held.clear(); this.pendingReadback.clear(); }
    this.board = board; return board;
  }
  private async request(method: 'GET' | 'POST', path: string, body?: JsonRecord): Promise<JsonRecord> {
    let result: unknown;
    try { await this.connect(); result = await this.runtime.request(method, path, body); }
    catch (error) { throw new DebugError(deviceFailure(error,'device.debug.no_response')); }
    if (!object(result)) throw new DebugError(deviceMessage('device.debug.001'));
    if (method === 'POST') {
      let expected: JsonRecord | undefined;
      if (path === '/api/mode') expected = { mode: body!.mode };
      else if (['/api/servo/enter', '/api/cal/enter'].includes(path)) expected = { mode: path.includes('/servo/') ? 'servo_debug' : 'calibrate' };
      else if (['/api/servo/exit', '/api/cal/exit'].includes(path)) expected = { mode: 'shadow' };
      else if (['/api/roller', '/api/action-scale', '/api/filter', '/api/imu-filter'].includes(path)) expected = body!;
      if (expected) {
        if (Object.keys(expected).some(key => !equal(value(result as JsonRecord, key), value(expected!, key)))) throw new DebugError(deviceMessage('device.debug.002'), { reply: result });
        result = { ...wireCopy(result), ok: true };
      } else if (result.ok !== true) throw new DebugError(deviceMessage('device.debug.003'), { reply: result });
    }
    return result as JsonRecord;
  }
  static fresh(status: JsonRecord): boolean {
    const age = value(status, 'feedback_age_ms'), raw = numeric(age);
    return (typeof raw === 'number' || typeof raw === 'bigint') && Number.isFinite(Number(raw)) && Number(raw) >= 0 && Number(raw) < 500;
  }
  numbering(): DebugNumbering {
    const records = this.store.servoRecords(this.board), verified = new Set<number>(), review = new Set<number>();
    for (const record of records) {
      const sid = recordId(value(record, 'id'));
      if (!IDS.includes(sid)) continue;
      const readback = recordOrEmpty(record.readback), profile = recordOrEmpty(record.profile);
      const valid = record.state === 'verified' && record.mapVersion === MAP_VERSION && pythonTruthy(record.verifiedAt) && readback.ok === true
        && equal(value(readback, 'target_id'), sid) && ['kp', 'kd'].every(key => isInteger(value(readback, key)) && equal(value(readback, key), value(profile, key)));
      (valid ? verified : review).add(sid);
    }
    return { board: this.board, mapVersion: MAP_VERSION, ready: verified.size === IDS.length, expectedIds: [...IDS], verifiedIds: [...verified].sort((a, b) => a - b),
      missingIds: IDS.filter(id => !verified.has(id)), reviewIds: [...review].sort((a, b) => a - b), records };
  }
  async status(): Promise<DebugStatus> {
    let error = '', status: JsonRecord = {}, connected = false;let failureNotice:DeviceMessage|undefined;
    try { status = await this.setup.io.run(() => this.request('GET', '/api/status')); connected = true; }
    catch (failure) { if (!(failure instanceof DebugError)) throw failure; error = failure.message;failureNotice=deviceFailure(failure); }
    const fresh = connected && DuckDebug.fresh(status), active = new Set<number>();
    if (fresh && Array.isArray(status.servo_ids)) status.servo_ids.forEach((_id, index) => {
      const raw = readJsonField(status.servo_ids as unknown[], String(index)), id = Number(numeric(raw));
      if (isInteger(raw) && id >= 0 && id <= 253) active.add(id);
    });
    const now = this.timing.monotonic();
    if (fresh && status.mode === 'servo_debug') for (const [id, read] of this.readbacks) if (now - read.at < 2000) active.add(id);
    const records = new Map(this.board ? this.store.servoRecords(this.board).map(record => [recordId(value(record, 'id')), record]) : []);
    const devices = [...new Set([...IDS, ...active, ...this.readbacks.keys()])].sort((a, b) => a - b).map(id => {
      const index = IDS.indexOf(id), recent = this.readbacks.get(id), live = recent && now - recent.at < 2000 && active.has(id);
      const read = recent?.reply ?? {}, saved = recordOrEmpty(records.get(id)?.readback);
      let pos: unknown = live ? read.raw_pos : null;
      if (active.has(id) && index >= 0 && Number(numeric(value(status, 'raw_mask'))) & (1 << index)) {
        const raw = Array.isArray(status.raw_pos) ? status.raw_pos : []; if (index < raw.length) pos = raw[index];
      }
      return { uid: 'servo-' + id, id, online: active.has(id), pos: active.has(id) ? pos : null, kp: Object.hasOwn(read, 'kp') ? read.kp : saved.kp ?? null,
        kd: Object.hasOwn(read, 'kd') ? read.kd : saved.kd ?? null, parametersLive: Boolean(recent), held: status.mode === 'calibrate' ? this.held.has(id) : Boolean(active.has(id) && pythonTruthy(status.enabled)),
        readbackPending: this.pendingReadback.has(id) || active.has(id) && pos == null };
    });
    return { connected, board: this.board, transport: 'usb', status, error, ...(failureNotice?{errorCode:failureNotice.code,errorParams:failureNotice.params}:{}), onlineIds: [...active].sort((a, b) => a - b), devices, numbering: this.numbering(),
      boards: { arduino: { connected: fresh }, expansion: { connected: fresh && (active.size > 0 || status.imu_ok === true) } }, scan: cloneJson(this.scan) };
  }
  private async claim(): Promise<void> {
    this.setup.writeRequested = true; await this.setup.pause(); this.setup.writeRequested = true;
    if (this.setup.running) throw new DebugError(deviceMessage('device.debug.004'));
    await this.setup.io.run(async () => { await this.connect(); this.owned = true; });
  }
  private async enterDebug(): Promise<void> {
    let status = await this.request('GET', '/api/status');
    if (!DuckDebug.fresh(status)) throw new DebugError(deviceMessage('device.debug.005'));
    if (pythonTruthy(status.enabled)) await this.request('POST', '/api/mode', { mode: 'off' });
    await this.request('POST', '/api/servo/enter', {});
    const deadline = this.timing.monotonic() + 1500;
    while (true) {
      status = await this.request('GET', '/api/status');
      if (DuckDebug.fresh(status) && status.mode === 'servo_debug' && status.mcu_servo_debug === true) { this.calibrating = false; return; }
      if (this.timing.monotonic() >= deadline) throw new DebugError(deviceMessage('device.debug.006'));
      await this.timing.sleep(50);
    }
  }
  private async op(action: string, id: number, fields: JsonRecord = {}): Promise<JsonRecord> {
    const reply = await this.request('POST', '/api/servo', { action, target_id: id, ...fields });
    const expected: Record<string, number> = { set_id: 3, set_gains: 5, read: 6, reset_mid: 8, torque_off: 0, jog: 11 };
    if (!equal(value(reply, 'target_id'), id) || reply.ok !== true || !equal(value(reply, 'op'), expected[action])) throw new DebugError(deviceMessage('device.debug.007'), { reply });
    return reply;
  }
  private async ping(id: number): Promise<JsonRecord> {
    let reply: unknown;
    try { reply = await this.runtime.request('POST', '/api/servo', { action: 'ping', target_id: id }); }
    catch { throw new DebugError(deviceMessage('device.debug.008')); }
    if (!object(reply) || !equal(value(reply, 'target_id'), id) || !equal(value(reply, 'op'), 7) || typeof reply.ok !== 'boolean') throw new DebugError(deviceMessage('device.debug.009'));
    return reply;
  }
  private async read(id: number, verify = true): Promise<JsonRecord> {
    const reply = await this.op('read', id);
    if ([['raw_pos', 4095], ['kp', 255], ['kd', 255]].some(([key, hi]) => !isInteger(value(reply, String(key))) || Number(numeric(value(reply, String(key)))) < 0 || Number(numeric(value(reply, String(key)))) > Number(hi))) {
      throw new DebugError(deviceMessage('device.debug.010'), { reply });
    }
    this.readbacks.set(id, { reply, at: this.timing.monotonic() }); this.pendingReadback.delete(id);
    if (verify) {
      const previous = this.store.servoRecords(this.board).find(record => equal(value(record, 'id'), id)) ?? {};
      this.store.saveServoRecord(this.board!, { ...Object.fromEntries(Object.entries(wireCopy(previous)).filter(([key])=>!['reviewReasonCode','reviewReasonParams'].includes(key))), id, sourceId: id, state: 'verified', mapVersion: MAP_VERSION, profile: { kp: reply.kp, kd: reply.kd }, readback: reply,
        verifiedAt: new Date(this.timing.now()).toISOString().replace(/\.(\d{3})Z$/, '.$1000+00:00'), midEvidence: Object.hasOwn(previous, 'midEvidence') ? previous.midEvidence : 'existing', reviewReason: '' });
    }
    return reply;
  }
  private invalidate(ids: number[], reason: DeviceMessage): void {
    const existing = this.store.servoRecords(this.board);
    for (const id of new Set(ids)) {
      this.readbacks.delete(id); const previous = existing.find(record => equal(value(record, 'id'), id)) ?? {};
      this.store.saveServoRecord(this.board!, { ...wireCopy(previous), id, state: 'review', mapVersion: MAP_VERSION, ...reviewDescriptor(reason) });
    }
  }
  private async rename(old: number, next: number, gains: JsonRecord): Promise<JsonRecord> {
    await this.op('set_id', old, { new_id: next }); const read = await this.read(next, false);
    if (['kp', 'kd'].some(key => !equal(value(read, key), value(gains, key))) || (await this.ping(old)).ok) throw new DebugError(deviceMessage('device.debug.011'));
    this.readbacks.delete(old); this.held.delete(old); return read;
  }
  private async remap(plan: { fromId: number; toId: number }[]): Promise<JsonRecord> {
    const sources = new Set(plan.map(step => step.fromId)), original = new Map<number, JsonRecord>();
    for (const id of sources) original.set(id, await this.read(id, false));
    for (const step of plan) if (!sources.has(step.toId) && (await this.ping(step.toId)).ok) throw new DebugError(deviceMessage('device.debug.occupied',{id:step.toId}));
    const pending = plan.filter(step => step.fromId !== step.toId).map(step => ({ current: step.fromId, target: step.toId, original: step.fromId }));
    const all = new Set(plan.filter(step => step.fromId !== step.toId).flatMap(step => [step.fromId, step.toId]));
    const completed: { fromId: number; toId: number }[] = [];
    if (pending.length) this.invalidate([...all], deviceMessage('device.debug.012'));
    try {
      while (pending.length) {
        const occupied = new Set(pending.map(step => step.current)); let move = pending.find(step => !occupied.has(step.target));
        if (!move) {
          let temporary: number | undefined;
          for (let id = 253; id >= 0; id--) if (!all.has(id) && !(await this.ping(id)).ok) { temporary = id; break; }
          if (temporary === undefined) throw new DebugError(deviceMessage('device.debug.013'));
          move = pending[0]!; await this.rename(move.current, temporary, original.get(move.original)!);
          completed.push({ fromId: move.current, toId: temporary }); move.current = temporary; continue;
        }
        await this.rename(move.current, move.target, original.get(move.original)!); completed.push({ fromId: move.current, toId: move.target }); pending.splice(pending.indexOf(move), 1);
      }
      for (const step of plan) await this.read(step.toId);
    } catch (error) { if (!(error instanceof DebugError)) throw error; throw new DebugError(deviceMessage('device.debug.stopped_remap',{detail:deviceFailure(error)}), { completed, remaining: pending }); }
    return { ok: true, completed };
  }
  private validate(body: JsonRecord): { action: string; body: JsonRecord } {
    const a = body.action;
    const allowed = ['read', 'inspect', 'parameters', 'remap', 'jog', 'move', 'torque-off', 'reset-mid', 'verify', 'scan', 'scan-stop', 'mode', 'command', 'roller', 'pick', 'roulade', 'action-scale', 'filter', 'imu-filter', 'protection', 'cal-enter', 'cal-heartbeat', 'cal-center', 'cal-exit', 'release', 'leave'];
    if (typeof a !== 'string' || !allowed.includes(a)) throw new DebugError(deviceMessage('device.debug.unknown_action'));
    const b = wireCopy(body);
    if (['read', 'inspect', 'parameters', 'jog', 'move', 'torque-off', 'reset-mid', 'cal-center'].includes(a)) b.id = integer(b.id, 0, 253, 'device.field.id');
    if (a === 'parameters') { b.new_id = integer(b.new_id, 0, 253, 'device.field.new_id'); for (const key of ['kp', 'kd']) b[key] = integer(b[key], 0, 255, key); }
    if (a === 'move') b.target = integer(b.target, 0, 4095, 'device.field.target_position');
    if (a === 'jog') { b.delta = integer(b.delta, -10, 10, 'device.field.jog_step'); if (b.delta === 0) throw new DebugError(deviceMessage('device.debug.015')); }
    if (a === 'remap') {
      if (!Array.isArray(b.plan) || !b.plan.length || b.plan.length > 254) throw new DebugError(deviceMessage('device.debug.016'));
      b.plan = b.plan.map(step => { if (!object(step)) throw new DebugError(deviceMessage('device.debug.017')); return { ...step, fromId: integer(value(step, 'fromId'), 0, 253, 'device.field.source_id'), toId: integer(value(step, 'toId'), 0, 253, 'device.field.target_id') }; });
      const plan = b.plan as { fromId: number; toId: number }[];
      if (['fromId', 'toId'].some(key => new Set(plan.map(step => step[key as keyof typeof step])).size !== plan.length)) throw new DebugError(deviceMessage('device.debug.018'));
    }
    if (a === 'mode' && (typeof b.mode !== 'string' || !['off', 'shadow', 'hold', 'policy'].includes(b.mode))) throw new DebugError(deviceMessage('device.debug.019'));
    if (a === 'command') {
      if (!['twist', 'head', 'mouth'].some(key => Object.hasOwn(b, key))) throw new DebugError(deviceMessage('device.debug.020'));
      if (Object.hasOwn(b, 'twist')) vector(b.twist, [[-.4, .4], [-.3, .3], [-1, 1]], 'device.field.motion');
      if (Object.hasOwn(b, 'head')) vector(b.head, Array.from({ length: 4 }, () => [-1, 1] as const), 'device.field.head');
      if (Object.hasOwn(b, 'mouth')) number(b.mouth, 0, 30, 'device.field.mouth');
    }
    if (a === 'roller' && typeof b.enabled !== 'boolean') throw new DebugError(deviceMessage('device.debug.021'));
    if (a === 'action-scale') number(b.scale, 0, 2, 'device.field.action_scale');
    if (a === 'filter') for (const key of ['leg', 'head']) number(b[key], 0, .95, key);
    if (a === 'imu-filter') {
      if (!['gyro_alpha', 'gravity_tau_s'].some(key => Object.hasOwn(b, key))) throw new DebugError(deviceMessage('device.debug.022'));
      if (Object.hasOwn(b, 'gyro_alpha')) number(b.gyro_alpha, 0, .95, 'device.field.gyro_alpha'); if (Object.hasOwn(b, 'gravity_tau_s')) number(b.gravity_tau_s, .01, 2, 'device.field.gravity_tau');
    }
    if (a === 'protection') {
      if (Object.hasOwn(b, 'enabled') === Object.hasOwn(b, 'current_a')) throw new DebugError(deviceMessage('device.debug.023'));
      if (Object.hasOwn(b, 'enabled') && typeof b.enabled !== 'boolean') throw new DebugError(deviceMessage('device.debug.024'));
      if (Object.hasOwn(b, 'current_a')) number(b.current_a, 0, 425.9775, 'device.field.current');
    }
    if (a === 'cal-center' && !IDS.includes(Number(b.id))) throw new DebugError(deviceMessage('device.debug.025'));
    return { action: a, body: b };
  }
  async action(body: JsonRecord): Promise<JsonRecord> {
    const { action: a, body: b } = this.validate(body);
    if (a === 'scan-stop') { this.scanStopped = true; return { ok: true }; }
    if (this.stopped) throw new DebugError(deviceMessage('device.debug.026'));
    if (a === 'release' || a === 'leave') {
      this.scanStopped = true; if (a === 'release') await this.claim();
      return this.setup.io.run(async () => {
        let result: JsonRecord;
        if (a === 'release') result = await this.request('POST', '/api/mode', { mode: 'off' });
        else if (!this.owned) return { ok: true };
        else {
          const status = await this.request('GET', '/api/status');
          const path = this.calibrating ? '/api/cal/exit' : status.mode === 'servo_debug' ? '/api/servo/exit' : '/api/command';
          result = await this.request('POST', path, path === '/api/command' ? { twist: [0, 0, 0] } : {});
        }
        this.calibrating = false; this.held.clear(); this.owned = false; return result;
      });
    }
    if (this.scan.active) throw new DebugError(deviceMessage('device.debug.027'));
    if (!['command', 'cal-heartbeat', 'inspect'].includes(a)) await this.claim();
    return this.setup.io.run(async () => {
      if (this.scan.active) throw new DebugError(deviceMessage('device.debug.027'));
      if (this.stopped) throw new DebugError(deviceMessage('device.debug.026'));
      if (a === 'inspect') {
        if (!this.owned || (await this.request('GET', '/api/status')).mode !== 'servo_debug') throw new DebugError(deviceMessage('device.debug.028'));
        return { ok: true, readback: await this.read(Number(b.id), false) };
      }
      if (a === 'command' || a === 'cal-heartbeat') {
        if (!this.owned) throw new DebugError(deviceMessage('device.debug.029'));
        return this.request('POST', a === 'command' ? '/api/command' : '/api/cal/heartbeat', Object.fromEntries((a === 'command' ? ['twist', 'head', 'mouth'] : []).filter(key => Object.hasOwn(b, key)).map(key => [key, b[key]])));
      }
      if (a === 'mode') {
        let status = await this.request('GET', '/api/status');
        if (['hold', 'policy'].includes(String(b.mode)) && ['servo_debug', 'calibrate'].includes(String(status.mode))) { await this.request('POST', '/api/mode', { mode: 'shadow' }); status = await this.request('GET', '/api/status'); }
        if (['hold', 'policy'].includes(String(b.mode)) && (!DuckDebug.fresh(status) || status.control_ready !== true)) throw new DebugError(deviceMessage('device.debug.030'));
        const result = await this.request('POST', '/api/mode', { mode: b.mode }); this.calibrating = false; this.held.clear(); return result;
      }
      const paths: Record<string, [string, string[]]> = { roller: ['/api/roller', ['enabled']], pick: ['/api/pick', []], roulade: ['/api/roulade', []], 'action-scale': ['/api/action-scale', ['scale']], filter: ['/api/filter', ['leg', 'head']], 'imu-filter': ['/api/imu-filter', ['gyro_alpha', 'gravity_tau_s']] };
      if (paths[a]) { const [path, keys] = paths[a]; return this.request('POST', path, Object.fromEntries(keys.filter(key => Object.hasOwn(b, key)).map(key => [key, b[key]]))); }
      if (['cal-enter', 'cal-exit', 'cal-center'].includes(a)) {
        if (a === 'cal-center' && !this.calibrating) throw new DebugError(deviceMessage('device.debug.031'));
        const id = Number(b.id), index = IDS.indexOf(id), result = await this.request('POST', '/api/cal/' + a.slice(4), a === 'cal-center' ? { index } : {});
        if (a === 'cal-center') {
          if (!equal(value(result, 'id'), id) || !equal(value(result, 'index'), index) || !equal(value(result, 'hold_pos'), 2048)) throw new DebugError(deviceMessage('device.debug.032'));
          this.held.add(id); this.readbacks.delete(id);
        } else { this.calibrating = a === 'cal-enter'; this.held.clear(); }
        return result;
      }
      await this.enterDebug();
      if (a === 'scan') return this.startScan();
      if (a === 'verify') {
        const status = await this.request('GET', '/api/status'), ids = new Set<number>(Array.isArray(status.servo_ids) ? status.servo_ids.map(id => Number(numeric(id))) : []);
        for (const [id, read] of this.readbacks) if (this.timing.monotonic() - read.at < 2000) ids.add(id);
        for (const id of [...ids].sort((a, b) => a - b)) await this.read(id);
        return { ok: true, numbering: this.numbering() };
      }
      if (a === 'read') return { ok: true, readback: await this.read(Number(b.id)) };
      if (a === 'remap') return this.remap(b.plan as { fromId: number; toId: number }[]);
      if (a === 'parameters') {
        const id = Number(b.id), next = Number(b.new_id), current = await this.read(id, false);
        if (next !== id && (await this.ping(next)).ok) throw new DebugError(deviceMessage('device.debug.033'));
        this.invalidate([id, next], deviceMessage('device.debug.034'));
        try {
          if (['kp', 'kd'].some(key => !equal(value(current, key), b[key]))) await this.op('set_gains', id, { kp: b.kp, kd: b.kd });
          if (next !== id) await this.rename(id, next, b);
          const result = await this.read(next);
          if (['kp', 'kd'].some(key => !equal(value(result, key), b[key]))) { this.invalidate([next], deviceMessage('device.debug.035')); throw new DebugError(deviceMessage('device.debug.036')); }
          return { ok: true, readback: result };
        } catch (error) { if (!(error instanceof DebugError)) throw error; this.invalidate([id, next], deviceMessage('device.debug.037')); throw new DebugError(deviceMessage('device.debug.not_retried',{detail:deviceFailure(error)})); }
      }
      if (a === 'protection') {
        const payload = Object.hasOwn(b, 'enabled') ? { action: 'set_protection', protection_enabled: b.enabled } : { action: 'set_protection_current', current_a: b.current_a };
        const result = await this.request('POST', '/api/servo', payload);
        if (!equal(value(result, 'target_id'), 254) || result.broadcast !== true || !equal(value(result, 'op'), Object.hasOwn(b, 'enabled') ? 9 : 10)) throw new DebugError(deviceMessage('device.debug.039'));
        return { ok: true, reply: result, individuallyVerified: false };
      }
      const id = Number(b.id);
      if (a === 'reset-mid') { const result = await this.op('reset_mid', id); this.readbacks.delete(id); this.held.delete(id); this.pendingReadback.add(id); return { ok: true, reply: result, readbackPending: true }; }
      if (a === 'torque-off') { const result = await this.op('torque_off', id); this.held.delete(id); return result; }
      if (a === 'jog' || a === 'move') {
        const current = await this.read(id, false), position = Number(numeric(value(current, 'raw_pos'))), delta = a === 'jog' ? Number(b.delta) : Number(b.target) - position;
        if (Math.abs(delta) > 10) throw new DebugError(deviceMessage('device.debug.040'));
        if (delta === 0) return { ok: true, readback: current };
        if (position + delta < 0 || position + delta > 4095) throw new DebugError(deviceMessage('device.debug.041'));
        await this.op('jog', id, { delta }); const result = await this.read(id, false); this.held.delete(id); return { ok: true, readback: result };
      }
      throw new DebugError(deviceMessage('device.debug.042'));
    });
  }
  private startScan(): JsonRecord {
    this.scanStopped = false; this.scan = { active: true, checked: 0, total: 254, found: [], stopped: false, error: '' };
    this.scanTask = this.scanLoop(); return { ok: true };
  }
  private async scanLoop(): Promise<void> {
    try {
      for (let id = 0; id < 254; id++) {
        await this.setup.io.run(async () => {
          if (this.scanStopped) return;
          await this.enterDebug();
          if ((await this.ping(id)).ok) { await this.read(id, false); this.scan.found.push(id); }
          this.scan.checked = id + 1;
        });
        if (this.scanStopped) break;
        await this.timing.sleep(1); await yieldToEventLoop();
      }
    } catch (error) { const notice=deviceFailure(error);this.scan.error = message(error);this.scan.errorCode=notice.code;this.scan.errorParams=notice.params; }
    finally { this.scan.stopped = this.scanStopped; this.scan.active = false; }
  }
  stopBackground(): Promise<void> {
    this.stopped = true; this.scanStopped = true;
    return this.closing ??= (async () => { await this.scanTask; })();
  }
  close(): Promise<void> { return this.stopBackground(); }
}
