import type { GeometryModel, PositionMetadata } from './types.js';
import { record, positionMetadata } from './guards.js';
export interface PositionDecoder { decodeVertexBuffer(target:Uint8Array,count:number,stride:number,source:Uint8Array):void; decodeIndexBuffer(target:Uint8Array,count:number,stride:number,source:Uint8Array):void }
// Adapted from the user-supplied exp.mjs spike. Same crease rule as the pinned Three.js.
// Work scratch arrays remain in the Worker; only final indexed arrays are transferred.
const CREASE = Math.cos(Math.PI / 5);
export function quantizePosition(positions:ArrayLike<number>,bits:number) {
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i++){const k=i%3;lo[k]=Math.min(lo[k]!,positions[i]!);hi[k]=Math.max(hi[k]!,positions[i]!);}
  const scale=hi.map((v,k)=>v-lo[k]!||1),max=2**bits-1,shift=16-bits;
  const bytes=new Uint8Array(positions.length/3*8),q=new Uint16Array(bytes.buffer);
  for(let i=0;i<positions.length/3;i++)for(let k=0;k<3;k++)q[i*4+k]=Math.round((positions[i*3+k]!-lo[k]!)/scale[k]!*max)<<shift;
  return {bytes,min:lo,scale,bits};
}
export function restorePosition(bytes:Uint8Array,meta:Pick<PositionMetadata,'min'|'scale'|'bits'>) {
  const q=new Uint16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2),p=new Float32Array(bytes.byteLength/8*3),max=2**meta.bits-1,shift=16-meta.bits;
  for(let i=0;i<p.length/3;i++)for(let k=0;k<3;k++)p[i*3+k]=meta.min[k]!+(q[i*4+k]!>>>shift)/max*meta.scale[k]!;
  return p;
}
export function decodePositions(buffer:ArrayBuffer,decoder:PositionDecoder,model:GeometryModel) {
  if(buffer.byteLength<8||buffer.byteLength>16_000_000)throw Error('Invalid position pack size');
  const d=new DataView(buffer);if(d.getUint32(0,true)!==0x31534f50)throw Error('Invalid POS1');
  const length=d.getUint32(4,true);if(length>200_000||length+8>buffer.byteLength)throw Error('Invalid position header');
  const h:unknown=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,8,length))),data=new Uint8Array(buffer,8+length);
  if(!record(h)||h.version!==1||h.source!==model.source_sha256||!Array.isArray(h.meshes)||!h.meshes.every(positionMetadata))throw Error('Position pack does not match model');
  const items=[...model.parts.map(p=>({...p,kind:'part'})),...model.hardware.map(p=>({...p,id:p.name,kind:'hardware'}))];
  if(h.meshes.length!==items.length)throw Error('Position pack does not match model');
  const range=([offset,size]:number[]=[])=>{if(typeof offset!=='number'||typeof size!=='number'||!Number.isInteger(offset)||!Number.isInteger(size)||offset<0||size<=0||offset+size>data.length)throw Error('Invalid stream range');return data.subarray(offset,offset+size);};
  return h.meshes.map((m,j)=>{
    const item=items[j]!;
    if(m.id!==item.id||m.kind!==item.kind||m.vertices<1||m.vertices>item.geometry.vertexCount||m.triangles*3!==item.geometry.indexCount||m.bits!==16)throw Error('Position pack does not match model');
    if(![m.vertices,m.triangles].every(Number.isInteger)||![m.min,m.scale].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite))||m.scale.some(v=>v<=0))throw Error('Invalid position metadata');
    const bytes=new Uint8Array(m.vertices*8),indices=new Uint32Array(m.triangles*3);
    decoder.decodeVertexBuffer(bytes,m.vertices,8,range(m.v));
    decoder.decodeIndexBuffer(new Uint8Array(indices.buffer),indices.length,4,range(m.i));
    if(indices.some(i=>i>=m.vertices))throw Error('Invalid vertex index');
    let printMatrix=m.printMatrix;
    if(m.printMatrix64){
      const [offset,size]=m.printMatrix64;
      if(typeof offset!=='number'||!Number.isInteger(offset)||offset<0||size!==96||offset+size>data.length)throw Error('Invalid print matrix range');
      const view=new DataView(data.buffer,data.byteOffset+offset,size);
      const row=(r:number)=>Array.from({length:4},(_,c)=>view.getFloat64((r*4+c)*8,true));printMatrix=[row(0),row(1),row(2)];
    }
    if(m.kind==='part'&&(!printMatrix||printMatrix.length!==3||!printMatrix.every(a=>a.length===4&&a.every(Number.isFinite))))throw Error('Invalid print matrix');
    return {...m,...(printMatrix?{printMatrix}:{}),positions:restorePosition(bytes,m),indices};
  });
}
export function creased(positions:Float32Array, indices:Uint32Array) {
  const n = positions.length / 3, T = indices.length / 3, mul = (1 + 1e-10) * 1e2;
  // Weld vertices that share a 0.01 mm grid cell: an integer hash table, since a string key per vertex was most of the load time.
  const weld = new Int32Array(n), cells = new Int32Array(n * 3), mask = (1 << 32 - Math.clz32(n * 2)) - 1, slots = new Int32Array(mask + 1).fill(-1);
  let W = 0;
  for (let i = 0; i < n; i++) {
    const x = ~~(positions[i * 3]! * mul), y = ~~(positions[i * 3 + 1]! * mul), z = ~~(positions[i * 3 + 2]! * mul);
    let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) & mask, id;
    while ((id = slots[h]!) >= 0 && (cells[id * 3]! !== x || cells[id * 3 + 1]! !== y || cells[id * 3 + 2]! !== z)) h = h + 1 & mask;
    if (id < 0) {id = slots[h] = W++; cells[id * 3] = x; cells[id * 3 + 1] = y; cells[id * 3 + 2] = z;}
    weld[i] = id;
  }
  const fn = new Float32Array(T * 3), count = new Int32Array(W + 1);
  for (let t = 0; t < T; t++) {
    const a = indices[t * 3]! * 3, b = indices[t * 3 + 1]! * 3, c = indices[t * 3 + 2]! * 3;
    const ux = positions[c]! - positions[b]!, uy = positions[c + 1]! - positions[b + 1]!, uz = positions[c + 2]! - positions[b + 2]!;
    const vx = positions[a]! - positions[b]!, vy = positions[a + 1]! - positions[b + 1]!, vz = positions[a + 2]! - positions[b + 2]!;
    let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx; const l = Math.hypot(x, y, z) || 1;
    fn[t * 3] = x / l; fn[t * 3 + 1] = y / l; fn[t * 3 + 2] = z / l;
    for (let k = 0; k < 3; k++) count[weld[indices[t * 3 + k]!]! + 1]!++;
  }
  for (let i = 0; i < W; i++) count[i + 1]! += count[i]!;
  const adj = new Int32Array(T * 3), fill = count.slice(0, W);
  for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) adj[fill[weld[indices[t * 3 + k]!]!]!++] = t;
  const outPos = new Float32Array(T * 9), outNrm = new Float32Array(T * 9), outIdx = new Uint32Array(T * 3), head = new Int32Array(n).fill(-1), nextOf = new Int32Array(T * 3); let out = 0;
  for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) {
    const v = indices[t * 3 + k]!, w = weld[v]!; let x = 0, y = 0, z = 0;
    for (let j = count[w]!; j < count[w + 1]!; j++) {
      const f = adj[j]!; if (fn[t * 3]! * fn[f * 3]! + fn[t * 3 + 1]! * fn[f * 3 + 1]! + fn[t * 3 + 2]! * fn[f * 3 + 2]! > CREASE) {x += fn[f * 3]!; y += fn[f * 3 + 1]!; z += fn[f * 3 + 2]!;}
    }
    const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    let id = head[v]!;
    while (id >= 0 && Math.abs(outNrm[id * 3]! - x) + Math.abs(outNrm[id * 3 + 1]! - y) + Math.abs(outNrm[id * 3 + 2]! - z) >= 1e-6) id = nextOf[id]!;
    if (id < 0) {id = out++; outPos[id * 3] = positions[v * 3]!; outPos[id * 3 + 1] = positions[v * 3 + 1]!; outPos[id * 3 + 2] = positions[v * 3 + 2]!; outNrm[id * 3] = x; outNrm[id * 3 + 1] = y; outNrm[id * 3 + 2] = z; nextOf[id] = head[v]!; head[v] = id;}
    outIdx[t * 3 + k] = id;
  }
  return {positions: outPos.slice(0, out * 3), normals: outNrm.slice(0, out * 3), indices: outIdx};
}
