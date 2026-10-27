import * as browserChecks from './browser/checks.js';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {PNG} from 'pngjs';
const b=await browserChecks.launchBrowser({headless:false}),result:{errors:string[];baselineMode?:string;images:{state:string;changedChannels:number;totalChannels:number;max:number;mae:number;channelsOver8:number}[];model?:{meshes:number|undefined;binary:ArrayBuffer|null;printMatrices:number};fallback?:{geometry:unknown;bytes:number};workerFallback?:boolean;failure?:string}={errors:[],images:[]};
try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),requests:string[]=[];p.on('pageerror',e=>result.errors.push(String(e)));p.on('request',r=>{if(r.url().includes('/assets/'))requests.push(r.url());});
 const url=browserChecks.browserUrl();await browserChecks.preparePage(p);await p.goto(browserChecks.paintUrl(url));await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);
 result.model=await p.evaluate(async()=>{const d=await(window.__duckModules).loadDuck();return {meshes:d.geometry?.size,binary:d.binary,printMatrices:[...window.__browserChecks.required(d.geometry).values()].filter(m=>m.printMatrix).length};});
 assert.deepEqual(result.model,{meshes:66,binary:null,printMatrices:35});assert.ok(!requests.some(u=>/geometry(\.pack)?\.bin$/.test(u)));
 await p.route('**/assets/geometry.positions.bin',r=>r.fulfill({status:404,body:''}));
 result.fallback=await p.evaluate(async()=>{const d=await(window.__duckModules).loadDuck();return {geometry:d.geometry,bytes:window.__browserChecks.required(d.binary).byteLength};});assert.equal(result.fallback.geometry,null);assert.ok(result.fallback.bytes);
 await p.unroute('**/assets/geometry.positions.bin');await p.route('**/static/positions-worker-*.js',r=>r.fulfill({status:404,body:''}));
 result.workerFallback=await p.evaluate(async()=>{const d=await(window.__duckModules).loadDuck();return !!d.binary&&!d.geometry;});assert.equal(result.workerFallback,true);await p.unroute('**/static/positions-worker-*.js');
 const capture=async()=>p.evaluate(async()=>{const data=await(window.__duckModules).loadDuck(),v=window.studioProto.view,images:Record<string,string>={};
  const colors=Object.fromEntries(data.model.parts.map(p=>[p.id,p.color]));v.setColors(colors,true);v.setTurntable(false);v.setHighlight();v.setPose({});
  for(const [state,finish] of [['basic','basic'],['translucent','translucent'],['silk','silk']] as const){v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':finish])));images[state]=v.snapshot(800,800,{angle:'hero'}).toDataURL();}return images;});
 const after=await capture();await p.route('**/assets/geometry.positions.bin',r=>r.fulfill({status:404,body:''}));result.baselineMode='actual legacy geometry fallback; same production bundle when baseline URL matches';await browserChecks.preparePage(p);await p.goto(browserChecks.paintUrl(browserChecks.browserUrl('DUCK_BASELINE_URL')));await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);const before=await capture();
 for(const state of Object.keys(before)){
  const a=PNG.sync.read(browserChecks.pngBytes(browserChecks.required(before[state]))),c=PNG.sync.read(browserChecks.pngBytes(browserChecks.required(after[state])));let changed=0,max=0,total=0,over8=0;
  for(let i=0;i<a.data.length;i++){const d=Math.abs(browserChecks.required(a.data[i])-browserChecks.required(c.data[i]));if(d)changed++;max=Math.max(max,d);total+=d;if(d>8)over8++;}
  result.images.push({state,changedChannels:changed,totalChannels:a.data.length,max,mae:total/a.data.length,channelsOver8:over8});
  for(const [name,images] of [['before',before],['after',after]] as const)await fs.writeFile(`output/integration/model-${state}-${name}.png`,browserChecks.pngBytes(browserChecks.required(images[state])));
 }
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
} catch(error){result.failure=browserChecks.failure(error);throw error;}finally{await b.close();await fs.writeFile('output/integration/model-browser.json',JSON.stringify(result,null,2));}
