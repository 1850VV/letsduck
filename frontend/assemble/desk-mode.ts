import type {Chapter,Actor,State} from './types.js';
import {byId as $} from './dom.js';
// Desk mode: the guide is read from about a metre away while both hands hold parts.
// Big caption, keyboard steps, a parts kit at each chapter start, right/wrong cards on
// steps that are hard to undo, and one "I'm stuck" button that opens the source clip.
import {STEPS,CHAPTERS,ACTORS,snapshot,chapterFor} from './hardware-state.js';


const DESK='letsduck-assemble-desk';
const screwSize=(f:string|null|undefined)=>{const m=/M([\d.]+)x([\d.]+)/.exec(f||'');return m&&{label:`M${m[1]}×${m[2]}`,d:Number(m[1]),len:Number(m[2])};};
const chipName=(a:Actor)=>a.chip||a.label.split(' · ')[0];

// Parts that first appear between two snapshots, grouped the way a person lays them out on the desk.
function newParts(from:number,to:number){
  const a:State=from<0?{}:snapshot(from,1),b=snapshot(to,1),parts=new Map<string,{name:string;color:string;count:number}>(),screws=new Map<string,{label:string;d:number;len:number;count:number}>();
  for(const [id,pose] of Object.entries(b)){
    const actor=ACTORS[id];
    if(!pose.visible||a[id]?.visible||!actor)continue;
    if(actor.kind==='screw'){const s=screwSize(actor.fastener);if(!s)continue;const e=screws.get(s.label)||{...s,count:0};e.count++;screws.set(s.label,e);continue;}
    if(['horn','plug'].includes(actor.kind!))continue;
    const name=chipName(actor)!,e=parts.get(name)||{name,color:actor.color||'#9ba7b9',count:0};e.count++;parts.set(name,e);
  }
  return{parts:[...parts.values()],screws:[...screws.values()]};
}
export const kitFor=(chapter:Chapter)=>newParts(chapter.start-1,chapter.end);
export const screwsFor=(index:number)=>index>0?newParts(index-1,index).screws:[];

const ART={
 horn:[`<svg viewBox="0 0 150 90"><rect x="22" y="25" width="60" height="45" rx="5" fill="#252b36"/><circle cx="98" cy="47" r="16" fill="#111317"/><circle cx="98" cy="47" r="3" fill="#a9b1bd"/><rect x="84" y="68" width="17" height="9" rx="2" fill="#fff" stroke="#a9b1bd"/><path d="M87 71h11v4H87z" fill="#687384"/><path d="M120 30a22 22 0 010 34" stroke="#1f9d6a" stroke-width="3" fill="none"/><path d="M114 64l6 1 1-6" stroke="#1f9d6a" stroke-width="3" fill="none"/></svg>`,'认准插座开口同侧，再卸副盘',
       `<svg viewBox="0 0 150 90"><rect x="22" y="25" width="60" height="45" rx="5" fill="#252b36"/><g transform="rotate(35 98 47)"><circle cx="98" cy="47" r="16" fill="#111317"/><rect x="95" y="25" width="6" height="44" fill="#e5484d"/></g><path d="M98 15a32 32 0 0128 22" stroke="#e5484d" stroke-width="3" fill="none" stroke-dasharray="4 3"/></svg>`,'不能拆主舵盘或输出轴','只拆副舵盘，主舵盘不拆'],
 plug:[`<svg viewBox="0 0 150 90"><rect x="70" y="22" width="50" height="46" rx="4" fill="#252b36"/><rect x="66" y="38" width="6" height="14" fill="#f5f6fa"/><rect x="22" y="30" width="36" height="30" rx="3" fill="#f4f5f9" stroke="#b8bcc6"/><rect x="56" y="40" width="8" height="10" fill="#1f9d6a"/></svg>`,'凸起对缺口，一推到底',
       `<svg viewBox="0 0 150 90"><rect x="70" y="22" width="50" height="46" rx="4" fill="#252b36"/><rect x="66" y="38" width="6" height="14" fill="#f5f6fa"/><rect x="22" y="30" width="36" height="30" rx="3" fill="#f4f5f9" stroke="#b8bcc6"/><rect x="16" y="40" width="8" height="10" fill="#e5484d"/><path d="M60 34l6 6m0-6l-6 6" stroke="#e5484d" stroke-width="3"/></svg>`,'反着硬插，针会弯','插头有方向'],
 screw:[`<svg viewBox="0 0 150 90"><rect x="20" y="40" width="110" height="40" fill="#f4f5f9" stroke="#d4d9e3"/><rect x="62" y="30" width="26" height="10" rx="2" fill="#a9b1bd"/><rect x="72" y="40" width="6" height="34" fill="#8d97a6"/><path d="M58 40h34" stroke="#1f9d6a" stroke-width="3"/></svg>`,'螺丝头刚贴平就停',
        `<svg viewBox="0 0 150 90"><rect x="20" y="40" width="110" height="40" fill="#f4f5f9" stroke="#d4d9e3"/><rect x="62" y="44" width="26" height="10" rx="2" fill="#a9b1bd"/><rect x="72" y="54" width="6" height="30" fill="#8d97a6"/><path d="M50 40c6 8 12 8 18 2m14 0c6 6 12 6 18-2" stroke="#e5484d" stroke-width="2" fill="none"/></svg>`,'拧到打滑，打印孔就废了','贴平就停'],
};
// Only steps that are easy to get wrong and hard to undo get a card. It never blocks the step.
const plugSteps=new Set(['r-wire-a','l-wire-a','t-wire','t-motor-r','t-motor-l','head-yaw-wire','head-neck-wire','final-power','final-buses']);
const guardFor=(id:string)=>/horn/.test(id)?ART.horn:/-plug$/.test(id)||plugSteps.has(id)?ART.plug:/tighten/.test(id)?ART.screw:null;

