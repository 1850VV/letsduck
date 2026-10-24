import {onPageActivity} from '../shared/personal-page.mjs';
import {api} from '../shared/api.mjs';
import {createBackupController} from '../shared/backup-controller.mjs';
import {personalState} from '../shared/personal-state.mjs';
import {captureBrowser} from '../shared/backup-adapter.mjs';
import {progressScope} from '../assemble/progress-store.mjs';
import {t,onLocale} from '../shared/i18n.mjs';
const {steps}=await fetch('/shared/backup-steps.json').then(r=>r.json());
const controller=createBackupController(localStorage,steps);
const root=document.createElement('section');root.className='data-cards';document.querySelector('.foot').before(root);
const dialog=document.createElement('dialog');dialog.className='data-dialog';document.body.append(dialog);
const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.after(status);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,id)=>`<button type="button" data-do="${id}">${esc(t('data.'+label))}</button>`;
const message=error=>(error?.code==='backup.stale'||error?.message==='backup.stale')?t('data.changed'):t(error?.code==='backup.version'||error?.message==='backup.version'?'data.newer':(error?.code?.startsWith('backup.')||error?.message?.startsWith('backup.'))?'data.invalid':'data.failed');
function modal(html){dialog.innerHTML=html+button('close','close');if(!dialog.open)dialog.showModal();}
let bundle=null,preview=null;
function render(){
 const draft=personalState(localStorage).draft;
 root.innerHTML=`<article><h2>${esc(t('data.draft'))}</h2><p>${esc(draft?.name||'—')}</p><p>${esc(t('data.named'))}</p><a class="data-save" href="/paint#save">${esc(t('data.save'))}</a></article><article><h2>${esc(t('data.title'))}</h2><p>${esc(t('data.scope'))}</p><div class="data-actions">${button('export','export')}${button('import','import')}${localStorage.getItem('dd-backup-last')||controller.pending()?button('restore','restore')+button('export','recovery-export'):''}</div></article><input type="file" id="backup-file" accept=".json,application/json" hidden>`;
 root.querySelector('#backup-file').onchange=async e=>{
  try{const file=e.target.files[0];if(!file||!file.name.toLowerCase().endsWith('.json')||!file.size||file.size>2_000_000)throw Error('backup.invalid');
   try{bundle=JSON.parse(await file.text());}catch{throw Error('backup.invalid');}preview=await controller.preview(bundle);
   modal(`<h2>${esc(t('data.preview'))}</h2><p>${preview.schemes} · ${esc(t('data.named'))}</p><p>${preview.progress} · ${esc(t('data.resume'))}</p>${preview.conflicts.length?`<p>${esc(t('data.conflict'))}: ${preview.conflicts.map(c=>esc(c.incoming.name)).join(', ')}</p>${button('keep','keep')}${button('diff','diff')}`:button('confirm','keep')}`);
  }catch(error){modal(`<h2>${esc(message(error))}</h2>`);}
 };
 const recoveryExport=root.querySelector('[data-do="recovery-export"]');if(recoveryExport)recoveryExport.textContent=t('data.export')+' · '+t('data.restore');
 if(controller.pending())status.textContent=t('data.recovery');
}
async function act(action){
 if(action==='close')return dialog.close();
 if(action==='import')return root.querySelector('#backup-file').click();
 if(action==='diff')return modal(`<h2>${esc(t('data.diff'))}</h2>${preview.conflicts.map(c=>`<h3>${esc(c.incoming.name)}</h3><pre dir="ltr">${esc(JSON.stringify({before:c.existing.design,after:c.incoming.design},null,2))}</pre>`).join('')}${button('overwrite','overwrite')}`);
 try{
  if(action==='export'||action==='recovery-export'){
   const value=action==='recovery-export'?await controller.exportRecovery():await controller.export();const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download=action==='recovery-export'?'letsduck-recovery-v1.json':'letsduck-backup-v1.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }else if(action==='keep'||action==='overwrite'){
   await controller.import(bundle,action==='keep'?'keep':'overwrite',preview);dialog.close();
   // Reload retained pages after a completed import so stale in-memory editors cannot overwrite restored data.
   (window.top||window).location.reload();return;
  }else if(action==='restore'){
   await controller.restore(!controller.pending());(window.top||window).location.reload();return;
  }
  status.textContent=t('data.done');
 }catch(error){if(dialog.open)dialog.close();render();status.textContent=controller.pending()?t('data.recovery'):message(error);}
}
for(const target of [root,dialog])target.addEventListener('click',e=>{const b=e.target.closest('[data-do]');if(b){b.disabled=true;Promise.resolve(act(b.dataset.do)).finally(()=>b.disabled=false);}});
export function assemblySummary(){
 const draft=personalState(localStorage).draft;
 const browser=captureBrowser(localStorage,[],steps),row=browser.progress.find(p=>p.scope===progressScope(draft));
 return row?`${t('data.resume')} · ${row.view.step+1}/${steps.length} · ${t('data.progress',{seen:row.seen.length,built:row.built.length,total:steps.length})}`:'';
}
onLocale(render);render();

addEventListener('storage',event=>{if(event.key==='dd-studio-personal'||event.key===null)render();});
onPageActivity(active=>{if(active)render();});
export const refreshData=render;
