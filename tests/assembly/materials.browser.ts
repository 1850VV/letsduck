import * as browserChecks from '../browser/checks.js';
// npx tsx tests/browser/run-check.ts --fixture preparation --script --check tests/assembly/materials.browser.ts
import test from 'node:test';
import assert from 'node:assert/strict';


test('chapter materials: quantities, one-piece inspection, persistence and step return',{skip:!process.env.ASSEMBLY_TEST_URL,timeout:120000},async()=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await browserChecks.preparePage(page);await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  await page.locator('#kit').waitFor({state:'visible'});
  assert.equal(await page.getByRole('switch',{name:'选中放大'}).count(),1,'the approved enlargement switch is present');
  const motors=page.locator('#kit-parts .material-row').filter({hasText:'待编号'});assert.match(await motors.innerText(),/×15/);
  assert.equal(await page.getByRole('button',{name:/待编号.*第 \d+ 件/}).count(),15);
  await motors.click();await page.locator('#inspection-screen').waitFor({state:'visible'});assert.match(await page.locator('.inspection-name').innerText(),/第 1 \/ 15 件/);
  await page.getByRole('button',{name:/待编号.*第 1 件/}).waitFor({state:'hidden'});
  assert.equal(await page.getByRole('button',{name:/待编号.*第 \d+ 件/}).count(),14,'only the inspected specimen leaves the queue');
  await page.getByRole('button',{name:'收回零件'}).click();
  await page.getByRole('button',{name:/待编号.*第 7 件/}).click();assert.match(await page.locator('.inspection-name').innerText(),/第 7 \/ 15 件/);
  await page.getByRole('switch',{name:'选中放大'}).click();await page.locator('#inspection-screen').waitFor({state:'hidden'});
  await page.getByRole('button',{name:/待编号.*第 7 件/}).waitFor({state:'visible'});
  assert.equal(await page.getByRole('button',{name:/待编号.*第 \d+ 件/}).count(),15);
  await page.reload();await page.waitForFunction(()=>window.anklePrototype?.state.uiReady&&window.anklePrototype.state.ready);
  assert.equal(await page.getByRole('switch',{name:'选中放大'}).getAttribute('aria-checked'),'false');
  await page.locator('#kit-go').click();await page.locator('#kit').waitFor({state:'hidden'});
  assert.equal((await page.evaluate(()=>window.anklePrototype.state)).step,1);
  await page.locator('#motion-progress').evaluate(el=>el.dispatchEvent(new CustomEvent('ryugi-change',{detail:{value:37}})));
  const before=await page.evaluate(()=>window.anklePrototype.state);
  await page.getByRole('button',{name:'本章零件',exact:true}).click();await page.locator('#kit-go').click();
  const after=await page.evaluate(()=>window.anklePrototype.state);assert.equal(after.step,before.step);assert.equal(after.progress,before.progress);
  for(let ci=1;ci<14;ci++){
   await page.locator('#phase-select').evaluate((el,value)=>el.dispatchEvent(new CustomEvent('ryugi-change',{detail:{value:String(value)}})),ci);
   await page.locator('#kit').waitFor({state:'visible'});assert.ok(await page.locator('#kit-parts .material-row').count());
   assert.equal((await page.evaluate(()=>window.anklePrototype.state)).playing,false);
   await page.locator('#kit-go').click();await page.locator('#kit').waitFor({state:'hidden'});
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('Space activates the focused material control without starting the chapter',{skip:!process.env.ASSEMBLY_TEST_URL,timeout:60000},async()=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  const page=await browser.newPage();await browserChecks.preparePage(page);await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);
  await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  const toggle=page.getByRole('switch',{name:'选中放大'});await toggle.focus();await page.keyboard.press('Space');
  assert.equal(await page.locator('#kit').isVisible(),true,'keyboard switch activation must leave preparation open');
  assert.equal(await toggle.getAttribute('aria-checked'),'false');
  await toggle.click();const seventh=page.getByRole('button',{name:/待编号.*第 7 件/});await seventh.focus();await page.keyboard.press('Space');
  assert.equal(await page.locator('#kit').isVisible(),true);await page.locator('#inspection-screen').waitFor({state:'visible'});
  assert.match(await page.locator('.inspection-name').innerText(),/第 7 \/ 15 件/);
 }finally{await browser.close();}
});

test('starting a prepared chapter preserves automatic playback',{skip:!process.env.ASSEMBLY_TEST_URL,timeout:60000},async()=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  const page=await browser.newPage();await browserChecks.preparePage(page);await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);
  await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  await page.locator('#phase-select').evaluate(el=>el.dispatchEvent(new CustomEvent('ryugi-change',{detail:{value:'1'}})));
  await page.locator('#kit-go').click();await page.locator('#next').click();await page.locator('#autoplay').click();
  await page.locator('#kit').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.anklePrototype.playback.autoplay),true);
  await page.locator('#kit-go').click();assert.equal(await page.evaluate(()=>window.anklePrototype.playback.autoplay),true,'chapter preparation must not switch autoplay off');
  assert.equal(await page.evaluate(()=>window.anklePrototype.state.playing),true);
 }finally{await browser.close();}
});

test('leaving a material tray saves the lesson camera rather than the display camera',{skip:!process.env.ASSEMBLY_TEST_URL,timeout:60000},async()=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  const page=await browser.newPage();await browserChecks.preparePage(page);await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);
  await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  await page.locator('#kit-go').click();await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition);
  await page.locator('#motion-progress').evaluate(el=>el.dispatchEvent(new CustomEvent('ryugi-change',{detail:{value:37}})));
  const before=await page.evaluate(()=>window.anklePrototype.state);await page.locator('#step-materials').click();
  assert.notDeepEqual(await page.evaluate(()=>window.anklePrototype.state.camera),before.camera);
  await browserChecks.preparePage(page);await page.goto('about:blank');await browserChecks.preparePage(page);await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);
  await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  assert.equal(await page.locator('#kit').isVisible(),false);const after=await page.evaluate(()=>window.anklePrototype.state);
  assert.equal(after.step,before.step);
  for(const key of ['camera','target'] as const)for(const i of [0,1,2] as const)assert.ok(Math.abs(after[key][i]-before[key][i])<1e-7,`${key} axis ${i} returns to the lesson view`);
 }finally{await browser.close();}
});
