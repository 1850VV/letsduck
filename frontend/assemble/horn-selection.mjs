export function visibleInScene(object){
 for(let node=object;node;node=node.parent)if(!node.visible)return false;
 return true;
}
export function firstVisibleIntersection(ray,objects){
 return ray.intersectObjects(objects.filter(visibleInScene),true).find(hit=>visibleInScene(hit.object));
}
export function hornPart(object){
 for(let node=object;node;node=node.parent)if(['main','secondary'].includes(node.userData.hornRole))return node;
 return null;
}

// Selection owns temporary material copies, never the model or the saved palette.
export function createHornSelection(){
 let changed=[];
 function clear(){
  for(const item of changed){item.mesh.material=item.original;item.copies.forEach(material=>material.dispose());}
  changed=[];
 }
 return{clear,select(object){
  clear();const part=hornPart(object),disc=part?.getObjectByName('eight-hole-disc');if(!disc)return null;
  const role=part.userData.hornRole,color=role==='main'?0x5977ee:0xef9a35;
  disc.traverse(mesh=>{
   if(!mesh.isMesh)return;const original=mesh.material,materials=Array.isArray(original)?original:[original];
   const copies=materials.map(material=>{const copy=material.clone();copy.color.setHex(color);copy.emissive?.setHex(color);if('emissiveIntensity'in copy)copy.emissiveIntensity=.15;copy.roughness=.43;copy.metalness=.08;return copy;});
   changed.push({mesh,original,copies});mesh.material=Array.isArray(original)?copies:copies[0];
  });
  return{role,label:role==='main'?'主舵盘':'副舵盘',color:'#'+color.toString(16)};
 }};
}
