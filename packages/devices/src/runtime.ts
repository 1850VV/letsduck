import {deviceMessage} from './messages.js';
import { execFile } from 'node:child_process';
import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir, networkInterfaces } from 'node:os';
import { delimiter, join } from 'node:path';
import { Agent, request as httpRequest } from 'node:http';
import { createConnection } from 'node:net';
import { parseWireJson, pythonStrip } from '@letsduck/domain';
import { jsonStringify } from '@letsduck/storage';
import { Offline, SetupError } from './errors.js';
import type { DuckRuntime } from './types.js';

export interface AdbRuntimeOptions {
  env?: NodeJS.ProcessEnv;
  home?: string;
  executable?: string;
  command?: (args: readonly string[]) => Promise<string>;
  commandTimeoutMs?: number;
  requestTimeoutMs?: number;
}

async function executableFile(path: string | undefined): Promise<boolean> {
  if (!path) return false;
  try { await access(path, constants.X_OK); return (await stat(path)).isFile(); } catch { return false; }
}

/** One JSON exchange with the board runtime; status codes >= 300 become SetupError. */
async function runtimeHttp(hostname: string, port: number, method: 'GET' | 'POST', path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  // A private Agent bypasses both proxy environment settings and the global agent.
  const agent = new Agent({ keepAlive: false });
  try {
    const bytes = body === null || body === undefined ? undefined : Buffer.from(jsonStringify(body));
    const raw = await new Promise<Buffer>((resolve, reject) => {
      let settled = false;
      const finish = (error: Error | null, value?: Buffer) => { if (settled) return; settled = true; if (error) reject(error); else resolve(value!); };
      const request = httpRequest({ hostname, port, path, method, agent, headers: bytes ? { 'Content-Type': 'application/json', 'Content-Length': bytes.length } : {} }, response => {
        if ((response.statusCode ?? 500) >= 300) { response.resume(); finish(new SetupError(deviceMessage('device.runtime.007'))); return; }
        const chunks: Buffer[] = []; let length = 0;
        response.on('data', (chunk: Buffer) => {
          if (settled) return;
          const accepted = chunk.subarray(0, 2_000_000 - length); chunks.push(accepted); length += accepted.length;
          if (length === 2_000_000) { finish(null, Buffer.concat(chunks, length)); response.destroy(); }
        });
        response.on('end', () => finish(null, Buffer.concat(chunks, length)));
        response.on('error', error => finish(error));
        response.on('aborted', () => finish(new Error('Runtime response interrupted')));
      });
      request.setTimeout(timeoutMs, () => request.destroy(new Error('Runtime response timed out')));
      request.on('error', error => finish(error));
      request.end(bytes);
    });
    const text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
    return path === '/servo.html' ? text : parseWireJson(text);
  } finally { agent.destroy(); }
}

/** Owns one forward to the already installed board runtime, never an ADB daemon. */
export class AdbRuntime implements DuckRuntime {
  serial: string | null = null;
  port: number | null = null;
  private closeTask: Promise<void> | undefined;
  private readonly commands = new Set<Promise<string>>();
  constructor(private readonly options: AdbRuntimeOptions = {}) {}

  static async executable(options: AdbRuntimeOptions = {}): Promise<string> {
    const env = options.env ?? process.env, home = options.home ?? homedir();
    if (options.executable) return options.executable;
    if (await executableFile(env.DUCK_ADB)) return env.DUCK_ADB!;
    const names = process.platform === 'win32' ? (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').map(extension => 'adb' + extension.toLowerCase()) : ['adb'];
    for (const folder of (env.PATH ?? '').split(delimiter).filter(Boolean)) {
      for (const name of names) { const candidate = join(folder, name); if (await executableFile(candidate)) return candidate; }
    }
    for (const root of [join(home, 'Library/Arduino15/packages/arduino/tools/adb'), join(home, '.arduino15/packages/arduino/tools/adb')]) {
      let versions: string[]; try { versions = await readdir(root); } catch { continue; }
      for (const version of versions.sort().reverse()) { const candidate = join(root, version, 'adb'); if (await executableFile(candidate)) return candidate; }
    }
    throw new Offline(deviceMessage('device.runtime.001'));
  }

  command(...args: string[]): Promise<string> {
    const task = (async () => {
      if (this.options.command) return pythonStrip(await this.options.command(args));
      const executable = await AdbRuntime.executable(this.options);
      return new Promise<string>((resolve, reject) => {
        execFile(executable, args, { encoding: 'utf8', timeout: this.options.commandTimeoutMs ?? 8_000, killSignal: 'SIGKILL', env: this.options.env ?? process.env }, (error, stdout) => {
          if (error) { reject(new Offline(typeof error.code === 'number' && !error.killed ? deviceMessage('device.runtime.002') : deviceMessage('device.runtime.003'), { cause: error })); return; }
          resolve(pythonStrip(stdout));
        });
      });
    })();
    this.commands.add(task);
    void task.then(() => this.commands.delete(task), () => this.commands.delete(task));
    return task;
  }

  static isUnoq(model: string): boolean { return ['arduino unoq', 'arduino uno q'].includes(pythonStrip(model.replaceAll('\0', '')).toLowerCase()); }

  async connect(): Promise<string> {
    if (this.closeTask) await this.closeTask;
    if (this.port !== null && this.serial !== null) return this.serial;
    const lines = (await this.command('devices', '-l')).split(/\r?\n/).slice(1), boards: string[] = [];
    for (const line of lines) {
      const words = pythonStrip(line).split(/\s+/u), serial = words[0];
      if (!serial || words[1] !== 'device') continue;
      try { if (AdbRuntime.isUnoq(await this.command('-s', serial, 'shell', 'cat', '/sys/firmware/devicetree/base/model'))) boards.push(serial); }
      catch (error) { if (!(error instanceof Offline)) throw error; }
    }
    if (boards.length !== 1) throw new Offline(boards.length ? deviceMessage('device.runtime.004') : deviceMessage('device.runtime.005'));
    this.serial = boards[0]!;
    const value = await this.command('-s', this.serial, 'forward', 'tcp:0', 'tcp:9527'), port = Number(value);
    if (!/^\d+$/u.test(value) || !Number.isInteger(port) || port <= 0 || port >= 65536) throw new Offline(deviceMessage('device.runtime.006'));
    this.port = port;
    return this.serial;
  }

  async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    await this.connect();
    try { return await runtimeHttp('127.0.0.1', this.port!, method, path, body, this.options.requestTimeoutMs ?? 4_000); }
    catch (error) {
      if (error instanceof SetupError) throw error;
      await this.close();
      throw new Offline(deviceMessage('device.runtime.008'), { cause: error });
    }
  }

