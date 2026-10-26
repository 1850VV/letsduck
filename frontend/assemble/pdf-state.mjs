import * as THREE from '../vendor/three.module.js';
import * as Legacy from './hardware-state.mjs';
import {HORN_BINDINGS,LEG_SECONDARY_REMOVALS} from './servo-horns.mjs';
import {actorQuaternion} from './render-pose.mjs';
export {STEPS,CHAPTERS,chapterFor,OVERVIEW_STEP,FLOW_VERSION} from './pdf-flow.mjs';
import {STEPS} from './pdf-flow.mjs';

const clone=v=>structuredClone(v),v=a=>new THREE.Vector3(...a),clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const oldIndex=new Map(Legacy.STEPS.map((s,i)=>[s.id,i])),index=new Map(STEPS.map((s,i)=>[s.id,i]));
const offsets=Array.from({length:6},(_,m)=>Legacy.STEPS.findIndex(s=>s.module===m));
// Compile source keyframes once. Playback samples only the active source action;
// it does not advance hidden source modules or accumulate transforms on seeking.
const references=new Map();
function reference(n,p=1){const key=n+':'+p;if(!references.has(key))references.set(key,Legacy.snapshot(n,p));return references.get(key);}
const canonical=reference(Legacy.OVERVIEW_STEP);
const baseQ=(id,pose)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(...(pose.rotation||Legacy.ACTORS[id].rotation||[0,0,0])));
const matrix=(id,pose)=>new THREE.Matrix4().compose(v(pose.position),baseQ(id,pose),new THREE.Vector3(1,1,1));
function transformed(id,pose,m,q){return {...clone(pose),position:v(pose.position).applyMatrix4(m).toArray(),rotation:new THREE.Euler().setFromQuaternion(q.clone().multiply(baseQ(id,pose))).toArray().slice(0,3)};}
const move=(pose,delta)=>({...pose,position:pose.position.map((n,i)=>n+delta[i])});
const legs=new Set(Object.keys(Legacy.ACTORS).filter(id=>Legacy.ACTORS[id].module===1));
const heads=new Set(Object.keys(Legacy.ACTORS).filter(id=>Legacy.ACTORS[id].module===3));

