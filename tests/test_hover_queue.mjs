import test from 'node:test';import assert from 'node:assert/strict';
const api=await import('../frontend/shared/hover-queue.mjs').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return {};});
const tick=()=>new Promise(r=>setImmediate(r));
test('hover coalesces work and ignores completed reads for older pointer positions',async()=>{
 assert.equal(typeof api.hoverQueue,'function');
 const pending=[],applied=[];
 const queue=api.hoverQueue(value=>new Promise(resolve=>pending.push({value,resolve})),(id,value)=>applied.push([id,value]));
 queue.submit(1);queue.submit(2);queue.submit(3);assert.equal(pending.length,1);
 pending.shift().resolve('old');await tick();assert.deepEqual(applied,[]);assert.equal(pending[0].value,3);
 pending.shift().resolve('new');await tick();assert.deepEqual(applied,[['new',3]]);
 queue.submit(4);queue.cancel();pending.shift().resolve('late');await tick();assert.equal(applied.length,1);
 queue.submit(5);pending.shift().resolve(null);await tick();assert.deepEqual(applied.at(-1),[null,5]);
});
