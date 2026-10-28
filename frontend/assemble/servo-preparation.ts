import {assemblyText,displayLeadLabel,assemblyApiError,assemblyErrorText} from './i18n.js';
import {parseResponseJson,jsonStringify} from '../shared/json.js';
import {sameOriginUrl} from '../shared/url.js';
import {record,parseLeadCatalog,parsePreparationRecords,type ServoMapping,type LeadCatalog,type PreparationRecord,type PickState} from './servo-types.js';
import {deriveServoPreparation} from './servo-map.js';

const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

/** One shared local inventory; mutations acknowledge a real SQLite save first. */
export function createServoPreparation(map:ServoMapping){
 let catalog:LeadCatalog={requirements:{}},records:PreparationRecord[]=[],supported=false,loaded=false,saving=false,error:unknown=null;
 const listeners=new Set<()=>void>(),emit=()=>{for(const listener of listeners)listener();};
 const read=async (response:Response)=>{const answer=record(await parseResponseJson(response));if(!response.ok)throw assemblyApiError(answer);return {records:parsePreparationRecords(answer.records)};};
 return {
  get supported(){return supported;},get loaded(){return loaded;},get saving(){return saving;},get error(){return error?assemblyErrorText(error):'';},get catalog(){return catalog;},
  get view(){return deriveServoPreparation(map,catalog,records);},
  subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
  async load(enabled:unknown){
   supported=!!enabled;
   try{
    const response=await fetch(sameOriginUrl('/assemble/servo-leads.json'));if(!response.ok)throw Error('线材要求没有加载成功');catalog=parseLeadCatalog(await parseResponseJson(response));
    if(supported){const answer=await read(await fetch('/api/servo-preparation'));deriveServoPreparation(map,catalog,answer.records);records=answer.records;loaded=true;}
    error=null;
   }catch(e){error=e;loaded=false;}
   emit();
  },
  async update(ids:number[],values:{state?:PickState;preparedLeads?:string[]}){
   if(!supported||!loaded||saving)throw Error('取件记录尚不可用');
   saving=true;error=null;emit();
   try{
    const answer=await read(await fetch('/api/servo-preparation',{method:'POST',headers:{'Content-Type':'application/json'},body:jsonStringify({ids,...values})}));
    deriveServoPreparation(map,catalog,answer.records);records=answer.records;
   }catch(e){error=e;throw e;}
   finally{saving=false;emit();}
  }
 };
}

export function servoLeadMarkup(preparation:ReturnType<typeof createServoPreparation>,id:number){
 const item=preparation.view.byId.get(id),reported=preparation.catalog.reportedRequirement;
 if(!item)return '';
 return `<div class="servo-leads ${item.leadKnown?'known':'unresolved'}" data-lead-id="${id}"><b>${escape(displayLeadLabel(item))}</b><span>${item.prepared?assemblyText("assemble.ui.0126"):item.leadKnown?assemblyText("assemble.ui.0127"):assemblyText("assemble.ui.0128")}</span>${!item.leadKnown&&reported?`<small>${assemblyText("assemble.ui.0129",{p0:reported.servosRequiringLongLead})}</small>`:''}</div>`;
}
