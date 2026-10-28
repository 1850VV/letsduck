import {CalibrationDevice,type RawDelta} from './calibration-device.js';
import type {DebugAction} from './types.js';
import {required,errorMessage} from '../lib/browser.js';
import {IDS,role} from './state.js';
interface Options {api:DebugAction;selectedId():number;say(message:string,error?:boolean):void}
type Group='single'|'both'|'left'|'right'|'head';
/** Small relative encoder deltas. These are directions to observe, not zero targets. */
function deltas(group:Group,id:number,sign:number,size:number):RawDelta[]{
 if(group==='single')return [{id,delta:sign*size}];
 const pattern:Record<number,number>=group==='head'?{30:1,31:1}:group==='left'?{12:1,13:1,14:1}:group==='right'?{22:-1,23:-1,24:-1}:{12:1,13:1,14:1,22:-1,23:-1,24:-1};
 return Object.entries(pattern).map(([key,direction])=>({id:Number(key),delta:direction*sign*size}));
}
export function createCalibrationPanel({api,selectedId,say}:Options){
 const root=document.createElement('div');root.className='seated-guide';root.innerHTML=`
  <div class="panel-heading"><h2>坐姿找零</h2><span class="control-mode" id="guide-state">未保持</span></div>
  <p class="control-note" id="guide-capability">正在检查运行端能力…</p>
  <button class="primary" id="guide-capture">读取坐姿并保持</button>
  <div class="guide-progress"><span id="guide-seat-state">① 坐姿未保存</span><span id="guide-record-count">② 候选 0 / 14</span></div>
  <div class="control-divider">小步推进 · 随时暂停</div>
  <label class="field">联动范围<select id="guide-scope" aria-label="联动范围"><option value="single">所选关节</option><option value="both">双腿俯仰联动</option><option value="left">左腿俯仰联动</option><option value="right">右腿俯仰联动</option><option value="head">头颈俯仰联动</option></select></label>
  <div class="guide-selected"><b id="guide-selected-name"></b><span>当前读回 <strong id="guide-current">—</strong></span></div>
  <label class="field">每小步<select id="guide-step-size" aria-label="每小步"><option value="1">1 原始单位 · 约 0.09°</option><option value="5" selected>5 原始单位 · 约 0.44°</option></select></label>
  <div class="action-pair"><button class="secondary" id="guide-minus">− 一个小步</button><button class="secondary" id="guide-plus">＋ 一个小步</button></div>
  <p class="control-note">先试一个小步，观察方向，再继续一段。双腿左右方向相反；联动方向需看实物核对。</p><p class="control-note">原始值由 DQS1 角度反馈反算，并非单舵机寄存器读回，也不是机械角度。</p>
  <button class="primary" id="guide-continue" disabled>沿刚才方向继续 · 最多 10 小步</button>
  <div class="guide-running"><span id="guide-segment">等待观察</span><button class="secondary" id="guide-pause">暂停并保持</button></div>
  <div class="action-pair"><button class="secondary" id="guide-checkpoint">保存停点</button><button class="secondary" id="guide-return-stop">回到上次停点</button></div>
  <button class="text-button" id="guide-return-seat">缓慢回到坐姿</button>
  <div class="control-divider">观察对齐后记录</div>
  <button class="primary" id="guide-record">记录所选关节的候选零位</button><p class="control-note" id="guide-candidate-note">记录的是新鲜读回位置，还没有写入中位。</p>
  <details class="guide-records"><summary>基线与候选记录</summary><div class="guide-record-actions"><button id="guide-export">下载本次记录</button><button id="guide-import">查看已有记录</button></div><input id="guide-import-file" type="file" accept=".json" hidden><div id="guide-record-table"></div><p id="guide-import-note" class="control-note"></p><div id="guide-import-table"></div><button id="guide-export-view" hidden>下载正在查看的记录</button></details>
  <div class="guide-following"><b>之后：写中位 → 默认姿态 → 行走</b><p>当前运行端的写中位入口会先卸载全身。本流程先保存候选，保持中不调用它。</p></div>
  <button class="secondary" id="guide-unload">结束向导 · 全部卸载</button><p class="control-note" id="guide-status-note" role="status"></p>`;
 const $=<T extends HTMLElement=HTMLElement>(id:string)=>required(root.querySelector<T>('#'+id));
 let visible=false,last:RawDelta[]|null=null,selected=-1,scope:Group='single';
 const device=new CalibrationDevice(api,{onChange:()=>update()});
 function button(id:string,disabled:boolean){$<HTMLButtonElement>(id).disabled=disabled;}
 function update(){
  const s=device.state,id=selectedId(),active=!!s.sessionId,stationary=active&&!s.busy&&!s.autoRunning&&['holding','paused'].includes(s.status);
  const statusNames:Record<string,string>={idle:'未保持',holding:'保持中',moving:'缓慢推进',paused:'暂停保持',released:'已卸载',disconnected:'已断连',error:'已停止'};
  $('guide-state').textContent=statusNames[s.status]??s.status;$('guide-selected-name').textContent=`${role(id)} · ID ${id}`;
  $('guide-current').textContent=s.current&&Date.now()-s.current.capturedAt<150?String(s.current.raw[id]??'—'):'—';
  $('guide-seat-state').textContent=s.baseline?'① 坐姿已保存':'① 坐姿未保存';$('guide-record-count').textContent=`② 候选 ${Object.keys(s.candidates).length} / 14`;
  $('guide-capability').textContent=s.feedback?.supported?'运行端支持当前位置保持与受限移动。':'运行端尚未确认支持坐姿保持；连接板子后重新读取。';
  $('guide-segment').textContent=s.autoRunning?`本段 ${s.autoSteps} / 10 小步`:'等待观察';
  $('guide-candidate-note').textContent=s.candidates[id]?`已记录 ID ${id} 的候选 ${s.candidates[id].raw}；未写入中位。`:'记录的是新鲜读回位置，还没有写入中位。';
  $('guide-status-note').textContent=s.error||(s.returnReached===false?`本段返回已停止；距返回点最多还差 ${s.returnRemainingRaw??'—'} 原始单位，观察后可再次返回。`:s.returnReached===true?'已收到返回点的到位反馈。':'');
  button('guide-capture',s.busy||active);for(const key of ['guide-minus','guide-plus','guide-checkpoint','guide-record'])button(key,!stationary||(key!=='guide-checkpoint'&&id===34));
  button('guide-pause',!active);button('guide-unload',!active);button('guide-continue',!stationary||!last);button('guide-return-seat',!stationary||!s.baseline);button('guide-return-stop',!stationary||!s.checkpoints.length);
  $<HTMLSelectElement>('guide-scope').disabled=s.busy||s.autoRunning;$<HTMLSelectElement>('guide-step-size').disabled=s.busy||s.autoRunning;
  button('guide-export',!s.baseline);button('guide-import',active);
  const table=$('guide-record-table');table.replaceChildren();const grid=document.createElement('table');grid.innerHTML='<thead><tr><th>编号</th><th>坐姿</th><th>候选</th></tr></thead>';
  const body=document.createElement('tbody');for(const key of IDS){const row=document.createElement('tr');for(const value of [key,s.baseline?.raw[key]??'—',s.candidates[key]?.raw??'—']){const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);}body.append(row);}grid.append(body);table.append(grid);
  const archive=s.readonlyArchive;$('guide-import-table').replaceChildren();$('guide-export-view').hidden=!archive;
  if(archive){$('guide-import-note').textContent=`只读记录 · ${archive.source==='synthetic'?'模拟数据':archive.deviceIdentity?.board??'设备未标识'} · ${Object.keys(archive.candidates).length} 个候选，不恢复设备动作。`;const old=document.createElement('table');old.innerHTML='<thead><tr><th>编号</th><th>旧坐姿</th><th>旧候选</th></tr></thead>';const oldBody=document.createElement('tbody');for(const key of IDS){const row=document.createElement('tr');for(const value of [key,archive.baseline?.raw[key]??'—',archive.candidates[key]?.raw??'—']){const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);}oldBody.append(row);}old.append(oldBody);$('guide-import-table').append(old);}
 }
 async function perform(fn:()=>unknown|Promise<unknown>,message?:string){try{const result=await fn();if(result===false)throw Error(device.state.error||'操作未执行或已取消，请查看当前状态');if(message)say(message);}catch(error){say(errorMessage(error),true);}finally{update();}}
 $('guide-capture').onclick=()=>perform(()=>{last=null;return device.hold();},'已读取并保持当前坐姿；还没有设定中位。');
 const move=(sign:number)=>perform(async()=>{const next=deltas(scope,selectedId(),sign,Number($<HTMLSelectElement>('guide-step-size').value));last=null;const ok=await device.step(next);if(ok)last=next;return ok;},'小步已结束，先观察方向和姿态。');
 $('guide-minus').onclick=()=>move(-1);$('guide-plus').onclick=()=>move(1);$('guide-continue').onclick=()=>perform(()=>last?device.startAuto(last,10):false,'本段已结束并保持；观察后再继续。');
 $('guide-pause').onclick=()=>perform(()=>device.pause(),'已暂停在当前读回位置并保持。');$('guide-checkpoint').onclick=()=>perform(async()=>await device.refresh()&&device.saveCheckpoint(),'已保存当前停点。');
 $('guide-return-stop').onclick=()=>perform(()=>device.returnLastCheckpoint(),'本段返回结束；距离较远时需要观察后再次返回。');$('guide-return-seat').onclick=()=>perform(()=>device.returnBaseline(),'本段返回结束；距离较远时需要观察后再次返回。');
 $('guide-record').onclick=()=>perform(async()=>await device.refresh()&&device.recordCandidate(selectedId()),'已记录所选候选；没有写入设备中位。');
 $('guide-unload').onclick=()=>perform(()=>{last=null;return device.release();},'向导已结束，已收到卸载反馈。');
 $<HTMLSelectElement>('guide-scope').onchange=()=>perform(()=>{last=null;scope=$<HTMLSelectElement>('guide-scope').value as Group;return device.selectGroup(scope);});
 $('guide-export').onclick=()=>perform(()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(device.serialize(),null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='duck-seated-calibration.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);});
 $('guide-export-view').onclick=()=>perform(()=>{if(!device.state.readonlyArchive)return false;const url=URL.createObjectURL(new Blob([JSON.stringify(device.state.readonlyArchive,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='duck-seated-calibration-archive.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);return true;});
 $('guide-import').onclick=()=>$<HTMLInputElement>('guide-import-file').click();$<HTMLInputElement>('guide-import-file').onchange=()=>perform(async()=>{const input=$<HTMLInputElement>('guide-import-file'),file=input.files?.[0];if(!file)return;try{const archive=device.loadReadonly(JSON.parse(await file.text()));if(!archive)throw Error('记录格式不匹配');$('guide-import-note').textContent='记录已载入查看；不会恢复控制会话或向设备发送动作。';}finally{input.value='';}});
 root.addEventListener('input',e=>e.stopPropagation());root.addEventListener('change',e=>e.stopPropagation());
 function mount(host:HTMLElement){visible=true;if(root.parentElement!==host)host.replaceChildren(root);if(selected!==selectedId()){selected=selectedId();last=null;if(device.state.sessionId)void perform(()=>device.pause());}update();}
 function leave(){visible=false;last=null;return device.release();}
 window.addEventListener('blur',()=>{if(visible&&device.state.sessionId)void perform(()=>device.pause());});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&device.state.sessionId)void device.pageHidden();});
 window.addEventListener('pagehide',()=>{const session=device.state.sessionId;if(session)navigator.sendBeacon('/api/duck-debug/action',new Blob([JSON.stringify({action:'guide-release',session_id:session})],{type:'application/json'}));void device.close();});
 return {mount,leave,release:()=>device.release(),active:()=>!!device.state.sessionId,refresh:()=>perform(()=>device.refresh()),update};
}
