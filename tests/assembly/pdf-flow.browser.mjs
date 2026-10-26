import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {createInterface} from 'node:readline';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {STEPS,CHAPTERS} from '../../frontend/assemble/pdf-state.mjs';
import {STEPS as old} from '../../frontend/assemble/hardware-state.mjs';

test('PDF tutorial in the actual browser, with synthetic numbering and no hardware',{
 skip:!process.env.DUCK_PDF_TEST,timeout:180000,
},async t=>{
 const evidence=process.env.ASSEMBLY_EVIDENCE_DIR||await mkdtemp(join(tmpdir(),'duck-pdf-evidence-'));
 await mkdir(evidence,{recursive:true});
 let server,browser,context,video,stderr='',url=process.env.DUCK_PDF_BEFORE_URL;
 const receipt={fixture:!url,hardware:'not connected',checks:[],errors:[],mutations:[]},at=id=>STEPS.findIndex(s=>s.id===id);
 const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
 try{
  if(!url){
   const dir=await mkdtemp(join(tmpdir(),'duck-pdf-db-'));
   server=spawn('python3',['tests/assembly/fixtures/pdf_server.py','--db',join(dir,'personal.db')],{stdio:['ignore','pipe','pipe']});
   receipt.serverPid=server.pid;server.stderr.on('data',b=>stderr+=b);
   const lines=createInterface({input:server.stdout});
   const result=await Promise.race([once(lines,'line').then(([line])=>JSON.parse(line)),once(server,'exit').then(()=>{throw Error(stderr);})]);lines.close();url=result.url;
  }
  receipt.url=url;browser=await chromium.launch({headless:false});
  const processes=execFileSync('ps',['-Ao','pid,ppid,args'],{encoding:'utf8'}).split('\n').map(line=>line.trim().split(/\s+/,3));
  receipt.browserPid=Number(processes.find(r=>Number(r[1])===process.pid&&r[2]?.includes('/chromium-'))?.[0]);
  assert.ok(Number.isInteger(receipt.browserPid)&&receipt.browserPid>0,'owned managed browser PID is recorded');
  context=await browser.newContext({viewport:{width:1440,height:1000},...(!process.env.DUCK_PDF_BEFORE_URL?{recordVideo:{dir:join(evidence,'raw'),size:{width:1008,height:700}}}:{})});
  const page=await context.newPage();video=page.video();page.on('pageerror',e=>receipt.errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET'&&new URL(r.url()).pathname.startsWith('/api/'))receipt.mutations.push({method:r.method(),path:new URL(r.url()).pathname});});
  const state=()=>page.evaluate(()=>window.anklePrototype.state);
  const shot=async name=>{await page.screenshot({path:join(evidence,name+'.png')});};
  const go=async id=>{await page.evaluate(n=>{const input=document.getElementById('full-saved-step');input.value=String(n);input.dispatchEvent(new Event('input',{bubbles:true}));},at(id));await page.waitForFunction(id=>window.anklePrototype.state.stepId===id&&!window.anklePrototype.state.cameraTransition,id);};
  const seek=async p=>{await page.evaluate(p=>{const el=document.getElementById('full-saved-progress');el.value=String(p);el.dispatchEvent(new Event('change',{bubbles:true}));},p);await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition&&!window.anklePrototype.state.backTransition);};
  if(!process.env.DUCK_PDF_BEFORE_URL)await page.addInitScript(({step,total})=>{if(!localStorage.getItem('letsduck-assembly'))localStorage.setItem('letsduck-assembly',JSON.stringify({step,total,camera:[1,2,3],target:[4,5,6]}));localStorage.setItem('letsduck-assemble-desk','off');},{step:old.findIndex(s=>s.id==='r-foot'),total:old.length});
  await page.goto(url+'/assemble/');await page.waitForFunction(()=>window.anklePrototype?.state.ready,{timeout:45000});
  if(process.env.DUCK_PDF_BEFORE_URL){await shot('before-existing-app');receipt.before=await state();assert.equal(receipt.before.totalChapters,26,'existing app has not yet adopted the PDF flow');return;}
  const check=async(name,run)=>t.test(name,async()=>{await run();receipt.checks.push(name);});
  await check('legacy saved action survives the reorder, while stale camera is discarded',async()=>{
   const s=await state();assert.equal(s.stepId,'r-foot');assert.notDeepEqual(s.camera,[1,2,3]);
   assert.equal(await page.locator('#phase-select option').count(),26);
   assert.deepEqual(await page.locator('#phase-select option').allTextContents(),CHAPTERS.map((c,i)=>`${i+1} · ${c.name}`));
  });
  await check('base-first chapter is visible without future feet, head or boards',async()=>{
   await go('t-support');await seek(1);const s=await state();assert.equal(s.actors.t_support.visible,true);
   for(const id of ['foot','r_upperMotor','h_shell','h_motor32','f_uno'])assert.equal(s.actors[id].visible,false,id);
   const image=PNG.sync.read(await page.locator('#canvas-host').screenshot());let pixels=0;
   for(let i=0;i<image.data.length;i+=4)if(Math.max(image.data[i],image.data[i+1],image.data[i+2])-Math.min(image.data[i],image.data[i+1],image.data[i+2])>30)pixels++;
   assert.ok(pixels>1000,'real model is drawn');await shot('01-base-first');
  });
  await check('real chapter chooser and step button navigate the PDF sequence',async()=>{
   await page.locator('#phase-select select').selectOption(String(CHAPTERS.findIndex(c=>c.pdfPage===10)));
   await page.waitForFunction(()=>window.anklePrototype.state.stepId==='r-prepare');
   await page.locator('#step-'+at('r-shank')).click();await page.waitForFunction(()=>window.anklePrototype.state.stepId==='r-shank');
  });
  await check('scrubbing forward/back keeps the installed linkage fixed and moves ID14',async()=>{
   await go('r-shank');await seek(0);const a=await state();await seek(1);const b=await state();
   assert.deepEqual(a.actors.shank.position,b.actors.shank.position);assert.notDeepEqual(a.actors.motor.position,b.actors.motor.position);
   const slider=await page.locator('#motion-progress input').boundingBox();
   for(const fraction of [.2,.9,.3]){
    await page.mouse.move(slider.x+slider.width*fraction,slider.y+slider.height/2);await page.mouse.down();await page.mouse.up();
    assert.ok(Math.abs((await state()).progress-fraction)<.05,'actual pointer moves the action scrubber');
   }
   await seek(.45);await shot('02-servo14-install');await page.locator('#back').click();await page.waitForFunction(()=>!window.anklePrototype.state.backTransition);
   assert.equal((await state()).stepId,'r-wire-a');
  });
  await check('head32 is wired before its supports and head33 before its bearings',async()=>{
   await go('head-yaw-wire');await seek(1);const s=await state();assert.equal(s.actors.h_motor32.visible,true);assert.equal(s.actors.h_pitchSupport.visible,false);await shot('03-prewire32');
   await go('head-core-horn-wire');await seek(1);assert.equal((await state()).actors.h_bearingFront.visible,false);
  });
  await check('head-cover and upper-body screw quantities reach the actual materials buttons',async()=>{
   await go('head-shell-fix');await seek(1);assert.match(await page.locator('#needed-parts').innerText(),/×3/);await page.locator('#instruction-toggle').click();await shot('04-head-cover-three');await page.locator('#instruction-close').click();
   await page.locator('#step-materials').click();assert.match(await page.locator('#kit .kit-eyebrow').innerText(),/第 20 \/ 26 章/);await shot('04a-head-parts');await page.locator('#kit-go').click();
   await go('final-body-shells');await seek(1);assert.match(await page.locator('#needed-parts').innerText(),/×4/);await page.locator('#instruction-toggle').click();await shot('05-body-four');await page.locator('#instruction-close').click();
  });
  await check('mixed source videos select the right asset within a single PDF chapter',async()=>{
   await go('final-thigh-first');assert.match(await page.locator('#reference-video').getAttribute('src'),/full-final/);
   await go('final-route');assert.match(await page.locator('#reference-video').getAttribute('src'),/reference-right-leg/);
  });
  await check('random seeking and reversal never write numbering or physical inventory',async()=>{
   const before=await fetch(url+'/api/servo-preparation').then(r=>r.json());
   for(const id of ['robot-complete','r-foot','final-head-join','head-yaw-wire','t-support']){await go(id);await seek(.3);await seek(.85);}
   const after=await fetch(url+'/api/servo-preparation').then(r=>r.json());assert.deepEqual(after,before);assert.deepEqual(receipt.mutations,[]);
   await go('robot-complete');await seek(1);await shot('06-complete');
  });
  await check('numbering invalidation relocks assembly while preserving its stable bookmark and inventory',async()=>{
   await go('head-shell-fix');const before=await fetch(url+'/api/servo-preparation').then(r=>r.json());
   await fetch(url+'/api/fixture/numbering',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({missingIds:[34]})});
   await page.waitForURL('**/debug/?from=assemble');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('letsduck-assembly')));assert.equal(saved.stepId,'head-shell-fix');
   assert.deepEqual(await fetch(url+'/api/servo-preparation').then(r=>r.json()),before);
  });
  assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.mutations,[]);
 }finally{
  await writeFile(join(evidence,'checks-before-cleanup.json'),JSON.stringify(receipt,null,2));
  try{await context?.close();if(video)receipt.video=await video.path();}finally{await browser?.close();}
  if(server){server.kill('SIGTERM');await Promise.race([once(server,'exit'),new Promise(r=>setTimeout(r,2000))]);}
  receipt.browserExited=!alive(receipt.browserPid);receipt.serverExited=!server||!alive(receipt.serverPid);
  await writeFile(join(evidence,process.env.DUCK_PDF_BEFORE_URL?'before-receipt.json':'receipt.json'),JSON.stringify(receipt,null,2));
  assert.equal(receipt.browserExited,true);assert.equal(receipt.serverExited,true);
 }
});
