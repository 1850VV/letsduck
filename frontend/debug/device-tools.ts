import {setLocalizedHTML,isRefreshingCopy} from './localized-dom.js';
import {dt,dm,escapeAttribute,debugFailure} from './i18n.js';
import type {DebugState,Device,MCUStatus,DebugSnapshot,DebugAction,DebugRun,DebugNotice} from './types.js';
import {query as queryElement,required,eventElement,inputElement} from '../lib/browser.js';
import {jsonStringify} from '../shared/json.js';
interface DeviceToolsOptions {getState():DebugState;render():void;say(message:DebugNotice,error?:boolean):void;canEdit(device:Device|undefined):boolean;api:DebugAction;poll(force?:boolean):Promise<void>;run:DebugRun;automatic?:ReturnType<typeof import('./automatic.js').createAutomaticNumbering>;zeroCalibration?:ReturnType<typeof import('./zero-calibration.js').createZeroCalibration>;servoCheck?:ReturnType<typeof import('./servo-check.js').createServoCheck>;checkup?:ReturnType<typeof import('./checkup.js').createCheckup>}
interface ControlState {mode:string;roller:boolean;head:number[];mouth:number;motion:number[];target:number[];calibrating:boolean;status:MCUStatus}
import {IDS,role,selected} from './state.js';
import {padMapHTML,paintPad,type PadKey} from './pad-map.js';
import {MODE_NAMES,motionFromInput,canControl,actionState,DUCK_ACTIONS,type DuckAction} from './control.js';
export function createDeviceTools({getState,render,say,canEdit,api,poll,run,automatic,zeroCalibration,servoCheck,checkup}:DeviceToolsOptions){
 const $=<T extends HTMLElement=HTMLElement>(id:string)=>queryElement<T>('#'+id);
 const c:ControlState={mode:'unknown',roller:false,head:[0,0,0,0],mouth:0,motion:[0,0,0],target:[0,0,0],calibrating:false,status:{}};
 // Daily pages first; numbering, zero calibration and single-servo settings share the 设置 page.
 const SETTINGS=['servo','automatic','calibrate'];
 let bench='control',tab='motion',zeroTab:'coarse'|'align'|'fine'='coarse',armed=false,calOwned=false,servoOwned=false,sending=false,stopped=false;
 const query=new URLSearchParams(location.search).get('bench');if(query&&['servo','control','calibrate','check','checkup'].includes(query))bench=query;if(bench==='check')servoCheck?.enter();if(bench==='checkup')checkup?.enter();
 const keys=new Set<string>(),sticks={left:{x:0,y:0},right:{x:0,y:0}};
 const recoveryPhase=(phase:string)=>['walk','getup','fallen','recovery','idle','stand'].includes(phase)?dt('debug.phase.'+phase):phase;
 const ready=()=>getState().boards.arduino.connected&&canControl(c.status);
 const editable=()=>canEdit(selected(getState()));
 function zeroLocal(){keys.clear();sticks.left={x:0,y:0};sticks.right={x:0,y:0};c.motion=[0,0,0];c.target=[0,0,0];for(const el of document.querySelectorAll<HTMLElement>('.control-knob'))el.style.transform='translate(0,0)';updateLive();}
 function stopControl(){armed=false;zeroLocal();}
 async function zero(){zeroLocal();if(armed)try{await api('command',{twist:[0,0,0]});}catch(error){stopControl();say(debugFailure(error),true);}}
 async function emergency(){stopControl();calOwned=false;servoOwned=false;if(automatic?.active){await automatic.release();return;}await api('release').then(()=>poll(true)).catch(error=>say(debugFailure(error),true));render();}
 async function mode(value:string){if(['hold','policy'].includes(value)&&!ready())return;stopControl();const result=await run('mode',{mode:value},{toString:()=>MODE_NAMES[value]??dt('未知')});if(result){armed=value!=='off';servoOwned=false;calOwned=false;}}
 const ACTION_LABELS:Record<DuckAction,string>={pick:'捡东西',roulade:'翻滚',sitstand:'坐下','left-kick':'左脚踢','right-kick':'右脚踢'};
 const actionLabel=(id:DuckAction)=>id==='sitstand'&&actionState(c.status).posture==='stand'?'站起':ACTION_LABELS[id];
 async function duckAction(id:DuckAction){if(getState().busy||!ready()||!actionState(c.status).allowed[id])return;const label=actionLabel(id);zeroLocal();await run(id,id==='sitstand'?{posture:actionState(c.status).posture}:{},dm(label));}
 async function leaveOwned(){zeroLocal();const owned=armed||calOwned||servoOwned;stopControl();calOwned=false;servoOwned=false;if(owned)try{await api('leave');}catch(error){say(debugFailure(error),true);}}
 const controlNav=()=>`<div class="controller-tabs">${[['motion',dt("运动")],['head',dt("头和嘴")]].map(([id,label])=>`<button data-control-tab="${id}" aria-pressed="${tab===id}">${label}</button>`).join('')}</div>`;
 function slider(id:string,label:string,value:number,min:number,max:number,step:number,attribute:string){return `<label class="control-slider">${label}<output id="${id}-value">${value}</output><input id="${id}" aria-label="${label}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" ${attribute}></label>`;}
 function motionPanel(){const disabled=!ready();return `<div class="mode-buttons">${[['shadow',dt("空跑（不动）")],['hold',dt("站稳")],['policy',dt("走路 / 起身")]].map(([id,label])=>`<button data-controller-mode="${id}" aria-pressed="${c.mode===id}" ${id!=='shadow'&&disabled?'disabled':''}>${label}</button>`).join('')}</div>
  <div class="joystick-pair"><div><small>${c.roller?dt("前进 / 后退"):dt("前进 / 侧移")}</small><div class="control-joy" id="control-joy-left" role="group" aria-label="${escapeAttribute(dt("前进与侧移摇杆"))}"><i class="control-knob"></i></div></div><div><small>${dt("转向")}</small><div class="control-joy" id="control-joy-right" role="group" aria-label="${escapeAttribute(dt("转向摇杆"))}"><i class="control-knob"></i></div></div></div>
  <div class="motion-values">${dt("前后")} <b id="control-vx">0.00</b> · ${dt("左右")} <b id="control-vy">0.00</b> · ${dt("转向")} <b id="control-wz">0.00</b></div><button class="secondary" data-control-action="zero">${dt("停下")}</button><div class="action-pair duck-actions" role="group" aria-label="${escapeAttribute(dt("动作"))}">${DUCK_ACTIONS.map(id=>`<button data-duck-action="${id}" disabled>${dt(actionLabel(id))}</button>`).join('')}</div><p class="control-note">${dt("松手就停 · 键盘 WASD 移动、Q/E 转向、空格全部放松")}</p><div class="pad-map" id="control-pad" hidden>${padMapHTML(actionLabel)}</div>
  <div class="recovery-readout"><span id="recovery-label"></span></div>${disabled?`<p class="control-note">${dt("鸭子还没准备好：主板、姿态传感器（IMU）或舵机没有读数")}</p>`:''}`;}
 function headPanel(){return `${c.head.map((v,i)=>slider('control-head-'+i,role(30+i),v,-1,1,.02,`data-control-head="${i}"`)).join('')}${slider('control-mouth',role(34),c.mouth,0,30,1,'data-control-mouth')}<button class="secondary" data-control-action="head-zero">${dt("头和嘴回正")}</button>`;}
 function panelControl(){return `<div class="panel-heading"><h2>${dt("控制")}</h2><span class="control-mode" id="controller-mode"></span></div>${controlNav()}<div class="controller-body">${tab==='head'?headPanel():motionPanel()}</div>`;}
 function panelCalibration(){const d=selected(getState()),live=editable(),fixed=IDS.includes(d.id);return `<div class="panel-heading"><h2>${dt("校零模式")}</h2><span class="control-mode">${c.calibrating?dt("校准中"):dt("未开始")}</span></div><p class="control-note">${dt("先全部放松，用手把腿和脖子摆到零点姿势，再逐个选中舵机点「设为零点」。")}</p><button class="${c.calibrating?'secondary':'primary'}" data-control-action="cal-enter">${c.calibrating?dt("再次全部放松"):dt("开始（全部放松）")}</button><div class="cal-selected"><span>${role(d.id)}</span><h3>ID ${d.id}</h3><div>${dt("当前位置")} <b data-cal-position>${d.online?d.pos:'—'}</b></div><p>${d.online?(d.held?dt("保持2048"):dt("已放松，可以用手摆")):dt("当前未在线")}</p></div><button class="primary" data-control-action="cal-center" ${!live||!fixed||!c.calibrating||d.held?'disabled':''}>${dt("设为零点")}</button><button class="secondary" data-control-action="cal-exit" ${!c.calibrating?'disabled':''}>${dt("结束校准")}</button><button class="secondary" data-control-action="reset-mid" ${!live||c.calibrating?'disabled':''}>${dt("恢复出厂零点")}</button>`;}
 function renderPanel(){$('panel').classList.toggle('automatic-panel',bench==='automatic');if(bench==='automatic'&&automatic)return automatic.renderPanel();if(bench==='control'){setLocalizedHTML($('panel'),panelControl());return true;}if(bench==='check'&&servoCheck){setLocalizedHTML($('panel'),servoCheck.renderPanel());return true;}if(bench==='checkup'&&checkup){setLocalizedHTML($('panel'),checkup.renderPanel());return true;}if(bench==='calibrate'){setLocalizedHTML($('panel'),zeroCalibration?`<div class="panel-heading"><h2>${dt('零点校准')}</h2></div><div class="controller-tabs zero-tabs">${(zeroCalibration.levelOnly()?['coarse','fine'] as const:['coarse','align','fine'] as const).map(k=>`<button data-zero-tab="${k}" aria-pressed="${zeroTab===k}">${k==='coarse'?dt('手动校零'):k==='align'?dt('对齐'):zeroCalibration.levelOnly()?dt('记为水平'):dt('细调')}</button>`).join('')}</div>${zeroTab==='coarse'?`<div class="zero-manual">${panelCalibration()}</div>`:zeroTab==='align'&&!zeroCalibration.levelOnly()?zeroCalibration.renderAlign():zeroCalibration.renderPanel()}`:panelCalibration());return true;}return false;}
 function updateReadouts(){
  const position=document.querySelector('[data-cal-position]'),d=selected(getState());
  if(position)position.textContent=d?.online?(d.readbackPending?dt("读取中"):String(d.pos??'—')):'—';
 }
 function updateLive(){
  updateReadouts();
  const s=c.status,q=getState().boards.arduino.connected;
  if(document.getElementById('controller-mode'))$('controller-mode').textContent=MODE_NAMES[c.mode]??dt("未知");
  ['vx','vy','wz'].forEach((id,i)=>{if(document.getElementById('control-'+id))$('control-'+id).textContent=required(c.motion[i]).toFixed(2);});
  if(document.getElementById('control-pad'))$('control-pad').hidden=!padNow();
  const acts=actionState(s);for(const b of document.querySelectorAll<HTMLButtonElement>('[data-duck-action]')){const id=b.dataset.duckAction as DuckAction;b.disabled=!q||getState().busy||!ready()||!acts.allowed[id];b.textContent=dt(actionLabel(id));}
  if(document.getElementById('recovery-label'))$('recovery-label').textContent=s.recovery?.phase?recoveryPhase(s.recovery.phase):'';
  if(bench==='calibrate')zeroCalibration?.updateLive();
  if(bench==='control')for(const button of document.querySelectorAll<HTMLButtonElement>('[data-controller-mode]'))button.disabled=!q||button.dataset.controllerMode!=='shadow'&&!ready();
 }
 function joystick(side:'left'|'right'){const zone=document.getElementById('control-joy-'+side);if(!zone)return;const knob=required(zone.querySelector<HTMLElement>('.control-knob'));let pointer:number|null=null;
  const reset=()=>{pointer=null;sticks[side]={x:0,y:0};knob.style.transform='translate(0,0)';c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);if(c.target.every(v=>v===0))zero();};
  const move=(e:PointerEvent)=>{const r=zone.getBoundingClientRect(),radius=(zone.clientWidth-knob.offsetWidth)/2;let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;const len=Math.hypot(dx,dy);if(len>radius){dx*=radius/len;dy*=radius/len;}sticks[side]={x:dx/radius,y:-dy/radius};knob.style.transform=`translate(${dx}px,${dy}px)`;c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);};
  zone.onpointerdown=e=>{if(pointer!==null||e.button!==0||!ready()||!armed)return;e.preventDefault();pointer=e.pointerId;zone.setPointerCapture(pointer);move(e);};zone.onpointermove=e=>{if(e.pointerId===pointer)move(e);};zone.onpointerup=zone.onpointercancel=zone.onlostpointercapture=e=>{if(e.pointerId===pointer)reset();};
 }
 function afterRender(){const s=getState(),group=SETTINGS.includes(bench)?'settings':bench;document.body.dataset.bench=group;
  document.querySelectorAll<HTMLButtonElement>('.work-tabs [data-workbench]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.workbench===bench||b.dataset.workbench==='servo'&&group==='settings'));b.disabled=s.busy;});
  document.querySelectorAll<HTMLButtonElement>('.settings-tabs [data-workbench]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.workbench===bench));b.disabled=s.busy;});
  const scan=s.scan;$<HTMLButtonElement>('scan-servos').disabled=automatic?.active||s.busy||scan?.active||!s.boards.arduino.connected;$<HTMLButtonElement>('stop-scan').hidden=!scan?.active;$('scan-progress-box').hidden=!scan?.checked&&!scan?.active;
  if(scan){$<HTMLProgressElement>('scan-progress').value=scan.checked;$('scan-status').textContent=dt("{phase} {checked}/254 · 已发现 {found}{error}",{phase:scan.active?dt('扫描'):scan.stopped?dt('已停止'):dt('扫描完成'),checked:scan.checked,found:scan.found.map(id=>'ID'+id).join(', ')||dt('0只'),error:scan.error?' · '+String(debugFailure({code:scan.errorCode,params:scan.errorParams,message:scan.error})):''});}
  if(!isRefreshingCopy()&&bench==='control'&&tab==='motion'){joystick('left');joystick('right');}
  if(!s.boards.arduino.connected)for(const el of document.querySelectorAll<HTMLInputElement>('[data-controller-mode],[data-control-action],[data-control-head],[data-control-mouth]'))el.disabled=true;
  updateLive();
 }
 $<HTMLButtonElement>('scan-servos').onclick=async()=>{stopControl();bench='servo';servoOwned=true;await run('scan',{},dm("正在扫描，可随时停止并保留已发现编号"));};
 $<HTMLButtonElement>('stop-scan').onclick=()=>api('scan-stop').then(()=>poll(true)).catch(error=>say(debugFailure(error),true));
 document.body.addEventListener('click',async e=>{
  const nav=eventElement(e).closest<HTMLElement>('[data-workbench]');if(nav){if(getState().busy||nav.dataset.workbench===bench||nav.closest('.work-tabs')&&nav.dataset.workbench==='servo'&&SETTINGS.includes(bench))return;getState().busy=true;render();try{if(bench==='automatic')await automatic?.leave();if(bench==='calibrate')await zeroCalibration?.leave();if(bench==='check')await servoCheck?.leave();if(bench==='checkup')checkup?.leave();await leaveOwned();bench=required(nav.dataset.workbench);if(bench==='automatic')await automatic?.enter();if(bench==='check')servoCheck?.enter();if(bench==='checkup')checkup?.enter();}catch(error){say(debugFailure(error),true);}finally{getState().busy=false;render();document.querySelector<HTMLElement>('[data-workbench="'+bench+'"]')?.focus({preventScroll:true});}return;}
  const t=eventElement(e).closest<HTMLElement>('[data-control-tab]');if(t){await zero();tab=required(t.dataset.controlTab);render();return;}
  // Fine tuning needs the duck standing, so leaving the hand-set centers also leaves calibrate mode.
  const z=eventElement(e).closest<HTMLElement>('[data-zero-tab]');if(z){const next=z.dataset.zeroTab==='fine'?'fine':z.dataset.zeroTab==='align'?'align':'coarse';if(zeroTab==='align'&&next!=='align')await zeroCalibration?.endAlign().catch(error=>say(debugFailure(error),true));if(next!=='coarse'&&calOwned){calOwned=false;await run('cal-exit',{},dm("校准已结束，全部放松"));}zeroTab=next;render();return;}
  const act=eventElement(e).closest<HTMLElement>('[data-duck-action]');if(act){void duckAction(act.dataset.duckAction as DuckAction);return;}
  const m=eventElement(e).closest<HTMLElement>('[data-controller-mode]');if(m){mode(required(m.dataset.controllerMode));return;}
  const a=eventElement(e).closest<HTMLElement>('[data-control-action]')?.dataset.controlAction;if(!a)return;
  if(a==='zero'){await zero();say(dm("运动输入已归零，控制模式保留"));return;}
  if(a==='head-zero'){c.head.fill(0);c.mouth=0;if(!armed)await mode('shadow');c.head.fill(0);c.mouth=0;await run('command',{head:[0,0,0,0],mouth:0},dm("头嘴输入已归零"));return;}
  const d=selected(getState());
  if(a==='cal-enter'){stopControl();const r=await run('cal-enter',{},dm("已开始校准，全部放松"));if(r){calOwned=true;servoOwned=false;c.calibrating=true;render();}}
  if(a==='cal-exit'){calOwned=false;await run('cal-exit',{},dm("校准已结束，全部放松"));}
  if(a==='cal-center'&&editable()&&calOwned&&await run('cal-center',{id:d.id},dm('ID{id} 已设为零点，请看一下孔位对不对',{id:String(d.id)})))await zeroCalibration?.centered(d.id).catch(error=>say(debugFailure(error),true));
  if(a==='reset-mid'&&editable()&&!calOwned){stopControl();servoOwned=true;await run('reset-mid',{id:d.id},dm("已恢复出厂零点"));}

 });
 document.body.addEventListener('input',e=>{const el=inputElement(e);if(el.matches('[data-control-head],[data-control-mouth]')){const out=document.getElementById(el.id+'-value');if(out)out.textContent=el.value;}
  if(el.dataset.controlHead!==undefined)c.head[Number(el.dataset.controlHead)]=Number(el.value);if(el.hasAttribute('data-control-mouth'))c.mouth=Number(el.value);
 });
 document.body.addEventListener('change',async e=>{const el=inputElement(e);
  if(el.matches('[data-control-head],[data-control-mouth]')){
   if(getState().busy)return;const head=[...c.head],mouth=c.mouth;getState().busy=true;render();
   try{if(!armed){await api('mode',{mode:['shadow','hold','policy'].includes(c.mode)?c.mode:'shadow'});armed=true;}c.head=head;c.mouth=mouth;await api('command',{head,mouth});}
   catch(error){say(debugFailure(error),true);}
   finally{getState().busy=false;render();}
  }
 });
 document.querySelector('.work-tabs')?.addEventListener('keydown',event=>{
  const e=event as KeyboardEvent;if(getState().busy||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const tabs=[...document.querySelectorAll<HTMLButtonElement>('.work-tabs [data-workbench]')],current=tabs.findIndex(button=>button===e.target);if(current<0)return;
  e.preventDefault();const direction=(e.key==='ArrowRight'?1:-1)*(document.documentElement.dir==='rtl'?-1:1),index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(current+direction+tabs.length)%tabs.length;
  tabs[index]?.click();
 });
 document.addEventListener('keydown',e=>{if(bench!=='control'||eventElement(e).closest<HTMLElement>('input,textarea,select,[contenteditable=true]'))return;if(e.code==='Space'){e.preventDefault();emergency();return;}const k=e.key.toLowerCase();if(tab==='motion'&&armed&&'wasdqe'.includes(k)&&k.length===1&&ready()){e.preventDefault();keys.add(k);c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);}});
 document.addEventListener('keyup',e=>{if(keys.delete(e.key.toLowerCase())){c.target=motionFromInput(c.roller,sticks.left,sticks.right,keys);if(!keys.size&&Object.values(sticks).every(p=>p.x===0&&p.y===0))zero();}});
 // Game controller via the browser Gamepad API (standard layout): left stick moves, right stick turns,
 // LB stands (hold), RB walks (policy), Select/−/View relaxes everything. Letting go of both sticks stops.
 let padSteering=false,padPressed:boolean[]=[];
 const padNow=()=>{const pads=[...(navigator.getGamepads?.()??[])].filter((p):p is Gamepad=>!!p?.connected);return pads.find(p=>p.mapping==='standard')??pads[0];};
 const padEnabled=(k:PadKey)=>{const q=getState().boards.arduino.connected;if(k.button===8)return q;if(!q||!ready())return false;if(!k.action)return armed;return k.action==='hold'||k.action==='policy'||actionState(c.status).allowed[k.action];};
 function readPad(){
  const pad=padNow(),before=padPressed,pressed=pad?pad.buttons.map(b=>b.pressed):[],hit=(i:number)=>!!pressed[i]&&!before[i];padPressed=pressed;
  if(!pad||bench!=='control'||tab!=='motion'){if(padSteering){padSteering=false;zeroLocal();}return;}
  const map=document.getElementById('control-pad');if(map)paintPad(map,pad,padEnabled,actionLabel);
  if(hit(8)){void emergency();return;}
  if(!getState().busy){if(hit(4))void mode('hold');else if(hit(5))void mode('policy');
   else{const id=([[0,'pick'],[1,'right-kick'],[2,'left-kick'],[3,'sitstand'],[12,'roulade']] as const).find(([i])=>hit(i))?.[1];if(id)void duckAction(id);}}
  const axis=(i:number)=>{const v=pad.axes[i]??0;return Math.abs(v)<=.15?0:Math.max(-1,Math.min(1,v));};
  const left={x:axis(0),y:-axis(1)},right={x:axis(2),y:-axis(3)},moving=[left.x,left.y,right.x].some(v=>v!==0);
  if(!armed||!ready()){if(padSteering){padSteering=false;zeroLocal();}return;}
  if(!moving&&!padSteering)return;// Idle pad: leave the on-screen sticks and keys alone.
  padSteering=moving;sticks.left=left;sticks.right=right;c.target=motionFromInput(c.roller,left,right,keys);
  for(const [side,p] of [['left',left],['right',right]] as const){const zone=document.getElementById('control-joy-'+side),knob=zone?.querySelector<HTMLElement>('.control-knob');if(zone&&knob){const r=(zone.clientWidth-knob.offsetWidth)/2;knob.style.transform=`translate(${p.x*r}px,${-p.y*r}px)`;}}
  if(!moving)void zero();
 }
 const timer=setInterval(async()=>{if(stopped||document.hidden)return;readPad();if(calOwned&&!sending){sending=true;try{await api('cal-heartbeat');}catch(error){calOwned=false;say(debugFailure(error),true);}finally{sending=false;}return;}if(!armed||sending)return;
  if(actionState(c.status).running)c.target=[0,0,0];// Official page: no walking input while an action plays.
  c.motion=c.motion.map((v,i)=>.3*v+.7*required(c.target[i]));if(c.target.every(v=>v===0))c.motion=[0,0,0];sending=true;
  try{await api('command',{twist:c.motion,head:c.head,mouth:c.mouth});}catch(error){stopControl();say(debugFailure(error),true);}finally{sending=false;updateLive();}
 },50);
 function beaconLeave(){if(armed||calOwned||servoOwned){zeroLocal();void fetch('/api/duck-debug/action',{method:'POST',headers:{'Content-Type':'application/json'},body:jsonStringify({action:'leave'}),keepalive:true}).catch(()=>{});stopControl();calOwned=false;servoOwned=false;}}
 window.addEventListener('blur',()=>{zero();if(calOwned)leaveOwned().then(()=>{poll(true);render();});});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)beaconLeave();});
 window.addEventListener('pagehide',()=>{beaconLeave();stopped=true;clearInterval(timer);},{once:true});
 return {renderPanel,afterRender,updateLive,emergency,stopControl(){stopControl();servoOwned=true;},canInspect:()=>servoOwned&&bench==='servo',selectDevice(){/* Picking a servo keeps the current page. */},ingest(data:DebugSnapshot){
  c.status=data.status;c.mode=data.status.mode??'unknown';c.roller=!!data.status.roller?.enabled;c.calibrating=calOwned&&c.mode==='calibrate';
  if(!armed){c.head=data.status.head??c.head;c.mouth=data.status.mouth??c.mouth;}
  if(armed&&!['off','shadow','hold','policy'].includes(c.mode))stopControl();
 },};
}
