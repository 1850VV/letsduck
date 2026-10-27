import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Frozen from independent d5c38e4fa890a4eca40d8857317ac463163b46c3
// frontend/assemble/hardware-state.mjs, at all 111 steps and four progress values.
const originalPortableFingerprint='6152562e860561ca6470b57b88b34b16b3f537909d251eb0ceecaa90c02ad01e';
function fingerprint(value:unknown):string{
 // 1e-9 mm/radian quantum: ignore binary tails, retain sub-micron motion.
 // Array/key order, identifiers, labels, booleans and enums remain exact.
 const serialized=JSON.stringify(value,(_key:string,item:unknown)=>{
  if(typeof item!=='number')return item;
  assert.ok(Number.isFinite(item),'Assembly values must be finite');
  return Number(item.toFixed(9));
 });
 assert.ok(typeof serialized==='string');
 return createHash('sha256').update(serialized).digest('hex');
}
test('assembly state and all browsing poses preserve the original data',async()=>{
 const state=await import('../../frontend/assemble/hardware-state.js').catch(()=>undefined);
 assert.ok(state,'Strict TypeScript assembly modules are missing');
 const {ACTORS,STEPS,CHAPTERS,snapshot}=state;
 const values={ACTORS,STEPS,CHAPTERS,snapshots:STEPS.map((_:unknown,i:number)=>[0,.2,.5,1].map(p=>snapshot(i,p)))};
 assert.equal(STEPS.length,111);
 assert.equal(Object.keys(ACTORS).length,275);
 assert.equal(values.snapshots.flat().length,444);
 assert.equal(fingerprint(values),originalPortableFingerprint);
});

test('assembly fingerprint ignores only numeric tail noise and detects tiny motion, order and enum changes',()=>{
 const pose={actorId:'r_hip',position:[1.234567891234,-2.345678912345,0],steps:['prepare','install'],visible:true,status:'ready'};
 assert.equal(fingerprint({...pose,position:[1.234567891234+1e-13,-2.345678912345,0]}),fingerprint(pose));
 for(const changed of [
  {...pose,position:[1.234567891234+1e-7,-2.345678912345,0]},
  {...pose,actorId:'l_hip'},
  {...pose,steps:['install','prepare']},
  {...pose,visible:false},
  {...pose,status:'waiting'},
  {...pose,position:[1.234567891234,-2.345678912345]},
 ])assert.notEqual(fingerprint(changed),fingerprint(pose));
 assert.throws(()=>fingerprint({position:[Infinity]}),/finite/);
});
