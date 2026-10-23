import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:false}),result={errors:[],resize:[]};
const url=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897';
try{
 const instrument=async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('return { invalidate, mount,','return { __test:{renderer,scene,camera,dragDraw,dragging:()=>dragging}, invalidate, mount,')});};
 const p=await browser.newPage({viewport:{width:1440,height:1000}});p.on('pageerror',e=>result.errors.push(String(e)));await p.route('**/shared/duck-view.mjs',instrument);await p.goto(url);await p.waitForFunction(()=>window.studioProto);
 if(await p.locator('#coach').isVisible())await p.locator('#coach-go').click();
 await p.evaluate(async()=>{const v=studioProto.view,data=await(await import('/shared/duck-view.mjs')).loadDuck();v.setFinishes(Object.fromEntries(data.model.parts.map(p=>[p.id,'translucent'])));});
 const ready=()=>p.waitForFunction(()=>!studioProto.view.__test.dragDraw.needsPreparation());
 await ready();
 for(const size of [{width:1200,height:850},{width:1500,height:980},{width:1200,height:850},{width:1440,height:1000}]){
  await p.setViewportSize(size);await p.waitForTimeout(100);await ready();
  const row=await p.evaluate(()=>{const v=studioProto.view,{renderer:r,dragDraw}=v.__test,targets=[],render=r.render;r.render=function(s,c){const t=r.getRenderTarget();if(t)targets.push([t.width,t.height]);return render.call(this,s,c);};try{dragDraw.render(true);}finally{r.render=render;}dragDraw.render(false);return {canvas:[v.canvas.width,v.canvas.height],targets,textures:r.info.memory.textures,error:r.getContext().getError()};});
  assert.deepEqual(row.targets,[row.canvas.map(n=>Math.floor(n*.67))]);assert.equal(row.error,0);result.resize.push(row);
 }
 assert.equal(new Set(result.resize.map(r=>r.textures)).size,1,'resizing must replace buffers, not accumulate textures');
 await p.evaluate(()=>{window.loss=studioProto.view.__test.renderer.getContext().getExtension('WEBGL_lose_context');loss.loseContext();});await p.waitForTimeout(100);
 assert.equal(await p.evaluate(()=>studioProto.view.__test.renderer.getContext().isContextLost()),true);
 await p.evaluate(()=>loss.restoreContext());await p.waitForFunction(()=>!studioProto.view.__test.renderer.getContext().isContextLost());await p.waitForTimeout(150);await ready();
 result.restored=await p.evaluate(()=>{const v=studioProto.view,{renderer:r,dragDraw}=v.__test;dragDraw.render(true);dragDraw.render(false);const gl=r.getContext(),pixels=new Uint8Array(v.canvas.width*v.canvas.height*4);gl.readPixels(0,0,v.canvas.width,v.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return {visible:pixels.some((x,i)=>i%4===3&&x>127),error:gl.getError()};});assert.deepEqual(result.restored,{visible:true,error:0});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});mobile.on('pageerror',e=>result.errors.push(String(e)));
 // Rendering smoke test uses an already-onboarded user; onboarding layout is separate.
 await mobile.addInitScript(()=>localStorage.setItem('dd-studio-coach','1'));
 await mobile.route('**/shared/duck-view.mjs',instrument);await mobile.goto(url);await mobile.waitForFunction(()=>window.studioProto);await mobile.waitForFunction(()=>!studioProto.view.__test.dragDraw.needsPreparation());
 const box=await mobile.locator('.stage canvas').boundingBox(),cdp=await mobile.context().newCDPSession(mobile),x=box.x+box.width*.5,y=box.y+box.height*.5;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+15}]});await mobile.waitForTimeout(100);
 result.mobile=await mobile.evaluate(()=>({held:studioProto.view.__test.dragging(),canvas:[studioProto.view.canvas.width,studioProto.view.canvas.height],overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(result.mobile.held,true);assert.equal(result.mobile.overflow,false);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForTimeout(100);assert.equal(await mobile.evaluate(()=>studioProto.view.__test.dragging()),false);await cdp.detach();
 assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
}catch(e){result.failure=String(e.stack||e);throw e;}finally{await browser.close();await fs.writeFile('output/drag-buffer/resize.json',JSON.stringify(result,null,2));}
