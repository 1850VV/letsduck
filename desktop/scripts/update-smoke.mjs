import { _electron as electron } from 'playwright';
import { createRequire } from 'node:module';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url), root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'duck-update-ui-')), output = join(root, 'output/desktop-updates');
await mkdir(output, { recursive: true });
let application;
try {
  const packaged = process.env.DUCK_APP_EXECUTABLE;
  const env = { ...process.env, DUCK_PERSONAL_DB: join(temp, 'personal.db'), DUCK_DESKTOP_DATA: join(temp, 'profile') };
  if (packaged) delete env.DUCK_ASSETS; else env.DUCK_ASSETS = join(root, 'assets');
  application = await electron.launch({ executablePath: packaged || require('electron'), args: packaged ? [] : [join(root, 'desktop')], env,
    recordVideo: { dir: join(output, 'video'), size: { width: 1280, height: 860 } } });
  const page = await application.firstWindow(), errors = [], layouts = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.waitForURL('duck://app/');
  await page.waitForFunction(() => document.querySelector('#letsduck-update')?.shadowRoot);
  const currentVersion = await application.evaluate(({ app }) => app.getVersion());
  assert.equal((await page.evaluate(() => window.letsduckDesktop.state())).currentVersion, currentVersion,
    'Installed version must come from the app, even without an update feed');
  // Keep the shipped UI/preload; simulate release-service events and the destructive install action.
  await application.evaluate(({ ipcMain }) => {
    globalThis.smokeCommands = [];
    ipcMain.removeHandler('desktop:update-action');
    ipcMain.handle('desktop:update-action', (_event, action) => { globalThis.smokeCommands.push(action); });
  });
  const panel = page.locator('#letsduck-update'), button = panel.getByRole('button');
  const send = state => application.evaluate(({ BrowserWindow }, state) => BrowserWindow.getAllWindows()[0].webContents.send('desktop:update-state', state), { ...state, currentVersion });
  const screenshot = name => page.screenshot({ path: join(output, name + '.png') });
  const layout = async name => {
    const geometry = await page.evaluate(() => {
      const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
      const host = document.querySelector('#letsduck-update'), header = document.querySelector('header.top');
      return { brand: rect(header.querySelector('.brand')), update: rect(host.shadowRoot.querySelector('button')), inHeader: header.contains(host),
        controls: [...header.querySelectorAll('a,button')].filter(el => el.getBoundingClientRect().width && el.getBoundingClientRect().height).map(el => ({ name: el.textContent.trim(), ...rect(el) })),
        viewport: innerWidth };
    });
    const { brand, update, controls } = geometry;
    assert.equal(geometry.inHeader, true, name + ': update belongs to the header');
    assert.ok(update.x - brand.right >= 6 && update.x - brand.right <= 40, name + ': button beside logo ' + JSON.stringify(geometry));
    assert.ok(Math.abs(update.y + update.height / 2 - brand.y - brand.height / 2) <= 4, name + ': vertically aligned');
    for (const control of controls) {
      assert.ok(control.x >= 0 && control.right <= geometry.viewport + 1, name + ': control outside window: ' + control.name);
      const overlap = Math.min(update.right, control.right) - Math.max(update.x, control.x) > 1 && Math.min(update.bottom, control.bottom) - Math.max(update.y, control.y) > 1;
      assert.equal(overlap, false, name + ': update covers ' + control.name);
    }
    layouts.push({ name, ...geometry });
  };
  await button.waitFor(); assert.equal((await button.textContent()).trim(), 'v' + currentVersion);
  assert.equal(await button.isDisabled(), true); assert.equal(await panel.getByRole('button').count(), 1);
  await layout('home-current'); await screenshot('current');
  await send({ phase: 'checking' }); await page.waitForTimeout(50);
  assert.equal((await button.textContent()).trim(), 'v' + currentVersion);
  await send({ phase: 'available', version: '99.0.0' });
  await panel.getByRole('button', { name: '有新版本待更新', exact: true }).waitFor(); await screenshot('available'); await button.click();
  await send({ phase: 'downloading', version: '99.0.0', percent: 43 });
  await panel.getByRole('button', { name: '下载中 43%', exact: true }).waitFor(); assert.equal(await button.isDisabled(), true); await screenshot('downloading');
  await send({ phase: 'error', retry: 'download' });
  await panel.getByRole('button', { name: '更新失败 · 重试', exact: true }).waitFor(); await screenshot('retry'); await button.click();
  await send({ phase: 'error', retry: 'check' }); await button.click();
  await send({ phase: 'ready', version: '99.0.0' });
  await panel.getByRole('button', { name: '重启更新', exact: true }).waitFor(); await screenshot('ready'); await button.click();
  await send({ phase: 'waiting', version: '99.0.0' });
  await panel.getByRole('button', { name: '等待导出完成', exact: true }).waitFor(); assert.equal(await button.isDisabled(), true); await screenshot('waiting');
  await send({ phase: 'installing', version: '99.0.0' });
  await panel.getByRole('button', { name: '重启中…', exact: true }).waitFor(); assert.equal(await button.isDisabled(), true);
  // No installation happened: returning to idle must still show the actual old version.
  await send({ phase: 'idle', version: '99.0.0' });
  await panel.getByRole('button', { name: 'v' + currentVersion, exact: true }).waitFor();
  for (const [route, name] of [['/', 'home'], ['/paint', 'paint'], ['/assemble/', 'assemble']]) {
    await page.goto('duck://app' + route);
    await page.waitForFunction(() => document.querySelector('#letsduck-update')?.shadowRoot?.querySelector('button:not([hidden])'));
    if (name === 'paint') await page.waitForFunction(() => window.studioProto?.state);
    if (name === 'assemble') await page.waitForFunction(() => document.querySelector('canvas'));
    for (const width of [1280, 1024, 800]) {
      await page.setViewportSize({ width, height: 800 }); await page.waitForTimeout(100);
      await send({ phase: 'available', version: '99.0.0' });
      await panel.getByRole('button', { name: '有新版本待更新', exact: true }).waitFor();
      await screenshot(name + '-' + width); await layout(name + '-' + width);
    }
  }
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await panel.getByRole('button', { name: 'Update available', exact: true }).waitFor(); await layout('assemble-en-800');
  await page.goto('duck://app/paint');
  await page.waitForFunction(() => window.studioProto?.state && document.querySelector('#letsduck-update')?.shadowRoot);
  await page.evaluate(async () => { const { setLocale } = await import('/shared/i18n.mjs'); setLocale('en'); });
  for (const width of [1280, 1024, 800]) {
    await page.setViewportSize({ width, height: 800 }); await send({ phase: 'available', version: '99.0.0' });
    await panel.getByRole('button', { name: 'Update available', exact: true }).waitFor();
    await screenshot('paint-en-' + width); await layout('paint-en-' + width);
  }
  const commands = await application.evaluate(() => globalThis.smokeCommands);
  assert.deepEqual(commands, ['download', 'download', 'check', 'install']); assert.deepEqual(errors, []);
  const result = { currentVersion, simulatedStates: ['idle', 'checking', 'available', 'downloading', 'error', 'ready', 'waiting', 'installing'], commands, layouts, errors, actualInstallation: false };
  await writeFile(join(output, 'result.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} finally {
  if (application) { const child = application.process(); await application.close(); assert.ok(child.exitCode !== null || child.signalCode !== null); }
  await rm(temp, { recursive: true, force: true });
}
