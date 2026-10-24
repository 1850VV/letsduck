// Selection scope, locks, and all-locale C coverage on real model data.
async () => {
 page.setDefaultTimeout(10000);const app=page.frame({name:'personal-paint'}),passed=[];
 const check=(v,label)=>{if(!v)throw Error(label);passed.push(label);};
 await app.locator('#steps [data-step="2"]').click();await app.locator('[data-paint-zone="body-shell"]').click();
 if(!await app.locator('#paint-tools').evaluate(e=>e.open))await app.locator('#paint-tools>summary').click();
 const colors=()=>app.evaluate(()=>structuredClone(window.studioProto.state.colors));const before=await colors();
 await app.locator('[data-scope="left"]').click();
 await app.locator('#paint-quick [data-key^="bambu-"]').last().click();const left=await colors();
 check(Object.keys(before).filter(id=>id!=='P5-07').every(id=>before[id]===left[id]),'left scope leaves right and center parts unchanged');
 await app.locator('[data-scope="right"]').click();await app.locator('#paint-quick [data-key^="bambu-"]').first().click();const right=await colors();
 check(right['P5-07']===left['P5-07'],'right scope preserves left color');
 check(Object.keys(before).filter(id=>!['P5-07','P5-06'].includes(id)).every(id=>before[id]===right[id]),'scope switches preserve all outside instances');
 await app.locator('[data-scope="all"]').click();await app.locator('[data-paint-lock="body-shell"]').click();const locked=await colors();
 check((await app.locator('#paint-scope').innerText()).includes('锁定 4'),'scope counts real locked instances');
 await app.locator('#paint-quick [data-key^="bambu-"]').last().click();check(JSON.stringify(await colors())===JSON.stringify(locked),'locked targets cannot be painted');await app.locator('[data-paint-lock="body-shell"]').click();
 for(const locale of ['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi']){
  await app.evaluate(async locale=>{const i=await import('/shared/i18n.mjs');i.setLocale(locale);},locale);const text=await app.locator('#paint-scope').innerText();
  check(!/cd\.|\{(?:part|count|editable|locked)\}/.test(text),'paint locale '+locale);
  if(!['zh-Hans','zh-Hant','ja'].includes(locale))check(!/[\u3400-\u9fff]/.test(text),'no Chinese scope fallback '+locale);
 }
 await app.evaluate(async()=>{const i=await import('/shared/i18n.mjs');i.setLocale('zh-Hans')});return {passed};
}
