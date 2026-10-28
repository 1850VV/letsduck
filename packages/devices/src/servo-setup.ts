import {deviceMessage,deviceFailure,reviewDescriptor} from './messages.js';
import type {DeviceMessage,DeviceMessageCode} from './messages.js';
import { JsonNumericValue } from '@letsduck/domain';
import { Cancelled, Offline, SetupError } from './errors.js';
import { IoBus } from './bus.js';
import { cloneJson, deviceTiming, IDS, MAP_VERSION, yieldToEventLoop } from './shared.js';
import type { DeviceStore, DeviceTiming, DuckRuntime } from './types.js';

type RecordValue = Record<string, unknown>;
interface Profile { name: string; kp: number; kd: number; }
interface Telemetry { known: boolean; ids: number[]; readings: Record<string, RecordValue>; observedAt: number | null; }
interface Inspection { id: number; status: 'online' | 'offline' | 'unknown' | 'reading' | 'deferred'; readback: RecordValue | null; observedAt?: number | null; }
export interface SetupSnapshot {
  phase: string; message: string;messageCode?:string;messageParams?:Record<string,unknown>; progress: number; currentId: number | null; activeTarget: number | null;
  targetId: number | null; board: string | null; online: boolean; profile: Profile | null; running: boolean;
  records: RecordValue[]; shutdownAt: number | null; telemetry: Telemetry; inspection: Inspection | null;
  scan: { active: boolean; checked: number; total: number }; queuedTarget: number | null;
}
export interface ServoSetupOptions { io?: IoBus; timing?: Partial<DeviceTiming>; }

