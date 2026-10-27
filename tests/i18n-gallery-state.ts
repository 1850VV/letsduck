import * as browserChecks from './browser/checks.js';
import type { Page } from 'playwright';
export default async (page: Page) =>{
 await browserChecks.preparePage(page);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:1440,height:950});await browserChecks.preparePage(page);await page.goto(browserChecks.browserUrl()+'/gallery/');
  await page.locator('.card').first().waitFor();
  await page.locator('#language-trigger').click();await page.locator('[data-locale="fr"]').click();
  if(errors.length)throw Error(errors.join('\n'));
  await page.locator('.card .visual').first().click();await page.locator('#viewer canvas').waitFor();
  await page.locator('#spin').click();
  const point=browserChecks.required(await page.locator('#viewer canvas').boundingBox());
  await page.mouse.move(point.x+point.width*.45,point.y+point.height*.45);await page.mouse.down();await page.mouse.move(point.x+point.width*.45+100,point.y+point.height*.45+30,{steps:12});await page.mouse.up();
  const pixelHash=()=>{
    const source=window.__browserChecks.query<HTMLCanvasElement>('#viewer canvas'),small=document.createElement('canvas');small.width=small.height=32;
    const ctx=window.__browserChecks.required(small.getContext('2d'));ctx.drawImage(source,0,0,32,32);let h=2166136261;for(const b of ctx.getImageData(0,0,32,32).data)h=Math.imul(h^b,16777619);return h>>>0;
  };
  await page.waitForFunction(()=>{const source=window.__browserChecks.query<HTMLCanvasElement>('#viewer canvas'),small=document.createElement('canvas');small.width=small.height=32;const ctx=window.__browserChecks.required(small.getContext('2d'));ctx.drawImage(source,0,0,32,32);let h=2166136261;for(const b of ctx.getImageData(0,0,32,32).data)h=Math.imul(h^b,16777619);window._sameView=window._lastView===h?(window._sameView||0)+1:0;window._lastView=h;return window._sameView>6;});
  const before=await page.evaluate(pixelHash);
  await browserChecks.dispatchLocale(page,'en');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const after=await page.evaluate(pixelHash);
  if(before!==after)throw Error('Gallery view reset when language changed');
  if(errors.length)throw Error(errors.join('\n'));
  return {passed:true,viewPreserved:true,errors};
}