function carry(step,anchor,contains){
 const source=oldIndex.get(step),a=reference(source,0)[anchor].position,b=reference(source)[anchor].position;
 return {at:index.get(step),source,anchor,contains,delta:a.map((n,i)=>n-b[i]),end:b};
}
const carries=[
 carry('t-join-r','r_upperMotor',id=>legs.has(id)&&!id.startsWith('l_')),
 carry('t-join-l','l_upperMotor',id=>legs.has(id)&&id.startsWith('l_')),
 carry('final-head-join','h_motor32',id=>heads.has(id)),
 carry('head-platform','h_motor32',id=>Legacy.ACTORS[id].assembly==='core'),
 carry('head-core-join','h_motor33',id=>Legacy.ACTORS[id].subassembly==='head-second'),
 carry('head-mouth-jaw','h_mouthMotor',id=>Legacy.ACTORS[id].assembly==='mouth'),
 carry('head-neck-join','h_motor30',id=>Legacy.ACTORS[id].assembly==='neck'),
 carry('r-top-link','r_topLink',id=>Legacy.ACTORS[id].group==='r-top'),
 carry('l-top-link','l_topLink',id=>Legacy.ACTORS[id].group==='l-top'),
 carry('final-tray','f_batteryTray',id=>['f_battery','f_batteryTray'].includes(id)),
 carry('final-board-mount','f_uno',id=>['f_uno','f_extension'].includes(id)),
];
const hardwareHorns=new Map();
for(const[motor,h]of Object.entries(HORN_BINDINGS))for(const id of [h.actorId,h.screwActorId])hardwareHorns.set(id,motor);
const expandedParts=s=>s.parts.flatMap(id=>{
 const a=Legacy.ACTORS[id];if(a?.listGroup)return Object.keys(Legacy.ACTORS).filter(k=>Legacy.ACTORS[k].listGroup===a.listGroup);
 if(a?.kind==='screw'&&a.fastener&&/\d+$/.test(id)){const root=id.replace(/\d+$/,'');return Object.keys(Legacy.ACTORS).filter(k=>k.replace(/\d+$/,'')===root&&Legacy.ACTORS[k].step===a.step);}
 return [id];
});
const firstUse=new Map();STEPS.forEach((s,n)=>expandedParts(s).forEach(id=>{if(!firstUse.has(id))firstUse.set(id,n);}));
const overrides={
 shank:{mount:'r-join'},l_shank:{mount:'l-join'},
 motor:{mount:'r-shank',motion:'r-join'},l_motor:{mount:'l-shank',motion:'l-join'},
 r_legWireB:{motion:'t-motor-r'},l_legWireB:{motion:'t-motor-l'},
};
const updates={wire:['r-plug','r-wire-a'],l_wire:['l-plug','l-wire-a'],
 axisScrew:['r-axle','r-tighten'],l_axisScrew:['l-axle','l-tighten'],
 t_rollWireR:['t-wire','t-motor-r'],t_rollWireL:['t-wire','t-motor-l'],
 h_wire32:['head-yaw-wire','head-neck-wire'],h_wire33:['head-core-horn-wire','head-neck-wire'],h_wireMouth:['head-mouth-horn-wire','head-neck-wire'],
 f_powerCable:['final-battery','final-power'],f_powerPlug:['final-battery','final-power'],
 ...Object.fromEntries([0,1,2].flatMap(i=>[[`f_bus${i}`,['final-battery','final-buses']],[`f_busPlug${i}`,['final-battery','final-buses']]])),
};
const ports=Object.entries(Legacy.ACTORS).flatMap(([id,a])=>(a.servoPorts||a.ports||[]).filter(p=>p.normal||p.direction).map(port=>({id,port})));
function endpoint(id,pose,end){return v(pose.points[end?pose.points.length-1:0]).applyQuaternion(baseQ(id,pose)).add(v(pose.position));}
function event(id,action,sourceAction,k,kq){
 const source=oldIndex.get(sourceAction),start=reference(source,0),end=reference(source),raw0=clone(start[id]),raw1=clone(end[id]),bindings=[];
 if(Legacy.ACTORS[id].kind==='cable')for(const edge of [0,1]){
  const point=endpoint(id,raw1,edge);
  const found=ports.find(({id:parent,port})=>{
   if(!end[parent].visible)return false;
   const normal=port.normal||port.direction;
   return v(port.position).addScaledVector(v(normal),port.dockOffset??2.25).applyQuaternion(actorQuaternion(Legacy.ACTORS[parent],end[parent])).add(v(end[parent].position)).distanceTo(point)<.05;
  });
  if(found){
   const dock=v(found.port.position).addScaledVector(v(found.port.normal||found.port.direction),found.port.dockOffset??2.25);
   const gap0=endpoint(id,raw0,edge).distanceTo(dock.clone().applyMatrix4(matrix(found.id,start[found.id])));
   bindings.push({edge,parent:found.id,dock:dock.toArray(),gap0});
  }
 }
 // The battery lead has an evidenced mechanical carrier, not an inferred pinout.
 if(id==='f_powerCable'&&!bindings.some(b=>b.edge===0))bindings.push({edge:0,parent:'f_battery'});
 const parents=new Set([...bindings.map(b=>b.parent),hardwareHorns.get(id)].filter(Boolean));
 return {at:index.get(action),source,k,kq,raw0,raw1,bindings,
  parent0:Object.fromEntries([...parents].map(parent=>[parent,transformed(parent,start[parent],k,kq)])),
  parent1:Object.fromEntries([...parents].map(parent=>[parent,transformed(parent,end[parent],k,kq)]))};
}
export const ACTORS=clone(Legacy.ACTORS);
export const PLUG_PAIRS=Legacy.PLUG_PAIRS;
const metadata=new Map();
for(const[id,a]of Object.entries(Legacy.ACTORS)){
 let native=Number.isInteger(a.step)?a.step+offsets[a.module]:oldIndex.get(LEG_SECONDARY_REMOVALS.find(r=>[r.horn,r.screw].includes(id))?.stepId);
 if(!Number.isInteger(native))throw Error('Missing actor source '+id);
 const owner=Legacy.STEPS[native].id,o=overrides[id]||{},mount=o.mount||owner;
 const actions=updates[id]||[mount];
 const install=a.installStep===undefined?null:Legacy.STEPS[a.installStep+offsets[a.module]].id;
 const lastSource=install||o.motion||actions.at(-1),last=reference(oldIndex.get(lastSource))[id];
 const k=matrix(id,canonical[id]).multiply(matrix(id,last).invert()),kq=new THREE.Quaternion().setFromRotationMatrix(k);
 const events=actions.map(action=>event(id,action,o.motion||action,k,kq)).sort((a,b)=>a.at-b.at);
 const intro=Math.min(index.get(owner),firstUse.get(id)??Infinity,events[0].at);
 const remove=canonical[id].status==='removed';
 metadata.set(id,{intro,events,remove,parent:hardwareHorns.get(id),installAt:install?index.get(install):events[0].at});
 ACTORS[id].sourceStep=a.step;ACTORS[id].step=index.get(mount);
 if(install)metadata.get(id).events.push(event(id,install,install,k,kq));
}
// Wires may be connected while their servo is still outside the bracket.
for(const[id,a]of Object.entries(ACTORS))if(a.portMotor){const parent=metadata.get(a.portMotor);parent.intro=Math.min(parent.intro,metadata.get(id).intro);}
for(const[id,parent]of hardwareHorns)metadata.get(id).intro=Math.min(metadata.get(id).intro,metadata.get(parent).intro);
for(const[n,s]of STEPS.entries())if(s.module===1&&!s.overview){
 const side=s.id.startsWith('l-')?'l':'r',c=carries.find(c=>c.anchor===side+'_upperMotor'),delta=n<c.at?c.delta:[0,0,0];
 s.camera=s.camera.map((v,i)=>v+delta[i]);s.target=s.target.map((v,i)=>v+delta[i]);
}
references.clear();

