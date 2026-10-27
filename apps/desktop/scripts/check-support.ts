import assert from 'node:assert/strict';
import { _electron as electron, type ElectronApplication, type Page } from 'playwright';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type { ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import type { DesktopUpdateState } from '../src/updates.js';
import { PersonalStore } from '@letsduck/storage';
import { servoMap } from '@letsduck/contracts';

export const root = resolve(import.meta.dirname, '../../..');
export const desktop = join(root, 'apps/desktop');
export const failure = (error: unknown): string => error instanceof Error ? error.stack || error.message : String(error);
export function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
export function required<T>(value: T | null | undefined): T { if (value == null) throw new Error('Missing desktop test value'); return value; }
export async function packageVersion(): Promise<string> {
  const value: unknown = JSON.parse(await readFile(join(desktop, 'package.json'), 'utf8'));
  if (!object(value) || typeof value.version !== 'string') throw new Error('Invalid desktop package version');
  return value.version;
}
export function seedSimulatedAssembly(path: string): void {
  const store = new PersonalStore({ path });
  try {
    for (const { id } of servoMap.bindings) store.saveServoRecord('desktop-smoke-simulated-board', {
      id, state: 'verified', mapVersion: servoMap.version, profile: { kp: 10, kd: 2 }, readback: { ok: true, target_id: id, kp: 10, kd: 2 },
      verifiedAt: '2026-01-01T00:00:00+00:00', testFixture: 'simulated desktop UI prerequisite; no hardware',
    });
  } finally { store.close(); }
}
export async function until<T>(action: () => Promise<T | false>, description: string, timeout = 60_000): Promise<T> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const value = await action(); if (value !== false) return value; await delay(50); }
  throw new Error('Timed out: ' + description);
}
function alive(pid: number): boolean { try { process.kill(pid, 0); return true; } catch { return false; } }
export async function verifyPids(pids: Iterable<number>): Promise<void> {
  const owned = [...pids];
  await until(async () => owned.some(alive) ? false : true, 'owned Electron processes exited', 10_000);
}
export async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit'); child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 10_000);
  try { await exited; } finally { clearTimeout(timer); }
}
export async function updateState(page: Page): Promise<DesktopUpdateState> {
  return page.evaluate(() => { const api = window.letsduckDesktop; if (!api) throw new Error('Desktop preload unavailable'); return api.state(); });
}
export async function chooseLocale(page: Page, code: string): Promise<void> {
  if (await page.locator('#language-trigger').isHidden()) await page.locator('.ph-more').click();
  if (await page.locator('#language-menu').isHidden()) await page.locator('#language-trigger').click();
  await page.locator(`[data-locale="${code}"]`).click();
  await page.waitForFunction(value => document.documentElement.lang === value, code);
}
export async function resizeWindow(application: ElectronApplication, page: Page, size: { width: number; height: number }): Promise<void> {
  const window = await application.browserWindow(page);
  try { await window.evaluate((window, value) => { window.setMinimumSize(Math.min(800, value.width), Math.min(600, value.height)); window.setContentSize(value.width, value.height); }, size); }
  finally { await window.dispose(); }
  await page.waitForFunction(value => innerWidth === value.width && innerHeight === value.height, size);
}
export type StudioState = { name: string; dirty: boolean; step: number; activeId: string | null; colors: Record<string, string> };
function observeStudio(): StudioState | false {
  const proto: unknown = Reflect.get(window, 'studioProto');
  if (typeof proto !== 'object' || proto === null || !('state' in proto)) return false;
  const value = proto.state;
  if (typeof value !== 'object' || value === null || !('name' in value) || typeof value.name !== 'string' || !('dirty' in value) || typeof value.dirty !== 'boolean' || !('step' in value) || typeof value.step !== 'number' || !('activeId' in value) || value.activeId !== null && typeof value.activeId !== 'string' || !('colors' in value) || typeof value.colors !== 'object' || value.colors === null) return false;
  const colors: Record<string, string> = {};
  for (const [id, color] of Object.entries(value.colors)) { if (typeof color !== 'string') return false; colors[id] = color; }
  return { name: value.name, dirty: value.dirty, step: value.step, activeId: value.activeId, colors };
}
export async function studioState(page: Page): Promise<StudioState> { return until(async () => page.evaluate(observeStudio), 'production studio state'); }
export async function waitStudio(page: Page, predicate: (state: StudioState) => boolean, timeout = 60_000): Promise<StudioState> {
  return until(async () => { const value = await page.evaluate(observeStudio); return value !== false && predicate(value) ? value : false; }, 'production studio condition', timeout);
}
export async function desktopScope(prefix: string) {
  const temporary = await mkdtemp(join(tmpdir(), prefix));
  const downloads = join(temporary, 'downloads'); await mkdir(downloads);
  const fakeAdb = join(temporary, process.platform === 'win32' ? 'adb.exe' : 'adb');
  const adbLog = join(temporary, 'fake-adb.log');
  await writeFile(fakeAdb, process.platform === 'win32' ? 'Intentionally invalid executable; isolated test refuses ADB execution.' : '#!/bin/sh\nprintf \'%s\\n\' "$*" >> "$DUCK_DESKTOP_TEST_ADB_LOG"\nexit 1\n');
  if (process.platform !== 'win32') await chmod(fakeAdb, 0o755);
  const applications: ElectronApplication[] = [], children: ChildProcess[] = [], pids = new Set<number>();
  const cleanups: Array<() => Promise<unknown>> = [];
  let adbCalls: string[] | null = process.platform === 'win32' ? null : [];
  let cleanupPromise: Promise<void> | undefined;
  const env: NodeJS.ProcessEnv = { ...process.env, DUCK_PERSONAL_DB: join(temporary, 'personal.db'), DUCK_DESKTOP_DATA: join(temporary, 'profile'), DUCK_ADB: fakeAdb, DUCK_DESKTOP_TEST_ADB_LOG: adbLog };
  delete env.DUCK_DB; delete env.DUCK_DATABASE_URL; delete env.DUCK_TEST_DATABASE_URL;
  env.DUCK_LEGACY_DB = join(temporary, 'absent-legacy.db');
  const packaged = process.env.DUCK_APP_EXECUTABLE;
  if (packaged) { delete env.DUCK_ASSETS; delete env.DUCK_FRONTEND; delete env.DUCK_ASSEMBLY_MANIFEST; }
  else { env.DUCK_ASSETS = process.env.DUCK_REAL_ASSETS || process.env.DUCK_ASSETS || join(root, 'assets'); env.DUCK_FRONTEND = process.env.DUCK_FRONTEND || join(root, 'frontend/dist'); }
  const launch = async (video?: { dir: string; size: { width: number; height: number } }, executableOverride?: string): Promise<ElectronApplication> => {
    const target = executableOverride || packaged;
    const binary: unknown = target || createRequire(import.meta.url)('electron');
    if (typeof binary !== 'string') throw new Error('Electron executable is not a path');
    const args = target ? [] : [desktop];
    if (process.env.DUCK_TEST_ANGLE === 'swiftshader') args.push('--use-angle=swiftshader');
    const launchEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) if (typeof value === 'string') launchEnv[key] = value;
    if (target) { delete launchEnv.DUCK_ASSETS; delete launchEnv.DUCK_FRONTEND; delete launchEnv.DUCK_ASSEMBLY_MANIFEST; }
    const application = await electron.launch({ executablePath: binary, args, env: launchEnv, timeout: 60_000, ...(video ? { recordVideo: video } : {}) });
    applications.push(application); const child = application.process(); children.push(child);
    if (child.pid) pids.add(child.pid);
    child.stderr?.on('data', (data: Buffer) => process.stderr.write(data));
    // tsx preserves callback names using an outer helper; Playwright serializes only the callback.
    await application.evaluate(() => { Reflect.set(globalThis, '__name', function(value: unknown) { return value; }); });
    await application.context().addInitScript('globalThis.__name = value => value');
    const page = await application.firstWindow();
    await page.waitForURL('duck://app/', { waitUntil: 'domcontentloaded' });
    await page.evaluate('globalThis.__name = value => value');
    await application.evaluate(({ app }, directory) => app.setPath('downloads', directory), downloads);
    for (const pid of await application.evaluate(({ app }) => app.getAppMetrics().map(item => item.pid))) pids.add(pid);
    return application;
  };
  const close = async (application: ElectronApplication): Promise<void> => {
    const child = application.process();
    if (child.exitCode !== null || child.signalCode !== null) return;
    for (const pid of await application.evaluate(({ app }) => app.getAppMetrics().map(item => item.pid))) pids.add(pid);
    await application.close();
  };
  const interrupt = () => { void dispose().then(() => process.exit(130), error => { console.error(error); process.exit(1); }); };
  const terminate = () => { void dispose().then(() => process.exit(143), error => { console.error(error); process.exit(1); }); };
  const dispose = (): Promise<void> => cleanupPromise ??= (async () => {
    const errors: unknown[] = [];
    try {
      for (const cleanup of [...cleanups].reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
      for (const application of applications) try { await close(application); } catch (error) { errors.push(error); }
      for (const child of children) if (child.exitCode === null && child.signalCode === null) errors.push(new Error('Owned Electron process did not exit'));
      try { await verifyPids(pids); } catch (error) { errors.push(error); }
    } finally {
      process.off('SIGINT', interrupt); process.off('SIGTERM', terminate);
      try { if (process.platform !== 'win32') adbCalls = (await readFile(adbLog, 'utf8').catch(error => { if (object(error) && error.code === 'ENOENT') return ''; throw error; })).split('\n').filter(Boolean); }
      finally { await rm(temporary, { recursive: true, force: true }); }
    }
    assert.deepEqual(errors, [], 'Owned Electron cleanup');
  })();
  process.once('SIGINT', interrupt); process.once('SIGTERM', terminate);
  return { temporary, downloads, env, pids, fakeAdb, adbLog, launch, close, dispose, adbEvidence: () => ({ mode: process.platform === 'win32' ? 'existing invalid executable refuses execution; argv observation unavailable' : 'existing executable stub logs argv and exits 1', invocations: adbCalls }), addCleanup: (cleanup: () => Promise<unknown>) => { cleanups.push(cleanup); } };
}
