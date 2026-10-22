async page=>{
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize({width:1440,height:950});await page.goto('http://127.0.0.1:8877/gallery/');
  await page.locator('.card').first().waitFor();
  await page.locator('#language-trigger').click();await page.locator('[data-locale="fr"]').click();
  if(errors.length)throw Error(errors.join('\n'));
  await page.locator('.card .visual').first().click();await page.locator('#viewer canvas').waitFor();
  await page.locator('#spin').click();
  const point=await page.locator('#viewer canvas').boundingBox();
  await page.mouse.move(point.x+point.width*.45,point.y+point.height*.45);await page.mouse.down();await page.mouse.move(point.x+point.width*.45+100,point.y+point.height*.45+30,{steps:12});await page.mouse.up();
  const pixelHash=()=>{
    const source=document.querySelector('#viewer canvas'),small=document.createElement('canvas');small.width=small.height=32;
    const ctx=small.getContext('2d');ctx.drawImage(source,0,0,32,32);let h=2166136261;for(const b of ctx.getImageData(0,0,32,32).data)h=Math.imul(h^b,16777619);return h>>>0;
  };
  await page.waitForFunction(()=>{const source=document.querySelector('#viewer canvas'),small=document.createElement('canvas');small.width=small.height=32;const ctx=small.getContext('2d');ctx.drawImage(source,0,0,32,32);let h=2166136261;for(const b of ctx.getImageData(0,0,32,32).data)h=Math.imul(h^b,16777619);window._sameView=window._lastView===h?(window._sameView||0)+1:0;window._lastView=h;return window._sameView>6;});
  const before=await page.evaluate(pixelHash);
  await page.evaluate(async()=>{const {setLocale}=await import('/shared/i18n.mjs');setLocale('en');});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const after=await page.evaluate(pixelHash);
  if(before!==after)throw Error('Gallery view reset when language changed');
  if(errors.length)throw Error(errors.join('\n'));
  return {passed:true,viewPreserved:true,errors};
}
