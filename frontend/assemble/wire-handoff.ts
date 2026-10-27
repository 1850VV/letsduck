import type {Vector,Pose} from './types.js';
import * as THREE from '../vendor/three.module.js';
import {cablePlugQuaternion} from './render-pose.js';
const smooth=(p:number)=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};
const mix=(a:Vector,b:Vector,t:number)=>a.map((n,i)=>n+(b[i]!-n)*t);
const world=(p:Pose)=>p.points!.map(v=>v.map((n,i)=>n+p.position[i]!));
export function handoffLead(source:Pose,cable:Pose,plug:Pose,initialFree:Vector){
 const base=world(source),requested=world(cable),t=cable.connectProgress||0;
 const adjustment=base.at(-1)!.map((n,i)=>n-initialFree[i]!);
 const position=plug.position.map((n,i)=>n+adjustment[i]!*(1-smooth(t/.65)));
 const shape=smooth(t/.6),points=base.map((v,i)=>{
  if(i===0||i===1)return[...v];
  if(i===base.length-1)return[...position];
  const approach=position.map((n,j)=>n+(j===1?15:0)),route=[base[1],requested[1],requested[2],approach],u=(i-1)/(base.length-2)*(route.length-1),segment=Math.min(route.length-2,Math.floor(u));
  const target=i===base.length-2?approach:mix(route[segment]!,route[segment+1]!,u-segment);
  return mix(v,target,shape);
 });
 const q=cablePlugQuaternion(base,1),dock=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));
 const euler=new THREE.Euler().setFromQuaternion(q.slerp(dock,shape)),rotation=[euler.x,euler.y,euler.z];
 return{cable:{...cable,position:[0,0,0],points},plug:{...plug,position,rotation}};
}
