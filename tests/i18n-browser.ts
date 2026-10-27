import type {Page} from 'playwright';
import * as browserChecks from './browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture debug --check tests/i18n-browser.ts
export default async (page:Page)=>{
 await browserChecks.preparePage(page);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));
  await page.waitForFunction(()=>window.studioProto?.state);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  if(await page.locator('#language-trigger').count()!==1)throw Error('Missing permanent language selector');
  const before=await page.evaluate(()=>({state:window.studioProto.state,canvas:window.__browserChecks.query('canvas')}));
  await page.locator('#language-trigger').click();await page.locator('[data-locale="fr"]').click();
  await page.waitForFunction(()=>document.documentElement.lang==='fr');
  if(await page.locator('#language-trigger').count()!==1)throw Error('Selector disappeared');
  const after=await page.evaluate(()=>window.studioProto.state);
  if(JSON.stringify(before.state.colors)!==JSON.stringify(after.colors))throw Error('Locale switch changed colors');
  if(before.state.step!==after.step||before.state.undo!==after.undo)throw Error('Locale switch changed workflow state');
  await page.reload();await page.waitForFunction(()=>window.studioProto?.state);
  if(await page.locator('html').getAttribute('lang')!=='fr')throw Error('Manual language was not remembered');
  if(errors.length)throw Error(errors.join('\n'));
  return {passed:true,errors};
}
