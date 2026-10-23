import test from 'node:test';import assert from 'node:assert/strict';
const api=await import('../frontend/shared/render-policy.mjs').catch(e=>{if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;return {};});
test('demand loop coalesces invalidations, drains animation, and sleeps after settling',()=>{
 assert.equal(typeof api.demandLoop,'function');
 const queue=[];let frames=0,busy=true;
 const loop=api.demandLoop(()=>{frames++;return busy;},f=>queue.push(f));
 loop();loop();assert.equal(queue.length,1);queue.shift()();assert.equal(queue.length,1);
 busy=false;queue.shift()();assert.equal(frames,2);assert.equal(queue.length,0);
 loop();queue.shift()();assert.equal(frames,3);assert.equal(queue.length,0);
});
test('depth prepass requires repeatable GPU savings without CPU submission regression',()=>{
 assert.equal(typeof api.preferDepth,'function');
 const samples=(gpu,cpu)=>Array.from({length:12},()=>({gpu,cpu}));
 assert.equal(api.preferDepth(samples(10,2),samples(8,2.3)),true);
 assert.equal(api.preferDepth(samples(10,2),samples(9.9,2.3)),false);
 assert.equal(api.preferDepth(samples(10,2),samples(8,5)),false);
 assert.equal(api.preferDepth([],[]),false);
});
