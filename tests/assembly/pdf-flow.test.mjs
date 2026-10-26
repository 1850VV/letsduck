import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../frontend/vendor/three.module.js';
import {actorQuaternion} from '../../frontend/assemble/render-pose.mjs';
import * as legacy from '../../frontend/assemble/hardware-state.mjs';
const flow=await import('../../frontend/assemble/pdf-state.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND'&&e.message.includes('/pdf-state.mjs'))return null;throw e;});
const ready=()=>assert.ok(flow?.snapshot,'PDF order must have its own absolute-state composer');
const at=id=>{ready();const n=flow.STEPS.findIndex(s=>s.id===id);assert.ok(n>=0,id);return n;};
const close=(a,b,label='')=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-6,`${label}: ${a} != ${b}`));

test('PDF pages are complete, base comes before legs, and stable action IDs remain unique',()=>{
  ready();assert.equal(new Set(flow.STEPS.map(s=>s.id)).size,flow.STEPS.length);
  assert.deepEqual(flow.CHAPTERS.filter(c=>c.pdfPage).map(c=>c.pdfPage),Array.from({length:25},(_,i)=>i+1));
  assert.ok(at('t-support')<at('r-pair'));assert.ok(at('final-thigh-second')<at('head-yaw-wire'));
  assert.ok(at('head-upper-pad-check')<at('head-neck-pair'));assert.ok(at('final-board-mount')<at('final-head-join'));
});

test('foot and head wires connect before mounting the relevant servo or bracket',()=>{
  assert.ok(at('r-wire-a')<at('r-shank'));assert.ok(at('l-wire-a')<at('l-shank'));
  assert.ok(at('head-yaw-wire')<at('head-yaw-motor'));
  assert.ok(at('head-core-horn-wire')<at('head-bearings'));assert.ok(at('head-core-horn-wire')<at('head-roll-motor'));
  const s=flow.snapshot(at('head-yaw-wire'),1);
  assert.equal(s.h_motor32.visible,true);assert.equal(s.h_motor32.status,'prepared');
  for(const id of ['h_pitchSupport','h_bearingCrown','h_yawScrew0'])assert.equal(s[id].visible,false,id);
});

test('starting the base never brings future head, feet or electronics into the assembly',()=>{
  const s=flow.snapshot(at('t-support'),1);assert.equal(s.t_support.visible,true);
  for(const id of ['foot','r_upperMotor','h_shell','h_motor32','f_uno','f_battery'])assert.equal(s[id].visible,false,id);
});

test('prepared servos stay uninstalled until their mounting action and the camera follows the relocated leg',()=>{
 const a=flow.snapshot(at('t-roll-pair'),1),b=flow.snapshot(at('t-motor-r'),1);
 assert.equal(a.t_motor11.status,'prepared');assert.equal(b.t_motor11.status,'installed');
 const step=flow.STEPS[at('r-pair')],source=legacy.STEPS.find(s=>s.id==='r-pair');
 close(step.target,source.target.map((v,i)=>v+[-95,0,65][i]),'staged leg camera');
});

test('the already mounted white leg linkage stays fixed while ID14 is attached',()=>{
  const n=at('r-shank'),before=flow.snapshot(n,0),after=flow.snapshot(n,1);
  close(before.shank.position,after.shank.position,'fixed linkage');
  assert.notDeepEqual(before.motor.position,after.motor.position,'move servo14 to the linkage');
});

test('the preconnected 13-14 cable stays on both real model sockets while ID14 moves',()=>{
  const n=at('r-shank');
  for(const p of [0,.25,.6,1]){
    const s=flow.snapshot(n,p),wire=s.wire;
    const world=point=>new THREE.Vector3(...point).applyQuaternion(actorQuaternion(flow.ACTORS.wire,wire)).add(new THREE.Vector3(...wire.position)).toArray();
    close(world(wire.points[0]),s.plug.position,'ID14 plug follows the servo');
    const motor=s.r_lowerMotor,ports=flow.ACTORS.r_lowerMotor.servoPorts;
    const docks=ports.map(port=>new THREE.Vector3(...port.position).addScaledVector(new THREE.Vector3(...port.normal),2.25).applyQuaternion(actorQuaternion(flow.ACTORS.r_lowerMotor,motor)).add(new THREE.Vector3(...motor.position)).toArray());
    assert.ok(docks.some(d=>Math.hypot(...d.map((v,i)=>v-world(wire.points.at(-1))[i]))<1e-6),'other end remains connected to13');
  }
});

test('finished leg and head assemblies move rigidly into the body',()=>{
  for(const [step,ids]of [['t-join-r',['motor','foot','shank','r_upperMotor','r_support','r_joinScrew0']],['final-head-join',['h_shell','h_jaw','h_neckA','h_motor30','h_supportScrew0']]]){
    const n=at(step),a=flow.snapshot(n,0),b=flow.snapshot(n,1),delta=b[ids[0]].position.map((v,i)=>v-a[ids[0]].position[i]);
    assert.ok(Math.hypot(...delta)>1);for(const id of ids)close(b[id].position.map((v,i)=>v-a[id].position[i]),delta,id);
  }
});

test('reordered flow ends in the unchanged source assembly and keeps existing parts continuous between actions',()=>{
 const assembled=flow.snapshot(flow.STEPS.length-1),reference=legacy.snapshot(legacy.OVERVIEW_STEP);
 for(const[id,pose]of Object.entries(assembled))if(pose.visible&&reference[id].visible&&flow.ACTORS[id].kind!=='cable')close(pose.position,reference[id].position,id);
 for(let n=2;n<flow.STEPS.length;n++){
  const a=flow.snapshot(n-1,1),b=flow.snapshot(n,0);
  for(const[id,pose]of Object.entries(a))if(pose.visible&&b[id].visible)close(pose.position,b[id].position,flow.STEPS[n].id+' / '+id);
 }
});

test('seeking and reversal are stateless, all frames finite, and pending holes never look installed',()=>{
  ready();for(let n=0;n<flow.STEPS.length;n++){
    const expected=flow.snapshot(n,.37);flow.snapshot(flow.STEPS.length-1,1);flow.snapshot(0,0);assert.deepEqual(flow.snapshot(n,.37),expected,flow.STEPS[n].id);
    for(const p of [0,.5,1])for(const[id,pose]of Object.entries(flow.snapshot(n,p))){
      assert.ok(pose.position.length===3&&pose.position.every(Number.isFinite),id);assert.ok(pose.opacity>=0&&pose.opacity<=1,id);
      if(pose.visible&&flow.ACTORS[id].kind==='cable')assert.ok(pose.points?.length>=2&&pose.points.flat().every(Number.isFinite),id);
      if(flow.ACTORS[id].hardwareStatus?.startsWith('pending-'))assert.equal(pose.visible,false,id);
    }
  }
});
