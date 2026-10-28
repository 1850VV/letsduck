/** Real Electron first-use entry with an owned profile, simulated numbering, and blocked ADB. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {desktopScope,seedSimulatedAssembly,required} from '../scripts/check-support.js';
const output=process.env.DUCK_TEST_OUTPUT??'output/home-experimental-electron';await mkdir(output,{recursive:true});
const scope=await desktopScope('duck-first-use-'),checks:string[]=[],errors:string[]=[];let passed=false;
try{
 seedSimulatedAssembly(required(scope.env.DUCK_PERSONAL_DB));
 let app=await scope.launch(),page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));
 await page.waitForSelector('body[data-home-ready=true]');
 const duck=(id:string)=>page.locator('[data-duck='+id+']');
 assert.equal(await duck('debug').getAttribute('data-beta-locked'),'true');assert.equal(await duck('assemble').getAttribute('data-beta-locked'),'true');checks.push('fresh Electron profile locks both experiments');
 const identity=await app.evaluate(()=>({platform:process.platform,arch:process.arch}));
 await page.screenshot({path:join(output,'first-use.png')});
 const box=required(await duck('debug').boundingBox());await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
 try{await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck=debug]')?.dataset.betaLocked==='false',undefined,{timeout:4000});}finally{await page.mouse.up();}
 assert.equal(await duck('assemble').getAttribute('data-beta-locked'),'true');assert(await page.locator('#module-window').isHidden());checks.push('pointer hold unlocks only debug and stays on home');
 await page.locator('#tip-close').click();await duck('debug').click();await page.frameLocator('#module-frame').locator('#scan-servos').waitFor();checks.push('next click enters actual debug iframe');await page.locator('#close-module').click();
 await duck('assemble').click();await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck=assemble]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');
 await duck('assemble').focus();await page.keyboard.down('Space');
 try{await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck=assemble]')?.dataset.betaLocked==='false',undefined,{timeout:4000});}finally{await page.keyboard.up('Space');}
 assert(await page.locator('#module-window').isHidden());checks.push('keyboard hold unlocks assembly without entering');
 await page.locator('#tip-close').click();await duck('assemble').click();await page.frameLocator('#module-frame').locator('#playback-rate select').waitFor();await required(page.frames().find(f=>f.url()==='duck://app/assemble/')).waitForFunction(()=>document.documentElement.dataset.ready==='true',undefined,{timeout:60000});checks.push('numbered fixture enters real assembly iframe');await page.locator('#close-module').click();
 await page.screenshot({path:join(output,'unlocked.png')});await scope.close(app);
 app=await scope.launch();page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.waitForSelector('body[data-home-ready=true]');
 assert.equal(await duck('debug').getAttribute('data-beta-locked'),'false');assert.equal(await duck('assemble').getAttribute('data-beta-locked'),'false');checks.push('actual application restart preserves both acknowledgements');
 await page.goto('duck://app/debug/');await page.locator('#scan-servos').waitFor();checks.push('acknowledged direct entry stays available');
 assert.deepEqual(errors,[]);checks.push('no renderer errors');passed=true;console.log(JSON.stringify({passed,identity,checks,numbering:'15 simulated records; physical device not tested'}));
}finally{await scope.dispose();await writeFile(join(output,'receipt.json'),JSON.stringify({passed,checks,errors,processesClosed:true,adb:scope.adbEvidence(),numbering:'15 simulated records; physical device not tested'},null,2));}
