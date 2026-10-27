import {unpackGeometry} from './geometry-pack.mjs';
const ASSETS=new URL('../assets/',import.meta.url);
async function get(name,type='arrayBuffer') {
  const response=await fetch(new URL(name,ASSETS));if(!response.ok)throw Error(name+': '+response.status);return response[type]();
}
function startWorker() {
  let worker,error,finish,timeout;
  const dispose=()=>{clearTimeout(timeout);worker?.terminate();};
  const fail=e=>{error=e;dispose();finish?.(e);};
  try {
    worker=new Worker(new URL('./positions-worker.mjs',import.meta.url),{type:'module'});
    worker.onerror=e=>{e.preventDefault();fail(Error('Model worker failed'));};
    worker.onmessageerror=()=>fail(Error('Invalid model worker response'));
  } catch(e){error=e;}
  return {dispose,decode(buffer,model,print=false){
    if(error)return Promise.reject(error);
    return new Promise((resolve,reject)=>{
      finish=(err,value)=>{dispose();err?reject(err):resolve(value);};
      // Network latency does not consume the decode timeout. Early script errors
      // are retained without an unhandled rejected promise while downloads run.
      timeout=setTimeout(()=>fail(Error('Model worker timed out')),20000);
      worker.onmessage=({data})=>{
        try{if(data.error)throw Error(data.error);finish(null,new Map(data.meshes.map(m=>[m.kind+':'+m.id,m])));}
        catch(e){fail(e);}
      };
      try{worker.postMessage({buffer,model,print},[buffer]);}catch(e){fail(e);}
    });
  }};
}
export async function loadModel() {
  const worker=startWorker();
  try {
    const positions=get('geometry.positions.bin').catch(()=>null);
    const [model,catalog]=await Promise.all([get('model.json','json'),fetch(new URL('../api/catalog',import.meta.url)).then(response=>{if(!response.ok)throw Error('Catalogue: '+response.status);return response.json();})]);
    let legacy;
    const loadLegacy=()=>legacy||=(async()=>{
      try{return unpackGeometry(await get('geometry.pack.bin'),model);}catch{return get('geometry.bin');}
    })().catch(error=>{legacy=null;throw error;});
    let geometry=null,binary=null,packed=null,printed;
    try{packed=await positions;if(packed)geometry=await worker.decode(packed.slice(0),model);}catch(error){console.warn('Compressed model unavailable; using compatible geometry.',error);}
    if(!geometry)binary=await loadLegacy();
    // Keep the 870 KB pack for lazy print normals; no second fetch and no print
    // work on the startup critical path. Only the worker receives a transferred copy.
    const loadPrintGeometry=()=>printed||=(async()=>{
      if(!geometry||!packed)throw Error('Prepared model unavailable');
      const printWorker=startWorker();
      try{return await printWorker.decode(packed.slice(0),model,true);}finally{printWorker.dispose();}
    })().catch(error=>{printed=null;throw error;});
    return {model,catalog,geometry,binary,loadLegacy,loadPrintGeometry};
  } finally {worker.dispose();}
}
