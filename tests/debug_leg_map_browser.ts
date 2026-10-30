import type {Page} from 'playwright';
import * as browserChecks from './browser/checks.js';
// Isolated browser regression; never permits controller commands.
export default async (page:Page)=>{
 await browserChecks.preparePage(page);
 const errors:string[]=[],writes:(string|null)[]=[],checks:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/duck-debug/action',async route=>{writes.push(route.request().postData());await route.fulfill({status:409,json:{error:'Read-only mapping verification'}});});
 const check=(name:string,ok:boolean|undefined)=>{if(!ok)throw Error(name);checks.push(name);};
 await page.setViewportSize({width:1440,height:1000});await browserChecks.preparePage(page);await page.goto((browserChecks.browserUrl())+'/debug/');await page.waitForSelector('body[data-model-ready=true]');
 const groups=page.locator('#slots > div');
 check('固定盘位按右腿、左腿、头颈与鸭嘴分为三组',await groups.count()===3);
 // Match the front-facing model without changing the physical ID-to-leg mapping.
 for(const [index,name,range,ids] of [[0,'右腿','20–24',[20,21,22,23,24]],[1,'左腿','10–14',[10,11,12,13,14]],[2,'头颈与鸭嘴','30–34',[30,31,32,33,34]]] as const){
  const group=groups.nth(index),title=await group.locator('.slot-group-title').innerText();
  check(name+'标题与编号范围对应',title.includes(name)&&title.includes(range));
  const actual=await group.locator('[data-slot]').evaluateAll(slots=>slots.map(slot=>slot.getAttribute('data-slot')));
  check(name+'包含正确的五个编号',actual.join(',')===ids.join(','));
 }
 for(const [id,name] of [[12,'左腿上端'],[14,'左脚踝'],[22,'右腿上端'],[24,'右脚踝']] as const){
  await page.locator(`[data-slot="${id}"]`).click();await page.locator(`[data-model="${id}"]`).waitFor({state:'visible'});
  check('ID'+id+'参数卡与3D选择对应',await page.locator('#panel').innerText().then(s=>s.includes(name))&&await page.locator(`[data-model="${id}"]`).evaluate(el=>el.classList.contains('selected')));
 }
 await page.locator('[data-view=tray]').click();check('固定盘位仍为15个',await page.locator('#slots [data-slot]').count()===15);
 await page.locator('[data-view=robot]').click();await page.locator('[data-slot="14"]').click();
 await page.screenshot({path:'output/playwright/debug-leg-map/fixture-after.png'});
 check('不发送设备操作请求',writes.length===0);check('无加载错误',errors.length===0);
 await page.unrouteAll({behavior:'wait'});return {pass:true,checks,writes,errors};
}
