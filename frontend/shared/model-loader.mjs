import {unpackGeometry} from './geometry-pack.mjs';
const ASSETS=new URL('../assets/',import.meta.url);
async function get(name,type='arrayBuffer') {
  const response=await fetch(new URL(name,ASSETS));if(!response.ok)throw Error(name+': '+response.status);return response[type]();
}
// The release page starts the Worker from its <head> and asks it for the pack at once (frontend/build.mjs);
// the source tree does both here. A Worker failure before adoption is kept.
function startWorker(early,downloading=!!early) {
  let worker=early,error,finish,timeout,results;
  // The decode timeout starts once the Worker has the whole pack; a slow network is not a hung Worker.
  const clock=()=>{clearTimeout(timeout);timeout=setTimeout(()=>fail(Error('Model worker timed out')),20000);};
  const dispose=()=>{clearTimeout(timeout);worker?.terminate();};
  const fail=e=>{error=e;dispose();finish?.(e);};
  try {
    if(worker?.failed)error=Error('Model worker failed');
    worker||=new Worker(new URL('./positions-worker.mjs',import.meta.url),{type:'module'});
    worker.onerror=e=>{e.preventDefault();fail(Error('Model worker failed'));};
    worker.onmessageerror=()=>fail(Error('Invalid model worker response'));
    worker.onmessage=({data})=>{
      if(data.received){downloading=false;if(finish)clock();return;}
      try{if(data.error)throw Error(data.error);results={...data,meshes:new Map(data.meshes.map(m=>[m.kind+':'+m.id,m]))};finish?.(null,results);}
      catch(e){fail(e);}
    };
  } catch(e){error=e;}
  // Messages to a failed Worker are dropped; its error is reported by result().
  const send=(message,transfer=[])=>{if(error)return;try{worker.postMessage(message,transfer);}catch(e){fail(e);}};
  const result=()=>{
    if(error)return Promise.reject(error);
    return new Promise((resolve,reject)=>{
      finish=(err,value)=>{dispose();err?reject(err):resolve(value);};
      if(results)return finish(null,results);
      // Early script errors are retained without an unhandled rejected promise while downloads run.
      if(!downloading)clock();
    });
  };
  const fetchPack=url=>{downloading=true;send({type:'fetch',url});};
  return {dispose,send,fetchPack,result,async decode(buffer,model,print=false){send({buffer,model,print},[buffer]);return (await result()).meshes;}};
}
export async function loadModel() {
  const early=globalThis.duckModelStart;delete globalThis.duckModelStart;
  const worker=startWorker(early);
  try {
    // The Worker downloads the pack and decodes it as it arrives, without the main thread.
    if(!early)worker.fetchPack(new URL('geometry.positions.bin',ASSETS).href);
    const [model,catalog]=await Promise.all([get('model.json','json'),get('catalog.json','json')]);
    performance.mark('duck:model-description');worker.send({type:'model',model});
    let legacy;
    const loadLegacy=()=>legacy||=(async()=>{
      try{return unpackGeometry(await get('geometry.pack.bin'),model);}catch{return get('geometry.bin');}
    })().catch(error=>{legacy=null;throw error;});
    let geometry=null,binary=null,packed=null,printed;
    try{
      const result=await worker.result(),{stats}=result;geometry=result.meshes;packed=result.packed;
      if(stats?.receivedAt)performance.mark('duck:positions-received',{startTime:Math.max(0,stats.receivedAt-performance.timeOrigin),detail:{bytes:stats.bytes,busyMs:Math.round(stats.busyMs)}});
      performance.mark('duck:geometry-ready');
    }
    catch(error){console.warn('Compressed model unavailable; using compatible geometry.',error);}
    if(!geometry)binary=await loadLegacy();
    // Keep the 870 KB pack for lazy print normals; no second fetch and no print
    // work on the startup critical path. The print Worker receives a transferred copy.
    const loadPrintGeometry=()=>printed||=(async()=>{
      if(!geometry||!packed)throw Error('Prepared model unavailable');
      const printWorker=startWorker();
      try{return await printWorker.decode(packed.slice(0),model,true);}finally{printWorker.dispose();}
    })().catch(error=>{printed=null;throw error;});
    return {model,catalog,geometry,binary,loadLegacy,loadPrintGeometry};
  } finally {worker.dispose();}
}
