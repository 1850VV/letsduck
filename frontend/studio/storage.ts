import type {Design,Scheme,WireInteger} from '../shared/types.js';
import {parseDesign,parseScheme} from '../shared/guards.js';
import {jsonParse} from '../shared/json.js';
import {isRecord,stringList} from '../lib/browser.js';
interface Draft {design?:Design;name?:string;provenance?:unknown;activeId?:string|null;voiceSalt?:WireInteger;updated?:WireInteger}
interface StudioStored {draft?:Draft;schemes?:Scheme[];owner?:string|null;recent?:string[];locks?:string[]}
export function readStudioStored(text:string|null):StudioStored {
 if(!text)return {};
 const value=jsonParse(text);if(!isRecord(value))return {};
 const result:StudioStored={recent:stringList(value.recent),locks:stringList(value.locks)};
 if(typeof value.owner==='string'||value.owner===null)result.owner=value.owner;
 if(Array.isArray(value.schemes))result.schemes=value.schemes.flatMap((item:unknown)=>{try{if(isRecord(item)){parseDesign(item.design);if(item.voiceSalt===undefined)item.voiceSalt=0;}return [parseScheme(item)];}catch{return [];}});
 if(isRecord(value.draft)){
  const raw=value.draft,draft:Draft={};
  if(typeof raw.name==='string')draft.name=raw.name;
  if(typeof raw.activeId==='string'||raw.activeId===null)draft.activeId=raw.activeId;
  if(typeof raw.voiceSalt==='number'||typeof raw.voiceSalt==='bigint')draft.voiceSalt=raw.voiceSalt;
  if(typeof raw.updated==='number'||typeof raw.updated==='bigint')draft.updated=raw.updated;
  if(raw.design!==undefined)try{draft.design=parseDesign(raw.design);}catch{}
  if(raw.provenance!==undefined)draft.provenance=raw.provenance;
  result.draft=draft;
 }
 return result;
}
