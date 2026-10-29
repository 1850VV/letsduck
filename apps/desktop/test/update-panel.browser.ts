/** Real DOM unit of the compiled panel, with a fake preload; not an installed-app test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import {build} from 'esbuild';
import { join } from 'node:path';
import { desktop, verifyPids } from '../scripts/check-support.js';
import type { DesktopUpdateState } from '../src/updates.js';
import type { UpdateAction } from '../src/ipc.js';
import {DESKTOP_LOCALES,desktopText} from '../src/copy.js';

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
      const compiled=await build({entryPoints:[join(desktop,'dist/update-panel.js')],bundle:true,write:false,platform:'browser',format:'iife',logLevel:'silent'});
      await page.addScriptTag({content:compiled.outputFiles[0]!.text});
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
      for(const locale of DESKTOP_LOCALES){
        const expected={idle:'v1.2.3',checking:'v1.2.3',available:desktopText(locale,'update.available'),downloading:desktopText(locale,'update.downloading',{percent:42}),error:desktopText(locale,'update.error'),ready:desktopText(locale,'update.ready'),waiting:desktopText(locale,'update.waiting'),installing:desktopText(locale,'update.installing')};
        for(const phase of Object.keys(expected) as DesktopUpdateState['phase'][]){
          await page.evaluate(({locale,phase})=>{document.documentElement.lang=locale;window.desktopPanelTest?.listener?.({phase,currentVersion:'1.2.3',percent:42.9});},{locale,phase});
          assert.equal((await button.textContent())?.trim(),expected[phase],locale+' '+phase);
          assert.equal(await button.getAttribute('title'),['idle','checking'].includes(phase)?desktopText(locale,'update.current',{version:'v1.2.3'}):expected[phase]);
          assert.equal(await button.isDisabled(),!['available','error','ready'].includes(phase));
          assert.equal(await host.locator('.label').getAttribute('aria-live'),'polite');
          assert.equal(await host.locator('.progress').evaluate(element=>(element as HTMLElement).style.width),phase==='downloading'?'42%':'0%');
        }
      }
    } finally {
      try { for (const entry of (await inspector.send('SystemInfo.getProcessInfo')).processInfo) pids.add(entry.id); }
      finally { await inspector.detach().catch(() => {}); await browser.close(); await verifyPids(pids); }
    }
  });
}
