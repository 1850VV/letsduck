import type {Vector,State,Pose} from './types.js';

import * as THREE from '../vendor/three.module.js';
import {ACTORS,STEPS,snapshot} from './hardware-state.js';
import {actorQuaternion} from './render-pose.js';
const v=(a:Vector)=>new THREE.Vector3(...a);
const tidyRefs=new Map<string,{selected:number;start:THREE.Vector3;delta:THREE.Vector3}>();
function tidyAmount(id:string,world:THREE.Vector3[]){
 if(!tidyRefs.has(id)){
  const index=STEPS.findIndex(s=>s.id==='final-route'),a=snapshot(index,0),b=snapshot(index,1),toWorld=(pose:Pose,p:Vector)=>v(p).applyQuaternion(actorQuaternion(ACTORS[id]!,pose)).add(v(pose.position));
  let selected=1,maximum=0;
  for(let n=1;n<a[id]!.points!.length-1;n++){const d=toWorld(a[id]!,a[id]!.points![n]!).distanceTo(toWorld(b[id]!,b[id]!.points![n]!));if(d>maximum){maximum=d;selected=n;}}
  const start=toWorld(a[id]!,a[id]!.points![selected]!),delta=toWorld(b[id]!,b[id]!.points![selected]!).sub(start);tidyRefs.set(id,{selected,start,delta});
 }
 const ref=tidyRefs.get(id)!;return THREE.MathUtils.clamp(world[ref.selected]!.clone().sub(ref.start).dot(ref.delta)/ref.delta.lengthSq(),0,1);
}
function routedPoints(id:string,points:Vector[],state:State){
 const pose=state[id]!,q=actorQuaternion(ACTORS[id]!,pose),world=points.map(p=>v(p).applyQuaternion(q).add(v(pose.position)));
 let middle;
 const anchored=(host:string,route:Vector[])=>{const ref=v(ACTORS[host]!.end),base=actorQuaternion(ACTORS[host]!,{position:ACTORS[host]!.end}),now=actorQuaternion(ACTORS[host]!,state[host]!);return route.map(p=>v(p).sub(ref).applyQuaternion(base.clone().invert()).applyQuaternion(now).add(v(state[host]!.position)).toArray());};
 if(id==='h_wire32')middle=anchored('h_motor32',[[-8.5,246,54],[-15,246,27],[-15,205,28],[20,203,25],[24,194,28]]);
 else if(id==='h_wireMouth')middle=anchored('h_mouthMotor',[[39.5,246,49],[-15,246,27],[-15,205,28],[20,203,25],[30,194,28]]);
 else if(id==='h_wire33')middle=anchored('h_motor33',[[-12,240,24],[-15,237,27],[-15,207,30],[-21,201,36]]);

 else if(id==='t_baseWire'||id==='t_baseWireL'||id==='f_bus0'||id==='f_bus1'){
  const sign=id==='t_baseWire'||id==='f_bus0'?-1:1;
  middle=[[sign*6,138,-6],[sign*3,138,-9],[sign*3,135,-18],[sign*35,155,-37]];
 }else if(id==='f_bus2'||id==='h_headLead'){
  const amount=pose.connectProgress||0,initial=anchored('h_motor30',[[-24,156,35],[-42,148,60],[-42,120,60]]),connected=[[-24,156,35],[-42,158,10],[-42,156,-38]];
  middle=initial.map((p,i)=>v(p).lerp(v(connected[i]!),amount).toArray());
 }
 else if(id==='f_powerCable')middle=anchored('f_batteryTray',[[0,135,-12],[0,139,-28],[22,155,-42]]);
 else if(id==='t_rollWireR'||id==='t_rollWireL'){
  const sign=id.endsWith('R')?-1:1,amount=THREE.MathUtils.smoothstep(world.at(-1)!.distanceTo(v(ACTORS[id]!.freeEnd!)),0,18);
  const pending=[[sign*3,137,12],[sign*3,125,34],[sign*38,115,52],[sign*38,113,52]];
  const connected=sign<0?[[-6,132,12],[-3,123,12],[0,99,9],[world.at(-1)!.x+2.65,world.at(-1)!.y,2]]:[[3,126,12],[0,102,9],[6,93,3],[world.at(-1)!.x+2.65,world.at(-1)!.y,2]];
  middle=pending.map((p,i)=>v(p).lerp(v(connected[i]!),amount).toArray());
 }else if(id==='r_legWireB'||id==='l_legWireB'){
  const sign=id[0]==='r'?-1:1,free=anchored(sign<0?'r_upperMotor':'l_upperMotor',[ACTORS[id]!.points!.at(-1)!])[0]!;
  const amount=THREE.MathUtils.smoothstep(world.at(-1)!.distanceTo(v(free)),0,18),lift=world[2]!;
  const pending=[world[1]!.toArray(),lift.toArray(),world.at(-2)!.toArray(),world.at(-2)!.toArray()];
  const connected=[world[1]!.toArray(),lift.toArray(),[sign*39,102,12],[sign<0?-30:world.at(-1)!.x+2.65,93,3]];
  middle=pending.map((p,i)=>v(p).lerp(v(connected[i]!),amount).toArray());
 }else if(id==='wire'||id==='l_wire'){
  const start=world[0]!,side=id==='wire'?-1:1;
  middle=[[start.x,start.y+8,start.z],[side*Math.max(Math.abs(world[1]!.x),78),start.y+12,start.z],...world.slice(2,-1).map(p=>p.toArray())];
 }
 if(!middle)return points.map(p=>[...p]);
 if(/^f_bus[012]$/.test(id)){
  const connected=pose.connectProgress||0,tight=connected>=.999999?tidyAmount(id,world):0,loose=connected*(1-tight),last=middle.length-1,sign=id==='f_bus0'?-1:id==='f_bus1'?1:-1;
  middle[last]=v(middle[last]!).addScaledVector(v([sign*8,8,id==='f_bus2'?0:-8]),loose).toArray();
 }
 return [world[0],...middle.map(v),world.at(-1)].map(p=>p!.sub(v(pose.position)).applyQuaternion(q.clone().invert()).toArray());
}


