import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../frontend/vendor/three.module.js';
let api={};try{api=await import('../../frontend/assemble/hardware-lod.mjs');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
test('screw display reduction preserves the head and leaves source arrays untouched',()=>{
 assert.equal(typeof api.simplifyScrewDisplay,'function');
 const source=new THREE.CylinderGeometry(.001,.001,.008,128,80);source.translate(0,.004,0);
 const copy=source.attributes.position.array.slice(),result=api.simplifyScrewDisplay(source,.0002);
 assert.ok(result.index.count<source.index.count*.8);
 assert.deepEqual(source.attributes.position.array,copy);
 const originals=new Set();for(let i=0;i<copy.length;i+=3)if(copy[i+1]>=.006)originals.add(`${copy[i]},${copy[i+1]},${copy[i+2]}`);
 const p=result.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>=.006)assert.ok(originals.has(`${p.getX(i)},${p.getY(i)},${p.getZ(i)}`));
 assert.ok(result.attributes.normal);assert.ok(result.attributes.uv);
});
test('LOD is opt-in, restores geometry after each pass and preserves detail/transparent picking',()=>{
 assert.equal(typeof api.createHardwareLod,'function');
 const scene=new THREE.Scene(),g=new THREE.CylinderGeometry(.001,.001,.008,64,40),m=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(g,m);g.clearGroups();mesh.userData.hardwareAsset='screw-m2x6';mesh.scale.setScalar(1000);scene.add(mesh);
 const camera=new THREE.PerspectiveCamera(45,1,1,10000);camera.position.z=1000;camera.updateMatrixWorld();
 const off=api.createHardwareLod();off.attach(scene);off.withView(camera,1000,'main',()=>assert.equal(mesh.geometry,g));
 const on=api.createHardwareLod({enabled:true});on.attach(scene);
 on.withView(camera,1000,'main',()=>assert.notEqual(mesh.geometry,g));assert.equal(mesh.geometry,g);
 on.withView(camera,1000,'detail',()=>assert.equal(mesh.geometry,g));
 m.transparent=true;m.opacity=.3;on.withView(camera,1000,'main',()=>assert.equal(mesh.geometry,g));m.transparent=false;
 assert.throws(()=>on.withView(camera,1000,'main',()=>{throw Error('render failed');}));assert.equal(mesh.geometry,g);
 camera.position.z=12;camera.updateMatrixWorld();on.withView(camera,1000,'main',()=>assert.equal(mesh.geometry,g));
});
