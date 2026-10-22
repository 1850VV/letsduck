async page=>{
  const failures=[];
  const equal=(name,actual,want)=>{if(actual!==want)failures.push({name,actual,want});};
  await page.goto('http://127.0.0.1:8877/');await page.waitForFunction(()=>window.studioProto);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  const locale=code=>page.evaluate(async code=>(await import('/shared/i18n.mjs')).setLocale(code),code);
  const text=key=>page.evaluate(async key=>(await import('/shared/i18n.mjs')).t(key),key);
  await locale('en');await page.locator('[data-start="blank"]').click();await locale('ar');
  equal('visible toast action',await page.locator('#toast-undo').innerText(),await text('text.0348'));
  await page.locator('#undo').click();
  const expectedUndo=await page.evaluate(async()=>{const {t}=await import('/shared/i18n.mjs');return t('text.0054',{v0:t('text.0143',{v0:t('text.0124')})});});
  equal('history message',await page.locator('#toast').innerText(),expectedUndo);
  await locale('en');await page.locator('button[data-step="2"]').click();await page.locator('#pose-toggle').click();
  await page.locator('#pose-panel [data-pose="jaw"]').fill('17');await page.locator('#pose-panel [data-pose="jaw"]').dispatchEvent('input');
  await locale('fr');equal('open pose heading',await page.locator('#pose-panel .pose-head b').innerText(),await text('text.0303'));
  equal('pose value kept',await page.locator('#pose-panel [data-pose="jaw"]').inputValue(),'17');
  await page.locator('#pose-close').click();
  // Demo names must be keyed by their swatch, not reverse-matched against Japanese words.
  await locale('ja');await page.reload();await page.waitForFunction(()=>window.studioProto);await locale('en');await page.locator('button[data-step="2"]').click();
  await page.locator('[data-brand="sunlu"]').click();
  equal('pink demo stays pink',await page.locator('[data-key="demo-sunlu-10"]').getAttribute('aria-label'),await text('text.0035')+' '+await text('text.0037'));
  if(failures.length)throw Error(JSON.stringify(failures));
  return {passed:true,checks:5};
}
