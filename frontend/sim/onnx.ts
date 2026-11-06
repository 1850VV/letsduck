// Reads the float32 initializers of a small ONNX model (ModelProto.graph.initializer) without an ONNX runtime.
// Only the protobuf fields an exported MLP uses are decoded: TensorProto dims(1), data_type(2), float_data(4), name(8), raw_data(9).
export interface Tensor {dims:number[];data:Float32Array}

class Reader {
 pos=0;
 constructor(readonly buf:Uint8Array,readonly end=buf.length){}
 varint():number{let shift=0,out=0;for(;;){const b=this.buf[this.pos++]!;out+=(b&127)*2**shift;if(b<128)return out;shift+=7;}}
 /** Yields [field, varint value, sub-reader for length-delimited fields]. */
 *fields():Generator<[number,number,Reader|null]>{
  while(this.pos<this.end){
   const key=this.varint(),field=Math.floor(key/8),wire=key&7;
   if(wire===2){const len=this.varint(),sub=new Reader(this.buf,this.pos+len);sub.pos=this.pos;this.pos+=len;yield [field,0,sub];}
   else if(wire===0)yield [field,this.varint(),null];
   else{if(wire===1)this.pos+=8;else if(wire===5)this.pos+=4;else throw new Error('Unsupported ONNX wire type '+wire);yield [field,0,null];}
  }
 }
 bytes():Uint8Array{return this.buf.subarray(this.pos,this.end);}
}

function tensor(r:Reader):[string,Tensor]{
 let name='',raw:Uint8Array|null=null;const dims:number[]=[],floats:number[]=[];
 for(const [field,value,sub] of r.fields()){
  if(field===1){if(sub)while(sub.pos<sub.end)dims.push(sub.varint());else dims.push(value);}
  else if(field===4&&sub){const v=new DataView(sub.buf.buffer,sub.buf.byteOffset+sub.pos,sub.end-sub.pos);for(let i=0;i<v.byteLength;i+=4)floats.push(v.getFloat32(i,true));}
  else if(field===8&&sub)name=new TextDecoder().decode(sub.bytes());
  else if(field===9&&sub)raw=sub.bytes();
 }
 let data:Float32Array;
 if(raw){const copy=raw.slice();data=new Float32Array(copy.buffer,0,copy.byteLength/4);}else data=Float32Array.from(floats);
 return [name,{dims,data}];
}

/** Every float32 initializer in the model, by name. */
export function initializers(bytes:Uint8Array):Map<string,Tensor>{
 const out=new Map<string,Tensor>();
 for(const [field,,graph] of new Reader(bytes).fields()){
  if(field!==7||!graph)continue;
  for(const [gf,,init] of graph.fields())if(gf===5&&init){const [name,t]=tensor(init);out.set(name,t);}
 }
 return out;
}
