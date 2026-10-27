import type {Vector,Port,State} from './types.js';
import * as THREE from '../vendor/three.module.js';
import * as Base from './full-state.js';
import {actorQuaternion,socketQuaternion,cablePlugQuaternion} from './render-pose.js';
import {BOARD_AUDIT,SERVO_AUDIT} from './hardware-adapters.js';
import {LEG_SECONDARY_REMOVALS,SERVO_IDS} from './servo-horns.js';

// Adapt source anchors without editing model vertices. ID13/23 secondary
// removal is added to the existing pair steps before their support insertion.
const clone=<T>(value:T):T=>structuredClone(value);
const v=(a:Vector)=>new THREE.Vector3(...a);
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const p=clamp(n);return p*p*(3-2*p);};
const qEuler=(q:THREE.Quaternion)=>{const e=new THREE.Euler().setFromQuaternion(q);return[e.x,e.y,e.z];};
export const ACTORS=clone(Base.ACTORS);
export const CHAPTERS=clone(Base.CHAPTERS);
export const OVERVIEW_STEP=Base.OVERVIEW_STEP;
export const STEPS=clone(Base.STEPS);
export const chapterFor=(index:number)=>CHAPTERS.find(c=>index>=c.start&&index<=c.end)||CHAPTERS[0];
for(const r of LEG_SECONDARY_REMOVALS){
 STEPS.find(s=>s.id===r.stepId)!.parts.push(r.horn,r.screw);
 const normal=v(SERVO_AUDIT.actors[r.motor]!.nativePorts[0]!.normal).applyQuaternion(actorQuaternion(ACTORS[r.motor]!,{})).toArray();
 for(const [id,kind]of [[r.horn,'horn'],[r.screw,'screw']] satisfies [string,string][])ACTORS[id]={kind,module:1,carriedBy:r.motor,label:`ID${SERVO_IDS[r.motor]} 副舵盘${kind==='screw'?'固定螺丝':''}`,source:'插座开口同侧 · 保留输出轴；原装螺丝规格待核',end:[...r.tray],start:[...r.tray],fastener:null,orientationZ:0,spinAxis:normal};
}

for(const [id,a]of Object.entries(SERVO_AUDIT.actors)){
 ACTORS[id]!.servoPorts=a.replaceOldPortSlotsWithNativeIndex.map((nativeIndex,index)=>({...clone(a.nativePorts[nativeIndex]!),id:Base.ACTORS[id]!.servoPorts![index]!.id||`bus-${index}`,nativeId:a.nativePorts[nativeIndex]!.id,dockOffset:2.25,evidence:'approved-v2-appearance; geometric-slot-assignment; physical-fit-and-pinout-unverified'}));
}
const boardPorts=(ports:Port[],offset:number)=>ports.map(p=>({...clone(p),normal:[...p.direction!],tangent:[1,0,0],dockOffset:p.kind==='servo'?2.25:p.kind==='usb-c'?3.225:offset}));
for(const id of ['p_uno','f_uno'])ACTORS[id]!.ports=boardPorts(BOARD_AUDIT.unoPorts,3.225);
for(const id of ['p_extension','f_extension'])ACTORS[id]!.ports=boardPorts(BOARD_AUDIT.extensionPorts,id==='p_extension'?3.225:1.65);
for(const [id,a]of Object.entries(ACTORS))if(a.kind==='board'){
 a.label=id.endsWith('uno')?'Arduino UNO Q · 已确认外观 v2批次':'陆吾扩展板 · 已确认外观 v2';
 a.source='已确认照片模型 · 均匀单位换算1000；安装孔估算与电气映射未实物验证';
}
for(let i=0;i<4;i++){
 const id=`f_boardScrew${i}`,a=ACTORS[id]!,recommend=BOARD_AUDIT.screwActorRecommendations[id]!;
 if(i<2){
  const n=recommend.normalWorld!,face=recommend.holeFaceCentreWorldMm!;
  a.end=face.map((x,k)=>x+n[k]!*.4);a.start=a.end.map((x,k)=>x+n[k]!*32);
  a.sourceHoleCenter=[...face];a.sourceHoleNormal=[...n];a.hardwareStatus='source-hole-candidate';
  a.label=`M3×16 固定螺丝 ${i+1} · 两板近共轴孔候选`;
 }else{
  a.hardwareStatus='pending-hole-alignment';a.label=`M3×16 固定螺丝 ${i+1} · 孔位待核`;
 }
 a.source='源GLB孔位比较；2孔近共轴，另2孔约1.27mm错位；不修改孔或推定实物配合';
}
// Source labels describe the currently displayed hardware, while retaining IDs
// and all existing uncertainty about electrical and physical installation.
for(const [id,a]of Object.entries(ACTORS)){
 if(SERVO_AUDIT.actors[id])a.source='已确认 v2 舵机外观 · HD-1910-C001 / HD1910M；转轴按建模坐标适配，配合与针脚未实物验证';
 if(a.kind==='horn')a.source='已确认本批舵盘外观 · 主盘保留，副盘按 ID 处理；实体配合仍待核';
 if(a.kind==='cable'&&!['power','usb-c'].includes(a.cableType!)||a.kind==='plug'&&(a.pins||3)===3)a.source='已确认 v2 三芯插头外观与三根黑线；线长、走线和针脚仍为未核验教学示意';
 if(a.kind==='screw'&&['M2x6','M3x16','M2.3x8'].includes(a.fastener!)&&!a.hardwareStatus)a.source='已确认 v2 指定规格螺丝外观 · 孔位用途、扭矩与实体配合未实物验证';
}

