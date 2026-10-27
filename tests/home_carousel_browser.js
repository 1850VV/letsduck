// Playwright CLI run-code; debug_browser_fixture.py provides isolated HTTP/DB/device state.
async page=>{
 const base='http://127.0.0.1:8896',checks=[],errors=[],writes=[];
 await page.unrouteAll({behavior:'wait'});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(request.method()==='POST'&&request.url().includes('/api/duck-debug/'))writes.push(request.url());});
 const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);};
 const front=()=>page.locator('.duck-choice[data-c-position="true"]').getAttribute('data-duck');
 const waitFront=id=>page.waitForFunction(id=>document.querySelector(`[data-duck="${id}"]`)?.dataset.cPosition==='true'&&document.querySelector('.duck-stage')?.dataset.settled!=='false',id,{timeout:2500});
 const home=async()=>{await page.goto(base+'/');await page.waitForSelector('body[data-home-ready="true"]');};
 await page.setViewportSize({width:1440,height:900});await home();
 await page.evaluate(()=>localStorage.removeItem('letsduck.duck-hub.v1'));await home();
 check('首次调试鸭在C位',await front()==='debug');
 const stage=page.locator('.duck-stage');let box=await stage.boundingBox();
 const drag=async(dx,observe=false)=>{const r=await stage.boundingBox(),x=r.x+r.width*.45,y=r.y+r.height*.61,before=await page.locator('[data-duck=paint]').boundingBox();await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx/2,y,{steps:9});if(observe){await page.waitForFunction(left=>Math.abs(document.querySelector('[data-duck=paint]').getBoundingClientRect().left-left)>15,before.x);check('松手前整组已连续移动',true);}await page.mouse.move(x+dx,y,{steps:9});await page.mouse.up();};
 await drag(Math.max(180,box.width*.32),true);
 try{await waitFront('paint');}catch(error){await page.screenshot({path:'output/playwright/duck-carousel-integration/drag-failure.png'});throw Error('拖动应将来涂鸭转到C位；实际为 '+await front());}
 check('拖动换C位',await front()==='paint');check('拖动松手不打开模块',!(await page.locator('#module-window').isVisible()));
 await page.locator('[data-duck=paint]').click();check('C位进入涂装台',(await page.locator('#module-frame').getAttribute('src'))==='/paint');
 await page.locator('#close-module').click();check('关闭记录最近使用',await page.evaluate(()=>localStorage.getItem('letsduck.duck-hub.v1'))==='paint');
 await home();await waitFront('paint');check('刷新保留最近使用C位',await front()==='paint');
 await page.locator('[data-duck=debug]').click();await waitFront('debug');check('侧鸭点击只转到前面',!(await page.locator('#module-window').isVisible()));
 await page.locator('[data-duck=debug]').click();check('调试鸭仍进入真实模块',(await page.locator('#module-frame').getAttribute('src'))==='/debug/?embedded=1');
 await page.locator('#close-module').click();await stage.focus();await page.keyboard.press('ArrowRight');await waitFront('paint');check('方向键切换',await front()==='paint');
 await drag(box.width*.32*3);await waitFront('paint');check('连续绕整圈',await front()==='paint');
 await page.locator('[data-duck=assemble]').click();await waitFront('assemble');
 await page.waitForFunction(()=>document.querySelector('[data-duck=assemble]').dataset.numberingReady==='true');
 await page.locator('[data-duck=assemble]').click();check('编号齐全仍可进入组装',(await page.locator('#module-frame').getAttribute('src'))==='/assemble/');await page.locator('#close-module').click();
 await page.route('**/api/duck-debug/numbering',async route=>{const response=await route.fetch(),n=await response.json();n.ready=false;n.verifiedIds=n.verifiedIds.filter(id=>id!==34);n.missingIds=[34];await route.fulfill({response,json:n});});
 await page.route('**/api/duck-debug/status',async route=>{const response=await route.fetch(),data=await response.json();data.numbering.ready=false;data.numbering.verifiedIds=data.numbering.verifiedIds.filter(id=>id!==34);data.numbering.missingIds=[34];await route.fulfill({response,json:data});});
 await page.waitForFunction(()=>document.querySelector('[data-duck=assemble]').dataset.numberingReady==='false');
 await page.locator('[data-duck=assemble]').click();check('缺编号仍转入调试鸭',(await page.locator('#module-frame').getAttribute('src'))==='/debug/?embedded=1');await page.locator('#close-module').click();await waitFront('debug');
 await page.unrouteAll({behavior:'wait'});await page.setViewportSize({width:390,height:844});
 const cdp=await page.context().newCDPSession(page);
 try{
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});box=await stage.boundingBox();const x=box.x+box.width*.4,y=box.y+box.height*.6;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+180*i/12,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await waitFront('paint');check('手机触摸拖动',await front()==='paint');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+35,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await waitFront('paint');
  check('触摸中断后释放拖动',!(await stage.evaluate(el=>el.classList.contains('dragging')))&&!(await page.locator('#module-window').isVisible()));
 }finally{await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});await cdp.detach();}
 check('手机无横向溢出',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 check('名称不越过场景底边',await page.evaluate(()=>{const r=document.querySelector('.duck-stage').getBoundingClientRect();return [...document.querySelectorAll('.duck-choice')].every(e=>e.getBoundingClientRect().bottom<=r.bottom+1);}));
 await page.screenshot({path:'output/playwright/duck-carousel-integration/mobile.png'});
 await page.emulateMedia({reducedMotion:'reduce'});await stage.focus();await page.keyboard.press('ArrowRight');
 check('减少动态效果时立即切换',await front()==='assemble'&&await stage.getAttribute('data-settled')==='true');await page.emulateMedia({reducedMotion:null});
 await page.setViewportSize({width:1440,height:900});await page.locator('#reset-carousel').click();await waitFront('debug');
 check('复位回调试鸭',await front()==='debug'&&await page.evaluate(()=>localStorage.getItem('letsduck.duck-hub.v1'))===null);
 await page.screenshot({path:'output/playwright/duck-carousel-integration/desktop.png'});
 check('首页切换不发送设备写入',writes.length===0);check('无运行错误',errors.length===0);
 return {pass:true,checks,errors,writes};
}
