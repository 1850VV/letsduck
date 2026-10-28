/** Actual community host; its existing root remains the paint page. */
import assert from 'node:assert/strict';
import type {Page} from 'playwright';
import {preparePage,browserUrl} from './browser/checks.js';
export default async(page:Page)=>{
 await preparePage(page);const base=browserUrl(),debugRequests:string[]=[];
 page.on('request',request=>{if(request.url().includes('/api/duck-debug/'))debugRequests.push(request.url());});
 await page.goto(base+'/debug/');await page.waitForURL('**/home.html?unlock=debug');
 await page.waitForSelector('body[data-home-ready=true]');
 const debug=page.locator('[data-duck=debug]');assert.equal(await debug.getAttribute('data-beta-permanent'),'true');assert.equal(await debug.getAttribute('data-beta-locked'),'true');
 await debug.click();assert.match(await page.locator('#beta-tip').innerText(),/仅本地客户端可用/);
 assert.equal((await page.request.get(base+'/api/duck-debug/status')).status(),404);
 assert.deepEqual(debugRequests,[]);
 return {pass:true,checks:['actual server overrides stored unlock','direct debug returns to home','client-only notice','device API absent','no device polling'],previewAssets:'not distributed by existing community host; fallback labels checked'};
};
