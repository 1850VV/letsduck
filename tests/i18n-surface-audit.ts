import * as browserChecks from './browser/checks.js';
import type { Page } from 'playwright';
export default async (page: Page) =>{
 await browserChecks.preparePage(page);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  if(await page.locator('html').getAttribute('lang')!=='en'){await page.locator('#language-trigger').click();await page.locator('[data-locale="en"]').click();}
  const sourceLabels=await page.evaluate(async()=>window.__duckModules.parseCatalog(await(await fetch('/api/catalog')).json()).products.map(p=>[p.brand,p.series,p.name,p.colorCode||p.skus?.[0]].filter(Boolean).join(' · ')));
  const audit=()=>page.evaluate(sourceLabels=>{
    const out=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(n.parentElement&&/[\u3400-\u9fff]/.test(n.textContent||'')&&!sourceLabels.includes((n.textContent||'').trim())&&n.parentElement.getClientRects().length&&!n.parentElement.closest('script,style,[data-brand-slot],#scheme-name,#profile-slot,#poster-title'))out.push({text:n.textContent,html:n.parentElement.outerHTML.slice(0,160)});
    }
    return out.slice(0,30);
  },sourceLabels);
  const result:{refine?:Awaited<ReturnType<typeof audit>>;show?:Awaited<ReturnType<typeof audit>>;poster?:Awaited<ReturnType<typeof audit>>;export?:Awaited<ReturnType<typeof audit>>;errors?:string[];openExportFollowsLocale?:boolean}={};
  await page.locator('[data-step="2"]').click();result.refine=await audit();
  await page.locator('[data-step="3"]').click();result.show=await audit();
  await page.locator('[data-ptab="share"]').click();await page.locator('#open-poster').click();
  await page.waitForFunction(()=>window.__browserChecks.query<HTMLImageElement>('#poster-img').complete);result.poster=await audit();
  await page.locator('#poster-close').click();await page.locator('[data-ptab="print"]').click();await page.locator('#export2').click();
  await page.waitForFunction(()=>document.querySelector('#dl-bom')||document.querySelector('#match-bambu'));result.export=await audit();
  result.errors=errors;
  if(Object.values(result).some(list=>Array.isArray(list)&&list.length))throw Error(JSON.stringify(result));
  await browserChecks.dispatchLocale(page,'fr');
  await page.waitForFunction(async()=>document.querySelector('#dl-3mf')?.textContent===window.__duckModules.message('text.0322'));
  result.openExportFollowsLocale=true;return result;
}
