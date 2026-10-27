import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {parseModelManifest} from '../frontend/shared/guards.js';
import {unpackGeometry} from '../frontend/shared/geometry-pack.js';
import * as api from '../frontend/shared/positions.js';
test('crease normals keep smooth indexed faces and split a right angle', () => {
  assert.equal(typeof api.creased, 'function', 'Worker normal builder is available');
  const p = new Float32Array([0,0,0, 1,0,0, 0,1,0, 0,0,1]);
  const out = api.creased(p, new Uint32Array([0,1,2, 0,3,1]));
  assert.equal(out.indices.length, 6);
  assert.equal(out.positions.length, 18);
  assert.deepEqual(Array.from(out.normals), [0,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0]);
});
const assets = new URL('../assets/', import.meta.url);
const read = (n:string) => readFileSync(new URL(n,assets));
const ab = (b:Buffer<ArrayBuffer>) => b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
test('position pack retains oriented topology and exact assembly/print coordinates', {skip:!existsSync(new URL('geometry.positions.bin',assets))}, async () => {
  const {MeshoptDecoder} = await import('../frontend/vendor/meshopt_decoder.mjs');await MeshoptDecoder.ready;
  const model=parseModelManifest(JSON.parse(read('model.json').toString('utf8'))), old=unpackGeometry(ab(read('geometry.pack.bin')),model);
  const data=ab(read('geometry.positions.bin')), meshes=api.decodePositions(data,MeshoptDecoder,model);
  assert.equal(meshes.length,model.parts.length+model.hardware.length);
  for(const [j,p] of [...model.parts,...model.hardware].entries()) {
    const g=p.geometry, m=meshes[j]!, pos=new Float32Array(old,g.positionOffset,g.vertexCount*3), idx=new Uint32Array(old,g.indexOffset,g.indexCount);
    const key=(a:Float32Array,i:number)=>Array.from(a.subarray(i*3,i*3+3)).join(',');
    const faces=(a:Float32Array,i:Uint32Array)=>{const out=[];for(let t=0;t<i.length;t+=3){const v=[key(a,i[t]!),key(a,i[t+1]!),key(a,i[t+2]!)];out.push([v.join('/'),[v[1],v[2],v[0]].join('/'),[v[2],v[0],v[1]].join('/')].sort()[0]);}return out.sort();};
    assert.deepEqual(faces(m.positions,m.indices),faces(pos,idx),'id'in p?String(p.id||p.name):p.name);
    if('printPositionOffset'in p&&typeof p.printPositionOffset==='number') {
      const print=new Float32Array(old,p.printPositionOffset,g.vertexCount*3), byPosition=new Map();
      for(let v=0;v<g.vertexCount;v++)byPosition.set(key(pos,v),Array.from(print.subarray(v*3,v*3+3)));
      for(let v=0;v<m.positions.length/3;v++)assert.deepEqual(m.printMatrix!.map(a=>Math.fround(a[0]!*m.positions[v*3]!+a[1]!*m.positions[v*3+1]!+a[2]!*m.positions[v*3+2]!+a[3]!)),byPosition.get(key(m.positions,v)));
    }
  }
  assert.throws(()=>api.decodePositions(data,MeshoptDecoder,{...model,source_sha256:'wrong'}),/match/);
  assert.throws(()=>api.decodePositions(data.slice(0,100),MeshoptDecoder,model),/Invalid/);
});
