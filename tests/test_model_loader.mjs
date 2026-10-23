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
  globalThis.Worker=class {constructor(){workers.push(this);this.posted=[];queueMicrotask(()=>this.onerror?.({preventDefault(){}}));}postMessage(m){this.posted.push(m.type);}terminate(){this.closed=true;}};
  // Only the download request precedes the error; nothing is sent after it.
  try{const loading=loadModel();await Promise.resolve();release();const data=await loading;assert.equal(data.geometry,null);assert.equal(data.binary.byteLength,8);assert.equal(workers[0].closed,true);assert.deepEqual(workers[0].posted,['fetch']);}
  finally{release();globalThis.Worker=old;}
});

const assetsOnly=model=>async url=>{const name=String(url).split('/').pop();return {ok:true,json:async()=>name==='model.json'?model:{products:[]},arrayBuffer:async()=>new ArrayBuffer(8)};};
// Replies like positions-worker.mjs once it has both the download request (or a page-started download) and the model.
function fakeWorker(started){
  return {posted:[],postMessage(m){this.posted.push(m);
    if((started||this.posted.some(x=>x.type==='fetch'))&&this.posted.some(x=>x.type==='model')&&!this.replied){this.replied=true;
      queueMicrotask(()=>{this.onmessage({data:{received:true}});this.onmessage({data:{meshes:[{kind:'part',id:'A'}],packed:new ArrayBuffer(3),stats:{receivedAt:performance.timeOrigin+1,bytes:3,busyMs:1}}});});}},
    terminate(){this.closed=true;}};
}

test('the Worker started by the page keeps its own download; the loader only adds the model',async t=>{
  const model={parts:[],hardware:[]},worker=fakeWorker(true);
  t.mock.method(globalThis,'fetch',assetsOnly(model));
  const old=globalThis.Worker;globalThis.Worker=class {constructor(){throw Error('must adopt the page Worker');}};
  globalThis.duckModelStart=worker;
  try{
    const data=await loadModel();
    assert.equal(globalThis.duckModelStart,undefined);
    assert.deepEqual(worker.posted.map(m=>m.type),['model']);assert.equal(worker.posted[0].model,model);
    assert.ok(!fetch.mock.calls.some(c=>String(c.arguments[0]).endsWith('geometry.positions.bin')),'the page does not download the pack');
    assert.deepEqual([...data.geometry.keys()],['part:A']);assert.equal(data.binary,null);assert.equal(worker.closed,true);
    assert.equal(performance.getEntriesByName('duck:positions-received')[0].detail.bytes,3);
  }finally{globalThis.Worker=old;delete globalThis.duckModelStart;performance.clearMarks();}
});

test('the source tree starts its own Worker and asks it to download the pack',async t=>{
  const model={parts:[],hardware:[]},workers=[];
  t.mock.method(globalThis,'fetch',assetsOnly(model));
  const old=globalThis.Worker;globalThis.Worker=class {constructor(){const w=fakeWorker(false);workers.push(w);return w;}};
  try{
    const data=await loadModel();
    assert.equal(workers.length,1);
    assert.equal(workers[0].posted[0].type,'fetch');assert.match(workers[0].posted[0].url,/\/assets\/geometry\.positions\.bin$/);
    assert.deepEqual([...data.geometry.keys()],['part:A']);
  }finally{globalThis.Worker=old;}
});

test('a page Worker that failed before adoption gets no messages and the legacy geometry loads',async t=>{
  t.mock.method(console,'warn',()=>{});
  t.mock.method(globalThis,'fetch',assetsOnly({parts:[],hardware:[]}));
  const worker={failed:true,postMessage(){this.posted=true;},terminate(){this.closed=true;}};
  globalThis.duckModelStart=worker;
  try{const data=await loadModel();assert.equal(worker.posted,undefined);assert.equal(data.geometry,null);assert.ok(data.binary);assert.equal(worker.closed,true);}
  finally{delete globalThis.duckModelStart;}
});
