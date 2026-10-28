import {dt,debugFailure,displayError} from './i18n.js';
import {IDS,role} from './state.js';
import {setLocalizedHTML,isRefreshingCopy} from './localized-dom.js';
import {jsonStringify,parseResponseJson} from '../shared/json.js';
import {deriveServoStatus} from '../assemble/servo-status.js';
import {parseSetupState,record} from '../assemble/servo-types.js';
import type {SetupUiState} from '../assemble/servo-types.js';
import servoMap from '../assemble/servo-map.json' with {type:'json'};

interface Options {api(action:string):Promise<unknown>;busy():boolean;setBusy(value:boolean):void;select(id:number):void;render():void;poll():Promise<void>}
const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** The panel observes snapshots; explicit buttons reuse the existing Setup worker. */
export function createAutomaticNumbering(options:Options){
 let active=false,selectedId=IDS[0]!,state:SetupUiState={phase:'idle',records:[]},notice:unknown=null,timer:ReturnType<typeof setTimeout>|undefined,lastHTML='';
 const status=()=>deriveServoStatus(state,servoMap);
 async function call(action='state',body:Record<string,unknown>={}){
  const response=await fetch('/api/servo-setup/'+action,action==='state'?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:jsonStringify(body)});
  const value=await parseResponseJson(response),answer=record(value);
  if(!response.ok)throw Object.assign(displayError('操作未完成'),answer);
  state=parseSetupState(value);return state;
 }
 async function poll(){
  clearTimeout(timer);if(!active)return;
  try{await call();}catch(error){notice=error;}
  if(active){options.render();timer=setTimeout(poll,500);}
 }
 function choose(id:number){if(!IDS.includes(id))return;selectedId=id;options.select(id);options.render();}
 async function enter(){
  active=true;notice=null;lastHTML='';
  try{await call();choose(state.activeTarget??state.targetId??IDS[0]!);}catch(error){notice=error;}
  options.render();timer=setTimeout(poll,500);
 }
 async function leave(){
  clearTimeout(timer);
  try{await call('pause');active=false;clearTimeout(timer);}catch(error){notice=error;timer=setTimeout(poll,500);throw error;}
 }
 async function action(action:string){
  if(options.busy())return;
  options.setBusy(true);notice=null;options.render();
  try{
   if(action==='start'){
    // Release drains manual scan/control, turns output off and revokes Debug ownership.
    await options.api('release');
    if(!active)return;
    const target=state.activeTarget??state.currentId??selectedId;
    await call('start',status().verified.has(target)?{}:{targetId:target});
   }else if(action==='stop'){
    await options.api('release');await call();
   }else await call(action==='clear'?'queue':action,action==='clear'?{id:null}:action==='queue'?{id:selectedId}:{});
   void options.poll();
  }catch(error){notice=error;}
  finally{options.setBusy(false);options.render();}
 }
 function renderPanel(){
  const s=status(),busy=options.busy(),progress=typeof state.progress==='number'?state.progress:0;
  const current=state.activeTarget??state.currentId??selectedId,seconds=state.shutdownAt?Math.max(0,Math.ceil((state.shutdownAt+15000-Date.now())/1000)):0;
  const complete=s.complete,working=state.phase==='working',waiting=state.phase==='shutdown'||state.phase==='offline'&&state.running;
  const phase=complete?dt('编号完成'):state.phase==='paused'?dt('已暂停编号'):state.phase==='blocked'?dt('操作未完成'):state.phase==='shutdown'&&seconds?dt('关机后等待 {seconds} 秒',{seconds}):waiting?dt('等待上电后继续'):state.phase==='success'?dt('等待关机换接'):working?dt(state.profile?progress>=4?'读回复核':progress>=1?'初始化写入':'扫描识别':'识别配置档'):dt('尚未开始');
  const message=notice?String(debugFailure(notice)):state.messageCode||state.message?String(debugFailure(state)):dt('开始后自动识别');
  const button=(id:string,text:string,action:string,disabled=false,primary=false)=>`<button id="auto-${id}" type="button" class="${primary?'primary':'secondary'}" data-auto-action="${action}" ${disabled?'disabled':''}>${escape(text)}</button>`;
  const next=state.queuedTarget??state.targetId,canChangeQueue=!!state.running||state.phase==='paused',canQueue=canChangeQueue&&!s.verified.has(selectedId)&&selectedId!==current&&selectedId!==state.queuedTarget;
  const primary=working?button('pause',dt('暂停编号'),'pause',busy,true):waiting?button('waiting',phase,'start',true,true):state.running&&s.canHalt?button('halt',dt('关机换接'),'halt',busy,true):complete?'':button('start',dt(state.phase==='idle'?'开始编号':'继续编号'),'start',busy,true);
  const heading=`<div class="panel-heading"><h2>${dt('自动编号')}</h2><span class="auto-phase ${notice||state.phase==='blocked'?'error':complete?'good':''}">${escape(phase)}</span></div>
   <div class="auto-progress"><span id="auto-progress">${dt('已验证 {count}/15',{count:String(s.verified.size)})}</span><progress max="15" value="${s.verified.size}" aria-label="${dt('已验证 {count}/15',{count:String(s.verified.size)})}"></progress></div>`;
  const html=heading+(complete?`<section id="auto-complete"><span class="auto-complete-icon" aria-hidden="true">✓</span><h3>${dt('编号完成')}</h3><div class="auto-complete-groups">${[['左腿','10–14'],['右腿','20–24'],['头颈与鸭嘴','30–34']].map(([group,ids])=>`<p data-auto-group>${dt(group!)} · ID ${ids}<span>5 / 5 ✓</span></p>`).join('')}</div><p class="control-note">${dt('编号完成不代表机械零位已校准。')}</p></section><div class="panel-grow"></div><div class="auto-actions"><button id="auto-manual" type="button" class="primary" data-workbench="servo" ${busy?'disabled':''}>${dt('返回手动设置')}</button>${button('stop',dt('停止并卸载'),'stop',busy)}</div>`:
   `<div class="auto-target"><div><small>${dt('当前目标')}</small><h3 id="auto-target">ID ${current}</h3><p>${escape(role(current))}</p></div><span>${s.known?s.online.size?[...s.online].map(id=>'ID '+id).join(' / '):dt('当前未在线'):dt('未确认')}</span></div>
   <div class="auto-profile"><span>${dt('运行端配置档')}</span><small id="auto-profile">${escape(state.profile?.name??dt('开始后自动识别'))}</small><div>KP <b>${state.profile?.kp??'—'}</b><span>KD <b>${state.profile?.kd??'—'}</b></span></div></div>
   <ol class="auto-steps">${['扫描识别','初始化写入','读回复核'].map((text,index)=>`<li class="${working&&(index===0&&progress<1||index===1&&progress>=1&&progress<4||index===2&&progress>=4)?'active':''}"><i>${index+1}</i>${dt(text)}</li>`).join('')}</ol>
   <div class="auto-message ${notice||state.phase==='blocked'?'error':''}" role="status"><b>${escape(phase)}</b><p>${escape(message)}</p></div>
   <div class="auto-queue"><span>${dt('下一只')}</span><b>${next?dt('下一只 ID{id}',{id:String(next)}):'—'}${state.queuedTarget!==null&&state.queuedTarget!==undefined?`<button id="auto-clear" type="button" data-auto-action="clear" aria-label="${dt('移除下一只')}" ${busy||!canChangeQueue?'disabled':''}>×</button>`:''}</b><div><span>${dt('目标 ID{id}',{id:String(selectedId)})} · ${escape(role(selectedId))}</span>${button('queue',dt(state.queuedTarget===selectedId?'已加入下一只队列':'加入下一只队列'),'queue',busy||!canQueue)}</div></div>
   <div class="panel-grow"></div><div class="auto-actions">${primary}<div class="action-pair">${!working&&state.running&&!complete?button('pause',dt('暂停编号'),'pause',busy):''}${button('stop',dt('停止并卸载'),'stop',busy)}</div>${!state.running&&s.canHalt?button('halt',dt('关机换接'),'halt',busy):''}</div>`);
  const panel=document.getElementById('panel')!;
  if(html!==lastHTML||isRefreshingCopy()){
   const focus=document.activeElement?.closest<HTMLElement>('#panel [data-auto-action]')?.id;
   setLocalizedHTML(panel,html);lastHTML=html;
   if(focus&&!isRefreshingCopy())document.getElementById(focus)?.focus({preventScroll:true});
  }
  return true;
 }
 document.body.addEventListener('click',event=>{const button=event.target instanceof Element?event.target.closest<HTMLButtonElement>('[data-auto-action]'):null;if(active&&button&&!button.disabled)void action(button.dataset.autoAction!);});
 window.addEventListener('pagehide',()=>{if(!active)return;active=false;clearTimeout(timer);void fetch('/api/servo-setup/pause',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',keepalive:true}).catch(()=>{});},{once:true});
 return {enter,leave,choose,renderPanel,release:()=>action('stop'),get active(){return active;},get verified(){return status().verified;},get queuedTarget(){return state.queuedTarget;}};
}
