// Regression checks for review-language refresh and duplicate export prevention.
async () => {
 page.setDefaultTimeout(10000);const app=page.frame({name:'personal-paint'}),failures=[],passed=[];
 const check=(v,label)=>(v?passed:failures).push(label);
 await app.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 await app.evaluate(async()=>{const i=await import('/shared/i18n.mjs');i.setLocale('zh-Hans')});
 await app.locator('#steps [data-step="1"]').click();await app.locator('[data-start="original"]').first().click();await app.locator('#steps [data-step="3"]').click();
 await app.locator('#export2').click();await app.locator('#review-materials').waitFor();
 await app.evaluate(async()=>{const i=await import('/shared/i18n.mjs');i.setLocale('en')});
 await page.waitForTimeout(200);
 check((await app.locator('.cd-checks').innerText()).includes('I checked'),'open unconfirmed review follows locale preference');
 await app.locator('#review-materials').check();await app.locator('#review-slice').check();
 let release;const gate=new Promise(r=>release=r);let requests=0;
 await page.route('**/api/export',async route=>{requests++;await gate;await route.fulfill({status:503,contentType:'application/json',body:'{"code":"request_failed"}'});});
 try{
  const request=page.waitForRequest('**/api/export');await app.locator('#dl-3mf').click();await request;
  await app.locator('#review-materials').uncheck();await app.locator('#review-materials').check();
  check(await app.locator('#dl-3mf').isDisabled(),'confirmation toggles cannot reenable an in-flight export');
  release();await app.waitForFunction(()=>document.querySelector('#ex-status').textContent.includes('failed'),null,{timeout:10000});
  check(await app.locator('#dl-3mf').isEnabled(),'failed export can be retried after review');
 }finally{release();await page.unroute('**/api/export');await app.locator('#export-dialog [data-close]').click();await app.evaluate(async()=>{const i=await import('/shared/i18n.mjs');i.setLocale('zh-Hans')});}
 // Even a successful response must not download after an acknowledgement was withdrawn.
 await app.locator('#export2').click();await app.locator('#review-materials').waitFor();await app.locator('#review-materials').check();await app.locator('#review-slice').check();
 let finish;const responseGate=new Promise(r=>finish=r);let downloads=0;const countDownload=()=>downloads++;page.on('download',countDownload);
 await page.route('**/api/export',async route=>{await responseGate;await route.fulfill({status:200,contentType:'application/octet-stream',body:'discarded-response'});});
 try{
  const request=page.waitForRequest('**/api/export');await app.locator('#dl-3mf').click();await request;
  await app.locator('#review-materials').uncheck();await app.locator('#review-materials').check();finish();
  await app.waitForFunction(()=>document.querySelector('#ex-status').textContent.includes('取消'),null,{timeout:10000});
  check(downloads===0,'withdrawn acknowledgement discards a later successful response');
 }finally{finish();page.off('download',countDownload);await page.unroute('**/api/export');await app.locator('#export-dialog [data-close]').click();}
 if(failures.length)throw Error(JSON.stringify({failures,passed,requests}));return {passed,requests};
}
