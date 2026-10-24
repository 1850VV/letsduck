// Viewing position only. Does not record physical assembly completion.
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
 const valid=value=>Number.isInteger(value?.step)&&value.step>=0&&value.step<steps.length
  &&Number.isFinite(value.progress)&&value.progress>=0&&value.progress<=1;
 return {key,read(scope){
  try{const value=JSON.parse(storage.getItem(key(scope)));if(value?.version===1&&valid(value)&&steps[value.step].id===value.stepId)return {step:value.step,progress:value.progress};}catch{}
  return initial();
 },write(scope,value){
  if(!valid(value))return false;
  try{storage.setItem(key(scope),JSON.stringify({version:1,step:value.step,stepId:steps[value.step].id,progress:value.progress}));return true;}catch{return false;}
 }};
}
