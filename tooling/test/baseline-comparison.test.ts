import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {writeSyntheticAssets} from './synthetic-assets.js';
import vm from 'node:vm';
import {homeSignatures,installVisualProbe,bufferKey,type ProbeState} from './baseline-probe.js';
import {assertSameInputs,acceptVisualSample,statistics,pauseDecision,createStaticBridge,validateCounts,isolatedEnvironment,captureComparison,performanceThresholds} from './baseline-comparison.js';

const inputs={frontend:'front',assets:'assets',seed:'seed',request:'request',chromium:'browser',renderer:'gpu',viewport:'1440x900@1'};
test('successful comparison/pilot evidence rejects failed, cancellable and cross-mode reuse before acquisition',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'duck-compare-reuse-'));
 try{for(const[previous,pilot]of [['comparison.json',false],['comparison.json',true],['pilot.json',false],['pilot.json',true]] as const){
  const output=join(temporary,previous+'-'+pilot);await mkdir(output);const old='{"cleanup":true,"sampleBudgetsComplete":true,"previous":true}';await writeFile(join(output,previous),old);
  await assert.rejects(captureComparison({repository:temporary,assets:join(temporary,'missing'),frontend:join(temporary,'missing'),output,python:process.execPath,revision:'preparation-fails-if-reached',rounds:3,saveSamples:30,exportSamples:10,pilot}),/output.*empty/i);assert.equal(await readFile(join(output,previous),'utf8'),old);
  const child=spawn(process.execPath,['--import','tsx','tooling/test/baseline-comparison.cli.ts','--python',process.execPath,'--revision','would-have-been-cancelled','--output',output,...(pilot?['--pilot']:[])],{cwd:resolve(import.meta.dirname,'../..'),stdio:['ignore','pipe','pipe','ipc']});let started=false,error='';child.stderr?.on('data',data=>error+=String(data));child.on('message',()=>{started=true;child.kill('SIGTERM');});const[code]=await once(child,'exit');assert.notEqual(code,0);assert.equal(started,false,'reuse must be refused before a cancellable acquisition');assert.match(error,/output.*empty/i);assert.equal(await readFile(join(output,previous),'utf8'),old);
 }}finally{await rm(temporary,{recursive:true,force:true});}
});
test('startup uses the same median10/p9520 policy and remains an explicit pause item',()=>{
 const trials=['python','node'].flatMap(engine=>[0,1,2].map(i=>({engine,startup:engine==='python'?230+i:313+i,home:100,paint:100,homeModel:100,paintModel:100,homeInterval:[8,9],paintInterval:[8,9],save:[1,2],export:[30,31]})));
 const summary=performanceThresholds(trials);assert.equal(summary.threshold.startup.python.n,3);assert.equal(summary.threshold.startup.pause,true);assert.ok(summary.threshold.startup.medianPercent>35);assert.equal(summary.timingPause,true);assert.deepEqual(summary.pauseItems,['startup']);assert.equal(Object.keys(summary.threshold).length,9);
});
async function injectedProbe(lineup=false){
 let source='',now=100,observed:ProbeState|undefined;
 await installVisualProbe({async addInitScript(script){source=script.content;}},{selector:'#model',copies:1,lineup,models:[{key:bufferKey(new Float32Array([1,2,3]))+'/'+bufferKey(new Uint16Array([0,1,2])),ids:['part']}]});
 const queued:((time:number)=>void)[]=[],listeners=new Map<string,{capture:boolean;callback:(event:PointerData)=>void}[]>();
 interface PointerData{isTrusted:boolean;target:Canvas;button:number;buttons:number;isPrimary:boolean;pointerId:number;clientX:number;clientY:number}
 class BufferObject{}class Vao{}class Program{}class Uniform{}
 const stage={classList:{contains:()=>dragging},dataset:{settled:'true'}},labels=[0,1,2].map(id=>({dataset:{duck:String(id)},style:{opacity:'0',zIndex:'0'}})),groups=[0,1,2,3].map(()=>({visible:true,scale:{x:1},children:[{rotation:{y:0}}]}));let dragging=false;
 class Canvas{style={cursor:'grab'};matches(){return true;}closest(){return stage;}getContext(){return gl;}}
 class GL{canvas=new Canvas();ARRAY_BUFFER=1;ELEMENT_ARRAY_BUFFER=2;FRAMEBUFFER=3;DRAW_FRAMEBUFFER=4;RGBA=5;UNSIGNED_BYTE=6;NO_ERROR=0;RENDERER=7;drawingBufferWidth=8;drawingBufferHeight=8;
  bindVertexArray(..._args:unknown[]){}bindBuffer(..._args:unknown[]){}bufferData(..._args:unknown[]){}vertexAttribPointer(..._args:unknown[]){}useProgram(..._args:unknown[]){}bindFramebuffer(..._args:unknown[]){}uniformMatrix4fv(..._args:unknown[]){}drawElements(){}getUniformLocation(..._args:unknown[]){return new Uniform();}getAttribLocation(){return 0;}getExtension(){return null;}getParameter(){return'synthetic';}getError(){return 0;}readPixels(_x:number,_y:number,_w:number,_h:number,_f:number,_t:number,pixels:Uint8Array){pixels.fill(255);}}
 const gl=new GL(),world={window:undefined as unknown,get __baselineVisual(){return observed;},set __baselineVisual(value:ProbeState|undefined){observed=value;},console,WebGL2RenderingContext:GL,HTMLCanvasElement:Canvas,Element:Canvas,WebGLBuffer:BufferObject,WebGLVertexArrayObject:Vao,WebGLProgram:Program,WebGLUniformLocation:Uniform,WebGLFramebuffer:class{},performance:{now:()=>now},studioProto:{state:{step:1},view:{stage:{layer:{children:groups}}}},document:{querySelector:(selector:string)=>selector==='.duck-stage'?stage:gl.canvas,querySelectorAll:()=>labels,addEventListener:(type:string,callback:(event:PointerData)=>void,capture=false)=>{listeners.set(type,[...(listeners.get(type)??[]),{capture,callback}]);}},requestAnimationFrame:(callback:(time:number)=>void)=>queued.push(callback)};world.window=world;vm.runInNewContext(source,world);
 gl.canvas.getContext();gl.bindVertexArray(new Vao());gl.bindBuffer(gl.ARRAY_BUFFER,new BufferObject());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([1,2,3]));gl.vertexAttribPointer(0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,new BufferObject());gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2]));gl.useProgram(new Program());const location=gl.getUniformLocation(null,'modelViewMatrix');
 const state=()=>{assert.ok(observed);return observed;};const frame=(transform:number,time:number)=>{now=time;world.requestAnimationFrame(()=>{gl.uniformMatrix4fv(location,false,new Float32Array([transform]));gl.drawElements();});const callback=queued.shift();assert.ok(callback);callback(time);};
 const pointer=(type:string,x:number,time:number,business:()=>void=()=>{},trusted=true)=>{now=time;const event={isTrusted:trusted,target:gl.canvas,button:0,buttons:1,isPrimary:true,pointerId:1,clientX:x,clientY:0};for(const listener of listeners.get(type)??[])if(listener.capture)listener.callback(event);business();for(const listener of listeners.get(type)??[])if(!listener.capture)listener.callback(event);};
 const homeAck=()=>{dragging=true;stage.dataset.settled='false';for(const label of labels)label.style.opacity=String(Number(label.style.opacity)+1);};
 frame(1,100);state().sampling=true;return{state,frame,pointer,homeAck,gl,groups};
}
test('actual injected probe rejects entrance animation after trusted down without business movement',async()=>{const p=await injectedProbe();p.pointer('pointerdown',0,150);p.frame(2,200);assert.equal(p.state().usableMs,-1);assert.equal(p.state().interactionChanged,false);});
test('actual injected probe rejects trusted movement with no business acknowledgement',async()=>{const p=await injectedProbe();p.pointer('pointerdown',0,150);p.pointer('pointermove',20,170);p.frame(2,200);assert.equal(p.state().usableMs,-1);});
test('actual injected probe compares immediate pre-input GPU state, not the first entrance frame',async()=>{const p=await injectedProbe();p.frame(2,140);p.pointer('pointerdown',0,150);p.pointer('pointermove',20,170,p.homeAck);p.frame(2,200);assert.equal(p.state().usableMs,-1);});
test('actual injected lineup probe rejects hover-only and acknowledged-but-ineffective motion',async()=>{for(const hover of [false,true]){const p=await injectedProbe(true);p.pointer('pointerdown',0,150);p.pointer('pointermove',20,170,()=>{p.gl.canvas.style.cursor='grabbing';});if(hover)p.groups[0]!.children[0]!.rotation.y=.3;p.frame(2,200);assert.equal(p.state().usableMs,-1);}});
test('actual injected home timestamp starts at the first causally acknowledged complete frame',async()=>{const p=await injectedProbe();p.pointer('pointerdown',0,150);p.frame(2,160);assert.equal(p.state().usableMs,-1);p.pointer('pointermove',20,170,p.homeAck);p.frame(3,200);assert.equal(p.state().usableMs,200);assert.equal(p.state().interactionChanged,true);});
test('actual injected lineup requires common signed yaw response and a changed GPU frame',async()=>{const p=await injectedProbe(true);p.pointer('pointerdown',0,150);p.pointer('pointermove',20,170,()=>{p.gl.canvas.style.cursor='grabbing';});for(const group of p.groups)group.children[0]!.rotation.y=.1;p.frame(2,200);assert.equal(p.state().usableMs,200);});
test('home calibration requires every expected part and bounded real position/index slices',()=>{
 const bytes=new Uint8Array(96);bytes.set(new Uint8Array(new Float32Array([0,0,0,1,0,0,0,1,0,2,0,0,3,0,0,2,1,0]).buffer));bytes.set(new Uint8Array(new Uint32Array([0,1,2,0,1,2]).buffer),72);
 const parts=[{id:'body',positionOffset:0,indexOffset:72,vertexCount:3,indexCount:3},{id:'head',positionOffset:36,indexOffset:84,vertexCount:3,indexCount:3}];assert.equal(homeSignatures(parts,bytes,['body','head']).length,2);assert.throws(()=>homeSignatures(parts,bytes,['body','missing']));assert.throws(()=>homeSignatures([{...parts[0]!,indexOffset:1000}],bytes,['body']));
});
test('both child engines get OS necessities and explicit owned paths without ambient preload/proxy/database flags',()=>{
 const env=isolatedEnvironment({DUCK_ADB:'/owned/fake',DUCK_PERSONAL_DB:'/owned/test.db'},{PATH:'/os/bin',HOME:'/os/home',TMPDIR:'/os/tmp',NODE_OPTIONS:'unsafe preload',HTTP_PROXY:'ambient proxy',DUCK_DATABASE_URL:'ambient db',DUCK_UNKNOWN_SWITCH:'1'});
 assert.deepEqual(env,{PATH:'/os/bin',HOME:'/os/home',TMPDIR:'/os/tmp',DUCK_ADB:'/owned/fake',DUCK_PERSONAL_DB:'/owned/test.db'});
});
test('historical preparation failure removes owned inputs and cannot write a successful comparison',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'duck-compare-failed-')),assets=join(temporary,'assets'),frontend=join(temporary,'frontend'),output=join(temporary,'evidence'),root=resolve(import.meta.dirname,'../..');let owned:string|undefined;
 await mkdir(assets);await mkdir(frontend);await writeFile(join(frontend,'home.html'),'synthetic');writeSyntheticAssets(assets);
 const child=spawn(process.execPath,['--import','tsx','tooling/test/baseline-comparison.cli.ts','--revision','not-an-existing-comparison-revision','--python',process.execPath,'--repository',root,'--assets',assets,'--frontend',frontend,'--output',output],{cwd:root,stdio:['ignore','pipe','pipe','ipc']});
 child.on('message',(value:unknown)=>{if(value&&typeof value==='object'&&'status'in value&&value.status==='comparison_preparing'&&'temporaryDirectory'in value&&typeof value.temporaryDirectory==='string')owned=value.temporaryDirectory;});
 try{const[code]=await once(child,'exit');assert.notEqual(code,0);assert.ok(owned);assert.equal(existsSync(owned),false);assert.equal(existsSync(join(output,'comparison.json')),false);}finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await once(child,'exit');}if(owned)await rm(owned,{recursive:true,force:true});await rm(temporary,{recursive:true,force:true});}
});
test('incomplete sample budgets, NaN and fractional rounds cannot produce acceptance receipts',()=>{
 assert.doesNotThrow(()=>validateCounts(3,30,10));
 for(const counts of [[2,30,10],[3,29,10],[3,30,9],[NaN,30,10],[3.5,30,10],[Infinity,30,10]])assert.throws(()=>validateCounts(counts[0]!,counts[1]!,counts[2]!));
});
test('comparison rejects different frontend, assets, database seed and input before accepting timings',()=>{
 assert.doesNotThrow(()=>assertSameInputs(inputs,{...inputs}));
 for(const key of Object.keys(inputs))assert.throws(()=>assertSameInputs(inputs,{...inputs,[key]:'changed'}),new RegExp(key));
});

