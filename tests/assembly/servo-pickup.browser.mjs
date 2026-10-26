import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {STEPS} from '../../frontend/assemble/hardware-state.mjs';

async function installHornProbe(page){
 await page.evaluate(async()=>{
  const THREE=await import('/vendor/three.module.js');
  window.__directViews=new Map();
  const original=THREE.Scene.prototype.onBeforeRender;
  THREE.Scene.prototype.onBeforeRender=function(renderer,scene,camera,...rest){
   if(renderer.domElement.parentElement.id==='canvas-host'&&camera.position.distanceTo(new THREE.Vector3(...window.anklePrototype.state.camera))>.001)return original?.call(this,renderer,scene,camera,...rest);
   window.__directViews.set(renderer.domElement,{scene,camera,canvas:renderer.domElement});
   original?.call(this,renderer,scene,camera,...rest);
  };
  window.__discPoints=()=>{
   const out=[];
   const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
   const part=o=>{for(let p=o;p;p=p.parent)if(p.userData.hornRole)return p;return null;};
   for(const view of window.__directViews.values()){
    if(!view.canvas.isConnected||view.canvas.getBoundingClientRect().width<1)continue;
    const context=view.canvas.closest('#inspection-screen')?'inspection':view.canvas.parentElement.id==='canvas-host'?'main':'other';
    if(context==='other')continue;
    view.scene.updateMatrixWorld(true);view.camera.updateMatrixWorld(true);const r=view.canvas.getBoundingClientRect(),meshes=[];
    view.scene.traverse(m=>{if(m.isMesh&&visible(m))meshes.push(m);});
    view.scene.traverse(group=>{
     if(!group.userData.hornRole||!visible(group))return;const disc=group.getObjectByName('eight-hole-disc');
     disc?.traverse(mesh=>{if(!mesh.isMesh)return;mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox,c=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3());
      for(const face of [b.max.z,b.min.z])for(const [x,y]of [[.28,.17],[-.28,.17],[.18,-.28],[-.18,-.28]]){
       const screen=mesh.localToWorld(new THREE.Vector3(c.x+size.x*x,c.y+size.y*y,face)).project(view.camera);
       if(Math.abs(screen.x)>1||Math.abs(screen.y)>1)continue;
       const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(screen.x,screen.y),view.camera);
       const hit=ray.intersectObjects(meshes,false).find(h=>visible(h.object));
       if(hit&&part(hit.object)===group){out.push({context,role:group.userData.hornRole,actor:mesh.userData.actorId,x:r.left+(screen.x*.5+.5)*r.width,y:r.top+(-screen.y*.5+.5)*r.height});return;}
      }
     });
    });
   }return out;
  };
 });
}

