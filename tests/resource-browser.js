// Run only against an isolated personal service and test database.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:false});
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8904';
const result={label:process.env.METRIC_LABEL||'sample',runs:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 try{
 const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const kind of ['cold','hot']){
  await page.goto(base+'/');await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
  const homeMs=await page.evaluate(()=>performance.now());
  await page.waitForFunction(()=>document.querySelectorAll('iframe').length===3&&[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement?.dataset.pageReady),null,{timeout:60000});
  await page.waitForTimeout(800);
  const preparedMs=await page.evaluate(()=>performance.now());
  const resources=await page.evaluate(()=>[window,...[...document.querySelectorAll('iframe')].map(f=>f.contentWindow)].flatMap(w=>w.performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,transfer:r.transferSize,encoded:r.encodedBodySize}))));
  const switches=[];
  for(const path of Array.from({length:3},()=>['/paint','/','/assemble/','/']).flat())switches.push(await page.evaluate(async path=>{let t=performance.now();await personalApp.navigate(path);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return{path,ms:performance.now()-t};},path));
  assert.equal(await page.locator('iframe').count(),3);
  result.runs.push({kind,homeMs,preparedMs,transfer:resources.reduce((n,r)=>n+r.transfer,0),resources,switches});
 }
 result.errors=errors;assert.deepEqual(errors,[]);
 }finally{await context.close();}
 console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
