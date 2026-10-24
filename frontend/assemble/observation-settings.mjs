// Display preferences never enter a scheme, tutorial progress or manufacturing data.
export const OBSERVATION_KEY='dd-observation-v1';
export function createObservationSettings(storage){
 const listeners=new Set();
 function read(){let state={quality:'current',lighting:'neutral'};
 try{const saved=JSON.parse(storage?.getItem(OBSERVATION_KEY)||'null');
  if(saved&&(saved.version===undefined||saved.version===1)){
   const quality=saved.quality==='ultra'?'ultra':'current';
   state={quality,lighting:saved.lighting==='display'||saved.lighting===undefined&&quality==='ultra'?'display':'neutral'};
  }
 }catch{}return state;}
 let state=read(),volatile=false;
 return {refresh(){if(volatile)return;const next=read();if(next.quality===state.quality&&next.lighting===state.lighting)return;state=next;for(const fn of listeners)fn({...state});},get state(){return {...state};},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
  set(key,value){if(!({quality:['current','ultra'],lighting:['neutral','display']}[key]?.includes(value))||state[key]===value)return;
   state={...state,[key]:value};try{if(!storage)throw Error('storage unavailable');storage.setItem(OBSERVATION_KEY,JSON.stringify({version:1,...state}));volatile=false;}catch{volatile=true;}
   for(const fn of listeners)fn({...state});
  }};
}
