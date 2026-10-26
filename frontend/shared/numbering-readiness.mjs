// Historical numbering evidence is independent of current USB/bus connectivity.
const empty=()=>({ready:false,expectedIds:[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34],verifiedIds:[],missingIds:[],reviewIds:[],records:[]});
let current=empty(),timer=null;
const listeners=new Set();
export const readNumberingReadiness=()=>structuredClone(current);
export function updateNumberingReadiness(value){const before=JSON.stringify(current);current=value;if(JSON.stringify(current)!==before)for(const listener of listeners)listener(readNumberingReadiness());return readNumberingReadiness();}
export async function refreshNumberingReadiness(){
 try{const r=await fetch('/api/duck-debug/numbering');if(!r.ok)throw Error('编号记录读取失败');return updateNumberingReadiness(await r.json());}
 catch(error){updateNumberingReadiness({...current,ready:false,error:error.message});return readNumberingReadiness();}
}
export function subscribeNumberingReadiness(listener){
 listeners.add(listener);listener(readNumberingReadiness());
 if(!timer){refreshNumberingReadiness();timer=setInterval(()=>{if(!document.hidden)refreshNumberingReadiness();},2000);}
 return ()=>{listeners.delete(listener);if(!listeners.size){clearInterval(timer);timer=null;}};
}
