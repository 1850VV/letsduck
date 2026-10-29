/** Real Paint entry with delayed scheme hydration and an existing browser draft. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import type {Frame,Page} from 'playwright';
import {createBrowserFixture,createCommunityBrowserFixture} from './browser/fixture.js';
import {launchBrowser,preparePage,required,browserPids,failure} from './browser/checks.js';
import {parseModelManifest,parseCatalog} from '../frontend/shared/guards.js';
import {quickDesign,themeSlots,THEMES,encodeLook} from '../frontend/lib/quick-style.js';

interface EntryFrame {step:number;root:boolean;visible:boolean[];scale:number[];positions:{x:number;y:number}[];draws:number}
declare global {interface Window {__paintEntry:{draws:number;first:EntryFrame|null;firstStage:EntryFrame|null;restoredStill:boolean;pendingForeground:boolean}}}

// Records the first frame that actually submits the production lineup to WebGL.
// A later settled frame cannot overwrite evidence of a staggered first appearance.
async function observeEntry(page:Page){
 await page.addInitScript(()=>{
  window.__paintEntry={draws:0,first:null,firstStage:null,restoredStill:false,pendingForeground:false};
  new MutationObserver(records=>{if(records.some(record=>[...record.addedNodes].some(node=>node instanceof HTMLImageElement&&node.classList.contains('still'))))window.__paintEntry.restoredStill=true;}).observe(document,{childList:true,subtree:true});
  const drawElements=WebGL2RenderingContext.prototype.drawElements,drawArrays=WebGL2RenderingContext.prototype.drawArrays;
  WebGL2RenderingContext.prototype.drawElements=function(mode,count,type,offset){if(this.canvas instanceof HTMLCanvasElement&&this.canvas.parentElement?.id==='stage')window.__paintEntry.draws++;return drawElements.call(this,mode,count,type,offset);};
  WebGL2RenderingContext.prototype.drawArrays=function(mode,first,count){if(this.canvas instanceof HTMLCanvasElement&&this.canvas.parentElement?.id==='stage')window.__paintEntry.draws++;return drawArrays.call(this,mode,first,count);};
  const frame=requestAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>frame(time=>{
   const before=window.__paintEntry.draws;callback(time);
   const entry=window.__paintEntry,studio=window.studioProto;
   if(!studio&&entry.draws>before&&!entry.pendingForeground){
    const canvas=document.querySelector<HTMLCanvasElement>('#stage > canvas'),gl=canvas?.getContext('webgl2');
    if(canvas&&gl){const pixels=new Uint8Array(canvas.height*4);gl.readPixels(Math.floor(canvas.width/2),0,1,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);let opaque=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]!>200)opaque++;entry.pendingForeground=opaque>8;}
   }
   if(entry.draws>before&&studio){
    const groups=studio.view.stage.layer.children;
    const shown={step:studio.state.step,root:studio.view.root.visible,visible:groups.map(group=>group.visible),scale:groups.map(group=>group.scale.x),positions:groups.map(group=>({x:group.position.x,y:group.position.y})),draws:entry.draws};
    entry.firstStage??=shown;
    if(!entry.first&&studio.state.step===1&&groups.length===4)entry.first=shown;
   }
  });
 });
}

test('Paint waits for schemes and first presents four complete ducks through direct and Home entry',async()=>{
 const output=resolve(process.env.DUCK_PAINT_EVIDENCE??'.ryugi/sdd/paint-entry-20261029');await mkdir(output,{recursive:true});
 const fixture=await createBrowserFixture({mode:'preparation'}),browser=await launchBrowser({headless:true});
 const checks:{name:string;pass:boolean;detail?:unknown}[]=[],errors:string[]=[],consoleErrors:string[]=[],pids=await browserPids(browser);
 const check=(name:string,pass:boolean,detail?:unknown)=>{checks.push({name,pass,...(detail===undefined?{}:{detail})});};
 const contexts=new Set<Awaited<ReturnType<typeof browser.newContext>>>(),releases:(()=>void)[]=[];
 let thrown:unknown;
 try{
  const model=parseModelManifest(JSON.parse(await readFile(resolve('assets/model.json'),'utf8')));
  const colors=Object.fromEntries(model.parts.map(part=>[part.id,part.id==='P4-01'?'#123456':part.color.toUpperCase()]));
  const design={colors,assignments:Object.fromEntries(model.parts.map(part=>[part.id,null])),finishes:{}};
  const scheme=fixture.store.saveScheme('paint-startup-existing',{name:'已有配色',design,provenance:null,voiceSalt:17});
  const draft={draft:{name:'保留的草稿',design,activeId:null,voiceSalt:23,updated:1234},recent:['hex:#123456'],locks:[]};
  const watch=(page:Page)=>{page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});};

  // Build the legacy still using the actual licensed model and production renderer.
  const seedContext=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});contexts.add(seedContext);
  const seedPage=await seedContext.newPage();watch(seedPage);await preparePage(seedPage);await seedPage.goto(fixture.url+'/paint');await seedPage.waitForFunction(()=>window.studioProto);
  await seedPage.locator('#steps [data-step="2"]').click();
  const legacyImage=await seedPage.evaluate(()=>window.studioProto.view.still(1440,700).toDataURL('image/png'));
  await seedPage.screenshot({path:join(output,'before-real-single-duck.png')});await seedContext.close();contexts.delete(seedContext);

  for(const entry of ['direct','home'] as const){
   console.log('Paint startup: '+entry+' entry');
   const context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});contexts.add(context);
   const page=await context.newPage();watch(page);await preparePage(page);await observeEntry(page);
   await page.addInitScript(({draft,image})=>{
    localStorage.setItem('dd-studio-personal',JSON.stringify(draft));
    localStorage.setItem('letsduck-still-paint',JSON.stringify({vw:innerWidth,vh:innerHeight,image}));
   },{draft,image:legacyImage});
   let release:()=>void=()=>{},entered:()=>void=()=>{};
   const gate=new Promise<void>(resolve=>{release=resolve;}),requested=new Promise<void>(resolve=>{entered=resolve;});releases.push(release);
   await context.route('**/api/schemes',async route=>{if(route.request().method()!=='GET')return route.continue();entered();await gate;await route.continue();});
   let paint:Page|Frame=page;
   if(entry==='direct')await page.goto(fixture.url+'/paint',{waitUntil:'domcontentloaded'});
   else{
    await page.goto(fixture.url+'/');await page.waitForSelector('body[data-home-ready=true]');
    await page.locator('[data-duck="paint"]').click();
    await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="paint"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');
    await page.locator('[data-duck="paint"]').click();await page.frameLocator('#module-frame').locator('#steps').waitFor();
    paint=required(page.frame({url:fixture.url+'/paint'}));
   }
   await requested;
   // Wait for the real model canvas, not a timer that assumes download/decode speed.
   await paint.locator('#stage > canvas').waitFor();
   await paint.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
   const pending=await paint.evaluate(()=>({loading:!!document.querySelector('#loading')&&getComputedStyle(document.querySelector('#loading')!).display!=='none',still:window.__paintEntry.restoredStill,foreground:window.__paintEntry.pendingForeground,ready:!!window.studioProto}));
   await page.screenshot({path:join(output,entry+'-schemes-pending.png')});
   check(entry+': loading remains while scheme hydration is pending',pending.loading,pending);
   check(entry+': an existing single-duck still is never restored',!pending.still,pending);
   check(entry+': no live single duck is drawn before hydration',!pending.foreground,pending);
   check(entry+': controls do not become ready before hydration',!pending.ready,pending);
   release();await paint.waitForFunction(()=>window.studioProto);await paint.waitForFunction(()=>window.__paintEntry.first!==null);
   const first=await paint.evaluate(()=>window.__paintEntry.first);
   check(entry+': first drawn lineup contains four full-size ducks',!!first&&!first.root&&first.visible.every(Boolean)&&first.scale.every(scale=>Math.abs(scale-1)<.001),first);
   check(entry+': existing draft survives scheme hydration',await paint.evaluate(()=>window.studioProto.state.name==='保留的草稿'&&window.studioProto.state.colors['P4-01']==='#123456'));
   check(entry+': loading clears after the entry becomes ready',await paint.locator('#loading').count()===0);
   await page.screenshot({path:join(output,entry+'-ready.png')});
   console.log('Paint startup: '+entry+' first frame '+JSON.stringify(first));

   // Existing choices must still hand off to edit and preserve the chosen colours.
   await paint.locator('[data-start-tab="dice"]').click();
   console.log('Paint startup: '+entry+' Dice opened');
   await paint.waitForFunction(()=>document.querySelectorAll('#lineup-tags [data-slot]').length===4);
   await paint.locator('[data-dice-one="0"]').click();
   await paint.locator('[data-start-tab="classic"]').click();await paint.locator('[data-start="theme-2"]').click();await paint.locator('#start-go').click();
   await paint.waitForFunction(()=>window.studioProto.state.step===2&&window.studioProto.view.root.visible);
   console.log('Paint startup: '+entry+' edit opened');
   const chosen=await paint.evaluate(()=>({...window.studioProto.state.colors}));
   await paint.locator('#steps [data-step="1"]').click();await paint.waitForFunction(()=>window.studioProto.view.stage.layer.children.every(group=>group.visible&&group.scale.x>.9));
   await paint.locator('#steps [data-step="2"]').click();await paint.waitForFunction(()=>window.studioProto.view.root.visible);
   check(entry+': Dice, classic selection and edit return preserve colours',JSON.stringify(await paint.evaluate(()=>window.studioProto.state.colors))===JSON.stringify(chosen));
   await context.close();contexts.delete(context);
  }

  const deepContext=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});contexts.add(deepContext);
  const deep=await deepContext.newPage();watch(deep);await preparePage(deep);await deep.goto(fixture.url+'/paint#scheme='+scheme.id);await deep.waitForFunction(()=>window.studioProto);
  const opened=await deep.evaluate(()=>({step:window.studioProto.state.step,activeId:window.studioProto.state.activeId,name:window.studioProto.state.name,color:window.studioProto.state.colors['P4-01'],visible:window.studioProto.view.root.visible}));
  check('existing scheme deep link opens a visible edit duck',opened.step===2&&opened.activeId===scheme.id&&opened.name==='已有配色'&&opened.color==='#123456'&&opened.visible,opened);
  check('entry causes no page errors',errors.length===0,errors);check('entry causes no console errors',consoleErrors.length===0,consoleErrors);
  assert.deepEqual(checks.filter(check=>!check.pass),[],'Paint startup regression checks');
 }catch(error){thrown=error;}
 finally{
  releases.forEach(release=>release());
  const cleanupErrors:string[]=[];
  for(const context of contexts)try{await context.close();}catch(error){cleanupErrors.push(failure(error));}
  let browserClosed=false,fixtureClosed=false;
  try{await browser.close();browserClosed=true;}catch(error){cleanupErrors.push(failure(error));}
  try{await fixture.close();fixtureClosed=true;}catch(error){cleanupErrors.push(failure(error));}
  await writeFile(join(output,'receipt.json'),JSON.stringify({checks,errors,consoleErrors,pids,browserClosed,fixtureClosed,cleanupErrors,...(thrown?{failure:failure(thrown)}:{})},null,2));
  assert.deepEqual(cleanupErrors,[],'task-owned browser and fixture cleanup');
 }
 if(thrown)throw thrown;
});

