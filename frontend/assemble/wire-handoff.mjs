import * as THREE from '../vendor/three.module.js';
import {cablePlugQuaternion} from './render-pose.mjs';
const smooth=p=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};
const mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
const world=p=>p.points.map(v=>v.map((n,i)=>n+p.position[i]));
export function handoffLead(source,cable,plug,initialFree){
 const base=world(source),requested=world(cable),t=cable.connectProgress||0;
 const adjustment=base.at(-1).map((n,i)=>n-initialFree[i]);
 const position=plug.position.map((n,i)=>n+adjustment[i]*(1-smooth(t/.65)));
 const shape=smooth(t/.6),points=base.map((v,i)=>{
  if(i===0||i===1)return[...v];
  if(i===base.length-1)return[...position];
  const approach=position.map((n,j)=>n+(j===1?15:0)),route=[base[1],requested[1],requested[2],approach],u=(i-1)/(base.length-2)*(route.length-1),segment=Math.min(route.length-2,Math.floor(u));
  const target=i===base.length-2?approach:mix(route[segment],route[segment+1],u-segment);
  return mix(v,target,shape);
 });
 const q=cablePlugQuaternion(base,1),dock=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));
 const rotation=new THREE.Euler().setFromQuaternion(q.slerp(dock,shape)).toArray().slice(0,3);
 return{cable:{...cable,position:[0,0,0],points},plug:{...plug,position,rotation}};
}
