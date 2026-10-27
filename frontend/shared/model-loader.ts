import {unpackGeometry} from './geometry-pack.js';
import {assetUrl,apiUrl} from './url.js';
import {parseResponseJson} from './json.js';
import {parseModelManifest,parseCatalog,preparedMesh,record} from './guards.js';
import type {GeometryModel,ModelData,PreparedMesh} from './types.js';
async function get(name:string):Promise<ArrayBuffer> {
  const response=await fetch(assetUrl(name));if(!response.ok)throw Error(name+': '+response.status);return response.arrayBuffer();
}
async function manifest(name:string):Promise<unknown> {
  const response=await fetch(assetUrl(name));if(!response.ok)throw Error(name+': '+response.status);return parseResponseJson(response);
}
function startWorker() {
  let worker:Worker|undefined,error:Error|undefined,finish:((cause:unknown,value?:Map<string,PreparedMesh>)=>void)|undefined,timeout:ReturnType<typeof setTimeout>|undefined;
  const dispose=()=>{clearTimeout(timeout);worker?.terminate();};
  const fail=(cause:unknown)=>{error=cause instanceof Error?cause:Error(String(cause));dispose();finish?.(error);};
  try {
    worker=new Worker(new URL('./positions-worker.ts',import.meta.url),{type:'module'});
    worker.onerror=e=>{e.preventDefault();fail(Error('Model worker failed'));};
    worker.onmessageerror=()=>fail(Error('Invalid model worker response'));
  } catch(cause){error=cause instanceof Error?cause:Error(String(cause));}
  return {dispose,decode(buffer:ArrayBuffer,model:GeometryModel,print=false):Promise<Map<string,PreparedMesh>>{
    if(error)return Promise.reject(error);
    const active=worker;if(!active)return Promise.reject(Error('Model worker unavailable'));
    return new Promise((resolve,reject)=>{
      finish=(cause,value)=>{dispose();cause?reject(cause):value?resolve(value):reject(Error('Invalid model worker response'));};
      // Network latency does not consume the decode timeout. Early script errors
      // are retained without an unhandled rejected promise while downloads run.
      timeout=setTimeout(()=>fail(Error('Model worker timed out')),20000);
      active.onmessage=({data}:MessageEvent<unknown>)=>{
        try{if(!record(data))throw Error('Invalid model worker response');if(data.error)throw Error(String(data.error));if(!Array.isArray(data.meshes)||!data.meshes.every(preparedMesh))throw Error('Invalid model worker response');finish?.(null,new Map(data.meshes.map(m=>[m.kind+':'+m.id,m])));}
        catch(cause){fail(cause);}
      };
      try{active.postMessage({buffer,model,print},[buffer]);}catch(cause){fail(cause);}
    });
  }};
}
export async function loadModel():Promise<ModelData> {
  const worker=startWorker();
  try {
    const positions=get('geometry.positions.bin').catch(()=>null);
    const [rawModel,rawCatalog]=await Promise.all([manifest('model.json'),fetch(apiUrl('/catalog')).then(response=>{if(!response.ok)throw Error('Catalogue: '+response.status);return parseResponseJson(response);})]);
    const model=parseModelManifest(rawModel),catalog=parseCatalog(rawCatalog);
    let legacy:Promise<ArrayBuffer>|null|undefined;
    const loadLegacy=()=>legacy||=(async()=>{
      try{return unpackGeometry(await get('geometry.pack.bin'),model);}catch{return get('geometry.bin');}
    })().catch(cause=>{legacy=null;throw cause;});
    let geometry:Map<string,PreparedMesh>|null=null,binary:ArrayBuffer|null=null,packed:ArrayBuffer|null=null,printed:Promise<Map<string,PreparedMesh>>|null|undefined;
    try{packed=await positions;if(packed)geometry=await worker.decode(packed.slice(0),model);}catch(cause){console.warn('Compressed model unavailable; using compatible geometry.',cause);}
    if(!geometry)binary=await loadLegacy();
    // Keep the 870 KB pack for lazy print normals; no second fetch and no print
    // work on the startup critical path. Only the worker receives a transferred copy.
    const loadPrintGeometry=()=>printed||=(async()=>{
      if(!geometry||!packed)throw Error('Prepared model unavailable');
      const printWorker=startWorker();
      try{return await printWorker.decode(packed.slice(0),model,true);}finally{printWorker.dispose();}
    })().catch(cause=>{printed=null;throw cause;});
    return {model,catalog,geometry,binary,loadLegacy,loadPrintGeometry};
  } finally {worker.dispose();}
}
