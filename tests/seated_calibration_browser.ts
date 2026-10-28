import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import type {Frame,Page} from 'playwright';
import {createBrowserFixture,BrowserFirmware} from './browser/fixture.js';
import {launchBrowser} from './browser/checks.js';

// Standalone real-entry acceptance: node --import tsx tests/seated_calibration_browser.ts.
// Owns temporary HTTP/DB/device fixtures and a managed Chromium; never uses a real device.
const evidence=resolve(process.env.DUCK_SEATED_EVIDENCE_DIR??resolve(import.meta.dirname,'../output/integration/seated-guide'));
await mkdir(evidence,{recursive:true});
const checks:string[]=[],errors:string[]=[],consoleErrors:string[]=[],screenshots:string[]=[];
const nativePopup=process.env.DUCK_SEATED_NATIVE_POPUP==='1';
const unverified=nativePopup?[]:['Native popup expansion, mouse/keyboard selection, Escape cancellation, focus and linked-group browser path not executed; use DUCK_SEATED_NATIVE_POPUP=1 on an unlocked desktop'];
let phase='startup';
const check=(name:string,value:unknown)=>{assert.ok(value,name);checks.push(name);};
const until=async(test:()=>boolean|Promise<boolean>,message:string,timeout=10_000)=>{
 const deadline=Date.now()+timeout;
 while(!await test()){if(Date.now()>deadline)throw Error(message);await delay(25);}
};
const fixture=await createBrowserFixture({mode:'debug',guide:true});
let browser:Awaited<ReturnType<typeof launchBrowser>>|undefined;
let failed:unknown,cleaned=false;
try{
 browser=await launchBrowser({headless:process.env.DUCK_BROWSER_HEADLESS!=='0',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 assert.ok(fixture.runtime instanceof BrowserFirmware);
 const runtime=fixture.runtime;
 const status=()=>{const value=runtime.guideStatus();assert.ok(value);return value;};
 const calls=(path:string)=>runtime.calls.filter(call=>call.path===path);
 const writes=()=>runtime.calls.filter(call=>call.method==='POST'&&call.path.startsWith('/api/guide/')&&call.path!=='/api/guide/heartbeat').length;
 const actual=(id:number)=>{const s=status();assert.ok(Array.isArray(s.actual_raw));return Number(s.actual_raw[Number(id<20?id-10:id<30?id-15:id-20)]);};
 const screenshot=async(page:Page,name:string)=>{const path=resolve(evidence,name+'.png');await page.screenshot({path,fullPage:true});screenshots.push(path);};
 const nativeChoose=async(page:Page,frame:Frame,selector:string,index:number)=>{
  const control=frame.locator(selector);await page.bringToFront();
  if(nativePopup)await control.click();else await control.focus();
  await page.keyboard.press('Home');await until(()=>control.isEnabled(),'Select did not settle after Home');
  for(let i=0;i<index;i++){await page.keyboard.press('ArrowDown');await until(()=>control.isEnabled(),'Select did not settle after arrow');}
  if(nativePopup)await page.keyboard.press('Enter');
  await until(()=>control.isEnabled(),'Native select did not become ready');
 };
 const enter=async(page:Page)=>{
  await page.goto(fixture.url+'/');await page.waitForSelector('body[data-home-ready="true"]');
  await page.locator('[data-duck="debug"]').click();
  await page.waitForSelector('#module-window:not([hidden])');
  const iframe=page.locator('#module-frame');const handle=await iframe.elementHandle();assert.ok(handle);
  const frame=await handle.contentFrame();assert.ok(frame);
  await frame.waitForSelector('body[data-model-ready="true"]');
  await frame.locator('[data-workbench="guide"]').click();await frame.waitForSelector('.seated-guide');
  return frame;
 };
 for(const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
  phase=viewport.name+'-entry';
  await fixture.debug.action({action:'release'});runtime.restore();
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
  try{
   let frame=await enter(page);
   check(viewport.name+': homepage → debug iframe → seated guide',await frame.locator('#work-title').textContent()==='坐姿找零');
   check(viewport.name+': model explicitly remains a reference',(await frame.locator('#stage-caption').textContent())?.includes('不表示实机姿态'));
   check(viewport.name+': no motion on entry',calls('/api/guide/hold').length===0&&calls('/api/guide/step').length===0);
   const root=await frame.locator('.seated-guide').elementHandle(),select=await frame.locator('#guide-scope').elementHandle(),canvas=await frame.locator('#viewport canvas').elementHandle();assert.ok(root&&select&&canvas);
   await frame.locator('#guide-capture').click();await until(()=>Promise.resolve(status().active===true),'Hold not active');
   await until(()=>frame.locator('#guide-plus').isEnabled(),'Guide controls not ready after hold');
   check(viewport.name+': fresh 15-channel baseline held',status().enabled===true&&status().raw_mask===32767);
   await frame.locator('[data-slot="13"]').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Selection did not pause cleanly');
   check(viewport.name+': joint selector is connected',(await frame.locator('#guide-selected-name').textContent())?.includes('13'));
   phase=viewport.name+'-native-select';
   if(nativePopup){
    await nativeChoose(page,frame,'#guide-scope',1);
    check(viewport.name+': native select keyboard choice',await frame.locator('#guide-scope').inputValue()==='both');
    await frame.locator('#guide-scope').click();await page.keyboard.press('ArrowDown');await page.keyboard.press('Escape');
    check(viewport.name+': native select Escape keeps module open',await page.locator('#module-window').isVisible());
    check(viewport.name+': native select Escape cancels tentative choice',await frame.locator('#guide-scope').inputValue()==='both');
    check(viewport.name+': native select preserves focus',await frame.locator('#guide-scope').evaluate(element=>element===document.activeElement));
   }
   if(nativePopup)await nativeChoose(page,frame,'#guide-scope',0);
   phase=viewport.name+'-single';
   const singleBefore=actual(13),otherBefore=actual(23);
   await frame.locator('#guide-plus').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Single step did not arrive');
   check(viewport.name+': single step uses observed actual',actual(13)===singleBefore+5&&actual(23)===otherBefore);
   await frame.locator('#guide-checkpoint').click();await until(()=>frame.locator('#guide-return-stop').isEnabled(),'Checkpoint not saved');
   if(nativePopup)await nativeChoose(page,frame,'#guide-scope',1);
   const leftBefore=actual(13),rightBefore=actual(23);
   await frame.locator('#guide-plus').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Linked step did not arrive');
   if(nativePopup)check(viewport.name+': explicit opposite raw direction for paired legs',actual(13)===leftBefore+5&&actual(23)===rightBefore-5);
   else check(viewport.name+': next step starts from arrived feedback',actual(13)===leftBefore+5&&actual(23)===rightBefore);
   phase=viewport.name+'-pause';
   const beforeAuto=calls('/api/guide/step').length;
   await frame.locator('#guide-continue').click();await until(()=>calls('/api/guide/step').length>beforeAuto,'Auto segment did not start');
   await frame.locator('#guide-pause').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Pause did not settle');
   const pausedCalls=calls('/api/guide/step').length,pausedRaw=actual(13);await delay(500);
   check(viewport.name+': pause cancels remaining auto steps',calls('/api/guide/step').length===pausedCalls&&actual(13)===pausedRaw&&status().state==='paused');
   const boundedBefore=calls('/api/guide/step').length;
   await frame.locator('#guide-continue').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Bounded segment did not finish',12_000);
   check(viewport.name+': one auto segment stops after exactly ten small steps',calls('/api/guide/step').length-boundedBefore===10);
   check(viewport.name+': finishing an auto segment never records a candidate',/0\s*\/\s*14/.test(await frame.locator('#guide-record-count').textContent()??''));
   const stoppedAt=calls('/api/guide/step').length;await delay(500);
   check(viewport.name+': completed segment never repeats itself',calls('/api/guide/step').length===stoppedAt);
   phase=viewport.name+'-return-record';
   await frame.locator('#guide-return-stop').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Return segment not finished',12_000);
   check(viewport.name+': limited return reports a segment instead of claiming arrival',!(await frame.locator('#feedback').textContent())?.includes('已回到'));
   check(viewport.name+': a partial return displays remaining distance',(await frame.locator('#guide-status-note').textContent())?.includes('还差'));
   await frame.locator('#guide-record').click();await until(async()=>/1\s*\/\s*14/.test(await frame.locator('#guide-record-count').textContent()??''),'Candidate not recorded');
   check(viewport.name+': candidate requires explicit human click',(await frame.locator('#guide-candidate-note').textContent())?.includes(String(actual(13))));
   await frame.locator('#guide-return-seat').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Baseline return not finished',12_000);
   check(viewport.name+': return to saved seat preserves candidate records',actual(13)===singleBefore&&/1\s*\/\s*14/.test(await frame.locator('#guide-record-count').textContent()??''));
   await frame.locator('[data-slot="34"]').click();await until(()=>frame.locator('#guide-minus').isDisabled(),'Mouth still enabled');
   check(viewport.name+': mouth stays excluded',await frame.locator('#guide-plus').isDisabled()&&await frame.locator('#guide-record').isDisabled());
   await frame.locator('[data-slot="13"]').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Joint reselect not ready');
   check(viewport.name+': panel, dropdown and 3D canvas remain mounted',await root.evaluate(element=>element.isConnected)&&await select.evaluate(element=>element===document.querySelector('#guide-scope'))&&await canvas.evaluate(element=>element===document.querySelector('#viewport canvas')));
   check(viewport.name+': segment status stays on one readable line',await frame.locator('#guide-segment').evaluate(element=>element.getBoundingClientRect().height<=parseFloat(getComputedStyle(element).fontSize)*1.7));
   await frame.locator('#guide-record').scrollIntoViewIfNeeded();
   await screenshot(page,viewport.name+'-controls');
   await frame.locator('.guide-records summary').click();
   const downloadEvent=page.waitForEvent('download');await frame.locator('#guide-export').click();const download=await downloadEvent;
   const exported=resolve(evidence,viewport.name+'-device.json');await download.saveAs(exported);
   const saved:unknown=JSON.parse(await readFile(exported,'utf8'));assert.ok(saved&&typeof saved==='object'&&'source'in saved&&'candidates'in saved&&'baseline'in saved);
   check(viewport.name+': export carries source and candidate values',saved.source==='device'&&Object.keys(saved.candidates as object).length===1);
   phase=viewport.name+'-archive';
   await frame.locator('#guide-unload').click();await until(async()=>await frame.locator('#guide-state').textContent()==='已卸载','Release not confirmed');
   check(viewport.name+': unload waits for disabled feedback',status().enabled===false&&!status().active);
   const beforeImport=writes();const chooserEvent=page.waitForEvent('filechooser');await frame.locator('#guide-import').click();await(await chooserEvent).setFiles(exported);
   await until(async()=>Boolean((await frame.locator('#guide-import-note').textContent())?.includes('只读')),'Readonly import not shown');
   check(viewport.name+': imported device archive cannot execute',writes()===beforeImport&&!status().active&&await frame.locator('#guide-export-view').isVisible());
   await frame.locator('#guide-capture').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'New session could not hold');
   check(viewport.name+': new session resets confirmations and exposes old archive',/0\s*\/\s*14/.test(await frame.locator('#guide-record-count').textContent()??'')&&await frame.locator('#guide-export-view').isVisible());
   await frame.locator('#guide-import-table').scrollIntoViewIfNeeded();
   await screenshot(page,viewport.name+'-archive');
   phase=viewport.name+'-navigation';
   // A late release reply must not undo the user's newer bench selection.
   await page.route('**/api/duck-debug/action',async route=>{const body:unknown=route.request().postDataJSON();if(body&&typeof body==='object'&&'action'in body&&body.action==='guide-release'){const response=await route.fetch();await delay(250);await route.fulfill({response});}else await route.continue();});
   await frame.locator('[data-workbench="servo"]').click();await until(()=>Promise.resolve(!status().active&&status().enabled===false),'Bench navigation did not release');
   await frame.locator('[data-workbench="guide"]').click();await frame.locator('#guide-capture').click();await until(()=>frame.locator('#guide-plus').isEnabled(),'Guide cannot reopen after bench navigation');
   check(viewport.name+': leaving and returning to bench permits a new explicit hold',status().active===true);
   await page.unroute('**/api/duck-debug/action');
   await page.locator('#close-module').click();await until(()=>Promise.resolve(!status().active&&status().enabled===false),'Closing homepage iframe did not release');
   const holds=calls('/api/guide/hold').length,steps=calls('/api/guide/step').length;
   frame=await enter(page);await delay(350);
   check(viewport.name+': reopening iframe never restores motion',!status().active&&calls('/api/guide/hold').length===holds&&calls('/api/guide/step').length===steps);
   await page.reload();await page.waitForSelector('body[data-home-ready="true"]');await delay(200);
   check(viewport.name+': refresh never holds or resumes automatically',!status().active&&calls('/api/guide/hold').length===holds&&calls('/api/guide/step').length===steps);
   frame=await enter(page);await frame.locator('#guide-scope').scrollIntoViewIfNeeded();
   check(viewport.name+': no horizontal viewport overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)&&await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await screenshot(page,viewport.name+'-ready');
  }catch(error){await screenshot(page,phase+'-failure');throw error;}
  finally{await context.close();}
 }
 check('No uncaught browser exceptions',errors.length===0);
 check('No browser console errors',consoleErrors.length===0);
}catch(error){failed=error;}
finally{
 try{await browser?.close();}finally{await fixture.close();}
 assert.equal(fixture.app.server.address(),null);await assert.rejects(fetch(fixture.url));cleaned=true;
 await writeFile(resolve(evidence,'browser-report.json'),JSON.stringify({pass:!failed,phase,fixture:{mode:'debug',guide:true,hardware:false},checks,errors,consoleErrors,screenshots,unverified,cleanup:{browserProcessesVerified:browser!==undefined,fixtureClosed:cleaned},failure:failed instanceof Error?failed.stack:failed?String(failed):null},null,2));
}
if(failed)throw failed;
console.log(JSON.stringify({pass:true,checks:checks.length,evidence,cleanup:cleaned}));
