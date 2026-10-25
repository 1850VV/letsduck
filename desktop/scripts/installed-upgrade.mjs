// Runs only on an isolated Windows CI runner. No updater events or install calls
// are replaced: both versions come from the public feed embedded in the app.
import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

assert.equal(process.platform, 'win32', 'Run on an isolated Windows runner');
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'This installer test owns the disposable CI runner');
const repository = process.env.DUCK_UPDATE_REPOSITORY, from = process.env.DUCK_UPGRADE_FROM, to = process.env.DUCK_UPGRADE_TO;
assert.match(repository || '', /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/);
for (const version of [from, to]) assert.match(version || '', /^\d+\.\d+\.\d+-beta\.\d+$/);
assert.notEqual(from, to);
const root = resolve(import.meta.dirname, '../..'), output = join(root, 'output/desktop-installed-upgrade');
await mkdir(output, { recursive: true });
const temp = await mkdtemp(join(tmpdir(), 'letsduck-upgrade-')), installation = join(temp, 'app'), executable = join(installation, 'letsduck.exe');
const env = { ...process.env, DUCK_PERSONAL_DB: join(temp, 'personal.db'), DUCK_DESKTOP_DATA: join(temp, 'profile'), DUCK_INSTALLED_EXE: executable };
delete env.DUCK_ASSETS;
const run = promisify(execFile), processes = [], errors = [], phases = [];
let application, page;
const ps = async script => (await run('pwsh.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { env, timeout: 60000 })).stdout.trim();
const listOwned = async () => JSON.parse(await ps('@(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $env:DUCK_INSTALLED_EXE } | Select-Object ProcessId, CommandLine) | ConvertTo-Json -Compress -AsArray'));
async function stopOwned() {
  // This exact executable is inside the temporary installation created above.
  await ps('Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | ForEach-Object { if ($_.MainWindowHandle -ne 0) { [void]$_.CloseMainWindow(); [void]$_.WaitForExit(10000) } }; Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Stop-Process -Force');
}
async function until(action, description, timeout = 120000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { const result = await action(); if (result) return result; await delay(1000); }
  throw Error('Timed out: ' + description);
}
async function launch() {
  application = await electron.launch({ executablePath: executable, args: [], env, timeout: 90000 });
  processes.push(application.process());
  application.process().stderr.on('data', data => { process.stderr.write(data); });
  page = await application.firstWindow(); page.on('pageerror', error => errors.push(String(error)));
  await page.waitForURL('duck://app/');
  assert.equal(await application.evaluate(({ app }) => app.isPackaged), true);
  return page;
}
const state = () => page.evaluate(() => window.letsduckDesktop.state());
async function phase(expected, timeout = 120000) {
  return until(async () => { const current = await state(); if (phases.at(-1) !== current.phase) { phases.push(current.phase); console.log('update phase:', JSON.stringify(current)); } return current.phase === expected ? current : false; }, expected, timeout);
}
try {
  const url = `https://github.com/${repository}/releases/download/beta-win32-x64/letsduck-${from}-win-x64.exe`;
  const response = await fetch(url); assert.equal(response.status, 200, 'Baseline installer must be anonymously downloadable');
  const installer = join(temp, `letsduck-${from}.exe`); await writeFile(installer, Buffer.from(await response.arrayBuffer()));
  await run(installer, ['/S', `/D=${installation}`], { env, timeout: 180000 });
  await launch();
  assert.equal(await application.evaluate(({ app }) => app.getVersion()), from);
  assert.equal((await phase('available')).version, to);
  await page.goto('duck://app/paint');
  await page.waitForFunction(() => window.studioProto?.state, null, { timeout: 90000 });
  await page.locator('#scheme-btn').click(); await page.locator('#sm-name').fill('升级保留验证'); await page.locator('#sm-save').click();
  await page.waitForFunction(() => studioProto.state.name === '升级保留验证' && !studioProto.state.dirty);
  const schemesBefore = await page.evaluate(() => fetch('/api/schemes').then(r => r.json()));
  assert.equal(schemesBefore.length, 1);
  // Save a real draft and preferences using the application's existing storage keys.
  const retained = await page.evaluate(() => {
    const draft = JSON.parse(localStorage.getItem('dd-studio-personal'));
    draft.draft.name = '尚未保存的升级草稿'; draft.draft.activeId = null; draft.draft.updated = Date.now() + 1000;
    const values = { 'dd-studio-personal': JSON.stringify(draft), 'dd-studio-personal-bg': 'sand', 'letsduck-assembly': JSON.stringify({ step: 3, total: 15 }) };
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    return values;
  });
  await page.goto('duck://app/');
  // Induce a real failed network request once; retry must use electron-updater.
  await application.evaluate(({ session }) => session.fromPartition('electron-updater', { cache: false }).webRequest.onBeforeRequest({ urls: ['https://github.com/*', 'https://release-assets.githubusercontent.com/*'] }, (_details, callback) => callback({ cancel: true })));
  await page.locator('#letsduck-update button').click(); await phase('error');
  assert.equal((await state()).retry, 'download');
  await page.screenshot({ path: join(output, 'retry.png') });
  await application.evaluate(({ session }) => session.fromPartition('electron-updater', { cache: false }).webRequest.onBeforeRequest(null));
  await page.locator('#letsduck-update button').click(); await phase('ready', 300000);
  assert.equal((await state()).currentVersion, from);
  await page.screenshot({ path: join(output, 'ready.png') });
  const oldPid = application.process().pid;
  await page.locator('#letsduck-update button').click();
  await until(() => application.process().exitCode !== null, 'original process exited', 180000);
  application = undefined;
  const relaunched = await until(async () => (await listOwned()).find(p => p.ProcessId !== oldPid && !p.CommandLine.includes('--type=')), 'installer automatically relaunched the app', 180000);
  await until(async () => (await ps('Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE -and $_.MainWindowHandle -ne 0 } | Select-Object -ExpandProperty Id')).length > 0, 'automatically relaunched window appeared');
  await stopOwned();
  // Reopen the exact installed path with instrumentation to inspect the result.
  await launch(); assert.equal(await application.evaluate(({ app }) => app.getVersion()), to);
  const final = await phase('idle'); assert.equal(final.currentVersion, to);
  assert.equal(await page.locator('#letsduck-update button').textContent(), 'v' + to);
  assert.deepEqual(await page.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(retained)), retained);
  assert.deepEqual(await page.evaluate(() => fetch('/api/schemes').then(r => r.json())), schemesBefore);
  const health = await page.evaluate(() => fetch('/api/health').then(r => r.json())); assert.equal(health.export, true);
  const site = await page.evaluate(() => fetch('/api/site').then(r => r.json())); assert.equal(site.assembly, true);
  await page.screenshot({ path: join(output, 'updated.png') });
  await page.goto('duck://app/paint'); await page.waitForFunction(() => window.studioProto?.state, null, { timeout: 90000 });
  assert.equal(await page.evaluate(() => studioProto.state.name), '尚未保存的升级草稿');
  assert.deepEqual(errors, []);
  await writeFile(join(output, 'result.json'), JSON.stringify({ from, to, baselineURL: url, actualInstallation: true, automaticRelaunchPid: relaunched.ProcessId, failedDownloadRetried: true, installedVersionChanged: true, sqliteRetained: true, draftRetained: true, preferencesRetained: true, tutorialProgressRetained: true, completeAssets: true, signing: 'unsigned Windows beta', phases, errors }, null, 2));
  console.log('Real installed A-to-B upgrade passed.');
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ message: String(error), stack: error.stack, phases, errors }, null, 2));
  if (page && !page.isClosed()) await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {});
  throw error;
} finally {
  if (application) await application.close().catch(() => {});
  await stopOwned();
  assert.deepEqual(await listOwned(), [], 'Owned installed app processes exited');
  for (const child of processes) assert.ok(child.exitCode !== null || child.signalCode !== null, 'Owned Playwright Electron exited');
  await rm(temp, { recursive: true, force: true });
}
