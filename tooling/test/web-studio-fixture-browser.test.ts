import test from 'node:test';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {loadAssemblyManifest} from '@letsduck/host';
import {createBrowserFixture} from '../../tests/browser/fixture.js';
import {launchBrowser,preparePage} from '../../tests/browser/checks.js';
import {STEPS} from '../../frontend/assemble/hardware-state.js';

const repository=resolve(import.meta.dirname,'../..'),manifest=loadAssemblyManifest(join(repository,'scripts/assembly-assets.json'));
assert.ok(manifest,'Reviewed assembly manifest must exist');
const missingAssets=['model.json','geometry.bin',...Object.keys(manifest.files).map(name=>'assembly/'+name)].filter(name=>!existsSync(join(repository,'assets',name)));
const browserOptions={skip:process.env.WEB_STUDIO_BROWSER!=='1'?'Set WEB_STUDIO_BROWSER=1 for licensed-asset managed Chromium evidence':missingAssets.length?'Licensed model assets unavailable ('+missingAssets.length+' files); run the full local asset acceptance separately':false,timeout:90000};

test('disconnected preparation fixture reaches the actual dist pickup tray without fabricating numbering',browserOptions,async()=>{
 const f=await createBrowserFixture({mode:'preparation'}),browser=await launchBrowser({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1040}}),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await preparePage(page);
  const response=await page.goto(f.url+'/assemble/');assert.equal(response?.status(),200);
  try{await page.waitForFunction(()=>window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'),{},{timeout:30000});}catch(error){console.error(JSON.stringify({errors,url:page.url(),body:(await page.locator('body').innerText()).slice(0,1800)}));if(process.env.WEB_STUDIO_SCREENSHOT)await page.screenshot({path:process.env.WEB_STUDIO_SCREENSHOT.replace('.png','-failure.png')});throw error;}
  assert.equal(f.debug.numbering().ready,false);
  assert.equal(await page.locator('#servo-open, #servo-guide-open').count(),0);
  if(await page.locator('body').evaluate(element=>element.classList.contains('desk')))await page.locator('#desk-toggle').click();
  await page.locator('#full-saved-step').evaluate((element,n)=>{window.__browserChecks.input(element).value=String(n);element.dispatchEvent(new Event('change'));},STEPS.findIndex(s=>s.id==='l-prepare'));
  await page.waitForFunction(()=>window.anklePrototype.state.stepId==='l-prepare');await page.keyboard.press('Escape');
  const image=PNG.sync.read(await page.locator('#canvas-host canvas').screenshot());let visible=0;for(let i=0;i<image.data.length;i+=4)if((image.data[i]??255)<220&&(image.data[i+1]??255)<220&&(image.data[i+2]??255)<220)visible++;
  assert.ok(visible>3000,'actual model geometry must remain visible in the tutorial');
  await page.locator('#instruction-toggle').click();await page.locator('[data-servo-ids="14"]').click();
  assert.equal(await page.locator('.sp-slot').count(),15);assert.equal(await page.locator('.sp-slot[data-id="14"]').getAttribute('data-state'),'picked');assert.equal(await page.locator('.sp-slot[data-id="24"]').getAttribute('data-state'),'installed');
  await page.locator('#sp-close').click();assert.equal(await page.locator('#servo-pickup').isHidden(),true);
  if(process.env.WEB_STUDIO_SCREENSHOT)await page.screenshot({path:process.env.WEB_STUDIO_SCREENSHOT});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await f.close();assert.equal(f.app.server.address(),null);await assert.rejects(fetch(f.url));}
});

test('the disposable debug firmware serves the production model, read-only mapping and feedback controls',browserOptions,async()=>{
 const [{default:mapping},{default:feedback}]=await Promise.all([import('../../tests/debug_leg_map_browser.js'),import('../../tests/duck_debug_browser.js')]);
 const f=await createBrowserFixture({mode:'debug'}),browser=await launchBrowser({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),previous=process.env.DUCK_BROWSER_URL;
 process.env.DUCK_BROWSER_URL=f.url;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});assert.equal((await mapping(page)).pass,true);assert.equal((await feedback(page)).pass,true);
 }finally{if(previous===undefined)delete process.env.DUCK_BROWSER_URL;else process.env.DUCK_BROWSER_URL=previous;await browser.close();await f.close();assert.equal(f.app.server.address(),null);await assert.rejects(fetch(f.url));}
});
