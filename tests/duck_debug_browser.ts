import type {Page} from 'playwright';
import * as browserChecks from './browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture debug --check tests/duck_debug_browser.ts
export default async (page:Page)=>{
 await browserChecks.preparePage(page);
 const base=browserChecks.browserUrl(),checks:browserChecks.Check[]=[];await page.unrouteAll({behavior:'wait'});await browserChecks.preparePage(page);await page.goto('about:blank');await page.request.post(base+'/api/fixture/reset');let changed=false,imuOk=true;
 await page.route('**/api/duck-debug/status',async route=>{const r=await route.fetch();const data=await r.json();data.status.imu_ok=imuOk;if(changed){for(const d of data.devices)if(d.online)d.pos=3000;data.status.acc=[9,8,7];data.status.angles=Array(15).fill(99);data.status.targets=Array(15).fill(88);}await route.fulfill({response:r,json:data});});
 const check=async(name:string,predicate:()=>boolean|undefined)=>{try{await page.waitForFunction(predicate,{},{timeout:1600});checks.push({name,pass:true});}catch{checks.push({name,pass:false});await page.screenshot({path:'output/duck-debug/review-'+name+'-failure.png',fullPage:true});}};
 await browserChecks.preparePage(page);await page.goto(base+'/debug/');await page.waitForFunction(()=>document.body.dataset.modelReady==='true');await page.locator('[data-workbench=control]').click();await page.locator('[data-control-tab=feedback]').click();changed=true;
 await check('imu-refresh',()=>document.querySelector('.imu-readout')?.textContent.includes('9.000 / 8.000 / 7.000'));
 await check('joint-refresh',()=>document.querySelector('.joint-feedback')?.textContent.includes('3000')&&document.querySelector('.joint-feedback')?.textContent.includes('99.0°')&&document.querySelector('.joint-feedback')?.textContent.includes('88.0°'));
 imuOk=false;await check('invalid-imu-blank',()=>[...document.querySelectorAll('.imu-readout b')].every(el=>el.textContent==='—'));imuOk=true;
 changed=false;await page.waitForTimeout(400);await page.locator('[data-workbench=calibrate]').click();changed=true;
 await check('calibration-refresh',()=>document.querySelector('.cal-selected')?.textContent.includes('3000'));
 await page.locator('[data-workbench=servo]').click();await page.locator('[data-slot="12"]').click();
 await page.route('**/api/duck-debug/action',async route=>{const r=await route.fetch();await new Promise(resolve=>setTimeout(resolve,650));await route.fulfill({response:r});});
 await page.locator('[data-action=hold]').click();await page.waitForFunction(()=>document.querySelector('#feedback')?.textContent.includes('微调已开启'));
 await check('micro-enable-poll',()=>!window.__browserChecks.query<HTMLButtonElement>('[data-jog="1"]').disabled&&document.querySelector('[data-action=hold]')?.textContent.includes('关闭微调'));
 await page.unrouteAll({behavior:'wait'});return {checks,pass:checks.every(c=>c.pass)};
}