export function cableRoutingAnchor(id:string,state:State){return routedPoints(id,state[id]!.points!,state).at(-2);}

// Inscribed corner rounds stay inside the authored routing corridor. Catmull–Rom
// interpolation can bow through adjacent walls even when its anchors are clear.
function roundedRoute(points:THREE.Vector3[],radius=1.8){
 const path=new THREE.CurvePath<THREE.Vector3>();let previous=points[0];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1]!,b=points[i]!,c=points[i+1]!,r=Math.min(radius,a.distanceTo(b)*.35,b.distanceTo(c)*.35);
  if(r<1e-5)continue;
  const entry=b.clone().lerp(a,r/b.distanceTo(a)),exit=b.clone().lerp(c,r/b.distanceTo(c));
  if(previous!.distanceTo(entry)>1e-6)path.add(new THREE.LineCurve3(previous,entry));
  path.add(new THREE.QuadraticBezierCurve3(entry,b,exit));previous=exit;
 }
 if(previous!.distanceTo(points.at(-1)!)>1e-6)path.add(new THREE.LineCurve3(previous,points.at(-1)));
 return path;
}
export function buildCableCurve({id,points,plugs,lane,approved,state}:{id:string;points:Vector[];plugs:THREE.Object3D[];lane:number;approved:boolean;state:State}){
 const route=routedPoints(id,points,state);
 const path=route.map(p=>new THREE.Vector3(p[0]!+lane,p[1],p[2]));
 if(approved){
  const ends=plugs.map((plug,j)=>{
   const direction=new THREE.Vector3(0,j===0?1:-1,0).applyQuaternion(plug.quaternion);
   const exit=new THREE.Vector3(lane,j===0?2:-2,0).applyQuaternion(plug.quaternion).add(plug.position);
   return{exit,lead:exit.clone().addScaledVector(direction,.65)};
  });
  path.splice(0,1,ends[0]!.exit,ends[0]!.lead);path.splice(path.length-1,1,ends[1]!.lead,ends[1]!.exit);
 }
 return roundedRoute(path);
}
