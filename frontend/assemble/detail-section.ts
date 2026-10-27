import * as THREE from '../vendor/three.module.js';
// The main view keeps the literal model. Only the inset cuts away foreground
// geometry, with the complete previous clipping configuration restored.
export function withDetailSection(renderer:Pick<THREE.WebGLRenderer,'clippingPlanes'>,center:THREE.Vector3,direction:THREE.Vector3,clearance:number,render:()=>void){
 const original=renderer.clippingPlanes,normal=direction.clone().normalize().negate(),point=center.clone().addScaledVector(direction.clone().normalize(),clearance);
 renderer.clippingPlanes=[...(original||[]),new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point)];
 try{return render();}finally{renderer.clippingPlanes=original;}
}
