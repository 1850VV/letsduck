import { EventEmitter } from 'node:events';

export type UpdateState = {
  phase: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'waiting' | 'installing' | 'error';
  version?: string;
  percent?: number;
  retry?: 'check' | 'download';
};
export type DesktopUpdateState = UpdateState & { currentVersion: string };
export type UpdateVersion = { version: string };
export type UpdateProgress = { percent: number };
export type UpdaterEvents = {
  'update-available': [info: UpdateVersion];
  'update-not-available': [];
  'download-progress': [info: UpdateProgress];
  'update-downloaded': [info: UpdateVersion];
  error: [error: Error];
};
export interface Updater {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  allowDowngrade: boolean;
  on(event: 'update-available' | 'update-downloaded', listener: (info: UpdateVersion) => void): unknown;
  on(event: 'download-progress', listener: (info: UpdateProgress) => void): unknown;
  on(event: 'update-not-available', listener: () => void): unknown;
  on(event: 'error', listener: (error: Error) => void): unknown;
  off(event: 'update-available' | 'update-downloaded', listener: (info: UpdateVersion) => void): unknown;
  off(event: 'download-progress', listener: (info: UpdateProgress) => void): unknown;
  off(event: 'update-not-available', listener: () => void): unknown;
  off(event: 'error', listener: (error: Error) => void): unknown;
  checkForUpdates(): Promise<unknown>;
  downloadUpdate(): Promise<unknown>;
  quitAndInstall(silent?: boolean, runAfter?: boolean): void;
}
export interface UpdateOptions {
  canRestart(): boolean | Promise<boolean>;
  prepare(): unknown | Promise<unknown>;
  wait?: () => Promise<void>;
  interval?: number;
}
export function feedURL(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Invalid release feed');
  return url;
}
export function updateFeed(base: string, channel: string, platform: string, arch: string): string {
  const url = feedURL(base);
  if (!['stable', 'beta'].includes(channel) || !(platform === 'darwin' && ['arm64', 'x64'].includes(arch) || platform === 'win32' && arch === 'x64')) throw new Error('Invalid release feed');
  return url.href.replace(/\/+$/, '') + `/${channel}/${platform}/${arch}/`;
}
export class UpdateController extends EventEmitter<{ state: [state: UpdateState] }> {
  state: UpdateState = { phase: 'idle' };
  private timer: NodeJS.Timeout | undefined;
  private disposed = false;
  private working: Promise<void> | undefined;
  private installing: Promise<void> | undefined;
  private readonly bindings: Array<() => void> = [];
  private readonly wait: () => Promise<void>;
  constructor(private readonly updater: Updater, private readonly options: UpdateOptions) {
    super();
    this.wait = options.wait ?? (() => new Promise<void>(ok => setTimeout(ok, 250)));
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowDowngrade = false;
    const available = (info: UpdateVersion) => this.set({ phase: 'available', version: info.version });
    const unavailable = () => this.set({ phase: 'idle' });
    const progress = (info: UpdateProgress) => this.set({ ...this.state, phase: 'downloading', percent: Math.min(100, Math.max(0, info.percent)) });
    const downloaded = (info: UpdateVersion) => this.set({ phase: 'ready', version: info.version });
    const error = () => this.error(this.state.phase === 'downloading' ? 'download' : 'check');
    updater.on('update-available', available);
    updater.on('update-not-available', unavailable);
    updater.on('download-progress', progress);
    updater.on('update-downloaded', downloaded);
    updater.on('error', error);
    this.bindings.push(
      () => { updater.off('update-available', available); },
      () => { updater.off('update-not-available', unavailable); },
      () => { updater.off('download-progress', progress); },
      () => { updater.off('update-downloaded', downloaded); },
      () => { updater.off('error', error); },
    );
  }
  private set(state: UpdateState): void {
    if (!this.disposed) { this.state = state; this.emit('state', state); }
  }
  private error(retry: 'check' | 'download'): void { this.set({ ...this.state, phase: 'error', retry }); }
  start(interval = this.options.interval ?? 10 * 60 * 1000): void {
    if (this.timer || this.disposed) return;
    void this.check();
    this.timer = setInterval(() => { void this.check(); }, interval);
    this.timer.unref();
  }
  check(): Promise<void> {
    if (this.disposed || !['idle', 'error'].includes(this.state.phase) || this.state.retry === 'download') return Promise.resolve();
    if (this.working) return this.working;
    this.set({ phase: 'checking' });
    return this.working = this.updater.checkForUpdates().then(
      () => { if (this.state.phase === 'checking') this.set({ phase: 'idle' }); },
      () => this.error('check'),
    ).finally(() => { this.working = undefined; });
  }
  download(): Promise<void> {
    if (this.disposed || !(this.state.phase === 'available' || this.state.phase === 'error' && this.state.retry === 'download')) return Promise.resolve();
    if (this.working) return this.working;
    this.set({ phase: 'downloading', ...this.version(), percent: 0 });
    return this.working = this.updater.downloadUpdate().then(
      () => {},
      () => this.error('download'),
    ).finally(() => { this.working = undefined; });
  }
  install(): Promise<void> {
    if (this.disposed || !['ready', 'waiting'].includes(this.state.phase)) return Promise.resolve();
    if (this.installing) return this.installing;
    this.set({ ...this.state, phase: 'waiting' });
    return this.installing = (async () => {
      while (!this.disposed && !await this.options.canRestart()) await this.wait();
      if (this.disposed) return;
      this.set({ ...this.state, phase: 'installing' });
      await this.options.prepare();
      this.updater.quitAndInstall(false, true);
    })().catch(() => this.set({ phase: 'ready', ...this.version() })).finally(() => { this.installing = undefined; });
  }
  private version(): Pick<UpdateState, 'version'> { return this.state.version === undefined ? {} : { version: this.state.version }; }
  dispose(): void {
    this.disposed = true;
    clearInterval(this.timer);
    for (const unbind of this.bindings) unbind();
    this.removeAllListeners();
  }
}
