/**
 * Run: node --import tsx --test apps/desktop/test/assembly-ready.browser.ts
 * Real DOM unit of the smoke precondition; installed smoke checks full rendered models.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { assemblyReady, object, verifyPids } from '../scripts/check-support.js';

test('an early canvas does not permit assembly capture before the authored model-ready flag', async () => {
  const browser = await chromium.launch({ headless: true }), pids = new Set<number>();
  const inspector = await browser.newBrowserCDPSession();
  const record = async () => {
    const value: unknown = await inspector.send('SystemInfo.getProcessInfo');
    if (object(value) && Array.isArray(value.processInfo)) for (const item of value.processInfo) if (object(item) && typeof item.id === 'number') pids.add(item.id);
  };
  try {
    await record(); const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><canvas width="32" height="32"></canvas><div id="loading">Loading model</div></body></html>');
    assert.equal(await page.locator('canvas').count(), 1);
    assert.equal(await page.evaluate(assemblyReady), false, 'Canvas creation precedes authored model initialization');
    await page.evaluate(() => { document.documentElement.dataset.ready = 'false'; });
    assert.equal(await page.evaluate(assemblyReady), false);
    await page.evaluate(() => { document.documentElement.dataset.ready = 'true'; document.querySelector('#loading')?.setAttribute('hidden', ''); });
    await page.waitForFunction(assemblyReady, undefined, { timeout: 60_000 });
    const image = await page.screenshot({ timeout: 30_000 });
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  } finally {
    try { await record(); } finally { await inspector.detach().catch(() => {}); await browser.close(); await verifyPids(pids); }
  }
});
