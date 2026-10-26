import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../frontend/vendor/three.module.js';
let api;
try{api=await import('../../frontend/assemble/horn-selection.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
function fixture(){
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0x222222});
 const body=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),material);root.add(body);
 const parts={};
 for(const role of ['main','secondary']){
  const part=new THREE.Group();part.userData.hornRole=role;
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.1,16),material);disc.name='eight-hole-disc';
  const screw=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2),material);screw.name='retaining-screw';part.add(disc,screw);root.add(part);parts[role]={part,disc,screw};
 }
 return{root,body,material,...parts};
}
test('picking a secondary disc changes only its own material, even when the casing shares it',()=>{
 assert.equal(typeof api?.createHornSelection,'function','direct disc selection is implemented');
 const f=fixture(),selection=api.createHornSelection(),geometry=f.secondary.disc.geometry;
 const result=selection.select(f.secondary.screw);
 assert.equal(result.role,'secondary');assert.equal(result.label,'副舵盘');
 assert.equal(f.secondary.disc.material.color.getHexString(),'ef9a35');
 assert.equal(f.body.material,f.material);assert.equal(f.main.disc.material,f.material);assert.equal(f.secondary.screw.material,f.material);
 assert.equal(f.material.color.getHexString(),'222222');assert.equal(f.secondary.disc.geometry,geometry);
});
test('switching sides or clearing restores original materials, including detached discs',()=>{
 assert.equal(typeof api?.createHornSelection,'function','direct disc selection is implemented');
 const f=fixture(),selection=api.createHornSelection();selection.select(f.secondary.disc);selection.select(f.main.disc);
 assert.equal(f.secondary.disc.material,f.material);assert.equal(f.main.disc.material.color.getHexString(),'5977ee');
 selection.clear();assert.equal(f.main.disc.material,f.material);
 const detached=f.secondary.part;f.root.remove(detached);assert.equal(selection.select(detached.children[0]).role,'secondary');
 assert.equal(selection.select(f.body),null);assert.equal(f.secondary.disc.material,f.material);
});
test('ray picking ignores children of hidden built-in horn groups',()=>{
 assert.equal(typeof api?.firstVisibleIntersection,'function','picking checks the full visibility chain');
 const root=new THREE.Group(),hidden=new THREE.Group(),material=new THREE.MeshBasicMaterial();
 const hiddenMesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);hidden.position.z=2;hidden.visible=false;hidden.add(hiddenMesh);
 const visible=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);root.add(hidden,visible);root.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(0,0,5),new THREE.Vector3(0,0,-1));
 assert.equal(api.firstVisibleIntersection(ray,[root]).object,visible);
});
