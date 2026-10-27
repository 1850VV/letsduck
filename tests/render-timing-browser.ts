import * as browserChecks from './browser/checks.js';
// Desktop timing runs alone, with managed Chromium and the real model.
import fs from 'node:fs/promises';
const browser=await browserChecks.launchBrowser({headless:false});let result;
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 await browserChecks.preparePage(p);await p.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await p.waitForFunction(()=>window.studioProto);await browserChecks.mountSourceUnit(p);
 result=await p.evaluate(async()=>{
  const v=window.__unitView,{renderer:r,scene,camera,draw}=window.__sourceUnitInternals,T=window.__duckModules.THREE,{depthDraw}=window.__duckModules,data=await(window.__duckModules).loadDuck();
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));v.setHighlight();v.setTurntable(false);await new Promise(r=>setTimeout(r,1200));
  r.setPixelRatio(1);r.setSize(2500,1750,false);camera.aspect=2500/1750;camera.position.set(360,225,480);camera.lookAt(0,130,15);camera.updateProjectionMatrix();r.info.autoReset=false;
  const gl=r.getContext();if(!(gl instanceof WebGL2RenderingContext))return {unavailable:true};const ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),frame=()=>new Promise(requestAnimationFrame),material=new T.MeshBasicMaterial({colorWrite:false});
  if(!ext)return {unavailable:true};
  const calibration=[];
  for(let i=0;i<160;i++){await frame();v.root.rotation.y=i*.006;r.info.reset();draw(true,'benchmark');calibration.push(r.info.render.calls);}
  const rows=[];
  for(const round of [0,1])for(const mode of (round?['adaptive','depth','plain']:['plain','depth','adaptive'])){
   const samples=[];
   for(let i=0;i<45;i++){
    await frame();v.root.rotation.y=i*.012;r.info.reset();const query=window.__browserChecks.required(gl.createQuery());gl.beginQuery(ext.TIME_ELAPSED_EXT,query);const t=performance.now();
    if(mode==='plain')r.render(scene,camera);else if(mode==='depth')depthDraw(r,scene,camera,material);else draw(true,'benchmark');
    const cpuMs=performance.now()-t;gl.endQuery(ext.TIME_ELAPSED_EXT);
    let tries=0;while(!gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)&&tries++<120)await frame();
    const gpuMs=gl.getQueryParameter(query,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT)?gl.getQueryParameter(query,gl.QUERY_RESULT)/1e6:null;gl.deleteQuery(query);
    if(i>=15)samples.push({cpuMs,gpuMs,calls:r.info.render.calls});
   }rows.push({round,mode,samples});
  }
  material.dispose();const debug=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):null,width:2500,height:1750,calibrationTail:calibration.slice(-10),rows};
 });
 console.log(JSON.stringify(result));
}finally{await browser.close();if(result)await fs.writeFile('output/integration/render-timing.json',JSON.stringify(result,null,2));}
