import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:false});
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8904';
const result={};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 try{
 const page=await context.newPage(),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(base+'/');await page.waitForFunction(()=>document.querySelectorAll('iframe').length===3&&[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement.dataset.pageReady),null,{timeout:60000});
 assert.equal(requests.filter(u=>u.endsWith('.mp3')).length,0,'hidden preparation must not fetch music');
 const paint=page.frame({name:'personal-paint'}),guide=page.frame({name:'personal-assemble'});
 result.compressed=await paint.evaluate(async()=>{const d=await(await import('/shared/model-loader.mjs')).loadModel();return{meshes:d.geometry?.size,binary:d.binary,print:(await d.loadPrintGeometry()).size};});
 assert.deepEqual(result.compressed,{meshes:66,binary:null,print:35});
 assert.ok(!requests.some(u=>/geometry(?:\.pack)?\.bin$/.test(u)),'compressed happy path never loads legacy data');
 result.locales=await paint.evaluate(async()=>{const i=await import('/shared/i18n.mjs');return i.LOCALES.map(({code})=>{i.setLocale(code);return{code,lang:document.documentElement.lang,text:i.t('text.0322'),fallback:i.translate('missing','text.0322')===i.translate('en','text.0322')};});});
 assert.equal(result.locales.length,12);assert.ok(result.locales.every(x=>x.code===x.lang&&x.text!=='text.0322'&&x.fallback));
 await page.frame({name:'personal-home'}).locator('#build-go').click();
 await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble');
 await guide.locator('#stage').click({position:{x:30,y:30}});
 await guide.waitForFunction(()=>{const a=document.querySelector('#piano-audio');return !a.paused&&a.currentTime>.1;},null,{timeout:15000});
 const start=await guide.evaluate(()=>document.querySelector('#piano-audio').currentTime);await page.waitForTimeout(1500);
 result.music=await guide.evaluate(()=>{const a=document.querySelector('#piano-audio');return{time:a.currentTime,ready:a.readyState,paused:a.paused,error:a.error?.code};});assert.ok(result.music.time>start+1);assert.equal(result.music.error,undefined);
 for(const state of ['missing','corrupt']){
  await page.route('**/assets/geometry.positions.bin',r=>r.fulfill({status:state==='missing'?404:200,body:state==='missing'?'':'corrupt'}));
  const data=await paint.evaluate(async()=>{const d=await(await import('/shared/model-loader.mjs')).loadModel();return{geometry:d.geometry,bytes:d.binary.byteLength};});assert.deepEqual(data,{geometry:null,bytes:5841060});result[state]=data;
  await page.unroute('**/assets/geometry.positions.bin');
 }
 await page.route('**/assets/geometry.positions.bin',r=>r.fulfill({status:404,body:''}));await page.route('**/assets/geometry.pack.bin',r=>r.fulfill({status:200,body:'broken'}));
 result.rawFallback=await paint.evaluate(async()=>{const d=await(await import('/shared/model-loader.mjs')).loadModel();return d.binary.byteLength;});assert.equal(result.rawFallback,5841060);
 assert.deepEqual(errors,[]);result.errors=errors;
 await page.screenshot({path:'output/optimization-assets/functional-guide.png'});
 console.log(JSON.stringify(result,null,2));
 }finally{await context.close();}
}finally{await browser.close();}
