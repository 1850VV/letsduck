// Run against the assigned temporary personal database service, never a real personal library.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {loadAssemblyLocale,isolateTechnical} from '../frontend/assemble/assembly-i18n.mjs';
const base=process.env.DUCK_I18N_URL||'http://127.0.0.1:8909';
const output='output/playwright/opt-g-i18n-1024';await fs.mkdir(output,{recursive:true});
const localeCodes=['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi'];
const report={base,session:'opt-g-i18n-1024',cases:[],errors:[],externalRequests:[],ownedPids:[]};
let browser,context;
const processes=()=>execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).split('\n').map(line=>{const m=/^\s*(\d+)\s+(\d+)\s+(.+)$/.exec(line);return m&&{pid:+m[1],ppid:+m[2],cmd:m[3]};}).filter(Boolean);
try{
 browser=await chromium.launch({headless:true});
 const rows=processes(),owned=new Set([process.pid]);
 for(let round=0;round<5;round++)for(const row of rows)if(owned.has(row.ppid))owned.add(row.pid);
 report.ownedPids=rows.filter(r=>owned.has(r.pid)&&/chrome|chromium/i.test(r.cmd)).map(r=>r.pid);
 context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:output+'/video',size:{width:960,height:670}}});
 const page=await context.newPage(),localeRequests=[];page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('request',request=>{
  const url=request.url();if(url.includes('/assemble/locales/'))localeRequests.push(url);
  if(/^https?:/.test(url)&&new URL(url).origin!==new URL(base).origin)report.externalRequests.push(url);
 });
 await page.goto(base+'/assemble/');await page.waitForSelector('#assembly-language',{state:'attached',timeout:5000});await page.waitForFunction(()=>window.anklePrototype?.state.ready,undefined,{timeout:90000});
 await page.waitForFunction(()=>document.documentElement.dataset.assemblyLocale);
 const first=[...new Set(localeRequests.map(u=>new URL(u).pathname.split('/').at(-1)))];
 assert.equal(first.length,1,'first visit downloads only the active assembly corpus');report.firstLocaleModules=first;
 const choose=async locale=>{await page.selectOption('#assembly-language',locale);await page.waitForFunction(locale=>document.documentElement.dataset.assemblyLocale===locale,locale);};
 // Use the actual drawer and the stable real step ID, not a synthetic test controller.
 await page.click('#sequence-open');await page.selectOption('#phase-select select','8');
 const headIndex=await page.evaluate(async()=>{const {STEPS}=await import('/assemble/hardware-state.mjs');return STEPS.findIndex(s=>s.id==='head-yaw-wire');});
 await page.click(`#step-list [data-step="${headIndex}"]`);
 await page.waitForTimeout(6000);
 if(await page.locator('#pause').isVisible())await page.click('#pause');
 await page.locator('#confirm-built').check();
 const chip=page.locator('#needed-parts button').first(),actorId=(await chip.getAttribute('id')).replace('part-chip-','');await chip.click();
 const before=await page.evaluate(()=>({state:window.anklePrototype.state,storage:Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='dd-locale'))}));
 for(const locale of localeCodes){
  await choose(locale);const copy=await loadAssemblyLocale(locale),id=before.state.stepId;
  assert.equal(await page.textContent('#step-title'),isolateTechnical(copy.steps[id].title,locale));
  assert.equal(await page.textContent('#step-description'),isolateTechnical(copy.steps[id].text,locale));
  assert.ok((await page.textContent('#step-check')).startsWith(isolateTechnical(copy.steps[id].check,locale)));
  const current=await page.evaluate(()=>window.anklePrototype.state);
  assert.equal(current.stepId,id);assert.equal(current.progress,before.state.progress);assert.deepEqual(current.camera,before.state.camera);
  assert.equal(await page.locator('#confirm-built').isChecked(),true);
  assert.equal(await page.textContent('#part-name'),isolateTechnical(copy.actors[actorId].label,locale));
  assert.deepEqual(await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='dd-locale'))),before.storage);
  if(!['zh-Hans','zh-Hant','ja'].includes(locale)){
   const ui=await page.locator('.workspace').innerText();assert.equal(/[\u3400-\u9fff]/u.test(ui),false,locale+' visible fallback');
   const names=await page.locator('[aria-label]').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>n.getAttribute('aria-label')).join('\n'));
   assert.equal(/[\u3400-\u9fff]/u.test(names),false,locale+' accessibility fallback');
  }
  report.cases.push({locale,step:id,copy:true,position:true,physicalConfirmation:true});
 }
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  for(const locale of ['zh-Hans','en','de','ar']){
   await choose(locale);await page.waitForTimeout(350);
   const bounds=await page.evaluate(()=>{
    const b=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    return{viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,player:b(document.querySelector('.player-bar')),panel:b(document.querySelector('.instruction-column')),canvasTransform:getComputedStyle(document.querySelector('#canvas-host canvas')).transform,dir:document.documentElement.dir};
   });
   assert.ok(bounds.scrollWidth<=width+1,locale+' horizontal overflow');assert.ok(bounds.player.bottom<=bounds.viewport.height+1);
   assert.ok(bounds.player.y>=0&&bounds.player.height>0);assert.equal(bounds.canvasTransform,'none');
   assert.equal(bounds.dir,locale==='ar'?'rtl':'ltr');
   const content=page.locator('#instruction-content');await content.evaluate(el=>{el.scrollTop=el.scrollHeight;});
   await page.screenshot({path:`${output}/${locale}-${width}-scroll.png`});
   await content.evaluate(el=>{el.scrollTop=0;});
   await page.screenshot({path:`${output}/${locale}-${width}.png`});
   report.cases.push({locale,width,bounds,playerReachable:true,scroll:true});
  }
 }
 await choose('de');await page.click('#sequence-open');await page.locator('#sequence-close').focus();await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'sequence-open');
 await page.click('#instruction-toggle');const compact=await page.getAttribute('#instruction-toggle','aria-expanded');
 await choose('ar');assert.equal(await page.getAttribute('#instruction-toggle','aria-expanded'),compact);
 await page.click('#instruction-toggle');await page.click('#source-step');
 const source=await page.evaluate(()=>({open:document.querySelector('#reference-panel').open,src:document.querySelector('#reference-video').currentSrc}));
 assert.equal(source.open,true);assert.match(source.src,/full-head\.mp4/);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.querySelector('#reference-video').paused),true);
 await page.evaluate(async()=>{const {setLocale}=await import('/shared/i18n.mjs');setLocale('de');setLocale('ar');setLocale('en');});
 await page.waitForFunction(()=>document.documentElement.dataset.assemblyLocale==='en');
 await choose('ar');await page.reload();await page.waitForFunction(()=>window.anklePrototype?.state.ready&&document.documentElement.dataset.assemblyLocale==='ar',undefined,{timeout:90000});
 assert.equal(await page.locator('#confirm-built').isChecked(),true);
 assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.errors,[]);
 report.keyboard=true;report.race=true;report.refresh=true;report.source=source;report.ok=true;
}catch(error){report.ok=false;report.failure=error.stack;throw error;}
finally{
 await context?.close();await browser?.close();
 await new Promise(resolve=>setTimeout(resolve,600));
 const live=new Set(processes().map(p=>p.pid));report.processCleanup=report.ownedPids.every(pid=>!live.has(pid));
 await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,cases:report.cases.length,failure:report.failure,processCleanup:report.processCleanup},null,2));
}
