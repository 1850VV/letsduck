import {PERSONAL_KEY,personalState,newDraftId} from './personal-state.mjs';
import {createProgressStore,progressScope} from '../assemble/progress-store.mjs';
export const TUTORIAL='hardware-v3';
export const JOURNAL_KEY='dd-backup-pending';
export function captureBrowser(storage,schemes,steps){
 const draft=personalState(storage).draft||null,store=createProgressStore(storage,steps,TUTORIAL);
 const scopes=new Set(['blank',...schemes.map(s=>'scheme:'+s.id),...(draft?[progressScope(draft)]:[])]);
 return {draft,progress:[...scopes].map(scope=>({scope,tutorial:TUTORIAL,stepIds:steps.map(s=>s.id),view:store.read(scope),...store.readChecks(scope)}))};
}
export function remapBrowser(browser,idMap){
 const next=structuredClone(browser),draft=next.draft;
 const draftId=newDraftId();
 const scope=s=>s.startsWith('scheme:')?'scheme:'+idMap[s.slice(7)]:s.startsWith('draft:')?'draft:'+draftId:s;
 if(draft){draft.activeId=draft.activeId?idMap[draft.activeId]:null;draft.draftId=draftId;}
 for(const row of next.progress)row.scope=scope(row.scope);
 return next;
}
export function assertTutorial(browser,steps){
 for(const row of browser.progress)if(row.tutorial!==TUTORIAL||JSON.stringify(row.stepIds)!==JSON.stringify(steps.map(s=>s.id)))throw Error('backup.tutorial');
}
export function applyBrowser(storage,browser,steps){
 assertTutorial(browser,steps);
 const store=createProgressStore(storage,steps,TUTORIAL);
 for(const row of browser.progress){
  if(!store.write(row.scope,row.view))throw Error('backup.storage');
  const current=store.readChecks(row.scope);
  for(const kind of ['seen','built'])for(const id of new Set([...current[kind],...row[kind]]))if(!store.setCheck(row.scope,id,kind,row[kind].includes(id)))throw Error('backup.storage');
 }
 const state=personalState(storage);
 storage.setItem(PERSONAL_KEY,JSON.stringify({...state,draft:browser.draft}));
}
// The write-ahead journal remains until SQLite and browser storage both complete.
// Recovery removes only keys changed by this import; unrelated windows' edits stop recovery.
export function browserWrites(storage,browser,steps){
 const writes=new Map();
 const overlay={getItem:k=>writes.has(k)?writes.get(k):storage.getItem(k),setItem:(k,v)=>writes.set(k,v)};
 applyBrowser(overlay,browser,steps);
 return [...writes].map(([key,after])=>({key,before:storage.getItem(key),after}));
}
export function restoreWrites(storage,writes){
 for(const row of writes){const now=storage.getItem(row.key);if(now!==row.before&&now!==row.after)throw Error('backup.stale');}
 for(const row of writes)row.before===null?storage.removeItem(row.key):storage.setItem(row.key,row.before);
}
export function copyProgress(storage,steps,from,to){
 const store=createProgressStore(storage,steps,TUTORIAL);
 const browser={draft:personalState(storage).draft||null,progress:[{scope:to,tutorial:TUTORIAL,stepIds:steps.map(s=>s.id),view:store.read(from),...store.readChecks(from)}]};
 const writes=browserWrites(storage,browser,steps).filter(row=>row.key!==PERSONAL_KEY);
 try{for(const row of writes)storage.setItem(row.key,row.after);}
 catch(error){restoreWrites(storage,writes);throw error;}
}