test('physical servo inventory stays fixed and independent of configuration',{
 skip:!process.env.DUCK_PREPARATION_TEST,timeout:120000,
},async t=>{
 const dir=await mkdtemp(join(tmpdir(),'letsduck-preparation-'));let server,browserServer,browser,context,pid,video,serverError='';
 try{
  server=spawn('python3',['tests/assembly/fixtures/preparation_server.py','--db',join(dir,'personal.db')],{stdio:['ignore','pipe','pipe']});
  server.stderr.on('data',chunk=>{serverError+=chunk;});
  const lines=createInterface({input:server.stdout});
  const info=await Promise.race([once(lines,'line').then(([line])=>JSON.parse(line)),once(server,'exit').then(()=>{throw Error(serverError);})]);
  lines.close();
  browserServer=await chromium.launchServer({headless:false});pid=browserServer.process().pid;browser=await chromium.connect(browserServer.wsEndpoint());
  const videoDir=process.env.ASSEMBLY_EVIDENCE_DIR?join(process.env.ASSEMBLY_EVIDENCE_DIR,'video'):null;if(videoDir)await mkdir(videoDir,{recursive:true});
  context=await browser.newContext({viewport:{width:1400,height:1040},...(videoDir?{recordVideo:{dir:videoDir,size:{width:1400,height:1040}}}:{})});const page=await context.newPage(),errors=[];video=page.video();
  page.on('pageerror',e=>errors.push(e.message));
  const api=async body=>{const r=await fetch(info.url+'/api/servo-preparation',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});assert.equal(r.status,200);return r.json();};
  const shot=async name=>{if(!process.env.ASSEMBLY_EVIDENCE_DIR)return;await mkdir(process.env.ASSEMBLY_EVIDENCE_DIR,{recursive:true});await page.screenshot({path:join(process.env.ASSEMBLY_EVIDENCE_DIR,name+'.png')});};
  await page.goto(info.url+'/assemble/');await page.waitForFunction(()=>window.anklePrototype?.servo?.historyLoaded);
  await t.test('setup reflects persisted gaps without changing firmware status',async()=>{
   await page.locator('#servo-open').click();
   await page.waitForFunction(()=>window.anklePrototype.servo.models?.draws>0);
   const png=PNG.sync.read(await page.locator('#sv-viewport').screenshot());let modelPixels=0;
   for(let i=0;i<png.data.length;i+=4)if(png.data[i]<220&&png.data[i+1]<220&&png.data[i+2]<220)modelPixels++;
   assert.ok(modelPixels>3000,'the actual duck geometry must remain visible');
   assert.equal(await page.locator('.sv-slot[data-id="14"]').getAttribute('data-pick-state'),'picked');
   assert.equal(await page.locator('.sv-slot[data-id="24"]').getAttribute('data-pick-state'),'installed');
   assert.equal(await page.locator('.sv-slot[data-id="11"]').getAttribute('data-status'),'verified');
   assert.equal(await page.locator('.sv-slot[data-id="10"]').getAttribute('data-status'),'review');
   assert.deepEqual(await page.locator('.sv-slot').evaluateAll(els=>els.map(el=>Number(el.dataset.id))),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
   await page.locator('.sv-slot[data-id="32"]').click();
   assert.match(await page.locator('#sv-panel .servo-leads').innerText(),/线材规格待核定/);
   assert.match(await page.locator('#sv-panel .servo-leads').innerText(),/3 只需长 AMP 线/);
   await page.locator('#sv-arrange').click();
   assert.equal(await page.evaluate(()=>window.anklePrototype.servo.models.available),13);
   await shot('setup-fixed-slots');await page.locator('#sv-close').click();
  });
  await t.test('tutorial uses the same fixed tray and explicit physical declarations',async()=>{
   const originalHistory=await fetch(info.url+'/api/servo-setup/records').then(r=>r.json());
   await api({ids:[14,24],state:'available'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.servo?.historyLoaded);
   if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();
   const go=async id=>{const n=STEPS.findIndex(s=>s.id===id);assert.ok(n>=0);await page.locator('#full-saved-step').evaluate((el,n)=>{el.value=n;document.getElementById('full-saved-progress').value=1;el.dispatchEvent(new Event('change'));},n);await page.waitForFunction(n=>window.anklePrototype.state.step===n,n);};
   const openParts=async ids=>{if(await page.locator('#kit').isVisible())await page.locator('#kit-go').click();await page.locator('#instruction-toggle').click();const values=ids.split(',');for(const id of values)assert.equal(await page.locator(`[data-servo-ids="${id}"]`).count(),1);await page.locator(`[data-servo-ids="${values[0]}"]`).click();};
   const records=async()=>new Map((await api()).records.map(r=>[r.id,r.state]));
   await go('r-prepare');await openParts('14');
   assert.equal(await page.locator('#servo-pickup').isVisible(),true);
   assert.match(await page.locator('#sp-position').innerText(),/第 1 排.*第 5 格/);
   assert.deepEqual(await page.locator('.sp-slot').evaluateAll(els=>els.map(el=>Number(el.dataset.id))),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
   assert.equal(await page.locator('.sp-slot.long').count(),0,'unverified head servos are not guessed to be long-cable units');
   const anchor=await page.locator('#sp-model-label').boundingBox();assert.ok(anchor);
   await page.locator('#sp-close').click();await page.mouse.click(anchor.x+anchor.width/2,anchor.y+anchor.height/2+20);
   assert.equal(await page.locator('#servo-pickup').isVisible(),true,'clicking the actual 3D servo opens the same map');
   assert.match(await page.locator('#sp-id').innerText(),/14/);
   await page.locator('#sp-close').click();await installHornProbe(page);
   await go('r-horn');await page.locator('#full-saved-progress').evaluate(el=>{el.value=0;el.dispatchEvent(new Event('change'));});
   await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition&&window.__discPoints().some(p=>p.context==='main'&&p.role==='secondary'));
   const hornPoint=await page.evaluate(()=>window.__discPoints().find(p=>p.context==='main'&&p.role==='secondary'));
   await page.mouse.click(hornPoint.x,hornPoint.y);
   assert.equal(await page.locator('#part-tooltip').getAttribute('data-horn'),'secondary','direct horn identification remains available alongside servo pickup');
   assert.equal(await page.locator('#part-name').innerText(),'副舵盘');
   assert.equal(await page.locator('#servo-pickup').isHidden(),true,'a horn click must identify its disc, without opening the servo tray');
   await shot('tutorial-horn-identification');await page.locator('#part-close').click();
   await go('r-prepare');await openParts('14');
   await shot('tutorial-locate-14');
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(14),'picked');
   assert.equal(await page.locator('.sp-slot[data-id="14"]').getAttribute('data-slot'),'4');
   assert.equal(await page.locator('.sp-slot[data-id="14"] svg').count(),0);
   await shot('tutorial-taken-14');await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded);
   assert.equal((await records()).get(14),'picked');
   await go('r-prepare');await openParts('14');await page.locator('#sp-return').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(14),'available');
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   await go('r-tighten');
   await page.locator('#full-saved-progress').evaluate(el=>{el.value=.99;el.dispatchEvent(new Event('change'));});
   await page.locator('#pause').click();await page.waitForFunction(()=>window.anklePrototype.state.progress===1);
   assert.equal((await records()).get(14),'picked','animation completion cannot install a physical part');
   assert.match(await page.locator('#next').innerText(),/已装好/);await page.locator('#next').click();
   await page.waitForFunction(()=>window.anklePrototype.state.stepId==='r-ankle-done');
   assert.equal((await records()).get(14),'installed');
   await page.locator('#back').click();assert.equal((await records()).get(14),'installed','backtracking cannot replenish inventory');
   const beforeAuto=[...(await records())];await page.locator('#autoplay').click();
   if(await page.locator('#kit').isVisible())await page.locator('#kit-go').click();
   await page.waitForFunction(()=>window.anklePrototype.state.step>=2);await page.locator('#autoplay').click();
   assert.deepEqual([...(await records())],beforeAuto,'automatic lesson transitions never declare physical assembly');
   await go('r-pair');await openParts('12,13');
   assert.deepEqual(await page.locator('.sp-slot.needed').evaluateAll(els=>els.map(el=>Number(el.dataset.id))),[12,13]);
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.match(await page.locator('#sp-id').innerText(),/13/);
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(12),'picked');assert.equal((await records()).get(13),'picked');
   await shot('tutorial-pair-taken');await go('r-leg-done');await page.locator('#next').click();
   await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(12),'installed');assert.equal((await records()).get(13),'installed');
   await go('l-tighten');await page.locator('#next').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(24),'installed','normal next does not require a separate pickup confirmation');
   await go('t-pair');await openParts('10,20');
   await page.locator('.sp-slot[data-id="20"]').click();
   await page.route('**/api/servo-preparation',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Fixture save failed'})}):route.continue());
   await page.locator('#sp-take').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.match(await page.locator('#sp-error').innerText(),/Fixture save failed/);
   assert.equal((await records()).get(20),undefined,'failed save cannot create a false empty slot');
   assert.equal(await page.locator('.sp-slot[data-id="20"]').getAttribute('data-state'),'available');
   await page.unroute('**/api/servo-preparation');
   await go('l-leg-done');
   await page.route('**/api/servo-preparation',route=>route.request().method()==='POST'?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Fixture install failed'})}):route.continue());
   await page.locator('#next').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal(await page.evaluate(()=>window.anklePrototype.state.stepId),'l-leg-done','failed save cannot advance the tutorial');
   assert.equal((await records()).get(22),undefined);assert.equal((await records()).get(23),undefined);
   await page.unroute('**/api/servo-preparation');await page.locator('#next').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(22),'installed');assert.equal((await records()).get(23),'installed');
   assert.deepEqual(await fetch(info.url+'/api/servo-setup/records').then(r=>r.json()),originalHistory);
   await api({ids:[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34],state:'installed'});
   await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded);
   assert.match(await page.locator('#sp-summary').innerText(),/全部取用/);
   await shot('tutorial-all-used');
   await page.locator('#desk-toggle').click();await go('r-prepare');await page.locator('#step-materials').click();
   await page.locator('#kit-parts button').filter({hasText:'舵机'}).first().click();
   assert.equal(await page.locator('#servo-pickup').isVisible(),true,'desk-mode chapter parts use the same pickup map');
   assert.match(await page.locator('#sp-id').innerText(),/14/);await shot('tutorial-desk-pickup');
   await page.locator('#sp-return').click();await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);
   assert.equal((await records()).get(14),'available','putting an installed unit back restores only its fixed slot');
   assert.equal(await page.locator('.sp-slot[data-id="14"]').getAttribute('data-slot'),'4');
  });
  await t.test('pending saves respect newer navigation and deliberate part selection',async()=>{
   await api({ids:[12,13,14],state:'picked'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded);
   if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();
   const go=async id=>{await page.locator('#full-saved-step').evaluate((el,n)=>{el.value=n;document.getElementById('full-saved-progress').value=1;el.dispatchEvent(new Event('change'));},STEPS.findIndex(s=>s.id===id));};
   const delay=async fail=>{let release,started;const hold=new Promise(r=>release=r),entered=new Promise(r=>started=r);await page.route('**/api/servo-preparation',async route=>{if(route.request().method()!=='POST')return route.continue();started();await hold;return fail?route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Delayed fixture failure'})}):route.continue();});return{release,entered};};
   await go('r-tighten');let request=await delay(false);await page.locator('#next').click();await request.entered;await page.locator('#back').click();request.release();
   await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);assert.equal(await page.evaluate(()=>window.anklePrototype.state.stepId),'r-axle','saved installation must not advance a later navigation');
   await page.unroute('**/api/servo-preparation');await api({ids:[14],state:'picked'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded);
   await go('r-tighten');request=await delay(true);await page.locator('#next').click();await request.entered;await go('t-pair');request.release();
   await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);assert.equal(await page.evaluate(()=>window.anklePrototype.state.stepId),'t-pair');assert.equal(await page.locator('#servo-pickup').isHidden(),true,'a stale failure must not reopen the old part in a new chapter');
   await page.unroute('**/api/servo-preparation');await api({ids:[12,13],state:'available'});await page.reload();await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded);
   await go('r-pair');if(await page.locator('#kit').isVisible())await page.locator('#kit-go').click();await page.locator('#instruction-toggle').click();await page.locator('[data-servo-ids="12"]').click();
   request=await delay(false);await page.locator('#sp-take').click();await request.entered;await page.locator('.sp-slot[data-id="20"]').click();request.release();
   await page.waitForFunction(()=>!window.anklePrototype.preparation.saving);assert.match(await page.locator('#sp-id').innerText(),/20/,'finishing an earlier pickup must preserve the newer explicit selection');
   await page.unroute('**/api/servo-preparation');
  });
  assert.deepEqual(errors,[]);
 }finally{
  await context?.close();if(video)await video.saveAs(join(process.env.ASSEMBLY_EVIDENCE_DIR,'pickup-flow.webm'));await browser?.close();await browserServer?.close();
  if(pid)assert.throws(()=>process.kill(pid,0),'owned browser process must exit');
  if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}
  await rm(dir,{recursive:true,force:true});
 }
});

