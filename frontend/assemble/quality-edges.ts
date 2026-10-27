import type * as THREE from 'three';
import {Float32BufferAttribute,Vector3} from '../vendor/three.module.js';

// Display-only edge normals. No vertex is moved: holes, silhouettes and mating
// surfaces keep their source coordinates. Coplanar mesh diagonals are ignored.
export function prepareEdgeShading(source:THREE.BufferGeometry){
  const geometry=source.index?source.toNonIndexed():source.clone(),position=geometry.attributes.position!,count=position.count;
  const distances=new Float32Array(count*3),adjacent=[0,1,2].map(()=>new Float32Array(count*3)),edges=new Map<string,{face:{first:number;normal:Vector3};slot:number}[]>(),faces:{first:number;normal:Vector3}[]=[];
  const key=(p:Vector3)=>`${Math.round(p.x*10000)},${Math.round(p.y*10000)},${Math.round(p.z*10000)}`;
  for(let first=0;first<count;first+=3){
    const p=[0,1,2].map(i=>new Vector3().fromBufferAttribute(position,first+i)),cross=new Vector3().subVectors(p[1]!,p[0]!).cross(new Vector3().subVectors(p[2]!,p[0]!)),area=cross.length(),normal=cross.normalize();
    const face={first,normal};faces.push(face);
    for(let i=0;i<3;i++){
      const a=p[(i+1)%3]!,b=p[(i+2)%3]!,length=a.distanceTo(b);distances[(first+i)*3+i]=length>1e-8?area/length:0;
      const ka=key(a),kb=key(b),edgeKey=ka<kb?ka+'|'+kb:kb+'|'+ka;
      if(!edges.has(edgeKey))edges.set(edgeKey,[]);edges.get(edgeKey)!.push({face,slot:i});
    }
  }
  let shadedEdges=0;
  for(const pair of edges.values()){
    if(pair.length!==2)continue;
    const [a,b]=pair as [typeof pair[number],typeof pair[number]],dot=a.face.normal.dot(b.face.normal);
    if(dot>.8660254||dot<-.95)continue;
    for(const [here,other]of [[a,b],[b,a]] satisfies [typeof a,typeof b][]){
      for(let vertex=0;vertex<3;vertex++)other.face.normal.toArray(adjacent[here.slot]!,(here.face.first+vertex)*3);
      shadedEdges++;
    }
  }
  geometry.setAttribute('edgeDistance',new Float32BufferAttribute(distances,3));
  adjacent.forEach((array,i)=>geometry.setAttribute('edgeNormal'+i,new Float32BufferAttribute(array,3)));
  geometry.userData={...geometry.userData,shadedEdges};return geometry;
}

export function edgeVertexShader(){return `
  #ifdef DUCK_EDGE_SHADING
    attribute vec3 edgeDistance,edgeNormal0,edgeNormal1,edgeNormal2;
    varying vec3 vEdgeDistance,vEdgeNormal0,vEdgeNormal1,vEdgeNormal2;
  #endif
`;}
export function edgeVertexAssignment(){return `
  #ifdef DUCK_EDGE_SHADING
    vEdgeDistance=edgeDistance;
    vEdgeNormal0=normalMatrix*edgeNormal0;vEdgeNormal1=normalMatrix*edgeNormal1;vEdgeNormal2=normalMatrix*edgeNormal2;
  #endif
`;}
export function edgeFragmentShader(){return `
  #ifdef DUCK_EDGE_SHADING
    varying vec3 vEdgeDistance,vEdgeNormal0,vEdgeNormal1,vEdgeNormal2;
  #endif
`;}
export function edgeFragmentAssignment(width:number){return `
  #ifdef DUCK_EDGE_SHADING
    vec3 edgeWeight=pow(vec3(1.)-smoothstep(vec3(0.),vec3(${width.toFixed(3)}),vEdgeDistance),vec3(1.35));
    normal=normalize(normal+faceDirection*(edgeWeight.x*vEdgeNormal0+edgeWeight.y*vEdgeNormal1+edgeWeight.z*vEdgeNormal2));
    nonPerturbedNormal=normal;
  #endif
`;}
