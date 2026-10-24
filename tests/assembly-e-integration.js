// Real A/B + E regression. Managed Chromium and synthetic data only; never opens the default personal DB.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const {chromium}=await import(process.env.DUCK_PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'output/playwright/e-data-ab');
const base='http://127.0.0.1:8907';
const result={baseline:'1e88b87e2c0874889a1d5a142873485681b3b7ad',session:'opt-e-data-1024',checks:[],pageErrors:[]};
let server,browser,context,page,video,lockOwned=false;
const lockPath=process.env.DUCK_BENCHMARK_LOCK;
const lockOwner=JSON.stringify({task:"optimization-e-data-ab",pid:process.pid,purpose:"functional integration; no timing comparison"});
const log=(label)=>{result.checks.push(label);console.log('PASS '+label);};
async function stopServer(){
 if(!server)return;
 const child=server;server=null;
 if(child.exitCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');await done;}
}
async function startServer(name){
 await stopServer();
 const db=path.join(out,name+'.db');await fs.rm(db,{force:true});await fs.rm(db+'-wal',{force:true});await fs.rm(db+'-shm',{force:true});
 const code="import os,sys,signal;sys.path.insert(0,'personal');import app;signal.signal(signal.SIGTERM,lambda *_:sys.exit(0));s=app.create_server(port=8907,db=os.environ['DUCK_PERSONAL_DB'],search=1);print('E_READY',flush=True)\ntry:s.serve_forever()\nfinally:s.server_close();s.store.close()";
 server=spawn(process.env.DUCK_PYTHON||'python3',['-u','-c',code],{cwd:root,env:{...process.env,DUCK_PERSONAL_DB:db},stdio:['ignore','pipe','pipe']});
 const child=server;let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('isolated service startup timeout: '+output)),15000);child.stdout.on('data',data=>{if(String(data).includes('E_READY')){clearTimeout(timeout);resolve();}});child.once('exit',code=>{clearTimeout(timeout);reject(Error('isolated service exited '+code+': '+output));});});
 result.databases??=[];result.databases.push(db);
}
async function home(){
 await page.goto(base+'/');await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
 const frame=page.frame({name:'personal-home'});await frame.locator('#backup-file').waitFor({state:'attached'});return frame;
}
async function guide(){
 await page.goto(base+'/assemble/');await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:90000});
 const frame=page.frame({name:'personal-assemble'});await frame.waitForFunction(()=>window.anklePrototype?.state.ready,null,{timeout:90000});return frame;
}
async function rows(){const response=await page.request.get(base+'/api/schemes');assert.ok(response.ok());return response.json();}
async function setDraft(controller,draft){await controller.evaluate(draft=>localStorage.setItem('dd-studio-personal',JSON.stringify({draft})),draft);}
async function position(frame,step,progress){
 await frame.locator('#full-saved-step').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('change'));},step);
 await frame.locator('#full-saved-progress').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('change'));},progress);
 await frame.waitForFunction(({step,progress})=>anklePrototype.state.step===step&&Math.abs(anklePrototype.state.progress-progress)<.01,{step,progress});
}
async function capture(frame){return frame.evaluate(async()=>{
 const {steps}=await fetch('/shared/backup-steps.json').then(r=>r.json());const {captureBrowser}=await import('/shared/backup-adapter.mjs');
 return captureBrowser(localStorage,await fetch('/api/schemes').then(r=>r.json()),steps);
});}
async function importFile(frame,file,mode='keep'){
 await frame.locator('#backup-file').setInputFiles(file);await frame.locator('[data-do="keep"]').waitFor();
 if(mode==='overwrite'){await frame.locator('[data-do="diff"]').click();await frame.locator('[data-do="overwrite"]').waitFor();}
 const loading=page.waitForEvent('load');
 await frame.locator('[data-do="'+mode+'"]').click();
 await loading;
 await page.waitForFunction(()=>document.documentElement.dataset.page==='home');const next=page.frame({name:'personal-home'});await next.locator('#backup-file').waitFor({state:'attached'});return next;
}
try{
 await fs.mkdir(out,{recursive:true});
 if(!lockPath)throw Error('DUCK_BENCHMARK_LOCK is required; no browser started');
 await fs.mkdir(lockPath);lockOwned=true;await fs.writeFile(path.join(lockPath,'owner'),lockOwner);
 await startServer('source');
 browser=await chromium.launch({headless:true,args:['--mute-audio']});
 context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});page=await context.newPage();page.on('pageerror',error=>result.pageErrors.push(String(error)));
 await home();console.log('STAGE source home');
 const model=await(await page.request.get(base+'/assets/model.json')).json();
 const makeDesign=hex=>({colors:Object.fromEntries(model.parts.map(p=>[p.id,hex])),assignments:Object.fromEntries(model.parts.map(p=>[p.id,null])),finishes:{}});
 for(const [id,name,color] of [['e-source-a','E A/B 青鸭','#12ABCD'],['e-source-b','E A/B 紫鸭','#AB12CD']]){
  const response=await page.request.put(base+'/api/schemes/'+id,{data:{name,design:makeDesign(color),voiceSalt:17}});assert.ok(response.ok());
 }
 const sourceRows=await rows();
 const draftA={name:sourceRows.find(s=>s.id==='e-source-a').name,design:makeDesign('#12ABCD'),activeId:'e-source-a',draftId:'source-draft-a',updated:Date.now(),voiceSalt:17,provenance:null};
 const draftB={...draftA,name:'E A/B 紫鸭',design:makeDesign('#AB12CD'),activeId:'e-source-b'};
 const unsaved={...draftA,name:'E 当前未命名草稿',design:makeDesign('#334455'),activeId:null,draftId:'e-unsaved'};
 const controller=await context.newPage();await controller.goto(base+'/assemble/audio-credits.html');await setDraft(controller,draftA);
 console.log('STAGE source guide');let f=await guide();console.log('STAGE source guide ready');await f.waitForFunction(()=>anklePrototype.state.step===0);
 assert.equal(await f.locator('#confirm-built').isChecked(),false);await f.locator('#confirm-seen').check();assert.equal(await f.locator('#confirm-built').isChecked(),false);
 await f.locator('#start button').click();await f.waitForFunction(()=>anklePrototype.state.step===1);assert.equal(await f.locator('#confirm-built').isChecked(),false);await f.locator('#confirm-built').check();await position(f,1,.35);
 await setDraft(controller,draftB);await f.waitForFunction(()=>anklePrototype.state.step===0);assert.equal(await f.locator('#confirm-built').isChecked(),false);assert.equal(await f.locator('#confirm-seen').isChecked(),false);await f.locator('#confirm-built').check();
 await setDraft(controller,unsaved);await f.waitForFunction(()=>!document.querySelector('#confirm-built').checked);await position(f,2,.6);await f.locator('#confirm-seen').check();assert.equal(await f.locator('#confirm-built').isChecked(),false);
 let expected=await capture(f);assert.equal(expected.progress.length,4);log('Actual A/B controls keep seen and built independent across two schemes and the current draft');
 await page.screenshot({path:path.join(out,'source-ab-1440.png')});
 let h=await home();expected=await capture(h);const backup=path.join(out,'source-backup.json');const download=page.waitForEvent('download');await h.locator('[data-do="export"]').click();await(await download).saveAs(backup);
 const sourceBundle=JSON.parse(await fs.readFile(backup,'utf8'));assert.equal(sourceBundle.schemes.length,2);assert.deepEqual(sourceBundle.browser,expected);log('UI export contains all real colors, both scheme confirmations, draft and viewing positions');
 await controller.close();await context.close();context=null;await startServer('target');
 context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN',recordVideo:{dir:path.join(out,'video'),size:{width:960,height:600}}});page=await context.newPage();video=page.video();page.on('pageerror',error=>result.pageErrors.push(String(error)));
 h=await home();assert.equal((await rows()).length,0);
 // Fully initialize another editor before preview; it must not overwrite the imported draft later.
 const stale=await context.newPage();await stale.goto(base+'/index.html#save');await stale.locator('#sm-save').waitFor({state:'visible'});
 h=await home();h=await importFile(h,backup);const targetRows=await rows();assert.equal(targetRows.length,2);
 const actual=await capture(h);const mapping=Object.fromEntries(sourceRows.map(s=>[s.id,targetRows.find(t=>t.name===s.name).id]));
 for(const source of sourceRows){const target=targetRows.find(t=>t.id===mapping[source.id]);assert.notEqual(target.id,source.id);assert.deepEqual(target.design,source.design);assert.equal(target.voiceSalt,source.voiceSalt);}
 const expectedScope=scope=>scope.startsWith('scheme:')?'scheme:'+mapping[scope.slice(7)]:scope.startsWith('draft:')?'draft:'+actual.draft.draftId:scope;
 for(const original of expected.progress){const restored=actual.progress.find(p=>p.scope===expectedScope(original.scope));assert.ok(restored);assert.deepEqual(restored,{...original,scope:expectedScope(original.scope)});}
 assert.deepEqual(actual.draft.design,expected.draft.design);assert.equal(actual.draft.name,expected.draft.name);assert.equal(actual.draft.activeId,null);log('Empty independent SQLite/browser import roundtrip preserves every color and every view/seen/built record with IDs remapped');
 let stalePuts=0;stale.on('request',request=>{if(request.method()==='PUT'&&request.url().includes('/api/schemes/'))stalePuts++;});
 const protectedDraft=await page.evaluate(()=>localStorage.getItem('dd-studio-personal'));await stale.locator('#sm-name').fill('旧窗口禁止覆盖');await stale.locator('#sm-save').click();assert.equal(stalePuts,0);assert.equal(await page.evaluate(()=>localStorage.getItem('dd-studio-personal')),protectedDraft);await stale.close();log('A retained real studio window cannot overwrite imported draft or SQLite schemes');
 // Continue through the real home link rather than seeking a diagnostic API.
 await h.locator('#build-go').click();await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble');f=page.frame({name:'personal-assemble'});await f.waitForFunction(()=>anklePrototype.state.ready);assert.equal(await f.evaluate(()=>anklePrototype.state.step),2);assert.equal(await f.locator('#confirm-seen').isChecked(),true);assert.equal(await f.locator('#confirm-built').isChecked(),false);
 const control=await context.newPage();await control.goto(base+'/assemble/audio-credits.html');
 await setDraft(control,{...draftA,activeId:mapping['e-source-a']});await f.waitForFunction(()=>anklePrototype.state.step===1);assert.equal(await f.locator('#confirm-built').isChecked(),true);assert.equal(await f.locator('#confirm-seen').isChecked(),false);
 // A confirmation event updates checkboxes without moving playback.
 await control.evaluate(async id=>{const{steps}=await fetch('/shared/backup-steps.json').then(r=>r.json());const{createProgressStore}=await import('/assemble/progress-store.mjs');createProgressStore(localStorage,steps,'hardware-v3').setCheck('scheme:'+id,steps[1].id,'seen',true);},mapping['e-source-a']);
 await f.waitForFunction(()=>document.querySelector('#confirm-seen').checked);assert.equal(await f.evaluate(()=>anklePrototype.state.step),1);
 await setDraft(control,{...draftB,activeId:mapping['e-source-b']});await f.waitForFunction(()=>anklePrototype.state.step===0);assert.equal(await f.locator('#confirm-built').isChecked(),true);assert.equal(await f.locator('#confirm-seen').isChecked(),false);
 await page.screenshot({path:path.join(out,'target-ab-1440.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'target-ab-390.png')});await page.setViewportSize({width:1440,height:1000});await control.close();log('Actual imported A/B page resumes the draft and both scheme steps; storage confirmations do not infer or move playback');
 h=await home();h=await importFile(h,backup);assert.equal((await rows()).length,4);log('Same-name keep-both creates isolated copies in the actual combined UI');
 h=await importFile(h,backup,'overwrite');assert.equal((await rows()).length,4);log('Review-before-overwrite updates existing IDs and retains copy count');
 const beforeRows=await rows(),beforeDraft=await page.evaluate(()=>JSON.parse(localStorage.getItem('dd-studio-personal'))),beforeRecoveryBrowser=await capture(h);
 await h.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('dd-assembly-view:')&&localStorage.getItem('dd-backup-pending')){Storage.prototype.setItem=original;throw new DOMException('controlled quota failure','QuotaExceededError');}return original.call(this,key,value);};});
 await h.locator('#backup-file').setInputFiles(backup);await h.locator('[data-do="keep"]').click();await page.waitForFunction(()=>!!localStorage.getItem('dd-backup-pending'));await h.locator('[data-do="recovery-export"]').waitFor({state:'visible'});
 await page.screenshot({path:path.join(out,'recovery-needed.png')});const recovery=page.waitForEvent('download');await h.locator('[data-do="recovery-export"]').click();const recoveryPath=path.join(out,'pre-import-recovery.json');await(await recovery).saveAs(recoveryPath);
 const recoveryBundle=JSON.parse(await fs.readFile(recoveryPath,'utf8'));assert.equal(recoveryBundle.schemes.length,beforeRows.length);assert.ok((await page.request.post(base+'/api/backup/preview',{data:recoveryBundle})).ok());
 await Promise.all([page.waitForEvent('load'),h.locator('[data-do="restore"]').click()]);await page.waitForFunction(()=>document.documentElement.dataset.page==='home');h=page.frame({name:'personal-home'});await h.locator('#backup-file').waitFor({state:'attached'});
 assert.deepEqual(await rows(),beforeRows);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('dd-studio-personal'))),beforeDraft);assert.deepEqual(await capture(h),beforeRecoveryBrowser);assert.equal(await page.evaluate(()=>localStorage.getItem('dd-backup-pending')),null);log('Injected browser failure after SQLite commit downloads a valid recovery copy and restores the exact database and draft');
 await page.screenshot({path:path.join(out,'home-combined-1440.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await h.locator('.data-cards').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'home-combined-390.png')});
 assert.deepEqual(result.pageErrors,[]);result.passed=true;
}catch(error){result.failure=String(error.stack||error);if(page&&!page.isClosed()){await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});result.failureFrames=await Promise.all(page.frames().map(async f=>({url:f.url(),text:(await f.locator('body').innerText().catch(()=>'' )).slice(-2500)})));}process.exitCode=1;}
finally{
 const cleanup=async(fn)=>{try{await fn();}catch(error){(result.cleanupErrors??=[]).push(String(error));process.exitCode=1;}};
 if(context){await cleanup(()=>context.close());context=null;}if(video)await cleanup(()=>video.saveAs(path.join(out,'combined-flow.webm')));
 if(browser)await cleanup(()=>browser.close());await cleanup(stopServer);
 if(lockOwned&&await fs.readFile(path.join(lockPath,'owner'),'utf8')===lockOwner){await fs.unlink(path.join(lockPath,'owner'));await fs.rmdir(lockPath);result.lockReleased=true;}
 await fs.writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
