import '../shared/form-messages.js';
import {setLocalizedHTML,refreshDisplayCopy,isRefreshingCopy} from './localized-dom.js';
import {dt,dm,t,onLocale,bindTranslations,escapeAttribute,debugFailure,displayError} from './i18n.js';
import type {Device,Parameters,DebugView,DebugNotice} from './types.js';
import {readDebugSnapshot} from './types.js';
import {query,required,eventElement,isRecord} from '../lib/browser.js';
import {parseResponseJson,jsonStringify} from '../shared/json.js';
import {applyBrand} from '../shared/brand.js';
import {IDS,role,createState,mergeStatus,online,selected,duplicate,parameterErrors,legPlan,mappingError,mappingNotice} from './state.js';
import {createScene} from './scene.js';
import {readNumberingReadiness,updateNumberingReadiness} from '../shared/numbering-readiness.js';
import {createDeviceTools} from './device-tools.js';
applyBrand();
if(new URLSearchParams(location.search).has('embedded'))document.body.dataset.embedded='true';
function readView(value:string|undefined):DebugView {if(value==='robot'||value==='tray'||value==='circuit')return value;throw displayError('未知调试视图');}
const state=createState();let step=1,scene:ReturnType<typeof createScene>|undefined,deviceTools:ReturnType<typeof createDeviceTools>,polling=false,signature='';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>query<T>('#'+id),number=(input:HTMLInputElement)=>input.value.trim()===''?NaN:Number(input.value);
function say(message:DebugNotice,error=false){state.message=message;$('feedback').textContent=String(message);$('feedback').classList.toggle('error',error);}
const canEdit=(d:Device|undefined)=>!!d?.online&&!duplicate(state,d.id)&&!state.busy;
const boardNames={arduino:'Arduino UNO Q',get expansion(){return dt('舵机扩展板');}};
function chooseBoard(id:string|undefined){if(id!=='arduino'&&id!=='expansion')return;if(state.busy)return;deviceTools?.selectDevice('board');state.selectedBoard=id;state.mode='single';state.draft=null;render();}
function choose(id:number){if(state.busy)return;const d=state.devices.find(d=>d.id===id);if(!d)return;deviceTools?.selectDevice('servo');state.selectedBoard=null;state.selected=d.uid;state.mode='single';state.draft=null;render();}
export async function api(action:string,values:Record<string,unknown>={}){
 const r=await fetch('/api/duck-debug/action',{method:'POST',headers:{'Content-Type':'application/json'},body:jsonStringify({action,...values})});
 const data=await parseResponseJson(r);if(!isRecord(data))throw displayError("控制器返回格式异常");if(!r.ok)throw Object.assign(Error(typeof data.error==='string'?data.error:dt("操作未完成")),{details:data,code:data.code,params:data.params,messageCode:data.messageCode,messageParams:data.messageParams});return data;
}
async function run(action:string,values:Record<string,unknown>={},message:DebugNotice=dm("操作完成"),after?:(data:Record<string,unknown>)=>void){
 if(state.busy)return;
 state.busy=true;state.message=dm("正在执行并等待读回…");render();
 try{const data=await api(action,values);after?.(data);await poll(true);say(message);return data;}
 catch(error){await poll(true);say(debugFailure(error),true);return null;}
 finally{state.busy=false;state.draft=null;render();}
}
function slots(){
 const active=new Set(online(state).map(d=>d.id)),d=selected(state),progress=readNumberingReadiness();
 setLocalizedHTML($('board-slots'),(Object.entries(boardNames) as [keyof typeof boardNames,string][]).map(([id,name])=>{const live=state.boards[id].connected;return `<button class="board-slot ${live?'online':''} ${state.selectedBoard===id?'selected':''}" data-board-slot="${id}" aria-label="${escapeAttribute(dt('选择 {name}，{status}',{name,status:live?dt('已连接'):dt('未确认')}))}" aria-pressed="${state.selectedBoard===id}" ${state.busy?'disabled':''}><i class="dot ${live?'green':''}"></i><strong>${name}</strong><small>${live?dt("已连接"):dt("未确认")}</small></button>`;}).join(''));
 setLocalizedHTML($('slots'),([[dt("左腿"),IDS.slice(0,5)],[dt("右腿"),IDS.slice(5,10)],[dt("头颈与鸭嘴"),IDS.slice(10)]] as const).map(([title,ids])=>`<div><div class="slot-group-title"><span>${title}</span><span>${ids[0]}–${ids.at(-1)}</span></div><div class="slot-row">${ids.map(id=>`<button class="slot ${active.has(id)?'online':''} ${!state.selectedBoard&&d?.id===id?'selected':''} ${duplicate(state,id)?'conflict':''}" data-slot="${id}" data-online="${active.has(id)}" aria-label="${escapeAttribute(dt('选择 ID{id}，{role}，{status}',{id:String(id),role:role(id),status:active.has(id)?dt('在线'):dt('离线')}))}" aria-pressed="${!state.selectedBoard&&d?.id===id}" ${state.busy?'disabled':''}>${id}<i class="slot-dot"></i>${progress.verifiedIds.includes(id)?`<span class="slot-verified" aria-label="${escapeAttribute(dt("编号已验证"))}">✓</span>`:''}</button>`).join('')}</div></div>`).join(''));
 const extra=state.devices.filter(d=>!IDS.includes(d.id));$('extra-devices').hidden=!extra.length;
 setLocalizedHTML($('extra-devices'),extra.length?dt('其他在线')+' '+extra.map(d=>`<button data-slot="${d.id}">ID ${d.id} · ${d.online?dt("在线"):dt("最近扫描")}</button>`).join(''):'');
 $('slot-count').textContent=dt("{count} 个编号在线 / 15 个固定盘位",{count:active.size});
 $('numbering-progress').textContent=dt("编号已验证 {count}/15 · {status}",{count:progress.verifiedIds.length,status:progress.ready?dt('组装鸭已解锁'):dt('完成后解锁组装鸭')});
 $<HTMLButtonElement>('verify-online').disabled=state.busy||!online(state).length;
}
function panelBoard(){const id=required(state.selectedBoard),live=state.boards[id].connected;
 const upstream=id==='arduino'?(state.transport==='lan'?dt("Mac · 网络"):'Mac · USB'):'Arduino UNO Q';
 setLocalizedHTML($('panel'),`<div class="panel-heading"><h2 style="font-size:22px">${boardNames[id]}</h2><span class="live-badge ${live?'':'off'}"><i class="dot ${live?'green':''}"></i>${live?dt("已连接"):dt("未确认")}</span></div><p class="role">${id==='arduino'?dt("主控板"):dt("舵机总线与独立供电")}</p><dl class="board-detail"><div><dt>${dt("通信状态")}</dt><dd>${live?dt("已确认连通"):dt("尚未确认")}</dd></div><div><dt>${dt("连接上游")}</dt><dd>${upstream}</dd></div><div><dt>${dt("下游设备")}</dt><dd>${id==='arduino'?dt("舵机扩展板"):dt("{count} 只舵机在线",{count:online(state).length})}</dd></div><div><dt>${dt("实测供电电压")}</dt><dd>${dt("未读取")}</dd></div></dl><button class="primary" data-action="probe-board">${dt("重新检测连接")}</button><p class="board-note">${dt("连接状态与绿色模型同步。主控链路与舵机独立供电分开确认。")}</p><div class="panel-grow"></div><div class="panel-bottom">${dt("板卡外形为示意模型")}</div>`);
}
function field(key:string,label:string,value:unknown,disabled:boolean,extra=''){return `<label class="field ${key==='id'?'id-field':''}">${label}<input id="edit-${key}" aria-label="${escapeAttribute(label)}" aria-describedby="error-${key}" type="number" step="1" min="0" max="${key==='id'?253:255}" value="${value??''}" ${disabled?'disabled':''} ${extra}><span class="field-error" id="error-${key}"></span></label>`;}
function panelSingle(){
 const d=selected(state),live=d?.online,editable=canEdit(d),conflict=live&&duplicate(state,d.id),draft=state.draft??d;
 setLocalizedHTML($('panel'),`<div class="panel-heading"><h2>ID ${d.id}</h2><span class="live-badge ${live?'':'off'}"><i class="dot ${live?'green':''}"></i>${live?dt("在线"):dt("离线")}</span></div><p class="role">${role(d.id)}</p>
 ${conflict?`<div class="inline-alert">${dt("相同地址存在冲突。相同编号无法分别寻址，需要分开连接后改号。")}</div>`:!live?`<div class="inline-alert">${dt("当前未在线。保留编号位置，连接后再读取和修改。")}</div>`:''}
 <div class="readback"><div><span>${dt("当前位置 · 原始值")}</span><b id="current-position">${live?(d.readbackPending?dt("待读回"):d.pos??'—'):'—'}</b></div><div><span>${dt("输出状态")}</span><b class="torque">${live?(d.held?dt("保持当前位置"):dt("已卸载")):'—'}</b></div></div>
 <div class="section-label"><span>${dt("编号与参数")}</span><button data-action="read" ${!state.boards.arduino.connected||state.busy?'disabled':''}>${dt("重新读取 ↻")}</button></div>
 <div class="form-grid">${field('id',dt("舵机编号"),draft.id,!editable)}${field('kp',d.parametersLive?'KP':dt("KP · 上次读回"),live?draft.kp:'',!editable,`placeholder="${escapeAttribute(dt("未在线"))}"`)}${field('kd',d.parametersLive?'KD':dt("KD · 上次读回"),live?draft.kd:'',!editable,`placeholder="${escapeAttribute(dt("未在线"))}"`)}</div>
 <button id="write-parameters" class="primary write-button" data-action="write" ${!editable?'disabled':''}>${state.busy?dt("正在写入并读回…"):dt("写入编号与参数")}</button><p class="saved-note">${dt("改号与参数写入保留中位")}</p>
 <section class="micro"><div class="micro-title"><span>${dt("位置微调")}</span><button data-action="hold" ${!editable?'disabled':''}>${d.jogReady?dt("关闭微调"):dt("开启微调")}</button></div><div class="step-row"><span>${dt("步幅")}</span>${[1,5,10].map(n=>`<button data-step="${n}" aria-pressed="${step===n}" ${!editable?'disabled':''}>${n} · ${(n*360/4095).toFixed(2)}°</button>`).join('')}</div>
 <div class="jog-row"><button class="secondary" data-jog="-1" ${!editable||!d.jogReady?'disabled':''}>− ${dt('{step} 单位',{step})}</button><button class="secondary" data-jog="1" ${!editable||!d.jogReady?'disabled':''}>＋ ${dt('{step} 单位',{step})}</button></div>
 <div class="target-row"><input id="target-position" aria-label="${escapeAttribute(dt("目标位置"))}" type="number" min="0" max="4095" step="1" placeholder="${escapeAttribute(dt("目标位置 · 单次±10"))}" ${!editable||!d.jogReady?'disabled':''}><button data-action="move" class="secondary" ${!editable||!d.jogReady?'disabled':''}>${dt("移动")}</button></div><p class="micro-caption">${dt("单次最多10单位；动作约0.25秒后自动卸载。主、副舵盘属于同一只舵机。")}</p></section>
 <div class="panel-grow"></div><div class="panel-bottom">${dt("只操作所选编号 · 串联中的其他舵机保持原设置")}</div>`);
 if(!isRefreshingCopy())for(const key of ['id','kp','kd'])$<HTMLInputElement>('edit-'+key).addEventListener('input',validateForm);
}
function validateForm(){
 const values:Parameters={id:number($<HTMLInputElement>('edit-id')),kp:number($<HTMLInputElement>('edit-kp')),kd:number($<HTMLInputElement>('edit-kd'))},errors=parameterErrors(state,state.selected,values);
 for(const key of ['id','kp','kd']){$('error-'+key).textContent=errors[key]??'';$<HTMLInputElement>('edit-'+key).classList.toggle('invalid',!!errors[key]);}
 $<HTMLButtonElement>('write-parameters').disabled=state.busy||Object.keys(errors).length>0;return {values,errors};
}
function openBatch(mode:'swap'|'custom'){if(state.busy)return;state.selectedBoard=null;state.mode=mode;state.draft=null;state.batch=mode==='swap'?legPlan(state):online(state).map(d=>({uid:d.uid,from:d.id,to:d.id}));render();}
function panelBatch(){
 const error=mappingError(state,state.batch),changes=state.batch.filter(p=>p.to!==p.from).length;
 setLocalizedHTML($('panel'),`<button class="back-link" data-action="back" ${state.busy?'disabled':''}>${dt("← 返回所选舵机")}</button><h2>${state.mode==='swap'?dt("左右腿互换"):dt("自定义改号")}</h2><p class="batch-intro">${dt('只修改当前在线的 {count} 只。中位和 KP/KD 保持不变。',{count:state.batch.length})}</p>
 ${state.batch.length?`<table class="batch-table"><thead><tr><th>${dt("当前编号")}</th><th></th><th>${dt("目标编号")}</th><th>${dt("状态")}</th></tr></thead><tbody>${state.batch.map((p,i)=>`<tr><td><b>ID ${p.from}</b><span class="role-tiny">${role(p.from)}</span></td><td class="arrow">→</td><td>${state.mode==='custom'?`<input type="number" min="0" max="253" step="1" data-batch-index="${i}" aria-label="${escapeAttribute(dt('ID{id} 的目标编号',{id:String(p.from)}))}" value="${p.to}" ${state.busy?'disabled':''}>`:`<span class="new-id">ID ${p.to}</span>`}</td><td class="check">${state.busy?dt("处理中"):dt("在线")}</td></tr>`).join('')}</tbody></table>`:`<div class="empty-batch">${dt("当前没有可交换的在线腿部舵机")}</div>`}
 <div class="batch-footer"><div class="error-note" id="batch-error">${error}</div><p>${dt("卡槽和模型会随新编号更新，读回后显示结果。")}</p></div><div class="panel-grow"></div><button class="primary" data-action="apply-batch" id="apply-batch" ${error||!changes||state.busy?'disabled':''}>${state.busy?dt("正在修改并读回…"):dt("应用这 {count} 项修改",{count:changes})}</button><button class="secondary" data-action="back" ${state.busy?'disabled':''}>${dt("返回")}</button>`);
 if(!isRefreshingCopy())for(const el of document.querySelectorAll<HTMLInputElement>('[data-batch-index]'))el.addEventListener('input',()=>{
  required(state.batch[Number(el.dataset.batchIndex)]).to=number(el);const error=mappingError(state,state.batch),changes=state.batch.filter(p=>p.from!==p.to).length;
  $('batch-error').textContent=error;$<HTMLButtonElement>('apply-batch').disabled=!!error||!changes;$<HTMLButtonElement>('apply-batch').textContent=dt("应用这 {count} 项修改",{count:changes});
 });
}
function render(){
 const n=online(state).length;$('online-count').textContent=dt("{count} 只在线",{count:n});
 setLocalizedHTML($('board-state'),`<i class="dot ${state.boards.arduino.connected?'green':''}"></i>UNO Q · ${state.boards.arduino.connected?dt("USB已连接"):dt("未确认")}`);
 for(const el of document.querySelectorAll<HTMLElement>('[data-view]'))el.setAttribute('aria-pressed',String(el.dataset.view===state.view));
 $('stage-caption').textContent=state.view==='robot'?dt("按编号对应安装位"):state.view==='tray'?dt("十五只舵机 · 固定编号位置"):dt("逻辑连接示意 · 不是实物串联顺序");
 $('stage-help').textContent=state.view==='circuit'?dt("USB → UNO Q → 扩展板 → 舵机总线 · 供电另接电池"):dt("拖动旋转 · 滚轮缩放 · 点舵机查看参数");
 $<HTMLButtonElement>('release-all').disabled=!state.boards.arduino.connected;$<HTMLButtonElement>('batch-swap').disabled=state.busy||!n;$<HTMLButtonElement>('batch-custom').disabled=state.busy||!n;
 slots();if(!deviceTools?.renderPanel()){state.selectedBoard?panelBoard():state.mode==='single'?panelSingle():panelBatch();}
 if(isRefreshingCopy())scene?.refreshCopy();else scene?.update(state);deviceTools?.afterRender();say(state.message,isRefreshingCopy()&&$('feedback').classList.contains('error'));
}
async function poll(force=false){
 if(polling||document.hidden&&!force)return;polling=true;
 try{
  const response=await fetch('/api/duck-debug/status');if(!response.ok)throw displayError("控制器状态读取失败");const data=readDebugSnapshot(await parseResponseJson(response));
  const next=jsonStringify([data.onlineIds,data.boards,data.status.mode,data.scan,(isRecord(data.numbering)?data.numbering.verifiedIds:undefined),data.devices.map(d=>[d.id,d.held,d.parametersLive,d.readbackPending])]);
  mergeStatus(state,data);updateNumberingReadiness(data.numbering);deviceTools?.ingest(data);
  if(data.error)say(debugFailure({code:data.errorCode,params:data.errorParams,message:data.error}),true);else if(String(state.message)===t('debug.status.reading'))say(dm("实时状态已读取"));
  if(next!==signature&&!document.activeElement?.closest<HTMLElement>('input,select,textarea')){signature=next;render();}
  else{slots();scene?.update(state);deviceTools?.updateLive();}
  const d=selected(state);if(document.getElementById('current-position'))$('current-position').textContent=d?.online?(d.readbackPending?dt("待读回"):String(d.pos??'—')):'—';
 }catch(error){for(const d of state.devices)d.online=false;state.boards={arduino:{connected:false},expansion:{connected:false}};render();say(debugFailure(error),true);}
 finally{polling=false;}
}
async function write(){
 const {values,errors}=validateForm();if(Object.keys(errors).length)return;const d=selected(state);state.draft=values;
 deviceTools.stopControl();await run('parameters',{id:d.id,new_id:values.id,kp:values.kp,kd:values.kd},dm('已读回 ID{id} · KP {kp} · KD {kd} · 中位未改',{id:String(values.id),kp:String(values.kp),kd:String(values.kd)}),()=>{state.selected='servo-'+values.id;});
}
async function batch(){
 const error=mappingError(state,state.batch);if(error){say(mappingNotice(state,state.batch),true);return;}
 const plan=state.batch.map(p=>({fromId:p.from,toId:p.to})),old=selected(state)?.id;
 deviceTools.stopControl();await run('remap',{plan},dm("编号修改已读回，KP/KD和中位未改"),()=>{state.selected='servo-'+(plan.find(p=>p.fromId===old)?.toId??old);state.mode='single';});
}
async function jog(delta:number){
 const d=selected(state);if(!canEdit(d)||!d.jogReady)return;
 if(!Number.isInteger(delta)||!delta||Math.abs(delta)>10){say(dm("单次请输入±1至±10单位；目标不变时无需移动"),true);return;}
 deviceTools.stopControl();await run('jog',{id:d.id,delta},dm('ID{id} 微动结束，已自动卸载；KP/KD和中位未改',{id:String(d.id)}));
}
document.body.addEventListener('click',e=>{
 const board=eventElement(e).closest<HTMLElement>('[data-board-slot]');if(board){chooseBoard(board.dataset.boardSlot);return;}
 const slot=eventElement(e).closest<HTMLElement>('[data-slot]');if(slot){choose(Number(slot.dataset.slot));return;}
 const view=eventElement(e).closest<HTMLElement>('[data-view]');if(view){state.view=readView(view.dataset.view);render();return;}
 const stride=eventElement(e).closest<HTMLElement>('[data-step]');if(stride){step=Number(stride.dataset.step);render();return;}
 const button=eventElement(e).closest<HTMLElement>('[data-jog]');if(button){jog(Number(button.dataset.jog)*step);return;}
 const action=eventElement(e).closest<HTMLElement>('[data-action]')?.dataset.action,d=selected(state);
 if(action==='write')write();if(action==='apply-batch')batch();if(action==='back'){state.mode='single';render();}
 if(action==='read'){deviceTools.stopControl();run('read',{id:d.id},dm('已读回 ID{id}',{id:String(d.id)}));}
 if(action==='probe-board')poll(true);
 if(action==='hold'&&canEdit(d)){if(d.jogReady){d.jogReady=false;render();return;}deviceTools.stopControl();run('read',{id:d.id},dm("微调已开启；每次动作后自动卸载"),()=>{const current=state.devices.find(item=>item.id===d.id);if(current)current.jogReady=true;});}
 if(action==='move'&&canEdit(d)&&d.jogReady){const target=number($<HTMLInputElement>('target-position'));if(!Number.isInteger(target)||target<0||target>4095){say(dm("目标位置请输入0–4095的整数"),true);return;}deviceTools.stopControl();run('move',{id:d.id,target},dm("目标微调已结束，已自动卸载；请核对实际读回位置"));}
});
$<HTMLButtonElement>('batch-swap').onclick=()=>openBatch('swap');$<HTMLButtonElement>('batch-custom').onclick=()=>openBatch('custom');
$<HTMLButtonElement>('verify-online').onclick=()=>{deviceTools.stopControl();run('verify',{},dm("在线编号已读回复核，累计进度已保存"));};
$<HTMLButtonElement>('release-all').onclick=()=>{deviceTools.emergency();};
$('reset-camera').onclick=()=>scene?.fit();query<HTMLAnchorElement>('.brand').href='/';
bindTranslations();
deviceTools=createDeviceTools({getState:()=>state,render,say,canEdit,api,poll,run});render();
scene=createScene({host:$('viewport'),labelsHost:$('labels'),onSelect:choose,onBoardSelect:chooseBoard});scene.update(state);
scene.ready.then(()=>{$('loading').hidden=true;document.body.dataset.modelReady='true';render();}).catch(error=>{$('loading').textContent=dt("模型未加载，请检查组装素材");document.body.dataset.modelReady='failed';console.error(error);});
const inspectTimer=setInterval(()=>{const d=selected(state);if(!document.hidden&&!state.busy&&!state.scan?.active&&deviceTools.canInspect()&&d?.parametersLive&&!IDS.includes(d.id))api('inspect',{id:d.id}).catch(()=>{});},750);
poll();const pollTimer=setInterval(poll,250);window.addEventListener('pagehide',()=>{clearInterval(pollTimer);clearInterval(inspectTimer);},{once:true});

onLocale(()=>{bindTranslations();if(document.body.dataset.modelReady==='failed')$('loading').textContent=dt('模型未加载，请检查组装素材');refreshDisplayCopy(render);if(document.getElementById('edit-id')&&document.getElementById('write-parameters'))validateForm();});
