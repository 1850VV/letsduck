import {applyBrand} from '../shared/brand.mjs';
import {IDS,role,createState,mergeStatus,online,selected,duplicate,parameterErrors,legPlan,mappingError} from './state.mjs';
import {createScene} from './scene.mjs';
import {readNumberingReadiness,updateNumberingReadiness,refreshNumberingReadiness} from '../shared/numbering-readiness.mjs';
import {createDeviceTools} from './device-tools.mjs';
applyBrand();
if(new URLSearchParams(location.search).has('embedded'))document.body.dataset.embedded='true';
const state=createState();let step=1,scene,deviceTools,polling=false,signature='';
const $=id=>document.getElementById(id),number=input=>input.value.trim()===''?NaN:Number(input.value);
function say(message,error=false){state.message=message;$('feedback').textContent=message;$('feedback').classList.toggle('error',error);}
const canEdit=d=>d?.online&&!duplicate(state,d.id)&&!state.busy;
const boardNames={arduino:'Arduino UNO Q',expansion:'舵机扩展板'};
function chooseBoard(id){if(state.busy)return;deviceTools?.selectDevice('board');state.selectedBoard=id;state.mode='single';state.draft=null;render();}
function choose(id){if(state.busy)return;const d=state.devices.find(d=>d.id===id);if(!d)return;deviceTools?.selectDevice('servo');state.selectedBoard=null;state.selected=d.uid;state.mode='single';state.draft=null;render();}
export async function api(action,values={}){
 const r=await fetch('/api/duck-debug/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...values})});
 const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error??'操作未完成'),{details:data});return data;
}
async function run(action,values={},message='操作完成',after){
 if(state.busy)return;
 state.busy=true;render();
 try{const data=await api(action,values);after?.(data);await poll(true);say(message);return data;}
 catch(error){await poll(true);say(error.message,true);return null;}
 finally{state.busy=false;state.draft=null;render();}
}
function slots(){
 const active=new Set(online(state).map(d=>d.id)),d=selected(state),progress=readNumberingReadiness();
 $('board-slots').innerHTML=Object.entries(boardNames).map(([id,name])=>{const live=state.boards[id].connected;return `<button class="board-slot ${live?'online':''} ${state.selectedBoard===id?'selected':''}" data-board-slot="${id}" aria-label="选择 ${name}，${live?'已连接':'未确认'}" aria-pressed="${state.selectedBoard===id}" ${state.busy?'disabled':''}><i class="dot ${live?'green':''}"></i><strong>${name}</strong><small>${live?'已连接':'未确认'}</small></button>`;}).join('');
 $('slots').innerHTML=[['右腿',IDS.slice(0,5)],['左腿',IDS.slice(5,10)],['头颈与鸭嘴',IDS.slice(10)]].map(([title,ids])=>`<div><div class="slot-group-title"><span>${title}</span><span>${ids[0]}–${ids.at(-1)}</span></div><div class="slot-row">${ids.map(id=>`<button class="slot ${active.has(id)?'online':''} ${!state.selectedBoard&&d?.id===id?'selected':''} ${duplicate(state,id)?'conflict':''}" data-slot="${id}" data-online="${active.has(id)}" aria-label="选择 ID${id}，${role(id)}，${active.has(id)?'在线':'离线'}" aria-pressed="${!state.selectedBoard&&d?.id===id}" ${state.busy?'disabled':''}>${id}<i class="slot-dot"></i>${progress.verifiedIds.includes(id)?'<span class="slot-verified" aria-label="编号已验证">✓</span>':''}</button>`).join('')}</div></div>`).join('');
 const extra=state.devices.filter(d=>!IDS.includes(d.id));$('extra-devices').hidden=!extra.length;
 $('extra-devices').innerHTML=extra.length?'其他在线 '+extra.map(d=>`<button data-slot="${d.id}">ID ${d.id} · ${d.online?'在线':'最近扫描'}</button>`).join(''):'';
 $('slot-count').textContent=`${active.size} 个编号在线 / 15 个固定盘位`;
 $('numbering-progress').textContent=`编号已验证 ${progress.verifiedIds.length}/15 · ${progress.ready?'组装鸭已解锁':'完成后解锁组装鸭'}`;
 $('verify-online').disabled=state.busy||!online(state).length;
}
function panelBoard(){const id=state.selectedBoard,live=state.boards[id].connected;
 const upstream=id==='arduino'?(state.transport==='lan'?'Mac · 网络':'Mac · USB'):'Arduino UNO Q';
 $('panel').innerHTML=`<div class="panel-heading"><h2 style="font-size:22px">${boardNames[id]}</h2><span class="live-badge ${live?'':'off'}"><i class="dot ${live?'green':''}"></i>${live?'已连接':'未确认'}</span></div><p class="role">${id==='arduino'?'主控板':'舵机总线与独立供电'}</p><dl class="board-detail"><div><dt>通信状态</dt><dd>${live?'已确认连通':'尚未确认'}</dd></div><div><dt>连接上游</dt><dd>${upstream}</dd></div><div><dt>下游设备</dt><dd>${id==='arduino'?'舵机扩展板':`${online(state).length} 只舵机在线`}</dd></div><div><dt>实测供电电压</dt><dd>未读取</dd></div></dl><button class="primary" data-action="probe-board">重新检测连接</button><p class="board-note">连接状态与绿色模型同步。主控链路与舵机独立供电分开确认。</p><div class="panel-grow"></div><div class="panel-bottom">板卡外形为示意模型</div>`;
}
function field(key,label,value,disabled,extra=''){return `<label class="field ${key==='id'?'id-field':''}">${label}<input id="edit-${key}" aria-label="${label}" aria-describedby="error-${key}" type="number" step="1" min="0" max="${key==='id'?253:255}" value="${value??''}" ${disabled?'disabled':''} ${extra}><span class="field-error" id="error-${key}"></span></label>`;}
function panelSingle(){
 const d=selected(state),live=d?.online,editable=canEdit(d),conflict=live&&duplicate(state,d.id),draft=state.draft??d;
 $('panel').innerHTML=`<div class="panel-heading"><h2>ID ${d.id}</h2><span class="live-badge ${live?'':'off'}"><i class="dot ${live?'green':''}"></i>${live?'在线':'离线'}</span></div><p class="role">${role(d.id)}</p>
 ${conflict?'<div class="inline-alert">相同地址存在冲突。相同编号无法分别寻址，需要分开连接后改号。</div>':!live?'<div class="inline-alert">当前未在线。保留编号位置，连接后再读取和修改。</div>':''}
 <div class="readback"><div><span>当前位置 · 原始值</span><b id="current-position">${live?(d.readbackPending?'待读回':d.pos??'—'):'—'}</b></div><div><span>输出状态</span><b class="torque">${live?(d.held?'保持当前位置':'已卸载'):'—'}</b></div></div>
 <div class="section-label"><span>编号与参数</span><button data-action="read" ${!state.boards.arduino.connected||state.busy?'disabled':''}>重新读取 ↻</button></div>
 <div class="form-grid">${field('id','舵机编号',draft.id,!editable)}${field('kp',d.parametersLive?'KP':'KP · 上次读回',live?draft.kp:'',!editable,'placeholder="未在线"')}${field('kd',d.parametersLive?'KD':'KD · 上次读回',live?draft.kd:'',!editable,'placeholder="未在线"')}</div>
 <button id="write-parameters" class="primary write-button" data-action="write" ${!editable?'disabled':''}>${state.busy?'正在写入并读回…':'写入编号与参数'}</button><p class="saved-note">改号与参数写入保留中位</p>
 <section class="micro"><div class="micro-title"><span>位置微调</span><button data-action="hold" ${!editable?'disabled':''}>${d.jogReady?'关闭微调':'开启微调'}</button></div><div class="step-row"><span>步幅</span>${[1,5,10].map(n=>`<button data-step="${n}" aria-pressed="${step===n}" ${!editable?'disabled':''}>${n} · ${(n*360/4095).toFixed(2)}°</button>`).join('')}</div>
 <div class="jog-row"><button class="secondary" data-jog="-1" ${!editable||!d.jogReady?'disabled':''}>− ${step} 单位</button><button class="secondary" data-jog="1" ${!editable||!d.jogReady?'disabled':''}>＋ ${step} 单位</button></div>
 <div class="target-row"><input id="target-position" aria-label="目标位置" type="number" min="0" max="4095" step="1" placeholder="目标位置 · 单次±10" ${!editable||!d.jogReady?'disabled':''}><button data-action="move" class="secondary" ${!editable||!d.jogReady?'disabled':''}>移动</button></div><p class="micro-caption">单次最多10单位；动作约0.25秒后自动卸载。主、副舵盘属于同一只舵机。</p></section>
 <div class="panel-grow"></div><div class="panel-bottom">只操作所选编号 · 串联中的其他舵机保持原设置</div>`;
 for(const key of ['id','kp','kd'])$('edit-'+key).addEventListener('input',validateForm);
}
function validateForm(){
 const values=Object.fromEntries(['id','kp','kd'].map(k=>[k,number($('edit-'+k))])),errors=parameterErrors(state,state.selected,values);
 for(const key of ['id','kp','kd']){$('error-'+key).textContent=errors[key]??'';$('edit-'+key).classList.toggle('invalid',!!errors[key]);}
 $('write-parameters').disabled=state.busy||Object.keys(errors).length>0;return {values,errors};
}
function openBatch(mode){if(state.busy)return;state.selectedBoard=null;state.mode=mode;state.draft=null;state.batch=mode==='swap'?legPlan(state):online(state).map(d=>({uid:d.uid,from:d.id,to:d.id}));render();}
function panelBatch(){
 const error=mappingError(state,state.batch),changes=state.batch.filter(p=>p.to!==p.from).length;
 $('panel').innerHTML=`<button class="back-link" data-action="back" ${state.busy?'disabled':''}>← 返回所选舵机</button><h2>${state.mode==='swap'?'左右腿互换':'自定义改号'}</h2><p class="batch-intro">只修改当前在线的 ${state.batch.length} 只。中位和 KP/KD 保持不变。</p>
 ${state.batch.length?`<table class="batch-table"><thead><tr><th>当前编号</th><th></th><th>目标编号</th><th>状态</th></tr></thead><tbody>${state.batch.map((p,i)=>`<tr><td><b>ID ${p.from}</b><span class="role-tiny">${role(p.from)}</span></td><td class="arrow">→</td><td>${state.mode==='custom'?`<input type="number" min="0" max="253" step="1" data-batch-index="${i}" aria-label="ID${p.from} 的目标编号" value="${p.to}" ${state.busy?'disabled':''}>`:`<span class="new-id">ID ${p.to}</span>`}</td><td class="check">${state.busy?'处理中':'在线'}</td></tr>`).join('')}</tbody></table>`:'<div class="empty-batch">当前没有可交换的在线腿部舵机</div>'}
 <div class="batch-footer"><div class="error-note" id="batch-error">${error}</div><p>卡槽和模型会随新编号更新，读回后显示结果。</p></div><div class="panel-grow"></div><button class="primary" data-action="apply-batch" id="apply-batch" ${error||!changes||state.busy?'disabled':''}>${state.busy?'正在修改并读回…':`应用这 ${changes} 项修改`}</button><button class="secondary" data-action="back" ${state.busy?'disabled':''}>返回</button>`;
 for(const el of document.querySelectorAll('[data-batch-index]'))el.addEventListener('input',()=>{
  state.batch[Number(el.dataset.batchIndex)].to=number(el);const error=mappingError(state,state.batch),changes=state.batch.filter(p=>p.from!==p.to).length;
  $('batch-error').textContent=error;$('apply-batch').disabled=!!error||!changes;$('apply-batch').textContent=`应用这 ${changes} 项修改`;
 });
}
function render(){
 const n=online(state).length;$('online-count').textContent=`${n} 只在线`;
 $('board-state').innerHTML=`<i class="dot ${state.boards.arduino.connected?'green':''}"></i>UNO Q · ${state.boards.arduino.connected?'USB已连接':'未确认'}`;
 for(const el of document.querySelectorAll('[data-view]'))el.setAttribute('aria-pressed',String(el.dataset.view===state.view));
 $('stage-caption').textContent=state.view==='robot'?'按编号对应安装位':state.view==='tray'?'十五只舵机 · 固定编号位置':'逻辑连接示意 · 不是实物串联顺序';
 $('stage-help').textContent=state.view==='circuit'?'USB → UNO Q → 扩展板 → 舵机总线 · 供电另接电池':'拖动旋转 · 滚轮缩放 · 点舵机查看参数';
 $('release-all').disabled=!state.boards.arduino.connected;$('batch-swap').disabled=state.busy||!n;$('batch-custom').disabled=state.busy||!n;
 slots();if(!deviceTools?.renderPanel()){state.selectedBoard?panelBoard():state.mode==='single'?panelSingle():panelBatch();}
 scene?.update(state);deviceTools?.afterRender();say(state.message);
}
async function poll(force=false){
 if(polling||document.hidden&&!force)return;polling=true;
 try{
  const response=await fetch('/api/duck-debug/status');if(!response.ok)throw Error('控制器状态读取失败');const data=await response.json();
  const next=JSON.stringify([data.onlineIds,data.boards,data.status.mode,data.scan,data.numbering.verifiedIds,data.devices.map(d=>[d.id,d.held,d.parametersLive,d.readbackPending])]);
  mergeStatus(state,data);updateNumberingReadiness(data.numbering);deviceTools?.ingest(data);
  if(data.error)say(data.error,true);
  if(next!==signature&&!document.activeElement?.closest('input,select,textarea')){signature=next;render();}
  else{slots();scene?.update(state);deviceTools?.updateLive();}
  const d=selected(state);if($('current-position'))$('current-position').textContent=d?.online?(d.readbackPending?'待读回':d.pos??'—'):'—';
 }catch(error){for(const d of state.devices)d.online=false;state.boards={arduino:{connected:false},expansion:{connected:false}};render();say(error.message,true);}
 finally{polling=false;}
}
async function write(){
 const {values,errors}=validateForm();if(Object.keys(errors).length)return;const d=selected(state);state.draft=values;
 deviceTools.stopControl();await run('parameters',{id:d.id,new_id:values.id,kp:values.kp,kd:values.kd},`已读回 ID${values.id} · KP ${values.kp} · KD ${values.kd} · 中位未改`,()=>{state.selected='servo-'+values.id;});
}
async function batch(){
 const error=mappingError(state,state.batch);if(error){say(error,true);return;}
 const plan=state.batch.map(p=>({fromId:p.from,toId:p.to})),old=selected(state)?.id;
 deviceTools.stopControl();await run('remap',{plan},'编号修改已读回，KP/KD和中位未改',()=>{state.selected='servo-'+(plan.find(p=>p.fromId===old)?.toId??old);state.mode='single';});
}
async function jog(delta){
 const d=selected(state);if(!canEdit(d)||!d.jogReady)return;
 if(!Number.isInteger(delta)||!delta||Math.abs(delta)>10){say('单次请输入±1至±10单位；目标不变时无需移动',true);return;}
 deviceTools.stopControl();await run('jog',{id:d.id,delta},`ID${d.id} 微动结束，已自动卸载；KP/KD和中位未改`);
}
document.body.addEventListener('click',e=>{
 const board=e.target.closest('[data-board-slot]');if(board){chooseBoard(board.dataset.boardSlot);return;}
 const slot=e.target.closest('[data-slot]');if(slot){choose(Number(slot.dataset.slot));return;}
 const view=e.target.closest('[data-view]');if(view){state.view=view.dataset.view;render();return;}
 const stride=e.target.closest('[data-step]');if(stride){step=Number(stride.dataset.step);render();return;}
 const button=e.target.closest('[data-jog]');if(button){jog(Number(button.dataset.jog)*step);return;}
 const action=e.target.closest('[data-action]')?.dataset.action,d=selected(state);
 if(action==='write')write();if(action==='apply-batch')batch();if(action==='back'){state.mode='single';render();}
 if(action==='read'){deviceTools.stopControl();run('read',{id:d.id},`已读回 ID${d.id}`);}
 if(action==='probe-board')poll(true);
 if(action==='hold'&&canEdit(d)){if(d.jogReady){d.jogReady=false;render();return;}deviceTools.stopControl();run('read',{id:d.id},'微调已开启；每次动作后自动卸载',()=>{d.jogReady=true;});}
 if(action==='move'&&canEdit(d)&&d.jogReady){const target=number($('target-position'));if(!Number.isInteger(target)||target<0||target>4095){say('目标位置请输入0–4095的整数',true);return;}jog(target-d.pos);}
});
$('batch-swap').onclick=()=>openBatch('swap');$('batch-custom').onclick=()=>openBatch('custom');
$('verify-online').onclick=()=>{deviceTools.stopControl();run('verify',{},'在线编号已读回复核，累计进度已保存');};
$('release-all').onclick=()=>{deviceTools.emergency();};
$('reset-camera').onclick=()=>scene?.fit();document.querySelector('.brand').href='/';
deviceTools=createDeviceTools({getState:()=>state,render,say,canEdit,api,poll,run});render();
scene=createScene({host:$('viewport'),labelsHost:$('labels'),onSelect:choose,onBoardSelect:chooseBoard});scene.update(state);
scene.ready.then(()=>{$('loading').hidden=true;document.body.dataset.modelReady='true';render();}).catch(error=>{$('loading').textContent='模型未加载，请检查组装素材';document.body.dataset.modelReady='failed';console.error(error);});
const inspectTimer=setInterval(()=>{const d=selected(state);if(!document.hidden&&!state.busy&&!state.scan?.active&&deviceTools.canInspect()&&d?.parametersLive&&!IDS.includes(d.id))api('inspect',{id:d.id}).catch(()=>{});},750);
poll();const pollTimer=setInterval(poll,250);window.addEventListener('pagehide',()=>{clearInterval(pollTimer);clearInterval(inspectTimer);},{once:true});
