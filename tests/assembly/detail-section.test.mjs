import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../frontend/vendor/three.module.js';
let api=await import('../../frontend/assemble/detail-section.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('inside-screw section retains the fastener and removes foreground occluders only during detail rendering',()=>{
 const original=[new THREE.Plane()],renderer={clippingPlanes:original},center=new THREE.Vector3(3,7,11),direction=new THREE.Vector3(0,-1,0);
 assert.equal(typeof api.withDetailSection,'function');
 api.withDetailSection(renderer,center,direction,6,()=>{assert.equal(renderer.clippingPlanes.length,2);const plane=renderer.clippingPlanes[1];assert.ok(plane.distanceToPoint(center)>0);assert.ok(plane.distanceToPoint(center.clone().addScaledVector(direction,20))<0);});assert.equal(renderer.clippingPlanes,original);
});
test('detail clipping always restores the main renderer when rendering fails',()=>{const original=[],renderer={clippingPlanes:original};assert.equal(typeof api.withDetailSection,'function');assert.throws(()=>api.withDetailSection(renderer,new THREE.Vector3(),new THREE.Vector3(0,1,0),6,()=>{throw Error('render failed');}),/render failed/);assert.equal(renderer.clippingPlanes,original);});
