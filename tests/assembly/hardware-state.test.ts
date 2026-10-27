import {parseAudit} from './fixtures/typed-json.js';
import type {Vector,State,Port} from '../../frontend/assemble/types.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../frontend/vendor/three.module.js';
import * as base from '../../frontend/assemble/full-state.js';
import {actorQuaternion,socketQuaternion} from '../../frontend/assemble/render-pose.js';

const originalActors=JSON.stringify(base.ACTORS);
import * as hardware from '../../frontend/assemble/hardware-state.js';
const audit=parseAudit(JSON.parse(fs.readFileSync(new URL('./fixtures/servo-audit.json',import.meta.url),'utf8')));
const vec=(a:Vector)=>new THREE.Vector3(...a);
const distance=(a:Vector,b:Vector)=>vec(a).distanceTo(vec(b));
const world=(id:string,point:Vector,state:State,actors=base.ACTORS)=>vec(point).applyQuaternion(actorQuaternion(actors[id]!,state[id]!)).add(vec(state[id]!.position)).toArray();
const endpoint=(id:string,end:number,state:State,actors=base.ACTORS)=>world(id,state[id]!.points![end?state[id]!.points!.length-1:0]!,state,actors);
const step=(id:string)=>base.STEPS.findIndex(s=>s.id===id);
const near=(actual:Vector,expected:Vector,context:string)=>assert.ok(distance(actual,expected)<.05,`${context}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
function matches(state:State){
 const ports=[];
 for(const [id,a]of Object.entries(base.ACTORS))if(state[id]?.visible&&a.servoPorts)for(const [index,p]of a.servoPorts.entries())ports.push({id,index,dock:world(id,p.position.map((v,k)=>v+p.normal![k]!*1.65),state)});
 const found=[];
 for(const [id,a]of Object.entries(base.ACTORS))if(state[id]?.visible){
  const points=a.kind==='cable'?[endpoint(id,0,state),endpoint(id,1,state)]:a.kind==='plug'?[state[id].position]:[];
  for(const [end,p]of points.entries()){
   const match=ports.find(t=>distance(t.dock,p)<.05);
   if(match)found.push({end,kind:a.kind,...match,targetId:match.id,id});
  }
 }
 return found;
}
function physicalPort(targetId:string,index:number){
 const a=audit.actors[targetId]!;
 return a.nativePorts[a.replaceOldPortSlotsWithNativeIndex[index]!]!;
}
function expectedDock(targetId:string,index:number,state:State){
 const p=physicalPort(targetId,index);
 return world(targetId,p.position.map((v,k)=>v+p.normal[k]!*2.25),state);
}
function assertPortFrame(q:THREE.Quaternion,port:Port,targetId:string,state:State,context:string){
 const wanted=actorQuaternion(base.ACTORS[targetId]!,state[targetId]!).multiply(socketQuaternion(port));
 assert.ok(q.angleTo(wanted)<1e-5,`${context}: wrong full socket frame`);
}

test('v2 snapshot adapter exists and keeps the 111-step playback contract',()=>{
 assert.ok(hardware.snapshot,'Missing v2 hardware state module');
 assert.equal(hardware.STEPS.length,111);
 assert.deepEqual(hardware.STEPS.map(s=>[s.id,s.module,s.sourceStart,s.sourceEnd,s.duration]),base.STEPS.map(s=>[s.id,s.module,s.sourceStart,s.sourceEnd,s.duration]));
 assert.equal(hardware.OVERVIEW_STEP,base.OVERVIEW_STEP);
 for(let i=0;i<111;i++)assert.equal(hardware.chapterFor(i)!.id,base.chapterFor(i)!.id);
});
test('preparation reaches the photographed servo, large white bus port, battery mouth and moved USB-C',()=>{
 assert.ok(hardware.snapshot);
 const s=hardware.snapshot(step('prepare-servo'),1);
 near(endpoint('p_servoCable',0,s,hardware.ACTORS),[26.85,23,52.2],'new servo socket dock');
 near(endpoint('p_servoCable',1,s,hardware.ACTORS),[-38.71,26.2,31.55],'large 2.0 mm bus port');
 const power=hardware.snapshot(step('prepare-battery'),1);
 near(endpoint('p_powerCable',1,power,hardware.ACTORS),[-12.81,26.9,32.625],'two-pin power port front plane');
 const usb=hardware.snapshot(step('prepare-usb'),1);
 near(endpoint('p_usb',0,usb,hardware.ACTORS),[-46.19,12,33.825],'USB-C relocated front plane');
 const start=hardware.snapshot(step('prepare-usb'),0),middle=hardware.snapshot(step('prepare-usb'),.8);
 assert.ok(endpoint('p_usb',0,middle,hardware.ACTORS)[2]>33.825,'USB approaches along outward +Z');
 near(endpoint('p_usb',0,start,hardware.ACTORS),endpoint('p_usb',0,base.snapshot(step('prepare-usb'),0)),'free USB start is preserved');
});
test('all existing installed servo endpoints contact new mouths in full normal-and-tangent frames',()=>{
 assert.ok(hardware.snapshot);let checked=0;
 for(let i=0;i<111;i++){
  const old=base.snapshot(i,1),now=hardware.snapshot(i,1);
  for(const match of matches(old)){
   const {id,end,targetId,index,kind}=match;
   const actual=kind==='cable'?endpoint(id,end,now,hardware.ACTORS):now[id]!.position;
   const want=expectedDock(targetId,index,now);
   near(actual,want,`${base.STEPS[i]!.id}:${id}:${end}->${targetId}:${index}`);
   const q=kind==='cable'?actorQuaternion(hardware.ACTORS[id]!,now[id]!).multiply(new THREE.Quaternion(...now[id]!.endpointQuaternions![end]!)):actorQuaternion(hardware.ACTORS[id]!,now[id]!);
   assertPortFrame(q,physicalPort(targetId,index),targetId,now,`${i}:${id}:${end}`);
   const tip=vec([0,0,-2.25]).applyQuaternion(q).add(vec(actual));
   near(tip.toArray(),world(targetId,physicalPort(targetId,index).position,now),`${i}:${id} actual mating face`);
   checked++;
  }
 }
 assert.ok(checked>300,`only ${checked} endpoints covered`);
});
test('independent head and final plugs remain exactly attached to their cable endpoints during motion',()=>{
 assert.ok(hardware.snapshot);
 const pairs:[string,string,number][]=[['plug','wire',0],['l_plug','l_wire',0],['h_plug32','h_wire32',0],['h_plug33','h_wire33',0],['h_plugMouth','h_wireMouth',0],['h_plugNeck','h_neckWire',1],['f_powerPlug','f_powerCable',1],...Array.from({length:3},(_,i)=>[`f_busPlug${i}`,`f_bus${i}`,1] satisfies [string,string,number])];
 for(let i=0;i<111;i++)for(const p of [0,.2,.5,.8,1]){
  const s=hardware.snapshot(i,p);
  for(const [plug,cable,end]of pairs)if(s[plug!]!.visible&&s[cable!]!.visible)near(s[plug!]!.position,endpoint(cable!,end,s,hardware.ACTORS),`${i}:${p}:${plug} cable is disconnected`);
 }
});
test('final buses use three distinct 2.0 mm mouths and leave 1.25 mm ports unused',()=>{
 assert.ok(hardware.snapshot);const s=hardware.snapshot(step('final-buses'),1);
 for(const [i,want]of [[0,[-3.71,136.55,-55.2]],[1,[-12.41,136.55,-55.2]],[2,[-21.11,136.55,-55.2]]] satisfies [number,(number)[]][])near(s[`f_busPlug${i}`]!.position,want!,`bus ${i}`);
 near(s.f_powerPlug!.position,[22.19,136.05,-55.9],'power');
 assert.equal(hardware.ACTORS.f_extension!.ports!.filter(p=>p.kind==='servo').length,3);
 assert.equal(hardware.ACTORS.f_extension!.ports!.filter(p=>p.pitchMm===1.25).length,3);
 near(hardware.ACTORS.f_uno!.end,[0,100,-39],'UNO actor origin');
 near(hardware.ACTORS.f_extension!.end,[0,100,-51],'extension actor origin - child adapter applies translation once');
});
test('two M3 candidates seat on real source holes and two mismatched holes stay pending',()=>{
 assert.ok(hardware.snapshot);const s=hardware.snapshot(step('final-board-mount'),1);
 near(s.f_boardScrew0!.position,[19.04,68.25,-52.5],'first M3 head underside');
 near(s.f_boardScrew1!.position,[-8.9,68.25,-52.5],'second M3 head underside');
 for(const id of ['f_boardScrew2','f_boardScrew3']){
  assert.equal(hardware.ACTORS[id]!.hardwareStatus,'pending-hole-alignment');
  assert.equal(s[id]!.visible,false);
 }
 assert.match(hardware.STEPS[step('final-board-mount')]!.check,/4.*2.*2|四.*两.*两/);
 for(const [id,a]of Object.entries(base.ACTORS))if(a.fastener==='M2.3x4'||(a.kind==='screw'&&!a.fastener))assert.equal(hardware.ACTORS[id]!.fastener,a.fastener,`${id} unknown screw changed`);
});
test('native horn discs seat and turn with each original carrier, while removal ends at the original tray',()=>{
 assert.ok(hardware.snapshot);
 for(const [motorId,a]of Object.entries(audit.actors))if(a.existingHorn){
  const h=a.existingHorn,index=h.globalRemoveStep??110,p=h.globalRemoveStep===null?1:0;
  const now=hardware.snapshot(index,p),referenceQ=actorQuaternion(base.ACTORS[motorId]!,{position:base.ACTORS[motorId]!.end});
  const seat=vec(h.newSeatedWorldMm).sub(vec(base.ACTORS[motorId]!.end)).applyQuaternion(referenceQ.clone().invert()).applyQuaternion(actorQuaternion(base.ACTORS[motorId]!,now[motorId]!)).add(vec(now[motorId]!.position));
  near(now[h.actorId]!.position,seat.toArray(),`${h.actorId} new disc seating plane`);
  const actualQ=actorQuaternion(hardware.ACTORS[h.actorId]!,now[h.actorId]!);
  const expectedQ=actorQuaternion(base.ACTORS[motorId]!,now[motorId]!).multiply(referenceQ.invert()).multiply(new THREE.Quaternion(...h.newDesiredQuaternionXYZW));
  assert.ok(actualQ.angleTo(expectedQ)<1e-5,`${h.actorId} native disc frame`);
  const child=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,base.ACTORS[h.screwActorId]!.orientationZ??-Math.PI/2));
  const head=vec([0,.7,0]).applyQuaternion(child).applyQuaternion(actorQuaternion(hardware.ACTORS[h.screwActorId]!,now[h.screwActorId]!)).add(vec(now[h.screwActorId]!.position));
  near(head.toArray(),seat.addScaledVector(vec([0,0,1]).applyQuaternion(expectedQ),2.05).toArray(),`${h.screwActorId} legacy head outer face`);
  if(h.globalRemoveStep!==null){
   const removed=hardware.snapshot(index,1),oldRemoved=base.snapshot(index,1);
   near(removed[h.actorId]!.position,oldRemoved[h.actorId]!.position,`${h.actorId} tray endpoint preserved`);
   near(removed[h.screwActorId]!.position,oldRemoved[h.screwActorId]!.position,`${h.screwActorId} tray endpoint preserved`);
  }
 }
});
test('all steps are finite, backtracking is deterministic and continuous base endpoints stay continuous',()=>{
 assert.ok(hardware.snapshot);
 for(let i=0;i<111;i++){
  for(const p of [0,.25,.6,1]){
   const s=hardware.snapshot(i,p);
   for(const [id,a]of Object.entries(hardware.ACTORS)){
    const pose=s[id];assert.ok(pose,`${i}:${p}:${id}`);
    assert.ok(pose.position.every(Number.isFinite));assert.ok(Number.isFinite(pose.opacity));
    if(pose.rotation)assert.ok(pose.rotation.every(Number.isFinite));
    if(pose.visible&&a.kind==='cable'){
     assert.ok(pose.points!.flat().every(Number.isFinite));
     assert.ok(pose.endpointQuaternions?.flat().every(Number.isFinite));
    }
   }
  }
  const before=hardware.snapshot(i,.37);hardware.snapshot(110,1);hardware.snapshot(0,0);assert.deepEqual(hardware.snapshot(i,.37),before,`backtracking ${i}`);
  if(i===0||base.STEPS[i]!.overview||base.STEPS[i-1]!.overview)continue;
  const a=base.snapshot(i-1,1),b=base.snapshot(i,0),x=hardware.snapshot(i-1,1),y=hardware.snapshot(i,0);
  for(const [id,actor]of Object.entries(base.ACTORS))if(actor.kind==='cable'&&a[id]!.visible&&b[id]!.visible)for(const end of [0,1]){
   if(distance(endpoint(id,end,a),endpoint(id,end,b))<1e-6)near(endpoint(id,end,x,hardware.ACTORS),endpoint(id,end,y,hardware.ACTORS),`cross-step ${i}:${id}:${end}`);
  }
 }
 assert.equal(JSON.stringify(base.ACTORS),originalActors,'base actor objects were mutated');
});
