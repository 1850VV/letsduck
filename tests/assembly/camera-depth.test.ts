import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from '../../frontend/vendor/three.module.js';
import {updateAssemblyCameraDepth} from '../../frontend/assemble/camera-depth.js';

// Catches a near plane too small to distinguish the photographed servo label
// 0.015 mm above its casing in a standard 24-bit depth buffer.
const depth24=(camera:PerspectiveCamera,z:number)=>Math.round((new Vector3(0,0,z).project(camera).z*.5+.5)*16777215);
test('distant hardware keeps a 0.015 mm label distinct from its casing',()=>{
 for(const distance of [66,500,1100]){
  const camera=new PerspectiveCamera(34,1,.1,1600),target=new Vector3();camera.position.z=distance;camera.lookAt(target);camera.updateMatrixWorld();
  updateAssemblyCameraDepth(camera,target);
  assert.ok(Math.abs(depth24(camera,.015)-depth24(camera,0))>=2,`label and casing collapse at ${distance} mm`);
 }
});
// Catches increasing the clip distance without preserving magnifier foreground,
// changing the field of view, or leaving the inverse projection stale (ultra AO).
test('close detail cameras keep foreground and framing while updating both projection matrices',()=>{
 const camera=new PerspectiveCamera(32,1,.1,1600),target=new Vector3();camera.position.z=18;camera.lookAt(target);camera.updateMatrixWorld();
 const before=new Vector3(1,1,0).project(camera);updateAssemblyCameraDepth(camera,target);const after=new Vector3(1,1,0).project(camera);
 assert.equal(after.x,before.x);assert.equal(after.y,before.y);
 const foreground=new Vector3(0,0,18-18*.02).project(camera);assert.ok(foreground.z>-1&&foreground.z<1);
 const roundtrip=after.clone().unproject(camera);assert.ok(roundtrip.distanceTo(new Vector3(1,1,0))<1e-9);
});
