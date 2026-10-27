import {installRenderProbe} from './browser/render-probe.js';
import * as browserChecks from './browser/checks.js';
// Real managed Chromium + local licensed assets. Run against the isolated server:
// npx tsx tests/browser/run-check.ts --fixture debug --script --check tests/performance-browser.ts

import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const url=browserChecks.browserUrl(),out=new URL('../output/integration/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const browser=await browserChecks.launchBrowser({headless:false}),results:{errors:string[];render:{state:string;channels:number;max:number}[];idle:{mode:string;frames:number}[];propDepth?:{before:boolean;during:boolean};failure?:string}={errors:[],render:[],idle:[]};
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>results.errors.push(String(e)));
 // Test-only instrumentation: the shipped viewer has no test renderer/camera API.
 await installRenderProbe(page);
 await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(url));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
 await page.waitForTimeout(1500);
 for(const mode of ['initial','pose','layout','side','split','snapshot']) {
  await page.evaluate(mode=>{const v=window.studioProto.view; // real view only
   if(mode==='pose')v.setPose({jaw:20,headYaw:20});
   if(mode==='layout')v.setLayout('arrange');
   if(mode==='side'){v.setLayout('assembly');v.setSideCopy(['P1-01','P1-02']);}
   if(mode==='split')v.setSplit(window.studioProto.state.colors);
   if(mode==='snapshot'){v.setSplit(null);v.setSideCopy(null);window.testSnapshot=v.snapshot(512,512).toDataURL();}
  },mode);
  await page.waitForTimeout(1500);const before=await page.evaluate(()=>window.drawCount);await page.waitForTimeout(300);const after=await page.evaluate(()=>window.drawCount);
  assert.equal(after,before,'idle '+mode);results.idle.push({mode,frames:after-before});
 }
 await browserChecks.mountSourceUnit(page);
 const propDepth=await page.evaluate(async()=>{
  const v=window.__unitView,T=window.__duckModules.THREE,data=await(window.__duckModules).loadDuck();
  v.setLayout('assembly');v.setSideCopy(null);v.setSplit(null);v.setHighlight();v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,'translucent'])));
  await new Promise(r=>setTimeout(r,1000));const before=window.__sourceUnitInternals.depthAllowed();
  const prop=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial());window.__browserChecks.required(v.joints.head_roll).add(prop);v.invalidate();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const during=window.__sourceUnitInternals.depthAllowed();
  prop.removeFromParent();prop.geometry.dispose();prop.material.dispose();v.invalidate();return {before,during};
 });assert.deepEqual(propDepth,{before:true,during:false},'attached action props bypass depth prepass');results.propDepth=propDepth;
 const images=await page.evaluate(async()=>{
  const v=window.__unitView,{renderer:r,scene,camera}=window.__sourceUnitInternals,T=window.__duckModules.THREE,{depthDraw}=window.__duckModules;
  const data=await(window.__duckModules).loadDuck(),material=new T.MeshBasicMaterial({colorWrite:false}),images=[];
  v.setSideCopy(null);v.setSplit(null);v.setLayout('assembly');v.setHighlight();v.setPose({});v.setTurntable(false);await new Promise(r=>setTimeout(r,1000));
  const size=r.getSize(new T.Vector2()),ratio=r.getPixelRatio();r.setPixelRatio(1);r.setSize(2500,1750,false);camera.aspect=2500/1750;camera.position.set(360,225,480);camera.lookAt(0,130,15);camera.updateProjectionMatrix();
  function capture(){const c=document.createElement('canvas');c.width=2500;c.height=1750;window.__browserChecks.required(c.getContext('2d')).drawImage(v.canvas,0,0);return c.toDataURL();}
  for(const state of ['hero','rear','posed','mixed','closeup']){
   v.root.rotation.y=state==='rear'?Math.PI:0;v.setPose(state==='posed'?{headYaw:25,neck:-15,jaw:18,hip:12,knee:-24}:{});
   v.setFinishes(Object.fromEntries(data.model.parts.map((p,i)=>[p.id,p.material.startsWith('TPU')?'tpu':state==='mixed'?window.__browserChecks.required(['basic','silk','translucent'][i%3]):'translucent'])));
   if(state==='closeup'){const target=new T.Vector3(0,220,45);camera.position.copy(target).addScaledVector(new T.Vector3(360,95,465).normalize(),120);camera.lookAt(target);}
   r.render(scene,camera);const baseline=capture();depthDraw(r,scene,camera,material);images.push({state,baseline,depth:capture()});
  }
  material.dispose();r.setPixelRatio(ratio);r.setSize(size.x,size.y,false);return images;
 });
 for(const row of images){const a=PNG.sync.read(browserChecks.pngBytes(row.baseline)),b=PNG.sync.read(browserChecks.pngBytes(row.depth));
  let channels=0,max=0;for(let i=0;i<a.data.length;i++){const d=Math.abs(browserChecks.required(a.data[i])-browserChecks.required(b.data[i]));if(d)channels++;max=Math.max(max,d);}
  results.render.push({state:row.state,channels,max});
  for(const variant of ['baseline','depth'] as const)await fs.writeFile(new URL(`integrated-${row.state}-${variant}.png`,out),browserChecks.pngBytes(row[variant]));
  assert.equal(channels,0,'depth image '+row.state);
 }
 await page.reload();await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);await page.waitForTimeout(800);
 await page.evaluate(()=>window.studioProto.actions.play('nod'));const before=await page.evaluate(()=>window.drawCount);await page.waitForTimeout(1000);assert.ok(await page.evaluate(()=>window.drawCount)>before,'action renders');await page.waitForTimeout(2500);
 const count=await page.evaluate(()=>window.drawCount);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.drawCount),count,'action settles');
 assert.deepEqual(results.errors,[]);console.log(JSON.stringify(results));
} catch(error){results.failure=browserChecks.failure(error);throw error;}
finally{await browser.close();await fs.writeFile(new URL('browser.json',out),JSON.stringify(results,null,2));}
