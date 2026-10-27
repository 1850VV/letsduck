import type {Product} from '../frontend/shared/types.js';
import * as browserChecks from './browser/checks.js';
// Export/data setup uses selectOption; it does not certify native dropdown interaction.
// Check homepage paint interaction with tests/browser/paint-basic-ui.ts plus native OS input.
// Optional real-asset UI verification. Run only against the isolated debug_browser_fixture.ts.

import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=browserChecks.browserUrl(),out=process.env.DUCK_FILAMENT_EVIDENCE||'output/filament-library';
const fixture:unknown=await(await fetch(base+'/api/fixture')).json();if(!fixture||typeof fixture!=='object'||!('isolated'in fixture)||fixture.isolated!==true)throw Error('Use the isolated debug_browser_fixture.ts; this test saves a temporary design.');
await fs.mkdir(out,{recursive:true});
const browser=await browserChecks.launchBrowser({headless:false}),results:{errors:string[];checks:string[];products?:{zone:string;id:string;brand:string|undefined;series:string|undefined;colorCode:string|null|undefined;skus:string[]|undefined;colors:string[]|undefined}[];failure?:string}={errors:[],checks:[]};let context;
try{
 context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(out,'video'),size:{width:1280,height:800}},locale:'zh-CN'});
 const page=await context.newPage();page.on('pageerror',e=>results.errors.push(String(e)));
 await browserChecks.preparePage(page);await page.goto(base+'/paint');await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
 if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
 await page.locator('[data-start="original"]').click();await page.locator('[data-step="2"]').click();
 const data=await page.evaluate(async()=>{const raw:unknown=await fetch('/api/catalog').then(r=>r.json());const catalog=window.__duckModules.parseCatalog(raw);if(!raw||typeof raw!=='object'||!('pendingProducts'in raw)||!Array.isArray(raw.pendingProducts))throw Error('Pending products missing');return {...catalog,pendingProducts:raw.pendingProducts};});assert.equal(data.products.length,2070);assert.equal(data.pendingProducts?.length,119);
 assert.equal(await page.locator('[data-brand]').count(),4);results.checks.push('2070 official HEX records, 119 pending, four real brands');
 const pick=(brand:string,series:string,condition:(p:Product)=>boolean=()=>true)=>browserChecks.required(data.products.find(p=>p.brand===brand&&p.series===series&&condition(p)));
 const choices=[['head-shell',pick('Bambu Lab','PLA-CF')],['body-shell',pick('Polymaker','Panchroma™ Matte PLA')],['feet',pick('eSUN','PLA+')],['soles',pick('SUNLU','TPU 90A')]] as const;
 assert.ok(choices.every(([,p])=>p),'Required approved product series are in the official snapshot');
 for(const [zone,p] of choices){
  await page.locator(`[data-zone="${zone}"]`).click();await page.locator(`[data-brand="${p.brandId}"]`).click();await page.locator('#filament-series').selectOption(browserChecks.required(p.series));await page.locator('#search').fill(p.colorCode||p.skus?.[0]||p.name);
  await page.locator(`#lib-grid [data-key="${p.id}"]`).click();await page.mouse.move(700,300);
 }
 await page.locator('#search').fill('');await page.locator('[data-zone="head-shell"]').click();await page.locator('[data-brand="bambu"]').click();await page.locator('#filament-series').selectOption('PLA-CF');
 assert.equal(await page.locator('[data-brand].on').count(),1);assert.equal(await page.locator('[data-brand].on').getAttribute('data-brand'),'bambu');await page.waitForFunction(()=>getComputedStyle(window.__browserChecks.query('.pane-filament')).opacity==='1');await page.screenshot({path:path.join(out,'actual-desktop.png')});
 await page.keyboard.press('Meta+s');await page.waitForFunction(()=>window.studioProto.state.activeId);
 const schemes=await page.evaluate(()=>fetch('/api/schemes').then(r=>r.json()));const saved=schemes[0];assert.ok(saved?.design);
 for(const [,p]of choices)assert.ok(Object.values(saved.design.assignments).includes(p.id));
 await page.reload();await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);await page.locator('[data-step="2"]').click();
 const after=await page.evaluate(()=>fetch('/api/schemes').then(r=>r.json()));assert.deepEqual(after[0].design.assignments,saved.design.assignments);
 await page.locator('[data-step="3"]').click();await page.locator('[data-ptab="print"]').click();await page.locator('#export2').click();await page.locator('#dl-3mf').waitFor();
 const descriptions=await page.locator('.ex-p').allTextContents();assert.ok(descriptions.find(t=>t.includes('SUNLU')&&!t.includes('Bambu Lab')));await page.screenshot({path:path.join(out,'actual-export.png')});
 const bomEvent=page.waitForEvent('download');await page.locator('#dl-bom').click();await (await bomEvent).saveAs(path.join(out,'actual-bom.csv'));
 const csv=await fs.readFile(path.join(out,'actual-bom.csv'),'utf8');assert.ok(csv.includes('"系列"'));assert.ok(csv.includes('"SKU"'));assert.ok(!csv.includes('"undefined"'));assert.ok(!csv.includes('"null"'));
 for(const [,p]of choices)for(const value of [p.brand,p.series,p.colorCode,...(p.skus||[])].filter(Boolean))assert.ok(csv.includes(browserChecks.required(value).replaceAll('"','""')),value+' missing from BOM');
 const exportEvent=page.waitForEvent('download');await page.locator('#dl-3mf').click();await(await exportEvent).saveAs(path.join(out,'actual.3mf'));
 results.checks.push('four brands painted through UI, saved and reopened, actual BOM and 3MF downloaded');
 await page.locator('#export-dialog').evaluate(d=>{if(!(d instanceof HTMLDialogElement))throw Error('Expected dialog');d.close();});await page.locator('[data-step="2"]').click();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-brand="sunlu"]').waitFor({state:'visible',timeout:3000});await page.screenshot({path:path.join(out,'actual-narrow.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 results.checks.push('narrow viewport has no horizontal overflow');assert.deepEqual(results.errors,[]);
 results.products=choices.map(([zone,p])=>({zone,id:p.id,brand:p.brand,series:p.series,colorCode:p.colorCode,skus:p.skus,colors:p.colors}));console.log(JSON.stringify(results));
}catch(error){results.failure=browserChecks.failure(error);throw error;}
finally{await context?.close();await browser.close();await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(results,null,2));}
