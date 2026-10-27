import type {Page} from 'playwright';
import * as browserChecks from './browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture community --check tests/i18n-acceptance.ts
export default async (page:Page)=>{
 await browserChecks.preparePage(page);
  const checks:browserChecks.Check[]=[],errors:string[]=[],external:string[]=[];
  const check=(name:string,pass:boolean,detail?:unknown)=>{checks.push({name,pass:!!pass,...(detail?{detail}:{})});if(!pass)throw Error(name+' '+JSON.stringify(detail||''));};
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(new URL(request.url()).origin!==new URL(browserChecks.browserUrl()).origin)external.push(request.url());});
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  await page.evaluate(async()=>{const token=localStorage.getItem('dd-token');if(token)await fetch('/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});localStorage.removeItem('dd-token');});
  await page.reload();await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  await page.setViewportSize({width:1440,height:950});
  const triggerLanguage=async()=>{if(await page.locator('#language-trigger').isHidden())await page.locator('.ph-more').click();await page.locator('#language-trigger').click();};
  const choose=async (code:string)=>{if(await page.locator('#language-menu').isHidden())await triggerLanguage();await page.locator('[data-locale="'+code+'"]').click();};
  await choose('en');await page.locator('[data-start="blank"]').click();await page.locator('button[data-step="2"]').click();
  await page.locator('[data-zone="head-shell"]').click();if(!(await page.evaluate(()=>window.studioProto.state.locks.length)))await page.locator('[data-lock="head-shell"]').click();
  await page.evaluate(()=>window._originalLocaleCanvas=window.studioProto.view.canvas);
  const baseline=await page.evaluate(()=>window.studioProto.state);
  const codes=await page.evaluate(()=>window.__duckModules.LOCALES.map(x=>x.code));
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:950});
    for(const code of codes){
      const before=await page.evaluate(()=>window.studioProto.view.debug());await choose(code);
      check(code+' document locale at '+width,await page.locator('html').getAttribute('lang')===code);
      check(code+' direction at '+width,await page.locator('html').getAttribute('dir')===(code==='ar'?'rtl':'ltr'));
      const state=await page.evaluate(()=>window.studioProto.state),after=await page.evaluate(()=>window.studioProto.view.debug());
      check(code+' draft state at '+width,JSON.stringify(state.colors)===JSON.stringify(baseline.colors)&&state.undo===baseline.undo&&state.step===baseline.step&&state.name===baseline.name);
      check(code+' selection and locks at '+width,JSON.stringify(state.sel)===JSON.stringify(baseline.sel)&&JSON.stringify(state.locks)===JSON.stringify(baseline.locks));
      check(code+' camera at '+width,JSON.stringify(before.cam)===JSON.stringify(after.cam)&&JSON.stringify(before.target)===JSON.stringify(after.target));
      check(code+' original WebGL canvas at '+width,await page.evaluate(()=>window.studioProto.view.canvas===window._originalLocaleCanvas));
      await triggerLanguage();
      const box=browserChecks.required(await page.locator('#language-menu').boundingBox());
      check(code+' menu bounds at '+width,box.x>=-1&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<= (width===390?844:950)+1,box);
      const sizes=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth,header:window.__browserChecks.query('.top').scrollWidth,headWidth:window.__browserChecks.query('.top').clientWidth}));
      check(code+' page width at '+width,sizes.doc<=sizes.view+1&&sizes.header<=sizes.headWidth+1,sizes);
      await page.keyboard.press('Escape');check(code+' Escape closes menu at '+width,await page.locator('#language-menu').isHidden());
    }
  }
  await page.setViewportSize({width:1440,height:950});await choose('fr');
  await page.reload();await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  check('manual choice survives reload',await page.locator('html').getAttribute('lang')==='fr');
  await browserChecks.preparePage(page);await page.goto(browserChecks.browserUrl()+'/gallery/');await page.locator('.card').first().waitFor();await browserChecks.installRuntime(page);
  check('manual choice follows gallery navigation',await page.locator('html').getAttribute('lang')==='fr');
  check('official gallery loads',await page.locator('.card').count()>=9);
  check('official attribution is not a relative date',(await page.locator('.card[data-id="official-0"] .author>span').last().innerText()).includes(await page.evaluate(async()=>window.__duckModules.message('text.0366'))));
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:width===390?844:950});
    for(const code of codes){
      await choose(code);await triggerLanguage();
      const sizes=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,view:innerWidth,header:window.__browserChecks.query('.top').scrollWidth,headWidth:window.__browserChecks.query('.top').clientWidth}));
      check('gallery '+code+' width '+width,sizes.doc<=width+1&&sizes.header<=sizes.headWidth+1,sizes);
      const box=browserChecks.required(await page.locator('#language-menu').boundingBox());check('gallery '+code+' menu '+width,box.x>=-1&&box.x+box.width<=width+1,box);
      await page.keyboard.press('Escape');
    }
  }
  await page.setViewportSize({width:1440,height:950});await choose('fr');
  const nickname='白胚-'+Date.now().toString(36);
  await page.locator('.profile-chip.guest').click();await page.locator('[data-mode="register"]').click();
  await page.locator('#auth-name').fill(nickname);await page.locator('#auth-pass').fill('i18n-test-password');await page.locator('#auth-submit').click();
  await page.waitForFunction(()=>!window.__browserChecks.query<HTMLDialogElement>('#auth-dialog').open);
  check('account nickname stays untranslated',(await page.locator('#profile-slot').innerText()).includes(nickname));
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  await page.locator('#scheme-btn').click();await page.locator('#sm-name').fill('我的方案');await page.locator('#sm-save').click();
  await page.waitForFunction(async()=>{const values:unknown=await fetch('/api/schemes').then(r=>r.json());return Array.isArray(values)&&values.some((s:unknown)=>s!==null&&typeof s==='object'&&'name'in s&&s.name==='我的方案');});
  check('private save confirmed from server',true);
  await choose('en');check('user title matching a translation key stays untouched',await page.evaluate(()=>window.studioProto.state.name==='我的方案'));
  await browserChecks.preparePage(page);await page.goto(browserChecks.browserUrl()+'/gallery/#mine');await page.locator('.priv').first().waitFor();
  check('saved title stays untranslated in gallery',(await page.locator('.priv h3').innerText())==='我的方案');
  check('manual preference is English in gallery',await page.locator('html').getAttribute('lang')==='en');
  const browser=browserChecks.required(page.context().browser());
  for(const [input,want]of [['fr-CA','fr'],['zh-TW','zh-Hant'],['pt-PT','pt-BR'],['th-TH','en']] as const){
    const context=await browser.newContext({locale:input});
    try{const target=await context.newPage();await browserChecks.preparePage(target);await target.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await target.locator('#language-trigger').waitFor();check('browser auto '+input,await target.locator('html').getAttribute('lang')===want);}
    finally{await context.close();}
  }
  check('no runtime requests to external translation or IP services',external.length===0,external);
  check('no runtime JavaScript errors',errors.length===0,errors);
  return {checks:checks.length,failed:checks.filter(x=>!x.pass),errors,external};
}
