/** Shipped preload/panel with simulated release states and install actions; never an actual update. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { UpdateState } from '../src/updates.js';
import type { Page } from 'playwright';
import { root, desktopScope, failure, required, resizeWindow, studioState, chooseLocale, seedSimulatedAssembly, updateState } from './check-support.js';

declare global { var desktopSmokeCommands: string[] | undefined }
const output = resolve(process.env.DUCK_TEST_OUTPUT || join(root, 'output/desktop-updates'));
await mkdir(output, { recursive: true });
const scope = await desktopScope('duck-update-ui-');
const errors: string[] = [], layouts: unknown[] = [];
let result: Record<string, unknown> | undefined;
let currentPage: Page | undefined;
try {
  seedSimulatedAssembly(required(scope.env.DUCK_PERSONAL_DB));
  const application = await scope.launch({ dir: join(output, 'video'), size: { width: 1280, height: 860 } });
  const page = await application.firstWindow(); currentPage = page; page.on('pageerror', error => errors.push(String(error)));
  await page.waitForURL('duck://app/'); await page.waitForFunction(() => document.querySelector('#letsduck-update')?.shadowRoot);
  const currentVersion = await application.evaluate(({ app }) => app.getVersion());
  assert.equal((await updateState(page)).currentVersion, currentVersion);
  await application.evaluate(({ ipcMain }) => {
    globalThis.desktopSmokeCommands = [];
    ipcMain.removeHandler('desktop:update-action');
    ipcMain.handle('desktop:update-action', (_event, action: unknown) => { if (typeof action !== 'string') throw new Error('Invalid smoke action'); globalThis.desktopSmokeCommands?.push(action); });
  });
  const panel = page.locator('#letsduck-update'), button = panel.getByRole('button');
  const send = (state: UpdateState) => application.evaluate(({ BrowserWindow }, state) => {
    const window = BrowserWindow.getAllWindows()[0]; if (!window) throw new Error('Missing desktop window'); window.webContents.send('desktop:update-state', state);
  }, { ...state, currentVersion });
  const screenshot = (name: string) => page.screenshot({ path: join(output, name + '.png') });
  const layout = async (name: string) => {
    const geometry = await page.evaluate(() => {
      const rect = (element: Element | null) => { if (!element) throw new Error('Missing layout control'); const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
      const host = document.querySelector('#letsduck-update'), header = document.querySelector('header.top, header.home-top');
      if (!host?.shadowRoot || !header) throw new Error('Missing desktop update header');
      return {
        brand: rect(header.querySelector('.brand, .home-brand')), update: rect(host.shadowRoot.querySelector('button')), inHeader: header.contains(host),
        controls: [...header.querySelectorAll('a,button')].filter(el => el.getBoundingClientRect().width && el.getBoundingClientRect().height).map(el => ({ name: el.textContent?.trim() || '', ...rect(el) })), viewport: innerWidth,
      };
    });
    const { brand, update, controls } = geometry;
    assert.equal(geometry.inHeader, true, name + ': update belongs to the header');
    assert.ok(update.x - brand.right >= 6 && update.x - brand.right <= 40, name + ': beside logo ' + JSON.stringify(geometry));
    assert.ok(Math.abs(update.y + update.height / 2 - brand.y - brand.height / 2) <= 4, name + ': vertically aligned');
    for (const control of controls) {
      assert.ok(control.x >= 0 && control.right <= geometry.viewport + 1, name + ': control outside window: ' + control.name);
      const overlap = Math.min(update.right, control.right) - Math.max(update.x, control.x) > 1 && Math.min(update.bottom, control.bottom) - Math.max(update.y, control.y) > 1;
      assert.equal(overlap, false, name + ': update covers ' + control.name);
    }
    layouts.push({ name, ...geometry });
  };
  await button.waitFor(); assert.equal((await button.textContent())?.trim(), 'v' + currentVersion);
  assert.equal(await button.isDisabled(), true); assert.equal(await panel.getByRole('button').count(), 1);
  await layout('home-current'); await screenshot('current');
  await send({ phase: 'checking' }); await page.waitForFunction(version => document.querySelector('#letsduck-update')?.shadowRoot?.querySelector('button')?.textContent?.trim() === 'v' + version, currentVersion);
  assert.equal((await button.textContent())?.trim(), 'v' + currentVersion);
  await send({ phase: 'available', version: '99.0.0' });
  await panel.getByRole('button', { name: '有新版本待更新', exact: true }).waitFor(); await screenshot('available'); await button.click();
  await send({ phase: 'downloading', version: '99.0.0', percent: 43 });
  await panel.getByRole('button', { name: '下载中 43%', exact: true }).waitFor(); assert.equal(await button.isDisabled(), true); await screenshot('downloading');
  await send({ phase: 'error', retry: 'download' }); await panel.getByRole('button', { name: '更新失败 · 重试', exact: true }).waitFor(); await screenshot('retry'); await button.click();
  await send({ phase: 'error', retry: 'check' }); await button.click();
  await send({ phase: 'ready', version: '99.0.0' }); await panel.getByRole('button', { name: '重启更新', exact: true }).waitFor(); await screenshot('ready'); await button.click();
  await send({ phase: 'waiting', version: '99.0.0' }); await panel.getByRole('button', { name: '等待导出完成', exact: true }).waitFor(); assert.equal(await button.isDisabled(), true); await screenshot('waiting');
  await send({ phase: 'installing', version: '99.0.0' }); await panel.getByRole('button', { name: '重启中…', exact: true }).waitFor(); assert.equal(await button.isDisabled(), true);
  await send({ phase: 'idle', version: '99.0.0' }); await panel.getByRole('button', { name: 'v' + currentVersion, exact: true }).waitFor();
  for (const [route, name] of [['/', 'home'], ['/paint', 'paint'], ['/assemble/', 'assemble']] as const) {
    await page.goto('duck://app' + route); await page.waitForFunction(() => document.querySelector('#letsduck-update')?.shadowRoot?.querySelector('button:not([hidden])'));
    if (name === 'paint') await studioState(page);
    if (name === 'assemble') await page.waitForFunction(() => document.querySelector('canvas'));
    for (const width of [1280, 1024, 800]) {
      await resizeWindow(application, page, { width, height: 800 }); await send({ phase: 'available', version: '99.0.0' });
      await panel.getByRole('button', { name: '有新版本待更新', exact: true }).waitFor(); await screenshot(name + '-' + width); await layout(name + '-' + width);
    }
  }
  // A panel language-state event; this is separate from actual paint locale menu coverage below.
  await page.evaluate(() => { document.documentElement.lang = 'en'; });
  await panel.getByRole('button', { name: 'Update available', exact: true }).waitFor(); await layout('assemble-en-800');
  await page.goto('duck://app/paint'); await studioState(page); await page.waitForFunction(() => document.querySelector('#letsduck-update')?.shadowRoot);
  await chooseLocale(page, 'en');
  for (const width of [1280, 1024, 800]) {
    await resizeWindow(application, page, { width, height: 800 }); await send({ phase: 'available', version: '99.0.0' });
    await panel.getByRole('button', { name: 'Update available', exact: true }).waitFor(); await screenshot('paint-en-' + width); await layout('paint-en-' + width);
  }
  const commands = await application.evaluate(() => globalThis.desktopSmokeCommands);
  assert.deepEqual(commands, ['download', 'download', 'check', 'install']); assert.deepEqual(errors, []);
  result = { currentVersion, simulatedStates: ['idle', 'checking', 'available', 'downloading', 'error', 'ready', 'waiting', 'installing'], commands, layouts, errors, actualInstallation: false, assemblyPrerequisite: 'explicitly simulated owned ledger; hardware not tested' };
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ error: failure(error), errors, layouts, url: currentPage?.url() }, null, 2));
  if (currentPage) { await writeFile(join(output, 'failure-dom.html'), await currentPage.content().catch(() => 'DOM unavailable')); await currentPage.screenshot({ path: join(output, 'failure.png'), timeout: 5000 }).catch(() => {}); }
  throw error;
}
finally { await scope.dispose(); }
const receipt = { ...result, fakeAdb: scope.adbEvidence(), ownedPids: [...scope.pids], ownedProcessesExited: true, temporaryDataRemoved: true };
await writeFile(join(output, 'result.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify(receipt));
