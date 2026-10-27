/** DDG1 transport packer. Manufacturing continues to use the original source 3MF. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { GeometryModel, Matrix3x4 } from '../frontend/shared/types.js';
import type { PackedMesh } from '../frontend/shared/geometry-pack.js';
import { geometryModel } from '../frontend/shared/guards.js';
export const PRINT_TOLERANCE = 0.01;
type Vector = [number, number, number];
export function zigzag16(values: ArrayLike<number>): Uint16Array {
  const out = new Uint16Array(values.length); let previous = 0;
  for (let i = 0; i < values.length; i++) { const value = values[i]!, delta = (value - previous) & 0xffff, signed = delta >= 0x8000 ? delta - 0x10000 : delta; out[i] = ((signed << 1) ^ (signed >> 15)) & 0xffff; previous = value; }
  return out;
}
export function planes(stream: Uint16Array): Buffer { const bytes = Buffer.alloc(stream.length * 2); for (let i = 0; i < stream.length; i++) { bytes[i] = stream[i]! & 255; bytes[stream.length + i] = stream[i]! >> 8; } return bytes; }
function roundEven(value: number): number { const floor = Math.floor(value), fraction = value - floor; return fraction === 0.5 ? floor % 2 === 0 ? floor : floor + 1 : Math.round(value); }
function quantize(positions: readonly number[], count: number) {
  const lo: Vector = [Infinity, Infinity, Infinity], high: Vector = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i++) for (let k = 0; k < 3; k++) { const value = positions[i * 3 + k]!; lo[k] = Math.min(lo[k]!, value); high[k] = Math.max(high[k]!, value); }
  const scale = high.map((value, k) => value - lo[k]! || 1), q = [0,1,2].map(k => Array.from({length:count},(_,i)=>roundEven((positions[i*3+k]!-lo[k]!)/scale[k]!*65535)));
  return { lo, scale, q, stream:Buffer.concat(q.map(axis=>planes(zigzag16(axis)))) };
}
function solve(rows: readonly number[][], rhs: readonly number[]): number[] {
  const matrix = rows.map((row, index) => [...row, rhs[index]!]);
  for (let c=0;c<4;c++) {
    let pivot=c; for(let r=c+1;r<4;r++) if(Math.abs(matrix[r]![c]!)>Math.abs(matrix[pivot]![c]!))pivot=r;
    [matrix[c],matrix[pivot]]=[matrix[pivot]!,matrix[c]!]; if(Math.abs(matrix[c]![c]!)<1e-12)throw new RangeError('Singular matrix');
    for(let r=0;r<4;r++) if(r!==c){const factor=matrix[r]![c]!/matrix[c]![c]!;matrix[r]=matrix[r]!.map((value,k)=>value-factor*matrix[c]![k]!);}
  }
  return matrix.map((row,i)=>row[4]!/row[i]!);
}
export function fitTransform(source: readonly number[], destination: readonly number[], count: number): Matrix3x4 | null {
  const points = Array.from({length:count},(_,i):Vector=>[source[i*3]!,source[i*3+1]!,source[i*3+2]!]);
  const sub=(a:Vector,b:Vector):Vector=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], cross=(a:Vector,b:Vector):Vector=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a:Vector,b:Vector)=>a.reduce((sum,value,k)=>sum+value*b[k]!,0);
  const maximum=(value:(index:number)=>number)=>{let best=0;for(let i=1;i<count;i++)if(value(i)>value(best))best=i;return best;};
  const i0=0,i1=maximum(i=>dot(sub(points[i]!,points[i0]!),sub(points[i]!,points[i0]!))),axis=sub(points[i1]!,points[i0]!);
  const i2=maximum(i=>{const vector=cross(sub(points[i]!,points[i0]!),axis);return dot(vector,vector);}),normal=cross(axis,sub(points[i2]!,points[i0]!)),i3=maximum(i=>Math.abs(dot(sub(points[i]!,points[i0]!),normal)));
  const selected=[i0,i1,i2,i3],rows=selected.map(i=>[...points[i]!,1]);let matrix:Matrix3x4;
  try{matrix=[solve(rows,selected.map(i=>destination[i*3]!)),solve(rows,selected.map(i=>destination[i*3+1]!)),solve(rows,selected.map(i=>destination[i*3+2]!))];}catch(error){if(error instanceof RangeError)return null;throw error;}
  for(let i=0;i<count;i++){const [x,y,z]=points[i]!;for(let k=0;k<3;k++){const row=matrix[k]!;if(Math.abs(row[0]!*x+row[1]!*y+row[2]!*z+row[3]!-destination[i*3+k]!)>PRINT_TOLERANCE)return null;}}
  return matrix;
}
export function pack(model: GeometryModel, binary: Uint8Array): Buffer {
  const source=Buffer.from(binary.buffer,binary.byteOffset,binary.byteLength),meshes:PackedMesh[]=[],blobs:Buffer[]=[];let offset=0;
  const add=(data:Buffer):number[]=>{const start=offset;blobs.push(data);offset+=data.length;return[start,data.length];};
  const floats=(at:number,count:number)=>Array.from({length:count},(_,i)=>source.readFloatLE(at+i*4));
  for(const [kind,items]of [['part',model.parts],['hardware',model.hardware]]as const){
    for(const item of items){
      const g=item.geometry,n=g.vertexCount,m=g.indexCount;if(n>65536)throw new RangeError('mesh too large for 16-bit indices');if(n<1)throw new RangeError('Empty mesh geometry');
      const positions=floats(g.positionOffset,n*3),quantized=quantize(positions,n),indices=Array.from({length:m},(_,i)=>source.readUInt32LE(g.indexOffset+i*4));
      const mesh:PackedMesh={kind,...g,min:quantized.lo,scale:quantized.scale,positions:add(quantized.stream),indices:add(planes(zigzag16(indices)))};
      for(let k=0;k<3;k++){const step=quantized.scale[k]!/65535;for(let i=0;i<n;i++)if(Math.abs(quantized.lo[k]!+quantized.q[k]![i]!/65535*quantized.scale[k]!-positions[i*3+k]!)>step)throw new Error('quantization check failed');}
      if(kind==='part'){
        if(!('printPositionOffset'in item))throw new TypeError('Missing print position offset');
        mesh.printPositionOffset=item.printPositionOffset;const printed=floats(item.printPositionOffset,n*3),matrix=fitTransform(positions,printed,n);
        if(matrix)mesh.printMatrix=matrix;else{const q=quantize(printed,n);mesh.print={min:q.lo,scale:q.scale,positions:add(q.stream)};}
      }
      meshes.push(mesh);
    }
  }
  const header=Buffer.from(JSON.stringify({format:1,geometrySha256:createHash('sha256').update(source).digest('hex'),byteLength:source.length,meshes})),prefix=Buffer.alloc(8);prefix.write('DDG1');prefix.writeUInt32LE(header.length+(4-header.length%4)%4,4);
  return Buffer.concat([prefix,header,Buffer.alloc((4-header.length%4)%4,32),...blobs]);
}
export async function writePack(assets: string):Promise<number>{const model:unknown=JSON.parse(await readFile(join(assets,'model.json'),'utf8'));if(!geometryModel(model))throw new TypeError('Invalid geometry model');const data=pack(model,await readFile(join(assets,'geometry.bin')));await writeFile(join(assets,'geometry.pack.bin'),data);return data.length;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const target=process.argv[2]??resolve(import.meta.dirname,'../assets'),size=await writePack(target);console.log('geometry.pack.bin: '+size+' bytes (geometry.bin: '+(await stat(join(target,'geometry.bin'))).size+')');}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}}
