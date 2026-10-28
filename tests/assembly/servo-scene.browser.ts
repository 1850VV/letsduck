import * as browserChecks from '../browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture preparation --script --check tests/assembly/servo-scene.browser.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

import {PNG} from 'pngjs';
import {STEPS} from '../../frontend/assemble/hardware-state.js';

function modelPixels(buffer:Buffer){
 const png=PNG.sync.read(buffer);let count=0;
 for(let i=0;i<png.data.length;i+=4)if((png.data[i]??255)<220&&(png.data[i+1]??255)<220&&(png.data[i+2]??255)<220)count++;
 return count;
}

// The retired Workbench overview is covered by Debug's shared scene check.
// Assembly retains the real tutorial model and the physical inventory overlay.
test('servo pickup preserves the saved tutorial scene and manufacturing poses',{
 skip:!process.env.ASSEMBLY_TEST_URL,timeout:120000,
},async t=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  for(const [stepId,id]of [['l-prepare',14],['r-prepare',24],['t-pair',10]] as const){
   const step=STEPS.findIndex(s=>s.id===stepId);assert.ok(step>=0);
   await t.test(stepId,async()=>{
    const context=await browser.newContext({locale:'zh-CN',viewport:{width:1400,height:1040}});
    try{
     await context.addInitScript(value=>localStorage.setItem('letsduck-assembly',JSON.stringify({step:value})),step);
     const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
     await browserChecks.preparePage(page);await page.goto(process.env.ASSEMBLY_TEST_URL+'/assemble/');
     await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype?.preparation?.loaded&&!!document.querySelector('#sp-summary'));
     assert.equal(await page.locator('#servo-open, #servo-guide-open').count(),0,'Assembly no longer exposes the retired automatic Workbench');
     if(await page.locator('body').evaluate(el=>el.classList.contains('desk')))await page.locator('#desk-toggle').click();
     await page.keyboard.press('Escape');
     assert.equal(await page.evaluate(()=>window.anklePrototype.state.step),step);
     const source=await page.evaluate(()=>window.anklePrototype.state.actors),frame=await page.locator('#canvas-host canvas').screenshot(),pixels=modelPixels(frame);
     if(process.env.ASSEMBLY_EVIDENCE_DIR){
      await mkdir(process.env.ASSEMBLY_EVIDENCE_DIR,{recursive:true});
      await writeFile(join(process.env.ASSEMBLY_EVIDENCE_DIR,stepId+'.png'),frame);
     }
     assert.ok(pixels>3000,`${stepId}: tutorial geometry must be visible; measured ${pixels} model pixels`);
     await page.locator('#instruction-toggle').click();await page.locator(`[data-servo-ids="${id}"]`).click();
     assert.equal(await page.locator('#servo-pickup').isVisible(),true);
     assert.deepEqual(await page.locator('.sp-slot').evaluateAll(els=>els.map(el=>Number(el.getAttribute('data-id')))),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
     await page.locator('.sp-slot[data-id="21"]').click();assert.match(await page.locator('#sp-id').innerText(),/21/);
     await page.locator('#sp-close').click();assert.equal(await page.locator('#servo-pickup').isHidden(),true);
     assert.equal(await page.evaluate(()=>window.anklePrototype.state.step),step);
     assert.deepEqual(await page.evaluate(()=>window.anklePrototype.state.actors),source,'inventory selection must not change any tutorial manufacturing pose');
     assert.ok(modelPixels(await page.locator('#canvas-host canvas').screenshot())>3000,'closing inventory preserves the tutorial geometry');
     assert.deepEqual(errors,[]);
    }finally{await context.close();}
   });
  }
 }finally{const owned=await browserChecks.browserPids(browser);await browser.close();await browserChecks.processesExited(owned);}
});
