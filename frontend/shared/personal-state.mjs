// Shared startup for independently loaded personal pages. Only reads the API;
// never turns a browser fallback into a write to a user's named scheme.
export const PERSONAL_KEY='dd-studio-personal';
const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
export function validDraft(draft){
 return record(draft)&&typeof draft.name==='string'&&record(draft.design)&&record(draft.design.colors)
  &&Object.keys(draft.design.colors).length>0&&Object.values(draft.design.colors).every(c=>/^#[0-9a-f]{6}$/i.test(c))
  &&record(draft.design.assignments);
}
export function personalState(storage){
 try{const value=JSON.parse(storage.getItem(PERSONAL_KEY));return record(value)?value:{};}catch{return {};}
}
export async function ensurePersonalDraft(storage,loadSchemes){
 const existing=personalState(storage);
 if(validDraft(existing.draft)){
  // Give legacy unsaved drafts an identity before either the guide or studio opens.
  if(!existing.draft.activeId&&!existing.draft.draftId){
   try{storage.setItem(PERSONAL_KEY,JSON.stringify({...existing,draft:{...existing.draft,draftId:crypto.randomUUID()}}));}catch{}
  }
  return;
 }
 const schemes=await loadSchemes();
 // Another retained page or window may have written a real edit while fetching.
 const current=personalState(storage);if(validDraft(current.draft))return;
 const scheme=Array.isArray(schemes)&&schemes.find(s=>typeof s.id==='string'&&validDraft(s));
 if(!scheme)return;
 try{storage.setItem(PERSONAL_KEY,JSON.stringify({...current,draft:{design:scheme.design,name:scheme.name,
  provenance:scheme.provenance||null,activeId:scheme.id,voiceSalt:scheme.voiceSalt||0,updated:scheme.updated||Date.now()}}));}catch{/* Storage can be unavailable; the studio still loads the API. */}
}
