/** B v1 uses the shipping homepage/paint modules with an owned DB and disconnected hardware. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {PNG} from 'pngjs';
import {createBrowserFixture} from './fixture.js';
import * as checks from './checks.js';

const {values}=parseArgs({options:{section:{type:'string',default:'all'},output:{type:'string',default:'output/playwright/ui-system'}}});
const out=resolve(values.output!);await mkdir(out,{recursive:true});
const receipt:checks.Receipt&{metrics?:unknown}=checks.receipt();
const check=(name:string,pass:boolean,detail?:unknown)=>{receipt.checks.push({name,pass,detail});assert.ok(pass,name+' '+JSON.stringify(detail??''));};
const fixture=await createBrowserFixture({mode:'preparation'});
let browser:Awaited<ReturnType<typeof checks.launchBrowser>>|undefined,context,page:import('playwright').Page|undefined,failure:unknown;
try{
 browser=await checks.launchBrowser({headless:false});context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});
 page=await context.newPage();page.setDefaultTimeout(10000);await checks.preparePage(page);
 page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')receipt.consoleErrors.push(m.text());});
 page.on('requestfailed',r=>receipt.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)receipt.httpErrors.push({url:r.url(),status:r.status()});});
 await page.goto(fixture.url+'/');await page.getByRole('button',{name:'将来涂鸭转到前面',exact:true}).click();await page.getByRole('button',{name:'进入来涂鸭',exact:true}).click();
 await page.frameLocator('#module-frame').locator('#steps').waitFor();
 const paint=checks.required(page.frame({url:fixture.url+'/paint'}));await paint.waitForFunction(()=>Boolean(window.studioProto));
 check('starting lineup receives a usable stage',await paint.locator('#stage').evaluate(e=>e.clientWidth>600&&e.clientHeight>500));
 await paint.locator('#steps [data-step="2"]').click();await paint.waitForFunction(()=>window.studioProto.view.root.visible);
 await paint.evaluate(()=>new Promise<void>(done=>requestAnimationFrame(()=>requestAnimationFrame(()=>done()))));
 const wrapper=await page.locator('.window-top').evaluate(e=>e.getBoundingClientRect().height),header=await paint.locator('.top').evaluate(e=>e.getBoundingClientRect().height),stage=checks.required(await paint.locator('#stage').boundingBox());
 receipt.metrics={viewport:{width:1440,height:900},header:wrapper+header,stage};
 const camera=await paint.evaluate(()=>window.studioProto.view.debug());check('camera remains finite after lineup handoff',[...camera.cam,...camera.target].every(Number.isFinite),camera);
 await page.screenshot({path:out+'/desktop.png'});
 const canvas=PNG.sync.read(await paint.locator('#stage canvas').first().screenshot());let colored=0;
 for(let y=Math.floor(canvas.height*.2);y<canvas.height*.8;y++)for(let x=Math.floor(canvas.width*.2);x<canvas.width*.8;x++){const i=(y*canvas.width+x)*4;if(Math.max(canvas.data[i]!,canvas.data[i+1]!,canvas.data[i+2]!)-Math.min(canvas.data[i]!,canvas.data[i+1]!,canvas.data[i+2]!)>45)colored++;}
 check('real model canvas contains rendered fixture colors',colored>1000,{colored});
 check('homepage paint uses one compact header',wrapper+header<=64,{wrapper,header});
 check('desktop model area reaches approved usable area',stage.width>=860&&stage.height>=800,stage);
 if(values.section!=='shell'){
  check('editor collapse control is available',await paint.locator('#panel-toggle').isVisible());
  const colors=await paint.evaluate(()=>({...window.studioProto.state.colors})),selected=await paint.evaluate(()=>({...window.studioProto.state.sel}));
  await paint.locator('#panel-toggle').click();check('collapse hides editor',await paint.locator('#panel').isHidden());
  const expanded=checks.required(await paint.locator('#stage').boundingBox());check('collapse expands model area',expanded.width>stage.width);
  await paint.locator('#panel-toggle').click();check('restore preserves color and part selection',await paint.locator('#panel').isVisible()&&JSON.stringify(await paint.evaluate(()=>window.studioProto.state.colors))===JSON.stringify(colors)&&JSON.stringify(await paint.evaluate(()=>window.studioProto.state.sel))===JSON.stringify(selected));
  await paint.locator('#scheme-btn').click();await paint.locator('#sm-name').fill('UI system fixture');await page.keyboard.press('Escape');
  check('Escape closes scheme menu without closing workbench',await paint.locator('#scheme-menu').isHidden()&&await page.locator('#module-window').isVisible());
  check('scheme Escape returns focus',await paint.locator('#scheme-btn').evaluate(e=>document.activeElement===e));
  await paint.locator('#save-scheme').click();await paint.waitForFunction(()=>Boolean(window.studioProto.state.activeId));
  const saved=fixture.store.schemes()[0]?.design;
  check('save shortcut persists the actual design in owned SQLite',fixture.store.schemes().length===1&&typeof saved==='object'&&saved!==null&&'colors' in saved&&JSON.stringify(saved.colors)===JSON.stringify(colors));
  await page.setViewportSize({width:390,height:844});await paint.locator('body.phone').waitFor();
  check('phone steps occupy the top header',await paint.locator('#steps').evaluate(e=>e.getBoundingClientRect().bottom<=64));
  check('phone model remains visible above bottom editor',await paint.locator('#stage').evaluate(e=>e.getBoundingClientRect().height>=260));
  check('phone has no horizontal overflow',await paint.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:out+'/phone.png'});
  await paint.locator('.ph-more').click();await paint.locator('#scheme-btn').click();check('phone scheme menu fits viewport',await paint.locator('#scheme-menu').evaluate(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}));await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:900});
 }
 await paint.locator('.brand').click();check('brand closes actual parent module',await page.locator('#module-window').isHidden());
 check('close destroys the iframe',await page.locator('#module-frame').getAttribute('src')==='about:blank');
 await page.getByRole('button',{name:'进入来涂鸭',exact:true}).click();
 await page.frameLocator('#module-frame').locator('#steps').waitFor();
 const reopened=checks.required(page.frame({url:fixture.url+'/paint'}));await reopened.waitForFunction(()=>Boolean(window.studioProto));
 check('workbench can reopen through homepage',await reopened.locator('.top').isVisible());
 await page.locator('#close-x').click();check('window close control still returns home',await page.locator('#module-window').isHidden());
 check('no page errors',receipt.errors.length===0,receipt.errors);check('no console errors',receipt.consoleErrors.length===0,receipt.consoleErrors);check('no failed requests',receipt.failedRequests.length===0,receipt.failedRequests);check('no HTTP errors',receipt.httpErrors.length===0,receipt.httpErrors);
}catch(error){
 failure=error;receipt.failure=checks.failure(error);
 if(page){
  await page.screenshot({path:out+'/failure.png'}).catch(()=>{});
  const diagnostic=await page.locator('.duck-choice').evaluateAll(nodes=>nodes.map(e=>{
   const r=e.getBoundingClientRect();return {text:e.textContent,rect:r.toJSON(),z:getComputedStyle(e).zIndex,transform:getComputedStyle(e).transform,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.outerHTML.slice(0,180)};
  })).catch(()=>null);
  console.log(diagnostic);
 }
}
finally{await context?.close();await browser?.close();await fixture.close();receipt.browserClosed=true;await writeFile(out+'/receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));}
if(failure)throw failure;
