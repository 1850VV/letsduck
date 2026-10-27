import * as browserChecks from './browser/checks.js';
import fs from 'node:fs/promises';import {PNG} from 'pngjs';import assert from 'node:assert/strict';
const browser=await browserChecks.launchBrowser({headless:false}),results:{errors:string[];images:{i:number;name:string;exact:boolean;changed:number;max:number}[];times?:{jsonMs:number;binaryMs:number;jsonBytes:number;multipartBytes:number;pngBytes:number}[];firstMs?:number;ui?:{status:number;multipart:boolean;bytes:number|null};failure?:string}={errors:[],images:[]};
try{
 const p=await browser.newPage();p.on('pageerror',e=>results.errors.push(String(e)));await browserChecks.preparePage(p);await p.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);
 const legacyRequests:string[]=[];p.on('request',r=>{if(/\/geometry(?:\.pack)?\.bin(?:\?|$)/.test(r.url()))legacyRequests.push(r.url());});
 const run=await p.evaluate(async()=>{
  const api=window.__duckModules,data=await api.loadDuck(),view=window.studioProto.view,times=[],images=[];
  view.setTurntable(false);view.setPose({headYaw:18,jaw:12});view.setHighlight();
  const before=view.snapshot(512,512).toDataURL(),state=JSON.stringify(view.debug());
  const start=performance.now();const first=await api.renderExportThumbnails(data,Object.fromEntries(data.model.parts.map(p=>[p.id,p.color])),{binaryUpload:true,view});
  if(performance.getEntriesByType('resource').some(e=>/\/geometry(?:\.pack)?\.bin(?:\?|$)/.test(e.name)))throw Error('First shared export fetched legacy geometry');
  const firstMs=performance.now()-start;
  if(Object.keys(first).length!==13)throw Error('Missing shared thumbnails');
  if(view.snapshot(512,512).toDataURL()!==before||JSON.stringify(view.debug())!==state)throw Error('Export changed main view');
  const assignments=Object.fromEntries(data.model.parts.map(p=>[p.id,window.__browserChecks.required(data.catalog.products.find(x=>x.series===p.material&&x.hex===p.color)).id])),colors=Object.fromEntries(data.model.parts.map(p=>[p.id,p.color]));
  let payload;
  for(let i=0;i<2;i++){
   let t=performance.now();const legacy=await api.renderExportThumbnails(data,colors),jsonMs=performance.now()-t;
   t=performance.now();const binary=await api.renderExportThumbnails(data,colors,{binaryUpload:true,view}),binaryMs=performance.now()-t;
   const encoded:Record<string,string>={};for(const [name,blob] of Object.entries(binary))encoded[name]=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject(Error('PNG encoding failed'));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
   images.push({legacy,binary:encoded});payload={source_sha256:data.model.source_sha256,assignments,thumbnails:legacy};
   const form=new FormData();form.append('plan',JSON.stringify({source_sha256:data.model.source_sha256,assignments}));for(const [name,blob] of Object.entries(binary))form.append(name,blob,name+'.png');
   times.push({jsonMs,binaryMs,jsonBytes:new Blob([JSON.stringify(payload)]).size,multipartBytes:(await new Response(form).blob()).size,pngBytes:Object.values(binary).reduce((n,b)=>n+b.size,0)});
  }
  return {firstMs,times,images,payload};
 });
 results.times=run.times;results.firstMs=run.firstMs;
 for(const [i,pair] of run.images.entries())for(const name in pair.legacy){const a=PNG.sync.read(browserChecks.pngBytes(browserChecks.required(pair.legacy[name]))),b=PNG.sync.read(browserChecks.pngBytes(browserChecks.required(pair.binary[name])));let changed=0,max=0;for(let k=0;k<a.data.length;k++){const delta=Math.abs(browserChecks.required(a.data[k])-browserChecks.required(b.data[k]));if(delta)changed++;max=Math.max(max,delta);}
  assert.ok(changed<=3&&max<=8,`${i} ${name}: ${changed} changed channels, max ${max}`);results.images.push({i,name,exact:changed===0,changed,max});}
 await fs.writeFile('output/integration/export-payload.json',JSON.stringify(run.payload));
 if(await p.locator('#coach').isVisible())await p.locator('#coach-go').click();
 await p.locator('[data-start="original"]').click();await p.locator('button[data-step="3"]').first().click();await p.locator('[data-ptab="print"]').click();await p.locator('#export2').click();await p.locator('#dl-3mf').waitFor();
 const request=p.waitForRequest(r=>r.url().endsWith('/api/export'));
 const response=p.waitForResponse(r=>r.url().endsWith('/api/export'));
 const download=p.waitForEvent('download');legacyRequests.length=0;await p.locator('#dl-3mf').click();
 const sent=await request,received=await response,file=await download;
 assert.ok(browserChecks.required(sent.headers()['content-type']).startsWith('multipart/form-data; boundary='));assert.equal(received.status(),200);assert.deepEqual(legacyRequests,[],'UI export must use shared geometry');
 await file.saveAs('output/integration/ui-export.3mf');results.ui={status:received.status(),multipart:true,bytes:Number(sent.headers()['content-length'])||null};
 assert.deepEqual(results.errors,[]);console.log(JSON.stringify({times:results.times,firstMs:results.firstMs,exactImages:results.images.filter(x=>x.exact).length,errors:results.errors}));
} catch(e){results.failure=browserChecks.failure(e);throw e;}finally{await browser.close();await fs.writeFile('output/integration/export-browser.json',JSON.stringify(results,null,2));}
