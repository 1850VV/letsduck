import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import type {Page} from 'playwright';
import {identityMessages} from '../frontend/locales/identity.js';
import * as checks from './browser/checks.js';

// Owned, fully numbered fake-device fixture; actual mouse/menu input, no device actions.
export default async(page:Page)=>{
 const errors:string[]=[],writes:string[]=[],results:string[]=[];
 const out='output/playwright/home-feedback';await mkdir(out,{recursive:true});
 await checks.preparePage(page);page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.method()!=='GET'&&new URL(request.url()).pathname.startsWith('/api/duck-debug/'))writes.push(request.url());});
 await page.goto(checks.browserUrl()+'/');try{await page.waitForSelector('body[data-home-ready=true]');}catch(error){console.log(JSON.stringify({startupErrors:errors}));throw error;}
 const canvas=await page.locator('#home-viewport canvas').elementHandle();
 for(const [locale,copy]of Object.entries(identityMessages)){
  await checks.chooseLocale(page,locale);
  await page.waitForFunction(code=>document.documentElement.lang===code,locale);
  assert.equal(await page.locator('.home-brand b').innerText(),copy['brand.name']);
  for(const id of ['paint','debug','assemble'])assert.equal(await page.locator(`[data-duck=${id}] strong`).evaluate(node=>node.firstChild?.textContent),copy[`hub.${id}.name`]);
  assert.equal(await page.locator('.home-brand small').count(),0);
  assert.equal(await page.locator('html').getAttribute('dir'),locale==='ar'?'rtl':'ltr');
  assert.ok((await page.title()).includes(copy['brand.name']!));
  assert.ok(await canvas?.evaluate(node=>node.isConnected),'language change preserves the WebGL canvas');
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:width===390?844:1000});
   await page.screenshot({path:`${out}/${locale}-${width}.png`});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),locale+' horizontal overflow at '+width);
   if(width===390){const labels=await page.locator('.duck-choice:not(.front)').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,bottom:r.bottom};}).sort((a,b)=>a.left-b.left));assert.ok(labels[0]!.right+4<=labels[1]!.left,locale+' side duck labels overlap');const rearBottom=await page.locator('.duck-choice:not(.front) small').evaluateAll(nodes=>Math.max(...nodes.map(node=>node.getBoundingClientRect().bottom)));const front=checks.required(await page.locator('.duck-choice.front strong').boundingBox());assert.ok(front.y>=rearBottom+16,locale+' front label rose into the model and rear labels');}
  }
  results.push(locale+' names, title, brand, direction, canvas and viewport');
 }
 await checks.chooseLocale(page,'en');await page.setViewportSize({width:1440,height:1000});
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 for(const id of ['paint','debug','assemble']){
  await page.locator('#reset-carousel').click();
  await page.waitForFunction(()=>document.querySelector('.duck-stage')?.getAttribute('data-settled')!=='false');
  // Aim at the model above its label, so this covers 3D picking and moving targets.
  const label=checks.required(await page.locator(`[data-duck=${id}]`).boundingBox());
  const point={x:label.x+label.width/2,y:label.y-45};
  assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,point),'CANVAS');
  await page.screenshot({path:`${out}/before-double-${id}.png`});
  const started=performance.now();await page.mouse.dblclick(point.x,point.y,{delay:45});
  try{await page.locator('#module-window').waitFor({state:'visible',timeout:700});}
  catch(error){await page.screenshot({path:`${out}/failed-double-${id}.png`});console.log(JSON.stringify({id,point,front:await page.locator('[data-c-position=true]').getAttribute('data-duck')}));throw error;}
  const elapsed=performance.now()-started;
  assert.ok(elapsed<700,id+' opens promptly: '+elapsed+' ms');
  assert.equal(await page.locator('#module-frame').getAttribute('src'),id==='paint'?'/paint':id==='debug'?'/debug/?embedded=1':'/assemble/');
  await page.screenshot({path:`${out}/double-${id}.png`});
  results.push(id+' model double-click '+elapsed.toFixed(1)+' ms');
  await page.locator('#close-module').click();
 }
 assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 return {passed:true,checks:results.length,results,deviceWrites:writes.length};
};
