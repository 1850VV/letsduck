import * as THREE from '../vendor/three.module.js';
import type {TintableMaterial} from './types.js';
export function visibleInScene(object:THREE.Object3D){
 for(let node:THREE.Object3D|null=object;node;node=node.parent)if(!node.visible)return false;
 return true;
}
export function firstVisibleIntersection(ray:THREE.Raycaster,objects:THREE.Object3D[]){
 return ray.intersectObjects(objects.filter(visibleInScene),true).find(hit=>visibleInScene(hit.object));
}
export function hornPart(object:THREE.Object3D|null){
 for(let node:THREE.Object3D|null=object;node;node=node.parent)if(['main','secondary'].includes(node.userData.hornRole))return node;
 return null;
}

// Selection owns temporary material copies, never the model or the saved palette.
export function createHornSelection(){
 let changed:{mesh:THREE.Mesh;original:THREE.Material|THREE.Material[];copies:THREE.Material[]}[]=[];
 function clear(){
  for(const item of changed){item.mesh.material=item.original;item.copies.forEach(material=>material.dispose());}
  changed=[];
 }
 return{clear,select(object:THREE.Object3D|null){
  clear();const part=hornPart(object)!,disc=part?.getObjectByName('eight-hole-disc');if(!disc)return null;
  const role=part.userData.hornRole==='main'?'main':'secondary',color=role==='main'?0x5977ee:0xef9a35;
  disc.traverse(mesh=>{
   if(!(mesh instanceof THREE.Mesh))return;const original=mesh.material,materials=Array.isArray(original)?original:[original];
   const copies=materials.map(material=>{const copy:TintableMaterial=material.clone();copy.color!.setHex(color);copy.emissive?.setHex(color);if('emissiveIntensity'in copy)copy.emissiveIntensity=.15;copy.roughness=.43;copy.metalness=.08;return copy;});
   changed.push({mesh,original,copies});mesh.material=Array.isArray(original)?copies:copies[0]!;
  });
  return{role,label:role==='main'?'主舵盘':'副舵盘',color:'#'+color.toString(16)};
 }};
}
