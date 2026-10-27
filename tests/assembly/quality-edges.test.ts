import test from 'node:test';
import assert from 'node:assert/strict';
import {BoxGeometry,PlaneGeometry,BufferGeometry,Float32BufferAttribute} from '../../frontend/vendor/three.module.js';
import {prepareEdgeShading} from '../../frontend/assemble/quality-edges.js';

test('edge shading preserves positions and bounds without changing the source',()=>{
  const source=new BoxGeometry(10,8,6),before=Array.from(source.attributes.position!.array),result=prepareEdgeShading(source);
  assert.deepEqual(Array.from(source.attributes.position!.array),before);
  assert.equal(source.attributes.edgeDistance,undefined);
  const expanded=source.toNonIndexed();
  assert.deepEqual(Array.from(result.attributes.position!.array),Array.from(expanded.attributes.position!.array));
  source.computeBoundingBox();result.computeBoundingBox();assert.deepEqual(result.boundingBox,source.boundingBox);
  assert.equal(result.userData.shadedEdges,24);
  for(const name of ['edgeDistance','edgeNormal0','edgeNormal1','edgeNormal2'])assert.ok([...result.attributes[name]!.array].every(Number.isFinite));
});
test('coplanar diagonals and open boundaries do not acquire a fake bevel',()=>{
  const result=prepareEdgeShading(new PlaneGeometry(12,12));assert.equal(result.userData.shadedEdges,0);
  assert.ok([...result.attributes.edgeNormal0!.array,...result.attributes.edgeNormal1!.array,...result.attributes.edgeNormal2!.array].every(v=>v===0));
});
test('degenerate triangles remain finite',()=>{
  const source=new BufferGeometry();source.setAttribute('position',new Float32BufferAttribute([0,0,0,0,0,0,1,0,0],3));
  const result=prepareEdgeShading(source);assert.ok([...result.attributes.edgeDistance!.array].every(Number.isFinite));
});
