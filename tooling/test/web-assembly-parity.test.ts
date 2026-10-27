import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
// Frozen from independent d5c38e4fa890a4eca40d8857317ac463163b46c3
// frontend/assemble/hardware-state.mjs on macOS/Linux, all 111 steps × four poses.
const originalPortableFingerprint='c1df395ad72e025a59cd0a1fce7d0292ecd775c43ef18908cc9c6e1a46be538b';
function fingerprint(value:unknown):string{
 // Near gimbal lock, Euler asin amplifies a 2.22e-16 matrix difference to
 // 1.09e-8 rad in the independent old MJS. Both OSes agree at 1e-7 mm/rad.
 // Array/key order, identifiers, labels, booleans and enums remain exact.
 const serialized=JSON.stringify(value,(_key:string,item:unknown)=>{
  if(typeof item!=='number')return item;
  assert.ok(Number.isFinite(item),'Assembly values must be finite');
  return Number(item.toFixed(7));
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

test('assembly fingerprint tolerates measured trigonometric noise and detects tiny motion, order and enum changes',()=>{
 // Actual independent d5c old MJS values: macOS arm64 and Linux x64.
 const mac={rotation:[0,-1.5707963118937354,0],endpointQuaternions:[[0,-0.7071067759181914,0,0.7071067864549037]]};
 const linux={rotation:[0,-1.5707963009853283,0],endpointQuaternions:[[0,-0.7071067720614871,0,0.7071067903116078]]};
 assert.equal(fingerprint(mac),fingerprint(linux));
 assert.notEqual(fingerprint({...mac,rotation:[0,-1.5707963118937354+1e-6,0]}),fingerprint(mac));
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