test('one static origin serves identical frontend bytes and preserves proxy Host/Origin for both engines',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'duck-compare-static-')),frontend=join(temporary,'frontend'),assets=join(temporary,'assets');
 const backend=createServer((request,response)=>response.end(JSON.stringify({host:request.headers.host,origin:request.headers.origin,path:request.url})));
 let bridge:Awaited<ReturnType<typeof createStaticBridge>>|undefined;
 try{
  await mkdir(frontend);await mkdir(assets);await writeFile(join(frontend,'home.html'),'same built home');await writeFile(join(frontend,'index.html'),'same built paint');
  await new Promise<void>(resolve=>backend.listen(0,'127.0.0.1',resolve));const address=backend.address();assert.ok(address&&typeof address!=='string');
  bridge=await createStaticBridge({frontend,assets,assembly:[]});bridge.backend('http://127.0.0.1:'+address.port);
  assert.equal(await(await fetch(bridge.url+'/')).text(),'same built home');assert.equal(await(await fetch(bridge.url+'/paint')).text(),'same built paint');
  const reply=await(await fetch(bridge.url+'/api/health',{headers:{origin:bridge.url}})).json();assert.deepEqual(reply,{host:new URL(bridge.url).host,origin:bridge.url,path:'/api/health'});
  assert.equal((await fetch(bridge.url+'/api/duck-debug/status')).status,503);
  assert.equal((await fetch(bridge.url+'/assets/source.3mf')).status,404);
 }finally{await bridge?.close();await new Promise<void>((resolve,reject)=>backend.close(error=>error?reject(error):resolve()));await rm(temporary,{recursive:true,force:true});}
});
test('ready markers and a single drawn part cannot stand in for the complete interactive model',()=>{
 const valid={completed:true,expected:['body','head'],drawn:['body','head'],firstModelMs:100,usableMs:150,opaquePixels:80,interactionChanged:true,frameTimes:[100,116,132,148],errors:[]};
 assert.doesNotThrow(()=>acceptVisualSample(valid));
 for(const patch of [{drawn:[]},{drawn:['head']},{opaquePixels:0},{interactionChanged:false},{completed:false},{errors:['failed']},{frameTimes:[]},{usableMs:NaN}])assert.throws(()=>acceptVisualSample({...valid,...patch}));
});
test('statistics retain actual sample counts and apply median10/p9520 pause lines',()=>{
 assert.deepEqual(statistics([1,2,3,4]),{n:4,median:2.5,p95:4,min:1,max:4});
 assert.throws(()=>statistics([]));
 assert.equal(pauseDecision({median:100,p95:100},{median:109,p95:119}).pause,false);
 assert.equal(pauseDecision({median:100,p95:100},{median:111,p95:100}).pause,true);
 assert.equal(pauseDecision({median:100,p95:100},{median:100,p95:121}).pause,true);
});
