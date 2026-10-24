import test from 'node:test';
import assert from 'node:assert/strict';
import {MeshPhysicalMaterial,DataTexture,Color,DoubleSide} from '../../frontend/vendor/three.module.js';
import {hardwareFinish} from '../../frontend/assemble/render-quality.mjs';

test('approved GLB finishes retain colour, maps, metalness and optical properties in extreme mode',()=>{
 const map=new DataTexture(),roughnessMap=new DataTexture(),normalMap=new DataTexture();
 const original=new MeshPhysicalMaterial({name:'gold-plated-contacts',color:0xc9a23a,map,roughnessMap,normalMap,metalness:.84,roughness:.26,side:DoubleSide,clearcoat:.17,ior:1.52,transparent:true,opacity:.75});
 original.userData={baseOpacity:.75,approvedHardware:true};
 const enhanced=hardwareFinish(original);
 assert.notEqual(enhanced,original);assert.equal(enhanced.name,original.name);
 for(const key of ['map','roughnessMap','normalMap','metalness','roughness','side','clearcoat','ior','opacity','transparent'])assert.equal(enhanced[key],original[key],key);
 assert.deepEqual(enhanced.color,original.color);assert.deepEqual(enhanced.userData,original.userData);
 enhanced.opacity=.2;assert.equal(original.opacity,.75);
});
test('approved texture colours are not replaced with actor colour or generic silver',()=>{
 for(const color of [0xf7f0d8,0x17201b,0xcea830,0x001d8b]){
  const source=new MeshPhysicalMaterial({color,metalness:.9,roughness:.4}),result=hardwareFinish(source);
  assert.deepEqual(result.color,new Color(color));assert.equal(result.metalness,.9);assert.equal(result.roughness,.4);
 }
});
