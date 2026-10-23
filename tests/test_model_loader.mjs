import test from 'node:test';
import assert from 'node:assert/strict';
import {loadModel} from '../frontend/shared/model-loader.mjs';

test('worker starts before pending model downloads and is closed on startup failure', async t=>{
  let release;const gate=new Promise(r=>release=r),workers=[];
  t.mock.method(globalThis,'fetch',async()=>{await gate;return {ok:false,status:503};});
  const old=globalThis.Worker;
  globalThis.Worker=class {constructor(){workers.push(this);}terminate(){this.closed=true;}};
  const loading=loadModel();loading.catch(()=>{});
  try {assert.equal(workers.length,1,'Worker script must overlap asset downloads');}
  finally {release();await assert.rejects(loading);globalThis.Worker=old;}
  assert.equal(workers[0].closed,true);
});

test('an early worker error is retained until data arrives, then uses legacy fallback',async t=>{
  let release;const gate=new Promise(r=>release=r),workers=[];
  t.mock.method(console,'warn',()=>{}); // Expected compatibility fallback.
  t.mock.method(globalThis,'fetch',async url=>{
    await gate;const name=String(url).split('/').pop();
    return {ok:name!=='geometry.pack.bin',status:404,json:async()=>({}),arrayBuffer:async()=>new ArrayBuffer(8)};
  });
  const old=globalThis.Worker;
  globalThis.Worker=class {constructor(){workers.push(this);queueMicrotask(()=>this.onerror?.({preventDefault(){}}));}postMessage(){this.posted=true;}terminate(){this.closed=true;}};
  try{const loading=loadModel();await Promise.resolve();release();const data=await loading;assert.equal(data.geometry,null);assert.equal(data.binary.byteLength,8);assert.equal(workers[0].closed,true);assert.equal(workers[0].posted,undefined);}
  finally{release();globalThis.Worker=old;}
});