test('historical servo records can finish confirmed multi-lead preparation without firmware writes',{
 skip:!process.env.DUCK_PREPARATION_TEST,timeout:60000,
},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'letsduck-lead-ready-'));let server,browserServer,browser,context,pid;
 try{
  server=spawn('python3',['tests/assembly/fixtures/preparation_server.py','--db',join(dir,'personal.db'),'--confirmed-leads'],{stdio:['ignore','pipe','ignore']});
  const lines=createInterface({input:server.stdout}),[line]=await once(lines,'line'),info=JSON.parse(line);lines.close();
  browserServer=await chromium.launchServer({headless:false});pid=browserServer.process().pid;browser=await chromium.connect(browserServer.wsEndpoint());context=await browser.newContext({viewport:{width:1400,height:1040}});const page=await context.newPage();
  await page.route('**/assemble/servo-leads.json',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(info.catalog)}));
  const history=await fetch(info.url+'/api/servo-setup/records').then(r=>r.json());
  await page.goto(info.url+'/assemble/');await page.waitForFunction(()=>window.anklePrototype?.servo?.historyLoaded);
  await page.evaluate(()=>{const banner=document.createElement('div');banner.textContent='隔离测试数据：示例线长不作为实物接线指引';Object.assign(banner.style,{position:'fixed',top:'0',right:'0',zIndex:'9999',background:'#fff0db',padding:'8px',fontSize:'12px'});document.body.append(banner);});
  await page.locator('#servo-open').click();await page.locator('.sv-slot[data-id="11"]').click();
  assert.equal(await page.locator('[data-action="prepared-next"]').count(),1,'a verified historical servo needs a preparation-only action');
  const writes=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/servo-setup/'))writes.push(r.url());});
  await page.locator('[data-action="prepared-next"]').click();await page.waitForFunction(()=>window.anklePrototype.preparation.counts.prepared===1);
  const stored=await fetch(info.url+'/api/servo-preparation').then(r=>r.json());assert.deepEqual(stored.records.find(r=>r.id===11).preparedLeads,['fixture-a','fixture-b']);
  assert.deepEqual(await fetch(info.url+'/api/servo-setup/records').then(r=>r.json()),history);assert.deepEqual(writes,[]);
 }finally{await context?.close();await browser?.close();await browserServer?.close();if(pid)assert.throws(()=>process.kill(pid,0));if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}await rm(dir,{recursive:true,force:true});}
});
