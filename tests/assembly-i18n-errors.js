import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const base=process.env.DUCK_I18N_URL||'http://127.0.0.1:8909',out='output/playwright/opt-g-i18n-1024';await fs.mkdir(out,{recursive:true});
const report={cases:[],ownedPids:[]};let browser;
const ownedProcesses=()=>{
 const rows=execFileSync('ps',['-axo','pid=,ppid=,command='],{encoding:'utf8'}).split('\n').map(s=>{const m=/^\s*(\d+)\s+(\d+)\s+(.+)$/.exec(s);return m&&{pid:+m[1],ppid:+m[2],cmd:m[3]};}).filter(Boolean),owned=new Set([process.pid]);
 for(let round=0;round<6;round++)for(const row of rows)if(owned.has(row.ppid))owned.add(row.pid);
 return rows.filter(row=>owned.has(row.pid)&&/chromium|chrome|ffmpeg/i.test(row.cmd)).map(row=>row.pid);
};
try{
 browser=await chromium.launch({headless:false,args:['--mute-audio']});
 for(const scenario of ['initial','switch']){
  const context=await browser.newContext({locale:'en-US',viewport:{width:390,height:844}}),page=await context.newPage();page.setDefaultTimeout(8000);
  const entry={scenario,ok:false};let requests=0,guide;
  const failed=scenario==='initial'?'en':'ar';
  await page.route(`**/assemble/locales/${failed}.mjs*`,route=>{requests++;return requests===1?route.fulfill({status:503,body:'temporary test failure'}):route.continue();});
  try{
   await page.goto(base+'/assemble/');await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble',undefined,{timeout:90000});guide=page.frame({name:'personal-assemble'});
   await guide.waitForSelector('#assembly-language',{state:'attached',timeout:5000});
   if(scenario==='switch'){
    await guide.waitForFunction(()=>window.anklePrototype?.state.ready,undefined,{timeout:90000});
    await guide.selectOption('#assembly-language','ar');
   }
   await guide.waitForSelector('#assembly-language-status');
   if(scenario==='initial')assert.equal(await guide.getAttribute('html','data-assembly-language-unavailable'),'true');
   else{
    assert.equal(await guide.getAttribute('html','lang'),'en');assert.equal(await guide.getAttribute('html','dir'),'ltr');
    assert.equal(await guide.getAttribute('#assembly-language-status','lang'),'ar');
   }
   assert.equal(await guide.getAttribute('#assembly-language','aria-invalid'),'true');
   await page.screenshot({path:`${out}/${scenario}-language-error.png`});
   if(scenario==='switch'){const bounds=await guide.evaluate(()=>({bottom:document.querySelector('.player-bar').getBoundingClientRect().bottom,height:innerHeight}));assert.ok(bounds.bottom<=bounds.height+1,'language error banner must keep the player reachable');}
   await page.screenshot({path:`${out}/error-${scenario}.png`});
   await guide.selectOption('#assembly-language',scenario==='initial'?'ja':'en');
   await guide.waitForFunction(locale=>document.documentElement.dataset.assemblyLocale===locale,scenario==='initial'?'ja':'en',{timeout:15000});
   assert.equal(await guide.locator('#assembly-language-status').count(),0);
   assert.equal(await guide.getAttribute('#assembly-language','aria-invalid'),null);
   assert.equal(await guide.getAttribute('html','dir'),'ltr');
   assert.equal(requests,1,'failed request does not trigger an automatic fallback download');
   entry.ok=true;entry.requests=requests;
  }catch(error){entry.failure=error.stack;await page.screenshot({path:`${out}/${scenario}-language-error-failed.png`}).catch(()=>{});}
  finally{report.ownedPids.push(...ownedProcesses());await context.close();report.cases.push(entry);}
 }
 assert.ok(report.cases.every(c=>c.ok),JSON.stringify(report.cases));
}finally{
 report.ownedPids=[...new Set([...report.ownedPids,...ownedProcesses()])];await browser?.close();await new Promise(resolve=>setTimeout(resolve,500));
 report.processCleanup=report.ownedPids.every(pid=>{try{process.kill(pid,0);return false;}catch{return true;}});
 await fs.writeFile(out+'/errors-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
