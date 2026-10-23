// Real-model contract + matched GPU timing. Run alone with managed Chromium.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const out='output/transmission-half';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false}),result={errors:[],images:[]};
function difference(a,b){
 let sum=0,foreground=0,over8=0,max=0,changed=0;
 for(let i=0;i<a.length;i+=4){if(a[i+3]>127||b[i+3]>127){foreground++;let over=false;for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);sum+=d;max=Math.max(max,d);if(d>8)over=true;}if(over)over8++;}for(let c=0;c<4;c++)if(a[i+c]!==b[i+c])changed++;}
 return {foregroundMAE:sum/(foreground*3),pixelsOver8:over8/foreground,max,changedChannels:changed};
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>result.errors.push(String(e)));
 const instrument=async route=>{
  const response=await route.fetch(),source=await response.text();
  await route.fulfill({response,body:source.replace('function animate() {','function animate() {if(window.stopRender)return false;').replace('return { invalidate, mount,','return { __test:{renderer,scene,camera,draw}, invalidate, mount,')});
 };
 await page.route('**/shared/duck-view.mjs',instrument);
 await page.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897');await page.waitForFunction(()=>window.studioProto);
 result.contract=await page.evaluate(async()=>{
  const v=studioProto.view,{renderer:r,scene,camera}=v.__test,data=await(await import('/shared/duck-view.mjs')).loadDuck();window.modelData=data;
  v.setColors(Object.fromEntries(data.model.parts.map(p=>[p.id,p.color])),true);v.setHighlight();v.setTurntable(false);
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));
  await new Promise(r=>setTimeout(r,1000));window.stopRender=true;
  r.setPixelRatio(1);r.setSize(2500,1750,false);camera.aspect=2500/1750;camera.position.set(360,225,480);camera.lookAt(0,130,15);camera.updateProjectionMatrix();
  const targets=[],set=r.setRenderTarget;r.setRenderTarget=function(target,...args){if(target?.texture.generateMipmaps&&target.samples===4)targets.push([target.width,target.height]);return set.call(this,target,...args);};
  try{r.render(scene,camera);}finally{r.setRenderTarget=set;}
  return {canvas:[r.domElement.width,r.domElement.height],targets};
 });
 assert.deepEqual(result.contract,{canvas:[2500,1750],targets:[[1250,875]]},'Only transmission target should halve; main canvas stays full size');
 for(const state of ['hero','rear','posed','mixed','closeup','basic']){
  const pair=await page.evaluate(async state=>{
   const v=studioProto.view,{renderer:r,scene,camera}=v.__test,T=await import('three'),{depthDraw}=await import('/shared/depth-render.mjs');
   v.setPose(state==='posed'?{headYaw:25,neck:-15,jaw:18,hip:12,knee:-24}:{});v.root.rotation.y=state==='rear'?Math.PI:0;
   v.setFinishes(Object.fromEntries(modelData.model.parts.map((p,i)=>[p.id,p.material.startsWith('TPU')?'tpu':state==='basic'?'basic':state==='mixed'?['basic','silk','translucent'][i%3]:'translucent'])));
   camera.position.set(360,225,480);camera.lookAt(0,130,15);
   if(state==='closeup'){const target=new T.Vector3(0,220,45);camera.position.copy(target).addScaledVector(new T.Vector3(360,95,465).normalize(),120);camera.lookAt(target);}
   const material=new T.MeshBasicMaterial({colorWrite:false});
   const after=()=>{r.render(scene,camera);return r.domElement.toDataURL();};
   try{const candidate=after();depthDraw(r,scene,camera,material);const depth=r.domElement.toDataURL();r.transmissionResolutionScale=1;const baseline=after();return {baseline,candidate,depth};}
   finally{material.dispose();r.transmissionResolutionScale=.5;}
  },state);
  const png={};for(const [name,url] of Object.entries(pair)){const bytes=Buffer.from(url.split(',')[1],'base64');png[name]=PNG.sync.read(bytes);if(name!=='depth')await fs.writeFile(`${out}/${state}-${name}.png`,bytes);}
  assert.deepEqual(png.candidate.data,png.depth.data,`${state}: adaptive depth path must retain candidate pixels`);
  const diff=difference(png.baseline.data,png.candidate.data);result.images.push({state,...diff});
  if(state==='basic')assert.equal(diff.changedChannels,0,'Non-transmissive material is unaffected');
  else assert.ok(diff.foregroundMAE<1.05&&diff.pixelsOver8<.04,`${state}: exceeds reviewed visual error envelope`);
 }
 result.timing=await page.evaluate(async()=>{
  const v=studioProto.view,{renderer:r,scene,camera}=v.__test,{adaptiveDraw,depthDraw}=await import('/shared/depth-render.mjs'),T=await import('three');
  v.setPose({});v.setFinishes(Object.fromEntries(modelData.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));camera.position.set(360,225,480);camera.lookAt(0,130,15);
  const gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),frame=()=>new Promise(requestAnimationFrame),rows=[];r.info.autoReset=false;
  const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null;
  if(!ext)return {renderer,unavailable:true};
  // Test the actual policy separately at each fixed transmission scale. It may
  // decide against depth after the expensive transmission pass becomes cheaper.
  for(const round of [0,1])for(const scale of round?[.5,1]:[1,.5]){
   r.transmissionResolutionScale=scale;const draw=adaptiveDraw(r,scene,camera),calibration=[];
   for(let i=0;i<160;i++){await frame();v.root.rotation.y=i*.006;r.info.reset();draw(true,'transmission');calibration.push(r.info.render.calls);}
   for(const mode of (round?['depth','plain','adaptive']:['adaptive','plain','depth'])){
   const material=new T.MeshBasicMaterial({colorWrite:false}),samples=[];
   for(let i=0;i<55;i++){
    await frame();v.root.rotation.y=i*.012;r.info.reset();const query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);const start=performance.now();if(mode==='plain')r.render(scene,camera);else if(mode==='depth')depthDraw(r,scene,camera,material);else draw(true,'transmission');const cpuMs=performance.now()-start;gl.endQuery(ext.TIME_ELAPSED_EXT);
    let tries=0;while(!gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)&&tries++<120)await frame();
    const gpuMs=gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT)?gl.getQueryParameter(query,gl.QUERY_RESULT)/1e6:null;gl.deleteQuery(query);
    if(i>=15)samples.push({cpuMs,gpuMs,calls:r.info.render.calls});
   }material.dispose();rows.push({round,scale,mode,calibration:calibration.slice(-10),samples});
   }
  }r.transmissionResolutionScale=.5;return {renderer,rows};
 });
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>result.errors.push(String(e)));await mobile.route('**/shared/duck-view.mjs',instrument);await mobile.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897');await mobile.waitForFunction(()=>window.studioProto);
 result.mobile=await mobile.evaluate(async()=>{
  const v=studioProto.view,{renderer:r,scene,camera}=v.__test,data=await(await import('/shared/duck-view.mjs')).loadDuck();
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));await new Promise(r=>setTimeout(r,800));window.stopRender=true;
  const targets=[],set=r.setRenderTarget;r.setRenderTarget=function(target,...args){if(target?.texture.generateMipmaps&&target.samples===4)targets.push([target.width,target.height]);return set.call(this,target,...args);};
  try{r.render(scene,camera);}finally{r.setRenderTarget=set;}
  const pixels=new Uint8Array(r.domElement.width*r.domElement.height*4);r.getContext().readPixels(0,0,r.domElement.width,r.domElement.height,r.getContext().RGBA,r.getContext().UNSIGNED_BYTE,pixels);
  return {canvas:[r.domElement.width,r.domElement.height],targets,visible:pixels.some((v,i)=>i%4===3&&v>127)};
 });assert.equal(result.mobile.visible,true);assert.deepEqual(result.mobile.targets,[result.mobile.canvas.map(n=>n/2)]);
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify({contract:result.contract,images:result.images,timingAvailable:!result.timing.unavailable,errors:result.errors}));
}catch(e){result.failure=String(e.stack||e);throw e;}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(result,null,2));}
