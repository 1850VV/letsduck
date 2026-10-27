import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import {eventWithin} from '../../frontend/studio/menu-boundary.js';

test('menu ownership follows the original event path after its child is replaced',()=>{
  const menu=new EventTarget(),removedButton=new EventTarget(),outside=new EventTarget();
  assert.equal(eventWithin({composedPath:()=>[removedButton,menu]},menu),true);
  assert.equal(eventWithin({composedPath:()=>[outside]},menu),false);
});

test('rename stays open when the same click replaces the menu, and a later outside click closes it', {skip:process.env['WEB_STUDIO_BROWSER']!=='1'?'Set WEB_STUDIO_BROWSER=1 to run the managed Chromium DOM regression':false}, async () => {
  const result = await build({ entryPoints: [fileURLToPath(new URL('../../frontend/studio/menu-boundary.ts', import.meta.url))], bundle: true, format: 'iife', globalName: 'studioMenuBoundary', write: false });
  const output = result.outputFiles[0];
  assert.ok(output);
  const browser = await chromium.launch({ headless: true });
  const owned: number[] = [];
  try {
    const cdp = await browser.newBrowserCDPSession();
    const page = await browser.newPage();
    await page.setContent('<section id="scheme"><div id="scheme-menu"><button data-rename="saved">✎</button></div></section><button id="outside">Outside</button>');
    await page.addScriptTag({ content: output.text });
    const processes = await cdp.send('SystemInfo.getProcessInfo');
    owned.push(...processes.processInfo.map(item => item.id));
    await page.evaluate(() => {
      const helper: unknown = Reflect.get(globalThis, 'studioMenuBoundary');
      if (!helper || typeof helper !== 'object' || !('eventWithin' in helper) || typeof helper.eventWithin !== 'function') throw Error('Menu helper missing');
      const within = helper.eventWithin;
      const scheme = document.getElementById('scheme'), menu = document.getElementById('scheme-menu');
      if (!(scheme instanceof HTMLElement) || !(menu instanceof HTMLElement)) throw Error('Fixture missing');
      menu.addEventListener('click', event => {
        if (!(event.target instanceof Element) || !event.target.closest('[data-rename]')) return;
        menu.innerHTML = '<input id="sm-rename" value="Saved scheme">';
        document.getElementById('sm-rename')?.focus();
      });
      document.addEventListener('click', event => { if (!within(event, scheme)) menu.hidden = true; });
    });
    await page.locator('[data-rename]').click();
    if (process.env['WEB_STUDIO_SCREENSHOT']) await page.screenshot({ path: process.env['WEB_STUDIO_SCREENSHOT'] });
    assert.equal(await page.locator('#sm-rename').isVisible(), true, 'the rename input must survive the click that recreated its menu');
    await page.locator('#outside').click();
    assert.equal(await page.locator('#scheme-menu').isVisible(), false);
  } finally {
    await browser.close();
    for (let attempt = 0; attempt < 20 && owned.some(pid => { try { process.kill(pid, 0); return true; } catch { return false; } }); attempt++) await new Promise(resolve => setTimeout(resolve, 50));
    const remaining = owned.filter(pid => { try { process.kill(pid, 0); return true; } catch { return false; } });
    assert.deepEqual(remaining, [], 'owned Chromium processes must exit');
  }
});
