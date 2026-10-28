import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import type {Page} from 'playwright';
import * as browserChecks from '../browser/checks.js';

// Locale synchronization comes from another same-origin context, as it does for an open homepage frame.
// This check supplements the homepage's real menu-click and native-dropdown acceptance paths.
export default async function assemblyLocaleState(page:Page){
 await page.setViewportSize({width:1440,height:900});
 const evidence=process.env.ASSEMBLY_EVIDENCE_DIR;const shot=async(name:string)=>{if(!evidence)return;await mkdir(evidence,{recursive:true});await page.screenshot({path:join(evidence,name+'.png')});};
 await browserChecks.preparePage(page);await page.addInitScript(()=>localStorage.setItem('dd-locale','zh-Hans'));
 const errors:string[]=[],writes:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))writes.push(request.method()+' '+request.url());});
 const sameVector=(actual:number[],expected:number[],label:string)=>{assert.equal(actual.length,expected.length,label);for(let i=0;i<actual.length;i++)assert.ok(Math.abs(actual[i]!-expected[i]!)<1e-7,`${label}[${i}]: ${actual[i]} / ${expected[i]}`);};
 const origin=browserChecks.browserUrl();
 const controller=await page.context().newPage();
 await controller.route('**/__assembly-locale-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Locale controller</title>'}));
 try{
  await controller.goto(new URL('/__assembly-locale-controller',origin).href);
  const locale=async(code:string)=>{await controller.evaluate(code=>localStorage.setItem('dd-locale',code),code);await page.waitForFunction(code=>document.documentElement.lang===code,code);};
  await page.goto(new URL('/assemble/',origin).href);await page.waitForFunction(()=>window.anklePrototype?.state.ready&&window.anklePrototype.state.uiReady);
  await page.locator('#kit').waitFor({state:'visible'});await page.locator('#kit-parts .material-row').first().click();await page.locator('#inspection-screen').waitFor({state:'visible'});
  await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition);
  const before=await page.evaluate(()=>window.anklePrototype.state),material=await page.locator('#kit-parts [aria-pressed="true"] .ordinal').innerText();
  await page.evaluate(()=>{window._originalLocaleCanvas=document.querySelector<HTMLCanvasElement>('#canvas-host canvas')!;});
  await shot('01-material-inspection-zh');await locale('en');await shot('02-material-inspection-en');
  assert.doesNotMatch(await page.locator('.header-name').innerText(),/[\u3400-\u9fff]/);
  assert.doesNotMatch(await page.locator('#kit-title').innerText(),/[\u3400-\u9fff]/);
  assert.equal(await page.locator('#inspection-screen').isVisible(),true);
  assert.equal(await page.locator('#kit-parts [aria-pressed="true"] .ordinal').innerText(),material);
  const after=await page.evaluate(()=>window.anklePrototype.state);
  for(const key of ['step','stepId','chapter','progress','playing']as const)assert.equal(after[key],before[key],key);
  assert.deepEqual(after.actors,before.actors);sameVector(after.camera,before.camera,'camera');sameVector(after.target,before.target,'target');
  assert.equal(await page.evaluate(()=>window._originalLocaleCanvas===document.querySelector('#canvas-host canvas')),true);
  assert.equal(await page.locator('#overview > button').count(),1,'localization retains the native custom-element control');
  assert.equal(await page.locator('#phase-select > select option').count(),14,'localization retains all native chapter options');
  await page.locator('.inspection-return').click();await page.locator('#kit-go').click();await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition);
  await page.locator('#pause').click();await page.locator('#desk-toggle').click();await page.waitForFunction(()=>!window.anklePrototype.state.cameraTransition);await page.locator('#reference-toggle').click();await page.locator('#sound-controls summary').click();
  const fixed=await page.evaluate(()=>({state:window.anklePrototype.state,sound:window.anklePrototype.sound,video:{currentTime:document.querySelector<HTMLVideoElement>('#reference-video')!.currentTime,paused:document.querySelector<HTMLVideoElement>('#reference-video')!.paused}}));
  await page.locator('#reference-video').evaluate(value=>{const video=value as HTMLVideoElement,time=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'currentTime')!;for(const name of ['pause','play','seek'])video.dataset[name+'Calls']='0';video.pause=new Proxy(video.pause,{apply(target,receiver,args){video.dataset.pauseCalls=String(Number(video.dataset.pauseCalls)+1);return Reflect.apply(target,receiver,args);}});video.play=new Proxy(video.play,{apply(target,receiver,args){video.dataset.playCalls=String(Number(video.dataset.playCalls)+1);return Reflect.apply(target,receiver,args);}});Object.defineProperty(video,'currentTime',{configurable:true,get(){return time.get!.call(video);},set(value:number){video.dataset.seekCalls=String(Number(video.dataset.seekCalls)+1);time.set!.call(video,value);}});});
  const writeCount=writes.length;
  for(const code of ['zh-Hant','ja','ko','fr','de','es','pt-BR','ru','ar','hi','en']){
   await locale(code);if(['fr','ar'].includes(code))await shot('03-reference-sound-'+code);assert.equal(await page.locator('#reference-panel').isVisible(),true);assert.equal(await page.locator('#sound-controls').evaluate(el=>el.hasAttribute('open')),true);
   const state=await page.evaluate(()=>window.anklePrototype.state);assert.equal(state.step,fixed.state.step);assert.equal(state.progress,fixed.state.progress);assert.equal(state.playing,fixed.state.playing);assert.equal(state.chapter,fixed.state.chapter);sameVector(state.camera,fixed.state.camera,code+' camera');sameVector(state.target,fixed.state.target,code+' target');assert.deepEqual(state.actors,fixed.state.actors);
   const sound=await page.evaluate(()=>window.anklePrototype.sound);for(const key of ['enabled','effects','volume','track','referenceAudio']as const)assert.equal(sound[key],fixed.sound[key],`${code}: ${key}`);
  }
  assert.equal(writes.length,writeCount,'locale changes send no device or data writes');assert.deepEqual(await page.locator('#reference-video').evaluate(video=>['pause','play','seek'].map(name=>(video as HTMLElement).dataset[name+'Calls'])),['0','0','0'],'locale changes never pause, restart, or seek reference video');
  await page.locator('#sound-close').click();await page.locator('#instruction-toggle').click();
  for(const code of ['zh-Hans','zh-Hant','ja','ko','fr','de','es','pt-BR','ru','ar','hi','en']){await locale(code);assert.equal(await page.locator('#instruction-dialog').evaluate(el=>el.hasAttribute('open')),true,code+' instruction dialog');assert.equal(await page.locator('#reference-panel').isVisible(),true,code+' reference');if(['fr','ar'].includes(code))await shot('04-instruction-dialog-'+code);}
  await page.locator('#instruction-close').click();await page.locator('#reference-close').click();await shot('05-default-en');
  await locale('de');await shot('06-default-de');await page.setViewportSize({width:390,height:844});await locale('ar');await shot('07-narrow-ar');
  assert.deepEqual(errors,[]);
  return {passed:true,locales:12,scope:'Assembly display and in-place state; native chapter menu and human visual acceptance are separate'};
 }catch(error){await shot('failure');throw error;}finally{await controller.close();}
}
