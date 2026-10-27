import type { DebugNumbering } from '@letsduck/devices';
import {record,numberArray} from './guards.js';
import {jsonStringify,parseResponseJson} from './json.js';
// Historical numbering evidence is independent of current USB/bus connectivity.
export type NumberingReadiness=Omit<DebugNumbering,'board'|'mapVersion'>&Partial<Pick<DebugNumbering,'board'|'mapVersion'>>&{error?:string};
const empty=():NumberingReadiness=>({ready:false,expectedIds:[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34],verifiedIds:[],missingIds:[],reviewIds:[],records:[]});
let current=empty(),timer:ReturnType<typeof setInterval>|null=null;
const listeners=new Set<(value:NumberingReadiness)=>void>();
function numbering(value:unknown):value is NumberingReadiness{return record(value)&&typeof value.ready==='boolean'&&numberArray(value.expectedIds)&&numberArray(value.verifiedIds)&&numberArray(value.missingIds)&&numberArray(value.reviewIds)&&Array.isArray(value.records)&&value.records.every(record);}
export const readNumberingReadiness=()=>structuredClone(current);
export function updateNumberingReadiness(value:unknown){if(!numbering(value))throw Error('Invalid numbering response');const before=jsonStringify(current);current=value;if(jsonStringify(current)!==before)for(const listener of listeners)listener(readNumberingReadiness());return readNumberingReadiness();}
export async function refreshNumberingReadiness(){
 try{const r=await fetch('/api/duck-debug/numbering');if(!r.ok)throw Error('编号记录读取失败');return updateNumberingReadiness(await parseResponseJson(r));}
 catch(error){updateNumberingReadiness({...current,ready:false,error:error instanceof Error?error.message:String(error)});return readNumberingReadiness();}
}
export function subscribeNumberingReadiness(listener:(value:NumberingReadiness)=>void){
 listeners.add(listener);listener(readNumberingReadiness());
 if(!timer){void refreshNumberingReadiness();timer=setInterval(()=>{if(!document.hidden)void refreshNumberingReadiness();},2000);}
 return ()=>{listeners.delete(listener);if(!listeners.size){if(timer!==null)clearInterval(timer);timer=null;}};
}
