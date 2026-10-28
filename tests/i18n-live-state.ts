import * as browserChecks from './browser/checks.js';
import type { Page } from 'playwright';
export default async (page: Page) =>{
 await browserChecks.preparePage(page);
  const failures:{name:string;actual:unknown;want:unknown}[]=[];
  let checks=0;const equal=(name:string,actual:unknown,want:unknown)=>{checks++;if(actual!==want)failures.push({name,actual,want});};
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  const locale=(code:string)=>browserChecks.chooseLocale(page,code);
  const text=(key:string)=>page.evaluate(async key=>window.__duckModules.message(key),key);
  await locale('en');
  // Capture the transient toast in the same browser task. Software rendering can
  // otherwise spend longer opening the menu than the toast's 3.6s lifetime.
  // The separate acceptance check covers real menu open/choose/Escape for all locales.
  const toast=await page.evaluate(()=>{
    window.__browserChecks.query<HTMLElement>('[data-start="blank"]').click();
    const before=window.studioProto.state,colorsBefore=JSON.stringify(before.colors),shownBefore=window.__browserChecks.query('#toast').classList.contains('show');
    window.__browserChecks.query<HTMLElement>('[data-locale="ar"]').click();
    const after=window.studioProto.state;
    return {shownBefore,shownAfter:window.__browserChecks.query('#toast').classList.contains('show'),action:window.__browserChecks.query('#toast-undo').textContent,undoBefore:before.undo,undoAfter:after.undo,colorsBefore,colorsAfter:JSON.stringify(after.colors)};
  });
  equal('toast is active before and after locale change',toast.shownBefore&&toast.shownAfter,true);
  equal('visible toast action',toast.action,await text('text.0348'));
  equal('locale keeps the original undo history',toast.undoAfter,toast.undoBefore);
  equal('locale keeps the original draft',toast.colorsAfter,toast.colorsBefore);
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
  return {passed:true,checks};
}
