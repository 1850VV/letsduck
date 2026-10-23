// Alternate fresh baseline/candidate pages; includes all 13 PNGs, excludes upload/ZIP.
import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:false}),results={runs:[],errors:[]};
try{
 for(let round=0;round<3;round++)for(const candidate of round%2?[true,false]:[false,true]){
  const context=await browser.newContext(),page=await context.newPage(),legacy=[];
  try{
   page.on('pageerror',e=>results.errors.push(String(e)));
   await page.route('**/studio/studio.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('window.studioProto = { view,','window.studioProto = { duck, view,')});});
   await page.goto(candidate?(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897'):(process.env.DUCK_BASELINE_URL||'http://127.0.0.1:8896'));await page.waitForFunction(()=>window.studioProto);await page.waitForTimeout(1000);
   page.on('request',r=>{if(/\/geometry(?:\.pack)?\.bin(?:\?|$)/.test(r.url()))legacy.push(r.url());});
   const times=await page.evaluate(async candidate=>{
    const {renderExportThumbnails}=await import('/shared/duck-view.mjs'),{duck,view,state}=studioProto;view.setTurntable(false);const samples=[];
    for(let i=0;i<2;i++){const t=performance.now(),images=await renderExportThumbnails(duck,state.colors,{binaryUpload:true,view:candidate?view:null});samples.push({ms:performance.now()-t,images:Object.keys(images).length});}return samples;
   },candidate);
   if(candidate)assert.deepEqual(legacy,[]);assert.ok(times.every(t=>t.images===13));results.runs.push({round,candidate,times,legacy});
  }finally{await context.close();}
 }
 const median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)];
 results.medians=Object.fromEntries([false,true].map(candidate=>[candidate?'shared':'original',{first:median(results.runs.filter(r=>r.candidate===candidate).map(r=>r.times[0].ms)),repeat:median(results.runs.filter(r=>r.candidate===candidate).map(r=>r.times[1].ms))}]));
 assert.deepEqual(results.errors,[]);console.log(JSON.stringify(results));
}catch(e){results.failure=String(e.stack||e);throw e;}finally{await browser.close();await fs.writeFile('output/integration/export-cold-browser.json',JSON.stringify(results,null,2));}
