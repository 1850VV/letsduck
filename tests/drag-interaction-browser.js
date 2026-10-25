// Input transitions on the actual app, including cold fallback and recovery.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='output/drag-buffer';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false}),result={errors:[],states:[]};
try{
 const context=await browser.newContext({viewport:{width:1674,height:965},recordVideo:{dir:out,size:{width:1674,height:965}}});
 const p=await context.newPage();p.on('pageerror',e=>result.errors.push(String(e)));
 await p.addInitScript(()=>{window.heldIdle=[];window.requestIdleCallback=fn=>heldIdle.push(fn);});
 await p.route('**/shared/duck-view.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return { invalidate, mount,','return { __test:{renderer,scene,camera,controls,dragDraw,dragging:()=>dragging}, invalidate, mount,')});});
 await p.route('**/studio/studio.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('window.studioProto = { view,','window.studioProto = { duck, view,')});});
 await p.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897');await p.waitForFunction(()=>window.studioProto);if(await p.locator('#coach').isVisible())await p.locator('#coach-go').click();
 await p.evaluate(async()=>{
  const v=studioProto.view,{renderer:r,scene,camera}=v.__test,data=studioProto.duck;
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));await new Promise(r=>setTimeout(r,700));
  // Keep logical renderer size equal to the actual CSS stage (split/side views
  // use CSS coordinates); DPR 2 gives the 2500x1750 desktop drawing buffer.
  r.setPixelRatio(2);r.setSize(1250,875,false);camera.aspect=2500/1750;camera.updateProjectionMatrix();r.render(scene,camera);
  window.trace={frames:[],allocations:[]};const gl=r.getContext();
  for(const name of ['texImage2D','texStorage2D','renderbufferStorage','renderbufferStorageMultisample']){const old=gl[name];gl[name]=function(...a){trace.allocations.push({name,args:a.map(v=>typeof v==='number'?v:null)});return old.apply(this,a);};}
  const render=r.render;r.render=function(s,c){const t=r.getRenderTarget(),start=performance.now();const value=render.call(this,s,c);trace.frames.push({at:start,width:t?.width||v.canvas.width,height:t?.height||v.canvas.height,offscreen:!!t,dragging:v.__test.dragging(),cpu:performance.now()-start});return value;};
  const prepare=v.__test.dragDraw.prepare;v.__test.dragDraw.prepare=function(...args){const start=performance.now(),promise=prepare(...args);trace.prepareCPU=performance.now()-start;return promise;};
 });
 const box=await p.locator('.stage canvas').first().boundingBox().catch(()=>null)||await p.locator('canvas').first().boundingBox();
 const x=box.x+box.width*.5,y=box.y+box.height*.5;
 const down=async()=>{await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+60,y+20,{steps:6});await p.waitForTimeout(100);};
 const clear=()=>p.evaluate(()=>{trace.frames=[];trace.allocations=[];});
 // Hover's existing 1x1 picking target has its own first-use allocation.
 await p.mouse.move(x,y);await p.waitForTimeout(250);
 await clear();await down();
 result.cold=await p.evaluate(()=>({held:studioProto.view.__test.dragging(),low:trace.frames.some(f=>f.width===1675),allocations:trace.allocations}));
 assert.equal(result.cold.held,true);assert.equal(result.cold.low,false,'unprepared drag keeps the original rendering');assert.deepEqual(result.cold.allocations,[]);
 await p.mouse.up();await p.waitForTimeout(1000);
 await clear();await p.evaluate(()=>{for(const fn of heldIdle.splice(0))fn();});await p.waitForFunction(()=>!studioProto.view.__test.dragDraw.needsPreparation());
 result.preparation=await p.evaluate(()=>({allocations:trace.allocations,synchronousCPU:trace.prepareCPU,frames:trace.frames}));
 await clear();await down();
 const held=await p.evaluate(()=>({frames:trace.frames,allocations:trace.allocations,canvas:[studioProto.view.canvas.width,studioProto.view.canvas.height]}));
 assert.ok(held.frames.some(f=>f.offscreen&&f.width===1675&&f.height===1172),'held pointer renders the accepted low-resolution image');assert.deepEqual(held.allocations,[]);assert.deepEqual(held.canvas,[2500,1750]);
 await clear();await p.mouse.up();await p.waitForTimeout(300);
 result.release=await p.evaluate(()=>({held:studioProto.view.__test.dragging(),frames:trace.frames,allocations:trace.allocations}));
 assert.equal(result.release.held,false);assert.deepEqual(result.release.allocations,[]);assert.ok(!result.release.frames.some(f=>f.width===1675),'inertia resumes at full resolution');
 await p.waitForFunction(()=>trace.frames.length&&performance.now()-trace.frames.at(-1).at>400,{timeout:20000});await clear();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>trace.frames.length),0,'idle remains asleep after damping settles');
 for(const state of ['highlight','side','arrange','split']){
  await p.evaluate(state=>{const v=studioProto.view;v.setHighlight();v.setSideCopy(null);v.setSplit(null);v.setLayout('assembly');if(state==='highlight')v.setHighlight(['P1-01']);if(state==='side')v.setSideCopy(['P1-01']);if(state==='arrange')v.setLayout('arrange');if(state==='split')v.setSplit(studioProto.state.colors);},state);
  await p.waitForTimeout(1500);if(state!=='split')await p.waitForFunction(()=>{for(const fn of heldIdle.splice(0))fn();return !studioProto.view.__test.dragDraw.needsPreparation();});await clear();await down();
  const r=await p.evaluate(()=>({held:studioProto.view.__test.dragging(),low:trace.frames.some(f=>f.width===1675),glError:studioProto.view.__test.renderer.getContext().getError()}));
  result.states.push({state,...r});assert.equal(r.held,true,state+' pointer');assert.equal(r.glError,0);assert.equal(r.low,state!=='split',state+' resolution');await p.mouse.up();
 }
 await p.evaluate(()=>{const v=studioProto.view;v.setLayout('assembly');v.setSplit(null);v.setSideCopy(null);v.setHighlight();v.view('hero');});await p.waitForTimeout(1500);await p.waitForFunction(()=>{for(const fn of heldIdle.splice(0))fn();return !studioProto.view.__test.dragDraw.needsPreparation();});
 await down();result.export=await p.evaluate(async()=>{
  const v=studioProto.view,r=v.__test.renderer,api=await import('/shared/duck-view.mjs'),T=await import('three');
  const saved={size:[v.canvas.width,v.canvas.height],viewport:r.getViewport(new T.Vector4()).toArray(),held:v.__test.dragging()};
  const images=await api.renderExportThumbnails(studioProto.duck,studioProto.state.colors,{view:v,binaryUpload:true});
  return {count:Object.keys(images).length,saved,after:{size:[v.canvas.width,v.canvas.height],viewport:r.getViewport(new T.Vector4()).toArray(),held:v.__test.dragging()}};
 });assert.equal(result.export.count,13);assert.deepEqual(result.export.after,result.export.saved);
 await p.mouse.up();await p.waitForTimeout(1000);
 await down();await p.evaluate(()=>window.dispatchEvent(new Event('blur')));assert.equal(await p.evaluate(()=>studioProto.view.__test.dragging()),false);await p.mouse.up();
 await down();await p.evaluate(()=>studioProto.view.canvas.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1})));assert.equal(await p.evaluate(()=>studioProto.view.__test.dragging()),false);await p.mouse.up();
 await p.screenshot({path:`${out}/actual.png`});
 const video=p.video();await context.close();await video.saveAs(`${out}/actual-drag.webm`);
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify({cold:result.cold,releaseAllocations:result.release.allocations,states:result.states,export:result.export.count,errors:result.errors}));
}catch(e){result.failure=String(e.stack||e);throw e;}finally{await browser.close();await fs.writeFile(`${out}/interaction.json`,JSON.stringify(result,null,2));}
