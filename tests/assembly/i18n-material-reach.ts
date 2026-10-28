import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import type {Page,Locator} from 'playwright';
import {preparePage,browserUrl} from '../browser/checks.js';

// Intersect every clipping ancestor and verify a real pointer can reach the result.
async function visibleArea(locator:Locator){return locator.evaluate(element=>{
 const r=element.getBoundingClientRect();let left=Math.max(0,r.left),right=Math.min(innerWidth,r.right),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
 for(let parent=element.parentElement;parent;parent=parent.parentElement){const style=getComputedStyle(parent),p=parent.getBoundingClientRect();if(/auto|scroll|hidden|clip/.test(style.overflowX)){left=Math.max(left,p.left+parent.clientLeft);right=Math.min(right,p.left+parent.clientLeft+parent.clientWidth);}if(/auto|scroll|hidden|clip/.test(style.overflowY)){top=Math.max(top,p.top+parent.clientTop);bottom=Math.min(bottom,p.top+parent.clientTop+parent.clientHeight);}}
 const width=Math.max(0,right-left),height=Math.max(0,bottom-top),hit=width&&height?document.elementFromPoint((left+right)/2,(top+bottom)/2):null;
 return{left,right,top,bottom,width,height,hit:!!hit&&(hit===element||element.contains(hit))};
});}

async function revealList(page:Page){
 const kit=page.locator('#kit');await kit.hover({position:{x:8,y:16}});await page.mouse.wheel(0,-10000);await page.waitForTimeout(70);
 for(let i=0;i<20;i++){const area=await visibleArea(page.locator('#kit-parts'));if(area.height>=44)return area;await kit.hover({position:{x:8,y:16}});await page.mouse.wheel(0,30);await page.waitForTimeout(50);}
 throw Error('Material list remains clipped by a scrolling ancestor');
}

async function rowsReachable(page:Page){
 const list=page.locator('#kit-parts'),area=await revealList(page);await page.mouse.move((area.left+area.right)/2,(area.top+area.bottom)/2);await page.mouse.wheel(0,-10000);await page.waitForTimeout(70);
 const count=await list.locator('.material-row').count();assert.ok(count>=7);
 for(let index=0;index<count;index++){
  const row=list.locator('.material-row').nth(index);let reached=false;
  for(let attempt=0;attempt<80;attempt++){
   const target=await visibleArea(row);if(target.height>=43&&target.width>=44&&target.hit){reached=true;break;}
   const viewport=await visibleArea(list);assert.ok(viewport.height>=44,'List viewport remains usable');await page.mouse.move((viewport.left+viewport.right)/2,(viewport.top+viewport.bottom)/2);await page.mouse.wheel(0,20);await page.waitForTimeout(35);
  }
  assert.ok(reached,'Material row '+index+' is reachable through real wheel scrolling and its ancestors');
 }
 return count;
}

export default async function localizedMaterialReach(page:Page){
 await preparePage(page);await page.addInitScript(()=>{localStorage.setItem('dd-locale','fr');localStorage.setItem('letsduck-assemble-desk','off');});
 const controller=await page.context().newPage(),origin=browserUrl(),directory=process.env.ASSEMBLY_EVIDENCE_DIR,errors:string[]=[],writes:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))writes.push(request.method()+' '+request.url());});
 await controller.route('**/__material-reach-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Material locale controller</title>'}));
 try{
  await controller.goto(new URL('/__material-reach-controller',origin).href);await page.goto(new URL('/assemble/',origin).href);await page.waitForFunction(()=>window.anklePrototype?.state.uiReady);
  let checked=0;
  for(const size of [{width:960,height:600},{width:390,height:844}])for(const locale of ['fr','de','ar']){
   await page.setViewportSize(size);await controller.evaluate(locale=>localStorage.setItem('dd-locale',locale),locale);await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);
   if(!await page.locator('#kit').isVisible())await page.locator('#step-materials').click();await page.locator('#kit').waitFor({state:'visible'});
   checked+=await rowsReachable(page);
   if(directory){await mkdir(directory,{recursive:true});await page.screenshot({path:join(directory,locale+'-'+size.width+'-preparing.png')});}
   const enter=await revealList(page);await page.mouse.move((enter.left+enter.right)/2,(enter.top+enter.bottom)/2);await page.mouse.wheel(0,-10000);await page.waitForTimeout(70);await page.locator('#kit-parts .material-row').first().click({position:{x:40,y:20}});await page.locator('#inspection-screen').waitFor({state:'visible'});checked+=await rowsReachable(page);
   const first=page.locator('#kit-parts .material-row').first();const area=await revealList(page);await page.mouse.move((area.left+area.right)/2,(area.top+area.bottom)/2);await page.mouse.wheel(0,-10000);await page.waitForTimeout(70);await first.click({position:{x:40,y:20}});
   if(directory)await page.screenshot({path:join(directory,locale+'-'+size.width+'-inspection.png')});
   await page.locator('.inspection-return').click();assert.equal(await page.locator('#inspection-screen').isVisible(),false);
   await page.locator('#kit').hover({position:{x:8,y:16}});await page.mouse.wheel(0,10000);await page.waitForTimeout(70);const start=await visibleArea(page.locator('#kit-go'));assert.ok(start.height>=43&&start.hit,'Start button is reachable through ancestors');await page.locator('#kit-go').click();
   if(await page.evaluate(()=>window.anklePrototype.state.playing))await page.locator('#pause').click();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);return{passed:true,layouts:6,modes:2,materialRowsReached:checked,deviceAndDataWrites:0};
 }catch(error){if(directory){await mkdir(directory,{recursive:true});await page.screenshot({path:join(directory,'failure.png')});}throw error;}finally{await controller.close();}
}
