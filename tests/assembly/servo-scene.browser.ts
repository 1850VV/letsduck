import * as browserChecks from '../browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture preparation --script --check tests/assembly/servo-scene.browser.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

import {PNG} from 'pngjs';
import {STEPS,OVERVIEW_STEP} from '../../frontend/assemble/hardware-state.js';

function modelPixels(buffer:Buffer){
 const png=PNG.sync.read(buffer);let count=0;
 for(let i=0;i<png.data.length;i+=4)if((png.data[i]??255)<220&&(png.data[i+1]??255)<220&&(png.data[i+2]??255)<220)count++;
 return count;
}

test('servo overview renders independently of the saved tutorial step',{
 skip:!process.env.ASSEMBLY_TEST_URL,timeout:120000,
},async t=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  for(const step of [STEPS.findIndex(s=>s.id==='prepare-usb'),STEPS.findIndex(s=>s.id==='r-prepare'),OVERVIEW_STEP]){
   await t.test(browserChecks.required(STEPS[step]).id,async()=>{
    const context=await browser.newContext({viewport:{width:1400,height:1040}});
    try{
     await context.addInitScript(value=>localStorage.setItem('letsduck-assembly',JSON.stringify({step:value})),step);
     const page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
     await browserChecks.preparePage(page);await page.goto(process.env.ASSEMBLY_TEST_URL+'/assemble/');
     await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype?.servo?.supported);
     assert.equal(await page.evaluate(()=>window.anklePrototype.state.step),step);
     const source=await page.evaluate(()=>window.anklePrototype.getActorTransform('t_motor21'));
     await page.locator('#servo-open').click();
     await page.waitForFunction(()=>(window.anklePrototype.servo?.models?.draws??0)>0);
     const frame=await page.locator('#sv-viewport').screenshot(),pixels=modelPixels(frame);
     if(process.env.ASSEMBLY_EVIDENCE_DIR){
      await mkdir(process.env.ASSEMBLY_EVIDENCE_DIR,{recursive:true});
      await writeFile(join(process.env.ASSEMBLY_EVIDENCE_DIR,browserChecks.required(STEPS[step]).id+'.png'),frame);
     }
     assert.ok(pixels>3000,`${browserChecks.required(STEPS[step]).id}: assembled duck must be visible; measured ${pixels} model pixels`);
     assert.equal(await page.locator('.sv-model-label:visible').count(),0);
     await page.locator('.sv-slot[data-id="21"]').click();
     await page.locator('#sv-arrange').click();
     await page.waitForFunction(()=>window.anklePrototype.servo?.view==='tray');
     assert.ok(modelPixels(await page.locator('#sv-viewport').screenshot())>3000,'spread servos remain visible');
     await page.locator('#sv-arrange').click();
     await page.waitForFunction(()=>window.anklePrototype.servo?.view==='robot');
     assert.ok(modelPixels(await page.locator('#sv-viewport').screenshot())>3000,'folding back preserves the duck');
     assert.equal(await page.locator('.sv-model-label:visible').count(),1);
     assert.equal(await page.evaluate(()=>window.__browserChecks.required(window.anklePrototype.servo).selected),21);
     await page.locator('#sv-close').click();
     assert.equal(await page.evaluate(()=>window.anklePrototype.state.step),step);
     assert.deepEqual(await page.evaluate(()=>window.anklePrototype.getActorTransform('t_motor21')),source,'overview must not change the tutorial actor');
     assert.deepEqual(errors,[]);
    }finally{await context.close();}
   });
  }
 }finally{await browser.close();}
});
