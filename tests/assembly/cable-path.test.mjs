import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../frontend/vendor/three.module.js';
import {ACTORS,STEPS,snapshot} from '../../frontend/assemble/hardware-state.mjs';
import {buildCableCurve} from '../../frontend/assemble/cable-path.mjs';
import {actorQuaternion,interpolatePose} from '../../frontend/assemble/render-pose.mjs';
function curve(id,state){const pose=state[id],plugs=[0,1].map(end=>{const o=new THREE.Group();o.position.fromArray(pose.points[end?pose.points.length-1:0]);o.quaternion.fromArray(pose.endpointQuaternions[end]);return o;});const c=buildCableCurve({id,points:pose.points,plugs,lane:0,approved:ACTORS[id].cableType!=='power'&&ACTORS[id].cableType!=='usb-c',state}),matrix=new THREE.Matrix4().compose(new THREE.Vector3(...pose.position),actorQuaternion(ACTORS[id],pose),new THREE.Vector3(1,1,1));return Array.from({length:21},(_,i)=>c.getPointAt(i/20).applyMatrix4(matrix));}
test('rendered routing stays continuous across each adjacent assembly step',()=>{
 for(let i=1;i<STEPS.length-1;i++){const a=snapshot(i,1),b=snapshot(i+1,0);for(const[id,actor]of Object.entries(ACTORS)){if(actor.kind!=='cable'||!a[id].visible||!b[id].visible)continue;const before=curve(id,a),after=curve(id,b);for(let n=0;n<before.length;n++){assert.ok(before[n].toArray().every(Number.isFinite)&&after[n].toArray().every(Number.isFinite),id);assert.ok(before[n].distanceTo(after[n])<.001,`${STEPS[i].id} → ${STEPS[i+1].id}: ${id} jumps ${before[n].distanceTo(after[n])} mm`);}}}
});
test('reserved leads hand over to final buses without changing their visible route',()=>{
 const i=STEPS.findIndex(s=>s.id==='final-battery'),a=snapshot(i-1,1),b=snapshot(i,0);
 for(const[old,id]of [['t_baseWire','f_bus0'],['t_baseWireL','f_bus1'],['h_headLead','f_bus2']]){const before=curve(old,a),after=curve(id,b);before.forEach((p,n)=>assert.ok(p.distanceTo(after[n])<.001,`${old} → ${id}`));}
});
test('backward interpolation keeps cable routing progress continuous',()=>{
 const index=STEPS.findIndex(s=>s.id==='final-buses'),a=snapshot(index,1),b=snapshot(index-1,1);
 const mixed=Object.fromEntries(Object.keys(ACTORS).map(id=>[id,interpolatePose(ACTORS[id],a[id],b[id],0)]));
 const before=curve('f_bus2',a),start=curve('f_bus2',mixed);
 before.forEach((p,n)=>assert.ok(p.distanceTo(start[n])<.001,'backward route jumps at its first frame'));
});
test('the tidy-wires action visibly moves the rendered loop while both plug exits stay fixed',()=>{
 const index=STEPS.findIndex(s=>s.id==='final-route'),a=snapshot(index,0),b=snapshot(index,1);
 for(const id of['f_bus0','f_bus1','f_bus2']){const before=curve(id,a),after=curve(id,b);assert.ok(before[0].distanceTo(after[0])<.001&&before.at(-1).distanceTo(after.at(-1))<.001,id);assert.ok(Math.max(...before.map((p,n)=>p.distanceTo(after[n])))>2,`${id} tidy action disappeared`);}
});
