import {encodeJournal,decodeJournal} from './backup-journal.mjs';
import {api} from './api.mjs';
import {PERSONAL_KEY} from './personal-state.mjs';
import {captureBrowser,remapBrowser,assertTutorial,browserWrites,restoreWrites,JOURNAL_KEY} from './backup-adapter.mjs';
export function createBackupController(storage,steps,request=api){
 const run=fn=>globalThis.navigator?.locks?navigator.locks.request('letsduck-backup',{mode:'exclusive'},fn):fn();
 const pending=()=>storage.getItem(JOURNAL_KEY);
 const unchanged=raw=>{if(storage.getItem(PERSONAL_KEY)!==raw)throw Error('backup.stale');};
 return {
 pending,
 async export(){
  if(pending())throw Error('backup.recovery');
  const raw=storage.getItem(PERSONAL_KEY),schemes=await request('GET','/schemes');
  unchanged(raw);
  return request('POST','/backup/export',captureBrowser(storage,schemes,steps));
 },
 async preview(bundle){
  if(pending())throw Error('backup.recovery');
  const preview=await request('POST','/backup/preview',bundle);
  assertTutorial(bundle.browser,steps);
  const schemes=await request('GET','/schemes')||[];
  const beforeBrowser=captureBrowser(storage,schemes,steps);
  return {...preview,browserRevision:storage.getItem(PERSONAL_KEY),existingSchemes:schemes,beforeBrowser};
 },
 async import(bundle,mode,preview){return run(async()=>{
  if(pending())throw Error('backup.recovery');
  unchanged(preview.browserRevision);
  const unchangedProgress=()=>{if(JSON.stringify(captureBrowser(storage,preview.existingSchemes,steps))!==JSON.stringify(preview.beforeBrowser))throw Error('backup.stale');};
  unchangedProgress();
  // Reserve the estimated peak space before SQLite changes. Actual writes remain journaled.
  const estimateMap=Object.fromEntries((bundle.schemes||[]).map(row=>[row.id,
   mode==='overwrite'&&preview.existingSchemes.find(s=>s.name===row.name)?.id||'s-'+crypto.randomUUID().replaceAll('-','')]));
  const estimate=browserWrites(storage,remapBrowser(bundle.browser,estimateMap),steps);
  const journalSize=encodeJournal({writes:estimate,beforeBrowser:preview.beforeBrowser}).length;
  const required=4096+journalSize*2+estimate.reduce((sum,row)=>sum+Math.max(0,row.after.length-(row.before?.length||0))+(row.before===null?row.key.length:0),0);
  try{storage.setItem('dd-backup-capacity',' '.repeat(required));}finally{storage.removeItem('dd-backup-capacity');}
  const operation=crypto.randomUUID().replaceAll('-','');
  let journal={operation,writes:[],before:storage.getItem(PERSONAL_KEY),beforeBrowser:preview.beforeBrowser};
  storage.setItem(JOURNAL_KEY,encodeJournal(journal));
  try{
   const result=await request('POST','/backup/import',{bundle,mode,revision:preview.revision,operation});
   unchanged(journal.before);unchangedProgress();
   const next=remapBrowser(bundle.browser,result.idMap);
   journal.writes=browserWrites(storage,next,steps);
   storage.setItem(JOURNAL_KEY,encodeJournal(journal));
   for(const row of journal.writes){if(storage.getItem(row.key)!==row.before)throw Error('backup.stale');storage.setItem(row.key,row.after);}
   // Durable undo copy is retained independently of the crash-recovery journal.
   storage.setItem('dd-backup-last',encodeJournal(journal));
   storage.removeItem(JOURNAL_KEY);
   return result;
  }catch(error){
   // Network outcome can be unknown: keep the known operation ID for explicit recovery.
   throw error;
  }
 });},
 async exportRecovery(){
  const raw=pending()||storage.getItem('dd-backup-last');if(!raw)throw Error('backup.recovery');
  const journal=decodeJournal(raw);
  return request('POST','/backup/recovery',{recovery:journal.operation,browser:journal.beforeBrowser});
 },
 async restore(last=false){return run(async()=>{
  const raw=storage.getItem(last?'dd-backup-last':JOURNAL_KEY);if(!raw)return;
  const journal=decodeJournal(raw);
  // Validate local concurrent changes before touching either storage boundary.
  for(const row of journal.writes){const now=storage.getItem(row.key);if(now!==row.before&&now!==row.after)throw Error('backup.stale');}
  // Restore synchronously before yielding; never overwrite a later edit after the API await.
  restoreWrites(storage,journal.writes);
  try{await request('POST','/backup/restore',{recovery:journal.operation});}
  catch(error){
   // Compensate only our rollback; preserve edits another window made during the request.
   for(const row of journal.writes)if(storage.getItem(row.key)===row.before)storage.setItem(row.key,row.after);
   throw error;
  }
  storage.removeItem(last?'dd-backup-last':JOURNAL_KEY);
 });}
 };
}
