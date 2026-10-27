import * as browserChecks from './browser/checks.js';
import type { Page } from 'playwright';
export default async (page: Page) =>{
 await browserChecks.preparePage(page);
  const failures:{name:string;actual:unknown;want:unknown}[]=[];
  const equal=(name:string,actual:unknown,want:unknown)=>{if(actual!==want)failures.push({name,actual,want});};
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  const locale=(code:string)=>browserChecks.chooseLocale(page,code);
  const text=(key:string)=>page.evaluate(async key=>window.__duckModules.message(key),key);
  await locale('en');await page.locator('[data-start="blank"]').click();await locale('ar');
  equal('visible toast action',await page.locator('#toast-undo').innerText(),await text('text.0348'));
  await page.locator('#undo').click();
  const expectedUndo=await page.evaluate(async()=>{const t=window.__duckModules.message;return t('text.0054',{v0:t('text.0143',{v0:t('text.0124')})});});
  equal('history message',await page.locator('#toast').innerText(),expectedUndo);
  await locale('en');await page.locator('button[data-step="2"]').click();await page.locator('#pose-toggle').click();
  await page.locator('#pose-panel [data-pose="jaw"]').fill('17');await page.locator('#pose-panel [data-pose="jaw"]').dispatchEvent('input');
  await locale('fr');equal('open pose heading',await page.locator('#pose-panel .pose-head b').innerText(),await text('text.0303'));
  equal('pose value kept',await page.locator('#pose-panel [data-pose="jaw"]').inputValue(),'17');
  await page.locator('#pose-close').click();
  // The official SKU retains its vendor colour name through Japanese -> English.
  await locale('ja');await page.reload();await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);await locale('en');await page.locator('button[data-step="2"]').click();
  await page.locator('[data-brand="sunlu"]').click();await page.locator('#filament-series').selectOption('丝绸PLA+2.0');
  equal('official pink SKU retains its vendor name',await page.locator('[data-key="sunlu-6372193a1752f3"]').getAttribute('aria-label'),'SUNLU · 丝绸PLA+2.0 · 柔缎粉');
  if(failures.length)throw Error(JSON.stringify(failures));
  return {passed:true,checks:5};
}