function sampled(id,e,p,frames){
 let raw,parents;
 if(p===0){raw=e.raw0;parents=e.parent0;}else if(p===1){raw=e.raw1;parents=e.parent1;}
 else{const key=e.source+':'+p;if(!frames.has(key))frames.set(key,Legacy.snapshot(e.source,p));const frame=frames.get(key);raw=frame[id];parents=Object.fromEntries(Object.keys(e.parent1).map(parent=>[parent,transformed(parent,frame[parent],e.k,e.kq)]));}
 return {pose:transformed(id,raw,e.k,e.kq),parents};
}
function groupDelta(id,n,p,frames){
 const result=[0,0,0];for(const c of carries)if(c.contains(id)){
  let delta=n<c.at?c.delta:[0,0,0];
  if(n===c.at){const key=c.source+':'+p;if(!frames.has(key))frames.set(key,Legacy.snapshot(c.source,p));delta=frames.get(key)[c.anchor].position.map((v,i)=>v-c.end[i]);}
  for(let i=0;i<3;i++)result[i]+=delta[i];
 }return result;
}
export function snapshot(value,progress=1){
 const n=Math.max(0,Math.min(STEPS.length-1,Math.trunc(Number.isFinite(value)?value:0))),p=clamp(Number.isFinite(progress)?progress:0);
 // This is explicitly an overview, not the state of an assembled component.
 if(STEPS[n].id==='prepare-intro')return clone(Legacy.snapshot(0,p));
 const result={},samples=new Map(),frames=new Map();
 for(const[id,a]of Object.entries(ACTORS)){
  const meta=metadata.get(id),events=meta.events,active=events.filter(e=>e.at<=n).at(-1),e=active||events[0],t=active?(e.at===n?p:1):0;
  const sample=sampled(id,e,t,frames);samples.set(id,{...sample,event:e,t});
  let pose=sample.pose,visible=n>=meta.intro;
  if(a.module===0&&n>=STEPS.findIndex(s=>s.pdfPage===2))visible=false;
  if(a.hardwareStatus?.startsWith('pending-'))visible=false;
  if(meta.remove&&STEPS[n].module===5)visible=false;
  if(['h_headLead','t_baseWire','t_baseWireL'].includes(id)&&n>=index.get('final-battery'))visible=false;
  if(meta.remove){
   const removal=events[0],rp=n<removal.at?0:n===removal.at?p:1;
   const s=sampled(id,removal,rp,frames);pose=s.pose;samples.set(id,{...s,event:removal,t:rp});
   pose.status=rp===1?'removed':'moving';
  }else{
   pose=move(pose,groupDelta(id,n,p,frames));
   pose.status=n<meta.installAt?'prepared':t===1?'installed':'moving';
  }
  if(!visible){pose.visible=false;pose.opacity=0;pose.status=a.hardwareStatus?.startsWith('pending-')&&n>=meta.intro?'pending':'waiting';}
  else{pose.visible=true;pose.opacity=pose.opacity??1;if(!active)pose.opacity=1;}
  result[id]=pose;
 }
 for(const[id,meta]of metadata)if(meta.remove&&result[id].visible){
  const s=samples.get(id),parent=s.parents[meta.parent];if(!parent||!result[meta.parent]?.visible)continue;
  const m=matrix(meta.parent,result[meta.parent]).multiply(matrix(meta.parent,parent).invert()),q=new THREE.Quaternion().setFromRotationMatrix(m);
  const moved=transformed(id,result[id],m,q),follow=1-smooth((s.t-.48)/.52);
  result[id].position=result[id].position.map((v,i)=>v+(moved.position[i]-v)*follow);
  result[id].rotation=new THREE.Euler().setFromQuaternion(baseQ(id,result[id]).slerp(baseQ(id,moved),follow)).toArray().slice(0,3);
 }
 for(const[id,a]of Object.entries(ACTORS))if(a.kind==='cable'&&result[id].visible){
  const s=samples.get(id),pose=s.pose,baseMatrix=matrix(id,pose),points=pose.points.map(point=>v(point).applyMatrix4(baseMatrix)),deltas=[null,null],rotations=[null,null],weights=[1,1];
  for(const b of s.event.bindings)if(result[b.parent]?.visible){
   const m=matrix(b.parent,result[b.parent]).multiply(matrix(b.parent,s.parents[b.parent]).invert()),point=points[b.edge?points.length-1:0];
   deltas[b.edge]=point.clone().applyMatrix4(m).sub(point);rotations[b.edge]=new THREE.Quaternion().setFromRotationMatrix(m);
   if(b.dock&&b.gap0>.05){const dock=v(b.dock).applyMatrix4(matrix(b.parent,s.parents[b.parent]));weights[b.edge]=clamp(1-point.distanceTo(dock)/b.gap0);}
  }
  deltas[0]??=deltas[1]?.clone()||v(groupDelta(id,n,p,frames));deltas[1]??=deltas[0].clone();
  const original=deltas.map(d=>d.clone());for(const edge of [0,1])deltas[edge]=original[1-edge].clone().lerp(original[edge],weights[edge]);
  result[id].position=[0,0,0];result[id].rotation=[0,0,0];
  result[id].points=points.map((point,i)=>point.add(deltas[0].clone().lerp(deltas[1],i/(points.length-1))).toArray());
  if(pose.endpointQuaternions)result[id].endpointQuaternions=pose.endpointQuaternions.map((q,i)=>(rotations[i]||new THREE.Quaternion()).clone().multiply(s.event.kq).multiply(new THREE.Quaternion(...q)).toArray());
 }
 for(const[plug,cable,end]of Legacy.PLUG_PAIRS)if(result[plug]?.visible&&result[cable]?.visible){
  const points=result[cable].points;result[plug].position=[...(end?points.at(-1):points[0])];
  const q=result[cable].endpointQuaternions?.[end];if(q)result[plug].rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion(...q)).toArray().slice(0,3);
 }
 // Existing open/close demonstrations are supplemental; they never actuate a device.
 if(['head-mouth-check','head-upper-pad-check'].includes(STEPS[n].id)){
  const source=oldIndex.get(STEPS[n].id),before=Legacy.snapshot(source,0),during=Legacy.snapshot(source,p);
  for(const[id,a]of Object.entries(ACTORS))if(result[id].visible&&(['h_jaw','h_lowerPad','h_lowerAdhesive'].includes(id)||a.jawAttached)){
   result[id].position=result[id].position.map((v,i)=>v+during[id].position[i]-before[id].position[i]);
   result[id].rotation=during[id].rotation||result[id].rotation;
  }
 }
 return result;
}
