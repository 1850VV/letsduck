// Optional real-asset UI verification. Run only against the isolated debug_browser_fixture.py.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8896',out=process.env.DUCK_FILAMENT_EVIDENCE||'output/filament-library';
if(!/^http:\/\/127\.0\.0\.1:8896\/?$/.test(base))throw Error('Use the isolated fixture on port 8896; this test saves a temporary design.');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false}),results={errors:[],checks:[]};let context;
try{
 context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(out,'video'),size:{width:1280,height:800}},locale:'zh-CN'});
 const page=await context.newPage();page.on('pageerror',e=>results.errors.push(String(e)));
 await page.goto(base+'/paint');await page.waitForFunction(()=>window.studioProto);
 if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
 await page.locator('[data-start="original"]').click();await page.locator('[data-step="2"]').click();
 const data=await page.evaluate(()=>fetch('/api/catalog').then(r=>r.json()));assert.equal(data.products.length,2070);assert.equal(data.pendingProducts.length,119);
 assert.equal(await page.locator('[data-brand]').count(),4);results.checks.push('2070 official HEX records, 119 pending, four real brands');
 const pick=(brand,series,condition=()=>true)=>data.products.find(p=>p.brand===brand&&p.series===series&&condition(p));
 const choices=[['head-shell',pick('Bambu Lab','PLA-CF')],['body-shell',pick('Polymaker','Panchroma™ Matte PLA')],['feet',pick('eSUN','PLA+')],['soles',pick('SUNLU','TPU 90A')]];
 assert.ok(choices.every(([,p])=>p),'Required approved product series are in the official snapshot');
 for(const [zone,p] of choices){
  await page.locator(`[data-zone="${zone}"]`).click();await page.locator(`[data-brand="${p.brandId}"]`).click();await page.locator('#filament-series').selectOption(p.series);await page.locator('#search').fill(p.colorCode||p.skus?.[0]||p.name);
  await page.locator(`#lib-grid [data-key="${p.id}"]`).click();await page.mouse.move(700,300);
 }
 await page.locator('#search').fill('');await page.locator('[data-zone="head-shell"]').click();await page.locator('[data-brand="bambu"]').click();await page.locator('#filament-series').selectOption('PLA-CF');
 assert.equal(await page.locator('[data-brand].on').count(),1);assert.equal(await page.locator('[data-brand].on').getAttribute('data-brand'),'bambu');await page.waitForFunction(()=>getComputedStyle(document.querySelector('.pane-filament')).opacity==='1');await page.screenshot({path:path.join(out,'actual-desktop.png')});
 await page.keyboard.press('Meta+s');await page.waitForFunction(()=>window.studioProto.state.activeId);
 const schemes=await page.evaluate(()=>fetch('/api/schemes').then(r=>r.json()));const saved=schemes[0];assert.ok(saved?.design);
 for(const [,p]of choices)assert.ok(Object.values(saved.design.assignments).includes(p.id));
 await page.reload();await page.waitForFunction(()=>window.studioProto);await page.locator('[data-step="2"]').click();
 const after=await page.evaluate(()=>fetch('/api/schemes').then(r=>r.json()));assert.deepEqual(after[0].design.assignments,saved.design.assignments);
 await page.locator('[data-step="3"]').click();await page.locator('[data-ptab="print"]').click();await page.locator('#export2').click();await page.locator('#dl-3mf').waitFor();
 const descriptions=await page.locator('.ex-p').allTextContents();assert.ok(descriptions.find(t=>t.includes('SUNLU')&&!t.includes('Bambu Lab')));await page.screenshot({path:path.join(out,'actual-export.png')});
 const bomEvent=page.waitForEvent('download');await page.locator('#dl-bom').click();await (await bomEvent).saveAs(path.join(out,'actual-bom.csv'));
 const csv=await fs.readFile(path.join(out,'actual-bom.csv'),'utf8');assert.ok(csv.includes('"系列"'));assert.ok(csv.includes('"SKU"'));assert.ok(!csv.includes('"undefined"'));assert.ok(!csv.includes('"null"'));
 for(const [,p]of choices)for(const value of [p.brand,p.series,p.colorCode,...(p.skus||[])].filter(Boolean))assert.ok(csv.includes(value.replaceAll('"','""')),value+' missing from BOM');
 const exportEvent=page.waitForEvent('download');await page.locator('#dl-3mf').click();await(await exportEvent).saveAs(path.join(out,'actual.3mf'));
 results.checks.push('four brands painted through UI, saved and reopened, actual BOM and 3MF downloaded');
 await page.locator('#export-dialog').evaluate(d=>d.close());await page.locator('[data-step="2"]').click();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-brand="sunlu"]').waitFor({state:'visible',timeout:3000});await page.screenshot({path:path.join(out,'actual-narrow.png')});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 results.checks.push('narrow viewport has no horizontal overflow');assert.deepEqual(results.errors,[]);
 results.products=choices.map(([zone,p])=>({zone,id:p.id,brand:p.brand,series:p.series,colorCode:p.colorCode,skus:p.skus,colors:p.colors}));console.log(JSON.stringify(results));
}catch(error){results.failure=String(error.stack||error);throw error;}
finally{await context?.close();await browser.close();await fs.writeFile(path.join(out,'browser.json'),JSON.stringify(results,null,2));}
