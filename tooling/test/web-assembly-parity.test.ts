import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
test('assembly state and all browsing poses preserve the original data',async()=>{
 const state=await import('../../frontend/assemble/hardware-state.js').catch(()=>undefined);
 assert.ok(state,'Strict TypeScript assembly modules are missing');
 const {ACTORS,STEPS,CHAPTERS,snapshot}=state;
 const values={ACTORS,STEPS,CHAPTERS,snapshots:STEPS.map((_:unknown,i:number)=>[0,.2,.5,1].map(p=>snapshot(i,p)))};
 assert.equal(createHash('sha256').update(JSON.stringify(values)).digest('hex'),'152a5b0373feb62f6704bf78bc90938fd59005ee21f5f27e6e741bd24bcd1f11');
});
