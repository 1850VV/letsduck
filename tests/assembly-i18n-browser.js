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
let browser,context,page,guide;
const processes=()=>execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).split('\n').map(line=>{const m=/^\s*(\d+)\s+(\d+)\s+(.+)$/.exec(line);return m&&{pid:+m[1],ppid:+m[2],cmd:m[3]};}).filter(Boolean);
try{
 browser=await chromium.launch({headless:false,args:['--mute-audio']});
 const rows=processes(),owned=new Set([process.pid]);
 for(let round=0;round<5;round++)for(const row of rows)if(owned.has(row.ppid))owned.add(row.pid);
 report.ownedPids=rows.filter(r=>owned.has(r.pid)&&/chrome|chromium/i.test(r.cmd)).map(r=>r.pid);
 context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-US',recordVideo:{dir:output+'/video',size:{width:960,height:670}}});
 page=await context.newPage();const localeRequests=[];page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',error=>report.errors.push(error.stack||error.message));
 page.on('request',request=>{
  const url=request.url();if(url.includes('/assemble/locales/'))localeRequests.push(url);
  if(/^https?:/.test(url)&&new URL(url).origin!==new URL(base).origin)report.externalRequests.push(url);
 });
 await page.goto(base+'/assemble/');await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',undefined,{timeout:90000});guide=page.frame({name:'personal-assemble'});await guide.waitForSelector('#assembly-language',{state:'attached',timeout:5000});await guide.waitForFunction(()=>window.anklePrototype?.state.ready,undefined,{timeout:90000});
 await guide.waitForFunction(()=>document.documentElement.dataset.assemblyLocale);
 const first=[...new Set(localeRequests.map(u=>new URL(u).pathname.split('/').at(-1)))];
 assert.equal(first.length,1,'first visit downloads only the active assembly corpus');report.firstLocaleModules=first;
 const choose=async locale=>{await guide.selectOption('#assembly-language',locale);await guide.waitForFunction(locale=>document.documentElement.dataset.assemblyLocale===(locale==='auto'?'en':locale),locale);};
 // Let the existing personal shell finish warming the paint page and its initial draft.
 // A real draft change intentionally restores a different progress scope; it is not a locale switch.
 await page.waitForFunction(()=>document.querySelector('iframe[name="personal-paint"]')?.contentDocument?.documentElement.dataset.pageReady==='true',undefined,{timeout:90000});
 // Use the actual drawer and the stable real step ID, not a synthetic test controller.
 await guide.click('#sequence-open');await guide.selectOption('#phase-select select','8');
 const headIndex=await guide.evaluate(async()=>{const {STEPS}=await import('/assemble/hardware-state.mjs');return STEPS.findIndex(s=>s.id==='head-yaw-wire');});
 await guide.click(`#step-list [data-step="${headIndex}"]`);
 assert.equal(await guide.inputValue('#phase-select select'),'8','localized chapter retains the real picker value');
 await page.waitForTimeout(6000);
 if(await guide.locator('#pause').isVisible())await guide.click('#pause');
 await guide.locator('#confirm-built').check();
 const chip=guide.locator('#needed-parts button').first(),actorId=(await chip.getAttribute('id')).replace('part-chip-','');await chip.click();
 const before=await guide.evaluate(()=>({state:window.anklePrototype.state,storage:Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='dd-locale'))}));
 for(const locale of localeCodes){
  await choose(locale);const copy=await loadAssemblyLocale(locale),id=before.state.stepId;
  assert.equal(await guide.textContent('#step-title'),isolateTechnical(copy.steps[id].title,locale));
  assert.equal(await guide.textContent('#step-description'),isolateTechnical(copy.steps[id].text,locale));
  assert.ok((await guide.textContent('#step-check')).startsWith(isolateTechnical(copy.steps[id].check,locale)));
  const current=await guide.evaluate(()=>window.anklePrototype.state);
  assert.equal(await guide.inputValue('#phase-select select'),'8');assert.equal(current.stepId,id);assert.equal(current.progress,before.state.progress);assert.deepEqual(current.camera,before.state.camera);
  assert.equal(await guide.locator('#confirm-built').isChecked(),true);
  assert.equal(await guide.textContent('#part-name'),isolateTechnical(copy.actors[actorId].label,locale));
  assert.deepEqual(await guide.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([key])=>key!=='dd-locale'))),before.storage);
  if(!['zh-Hans','zh-Hant','ja'].includes(locale)){
   const ui=await guide.locator('.workspace').innerText();assert.equal(/[\u3400-\u9fff]/u.test(ui),false,locale+' visible fallback');
   const names=await guide.locator('[aria-label]').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length&&!n.closest('[data-brand-slot]')).map(n=>n.getAttribute('aria-label')).join('\n'));
   assert.equal(/[\u3400-\u9fff]/u.test(names),false,locale+' accessibility fallback');
  }
  report.cases.push({locale,step:id,copy:true,position:true,physicalConfirmation:true});
 }
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:1000});
  for(const locale of ['zh-Hans','en','de','ar']){
   await choose(locale);await page.waitForTimeout(350);
   const bounds=await guide.evaluate(()=>{
    const b=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};};
    return{viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,player:b(document.querySelector('.player-bar')),panel:b(document.querySelector('.instruction-column')),canvasTransform:getComputedStyle(document.querySelector('#canvas-host canvas')).transform,dir:document.documentElement.dir};
   });
   assert.ok(bounds.scrollWidth<=width+1,locale+' horizontal overflow');assert.ok(bounds.player.bottom<=bounds.viewport.height+1);
   assert.ok(bounds.player.y>=0&&bounds.player.height>0);assert.equal(bounds.canvasTransform,'none');
   assert.equal(bounds.dir,locale==='ar'?'rtl':'ltr');
   const content=guide.locator('#instruction-content');const scrollEnd=await content.evaluate(el=>{el.scrollTop=el.scrollHeight;return{top:el.scrollTop,max:el.scrollHeight-el.clientHeight};});assert.ok(scrollEnd.top>=scrollEnd.max-1);if(width===390)assert.ok(scrollEnd.max>0);
   await page.screenshot({path:`${output}/${locale}-${width}-scroll.png`});
   await content.evaluate(el=>{el.scrollTop=0;});
   await page.screenshot({path:`${output}/${locale}-${width}.png`});
   report.cases.push({locale,width,bounds,playerReachable:true,scroll:true,scrollEnd});
  }
 }
 await choose('de');await guide.click('#sequence-open');await guide.locator('#sequence-close').focus();await page.keyboard.press('Escape');
 assert.equal(await guide.evaluate(()=>document.activeElement.id),'sequence-open');
 await guide.click('#instruction-toggle');const compact=await guide.getAttribute('#instruction-toggle','aria-expanded');
 await choose('ar');assert.equal(await guide.getAttribute('#instruction-toggle','aria-expanded'),compact);
 await guide.click('#instruction-toggle');await guide.click('#source-step');
 const source=await guide.evaluate(()=>({open:document.querySelector('#reference-panel').open,src:document.querySelector('#reference-video').currentSrc}));
 assert.equal(source.open,true);assert.match(source.src,/full-head\.mp4/);
 const videoTime=await guide.locator('#reference-video').evaluate(video=>video.currentTime);
 await guide.evaluate(async()=>{const {setLocale}=await import('/shared/i18n.mjs');setLocale('en');});
 await guide.waitForFunction(()=>document.documentElement.dataset.assemblyLocale==='en');
 assert.equal(await guide.locator('#reference-panel').evaluate(panel=>panel.open),true);
 assert.ok(await guide.locator('#reference-video').evaluate(video=>video.currentTime)>=videoTime-.1);
 await page.keyboard.press('Escape');await guide.waitForFunction(()=>!document.querySelector('#reference-panel').open&&document.querySelector('#reference-video').paused);
 await guide.evaluate(async()=>{const {setLocale}=await import('/shared/i18n.mjs');setLocale('de');setLocale('ar');setLocale('en');});
 await guide.waitForFunction(()=>document.documentElement.dataset.assemblyLocale==='en');
 await choose('ar');await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',undefined,{timeout:90000});guide=page.frame({name:'personal-assemble'});await guide.waitForFunction(()=>window.anklePrototype?.state.ready&&document.documentElement.dataset.assemblyLocale==='ar',undefined,{timeout:90000});
 assert.equal(await guide.locator('#confirm-built').isChecked(),true);
 await choose('auto');await guide.waitForFunction(()=>document.documentElement.dataset.assemblyLocale==='en');
 assert.equal(await guide.evaluate(()=>localStorage.getItem('dd-locale')),null);
 assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.errors,[]);
 report.keyboard=true;report.race=true;report.refresh=true;report.source=source;report.ok=true;
}catch(error){report.ok=false;report.failure=error.stack;await page?.screenshot({path:output+'/failed.png'}).catch(()=>{});throw error;}
finally{
 const all=processes(),descendants=new Set([process.pid,...report.ownedPids]);
 for(let round=0;round<6;round++)for(const row of all)if(descendants.has(row.ppid))descendants.add(row.pid);
 report.ownedPids=[...new Set([...report.ownedPids,...all.filter(row=>descendants.has(row.pid)&&/chrome|chromium|ffmpeg/i.test(row.cmd)).map(row=>row.pid)])];
 await context?.close();await browser?.close();
 await new Promise(resolve=>setTimeout(resolve,600));
 const live=new Set(processes().map(p=>p.pid));report.processCleanup=report.ownedPids.every(pid=>!live.has(pid));
 await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,cases:report.cases.length,failure:report.failure,processCleanup:report.processCleanup},null,2));
}
