/** Real Electron journey. --synthetic deliberately excludes licensed UI/media/export groups. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import type { ElectronApplication, Page } from 'playwright';
import { jsonParse } from '@letsduck/storage';
import { root, desktopScope, failure, object, required, resizeWindow, studioState, waitStudio, updateState, chooseLocale, seedSimulatedAssembly } from './check-support.js';

type NativeDownload = { state: string; path: string };
declare global {
  var desktopSmokeDownload: Promise<NativeDownload> | undefined;
  interface Window { desktopSmokeFetch?: typeof fetch }
}
const { values } = parseArgs({ options: { synthetic: { type: 'boolean', default: false } } });
const synthetic = values.synthetic;
const output = resolve(process.env.DUCK_TEST_OUTPUT || join(root, 'output/desktop-smoke'));
await mkdir(output, { recursive: true });
const scope = await desktopScope('letsduck-electron-');
const errors: string[] = [];
let application: ElectronApplication | undefined;
let result: Record<string, unknown> | undefined;

async function downloadFile(page: Page, selector: string): Promise<Buffer> {
  const app = required(application);
  await app.evaluate(({ session }) => { globalThis.desktopSmokeDownload = new Promise(resolve => session.defaultSession.once('will-download', (_event, item) => item.once('done', (_event, state) => resolve({ state, path: item.getSavePath() })))); });
  await page.locator(selector).click();
  const download = await app.evaluate(async () => {
    const pending = globalThis.desktopSmokeDownload;
    if (!pending) throw new Error('Native download was not armed');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([pending, new Promise<never>((_ok, no) => { timer = setTimeout(() => no(new Error('Native download did not finish')), 30_000); })]); }
    finally { clearTimeout(timer); globalThis.desktopSmokeDownload = undefined; }
  });
  assert.equal(download.state, 'completed');
  return readFile(download.path);
}
async function personalJourney(page: Page): Promise<Record<string, boolean>> {
  await chooseLocale(page, 'zh-Hans');
  const site: unknown = jsonParse(await page.evaluate(async () => (await fetch('/api/site')).text()));
  assert.ok(object(site) && site.edition === 'personal');
  assert.equal(await page.locator('#auth-dialog').count(), 0);
  assert.equal(await page.locator('.top-actions a[href*=gallery]').isVisible(), false);
  await resizeWindow(required(application), page, { width: 390, height: 900 });
  if (await page.locator('#import-code').isHidden()) await page.locator('.ph-more').click();
  assert.equal(await page.locator('#import-code').isVisible(), true);
  await page.locator('header.top').click({ position: { x: 2, y: 2 } });
  assert.equal(await page.locator('.ph-more').getAttribute('aria-expanded'), 'false');
  await resizeWindow(required(application), page, { width: 1280, height: 900 });
  const name = '个人版回归-' + Date.now();
  await page.locator('#scheme-btn').click(); await page.locator('#sm-name').fill(name); await page.locator('#sm-save').click();
  await waitStudio(page, state => state.name === name && !state.dirty);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await waitStudio(page, state => state.name === name);
  await page.locator('#scheme-btn').click(); await page.locator('#sm-name').fill(name + '-未写入');
  // Custom-scheme requests bypass Playwright route(); intercept only the failing save in this renderer.
  await page.evaluate(() => {
    window.desktopSmokeFetch = window.fetch;
    const original = window.fetch;
    window.fetch = (url, options) => String(url).includes('/api/schemes/') && options?.method === 'PUT'
      ? Promise.resolve(new Response(JSON.stringify({ error: 'test', code: 'server.failed', params: {} }), { status: 503, headers: { 'Content-Type': 'application/json' } })) : original(url, options);
  });
  try {
    await page.locator('#sm-save').click();
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent?.includes('未能保存'));
    assert.equal((await studioState(page)).dirty, true);
    const rows: unknown = jsonParse(await page.evaluate(async () => (await fetch('/api/schemes')).text()));
    assert.ok(Array.isArray(rows));
    assert.equal(rows.some((row: unknown) => object(row) && row.name === name), true);
    assert.equal(rows.some((row: unknown) => object(row) && row.name === name + '-未写入'), false);
  } finally { await page.evaluate(() => { const original = window.desktopSmokeFetch; if (original) window.fetch = original; delete window.desktopSmokeFetch; }); }
  await page.locator('#sm-name').fill(name); await page.locator('#sm-save').click(); await waitStudio(page, state => !state.dirty);
  await page.locator('#steps [data-step="3"]').click(); await page.locator('[data-ptab="share"]').click();
  assert.equal(await page.locator('#publish').count(), 0);
  const code = required(await page.locator('.code-box code').textContent()); assert.ok(code.startsWith('v1.'));
  await page.locator('#import-code').click(); const colors = (await studioState(page)).colors;
  await page.locator('#sm-code').fill('v1.invalid'); await page.locator('#sm-import').click();
  assert.deepEqual((await studioState(page)).colors, colors);
  await page.locator('#sm-code').fill(code); await page.locator('#sm-import').click(); await waitStudio(page, state => state.step === 2 && !state.activeId);
  return { sqliteSurvivedBrowserReset: true, failedSaveRemainsDirty: true, realCodeImported: true, invalidCodeKept: true };
}
async function syntheticJourney(page: Page): Promise<string> {
  const model: unknown = jsonParse(await page.evaluate(async () => { const response = await fetch('/assets/model.json'); return response.ok ? response.text() : 'null'; }));
  const colors: Record<string, string> = {}, assignments: Record<string, null> = {};
  if (object(model) && Array.isArray(model.parts)) {
    for (const part of model.parts) { if (!object(part) || typeof part.id !== 'string' || typeof part.color !== 'string') throw new Error('Invalid synthetic model part'); colors[part.id] = part.color; assignments[part.id] = null; }
  } else { colors.baseline = '#AABBCC'; assignments.baseline = null; }
  const body = '{"name":"Desktop protocol smoke","design":' + JSON.stringify({ colors, assignments }) + ',"voiceSalt":9007199254740993}';
  const saved = await page.evaluate(async body => { const response = await fetch('/api/schemes/desktop-smoke', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body }); return { status: response.status, body: await response.text() }; }, body);
  assert.equal(saved.status, 200, saved.body);
  const raw: unknown = jsonParse(saved.body); assert.ok(object(raw)); assert.equal(raw.voiceSalt, 9007199254740993n);
  return page.evaluate(async () => (await fetch('/api/schemes')).text());
}
try {
  application = await scope.launch(); let page = await application.firstWindow(); page.on('pageerror', error => errors.push(String(error)));
  await application.context().tracing.start({ screenshots: true, snapshots: true });
  const identity = await application.evaluate(({ app }) => ({ version: app.getVersion(), packaged: app.isPackaged, arch: process.arch }));
  const renderer = process.env.DUCK_TEST_ANGLE === 'swiftshader' ? 'swiftshader' : 'default';
  const graphics = await application.evaluate(async ({ app }) => ({ features: app.getGPUFeatureStatus(), info: await app.getGPUInfo('basic') }));
  await writeFile(join(output, 'environment.json'), JSON.stringify({ identity, renderer, graphics }, null, 2));
  if (process.env.DUCK_EXPECTED_VERSION) assert.equal(identity.version, process.env.DUCK_EXPECTED_VERSION);
  if (process.env.DUCK_BUILD_ARCH) assert.equal(identity.arch, process.env.DUCK_BUILD_ARCH);
  await page.waitForURL('duck://app/');
  assert.equal(await page.evaluate(() => typeof Reflect.get(window, 'process')), 'undefined');
  assert.equal(await page.evaluate(() => typeof Reflect.get(window, 'require')), 'undefined');
  if (synthetic || process.env.DUCK_EXPECT_OFFLINE === '1') assert.deepEqual(await updateState(page), { phase: 'idle', currentVersion: identity.version });
  let schemes: string | undefined;
  let material: Record<string, unknown> = { status: 'not_run', reason: 'Explicit synthetic mode excludes licensed model, UI export, poster and tutorial media' };
  if (synthetic) schemes = await syntheticJourney(page);
  else {
    if (process.env.DUCK_EXPECT_OFFLINE === '1') { await page.locator('#letsduck-update button').waitFor(); assert.equal((await page.locator('#letsduck-update button').textContent())?.trim(), `v${identity.version}`); }
    await page.goto('duck://app/paint'); await studioState(page);
    const clipboard = await page.evaluate(async () => ({ write: (await navigator.permissions.query({ name: 'clipboard-write' as PermissionName })).state, read: (await navigator.permissions.query({ name: 'clipboard-read' as PermissionName })).state }));
    assert.equal(clipboard.write, 'granted'); assert.equal(clipboard.read, 'denied');
    const personal = await personalJourney(page);
    await resizeWindow(application, page, { width: 1280, height: 800 });
    await page.locator('button[data-step="1"]').first().click(); await page.locator('[data-start="original"]').click(); await page.locator('button[data-step="3"]').first().click();
    await page.locator('[data-ptab="print"]').click(); await page.locator('#export2').click();
    const archive = await downloadFile(page, '#dl-3mf'); assert.equal(archive.readUInt32LE(0), 0x04034b50); await writeFile(join(output, 'ui-export.3mf'), archive);
    const bom = await downloadFile(page, '#dl-bom'); assert.equal(bom.toString('utf8').split('\r\n').length, 36); await writeFile(join(output, 'ui-bom.csv'), bom);
    await page.locator('#export-dialog [data-close]').click(); await page.locator('[data-ptab="share"]').click(); await page.locator('#open-poster').click();
    const poster = await downloadFile(page, '#poster-save'); assert.equal(poster.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.ok(poster.length > 100000);
    await writeFile(join(output, 'ui-poster.png'), poster); await page.locator('#poster-close').click(); await page.screenshot({ path: join(output, 'paint.png') });
    material = { status: 'passed', personal, exportBytes: archive.length, bomParts: 35, posterBytes: poster.length, clipboard };
  }
  await page.evaluate(() => localStorage.setItem('desktop-smoke', 'retained'));
  const versions = await application.evaluate(() => process.versions);
  await application.context().tracing.stop({ path: join(output, 'first-session.zip') }); await scope.close(application);
  application = await scope.launch(); page = await application.firstWindow(); page.on('pageerror', error => errors.push(String(error))); await page.waitForURL('duck://app/');
  await application.context().tracing.start({ screenshots: true, snapshots: true });
  assert.equal(await page.evaluate(() => localStorage.getItem('desktop-smoke')), 'retained');
  if (synthetic) assert.equal(await page.evaluate(async () => (await fetch('/api/schemes')).text()), schemes);
  else {
    await page.goto('duck://app/assemble/'); await page.waitForURL('duck://app/debug/?from=assemble');
    await scope.close(application);
    // This explicit test fixture is not evidence of physical numbering or readiness.
    seedSimulatedAssembly(required(scope.env.DUCK_PERSONAL_DB));
    application = await scope.launch(); page = await application.firstWindow(); page.on('pageerror', error => errors.push(String(error))); await page.waitForURL('duck://app/');
    await page.goto('duck://app/assemble/'); await page.waitForFunction(() => document.querySelector('canvas'), null, { timeout: 60_000 }); await page.screenshot({ path: join(output, 'assemble.png') });
    await page.locator('#reference-toggle').click();
    await page.waitForFunction(() => { const video = document.querySelector('#reference-video'); return video instanceof HTMLVideoElement && video.videoWidth > 0 && !video.paused && video.currentTime > 1; }, null, { timeout: 30_000 });
    await page.locator('#reference-video').evaluate(video => { if (!(video instanceof HTMLVideoElement)) throw new Error('Expected video'); video.currentTime = 10; });
    await page.waitForFunction(() => { const video = document.querySelector('#reference-video'); return video instanceof HTMLVideoElement && video.currentTime > 11; });
    const video = await page.locator('#reference-video').evaluate(video => { if (!(video instanceof HTMLVideoElement)) throw new Error('Expected video'); return { width: video.videoWidth, duration: video.duration, playedAndSought: true }; });
    await page.screenshot({ path: join(output, 'video.png') }); await page.locator('#reference-close').click();
    material = { ...material, video, initialAssemblyGate303: true, assemblyNumberingPrerequisite: '15 explicitly simulated ledger records; physical readiness not tested' };
  }
  assert.deepEqual(errors, []);
  result = { identity, renderer, versions, synthetic, scope: synthetic ? 'actual candidate protocol/save/profile/relaunch/offline only' : 'actual candidate licensed UI journey; simulated assembly prerequisite', material, stableOriginPersistence: true, errors };
} catch (error) {
  await writeFile(join(output, 'failure-details.json'), JSON.stringify({ synthetic, error: failure(error), errors }, null, 2));
  const page = application?.windows()[0]; if (page) await page.screenshot({ path: join(output, 'failure.png'), timeout: 5000 }).catch(() => {});
  throw error;
} finally {
  if (application) await application.context().tracing.stop({ path: join(output, 'last-session.zip') }).catch(() => {});
  await scope.dispose();
}
const receipt = { ...result, fakeAdb: scope.adbEvidence(), ownedPids: [...scope.pids], ownedProcessesExited: true, temporaryDataRemoved: true };
await writeFile(join(output, 'result.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
