/** Real DOM unit of the compiled panel, with a fake preload; not an installed-app test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { desktop, verifyPids } from '../scripts/check-support.js';
import type { DesktopUpdateState } from '../src/updates.js';
import type { UpdateAction } from '../src/ipc.js';

declare global { interface Window { desktopPanelTest?: { actions: UpdateAction[]; listener?: (state: DesktopUpdateState) => void } } }
for (const [header, brand] of [['top', 'brand'], ['home-top', 'home-brand']] as const) {
  test(`compiled update panel retains installed version and click-only actions in ${header}`, async () => {
    const browser = await chromium.launch({ headless: true }), pids = new Set<number>();
    const inspector = await browser.newBrowserCDPSession();
    try {
      for (const entry of (await inspector.send('SystemInfo.getProcessInfo')).processInfo) pids.add(entry.id);
      const page = await browser.newPage(); await page.setContent(`<header class="${header}"><a class="${brand}">来做鸭</a></header>`);
      await page.evaluate('globalThis.__name = value => value');
      await page.evaluate(() => {
        window.desktopPanelTest = { actions: [] };
        window.letsduckDesktop = {
          state: async () => ({ phase: 'idle', currentVersion: '1.2.3' }),
          action: async action => { window.desktopPanelTest?.actions.push(action); },
          onState: listener => { if (!window.desktopPanelTest) throw new Error('Missing panel fixture'); window.desktopPanelTest.listener = listener; return () => { if (window.desktopPanelTest) delete window.desktopPanelTest.listener; }; },
        };
      });
      await page.addScriptTag({ type: 'module', content: await readFile(join(desktop, 'dist/update-panel.js'), 'utf8') });
      const host = page.locator('#letsduck-update'), button = host.getByRole('button');
      await button.waitFor({ timeout: 2000 }); assert.equal(await button.textContent().then(value => value?.trim()), 'v1.2.3'); assert.equal(await button.isDisabled(), true);
      assert.equal(await host.evaluate(element => element.parentElement?.tagName), 'HEADER');
      await page.evaluate(() => window.desktopPanelTest?.listener?.({ phase: 'available', version: '99.0.0', currentVersion: '1.2.3' }));
      await host.getByRole('button', { name: '有新版本待更新', exact: true }).waitFor(); assert.deepEqual(await page.evaluate(() => window.desktopPanelTest?.actions), []);
      await button.click();
      await page.evaluate(() => window.desktopPanelTest?.listener?.({ phase: 'ready', version: '99.0.0', currentVersion: '1.2.3' })); await button.click();
      await page.evaluate(() => window.desktopPanelTest?.listener?.({ phase: 'idle', version: '99.0.0', currentVersion: '1.2.3' }));
      assert.equal(await button.textContent().then(value => value?.trim()), 'v1.2.3'); assert.deepEqual(await page.evaluate(() => window.desktopPanelTest?.actions), ['download', 'install']);
      await page.evaluate(() => { document.documentElement.lang = 'en'; window.desktopPanelTest?.listener?.({ phase: 'available', currentVersion: '1.2.3' }); }); await host.getByRole('button', { name: 'Update available', exact: true }).waitFor();
    } finally {
      try { for (const entry of (await inspector.send('SystemInfo.getProcessInfo')).processInfo) pids.add(entry.id); }
      finally { await inspector.detach().catch(() => {}); await browser.close(); await verifyPids(pids); }
    }
  });
}
