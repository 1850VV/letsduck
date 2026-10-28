import type {Page,Frame} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {debugMessages} from '../frontend/locales/debug.js';
import * as browserChecks from './browser/checks.js';

declare global {interface Window {__debugLocaleRefs?:{input:HTMLInputElement;canvas:HTMLCanvasElement}}}
// Run only against the owned fake-device fixture. This test never sends controller actions.
// npx tsx tests/browser/run-check.ts --fixture debug --check tests/debug_i18n_browser.ts
export default async (page:Page)=>{
 const base=browserChecks.browserUrl(),errors:string[]=[],writes:string[]=[],checks:string[]=[];
 const evidence=process.env.DUCK_I18N_EVIDENCE,screenshots:string[]=[];if(evidence)await mkdir(evidence,{recursive:true});
 const check=(name:string,pass:boolean)=>{if(!pass)throw Error(name);checks.push(name);};
 await browserChecks.preparePage(page);page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.method()!=='GET'&&new URL(request.url()).pathname==='/api/duck-debug/action')writes.push(request.postData()??'');});
 const chooser=await page.context().newPage();
 try{
  await browserChecks.preparePage(chooser);await chooser.goto(base+'/');await chooser.locator('#language-trigger').waitFor();
  const choose=async(code:string)=>{await chooser.bringToFront();await browserChecks.chooseLocale(chooser,code);await page.bringToFront();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));};
  await choose('en');await page.goto(base+'/debug/');await page.waitForSelector('body[data-model-ready=true]');
  check('direct Debug title follows English',(await page.title()).includes('Debug'));
  check('direct Debug static controls follow English',await page.locator('[data-workbench=servo]').innerText()==='Servo settings');
  for(const code of ['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi']){
   await choose(code);await page.waitForFunction(code=>document.documentElement.lang===code,code);
   check(code+' Debug static menu uses its catalog',await page.locator('[data-workbench=servo]').innerText()===debugMessages[code]!['debug.mode.servo_debug']);
   check(code+' Debug document direction',await page.locator('html').getAttribute('dir')===(code==='ar'?'rtl':'ltr'));
   check(code+' preserves fixed slot IDs',(await page.locator('#slots [data-slot]').evaluateAll(elements=>elements.map(element=>element.getAttribute('data-slot')).join(',')))==='10,11,12,13,14,20,21,22,23,24,30,31,32,33,34');
   check(code+' has no untranslated message keys',!(/debug\.(?:copy|mode|role)\./.test(await page.locator('main').innerText())));
   if(evidence){const path=join(evidence,'debug-'+code+'.png');await page.screenshot({path});screenshots.push(path);}
  }
  await choose('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('[data-slot="12"]').click();await page.locator('#edit-id').fill('254');
  await page.locator('#edit-id').evaluate(element=>window.__browserChecks.input(element).reportValidity());
  check('native number validation follows English',(await page.locator('#edit-id').evaluate(element=>window.__browserChecks.input(element).validationMessage)).includes('Please check'));
  await page.evaluate(()=>{window.__debugLocaleRefs={input:window.__browserChecks.query<HTMLInputElement>('#edit-id'),canvas:window.__browserChecks.query<HTMLCanvasElement>('#viewport canvas')};});
  await page.locator('#edit-id').focus();await choose('zh-Hans');await page.waitForFunction(()=>document.documentElement.lang==='zh-Hans');
  check('unsaved numeric input survives switch',await page.locator('#edit-id').inputValue()==='254');
  check('input, focus and WebGL canvas nodes survive switch',await page.evaluate(()=>document.activeElement===window.__debugLocaleRefs?.input&&document.querySelector('#edit-id')===window.__debugLocaleRefs?.input&&document.querySelector('#viewport canvas')===window.__debugLocaleRefs?.canvas));
  check('native validation switches on the existing input',(await page.locator('#edit-id').evaluate(element=>window.__browserChecks.input(element).validationMessage)).includes('请检查'));
  check('inline parameter validation switches',(await page.locator('#error-id').innerText()).includes('0–253'));
  await choose('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
  const audit=async(target:Page|Frame)=>target.evaluate(()=>{
   const root=document.querySelector('main')!,out:string[]=[];
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement?.getClientRects().length&&/[\u3400-\u9fff]/.test(node.textContent??''))out.push(node.textContent??'');}
   for(const element of root.querySelectorAll<HTMLElement>('[aria-label],[title],[placeholder],[alt]'))if(element.getClientRects().length)for(const attribute of ['aria-label','title','placeholder','alt']){const value=element.getAttribute(attribute);if(value&&/[\u3400-\u9fff]/.test(value))out.push(attribute+': '+value);}
   return out;
  });
  await page.locator('#edit-id').fill('12');
  for(const view of ['robot','tray','circuit']){await page.locator('[data-view='+view+']').click();check('English '+view+' display has no untranslated system copy',(await audit(page)).length===0);}
  await page.locator('[data-board-slot=expansion]').click();check('board panel follows English',(await audit(page)).length===0);
  await page.locator('[data-slot="12"]').click();await page.locator('[data-panel-kind=protection]').click();await page.locator('#protection-current').fill('2.345');
  await choose('zh-Hans');await page.waitForFunction(()=>document.documentElement.lang==='zh-Hans');check('unfinished protection threshold survives',await page.locator('#protection-current').inputValue()==='2.345');
  await choose('en');await page.waitForFunction(()=>document.documentElement.lang==='en');check('protection panel follows English',(await audit(page)).length===0);
  await page.locator('[data-workbench=control]').click();
  for(const tab of ['motion','head','settings','feedback']){await page.locator('[data-control-tab='+tab+']').click();check('English control '+tab+' has no untranslated system copy',(await audit(page)).length===0);}
  await page.locator('[data-workbench=calibrate]').click();check('calibration panel follows English',(await audit(page)).length===0);
  await page.locator('[data-workbench=servo]').click();await page.locator('#batch-custom').click();check('custom mapping follows English',(await audit(page)).length===0);
  await page.locator('[data-batch-index="0"]').fill('233');await choose('zh-Hans');await page.waitForFunction(()=>document.documentElement.lang==='zh-Hans');check('unfinished custom mapping survives',await page.locator('[data-batch-index="0"]').inputValue()==='233');
  await choose('en');await page.waitForFunction(()=>document.documentElement.lang==='en');
  await page.locator('[data-action=back]').first().click();await page.locator('[data-view=robot]').click();
  const canvas=page.locator('#viewport canvas'),box=browserChecks.required(await canvas.boundingBox());
  await page.mouse.move(box.x+box.width*.55,box.y+box.height*.45);await page.mouse.down();await page.mouse.move(box.x+box.width*.55+73,box.y+box.height*.45+22,{steps:10});await page.mouse.up();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  // Locale copy changes the page's scrollbar gutter. With fixed vertical FOV,
  // center/height-normalized projections preserve the camera across that resize.
  const projection=()=>{const canvas=window.__browserChecks.query<HTMLCanvasElement>('#viewport canvas'),box=canvas.getBoundingClientRect();return {width:box.width,height:box.height,points:[...document.querySelectorAll<HTMLElement>('#labels [data-model]')].map(el=>({id:el.dataset.model,x:(parseFloat(el.style.left)-box.width/2)/box.height,y:(parseFloat(el.style.top)-box.height/2)/box.height})).sort((a,b)=>Number(a.id)-Number(b.id))};};
  const beforeProjection=await page.evaluate(projection);if(evidence)await canvas.screenshot({path:join(evidence,'camera-before.png')});
  await choose('zh-Hans');await page.waitForFunction(()=>document.documentElement.lang==='zh-Hans');const afterProjection=await page.evaluate(projection);if(evidence)await canvas.screenshot({path:join(evidence,'camera-after.png')});check('camera and rendered model survive language switch '+JSON.stringify({beforeProjection,afterProjection}),beforeProjection.points.length>=3&&beforeProjection.points.length===afterProjection.points.length&&beforeProjection.points.every((point,index)=>{const after=afterProjection.points[index]!;return point.id===after.id&&Math.abs(point.x-after.x)<.00001&&Math.abs(point.y-after.y)<.00001;}));
  // Follow the real homepage entry into the embedded Debug surface as well.
  await choose('en');await page.goto(base+'/');await page.waitForFunction(()=>document.body.dataset.homeReady==='true');
  const duck=page.locator('[data-duck=debug]');await duck.click();if(!(await page.locator('#module-window').isVisible()))await duck.click();
  const frame=browserChecks.required(await page.locator('#module-frame').elementHandle()).contentFrame();const embedded=browserChecks.required(await frame);
  await embedded.waitForSelector('body[data-model-ready=true]');check('homepage iframe loads English Debug',await embedded.locator('[data-workbench=servo]').innerText()==='Servo settings');
  await embedded.locator('[data-slot="12"]').click();await embedded.locator('#edit-kp').fill('17');await choose('zh-Hans');await embedded.waitForFunction(()=>document.documentElement.lang==='zh-Hans');
  check('homepage iframe input survives shared locale change',await embedded.locator('#edit-kp').inputValue()==='17');
  check('language refresh sent no controller actions',writes.length===0);check('no runtime errors',errors.length===0);
  return {pass:true,checks,writes,errors,screenshots};
 }finally{await chooser.close();}
};
