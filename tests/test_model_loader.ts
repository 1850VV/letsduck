import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModel} from '../frontend/shared/model-loader.js';
import {replaceProperty} from './fixtures/source-data.js';
import {FixtureWorker,FixtureWorkerError} from './fixtures/model-worker.js';

test('worker starts before pending model downloads and is closed on startup failure', async t=>{
  let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;}),workers:FixtureWorker[]=[];
  t.mock.method(globalThis,'fetch',async()=>{await gate;return new Response('',{status:503});});
  const restoreLocation=replaceProperty(globalThis,'location',{href:'http://loader-fixture.test/'});
  const restoreWorker=replaceProperty(globalThis,'Worker',class extends FixtureWorker{constructor(){super();workers.push(this);}});
  const loading=loadModel();loading.catch(()=>{});
  try {assert.equal(workers.length,1,'Worker script must overlap asset downloads');}
  finally {release();await assert.rejects(loading);restoreWorker();restoreLocation();}
  assert.equal(workers[0]!.closed,true);
});

test('an early worker error is retained until data arrives, then uses legacy fallback',async t=>{
  let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve;}),workers:FixtureWorker[]=[];
  t.mock.method(console,'warn',()=>{}); // Expected compatibility fallback.
  t.mock.method(globalThis,'fetch',async(url:RequestInfo|URL)=>{
    await gate;const name=String(url).split('/').pop();
    if(name==='model.json')return Response.json({source_sha256:'synthetic-model',parts:[],hardware:[]});
    if(name==='catalog')return Response.json({products:[]});
    return new Response(new ArrayBuffer(8),{status:name==='geometry.pack.bin'?404:200});
  });
  const restoreLocation=replaceProperty(globalThis,'location',{href:'http://loader-fixture.test/'});
  const restoreWorker=replaceProperty(globalThis,'Worker',class extends FixtureWorker{constructor(){super();workers.push(this);queueMicrotask(()=>this.onerror?.call(this,new FixtureWorkerError()));}});
  try{const loading=loadModel();await Promise.resolve();release();const data=await loading;assert.equal(data.geometry,null);assert.equal(data.binary!.byteLength,8);assert.equal(workers[0]!.closed,true);assert.equal(workers[0]!.posted,undefined);}
  finally{release();restoreWorker();restoreLocation();}
});
