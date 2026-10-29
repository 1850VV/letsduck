import {assemblyText,displayLeadLabel} from './i18n.js';
import {onLocale} from '../shared/i18n.js';
import type {createServoPreparation} from './servo-preparation.js';
import type {ServoMapping} from './servo-types.js';
import {servosForStep,installationServosForStep} from './servo-map.js';
import {servoLeadMarkup} from './servo-preparation.js';

const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const names=()=>({available:assemblyText("assemble.ui.0100"),picked:assemblyText("assemble.ui.0101"),installed:assemblyText("assemble.ui.0102")});
const icon='<svg viewBox="0 0 28 34" aria-hidden="true"><path d="M6 9h16v21H6z" fill="currentColor"/><path d="M3 13h3v13H3zm19 0h3v13h-3z" fill="currentColor" opacity=".55"/><circle cx="14" cy="8" r="7" fill="currentColor"/><circle cx="14" cy="8" r="3.4" fill="white" opacity=".8"/></svg>';

/** The tutorial, configuration tray and mini map share the same persisted items. */
export function createServoPickup({stage,map,preparation,getStep,getFirmware,getAnchor,onOpen,onChange}:{stage:HTMLElement;map:ServoMapping;preparation:ReturnType<typeof createServoPreparation>;getStep:()=>number;getFirmware?:()=>{verified:number[];review:number[]};getAnchor?:(id:number)=>{x:number;y:number}|null;onOpen?:()=>void;onChange?:()=>void}){
 const root=document.createElement('section');root.id='servo-pickup';root.className='servo-pickup';root.hidden=true;root.setAttribute('aria-label',assemblyText("assemble.ui.0103"));
 const summary=document.createElement('span');summary.id='sp-summary';summary.className='sp-summary';summary.hidden=true;summary.setAttribute('aria-live','polite');
 const label=document.createElement('button');label.type='button';label.id='sp-model-label';label.className='sp-model-label';label.hidden=true;
 stage.append(root,summary,label);let selected=14,active=false,selectionRevision=0;
 const needed=()=>servosForStep(map,getStep()).map(b=>b.id);
 function updateLabel(){
  const anchor=active?getAnchor?.(selected):null;label.hidden=!anchor;
  if(anchor){label.textContent='ID '+selected+assemblyText("assemble.ui.0104");label.style.left=anchor.x+'px';label.style.top=anchor.y-20+'px';}
 }
 function render(){
  summary.hidden=!preparation.supported;
  const view=preparation.view,n=view.counts;
  summary.classList.toggle('complete',preparation.loaded&&n.available===0);
  summary.textContent=preparation.error?preparation.error:!preparation.loaded?preparation.error||assemblyText("assemble.ui.0105"):n.available===0?assemblyText("assemble.ui.0106",{p0:n.picked,p1:n.installed}):assemblyText("assemble.ui.0107",{p0:n.available,p1:n.picked,p2:n.installed});
  if(!active)return;
  const item=view.byId.get(selected)!,required=new Set(needed()),firmware=getFirmware?.();
  const history=firmware?.verified?.includes(selected)?assemblyText("assemble.ui.0108"):firmware?.review?.includes(selected)?assemblyText("assemble.ui.0109"):assemblyText("assemble.ui.0110");
  root.innerHTML=`<div class="sp-heading"><b data-assemble-i18n="assemble.ui.0118">${assemblyText("assemble.ui.0118")}</b><button id="sp-close" type="button" aria-label="${assemblyText("assemble.ui.0119")}">×</button></div>
   <div class="sp-position"><strong id="sp-id">ID ${selected}</strong><span id="sp-position">${assemblyText("assemble.ui.0120",{p1:item.row,p2:item.column})}</span></div>
   <p class="sp-history">${history} · ${preparation.loaded?names()[item.state]:assemblyText("assemble.ui.0111")}</p>${servoLeadMarkup(preparation,selected)}
   <div class="sp-grid">${view.slots.map(slot=>{const empty=preparation.loaded&&slot.state!=='available',long=slot.leadKnown&&slot.leads.some(lead=>lead.cableClass==='long');return `<button type="button" class="sp-slot ${empty?'empty':''} ${slot.state} ${slot.id===selected?'selected':''} ${required.has(slot.id)?'needed':''} ${long?'long':''}" data-id="${slot.id}" data-slot="${slot.index}" data-state="${preparation.loaded?slot.state:'unknown'}" aria-label="${assemblyText("assemble.ui.0113",{p8:slot.id,p9:slot.row,p10:slot.column,p11:names()[slot.state],p12:escape(displayLeadLabel(slot))})}">${empty?'<i class="sp-empty"></i>':icon}<b>${slot.id}</b>${long?`<span class="sp-long" data-assemble-i18n="assemble.ui.0112">${assemblyText("assemble.ui.0112")}</span>`:''}${slot.state==='installed'?'<span class="sp-installed">✓</span>':''}</button>`;}).join('')}</div>
   <div class="sp-front" data-assemble-i18n="assemble.ui.0121">${assemblyText("assemble.ui.0121")}</div><p id="sp-error" class="sp-error" ${preparation.error?'':'hidden'}>${escape(preparation.error)}</p>
   ${item.state==='available'?`<button id="sp-take" type="button" class="sp-primary" ${!preparation.loaded||preparation.saving?'disabled':''}>${preparation.saving?assemblyText("assemble.ui.0114"):assemblyText("assemble.ui.0115")+selected}</button>`:`<div class="sp-taken">${assemblyText("assemble.ui.0116",{p0:names()[item.state]})}</div><button id="sp-return" type="button" class="sp-return" ${preparation.saving?'disabled':''} data-assemble-i18n="assemble.ui.0117">${assemblyText("assemble.ui.0117")}</button>`}
   <p class="sp-foot" data-assemble-i18n="assemble.ui.0122">${assemblyText("assemble.ui.0122")}</p>`;
  updateLabel();
 }
 function close(){selectionRevision++;active=false;root.hidden=true;label.hidden=true;}
 function open(id:number){if(!map.byId.has(id)||!preparation.supported)return;selectionRevision++;selected=id;active=true;root.hidden=false;onOpen?.();render();root.querySelector<HTMLButtonElement>('#sp-close')!.focus({preventScroll:true});}
 root.addEventListener('click',async event=>{
  const slot=(event.target instanceof Element?event.target:null)?.closest<HTMLElement>('.sp-slot');if(slot){selectionRevision++;selected=Number(slot.dataset.id);render();return;}
  const button=(event.target instanceof Element?event.target:null)?.closest('button');if(!button)return;
  if(button.id==='sp-close'){close();return;}
  try{
   if(button.id==='sp-take'){
    const origin=selected,revision=selectionRevision,originStep=getStep();
    await preparation.update([origin],{state:'picked'});
    if(active&&revision===selectionRevision&&originStep===getStep()){const next=needed().find(id=>preparation.view.byId.get(id)!.state==='available');if(next!==undefined)selected=next;render();}
   }else if(button.id==='sp-return')await preparation.update([selected],{state:'available'});
  }catch{/* The shared controller retains the old inventory and renders the error. */}
 });
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')close();});label.onclick=()=>open(selected);
 onLocale(()=>{const focused=document.activeElement?.closest<HTMLElement>('#servo-pickup button'),id=focused?.id,slot=focused?.dataset.id;root.setAttribute('aria-label',assemblyText('assemble.ui.0103'));render();if(id)root.querySelector<HTMLElement>('#'+id)?.focus({preventScroll:true});else if(slot)root.querySelector<HTMLElement>(`[data-id="${slot}"]`)?.focus({preventScroll:true});});
 preparation.subscribe(()=>{render();onChange?.();});render();
 return {
  open,close,updateLabel,stepChanged(){close();render();},
  get active(){return active;},
  async completeStep(index:number,stillCurrent=()=>true){
   if(!preparation.supported)return true;
   const ids=installationServosForStep(map,index).filter(b=>preparation.view.byId.get(b.id)!.state!=='installed').map(b=>b.id);
   if(!ids.length)return true;
   try{await preparation.update(ids,{state:'installed'});return true;}catch{if(stillCurrent())open(ids[0]!);return false;}
  }
 };
}
