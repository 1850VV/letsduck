import * as browserChecks from './browser/checks.js';
// Real-model contract + matched GPU timing. Run alone with managed Chromium.

import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
const out='output/transmission-half';await fs.mkdir(out,{recursive:true});
const browser=await browserChecks.launchBrowser({headless:false}),result:{errors:string[];images:{state:string;foregroundMAE:number;pixelsOver8:number;max:number;changedChannels:number}[];contract?:{canvas:number[];targets:number[][]};mobile?:{canvas:number[];targets:number[][];visible:boolean};timing?:{unavailable?:boolean;renderer?:unknown;rows?:unknown[]};failure?:string}={errors:[],images:[]};
function difference(a:Uint8Array,b:Uint8Array){
 let sum=0,foreground=0,over8=0,max=0,changed=0;
 for(let i=0;i<a.length;i+=4){if(browserChecks.required(a[i+3])>127||browserChecks.required(b[i+3])>127){foreground++;let over=false;for(let c=0;c<3;c++){const d=Math.abs(browserChecks.required(a[i+c])-browserChecks.required(b[i+c]));sum+=d;max=Math.max(max,d);if(d>8)over=true;}if(over)over8++;}for(let c=0;c<4;c++)if(a[i+c]!==b[i+c])changed++;}
 return {foregroundMAE:sum/(foreground*3),pixelsOver8:over8/foreground,max,changedChannels:changed};
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>result.errors.push(String(e)));
 await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.mountSourceUnit(page);
 result.contract=await page.evaluate(async()=>{
  const v=window.__unitView,{renderer:r,scene,camera}=window.__sourceUnitInternals,data=window.__unitData;
  v.setColors(Object.fromEntries(data.model.parts.map(p=>[p.id,p.color])),true);v.setHighlight();v.setTurntable(false);
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));
  await new Promise(r=>setTimeout(r,1000));
  r.setPixelRatio(1);r.setSize(2500,1750,false);camera.aspect=2500/1750;camera.position.set(360,225,480);camera.lookAt(0,130,15);camera.updateProjectionMatrix();
  const targets:number[][]=[],set=r.setRenderTarget;r.setRenderTarget=function(target,...args){if(target&&!Array.isArray(target.texture)&&target.texture.generateMipmaps&&target.samples===4)targets.push([target.width,target.height]);return set.call(this,target,...args);};
  try{r.render(scene,camera);}finally{r.setRenderTarget=set;}
  return {canvas:[r.domElement.width,r.domElement.height],targets};
 });
 assert.deepEqual(result.contract,{canvas:[2500,1750],targets:[[1250,875]]},'Only transmission target should halve; main canvas stays full size');
 for(const state of ['hero','rear','posed','mixed','closeup','basic']){
  const pair=await page.evaluate(async state=>{
   const v=window.__unitView,{renderer:r,scene,camera}=window.__sourceUnitInternals,T=window.__duckModules.THREE,{depthDraw}=window.__duckModules;
   v.setPose(state==='posed'?{headYaw:25,neck:-15,jaw:18,hip:12,knee:-24}:{});v.root.rotation.y=state==='rear'?Math.PI:0;
   v.setFinishes(Object.fromEntries(window.__unitData.model.parts.map((p,i)=>[p.id,p.material.startsWith('TPU')?'tpu':state==='basic'?'basic':state==='mixed'?window.__browserChecks.required(['basic','silk','translucent'][i%3]):'translucent'])));
   camera.position.set(360,225,480);camera.lookAt(0,130,15);
   if(state==='closeup'){const target=new T.Vector3(0,220,45);camera.position.copy(target).addScaledVector(new T.Vector3(360,95,465).normalize(),120);camera.lookAt(target);}
   const material=new T.MeshBasicMaterial({colorWrite:false});
   const after=()=>{r.render(scene,camera);return r.domElement.toDataURL();};
   try{const candidate=after();depthDraw(r,scene,camera,material);const depth=r.domElement.toDataURL();r.transmissionResolutionScale=1;const baseline=after();return {baseline,candidate,depth};}
   finally{material.dispose();r.transmissionResolutionScale=.5;}
  },state);
  const png:Partial<Record<'baseline'|'candidate'|'depth',PNG>>={};for(const name of ['baseline','candidate','depth'] as const){const bytes=browserChecks.pngBytes(pair[name]);png[name]=PNG.sync.read(bytes);if(name!=='depth')await fs.writeFile(`${out}/${state}-${name}.png`,bytes);}
  assert.deepEqual(browserChecks.required(png.candidate).data,browserChecks.required(png.depth).data,`${state}: adaptive depth path must retain candidate pixels`);
  const diff=difference(browserChecks.required(png.baseline).data,browserChecks.required(png.candidate).data);result.images.push({state,...diff});
  if(state==='basic')assert.equal(diff.changedChannels,0,'Non-transmissive material is unaffected');
  else assert.ok(diff.foregroundMAE<1.05&&diff.pixelsOver8<.04,`${state}: exceeds reviewed visual error envelope`);
 }
 result.timing=await page.evaluate(async()=>{
  const v=window.__unitView,{renderer:r,scene,camera}=window.__sourceUnitInternals,{adaptiveDraw,depthDraw}=window.__duckModules,T=window.__duckModules.THREE;
  v.setPose({});v.setFinishes(Object.fromEntries(window.__unitData.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));camera.position.set(360,225,480);camera.lookAt(0,130,15);
  const gl=r.getContext();if(!(gl instanceof WebGL2RenderingContext))return {unavailable:true};const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),frame=()=>new Promise(requestAnimationFrame),rows=[];r.info.autoReset=false;
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
    await frame();v.root.rotation.y=i*.012;r.info.reset();const query=window.__browserChecks.required(gl.createQuery());gl.beginQuery(ext.TIME_ELAPSED_EXT,query);const start=performance.now();if(mode==='plain')r.render(scene,camera);else if(mode==='depth')depthDraw(r,scene,camera,material);else draw(true,'transmission');const cpuMs=performance.now()-start;gl.endQuery(ext.TIME_ELAPSED_EXT);
    let tries=0;while(!gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)&&tries++<120)await frame();
    const gpuMs=gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT)?gl.getQueryParameter(query,gl.QUERY_RESULT)/1e6:null;gl.deleteQuery(query);
    if(i>=15)samples.push({cpuMs,gpuMs,calls:r.info.render.calls});
   }material.dispose();rows.push({round,scale,mode,calibration:calibration.slice(-10),samples});
   }
  }r.transmissionResolutionScale=.5;return {renderer,rows};
 });
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 mobile.on('pageerror',e=>result.errors.push(String(e)));await browserChecks.preparePage(mobile);await mobile.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await mobile.waitForFunction(()=>window.studioProto);await browserChecks.mountSourceUnit(mobile);
 result.mobile=await mobile.evaluate(async()=>{
  const v=window.__unitView,{renderer:r,scene,camera}=window.__sourceUnitInternals,data=await(window.__duckModules).loadDuck();
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));await new Promise(r=>setTimeout(r,800));
  const targets:number[][]=[],set=r.setRenderTarget;r.setRenderTarget=function(target,...args){if(target&&!Array.isArray(target.texture)&&target.texture.generateMipmaps&&target.samples===4)targets.push([target.width,target.height]);return set.call(this,target,...args);};
  try{r.render(scene,camera);}finally{r.setRenderTarget=set;}
  const pixels=new Uint8Array(r.domElement.width*r.domElement.height*4);r.getContext().readPixels(0,0,r.domElement.width,r.domElement.height,r.getContext().RGBA,r.getContext().UNSIGNED_BYTE,pixels);
  return {canvas:[r.domElement.width,r.domElement.height],targets,visible:pixels.some((v,i)=>i%4===3&&v>127)};
 });assert.equal(result.mobile.visible,true);assert.deepEqual(result.mobile.targets,[result.mobile.canvas.map(n=>n/2)]);
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify({contract:result.contract,images:result.images,timingAvailable:!result.timing.unavailable,errors:result.errors}));
}catch(e){result.failure=browserChecks.failure(e);throw e;}finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(result,null,2));}
