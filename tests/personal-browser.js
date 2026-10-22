// Playwright CLI regression. Requires a separately started, disposable SQLite
// personal instance on 18886 with the local asset pack. Never use real user data.
async (page) => {
  await page.goto('http://127.0.0.1:18886/');
  await page.waitForFunction(() => window.studioProto?.state);
  await page.evaluate(async () => (await import('/shared/i18n.mjs')).setLocale('zh-Hans'));
  const site = await page.evaluate(() => fetch('/api/site').then(r => r.json()));
  if (site.edition !== 'personal') throw Error('Requires disposable personal edition');
  if (await page.locator('#auth-dialog').count() || await page.locator('.top-actions a[href*=gallery]').isVisible())
    throw Error('Personal mode exposed account or gallery controls');
  await page.setViewportSize({width:390,height:900});
  if (!await page.locator('#import-code').isVisible()) throw Error('Import unavailable on mobile');
  await page.setViewportSize({width:1280,height:900});
  const name = '个人版回归-' + Date.now();
  await page.locator('#scheme-btn').click();
  await page.locator('#sm-name').fill(name);
  await page.locator('#sm-save').click();
  await page.waitForFunction(n => studioProto.state.name === n && !studioProto.state.dirty, name);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(n => window.studioProto?.state.name === n, name);
  // A new browser storage state must still load the named SQLite scheme.
  await page.locator('#scheme-btn').click();
  await page.locator('#sm-name').fill(name + '-未写入');
  await page.route('**/api/schemes/**', route => route.request().method() === 'PUT'
    ? route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'test',code:'server.failed',params:{}})})
    : route.continue());
  try {
    await page.locator('#sm-save').click();
    await page.waitForFunction(() => document.querySelector('#toast').textContent.includes('未能保存'));
    if (!await page.evaluate(() => studioProto.state.dirty)) throw Error('Failed save incorrectly marked saved');
    const rows = await page.evaluate(() => fetch('/api/schemes').then(r => r.json()));
    if (!rows.some(r => r.name === name) || rows.some(r => r.name === name + '-未写入'))
      throw Error('Failed write changed persisted data');
  } finally {await page.unroute('**/api/schemes/**');}
  await page.locator('#sm-name').fill(name);
  await page.locator('#sm-save').click();
  await page.waitForFunction(() => !studioProto.state.dirty);
  await page.locator('#steps [data-step="3"]').click();
  await page.locator('[data-ptab="share"]').click();
  if (await page.locator('#publish').count()) throw Error('Personal mode exposed publish');
  const code = await page.locator('.code-box code').textContent();
  if (!code.startsWith('v1.')) throw Error('Use a design bound to real filaments');
  await page.locator('#import-code').click();
  const colors = await page.evaluate(() => JSON.stringify(studioProto.state.colors));
  await page.locator('#sm-code').fill('v1.invalid');
  await page.locator('#sm-import').click();
  if (await page.evaluate(() => JSON.stringify(studioProto.state.colors)) !== colors)
    throw Error('Invalid code modified the draft');
  await page.locator('#sm-code').fill(code);
  await page.locator('#sm-import').click();
  await page.waitForFunction(() => studioProto.state.step === 2 && !studioProto.state.activeId);
  return {sqliteSurvivedBrowserReset:true,failedSaveRemainsDirty:true,realCodeImported:true,invalidCodeKeptDraft:true};
}
