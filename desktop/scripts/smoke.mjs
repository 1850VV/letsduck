import { _electron as electron } from 'playwright';
import { createRequire } from 'node:module';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url), root = resolve(import.meta.dirname, '../..'), temp = await mkdtemp(join(tmpdir(), 'letsduck-electron-'));
const output = join(root, 'output/desktop-smoke'); await mkdir(output, { recursive: true }); await mkdir(join(temp, 'downloads'));
const errors = [], processes = []; let application;
const launch = async () => {
  const packaged = process.env.DUCK_APP_EXECUTABLE;
  const env = { ...process.env, DUCK_PERSONAL_DB: join(temp, 'personal.db'), DUCK_DESKTOP_DATA: join(temp, 'profile') };
  if (packaged) delete env.DUCK_ASSETS; else env.DUCK_ASSETS = process.env.DUCK_REAL_ASSETS || join(root, 'assets');
  const app = await electron.launch({ executablePath: packaged || require('electron'), args: packaged ? [] : [join(root, 'desktop')], env, timeout: 60000 });
  processes.push(app.process()); app.process().stderr.on('data', data => process.stderr.write(data));
  await app.evaluate(({ app }, downloads) => app.setPath('downloads', downloads), join(temp, 'downloads'));
  return app;
};
const downloadFile = async (page, selector) => {
  await application.evaluate(({ session }) => { globalThis.smokeDownload = new Promise(resolve => session.defaultSession.once('will-download', (_event, item) => item.once('done', (_event, state) => resolve({ state, path: item.getSavePath() })))); });
  await page.locator(selector).click();
  const download = await application.evaluate(() => Promise.race([globalThis.smokeDownload, new Promise((_ok, no) => setTimeout(() => no(new Error('Native download did not finish')), 30000))]));
  assert.equal(download.state, 'completed');
  return readFile(download.path);
};
// Resize the native Electron window. Browser viewport emulation can leave the
// Windows input widget out of sync after switching between mobile/desktop sizes.
const resizeWindow = async (page, size) => {
  const window = await application.browserWindow(page);
  await window.evaluate((window, size) => { window.setMinimumSize(Math.min(800, size.width), Math.min(600, size.height)); window.setContentSize(size.width, size.height); }, size);
  await page.waitForFunction(size => innerWidth === size.width && innerHeight === size.height, size);
};
try {
  application = await launch(); const page = await application.firstWindow();
  await application.context().tracing.start({ screenshots: true, snapshots: true });
  const identity = await application.evaluate(({ app }) => ({ version: app.getVersion(), packaged: app.isPackaged, arch: process.arch }));
  if (process.env.DUCK_EXPECTED_VERSION) assert.equal(identity.version, process.env.DUCK_EXPECTED_VERSION);
  if (process.env.DUCK_BUILD_ARCH) assert.equal(identity.arch, process.env.DUCK_BUILD_ARCH);
  page.on('pageerror', e => errors.push(String(e))); await page.waitForURL('duck://app/');
  if (process.env.DUCK_EXPECT_OFFLINE === '1') {
    await page.locator('#letsduck-update button').waitFor();
    assert.deepEqual(await page.evaluate(() => window.letsduckDesktop.state()), { phase: 'idle', currentVersion: identity.version });
    assert.equal((await page.locator('#letsduck-update button').textContent()).trim(), `v${identity.version}`);
  }
  await page.goto('duck://app/paint'); await page.waitForFunction(() => window.studioProto?.state, null, { timeout: 60000 });
  assert.equal(await page.evaluate(() => typeof process), 'undefined'); assert.equal(await page.evaluate(() => typeof require), 'undefined');
  const clipboard = await page.evaluate(async () => ({ write: (await navigator.permissions.query({ name: 'clipboard-write' })).state, read: (await navigator.permissions.query({ name: 'clipboard-read' })).state }));
  assert.equal(clipboard.write, 'granted', 'Existing colour-code and poster copy actions need clipboard write permission');
  assert.equal(clipboard.read, 'denied');
  const baseline = await readFile(join(root, 'tests/personal-browser.js'), 'utf8');
  // Playwright routing does not intercept Electron custom protocols. Inject the
  // same failing response at fetch so all existing browser assertions still run.
  const adapted = new Proxy(page, { get(target, key) {
    if (key === 'setViewportSize') return async size => { await resizeWindow(page, size); if (size.width <= 760 && await page.locator('.ph-more').isVisible()) await page.locator('.ph-more').click(); };
    if (key === 'route') return async () => page.evaluate(() => { window.smokeFetch = window.fetch; window.fetch = (url, options) => String(url).includes('/api/schemes/') && options?.method === 'PUT' ? Promise.resolve(new Response(JSON.stringify({ error: 'test', code: 'server.failed', params: {} }), { status: 503, headers: { 'Content-Type': 'application/json' } })) : window.smokeFetch(url, options); });
    if (key === 'unroute') return async () => page.evaluate(() => { window.fetch = window.smokeFetch; delete window.smokeFetch; });
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  const personal = await eval(baseline.replace('http://127.0.0.1:18886/', 'duck://app/paint'))(adapted);
  await resizeWindow(page, { width: 1280, height: 800 });
  await page.locator('button[data-step="1"]').first().click();
  await page.locator('[data-start="original"]').click();
  await page.locator('button[data-step="3"]').first().click();
  await page.locator('[data-ptab="print"]').click(); await page.locator('#export2').click();
  const archive = await downloadFile(page, '#dl-3mf'); assert.equal(archive.readUInt32LE(0), 0x04034b50);
  await writeFile(join(output, 'ui-export.3mf'), archive);
  const bom = await downloadFile(page, '#dl-bom');
  assert.equal(bom.toString('utf8').split('\r\n').length, 36);
  await writeFile(join(output, 'ui-bom.csv'), bom);
  await page.locator('#export-dialog [data-close]').click();
  await page.locator('[data-ptab="share"]').click(); await page.locator('#open-poster').click();
  const poster = await downloadFile(page, '#poster-save');
  assert.equal(poster.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); assert.ok(poster.length > 100000);
  await writeFile(join(output, 'ui-poster.png'), poster); await page.locator('#poster-close').click();
  await page.evaluate(() => localStorage.setItem('desktop-smoke', 'retained'));
  await page.screenshot({ path: join(output, 'paint.png') });
  const versions = await application.evaluate(() => process.versions);
  await application.context().tracing.stop({ path: join(output, 'first-session.zip') });
  await application.close(); application = await launch(); const reopened = await application.firstWindow(); await reopened.waitForURL('duck://app/');
  await application.context().tracing.start({ screenshots: true, snapshots: true });
  assert.equal(await reopened.evaluate(() => localStorage.getItem('desktop-smoke')), 'retained');
  await reopened.goto('duck://app/assemble/'); await reopened.waitForFunction(() => document.querySelector('canvas'), null, { timeout: 60000 });
  await reopened.screenshot({ path: join(output, 'assemble.png') });
  await reopened.locator('#reference-toggle').click();
  await reopened.waitForFunction(() => { const v = document.querySelector('#reference-video'); return v.videoWidth > 0 && !v.paused && v.currentTime > 1; }, null, { timeout: 30000 });
  await reopened.locator('#reference-video').evaluate(video => { video.currentTime = 10; });
  await reopened.waitForFunction(() => document.querySelector('#reference-video').currentTime > 11);
  const video = await reopened.locator('#reference-video').evaluate(video => ({ width: video.videoWidth, duration: video.duration, playedAndSought: true }));
  await reopened.screenshot({ path: join(output, 'video.png') });
  await reopened.locator('#reference-close').click();
  assert.deepEqual(errors, []);
  await writeFile(join(output, 'result.json'), JSON.stringify({ identity, personal, versions, packaged: Boolean(process.env.DUCK_APP_EXECUTABLE), exportBytes: archive.length, bomParts: 35, posterBytes: poster.length, clipboard, video, stableOriginPersistence: true, errors }, null, 2));
  console.log(JSON.stringify({ personal, exportBytes: archive.length, bomParts: 35, posterBytes: poster.length, clipboard, video, stableOriginPersistence: true, errors }));
} catch (error) {
  if (application) { const page = (await application.windows())[0]; if (page) { await page.screenshot({ path: join(output, 'failure.png') }); console.error(await page.evaluate(() => ({ url: location.href, width: innerWidth, height: innerHeight, importButton: document.querySelector('#import-code')?.outerHTML, display: document.querySelector('#import-code') && getComputedStyle(document.querySelector('#import-code')).display, state: window.studioProto?.state?.step }))); } }
  throw error;
} finally {
  if (application) { await application.context().tracing.stop({ path: join(output, 'last-session.zip') }).catch(() => {}); await application.close(); }
  for (const process of processes) assert.ok(process.exitCode !== null || process.signalCode !== null, 'Owned Electron process must exit');
  await rm(temp, { recursive: true, force: true });
}
