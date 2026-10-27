// Isolated browser regression; never permits controller commands.
async page=>{
 const errors=[],writes=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/duck-debug/action',async route=>{writes.push(route.request().postData());await route.fulfill({status:409,json:{error:'Read-only mapping verification'}});});
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8896/debug/');await page.waitForSelector('body[data-model-ready=true]');
 const groups=await page.locator('.slot-group-title').allTextContents();
 check('卡槽10–14为左腿、20–24为右腿',groups[0].includes('左腿')&&groups[0].includes('10–14')&&groups[1].includes('右腿')&&groups[1].includes('20–24'));
 for(const [id,name] of [[12,'左腿上端'],[14,'左脚踝'],[22,'右腿上端'],[24,'右脚踝']]){
  await page.locator(`[data-slot="${id}"]`).click();await page.locator(`[data-model="${id}"]`).waitFor({state:'visible'});
  check('ID'+id+'参数卡与3D选择对应',await page.locator('#panel').innerText().then(s=>s.includes(name))&&await page.locator(`[data-model="${id}"]`).evaluate(el=>el.classList.contains('selected')));
 }
 await page.locator('[data-view=tray]').click();check('固定盘位仍为15个',await page.locator('#slots [data-slot]').count()===15);
 await page.locator('[data-view=robot]').click();await page.locator('[data-slot="14"]').click();
 await page.screenshot({path:'output/playwright/debug-leg-map/fixture-after.png'});
 check('不发送设备操作请求',writes.length===0);check('无加载错误',errors.length===0);
 await page.unrouteAll({behavior:'wait'});return {pass:true,checks,writes,errors};
}
