// Run with the task-owned Playwright CLI against the development acceptance server on 8877.
async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8877/');
  await page.waitForFunction(()=>window.studioProto?.state);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  if(await page.locator('#language-trigger').count()!==1)throw Error('Missing permanent language selector');
  const before=await page.evaluate(()=>({state:studioProto.state,canvas:document.querySelector('canvas')}));
  await page.locator('#language-trigger').click();await page.locator('[data-locale="fr"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='fr');
  if(await page.locator('#language-trigger').count()!==1)throw Error('Selector disappeared');
  const after=await page.evaluate(()=>studioProto.state);
  if(JSON.stringify(before.state.colors)!==JSON.stringify(after.colors))throw Error('Locale switch changed colors');
  if(before.state.step!==after.step||before.state.undo!==after.undo)throw Error('Locale switch changed workflow state');
  await page.reload();await page.waitForFunction(()=>window.studioProto?.state);
  if(await page.locator('html').getAttribute('lang')!=='fr')throw Error('Manual language was not remembered');
  if(errors.length)throw Error(errors.join('\n'));
  return {passed:true,errors};
}
