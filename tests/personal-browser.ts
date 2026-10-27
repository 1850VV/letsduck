import type {Page} from 'playwright';
import * as browserChecks from './browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture debug --check tests/personal-browser.ts
export default async (page:Page)=>{
 await browserChecks.preparePage(page);
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));
  await page.waitForFunction(() => window.studioProto?.state);await browserChecks.installRuntime(page);
  await browserChecks.chooseLocale(page,'zh-Hans');
  const site = await page.evaluate(() => fetch('/api/site').then(r => r.json()));
  if (site.edition !== 'personal') throw Error('Requires disposable personal edition');
  if (await page.locator('#auth-dialog').count() || await page.locator('.top-actions a[href*=gallery]').isVisible())
    throw Error('Personal mode exposed account or gallery controls');
  await page.setViewportSize({width:390,height:900});
  if(await page.locator('#import-code').isHidden())await page.locator('.ph-more').click();
  if (!await page.locator('#import-code').isVisible()) throw Error('Import unavailable on mobile');
  await page.locator('.ph-more').click();await page.setViewportSize({width:1280,height:900});
  const name = '个人版回归-' + Date.now();
  await page.locator('#scheme-btn').click();
  await page.locator('#sm-name').fill(name);
  await page.locator('#sm-save').click();
  await page.waitForFunction(n => window.studioProto.state.name === n && !window.studioProto.state.dirty, name);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(n => window.studioProto?.state.name === n, name);await browserChecks.installRuntime(page);
  // A new browser storage state must still load the named SQLite scheme.
  await page.locator('#scheme-btn').click();
  await page.locator('#sm-name').fill(name + '-未写入');
  await page.route('**/api/schemes/**', route => route.request().method() === 'PUT'
    ? route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'test',code:'server.failed',params:{}})})
    : route.continue());
  try {
    await page.locator('#sm-save').click();
    await page.waitForFunction(() => window.__browserChecks.query('#toast').textContent.includes('未能保存'));
    if (!await page.evaluate(() => window.studioProto.state.dirty)) throw Error('Failed save incorrectly marked saved');
    const rows = await page.evaluate(async() => {const raw:unknown=await fetch('/api/schemes').then(r=>r.json());if(!Array.isArray(raw))throw Error('Expected schemes');return raw.map(window.__duckModules.parseScheme);});
    if (!rows.some(r => r.name === name) || rows.some(r => r.name === name + '-未写入'))
      throw Error('Failed write changed persisted data');
  } finally {await page.unroute('**/api/schemes/**');}
  await page.locator('#sm-name').fill(name);
  await page.locator('#sm-save').click();
  await page.waitForFunction(() => !window.studioProto.state.dirty);
  await page.locator('#steps [data-step="3"]').click();
  await page.locator('[data-ptab="share"]').click();
  if (await page.locator('#publish').count()) throw Error('Personal mode exposed publish');
  const code = browserChecks.required(await page.locator('.code-box code').textContent());
  if (!code.startsWith('v1.')) throw Error('Use a design bound to real filaments');
  await page.locator('#import-code').click();
  const colors = await page.evaluate(() => JSON.stringify(window.studioProto.state.colors));
  await page.locator('#sm-code').fill('v1.invalid');
  await page.locator('#sm-import').click();
  if (await page.evaluate(() => JSON.stringify(window.studioProto.state.colors)) !== colors)
    throw Error('Invalid code modified the draft');
  await page.locator('#sm-code').fill(code);
  await page.locator('#sm-import').click();
  await page.waitForFunction(() => window.studioProto.state.step === 2 && !window.studioProto.state.activeId);
  return {sqliteSurvivedBrowserReset:true,failedSaveRemainsDirty:true,realCodeImported:true,invalidCodeKeptDraft:true};
}
