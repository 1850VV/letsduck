import { EventEmitter } from 'node:events';

export type UpdateState = { phase: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'waiting' | 'error'; version?: string; percent?: number; retry?: 'check' | 'download' };
export interface Updater extends EventEmitter {
  autoDownload: boolean; autoInstallOnAppQuit: boolean; allowDowngrade: boolean;
  checkForUpdates(): Promise<unknown>; downloadUpdate(): Promise<unknown>; quitAndInstall(silent?: boolean, runAfter?: boolean): void;
}
export function feedURL(value: string) {
  const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid release feed'); return url;
}
export function updateFeed(base: string, channel: string, platform: string, arch: string) {
  const url = feedURL(base);
  if (!['stable', 'beta'].includes(channel) || !(platform === 'darwin' && ['arm64', 'x64'].includes(arch) || platform === 'win32' && arch === 'x64')) throw new Error('Invalid release feed');
  return url.href.replace(/\/+$/, '') + `/${channel}/${platform}/${arch}/`;
}
export class UpdateController extends EventEmitter {
  state: UpdateState = { phase: 'idle' };
  private timer?: NodeJS.Timeout;
  private disposed = false;
  private working?: Promise<void>;
  private installing?: Promise<void>;
  private bindings: [string, (...args: any[]) => void][] = [];
  constructor(private updater: Updater, private canRestart: () => Promise<boolean>, private prepare: () => Promise<void>, private wait = () => new Promise<void>(ok => setTimeout(ok, 250))) {
    super(); updater.autoDownload = false; updater.autoInstallOnAppQuit = false; updater.allowDowngrade = false;
    const on = (name: string, fn: (...args: any[]) => void) => { updater.on(name, fn); this.bindings.push([name, fn]); };
    on('update-available', info => this.set({ phase: 'available', version: info.version }));
    on('update-not-available', () => this.set({ phase: 'idle' }));
    on('download-progress', info => this.set({ ...this.state, phase: 'downloading', percent: Math.min(100, Math.max(0, info.percent)) }));
    on('update-downloaded', info => this.set({ phase: 'ready', version: info.version }));
    on('error', () => this.error(this.state.phase === 'downloading' ? 'download' : 'check'));
  }
  private set(state: UpdateState) { if (!this.disposed) { this.state = state; this.emit('state', state); } }
  private error(retry: 'check' | 'download') { this.set({ ...this.state, phase: 'error', retry }); }
  start(interval = 10 * 60 * 1000) { if (this.timer || this.disposed) return; void this.check(); this.timer = setInterval(() => { void this.check(); }, interval); this.timer.unref(); }
  check(): Promise<void> {
    if (this.disposed || !['idle', 'error'].includes(this.state.phase) || this.state.retry === 'download') return Promise.resolve();
    if (this.working) return this.working;
    this.set({ phase: 'checking' });
    return this.working = this.updater.checkForUpdates().then(() => { if (this.state.phase === 'checking') this.set({ phase: 'idle' }); }, () => this.error('check')).finally(() => { this.working = undefined; });
  }
  download(): Promise<void> {
    if (this.disposed || !(this.state.phase === 'available' || this.state.phase === 'error' && this.state.retry === 'download')) return Promise.resolve();
    if (this.working) return this.working;
    this.set({ phase: 'downloading', version: this.state.version, percent: 0 });
    return this.working = this.updater.downloadUpdate().then(() => {}, () => this.error('download')).finally(() => { this.working = undefined; });
  }
  install(): Promise<void> {
    if (this.disposed || !['ready', 'waiting'].includes(this.state.phase)) return Promise.resolve();
    if (this.installing) return this.installing;
    this.set({ ...this.state, phase: 'waiting' });
    return this.installing = (async () => {
      while (!this.disposed && !await this.canRestart()) await this.wait();
      if (this.disposed) return;
      await this.prepare(); this.updater.quitAndInstall(false, true);
    })().catch(() => this.set({ phase: 'ready', version: this.state.version })).finally(() => { this.installing = undefined; });
  }
  dispose() { this.disposed = true; clearInterval(this.timer); for (const [name, fn] of this.bindings) this.updater.off(name, fn); this.removeAllListeners(); }
}
