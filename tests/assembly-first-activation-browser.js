// Capture a bounded cold first-activation trace. Isolated personal service only.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
const base=process.env.DUCK_BROWSER_URL||'http://127.0.0.1:8904';
const out=path.resolve(process.env.OUTPUT_DIR||'output/optimization-assets/first-activation');await fs.mkdir(out,{recursive:true});
const rounds=Number(process.env.ROUNDS||12),results=[];
for(let round=0;round<rounds;round++){
 const browser=await chromium.launch({headless:false,args:[...(process.env.COLD_GPU==='1'?['--disable-gpu-shader-disk-cache']:[]),...(process.env.DAWN_COLD==='1'?['--enable-dawn-features=disable_blob_cache']:[]),...(process.env.DAWN_TOGGLE?['--enable-dawn-features='+process.env.DAWN_TOGGLE]:[])]});let context,trace;
 const result={round,mode:process.env.MODE||'navigate',errors:[]};
 try{
  const system=await browser.newBrowserCDPSession();result.graphite=(await system.send('SystemInfo.getInfo')).gpu.featureStatus.skia_graphite;
 if(process.env.ASSERT_PAINT_READY==='1')assert.ok(result.graphite?.startsWith('enabled'),'this raster regression requires a Graphite-enabled managed Chromium');
  context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
  await context.addInitScript(()=>{
   window.activationSpans=[];
   const log=(name,start,detail={})=>activationSpans.push({name,at:performance.timeOrigin+start,ms:performance.now()-start,...detail});
   new PerformanceObserver(list=>{for(const e of list.getEntries())activationSpans.push({name:'longtask',at:performance.timeOrigin+e.startTime,ms:e.duration,attribution:e.attribution.map(a=>({name:a.containerName,src:a.containerSrc,type:a.containerType}))});}).observe({type:'longtask',buffered:true});
   const raf=window.requestAnimationFrame;
   window.requestAnimationFrame=callback=>{const scheduled=performance.now();return raf.call(window,time=>{const start=performance.now();try{return callback(time);}finally{if(performance.now()-start>3||start-scheduled>50)log('raf',start,{callback:callback.name,queueMs:start-scheduled});}});};
   for(const name of ['compileShader','linkProgram','getProgramParameter','getShaderParameter','drawElements','drawArrays','bufferData','texImage2D','readPixels','finish','flush']){
    const fn=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){const start=performance.now();try{return fn.apply(this,args);}finally{if(performance.now()-start>3)log('gl:'+name,start);}};
   }
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){const start=performance.now(),p=play.apply(this,args);log('media:play',start);p.then(()=>log('media:playing',start),e=>log('media:rejected',start,{error:e.name}));return p;};
  });
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));
  if(process.env.CONTROL_HIDDEN==='1')await page.addInitScript(()=>{if(parent!==window)return;new MutationObserver(()=>{if(!document.head||document.querySelector('#diagnostic-control-css'))return;const style=document.createElement('style');style.id='diagnostic-control-css';style.textContent='html[data-ready="true"] iframe[data-paint-warm="true"]{visibility:hidden!important}';document.head.append(style);}).observe(document,{subtree:true,childList:true});});
  await page.goto(base+'/');
  await page.waitForFunction(()=>document.querySelectorAll('iframe').length===3&&[...document.querySelectorAll('iframe')].every(f=>f.contentDocument?.documentElement?.dataset.pageReady),null,{timeout:60000});
  await page.waitForTimeout(Number(process.env.SETTLE_MS||800));

  await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe')){const w=f.contentWindow,fn=w.personalPage.setActive;w.personalPage.setActive=async(...args)=>{const start=w.performance.now();try{return await fn.apply(w.personalPage,args);}finally{w.activationSpans.push({name:'setActive',active:args[0],at:w.performance.timeOrigin+start,ms:w.performance.now()-start});}};}});
  trace=await browser.newBrowserCDPSession();
  await trace.send('Tracing.start',{categories:'toplevel,devtools.timeline,v8,blink,blink.user_timing,cc,gpu,viz,renderer.scheduler,disabled-by-default-devtools.timeline.frame'+((process.env.DEEP==='1'||process.env.ASSERT_PAINT_READY==='1')?',disabled-by-default-gpu.graphite.dawn,disabled-by-default-gpu.dawn,disabled-by-default-skia.gpu,disabled-by-default-skia.shaders':''),transferMode:'ReturnAsStream'});
  result.switches=[];
  for(const href of ['/paint','/','/assemble/','/'])result.switches.push(await page.evaluate(async href=>{const start=performance.now();performance.mark('activation:'+href+':start');await personalApp.navigate(href);const commit=performance.now();performance.mark('activation:'+href+':commit');await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));performance.mark('activation:'+href+':frames');return{href,at:performance.timeOrigin+start,commitMs:commit-start,frameMs:performance.now()-commit,ms:performance.now()-start};},href));
  result.frames=await page.evaluate(()=>[...document.querySelectorAll('iframe')].map(f=>({name:f.name,spans:f.contentWindow.activationSpans,resources:f.contentWindow.performance.getEntriesByType('resource').map(r=>({url:r.name,start:r.startTime,duration:r.duration}))})));
  const complete=new Promise(resolve=>trace.once('Tracing.tracingComplete',resolve));await trace.send('Tracing.end');const{stream}=await complete;
  let data='';for(;;){const chunk=await trace.send('IO.read',{handle:stream});data+=chunk.data;if(chunk.eof)break;}await trace.send('IO.close',{handle:stream});
  const events=JSON.parse(data).traceEvents,mark=events.find(e=>e.name==='activation:/assemble/:start');
  result.deferredStagePipelines=events.filter(e=>e.ph==='X'&&e.name==='createGraphicsPipeline'&&e.ts>=mark.ts&&e.ts<mark.ts+500000&&/CoverBoundsRenderStep.*RadialGradient4/.test(e.args?.desc||'')).map(e=>({ms:e.dur/1000,desc:e.args.desc}));
  result.maxMs=Math.max(...result.switches.map(x=>x.ms));
  assert.deepEqual(result.errors,[]);
  if(result.maxMs>100||process.env.KEEP_ALL==='1'||result.deferredStagePipelines.length){result.trace=`round-${round}.trace.json`;await fs.writeFile(path.join(out,result.trace),data);}
  if(process.env.ASSERT_PAINT_READY==='1')assert.equal(result.deferredStagePipelines.length,0,'the prewarmed guide must not create its full-stage gradient pipeline on first activation');
 }catch(e){result.failure=String(e.stack||e);}
 finally{await context?.close();await browser.close();}
 results.push(result);await fs.writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({round,maxMs:result.maxMs,switches:result.switches,failure:result.failure,trace:result.trace}));
 if(result.failure)break;
}

if(results.some(r=>r.failure))process.exitCode=1;
