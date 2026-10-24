// Actual A/B page + fixed depth repair + approved LOD. Managed Chromium only.
// DUCK_BROWSER_URL=http://127.0.0.1:8908 node tests/observation-integration-browser.js
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.DUCK_PLAYWRIGHT_PATH||'playwright');
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8908';
const out=new URL('../output/playwright/optimization-f-settings/',import.meta.url),path=name=>fileURLToPath(new URL(name,out));
await fs.mkdir(out,{recursive:true});
const result={checks:[],combinations:[],views:[],errors:[]};let context,lock;
try{
 if(process.env.DUCK_BENCHMARK_LOCK){let waiting=false;for(;;){try{await fs.mkdir(process.env.DUCK_BENCHMARK_LOCK);lock=process.env.DUCK_BENCHMARK_LOCK;break;}catch(error){if(error.code!=='EEXIST')throw error;if(!waiting){console.log('Waiting for coordinated browser lock');waiting=true;}await new Promise(resolve=>setTimeout(resolve,5000));}}await fs.writeFile(lock+'/owner',JSON.stringify({task:'opt-f-settings-1024',pid:process.pid,purpose:'functional integration; no timing comparison'}));}
 context=await chromium.launchPersistentContext(path('opt-f-settings-1024'),{headless:false,args:['--mute-audio'],viewport:{width:1440,height:1000},hasTouch:true,locale:'zh-CN',recordVideo:{dir:path('video'),size:{width:960,height:670}}});
 await context.route('**/assemble/render-quality.mjs',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace("render(world,camera,id='main'){","render(world,camera,id='main'){globalThis.fSettingsDraws=(globalThis.fSettingsDraws||0)+1;globalThis.fSettingsViews??={};globalThis.fSettingsViews[id]={near:camera.near,far:camera.far,position:camera.position.toArray(),target:camera.userData.target?.toArray()};")});});
 const page=context.pages()[0];page.on('pageerror',e=>result.errors.push(e.message));
 const guideReady=async()=>{await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:90000});const f=page.frame({name:'personal-assemble'});await f.waitForFunction(()=>window.anklePrototype?.state.ready,null,{timeout:90000});return f;};
 await page.goto(base+'/home.html');await page.evaluate(()=>localStorage.removeItem('dd-observation-v1'));
 await page.goto(base+'/assemble/');let guide=await guideReady();
 assert.equal(await guide.evaluate(async()=>(await import('/shared/personal-page.mjs')).pageActive()),true,'exercise the active retained page');
 assert.equal(await guide.locator('#render-quality').count(),1);assert.equal(await guide.locator('#focus-zoom-toggle').count(),1);assert.equal(await guide.locator('#sequence-open').count(),1);
 await guide.locator('#view-settings > summary').click();assert.equal(await guide.locator('#view-settings').evaluate(e=>e.open),true);
 await guide.locator('#observation-open').click();await page.screenshot({path:path('settings-ab-1440.png')});
 assert.equal(await guide.locator('#observation-dialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await guide.locator('#observation-open').evaluate(e=>e===document.activeElement),true);
 result.checks.push('A/B real settings entry opens modal; unique controls; Escape restores focus');
 const seek=async(step,progress)=>{await guide.evaluate(({step,progress})=>{document.getElementById('full-saved-step').value=String(step);document.getElementById('full-saved-progress').value=String(progress);document.getElementById('full-saved-step').dispatchEvent(new Event('change'));},{step,progress});await page.waitForTimeout(1800);};
 await guide.locator('#overview button').click();await page.waitForTimeout(1800);
 for(const quality of ['current','ultra'])for(const lighting of ['neutral','display']){
  await guide.locator('#view-settings').evaluate(e=>e.open=true);await guide.locator('#observation-open').click();await guide.locator('[data-quality='+quality+']').click();await guide.locator('[data-lighting='+lighting+']').click();await page.keyboard.press('Escape');await page.waitForTimeout(1600);
  const state=await guide.evaluate(()=>anklePrototype.quality);assert.equal(state.mode,quality);assert.equal(state.lighting,lighting);assert.equal(state.exposure,lighting==='display'?1.03:1.05);assert.equal(state.hemiIntensity,lighting==='display'?.22:2.2);assert.equal(state.shadowSize[0],quality==='ultra'?4096:2048);assert.equal(state.hardwareLod.enabled,true);
  const n=await guide.evaluate(()=>fSettingsDraws);await page.waitForTimeout(350);assert.equal(await guide.evaluate(()=>fSettingsDraws),n,'overview settles '+quality+lighting);
  await page.screenshot({path:path(quality+'-'+lighting+'-ab.png')});result.combinations.push({quality,lighting,state});
  // Actual difficult connector step, main camera zoom and separate magnifier camera.
  await seek(69,.72);await guide.locator('#view-settings').evaluate(e=>e.open=true);
  if(!await guide.evaluate(()=>anklePrototype.magnifier.visible))await guide.locator('#focus-zoom-toggle button').click();
  await guide.waitForFunction(()=>anklePrototype.magnifier.visible);await guide.locator('#canvas-host canvas').hover();await page.mouse.wheel(0,-900);await page.waitForTimeout(2200);
  const views=await guide.evaluate(()=>({views:fSettingsViews,target:anklePrototype.state.target,magnifier:anklePrototype.magnifier}));
  for(const [id,camera]of Object.entries(views.views)){const target=id==='main'?views.target:camera.target;assert.ok(target,id+' target');const distance=Math.hypot(...camera.position.map((v,i)=>v-target[i]));assert.ok(Math.abs(camera.near-Math.max(.1,distance*.01))<1e-5,id+' depth precision');}
  assert.equal(views.magnifier.visible,true);assert.ok(views.views.detail);await page.screenshot({path:path(quality+'-'+lighting+'-detail-ab.png')});result.views.push({quality,lighting,...views});
  const settled=await guide.evaluate(()=>fSettingsDraws);await page.waitForTimeout(400);assert.equal(await guide.evaluate(()=>fSettingsDraws),settled,'close/detail settles '+quality+lighting);
  await guide.locator('#overview button').click();await page.waitForTimeout(1800);
 }
 result.checks.push('four combinations preserve separate budgets/illumination; overview and zoom/detail cameras use repaired depth and return to idle');
 await page.reload();guide=await guideReady();assert.equal(await guide.evaluate(()=>anklePrototype.quality.mode),'ultra');assert.equal(await guide.evaluate(()=>anklePrototype.quality.lighting),'display');
 await page.evaluate(()=>personalApp.navigate('/'));await page.waitForFunction(()=>document.documentElement.dataset.page==='home');await page.waitForTimeout(500);const hidden=await guide.evaluate(()=>fSettingsDraws);
 await page.evaluate(()=>localStorage.setItem('dd-observation-v1','{"version":1,"quality":"current","lighting":"neutral"}'));await page.waitForTimeout(350);assert.equal(await guide.evaluate(()=>fSettingsDraws),hidden);
 await page.evaluate(()=>personalApp.navigate('/assemble/'));guide=await guideReady();assert.equal(await guide.evaluate(()=>anklePrototype.quality.lighting),'neutral');result.checks.push('refresh restores settings; hidden preference sync draws zero; retained return applies settings');
 await page.setViewportSize({width:390,height:844});await guide.locator('#view-settings').evaluate(e=>e.open=true);await guide.locator('#observation-open').tap();await page.screenshot({path:path('settings-ab-390.png')});
 const box=await guide.locator('#observation-dialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);await guide.locator('[data-lighting=display]').tap();assert.equal(await guide.locator('[data-lighting=display]').getAttribute('aria-pressed'),'true');await guide.locator('[data-quality=ultra]').focus();await page.keyboard.press('Enter');assert.equal(await guide.locator('[data-quality=ultra]').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');result.checks.push('390px A/B entry, touch, keyboard and dialog bounds');
 assert.deepEqual(result.errors,[]);
} catch(error){result.failure=String(error.stack||error);throw error;}
finally{if(context)await context.close();if(lock){const owner=await fs.readFile(lock+'/owner','utf8');if(JSON.parse(owner).pid===process.pid){await fs.unlink(lock+'/owner');await fs.rmdir(lock);}}await fs.writeFile(path('integration.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
