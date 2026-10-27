import {IDS,role,online,selected} from './state.mjs';
import {MODE_NAMES,motionFromInput,canControl} from './control.mjs';
const fmt=(v,n=1)=>Number.isFinite(v)?v.toFixed(n):'—';
export function createDeviceTools({getState,render,say,canEdit,api,poll,run}){
 const $=id=>document.getElementById(id);
 const c={mode:'unknown',roller:false,head:[0,0,0,0],mouth:0,motion:[0,0,0],target:[0,0,0],calibrating:false,sent:0,
  tuning:{scale:1,leg:.45,head:.2},gyroAlpha:.5,gravityTau:.3,protection:{requestedEnabled:null,requestedCurrent:null},status:{},snapshot:null};
 let bench='servo',tab='motion',panelKind='single',armed=false,calOwned=false,servoOwned=false,sending=false,stopped=false;
 const query=new URLSearchParams(location.search).get('bench');if(['servo','control','calibrate'].includes(query))bench=query;
 const keys=new Set(),sticks={left:{x:0,y:0},right:{x:0,y:0}};
 const profile=()=>c.tuning;
 const ready=()=>getState().boards.arduino.connected&&canControl(c.status);
 const editable=()=>canEdit(selected(getState()));
 const canAction=()=>['policy','shadow'].includes(c.mode)&&c.status.recovery?.phase==='walk'&&!c.status.pick?.active&&!c.status.roulade?.active;
 function zeroLocal(){keys.clear();sticks.left={x:0,y:0};sticks.right={x:0,y:0};c.motion=[0,0,0];c.target=[0,0,0];for(const el of document.querySelectorAll('.control-knob'))el.style.transform='translate(0,0)';updateLive();}
 function stopControl(){armed=false;zeroLocal();}
 async function zero(){zeroLocal();if(armed)try{await api('command',{twist:[0,0,0]});}catch(error){stopControl();say(error.message,true);}}
 async function emergency(){stopControl();calOwned=false;servoOwned=false;await api('release').then(()=>poll(true)).catch(error=>say(error.message,true));render();}
 async function mode(value){if(['hold','policy'].includes(value)&&!ready())return;stopControl();const result=await run('mode',{mode:value},MODE_NAMES[value]);if(result){armed=value!=='off';servoOwned=false;calOwned=false;}}
 async function leaveOwned(){zeroLocal();const owned=armed||calOwned||servoOwned;stopControl();calOwned=false;servoOwned=false;if(owned)try{await api('leave');}catch(error){say(error.message,true);}}
 const controlNav=()=>`<div class="controller-tabs">${[['motion','运动'],['head','头嘴'],['settings','调参'],['feedback','反馈']].map(([id,label])=>`<button data-control-tab="${id}" aria-pressed="${tab===id}">${label}</button>`).join('')}</div>`;
 function slider(id,label,value,min,max,step,attribute){return `<label class="control-slider">${label}<output id="${id}-value">${value}</output><input id="${id}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" ${attribute}></label>`;}
 function motionPanel(){const disabled=!ready();return `<div class="mode-buttons">${[['shadow','只推理'],['hold','默认姿态'],['policy','行走 / 起身']].map(([id,label])=>`<button data-controller-mode="${id}" aria-pressed="${c.mode===id}" ${id!=='shadow'&&disabled?'disabled':''}>${label}</button>`).join('')}</div>
  <label class="roller-toggle"><input id="roller-mode" type="checkbox" ${c.roller?'checked':''}>轮滑模式<span>${c.roller?'前后移动 · 无侧移':'常规步行'}</span></label>
  <div class="joystick-pair"><div><small>${c.roller?'前进 / 后退':'前进 / 侧移'}</small><div class="control-joy" id="control-joy-left" role="group" aria-label="前进与侧移摇杆"><i class="control-knob"></i></div></div><div><small>转向</small><div class="control-joy" id="control-joy-right" role="group" aria-label="转向摇杆"><i class="control-knob"></i></div></div></div>
  <div class="motion-values">vx <b id="control-vx">0.00</b> · vy <b id="control-vy">0.00</b> · ωz <b id="control-wz">0.00</b></div><button class="secondary" data-control-action="zero">运动归零</button><p class="control-note">松手归零 · WASD 平移，Q/E 转向，空格卸载<br>${c.roller?'vx ±0.4 · vy 0 · ωz ±0.25':'vx −0.2～0.4 · vy ±0.3 · ωz ±1.0'}</p>
  <div class="action-pair"><button data-control-action="pick" ${!ready()||!canAction(c)?'disabled':''}>拾取 · 4秒</button><button data-control-action="roulade" ${!ready()||!canAction(c)?'disabled':''}>翻滚 · 1.9秒</button></div><div class="recovery-readout"><span id="recovery-label"></span><b id="recovery-time"></b></div><p class="control-note">${disabled?'主控、IMU或舵机反馈未就绪':`指令覆盖15个编号 · 当前 ${online(getState()).length} 只在线`}${c.roller?'<br>轮滑外八姿态久置会使侧摆电机发热，需留出冷却时间。':''}</p>`;}
 function headPanel(){return `<p class="control-note">头颈4路为弧度输入；鸭嘴为ID34的角度输入。</p>${c.head.map((v,i)=>slider('control-head-'+i,`头颈${i+1} · ID${30+i}`,v,-1,1,.02,`data-control-head="${i}"`)).join('')}${slider('control-mouth','鸭嘴 · ID34（°）',c.mouth,0,30,1,'data-control-mouth')}<button class="secondary" data-control-action="head-zero">头嘴归零</button>`;}
 function settingsPanel(){if(!c.status.deployment)return '<p class="control-note">尚未读取运行参数</p>';const p=profile(c);return `<p class="control-profile">${c.roller?'轮滑参数':'步行 / 其他模型参数'}</p>${slider('control-scale','动作幅度',p.scale,0,2,.05,'data-control-setting="scale"')}${slider('control-leg','腿部平滑 α',p.leg,0,.95,.05,'data-control-setting="leg"')}${slider('control-head-alpha','头部平滑 α',p.head,0,.95,.05,'data-control-setting="head"')}<div class="control-divider">IMU滤波</div>${slider('control-gyro','角速度平滑 α',c.gyroAlpha,0,.95,.05,'data-control-imu="gyroAlpha"')}${slider('control-gravity','重力投影 τ（秒）',c.gravityTau,.01,2,.01,'data-control-imu="gravityTau"')}<p class="control-note">松开滑块应用。两组动作参数分别保留；控制器重启后恢复默认。</p>`;}
 function feedbackPanel(){const s=getState(),snap=c.snapshot?.status;return `<div class="imu-readout">${[['加速度 acc',snap?.acc,'acc'],['角速度 gyro',snap?.gyro,'gyro'],['重力 grav',snap?.gravity,'gravity']].map(([name,v,key])=>`<div><span>${name}</span><b data-imu="${key}">${v?v.map(x=>fmt(x,3)).join(' / '):'—'}</b></div>`).join('')}</div><div class="control-divider">15路舵机反馈</div><div class="joint-feedback"><table><thead><tr><th>ID</th><th>编码器</th><th>关节角</th><th>目标</th></tr></thead><tbody>${IDS.map((id,i)=>{const d=s.devices.find(d=>d.id===id&&d.online);return `<tr data-joint-id="${id}" class="${d?'':'offline'}"><td>${id}</td><td data-encoder>${d?d.pos:'—'}</td><td data-angle>${d?fmt(snap?.angles?.[i])+'°':'—'}</td><td data-target>${d?fmt(snap?.targets?.[i])+'°':'—'}</td></tr>`;}).join('')}</tbody></table></div><p class="control-note" id="command-health"></p><p class="control-note">关节角与目标来自控制器实时反馈。</p>`;}
 function panelControl(){return `<div class="panel-heading"><h2>整机控制</h2><span class="control-mode" id="controller-mode"></span></div>${controlNav()}<div class="controller-body">${tab==='motion'?motionPanel():tab==='head'?headPanel():tab==='settings'?settingsPanel():feedbackPanel()}</div><div class="panel-grow"></div><div class="panel-bottom">UNO Q · 实时控制</div>`;}
 function panelCalibration(){const d=selected(getState()),live=editable(),fixed=IDS.includes(d.id);return `<div class="panel-heading"><h2>中位校准</h2><span class="control-mode">${c.calibrating?'校准中':'未开始'}</span></div><p class="control-note">先卸载全部舵机，肉眼对齐支架孔位。设定中位会改变零点；普通微调不会。</p><button class="${c.calibrating?'secondary':'primary'}" data-control-action="cal-enter">${c.calibrating?'重新卸载全部':'开始校准 · 卸载全部'}</button><div class="cal-selected"><span>${role(d.id)}</span><h3>ID ${d.id}</h3><div>当前位置 <b data-cal-position>${d.online?d.pos:'—'}</b></div><p>${d.online?(d.held?'保持2048':'已卸载，可手动对齐'):'当前未在线'}</p></div><button class="primary" data-control-action="cal-center" ${!live||!fixed||!c.calibrating||d.held?'disabled':''}>将当前位置设为中位并保持</button><p class="control-note">本次只设定所选舵机，先前已设定的关节继续保持。KP/KD和编号保留。</p><button class="secondary" data-control-action="cal-exit" ${!c.calibrating?'disabled':''}>退出校准 · 全部卸载</button><div class="control-divider">原网页 Reset Mid</div><button class="secondary" data-control-action="reset-mid" ${!live||c.calibrating?'disabled':''}>仅重置所选中位 · 保持卸载</button><p class="control-note">适用于已选编号。重置后需重新读取位置。</p><div class="panel-grow"></div><div class="panel-bottom">中位指令回执不代表机械安装已对齐。</div>`;}
 function panelProtection(){const p=c.protection;return `<div class="panel-heading"><h2 style="font-size:22px">全部舵机保护</h2><span class="control-mode">广播</span></div><p class="control-note">电压 / 过流保护开关，与电流阈值分开写入。过热保护和已存电压限值保持不变。</p><div class="action-pair"><button data-control-action="protection-on">启用保护</button><button data-control-action="protection-off">关闭保护</button></div><p class="broadcast-result">${p.requestedEnabled===null?'开关尚未发送':`已广播${p.requestedEnabled?'启用':'关闭'} · 未逐只确认`}</p><label class="field">过流阈值（A）<input id="protection-current" type="number" aria-label="过流阈值（A）" min="0" max="425.9775" step="any" value="${p.requestedCurrent??1.5}"></label><button class="primary write-button" data-control-action="protection-current">广播写入电流阈值</button><p class="broadcast-result">${p.requestedCurrent===null?'电流阈值尚未发送':`请求 ${p.requestedCurrent} A · 未逐只确认`}</p><p class="control-note">寄存器步进6.5 mA。广播无需选中编号；发送回执不代表每只舵机已写入。</p><div class="panel-grow"></div><div class="panel-bottom">广播结果不计入编号验证。</div>`;}
 function renderPanel(){if(bench==='control'){$('panel').innerHTML=panelControl();return true;}if(bench==='calibrate'){$('panel').innerHTML=panelCalibration();return true;}if(panelKind==='protection'){$('panel').innerHTML=panelProtection();return true;}return false;}
 function updateReadouts(){
  const imuLive=getState().boards.arduino.connected&&c.status.imu_ok===true&&Number.isFinite(c.status.feedback_age_ms)&&c.status.feedback_age_ms<500;
  for(const el of document.querySelectorAll('[data-imu]')){const values=imuLive?c.status[el.dataset.imu]:null;el.textContent=Array.isArray(values)?values.map(v=>fmt(v,3)).join(' / '):'—';}
  const devices=new Map(getState().devices.map(d=>[d.id,d]));
  for(const row of document.querySelectorAll('[data-joint-id]')){
   const id=Number(row.dataset.jointId),d=devices.get(id),index=IDS.indexOf(id),live=!!d?.online;
   row.classList.toggle('offline',!live);
   row.querySelector('[data-encoder]').textContent=live?(d.pos??'—'):'—';
   for(const [field,key] of [['angle','angles'],['target','targets']]){const value=c.status[key]?.[index];row.querySelector('[data-'+field+']').textContent=live&&Number.isFinite(value)?fmt(value)+'°':'—';}
  }
  const position=document.querySelector('[data-cal-position]'),d=selected(getState());
  if(position)position.textContent=d?.online?(d.readbackPending?'待读回':d.pos??'—'):'—';
 }
 function updateLive(){
  updateReadouts();
  const s=c.status,q=getState().boards.arduino.connected;
  $('runtime-metrics').innerHTML=`<span>反馈 <b>${fmt(s.feedback_hz)} Hz</b></span><span>推理 <b>${fmt(s.inference_hz)} Hz</b></span><span>IMU <b>${q&&s.imu_ok?'在线':'未确认'}</b></span><span class="runtime-mode">${MODE_NAMES[c.mode]??'未知'}</span>`;
  if($('controller-mode'))$('controller-mode').textContent=MODE_NAMES[c.mode]??'未知';
  ['vx','vy','wz'].forEach((id,i)=>{if($('control-'+id))$('control-'+id).textContent=c.motion[i].toFixed(2);});
  if($('recovery-label')){$('recovery-label').textContent=s.pick?.active?'拾取':s.roulade?.active?'翻滚':s.recovery?.phase??'—';$('recovery-time').textContent=s.roulade?.active?fmt(s.roulade.remaining_s)+' s':s.active_model??'—';}
  if($('command-health'))$('command-health').textContent=`本窗口发送 ${c.sent} · MCU回显 ${s.mcu_command_seq??'—'} · 丢帧 ${s.sequence_gaps??'—'} · 拒收 ${s.mcu_invalid_commands??'—'}`;
  if(bench==='control')for(const button of document.querySelectorAll('[data-controller-mode]'))button.disabled=!q||button.dataset.controllerMode!=='shadow'&&!ready();
 }
 function joystick(side){const zone=$('control-joy-'+side);if(!zone)return;let pointer=null;
  const reset=()=>{pointer=null;sticks[side]={x:0,y:0};zone.firstElementChild.style.transform='translate(0,0)';c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);if(c.target.every(v=>v===0))zero();};
  const move=e=>{const r=zone.getBoundingClientRect(),radius=(zone.clientWidth-zone.firstElementChild.offsetWidth)/2;let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const len=Math.hypot(dx,dy);if(len>radius){dx*=radius/len;dy*=radius/len;}sticks[side]={x:dx/radius,y:-dy/radius};zone.firstElementChild.style.transform=`translate(${dx}px,${dy}px)`;c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);};
  zone.onpointerdown=e=>{if(pointer!==null||e.button!==0||!ready()||!armed)return;e.preventDefault();pointer=e.pointerId;zone.setPointerCapture(pointer);move(e);};zone.onpointermove=e=>{if(e.pointerId===pointer)move(e);};zone.onpointerup=zone.onpointercancel=zone.onlostpointercapture=e=>{if(e.pointerId===pointer)reset();};
 }
 function afterRender(){const s=getState();document.querySelectorAll('[data-workbench]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.workbench===bench));b.disabled=s.busy;});
  $('work-title').textContent=bench==='control'?'整机控制':bench==='calibrate'?'中位校准':'舵机与连接';$('source-address').textContent='UNO Q · '+(s.boards.arduino.connected?'USB实时连接':'等待主控连接');
  const scan=s.scan;$('scan-servos').disabled=s.busy||scan?.active||!s.boards.arduino.connected;$('stop-scan').hidden=!scan?.active;$('scan-progress-box').hidden=!scan?.checked&&!scan?.active;
  if(scan){$('scan-progress').value=scan.checked;$('scan-status').textContent=`${scan.active?'扫描':scan.stopped?'已停止':'扫描完成'} ${scan.checked}/254 · 已发现 ${scan.found.map(id=>'ID'+id).join('、')||'0只'}${scan.error?' · '+scan.error:''}`;}
  if(bench==='servo'&&s.mode==='single'&&!s.selectedBoard)$('panel').insertAdjacentHTML('afterbegin',`<div class="controller-tabs panel-kind"><button data-panel-kind="single" aria-pressed="${panelKind==='single'}">单舵机</button><button data-panel-kind="protection" aria-pressed="${panelKind==='protection'}">全部保护</button></div>`);
  if(bench==='control'&&tab==='motion'){joystick('left');joystick('right');}
  if(!s.boards.arduino.connected)for(const el of document.querySelectorAll('[data-controller-mode],[data-control-action],[data-control-head],[data-control-mouth],[data-control-setting],[data-control-imu],#roller-mode'))el.disabled=true;
  updateLive();
 }
 $('scan-servos').onclick=async()=>{stopControl();bench='servo';servoOwned=true;await run('scan',{},'正在扫描，可随时停止并保留已发现编号');};
 $('stop-scan').onclick=()=>api('scan-stop').then(()=>poll(true)).catch(error=>say(error.message,true));
 document.body.addEventListener('click',async e=>{
  const nav=e.target.closest('[data-workbench]');if(nav){if(getState().busy)return;await leaveOwned();bench=nav.dataset.workbench;if(bench==='servo')panelKind='single';getState().selectedBoard=null;if(bench!=='servo')getState().view='robot';render();return;}
  const t=e.target.closest('[data-control-tab]');if(t){await zero();tab=t.dataset.controlTab;render();return;}
  const p=e.target.closest('[data-panel-kind]');if(p){panelKind=p.dataset.panelKind;render();return;}
  const m=e.target.closest('[data-controller-mode]');if(m){mode(m.dataset.controllerMode);return;}
  const a=e.target.closest('[data-control-action]')?.dataset.controlAction;if(!a)return;
  if(a==='zero'){await zero();say('运动输入已归零，控制模式保留');return;}
  if(a==='head-zero'){c.head.fill(0);c.mouth=0;if(!armed)await mode('shadow');c.head.fill(0);c.mouth=0;await run('command',{head:[0,0,0,0],mouth:0},'头嘴输入已归零');return;}
  if(a==='pick'||a==='roulade'){if(ready()&&canAction())await run(a,{},a==='pick'?'拾取已启动':'翻滚已启动');return;}
  const d=selected(getState());
  if(a==='cal-enter'){stopControl();const r=await run('cal-enter',{},'已进入校准，全部卸载');if(r){calOwned=true;servoOwned=false;c.calibrating=true;render();}}
  if(a==='cal-exit'){calOwned=false;await run('cal-exit',{},'校准已退出，全部卸载');}
  if(a==='cal-center'&&editable()&&calOwned)await run('cal-center',{id:d.id},`ID${d.id} 已收到中位保持回执；请核对实际孔位`);
  if(a==='reset-mid'&&editable()&&!calOwned){stopControl();servoOwned=true;await run('reset-mid',{id:d.id},'已发送所选中位重置，位置待读回');}
  if(a.startsWith('protection-')){stopControl();const values=a==='protection-current'?{current_a:$('protection-current').value.trim()===''?NaN:Number($('protection-current').value)}:{enabled:a==='protection-on'};if('current_a'in values&&(!Number.isFinite(values.current_a)||values.current_a<0||values.current_a>425.9775)){say('请输入0–425.9775之间的电流值',true);return;}servoOwned=true;const result=await run('protection',values,'广播已发送，未逐只验证');if(result){if('current_a'in values)c.protection.requestedCurrent=values.current_a;else c.protection.requestedEnabled=values.enabled;render();}}
 });
 document.body.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-control-head],[data-control-mouth],[data-control-setting],[data-control-imu]')){const out=$(el.id+'-value');if(out)out.textContent=el.value;}
  if(el.dataset.controlHead!==undefined)c.head[Number(el.dataset.controlHead)]=Number(el.value);if(el.hasAttribute('data-control-mouth'))c.mouth=Number(el.value);
 });
 document.body.addEventListener('change',async e=>{const el=e.target;
  if(el.id==='roller-mode'){await zero();await run('roller',{enabled:el.checked},'已切换运动参数组');}
  if(el.dataset.controlSetting){const p={...c.tuning,[el.dataset.controlSetting]:Number(el.value)};await run(el.dataset.controlSetting==='scale'?'action-scale':'filter',el.dataset.controlSetting==='scale'?{scale:p.scale}:{leg:p.leg,head:p.head},'动作参数已应用');}
  if(el.dataset.controlImu)await run('imu-filter',el.dataset.controlImu==='gyroAlpha'?{gyro_alpha:Number(el.value)}:{gravity_tau_s:Number(el.value)},'IMU滤波参数已应用');
  if(el.matches('[data-control-head],[data-control-mouth]')){const head=[...c.head],mouth=c.mouth;if(!armed){try{await api('mode',{mode:['shadow','hold','policy'].includes(c.mode)?c.mode:'shadow'});armed=true;}catch(error){say(error.message,true);return;}}c.head=head;c.mouth=mouth;await api('command',{head,mouth}).catch(error=>say(error.message,true));}
 });
 document.addEventListener('keydown',e=>{if(bench!=='control'||e.target.closest('input,textarea,select,[contenteditable=true]'))return;if(e.code==='Space'){e.preventDefault();emergency();return;}const k=e.key.toLowerCase();if(tab==='motion'&&armed&&'wasdqe'.includes(k)&&k.length===1&&ready()){e.preventDefault();keys.add(k);c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);}});
 document.addEventListener('keyup',e=>{if(keys.delete(e.key.toLowerCase())){c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);if(!keys.size&&Object.values(sticks).every(p=>p.x===0&&p.y===0))zero();}});
 const timer=setInterval(async()=>{if(stopped||document.hidden)return;if(calOwned&&!sending){sending=true;try{await api('cal-heartbeat');}catch(error){calOwned=false;say(error.message,true);}finally{sending=false;}return;}if(!armed||sending)return;
  c.motion=c.motion.map((v,i)=>.3*v+.7*c.target[i]);if(c.target.every(v=>v===0))c.motion=[0,0,0];sending=true;
  try{await api('command',{twist:c.motion,head:c.head,mouth:c.mouth});c.sent++;}catch(error){stopControl();say(error.message,true);}finally{sending=false;updateLive();}
 },50);
 function beaconLeave(){if(armed||calOwned||servoOwned){zeroLocal();navigator.sendBeacon('/api/duck-debug/action',new Blob([JSON.stringify({action:'leave'})],{type:'application/json'}));stopControl();calOwned=false;servoOwned=false;}}
 window.addEventListener('blur',()=>{zero();if(calOwned)leaveOwned().then(()=>{poll(true);render();});});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)beaconLeave();});
 window.addEventListener('pagehide',()=>{beaconLeave();stopped=true;clearInterval(timer);},{once:true});
 return {renderPanel,afterRender,updateLive,emergency,stopControl(){stopControl();servoOwned=true;},canInspect:()=>servoOwned&&bench==='servo',selectDevice(kind){if(kind==='board'||bench==='control'){leaveOwned();bench='servo';}panelKind='single';},ingest(data){
  c.status=data.status;c.snapshot={status:data.status};c.mode=data.status.mode??'unknown';c.roller=!!data.status.roller?.enabled;c.calibrating=calOwned&&c.mode==='calibrate';
  const p=c.roller?data.status.roller:data.status.deployment;if(p)c.tuning={scale:p.action_scale,leg:p.action_alpha,head:p.action_alpha_head};
  c.gyroAlpha=data.status.deployment?.gyro_alpha??c.gyroAlpha;c.gravityTau=data.status.deployment?.gravity_tau_s??c.gravityTau;
  if(!armed){c.head=data.status.head??c.head;c.mouth=data.status.mouth??c.mouth;}
  if(armed&&!['off','shadow','hold','policy'].includes(c.mode))stopControl();
 },};
}
