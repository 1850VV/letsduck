import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:false}),result={errors:[]};
try{
 const p=await browser.newPage();p.on('pageerror',e=>result.errors.push(String(e)));
 await p.route('**/shared/duck-view.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return { invalidate, mount,','return { __test:{renderer}, invalidate, mount,')});});
 await p.route('**/studio/studio.mjs',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('window.studioProto = { view,','window.studioProto = { duck, view,')});});
 await p.goto(process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897');await p.waitForFunction(()=>window.studioProto);
 result.state=await p.evaluate(async()=>{
  const api=await import('/shared/duck-view.mjs'),data=studioProto.duck,v=studioProto.view,r=v.__test.renderer,c=studioProto.state.colors;
  v.setTurntable(false);v.setPose({headYaw:20,jaw:10});v.setSideCopy(['P1-01']);v.setSplit(c);await new Promise(resolve=>setTimeout(resolve,600));
  const before=v.snapshot(512,512).toDataURL();
  const [a,b]=await Promise.all([api.renderExportThumbnails(data,c,{view:v,binaryUpload:true}),api.renderExportThumbnails(data,{...c,'P1-01':'#ff0000'},{view:v,binaryUpload:true})]);
  const after=v.snapshot(512,512).toDataURL();
  const old=r.readRenderTargetPixelsAsync;r.readRenderTargetPixelsAsync=()=>Promise.reject(Error('Injected read failure'));
  let fallback;try{fallback=await api.renderExportThumbnails(data,c,{view:v,binaryUpload:true});}finally{r.readRenderTargetPixelsAsync=old;}
  const restored=v.snapshot(512,512).toDataURL();
  const recovered=await api.renderExportThumbnails(data,c,{view:v,binaryUpload:true});
  const bytesA=new Uint8Array(await a.cover.arrayBuffer()),bytesB=new Uint8Array(await b.cover.arrayBuffer());
  return {counts:[a,b,fallback,recovered].map(x=>Object.keys(x).length),same:before===after&&before===restored,colorsChanged:bytesA.length!==bytesB.length||bytesA.some((x,i)=>x!==bytesB[i])};
 });
 assert.deepEqual(result.state,{counts:[13,13,13,13],same:true,colorsChanged:true});
 await p.reload();await p.waitForFunction(()=>window.studioProto);
 await p.route('**/shared/positions-worker.mjs',r=>r.fulfill({status:404,body:''}));
 result.workerFallback=await p.evaluate(async()=>{
  const api=await import('/shared/duck-view.mjs'),data=studioProto.duck;
  const images=await api.renderExportThumbnails(data,studioProto.state.colors,{view:studioProto.view,binaryUpload:true});
  return Object.keys(images).length;
 });assert.equal(result.workerFallback,13);assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
}catch(e){result.failure=String(e.stack||e);throw e;}finally{await browser.close();await fs.writeFile('output/integration/export-fallback-browser.json',JSON.stringify(result,null,2));}
