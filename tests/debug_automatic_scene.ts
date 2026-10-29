/** Carries the retired Assembly Workbench's model/selection/view coverage to Debug. */
import assert from 'node:assert/strict';
import type {Page} from 'playwright';
import {PNG} from 'pngjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {STEPS,OVERVIEW_STEP} from '../frontend/assemble/hardware-state.js';
import * as checks from './browser/checks.js';

function geometryPixels(buffer:Buffer){
 const png=PNG.sync.read(buffer),background=png.data.subarray(0,3);let count=0;
 // Debug intentionally draws disconnected objects as translucent ghosts. Count
 // canvas pixels against its own background instead of assuming opaque black.
 for(let i=0;i<png.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(png.data[i+c]!-background[c]!)))>18)count++;
 return count;
}

export default async function automaticScene(page:Page){
 const base=checks.browserUrl(),history=await fetch(base+'/api/servo-setup/records').then(r=>r.json()),results:{step:string;robot:number;tray:number}[]=[],errors:string[]=[];
 for(const step of [STEPS.findIndex(s=>s.id==='prepare-usb'),STEPS.findIndex(s=>s.id==='r-prepare'),OVERVIEW_STEP]){
  const view=await page.context().newPage(),writes:string[]=[],legacy:string[]=[];
  try{
   await view.setViewportSize({width:1400,height:1040});await checks.preparePage(view);
   await view.addInitScript(value=>localStorage.setItem('letsduck-assembly',JSON.stringify({step:value})),step);
   view.on('pageerror',error=>errors.push(error.message));view.on('request',request=>{
    const path=new URL(request.url()).pathname;
    if(path.startsWith('/api/')&&request.method()!=='GET')writes.push(request.method()+' '+path);
    if(path==='/api/servo-setup')legacy.push(path);
   });
   await view.goto(base+'/debug/');await view.waitForSelector('body[data-model-ready=true]');
   const canvas=checks.required(await view.locator('#viewport canvas').elementHandle());
   await view.locator('[data-workbench=automatic]').click();await view.locator('#auto-progress').waitFor();
   assert.equal(await canvas.evaluate(element=>element.isConnected&&element===document.querySelector('#viewport canvas')),true,'automatic numbering reuses the existing Debug canvas');
   assert.deepEqual(await view.locator('#slots [data-slot]').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-slot')))),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
   await view.locator('[data-slot="21"]').click();await view.locator('[data-model="21"]:visible').waitFor();
   assert.equal(await view.locator('[data-slot="21"]').getAttribute('aria-pressed'),'true');
   const robot=await view.locator('#viewport canvas').screenshot(),robotPixels=geometryPixels(robot);assert.ok(robotPixels>3000,'the automatic tab displays real assembled geometry');
   await view.locator('[data-view=tray]').click();await view.waitForFunction(()=>document.querySelector('[data-view=tray]')?.getAttribute('aria-pressed')==='true');
   const tray=await view.locator('#viewport canvas').screenshot(),trayPixels=geometryPixels(tray);assert.ok(trayPixels>3000,'expanded servo geometry remains visible');
   assert.equal(await view.locator('[data-slot="21"]').getAttribute('aria-pressed'),'true','view changes preserve the explicit numbered selection');
   await view.locator('[data-view=robot]').click();await view.locator('[data-model="21"]:visible').waitFor();
   assert.ok(geometryPixels(await view.locator('#viewport canvas').screenshot())>3000,'folding back preserves the duck');
   assert.equal(await canvas.evaluate(element=>element.isConnected&&element===document.querySelector('#viewport canvas')),true);
   assert.deepEqual(await view.evaluate(()=>JSON.parse(localStorage.getItem('letsduck-assembly')!)),{step},'Debug view and selection never overwrite the tutorial position');
   assert.deepEqual(writes,[],'entering automatic, selecting and changing views sends no POST');assert.deepEqual(legacy,[]);
   const stepId=checks.required(STEPS[step]).id;results.push({step:stepId,robot:robotPixels,tray:trayPixels});
   if(process.env.DUCK_AUTO_SCENE_EVIDENCE){await mkdir(process.env.DUCK_AUTO_SCENE_EVIDENCE,{recursive:true});await writeFile(join(process.env.DUCK_AUTO_SCENE_EVIDENCE,stepId+'-robot.png'),robot);await writeFile(join(process.env.DUCK_AUTO_SCENE_EVIDENCE,stepId+'-tray.png'),tray);}
  }finally{await view.close();}
 }
 assert.deepEqual(await fetch(base+'/api/servo-setup/records').then(r=>r.json()),history);assert.deepEqual(errors,[]);
 return {passed:true,hardware:false,results,errors,viewOperationPosts:0};
}
