/** Real UI + real Setup/Debug/IoBus, replacing only the external controller. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createBrowserFixture,BrowserFirmware} from './browser/fixture.js';
import {Firmware} from '../tooling/test/duck-debug-fixture.js';
import {Offline} from '../packages/devices/src/errors.js';
import {launchBrowser,preparePage,required,chooseLocale} from './browser/checks.js';
async function until(predicate:()=>boolean,timeout=10000){const start=Date.now();while(!predicate()){assert.ok(Date.now()-start<timeout,'fixture condition timed out');await delay(10);}}
test('automatic numbering hands off manual control, queues explicitly, resumes after power swap and pauses on exit',async()=>{
 const fixture=await createBrowserFixture({mode:'debug',...(process.env.DUCK_FRONTEND_DIST?{frontend:process.env.DUCK_FRONTEND_DIST}:{})});
 const runtime=fixture.runtime;assert.ok(runtime instanceof BrowserFirmware);
 fixture.store.db.exec('DELETE FROM servo_setup');
 runtime.motors=new Map([[1,{kp:32,kd:40,pos:392}]]);runtime.state.servo_scan_version=2;runtime.pingDelay=1;
 const request=runtime.request.bind(runtime),connect=runtime.connect.bind(runtime);
 runtime.connect=async()=>{if(runtime.offline)throw new Offline('Fixture power disconnected');return connect();};
 runtime.request=async(method,path,body)=>{if(runtime.offline)throw new Offline('Fixture power disconnected');return path==='/servo.html'?Firmware.prototype.request.call(runtime,method,path,body):request(method,path,body);};
 runtime.halt=async()=>{runtime.halted++;runtime.offline=true;};
 let unblock:()=>void=()=>{},blocked=false,writeNumber=0;
 runtime.before=async(_method,_path,body)=>{if(body&&typeof body==='object'&&'action'in body&&body.action==='set_gains'){writeNumber++;blocked=true;await new Promise<void>(resolve=>{unblock=resolve;});blocked=false;}};
 const browser=await launchBrowser({headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'}),page=await context.newPage(),errors:string[]=[],requests:{path:string;body:string}[]=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('/api/'))requests.push({path:new URL(request.url()).pathname,body:request.postData()??''});});
 const evidence=process.env.DUCK_AUTO_EVIDENCE;if(evidence)await mkdir(evidence,{recursive:true});
 try{
  await preparePage(page);await page.goto(fixture.url+'/debug/');await page.waitForSelector('body[data-model-ready=true]');
  assert.equal(await page.locator('[data-workbench=servo]').getAttribute('aria-pressed'),'true','manual remains the default');
  assert.equal(await page.locator('[data-workbench=automatic]').count(),1,'approved automatic entry exists');
  await page.locator('[data-workbench=automatic]').focus();await page.keyboard.press('Home');assert.equal(await page.locator('[data-workbench=servo]').evaluate(element=>element===document.activeElement),true,'Home returns tab focus to the existing first workbench');
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('[data-workbench=calibrate]')?.getAttribute('aria-pressed')==='true');
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('[data-workbench=control]')?.getAttribute('aria-pressed')==='true');
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.querySelector('[data-workbench=automatic]')?.getAttribute('aria-pressed')==='true');
  await page.locator('[data-workbench=control]').click();await page.locator('[data-controller-mode=policy]').click();await until(()=>runtime.state.mode==='policy');
  await page.locator('[data-workbench=automatic]').click();await page.locator('#auto-start').waitFor();
  const entered=runtime.calls.length;await delay(180);assert.equal(runtime.calls.slice(entered).filter(call=>call.method==='POST').length,0,'idle automatic tab never scans or continues manual sending');
  assert.equal(runtime.state.mode,'policy','opening automatic retains existing leave semantics');
  assert.ok(!requests.some(request=>request.path==='/api/servo-setup'),'legacy implicit scan endpoint is unused');
  assert.equal(await page.locator('#auto-profile').textContent(),'开始后自动识别');assert.equal(await page.locator('#auto-start').isEnabled(),true,'unknown profile permits explicit start');
  await page.locator('[data-slot="14"]').click();await page.locator('#auto-start').click();await until(()=>blocked);
  await page.waitForFunction(()=>document.querySelector('#auto-target')?.textContent==='ID 14');
  const off=runtime.calls.findIndex(call=>call.path==='/api/mode'&&call.body?.mode==='off'),firstWrite=runtime.calls.findIndex(call=>call.body?.action==='reset_mid');
  assert.ok(off>=0&&firstWrite>off,'off precedes every automatic EEPROM write');assert.equal(fixture.debug.owned,false);
  for(const id of ['scan-servos','batch-swap','batch-custom','verify-online'])assert.equal(await page.locator('#'+id).isDisabled(),true,id+' cannot reclaim automatic control');
  const sent=runtime.calls.filter(call=>call.path==='/api/command'||call.path==='/api/cal/heartbeat').length;await delay(180);assert.equal(runtime.calls.filter(call=>call.path==='/api/command'||call.path==='/api/cal/heartbeat').length,sent);
  await page.locator('[data-slot="20"]').click();assert.equal(fixture.setup.snapshot().queuedTarget,null,'selecting a slot does not queue implicitly');
  await page.locator('#auto-queue').click();await until(()=>fixture.setup.snapshot().queuedTarget===20);assert.equal(fixture.setup.snapshot().activeTarget,14);
  await page.locator('#auto-clear').waitFor();assert.equal(await page.locator('#auto-clear').count(),1,'the explicitly queued next servo can be removed');await page.locator('#auto-clear').click();await until(()=>fixture.setup.snapshot().queuedTarget===null);await page.locator('#auto-queue').click();await until(()=>fixture.setup.snapshot().queuedTarget===20);
  unblock();await until(()=>fixture.setup.snapshot().phase==='success');await page.locator('#auto-halt').waitFor();
  assert.match(await page.locator('#auto-profile').textContent()??'',/Duck Runtime v2/);
  if(evidence)await page.screenshot({path:join(evidence,'automatic-success-desktop.png'),fullPage:true});
  await page.locator('#auto-halt').click();await until(()=>fixture.setup.snapshot().phase==='shutdown');assert.equal(runtime.halted,1);assert.equal(fixture.setup.snapshot().running,true,'halt waits for power swap, it is not pause');
  await until(()=>Date.now()-(fixture.setup.snapshot().shutdownAt??Date.now())>=15010,18000);
  runtime.motors=new Map([[1,{kp:32,kd:40,pos:392}]]);runtime.offline=false;
  await until(()=>blocked&&writeNumber===2);assert.equal(fixture.setup.snapshot().activeTarget,20,'explicit queued target survives shutdown and power swap');
  await page.locator('[data-workbench=servo]').click();assert.equal(await page.locator('[data-workbench=automatic]').getAttribute('aria-pressed'),'true','manual cannot activate before pause drains in-flight I/O');
  unblock();await page.waitForFunction(()=>document.querySelector('[data-workbench=servo]')?.getAttribute('aria-pressed')==='true');
  assert.equal(fixture.setup.snapshot().running,false);const stopped=runtime.calls.length;await delay(120);assert.equal(runtime.calls.slice(stopped).filter(call=>['reset_mid','set_gains','set_id'].includes(String(call.body?.action))).length,0);
  assert.equal(runtime.halted,1);assert.equal(runtime.closed,0);
  runtime.before=undefined;await page.locator('[data-workbench=automatic]').click();await page.locator('[data-slot="21"]').click();await page.locator('#auto-queue').click();await until(()=>fixture.setup.snapshot().queuedTarget===21);await page.locator('#auto-clear').click();await until(()=>fixture.setup.snapshot().queuedTarget===null);await page.locator('[data-slot="20"]').click();await page.locator('#auto-start').click();await until(()=>fixture.setup.snapshot().phase==='success'&&fixture.setup.snapshot().currentId===20);
  assert.equal(runtime.calls.filter(call=>call.body?.action==='reset_mid').length,2,'pending recovery never replays midpoint initialization');
  await page.locator('#release-all').click();await until(()=>!fixture.setup.snapshot().running&&runtime.state.mode==='off');assert.equal(runtime.halted,1,'global release pauses without another board shutdown');await page.locator('#auto-start').click();await until(()=>fixture.setup.snapshot().running);
  await page.setViewportSize({width:390,height:844});await page.locator('#auto-stop').scrollIntoViewIfNeeded();assert.equal(await page.locator('#auto-stop').isVisible(),true);
  if(evidence)await page.screenshot({path:join(evidence,'automatic-narrow.png'),fullPage:true});
  await page.goto(fixture.url+'/');await until(()=>!fixture.setup.snapshot().running);assert.equal(runtime.closed,0);assert.equal(runtime.halted,1);
  await page.setViewportSize({width:1440,height:1000});await page.goto(fixture.url+'/');await page.waitForFunction(()=>document.body.dataset.homeReady==='true');
  const duck=page.locator('[data-duck=debug]');await duck.click();if(!await page.locator('#module-window').isVisible())await duck.click();
  const embedded=required(await required(await page.locator('#module-frame').elementHandle()).contentFrame());await embedded.waitForSelector('body[data-model-ready=true]');
  assert.equal(await embedded.locator('[data-workbench=servo]').getAttribute('aria-pressed'),'true');await embedded.locator('[data-workbench=automatic]').click();await embedded.locator('#auto-start').waitFor();
  assert.match(await embedded.locator('#auto-progress').innerText(),/2\/15/,'iframe shows shared persisted progress');
  await page.locator('#close-module').click();await until(()=>!fixture.setup.snapshot().running);
  assert.deepEqual(errors,[]);assert.ok(!requests.some(request=>request.path==='/api/servo-setup'));
  console.log(JSON.stringify({passed:true,hardware:false,records:fixture.setup.snapshot().records.map(record=>record.id),halted:runtime.halted,legacyInspectRequests:0,errors}));
 }finally{unblock();await context.close();await browser.close();await fixture.close();}
});

test('completed automatic numbering presents all fifteen records and returns to manual without restarting or shutting down',async()=>{
 const fixture=await createBrowserFixture({mode:'debug',...(process.env.DUCK_FRONTEND_DIST?{frontend:process.env.DUCK_FRONTEND_DIST}:{})}),browser=await launchBrowser({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'}),page=await context.newPage();
 try{
  await preparePage(page);await page.goto(fixture.url+'/debug/');await page.waitForSelector('body[data-model-ready=true]');await page.locator('[data-workbench=automatic]').click();await page.waitForFunction(()=>document.querySelector('#auto-progress')?.textContent?.includes('15/15'));
  assert.equal(await page.locator('#auto-complete').count(),1,'completed records receive an explicit completion summary');
  assert.match(await page.locator('#auto-progress').innerText(),/15\/15/);assert.equal(await page.locator('#auto-complete [data-auto-group]').count(),3);
  assert.equal(await page.locator('#auto-complete').innerText().then(text=>text.includes('编号完成不代表机械零位已校准。')),true);
  const chooser=await page.context().newPage();
  try{
   await preparePage(chooser);await chooser.goto(fixture.url+'/');await chooser.locator('#language-trigger').waitFor();
   for(const locale of ['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi']){
    await chooseLocale(chooser,locale);await page.waitForFunction(locale=>document.documentElement.lang===locale,locale);
    for(const width of [1440,390]){
     await page.setViewportSize({width,height:width===390?844:1000});
     const layout=await page.evaluate(()=>{const panel=document.querySelector('#panel')!.getBoundingClientRect();return {width:innerWidth,scroll:document.documentElement.scrollWidth,outside:[...document.querySelectorAll('#panel h2,#panel button,#panel .auto-phase')].flatMap(element=>{const range=document.createRange();range.selectNodeContents(element);const rect=range.getBoundingClientRect();return rect.width&&(rect.left<panel.left-1||rect.right>panel.right+1)?[{text:element.textContent,left:rect.left,right:rect.right,panelLeft:panel.left,panelRight:panel.right}]:[];})};});
     if(layout.scroll>layout.width+1||layout.outside.length){if(process.env.DUCK_AUTO_EVIDENCE)await page.screenshot({path:join(process.env.DUCK_AUTO_EVIDENCE,'layout-before-'+locale+'-'+width+'.png'),fullPage:true});}
     assert.ok(layout.scroll<=layout.width+1&&layout.outside.length===0,locale+' '+width+' controls/text stay within their panel '+JSON.stringify(layout));
     if(process.env.DUCK_AUTO_EVIDENCE&&(['zh-Hans','de','ar'].includes(locale)&&width===390))await page.screenshot({path:join(process.env.DUCK_AUTO_EVIDENCE,'complete-'+locale+'-'+width+'.png'),fullPage:true});
    }
   }
  }finally{await chooser.close();}
  await page.locator('#auto-manual').click();await page.waitForFunction(()=>document.querySelector('.work-tabs [data-workbench=servo]')?.getAttribute('aria-pressed')==='true');
  assert.equal(await page.locator('#auto-complete').count(),0);assert.equal(fixture.setup.snapshot().records.length,15);
  assert.ok(fixture.runtime instanceof BrowserFirmware);assert.equal(fixture.runtime.halted,0);assert.equal(fixture.runtime.closed,0);assert.equal(fixture.runtime.calls.some(call=>call.method==='POST'),false);
 }finally{await context.close();await browser.close();await fixture.close();}
});

async function numberingFixture(){
 const fixture=await createBrowserFixture({mode:'debug',...(process.env.DUCK_FRONTEND_DIST?{frontend:process.env.DUCK_FRONTEND_DIST}:{})});
 const runtime=fixture.runtime;assert.ok(runtime instanceof BrowserFirmware);fixture.store.db.exec('DELETE FROM servo_setup');
 runtime.motors=new Map([[1,{kp:32,kd:40,pos:392}]]);runtime.state.servo_scan_version=2;runtime.pingDelay=1;
 const request=runtime.request.bind(runtime);runtime.request=(method,path,body)=>path==='/servo.html'?Firmware.prototype.request.call(runtime,method,path,body):request(method,path,body);
 return {fixture,runtime};
}
test('pending head mode acknowledgement prevents automatic navigation and cannot revive manual sending after handoff',async()=>{
 const {fixture,runtime}=await numberingFixture(),browser=await launchBrowser({headless:true}),context=await browser.newContext({locale:'zh-CN'}),page=await context.newPage();
 let unblock=()=>{},blocked=false;
 runtime.before=async(method,path)=>{if(method==='POST'&&path==='/api/mode'&&!blocked){blocked=true;await new Promise<void>(resolve=>{unblock=resolve;});}};
 try{
  await preparePage(page);await page.goto(fixture.url+'/debug/');await page.waitForSelector('body[data-model-ready=true]');await page.locator('[data-workbench=control]').click();await page.locator('[data-control-tab=head]').click();
  await page.locator('#control-head-0').press('ArrowRight');await until(()=>blocked);
  const automatic=page.locator('[data-workbench=automatic]'),disabled=await automatic.isDisabled(),box=required(await automatic.boundingBox());
  await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await delay(40);const moved=await automatic.getAttribute('aria-pressed');
  unblock();await until(()=>runtime.calls.some(call=>call.path==='/api/command'));
  assert.equal(disabled,true,'mode→command must hold existing busy; nav moved='+moved);assert.equal(moved,'false');
  await automatic.click();await page.locator('#auto-start').waitFor();const count=runtime.calls.filter(call=>call.path==='/api/command').length;
  await delay(180);assert.equal(runtime.calls.filter(call=>call.path==='/api/command').length,count,'late mode response never rearms automatic tab');assert.equal(fixture.debug.owned,false);
 }finally{unblock();await context.close();await browser.close();await fixture.close();}
});
test('closing the homepage iframe during an unfinished automatic leave still sends the pause beacon',async()=>{
 const fixture=await createBrowserFixture({mode:'debug',...(process.env.DUCK_FRONTEND_DIST?{frontend:process.env.DUCK_FRONTEND_DIST}:{})}),browser=await launchBrowser({headless:true}),context=await browser.newContext({locale:'zh-CN'}),page=await context.newPage();
 const pause=fixture.setup.pause.bind(fixture.setup);let unblock=()=>{},entered=false,requests=0;
 fixture.setup.pause=async()=>{if(!entered){entered=true;await new Promise<void>(resolve=>{unblock=resolve;});}return pause();};
 page.on('request',request=>{if(new URL(request.url()).pathname==='/api/servo-setup/pause')requests++;});
 try{
  await preparePage(page);await page.goto(fixture.url+'/');await page.waitForFunction(()=>document.body.dataset.homeReady==='true');const duck=page.locator('[data-duck=debug]');await duck.click();if(!await page.locator('#module-window').isVisible())await duck.click();
  const frame=required(await required(await page.locator('#module-frame').elementHandle()).contentFrame());await frame.waitForSelector('body[data-model-ready=true]');await frame.locator('[data-workbench=automatic]').click();await frame.locator('#auto-manual').waitFor();
  await frame.locator('#auto-manual').click();await until(()=>entered);await page.locator('#close-module').click();await until(()=>requests>=2);
  assert.equal(requests,2,'pending leave plus pagehide beacon');assert.ok(fixture.runtime instanceof BrowserFirmware);assert.equal(fixture.runtime.halted,0);assert.equal(fixture.runtime.closed,0);
 }finally{unblock();fixture.setup.pause=pause;await context.close();await browser.close();await fixture.close();}
});
test('resuming a discovery paused before pending exists finishes its current target before the next queued servo',async()=>{
 const {fixture,runtime}=await numberingFixture(),browser=await launchBrowser({headless:true}),context=await browser.newContext({locale:'zh-CN'}),page=await context.newPage();let unblock=()=>{},blocked=false;
 runtime.before=async(_method,_path,body)=>{if(!blocked&&body&&typeof body==='object'&&'action'in body&&body.action==='ping'){blocked=true;await new Promise<void>(resolve=>{unblock=resolve;});}};
 try{
  await preparePage(page);await page.goto(fixture.url+'/debug/');await page.waitForSelector('body[data-model-ready=true]');await page.locator('[data-workbench=automatic]').click();await page.locator('[data-slot="14"]').click();await page.locator('#auto-start').click();await until(()=>blocked);
  await page.locator('#auto-pause').click();unblock();await until(()=>fixture.setup.snapshot().phase==='paused');assert.equal(fixture.setup.snapshot().records.length,0);assert.equal(fixture.setup.snapshot().activeTarget,14);
  await page.locator('[data-slot="20"]').click();await page.locator('#auto-queue').click();await until(()=>fixture.setup.snapshot().queuedTarget===20);
  runtime.before=undefined;await page.locator('#auto-start').click();await until(()=>fixture.setup.snapshot().phase==='success');
  assert.equal(fixture.setup.snapshot().currentId,14,'selected next target does not replace the interrupted current servo');assert.equal(fixture.setup.snapshot().queuedTarget,20);assert.deepEqual([...runtime.motors.keys()],[14]);
 }finally{unblock();await context.close();await browser.close();await fixture.close();}
});
