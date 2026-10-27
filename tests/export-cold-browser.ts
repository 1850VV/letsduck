import * as browserChecks from './browser/checks.js';
// Alternate fresh baseline/candidate pages; includes all 13 PNGs, excludes upload/ZIP.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await browserChecks.launchBrowser({headless:false}),results:{runs:{round:number;candidate:boolean;times:{ms:number;images:number}[];legacy:string[]}[];errors:string[];medians?:Record<string,{first:number;repeat:number}>;failure?:string}={runs:[],errors:[]};
try{
 for(let round=0;round<3;round++)for(const candidate of round%2?[true,false]:[false,true]){
  const context=await browser.newContext(),page=await context.newPage(),legacy:string[]=[];
  try{
   page.on('pageerror',e=>results.errors.push(String(e)));
   await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(candidate?(browserChecks.browserUrl()):(browserChecks.browserUrl('DUCK_BASELINE_URL'))));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);await page.waitForTimeout(1000);
   page.on('request',r=>{if(/\/geometry(?:\.pack)?\.bin(?:\?|$)/.test(r.url()))legacy.push(r.url());});
   const times=await page.evaluate(async candidate=>{
    const {renderExportThumbnails,loadDuck}=window.__duckModules,{view,state}=window.studioProto,duck=await loadDuck();view.setTurntable(false);const samples=[];
    for(let i=0;i<2;i++){const t=performance.now(),images=await renderExportThumbnails(duck,state.colors,{binaryUpload:true,view:candidate?view:null});samples.push({ms:performance.now()-t,images:Object.keys(images).length});}return samples;
   },candidate);
   if(candidate)assert.deepEqual(legacy,[]);assert.ok(times.every(t=>t.images===13));results.runs.push({round,candidate,times,legacy});
  }finally{await context.close();}
 }
 const median=(xs:number[])=>browserChecks.required(xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)]);
 results.medians=Object.fromEntries([false,true].map(candidate=>[candidate?'shared':'original',{first:median(results.runs.filter(r=>r.candidate===candidate).map(r=>browserChecks.required(r.times[0]).ms)),repeat:median(results.runs.filter(r=>r.candidate===candidate).map(r=>browserChecks.required(r.times[1]).ms))}]));
 assert.deepEqual(results.errors,[]);console.log(JSON.stringify(results));
}catch(e){results.failure=browserChecks.failure(e);throw e;}finally{await browser.close();await fs.writeFile('output/integration/export-cold-browser.json',JSON.stringify(results,null,2));}
