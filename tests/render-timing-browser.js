// Desktop timing runs alone, with managed Chromium and the real model.
import {chromium} from 'playwright';import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:false});let result;
try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}});
 await p.route('**/shared/duck-view.mjs',async route=>{
  const source=await fs.readFile(new URL('../frontend/shared/duck-view.mjs',import.meta.url),'utf8');
  await route.fulfill({contentType:'text/javascript',body:source.replace('function animate() {','function animate() {if(window.stopRender)return false;').replace('return { invalidate, mount,','return { __test:{renderer,scene,camera,draw}, invalidate, mount,')});
 });
 await p.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897');await p.waitForFunction(()=>window.studioProto);
 result=await p.evaluate(async()=>{
  const v=studioProto.view,{renderer:r,scene,camera,draw}=v.__test,T=await import('three'),{depthDraw}=await import('/shared/depth-render.mjs'),data=await(await import('/shared/duck-view.mjs')).loadDuck();
  v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':'translucent'])));v.setHighlight();v.setTurntable(false);await new Promise(r=>setTimeout(r,1200));window.stopRender=true;
  r.setPixelRatio(1);r.setSize(2500,1750,false);camera.aspect=2500/1750;camera.position.set(360,225,480);camera.lookAt(0,130,15);camera.updateProjectionMatrix();r.info.autoReset=false;
  const gl=r.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),frame=()=>new Promise(requestAnimationFrame),material=new T.MeshBasicMaterial({colorWrite:false});
  if(!ext)return {unavailable:true};
  const calibration=[];
  for(let i=0;i<160;i++){await frame();v.root.rotation.y=i*.006;r.info.reset();draw(true,'benchmark');calibration.push(r.info.render.calls);}
  const rows=[];
  for(const round of [0,1])for(const mode of (round?['adaptive','depth','plain']:['plain','depth','adaptive'])){
   const samples=[];
   for(let i=0;i<45;i++){
    await frame();v.root.rotation.y=i*.012;r.info.reset();const query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);const t=performance.now();
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
