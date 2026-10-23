// Adapted from the user-supplied exp.mjs spike. Same crease rule as the pinned Three.js.
// Work scratch arrays remain in the Worker; only final indexed arrays are transferred.
const CREASE = Math.cos(Math.PI / 5);
export function quantizePosition(positions,bits) {
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i++){const k=i%3;lo[k]=Math.min(lo[k],positions[i]);hi[k]=Math.max(hi[k],positions[i]);}
  const scale=hi.map((v,k)=>v-lo[k]||1),max=2**bits-1,shift=16-bits;
  const bytes=new Uint8Array(positions.length/3*8),q=new Uint16Array(bytes.buffer);
  for(let i=0;i<positions.length/3;i++)for(let k=0;k<3;k++)q[i*4+k]=Math.round((positions[i*3+k]-lo[k])/scale[k]*max)<<shift;
  return {bytes,min:lo,scale,bits};
}
export function restorePosition(bytes,meta) {
  const q=new Uint16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2),p=new Float32Array(bytes.byteLength/8*3),max=2**meta.bits-1,shift=16-meta.bits;
  for(let i=0;i<p.length/3;i++)for(let k=0;k<3;k++)p[i*3+k]=meta.min[k]+(q[i*4+k]>>>shift)/max*meta.scale[k];
  return p;
}
const MAX_PACK=16_000_000,MAX_VERTICES=1<<20,MAX_INDICES=1<<22; // the model's meshes stay below 65 536 vertices
// Incremental POS1 reader. The pack stores each mesh's streams contiguously and in model order, so a
// mesh decodes as soon as its bytes have arrived, overlapping the download. The model description
// may arrive later: every mesh is checked against it before finish() returns anything, so a pack
// for another model still fails. decodePositions() is the same reader given one buffer.
export function positionReader(decoder) {
  let bytes=new Uint8Array(1<<20),size=0,length=-1,h=null,items=null,checked=0;const out=[];
  function grow(need){if(need>MAX_PACK)throw Error('Invalid position pack size');if(need<=bytes.length)return;const next=new Uint8Array(Math.min(MAX_PACK,Math.max(need,bytes.length*2)));next.set(bytes.subarray(0,size));bytes=next;}
  // End of a stream inside the data section; malformed ranges fail at once, missing bytes wait.
  function end([offset,size]=[]){if(!Number.isInteger(offset)||!Number.isInteger(size)||offset<0||size<=0)throw Error('Invalid stream range');return offset+size;}
  function decode(m,data){
    if(m.bits!==16||![m.vertices,m.triangles].every(Number.isInteger)||m.vertices<1||m.vertices>MAX_VERTICES||m.triangles<0||m.triangles*3>MAX_INDICES||
      ![m.min,m.scale].every(a=>Array.isArray(a)&&a.length===3&&a.every(Number.isFinite))||m.scale.some(v=>v<=0))throw Error('Invalid position metadata');
    const bytes=new Uint8Array(m.vertices*8),indices=new Uint32Array(m.triangles*3),range=r=>data.subarray(r[0],end(r));
    decoder.decodeVertexBuffer(bytes,m.vertices,8,range(m.v));
    decoder.decodeIndexBuffer(new Uint8Array(indices.buffer),indices.length,4,range(m.i));
    if(indices.some(i=>i>=m.vertices))throw Error('Invalid vertex index');
    let printMatrix=m.printMatrix;
    if(m.printMatrix64){
      const [offset]=m.printMatrix64;
      const view=new DataView(data.buffer,data.byteOffset+offset,96);
      printMatrix=Array.from({length:3},(_,r)=>Array.from({length:4},(_,c)=>view.getFloat64((r*4+c)*8,true)));
    }
    if(m.kind==='part'&&(!printMatrix||printMatrix.length!==3||!printMatrix.every(a=>a.length===4&&a.every(Number.isFinite))))throw Error('Invalid print matrix');
    return {...m,...(printMatrix?{printMatrix}:{}),positions:restorePosition(bytes,m),indices};
  }
  function check(m,item){if(m.id!==item.id||m.kind!==item.kind||m.vertices>item.geometry.vertexCount||m.triangles*3!==item.geometry.indexCount)throw Error('Position pack does not match model');}
  function advance(){
    if(length<0){
      if(size<8)return;
      const d=new DataView(bytes.buffer,0,8);if(d.getUint32(0,true)!==0x31534f50)throw Error('Invalid POS1');
      length=d.getUint32(4,true);if(length>200_000)throw Error('Invalid position header');
    }
    if(!h){if(size<8+length)return;h=JSON.parse(new TextDecoder().decode(bytes.subarray(8,8+length)));if(!Array.isArray(h.meshes))throw Error('Invalid position header');}
    if(items&&!checked&&(h.version!==1||h.source!==items.source||h.meshes.length!==items.length))throw Error('Position pack does not match model');
    while(out.length<h.meshes.length){
      const m=h.meshes[out.length],data=bytes.subarray(8+length,size);
      if(m.printMatrix64&&(!Array.isArray(m.printMatrix64)||!Number.isInteger(m.printMatrix64[0])||m.printMatrix64[0]<0||m.printMatrix64[1]!==96))throw Error('Invalid print matrix range');
      if(Math.max(end(m.v),end(m.i),m.printMatrix64?end(m.printMatrix64):0)>data.length)break;
      if(items)check(m,items[out.length]);
      out.push(decode(m,data));
    }
    if(items)for(;checked<out.length;checked++)check(out[checked],items[checked]);
  }
  return {
    // Feed bytes in arrival order; returns the meshes decoded so far (a growing array).
    push(chunk){grow(size+chunk.length);bytes.set(chunk,size);size+=chunk.length;advance();return out;},
    setModel(model){
      items=Object.assign([...model.parts.map(p=>({...p,kind:'part'})),...model.hardware.map(p=>({...p,id:p.name,kind:'hardware'}))],{source:model.source_sha256});
      advance();return out;
    },
    finish(){
      advance();
      if(length<0)throw Error(size<8?'Invalid position pack size':'Invalid POS1');
      if(!h)throw Error('Invalid position header');
      if(!items)throw Error('Position pack does not match model');
      if(out.length<h.meshes.length)throw Error('Invalid stream range');
      return out;
    },
  };
}
export function decodePositions(buffer,decoder,model) {
  if(buffer.byteLength<8||buffer.byteLength>MAX_PACK)throw Error('Invalid position pack size');
  const reader=positionReader(decoder);reader.setModel(model);reader.push(new Uint8Array(buffer));return reader.finish();
}
export function creased(positions, indices) {
  const n = positions.length / 3, T = indices.length / 3, mul = (1 + 1e-10) * 1e2;
  const weld = new Int32Array(n), seen = new Map();
  for (let i = 0; i < n; i++) {
    const key = `${~~(positions[i * 3] * mul)},${~~(positions[i * 3 + 1] * mul)},${~~(positions[i * 3 + 2] * mul)}`;
    let id = seen.get(key); if (id === undefined) seen.set(key, id = seen.size); weld[i] = id;
  }
  const W = seen.size, fn = new Float32Array(T * 3), count = new Int32Array(W + 1);
  for (let t = 0; t < T; t++) {
    const a = indices[t * 3] * 3, b = indices[t * 3 + 1] * 3, c = indices[t * 3 + 2] * 3;
    const ux = positions[c] - positions[b], uy = positions[c + 1] - positions[b + 1], uz = positions[c + 2] - positions[b + 2];
    const vx = positions[a] - positions[b], vy = positions[a + 1] - positions[b + 1], vz = positions[a + 2] - positions[b + 2];
    let x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx; const l = Math.hypot(x, y, z) || 1;
    fn[t * 3] = x / l; fn[t * 3 + 1] = y / l; fn[t * 3 + 2] = z / l;
    for (let k = 0; k < 3; k++) count[weld[indices[t * 3 + k]] + 1]++;
  }
  for (let i = 0; i < W; i++) count[i + 1] += count[i];
  const adj = new Int32Array(T * 3), fill = count.slice(0, W);
  for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) adj[fill[weld[indices[t * 3 + k]]]++] = t;
  const outPos = new Float32Array(T * 9), outNrm = new Float32Array(T * 9), outIdx = new Uint32Array(T * 3), head = new Int32Array(n).fill(-1), nextOf = new Int32Array(T * 3); let out = 0;
  for (let t = 0; t < T; t++) for (let k = 0; k < 3; k++) {
    const v = indices[t * 3 + k], w = weld[v]; let x = 0, y = 0, z = 0;
    for (let j = count[w]; j < count[w + 1]; j++) {
      const f = adj[j]; if (fn[t * 3] * fn[f * 3] + fn[t * 3 + 1] * fn[f * 3 + 1] + fn[t * 3 + 2] * fn[f * 3 + 2] > CREASE) {x += fn[f * 3]; y += fn[f * 3 + 1]; z += fn[f * 3 + 2];}
    }
    const l = Math.hypot(x, y, z) || 1; x /= l; y /= l; z /= l;
    let id = head[v];
    while (id >= 0 && Math.abs(outNrm[id * 3] - x) + Math.abs(outNrm[id * 3 + 1] - y) + Math.abs(outNrm[id * 3 + 2] - z) >= 1e-6) id = nextOf[id];
    if (id < 0) {id = out++; outPos[id * 3] = positions[v * 3]; outPos[id * 3 + 1] = positions[v * 3 + 1]; outPos[id * 3 + 2] = positions[v * 3 + 2]; outNrm[id * 3] = x; outNrm[id * 3 + 1] = y; outNrm[id * 3 + 2] = z; nextOf[id] = head[v]; head[v] = id;}
    outIdx[t * 3 + k] = id;
  }
  return {positions: outPos.slice(0, out * 3), normals: outNrm.slice(0, out * 3), indices: outIdx};
}
