import assert from 'node:assert/strict';
import type {Page} from 'playwright';
import * as checks from '../browser/checks.js';

// Real home iframe journey: assembly remains instructional, device controls live in Debug.
export default async(page:Page)=>{
 await checks.preparePage(page);const errors:string[]=[],actions:string[]=[];
 page.on('pageerror',error=>{errors.push(error.message);console.error('Boundary renderer error:',error.message);});
 page.on('request',request=>{if(request.method()==='POST'&&/\/api\/(servo-setup|duck-debug)/.test(request.url()))actions.push(request.url());});
 const origin=checks.browserUrl(),history=await(await fetch(origin+'/api/servo-setup/records')).text();
 await page.goto(origin+'/');await page.waitForSelector('body[data-home-ready=true]');
 const assembly=page.locator('[data-duck=assemble]');await assembly.click();
 await page.waitForFunction(()=>document.querySelector('[data-duck=assemble]')?.getAttribute('data-c-position')==='true'&&document.querySelector('.duck-stage')?.getAttribute('data-settled')!=='false');
 await assembly.click();await page.locator('#module-window').waitFor({state:'visible'});
 const frame=checks.required(await checks.required(await page.locator('#module-frame').elementHandle()).contentFrame());
 await frame.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.preparation?.loaded);
 assert.equal(await frame.getByRole('button',{name:'舵机准备',exact:true}).count(),0,'Assembly must not expose the duplicate device workbench');
 assert.equal(await frame.getByRole('button',{name:'打开舵机准备',exact:true}).count(),0);
 await frame.locator('#start').click();await frame.waitForFunction(()=>window.anklePrototype.state.step===1);
 await frame.locator('#step-materials').click();await frame.locator('#kit').waitFor({state:'visible'});
 assert.ok(await frame.locator('#kit-parts .material-row').count()>0,'Chapter materials still load independently of device controls');
 await page.locator('#close-module').click();
 const debug=page.locator('[data-duck=debug]');await debug.click();
 await page.waitForFunction(()=>document.querySelector('[data-duck=debug]')?.getAttribute('data-c-position')==='true'&&document.querySelector('.duck-stage')?.getAttribute('data-settled')!=='false');
 await debug.click();
 const debugFrame=checks.required(await checks.required(await page.locator('#module-frame').elementHandle()).contentFrame());
 await debugFrame.getByRole('button',{name:'扫描0–253',exact:true}).waitFor();
 assert.deepEqual(await debugFrame.locator('[data-workbench]').allTextContents(),['舵机设置','自动编号','整机控制','中位校准']);
 await debugFrame.locator('[data-workbench=automatic]').click();await debugFrame.locator('#auto-progress').filter({hasText:'15/15'}).waitFor();
 assert.match(await debugFrame.locator('#auto-progress').innerText(),/15\/15/,'Migrated automatic entry reads the same saved numbering proof');
 assert.equal(await(await fetch(origin+'/api/servo-setup/records')).text(),history,'Removing Assembly controls preserves existing ID records');
 assert.deepEqual(actions,[]);assert.deepEqual(errors,[]);
 await page.locator('#close-module').click();return {passed:true,assemblyEntry:'no device workbench',tutorialAndMaterials:true,debugControls:true,automaticEntry:true,historyPreserved:true,idleDeviceActions:0};
};