const boardMount=STEPS.find(s=>s.id==='final-board-mount')!;
Object.assign(boardMount,{text:'保持两块板的插合关系，将控制器组件移到身体背部。原片标示 4 颗 M3×16；本模型只在两处近共轴孔演示插入，另两处保留待核。',check:'原片4颗；本模型2孔近共轴，另2孔约1.27mm错位，暂不显示穿过两板的完成态。源板形、孔位、PCB厚度和排针节距均未拉伸或补孔；身体支撑与实体配合待核。',caption:'原片 M3×16 ×4 · 演示2孔，另2孔待核'});
const mate=STEPS.find(s=>s.id==='final-board-mate')!;
mate.check='采用已确认板卡模型；32针对齐与12.3mm建模间距已核对，孔位部分为照片估算。两处安装孔约1.27mm错位，实物插合、公差与电气针脚未验证。';
STEPS.find(s=>s.id==='prepare-boards')!.check='采用已确认照片模型。四组32针按建模坐标对齐；PCB和接口未按总包络拉伸。板间净空、键位、电气映射和实物配合仍待核。';

const sourceActors=Base.ACTORS;
const matrices=(id:string,state:State)=>new THREE.Matrix4().compose(v(state[id]!.position),actorQuaternion(sourceActors[id]!,state[id]!),new THREE.Vector3(1,1,1));
const worldPoint=(id:string,point:Vector,state:State)=>v(point).applyMatrix4(matrices(id,state));
const endpoint=(id:string,end:number,state:State)=>sourceActors[id]!.kind==='plug'?v(state[id]!.position):worldPoint(id,state[id]!.points![end?state[id]!.points!.length-1:0]!,state);
const portFrame=(id:string,port:Port,state:State,offset:number)=>{
 const actorQ=actorQuaternion(sourceActors[id]!,state[id]!);
 const q=actorQ.clone().multiply(socketQuaternion(port));
 return{q,mouth:worldPoint(id,port.position,state),normal:v((port.normal||port.direction)!).applyQuaternion(actorQ),dock:worldPoint(id,port.position,state).addScaledVector(v((port.normal||port.direction)!).applyQuaternion(actorQ),offset)};
};
const oldServoTargets=(state:State)=>{
 const result=[];
 for(const [id,a]of Object.entries(sourceActors))if(state[id]?.visible&&a.servoPorts)for(const [index,port]of a.servoPorts.entries())result.push({targetId:id,portIndex:index,oldPort:port,...portFrame(id,port,state,1.65)});
 return result;
};
const bindingKey=(id:string,end:number)=>`${id}:${end}`;
const explicitBoards:Map<string,BoardBinding>=new Map();
const boardBinding=(id:string,end:number,targetId:string,portId:string,offset:number,entryId:string)=>{
 const entry=Base.STEPS.findIndex(s=>s.id===entryId),done=Base.snapshot(entry,1),targetQ=actorQuaternion(sourceActors[targetId]!,done[targetId]!);
 const oldQ=sourceActors[id]!.cableType==='usb-c'?new THREE.Quaternion().setFromUnitVectors(v([0,0,1]),v([-1,0,0])):targetQ.clone();
 explicitBoards.set(bindingKey(id,end),{id,end,targetId,entry,newPort:ACTORS[targetId]!.ports!.find(p=>p.id===portId)!,newOffset:offset,board:true,oldDockLocal:endpoint(id,end,done).applyMatrix4(matrices(targetId,done).invert()).toArray(),oldFrameLocal:targetQ.invert().multiply(oldQ).toArray()});
};
boardBinding('p_powerCable',1,'p_extension','power-2pin-housing',3.225,'prepare-battery');
boardBinding('p_servoCable',1,'p_extension','white-3pin-1',2.25,'prepare-servo');
boardBinding('p_usb',0,'p_uno','usb-c',3.225,'prepare-usb');
boardBinding('f_powerPlug',0,'f_extension','power-2pin-housing',1.65,'final-power');
boardBinding('f_powerCable',1,'f_extension','power-2pin-housing',1.65,'final-power');
for(let i=0;i<3;i++){
 boardBinding(`f_busPlug${i}`,0,'f_extension',`white-3pin-${i+1}`,2.25,'final-buses');
 boardBinding(`f_bus${i}`,1,'f_extension',`white-3pin-${i+1}`,2.25,'final-buses');
}
const cache:Map<number,BindingFrame>=new Map();
function bindings(index:number){
 if(cache.has(index))return cache.get(index);
 const end=Base.snapshot(index,1),start=Base.snapshot(index,0),targets=oldServoTargets(end),result=new Map<string,EndpointBinding>();
 for(const [id,a]of Object.entries(sourceActors))if(end[id]!.visible&&(a.kind==='cable'||a.kind==='plug'))for(const endIndex of a.kind==='cable'?[0,1]:[0]){
  const key=bindingKey(id,endIndex),explicit=explicitBoards.get(key),point=endpoint(id,endIndex,end);
  if(explicit){
   if(index>=explicit.entry||Base.STEPS[index]!.overview||Base.STEPS[index]!.module===5)result.set(key,explicit);
  }else{
   const target=targets.find(t=>t.dock.distanceTo(point)<.05);
   if(target)result.set(key,{id,end:endIndex,targetId:target.targetId,oldPort:target.oldPort,newPort:ACTORS[target.targetId]!.servoPorts![target.portIndex]!,newOffset:2.25});
  }
 }
 const value={start,end,items:result};cache.set(index,value);return value;
}
function oldFrame(binding:EndpointBinding,state:State){
 if(!binding.board)return portFrame(binding.targetId,binding.oldPort,state,1.65);
 const actorQ=actorQuaternion(sourceActors[binding.targetId]!,state[binding.targetId]!);
 return{dock:worldPoint(binding.targetId,binding.oldDockLocal,state),q:actorQ.multiply(new THREE.Quaternion(...binding.oldFrameLocal))};
}
function adaptEndpoint(binding:EndpointBinding,state:State,reference:BindingFrame){
 const old=oldFrame(binding,state),next=portFrame(binding.targetId,binding.newPort,state,binding.newOffset),point=endpoint(binding.id,binding.end,state);
 const initial=endpoint(binding.id,binding.end,reference.start),initialOld=oldFrame(binding,reference.start),initialGap=initial.distanceTo(initialOld.dock),gap=point.distanceTo(old.dock);
 const amount=gap<.05||initialGap<.05?1:smooth(1-gap/initialGap);
 const delta=next.q.clone().multiply(old.q.clone().invert());
 const transformed=point.clone().sub(old.dock).applyQuaternion(delta).add(next.dock);
 // Start at the original free position. Blend only the geometric correction;
 // final approach and installed endpoints use the complete new socket frame.
 const startNext=portFrame(binding.targetId,binding.newPort,reference.start,binding.newOffset),startDelta=startNext.q.clone().multiply(initialOld.q.clone().invert());
 const mappedStart=initial.clone().sub(initialOld.dock).applyQuaternion(startDelta).add(startNext.dock);
 const position=transformed.add(initial.clone().sub(mappedStart).multiplyScalar((1-amount)**2));
 const sourceQ=sourceActors[binding.id]!.kind==='plug'?actorQuaternion(sourceActors[binding.id]!,state[binding.id]!):cablePlugQuaternion(state[binding.id]!.points!,binding.end).premultiply(actorQuaternion(sourceActors[binding.id]!,state[binding.id]!));
 const quaternion=sourceQ.clone().slerp(next.q,amount);
 return{position,quaternion,amount,normal:next.normal,binding};
}
const plugPairs:[string,string,number][]=[['plug','wire',0],['l_plug','l_wire',0],['h_plug32','h_wire32',0],['h_plug33','h_wire33',0],['h_plugMouth','h_wireMouth',0],['h_plugNeck','h_neckWire',1],['f_powerPlug','f_powerCable',1],...Array.from({length:3},(_,i)=>[`f_busPlug${i}`,`f_bus${i}`,1] satisfies [string,string,number])];
export const PLUG_PAIRS=Object.freeze(plugPairs.map(pair=>Object.freeze(pair)));
const hornReferences=Object.entries(SERVO_AUDIT.actors).filter(([,a])=>a.existingHorn).map(([motorId,a])=>{
 const h=a.existingHorn!,referenceInverse=actorQuaternion(sourceActors[motorId]!,{position:sourceActors[motorId]!.end}).invert();
 const at=h.globalRemoveStep??sourceActors[h.screwActorId]!.step!+Base.STEPS.findIndex(s=>s.module===sourceActors[h.screwActorId]!.module);
 const start=Base.snapshot(Math.max(0,at),0),end=Base.snapshot(Math.max(0,at),1),carrier=start[motorId]!;
 return{motorId,h,
  relative:referenceInverse.clone().multiply(new THREE.Quaternion(...h.newDesiredQuaternionXYZW)),
  localSeat:v(h.newSeatedWorldMm).sub(v(sourceActors[motorId]!.end)).applyQuaternion(referenceInverse),
  localOld:v(h.currentSeatedWorldMm).sub(v(sourceActors[motorId]!.end)).applyQuaternion(referenceInverse),
  screwLocal:v(start[h.screwActorId]!.position).sub(v(carrier.position)).applyQuaternion(actorQuaternion(sourceActors[motorId]!,carrier).invert()),
  start,end,
 };
});
function adaptHorns(index:number,state:State){
 for(const reference of hornReferences){
  const {motorId,h}=reference,motorQ=actorQuaternion(sourceActors[motorId]!,state[motorId]!);
  const hornQ=motorQ.clone().multiply(reference.relative),normal=v([0,0,1]).applyQuaternion(hornQ);
  const seat=reference.localSeat.clone().applyQuaternion(motorQ).add(v(state[motorId]!.position)),oldSeat=reference.localOld.clone().applyQuaternion(motorQ).add(v(state[motorId]!.position));
  for(const [id,isScrew]of [[h!.actorId,false],[h!.screwActorId,true]] satisfies [string,boolean][]){
   const pose=state[id];if(!pose)continue;
   let weight=pose.status==='removed'?0:1;
   let oldRoot=oldSeat.clone();
   if(isScrew){
    oldRoot=reference.screwLocal.clone().applyQuaternion(motorQ).add(v(state[motorId]!.position));
   }
   if(h!.globalRemoveStep!==null&&index===h!.globalRemoveStep){
    const atStart=reference.start[id]!.position,atEnd=reference.end[id]!.position;
    const axis=v(atEnd).sub(v(atStart)),length=axis.lengthSq();
    if(length>1e-9)weight=1-clamp(v(pose.position).sub(v(atStart)).dot(axis)/length);
   }
   const target=isScrew?seat.clone().addScaledVector(normal,2.05-.7):seat;
   pose.position=v(pose.position).add(target.clone().sub(oldRoot).multiplyScalar(weight)).toArray();
   if(isScrew){
    const child=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,sourceActors[id]!.orientationZ??-Math.PI/2));
    pose.rotation=qEuler(new THREE.Quaternion().setFromUnitVectors(v([0,1,0]),normal).multiply(child.invert()));
   }else pose.rotation=qEuler(hornQ);
  }
 }
}
export function snapshot(index:number,progress=1){
 const n=Math.max(0,Math.min(STEPS.length-1,Math.trunc(Number.isFinite(index)?index:0))),p=clamp(Number.isFinite(progress)?progress:1);
 const original=Base.snapshot(n,p),state=clone(original),reference=bindings(n)!,adapted=new Map<string,ReturnType<typeof adaptEndpoint>>();
 for(const [key,binding]of reference.items)adapted.set(key,adaptEndpoint(binding,original,reference));
 for(const [id,a]of Object.entries(sourceActors))if(a.kind==='cable'&&state[id]!.points){
  const inverse=matrices(id,original).invert(),qInverse=actorQuaternion(a,original[id]!).invert();
  state[id]!.endpointQuaternions=[0,1].map(end=>{
   const change=adapted.get(bindingKey(id,end));
   if(!change)return cablePlugQuaternion(original[id]!.points!,end).toArray();
   const k=end?state[id]!.points!.length-1:0,neighbor=end?k-1:1;
   const oldPoint=endpoint(id,end,original),oldNeighbor=worldPoint(id,original[id]!.points![neighbor]!,original),length=oldPoint.distanceTo(oldNeighbor);
   state[id]!.points![k]=change.position.clone().applyMatrix4(inverse).toArray();
   const wanted=change.position.clone().addScaledVector(change.normal,Math.max(8,length));
   state[id]!.points![neighbor]=oldNeighbor.lerp(wanted,change.amount).applyMatrix4(inverse).toArray();
   return qInverse.clone().multiply(change.quaternion).toArray();
  });
 }
 for(const [id,a]of Object.entries(sourceActors))if(a.kind==='plug'){
  const change=adapted.get(bindingKey(id,0));if(change){state[id]!.position=change.position.toArray();state[id]!.rotation=qEuler(change.quaternion);}
 }
 for(const [plug,cable,end]of PLUG_PAIRS)if(state[plug]!.visible&&state[cable]!.visible&&state[cable]!.points){
  const k=end?state[cable]!.points.length-1:0;
  state[cable]!.points[k]=v(state[plug]!.position).applyMatrix4(matrices(cable,state).invert()).toArray();
  state[cable]!.endpointQuaternions![end]=actorQuaternion(sourceActors[cable]!,state[cable]!).invert().multiply(actorQuaternion(ACTORS[plug]!,state[plug]!)).toArray();
 }
 for(let i=0;i<4;i++){
  const id=`f_boardScrew${i}`;
  if(i>1){state[id]!.visible=false;state[id]!.opacity=0;state[id]!.status='pending';}
  else state[id]!.position=v(state[id]!.position).add(v(ACTORS[id]!.end).sub(v(sourceActors[id]!.end))).toArray();
 }
 adaptHorns(n,state);
 for(const r of LEG_SECONDARY_REMOVALS){
  const at=STEPS.findIndex(s=>s.id===r.stepId),spec=SERVO_AUDIT.actors[r.motor]!.frontHornParent;
  const motorQ=actorQuaternion(sourceActors[r.motor]!,state[r.motor]!),hornQ=motorQ.clone().multiply(new THREE.Quaternion(...spec.quaternionXYZW));
  const normal=v([0,0,1]).applyQuaternion(hornQ),seat=v(spec.translationMm).applyQuaternion(motorQ).add(v(state[r.motor]!.position));
  for(const [id,isScrew]of [[r.horn,false],[r.screw,true]] satisfies [string,boolean][]){
   const t=n<at?0:n>at?1:smooth(isScrew?(p-.2)/.35:(p-.6)/.4);
   const start=seat.clone().addScaledVector(normal,isScrew?1.35:0),tray=v(r.tray).add(v(isScrew?[12,0,0]:[0,0,0]));
   const q=isScrew?new THREE.Quaternion().setFromUnitVectors(v([0,1,0]),normal):hornQ;
   state[id!]={position:start.lerp(tray,t).toArray(),rotation:qEuler(q),turn:isScrew?-t*6:0,visible:n>=at&&!STEPS[n]!.overview&&STEPS[n]!.module!<5,opacity:1,status:n<at?'waiting':t>=.999?'removed':t>0?'moving':'installed'};
  }
 }
 return state;
}

interface BindingBase {id:string;end:number;targetId:string;newPort:Port;newOffset:number}
interface BoardBinding extends BindingBase {board:true;entry:number;oldDockLocal:Vector;oldFrameLocal:Vector}
interface ServoBinding extends BindingBase {board?:false;oldPort:Port}
type EndpointBinding=BoardBinding|ServoBinding;
interface BindingFrame {start:State;end:State;items:Map<string,EndpointBinding>}
