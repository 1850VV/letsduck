/** A tutorial binding is not evidence of a verified electrical or physical fit. */
export function resolveServoMap(data,{actors,steps}){
 const byId=new Map(),actorIds=new Set();
 const bindings=data.bindings.map(binding=>{
  if(!Number.isInteger(binding.id)||byId.has(binding.id)||actorIds.has(binding.actorId)||!actors[binding.actorId]?.servoPorts)throw Error('舵机映射与模型不一致');
  const stepIndex=steps.findIndex(s=>s.chapter!=='prepare'&&s.parts.includes(binding.actorId));
  if(stepIndex<0)throw Error('找不到舵机的安装步骤');
  const installationIndex=binding.installedAt?steps.findIndex(s=>s.id===binding.installedAt):-1;
  if(binding.installedAt&&installationIndex<stepIndex)throw Error('舵机安装节点与教程不一致');
  const entry={...binding,stepIndex,installationIndex};byId.set(entry.id,entry);actorIds.add(entry.actorId);return entry;
 });
 return {version:data.version,bindings,byId,steps};
}

export function servosForStep(map,index){
 const parts=map.steps[index]?.parts||[];
 return map.bindings.filter(b=>parts.includes(b.actorId));
}

export function installationServosForStep(map,index){
 return map.bindings.filter(b=>b.installationIndex===index);
}

/** Physical declarations never derive from firmware verification or playback. */
export function deriveServoPreparation(map,catalog,records=[]){
 const saved=new Map(records.map(record=>[record.id,record])),byId=new Map();
 const counts={available:0,picked:0,installed:0,prepared:0};
 const slots=map.bindings.map((binding,index)=>{
  const record=saved.get(binding.id),state=record?.state??'available';
  if(!['available','picked','installed'].includes(state))throw Error('取件记录格式不正确');
  const leads=catalog.requirements[String(binding.id)]?.connections;
  const leadKnown=Array.isArray(leads)&&leads.length>0&&leads.every(lead=>lead.sourceStatus==='confirmed'&&['long','standard'].includes(lead.cableClass)&&Number.isFinite(lead.lengthMm)&&lead.lengthMm>0&&lead.to);
  const prepared=!!leadKnown&&leads.every(lead=>record?.preparedLeads?.includes(lead.key));
  const leadLabel=leadKnown?leads.map(lead=>`${lead.cableClass==='long'?'长线':'标准线'} · ${lead.lengthMm} mm`).join(' / '):'线材规格待核定';
  const item={...binding,index,row:Math.floor(index/5)+1,column:index%5+1,state,leads:leads||[],leadKnown,leadLabel,prepared};
  counts[state]++;if(prepared)counts.prepared++;byId.set(binding.id,item);return item;
 });
 return {slots,byId,counts};
}
