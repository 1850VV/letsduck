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
  await app.evaluate(({ app, session }, downloads) => {
    app.setPath('downloads', downloads);
    globalThis.smokeDownload = new Promise(resolve => session.defaultSession.once('will-download', (_event, item) => item.once('done', (_event, state) => resolve({ state, path: item.getSavePath() }))));
  }, join(temp, 'downloads'));
  return app;
};
try {
  application = await launch(); const page = await application.firstWindow();
  page.on('pageerror', e => errors.push(String(e))); await page.waitForURL('duck://app/');
  await page.goto('duck://app/paint'); await page.waitForFunction(() => window.studioProto?.state, null, { timeout: 60000 });
  assert.equal(await page.evaluate(() => typeof process), 'undefined'); assert.equal(await page.evaluate(() => typeof require), 'undefined');
  const baseline = await readFile(join(root, 'tests/personal-browser.js'), 'utf8');
  // Playwright routing does not intercept Electron custom protocols. Inject the
  // same failing response at fetch so all existing browser assertions still run.
  const adapted = new Proxy(page, { get(target, key) {
    if (key === 'setViewportSize') return async size => { await page.setViewportSize(size); await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); if (size.width <= 760 && await page.locator('.ph-more').isVisible()) await page.locator('.ph-more').click(); };
    if (key === 'route') return async () => page.evaluate(() => { window.smokeFetch = window.fetch; window.fetch = (url, options) => String(url).includes('/api/schemes/') && options?.method === 'PUT' ? Promise.resolve(new Response(JSON.stringify({ error: 'test', code: 'server.failed', params: {} }), { status: 503, headers: { 'Content-Type': 'application/json' } })) : window.smokeFetch(url, options); });
    if (key === 'unroute') return async () => page.evaluate(() => { window.fetch = window.smokeFetch; delete window.smokeFetch; });
    const value = target[key]; return typeof value === 'function' ? value.bind(target) : value;
  } });
  const personal = await eval(baseline.replace('http://127.0.0.1:18886/', 'duck://app/paint'))(adapted);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('button[data-step="1"]').first().click();
  await page.locator('[data-start="original"]').click();
  await page.locator('button[data-step="3"]').first().click();
  await page.locator('[data-ptab="print"]').click(); await page.locator('#export2').click();
  await page.locator('#dl-3mf').click();
  const download = await application.evaluate(() => Promise.race([globalThis.smokeDownload, new Promise((_ok, no) => setTimeout(() => no(new Error('Native download did not finish')), 30000))]));
  assert.equal(download.state, 'completed');
  const archive = await readFile(download.path); assert.equal(archive.readUInt32LE(0), 0x04034b50);
  await writeFile(join(output, 'ui-export.3mf'), archive);
  await page.evaluate(() => localStorage.setItem('desktop-smoke', 'retained'));
  await page.screenshot({ path: join(output, 'paint.png') });
  const versions = await application.evaluate(() => process.versions);
  await application.close(); application = await launch(); const reopened = await application.firstWindow(); await reopened.waitForURL('duck://app/');
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
  await writeFile(join(output, 'result.json'), JSON.stringify({ personal, versions, packaged: Boolean(process.env.DUCK_APP_EXECUTABLE), exportBytes: archive.length, video, stableOriginPersistence: true, errors }, null, 2));
  console.log(JSON.stringify({ personal, exportBytes: archive.length, video, stableOriginPersistence: true, errors }));
} catch (error) {
  if (application) { const page = (await application.windows())[0]; if (page) { await page.screenshot({ path: join(output, 'failure.png') }); console.error(await page.evaluate(() => ({ url: location.href, width: innerWidth, height: innerHeight, importButton: document.querySelector('#import-code')?.outerHTML, display: document.querySelector('#import-code') && getComputedStyle(document.querySelector('#import-code')).display, state: window.studioProto?.state?.step }))); } }
  throw error;
} finally {
  if (application) await application.close();
  for (const process of processes) assert.ok(process.exitCode !== null || process.signalCode !== null, 'Owned Electron process must exit');
  await rm(temp, { recursive: true, force: true });
}
