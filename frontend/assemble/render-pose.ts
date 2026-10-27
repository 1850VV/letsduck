import type {Actor,Pose,Vector,Port,Step} from './types.js';
import * as THREE from '../vendor/three.module.js';
export function actorQuaternion(actor:Pick<Actor,'rotation'|'kind'|'spinAxis'>,pose:Partial<Pose>){
 const base=new THREE.Quaternion().setFromEuler(new THREE.Euler(...(pose.rotation||actor.rotation||[0,0,0])));
 if(actor.kind==='screw')base.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...(actor.spinAxis||[1,0,0])),(pose.turn||0)*Math.PI*2));
 return base;
}
export function cableStyle(actor:Pick<Actor,'wireCount'|'cableType'|'wireColors'|'endpointPlugs'>){
 const count=actor.wireCount||(actor.cableType==='power'?2:actor.cableType==='usb-c'?1:3);
 return{count,colors:actor.wireColors||Array.from({length:count},(_,i)=>actor.cableType==='power'&&i===0?'#c94b48':'#202633'),type:actor.cableType||'servo',endpointPlugs:actor.endpointPlugs||[true,true]};
}
export function cablePlugQuaternion(points:Vector[],end:number){
 const direction=end?new THREE.Vector3(...points.at(-1)!).sub(new THREE.Vector3(...points.at(-2)!)):new THREE.Vector3(...points[0]!).sub(new THREE.Vector3(...points[1]!));
 return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,-1),direction.normalize());
}
export function socketQuaternion(port:Pick<Port,'normal'|'tangent'>){
 const normal=new THREE.Vector3(...(port.normal||[0,0,1])).normalize();
 if(!port.tangent)return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
 const tangent=new THREE.Vector3(...port.tangent).normalize(),up=new THREE.Vector3().crossVectors(normal,tangent).normalize();
 return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent,up,normal));
}
export const plugPins=(actor:Pick<Actor,'pins'>)=>actor.pins||3;
export const guidanceDelta=(pose:Pick<Pose,'position'>,finish:Pick<Pose,'position'>)=>finish.position.map((n,i)=>n-pose.position[i]!);
export function cameraPreset(direction:number,step:Pick<Step,'target'|'camera'|'module'>){
 const t=step.target,distance=Math.hypot(...step.camera.map((n,i)=>n-t[i]!));
 const offset=step.module===1?[direction*.92,.25,.12]:[.12,.25,direction*.92];
 return{position:t.map((n,i)=>n+offset[i]!*distance),target:t};
}
export function interpolatePose<T extends InterpolatablePose>(actor:Pick<Actor,'kind'|'rotation'>,a:T,b:T,t:number){
 let turns=b.turn-a.turn;
 if(actor.kind==='screw'&&a.visible&&b.visible&&a.status==='installed'&&b.status==='installed'&&Math.hypot(...a.position.map((n,i)=>n-b.position[i]!))<1e-6)turns-=Math.round(turns);
 const pose:T={...b,position:b.position.map((n,i)=>a.position[i]!+(n-a.position[i]!)*t),opacity:a.opacity+(b.opacity-a.opacity)*t,visible:a.visible||b.visible,turn:a.turn+turns*t,points:b.points?.map((v,j)=>v.map((n,i)=>(a.points?.[j]?.[i]??n)+(n-(a.points?.[j]?.[i]??n))*t))};
 if(a.rotation||b.rotation){const qa=new THREE.Quaternion().setFromEuler(new THREE.Euler(...(a.rotation||actor.rotation||[0,0,0]))),qb=new THREE.Quaternion().setFromEuler(new THREE.Euler(...(b.rotation||actor.rotation||[0,0,0])));const e=new THREE.Euler().setFromQuaternion(qa.slerp(qb,t));pose.rotation=[e.x,e.y,e.z];}
 if(a.endpointQuaternions||b.endpointQuaternions)pose.endpointQuaternions=[0,1].map(end=>{
  const qa=new THREE.Quaternion().fromArray((a.endpointQuaternions?.[end]||b.endpointQuaternions![end])!),qb=new THREE.Quaternion().fromArray((b.endpointQuaternions?.[end]||a.endpointQuaternions![end])!);
  return qa.slerp(qb,t).toArray();
 });
 if(a.connectProgress!==undefined||b.connectProgress!==undefined)pose.connectProgress=(a.connectProgress??0)+((b.connectProgress??0)-(a.connectProgress??0))*t;
 return pose;
}

type InterpolatablePose=Pick<Pose,'position'|'opacity'|'visible'|'turn'> & Partial<Omit<Pose,'position'|'opacity'|'visible'|'turn'>>;
