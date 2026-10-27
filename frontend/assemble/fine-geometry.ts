import type {Vector,EntityMap,CableMap,State,FineCue} from './types.js';
import * as THREE from '../vendor/three.module.js';
import {ACTORS} from './hardware-state.js';
import {cableRoutingAnchor} from './cable-path.js';
import {actorQuaternion} from './render-pose.js';

const vector=(a:Vector)=>new THREE.Vector3(...a);
const unit=new THREE.Vector3(1,1,1);
const cube=(center:THREE.Vector3,size:Vector)=>new THREE.Box3().setFromCenterAndSize(center,vector(size));

export function createFineGeometry(entities:EntityMap,cableRecords:CableMap){
 const boxes:WeakMap<THREE.Object3D,THREE.Box3>=new WeakMap(),matches:Map<string,SocketMatch|null>=new Map();let ports:SocketPort[]|null=null;
 const matrix=(id:string,state:State)=>new THREE.Matrix4().compose(vector(state[id]!.position),actorQuaternion(ACTORS[id]!,state[id]!),unit);
 function localBox(root:THREE.Object3D){
  if(boxes.has(root))return boxes.get(root)!.clone();
  root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),bounds=new THREE.Box3();
  root.traverse(child=>{if(!(child instanceof THREE.Mesh))return;child.geometry.computeBoundingBox();bounds.union(child.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(child.matrixWorld)));});
  boxes.set(root,bounds.clone());return bounds;
 }
 const at=(id:string,state:State,pad=.6)=>localBox(entities.get(id)!).applyMatrix4(matrix(id,state)).expandByScalar(pad);
 function endpoint(cue:FineCue,state:State){
  if(cue.type==='plug')return vector(state[cue.actorId]!.position);
  if(cue.guide==='routing-loop')return vector(cableRoutingAnchor(cue.actorId,state)!).applyMatrix4(matrix(cue.actorId,state));
  const points=state[cue.actorId]!.points!,index=cue.point??(cue.endpoint===0?0:points.length-1);
  return vector(points[index]!).applyMatrix4(matrix(cue.actorId,state));
 }
 function moving(cue:FineCue,state:State){
  if(cue.type!=='cable')return at(cue.actorId,state);
  if(cue.point!==undefined)return cube(endpoint(cue,state),[5,5,5]);
  const plug=cableRecords.get(cue.actorId)?.plugs[cue.endpoint!];
  if(!plug)return cube(endpoint(cue,state),[7,6,6]);
  plug.updateWorldMatrix(true,true);return localBox(plug).applyMatrix4(plug.matrixWorld).expandByScalar(.6);
 }
 function socketPorts(){
  if(ports)return ports;
  ports=[];
  for(const [id,root]of entities){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert();root.traverse(child=>{
   if(!child.userData.focusPort||!(child instanceof THREE.Mesh))return;child.geometry.computeBoundingBox();
   ports!.push({actorId:id,local:inverse.clone().multiply(child.matrixWorld),bounds:child.geometry.boundingBox.clone(),label:child.userData.focusPort.label});
  });}
  return ports;
 }
 function socket(cue:FineCue,end:State,key:string){
  if(matches.has(key))return matches.get(key);
  const point=endpoint(cue,end);let closest=null,distance=9;
  for(const port of socketPorts()){
   if(!end[port.actorId]?.visible)continue;
   const world=matrix(port.actorId,end).multiply(port.local),center=new THREE.Vector3().setFromMatrixPosition(world),d=center.distanceTo(point);
   if(d<distance){distance=d;closest={...port,dockLocal:point.clone().applyMatrix4(matrix(port.actorId,end).invert()),distance:d};}
  }
  matches.set(key,closest);return closest;
 }
 function outward(id:string,state:State){
  const root=entities.get(id)!,axis=new THREE.Vector3(0,-1,0);
  axis.applyQuaternion(root.children[0]!.quaternion).applyQuaternion(actorQuaternion(ACTORS[id]!,state[id]!));return axis.negate().normalize();
 }
 return {resolve(cue:FineCue,state:State,end:State,start:State,progress:number,key:string){
  const obj=entities.get(cue.actorId)!;
  let target,joined,normal,done=progress>=cue.to-.00001,moved=moving(cue,state),match=null;
  if(cue.type==='screw'){
   const anchor=cue.operation==='remove'?start:end,diameter=Number(/M([\d.]+)/.exec(ACTORS[cue.actorId]!.fastener||'M2')?.[1]||2);
   normal=outward(cue.actorId,anchor);
   const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal),transform=new THREE.Matrix4().compose(vector(anchor[cue.actorId]!.position),rotation,unit);
   target=cube(new THREE.Vector3(),[diameter*2.1+.5,diameter*2.1+.5,2.6]).applyMatrix4(transform);joined=target.clone();
  }else if(cue.type==='part'){
   const anchor=cue.operation==='remove'?start:end;target=at(cue.actorId,anchor,.7);
   if(cue.targetActor){
    const relative=matrix(cue.targetActor,end).invert().multiply(matrix(cue.actorId,end));target=localBox(entities.get(cue.actorId)!).applyMatrix4(matrix(cue.targetActor,state).multiply(relative)).expandByScalar(.7);
   }
   const screw=cue.actorId+'Screw';
   normal=cue.operation==='remove'&&entities.has(screw)?outward(screw,start):vector(start[cue.actorId]!.position).sub(vector(end[cue.actorId]!.position)).normalize();
   if(normal.lengthSq()<.1)normal.set(0,0,1);joined=target.clone();
  }else if(cue.operation==='route'){
   target=cube(endpoint(cue,end),[5,5,5]);normal=new THREE.Vector3(.6,.85,-1).normalize();joined=target.clone();
  }else{
   match=socket(cue,end,key);
   if(match){
    const world=matrix(match.actorId,state).multiply(match.local),dock=match.dockLocal.clone().applyMatrix4(matrix(match.actorId,state));
    target=match.bounds.clone().applyMatrix4(world).expandByScalar(.6);normal=new THREE.Vector3(0,0,1).transformDirection(world);
    done=progress>=cue.from&&endpoint(cue,state).distanceTo(dock)<.06&&obj.visible;
   }else{
    const point=endpoint(cue,end);normal=cue.type==='plug'?new THREE.Vector3(0,0,1).applyQuaternion(actorQuaternion(ACTORS[cue.actorId]!,end[cue.actorId]!)):vector(end[cue.actorId]!.points![cue.endpoint===0?1:end[cue.actorId]!.points!.length-2]!).applyMatrix4(matrix(cue.actorId,end)).sub(point).normalize();
    target=cube(point,[7,5.5,5.5]);
   }
   joined=target.clone().union(moved);
  }
  return{cue,target,moving:moved,joined,normal,done:done&&!cue.fitPending,visible:obj.visible,matched:!!match};
 }};
}

interface SocketPort {actorId:string;local:THREE.Matrix4;bounds:THREE.Box3;label:string}
interface SocketMatch extends SocketPort {dockLocal:THREE.Vector3;distance:number}
