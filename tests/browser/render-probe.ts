import type {Page} from 'playwright';
import type * as THREE from '../../frontend/vendor/three.module.js';
interface Captured {renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera}
declare global {interface Window {__renderProbe:{capture:boolean;draws:number;captured:Captured|null;lastDepthEligible?:boolean};drawCount:number;draws:number;testSnapshot?:string}}
export async function installRenderProbe(page:Page):Promise<void>{
 await page.addInitScript(()=>{
  window.__renderProbe={capture:false,draws:0,captured:null};window.drawCount=0;window.draws=0;
  const elements=WebGL2RenderingContext.prototype.drawElements,arrays=WebGL2RenderingContext.prototype.drawArrays;
  WebGL2RenderingContext.prototype.drawElements=function(mode:number,count:number,type:number,offset:number){window.__renderProbe.draws++;window.drawCount++;window.draws++;if(window.__renderProbe.capture)debugger;return elements.call(this,mode,count,type,offset);};
  WebGL2RenderingContext.prototype.drawArrays=function(mode:number,first:number,count:number){window.__renderProbe.draws++;window.drawCount++;window.draws++;if(window.__renderProbe.capture)debugger;return arrays.call(this,mode,first,count);};
 });
}
// Capture only the actual production renderer. No minified source names are used.
export async function captureRenderer(page:Page,canvasSelector?:string):Promise<void>{
 const cdp=await page.context().newCDPSession(page);
 let settle:(error?:unknown)=>void=()=>{};
 const done=new Promise<void>((resolve,reject)=>{settle=error=>error?reject(error):resolve();});
 let pauses=0;const diagnostics:{name:string;value:unknown}[]=[];const timer=setTimeout(()=>settle(Error('Production renderer was not captured '+JSON.stringify({pauses,diagnostics}))),10000);
 cdp.on('Debugger.paused',async event=>{
  try{
   pauses++;for(const frame of event.callFrames){
    const expression=canvasSelector?`this&&typeof this.getContext==='function'&&this.domElement===document.querySelector(${JSON.stringify(canvasSelector)})&&arguments[0]?.isScene===true&&arguments[1]?.isPerspectiveCamera===true`:`this&&typeof this.getContext==='function'&&this.domElement===window.studioProto.view.canvas&&arguments[0]?.isScene===true&&arguments[1]?.isPerspectiveCamera===true`;
    const candidate=await cdp.send('Debugger.evaluateOnCallFrame',{callFrameId:frame.callFrameId,expression,returnByValue:true,silent:true});
    if(pauses===1&&diagnostics.length<12){const info=await cdp.send('Debugger.evaluateOnCallFrame',{callFrameId:frame.callFrameId,expression:'JSON.stringify({kind:this?.constructor?.name,canvas:this?.domElement?.tagName,parent:this?.domElement?.parentElement?.id,context:typeof this?.getContext,args:typeof arguments==="object"?[arguments[0]?.type,arguments[1]?.type]:null})',returnByValue:true,silent:true});diagnostics.push({name:frame.functionName,value:info.result.value});}
    if(candidate.result.value!==true)continue;
    const stored=await cdp.send('Debugger.evaluateOnCallFrame',{callFrameId:frame.callFrameId,expression:'window.__renderProbe.captured={renderer:this,scene:arguments[0],camera:arguments[1]};window.__renderProbe.capture=false;true',returnByValue:true});
    if(stored.result.value!==true)throw Error('Production renderer capture failed');settle();return;
   }
  }catch(error){settle(error);}finally{await cdp.send('Debugger.resume').catch(()=>{});}
 });
 try{
  await cdp.send('Debugger.enable');await cdp.send('Debugger.setSkipAllPauses',{skip:false});
  await page.evaluate(()=>{window.__renderProbe.capture=true;if(window.studioProto)window.studioProto.view.invalidate();else window.dispatchEvent(new Event('resize'));});
  if(canvasSelector){const viewport=page.viewportSize();if(!viewport)throw Error('Renderer probe needs a task-owned viewport');await page.setViewportSize({width:viewport.width+1,height:viewport.height});await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));await page.setViewportSize(viewport);}
  await done;
 }finally{
  clearTimeout(timer);await page.evaluate(()=>window.__renderProbe.capture=false).catch(()=>{});
  await cdp.send('Debugger.setSkipAllPauses',{skip:true}).catch(()=>{});await cdp.send('Debugger.resume').catch(()=>{});await cdp.send('Debugger.disable').catch(()=>{});await cdp.detach();
 }
 // Neither debugger pause nor first material initialization contributes to timings.
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 await page.evaluate(selector=>{const capture=window.__renderProbe.captured;if(!capture||capture.renderer.domElement!==(selector?document.querySelector(selector):window.studioProto.view.canvas))throw Error('Captured renderer is not the production canvas');},canvasSelector);
}
