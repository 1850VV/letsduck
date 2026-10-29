import type {Page,Browser,BrowserServer,BrowserContext,Video} from 'playwright';
import type * as THREE from '../../frontend/vendor/three.module.js';
import {installRenderProbe,captureRenderer} from '../browser/render-probe.js';
import {record,parsePreparationRecords,parseLeadCatalog,type LeadCatalog} from '../../frontend/assemble/servo-types.js';
import * as browserChecks from '../browser/checks.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {STEPS} from '../../frontend/assemble/hardware-state.js';

interface DiscPoint {context:string;role:string;actor:unknown;x:number;y:number}
declare global {interface Window {__directViews:Map<HTMLCanvasElement,{scene:THREE.Scene;camera:THREE.Camera;canvas:HTMLCanvasElement}>;__discPoints():DiscPoint[]}}
function fixtureInfo(raw:unknown):{url:string;catalog:LeadCatalog}{const value=record(raw);if(typeof value.url!=='string')throw Error('Fixture URL missing');return {url:value.url,catalog:parseLeadCatalog(value.catalog)};}
function parseLine(value:unknown){if(typeof value!=='string')throw Error('Fixture receipt missing');const raw:unknown=JSON.parse(value);return fixtureInfo(raw);}
async function installHornProbe(page:Page){
 await browserChecks.installRuntime(page);await captureRenderer(page,'#canvas-host canvas');
 await page.evaluate(async()=>{
  const THREE=window.__duckModules.THREE,captured=window.__browserChecks.required(window.__renderProbe.captured);
  const prototype:unknown=Object.getPrototypeOf(captured.scene);if(!prototype||typeof prototype!=='object'||!('onBeforeRender'in prototype)||typeof prototype.onBeforeRender!=='function')throw Error('Canonical scene prototype missing');
  window.__directViews=new Map([[captured.renderer.domElement,{scene:captured.scene,camera:captured.camera,canvas:captured.renderer.domElement}]]);
  const original=prototype.onBeforeRender;
  prototype.onBeforeRender=function(this:THREE.Scene,...args:Parameters<THREE.Scene['onBeforeRender']>){
   const [renderer,scene,camera]=args;
   if(renderer.domElement.parentElement?.id==='canvas-host'&&camera.position.distanceTo(new THREE.Vector3(...window.anklePrototype.state.camera))>.001)return Reflect.apply(original,this,args);
   window.__directViews.set(renderer.domElement,{scene,camera,canvas:renderer.domElement});
   Reflect.apply(original,this,args);
  };
  window.__discPoints=()=>{
   const out:DiscPoint[]=[];
   const visible=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(!p.visible)return false;return true;};
   const part=(o:THREE.Object3D)=>{for(let p:THREE.Object3D|null=o;p;p=p.parent)if(p.userData.hornRole)return p;return null;};
   for(const view of window.__directViews.values()){
    if(!view.canvas.isConnected||view.canvas.getBoundingClientRect().width<1)continue;
    const context=view.canvas.closest('#inspection-screen')?'inspection':view.canvas.parentElement?.id==='canvas-host'?'main':'other';
    if(context==='other')continue;
    view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);const r=view.canvas.getBoundingClientRect(),meshes:THREE.Object3D[]=[];
    const isMesh=(m:THREE.Object3D):m is THREE.Mesh=>'isMesh'in m&&m.isMesh===true;
    view.scene.traverse(m=>{if(isMesh(m)&&visible(m))meshes.push(m);});
    view.scene.traverse(group=>{
     const role:unknown=group.userData.hornRole;if(typeof role!=='string'||!visible(group))return;const disc=group.getObjectByName('eight-hole-disc');
     disc?.traverse(mesh=>{if(!isMesh(mesh))return;mesh.geometry.computeBoundingBox();const b=window.__browserChecks.required(mesh.geometry.boundingBox),c=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3());
      for(const face of [b.max.z,b.min.z])for(const [x,y]of [[.28,.17],[-.28,.17],[.18,-.28],[-.18,-.28]] as const){
       const screen=mesh.localToWorld(new THREE.Vector3(c.x+size.x*x,c.y+size.y*y,face)).project(view.camera);
       if(Math.abs(screen.x)>1||Math.abs(screen.y)>1)continue;
       const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(screen.x,screen.y),view.camera);
       const hit=ray.intersectObjects(meshes,false).find(h=>visible(h.object));
       if(hit&&part(hit.object)===group){out.push({context,role,actor:mesh.userData.actorId,x:r.left+(screen.x*.5+.5)*r.width,y:r.top+(-screen.y*.5+.5)*r.height});return;}
      }
     });
    });
   }return out;
  };
 });
}

