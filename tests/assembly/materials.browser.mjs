// Optional real-asset acceptance: ASSEMBLY_TEST_URL=http://127.0.0.1:8898 node --test tests/assembly/materials.browser.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

test('chapter materials: quantities, one-piece inspection, persistence and step return',{skip:!process.env.ASSEMBLY_TEST_URL,timeout:120000},async()=>{
 const browser=await chromium.launch({headless:false});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
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
