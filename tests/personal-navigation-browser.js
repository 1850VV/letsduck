// Run against an isolated personal service (this test creates a backup scheme via the normal UI).
// DUCK_BROWSER_URL=http://127.0.0.1:8897 node tests/personal-navigation-browser.js
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897';
const out=new URL('../output/playwright/personal-navigation/',import.meta.url);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:false,args:['--mute-audio']}),result={errors:[],switches:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 try{
  const page=await context.newPage(),requests=[];
  page.on('pageerror',error=>result.errors.push(String(error)));page.on('request',request=>requests.push(request.url()));
  await page.addInitScript(()=>{
   window.pageInstance=crypto.randomUUID();window.gpuDraws=0;
   for(const name of ['drawElements','drawArrays']){const previous=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){gpuDraws++;return previous.apply(this,args);};}
   if(parent===window){
    window.navMeasures=[];let observed=0;
    new MutationObserver(()=>{const click=window.navClick;if(!click||click.id===observed)return;observed=click.id;const key=document.documentElement.dataset.page;
     requestAnimationFrame(()=>requestAnimationFrame(()=>navMeasures.push({key,ms:performance.now()-click.at})));
    }).observe(document,{subtree:true,attributes:true,attributeFilter:['data-page']});
   }
  });
  // Read actual scene materials, without shipping a renderer testing API.
  await page.route('**/assemble/prototype-v3.mjs',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.assemblyEntities=entities;\n'});});
  await page.goto(base+'/');
  await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
  result.homeReadyMs=await page.evaluate(()=>performance.now());
  await page.waitForFunction(()=>document.querySelectorAll('iframe').length===3&&[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement?.dataset.pageReady),{timeout:30000});
  result.preparedMs=await page.evaluate(()=>performance.now());
  const frame=key=>page.frame({name:'personal-'+key});
  const instances=Object.fromEntries(await Promise.all(['home','paint','assemble'].map(async key=>[key,await frame(key).evaluate(()=>pageInstance)])));
  for(const key of ['home','paint','assemble']){assert.equal(typeof instances[key],'string');assert.equal(await frame(key).evaluate(()=>typeof gpuDraws),'number');}
  async function click(from,selector,to){
   const count=await page.evaluate(()=>navMeasures.length);
   await frame(from).evaluate(()=>document.addEventListener('click',()=>{parent.navClick={id:(parent.navClick?.id||0)+1,at:parent.performance.now()};},{capture:true,once:true}));
   await frame(from).locator(selector).click();
   try{await page.waitForFunction(({to,count})=>document.documentElement.dataset.page===to&&navMeasures.length>count,{to,count},{timeout:5000});}
   catch(error){console.error(JSON.stringify(await page.evaluate(()=>({path:location.href,page:document.documentElement.dataset.page,click:navClick,measures:navMeasures,frames:[...document.querySelectorAll('iframe')].map(f=>({key:f.dataset.personalPage,active:f.dataset.active}))}))));await page.screenshot({path:new URL('failure.png',out).pathname});throw error;}
  }
  await click('home','#paint-go','paint');
  const initial=await frame('paint').evaluate(()=>structuredClone(studioProto.state.colors));
  await frame('paint').locator('[data-start="theme-1"]').click();
  await frame('paint').locator('#steps [data-step="3"]').click();
  await frame('paint').evaluate(()=>Promise.all(document.querySelector('.studio').getAnimations().map(animation=>animation.finished)));
  const painted=await frame('paint').evaluate(()=>({colors:studioProto.state.colors,step:studioProto.state.step,undo:studioProto.state.undo,camera:studioProto.view.debug()}));
  assert.notDeepEqual(painted.colors,initial);assert.ok(painted.undo>0);
  await click('paint','#go-assemble','assemble');
  async function printedColors(){return frame('assemble').evaluate(async()=>{
   const {ACTORS}=await import('/assemble/hardware-state.mjs'),colors={};
   for(const [id,root]of assemblyEntities){const source=ACTORS[id].sourceId;if(!/^P\d-\d\d$/.test(source||''))continue;root.traverse(child=>{if(child.isMesh&&child.material.userData?.printed)colors[source]='#'+child.material.color.getHexString().toUpperCase();});}
   return colors;
  });}
  for(const[id,color]of Object.entries(await printedColors()))assert.equal(color,painted.colors[id],id+' wears the latest studio color');
  await frame('assemble').locator('#phase-select select').selectOption('1');
  await frame('assemble').waitForFunction(()=>!anklePrototype.state.cameraTransition);
  await frame('assemble').locator('#pause button').click();
  const assembly=await frame('assemble').evaluate(()=>({step:anklePrototype.state.step,progress:anklePrototype.state.progress}));
  await click('assemble','[data-brand-slot]','home');
  assert.equal(await frame('home').locator('.duck').first().evaluate(svg=>svg.style.getPropertyValue('--head')),painted.colors['P4-01']);
  const hiddenBefore=await Promise.all(['paint','assemble'].map(key=>frame(key).evaluate(()=>gpuDraws)));
  await page.waitForTimeout(200);
  assert.deepEqual(await Promise.all(['paint','assemble'].map(key=>frame(key).evaluate(()=>gpuDraws))),hiddenBefore,'hidden views do not render');
  assert.equal(await frame('assemble').evaluate(()=>document.querySelector('#piano-audio').paused),true,'hidden guide music stops');
  await click('home','#paint-go','paint');
  assert.deepEqual(await frame('paint').evaluate(()=>({colors:studioProto.state.colors,step:studioProto.state.step,undo:studioProto.state.undo,camera:studioProto.view.debug()})),painted,'studio state and undo survive round trips');
  await frame('paint').locator('#undo').click();
  assert.deepEqual(await frame('paint').evaluate(()=>studioProto.state.colors),initial);
  await click('paint','#go-assemble','assemble');
  assert.deepEqual(await frame('assemble').evaluate(()=>({step:anklePrototype.state.step,progress:anklePrototype.state.progress})),assembly,'guide resumes the same paused step');
  for(const[id,color]of Object.entries(await printedColors()))assert.equal(color,initial[id],id+' updates after undo');
  await click('assemble','[data-brand-slot]','home');
  const modelRequests=requests.filter(url=>/\/assets\/(?:geometry|assembly\/).*\.(?:bin|glb)/.test(url)).length;
  for(let i=0;i<5;i++)for(const key of ['paint','assemble']){await click('home',key==='paint'?'#paint-go':'#build-go',key);await click(key,'[data-brand-slot]','home');}
  assert.equal(requests.filter(url=>/\/assets\/(?:geometry|assembly\/).*\.(?:bin|glb)/.test(url)).length,modelRequests,'warm navigation does not reload model buffers');
  assert.equal(await page.locator('iframe').count(),3);
  assert.deepEqual(Object.fromEntries(await Promise.all(['home','paint','assemble'].map(async key=>[key,await frame(key).evaluate(()=>pageInstance)]))),instances,'navigation retains document and GPU instances');
  await page.goBack();await page.waitForFunction(()=>document.documentElement.dataset.page==='assemble');
  await page.goForward();await page.waitForFunction(()=>document.documentElement.dataset.page==='home');
  await page.evaluate(()=>Promise.all([personalApp.navigate('/paint'),personalApp.navigate('/'),personalApp.navigate('/assemble/')]));
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.page),'assemble');
  assert.equal(await page.locator('iframe[data-active="true"]').count(),1);
  await click('assemble','[data-brand-slot]','home');
  await click('home','#paint-go','paint');await frame('paint').locator('#steps [data-step="1"]').click();await frame('paint').locator('[data-start="theme-1"]').click();
  await click('paint','[data-brand-slot]','home');
  const beforeSchemes=(await(await page.request.get(base+'/api/schemes')).json()).length;
  await click('home','#paint-alt a','paint');
  assert.deepEqual(await frame('paint').evaluate(()=>studioProto.state.colors),initial);assert.equal(await frame('paint').evaluate(()=>studioProto.state.undo),0);
  assert.equal((await(await page.request.get(base+'/api/schemes')).json()).length,beforeSchemes+1,'new draft backs up unsaved work');
  await page.screenshot({path:new URL('paint.png',out).pathname});
  result.switches=await page.evaluate(()=>navMeasures);result.retainedPages=3;result.hiddenDraws=0;
  assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result,null,2));
 }finally{await context.close();}
}catch(error){result.failure=String(error.stack||error);throw error;}
finally{await browser.close();await fs.writeFile(new URL('result.json',out),JSON.stringify(result,null,2));}
