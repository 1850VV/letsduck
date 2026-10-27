// Build-only meshoptimizer dependency. The renderer consumes the same shared TypeScript codec.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pathToFileURL} from 'node:url';
import type {PositionMetadata} from '../frontend/shared/types.js';
import {record,geometryModel,matrix3x4} from '../frontend/shared/guards.js';
import assert from 'node:assert/strict';
import {brotliCompressSync,gzipSync,constants} from 'node:zlib';
import {MeshoptEncoder as enc,MeshoptDecoder as dec} from 'meshoptimizer';
import {quantizePosition,restorePosition,decodePositions} from '../frontend/shared/positions.js';
import {unpackGeometry} from '../frontend/shared/geometry-pack.js';
export async function packPositions(assets:string) {
await Promise.all([enc.ready,dec.ready]);
const model:unknown=JSON.parse(await fs.readFile(path.join(assets,'model.json'),'utf8')), pack=await fs.readFile(path.join(assets,'geometry.pack.bin'));
if(!geometryModel(model))throw new TypeError('Invalid geometry model');
const buffer=pack.buffer.slice(pack.byteOffset,pack.byteOffset+pack.length), binary=unpackGeometry(buffer,model);
const ddg:unknown=JSON.parse(pack.subarray(8,8+pack.readUInt32LE(4)).toString());if(!record(ddg)||!Array.isArray(ddg.meshes))throw new TypeError('Invalid DDG1 metadata');const streams:Buffer[]=[],meshes:PositionMetadata[]=[];let offset=0;
const add=(data:Uint8Array):number[]=>{const span=[offset,data.length];streams.push(Buffer.from(data));offset+=data.length;return span;};
for(const [j,p] of [...model.parts,...model.hardware].entries()) {
  const g=p.geometry, original=new Float32Array(binary,g.positionOffset,g.vertexCount*3), indices=new Uint32Array(binary,g.indexOffset,g.indexCount).slice();
  const [remap,count]=enc.reorderMesh(indices,true,true),pos=new Float32Array(count*3);
  for(let v=0;v<remap.length;v++)if(remap[v]!==0xffffffff)pos.set(original.subarray(v*3,v*3+3),remap[v]!*3);
  const q=quantizePosition(pos,16);assert.deepEqual(restorePosition(q.bytes,q),pos,'16-bit positions must retain DDG1 precision');
  // Level 3 in meshoptimizer 1.0.1 failed round-trip tests; never select it.
  const vb=enc.encodeVertexBufferLevel(q.bytes,count,8,2,1),back=new Uint8Array(q.bytes.length);
  dec.decodeVertexBuffer(back,count,8,vb);assert.deepEqual(back,q.bytes,'Vertex byte round trip');
  const ib=enc.encodeIndexBuffer(new Uint8Array(indices.buffer),indices.length,4),backIdx=new Uint32Array(indices.length);
  dec.decodeIndexBuffer(new Uint8Array(backIdx.buffer),backIdx.length,4,ib);
  for(let t=0;t<indices.length;t+=3)assert.ok([0,1,2].some(k=>[0,1,2].every(c=>indices[t+(c+k)%3]===backIdx[t+c])),'Oriented triangle round trip');
  const m:PositionMetadata={id:'id'in p?p.id:p.name,kind:j<model.parts.length?'part':'hardware',vertices:count,triangles:indices.length/3,min:q.min,scale:q.scale,bits:16,v:add(vb),i:add(ib)};
  if(j<model.parts.length) {
    const metadata:unknown=ddg.meshes[j];if(!record(metadata)||!matrix3x4(metadata.printMatrix))throw new TypeError('Invalid print matrix');const matrix=metadata.printMatrix,bytes=Buffer.alloc(96);assert.equal(matrix.flat().length,12);
    matrix.flat().forEach((v,i)=>bytes.writeDoubleLE(v,i*8));m.printMatrix64=add(bytes);
  }
  meshes.push(m);
}
let header=Buffer.from(JSON.stringify({version:1,source:model.source_sha256,meshes}));header=Buffer.concat([header,Buffer.alloc((4-header.length%4)%4,32)]);
const prefix=Buffer.alloc(8);prefix.writeUInt32LE(0x31534f50);prefix.writeUInt32LE(header.length,4);
const data=Buffer.concat([prefix,header,...streams]);decodePositions(data.buffer.slice(data.byteOffset,data.byteOffset+data.length),dec,model);
const name=path.join(assets,'geometry.positions.bin'),br=brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:11}}),gz=gzipSync(data,{level:9});
await fs.writeFile(name+'.tmp',data);await fs.rename(name+'.tmp',name);
await fs.writeFile(name+'.br',br);await fs.writeFile(name+'.gz',gz);
return {meshes:meshes.length,triangles:meshes.reduce((n,m)=>n+m.triangles,0),bytes:data.length,br:br.length,gzip:gz.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await packPositions(path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'../assets')))));}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}}
