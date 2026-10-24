// Local diagnostic harness: no product tracing hooks. Use only on an isolated personal server.
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:false});
const result={label:process.env.METRIC_LABEL,runs:[]};
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8904';
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
 try{
 await context.addInitScript(()=>{
  window.spans=[];
  const record=(name,start,detail={})=>spans.push({name,at:performance.timeOrigin+start,ms:performance.now()-start,...detail});
  const observer=new PerformanceObserver(list=>{for(const e of list.getEntries())spans.push({name:'longtask',at:performance.timeOrigin+e.startTime,ms:e.duration});});observer.observe({type:'longtask',buffered:true});
  for(const name of ['compileShader','linkProgram','getProgramParameter','getShaderParameter','drawElements','drawArrays','bufferData','texImage2D']){
   const original=WebGL2RenderingContext.prototype[name];
   WebGL2RenderingContext.prototype[name]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{if(performance.now()-start>3)record('gl:'+name,start);}};
  }
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){const start=performance.now(),value=play.apply(this,args);record('media:play-sync',start);value?.then(()=>record('media:play-resolved',start),()=>record('media:play-rejected',start));return value;};
  const src=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');
  Object.defineProperty(HTMLMediaElement.prototype,'src',{...src,set(value){const start=performance.now();try{return src.set.call(this,value);}finally{record('media:src',start);}}});
  window.addEventListener('personal:appearance',()=>{spans.push({name:'appearance',at:performance.timeOrigin+performance.now(),ms:0});});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 for(const kind of ['cold','hot']){
  await page.goto(base+'/');await page.waitForFunction(()=>document.documentElement.dataset.page==='home');const homeMs=await page.evaluate(()=>performance.now());
  await page.waitForFunction(()=>document.querySelectorAll('iframe').length===3&&[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement?.dataset.pageReady),null,{timeout:60000});
  const readyMs=await page.evaluate(()=>performance.now());
  await page.waitForTimeout(Number(process.env.SETTLE_MS||800));
  const prep=await page.evaluate(()=>{
   const frames=[...document.querySelectorAll('iframe')];
   for(const frame of frames){const w=frame.contentWindow,fn=w.personalPage.setActive;w.personalPage.setActive=async(...args)=>{const start=w.performance.now();try{return await fn.apply(w.personalPage,args);}finally{w.spans.push({name:'setActive',active:args[0],at:w.performance.timeOrigin+start,ms:w.performance.now()-start});}};}
   return frames.map(f=>({key:f.name,userActivation:f.contentWindow.navigator.userActivation.hasBeenActive,spans:f.contentWindow.spans.slice(),resources:f.contentWindow.performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,duration:r.duration,start:r.startTime,transfer:r.transferSize,server:r.serverTiming.map(s=>({name:s.name,duration:s.duration}))}))}));
  });
  const switches=[];
  for(const path of ['/paint','/','/assemble/','/','/assemble/','/'])switches.push(await page.evaluate(async path=>{
   const start=performance.now();await personalApp.navigate(path);const committed=performance.now();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   return{path,at:performance.timeOrigin+start,commitMs:committed-start,frameMs:performance.now()-committed,ms:performance.now()-start};
  },path));
  const after=await page.evaluate(()=>[...document.querySelectorAll('iframe')].map(f=>({key:f.name,spans:f.contentWindow.spans,resources:f.contentWindow.performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.mp3')).map(r=>({name:r.name,start:r.startTime,duration:r.duration}))})));
  result.runs.push({kind,homeMs,readyMs,prep,switches,after});
 }
 result.errors=errors;
 }finally{await context.close();}
}finally{await browser.close();}
console.log(JSON.stringify(result,null,2));
