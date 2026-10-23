import {unpackGeometry} from './geometry-pack.mjs';
const ASSETS=new URL('../assets/',import.meta.url);
async function get(name,type='arrayBuffer') {
  const response=await fetch(new URL(name,ASSETS));if(!response.ok)throw Error(name+': '+response.status);return response[type]();
}
function workerGeometry(buffer,model) {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./positions-worker.mjs',import.meta.url),{type:'module'});
    const end=(error,value)=>{clearTimeout(timeout);worker.terminate();error?reject(error):resolve(value);};
    const timeout=setTimeout(()=>end(Error('Model worker timed out')),20000);
    worker.onerror=e=>{e.preventDefault();end(Error('Model worker failed'));};
    worker.onmessage=({data})=>end(data.error?Error(data.error):null,new Map(data.meshes?.map(m=>[m.kind+':'+m.id,m])));
    worker.postMessage({buffer,model},[buffer]);
  });
}
export async function loadModel() {
  const positions=get('geometry.positions.bin').catch(()=>null);
  const [model,catalog]=await Promise.all([get('model.json','json'),get('catalog.json','json')]);
  // Export intentionally keeps the original topology until its image comparison is approved.
  let legacy;
  const loadLegacy=()=>legacy||=(async()=>{
    try{return unpackGeometry(await get('geometry.pack.bin'),model);}catch{return get('geometry.bin');}
  })().catch(error=>{legacy=null;throw error;});
  let geometry=null,binary=null;
  try{const buffer=await positions;if(buffer)geometry=await workerGeometry(buffer,model);}catch(error){console.warn('Compressed model unavailable; using compatible geometry.',error);}
  if(!geometry)binary=await loadLegacy();
  return {model,catalog,geometry,binary,loadLegacy};
}
