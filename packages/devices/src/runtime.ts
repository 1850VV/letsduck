import {deviceMessage} from './messages.js';
import { execFile } from 'node:child_process';
import { access, readdir, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { Agent, request as httpRequest } from 'node:http';
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
    // A private Agent bypasses both proxy environment settings and the global agent.
    const agent = new Agent({ keepAlive: false });
    try {
      const bytes = body === null || body === undefined ? undefined : Buffer.from(jsonStringify(body));
      const raw = await new Promise<Buffer>((resolve, reject) => {
        let settled = false;
        const finish = (error: Error | null, value?: Buffer) => { if (settled) return; settled = true; if (error) reject(error); else resolve(value!); };
        const request = httpRequest({ hostname: '127.0.0.1', port: this.port!, path, method, agent, headers: bytes ? { 'Content-Type': 'application/json', 'Content-Length': bytes.length } : {} }, response => {
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
        request.setTimeout(this.options.requestTimeoutMs ?? 4_000, () => request.destroy(new Error('Runtime response timed out')));
        request.on('error', error => finish(error));
        request.end(bytes);
      });
      const text = new TextDecoder('utf-8', { fatal: true }).decode(raw);
      return path === '/servo.html' ? text : parseWireJson(text);
    } catch (error) {
      if (error instanceof SetupError) throw error;
      await this.close();
      throw new Offline(deviceMessage('device.runtime.008'), { cause: error });
    } finally { agent.destroy(); }
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
