import {installRenderProbe} from './browser/render-probe.js';
import * as browserChecks from './browser/checks.js';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await browserChecks.launchBrowser({headless:false}),result:{errors:string[];states:{state:string;samples:{x:number;y:number;cpu:string|null;id:string|null|undefined;cpuMs:number;submitMs:number;totalMs:number}[]}[];blank?:{id:string|null|undefined;draws:number};failure?:string}={errors:[],states:[]};
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>result.errors.push(String(e)));
 await installRenderProbe(p);
 await browserChecks.preparePage(p);await p.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);if(await p.locator('#coach').isVisible())await p.locator('#coach-go').click();
 for(const state of ['hero','rear','posed','side','split','explode','arrange']){
  await p.evaluate(state=>{const v=window.studioProto.view;v.setTurntable(false);v.setSideCopy(null);v.setSplit(null);v.setLayout('assembly');v.view(state==='rear'?'back':'hero');v.setPose(state==='posed'?{headYaw:25,neck:-15,jaw:18,hip:12,knee:-24}:{});
   if(state==='side')v.setSideCopy(['P1-01','P1-02','P1-03']);if(state==='split')v.setSplit(window.studioProto.state.colors);if(state==='explode'||state==='arrange')v.setLayout(state);
  },state);await p.waitForTimeout(1500);
  const row=await p.evaluate(async state=>{
   const v=window.studioProto.view,b=v.canvas.getBoundingClientRect(),samples=[];
   for(let yy=0;yy<20;yy++)for(let xx=0;xx<28;xx++){
    const x=b.left+b.width*(xx+.5)/28,y=b.top+b.height*(yy+.5)/20;
    let t=performance.now();const cpu=v.pick(x,y),cpuMs=performance.now()-t;
    t=performance.now();const promise=v.pickAsync(x,y),submitMs=performance.now()-t,id=await promise,totalMs=performance.now()-t;
    samples.push({x,y,cpu,id,cpuMs,submitMs,totalMs});
   }
   return {state,samples};
  },state);
  const mismatches=row.samples.filter(s=>s.cpu!==s.id);result.states.push(row);assert.deepEqual(mismatches,[],state+' mismatches');console.log(state,row.samples.length,'matched');
 }
 await p.evaluate(()=>{const v=window.studioProto.view;v.setLayout('assembly');v.setSideCopy(null);v.view('hero');});await p.waitForTimeout(1500);
 result.blank=await p.evaluate(async()=>{const v=window.studioProto.view,b=v.canvas.getBoundingClientRect(),before=window.draws;const id=await v.pickAsync(b.left+1,b.top+1);return {id,draws:window.draws-before};});assert.deepEqual(result.blank,{id:null,draws:0});
 assert.deepEqual(result.errors,[]);
} catch(e){result.failure=browserChecks.failure(e);throw e;}finally{await browser.close();await fs.writeFile('output/integration/picking.json',JSON.stringify(result,null,2));}
