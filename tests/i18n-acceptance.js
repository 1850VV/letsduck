// Local licensed-asset acceptance; use a task-owned browser and temporary server DB on 8877.
async page=>{
  const checks=[],errors=[],external=[];
  const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail?{detail}:{})});if(!pass)throw Error(name+' '+JSON.stringify(detail||''));};
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(new URL(request.url()).origin!=='http://127.0.0.1:8877')external.push(request.url());});
  await page.goto('http://127.0.0.1:8877/');await page.waitForFunction(()=>window.studioProto);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  await page.setViewportSize({width:1440,height:950});
  const choose=async code=>{if(await page.locator('#language-menu').isHidden())await page.locator('#language-trigger').click();await page.locator('[data-locale="'+code+'"]').click();};
  await choose('en');await page.locator('[data-start="blank"]').click();await page.locator('[data-step="2"]').click();
  await page.evaluate(()=>window._originalLocaleCanvas=studioProto.view.canvas);
  const baseline=await page.evaluate(()=>studioProto.state);
  const codes=await page.evaluate(async()=>(await import('/shared/i18n.mjs')).LOCALES.map(x=>x.code));
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:950});
    for(const code of codes){
      const before=await page.evaluate(()=>studioProto.view.debug());await choose(code);
      check(code+' document locale at '+width,await page.locator('html').getAttribute('lang')===code);
      check(code+' direction at '+width,await page.locator('html').getAttribute('dir')===(code==='ar'?'rtl':'ltr'));
      const state=await page.evaluate(()=>studioProto.state),after=await page.evaluate(()=>studioProto.view.debug());
      check(code+' draft state at '+width,JSON.stringify(state.colors)===JSON.stringify(baseline.colors)&&state.undo===baseline.undo&&state.step===baseline.step&&state.name===baseline.name);
      check(code+' camera at '+width,JSON.stringify(before.cam)===JSON.stringify(after.cam)&&JSON.stringify(before.target)===JSON.stringify(after.target));
      check(code+' original WebGL canvas at '+width,await page.evaluate(()=>studioProto.view.canvas===window._originalLocaleCanvas));
      await page.locator('#language-trigger').click();
      const box=await page.locator('#language-menu').boundingBox();
      check(code+' menu bounds at '+width,box.x>=-1&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<= (width===390?844:950)+1,box);
      const sizes=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth,header:document.querySelector('.top').scrollWidth,headWidth:document.querySelector('.top').clientWidth}));
      check(code+' page width at '+width,sizes.doc<=sizes.view+1&&sizes.header<=sizes.headWidth+1,sizes);
      await page.keyboard.press('Escape');check(code+' Escape closes menu at '+width,await page.locator('#language-menu').isHidden());
    }
  }
  await page.setViewportSize({width:1440,height:950});await choose('fr');
  await page.reload();await page.waitForFunction(()=>window.studioProto);
  check('manual choice survives reload',await page.locator('html').getAttribute('lang')==='fr');
  await page.goto('http://127.0.0.1:8877/gallery/');await page.locator('.card').first().waitFor();
  check('manual choice follows gallery navigation',await page.locator('html').getAttribute('lang')==='fr');
  check('official gallery loads',await page.locator('.card').count()>=9);
  check('official attribution is not a relative date',(await page.locator('.card[data-id="official-0"] .author>span').last().innerText()).includes(await page.evaluate(async()=>(await import('/shared/i18n.mjs')).t('text.0366'))));
  const nickname='白胚-'+Date.now().toString(36);
  await page.locator('.profile-chip.guest').click();await page.locator('[data-mode="register"]').click();
  await page.locator('#auth-name').fill(nickname);await page.locator('#auth-pass').fill('i18n-test-password');await page.locator('#auth-submit').click();
  await page.waitForFunction(()=>!document.querySelector('#auth-dialog').open);
  check('account nickname stays untranslated',(await page.locator('#profile-slot').innerText()).includes(nickname));
  await page.goto('http://127.0.0.1:8877/');await page.waitForFunction(()=>window.studioProto);
  await page.locator('#scheme-btn').click();await page.locator('#sm-name').fill('我的方案');await page.locator('#sm-save').click();
  await page.waitForFunction(async()=>{const {api}=await import('/shared/api.mjs');return (await api('GET','/schemes')).some(s=>s.name==='我的方案');});
  check('private save confirmed from server',true);
  await choose('en');check('user title matching a translation key stays untouched',await page.evaluate(()=>studioProto.state.name==='我的方案'));
  await page.goto('http://127.0.0.1:8877/gallery/#mine');await page.locator('.priv').first().waitFor();
  check('saved title stays untranslated in gallery',(await page.locator('.priv h3').innerText())==='我的方案');
  check('manual preference is English in gallery',await page.locator('html').getAttribute('lang')==='en');
  const browser=page.context().browser();
  for(const [input,want]of [['fr-CA','fr'],['zh-TW','zh-Hant'],['pt-PT','pt-BR'],['th-TH','en']]){
    const context=await browser.newContext({locale:input});
    try{const target=await context.newPage();await target.goto('http://127.0.0.1:8877/');await target.locator('#language-trigger').waitFor();check('browser auto '+input,await target.locator('html').getAttribute('lang')===want);}
    finally{await context.close();}
  }
  check('no runtime requests to external translation or IP services',external.length===0,external);
  check('no runtime JavaScript errors',errors.length===0,errors);
  return {checks:checks.length,failed:checks.filter(x=>!x.pass),errors,external};
}
