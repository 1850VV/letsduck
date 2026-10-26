import {deriveServoPreparation} from './servo-map.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/** One shared local inventory; mutations acknowledge a real SQLite save first. */
export function createServoPreparation(map){
 let catalog={requirements:{}},records=[],supported=false,loaded=false,saving=false,error='';
 const listeners=new Set(),emit=()=>{for(const listener of listeners)listener();};
 const read=async response=>{const answer=await response.json();if(!response.ok)throw Error(answer.error||'取件记录没有保存成功');return answer;};
 return {
  get supported(){return supported;},get loaded(){return loaded;},get saving(){return saving;},get error(){return error;},get catalog(){return catalog;},
  get view(){return deriveServoPreparation(map,catalog,records);},
  subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
  async load(enabled){
   supported=!!enabled;
   try{
    const response=await fetch(new URL('./servo-leads.json',import.meta.url));if(!response.ok)throw Error('线材要求没有加载成功');catalog=await response.json();
    if(supported){const answer=await read(await fetch('/api/servo-preparation'));deriveServoPreparation(map,catalog,answer.records);records=answer.records;loaded=true;}
    error='';
   }catch(e){error=e.message;loaded=false;}
   emit();
  },
  async update(ids,values){
   if(!supported||!loaded||saving)throw Error('取件记录尚不可用');
   saving=true;error='';emit();
   try{
    const answer=await read(await fetch('/api/servo-preparation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids,...values})}));
    deriveServoPreparation(map,catalog,answer.records);records=answer.records;
   }catch(e){error=e.message;throw e;}
   finally{saving=false;emit();}
  }
 };
}

export function servoLeadMarkup(preparation,id){
 const item=preparation.view.byId.get(id),reported=preparation.catalog.reportedRequirement;
 if(!item)return '';
 return `<div class="servo-leads ${item.leadKnown?'known':'unresolved'}" data-lead-id="${id}"><b>${escape(item.leadLabel)}</b><span>${item.prepared?'预接线已备好':item.leadKnown?'按要求接好舵机端，连线与编号一起归位。':'预接线未确认 · 编号参数完成不代表线材已备好。'}</span>${!item.leadKnown&&reported?`<small>待核线索：${reported.servosRequiringLongLead} 只需长 AMP 线，具体编号与长度待核。</small>`:''}</div>`;
}
