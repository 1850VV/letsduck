/** A tutorial binding is not evidence of a verified electrical or physical fit. */
export function resolveServoMap(data,{actors,steps}){
 const byId=new Map(),actorIds=new Set();
 const bindings=data.bindings.map(binding=>{
  if(!Number.isInteger(binding.id)||byId.has(binding.id)||actorIds.has(binding.actorId)||!actors[binding.actorId]?.servoPorts)throw Error('舵机映射与模型不一致');
  const stepIndex=steps.findIndex(s=>s.chapter!=='prepare'&&s.parts.includes(binding.actorId));
  if(stepIndex<0)throw Error('找不到舵机的安装步骤');
  const entry={...binding,stepIndex};byId.set(entry.id,entry);actorIds.add(entry.actorId);return entry;
 });
 return {version:data.version,bindings,byId,steps};
}

export function servosForStep(map,index){
 const parts=map.steps[index]?.parts||[];
 return map.bindings.filter(b=>parts.includes(b.actorId));
}