export function createDeskMode({getStep,isReady,openReference,canvas,openChapter,closeChapter}:{getStep:()=>number;isReady:()=>boolean;openReference:()=>void;canvas:HTMLCanvasElement;openChapter:(chapter:Chapter)=>void;closeChapter:()=>void}){
  let desk=true,kitShownFor:string|null=null,last=-1;
  try{desk=localStorage.getItem(DESK)!=='off';}catch{}

  const journey=$('journey');
  journey.replaceChildren(...CHAPTERS.map(c=>{const s=document.createElement('span');s.title=c.name;return s;}));

  function setDesk(on:boolean){
    desk=on;document.body.classList.toggle('desk',on);
    $('desk-toggle').setAttribute('aria-pressed',String(on));
    try{localStorage.setItem(DESK,on?'on':'off');}catch{}
    dispatchEvent(new Event('resize'));
  }

  function showKit(c:Chapter){
    kitShownFor=c.id;openChapter(c);
  }
  const closeKit=()=>closeChapter();

  function sync(step:number){
    const s=STEPS[step]!,c=chapterFor(step)!,local=step-c.start+1,ci=CHAPTERS.indexOf(c);
    [...journey.querySelectorAll<HTMLElement>(':scope > *')].forEach((el,i)=>{el.className=i<ci?'done':i===ci?'current':'';el.style.setProperty('--p',`${Math.round(local/(c.end-c.start+1)*100)}%`);});
    $('desk-count').textContent=s.complete?`${c.name} · 完成`:`${c.name} · 第 ${local} / ${c.end-c.start+1} 步 · 第 ${ci+1} 章 / ${CHAPTERS.length}`;
    $('desk-title').textContent=s.title;
    $('desk-specs').innerHTML=screwsFor(step).map(x=>`<span>${x.label} ×${x.count}</span>`).join('');
    const g=guardFor(s.id);
    $('guard-card').hidden=!g;
    if(g)$('guard-card').innerHTML=`<b>${g[4]}</b><div><figure class="ok">${g[0]}<figcaption>✓ ${g[1]}</figcaption></figure><figure class="bad">${g[2]}<figcaption>✗ ${g[3]}</figcaption></figure></div>`;
    $('desk-recenter').hidden=true;
    if(step!==last){
      if(step===c.start&&kitShownFor!==c.id)showKit(c);else if(step!==c.start)closeKit();
      last=step;
    }
  }

  function next(){
    if(!$('kit').hidden)return $('kit-go').click();
    const b=getStep()===0?$('start'):$('next');
    if(!b.hidden)b.click();
  }
  function stuck(){
    closeKit();
    $('reference-check').textContent=STEPS[getStep()]!.check||'';
    openReference();
  }

  $('desk-toggle').addEventListener('click',()=>setDesk(!desk));
  $('stuck').addEventListener('click',stuck);
  $('desk-recenter').addEventListener('click',()=>{$('reset-view').click();$('desk-recenter').hidden=true;});
  canvas.addEventListener('pointerdown',()=>{if(isReady())$('desk-recenter').hidden=false;});
  canvas.addEventListener('wheel',()=>{if(isReady())$('desk-recenter').hidden=false;},{passive:true});

  window.addEventListener('keydown',e=>{
    if(!isReady()||e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey||e.isComposing)return;
    if(e.key===' '&&(e.target instanceof Element?e.target:null)?.closest('button,ryugi-button,ryugi-switch,[role="switch"]'))return;
    if((e.target instanceof Element?e.target:null)?.closest('input,textarea,select,video,ryugi-select,ryugi-slider,summary')||document.querySelector('dialog[open]'))return;
    const k=e.key;
    if(k===' '||k==='ArrowRight'||k==='PageDown'){e.preventDefault();next();}
    else if(k==='ArrowLeft'||k==='PageUp'){e.preventDefault();closeKit();$('back').click();}
    else if(k==='f'||k==='F')setDesk(!desk);
    else if(k==='h'||k==='H')$('reference-panel').hidden?stuck():$('reference-close').click();
    else if(k==='v'||k==='V')$('desk-recenter').click();
    else if(k==='Escape'){closeKit();if(!$('reference-panel').hidden)$('reference-close').click();}
  });

  setDesk(desk);
  return{sync};
}
