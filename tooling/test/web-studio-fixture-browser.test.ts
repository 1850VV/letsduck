import test from 'node:test';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {createBrowserFixture} from '../../tests/browser/fixture.js';
import {launchBrowser,preparePage} from '../../tests/browser/checks.js';

test('disconnected preparation fixture reaches the actual dist tray without fabricating numbering',{skip:process.env.WEB_STUDIO_BROWSER!=='1'?'Set WEB_STUDIO_BROWSER=1 for licensed-asset managed Chromium evidence':false,timeout:90000},async()=>{
 const f=await createBrowserFixture({mode:'preparation'}),browser=await launchBrowser({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1040}}),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await preparePage(page);
  const response=await page.goto(f.url+'/assemble/');assert.equal(response?.status(),200);
  try{await page.waitForFunction(()=>window.anklePrototype?.servo?.historyLoaded,{},{timeout:30000});}catch(error){console.error(JSON.stringify({errors,url:page.url(),body:(await page.locator('body').innerText()).slice(0,1800)}));if(process.env.WEB_STUDIO_SCREENSHOT)await page.screenshot({path:process.env.WEB_STUDIO_SCREENSHOT.replace('.png','-failure.png')});throw error;}
  assert.equal(f.debug.numbering().ready,false);
  await page.locator('#servo-open').click();await page.waitForFunction(()=>(window.anklePrototype.servo?.models?.draws??0)>0);
  assert.equal(await page.locator('.sv-slot').count(),15);assert.equal(await page.locator('.sv-slot[data-id="14"]').getAttribute('data-pick-state'),'picked');assert.equal(await page.locator('.sv-slot[data-id="24"]').getAttribute('data-pick-state'),'installed');
  const image=PNG.sync.read(await page.locator('#sv-viewport').screenshot());let visible=0;for(let i=0;i<image.data.length;i+=4)if((image.data[i]??255)<220&&(image.data[i+1]??255)<220&&(image.data[i+2]??255)<220)visible++;
  assert.ok(visible>3000,'actual model geometry must appear in the preparation tray');
  if(process.env.WEB_STUDIO_SCREENSHOT)await page.screenshot({path:process.env.WEB_STUDIO_SCREENSHOT});
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await f.close();assert.equal(f.app.server.address(),null);await assert.rejects(fetch(f.url));}
});

test('the disposable debug firmware serves the production model, read-only mapping and feedback controls',{skip:process.env.WEB_STUDIO_BROWSER!=='1'?'Set WEB_STUDIO_BROWSER=1 for licensed-asset managed Chromium evidence':false,timeout:90000},async()=>{
 const [{default:mapping},{default:feedback}]=await Promise.all([import('../../tests/debug_leg_map_browser.js'),import('../../tests/duck_debug_browser.js')]);
 const f=await createBrowserFixture({mode:'debug'}),browser=await launchBrowser({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),previous=process.env.DUCK_BROWSER_URL;
 process.env.DUCK_BROWSER_URL=f.url;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});assert.equal((await mapping(page)).pass,true);assert.equal((await feedback(page)).pass,true);
 }finally{if(previous===undefined)delete process.env.DUCK_BROWSER_URL;else process.env.DUCK_BROWSER_URL=previous;await browser.close();await f.close();assert.equal(f.app.server.address(),null);await assert.rejects(fetch(f.url));}
});
