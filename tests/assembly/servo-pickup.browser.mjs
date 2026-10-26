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

test('physical servo inventory stays fixed and independent of configuration',{
 skip:!process.env.DUCK_PREPARATION_TEST,timeout:120000,
},async t=>{
 const dir=await mkdtemp(join(tmpdir(),'letsduck-preparation-'));let server,browserServer,browser,context,pid,serverError='';
 try{
  server=spawn('python3',['tests/assembly/fixtures/preparation_server.py','--db',join(dir,'personal.db')],{stdio:['ignore','pipe','pipe']});
  server.stderr.on('data',chunk=>{serverError+=chunk;});
  const lines=createInterface({input:server.stdout});
  const info=await Promise.race([once(lines,'line').then(([line])=>JSON.parse(line)),once(server,'exit').then(()=>{throw Error(serverError);})]);
  lines.close();
  browserServer=await chromium.launchServer({headless:false});pid=browserServer.process().pid;browser=await chromium.connect(browserServer.wsEndpoint());
  context=await browser.newContext({viewport:{width:1400,height:1040}});const page=await context.newPage(),errors=[];
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
  assert.deepEqual(errors,[]);
 }finally{
  await context?.close();await browser?.close();await browserServer?.close();
  if(pid)assert.throws(()=>process.kill(pid,0),'owned browser process must exit');
  if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}
  await rm(dir,{recursive:true,force:true});
 }
});
