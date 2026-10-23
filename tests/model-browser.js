import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {PNG} from 'pngjs';
const b=await chromium.launch({headless:false}),result={errors:[],images:[]};
try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),requests=[];p.on('pageerror',e=>result.errors.push(String(e)));p.on('request',r=>{if(r.url().includes('/assets/'))requests.push(r.url());});
 const url=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897';await p.goto(url);await p.waitForFunction(()=>window.studioProto);
 result.model=await p.evaluate(async()=>{const d=await(await import('/shared/duck-view.mjs')).loadDuck();return {meshes:d.geometry?.size,binary:d.binary,printMatrices:[...d.geometry.values()].filter(m=>m.printMatrix).length};});
 assert.deepEqual(result.model,{meshes:66,binary:null,printMatrices:35});assert.ok(!requests.some(u=>/geometry(\.pack)?\.bin$/.test(u)));
 await p.route('**/assets/geometry.positions.bin',r=>r.fulfill({status:404,body:''}));
 result.fallback=await p.evaluate(async()=>{const d=await(await import('/shared/duck-view.mjs')).loadDuck();return {geometry:d.geometry,bytes:d.binary.byteLength};});assert.equal(result.fallback.geometry,null);assert.ok(result.fallback.bytes);
 await p.unroute('**/assets/geometry.positions.bin');await p.route('**/shared/positions-worker.mjs',r=>r.fulfill({status:404,body:''}));
 result.workerFallback=await p.evaluate(async()=>{const d=await(await import('/shared/duck-view.mjs')).loadDuck();return !!d.binary&&!d.geometry;});assert.equal(result.workerFallback,true);await p.unroute('**/shared/positions-worker.mjs');
 const capture=async()=>p.evaluate(async()=>{const data=await(await import('/shared/duck-view.mjs')).loadDuck(),v=studioProto.view,images={};
  const colors=Object.fromEntries(data.model.parts.map(p=>[p.id,p.color]));v.setColors(colors,true);v.setTurntable(false);v.setHighlight();v.setPose({});
  for(const [state,finish] of [['basic','basic'],['translucent','translucent'],['silk','silk']]){v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,p.material.startsWith('TPU')?'tpu':finish])));images[state]=v.snapshot(800,800,{angle:'hero'}).toDataURL();}return images;});
 const after=await capture();await p.goto(process.env.DUCK_BASELINE_URL||'http://127.0.0.1:8896');await p.waitForFunction(()=>window.studioProto);const before=await capture();
 for(const state of Object.keys(before)){
  const a=PNG.sync.read(Buffer.from(before[state].split(',')[1],'base64')),c=PNG.sync.read(Buffer.from(after[state].split(',')[1],'base64'));let changed=0,max=0,total=0,over8=0;
  for(let i=0;i<a.data.length;i++){const d=Math.abs(a.data[i]-c.data[i]);if(d)changed++;max=Math.max(max,d);total+=d;if(d>8)over8++;}
  result.images.push({state,changedChannels:changed,totalChannels:a.data.length,max,mae:total/a.data.length,channelsOver8:over8});
  for(const [name,images] of [['before',before],['after',after]])await fs.writeFile(`output/integration/model-${state}-${name}.png`,Buffer.from(images[state].split(',')[1],'base64'));
 }
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
} catch(error){result.failure=String(error.stack||error);throw error;}finally{await b.close();await fs.writeFile('output/integration/model-browser.json',JSON.stringify(result,null,2));}
