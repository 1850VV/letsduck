import {creased,decodePositions,positionReader} from './positions.mjs';
import {MeshoptDecoder} from '../vendor/meshopt_decoder.mjs';
const transfer=meshes=>meshes.flatMap(m=>[m.positions.buffer,m.normals.buffer,m.indices.buffer]);
function printed(m){
  if(!m.printMatrix)throw Error('Missing print matrix '+m.id);
  const positions=new Float32Array(m.positions.length);
  for(let i=0;i<positions.length;i+=3)for(let k=0;k<3;k++){
    const a=m.printMatrix[k];positions[i+k]=a[0]*m.positions[i]+a[1]*m.positions[i+1]+a[2]*m.positions[i+2]+a[3];
  }
  return positions;
}
let failed=false;
const fail=error=>{failed=true;self.postMessage({error:String(error)});};

// Startup ({type:'fetch', url}): the Worker downloads the pack itself and decodes each mesh, with its
// normals, as the bytes arrive, so neither waits for the page's main thread. {type:'model'} may come
// at any point; every mesh is checked against it before the reply, which also carries the joined pack
// (for the print geometry an export may ask for later) and timing for the page's load marks.
let reader=null,done=[],chunks=[],size=0,model=false,ended=false;
const now=()=>performance.timeOrigin+performance.now(),stats={receivedAt:0,busyMs:0,bytes:0};
const normals=meshes=>{while(done.length<meshes.length){const m=meshes[done.length];done.push({...m,...creased(m.positions,m.indices)});}};
function progress(){
  if(!model||!ended)return;
  normals(reader.finish());
  const packed=new Uint8Array(size);let at=0;for(const chunk of chunks){packed.set(chunk,at);at+=chunk.length;}
  self.postMessage({meshes:done,packed:packed.buffer,stats},[...transfer(done),packed.buffer]);
}
function take(bytes){
  const start=now();
  chunks.push(bytes);size+=bytes.length;normals(reader.push(bytes));stats.busyMs+=now()-start;
}
async function download(url){
  const response=await fetch(url);if(!response.ok)throw Error('Position pack unavailable: '+response.status);
  const source=response.body.getReader();
  for(let next;!(next=await source.read()).done;){if(failed)return source.cancel();take(next.value);}
  stats.receivedAt=now();stats.bytes=performance.getEntriesByName(response.url).at(-1)?.encodedBodySize||0;
  self.postMessage({received:true});
  ended=true;progress();
}
let queue=MeshoptDecoder.ready.then(()=>{reader=positionReader(MeshoptDecoder);});
self.onmessage=({data})=>{queue=queue.then(()=>{
  if(failed)return;
  // Downloads in their own task, so that the model message is handled meanwhile.
  if(data.type==='fetch'){download(data.url).catch(fail);return;}
  if(data.type==='model'){model=true;reader.setModel(data.model);return progress();}
  const meshes=decodePositions(data.buffer,MeshoptDecoder,data.model).filter(m=>!data.print||m.kind==='part').map(m=>({...m,...creased(data.print?printed(m):m.positions,m.indices)}));
  self.postMessage({meshes},transfer(meshes));
}).catch(fail);};