test('physical servo inventory stays fixed and independent of configuration',{
 skip:!process.env.DUCK_PREPARATION_TEST,timeout:180000,
},async t=>{
 const dir=await mkdtemp(join(tmpdir(),'letsduck-preparation-'));let server:ReturnType<typeof spawn>|undefined,browserServer:BrowserServer|undefined,browser:Browser|undefined,context:BrowserContext|undefined,pid:number|undefined,video:Video|null|undefined,serverError='';
 try{
  server=spawn(process.execPath,['--import','tsx','tests/assembly/fixtures/preparation_server.ts','--db',join(dir,'personal.db')],{stdio:['ignore','pipe','pipe']});
  browserChecks.required(server.stderr).on('data',chunk=>{serverError+=chunk;});
  const lines=createInterface({input:browserChecks.required(server.stdout)});
  const info=await Promise.race([once(lines,'line').then(values=>parseLine(values[0])),once(server,'exit').then(()=>{throw Error(serverError);})]);
  lines.close();
  browserServer=await chromium.launchServer(browserChecks.browserLaunchOptions({headless:false}));pid=browserServer.process().pid;browser=await chromium.connect(browserServer.wsEndpoint());
  const videoDir=process.env.ASSEMBLY_EVIDENCE_DIR?join(process.env.ASSEMBLY_EVIDENCE_DIR,'video'):null;if(videoDir)await mkdir(videoDir,{recursive:true});
  context=await browser.newContext({locale:'zh-CN',viewport:{width:1400,height:1040},...(videoDir?{recordVideo:{dir:videoDir,size:{width:1400,height:1040}}}:{})});const page=await context.newPage(),errors:string[]=[];await installRenderProbe(page);video=page.video();
  page.on('pageerror',e=>errors.push(e.message));
  const hardwareRequests:string[]=[];page.on('request',request=>{const path=new URL(request.url()).pathname;if(path.startsWith('/api/servo-setup')&&path!=='/api/servo-setup/records')hardwareRequests.push(request.method()+' '+path);});
  const api=async (body?:{ids:number[];state:string})=>{const r=await fetch(info.url+'/api/servo-preparation',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});assert.equal(r.status,200);const raw:unknown=await r.json();return {records:parsePreparationRecords(record(raw).records)};};
  const shot=async (name:string)=>{if(!process.env.ASSEMBLY_EVIDENCE_DIR)return;await mkdir(process.env.ASSEMBLY_EVIDENCE_DIR,{recursive:true});await page.screenshot({path:join(process.env.ASSEMBLY_EVIDENCE_DIR,name+'.png')});};
  await browserChecks.preparePage(page);await page.goto(info.url+'/assemble/');await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
  await t.test('pickup reflects persisted gaps and historical proof without a configuration Workbench',async()=>{
   assert.equal(await page.locator('#servo-open, #servo-guide-open').count(),0,'the retired Workbench has no remaining Assembly entry');
   if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();
   await page.locator('#full-saved-step').evaluate((el,n)=>{window.__browserChecks.input(el).value=String(n);window.__browserChecks.query<HTMLInputElement>('#full-saved-progress').value='1';el.dispatchEvent(new Event('change'));},STEPS.findIndex(s=>s.id==='l-prepare'));
   await page.keyboard.press('Escape');await page.locator('#instruction-toggle').click();await page.locator('[data-servo-ids="14"]').click();
   assert.equal(await page.locator('.sp-slot[data-id="14"]').getAttribute('data-state'),'picked');
   assert.equal(await page.locator('.sp-slot[data-id="24"]').getAttribute('data-state'),'installed');
   assert.deepEqual(await page.locator('.sp-slot').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-id')))),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
   await page.locator('.sp-slot[data-id="11"]').click();assert.match(await page.locator('.sp-history').innerText(),/编号参数已验证/);
   await page.locator('.sp-slot[data-id="10"]').click();assert.match(await page.locator('.sp-history').innerText(),/编号记录需复核/);
   await page.locator('.sp-slot[data-id="32"]').click();
   assert.match(await page.locator('#servo-pickup .servo-leads').innerText(),/线材规格待核定/);
   assert.match(await page.locator('#servo-pickup .servo-leads').innerText(),/3 只需长 AMP 线/);
   assert.equal(await page.locator('.sp-slot.available').count(),13);
   assert.deepEqual(hardwareRequests,[],'loading and browsing inventory never inspect or mutate servo setup');
   await shot('pickup-fixed-slots');await page.locator('#sp-close').click();
  });
  await t.test('tutorial uses the same fixed tray and explicit physical declarations',async()=>{
   const originalHistory=await fetch(info.url+'/api/servo-setup/records').then(r=>r.json());
   await api({ids:[14,24],state:'available'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
   if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();
   const go=async (id:string)=>{const n=STEPS.findIndex(s=>s.id===id);assert.ok(n>=0);await page.locator('#full-saved-step').evaluate((el,n)=>{window.__browserChecks.input(el).value=String(n);window.__browserChecks.query<HTMLInputElement>('#full-saved-progress').value='1';el.dispatchEvent(new Event('change'));},n);await page.waitForFunction(n=>window.anklePrototype.state.step===n,n);};
   const openParts=async (ids:string)=>{if(await page.locator('#kit').isVisible())await page.locator('#kit-go').click();await page.locator('#instruction-toggle').click();const values=ids.split(',');for(const id of values)assert.equal(await page.locator(`[data-servo-ids="${id}"]`).count(),1);await page.locator(`[data-servo-ids="${values[0]}"]`).click();};
   const records=async()=>new Map((await api()).records.map(r=>[r.id,r.state]));
   await go('l-prepare');await openParts('14');
   assert.equal(await page.locator('#servo-pickup').isVisible(),true);
   assert.match(await page.locator('#sp-position').innerText(),/第 1 排.*第 5 格/);
   assert.deepEqual(await page.locator('.sp-slot').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-id')))),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
   assert.equal(await page.locator('.sp-slot.long').count(),0,'unverified head servos are not guessed to be long-cable units');
   const anchor=browserChecks.required(await page.locator('#sp-model-label').boundingBox());assert.ok(anchor);
   await page.locator('#sp-close').click();await page.mouse.click(anchor.x+anchor.width/2,anchor.y+anchor.height/2+20);
   assert.equal(await page.locator('#servo-pickup').isVisible(),true,'clicking the actual 3D servo opens the same map');
   assert.match(await page.locator('#sp-id').innerText(),/14/);
   await page.locator('#sp-close').click();await installHornProbe(page);
   await go('l-horn');await page.locator('#full-saved-progress').evaluate(el=>{window.__browserChecks.input(el).value='0';el.dispatchEvent(new Event('change'));});
   await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition&&window.__discPoints().some(p=>p.context==='main'&&p.role==='secondary'));
   const hornPoint=await page.evaluate(()=>window.__discPoints().find(p=>p.context==='main'&&p.role==='secondary'));
   assert.ok(hornPoint);await page.mouse.click(hornPoint.x,hornPoint.y);
   assert.equal(await page.locator('#part-tooltip').getAttribute('data-horn'),'secondary','direct horn identification remains available alongside servo pickup');
   assert.equal(await page.locator('#part-name').innerText(),'副舵盘');
   assert.equal(await page.locator('#servo-pickup').isHidden(),true,'a horn click must identify its disc, without opening the servo tray');
   await shot('tutorial-horn-identification');await page.locator('#part-close').click();
   await go('l-prepare');await openParts('14');
   await shot('tutorial-locate-14');
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(14),'picked');
   assert.equal(await page.locator('.sp-slot[data-id="14"]').getAttribute('data-slot'),'4');
   assert.equal(await page.locator('.sp-slot[data-id="14"] svg').count(),0);
   await shot('tutorial-taken-14');await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
   assert.equal((await records()).get(14),'picked');
   await go('l-prepare');await openParts('14');await page.locator('#sp-return').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(14),'available');
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   await go('l-tighten');
   await page.locator('#full-saved-progress').evaluate(el=>{window.__browserChecks.input(el).value='.99';el.dispatchEvent(new Event('change'));});
   await page.locator('#pause').click();await page.waitForFunction(()=>window.anklePrototype.state.progress===1);
   assert.equal((await records()).get(14),'picked','animation completion cannot install a physical part');
   assert.match(await page.locator('#next').innerText(),/已装好/);await page.locator('#next').click();
   await page.waitForFunction(()=>window.anklePrototype.state.stepId==='l-ankle-done');
   assert.equal((await records()).get(14),'installed');
   await page.locator('#back').click();assert.equal((await records()).get(14),'installed','backtracking cannot replenish inventory');
   const beforeAuto=[...(await records())];await page.locator('#autoplay').click();
   if(await page.locator('#kit').isVisible())await page.locator('#kit-go').click();
   await page.waitForFunction(()=>window.anklePrototype.state.step>=2);await page.locator('#autoplay').click();
   assert.deepEqual([...(await records())],beforeAuto,'automatic lesson transitions never declare physical assembly');
   await go('l-pair');await openParts('12,13');
   assert.deepEqual(await page.locator('.sp-slot.needed').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-id')))),[12,13]);
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.match(await page.locator('#sp-id').innerText(),/13/);
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(12),'picked');assert.equal((await records()).get(13),'picked');
   await shot('tutorial-pair-taken');await go('l-leg-done');await page.locator('#next').click();
   await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(12),'installed');assert.equal((await records()).get(13),'installed');
   await go('r-tighten');await page.locator('#next').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(24),'installed','normal next does not require a separate pickup confirmation');
   await go('t-pair');await openParts('10,20');
   await page.locator('.sp-slot[data-id="20"]').click();
   await page.route('**/api/servo-preparation',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Fixture save failed'})}):route.continue());
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.match(await page.locator('#sp-error').innerText(),/Fixture save failed/);
   assert.equal((await records()).get(20),undefined,'failed save cannot create a false empty slot');
   assert.equal(await page.locator('.sp-slot[data-id="20"]').getAttribute('data-state'),'available');
   await page.unroute('**/api/servo-preparation');
   await go('r-leg-done');
   await page.route('**/api/servo-preparation',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Fixture install failed'})}):route.continue());
   await page.locator('#next').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal(await page.evaluate(()=>window.anklePrototype.state.stepId),'r-leg-done','failed save cannot advance the tutorial');
   assert.equal((await records()).get(22),undefined);assert.equal((await records()).get(23),undefined);
   await page.unroute('**/api/servo-preparation');await page.locator('#next').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(22),'installed');assert.equal((await records()).get(23),'installed');
   assert.deepEqual(await fetch(info.url+'/api/servo-setup/records').then(r=>r.json()),originalHistory);
   await api({ids:[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34],state:'installed'});
   await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
   assert.match(await page.locator('#sp-summary').innerText(),/全部取用/);
   await shot('tutorial-all-used');
   await page.locator('#desk-toggle').click();await go('l-prepare');await page.locator('#step-materials').click();
   await page.locator('#kit-parts button').filter({hasText:'舵机'}).first().click();
   assert.equal(await page.locator('#servo-pickup').isVisible(),true,'desk-mode chapter parts use the same pickup map');
   assert.match(await page.locator('#sp-id').innerText(),/14/);await shot('tutorial-desk-pickup');
   await page.locator('#sp-return').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
   assert.equal((await records()).get(14),'available','putting an installed unit back restores only its fixed slot');
   assert.equal(await page.locator('.sp-slot[data-id="14"]').getAttribute('data-slot'),'4');
  });
  await t.test('pending saves respect newer navigation and deliberate part selection',async()=>{
   await api({ids:[12,13,14],state:'picked'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
   if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();
   const go=async (id:string)=>{await page.locator('#full-saved-step').evaluate((el,n)=>{window.__browserChecks.input(el).value=String(n);window.__browserChecks.query<HTMLInputElement>('#full-saved-progress').value='1';el.dispatchEvent(new Event('change'));},STEPS.findIndex(s=>s.id===id));};
   const delay=async (fail:boolean)=>{let release:()=>void=()=>{throw Error('Fixture gate missing');},started:()=>void=()=>{throw Error('Fixture start missing');};const hold=new Promise<void>(r=>release=r),entered=new Promise<void>(r=>started=r);await page.route('**/api/servo-preparation',async route=>{if(route.request().method()!=='POST')return route.continue();started();await hold;return fail?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Delayed fixture failure'})}):route.continue();});return{release,entered};};
   await go('l-tighten');let request=await delay(false);await page.locator('#next').click();await request.entered;await page.locator('#back').click();request.release();
   await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);assert.equal(await page.evaluate(()=>window.anklePrototype.state.stepId),'l-axle','saved installation must not advance a later navigation');
   await page.unroute('**/api/servo-preparation');await api({ids:[14],state:'picked'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
   await go('l-tighten');request=await delay(true);await page.locator('#next').click();await request.entered;await go('t-pair');request.release();
   await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);assert.equal(await page.evaluate(()=>window.anklePrototype.state.stepId),'t-pair');assert.equal(await page.locator('#servo-pickup').isHidden(),true,'a stale failure must not reopen the old part in a new chapter');
   await page.unroute('**/api/servo-preparation');await api({ids:[12,13],state:'available'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
   await go('l-pair');if(await page.locator('#kit').isVisible())await page.locator('#kit-go').click();await page.locator('#instruction-toggle').click();await page.locator('[data-servo-ids="12"]').click();
   request=await delay(false);await page.locator('#sp-take').click();await request.entered;await page.locator('.sp-slot[data-id="20"]').click();request.release();
   await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);assert.match(await page.locator('#sp-id').innerText(),/20/,'finishing an earlier pickup must preserve the newer explicit selection');
   await page.unroute('**/api/servo-preparation');
  });
  assert.deepEqual(errors,[]);assert.deepEqual(hardwareRequests,[]);
 }finally{
  const ownedPids=browser?await browserChecks.browserPids(browser).catch(()=>[]):[];
  await context?.close();if(video)await video.saveAs(join(browserChecks.required(process.env.ASSEMBLY_EVIDENCE_DIR),'pickup-flow.webm'));await browser?.close();await browserServer?.close();await browserChecks.processesExited(ownedPids);
  if(pid)assert.throws(()=>process.kill(browserChecks.required(pid),0),'owned browser process must exit');
  if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}
  await rm(dir,{recursive:true,force:true});
 }
});

// The optional Workbench lead-mark button is retired with that UI. This covers
// persisted lead data and unblocked pickup/installation, not that old operation.
test('historical multi-lead records remain visible and physical installation does not require a lead-mark button',{
 skip:!process.env.DUCK_PREPARATION_TEST,timeout:60000,
},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'letsduck-lead-history-'));let server:ReturnType<typeof spawn>|undefined,browserServer:BrowserServer|undefined,browser:Browser|undefined,context:BrowserContext|undefined,pid:number|undefined;
 try{
  server=spawn(process.execPath,['--import','tsx','tests/assembly/fixtures/preparation_server.ts','--db',join(dir,'personal.db'),'--confirmed-leads'],{stdio:['ignore','pipe','ignore']});
  const lines=createInterface({input:browserChecks.required(server.stdout)}),[line]=await once(lines,'line'),info=parseLine(line);lines.close();
  browserServer=await chromium.launchServer(browserChecks.browserLaunchOptions({headless:false}));pid=browserServer.process().pid;browser=await chromium.connect(browserServer.wsEndpoint());context=await browser.newContext({locale:'zh-CN',viewport:{width:1400,height:1040}});const page=await context.newPage();
  const update=async(body:Record<string,unknown>)=>{const response=await fetch(info.url+'/api/servo-preparation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,200);};
  const saved=async()=>{const stored:unknown=await fetch(info.url+'/api/servo-preparation').then(r=>r.json());return browserChecks.required(parsePreparationRecords(record(stored).records).find(r=>r.id===11));};
  const history=await fetch(info.url+'/api/servo-setup/records').then(r=>r.json()),writes:string[]=[],errors:string[]=[];
  page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(servo-setup|duck-debug)/.test(r.url()))writes.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
  await update({ids:[11],preparedLeads:['fixture-a','fixture-b']});
  await browserChecks.preparePage(page);await page.goto(info.url+'/assemble/');await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
  assert.equal(await page.locator('#servo-open, #servo-guide-open').count(),0);
  const go=async()=>{if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();const n=STEPS.findIndex(s=>s.id==='t-motor-l');assert.ok(n>=0);await page.locator('#full-saved-step').evaluate((el,n)=>{window.__browserChecks.input(el).value=String(n);window.__browserChecks.query<HTMLInputElement>('#full-saved-progress').value='1';el.dispatchEvent(new Event('change'));},n);await page.waitForFunction(n=>window.anklePrototype.state.step===n,n);await page.keyboard.press('Escape');};
  await go();await page.locator('#instruction-toggle').click();await page.locator('[data-servo-ids="11"]').click();
  assert.match(await page.locator('#servo-pickup .servo-leads').innerText(),/200 mm/);assert.match(await page.locator('#servo-pickup .servo-leads').innerText(),/100 mm/);
  assert.match(await page.locator('#servo-pickup .servo-leads').innerText(),/预接线已备好/);
  await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
  assert.equal((await saved()).state,'picked');assert.deepEqual((await saved()).preparedLeads,['fixture-a','fixture-b']);
  await page.locator('#sp-return').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
  assert.equal((await saved()).state,'available');assert.deepEqual((await saved()).preparedLeads,['fixture-a','fixture-b']);
  await update({ids:[11],preparedLeads:[]});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));await go();
  assert.equal(await page.locator('[data-action="prepared-next"], [data-action="prepared-halt"]').count(),0,'no unapproved preparation control is added to Assembly');
  await page.locator('#next').click();await page.waitForFunction(()=>!window.__browserChecks.required(window.anklePrototype.preparation).saving);
  assert.equal((await saved()).state,'installed','Next remains available to a new user without a lead-ready marker');assert.deepEqual((await saved()).preparedLeads,[]);
  assert.deepEqual(await fetch(info.url+'/api/servo-setup/records').then(r=>r.json()),history);assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
 }finally{const ownedPids=browser?await browserChecks.browserPids(browser).catch(()=>[]):[];await context?.close();await browser?.close();await browserServer?.close();await browserChecks.processesExited(ownedPids);if(pid)assert.throws(()=>process.kill(browserChecks.required(pid),0));if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}await rm(dir,{recursive:true,force:true});}
});
