// Integration acceptance in a task-owned persistent managed Chromium profile.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8905';
const out=new URL('../output/playwright/optimization-ab-ui/',import.meta.url),path=name=>fileURLToPath(new URL(name,out));
const result={checks:[],errors:[]},profile=path('opt-ab-ui-1024-profile');
const options={headless:false,args:['--mute-audio'],viewport:{width:390,height:844},hasTouch:true,locale:'zh-CN'};
const waitGuide=async page=>{await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:90000});const f=page.frame({name:'personal-assemble'});await f.waitForFunction(()=>window.anklePrototype?.state.ready);return f;};
let context,lock;
try{
 const lockPath=process.env.DUCK_BENCHMARK_LOCK;
 if(lockPath){
  let waiting=false;
  for(;;){
   try{await fs.mkdir(lockPath);lock=lockPath;break;}
   catch(error){if(error.code!=='EEXIST')throw error;if(!waiting){console.log('Waiting for coordinated browser lock');waiting=true;}await new Promise(resolve=>setTimeout(resolve,1000));}
  }
  await fs.writeFile(lock+'/owner',JSON.stringify({owner:'optimization-ab-ui',pid:process.pid,purpose:'serialized integration and draw-stop acceptance; no comparative timing'}));
 }
 // Seed only the synthetic state from the companion real-browser regression.
 const seed=JSON.parse(await fs.readFile(path('browser-state.json'),'utf8'));
 context=await chromium.launchPersistentContext(profile,options);
 await context.addInitScript(items=>{if(location.origin===items.origin)for(const {name,value} of items.localStorage)localStorage.setItem(name,value);},seed.origins.find(o=>o.origin===base));
 let page=await context.newPage();await page.goto(base+'/assemble/');let guide=await waitGuide(page);
 assert.equal(await guide.locator('#confirm-built').isChecked(),true);await context.close();context=null;
 context=await chromium.launchPersistentContext(profile,{...options,recordVideo:{dir:path('video'),size:{width:390,height:844}}});
 await context.addInitScript(()=>{
  window.acceptanceDraws=0;
  for(const Class of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(Class)for(const name of ['drawArrays','drawElements']){
   const original=Class.prototype[name];Class.prototype[name]=function(...args){window.acceptanceDraws++;return original.apply(this,args);};
  }
 });
 page=await context.newPage();page.on('pageerror',error=>result.errors.push(String(error)));await page.goto(base+'/assemble/');guide=await waitGuide(page);
 assert.equal(await guide.evaluate(()=>anklePrototype.state.step),69);assert.equal(await guide.locator('#confirm-built').isChecked(),true);
 result.checks.push('closed managed Chromium and reopened same disk profile: step 69 and confirmations persist');
 const video=page.video();
 await guide.locator('#instruction-toggle').tap();await guide.locator('#instruction-toggle').tap();
 await guide.locator('#sequence-open').tap();await guide.locator('#sequence-close').tap();
 await guide.locator('#replay button').tap();
 await guide.waitForFunction(()=>anklePrototype.state.progress>.05);
 assert.equal(await guide.locator('#confirm-built').isChecked(),true);
 await guide.locator('#pause button').tap();
 await guide.evaluate(()=>{const el=document.querySelector('#full-saved-progress');el.value='1';el.dispatchEvent(new Event('change'));});
 await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
 const canvas=guide.locator('#canvas-host canvas'),bounds=await canvas.boundingBox();
 const cameraBefore=await guide.evaluate(()=>anklePrototype.state.camera);
 await page.mouse.move(bounds.x+bounds.width*.5,bounds.y+bounds.height*.6);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.7,bounds.y+bounds.height*.5,{steps:12});await page.mouse.up();
 await page.waitForTimeout(700);const cameraAfter=await guide.evaluate(()=>anklePrototype.state.camera);assert.notDeepEqual(cameraBefore,cameraAfter);
 await page.mouse.wheel(0,160);await page.waitForTimeout(700);assert.notDeepEqual(cameraAfter,await guide.evaluate(()=>anklePrototype.state.camera));
 assert.equal(await guide.locator('#focus-zoom').isVisible(),true);result.checks.push('touch panel/drawer/replay; real pointer orbit, wheel zoom and live connector magnifier');
 await guide.locator('#source-step button').tap();await guide.waitForFunction(()=>document.querySelector('#reference-video').readyState>=1);await page.keyboard.press('Escape');
 await guide.locator('#view-settings summary').tap();await guide.locator('#front-view button').tap();await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
 await guide.locator('#back-view button').tap();await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
 await guide.locator('#reset-view button').tap();await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
 // Actual draw calls are observed only while holding the coordinated lock.
 for(const mode of ['current','ultra']){
  await guide.locator('#render-quality select').selectOption(mode);await page.waitForTimeout(3500);
  const before=await guide.evaluate(()=>acceptanceDraws);await page.waitForTimeout(1200);const after=await guide.evaluate(()=>acceptanceDraws);
  assert.equal(after,before,mode+' static model must stop actual GPU draws');result.checks.push({mode,staticDrawDelta:after-before});
  await guide.locator('#sequence-open').tap();await guide.locator('#sequence-close').tap();await page.waitForTimeout(100);
  assert.ok((await guide.evaluate(()=>acceptanceDraws))>after,'drawer interaction invalidates rendering');
 }
 await guide.locator('#render-quality select').selectOption('current');
 await guide.locator('#view-settings summary').tap();await guide.locator('#instruction-content').evaluate(el=>el.scrollTop=0);
 await page.screenshot({path:path('interaction-mobile.png')});
 // Real storage events from an independent same-origin window change schemes.
 const controller=await context.newPage();await controller.goto(base+'/assemble/audio-credits.html');
 const originalPersonal=await controller.evaluate(()=>localStorage.getItem('dd-studio-personal'));
 const draft=id=>({draft:{name:'Acceptance '+id,activeId:id,updated:Date.now(),design:{colors:{'P4-01':'#123456'},assignments:{},finishes:{}}}});
 await controller.evaluate(v=>localStorage.setItem('dd-studio-personal',JSON.stringify(v)),draft('A'));
 await guide.waitForFunction(()=>anklePrototype.state.step===0);
  const appearance=await guide.evaluate(async()=>{const {ACTORS}=await import('./hardware-state.mjs');return Object.values(ACTORS).filter(a=>a.sourceId==='P4-01').map(a=>({color:a.color,material:a.material?.color.getHexString()}));});
  assert.ok(appearance.length>0);assert.ok(appearance.every(a=>a.color==='#123456'&&a.material==='123456'),JSON.stringify(appearance));
 assert.equal(await guide.locator('#confirm-built').isChecked(),false);await guide.locator('#confirm-built').check();
 await controller.evaluate(v=>localStorage.setItem('dd-studio-personal',JSON.stringify(v)),draft('B'));
 await guide.waitForFunction(()=>!document.querySelector('#confirm-built').checked);
 await controller.evaluate(v=>localStorage.setItem('dd-studio-personal',JSON.stringify(v)),draft('A'));
 await guide.waitForFunction(()=>document.querySelector('#confirm-built').checked);
 await controller.evaluate(value=>value===null?localStorage.removeItem('dd-studio-personal'):localStorage.setItem('dd-studio-personal',value),originalPersonal);
 await guide.waitForFunction(()=>anklePrototype.state.step===69);
 assert.equal(await guide.locator('#confirm-built').isChecked(),true);await controller.close();
  result.checks.push('actual cross-window scheme A/B switching synchronizes printed material, isolates confirmations and preserves original draft progress');
 // Hot navigation uses the retained real assembly iframe.
 const oldFrame=guide;await guide.locator('.brand').click();await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
 const hiddenBefore=await oldFrame.evaluate(()=>acceptanceDraws);await page.waitForTimeout(500);assert.equal(await oldFrame.evaluate(()=>acceptanceDraws),hiddenBefore);
 await page.frame({name:'personal-home'}).locator('#paint-go').click();await page.waitForFunction(()=>document.documentElement.dataset.page==='paint',null,{timeout:90000});
 await page.frame({name:'personal-paint'}).locator('[data-brand-slot]').click();await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
 await page.frame({name:'personal-home'}).locator('#build-go').click();guide=await waitGuide(page);
 assert.equal(guide,oldFrame);assert.equal(await guide.evaluate(()=>anklePrototype.state.step),69);assert.equal(await guide.locator('#confirm-built').isChecked(),true);
 result.checks.push('assemble → home → paint → home → assemble retains live frame, position and confirmations; hidden frame stops draws');
 assert.deepEqual(result.errors,[]);
 await page.close();await video.saveAs(path('interaction.webm'));
}catch(error){result.failure=String(error.stack||error);throw error;}
finally{
 if(context)await context.close();
 if(lock){await fs.unlink(lock+'/owner');await fs.rmdir(lock);}
 await fs.writeFile(path('integration-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
