import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {writeSyntheticAssets} from './synthetic-assets.js';
import {homeSignatures} from './baseline-probe.js';
import {assertSameInputs,acceptVisualSample,statistics,pauseDecision,createStaticBridge,validateCounts,isolatedEnvironment} from './baseline-comparison.js';

const inputs={frontend:'front',assets:'assets',seed:'seed',request:'request',chromium:'browser',renderer:'gpu',viewport:'1440x900@1'};
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
