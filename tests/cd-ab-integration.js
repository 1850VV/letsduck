// C/D handoff to the frozen A/B teaching UI and back, in the retained personal shell.
async () => {
 page.setDefaultTimeout(15000);const passed=[],check=(v,label)=>{if(!v)throw Error(label);passed.push(label);};
 const paint=page.frame({name:'personal-paint'});await paint.waitForFunction(()=>!!window.studioProto,null,{timeout:15000});
 await paint.locator('#steps [data-step="2"]').click();await paint.locator('[data-paint-zone="body-shell"]').click();await paint.locator('#paint-quick [data-key^="bambu-"]').last().click();
 const before=await paint.evaluate(()=>structuredClone(window.studioProto.state));
 await paint.locator('#steps [data-step="3"]').click();await paint.locator('#go-assemble').click();
 await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',null,{timeout:30000});const guide=page.frame({name:'personal-assemble'});await guide.waitForFunction(()=>window.anklePrototype?.state.ready,null,{timeout:30000});
 check(await guide.locator('#sequence-open').isVisible(),'delivery opens frozen A/B sequence entry');
 check(await guide.locator('#instruction-dialog').count()===0,'A/B teaching is inline');
 check(await guide.locator('#confirm-seen').isVisible()&&await guide.locator('#confirm-built').isVisible(),'watch and physical confirmations remain independent controls');
 const materials=await guide.evaluate(async()=>{const {ACTORS}=await import('/assemble/hardware-state.mjs');return Object.values(ACTORS).filter(a=>a.sourceId&&a.material?.color).map(a=>({id:a.sourceId,color:'#'+a.material.color.getHexString().toUpperCase()}));});
 check(materials.length>0&&materials.every(a=>a.color===before.colors[a.id]),'A/B printed-material actors use actual C/D draft colors');
 await page.screenshot({path:'output/cd-ui-1024/ab-handoff-1440.png'});
 await guide.locator('.brand').click();await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
 await page.frame({name:'personal-home'}).locator('#paint-go').click();await page.waitForFunction(()=>document.documentElement.dataset.page==='paint');
 const returned=page.frame({name:'personal-paint'});const after=await returned.evaluate(()=>structuredClone(window.studioProto.state));
 check(returned===paint,'return reuses owned studio iframe');check(JSON.stringify(after.colors)===JSON.stringify(before.colors),'return preserves every painted instance');check(after.undo===before.undo,'return preserves undo stack');check(after.sel.zone===before.sel.zone,'return preserves selected part context');
 return {passed};
}
