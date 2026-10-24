// Verify the paint warm-up is invisible and retained pages remain non-interactive while hidden.
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:false});
const result={pages:[],errors:[]};
const out='output/optimization-assets/paint-preservation';await fs.mkdir(out,{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 try{
 await context.addInitScript(()=>{window.gpuDraws=0;for(const name of ['drawElements','drawArrays']){const original=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){gpuDraws++;return original.apply(this,args);};}});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));
 await page.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8904');
 await page.waitForFunction(()=>document.querySelectorAll('iframe').length===3&&[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement?.dataset.pageReady),null,{timeout:60000});
 assert.equal(await page.locator('iframe[data-paint-warm="true"]').count(),2);
 await page.waitForTimeout(250);
 const hiddenDraws=()=>page.evaluate(()=>[...document.querySelectorAll('iframe[data-paint-warm="true"]')].map(f=>({key:f.dataset.personalPage,draws:f.contentWindow.gpuDraws})));
 const beforeDraws=await hiddenDraws();await page.waitForTimeout(250);result.unvisitedDraws=await hiddenDraws();assert.deepEqual(result.unvisitedDraws,beforeDraws,'paint preparation must keep unvisited 3D scenes asleep');
 assert.equal(await page.frame({name:'personal-assemble'}).evaluate(()=>document.querySelector('#piano-audio').paused),true,'unvisited guide music must remain paused');
 for(const[key,href]of[['home','/'],['paint','/paint'],['assemble','/assemble/']]){
  await page.evaluate(href=>personalApp.navigate(href),href);await page.waitForTimeout(400);
  const frame=page.frame({name:'personal-'+key});await frame.evaluate(()=>personalPage.setActive(false));
  assert.equal(await page.locator('iframe').count(),3);
  assert.equal(await page.locator('iframe[data-active="true"]').count(),1);
  assert.ok(await page.evaluate(()=>[...document.querySelectorAll('iframe[data-active="false"]')].every(f=>f.inert&&f.getAttribute('aria-hidden')==='true')));
  // Freeze finite CSS animations/transitions as well as scene RAFs; activity changes can fade a badge.
  const after=await page.screenshot({animations:'disabled',path:`${out}/${key}-after.png`});
  const repeated=await page.screenshot({animations:'disabled'});
  const original=await page.addStyleTag({content:'html[data-ready="true"] iframe[data-paint-warm="true"]{visibility:hidden!important}iframe{background:transparent!important;z-index:auto!important}iframe[data-active="true"]{visibility:visible!important}'});
  const before=await page.screenshot({animations:'disabled',path:`${out}/${key}-before.png`});await original.evaluate(e=>e.remove());
  const a=PNG.sync.read(after),b=PNG.sync.read(before),same=PNG.sync.read(repeated);let changed=0,max=0,total=0,noise=0;const changedPixels=new Set(),noisePixels=new Set();
  assert.equal(a.width,b.width);assert.equal(a.height,b.height);
  for(let i=0;i<a.data.length;i++)if(a.data[i]!==same.data[i]){noise++;noisePixels.add(Math.floor(i/4));}
  for(let i=0;i<a.data.length;i++){const diff=Math.abs(a.data[i]-b.data[i]);if(diff){changed++;changedPixels.add(Math.floor(i/4));}max=Math.max(max,diff);total+=diff;}
  const mae=total/a.data.length;result.pages.push({key,changedChannels:changed,maxDelta:max,mae,repeatedCaptureNoiseChannels:noise,changedPixels:changedPixels.size,repeatedCaptureNoisePixels:noisePixels.size});
  assert.equal(noisePixels.size,0,key+' capture must be stable before comparison');
  assert.equal(changed,0,key+' must remain pixel identical');
 }
 assert.deepEqual(result.errors,[]);
 }finally{await context.close();}
}finally{await browser.close();await fs.writeFile(`${out}/result.json`,JSON.stringify(result,null,2));}
console.log(JSON.stringify(result,null,2));
