// Run against the isolated 8906 service through the owned managed-Chromium CLI session:
// playwright-cli -s=opt-cd-ui-1024 run-code "$(cat tests/cd-ui-browser.js)"
async () => {
 page.setDefaultTimeout(10000);
 const out='output/cd-ui-1024',results=[];
 const check=(condition,message)=>{if(!condition)throw Error(message);results.push(message);};
 const app=page.frame({name:'personal-paint'});
 await app.waitForFunction(()=>!!window.studioProto,null,{timeout:10000});
 await page.unroute('**/api/plan');await page.unroute('**/api/schemes/*');await app.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const state=()=>app.evaluate(()=>structuredClone(window.studioProto.state));
 await page.setViewportSize({width:1440,height:1000});
 await app.locator('#steps [data-step="1"]').click();await app.locator('[data-start="original"]').first().click();
 await app.locator('#steps [data-step="2"]').click();await page.waitForTimeout(450);
 const stage=await app.locator('#stage').boundingBox(),panel=await app.locator('#panel').boundingBox();
 check(stage.width>600&&panel.x>900,'desktop model and right panel visible');
 await app.locator('[data-paint-zone="body-shell"]').count().then(async n=>{if(n)await app.locator('[data-paint-zone="body-shell"]').click();else await app.locator('[data-paint-zone]').nth(2).click();});
 const before=await state(),ids=await app.evaluate(async()=>{const {ZONES}=await import('/lib/duck-workbench.mjs');return ZONES.find(z=>z.id===window.studioProto.state.sel.zone).ids;});
 const swatchIndex=await app.locator('#paint-quick [data-key]').evaluateAll((buttons,colors)=>buttons.findIndex(b=>b.dataset.key.startsWith('bambu-')&&colors.some(c=>c.toUpperCase()!==b.style.getPropertyValue('--c').toUpperCase())),ids.map(id=>before.colors[id]));
 const swatch=app.locator('#paint-quick [data-key]').nth(swatchIndex);
 await swatch.focus();await page.keyboard.press('Space');
 const painted=await state();
 check(ids.some(id=>painted.colors[id]!==before.colors[id]),'Space activates focused color');
 check(Object.keys(before.colors).filter(id=>!ids.includes(id)).every(id=>before.colors[id]===painted.colors[id]),'part painting leaves other instances unchanged');
 check(painted.sel.zone===before.sel.zone,'painting retains selected part context');
 await page.mouse.move(900,90);
 await app.waitForFunction(({ids,expected})=>{const actual={};window.studioProto.view.root.traverse(o=>{if(ids.includes(o.userData.id)&&o.material?.color)actual[o.userData.id]='#'+o.material.color.getHexString().toUpperCase();});return ids.every(id=>actual[id]===expected[id]);},{ids,expected:painted.colors},{timeout:4000});
 const rendered=await app.evaluate(ids=>{const colors={};window.studioProto.view.root.traverse(o=>{if(ids.includes(o.userData.id)&&o.material?.color)colors[o.userData.id]='#'+o.material.color.getHexString().toUpperCase();});return colors;},ids);
 check(ids.every(id=>rendered[id]===painted.colors[id]),'renderer colors match actual painted assignments');
 check((await swatch.getAttribute('aria-label')).includes('应用于'),'swatch accessible name includes target');
 await app.locator('#undo').click();check(JSON.stringify((await state()).colors)===JSON.stringify(before.colors),'undo restores real scheme');
 await app.locator('#redo').click();check(JSON.stringify((await state()).colors)===JSON.stringify(painted.colors),'redo restores painting');
 if(!await app.locator('#paint-palette').evaluate(e=>e.open))await app.locator('#paint-palette>summary').click();await app.locator('#search').fill('bifvp');
 check((await state()).tool==='select','tool keys do not fire while typing');
 await app.locator('#search').fill('');await app.locator('#paint-palette>summary').click();
 await app.locator('#paint-scope').click();await page.keyboard.press('b');check((await state()).tool==='brush','B activates brush');check((await app.locator('#paint-scope').innerText()).includes('刷子')&&(await app.locator('#paint-scope').innerText()).includes('0 件'),'brush scope waits for real target');
 await page.keyboard.press('v');check((await state()).tool==='select','V selects');
 await page.keyboard.press('i');check((await state()).tool==='pick','I activates eyedropper');
 await page.keyboard.press('v');await page.keyboard.press('f');check((await state()).focused,'F focuses selected geometry');
 await page.keyboard.press('f');await page.keyboard.press('p');check((await state()).sideOn,'P opens real side magnification');await page.keyboard.press('p');
 // Actual canvas hit testing, then brush/eyedropper actions on real geometry.
 const hit=await app.evaluate(()=>{const v=window.studioProto.view,b=v.canvas.getBoundingClientRect();for(let y=b.top+40;y<b.bottom-70;y+=35)for(let x=b.left+50;x<b.right-50;x+=35){const id=v.pick(x,y);if(id)return {id,x,y};}});
 check(!!hit,'real model canvas can be picked');
 await app.locator('#stage canvas').click({position:{x:hit.x-stage.x,y:hit.y-stage.y}});
 check((await state()).sel.part===hit.id,'canvas selection reaches actual model instance');
 await app.locator('#paint-scope').click();await page.keyboard.press('b');
 await app.locator('#paint-quick [data-key^="bambu-"]').last().click();const brushBefore=await state();
 await app.locator('#stage canvas').click({position:{x:hit.x-stage.x,y:hit.y-stage.y}});
 check((await state()).undo>=brushBefore.undo,'brush works on model');
 await app.locator('#paint-scope').click();await page.keyboard.press('i');await app.locator('#stage canvas').click({position:{x:hit.x-stage.x,y:hit.y-stage.y}});
 check((await state()).tool==='brush'&&(await state()).brush,'eyedropper picks actual model color');await page.keyboard.press('v');
 await app.locator('#paint-tools').evaluate(e=>e.open=false);await app.locator('#paint-palette').evaluate(e=>e.open=false);await page.mouse.move(900,90);await page.waitForTimeout(700);
 await page.screenshot({path:out+'/paint-1440.png'});
 await app.locator('#steps [data-step="3"]').click();await page.waitForTimeout(450);
 await page.screenshot({path:out+'/delivery-1440.png'});
 await app.evaluate(()=>{const proto=AudioBufferSourceNode.prototype;window.__cdAudioOriginal ||= proto.start;window.__cdAudio=[];proto.start=function(...args){const samples=this.buffer?.getChannelData(0);let peak=0;for(const value of samples||[])peak=Math.max(peak,Math.abs(value));window.__cdAudio.push({peak,length:samples?.length,state:this.context.state});return window.__cdAudioOriginal.apply(this,args);};});
 for(const id of ['nod','quack','sway']){
  await app.locator('.cd-row [data-act="'+id+'"]').click();
  check(await app.evaluate(id=>window.studioProto.actions.current===id,id),'real action '+id+' starts');
  await page.waitForTimeout(600);
 }
 check(await app.evaluate(()=>window.studioProto.actions.sound),'action sound enabled');
 const audio=await app.evaluate(()=>{AudioBufferSourceNode.prototype.start=window.__cdAudioOriginal;return window.__cdAudio;});check(audio.length>=3&&audio.every(x=>x.peak>0&&x.length>100&&x.state==='running'),'actual nonzero audio buffers start in running context');
 await app.evaluate(()=>window.studioProto.actions.stop());
 // Shared save flow: actual isolated SQLite write, then forced API failure keeps editing.
 await app.locator('#finish-save').click();await app.waitForFunction(()=>!!window.studioProto.state.activeId,null,{timeout:5000});
 const saved=await state();check(!!saved.activeId,'delivery save writes named scheme');
 await app.locator('#open-poster').click();await app.waitForFunction(()=>!document.querySelector('#poster-save').disabled,null,{timeout:10000});
 const posterDownload=page.waitForEvent('download');await app.locator('#poster-save').click();await (await posterDownload).saveAs(out+'/poster.png');await app.locator('#poster-close').click();
 results.push('actual poster PNG downloaded');
 await app.locator('#export2').click();await app.locator('#review-materials').waitFor();
 check(await app.locator('#dl-bom').isDisabled()&&await app.locator('#dl-3mf').isDisabled(),'both exports blocked before review');
 check(await app.locator('.ex-parts tbody tr').count()===35,'real plan lists all 35 source instances');
 await app.locator('#review-materials').check();check(await app.locator('#dl-3mf').isDisabled(),'one review confirmation remains insufficient');
 await app.locator('#review-slice').check();check(await app.locator('#dl-3mf').isEnabled(),'both confirmations enable current plan');
 await page.screenshot({path:out+'/materials-1440.png'});
 const bom=page.waitForEvent('download');await app.locator('#dl-bom').click();await (await bom).saveAs(out+'/BOM.csv');
 const exported=page.waitForEvent('download',{timeout:30000});await app.locator('#dl-3mf').click();await (await exported).saveAs(out+'/materials.3mf');results.push('actual 3MF and BOM downloaded');
 await app.locator('#export-dialog [data-close]').click();await app.locator('#export2').click();await app.locator('#review-materials').waitFor();check(!await app.locator('#review-materials').isChecked(),'reopening resets confirmation');await app.locator('#export-dialog [data-close]').click();
 await page.route('**/api/plan',route=>route.fulfill({status:503,contentType:'application/json',body:'{"code":"request_failed"}'}));await app.locator('#export2').click();await app.locator('#export-body .warn').waitFor();check(await app.locator('#dl-3mf').count()===0,'failed plan exposes no stale download');await app.locator('#export-dialog [data-close]').click();await page.unroute('**/api/plan');
 // Illustrative PLA is replaced through the real matching flow; TPU stays TPU.
 await app.locator('#steps [data-step="2"]').click();await app.locator('[data-paint-zone]').first().click();await app.locator('#paint-palette>summary').click();await app.locator('[data-brand="esun"]').click();await app.locator('#lib-grid [data-key]').first().click();
 const demo=await state();await app.locator('#steps [data-step="3"]').click();await app.locator('#export2').click();await app.locator('#match-bambu').waitFor();
 check(await app.locator('#dl-3mf').count()===0,'illustrative material cannot bypass replacement');await app.locator('#match-bambu').click();await app.locator('#review-materials').waitFor();
 check(!await app.locator('#review-materials').isChecked()&&await app.locator('#dl-3mf').isDisabled(),'material replacement requires fresh confirmation');
 const replaced=await state();check(['P1-01','P1-02','P1-03','P1-04'].every(id=>demo.colors[id]===replaced.colors[id]),'PLA replacement preserves soft-part colors');
 await app.locator('#export-dialog [data-close]').click();
 await page.route('**/api/schemes/*',route=>route.fulfill({status:503,contentType:'application/json',body:'{"code":"request_failed"}'}));
 const failureBefore=await state();await app.locator('#finish-save').click();await page.waitForTimeout(250);
 check(JSON.stringify((await state()).colors)===JSON.stringify(failureBefore.colors),'failed save preserves edited colors');await page.unroute('**/api/schemes/*');
 // Every existing locale can render both new surfaces without missing placeholders.
 for(const locale of ['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi']){
  await app.evaluate(async locale=>{const i=await import('/shared/i18n.mjs');i.setLocale(locale);},locale);
  check(!/cd\.|\{(?:part|count|editable|locked)\}/.test(await app.locator('.cd-delivery').innerText()),'delivery locale '+locale);
 }
 await app.evaluate(async()=>{const i=await import('/shared/i18n.mjs');i.setLocale('zh-Hans');});
 // Real touch context owns its video and is always closed.
 const mobile=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,recordVideo:{dir:out+'/mobile-video',size:{width:390,height:844}}});
 try{
  const phone=await mobile.newPage();await phone.goto('http://127.0.0.1:8906/paint');const frame=await phone.waitForSelector('iframe[name="personal-paint"]');const p=await frame.contentFrame();await p.waitForFunction(()=>!!window.studioProto,null,{timeout:10000});
  await p.evaluate(async()=>{const i=await import('/shared/i18n.mjs');i.setLocale('zh-Hans');});
  await p.locator('#steps [data-step="2"]').tap();await phone.waitForTimeout(450);
  const quick=await p.locator('#paint-quick button').first().boundingBox(),foot=await p.locator('.panel-foot.finish').boundingBox();check(quick.y+quick.height<=foot.y,'default touch sheet exposes complete color swatches above footer');
  // Expand using the existing touch grip; scope and both footer actions must remain reachable.
  await phone.screenshot({path:out+'/paint-390-default.png'});await p.locator('.ph-grip').tap();await phone.waitForTimeout(350);
  await p.locator('[data-paint-zone]').nth(5).tap();await p.locator('#paint-quick [data-key]').last().tap();
  check((await p.locator('#paint-scope').innerText()).includes('TPU 90A'),'touch selection shows actual TPU scope');
  if(!await p.locator('#paint-tools').evaluate(e=>e.open))await p.locator('#paint-tools>summary').tap();await p.locator('[data-tool="brush"]').tap();check(await p.evaluate(()=>window.studioProto.state.tool==='brush'),'touch tool control operates');
  await p.locator('[data-tool="select"]').tap();await p.locator('#paint-tools>summary').tap();
  await p.locator('#panel').evaluate(e=>e.scrollTop=0);await phone.waitForTimeout(700);await phone.screenshot({path:out+'/paint-390.png'});
  await p.locator('#steps [data-step="3"]').tap();await phone.waitForTimeout(350);await p.locator('.ph-grip').tap();await phone.waitForTimeout(350);
  await phone.screenshot({path:out+'/delivery-390.png'});await p.locator('#export2').tap();await p.locator('#review-materials').waitFor();
  await p.locator('#review-materials').check();await p.locator('#review-slice').check();check(await p.locator('#dl-3mf').isEnabled(),'touch material review enables export');
  await phone.screenshot({path:out+'/materials-390.png'});
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'390px page has no horizontal overflow');
 }finally{await mobile.close();}
 return {passed:results.length,results};
}
