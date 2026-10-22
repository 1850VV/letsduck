async page=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8877/');await page.waitForFunction(()=>window.studioProto);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  if(await page.locator('html').getAttribute('lang')!=='en'){await page.locator('#language-trigger').click();await page.locator('[data-locale="en"]').click();}
  const audit=()=>page.evaluate(()=>{
    const out=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const n=walker.currentNode;
      if(/[\u3400-\u9fff]/.test(n.textContent)&&n.parentElement.getClientRects().length&&!n.parentElement.closest('script,style,[data-brand-slot],#scheme-name'))out.push({text:n.textContent,html:n.parentElement.outerHTML.slice(0,160)});
    }
    return out.slice(0,30);
  });
  const result={};
  await page.locator('[data-step="2"]').click();result.refine=await audit();
  await page.locator('[data-step="3"]').click();result.show=await audit();
  await page.locator('[data-ptab="share"]').click();await page.locator('#open-poster').click();
  await page.waitForFunction(()=>document.querySelector('#poster-img').complete);result.poster=await audit();
  await page.locator('#poster-close').click();await page.locator('[data-ptab="print"]').click();await page.locator('#export2').click();
  await page.waitForFunction(()=>document.querySelector('#dl-bom')||document.querySelector('#match-bambu'));result.export=await audit();
  result.errors=errors;return result;
}
