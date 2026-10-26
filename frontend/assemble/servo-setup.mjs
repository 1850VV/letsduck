import {createServoScene} from './servo-scene.mjs';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(text,action,secondary=false)=>`<button type="button" class="sv-${secondary?'secondary':'primary'}" data-action="${action}">${text}</button>`;
const fact=(name,value)=>`<div class="sv-fact"><span>${name}</span><b>${escape(value)}</b></div>`;

export async function createServoWorkbench({map,hardware,entities,actors,poses,onVisibility,onInstall,onGuide}){
 const root=document.getElementById('servo-workbench'),entry=document.getElementById('servo-open');
 let active=false,scene=null,data={phase:'idle',records:[]},selected=10,view='tray',requesting=false,timer=null,previousCurrent=null,panelHTML='',sceneKey='',supported=false,historyLoaded=false;
 const $=id=>root.querySelector('#sv-'+id);
 const records=()=>data.records.filter(r=>r.mapVersion===map.version);
 const done=()=>new Set(records().filter(r=>r.state==='verified').map(r=>r.id));
 const selectedBinding=()=>map.byId.get(selected);
 const recordFor=id=>records().find(r=>r.id===id);
 root.innerHTML=`<div class="sv-heading"><div><p>先给每只舵机一个位置</p><h1>准备与编号</h1></div><div class="sv-device"><i id="sv-dot"></i><span id="sv-device">等待检测 UNO Q</span></div><button type="button" id="sv-close" class="sv-back">返回组装教程</button></div>
 <div class="sv-layout"><section class="sv-model"><div class="sv-tabs"><button id="sv-tray" type="button">十五只舵机</button><button id="sv-robot" type="button">安装位置</button><span>选择编号，查看安装位置</span></div>
 <div class="sv-stage"><div id="sv-viewport" aria-label="十五只舵机及整机安装位置的三维模型"></div><div class="sv-stage-top"><span id="sv-tag"></span></div><div id="sv-labels" class="sv-labels"></div><span class="sv-stage-bottom">拖动旋转 · 滚轮缩放 · 点击编号定位</span></div>
 <div class="sv-inventory"><div class="sv-inventory-title"><b>我的十五只舵机</b><span id="sv-count"></span></div><div id="sv-slots" class="sv-slots"></div><p>完成一只、贴好编号，再接下一只。安装步骤会直接引用这里的编号。</p></div>
 <p class="sv-mapping-note">位置按现有教程示意。左右称呼与官方文档有差异；头颈候选位置仍需对照原片核实。</p></section><aside id="sv-panel" class="sv-panel" aria-live="polite"></aside></div>
 <div class="sv-flow"><b>① 连接准备</b><span>→</span><b>② 十五只舵机编号</b><span>→</span><b>③ 按编号组装</b><span>→</span><b>④ 装好后校准</b></div>`;
 for(const binding of map.bindings){const b=document.createElement('button');b.type='button';b.className='sv-slot';b.dataset.id=binding.id;b.setAttribute('aria-label',`选择 ID${binding.id}`);b.onclick=()=>choose(binding.id);$('slots').append(b);}
 function location(id=selected){const b=map.byId.get(id);return `<div class="sv-position"><strong>ID ${b.id} · ${b.role}${b.status==='candidate'?' · 位置待核':''}</strong><span>取贴着这个编号的实物；位置参照原片核对。</span></div>`;}
 function render(){
  if(!active)return;
  const completed=done(),r=recordFor(selected),phase=data.phase,profile=data.profile;
  const reported=records().filter(r=>r.state==='reported');
  $('count').textContent=completed.size+' / 15 已读回验证'+(reported.length?` · ${reported.length} 只已编号待复核`:'');
  $('device').textContent=data.online?'UNO Q · USB 已连接':'等待 UNO Q 连接';$('dot').classList.toggle('online',!!data.online);
  $('tray').classList.toggle('active',view==='tray');$('robot').classList.toggle('active',view==='robot');
  $('tag').textContent=view==='tray'?'十五只舵机 · 逐个配置':`ID ${selected} · ${selectedBinding().role}`;
  for(const b of $('slots').children){const id=Number(b.dataset.id);b.textContent=(completed.has(id)?'✓ ':'')+id;b.title=recordFor(id)?.state==='reported'?'已编号，待读回复核':`ID${id}`;b.classList.toggle('reported',recordFor(id)?.state==='reported');b.classList.toggle('done',completed.has(id));b.classList.toggle('active',id===selected);b.setAttribute('aria-pressed',String(id===selected));}
  let html='';
  const profileFact=profile?fact('运行端配置档',profile.name):'';
  const currentRecord=recordFor(data.currentId);
  const facts=`<div class="sv-facts">${profileFact}${fact('下一只目标',data.targetId?'ID '+data.targetId:reported.length?'接回 ID'+reported[0].id+' 复核':'十五只均有验证记录')}</div>`;
  if(view==='robot'){
   html=`<p class="sv-kicker">按编号组装</p><h2>找到 ID ${selected}<br>的安装位置</h2>${location()}<div class="sv-status ${r?.state==='verified'?'':'alert'}">${r?.state==='verified'?`编号和参数曾读回验证 · KP ${r.readback.kp} / KD ${r.readback.kd}`:r?'这只仍待复核，尚未计入完成。':'这只尚无配置记录。'}</div><p>历史记录不代表舵机当前在线，也不代表已经安装。装好后仍需逐关节校准。</p><div class="sv-grow"></div>${button('查看这一只的安装步骤','install')}${button('返回编号任务','tray',true)}`;
  }else if(phase==='working'){
   const steps=['扫描并读取当前舵机','设置中位，记录指令确认','显式写入 KP / KD','设置目标 ID','读回参数，核对新旧 ID'];
   html=`<p class="sv-kicker">自动配置中</p><h2>${data.currentId?'正在配置 ID '+data.currentId:'正在扫描舵机'}</h2><p>${escape(data.message)}</p><ol class="sv-checklist">${steps.map((text,i)=>`<li class="${i<data.progress?'done':i===data.progress?'current':''}"><i>${i<data.progress?'✓':i+1}</i>${text}</li>`).join('')}</ol><div class="sv-status">保持只接当前一只，等待读回完成。</div><div class="sv-grow"></div>${button('暂停配置','pause',true)}`;
  }else if(phase==='success'){
   const n=data.currentId,old=currentRecord?.sourceId;
   html=`<p class="sv-kicker">编号与参数已验证</p><h2>ID ${n} 配好了</h2><div class="sv-status">目标 ID 已响应 · KP ${currentRecord?.readback.kp} / KD ${currentRecord?.readback.kd} 已读回${old!==n&&currentRecord?.oldIdAbsent?`<br>旧 ID ${old} 已不再响应`:''}</div><div class="sv-sticker"><small>把这个编号贴在实物上</small>${n}</div>${location(n)}${button('在 3D 中看安装位置','locate',true)}<p class="sv-small">${currentRecord?.midEvidence==='acknowledged'?'中位指令已确认，机械零位仍需装配后校准。':currentRecord?.midEvidence==='unconfirmed'?'中位指令的结果未确认，未重复执行。装配后必须校准。':'沿用已有中位设置，未重复归中；装配后需校准。'}</p><div class="sv-grow"></div>${button(completed.size===15?'安全停机，准备组装':'安全停机，准备换下一只','halt')}`;
  }else if(data.shutdownAt&&!data.online){
   const left=Math.max(0,15-Math.floor((Date.now()-data.shutdownAt)/1000));
   html=`<p class="sv-kicker">${completed.size===15?'准备组装':'更换舵机'}</p><h2>断开供电，<br>${completed.size===15?'再开始组装':'再换下一只'}</h2><p>停机命令已发送。${left?`至少再等 ${left} 秒，`:'确认板子停止后，'}断开 USB 和电池，${completed.size===15?'再开始机械安装。':'再换接下一只未编号舵机并上电。'}</p><div class="sv-status alert">仅拔掉 USB 不能证明电池已断开。必须由你确认实际断电。</div>${facts}<div class="sv-grow"></div>${completed.size===15?button('按编号查看安装步骤','assembly'):`<p>重新连接后会先扫描，再自动继续。接回已完成舵机会保留原编号。</p>${data.running?'':button('继续本轮，等待重新连接','start')}`}`;
  }else if(phase==='blocked'){
   html=`<p class="sv-kicker">配置已暂停</p><h2>先处理这一项</h2><div class="sv-status alert">${escape(data.message)}</div>${facts}<p>没有通过读回的舵机不会计入完成。重新开始会先读状态，只补写必要的项目。</p><div class="sv-grow"></div>${button('重新检测并继续','start')}${button('查看接线说明','guide',true)}`;
  }else{
   html=`<p class="sv-kicker">${data.running?'等待下一只':'连接准备'}</p><h2>${data.running?'换好后上电，<br>会自动继续':'接好板子，<br>先接一只舵机'}</h2><p>${escape(data.message||'用 USB 连接 UNO Q，接入扩展板、电池和当前一只舵机。')}</p>${facts}<div class="sv-status alert">换接前先停机，断开 USB 与电池。扫描到一个编号也不能证明只有一只实物。</div><div class="sv-guide-links"><a href="https://www.arduino.cc/en/software/#app-lab-section" target="_blank" rel="noopener">安装 Arduino App Lab</a><a href="https://www.xgorobot.com/duck.html#software" target="_blank" rel="noopener">Duck OS 烧录与配网</a><button type="button" data-action="guide">三维接线说明</button></div><div class="sv-grow"></div>${data.running?button('暂停本轮配置','pause',true):button(data.online?'开始本轮自动配置':'连接好后，开始检测','start')}<p class="sv-small">已安装系统直接检测；一次启动本轮，换接后自动继续。程序不会烧录或升级系统。</p>`;
  }
  if(html!==panelHTML){const focused=document.activeElement?.closest('#sv-panel [data-action]')?.dataset.action;panelHTML=html;$('panel').innerHTML=html;if(focused)$('panel').querySelector(`[data-action="${focused}"]`)?.focus();}
  for(const b of $('panel').querySelectorAll('button[data-action]'))b.disabled=requesting||(b.dataset.action==='assembly'&&Date.now()-data.shutdownAt<15000);
  const key=JSON.stringify([selected,view,[...completed]]);if(scene&&key!==sceneKey){sceneKey=key;scene.update({selected,view,done:completed});}
 }
 async function call(action){
  if(requesting)return;requesting=true;render();
  try{
   const response=await fetch('/api/servo-setup'+(action?'/'+action:''),action?{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}:{});
   const answer=await response.json();if(!response.ok)throw Error(answer.error||'连接没有响应');
   data=answer;historyLoaded=true;
   if(data.currentId&&data.currentId!==previousCurrent){selected=data.currentId;previousCurrent=data.currentId;}
  }catch(error){data={...data,phase:'blocked',message:error.message};}
  finally{requesting=false;render();}
 }
 async function poll(){clearTimeout(timer);if(!active)return;await call();if(active)timer=setTimeout(poll,1000);}
 function choose(id){selected=id;view='robot';render();}
 function close(){active=false;root.hidden=true;document.body.classList.remove('servo-open');scene?.setVisible(false);clearTimeout(timer);onVisibility(false);entry.focus();}
 function open(){
  active=true;root.hidden=false;document.body.classList.add('servo-open');onVisibility(true);
  if(!scene)scene=createServoScene({host:$('viewport'),labelsHost:$('labels'),hardware,entities,actors,poses,map,onSelect:choose});
  scene.setVisible(true);render();poll();$('close').focus();
 }
 $('close').onclick=close;$('tray').onclick=()=>{view='tray';render();};$('robot').onclick=()=>{view='robot';render();};
 root.addEventListener('click',async event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(action==='install'){const binding=selectedBinding();close();onInstall(binding);}
  else if(action==='guide'){close();onGuide();}
  else if(action==='locate'){selected=data.currentId||selected;view='robot';render();}
  else if(action==='assembly'){view='robot';selected=14;render();}
  else if(action==='tray'){view='tray';render();}
  else await call(action);
 });
 root.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')close();});
 try{const site=await fetch('/api/site').then(r=>r.json());supported=!!site.servoSetup;entry.hidden=!supported;entry.onclick=open;if(supported){const answer=await fetch('/api/servo-setup/records').then(r=>{if(!r.ok)throw Error('记录未加载');return r.json();});data.records=answer.records;historyLoaded=true;const assigned=new Set(answer.records.filter(r=>['reported','verified'].includes(r.state)).map(r=>r.id));data.targetId=map.bindings.find(b=>!assigned.has(b.id))?.id;}}catch{entry.hidden=true;}
 return {get active(){return active;},get supported(){return supported;},get historyLoaded(){return historyLoaded;},get state(){return {active,selected,view,supported,historyLoaded,...data,models:scene?.stats};},open,close,
  recordFor,refresh:()=>active?poll():Promise.resolve()};
}
