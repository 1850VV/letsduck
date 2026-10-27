import {installRenderProbe,captureRenderer} from './browser/render-probe.js';
import * as browserChecks from './browser/checks.js';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await browserChecks.launchBrowser({headless:false}),result:{errors:string[];state?:{counts:number[];same:boolean;colorsChanged:boolean};workerFallback?:number;failure?:string}={errors:[]};
try{
 const p=await browser.newPage();p.on('pageerror',e=>result.errors.push(String(e)));
 await installRenderProbe(p);await browserChecks.preparePage(p);await p.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);await captureRenderer(p);
 result.state=await p.evaluate(async()=>{
  const api=window.__duckModules,data=await api.loadDuck(),v=window.studioProto.view,r=window.__browserChecks.required(window.__renderProbe.captured).renderer,c=window.studioProto.state.colors;
  v.setTurntable(false);v.setPose({headYaw:20,jaw:10});v.setSideCopy(['P1-01']);v.setSplit(c);await new Promise(resolve=>setTimeout(resolve,600));
  const before=v.snapshot(512,512).toDataURL();
  const [a,b]=await Promise.all([api.renderExportThumbnails(data,c,{view:v,binaryUpload:true}),api.renderExportThumbnails(data,{...c,'P1-01':'#ff0000'},{view:v,binaryUpload:true})]);
  const after=v.snapshot(512,512).toDataURL();
  const old=r.readRenderTargetPixelsAsync;r.readRenderTargetPixelsAsync=()=>Promise.reject(Error('Injected read failure'));
  let fallback;try{fallback=await api.renderExportThumbnails(data,c,{view:v,binaryUpload:true});}finally{r.readRenderTargetPixelsAsync=old;}
  const restored=v.snapshot(512,512).toDataURL();
  const recovered=await api.renderExportThumbnails(data,c,{view:v,binaryUpload:true});
  const bytesA=new Uint8Array(await window.__browserChecks.required(a.cover).arrayBuffer()),bytesB=new Uint8Array(await window.__browserChecks.required(b.cover).arrayBuffer());
  return {counts:[a,b,fallback,recovered].map(x=>Object.keys(x).length),same:before===after&&before===restored,colorsChanged:bytesA.length!==bytesB.length||bytesA.some((x,i)=>x!==bytesB[i])};
 });
 assert.deepEqual(result.state,{counts:[13,13,13,13],same:true,colorsChanged:true});
 await p.reload();await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);
 await p.route('**/static/positions-worker-*.js',r=>r.fulfill({status:404,body:''}));
 result.workerFallback=await p.evaluate(async()=>{
  const api=window.__duckModules,data=await api.loadDuck();
  const images=await api.renderExportThumbnails(data,window.studioProto.state.colors,{view:window.studioProto.view,binaryUpload:true});
  return Object.keys(images).length;
 });assert.equal(result.workerFallback,13);assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
}catch(e){result.failure=browserChecks.failure(e);throw e;}finally{await browser.close();await fs.writeFile('output/integration/export-fallback-browser.json',JSON.stringify(result,null,2));}