test('authenticated server deep links first draw the resolved editor without a startup lineup',async()=>{
 const output=resolve(process.env.DUCK_PAINT_EVIDENCE??'.ryugi/sdd/paint-entry-20261029');await mkdir(output,{recursive:true});
 const fixture=await createCommunityBrowserFixture(resolve(process.env.DUCK_FRONTEND_DIST??'frontend/dist'));
 let browser:Awaited<ReturnType<typeof launchBrowser>>|undefined,pids:number[]=[],thrown:unknown;
 const errors:string[]=[],consoleErrors:string[]=[],checks:{route:string;first:EntryFrame|null;editor:boolean;expectedDesign:boolean}[]=[];
 try{
  const registration=await fetch(fixture.url+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'startup-route-user',password:'fixture-pass-123'})});
  assert.equal(registration.status,200);const session:unknown=await registration.json();assert.ok(session&&typeof session==='object'&&'token'in session&&typeof session.token==='string');
  const headers={authorization:'Bearer '+session.token,'content-type':'application/json'};
  const model=parseModelManifest(JSON.parse(await readFile(resolve('assets/model.json'),'utf8'))),catalog=parseCatalog(await fetch(fixture.url+'/api/catalog').then(response=>response.json())),products=new Map(catalog.products.map(product=>[product.id,product]));
  const design=quickDesign(model.parts,products,themeSlots(products,required(THEMES[1])),required(THEMES[1]).recipe),schemeId='server-startup-existing';
  const saved=await fetch(fixture.url+'/api/schemes/'+schemeId,{method:'PUT',headers,body:JSON.stringify({name:'已存服务器配色',design,provenance:null,voiceSalt:17})});assert.equal(saved.status,200);
  const look=encodeLook(model.parts,products,design.assignments,'分享配色');
  browser=await launchBrowser({headless:true});pids=await browserPids(browser);
  for(const [route,hash]of [['scheme','#scheme='+schemeId],['look','#look='+look]]as const){
   const context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});
   try{
    const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
    await preparePage(page);await observeEntry(page);
    await page.addInitScript(({token})=>{localStorage.setItem('dd-token',token);localStorage.setItem('dd-studio-coach','1');},{token:session.token});
    await page.goto(fixture.url+'/'+hash);await page.waitForFunction(()=>window.studioProto);await page.waitForFunction(()=>window.__paintEntry.firstStage!==null);
    const first=await page.evaluate(()=>window.__paintEntry.firstStage),state=await page.evaluate(()=>window.studioProto.state);
    const editor=await page.locator('#filament-series').isVisible()&&await page.locator('#lineup').isHidden();
    checks.push({route,first,editor,expectedDesign:state.step===2&&state.colors['P4-01']===design.colors['P4-01']&&(route!=='scheme'||state.activeId===schemeId)});
    await page.screenshot({path:join(output,'server-'+route+'-first.png')});
   }finally{await context.close();}
  }
  for(const check of checks){assert.ok(check.first?.step===2&&check.first.root&&check.first.visible.every(visible=>!visible),check.route+': first server editor frame must not contain the starting lineup '+JSON.stringify(check));assert.ok(check.editor&&check.expectedDesign,check.route+': normal editor controls and requested colours remain available');}
  assert.deepEqual(errors,[],'authenticated entry has no page errors');assert.deepEqual(consoleErrors,[],'authenticated entry has no console errors');
 }catch(error){thrown=error;}
 finally{
  try{await browser?.close();}finally{await fixture.close();}
  await writeFile(join(output,'server-receipt.json'),JSON.stringify({checks,errors,consoleErrors,pids,browserClosed:true,fixtureClosed:true,...(thrown?{failure:failure(thrown)}:{})},null,2));
 }
 if(thrown)throw thrown;
});