function object(value: unknown): RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SetupError(deviceMessage('device.setup.001'));
  return value as RecordValue;
}
function numeric(value: unknown): unknown { return value instanceof JsonNumericValue ? value.value : value; }
function equal(value: unknown, expected: unknown): boolean {
  value = numeric(value); expected = numeric(expected);
  if (typeof value === 'bigint' && typeof expected === 'number') return Number.isInteger(expected) && value === BigInt(expected);
  if (typeof expected === 'bigint' && typeof value === 'number') return Number.isInteger(value) && BigInt(value) === expected;
  return value === expected;
}
function validId(input: unknown): number {
  if (input instanceof JsonNumericValue) { if (!input.isInteger) throw new SetupError(deviceMessage('device.setup.002')); input = BigInt(input.source); }
  if (typeof input === 'bigint' && input >= 0n && input <= 253n) input = Number(input);
  if (typeof input !== 'number' || !Number.isInteger(input) || !IDS.includes(input)) throw new SetupError(deviceMessage('device.setup.002'));
  return input;
}
function decodeAttribute(value: string): string {
  return value.replace(/&#(x[0-9a-f]+|\d+);?/gi, (_match, code: string) => {
    const point = code[0]!.toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '\ufffd';
  }).replace(/&(quot|apos|amp|lt|gt);/g, (_match, name: string) => ({ quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' })[name]!);
}
function profileFor(status: RecordValue, html: unknown): Profile {
  const values: Record<string, string | null> = {};
  if (typeof html === 'string') {
    const content = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    for (const tag of content.matchAll(/<input(?=[\s/>])((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
      const attrs: Record<string, string | null> = {};
      for (const attr of tag[1]!.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[attr[1]!.toLowerCase()] = attr[2] !== undefined || attr[3] !== undefined || attr[4] !== undefined ? decodeAttribute(attr[2] ?? attr[3] ?? attr[4]!) : null;
      if (attrs.id === 'kp' || attrs.id === 'kd') values[attrs.id] = attrs.value ?? null;
    }
  }
  if (!equal(status.servo_scan_version, 2) || values.kp !== '5' || (values.kd !== '10' && values.kd !== '20')) throw new SetupError(deviceMessage('device.setup.003'));
  return { name: `Duck Runtime v2 · KP 5 / KD ${values.kd}`, kp: 5, kd: Number(values.kd) };
}
function unloaded(status: RecordValue): void {
  if (status.enabled !== false || typeof status.mode !== 'string' || !['shadow', 'off', 'servo_debug'].includes(status.mode)) throw new SetupError(deviceMessage('device.setup.004'));
  const age = numeric(status.feedback_age_ms);
  // Preserve Setup's existing predicate; DuckDebug deliberately has stricter freshness rules.
  if (!['number', 'bigint', 'boolean'].includes(typeof age) || Number(age) >= 500) throw new SetupError(deviceMessage('device.setup.005'));
}

/** Legacy single-servo setup and observation, sharing one asynchronous physical bus. */
export class ServoSetup {
  readonly io: IoBus;
  writeRequested = false;
  private readonly timing: DeviceTiming;
  private board: string | null = null;
  private profile: Profile | null = null;
  private phase = 'idle'; private message = ''; private progress = 0;
  private messageCode:DeviceMessageCode|undefined;private messageParams:Record<string,unknown>|undefined;
  private setMessage(notice:DeviceMessage):void{this.message=notice.text;this.messageCode=notice.code;this.messageParams=notice.params;}
  private current: number | null = null; private online = false; private configureRunning = false;
  private stop = new AbortController(); private lastHeartbeat = 0; private shutdownAt: number | null = null;
  private selected: number | null = null; private requestedTarget: number | null = null; private queuedTarget: number | null = null;
  private lastObserved = 0; private lastFullScan: number | null = null;
  private telemetry: Telemetry = { known: false, ids: [], readings: {}, observedAt: null };
  private scan = { active: false, checked: 0, total: 254 };
  private inspection: Inspection | null = null;
  private worker: Promise<void> | null = null; private workerKind: 'observe' | 'configure' | null = null;
  private readonly active = new Set<Promise<unknown>>();
  private haltPending = false;
  private permanentlyStopped = false; private stopping: Promise<void> | undefined; private closing: Promise<void> | undefined;

  constructor(private readonly store: DeviceStore, readonly runtime: DuckRuntime, options: ServoSetupOptions = {}) {
    this.io = options.io ?? new IoBus(); this.timing = deviceTiming(options.timing);
  }
  /** Any owned worker, unlike the legacy wire snapshot's configure-only running flag. */
  get running(): boolean { return this.worker !== null || this.active.size > 0; }

  snapshot(): SetupSnapshot {
    const records = this.store.servoRecords(this.board), telemetry = cloneJson(this.telemetry), inspection = cloneJson(this.inspection);
    if (!this.online || !telemetry.observedAt || this.timing.now() - telemetry.observedAt > 5000) Object.assign(telemetry, { known: false, ids: [], readings: {} });
    if (inspection?.status === 'online' && !telemetry.known) Object.assign(inspection, { status: 'unknown', readback: null });
    return cloneJson({ phase: this.phase, message: this.message, ...(this.messageCode?{messageCode:this.messageCode,messageParams:this.messageParams??{}}:{}), progress: this.progress, currentId: this.current,
      activeTarget: this.current ?? this.requestedTarget, targetId: IDS.find(id => !records.some(r => equal(r.id, id))) ?? null,
      board: this.board, online: this.online, profile: this.profile, running: this.configureRunning, records,
      shutdownAt: this.shutdownAt, telemetry, inspection, scan: this.scan, queuedTarget: this.queuedTarget });
  }
  async inspect(): Promise<SetupSnapshot> {
    if (this.running || this.permanentlyStopped) return this.snapshot();
    if (this.phase === 'shutdown' && this.shutdownAt && this.timing.now() >= this.shutdownAt + 15000) { this.phase = 'offline'; this.lastObserved = 0; }
    if (!this.writeRequested && this.phase !== 'shutdown' && (!this.lastObserved || this.timing.monotonic() - this.lastObserved >= 2000)) this.observeAsync(this.lastFullScan === null);
    return this.snapshot();
  }
  private check(signal: AbortSignal): void { if (signal.aborted || this.permanentlyStopped) throw new Cancelled(deviceMessage('device.setup.006')); }
  private allowed(): void { if (this.permanentlyStopped) throw new Cancelled(deviceMessage('device.setup.007')); }
  private track<T>(task: Promise<T>): Promise<T> {
    this.active.add(task); void task.then(() => this.active.delete(task), () => this.active.delete(task)); return task;
  }
  private async waitOwned(): Promise<void> {
    while (this.worker || this.active.size) await Promise.allSettled([...this.active, ...(this.worker ? [this.worker] : [])]);
  }
  private launch(kind: 'observe' | 'configure', body: (signal: AbortSignal) => Promise<void>): void {
    const signal = this.stop.signal; this.workerKind = kind;
    const task = (async () => { await yieldToEventLoop(); await body(signal); })();
    this.worker = task;
    void task.then(() => { if (this.worker === task) { this.worker = null; this.workerKind = null; } }, () => { if (this.worker === task) { this.worker = null; this.workerKind = null; } });
  }
  private async stopObserver(): Promise<void> {
    if (this.workerKind === 'observe' && this.worker) { this.stop.abort(); await this.worker; if (!this.permanentlyStopped) this.stop = new AbortController(); }
  }
  private observeAsync(full = false): void {
    if (this.writeRequested || this.running || this.permanentlyStopped) return;
    this.stop = new AbortController(); Object.assign(this.scan, { active: true, checked: 0 });
    this.launch('observe', async () => {
      try { await this.observeOnce(full); }
      catch (error) { if (!(error instanceof Cancelled)) { this.phase = error instanceof Offline ? 'offline' : 'blocked'; this.setMessage(deviceFailure(error)); } }
      finally { this.scan.active = false; this.lastObserved = this.timing.monotonic(); }
    });
  }
  private inspectionFromTelemetry(): void {
    if (this.selected === null) return;
    const live = this.telemetry.readings[String(this.selected)];
    this.inspection = { id: this.selected, status: live ? 'online' : 'offline', readback: live ?? null, observedAt: this.telemetry.observedAt };
  }
  private auditRecord(id: number, reply: RecordValue, found: number[]): void {
    if (!IDS.includes(id) || !this.profile) return;
    const old = this.store.servoRecords(this.board).find(r => equal(r.id, id));
    if (old && old.mapVersion !== MAP_VERSION) return;
    const record: RecordValue = old ? cloneJson(old) : { id, sourceId: id, mapVersion: MAP_VERSION, midEvidence: 'existing', labelled: null, installed: null };
    const source = record.sourceId ?? id, oldAbsent = equal(source, id) || !found.some(value => equal(value, source));
    const match = oldAbsent && ['kp', 'kd'].every(key => equal(reply[key], this.profile![key as 'kp' | 'kd']));
    const profile = record.profile as RecordValue | undefined, readback = record.readback as RecordValue | undefined;
    if (record.state === (match ? 'verified' : 'review') && record.oldIdAbsent === oldAbsent && ['kp', 'kd'].every(key => equal(profile?.[key], this.profile![key as 'kp' | 'kd']) && equal(readback?.[key], reply[key]))) return;
    Object.assign(record, { state: match ? 'verified' : 'review', profile: this.profile, readback: reply, oldIdAbsent: oldAbsent });
    if (match) { record.verifiedAt = this.timing.now(); delete record.reviewReason;delete record.reviewReasonCode;delete record.reviewReasonParams; }
    else Object.assign(record,reviewDescriptor(oldAbsent ? deviceMessage('device.setup.008') : deviceMessage('device.setup.009')));
    this.store.saveServoRecord(this.board!, record);
  }
  async observeOnce(full = false): Promise<SetupSnapshot> {
    this.allowed(); const signal = this.stop.signal;
    return this.track(this.observeOwned(full, signal, false));
  }
  /** Owned=true is used only by repair, which already owns the bus. */
  private async observeOwned(full: boolean, signal: AbortSignal, owned: boolean): Promise<SetupSnapshot> {
    const onBus = <T>(operation: () => Promise<T>) => owned ? operation() : this.io.run(operation);
    try {
      await onBus(async () => {
        this.check(signal); const previous = this.board; this.board = await this.runtime.connect(); this.check(signal);
        if (previous && previous !== this.board) full = true;
        const status = object(await this.runtime.request('GET', '/api/status')); this.online = true; this.profile = null;
        this.profile = profileFor(status, await this.runtime.request('GET', '/servo.html')); unloaded(status); await this.enterDebug(signal);
      });
      const records = this.store.servoRecords(this.board);
      const probes = full ? Array.from({ length: 254 }, (_v, id) => id) : [...new Set([1, ...IDS, ...this.telemetry.ids, ...records.map(r => Number(r.sourceId ?? r.id))])].sort((a, b) => a - b);
      Object.assign(this.scan, { active: true, checked: 0, total: probes.length });
      const found: number[] = [], readings: Record<string, RecordValue> = {};
      for (const [index, id] of probes.entries()) {
        await onBus(async () => {
          this.check(signal);
          if ((await this.op('ping', id, signal)).ok === true || (await this.op('ping', id, signal)).ok === true) { found.push(id); readings[String(id)] = await this.op('read', id, signal); }
          this.scan.checked = index + 1;
        });
        await yieldToEventLoop();
      }
      this.check(signal); this.telemetry = { known: true, ids: found, readings, observedAt: this.timing.now() };
      for (const id of found) this.auditRecord(id, readings[String(id)]!, found);
      this.inspectionFromTelemetry(); if (full) this.lastFullScan = this.timing.monotonic();
      if (this.phase === 'idle' || this.phase === 'offline') { this.phase = 'ready'; this.setMessage(deviceMessage('device.setup.ready')); }
      return this.snapshot();
    } catch (error) {
      if (error instanceof Offline) { this.online = false; this.lastFullScan = null; if (this.selected !== null) this.inspection = { id: this.selected, status: 'unknown', readback: null }; }
      if (error instanceof SetupError) Object.assign(this.telemetry, { known: false, ids: [], readings: {} });
      throw error;
    } finally {
      this.scan.active = false; this.lastObserved = this.timing.monotonic();
      try { if (this.online) await onBus(async () => { await this.runtime.request('POST', '/api/servo/exit', {}); }); } catch (error) { if (!(error instanceof SetupError)) throw error; }
    }
  }
  async audit(input: unknown): Promise<SetupSnapshot> {
    this.selected = validId(input); this.inspection = { id: this.selected, status: this.phase === 'working' ? 'deferred' : 'reading', readback: null };
    this.observeAsync(); return this.snapshot();
  }
  async refresh(): Promise<SetupSnapshot> { this.observeAsync(true); return this.snapshot(); }
  async repair(input: unknown): Promise<SetupSnapshot> {
    const id = validId(input); this.allowed(); this.writeRequested = true;
    try {
      await this.stopObserver();
      if (this.running) { if (this.phase === 'working') throw new SetupError(deviceMessage('device.setup.011')); await this.pause(); }
      this.allowed(); this.stop = new AbortController(); const signal = this.stop.signal;
      return await this.track(this.io.run(async () => {
        this.selected = id; this.current = id; this.phase = 'working'; await this.observeOwned(true, signal, true);
        if (this.telemetry.ids.length !== 1 || this.telemetry.ids[0] !== id) throw new SetupError(deviceMessage('device.setup.012'));
        const reply = this.telemetry.readings[String(id)]!;
        if (['kp', 'kd'].some(key => !equal(reply[key], this.profile![key as 'kp' | 'kd']))) {
          const record = this.store.servoRecords(this.board).find(r => equal(r.id, id))!; record.state = 'pending'; this.store.saveServoRecord(this.board!, record);
          await this.enterDebug(signal); await this.op('set_gains', id, signal, { kp: this.profile!.kp, kd: this.profile!.kd });
        }
        await this.observeOwned(false, signal, true); this.phase = 'success'; this.progress = 5; return this.snapshot();
      }));
    } catch (error) { if (error instanceof SetupError) { this.phase = 'blocked'; this.setMessage(deviceFailure(error)); } throw error; }
    finally { this.writeRequested = false; }
  }
  private async heartbeat(signal: AbortSignal, force = false): Promise<void> {
    this.check(signal);
    if (force || this.timing.monotonic() - this.lastHeartbeat > 300) {
      unloaded(object(await this.runtime.request('GET', '/api/status'))); this.check(signal);
      await this.runtime.request('POST', '/api/servo/enter', {}); this.lastHeartbeat = this.timing.monotonic();
    }
    this.check(signal);
  }
  private async op(action: string, id: number, signal: AbortSignal, fields: RecordValue = {}): Promise<RecordValue> {
    await this.heartbeat(signal); const reply = object(await this.runtime.request('POST', '/api/servo', { action, target_id: id, ...fields }));
    if (!equal(reply.target_id, id) || (action !== 'ping' && reply.ok !== true)) throw new SetupError(deviceMessage('device.setup.013'));
    return reply;
  }
  private async enterDebug(signal: AbortSignal): Promise<void> {
    await this.heartbeat(signal, true); const deadline = this.timing.monotonic() + 1500;
    while (true) {
      const status = object(await this.runtime.request('GET', '/api/status')); unloaded(status);
      if (status.mcu_servo_debug === true) return;
      if (this.timing.monotonic() >= deadline) throw new SetupError(deviceMessage('device.setup.014'));
      await this.timing.sleep(50, signal); this.check(signal);
    }
  }
  async configureOnce(input?: unknown): Promise<RecordValue> {
    const target = input === undefined || input === null ? null : validId(input); this.allowed(); const signal = this.stop.signal;
    return this.track(this.io.run(() => this.configureOwned(target, signal)));
  }
  private async configureOwned(target: number | null, signal: AbortSignal): Promise<RecordValue> {
    this.check(signal); this.phase = 'working'; this.progress = 0; this.current = null; this.online = false;
    this.board = await this.runtime.connect(); this.check(signal); const status = object(await this.runtime.request('GET', '/api/status')); this.check(signal);
    this.online = true; this.profile = null; this.profile = profileFor(status, await this.runtime.request('GET', '/servo.html')); unloaded(status); await this.enterDebug(signal);
    const found: number[] = [];
    for (let id = 0; id < 254; id++) {
      this.setMessage(deviceMessage('device.setup.scan',{id}));
      if ((await this.op('ping', id, signal)).ok === true || (await this.op('ping', id, signal)).ok === true) { found.push(id); if (found.length > 1) throw new SetupError(deviceMessage('device.setup.multiple',{ids:found.join(', ')})); }
      await yieldToEventLoop();
    }
    if (!found.length) throw new SetupError(deviceMessage('device.setup.015'));
    const id = found[0]!, records = this.store.servoRecords(this.board), pending = records.find(r => r.state === 'pending');
    let record = records.find(r => equal(r.id, id));
    if (pending) {
      if (!equal(id, pending.sourceId) && !equal(id, pending.id)) throw new SetupError(deviceMessage('device.setup.pending',{sourceId:String(pending.sourceId),id:String(pending.id)}));
      record = pending;
    } else if (IDS.includes(id) && target !== null && target !== id) throw new SetupError(deviceMessage('device.setup.assigned',{id}));
    else if (target !== null && !IDS.includes(id) && records.some(r => equal(r.id, target))) throw new SetupError(deviceMessage('device.setup.016'));
    target = record ? Number(record.id) : IDS.includes(id) ? id : target ?? IDS.find(value => !records.some(r => equal(r.id, value))) ?? null;
    if (target === null) throw new SetupError(deviceMessage('device.setup.017'));
    this.current = target; const readback = await this.op('read', id, signal), fresh = !record && !IDS.includes(id);
    record = record ? cloneJson(record) : { id: target, sourceId: id, state: 'pending', mapVersion: MAP_VERSION, midEvidence: fresh ? 'not_started' : 'existing', labelled: null, installed: null };
    Object.assign(record, { state: 'pending', profile: this.profile, readback, oldIdAbsent: false }); this.store.saveServoRecord(this.board!, record);
    this.progress = 1; this.setMessage(deviceMessage('device.setup.018'));
    if (fresh) { record.midEvidence = 'unconfirmed'; this.store.saveServoRecord(this.board!, record); await this.op('reset_mid', id, signal); record.midEvidence = 'acknowledged'; this.store.saveServoRecord(this.board!, record); }
    this.progress = 2; this.setMessage(deviceMessage('device.setup.019'));
    if (fresh || ['kp', 'kd'].some(key => !equal(readback[key], this.profile![key as 'kp' | 'kd']))) await this.op('set_gains', id, signal, { kp: this.profile.kp, kd: this.profile.kd });
    this.progress = 3; this.setMessage(deviceMessage('device.setup.020'));
    if (id !== target) { if ((await this.op('ping', target, signal)).ok) throw new SetupError(deviceMessage('device.setup.021')); await this.op('set_id', id, signal, { new_id: target }); }
    this.progress = 4; this.setMessage(deviceMessage('device.setup.022'));
    const verified = await this.op('read', target, signal), source = Number(record.sourceId);
    const oldAbsent = source === target || !(await this.op('ping', source, signal)).ok;
    if (!oldAbsent || ['kp', 'kd'].some(key => !equal(verified[key], this.profile![key as 'kp' | 'kd']))) throw new SetupError(deviceMessage('device.setup.023'));
    Object.assign(record, { state: 'verified', readback: verified, oldIdAbsent: oldAbsent, verifiedAt: this.timing.now() }); this.store.saveServoRecord(this.board!, record);
    this.telemetry = { known: true, ids: [target], readings: { [target]: verified }, observedAt: this.timing.now() }; this.lastFullScan = this.timing.monotonic(); this.inspectionFromTelemetry();
    this.progress = 5; this.phase = 'success'; this.setMessage(deviceMessage('device.setup.success',{id:target})); return record;
  }
  async start(input?: unknown): Promise<SetupSnapshot> {
    const target = input === undefined || input === null ? null : validId(input); this.allowed(); this.writeRequested = true;
    try {
      await this.stopObserver(); this.allowed();
      if (!this.running) { this.stop = new AbortController(); this.configureRunning = true; this.requestedTarget = target; this.current = null; this.phase = 'working'; this.launch('configure', signal => this.run(signal)); }
      return this.snapshot();
    } finally { this.writeRequested = false; }
  }
  async queue(input: unknown): Promise<SetupSnapshot> {
    const target = input === null ? null : validId(input); this.allowed();
    // Editing the next target never resumes or retargets the current operation.
    if (target === null) { this.queuedTarget = null; return this.snapshot(); }
    if (this.phase !== 'working' && this.phase !== 'paused' && !this.configureRunning) throw new SetupError(deviceMessage('device.setup.024'));
    if (this.store.servoRecords(this.board).some(r => equal(r.id, target))) throw new SetupError(deviceMessage('device.setup.025'));
    this.queuedTarget = target; return this.snapshot();
  }
  private async run(signal: AbortSignal): Promise<void> {
    let disconnected = false;
    try {
      while (!signal.aborted) {
        if (this.haltPending) { await yieldToEventLoop(); continue; }
        if (this.shutdownAt && this.timing.now() < this.shutdownAt + 15000) { await this.timing.sleep(1000, signal); continue; }
        if (this.phase === 'success' && !disconnected) {
          try { await this.observeOnce(); } catch (error) { if (!(error instanceof Offline)) throw error; this.online = false; disconnected = true; }
          await this.timing.sleep(1000, signal); continue;
        }
        try {
          const pending = this.store.servoRecords(this.board).some(r => r.state === 'pending');
          if (this.requestedTarget === null && !pending) { this.requestedTarget = this.queuedTarget; this.queuedTarget = null; }
          await this.configureOnce(this.requestedTarget); this.requestedTarget = null;
          if (this.selected !== null) await this.observeOnce(); disconnected = false;
          if (IDS.every(id => this.store.servoRecords(this.board).some(r => equal(r.id, id) && r.state === 'verified'))) break;
        } catch (error) {
          if (error instanceof Cancelled) throw error;
          if (error instanceof Offline) { this.online = false; this.phase = 'offline'; this.setMessage(deviceFailure(error)); Object.assign(this.telemetry, { known: false, ids: [], readings: {} }); await this.timing.sleep(2000, signal); }
          else if (error instanceof SetupError) { this.phase = 'blocked'; this.setMessage(deviceFailure(error)); break; }
          else throw error;
        }
      }
    } catch (error) { if (!(error instanceof Cancelled)) { this.phase = error instanceof Offline ? 'offline' : 'blocked'; this.setMessage(deviceFailure(error)); } }
    finally {
      this.configureRunning = false; if (signal.aborted) this.phase = 'paused';
      try { if (this.online) await this.io.run(async () => { await this.runtime.request('POST', '/api/servo/exit', {}); }); } catch (error) { if (!(error instanceof SetupError)) throw error; }
    }
  }
  async pause(): Promise<SetupSnapshot> { this.stop.abort(); await this.waitOwned(); this.phase = 'paused'; return this.snapshot(); }
  async halt(): Promise<SetupSnapshot> {
    this.allowed(); if (this.phase === 'working' || !this.online) throw new SetupError(deviceMessage('device.setup.026'));
    this.writeRequested = true; this.haltPending = true;
    try {
      await this.stopObserver();
      // The observer yields the bus between probes; finish it before removing its transport.
      await Promise.allSettled([...this.active]);
      await this.track(this.io.run(async () => { this.allowed(); await this.runtime.halt(); }));
    } finally { this.writeRequested = false; this.haltPending = false; }
    this.shutdownAt = this.timing.now(); this.online = false; this.phase = 'shutdown'; Object.assign(this.telemetry, { known: false, ids: [], readings: {} });
    this.setMessage(deviceMessage('device.setup.027')); return this.snapshot();
  }
  stopBackground(): Promise<void> {
    if (!this.stopping) { this.permanentlyStopped = true; this.stop.abort(); this.stopping = this.waitOwned().then(() => { this.phase = 'paused'; }); }
    return this.stopping;
  }
  close(): Promise<void> { this.closing ??= this.stopBackground().then(() => this.runtime.close()); return this.closing; }
}
