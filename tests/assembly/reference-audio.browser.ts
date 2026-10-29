import * as browserChecks from '../browser/checks.js';
import test from 'node:test';
import assert from 'node:assert/strict';


test('audible reference holds music and cues until close, retaining manual audio choices',{skip:!process.env.ASSEMBLY_TEST_URL,timeout:90000},async()=>{
 const browser=await browserChecks.launchBrowser({headless:false});
 try{
  const page=await browser.newPage({locale:'zh-CN',viewport:{width:1440,height:1000}}),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  const music=()=>page.evaluate(()=>({paused:window.__browserChecks.query<HTMLAudioElement>('#piano-audio').paused,time:window.__browserChecks.query<HTMLAudioElement>('#piano-audio').currentTime}));
  const change=async(id:string,value:number|boolean)=>page.locator('#'+id).evaluate((el,value)=>el.dispatchEvent(new CustomEvent('ryugi-change',{detail:{value}})),value);
  const open=async()=>{await page.locator('#reference-toggle').click();await page.waitForFunction(()=>!window.__browserChecks.query<HTMLVideoElement>('#reference-video').paused);};
  const unmute=async()=>{await page.locator('video#reference-video').evaluate(v=>{window.__browserChecks.video(v).volume=1;window.__browserChecks.video(v).muted=false;});await page.waitForTimeout(200);};
  await browserChecks.preparePage(page);await page.goto(`${process.env.ASSEMBLY_TEST_URL}/assemble/`);await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  await page.locator('#kit-go').click();await page.waitForFunction(()=>!window.__browserChecks.query<HTMLAudioElement>('#piano-audio').paused);
  await open();assert.equal(await page.locator('video#reference-video').evaluate(v=>window.__browserChecks.video(v).muted),true);
  assert.equal((await music()).paused,false,'muted reference permits the existing music');
  await unmute();assert.equal((await music()).paused,true,'audible reference pauses background music');const held=await music();
  await page.locator('video#reference-video').evaluate(v=>window.__browserChecks.video(v).muted=true);
  await change('sound-volume',50);await page.locator('#replay').click();
  assert.equal((await music()).paused,true,'remute, volume controls and user gestures do not release the hold');
  const cueCount=await page.evaluate(()=>window.anklePrototype.sound.cueCount);
  await change('playback-rate',2);await page.waitForFunction(()=>window.anklePrototype.state.progress===1);
  assert.equal(await page.evaluate(()=>window.anklePrototype.sound.cueCount),cueCount,'reference hold also suppresses completion cues');
  assert.equal((await music()).time,held.time,'background music retains its position');
  await page.locator('#reference-close').click();await page.waitForFunction(()=>!window.__browserChecks.query<HTMLAudioElement>('#piano-audio').paused);
  assert.equal(await page.locator('video#reference-video').evaluate(v=>window.__browserChecks.video(v).paused),true);
  assert.ok((await music()).time>=held.time);
  await open();assert.equal(await page.locator('video#reference-video').evaluate(v=>window.__browserChecks.video(v).muted),true,'each opening starts muted');
  await unmute();await change('music-enabled',false);await page.locator('#reference-close').click();await page.waitForTimeout(250);
  assert.equal((await music()).paused,true,'closing respects manual music-off');
  await change('music-enabled',true);await page.waitForFunction(()=>!window.__browserChecks.query<HTMLAudioElement>('#piano-audio').paused);
  await open();await unmute();await change('sound-volume',0);await page.locator('#reference-close').click();await page.waitForTimeout(250);
  assert.equal((await music()).paused,true,'closing respects zero volume');
  await open();const {STEPS,chapterFor}=await import('../../frontend/assemble/hardware-state.js');const s=await page.evaluate(()=>window.anklePrototype.state.step),end=browserChecks.required(STEPS[s]).sourceEnd-browserChecks.required(browserChecks.required(chapterFor(s)).videoStart);
  await page.locator('video#reference-video').evaluate((v,t)=>window.__browserChecks.video(v).currentTime=t-.1,end);await page.waitForTimeout(900);
  assert.equal(await page.locator('video#reference-video').evaluate(v=>window.__browserChecks.video(v).paused),false,'reference continues beyond the current step');
  await page.locator('#reference-close').click();assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
