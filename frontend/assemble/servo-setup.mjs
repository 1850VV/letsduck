import {createServoScene} from './servo-scene.mjs';
import {deriveServoStatus,ServoSelection} from './servo-status.mjs';
import {createServoPreparation,servoLeadMarkup} from './servo-preparation.mjs';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,secondary=false,disabled=false)=>`<button type="button" class="sv-${secondary?'secondary':'primary'}" data-action="${action}" ${disabled?'disabled':''}>${text}</button>`;
const fact=(name,value,bad=false)=>`<div class="sv-fact ${bad?'bad':''}"><span>${name}</span><b>${escape(value)}</b></div>`;
const names={pending:'待配置',working:'配置中',verified:'已验证',review:'需复核'},marks={pending:'○',working:'◌',verified:'✓',review:'△'};

export async function createServoWorkbench({map,hardware,entities,actors,poses,onVisibility,onInstall,onGuide}){
 const root=document.getElementById('servo-workbench'),entry=document.getElementById('servo-open'),choice=new ServoSelection(map.bindings.map(b=>b.id));
 let active=false,scene=null,data={phase:'idle',records:[]},requesting=false,polling=false,timer=null,epoch=0,pendingAudit=null,supported=false,historyLoaded=false,panelHTML='',sceneKey='',completionOpen=false,wasComplete=false,notice='',selectionRevision=0;
 const preparation=createServoPreparation(map);
 const $=id=>root.querySelector('#sv-'+id),recordFor=id=>(data.records||[]).find(r=>r.id===id),binding=id=>map.byId.get(id);
 root.innerHTML=`<div class="sv-heading"><div><p>先给每只舵机一个位置</p><h1 id="sv-title">舵机准备</h1></div><div class="sv-device"><i id="sv-dot"></i><span id="sv-device">等待检测 UNO Q</span></div><button type="button" id="sv-close" class="sv-back">返回组装教程</button></div>
 <div class="sv-layout"><section class="sv-model"><div class="sv-caption"><b>十五只舵机</b><span>点选一只，配置或核查</span></div>
 <div class="sv-stage"><div id="sv-viewport" aria-label="舵机工作区三维模型"></div><div class="sv-stage-top"><span id="sv-tag"></span><button id="sv-arrange" type="button" aria-pressed="false">展开舵机</button></div><div id="sv-labels" class="sv-labels"></div><span class="sv-stage-bottom">拖动旋转 · 滚轮缩放 · 点选舵机查看状态与参数</span></div>
 <div class="sv-inventory"><div class="sv-inventory-title"><b id="sv-count"></b><span id="sv-counts"></span><button type="button" id="sv-completion" data-action="completion" hidden>查看完成信息</button></div><div class="sv-meter"><span id="sv-meter"></span></div><div id="sv-slots" class="sv-slots"></div><div class="sv-inventory-meta"><div class="sv-legend"><span>○ 待配置</span><span class="verified">✓ 已验证</span><span class="review">△ 需复核</span><span><i class="sv-online-dot"></i>当前在线</span></div><div><span id="sv-online"></span><button id="sv-refresh" type="button" data-action="refresh" aria-label="刷新在线状态" title="刷新在线状态">↻</button></div></div><p id="sv-next"></p><p id="sv-preparation-count" hidden></p></div>
 <p class="sv-mapping-note">位置按现有教程示意。左右称呼与官方文档有差异；头颈候选位置仍需对照原片核实。</p></section><aside id="sv-panel" class="sv-panel" aria-live="polite"></aside></div>
 <div class="sv-flow"><b>① 连接准备</b><span>→</span><b>② 十五只舵机编号</b><span>→</span><b>③ 按编号组装</b><span>→</span><b>④ 装好后校准</b></div>`;
 for(const b of map.bindings){const el=document.createElement('button');el.type='button';el.className='sv-slot';el.dataset.id=b.id;el.onclick=()=>choose(b.id);$('slots').append(el);}
 const location=id=>`<div class="sv-position"><strong>ID ${id} · ${escape(binding(id).role)}${binding(id).status==='candidate'?' · 位置待核':''}</strong><span>编号对应同一模型与安装步骤。</span></div>`;
 function completePanel(){
  let html='<p class="sv-kicker">舵机准备 · 已完成</p><div class="sv-completion-icon">✓</div><h2 class="sv-completion-title">15 只舵机<br>全部配置完成</h2><p>每只编号与匹配参数均已读回验证。<br>成功记录会保留，不要求同时在线。</p><ul class="sv-completion-list"><li>目标编号齐全，15 / 15</li><li>匹配参数验证通过</li><li>没有待配置或待复核项</li></ul>';
  html+=`<p class="sv-small">线材已备好 ${preparation.view.counts.prepared} / 15 · 线型未核定的舵机仍保留待核状态。</p>`;
  if(data.shutdownAt&&!data.online){const left=Math.max(0,Math.ceil((data.shutdownAt+15000-Date.now())/1000));html+=`<div class="sv-status">停机命令已发送。</div><p>${left?'至少再等 '+left+' 秒，':''}确认停止后，断开 USB 和电池。实际断电由你确认。</p><div class="sv-grow"></div>${button('已断开 USB 和电池，进入组装','assembly',false,left>0)}${button('继续查看配置记录','inspect',true)}`;}
  else html+=`<div class="sv-grow"></div>${button('安全停机，进入组装','finish-halt',false,!data.online)}${button('继续检查舵机','inspect',true)}<p class="sv-small">完成的是舵机配置；机械校准在装配后进行。</p>`;
  return html;
 }
 function render(){
  if(!active)return;
  const physical=preparation.view;
  const state=deriveServoStatus(data,map),id=choice.selected,item=state.items.get(id),r=item.record,live=state.liveFor(id),busy=data.phase==='working',profile=data.profile;
  const leadItem=physical.byId.get(id),canPrepare=preparation.loaded&&leadItem.leadKnown&&!leadItem.prepared&&item.status==='verified'&&!busy,prepareHalt=canPrepare&&state.canHalt&&data.currentId===id;
  if(state.complete&&!wasComplete){completionOpen=true;choice.view='tray';}if(!state.complete)completionOpen=false;wasComplete=state.complete;
  $('title').textContent=state.complete?'舵机配置完成':'舵机准备';$('device').textContent=data.online?'UNO Q · USB 已连接':'等待 UNO Q 连接';$('dot').classList.toggle('online',!!data.online);
  $('arrange').textContent=choice.view==='tray'?'收回整机':'展开舵机';$('arrange').setAttribute('aria-pressed',String(choice.view==='tray'));
  $('tag').textContent=choice.view==='tray'?'逐只摆开 · 点选查看状态':'整机参照 · 点选查看状态';
  $('count').textContent=state.complete?'✓ 15 / 15 全部配置完成':`${state.verified.size} / 15 已验证`;
  $('counts').textContent=state.complete?'所有编号与参数均已通过':`待配置 ${state.pending.size}${busy?' · 配置中 1':''}${state.review.size?' · 需复核 '+state.review.size:''}`;
  $('meter').style.width=state.verified.size/15*100+'%';root.querySelector('.sv-inventory').classList.toggle('complete',state.complete);$('completion').hidden=!state.complete;
  for(const el of $('slots').children){const n=Number(el.dataset.id),it=state.items.get(n);el.className='sv-slot '+it.status+(n===id?' active':'');el.dataset.status=it.status;el.dataset.pickState=preparation.loaded?physical.byId.get(n).state:'unknown';el.classList.toggle('taken',preparation.loaded&&physical.byId.get(n).state!=='available');el.dataset.online=String(it.online);el.innerHTML=`<span class="sv-mark">${marks[it.status]}</span><b>${n}</b>${it.online?'<i class="sv-online-dot"></i>':''}`;el.setAttribute('aria-label',`ID ${n}，${names[it.status]}，${it.online?'当前在线':state.known?'当前不在线':'在线状态未知'}`);el.setAttribute('aria-pressed',String(n===id));}
  $('online').textContent=state.known?state.online.size?'当前在线：'+[...state.online].map(n=>map.byId.has(n)?'ID'+n:'未编号 ID'+n).join('、'):'当前未检测到在线舵机':data.scan?.active?`正在检测 ${data.scan.checked} / ${data.scan.total}`:'在线状态未知';
  $('refresh').disabled=requesting||busy||data.scan?.active||!!data.shutdownAt&&!data.online;
  $('next').textContent=state.complete?'成功记录已保留。可继续检查，也可安全停机后进入组装。':busy?`正在配置 ID ${data.activeTarget||data.currentId||data.targetId||'…'}；读回复核通过后才计入成功。`:`${state.review.size?'需复核：'+[...state.review].join('、')+'。':''}${data.queuedTarget?'下一只已指定 ID '+state.nextTarget+'，之后恢复默认顺序。':state.nextTarget?'下一只按顺序配置 ID '+state.nextTarget+'。':''}换接后保留已完成进度。`;
  $('preparation-count').hidden=!preparation.supported;
  $('preparation-count').textContent=preparation.loaded?`盘中 ${physical.counts.available} / 15 · 已取待装 ${physical.counts.picked} · 已安装 ${physical.counts.installed} · 线材已备好 ${physical.counts.prepared} / 15`:preparation.error||'取件记录尚未读取';
  let html='';
  if(state.complete&&completionOpen)html=completePanel();
  else{
   html=`<p class="sv-kicker">${choice.manual?'点选查看':'当前推荐'} · ID ${id}</p><h2>${item.status==='review'?'复核 ID '+id:r?'配置与实时核查':'配置 ID '+id}</h2><span class="sv-status-pill ${item.status}">${marks[item.status]} ${names[item.status]}${item.online?' · 当前在线':''}</span>${location(id)}${servoLeadMarkup(preparation,id)}`;
   if(busy)html+=`<div class="sv-job"><b>正在配置 ID ${data.activeTarget||data.currentId||data.targetId||'…'}</b><br>${escape(data.message)}${data.queuedTarget?'<br>换接后指定 ID '+data.queuedTarget:''}</div>`;
   if(preparation.error)html+=`<div class="sv-status alert">${escape(preparation.error)}</div>`;
   if(notice)html+=`<div class="sv-status alert">${escape(notice)}</div>`;
   if(!busy&&data.phase==='blocked')html+=`<div class="sv-status alert">${escape(data.message)}</div>`;
   if(item.status==='review')html+=`<div class="sv-status alert">${escape(r?.mapVersion!==map.version?'这份记录的映射版本需重新核对':r?.state==='reported'?'已编号，等待读回复核':r?.reviewReason||'尚未通过读回复核')}。当前不计入成功数量。</div>`;
   if(r||item.online){
    if(busy)html+='<p>当前任务结束后，再读取所选编号。</p>';
    else if(live){const v=live.readback,match=profile&&v.kp===profile.kp&&v.kd===profile.kd;html+=`<div class="sv-facts">${fact('实时响应 ID',id+' · 在线')}${fact('KP'+(profile?' · 应为 '+profile.kp:''),v.kp,profile&&v.kp!==profile.kp)}${fact('KD'+(profile?' · 应为 '+profile.kd:''),v.kd,profile&&v.kd!==profile.kd)}${fact('编码器原始位置',v.raw_pos)}${fact('读取时间',new Date(live.observedAt).toLocaleTimeString('zh-CN',{hour12:false}))}</div>`;if(match&&item.status==='verified')html+='<div class="sv-status">已核查 · 编号与参数一致</div>';if(profile&&!match){html+=button('修正不一致参数','repair',false,requesting||state.online.size!==1);if(state.online.size!==1)html+='<p class="sv-small">修正时请只连接这一只舵机。</p>';}}
    else if(data.inspection?.id===id&&data.inspection.status==='reading')html+='<div class="sv-status">正在读取当前参数…</div>';
    else html+=`<div class="sv-status ${item.status==='verified'?'':'alert'}">${state.known?'所选 ID 当前不在线。':'当前连接无法确认在线状态。'}${item.status==='verified'?'此前成功记录仍保留。':''}</div><div class="sv-facts">${fact('上次记录',r?.readback?.kp!==undefined?'KP '+r.readback.kp+' / KD '+r.readback.kd:'尚未完成读回验证')}${fact('数据来源','历史记录 · 当前未读到')}</div>`;
    html+=button('重新读取并核查','audit',true,requesting||busy);
    if(item.canResume)html+=button('继续本只配置','recover',false,requesting||!state.known||state.online.size!==1||!profile||![r.id,r.sourceId].some(n=>state.online.has(n)));
    if(r?.midEvidence==='unconfirmed')html+='<p class="sv-small">中位指令结果未确认，装配后仍需机械校准。</p>';
   }else{
    const connected=[...state.online],wrong=connected.some(n=>map.byId.has(n));
    html+=`<div class="sv-facts">${fact('本次目标','ID '+id+(choice.manual?' · 你点选的':' · 顺序推荐'))}${fact('当前单只',!state.known?'尚未检测':connected.length===1?'ID '+connected[0]:connected.length>1?connected.length+' 只在线':'尚未连接')}${profile?fact('匹配参数','KP '+profile.kp+' / KD '+profile.kd):fact('配置档','等待读取运行端')}</div>`;
    if(wrong)html+='<div class="sv-status alert">当前接着已编号舵机。先停机断电，再换接未编号舵机。</div>';
    if(connected.length>1)html+='<div class="sv-status alert">配置时只连接一只未编号舵机。</div>';
    html+='<div class="sv-grow"></div>'+(busy||data.running?button((data.queuedTarget===id?'下一只已指定 ID ':'下一只配置 ID ')+id,'queue',false,requesting||id===(data.activeTarget??data.currentId)||data.queuedTarget===id):button('配置 ID '+id,'configure',false,requesting||!state.known||connected.length!==1||wrong||!profile));
    if(!data.online)html+=`<div class="sv-guide-links"><a href="https://www.arduino.cc/en/software/#app-lab-section" target="_blank" rel="noopener">安装 Arduino App Lab</a><a href="https://www.xgorobot.com/duck.html#software" target="_blank" rel="noopener">Duck OS 烧录与配网</a><button type="button" data-action="guide">三维接线说明</button></div>`;
   }
   html+='<div class="sv-grow"></div>';
   if(data.shutdownAt&&!data.online){const left=Math.max(0,Math.ceil((data.shutdownAt+15000-Date.now())/1000));html+=`<p>${left?'至少再等 '+left+' 秒，':''}确认停止后断开 USB 和电池，再换接。仅拔 USB 不能证明电池已断电。</p>${!data.running?button('继续本轮，等待重新连接','resume',false,requesting):'<p class="sv-small">重新上电后会先读取状态，再自动继续。</p>'}`;}
   else if(state.canHalt)html+=button(prepareHalt?'线已接好，停机换下一只':'安全停机，换下一只',prepareHalt?'prepared-halt':'halt',false,requesting||preparation.saving);
   else if(busy)html+=button('暂停配置','pause',true,requesting);
   if(canPrepare&&!prepareHalt)html+=button('线已接好，准备下一只','prepared-next',false,requesting||preparation.saving);
   else if(!busy&&!state.complete)html+=button('恢复默认顺序','sequential',true,requesting);
  }
  if(html!==panelHTML){const focused=document.activeElement?.closest('#sv-panel [data-action]')?.dataset.action;panelHTML=html;$('panel').innerHTML=html;if(focused)$('panel').querySelector(`[data-action="${focused}"]`)?.focus();}
  const key=JSON.stringify([physical.slots.map(s=>s.state),choice.selected,choice.labelTarget,choice.view,[...state.items].map(([id,item])=>[id,item.status,item.online])]);
  if(scene&&key!==sceneKey){sceneKey=key;scene.update({selected:id,labelTarget:choice.labelTarget,view:choice.view,done:state.verified,statuses:state.items,online:state.online,preparation:preparation.loaded?physical:null});}
 }
 async function call(action='',body={}){
  if(action&&requesting){if(action==='audit')pendingAudit=body.id;return;}
  if(!action&&polling)return;
  const version=action?++epoch:epoch;if(action)requesting=true;else polling=true;render();
  try{const response=await fetch('/api/servo-setup'+(action?'/'+action:''),action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const answer=await response.json();if(!response.ok)throw Error(answer.error||'连接没有响应');if(version===epoch){data=answer;choice.apply(data);historyLoaded=true;notice='';}return true;}
  catch(error){if(version===epoch){notice=error.message;if(!action)data={...data,online:false,telemetry:{known:false,ids:[]}};}return false;}
  finally{if(action)requesting=false;else polling=false;render();if(active&&!requesting&&pendingAudit!==null){const id=pendingAudit;pendingAudit=null;queueMicrotask(()=>call('audit',{id}));}}
 }
 async function poll(){clearTimeout(timer);if(!active)return;await call();if(active)timer=setTimeout(poll,1000);}
 function choose(id){selectionRevision++;choice.choose(id);completionOpen=false;render();call('audit',{id});}
 function close(){selectionRevision++;active=false;root.hidden=true;document.body.classList.remove('servo-open');scene?.setVisible(false);clearTimeout(timer);onVisibility(false);entry.focus();}
 function open(){active=true;root.hidden=false;document.body.classList.add('servo-open');onVisibility(true);if(!scene)scene=createServoScene({host:$('viewport'),labelsHost:$('labels'),hardware,entities,actors,poses,map,onSelect:choose});scene.setVisible(true);sceneKey='';render();poll();$('close').focus();}
 $('close').onclick=close;$('arrange').onclick=()=>{choice.toggle();render();};
 root.addEventListener('click',async event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='guide'){close();onGuide();}
  else if(action==='completion'){completionOpen=true;render();}
  else if(action==='inspect'){completionOpen=false;render();call('audit',{id:choice.selected});}
  else if(action==='configure'||action==='recover'){choice.begin();await call('start',{targetId:choice.selected});}
  else if(action==='resume'){choice.begin();await call('start');}
  else if(action==='sequential'){selectionRevision++;choice.sequential(data);render();}
  else if(action==='prepared-next'||action==='prepared-halt'){
   const id=choice.selected,revision=selectionRevision,item=preparation.view.byId.get(id);
   if(!item.leadKnown||item.prepared||preparation.saving||requesting||!deriveServoStatus(data,map).verified.has(id))return;
   if(action==='prepared-halt'&&!await call('halt'))return;
   try{
    await preparation.update([id],{preparedLeads:item.leads.map(lead=>lead.key)});
    if(active&&revision===selectionRevision){const state=deriveServoStatus(data,map),next=preparation.view.slots.find(s=>s.leadKnown&&!s.prepared&&state.verified.has(s.id));if(next)choice.choose(next.id);else choice.sequential(data);render();}
   }catch{/* Keep the previous preparation state and show the shared save error. */}
  }
  else if(action==='audit'||action==='repair'||action==='queue')await call(action,{id:choice.selected});
  else if(action==='finish-halt'){completionOpen=true;await call('halt');}
  else if(action==='assembly'){if(deriveServoStatus(data,map).complete&&data.shutdownAt&&Date.now()-data.shutdownAt>=15000){close();onInstall(binding(14));}}
  else await call(action);
 });
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')close();});
 try{const site=await fetch('/api/site').then(r=>r.json());supported=!!site.servoSetup;await preparation.load(site.servoPreparation);entry.hidden=!supported;entry.onclick=open;if(supported){const response=await fetch('/api/servo-setup/records');if(!response.ok)throw Error('记录未加载');const answer=await response.json();data.records=answer.records;historyLoaded=true;const assigned=new Set(data.records.map(r=>r.id));data.targetId=map.bindings.find(b=>!assigned.has(b.id))?.id;choice.apply(data);}}
 catch{entry.hidden=true;}
 preparation.subscribe(render);
 return {preparation,get active(){return active;},get supported(){return supported;},get historyLoaded(){return historyLoaded;},get state(){const state=deriveServoStatus(data,map);return {active,selected:choice.selected,view:choice.view,labelTarget:choice.labelTarget,supported,historyLoaded,...data,complete:state.complete,verified:[...state.verified],review:[...state.review],onlineIds:[...state.online],models:scene?.stats,preparation:preparation.loaded?preparation.view.counts:null};},open,close,recordFor,refresh:()=>active?poll():Promise.resolve()};
}
