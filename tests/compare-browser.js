// Real model and managed Chromium. Run against an isolated personal-edition database:
// DUCK_BROWSER_URL=http://127.0.0.1:8897 node tests/compare-browser.js
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8897';
const out=process.env.DUCK_COMPARE_OUTPUT||'output/compare';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'});
const result={checks:[],errors:[]};
const check=(name,detail={})=>result.checks.push({name,...detail});
try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  page.on('pageerror',error=>result.errors.push(String(error)));
  await page.goto(base+'/paint');
  await page.waitForFunction(()=>window.studioProto);
  await page.locator('[data-start="theme-2"]').first().click();
  await page.locator('#start-go').click();
  await page.locator('#toast.show').waitFor({state:'hidden'});
  await page.waitForTimeout(1100);
  await page.evaluate(()=>studioProto.view.setHighlight([],[]));
  const viewState=()=>page.evaluate(()=>({colors:studioProto.state.colors,undo:studioProto.state.undo,draft:localStorage.getItem('dd-studio-personal'),camera:studioProto.view.stage.camera.projectionMatrix.toArray(),position:studioProto.view.stage.camera.position.toArray()}));
  const capture=async name=>{
    const image=await page.evaluate(()=>new Promise(resolve=>{studioProto.view.invalidate();requestAnimationFrame(()=>resolve(studioProto.view.canvas.toDataURL('image/png')));}));
    const buffer=Buffer.from(image.split(',')[1],'base64');await fs.writeFile(`${out}/${name}.png`,buffer);return PNG.sync.read(buffer);
  };
  const equalRegion=(a,b,x0,x1)=>{
    let changed=0;
    for(let y=0;y<a.height;y++)for(let x=x0;x<x1;x++){
      const i=(y*a.width+x)*4;if(a.data[i]!==b.data[i]||a.data[i+1]!==b.data[i+1]||a.data[i+2]!==b.data[i+2]||a.data[i+3]!==b.data[i+3])changed++;
    }return changed;
  };
  const hold=page.locator('#hold'),stage=page.locator('#stage');
  const hb=await hold.boundingBox(),sb=await stage.boundingBox(),hx=hb.x+hb.width/2,hy=hb.y+hb.height/2;
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
  await page.mouse.move(sb.x+sb.width*.5,sb.y+sb.height*.5);await page.mouse.down();await page.mouse.move(sb.x+sb.width*.6,sb.y+sb.height*.5,{steps:10});await page.mouse.up();await page.waitForTimeout(500);
  assert.notDeepEqual((await viewState()).position,before.position);check('model orbit works again after release');
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await hold.dispatchEvent('pointercancel');await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);check('pointer cancellation exits');
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await page.evaluate(()=>dispatchEvent(new Event('blur')));await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);check('window blur exits');
  await page.keyboard.down('Space');assert.equal(await hold.evaluate(el=>el.classList.contains('on')),true);await page.keyboard.up('Space');assert.equal(await hold.evaluate(el=>el.classList.contains('on')),false);check('existing space-bar hold and release still work');
  await page.locator('#cmp-pick').click();await page.locator('[data-cmp-split]').click();assert.equal(await page.locator('#split-labels').isVisible(),true);
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await page.mouse.up();assert.equal(await page.locator('#split-labels').isVisible(),true);check('existing side-by-side A/B comparison is restored after release');
  await page.locator('#cmp-pick').click();await page.locator('[data-cmp-split]').click();
  await page.locator('#steps [data-step="1"]').click();await page.waitForTimeout(700);assert.equal(await page.locator('#lineup').isVisible(),true);check('step-1 lineup remains available');
  await page.locator('#steps [data-step="2"]').click();await page.waitForTimeout(800);
  await page.mouse.move(hx,hy);await page.mouse.down();await page.waitForTimeout(320);await page.keyboard.press('Escape');await page.mouse.up();assert.equal(await page.locator('#compare-wipe').isVisible(),false);check('Escape exits');
  // Browser-native touch events exercise pointer capture; synthetic pointer IDs cannot capture a touch.
  const phone=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const p=await phone.newPage();p.on('pageerror',error=>result.errors.push(String(error)));
  await p.goto(base+'/paint');await p.waitForFunction(()=>window.studioProto);await p.locator('[data-start="theme-2"]').first().click();await p.locator('#start-go').click();await p.locator('#toast.show').waitFor({state:'hidden'});await p.waitForTimeout(1000);
  const ph=await p.locator('#hold').boundingBox(),ps=await p.locator('#stage').boundingBox(),touch=await phone.newCDPSession(p);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ph.x+ph.width/2,y:ph.y+ph.height/2}]});await p.waitForTimeout(330);
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:ps.x+ps.width*.5,y:ph.y+ph.height/2}]});
  assert.equal(await p.locator('#compare-wipe').isVisible(),true);await p.screenshot({path:`${out}/phone-split.png`});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.locator('#compare-wipe').isVisible(),false);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));check('phone touch hold, drag and release; no horizontal overflow');
  const undoBefore=await p.evaluate(()=>studioProto.state.undo);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ps.x+ps.width*.5,y:ps.y+ps.height*.6}]});await p.waitForTimeout(550);
  assert.equal(await p.locator('#hold').evaluate(el=>el.classList.contains('on')),true);assert.equal(await p.locator('#compare-wipe').isVisible(),false);
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.locator('#hold').evaluate(el=>el.classList.contains('on')),false);assert.equal(await p.evaluate(()=>studioProto.state.undo),undoBefore);check('existing phone canvas long-press previews without painting');
  await phone.close();assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result,null,2));
}catch(error){result.failure=String(error.stack||error);throw error;}
finally{await browser.close();await fs.writeFile(`${out}/results.json`,JSON.stringify(result,null,2));}
