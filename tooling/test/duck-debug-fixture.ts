import { setTimeout as delay } from 'node:timers/promises';
import { IoBus } from '../../packages/devices/src/bus.js';
import { IDS, cloneJson } from '../../packages/devices/src/shared.js';
import type { DuckRuntime } from '../../packages/devices/src/types.js';

export interface Motor { kp: number; kd: number; pos: number }
export interface Call { method: 'GET' | 'POST'; path: string; body: Record<string, unknown> | undefined }
export class Firmware implements DuckRuntime {
  serial: string | null = 'test-board';
  port: number | null = 12345;
  calls: Call[] = [];
  motors = new Map<number, Motor>();
  state: Record<string, unknown>;
  fail: string | null = null;
  wrong = false;
  closed = 0;
  halted = 0;
  pingDelay = 0;
  before: ((method: 'GET' | 'POST', path: string, body?: unknown) => Promise<void>) | undefined;
  constructor(ids = [12, 13, 14]) {
    for (const id of ids) this.motors.set(id, { kp: 5, kd: id, pos: 2200 + id });
    this.state = { mode: 'shadow', feedback_age_ms: 10, servo_ids: ids, imu_ok: true, enabled: false,
      control_ready: true, mcu_servo_debug: false, servo_scan_version: 2, head: [0, 0, 0, 0], mouth: 0,
      command: [0, 0, 0], deployment: { action_scale: 1, action_alpha: .45, action_alpha_head: .2, gyro_alpha: .5, gravity_tau_s: .3 },
      roller: { enabled: false, action_scale: .7, action_alpha: .4, action_alpha_head: .5 },
      recovery: { phase: 'walk' }, pick: { active: false }, roulade: { active: false }, acc: [1, 2, 3], gyro: [.1, .2, .3], gravity: [0, 0, -1] };
  }
  async connect(): Promise<string> { return this.serial!; }
  async close(): Promise<void> { this.closed++; }
  async halt(): Promise<void> { this.halted++; }
  async request(method: 'GET' | 'POST', path: string, raw?: unknown): Promise<unknown> {
    await this.before?.(method, path, raw);
    const body = raw as Record<string, unknown> | undefined;
    this.calls.push({ method, path, body: body === undefined ? undefined : cloneJson(body) });
    if (method === 'GET') {
      if (path === '/servo.html') return '<input id="kp" value="5"><input id="kd" value="10">';
      const result = structuredClone(this.state);
      result.servo_ids = [...this.motors.keys()];
      result.raw_pos = IDS.map(id => this.motors.get(id)?.pos ?? 0);
      result.raw_mask = IDS.reduce((mask, id, index) => mask | (this.motors.has(id) ? 1 << index : 0), 0);
      result.control_ready = Boolean(result.control_ready) && !['calibrate', 'servo_debug'].includes(String(result.mode));
      return result;
    }
    const b = body ?? {};
    if (path === '/api/servo/enter') { Object.assign(this.state, { mode: 'servo_debug', mcu_servo_debug: true, enabled: false }); return { mode: 'servo_debug' }; }
    if (['/api/servo/exit', '/api/cal/exit'].includes(path)) { Object.assign(this.state, { mode: 'shadow', enabled: false, mcu_servo_debug: false }); return { mode: 'shadow' }; }
    if (path === '/api/mode') { Object.assign(this.state, { mode: b.mode, enabled: ['hold', 'policy'].includes(String(b.mode)) }); return { mode: b.mode }; }
    if (path === '/api/cal/enter') { this.state.mode = 'calibrate'; return { mode: 'calibrate' }; }
    if (path === '/api/cal/center') { const index = Number(b.index); return { ok: true, index, id: IDS[index], hold_pos: 2048 }; }
    if (path === '/api/command') { for (const [key, value] of Object.entries(b)) this.state[key === 'twist' ? 'command' : key] = value; return { ok: true }; }
    if (path === '/api/roller') { Object.assign(this.state.roller as object, b); return this.state.roller; }
    if (['/api/action-scale', '/api/filter', '/api/imu-filter'].includes(path)) return { ...b };
    if (path !== '/api/servo') return { ok: true };
    const action = String(b.action), id = Number(b.target_id ?? 254);
    const op = { read: 6, ping: 7, set_id: 3, set_gains: 5, jog: 11, reset_mid: 8, torque_off: 0, set_protection: 9, set_protection_current: 10 }[action];
    if (action.startsWith('set_protection')) return { ok: true, broadcast: true, target_id: 254, op };
    if (action === 'ping') { if (this.pingDelay) await delay(this.pingDelay); return { ok: this.motors.has(id), target_id: id, op: 7 }; }
    const motor = this.motors.get(id);
    if (!motor) throw new Error('No servo replied');
    if (action === 'set_id') { this.motors.delete(id); this.motors.set(Number(b.new_id), motor); }
    if (action === 'set_gains') Object.assign(motor, { kp: b.kp, kd: b.kd });
    if (action === 'jog') motor.pos += Number(b.delta);
    if (this.fail === action) throw new Error('lost acknowledgement after write');
    return { ok: true, target_id: this.wrong ? id + 1 : id, op, raw_pos: motor.pos, kp: motor.kp, kd: motor.kd };
  }
}
export class DebugSetup {
  readonly io = new IoBus();
  writeRequested = false;
  running = false;
  paused = 0;
  pauseHook: (() => Promise<void>) | undefined;
  constructor(readonly runtime: Firmware) {}
  async pause(): Promise<void> { this.paused++; await this.pauseHook?.(); }
}