  async halt(): Promise<void> {
    const serial = await this.connect(), model = await this.command('-s', serial, 'shell', 'cat', '/sys/firmware/devicetree/base/model');
    if (!AdbRuntime.isUnoq(model)) throw new SetupError(deviceMessage('device.runtime.009'));
    await this.command('-s', serial, 'shell', 'sudo', '-n', 'halt');
    await this.close();
  }

  close(): Promise<void> {
    if (this.closeTask) return this.closeTask;
    const task = (async () => {
      try { if (this.port !== null && this.serial !== null) await this.command('-s', this.serial, 'forward', '--remove', 'tcp:' + this.port); }
      catch (error) { if (!(error instanceof SetupError)) throw error; }
      finally { this.port = null; await Promise.allSettled([...this.commands]); }
    })();
    this.closeTask = task;
    void task.then(() => { this.closeTask = undefined; }, () => { this.closeTask = undefined; });
    return task;
  }
}

const RUNTIME_PORT = 9527;
/** Only addresses on the user's own network: private IPv4 or an mDNS name. */
export function lanHost(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const host = value.trim().toLowerCase();
  const octets = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(host)?.slice(1).map(Number);
  if (octets) {
    const [a, b] = octets as [number, number];
    if (octets.some(n => n > 255)) return null;
    return a === 10 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 || a === 169 && b === 254 ? host : null;
  }
  return /^[a-z0-9-]{1,63}\.local$/u.test(host) ? host : null;
}

/** Talks to the board runtime directly over Wi-Fi; there is no forward to own. */
export class LanRuntime implements DuckRuntime {
  readonly serial: string;
  readonly port = RUNTIME_PORT;
  constructor(readonly host: string, private readonly timeoutMs = 4_000) { this.serial = 'lan:' + host; }
  async connect(): Promise<string> { return this.serial; }
  async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    try { return await runtimeHttp(this.host, this.port, method, path, body, this.timeoutMs); }
    catch (error) { if (error instanceof SetupError) throw error; throw new Offline(deviceMessage('device.runtime.010', { host: this.host }), { cause: error }); }
  }
  async halt(): Promise<void> { throw new SetupError(deviceMessage('device.runtime.011')); }
  async close(): Promise<void> {}
}

/** The one runtime the app owns; Debug switches it between USB and Wi-Fi. */
export class RuntimeSwitch implements DuckRuntime {
  private current: DuckRuntime;
  constructor(private readonly usb: DuckRuntime) { this.current = usb; }
  get transport(): 'usb' | 'lan' { return this.current instanceof LanRuntime ? 'lan' : 'usb'; }
  get host(): string | null { return this.current instanceof LanRuntime ? this.current.host : null; }
  get serial(): string | null { return this.current.serial; }
  get port(): number | null { return this.current.port; }
  async use(host: string | null): Promise<void> {
    const previous = this.current;
    this.current = host === null ? this.usb : new LanRuntime(host);
    if (previous !== this.current) await previous.close();
  }
  connect(): Promise<string> { return this.current.connect(); }
  request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> { return this.current.request(method, path, body); }
  halt(): Promise<void> { return this.current.halt(); }
  close(): Promise<void> { return this.current.close(); }
}

function portOpen(host: string, timeoutMs: number): Promise<boolean> {
  return new Promise(resolve => {
    const socket = createConnection({ host, port: RUNTIME_PORT });
    const done = (open: boolean) => { socket.destroy(); resolve(open); };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true)).once('error', () => done(false));
  });
}

/** Finds duck runtimes on the computer's own /24 networks. */
export async function discoverBoards(timeoutMs = 400): Promise<string[]> {
  const own = Object.values(networkInterfaces()).flat().filter(item => item && item.family === 'IPv4' && !item.internal && lanHost(item.address));
  const candidates = [...new Set(own.flatMap(item => { const prefix = item!.address.split('.').slice(0, 3).join('.'); return Array.from({ length: 254 }, (_, i) => `${prefix}.${i + 1}`).filter(host => host !== item!.address); }))];
  const found: string[] = [];
  for (let start = 0; start < candidates.length; start += 64) {
    await Promise.all(candidates.slice(start, start + 64).map(async host => {
      if (!await portOpen(host, timeoutMs)) return;
      try { const status = await runtimeHttp(host, RUNTIME_PORT, 'GET', '/api/status', undefined, 1_500); if (status && typeof status === 'object' && 'servo_ids' in status) found.push(host); }
      catch { /* Another service on the same port is not a duck. */ }
    }));
  }
  return found.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}
