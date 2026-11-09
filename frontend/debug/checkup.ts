import {dt} from './i18n.js';
import type {DebugAction} from './types.js';
import {eventElement,isRecord} from '../lib/browser.js';
import type {Trip,CheckRow,Problem,CheckStage} from '../../packages/devices/src/duck-checkup.js';
// 体检: one row per power-on of the duck, graded by the host from what the recorder saw (duck-checkup.ts).
// The page only words the verdict and the physical action; the numbers behind it stay in the recordings for AI.
interface Options {api:DebugAction;render():void}
const STAGES:Record<CheckStage,string>={power:'电源和线路',servo:'舵机单测',zero:'零点',imu:'IMU',stand:'站立',structure:'结构松紧',walk:'走路'};
const IMU_HOW:Record<string,string>={saturated:'加速度卡在量程上限',frozen:'陀螺仪读数不变','not-ok':'板子报告 IMU 出错'};
const PROBLEM:Record<string,string>={
 missing:'ID {ids} 没在线','volt-drop':'走路时电压掉了 {drop} V（正常 ≤0.8 V）','low-servo':'ID {id} 的电压比别的低 {dev} V',
 'gyro-bias':'静止时零漂 {bias}°/s（正常 ≤{line}）','stand-err':'ID {id} 站着差 {err}°（正常 ≤{line}°）','stand-lr':'左右腿差 {diff}°（正常 ≤1.5°）','stand-tilt':'站着歪 {tilt}°（正常 ≤5°）',
 sway:'走路左右晃 ±{sway}°（正常 ≤{line}°）','walk-err':'关节误差 {err}°（正常 ≤{line}°）','knee-swing':'补救幅度 {swing}°（正常 ≤{line}°）','slow-board':'板子每秒只算 {hz} 次（正常 ≥40）',falls:'摔了 {falls} 次',
};
const HEAD:Record<string,[string,string]>={
 missing:['ID {ids} 没在线，后面的检查都不可信','查这个舵机的插头和线，再看编号对不对'],
 'volt-drop':['走路时电压掉得太多','充电或换电池，查 2P 电源插座'],
 'low-servo':['ID {id} 供电偏低','查这一路的供电线和接头'],
 'imu-stuck':['IMU 读数卡死，后面的检查都不可信','断电等 5 秒再开机'],
 'gyro-bias':['IMU 静止时漂得多','放平不动，重新标定 IMU'],
 'stand-err':['ID {id} 站着吃力','查这条腿有没有蹭着、螺丝是不是太紧'],
 'stand-lr':['左右腿受力不一样','吃力的那一侧查装配'],
 'stand-tilt':['站着身体是歪的','先做零点校准，再看两条腿装得一不一样长'],
 sway:['走起来身体晃得太厉害：±{sway}°，正常不超过 {line}°','拧紧胸部、腿部 3D 件和舵机盘的螺丝，再走一次'],
 'walk-err':['走路时关节跟不上','去舵机质检把腿部舵机测一遍'],
 'knee-swing':['走路模型一直在大幅补救','先查结构松紧和零点，再走一次'],
 'slow-board':['板子算不过来','让板子凉一会儿，关掉别的程序'],
 falls:['摔了 {falls} 次，但各项指标都正常','数据已存，复制给 AI 分析'],
};
const DOT:Record<string,string>={good:'good',warn:'weak',bad:'bad'};
const two=(n:number)=>String(n).padStart(2,'0');
const when=(ms:number)=>{const d=new Date(ms);return `${two(d.getMonth()+1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`;};
const params=(values:Record<string,number|string>)=>Object.fromEntries(Object.entries(values).map(([k,v])=>[k,String(v)]));
function problem(p:Problem){return p.id==='imu-stuck'?dt(IMU_HOW[String(p.values.how)]??'IMU 出错'):dt(PROBLEM[p.id]??p.id,params(p.values));}
function okText(r:CheckRow){const v=params(r.values);switch(r.stage){
 case 'power':return dt(v.volt?(v.walking?'{online} 个舵机都在线 · 走路时 {volt} V':'{online} 个舵机都在线 · {volt} V'):'{online} 个舵机都在线',v);
 case 'imu':return v.bias?dt('读数正常 · 零漂 {bias}°/s',v):dt('读数正常');
 case 'stand':return dt('各关节误差都在 {err}° 以内',v);
 case 'structure':return dt('走路左右晃 ±{sway}°',v);
 default:return v.swing?dt('关节误差 {err}° · 补救幅度 {swing}°',v):v.err?dt('关节误差 {err}°',v):dt('没摔');
}}
function rowText(r:CheckRow){
 if(r.grade==='manual')return `${dt('要动手')} · <button class="text-button checkup-go" data-workbench="${r.stage==='servo'?'check':'calibrate'}">${r.stage==='servo'?dt('去舵机质检'):dt('去零点校准')}</button>`;
 if(r.grade==='blocked')return dt('先处理上面的问题');
 if(r.grade==='skip')return r.values.roller?dt('滑轮模式暂不判断'):r.stage==='stand'?dt('这次没站稳过'):r.stage==='structure'||r.stage==='walk'?dt('这次没走路'):dt('没有数据');
 return r.problems.length?r.problems.map(problem).join(' · '):okText(r);
}
export function createCheckup({api,render}:Options){
 let trips:Trip[]=[],selected=0,loaded=false,copied=-1,timer:ReturnType<typeof setInterval>|undefined;
 async function load(){try{const data=await api('history');trips=Array.isArray(data.trips)?data.trips.filter(isRecord) as unknown as Trip[]:[];}catch{/* Keep what is shown. */}loaded=true;if(selected>=trips.length)selected=0;render();}
 const started=(t:Trip)=>t.boot??t.start;
 function tripLine(t:Trip,i:number){
  const minutes=Math.max(1,Math.round((t.end-started(t))/60000)),falls=t.data.falls.length,walk=Math.round(t.data.walkS),grade=t.checkup.first?.grade??'good',live=Date.now()-t.end<15000;
  const walked=walk>=1?(falls?dt('走路 {s} 秒 · 摔 {n} 次',{s:String(walk),n:String(falls)}):dt('走路 {s} 秒 · 没摔',{s:String(walk)})):dt('没走路');
  return `<button class="checkup-trip" data-trip="${i}" aria-pressed="${i===selected}"><b>${when(started(t))}</b><span>${live?dt('进行中'):dt('开机 {m} 分',{m:String(minutes)})} · ${walked}</span><i class="check-dot ${DOT[grade]}"></i></button>`;
 }
 function compare(t:Trip,i:number){
  // The nearest earlier trip that walked and came out the other way: that is what changed.
  const bad=(x:Trip)=>x.checkup.rows.some(r=>(r.stage==='structure'||r.stage==='walk')&&r.grade==='bad');
  const other=trips.slice(i+1).find(x=>x.data.sway!==null&&bad(x)!==bad(t));
  if(!other||t.data.sway===null)return dt('原始数据已保存');
  return dt('和 {when} 比：左右晃 ±{a}° → ±{b}°，关节误差 {c}° → {d}°',{when:when(started(other)),a:String(other.data.sway),b:String(t.data.sway),c:String(other.data.walkErr??'—'),d:String(t.data.walkErr??'—')});
 }
 function renderPanel(){
  if(!loaded)return `<div class="panel-heading"><h2>${dt('体检')}</h2></div><p class="control-note">${dt('正在读取…')}</p>`;
  if(!trips.length)return `<div class="panel-heading"><h2>${dt('体检')}</h2></div><p class="control-note">${dt('连上鸭子后，每次开机都会自动记一次，走几步就能看到结果。')}</p>`;
  const t=trips[selected]!,first=t.checkup.first,head=first?HEAD[first.id]:null;
  const top=first&&head?`<div class="checkup-top ${first.grade}"><b>${dt(head[0],params(first.values))}</b><span>${dt('先做：')}${dt(head[1])}</span></div>`:`<div class="checkup-top good"><b>${dt('这次没发现问题')}</b></div>`;
  const rows=t.checkup.rows.map((r,i)=>`<div class="checkup-row"><i class="check-dot ${DOT[r.grade]??'none'}"></i><span>${i} · ${dt(STAGES[r.stage])}</span><em class="${DOT[r.grade]?'':'muted'}">${rowText(r)}</em></div>`).join('');
  return `<div class="panel-heading"><h2>${dt('体检')}</h2></div><div class="checkup-trips">${trips.slice(0,8).map(tripLine).join('')}</div>${top}<div class="checkup-rows">${rows}</div>
  <div class="checkup-foot"><span>${compare(t,selected)}</span><button class="text-button" data-checkup-copy>${copied===selected?dt('已复制'):dt('复制给 AI 分析')}</button></div>`;
 }
 document.body.addEventListener('click',e=>{const el=eventElement(e);if(!el.closest('#panel'))return;
  const trip=el.closest<HTMLElement>('[data-trip]');if(trip){selected=Number(trip.dataset.trip);copied=-1;render();return;}
  if(el.closest('[data-checkup-copy]')){const t=trips[selected];if(!t)return;
   const text=dt('看一下调试鸭 {when} 这次出行（录像 {files}）',{when:when(started(t)),files:t.files.join('、')});
   void navigator.clipboard?.writeText(text).then(()=>{copied=selected;render();}).catch(()=>{});}
 });
 return {renderPanel,enter(){loaded=false;copied=-1;void load();timer=setInterval(()=>{if(!document.hidden)void load();},5000);},leave(){clearInterval(timer);timer=undefined;}};
}
