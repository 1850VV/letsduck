import {assemblyText,assemblyField,bindAssemblyTranslations,assemblyApiError,assemblyErrorText,assemblyResponseText} from './i18n.js';
import {onLocale,formatDate} from '../shared/i18n.js';
import {parseResponseJson,jsonStringify} from '../shared/json.js';
import {byId} from './dom.js';
import {record,parseSetupState,type SetupUiState} from './servo-types.js';
import type {EntityMap,Actor,State} from './types.js';
import type {HardwareModelFactory} from './hardware-models.js';
import type {ResolvedBinding} from './servo-types.js';
import type {ServoMapping} from './servo-types.js';
import {createServoScene} from './servo-scene.js';
import {deriveServoStatus,ServoSelection} from './servo-status.js';
import {servoLeadMarkup,type createServoAssemblyData} from './servo-preparation.js';
const escape=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const button=(text:string,action:string,secondary=false,disabled=false)=>`<button type="button" class="sv-${secondary?'secondary':'primary'}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const fact=(name:string,value:unknown,bad:unknown=false)=>`<div class="sv-fact ${bad?'bad':''}"><span>${name}</span><b>${escape(value)}</b></div>`;
const names=()=>({pending:assemblyText("assemble.ui.0130"),working:assemblyText("assemble.ui.0131"),verified:assemblyText("assemble.ui.0132"),review:assemblyText("assemble.ui.0133")}),marks={pending:'○',working:'◌',verified:'✓',review:'△'};

export async function createServoWorkbench({map,assemblyData,hardware,entities,actors,poses,onVisibility,onInstall,onGuide}:{map:ServoMapping;assemblyData:ReturnType<typeof createServoAssemblyData>;hardware:HardwareModelFactory;entities:EntityMap;actors:Record<string,Actor>;poses:State;onVisibility:(visible:boolean)=>void;onInstall:(binding:ResolvedBinding)=>void;onGuide:()=>void}){
 const root=byId('servo-workbench'),entry=byId('servo-open'),choice=new ServoSelection(map.bindings.map(b=>b.id));
 let active=false,scene:ReturnType<typeof createServoScene>|null=null,data:SetupUiState={phase:'idle',records:assemblyData.records},requesting=false,polling=false,timer:ReturnType<typeof setTimeout>|null=null,epoch=0,pendingAudit:number|undefined|null=null,panelHTML='',sceneKey='',completionOpen=false,wasComplete=false,notice:unknown=null,selectionRevision=0;
 const {preparation,supported}=assemblyData;
 const $=(id:string)=>byId('sv-'+id),recordFor=assemblyData.recordFor,binding=(id:number)=>map.byId.get(id);
 root.innerHTML=`<div class="sv-heading"><div><p data-assemble-i18n="assemble.ui.0134">${assemblyText("assemble.ui.0134")}</p><h1 id="sv-title" data-assemble-i18n="assemble.ui.0135">${assemblyText("assemble.ui.0135")}</h1></div><div class="sv-device"><i id="sv-dot"></i><span id="sv-device" data-assemble-i18n="assemble.ui.0136">${assemblyText("assemble.ui.0136")}</span></div><button type="button" id="sv-close" class="sv-back" data-assemble-i18n="assemble.ui.0137">${assemblyText("assemble.ui.0137")}</button></div>
 <div class="sv-layout"><section class="sv-model"><div class="sv-caption"><b data-assemble-i18n="assemble.ui.0138">${assemblyText("assemble.ui.0138")}</b><span data-assemble-i18n="assemble.ui.0139">${assemblyText("assemble.ui.0139")}</span></div>
 <div class="sv-stage"><div id="sv-viewport" aria-label="${assemblyText("assemble.ui.0140")}"></div><div class="sv-stage-top"><span id="sv-tag"></span><button id="sv-arrange" type="button" aria-pressed="false" data-assemble-i18n="assemble.ui.0141">${assemblyText("assemble.ui.0141")}</button></div><div id="sv-labels" class="sv-labels"></div><span class="sv-stage-bottom" data-assemble-i18n="assemble.ui.0142">${assemblyText("assemble.ui.0142")}</span></div>
 <div class="sv-inventory"><div class="sv-inventory-title"><b id="sv-count"></b><span id="sv-counts"></span><button type="button" id="sv-completion" data-action="completion" hidden data-assemble-i18n="assemble.ui.0143">${assemblyText("assemble.ui.0143")}</button></div><div class="sv-meter"><span id="sv-meter"></span></div><div id="sv-slots" class="sv-slots"></div><div class="sv-inventory-meta"><div class="sv-legend"><span data-assemble-i18n="assemble.ui.0144">${assemblyText("assemble.ui.0144")}</span><span class="verified" data-assemble-i18n="assemble.ui.0145">${assemblyText("assemble.ui.0145")}</span><span class="review" data-assemble-i18n="assemble.ui.0146">${assemblyText("assemble.ui.0146")}</span><span><i class="sv-online-dot"></i>${assemblyText("assemble.ui.0147")}</span></div><div><span id="sv-online"></span><button id="sv-refresh" type="button" data-action="refresh" aria-label="${assemblyText("assemble.ui.0148")}" title="${assemblyText("assemble.ui.0148")}">↻</button></div></div><p id="sv-next"></p><p id="sv-preparation-count" hidden></p></div>
 <p class="sv-mapping-note" data-assemble-i18n="assemble.ui.0149">${assemblyText("assemble.ui.0149")}</p></section><aside id="sv-panel" class="sv-panel" aria-live="polite"></aside></div>
 <div class="sv-flow"><b data-assemble-i18n="assemble.ui.0150">${assemblyText("assemble.ui.0150")}</b><span>→</span><b data-assemble-i18n="assemble.ui.0151">${assemblyText("assemble.ui.0151")}</b><span>→</span><b data-assemble-i18n="assemble.ui.0152">${assemblyText("assemble.ui.0152")}</b><span>→</span><b data-assemble-i18n="assemble.ui.0153">${assemblyText("assemble.ui.0153")}</b></div>`;
 for(const b of map.bindings){const el=document.createElement('button');el.type='button';el.className='sv-slot';el.dataset.id=String(b.id);el.onclick=()=>choose(b.id);$('slots').append(el);}
 const location=(id:number)=>`<div class="sv-position"><strong>ID ${id} · ${escape(assemblyField('binding',String(id),'role',binding(id)!.role))}${binding(id)!.status==='candidate'?assemblyText("assemble.ui.0154"):''}</strong><span data-assemble-i18n="assemble.ui.0155">${assemblyText("assemble.ui.0155")}</span></div>`;
 function completePanel(){
  let html=`<p class="sv-kicker" data-assemble-i18n="assemble.ui.0156">${assemblyText("assemble.ui.0156")}</p><div class="sv-completion-icon">✓</div><h2 class="sv-completion-title" data-assemble-i18n="assemble.ui.0157">${assemblyText("assemble.ui.0157")}<br data-assemble-i18n="assemble.ui.0158">${assemblyText("assemble.ui.0158")}</h2><p data-assemble-i18n="assemble.ui.0159">${assemblyText("assemble.ui.0159")}<br data-assemble-i18n="assemble.ui.0160">${assemblyText("assemble.ui.0160")}</p><ul class="sv-completion-list"><li data-assemble-i18n="assemble.ui.0161">${assemblyText("assemble.ui.0161")}</li><li data-assemble-i18n="assemble.ui.0162">${assemblyText("assemble.ui.0162")}</li><li data-assemble-i18n="assemble.ui.0163">${assemblyText("assemble.ui.0163")}</li></ul>`;
  html+=`<p class="sv-small">${assemblyText("assemble.ui.0164",{p0:preparation.view.counts.prepared})}</p>`;
  if(data.shutdownAt&&!data.online){const left=Math.max(0,Math.ceil((data.shutdownAt+15000-Date.now())/1000));html+=`<div class="sv-status" data-assemble-i18n="assemble.ui.0169">${assemblyText("assemble.ui.0169")}</div><p>${assemblyText("assemble.ui.0170",{p0:left?assemblyText("assemble.ui.0165")+left+assemblyText("assemble.ui.0166"):''})}</p><div class="sv-grow"></div>${button(assemblyText("assemble.ui.0167"),'assembly',false,left>0)}${button(assemblyText("assemble.ui.0168"),'inspect',true)}`;}
  else html+=`<div class="sv-grow"></div>${button(assemblyText("assemble.ui.0171"),'finish-halt',false,!data.online)}${button(assemblyText("assemble.ui.0172"),'inspect',true)}<p class="sv-small" data-assemble-i18n="assemble.ui.0173">${assemblyText("assemble.ui.0173")}</p>`;
  return html;
 }
 function render(){
  if(!active)return;
  const physical=preparation.view;
  const state=deriveServoStatus(data,map),id=choice.selected,item=state.items.get(id)!,r=item.record!,live=state.liveFor(id),busy=data.phase==='working',profile=data.profile;
  const leadItem=physical.byId.get(id)!,canPrepare=preparation.loaded&&leadItem.leadKnown&&!leadItem.prepared&&item.status==='verified'&&!busy,prepareHalt=canPrepare&&state.canHalt&&data.currentId===id;
  if(state.complete&&!wasComplete){completionOpen=true;choice.view='tray';}if(!state.complete)completionOpen=false;wasComplete=state.complete;
  $('title').textContent=state.complete?assemblyText("assemble.ui.0174"):assemblyText("assemble.ui.0135");$('device').textContent=data.online?assemblyText("assemble.ui.0175"):assemblyText("assemble.ui.0176");$('dot').classList.toggle('online',!!data.online);
  $('arrange').textContent=choice.view==='tray'?assemblyText("assemble.ui.0177"):assemblyText("assemble.ui.0141");$('arrange').setAttribute('aria-pressed',String(choice.view==='tray'));
  $('tag').textContent=choice.view==='tray'?assemblyText("assemble.ui.0178"):assemblyText("assemble.ui.0179");
  $('count').textContent=state.complete?assemblyText("assemble.ui.0180"):assemblyText("assemble.ui.0181",{p0:state.verified.size});
  $('counts').textContent=state.complete?assemblyText("assemble.ui.0182"):assemblyText("assemble.ui.0185",{p0:state.pending.size,p1:busy?assemblyText("assemble.ui.0183"):'',p2:state.review.size?assemblyText("assemble.ui.0184")+state.review.size:''});
  $('meter').style.width=state.verified.size/15*100+'%';root.querySelector('.sv-inventory')!.classList.toggle('complete',state.complete);$('completion').hidden=!state.complete;
  for(const el of $('slots').querySelectorAll<HTMLElement>(':scope > *')){const n=Number(el.dataset.id),it=state.items.get(n)!;el.className='sv-slot '+it.status+(n===id?' active':'');el.dataset.status=it.status;el.dataset.pickState=preparation.loaded?physical.byId.get(n)!.state:'unknown';el.classList.toggle('taken',preparation.loaded&&physical.byId.get(n)!.state!=='available');el.dataset.online=String(it.online);el.innerHTML=`<span class="sv-mark">${marks[it.status]}</span><b>${n}</b>${it.online?'<i class="sv-online-dot"></i>':''}`;el.setAttribute('aria-label',`ID ${n}，${names()[it.status]}，${it.online?assemblyText("assemble.ui.0147"):state.known?assemblyText("assemble.ui.0186"):assemblyText("assemble.ui.0187")}`);el.setAttribute('aria-pressed',String(n===id));}
  $('online').textContent=state.known?state.online.size?assemblyText("assemble.ui.0188")+[...state.online].map(n=>map.byId.has(n)?'ID'+n:assemblyText("assemble.ui.0189")+n).join('、'):assemblyText("assemble.ui.0190"):data.scan?.active?assemblyText("assemble.ui.0191",{p0:data.scan.checked,p1:data.scan.total}):assemblyText("assemble.ui.0187");
  byId('sv-refresh').disabled=!!(requesting||busy||data.scan?.active||!!data.shutdownAt&&!data.online);
  $('next').textContent=state.complete?assemblyText("assemble.ui.0192"):busy?assemblyText("assemble.ui.0193",{p0:data.activeTarget||data.currentId||data.targetId||'…'}):assemblyText("assemble.ui.0198",{p0:state.review.size?assemblyText("assemble.ui.0194")+[...state.review].join('、')+'。':'',p1:data.queuedTarget?assemblyText("assemble.ui.0195")+state.nextTarget+assemblyText("assemble.ui.0196"):state.nextTarget?assemblyText("assemble.ui.0197")+state.nextTarget+'。':''});
  $('preparation-count').hidden=!preparation.supported;
  $('preparation-count').textContent=preparation.loaded?assemblyText("assemble.ui.0199",{p0:physical.counts.available,p1:physical.counts.picked,p2:physical.counts.installed,p3:physical.counts.prepared}):preparation.error||assemblyText("assemble.ui.0200");
  let html='';
  if(state.complete&&completionOpen)html=completePanel();
  else{
   html=`<p class="sv-kicker">${choice.manual?assemblyText("assemble.ui.0201"):assemblyText("assemble.ui.0202")} · ID ${id}</p><h2>${item.status==='review'?assemblyText("assemble.ui.0203")+id:r?assemblyText("assemble.ui.0204"):assemblyText("assemble.ui.0205")+id}</h2><span class="sv-status-pill ${item.status}">${marks[item.status]} ${names()[item.status]}${item.online?assemblyText("assemble.ui.0206"):''}</span>${location(id)}${servoLeadMarkup(preparation,id)}`;
   if(busy)html+=`<div class="sv-job"><b>${assemblyText("assemble.ui.0208",{p0:data.activeTarget||data.currentId||data.targetId||'…'})}</b><br>${escape(assemblyResponseText(data,'message'))}${data.queuedTarget?`<br>${assemblyText("assemble.ui.0207")} `+data.queuedTarget:''}</div>`;
   if(preparation.error)html+=`<div class="sv-status alert">${escape(preparation.error)}</div>`;
   if(notice)html+=`<div class="sv-status alert">${escape(assemblyErrorText(notice))}</div>`;
   if(!busy&&data.phase==='blocked')html+=`<div class="sv-status alert">${escape(assemblyResponseText(data,'message'))}</div>`;
   if(item.status==='review')html+=`<div class="sv-status alert">${assemblyText("assemble.ui.0212",{p0:escape(r?.mapVersion!==map.version?assemblyText("assemble.ui.0209"):r?.state==='reported'?assemblyText("assemble.ui.0210"):(r?assemblyResponseText(r,'reviewReason'):'')||assemblyText("assemble.ui.0211"))})}</div>`;
   if(r||item.online){
    if(busy)html+=`<p data-assemble-i18n="assemble.ui.0213">${assemblyText("assemble.ui.0213")}</p>`;
    else if(live){const v=live.readback!,match=profile&&v.kp===profile.kp&&v.kd===profile.kd;html+=`<div class="sv-facts">${fact(assemblyText("assemble.ui.0214"),id+assemblyText("assemble.ui.0215"))}${fact('KP'+(profile?assemblyText("assemble.ui.0216")+profile.kp:''),v.kp,profile&&v.kp!==profile.kp)}${fact('KD'+(profile?assemblyText("assemble.ui.0216")+profile.kd:''),v.kd,profile&&v.kd!==profile.kd)}${fact(assemblyText("assemble.ui.0217"),v.raw_pos)}${fact(assemblyText("assemble.ui.0218"),formatDate(new Date(live.observedAt!),{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}))}</div>`;if(match&&item.status==='verified')html+=`<div class="sv-status" data-assemble-i18n="assemble.ui.0219">${assemblyText("assemble.ui.0219")}</div>`;if(profile&&!match){html+=button(assemblyText("assemble.ui.0220"),'repair',false,requesting||state.online.size!==1);if(state.online.size!==1)html+=`<p class="sv-small" data-assemble-i18n="assemble.ui.0221">${assemblyText("assemble.ui.0221")}</p>`;}}
    else if(data.inspection?.id===id&&data.inspection.status==='reading')html+=`<div class="sv-status" data-assemble-i18n="assemble.ui.0222">${assemblyText("assemble.ui.0222")}</div>`;
    else html+=`<div class="sv-status ${item.status==='verified'?'':'alert'}">${state.known?assemblyText("assemble.ui.0223"):assemblyText("assemble.ui.0224")}${item.status==='verified'?assemblyText("assemble.ui.0225"):''}</div><div class="sv-facts">${fact(assemblyText("assemble.ui.0226"),r?.readback?.kp!==undefined?'KP '+r.readback.kp+' / KD '+r.readback.kd:assemblyText("assemble.ui.0227"))}${fact(assemblyText("assemble.ui.0228"),assemblyText("assemble.ui.0229"))}</div>`;
    html+=button(assemblyText("assemble.ui.0230"),'audit',true,requesting||busy);
    if(item.canResume)html+=button(assemblyText("assemble.ui.0231"),'recover',false,requesting||!state.known||state.online.size!==1||!profile||![r.id,r.sourceId].some(n=>state.online.has(n!)));
    if(r?.midEvidence==='unconfirmed')html+=`<p class="sv-small" data-assemble-i18n="assemble.ui.0232">${assemblyText("assemble.ui.0232")}</p>`;
   }else{
    const connected=[...state.online],wrong=connected.some(n=>map.byId.has(n));
    html+=`<div class="sv-facts">${fact(assemblyText("assemble.ui.0233"),'ID '+id+(choice.manual?assemblyText("assemble.ui.0234"):assemblyText("assemble.ui.0235")))}${fact(assemblyText("assemble.ui.0236"),!state.known?assemblyText("assemble.ui.0237"):connected.length===1?'ID '+connected[0]:connected.length>1?connected.length+assemblyText("assemble.ui.0238"):assemblyText("assemble.ui.0239"))}${profile?fact(assemblyText("assemble.ui.0240"),'KP '+profile.kp+' / KD '+profile.kd):fact(assemblyText("assemble.ui.0241"),assemblyText("assemble.ui.0242"))}</div>`;
    if(wrong)html+=`<div class="sv-status alert" data-assemble-i18n="assemble.ui.0243">${assemblyText("assemble.ui.0243")}</div>`;
    if(connected.length>1)html+=`<div class="sv-status alert" data-assemble-i18n="assemble.ui.0244">${assemblyText("assemble.ui.0244")}</div>`;
    html+='<div class="sv-grow"></div>'+(busy||data.running?button((data.queuedTarget===id?assemblyText("assemble.ui.0195"):assemblyText("assemble.ui.0245"))+id,'queue',false,requesting||id===(data.activeTarget??data.currentId)||data.queuedTarget===id):button(assemblyText("assemble.ui.0205")+id,'configure',false,requesting||!state.known||connected.length!==1||wrong||!profile));
    if(!data.online)html+=`<div class="sv-guide-links"><a href="https://www.arduino.cc/en/software/#app-lab-section" target="_blank" rel="noopener" data-assemble-i18n="assemble.ui.0246">${assemblyText("assemble.ui.0246")}</a><a href="https://www.xgorobot.com/duck.html#software" target="_blank" rel="noopener" data-assemble-i18n="assemble.ui.0247">${assemblyText("assemble.ui.0247")}</a><button type="button" data-action="guide" data-assemble-i18n="assemble.ui.0248">${assemblyText("assemble.ui.0248")}</button></div>`;
   }
   html+='<div class="sv-grow"></div>';
   if(data.shutdownAt&&!data.online){const left=Math.max(0,Math.ceil((data.shutdownAt+15000-Date.now())/1000));html+=`<p>${assemblyText("assemble.ui.0251",{p0:left?assemblyText("assemble.ui.0165")+left+assemblyText("assemble.ui.0166"):''})}</p>${!data.running?button(assemblyText("assemble.ui.0249"),'resume',false,requesting):`<p class="sv-small" data-assemble-i18n="assemble.ui.0250">${assemblyText("assemble.ui.0250")}</p>`}`;}
   else if(state.canHalt)html+=button(prepareHalt?assemblyText("assemble.ui.0252"):assemblyText("assemble.ui.0253"),prepareHalt?'prepared-halt':'halt',false,requesting||preparation.saving);
   else if(busy)html+=button(assemblyText("assemble.ui.0254"),'pause',true,requesting);
   if(canPrepare&&!prepareHalt)html+=button(assemblyText("assemble.ui.0255"),'prepared-next',false,requesting||preparation.saving);
   else if(!busy&&!state.complete)html+=button(assemblyText("assemble.ui.0256"),'sequential',true,requesting);
  }
  if(html!==panelHTML){const focused=document.activeElement?.closest<HTMLElement>('#sv-panel [data-action]')?.dataset.action;panelHTML=html;$('panel').innerHTML=html;if(focused)$('panel').querySelector<HTMLElement>(`[data-action="${focused}"]`)?.focus();}
  const key=JSON.stringify([physical.slots.map(s=>s.state),choice.selected,choice.labelTarget,choice.view,[...state.items].map(([id,item])=>[id,item.status,item.online])]);
  if(scene&&key!==sceneKey){sceneKey=key;scene.update({selected:id,labelTarget:choice.labelTarget,view:choice.view,done:state.verified,statuses:state.items,online:state.online,preparation:preparation.loaded?physical:null});}
 }
 async function call(action='',body:{id?:number|undefined;targetId?:number|undefined}={}){
  if(action&&requesting){if(action==='audit')pendingAudit=body.id;return;}
  if(!action&&polling)return;
  const version=action?++epoch:epoch;if(action)requesting=true;else polling=true;render();
  try{const response=await fetch('/api/servo-setup'+(action?'/'+action:''),action?{method:'POST',headers:{'Content-Type':'application/json'},body:jsonStringify(body)}:{});const raw:unknown=await parseResponseJson(response),answer=record(raw);if(!response.ok)throw assemblyApiError(answer);if(version===epoch){data=parseSetupState(raw);assemblyData.setRecords(data.records);choice.apply(data);notice=null;}return true;}
  catch(error){if(version===epoch){notice=error;if(!action)data={...data,online:false,telemetry:{known:false,ids:[]}};}return false;}
  finally{if(action)requesting=false;else polling=false;render();if(active&&!requesting&&pendingAudit!==null){const id=pendingAudit;pendingAudit=null;queueMicrotask(()=>call('audit',{id}));}}
 }
 async function poll(){clearTimeout(timer??undefined);if(!active)return;await call();if(active)timer=setTimeout(poll,1000);}
 function choose(id:number){selectionRevision++;choice.choose(id);completionOpen=false;render();call('audit',{id});}
 function close(){selectionRevision++;active=false;root.hidden=true;document.body.classList.remove('servo-open');scene?.setVisible(false);clearTimeout(timer??undefined);onVisibility(false);entry.focus();}
 function open(){active=true;root.hidden=false;document.body.classList.add('servo-open');onVisibility(true);if(!scene)scene=createServoScene({host:$('viewport'),labelsHost:$('labels'),hardware,entities,actors,poses,map,onSelect:choose});scene.setVisible(true);sceneKey='';render();poll();$('close').focus();}
 $('close').onclick=close;$('arrange').onclick=()=>{choice.toggle();render();};
 root.addEventListener('click',async event=>{
  const action=(event.target instanceof Element?event.target:null)?.closest<HTMLElement>('[data-action]')?.dataset.action;if(!action)return;
  if(action==='guide'){close();onGuide();}
  else if(action==='completion'){completionOpen=true;render();}
  else if(action==='inspect'){completionOpen=false;render();call('audit',{id:choice.selected});}
  else if(action==='configure'||action==='recover'){choice.begin();await call('start',{targetId:choice.selected});}
  else if(action==='resume'){choice.begin();await call('start');}
  else if(action==='sequential'){selectionRevision++;choice.sequential(data);render();}
  else if(action==='prepared-next'||action==='prepared-halt'){
   const id=choice.selected,revision=selectionRevision,item=preparation.view.byId.get(id)!;
   if(!item.leadKnown||item.prepared||preparation.saving||requesting||!deriveServoStatus(data,map).verified.has(id))return;
   if(action==='prepared-halt'&&!await call('halt'))return;
   try{
    await preparation.update([id],{preparedLeads:item.leads.map(lead=>lead.key)});
    if(active&&revision===selectionRevision){const state=deriveServoStatus(data,map),next=preparation.view.slots.find(s=>s.leadKnown&&!s.prepared&&state.verified.has(s.id));if(next)choice.choose(next.id);else choice.sequential(data);render();}
   }catch{/* Keep the previous preparation state and show the shared save error. */}
  }
  else if(action==='audit'||action==='repair'||action==='queue')await call(action,{id:choice.selected});
  else if(action==='finish-halt'){completionOpen=true;await call('halt');}
  else if(action==='assembly'){if(deriveServoStatus(data,map).complete&&data.shutdownAt&&Date.now()-data.shutdownAt>=15000){close();onInstall(binding(14)!);}}
  else await call(action);
 });
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')close();});
 entry.hidden=!supported||!assemblyData.historyLoaded;entry.onclick=open;
 if(assemblyData.historyLoaded){const assigned=new Set(data.records.map(r=>r.id));data.targetId=map.bindings.find(b=>!assigned.has(b.id))?.id;choice.apply(data);}
 onLocale(()=>{bindAssemblyTranslations(root);root.querySelector('.sv-legend .sv-online-dot')!.parentElement!.lastChild!.textContent=assemblyText('assemble.ui.0147');$('viewport').setAttribute('aria-label',assemblyText('assemble.ui.0140'));$('refresh').setAttribute('aria-label',assemblyText('assemble.ui.0148'));$('refresh').title=assemblyText('assemble.ui.0148');sceneKey='';panelHTML='';render();});
 preparation.subscribe(render);
 return {preparation,get active(){return active;},get supported(){return supported;},get historyLoaded(){return assemblyData.historyLoaded;},get state(){const state=deriveServoStatus(data,map);return {active,selected:choice.selected,view:choice.view,labelTarget:choice.labelTarget,supported,historyLoaded:assemblyData.historyLoaded,...data,complete:state.complete,verified:[...state.verified],review:[...state.review],onlineIds:[...state.online],models:scene?.stats,preparation:preparation.loaded?preparation.view.counts:null};},open,close,recordFor,refresh:()=>active?poll():Promise.resolve()};
}
