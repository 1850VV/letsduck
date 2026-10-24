import * as THREE from '../vendor/three.module.js';

// Experimental display only. Native GLBs and manufacturing geometry stay read-only.
// Keep the upper 2 mm (head, drive recess and seat) exact; cluster only the shaft.
export function simplifyScrewDisplay(source,cell){
 source.computeBoundingBox();const head=source.boundingBox.max.y-.002,attributes=source.attributes,p=attributes.position;
 const remap=new Uint32Array(p.count),representatives=[],clusters=new Map();
 for(let i=0;i<p.count;i++){
  const key=p.getY(i)>=head?`head:${i}`:[Math.round(p.getX(i)/cell),Math.round(p.getY(i)/cell),Math.round(p.getZ(i)/cell),
   // Keep opposing faces and texture seams separate. No material merging.
   ...['normal','uv'].flatMap(name=>{const a=attributes[name];return a?Array.from({length:a.itemSize},(_,c)=>Math.round(a.array[i*a.itemSize+c]*(name==='normal'?2:32))):[];})].join(':');
  if(!clusters.has(key)){clusters.set(key,representatives.length);representatives.push(i);}remap[i]=clusters.get(key);
 }
 const indices=[],count=source.index?.count??p.count;
 for(let i=0;i<count;i+=3){const a=remap[source.index?source.index.getX(i):i],b=remap[source.index?source.index.getX(i+1):i+1],c=remap[source.index?source.index.getX(i+2):i+2];if(a!==b&&b!==c&&a!==c)indices.push(a,b,c);}
 const result=new THREE.BufferGeometry();for(const [name,a]of Object.entries(attributes)){const values=new a.array.constructor(representatives.length*a.itemSize);representatives.forEach((old,i)=>{for(let c=0;c<a.itemSize;c++)values[i*a.itemSize+c]=a.array[old*a.itemSize+c];});result.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}
 result.setIndex(indices);result.boundingBox=source.boundingBox.clone();source.computeBoundingSphere();result.boundingSphere=source.boundingSphere.clone();return result;
}

export function createHardwareLod({enabled=false}={}){
 const bindings=[],cache=new Map(),center=new THREE.Vector3(),scale=new THREE.Vector3();let last={original:0,medium:0,far:0};
 return {
  attach(root){if(!enabled)return;root.traverse(mesh=>{if(!mesh.isMesh||!/^screw-m/.test(mesh.userData.hardwareAsset||'')||Array.isArray(mesh.material)||mesh.geometry.groups.length)return;
   const source=mesh.geometry;if(!cache.has(source)){source.computeBoundingSphere();cache.set(source,[simplifyScrewDisplay(source,.00008),simplifyScrewDisplay(source,.00016)]);}bindings.push({mesh,source,levels:cache.get(source)});
  });},
  withView(camera,height,id,draw){
   if(!enabled)return draw();last={original:0,medium:0,far:0};camera.updateMatrixWorld();
   try{for(const {mesh,source,levels}of bindings){
    mesh.updateWorldMatrix(true,false);center.copy(source.boundingSphere.center).applyMatrix4(mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse);mesh.getWorldScale(scale);
    const diameter=source.boundingSphere.radius*2*Math.max(scale.x,scale.y,scale.z),pixels=diameter*height/(2*Math.max(.001,-center.z)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
    const full=id!=='main'||mesh.material.transparent||mesh.material.opacity<1||pixels>=72||center.z>=0;
    const level=full?-1:pixels>=28?0:1;mesh.geometry=level<0?source:levels[level];last[level<0?'original':level===0?'medium':'far']++;
   }return draw();}finally{for(const {mesh,source}of bindings)mesh.geometry=source;}
  },
  get state(){return{enabled,meshes:bindings.length,templates:cache.size,last:{...last},geometryBytes:[...cache.values()].flat().reduce((n,g)=>n+g.index.array.byteLength+Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0),0)};},
 };
}
