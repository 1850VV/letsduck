import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRenderScheduler} from '../../frontend/assemble/render-scheduler.js';

// A synthetic browser clock isolates scheduling; draw executes real consumer work.
function clock(){let id=0;const pending=new Map<number,FrameRequestCallback>();return{request:(fn:FrameRequestCallback)=>{pending.set(++id,fn);return id;},cancel:(id:number)=>pending.delete(id),tick(t:number){const work=[...pending.values()];pending.clear();for(const fn of work)fn(t);},get pending(){return pending.size;}};}
test('invalidations coalesce, static frames sleep, and animation keeps waking until settled',()=>{
 const c=clock(),drawn:number[]=[];let moving=false;
 const s=createRenderScheduler({requestFrame:c.request,cancelFrame:c.cancel,draw:t=>{drawn.push(t);return moving;}});
 s.invalidate();s.invalidate();c.tick(10);c.tick(20);assert.deepEqual(drawn,[10]);
 moving=true;s.invalidate();c.tick(30);c.tick(40);moving=false;c.tick(50);c.tick(60);assert.deepEqual(drawn,[10,30,40,50]);
 s.invalidate();c.tick(70);assert.deepEqual(drawn,[10,30,40,50,70]);
});
test('hidden pages cancel work, retain invalidation and redraw on activation',()=>{
 const c=clock(),drawn:number[]=[];const s=createRenderScheduler({requestFrame:c.request,cancelFrame:c.cancel,draw:t=>{drawn.push(t);return false;}});
 s.invalidate();s.setActive(false);c.tick(10);s.invalidate();c.tick(20);assert.deepEqual(drawn,[]);
 s.setActive(true);c.tick(30);c.tick(40);assert.deepEqual(drawn,[30]);assert.equal(c.pending,0);
});
test('an invalidation inside a frame is retained without duplicate frames',()=>{
 const c=clock();let draws=0;const s=createRenderScheduler({requestFrame:c.request,cancelFrame:c.cancel,draw:()=>{if(++draws===1)s.invalidate();return false;}});
 s.invalidate();c.tick(10);assert.equal(c.pending,1);c.tick(20);c.tick(30);assert.equal(draws,2);
});
