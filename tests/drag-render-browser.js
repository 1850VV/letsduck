// Real model/context: drag must reuse storage and release must restore exact pixels.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const out='output/drag-buffer';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false}),result={errors:[]};
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>result.errors.push(String(e)));
 await p.route('**/shared/duck-view.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('function prepareDrag(){','function prepareDrag(){return;').replace('function animate() {','function animate() {if(window.stopRender)return false;').replace('return { invalidate, mount,','return { __test:{renderer,scene,camera,controls}, invalidate, mount,')});});
 await p.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897');await p.waitForFunction(()=>window.studioProto);await p.waitForTimeout(800);
 result.contract=await p.evaluate(async()=>{
  const {createDragDraw}=await import('/shared/drag-render.mjs');
  const v=studioProto.view,{renderer:r,scene,camera}=v.__test,T=await import('three'),data=await(await import('/shared/duck-view.mjs')).loadDuck();
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));v.setHighlight();v.setSideCopy(null);v.setSplit(null);
  await new Promise(r=>setTimeout(r,500));window.stopRender=true;
  r.setPixelRatio(1);r.setSize(2500,1750,false);camera.aspect=2500/1750;camera.position.set(360,225,480);camera.lookAt(0,130,15);camera.updateProjectionMatrix();
  const draw=createDragDraw(r,scene,camera),gl=r.getContext(),calls=[],originals={};
  r.render(scene,camera);const before=v.canvas.toDataURL();
  await draw.prepare();
  // These are real GL allocations, not renderer method-call proxies.
  for(const name of ['texImage2D','texStorage2D','renderbufferStorage','renderbufferStorageMultisample']){originals[name]=gl[name];gl[name]=function(...a){calls.push(name);return originals[name].apply(this,a);};}
  for(let i=0;i<3;i++){draw.render(true);draw.render(false);}
  const after=v.canvas.toDataURL();
  for(const [name,fn]of Object.entries(originals))gl[name]=fn;
  draw.dispose();return {before,after,allocations:calls,size:[v.canvas.width,v.canvas.height],glError:gl.getError()};
 });
 const c=result.contract;assert.deepEqual(c.size,[2500,1750]);assert.deepEqual(c.allocations,[],'drag/release must not allocate GPU storage');assert.equal(c.glError,0);
 const a=PNG.sync.read(Buffer.from(c.before.split(',')[1],'base64')),b=PNG.sync.read(Buffer.from(c.after.split(',')[1],'base64'));let changed=0;for(let i=0;i<a.data.length;i++)if(a.data[i]!==b.data[i])changed++;
 delete c.before;delete c.after;c.restoredChangedChannels=changed;assert.equal(changed,0,'release must restore exact RGBA');assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
 result.images=await p.evaluate(async()=>{
  const {createDragDraw}=await import('/shared/drag-render.mjs'),v=studioProto.view,{renderer:r,scene,camera}=v.__test,T=await import('three'),data=await(await import('/shared/duck-view.mjs')).loadDuck(),gl=r.getContext(),rows=[];
  const draw=createDragDraw(r,scene,camera,()=>r.render(scene,camera));
  const pixels=()=>{const a=new Uint8Array(r.domElement.width*r.domElement.height*4);gl.readPixels(0,0,r.domElement.width,r.domElement.height,gl.RGBA,gl.UNSIGNED_BYTE,a);return a;};
  const diff=(a,b)=>{let sum=0,max=0,changed=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);sum+=d;if(d)changed++;max=Math.max(d,max);}return {changed,max,mae:sum/a.length};};
  for(const state of ['hero','rear','posed','closeup','basic','mixed']){
   v.setPose(state==='posed'?{headYaw:25,neck:-15,jaw:18,hip:12,knee:-24}:{});v.root.rotation.y=state==='rear'?Math.PI:0;
   v.setFinishes(Object.fromEntries(data.model.parts.map((p,i)=>[p.id,p.material.startsWith('TPU')?'tpu':state==='basic'?'basic':state==='mixed'?['basic','silk','translucent'][i%3]:'translucent'])));
   camera.position.set(360,225,480);camera.lookAt(0,130,15);if(state==='closeup'){const target=new T.Vector3(0,220,45);camera.position.copy(target).addScaledVector(new T.Vector3(360,95,465).normalize(),120);camera.lookAt(target);}
   r.setSize(1675,1172,false);r.render(scene,camera);const approved=pixels();
   r.setSize(2500,1750,false);r.render(scene,camera);const before=pixels();let candidate;
   const render=r.render;r.render=function(s,c){const target=r.getRenderTarget();render.call(this,s,c);if(target?.width===1675&&target?.height===1172){candidate=new Uint8Array(1675*1172*4);r.readRenderTargetPixels(target,0,0,1675,1172,candidate);}};
   try{await draw.prepare();draw.render(true);}finally{r.render=render;}
   draw.render(false);rows.push({state,low:diff(approved,candidate),restored:diff(before,pixels())});
  }draw.dispose();return rows;
 });console.log(JSON.stringify({images:result.images}));
 for(const row of result.images){assert.equal(row.restored.changed,0,`${row.state}: restored image`);assert.ok(row.low.mae<.02&&row.low.max<=2,`${row.state}: low buffer must match approved rendering`);}
 result.recovery=await p.evaluate(async()=>{
  const {createDragDraw}=await import('/shared/drag-render.mjs'),v=studioProto.view,{renderer:r,scene,camera}=v.__test,d=createDragDraw(r,scene,camera);
  const sources=[];scene.traverse(o=>{if(o.material)sources.push([o,o.material]);});
  const intact=()=>sources.every(([o,m])=>o.material===m);
  const capture=()=>{r.render(scene,camera);return v.canvas.toDataURL();};
  const baseline=capture();let release,allowed=true;const gate=new Promise(resolve=>release=resolve),compile=r.compileAsync;
  r.compileAsync=(...a)=>compile.apply(r,a).then(()=>gate);const pending=d.prepare(()=>allowed);
  d.render(true);const cold=v.canvas.toDataURL()===baseline&&intact();allowed=false;release();const cancelled=!(await pending);r.compileAsync=compile;
  await d.prepare();
  r.setSize(1200,800,false);const resized=capture();d.render(true);const resizeFallback=v.canvas.toDataURL()===resized;
  await d.prepare();let injected=false;const render=r.render;r.render=function(s,c){if(r.getRenderTarget()?.width===804&&!injected){injected=true;throw Error('Injected drag draw failure');}return render.call(this,s,c);};
  d.render(true);r.render=render;const recovered=v.canvas.toDataURL()===resized&&intact();d.reset();const reset=await d.prepare();d.dispose();r.setSize(2500,1750,false);
  return {cold,cancelled,resizeFallback,injected,recovered,reset};
 });assert.deepEqual(result.recovery,{cold:true,cancelled:true,resizeFallback:true,injected:true,recovered:true,reset:true});
 if(process.env.DUCK_DRAG_BENCH)result.timing=await p.evaluate(async()=>{
  const {createDragDraw}=await import('/shared/drag-render.mjs'),v=studioProto.view,{renderer:r,scene,camera}=v.__test,data=await(await import('/shared/duck-view.mjs')).loadDuck(),gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),frame=()=>new Promise(requestAnimationFrame),rows=[];
  if(!ext)return {unavailable:true};
  v.setPose({});v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));v.root.rotation.y=0;camera.position.set(360,225,480);camera.lookAt(0,130,15);r.setSize(2500,1750,false);
  const draw=createDragDraw(r,scene,camera,()=>r.render(scene,camera)),debug=gl.getExtension('WEBGL_debug_renderer_info');
  async function sample(mode,phase,trial){
   await frame();const q=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,q);const start=performance.now();
   if(mode==='reuse')draw.render(phase!=='release');
   else {const scale=mode==='resize'&&phase!=='release'?.67:1,w=Math.floor(2500*scale),h=Math.floor(1750*scale);if(r.domElement.width!==w)r.setSize(w,h,false);r.render(scene,camera);}
   const cpu=performance.now()-start;gl.endQuery(ext.TIME_ELAPSED_EXT);let n=0;while(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&n++<120)await frame();
   const gpu=gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT)?gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6:null;gl.deleteQuery(q);return {mode,phase,trial,cpu,gpu};
  }
  await draw.prepare();for(let i=0;i<15;i++)await sample('full','warmup',-1);
  for(let trial=0;trial<20;trial++)for(const mode of trial%2?['reuse','resize','full']:['full','resize','reuse']){
   v.root.rotation.y=0;await sample('full','reset',trial);rows.push(await sample(mode,'start',trial));
   for(let i=0;i<10;i++){v.root.rotation.y=i*.015;rows.push(await sample(mode,'moving',trial));}
   rows.push(await sample(mode,'release',trial));
  }draw.dispose();return {renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,rows};
 });
}catch(e){result.failure=String(e.stack||e);throw e;}finally{await browser.close();await fs.writeFile(`${out}/contract.json`,JSON.stringify(result,null,2));}
