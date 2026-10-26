import {servosForStep,installationServosForStep} from './servo-map.mjs';
import {servoLeadMarkup} from './servo-preparation.mjs';

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={available:'盘中待取',picked:'已取待装',installed:'已安装'};
const icon='<svg viewBox="0 0 28 34" aria-hidden="true"><path d="M6 9h16v21H6z" fill="currentColor"/><path d="M3 13h3v13H3zm19 0h3v13h-3z" fill="currentColor" opacity=".55"/><circle cx="14" cy="8" r="7" fill="currentColor"/><circle cx="14" cy="8" r="3.4" fill="white" opacity=".8"/></svg>';

/** The tutorial, configuration tray and mini map share the same persisted items. */
export function createServoPickup({stage,map,preparation,getStep,getFirmware,getAnchor,onOpen,onChange}){
 const root=document.createElement('section');root.id='servo-pickup';root.className='servo-pickup';root.hidden=true;root.setAttribute('aria-label','桌面舵机取件盘');
 const summary=document.createElement('span');summary.id='sp-summary';summary.className='sp-summary';summary.hidden=true;summary.setAttribute('aria-live','polite');
 const label=document.createElement('button');label.type='button';label.id='sp-model-label';label.className='sp-model-label';label.hidden=true;
 stage.append(root,summary,label);let selected=14,active=false,selectionRevision=0;
 const needed=()=>servosForStep(map,getStep()).map(b=>b.id);
 function updateLabel(){
  const anchor=active?getAnchor?.(selected):null;label.hidden=!anchor;
  if(anchor){label.textContent='ID '+selected+' · 找实物 ↗';label.style.left=anchor.x+'px';label.style.top=anchor.y-20+'px';}
 }
 function render(){
  summary.hidden=!preparation.supported;
  const view=preparation.view,n=view.counts;
  summary.classList.toggle('complete',preparation.loaded&&n.available===0);
  summary.textContent=preparation.error?preparation.error:!preparation.loaded?preparation.error||'正在读取取件记录…':n.available===0?`舵机已全部取用 · 待安装 ${n.picked} · 已安装 ${n.installed}`:`盘中 ${n.available} / 15 · 已取待装 ${n.picked} · 已安装 ${n.installed}`;
  if(!active)return;
  const item=view.byId.get(selected),required=new Set(needed()),firmware=getFirmware?.();
  const history=firmware?.verified?.includes(selected)?'编号参数已验证':firmware?.review?.includes(selected)?'编号记录需复核':'尚无已验证的编号记录';
  root.innerHTML=`<div class="sp-heading"><b>桌面舵机盘</b><button id="sp-close" type="button" aria-label="收起取件图">×</button></div>
   <div class="sp-position"><strong id="sp-id">ID ${selected}</strong><span id="sp-position">第 ${item.row} 排 · 第 ${item.column} 格</span></div>
   <p class="sp-history">${history} · ${preparation.loaded?names[item.state]:'取件记录未读取'}</p>${servoLeadMarkup(preparation,selected)}
   <div class="sp-grid">${view.slots.map(slot=>{const empty=preparation.loaded&&slot.state!=='available',long=slot.leadKnown&&slot.leads.some(lead=>lead.cableClass==='long');return `<button type="button" class="sp-slot ${empty?'empty':''} ${slot.state} ${slot.id===selected?'selected':''} ${required.has(slot.id)?'needed':''} ${long?'long':''}" data-id="${slot.id}" data-slot="${slot.index}" data-state="${preparation.loaded?slot.state:'unknown'}" aria-label="ID ${slot.id}，第${slot.row}排第${slot.column}格，${names[slot.state]}，${escape(slot.leadLabel)}">${empty?'<i class="sp-empty"></i>':icon}<b>${slot.id}</b>${long?'<span class="sp-long">长线</span>':''}${slot.state==='installed'?'<span class="sp-installed">✓</span>':''}</button>`;}).join('')}</div>
   <div class="sp-front">这一侧靠近你</div><p id="sp-error" class="sp-error" ${preparation.error?'':'hidden'}>${escape(preparation.error)}</p>
   ${item.state==='available'?`<button id="sp-take" type="button" class="sp-primary" ${!preparation.loaded||preparation.saving?'disabled':''}>${preparation.saving?'正在保存…':'已取出 ID '+selected}</button>`:`<div class="sp-taken">✓ ${names[item.state]} · 原位置保留空位</div><button id="sp-return" type="button" class="sp-return" ${preparation.saving?'disabled':''}>放回原位</button>`}
   <p class="sp-foot">实物按图摆放并贴编号，取走后不补位。</p>`;
  updateLabel();
 }
 function close(){selectionRevision++;active=false;root.hidden=true;label.hidden=true;}
 function open(id){if(!map.byId.has(id)||!preparation.supported)return;selectionRevision++;selected=id;active=true;root.hidden=false;onOpen?.();render();root.querySelector('#sp-close').focus({preventScroll:true});}
 root.addEventListener('click',async event=>{
  const slot=event.target.closest('.sp-slot');if(slot){selectionRevision++;selected=Number(slot.dataset.id);render();return;}
  const button=event.target.closest('button');if(!button)return;
  if(button.id==='sp-close'){close();return;}
  try{
   if(button.id==='sp-take'){
    const origin=selected,revision=selectionRevision,originStep=getStep();
    await preparation.update([origin],{state:'picked'});
    if(active&&revision===selectionRevision&&originStep===getStep()){const next=needed().find(id=>preparation.view.byId.get(id).state==='available');if(next!==undefined)selected=next;render();}
   }else if(button.id==='sp-return')await preparation.update([selected],{state:'available'});
  }catch{/* The shared controller retains the old inventory and renders the error. */}
 });
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')close();});label.onclick=()=>open(selected);
 preparation.subscribe(()=>{render();onChange?.();});render();
 return {
  open,close,updateLabel,stepChanged(){close();render();},
  get active(){return active;},
  async completeStep(index,stillCurrent=()=>true){
   if(!preparation.supported)return true;
   const ids=installationServosForStep(map,index).filter(b=>preparation.view.byId.get(b.id).state!=='installed').map(b=>b.id);
   if(!ids.length)return true;
   try{await preparation.update(ids,{state:'installed'});return true;}catch{if(stillCurrent())open(ids[0]);return false;}
  }
 };
}
