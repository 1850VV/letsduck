/** Real anonymous Windows A→B feed only. Never replaces updater events or install calls. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { ElectronApplication, Page } from 'playwright';
import type { UpdateState } from '../src/updates.js';
import { jsonParse, jsonStringify } from '@letsduck/storage';
import { root, desktopScope, failure, object, required, studioState, waitStudio, until, updateState } from './check-support.js';

assert.equal(process.platform, 'win32', 'Run on an isolated Windows runner');
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'This installer test owns the disposable CI runner');
const repository = required(process.env.DUCK_UPDATE_REPOSITORY), from = required(process.env.DUCK_UPGRADE_FROM), to = required(process.env.DUCK_UPGRADE_TO);
assert.match(repository, /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/);
for (const version of [from, to]) assert.match(version, /^\d+\.\d+\.\d+-beta\.\d+$/); assert.notEqual(from, to);
const output = resolve(process.env.DUCK_TEST_OUTPUT || join(root, 'output/desktop-installed-upgrade')); await mkdir(output, { recursive: true });
const scope = await desktopScope('letsduck-upgrade-'), installation = join(scope.temporary, 'app'), executable = join(installation, 'letsduck.exe');
scope.env.DUCK_INSTALLED_EXE = executable; delete scope.env.DUCK_ASSETS; delete scope.env.DUCK_FRONTEND; delete scope.env.DUCK_ASSEMBLY_MANIFEST;
const run = promisify(execFile), errors: string[] = [], phases: UpdateState['phase'][] = [];
let application: ElectronApplication | undefined, page: Page | undefined, result: Record<string, unknown> | undefined;
const ps = async (script: string): Promise<string> => (await run('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { env: scope.env, timeout: 60_000 })).stdout.trim();
type OwnedProcess = { ProcessId: number; CommandLine: string };
async function listOwned(): Promise<OwnedProcess[]> {
  const value: unknown = JSON.parse(await ps('@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $env:DUCK_INSTALLED_EXE } | Select-Object ProcessId, CommandLine) | ConvertTo-Json -Compress -AsArray') || '[]');
  if (!Array.isArray(value)) throw new Error('Invalid owned Windows process list');
  return value.map((entry: unknown) => { if (!object(entry) || typeof entry.ProcessId !== 'number' || !Number.isSafeInteger(entry.ProcessId) || typeof entry.CommandLine !== 'string') throw new Error('Invalid owned Windows process'); return { ProcessId: entry.ProcessId, CommandLine: entry.CommandLine }; });
}
async function stopOwned(): Promise<void> {
  await ps('Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | ForEach-Object { if ($_.MainWindowHandle -ne 0) { [void]$_.CloseMainWindow(); [void]$_.WaitForExit(10000) } }; Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Stop-Process -Force');
  assert.deepEqual(await listOwned(), [], 'Owned installed application processes exited');
}
scope.addCleanup(stopOwned);
async function launch(): Promise<Page> {
  application = await scope.launch(undefined, executable); page = await application.firstWindow(); page.on('pageerror', error => errors.push(String(error))); await page.waitForURL('duck://app/');
  assert.equal(await application.evaluate(({ app }) => app.isPackaged), true); return page;
}
const state = () => updateState(required(page));
async function phase(expected: UpdateState['phase'], timeout = 120_000) {
  return until(async () => { const current = await state(); if (phases.at(-1) !== current.phase) { phases.push(current.phase); console.log('update phase:', JSON.stringify(current)); } return current.phase === expected ? current : false; }, expected, timeout);
}
async function api(path: string): Promise<unknown> { return jsonParse(await required(page).evaluate(async path => (await fetch(path)).text(), path)); }
try {
  const url = `https://github.com/${repository}/releases/download/beta-win32-x64/letsduck-${from}-win-x64.exe`;
  const response = await fetch(url); assert.equal(response.status, 200, 'Baseline installer must be anonymously downloadable');
  const installer = join(scope.temporary, `letsduck-${from}.exe`); await writeFile(installer, Buffer.from(await response.arrayBuffer()));
  await run(installer, ['/S', `/D=${installation}`], { env: scope.env, timeout: 180_000 });
  await launch(); assert.equal(await required(application).evaluate(({ app }) => app.getVersion()), from); assert.equal((await phase('available')).version, to);
  await required(page).goto('duck://app/paint'); await studioState(required(page));
  await required(page).locator('#scheme-btn').click(); await required(page).locator('#sm-name').fill('升级保留验证'); await required(page).locator('#sm-save').click();
  await waitStudio(required(page), state => state.name === '升级保留验证' && !state.dirty);
  const schemesBefore = await api('/api/schemes'); assert.ok(Array.isArray(schemesBefore)); assert.equal(schemesBefore.length, 1);
  const draft: unknown = jsonParse(required(await required(page).evaluate(() => localStorage.getItem('dd-studio-personal'))));
  if (!object(draft) || !object(draft.draft)) throw new Error('Existing draft storage shape changed');
  draft.draft.name = '尚未保存的升级草稿'; draft.draft.activeId = null; draft.draft.updated = Date.now() + 1000;
  const retained = { 'dd-studio-personal': jsonStringify(draft), 'dd-studio-personal-bg': 'sand', 'letsduck-assembly': JSON.stringify({ step: 3, total: 15 }) };
  await required(page).evaluate(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, retained);
  await required(page).goto('duck://app/');
  // Induce one genuine failed request; retry still runs electron-updater.
  await required(application).evaluate(({ session }) => session.fromPartition('electron-updater', { cache: false }).webRequest.onBeforeRequest({ urls: ['https://github.com/*', 'https://release-assets.githubusercontent.com/*'] }, (_details, callback) => callback({ cancel: true })));
  await required(page).locator('#letsduck-update button').click(); await phase('error'); assert.equal((await state()).retry, 'download'); await required(page).screenshot({ path: join(output, 'retry.png') });
  await required(application).evaluate(({ session }) => session.fromPartition('electron-updater', { cache: false }).webRequest.onBeforeRequest(null));
  await required(page).locator('#letsduck-update button').click(); await phase('ready', 300_000); assert.equal((await state()).currentVersion, from); await required(page).screenshot({ path: join(output, 'ready.png') });
  const originalProcess = required(application).process(), oldPid = originalProcess.pid;
  await required(page).locator('#letsduck-update button').click(); await until(async () => originalProcess.exitCode !== null ? true : false, 'original process exited', 180_000);
  const relaunched = await until(async () => (await listOwned()).find(process => process.ProcessId !== oldPid && !process.CommandLine.includes('--type=')) || false, 'installer automatically relaunched the app', 180_000);
  await until(async () => (await ps('Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE -and $_.MainWindowHandle -ne 0 } | Select-Object -ExpandProperty Id')).length > 0 ? true : false, 'automatically relaunched window appeared');
  await stopOwned(); await launch(); assert.equal(await required(application).evaluate(({ app }) => app.getVersion()), to);
  const final = await phase('idle'); assert.equal(final.currentVersion, to); assert.equal((await required(page).locator('#letsduck-update button').textContent())?.trim(), 'v' + to);
  assert.deepEqual(await required(page).evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(retained)), retained);
  assert.deepEqual(await api('/api/schemes'), schemesBefore);
  const health = await api('/api/health'); assert.ok(object(health)); assert.equal(health.export, true);
  const site = await api('/api/site'); assert.ok(object(site)); assert.equal(site.assembly, true); await required(page).screenshot({ path: join(output, 'updated.png') });
  await required(page).goto('duck://app/paint'); await studioState(required(page)); assert.equal((await studioState(required(page))).name, '尚未保存的升级草稿'); assert.deepEqual(errors, []);
  result = { from, to, baselineURL: url, actualInstallation: true, automaticRelaunchPid: relaunched.ProcessId, failedDownloadRetried: true, installedVersionChanged: true, sqliteRetained: true, draftRetained: true, preferencesRetained: true, tutorialProgressRetained: true, completeAssets: true, signing: 'unsigned Windows beta', phases, errors };
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ message: failure(error), phases, errors }, null, 2));
  if (page && !page.isClosed()) await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {}); throw error;
} finally { await scope.dispose(); }
await writeFile(join(output, 'result.json'), JSON.stringify({ ...result, ownedProcessesExited: true, temporaryInstallationRemoved: true }, null, 2));
console.log('Real installed A-to-B upgrade passed.');
