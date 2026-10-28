import * as THREE from '../vendor/three.module.js';
import {creased} from '../shared/positions.js';

export function createPartGeometry(positions:Float32Array,indices:Uint32Array){
 const prepared=creased(positions,indices),geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(prepared.positions,3));
 geometry.setAttribute('normal',new THREE.BufferAttribute(prepared.normals,3));
 geometry.setIndex(new THREE.BufferAttribute(prepared.indices,1));
 return geometry;
}
