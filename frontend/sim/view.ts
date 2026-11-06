// three.js view of a MuJoCo model: visual meshes (geom group 2) and a floor, posed from MjData every frame.
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import type {MjModel,MjData} from '@mujoco/mujoco';

const VISUAL_GROUP=2,MESH=7;

export function createView(host:HTMLElement,m:MjModel){
 const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xf5f6fa);
 const camera=new THREE.PerspectiveCamera(35,1,.01,20);camera.up.set(0,0,1);camera.position.set(.62,-.78,.42);
 const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=.2;controls.maxDistance=3;controls.maxPolarAngle=Math.PI*.49;
 scene.add(new THREE.HemisphereLight(0xffffff,0xb8c2d6,2.2));
 const sun=new THREE.DirectionalLight(0xffffff,1.6);sun.position.set(.6,-.4,1.2);scene.add(sun);
 const grid=new THREE.GridHelper(6,60,0xc9d2e3,0xdfe5ef);grid.rotation.x=Math.PI/2;scene.add(grid);
 const body=new THREE.MeshStandardMaterial({color:0xfafbfd,roughness:.6}),limb=new THREE.MeshStandardMaterial({color:0x4d6bfe,roughness:.5});
 const meshes:[number,THREE.Mesh][]=[];
 for(let g=0;g<m.ngeom;g++){
  if(m.geom_type[g]!==MESH||m.geom_group[g]!==VISUAL_GROUP)continue;
  const id=m.geom_dataid[g],v0=m.mesh_vertadr[id],vn=m.mesh_vertnum[id],f0=m.mesh_faceadr[id],fn=m.mesh_facenum[id];
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(Float32Array.from(m.mesh_vert.subarray(v0*3,(v0+vn)*3)),3));
  geometry.setIndex(new THREE.BufferAttribute(Uint32Array.from(m.mesh_face.subarray(f0*3,(f0+fn)*3)),1));
  geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,m.geom_bodyid[g]===1?body:limb);mesh.matrixAutoUpdate=false;scene.add(mesh);meshes.push([g,mesh]);
 }
 const target=new THREE.Vector3(),last=new THREE.Vector3();let first=true;
 function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(host);resize();
 return {
  render(d:MjData){
   for(const [g,mesh] of meshes){
    const p=d.geom_xpos,r=d.geom_xmat,i=g*3,k=g*9;
    mesh.matrix.set(r[k],r[k+1],r[k+2],p[i],r[k+3],r[k+4],r[k+5],p[i+1],r[k+6],r[k+7],r[k+8],p[i+2],0,0,0,1);
   }
   // The camera keeps its angle and follows the trunk.
   target.set(d.qpos[0],d.qpos[1],.08);
   if(first){controls.target.copy(target);first=false;}else{camera.position.add(target.clone().sub(last));controls.target.add(target.clone().sub(last));}
   last.copy(target);controls.update();renderer.render(scene,camera);
  },
  recenter(){first=true;camera.position.set(.62,-.78,.42);},
 };
}
