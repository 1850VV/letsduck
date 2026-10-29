import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import * as THREE from '../../frontend/vendor/three.module.js';
import {parseAssemblyManifest} from '../../frontend/assemble/assembly-manifest.js';
import type {createPartGeometry} from '../../frontend/assemble/part-geometry.js';
import type {toCreasedNormals} from '../../frontend/vendor/BufferGeometryUtils.js';

// Bundle the pinned vendor's bare Three import with the same alias as the product.
const root=fileURLToPath(new URL('../../',import.meta.url));
const built=await build({stdin:{contents:'export {createPartGeometry} from "./frontend/assemble/part-geometry.ts"; export {toCreasedNormals} from "./frontend/vendor/BufferGeometryUtils.js";',resolveDir:root},bundle:true,write:false,platform:'node',format:'esm',alias:{three:resolve(root,'frontend/vendor/three.module.js')},logLevel:'silent'});
const api:{createPartGeometry:typeof createPartGeometry;toCreasedNormals:typeof toCreasedNormals}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0]!.text).toString('base64'));

// Catches returning an expanded mesh again, or changing any oriented triangle or crease normal.
test('assembly parts retain indexed triangles and the pinned crease appearance', {skip:!existsSync(new URL('../../assets/assembly/full-assembly.bin',import.meta.url))},()=>{
 const manifest=parseAssemblyManifest(JSON.parse(readFileSync(new URL('../../assets/assembly/full-assembly.json',import.meta.url),'utf8')));
 const bytes=readFileSync(new URL('../../assets/assembly/full-assembly.bin',import.meta.url));
 const binary=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
 let parts=0;
 for(const part of manifest.parts){
  if(/motor/i.test(part.id))continue;
  const positions=new Float32Array(binary,part.positionOffset,part.vertexCount*3).slice(),indices=new Uint32Array(binary,part.indexOffset,part.indexCount).slice();
  const originalPositions=positions.slice(),originalIndices=indices.slice(),referenceInput=new THREE.BufferGeometry();
  referenceInput.setAttribute('position',new THREE.BufferAttribute(positions,3));referenceInput.setIndex(new THREE.BufferAttribute(indices,1));
  const reference=api.toCreasedNormals(referenceInput,Math.PI/5),actual=api.createPartGeometry(positions,indices);
  try{
   assert.ok(actual.index,part.id+' keeps indexed geometry');
   assert.equal(actual.index.count,indices.length,part.id+' keeps triangle count');
   const p=actual.getAttribute('position'),n=actual.getAttribute('normal'),rp=reference.getAttribute('position'),rn=reference.getAttribute('normal');
   for(let corner=0;corner<indices.length;corner++){
    const at=actual.index.getX(corner);
    for(let axis=0;axis<3;axis++){
     assert.equal(p.array[at*3+axis],rp.array[corner*3+axis],part.id+' keeps oriented triangle positions');
     assert.ok(Math.abs(n.array[at*3+axis]!-rn.array[corner*3+axis]!)<1e-6,part.id+' keeps crease normals');
    }
   }
   assert.deepEqual(positions,originalPositions);assert.deepEqual(indices,originalIndices);parts++;
  }finally{actual.dispose();reference.dispose();referenceInput.dispose();}
 }
 assert.ok(parts>0,'licensed assembly includes printed parts');
});
