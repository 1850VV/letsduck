// Resume position and explicit confirmations have separate records and semantics.
const initial=()=>({step:0,progress:1});
export function progressScope(draft){
 if(draft?.activeId)return 'scheme:'+draft.activeId;
 if(draft?.draftId)return 'draft:'+draft.draftId;
 if(!draft?.design?.colors)return 'blank';
 const sorted=object=>Object.entries(object||{}).sort(([a],[b])=>a.localeCompare(b));
 return 'draft:'+JSON.stringify([draft.name,sorted(draft.design.colors),sorted(draft.design.finishes)]);
}
export function createProgressStore(storage,steps,tutorial){
 // Ordered IDs isolate revised/reordered tutorials; bump tutorial for semantic changes with unchanged IDs.
 const prefix='dd-assembly-view:'+JSON.stringify([1,tutorial,steps.map(s=>s.id)])+':';
 const key=scope=>prefix+scope;
 // Confirmations follow semantic step IDs within a tutorial version, rather
 // than duplicating the full ordered tutorial in every field's storage key.
 const checksPrefix=scope=>'dd-assembly-check:'+JSON.stringify([1,tutorial,scope])+':';
 const checkKey=(scope,id,kind)=>checksPrefix(scope)+JSON.stringify([id,kind]);
 const valid=value=>Number.isInteger(value?.step)&&value.step>=0&&value.step<steps.length
  &&Number.isFinite(value.progress)&&value.progress>=0&&value.progress<=1;
 return {key,
 isChecksKey(scope,value){return typeof value==='string'&&value.startsWith(checksPrefix(scope));},
 readChecks(scope){
  const result={seen:[],built:[]};
  for(const {id} of steps)for(const kind of ['seen','built']){
   try{const value=JSON.parse(storage.getItem(checkKey(scope,id,kind)));if(value?.version===1&&value.checked===true)result[kind].push(id);}catch{}
  }
  return result;
 },
 setCheck(scope,id,kind,checked){
  if(!steps.some(step=>step.id===id)||!['seen','built'].includes(kind)||typeof checked!=='boolean')return false;
  // A record per field avoids overwriting another tab's unrelated confirmation.
  try{storage.setItem(checkKey(scope,id,kind),JSON.stringify({version:1,checked}));return true;}catch{return false;}
 },
 read(scope){
  try{const value=JSON.parse(storage.getItem(key(scope)));if(value?.version===1&&valid(value)&&steps[value.step].id===value.stepId)return {step:value.step,progress:value.progress};}catch{}
  return initial();
 },write(scope,value){
  if(!valid(value))return false;
  try{storage.setItem(key(scope),JSON.stringify({version:1,step:value.step,stepId:steps[value.step].id,progress:value.progress}));return true;}catch{return false;}
 }};
}
