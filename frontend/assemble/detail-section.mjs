import * as THREE from '../vendor/three.module.js';
// The main view keeps the literal model. Only the inset cuts away foreground
// geometry, with the complete previous clipping configuration restored.
export function withDetailSection(renderer,center,direction,clearance,render){
 const original=renderer.clippingPlanes,normal=direction.clone().normalize().negate(),point=center.clone().addScaledVector(direction.clone().normalize(),clearance);
 renderer.clippingPlanes=[...(original||[]),new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point)];
 try{return render();}finally{renderer.clippingPlanes=original;}
}
