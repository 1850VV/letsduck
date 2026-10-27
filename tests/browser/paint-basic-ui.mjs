// Basic paint interactions through the real homepage iframe. No server writes.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const args=process.argv.slice(2),value=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const base=value('--url','http://127.0.0.1:8876'),out=resolve(value('--output','output/playwright/paint-basic-ui'));
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href:'playwright');
await mkdir(out,{recursive:true});
const result={checks:[],errors:[],consoleErrors:[],failedRequests:[],httpErrors:[],writes:[]};
const check=(name,pass,detail)=>{result.checks.push({name,pass,detail});assert.ok(pass,name+' '+JSON.stringify(detail??''));};
let browser,context,failure;
try{
 browser=await chromium.launch({headless:false});context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN',recordVideo:{dir:out+'/video',size:{width:1280,height:800}}});
 await context.route('**/api/**',route=>{const r=route.request();if(['GET','HEAD'].includes(r.method()))return route.continue();result.writes.push({method:r.method(),url:r.url()});return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(m.text());});page.on('requestfailed',r=>result.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)result.httpErrors.push({url:r.url(),status:r.status()});});
 await page.goto(base+'/');await page.getByRole('button',{name:'将来涂鸭转到前面',exact:true}).click();await page.getByRole('button',{name:'进入来涂鸭',exact:true}).click();
 await page.frameLocator('#module-frame').locator('#steps').waitFor();
 const frame=page.frame({url:base+'/paint'});assert.ok(frame,'Paint opens inside the homepage window');await frame.waitForFunction(()=>window.studioProto);
 if(await frame.locator('#coach').isVisible())await frame.locator('#coach-go').click();
 await frame.locator('[data-step="2"]').click();const select=frame.locator('#filament-series'),original=await select.elementHandle();
 check('homepage enters the actual paint window',await page.locator('#module-frame').isVisible());
 const scope=await frame.evaluate(()=>studioProto.state.sel.scope);await select.click();
 check('opening series preserves the control and part scope',await original.evaluate(el=>el.isConnected)&&await frame.evaluate(()=>studioProto.state.sel.scope)===scope);
 // macOS system menus do not accept CDP key selection consistently. Native mouse,
 // keyboard, Escape and reopen are a separate required OS-level check; never
 // replace that check with selectOption(). This assertion catches the click teardown.
 result.nativeMenuCoverage='DOM stability only here; native mouse/keyboard selection and cancel/reopen require OS-level evidence.';
 await page.locator('#close-x').click();await page.getByRole('button',{name:'进入来涂鸭',exact:true}).click();await page.frameLocator('#module-frame').locator('#steps').waitFor();
 let paint=page.frame({url:base+'/paint'});await paint.waitForFunction(()=>window.studioProto);await paint.locator('[data-step="2"]').click();
 const catalog=await paint.evaluate(()=>fetch('/api/catalog').then(r=>r.json())),byId=new Map(catalog.products.map(p=>[p.id,p]));
 for(const [width,height] of [[1440,900],[390,844]]){
  await page.setViewportSize({width,height});await paint.locator('[data-zone="head-shell"]').click();
  for(const brand of ['esun','polymaker','sunlu','bambu']){
   await paint.locator(`[data-brand="${brand}"]`).click();
   check(`${width}: ${brand} brand changes the available series`,await paint.locator('#filament-series option').count()>0&&await paint.locator('#lib-grid [data-key]').count()>0);
  }
  const beforeCount=await paint.locator('#lib-grid [data-key]').count();await paint.locator('#search').fill('no-such-filament-000');check(`${width}: search empty state`,await paint.locator('#lib-grid [data-key]').count()===0);await paint.locator('#search').fill('');check(`${width}: clearing search restores swatches`,await paint.locator('#lib-grid [data-key]').count()===beforeCount);
  const control=await paint.locator('#filament-series').elementHandle();await paint.locator('#filament-series').focus();await page.keyboard.press('Tab');check(`${width}: Tab leaves series without replacing it`,await control.evaluate(el=>el.isConnected)&&!await paint.locator('#filament-series').evaluate(el=>el===document.activeElement));
  await page.screenshot({path:out+`/${width}-palette.png`});
 }
 await page.setViewportSize({width:1440,height:900});await paint.locator('[data-zone="head-shell"]').click();
 const before=await paint.evaluate(()=>({...studioProto.state.colors}));const keys=await paint.locator('#lib-grid [data-key]').evaluateAll(nodes=>nodes.map(n=>n.dataset.key));const product=keys.map(k=>byId.get(k)).find(p=>p.hex.toUpperCase()!==before['P4-01']);assert.ok(product);
 await paint.locator(`#lib-grid [data-key="${product.id}"]`).click();await page.mouse.move(700,220);check('swatch click paints the selected head',await paint.evaluate(()=>studioProto.state.colors['P4-01'])===product.hex.toUpperCase());
 await paint.locator('#undo').click();check('Undo restores previous colours',JSON.stringify(await paint.evaluate(()=>studioProto.state.colors))===JSON.stringify(before));await paint.locator('#redo').click();check('Redo restores painted colour',await paint.evaluate(()=>studioProto.state.colors['P4-01'])===product.hex.toUpperCase());
 await paint.locator('[data-zone="leg-shell"]').click();await paint.locator('[data-scope="left"]').click();check('part scope buttons still select left',await paint.evaluate(()=>studioProto.state.sel.scope)==='left');await paint.locator('[data-scope="all"]').click();check('part scope buttons return to all',await paint.evaluate(()=>studioProto.state.sel.scope)==='all');
 await paint.locator('[data-zone="soles"]').click();const softKeys=await paint.locator('#lib-grid [data-key]').evaluateAll(nodes=>nodes.map(n=>n.dataset.key));check('soft parts only offer TPU 90A',softKeys.length>0&&softKeys.every(k=>byId.get(k).material==='TPU'&&/90A/.test(byId.get(k).hardness||byId.get(k).series)));
 await paint.locator('[data-zone="head-shell"]').click();await paint.locator('[data-tab="free"]').click();await paint.locator('#free-hex').fill('#123456');await paint.locator('#free-apply').click();check('free HEX input and apply paint correctly',await paint.evaluate(()=>studioProto.state.colors['P4-01'])==='#123456');await paint.locator('[data-tab="filament"]').click();
 await paint.locator('[data-step="3"]').click();check('display/export step opens',await paint.evaluate(()=>studioProto.state.step)===3);await paint.locator('[data-step="2"]').click();check('returning to edit keeps colours',await paint.evaluate(()=>studioProto.state.colors['P4-01'])==='#123456');
 await page.locator('#close-x').click();check('close returns to homepage',!await page.locator('#module-window').isVisible());await page.getByRole('button',{name:'进入来涂鸭',exact:true}).click();await page.frameLocator('#module-frame').locator('#steps').waitFor();paint=page.frame({url:base+'/paint'});await paint.waitForFunction(()=>window.studioProto);check('reopening retains local draft colour',await paint.evaluate(()=>studioProto.state.colors['P4-01'])==='#123456');
 check('no page errors',result.errors.length===0,result.errors);check('no console errors',result.consoleErrors.length===0,result.consoleErrors);check('no failed requests',result.failedRequests.length===0,result.failedRequests);check('no HTTP failures',result.httpErrors.length===0,result.httpErrors);check('no server writes',result.writes.length===0,result.writes);
 await page.screenshot({path:out+'/after.png'});
}catch(error){failure=error;result.failure=error.stack;}
finally{await context?.close();await browser?.close();result.browserClosed=true;await writeFile(out+'/receipt.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
if(failure)throw failure;
