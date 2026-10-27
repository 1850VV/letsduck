import test from 'node:test';
import assert from 'node:assert/strict';
import {Quaternion} from '../../frontend/vendor/three.module.js';
import {STEPS,snapshot,ACTORS} from '../../frontend/assemble/hardware-state.js';
import {buildFineCues} from '../../frontend/assemble/fine-cues.js';
import {interpolatePose,actorQuaternion} from '../../frontend/assemble/render-pose.js';

test('unresolved hidden board mounts never become red/green fastening cues',()=>{
 const index=STEPS.findIndex(s=>s.id==='final-board-mount');
 assert.deepEqual(buildFineCues(index).filter(c=>c.type==='screw').map(c=>c.actorId),['f_boardScrew0','f_boardScrew1']);
 for(const p of [0,.5,1])for(const id of ['f_boardScrew2','f_boardScrew3'])assert.equal(snapshot(index,p)[id]!.visible,false);
});

test('backward interpolation preserves and smoothly rotates each new cable endpoint frame',()=>{
 const q0=[0,0,0,1],q1=[0,Math.sin(Math.PI/3),0,Math.cos(Math.PI/3)],actor={kind:'cable'};
 const a={position:[0,0,0],turn:0,opacity:1,visible:true,points:[[0,0,0],[1,1,1]],endpointQuaternions:[q0,q0]},b={...a,endpointQuaternions:[q1,q1]};
 for(const t of [0,.25,.5,.75,1]){
  const pose=interpolatePose(actor,a,b,t),expected=new Quaternion().fromArray(q0).slerp(new Quaternion().fromArray(q1),t);
  for(const q of pose.endpointQuaternions!)assert.ok(expected.angleTo(new Quaternion().fromArray(q))<1e-7,'endpoint frame jumps at '+t);
 }
});

test('real final-bus backward poses keep cable ends and visible plug rotations synchronized',()=>{
 const i=STEPS.findIndex(s=>s.id==='final-buses'),a=snapshot(i,1),b=snapshot(i-1,1);
 for(const t of [0,.2,.5,.8,1])for(let n=0;n<3;n++){
  const cable='f_bus'+n,plug='f_busPlug'+n,cp=interpolatePose(ACTORS[cable]!,a[cable]!,b[cable]!,t),pp=interpolatePose(ACTORS[plug]!,a[plug]!,b[plug]!,t);
  const endpoint=actorQuaternion(ACTORS[cable]!,cp).multiply(new Quaternion().fromArray(cp.endpointQuaternions![1]!));
  assert.ok(endpoint.angleTo(actorQuaternion(ACTORS[plug]!,pp))<1e-6,'bus '+n+' differs at '+t);
 }
});
