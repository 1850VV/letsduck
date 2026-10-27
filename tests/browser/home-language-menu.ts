import * as browserChecks from './checks.js';
// Real-page, read-only header regression. This is a separate browser check,
// not a Node unit test and not a complete UI or physical-device acceptance.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const args=process.argv.slice(2),value=(flag:string,fallback:string)=>args.includes(flag)?browserChecks.required(args[args.indexOf(flag)+1]):fallback;
const base=(args.includes('--url')?value('--url',''):browserChecks.browserUrl()),out=resolve(value('--output','output/playwright/home-language-menu'));

const result:browserChecks.Receipt&{url:string;screenshots:string[];browserZoom:string;browserVersion?:string;failed?:browserChecks.Check[]}={...browserChecks.receipt(),url:base,screenshots:[],browserZoom:'Not exercised: viewport/DPR changes are not browser zoom.'};
let browser,context,page,failure,collect=true;
const check=(name:string,pass:boolean,detail?:unknown)=>result.checks.push({name,pass:Boolean(pass),...(detail?{detail}:{})});
await mkdir(out,{recursive:true});
try{
 browser=await browserChecks.launchBrowser({headless:!args.includes('--headed'),args:args.includes('--headed')?[]:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 result.browserVersion=browser.version();
 context=await browser.newContext({viewport:{width:1440,height:900},locale:'zh-CN'});
 await context.route('**/*',route=>{
  const r=route.request();if(['GET','HEAD'].includes(r.method()))return route.continue();
  result.writes.push({method:r.method(),url:r.url()});return route.abort();
 });
 page=await context.newPage();
 page.on('pageerror',e=>{if(collect)result.errors.push(e.message);});
 page.on('console',m=>{if(collect&&m.type()==='error')result.consoleErrors.push(m.text());});
 page.on('requestfailed',r=>{if(collect)result.failedRequests.push({url:r.url(),error:r.failure()?.errorText});});
 page.on('response',r=>{if(collect&&r.status()>=400)result.httpErrors.push({url:r.url(),status:r.status()});});
 await browserChecks.preparePage(page);await page.goto(base+'/');await page.locator('#language-trigger').waitFor();
 await page.waitForFunction(()=>document.querySelector('[data-brand-slot]')?.textContent.trim());
 await page.evaluate(()=>document.fonts.ready);
 for(const [width,height]of [[1440,900],[761,700],[760,700],[390,844],[320,568]] as const){
  await page.setViewportSize({width,height});
  for(const locale of ['zh-Hans','en','pt-BR','ru','ar']){
   await browserChecks.chooseLocale(page,locale);
   const key=`${width}x${height}/${locale}`;
   const trigger=browserChecks.required(await page.locator('#language-trigger').boundingBox());
   const edge=await page.evaluate(()=>{const h=window.__browserChecks.query('.home-top'),r=h.getBoundingClientRect(),s=getComputedStyle(h);return document.documentElement.dir==='rtl'?{side:'left',value:r.left+parseFloat(s.paddingLeft)}:{side:'right',value:r.right-parseFloat(s.paddingRight)};});
   check(key+' trigger at header end',Math.abs((edge.side==='right'?trigger.x+trigger.width:trigger.x)-edge.value)<=1,{trigger,edge});
   check(key+' trigger inside viewport',trigger.x>=0&&trigger.y>=0&&trigger.x+trigger.width<=width+1&&trigger.y+trigger.height<=height+1);
   if(width===1440&&locale==='zh-Hans'){await page.screenshot({path:out+'/desktop-default.png'});result.screenshots.push('desktop-default.png');}
   await page.locator('#language-trigger').focus();await page.keyboard.press('Enter');
   const menu=page.locator('#language-menu');await menu.waitFor({state:'visible'});
   const geometry=await menu.evaluate(el=>{
    const r=el.getBoundingClientRect(),rect={left:r.left,top:r.top,right:r.right,bottom:r.bottom};
    const clips=[];for(let p=el.parentElement;p&&p!==document.documentElement;p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();const x=['hidden','clip','auto','scroll'].includes(s.overflowX),y=['hidden','clip','auto','scroll'].includes(s.overflowY);if(x||y)clips.push({tag:p.tagName,className:p.className,x,y,contains:(!x||r.left>=b.left-1&&r.right<=b.right+1)&&(!y||r.top>=b.top-1&&r.bottom<=b.bottom+1)});}
    return{rect,clips,overflowX:el.scrollWidth>el.clientWidth+1};
   });
   const r=geometry.rect,inView=r.left>=-1&&r.top>=-1&&r.right<=width+1&&r.bottom<=height+1;
   check(key+' open menu inside viewport',inView,geometry);
   check(key+' no clipping ancestor',geometry.clips.every(c=>c.contains),geometry.clips);
   check(key+' no horizontal menu overflow',!geometry.overflowX);
   check(key+' language choices present',await menu.locator('[data-locale]').count()===13);
   if(locale==='zh-Hans'&&[1440,390].includes(width)){const name=width===1440?'desktop-open.png':'mobile-open.png';await page.screenshot({path:out+'/'+name});result.screenshots.push(name);}
   if(inView){
    const last=menu.locator('[data-locale]').last();await last.scrollIntoViewIfNeeded();
    check(key+' last choice reachable and hit-testable',await last.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return el===hit||el.contains(hit);}));
    await page.keyboard.press('End');check(key+' End reaches last choice',await last.evaluate(el=>el===document.activeElement));
   }
   await page.keyboard.press('Escape');check(key+' Escape closes menu',await menu.isHidden());
   check(key+' Escape returns focus',await page.locator('#language-trigger').evaluate(el=>el===document.activeElement));
   const sizes=await page.evaluate(()=>({page:document.documentElement.scrollWidth,header:window.__browserChecks.query('.home-top').scrollWidth,headerWidth:window.__browserChecks.query('.home-top').clientWidth}));
   check(key+' no page/header horizontal overflow',sizes.page<=width+1&&sizes.header<=sizes.headerWidth+1,sizes);
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await browserChecks.chooseLocale(page,'zh-Hans');
 await page.locator('#language-trigger').click();const choice=page.locator('[data-locale=en]');
 const reachable=await choice.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return el===hit||el.contains(hit);});
 check('English choice is actually hit-testable',reachable);
 if(reachable){
  await choice.click();check('actual choice updates document language',await page.locator('html').getAttribute('lang')==='en');check('actual choice closes menu',await page.locator('#language-menu').isHidden());
  await page.locator('#language-trigger').click();await page.locator('h1').click();check('outside click closes menu',await page.locator('#language-menu').isHidden());
  await page.reload();await page.locator('#language-trigger').waitFor();check('manual language survives reload',await page.locator('html').getAttribute('lang')==='en');
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');check('Tab reaches language entry',await page.locator('#language-trigger').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Enter');check('keyboard opens menu',await page.locator('#language-menu').isVisible());await page.keyboard.press('Escape');
 }
 check('no page errors',result.errors.length===0,result.errors);
 check('no console errors',result.consoleErrors.length===0,result.consoleErrors);
 check('no failed requests',result.failedRequests.length===0,result.failedRequests);
 check('no HTTP failures',result.httpErrors.length===0,result.httpErrors);
 check('no device or personal-data writes',result.writes.length===0,result.writes);
 result.failed=result.checks.filter(c=>!c.pass);assert.equal(result.failed.length,0,JSON.stringify(result.failed,null,2));
}catch(error){failure=error;result.failure=browserChecks.failure(error);}
finally{
 collect=false;await context?.close();await browser?.close();result.browserClosed=true;
 await writeFile(out+'/receipt.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({checks:result.checks.length,failed:result.checks.filter(c=>!c.pass),errors:result.errors,output:out,browserClosed:true},null,2));
}
if(failure)throw failure;
