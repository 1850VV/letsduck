// Real managed Chromium + local assets. With the personal service running:
// DUCK_BROWSER_URL=http://127.0.0.1:8876 node tests/assembly-loading-browser.js
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8876';
const out=new URL('../output/playwright/assembly-loading/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--mute-audio']}),result={errors:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 try{
  const page=await context.newPage();page.on('pageerror',error=>result.errors.push(String(error)));
  await page.addInitScript(()=>{window.assemblyCueSteps=new Set();});
  // Count real cue analysis without replacing the choreography or its shared cable references.
  await page.route('**/assemble/fine-cues.mjs',async route=>{
   const response=await route.fetch(),source=await response.text();
   const entry='export function buildFineCues(index){';
   assert.ok(source.includes(entry),'cue analysis instrumentation boundary is available');
   await route.fulfill({response,body:source.replace(entry,'function observedBuildFineCues(index){')+
    '\nexport function buildFineCues(index){window.assemblyCueSteps.add(index);return observedBuildFineCues(index);}\n'});
  });
  await page.goto(base+'/');
  const shell=await page.locator('script[src="/shared/personal-shell.mjs"]').count();
  if(shell)await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
  const home=shell?page.frame({name:'personal-home'}):page;
  await home.locator('#build-go').click();
  if(shell)await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:60000});
  const guide=shell?page.frame({name:'personal-assemble'}):page;
  await guide.waitForFunction(()=>window.anklePrototype?.state.ready,null,{timeout:60000});
  result.startupSteps=await guide.evaluate(()=>[...assemblyCueSteps].sort((a,b)=>a-b));
  assert.deepEqual(result.startupSteps,[0],'startup must only calculate the visible step, not all 111 steps');
  assert.equal(await guide.locator('#loading').isVisible(),false);
  await page.screenshot({path:new URL('ready.png',out).pathname});
  await guide.locator('#overview button').click();
  await guide.waitForFunction(()=>anklePrototype.state.step===110&&!anklePrototype.state.cameraTransition);
  result.afterOverview=await guide.evaluate(()=>[...assemblyCueSteps].sort((a,b)=>a-b));
  assert.deepEqual(result.afterOverview,[0,110],'jumping ahead must leave unvisited intermediate steps unresolved');
  assert.deepEqual(result.errors,[]);
  console.log(JSON.stringify(result));
 }finally{await context.close();}
}catch(error){result.failure=String(error.stack||error);throw error;}
finally{await browser.close();await fs.writeFile(new URL('result.json',out),JSON.stringify(result,null,2));}
