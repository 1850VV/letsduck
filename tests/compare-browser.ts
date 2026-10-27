import * as browserChecks from './browser/checks.js';
// Real model and managed Chromium. Run against an isolated personal-edition database:
// npx tsx tests/browser/run-check.ts --fixture debug --script --check tests/compare-browser.ts
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {PNG} from 'pngjs';

const base=browserChecks.browserUrl();
const out=process.env.DUCK_COMPARE_OUTPUT||'output/compare';
await fs.mkdir(out,{recursive:true});
const browser=await browserChecks.launchBrowser({headless:true,});
const result:{checks:({name:string}&Record<string,unknown>)[];errors:string[];failure?:string}={checks:[],errors:[]};
const check=(name:string,detail:Record<string,unknown>={})=>result.checks.push({name,...detail});
try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  page.on('pageerror',error=>result.errors.push(String(error)));
  await browserChecks.preparePage(page);await page.goto(base+'/paint');
  await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  await page.locator('[data-start="theme-2"]').first().click();
  await page.locator('#start-go').click();
  await page.locator('#toast.show').waitFor({state:'hidden'});
  await page.waitForTimeout(1100);
  await page.evaluate(()=>window.studioProto.view.setHighlight([],[]));
  const viewState=()=>page.evaluate(()=>({colors:window.studioProto.state.colors,undo:window.studioProto.state.undo,draft:localStorage.getItem('dd-studio-personal'),camera:window.studioProto.view.stage.camera.projectionMatrix.toArray(),position:window.studioProto.view.stage.camera.position.toArray()}));
  const capture=async (name:string)=>{
    const image=await page.evaluate(()=>new Promise<string>(resolve=>{window.studioProto.view.invalidate();requestAnimationFrame(()=>resolve(window.studioProto.view.canvas.toDataURL('image/png')));}));
    const buffer=Buffer.from(browserChecks.required(image.split(',')[1]),'base64');await fs.writeFile(`${out}/${name}.png`,buffer);return PNG.sync.read(buffer);
  };
  const equalRegion=(a:PNG,b:PNG,x0:number,x1:number)=>{
    let changed=0;
    for(let y=0;y<a.height;y++)for(let x=x0;x<x1;x++){
      const i=(y*a.width+x)*4;if(browserChecks.required(a.data[i])!==browserChecks.required(b.data[i])||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3])changed++;
    }return changed;
  };
  const hold=page.locator('#hold'),stage=page.locator('#stage');
  const hb=browserChecks.required(await hold.boundingBox()),sb=browserChecks.required(await stage.boundingBox()),hx=hb.x+hb.width/2,hy=hb.y+hb.height/2;
  await page.mouse.move(1200,30);const before=await viewState(),current=await capture('current');
  await page.mouse.click(hx,hy);assert.equal(await hold.evaluate(el=>el.classList.contains('on')),false);check('short click leaves current colours');
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(380);
  assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true);
  const original=await capture('original');
  assert.ok(equalRegion(original,current,0,current.width)>1000);check('long press displays reference colours');
  await page.mouse.move(sb.x+sb.width*.4,hy,{steps:8});
  assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true,'comparison must stay active while dragging away from the button');
  assert.equal(await page.locator('#compare-wipe').isVisible(),true);
  const split=await capture('split'),cut=Math.round(split.width*.4);
  assert.equal(equalRegion(split,original,0,cut-2),0,'left half must match reference at the same camera');
  assert.equal(equalRegion(split,current,cut+2,split.width),0,'right half must match current at the same camera');
  await page.screenshot({path:`${out}/desktop-split.png`});
  assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true,'capture should leave comparison active');
  assert.deepEqual(await viewState(),before);check('split keeps projection, colours, undo and stored draft unchanged');
  check('left reference and right current are pixel-identical to their full-frame renders');
  await page.mouse.move(sb.x-20,hy,{steps:8});assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true,'left boundary remains active');const left=await capture('left-edge');assert.equal(equalRegion(left,current,0,current.width),0);
  await page.mouse.move(sb.x+sb.width+20,hy,{steps:8});assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true,'right boundary remains active');const right=await capture('right-edge');assert.equal(equalRegion(right,original,0,current.width),0);check('both drag boundaries cover the complete model');
  await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);
  const released=await capture('released');assert.equal(equalRegion(released,current,0,current.width),0);assert.deepEqual(await viewState(),before);check('release restores current colours immediately');
  // Keep left held while right rotates. The divider must stay at its chosen cut.
  const reference=await page.evaluate(async()=>Object.fromEntries(window.__duckModules.parseModelManifest(await(await fetch('/assets/model.json')).json()).parts.map(p=>[p.id,p.color])));
  await page.mouse.move(hx,hy);await page.mouse.down({button:'left'});await page.waitForTimeout(330);await page.mouse.move(sb.x+sb.width*.4,hy,{steps:8});
  const cutBefore=await page.locator('#compare-wipe').evaluate(el=>parseFloat(el.style.left)/100),cameraBefore=(await viewState()).position;
  await page.mouse.down({button:'right'});await page.mouse.move(hx+100,hy-40,{steps:16});
  assert.notDeepEqual((await viewState()).position,cameraBefore,'right drag must orbit while left keeps comparison active');
  assert.equal(await page.locator('#compare-wipe').evaluate(el=>parseFloat(el.style.left)/100),cutBefore);check('left plus right drag rotates the model while divider stays fixed');
  const rotated=await capture('dual-split');await page.evaluate(colors=>window.studioProto.view.setWipe(colors,1),reference);const rotatedOriginal=await capture('dual-original');
  await page.evaluate(()=>window.studioProto.view.setWipe(null));const rotatedCurrent=await capture('dual-current');await page.evaluate(({colors,at})=>window.studioProto.view.setWipe(colors,at),{colors:reference,at:cutBefore});
  const rotatedCut=Math.round(rotated.width*cutBefore);assert.equal(equalRegion(rotated,rotatedOriginal,0,rotatedCut-2),0);assert.equal(equalRegion(rotated,rotatedCurrent,rotatedCut+2,rotated.width),0);check('rotated colour halves match complete reference and current frames exactly');
  await page.screenshot({path:`${out}/dual-button.png`});
  await page.mouse.up({button:'right'});assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true);
  await page.mouse.move(hx+110,hy-40,{steps:3});assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true);
  assert.ok(Math.abs(await page.locator('#compare-wipe').evaluate(el=>parseFloat(el.style.left)/100)-(cutBefore+10/sb.width))<.002);check('right release keeps comparison and resumes divider movement without a jump');
  await page.mouse.up({button:'left'});assert.equal(await hold.evaluate(el=>el.classList.contains('on')),false);check('left release exits after rotating');
  await page.mouse.move(hx,hy);await page.mouse.down({button:'left'});await page.waitForTimeout(330);await page.mouse.down({button:'right'});await page.mouse.move(hx+50,hy-40,{steps:6});
  await page.mouse.up({button:'left'});assert.equal(await hold.evaluate(el=>el.classList.contains('on')),false);await page.mouse.up({button:'right'});check('left release exits even while right remains held');
  const unchanged=await viewState();for(const key of ['colors','undo','draft'] as const)assert.deepEqual(unchanged[key],before[key]);check('dual-button comparison does not change colours, undo or draft');
  await page.mouse.move(hx,hy);await page.mouse.down({button:'left'});await page.waitForTimeout(330);await page.mouse.down({button:'right'});await page.mouse.move(18,hy-60,{steps:12});
  const azimuth=()=>page.evaluate(()=>{const {camera,controls}=window.studioProto.view.stage;return Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);});let prior=await azimuth(),travel=0;
  for(let i=1;i<=24;i++){await page.mouse.move(18+(1420-18)*i/24,hy-60);const next=await azimuth();let delta=next-prior;while(delta>Math.PI)delta-=2*Math.PI;while(delta<-Math.PI)delta+=2*Math.PI;travel+=delta;prior=next;}
  assert.ok(Math.abs(travel)>Math.PI*2);await page.mouse.up({button:'right'});await page.mouse.up({button:'left'});check('right drag can orbit through a full 360 degrees',{degrees:Math.abs(travel)*180/Math.PI});
  const orbitBefore=(await viewState()).position;
  await page.mouse.move(sb.x+sb.width*.5,sb.y+sb.height*.5);await page.mouse.down();await page.mouse.move(sb.x+sb.width*.6,sb.y+sb.height*.5,{steps:10});await page.mouse.up();await page.waitForTimeout(500);
  assert.notDeepEqual((await viewState()).position,orbitBefore);check('model orbit works again after release');
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await hold.dispatchEvent('pointercancel');await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);check('pointer cancellation exits');
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);check('window blur exits');
  await page.keyboard.down('Space');assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true);await page.keyboard.up('Space');assert.equal(await hold.evaluate(el=>el.classList.contains('on')),false);check('existing space-bar hold and release still work');
  await page.locator('#cmp-pick').click();await page.locator('[data-cmp-split]').click();assert.equal(await page.locator('#split-labels').isVisible(),true);
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await page.mouse.up();assert.equal(await page.locator('#split-labels').isVisible(),true);check('existing side-by-side A/B comparison is restored after release');
  await page.locator('#cmp-pick').click();await page.locator('[data-cmp-split]').click();
  await page.locator('#spin').click();await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(330);const angle=await page.evaluate(()=>window.studioProto.view.root.rotation.y);await page.waitForTimeout(200);
  assert.ok(await page.evaluate(()=>window.studioProto.view.root.rotation.y)>angle);await page.mouse.up();await page.locator('#spin').click();check('turntable can keep rotating through comparison');
  await page.locator('#steps [data-step="1"]').click();await page.waitForTimeout(700);assert.equal(await page.locator('#lineup').isVisible(),true);check('step-1 lineup remains available');
  await page.locator('#steps [data-step="2"]').click();await page.waitForTimeout(800);
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);check('Escape exits');
  for(const width of [1440,1280,1024])for(const locale of ['en','zh-Hans']){
    await page.setViewportSize({width,height:900});await browserChecks.chooseLocale(page,locale);await page.waitForTimeout(400);
    const layout=await page.evaluate(()=>{const s=window.__browserChecks.query('#stage').getBoundingClientRect(),h=window.__browserChecks.query('#hold').getBoundingClientRect(),d=window.__browserChecks.query('#dock').getBoundingClientRect();return {offset:h.x+h.width/2-s.x-s.width/2,inside:d.left>=s.left&&d.right<=s.right};});
    assert.ok(Math.abs(layout.offset)<.5,`${width} ${locale}: compare button centre must match model centre`);assert.ok(layout.inside,`${width} ${locale}: all dock controls must fit the stage`);
  }check('compare button itself is centred in English and Chinese at 1440, 1280 and 1024');
  // Browser-native touch events exercise pointer capture; synthetic pointer IDs cannot capture a touch.
  const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const p=await phone.newPage();p.on('pageerror',error=>result.errors.push(String(error)));
  await browserChecks.preparePage(p);await p.goto(base+'/paint');await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);await p.locator('[data-start="theme-2"]').first().click();await p.locator('#start-go').click();await p.locator('#toast.show').waitFor({state:'hidden'});await p.waitForTimeout(1000);
  const ph=browserChecks.required(await p.locator('#hold').boundingBox()),ps=browserChecks.required(await p.locator('#stage').boundingBox()),touch=await phone.newCDPSession(p);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ph.x+ph.width/2,y:ph.y+ph.height/2}]});await p.waitForTimeout(330);
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:ps.x+ps.width*.5,y:ph.y+ph.height/2}]});
  assert.equal(await p.locator('#compare-wipe').isVisible(),true);await p.screenshot({path:`${out}/phone-split.png`});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.locator('#compare-wipe').isVisible(),false);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('phone touch hold, drag and release; no horizontal overflow');
  const undoBefore=await p.evaluate(()=>window.studioProto.state.undo);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ps.x+ps.width*.5,y:ps.y+ps.height*.6}]});await p.waitForTimeout(550);
  assert.equal(await p.locator('#hold').evaluate(el=>el.classList.contains('on')),true);assert.equal(await p.locator('#compare-wipe').isVisible(),false);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.locator('#hold').evaluate(el=>el.classList.contains('on')),false);assert.equal(await p.evaluate(()=>window.studioProto.state.undo),undoBefore);check('existing phone canvas long-press previews without painting');
  await phone.close();assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result,null,2));
}catch(error){result.failure=browserChecks.failure(error);throw error;}
finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(result,null,2));}