test('narrow Paint first drawn frame already has two columns and two rows',async()=>{
 const output=resolve(process.env.DUCK_PAINT_EVIDENCE??'.ryugi/sdd/paint-entry-20261029');await mkdir(output,{recursive:true});
 const fixture=await createBrowserFixture({mode:'preparation'});
 let browser:Awaited<ReturnType<typeof launchBrowser>>|undefined,pids:number[]=[],first:EntryFrame|null=null,thrown:unknown;
 const errors:string[]=[];
 try{
  browser=await launchBrowser({headless:true});pids=await browserPids(browser);
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'zh-CN'});page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(error.message));await preparePage(page);await observeEntry(page);
  await page.goto(fixture.url+'/paint');await page.waitForFunction(()=>window.__paintEntry.first!==null);
  first=await page.evaluate(()=>window.__paintEntry.first);await page.screenshot({path:join(output,'narrow-first-frame.png')});
  assert.ok(first&&!first.root&&first.visible.every(Boolean)&&first.scale.every(scale=>Math.abs(scale-1)<.001),'narrow first frame presents four full-size ducks');
  // Compare the visible arrangement, without copying the implementation's spacing constants.
  const xs=new Set(first.positions.map(position=>Math.round(position.x))),ys=new Set(first.positions.map(position=>Math.round(position.y)));
  assert.equal(xs.size,2,'first narrow frame must already have two columns');assert.equal(ys.size,2,'first narrow frame must already have two rows');
  assert.equal(new Set(first.positions.map(position=>Math.round(position.x)+':'+Math.round(position.y))).size,4,'each duck has its own grid position');
  assert.deepEqual(errors,[],'narrow entry has no page errors');
 }catch(error){thrown=error;}
 finally{
  try{await browser?.close();}finally{await fixture.close();}
  await writeFile(join(output,'narrow-receipt.json'),JSON.stringify({first,errors,pids,browserClosed:true,fixtureClosed:true,...(thrown?{failure:failure(thrown)}:{})},null,2));
 }
 if(thrown)throw thrown;
});
