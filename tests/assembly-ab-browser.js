// Real local assets + managed Chromium. No everyday browser profile is used.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {STEPS,CHAPTERS,ACTORS} from '../frontend/assemble/hardware-state.mjs';
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8905';
const out=new URL('../output/playwright/optimization-ab-ui/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--mute-audio']}),result={checks:[],errors:[]};
const ownedPids=execFileSync('ps',['-axo','pid,ppid,command'],{encoding:'utf8'}).split('\n').flatMap(line=>{const m=line.match(/^\s*(\d+)\s+(\d+)\s+(.+)$/);return m&&Number(m[2])===process.pid&&/chrome|chromium|ffmpeg/i.test(m[3])?[Number(m[1])]:[];});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'zh-CN'});
 try{
  const page=await context.newPage();page.on('pageerror',error=>result.errors.push(String(error)));
  await context.addInitScript(()=>{
   window.acceptanceDraws=0;
   for(const Class of [window.WebGLRenderingContext,window.WebGL2RenderingContext])if(Class)for(const name of ['drawArrays','drawElements']){
    const original=Class.prototype[name];Class.prototype[name]=function(...args){window.acceptanceDraws++;return original.apply(this,args);};
   }
  });
  await page.goto(base+'/assemble/');
  await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:90000});
  const guide=page.frame({name:'personal-assemble'});
  await guide.waitForFunction(()=>window.anklePrototype?.state.ready,null,{timeout:90000});
  assert.equal(await guide.locator('#sequence-open').count(),1,'approved sequence drawer entry exists');
  assert.equal(await guide.locator('#instruction-dialog').count(),0,'instructions are inline, not a modal');
  assert.equal(await guide.locator('#confirm-seen').isChecked(),false);
  assert.equal(await guide.locator('#confirm-built').isChecked(),false);
  await guide.locator('#confirm-seen').check();
  await guide.locator('#confirm-built').check();
  await guide.locator('#start button').click();
  assert.equal(await guide.locator('#confirm-built').isChecked(),false,'next never confirms physical assembly');
  assert.equal(await guide.locator('#confirm-seen').isChecked(),false,'new destination is not watched');
  await guide.locator('#replay button').click();
  assert.equal(await guide.locator('#confirm-seen').isChecked(),true,'explicit replay marks the current step watched');
  await guide.locator('#confirm-seen').uncheck();
  assert.equal(await guide.locator('#confirm-built').isChecked(),false,'replay never confirms physical assembly');
  await guide.locator('#next button').click();
  assert.equal(await guide.locator('#instruction-content').evaluate(el=>el.scrollTop),0,'new step starts at its heading');
  await guide.locator('#back button').click();
  assert.equal(await guide.locator('#confirm-seen').isChecked(),true,'explicit next marked the step being left watched');
  result.checks.push('explicit confirmations independent from next and replay');
  await guide.locator('#sequence-open').click();
  assert.equal(await guide.locator('#sequence-dialog').evaluate(el=>el.open),true);
  await guide.locator('#sequence-close').focus();await page.keyboard.press('Escape');
  assert.equal(await guide.locator('#sequence-open').evaluate(el=>el===document.activeElement),true);
  await guide.locator('#instruction-toggle').click();
  assert.equal(await guide.locator('#instruction-toggle').getAttribute('aria-expanded'),'false');
  assert.equal(await guide.locator('#back').isVisible(),true);
  await guide.locator('#instruction-toggle').click();
  result.checks.push('drawer Escape returns focus; teaching panel collapses with controls reachable');
  // Every visible teaching state is driven through the real drawer and phase picker.
  const covered=[];
  for(let chapter=0;chapter<CHAPTERS.length;chapter++){
   for(let n=CHAPTERS[chapter].start;n<=CHAPTERS[chapter].end;n++){
    await guide.locator('#sequence-open').click();
    await guide.locator('#phase-select select').selectOption(String(chapter));
    await guide.locator(`#step-${n}`).click();
    assert.equal(await guide.locator('#step-title').textContent(),STEPS[n].title);
    assert.equal(await guide.locator('#step-description').textContent(),STEPS[n].text);
    assert.ok((await guide.locator('#step-check').textContent()).startsWith(STEPS[n].check));
    const groups=new Set(),labels=[];
    for(const id of STEPS[n].parts){const a=ACTORS[id];if(a.listGroup&&groups.has(a.listGroup))continue;if(a.listGroup)groups.add(a.listGroup);labels.push(a.chip||a.label.split(' · ')[0]);}
    assert.deepEqual(await guide.locator('#needed-parts button span').allTextContents(),labels);
    if([0,27,34,68,69,70,96,100,110].includes(n)){
     await guide.evaluate(()=>{const el=document.querySelector('#full-saved-progress');el.value='1';el.dispatchEvent(new Event('change'));});
     await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
     await page.screenshot({path:fileURLToPath(new URL(`step-${n}.png`,out))});
    }
    covered.push(n);
   }
  }
  assert.equal(covered.length,111);result.checks.push('14 phases / 111 steps: real drawer navigation, title, direction, checks and grouped part labels');
  const jump=async n=>{
   await guide.locator('#sequence-open').click();
   const chapter=CHAPTERS.findIndex(c=>n>=c.start&&n<=c.end);
   await guide.locator('#phase-select select').selectOption(String(chapter));await guide.locator(`#step-${n}`).click();
  };
  await jump(69);
  assert.equal(await guide.locator('#confirm-seen').isChecked(),false,'drawer jump never marks destination watched');
  assert.equal(await guide.locator('#confirm-built').isChecked(),false);
  await guide.locator('#confirm-built').check();
  await guide.locator('#replay button').click();
  assert.equal(await guide.locator('#confirm-seen').isChecked(),true);
  // Pause and seek the real animation to its end for repeatable static captures.
  await guide.evaluate(()=>{const p=document.querySelector('#full-saved-progress');p.value='1';p.dispatchEvent(new Event('change'));});
  await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
  const chip=guide.locator('#needed-parts button').first();await chip.click();
  assert.equal(await guide.locator('#part-tooltip').isVisible(),true,'part chip uses real actor selection');
  await guide.locator('#part-close').click();
  await guide.locator('#source-step button').click();
  await guide.waitForFunction(()=>document.querySelector('#reference-video').readyState>=1);
  const source=await guide.locator('#reference-video').evaluate(v=>({src:v.getAttribute('src'),time:v.currentTime}));
  assert.equal(source.src,'assets/full-head.mp4');assert.ok(Math.abs(source.time-(STEPS[69].sourceStart-768))<3,JSON.stringify(source));
  await page.keyboard.press('Escape');assert.equal(await guide.locator('#reference-panel').isVisible(),false);
  result.checks.push('head wire: real actor selection; native source dialog, correct clip/time and Escape');
  await page.setViewportSize({width:1440,height:1000});
  await chip.click();await guide.locator('#part-close').click();
  assert.equal(await guide.evaluate(()=>!!document.activeElement?.getClientRects().length&&document.activeElement!==document.body),true,'closing actor information returns focus to a visible control');
  await guide.locator('#focus-zoom-close button').click();
  await guide.waitForFunction(()=>document.querySelector('#focus-zoom').hidden);
  assert.equal(await guide.evaluate(()=>!!document.activeElement?.getClientRects().length&&document.activeElement!==document.body),true,'closing magnifier returns focus to a visible control');
  await guide.locator('#view-settings summary').click();await guide.locator('#focus-zoom-toggle button').click();await guide.locator('#view-settings summary').click();
  for(const width of [390,834,1440]){
   await page.setViewportSize({width,height:width===1440?1000:844});
   await guide.locator('#instruction-content').evaluate(el=>el.scrollTop=0);
   await guide.waitForFunction(()=>!anklePrototype.state.cameraTransition);
   const bounds=await guide.evaluate(()=>{
    const stage=document.querySelector('#stage').getBoundingClientRect();
    const controls=document.querySelector('.player-buttons').getBoundingClientRect();
    return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,stage:{x:stage.x,width:stage.width,height:stage.height},controls:{x:controls.x,right:controls.right,bottom:controls.bottom}};
   });
   assert.ok(bounds.scroll<=bounds.width,JSON.stringify(bounds));
   assert.ok(bounds.stage.height>=150,JSON.stringify(bounds));
   assert.ok(bounds.controls.x>=0&&bounds.controls.right<=bounds.width&&bounds.controls.bottom<=bounds.height,JSON.stringify(bounds));
   if(width===390)assert.ok(bounds.stage.width>=370,'mobile model spans available width');
   await page.screenshot({path:fileURLToPath(new URL(`actual-${width}.png`,out))});
   result.checks.push({viewport:width,bounds});
  }
  // One same-origin second window observes explicit checks without resetting its step.
  const second=await context.newPage();await second.goto(base+'/assemble/');
  await second.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:90000});
  const other=second.frame({name:'personal-assemble'});await other.waitForFunction(()=>window.anklePrototype?.state.ready);
  assert.equal(await other.locator('#confirm-built').isChecked(),true);
  await page.bringToFront();
  await guide.locator('#replay button').click();await guide.waitForFunction(()=>anklePrototype.state.playing&&anklePrototype.state.progress>.03);
  const playingBefore=await guide.evaluate(()=>anklePrototype.state.progress);
  await other.locator('#confirm-built').uncheck();
  await guide.waitForFunction(()=>!document.querySelector('#confirm-built').checked);
  assert.equal(await guide.evaluate(()=>anklePrototype.state.playing),true,'remote confirmation must not pause playback');
  assert.ok((await guide.evaluate(()=>anklePrototype.state.progress))>=playingBefore,'remote confirmation must not seek backwards');
  assert.equal(await other.evaluate(()=>anklePrototype.state.step),69);
  await guide.evaluate(()=>{const el=document.querySelector('#full-saved-progress');el.value='1';el.dispatchEvent(new Event('change'));});
  await guide.locator('#confirm-built').check();
  await other.waitForFunction(()=>document.querySelector('#confirm-built').checked);
  await second.close();
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:90000});
  const restored=page.frame({name:'personal-assemble'});await restored.waitForFunction(()=>window.anklePrototype?.state.ready);
  assert.equal(await restored.evaluate(()=>anklePrototype.state.step),69);assert.equal(await restored.locator('#confirm-built').isChecked(),true);
  result.checks.push('refresh and same-origin second window preserve position and independent confirmations');
  // Reopen a new context using browser storage, exactly as a persisted browser profile does.
  await context.storageState({path:fileURLToPath(new URL('browser-state.json',out))});
  assert.deepEqual(result.errors,[]);
 }finally{await context.close();}
}catch(error){result.failure=String(error.stack||error);throw error;}
finally{
 await browser.close();
 const alive=pid=>{try{process.kill(pid,0);return true;}catch{return false;}};
 for(let i=0;i<20&&ownedPids.some(alive);i++)await new Promise(resolve=>setTimeout(resolve,50));
 result.cleanup=ownedPids.map(pid=>({pid,exited:!alive(pid)}));
 await fs.writeFile(new URL('result.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 assert.ok(ownedPids.length&&result.cleanup.every(p=>p.exited),'task-owned browser processes must be identified and exit');
}
