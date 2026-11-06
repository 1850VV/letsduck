import {dt,dm,debugFailure} from './i18n.js';
import type {DebugState,DebugAction,DebugNotice,Grade} from './types.js';
import {eventElement} from '../lib/browser.js';
import {role,IDS,selected} from './state.js';
// Air test: the duck stands, the person holds it up, and the board swings one servo at a time ±8°.
// Grades follow a sound HD1910M on this duck: about 0.27 s to cover 90% of the swing, stopping within 0.8°.
interface Options {getState():DebugState;api:DebugAction;poll(force?:boolean):Promise<void>;say(message:DebugNotice,error?:boolean):void;render():void;focus(id:number):void}
interface Result {rise:number;err:number;grade:Grade}
// Results stay on this computer, so the person can power off, loosen a joint and come back to the same list.
const STORE_KEY='letsduck.debug.servoCheck';
const gradeOf=(rise:number,err:number):Grade=>err>=2||rise>=.45?'bad':err>=1||rise>=.33?'weak':'good';
const ORDER:Record<Grade,number>={bad:0,weak:1,good:2};
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export function createServoCheck({getState,api,poll,say,render,focus}:Options){
 const results=new Map<number,Result>();
 try{const saved:unknown=JSON.parse(localStorage.getItem(STORE_KEY)??'[]');if(Array.isArray(saved))for(const [id,r] of saved)if(IDS.includes(id)&&Number.isFinite(r?.rise)&&Number.isFinite(r?.err))results.set(id,{rise:r.rise,err:r.err,grade:gradeOf(r.rise,r.err)});}catch{/* Without storage the list lasts until the page closes. */}
 function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify([...results]));}catch{/* Kept in memory only. */}}
 let running:number|null=null,queue:number[]=[],done=0,stopping=false,shown=false,filter:Grade|'all'='all';
 function sync(){getState().grades=shown?Object.fromEntries([...results].map(([id,r])=>[id,r.grade])):undefined;}
 async function check(ids:number[]){
  if(running!==null)return;queue=ids;done=0;stopping=false;running=ids[0]!;render();
  try{
   // Default pose ramps the legs at 30°/s, so give it time to stand before the first swing.
   if(getState().status.mode!=='hold'){await api('mode',{mode:'hold'});await sleep(3000);}
   for(const id of ids){
    if(stopping)break;running=id;render();
    const r=await api('servo-check',{id}),rise=Number(r.rise),err=Number(r.err);
    results.set(id,{rise,err,grade:gradeOf(rise,err)});save();done++;sync();render();
   }
   say(stopping?dm('质检已停止'):dm('质检完成'));
  }catch(error){say(debugFailure(error),true);}
  finally{running=null;stopping=false;render();await poll(true);}
 }
 function row(id:number){const r=results.get(id)!;
  return `<div class="check-row"><i class="check-dot ${r.grade}"></i><button class="check-id" data-check-focus="${id}"><b>ID ${id}</b><span>${role(id)}</span></button><em>${dt('{rise} 秒 · 差 {err}°',{rise:r.rise.toFixed(2),err:r.err.toFixed(1)})}</em><button class="secondary" data-check-one="${id}" ${running!==null?'disabled':''}>${dt('复测')}</button></div>`;}
 function renderPanel(){
  const ids=[...results.keys()],count=(g:Grade)=>ids.filter(id=>results.get(id)!.grade===g).length,flagged=count('bad')+count('weak'),one=selected(getState()).id,busy=running!==null;
  const shownIds=ids.filter(id=>filter==='all'||results.get(id)!.grade===filter).sort((a,b)=>ORDER[results.get(a)!.grade]-ORDER[results.get(b)!.grade]||a-b);
  const filters=ids.length?`<div class="check-filters">${(['all','bad','weak','good'] as const).map(g=>`<button data-check-filter="${g}" aria-pressed="${filter===g}">${g==='all'?'':`<i class="check-dot ${g}"></i>`}${g==='all'?dt('全部'):g==='bad'?dt('红'):g==='weak'?dt('黄'):dt('绿')} ${g==='all'?ids.length:count(g)}</button>`).join('')}</div>`:'';
  return `<div class="panel-heading"><h2>${dt('舵机质检')}</h2><span class="control-mode">${running!==null?`${done} / ${queue.length}`:ids.length?dt('已测 {count}',{count:ids.length}):dt('未测')}</span></div>
  <p class="control-note">${dt('把鸭子悬空拿稳。每个舵机来回摆 ±8°，看多快到位、停得准不准。全部约 1 分钟。结果会保留，断电重开也在。')}</p>
  <button class="primary" data-check-run ${stopping?'disabled':''}>${running!==null?(stopping?dt('正在停止…'):dt('停止')):ids.length?dt('重新整机质检'):dt('整机质检')}</button>
  <div class="action-pair check-more"><button data-check-flagged ${busy||!flagged?'disabled':''}>${dt('只测红黄 · {count}',{count:flagged})}</button><button data-check-one="${one}" ${busy||!IDS.includes(one)?'disabled':''}>${dt('单独测 ID {id}',{id:String(one)})}</button></div>
  ${running!==null?`<div class="check-progress">${dt('正在测 ID {id} · {role}',{id:String(running),role:role(running)})}<progress max="${queue.length}" value="${done}"></progress></div>`:''}
  ${filters}<div class="check-rows">${shownIds.map(row).join('')}</div>
  <p class="control-note">${dt('绿：到位快、误差小于 1°　黄：偏弱　红：误差 ≥ 2° 或到位 ≥ 0.45 秒。偏弱的先查装配：螺丝过紧、轴承别劲、零件蹭着。')}</p>`;
 }
 /** Slot class for the servo map: the grade, dimmed when a filter hides it. */
 const slotClass=(id:number)=>{const r=shown?results.get(id):undefined;return r?`grade-${r.grade}${filter!=='all'&&r.grade!==filter?' grade-dim':''}`:'';};
 document.body.addEventListener('click',e=>{const el=eventElement(e);if(!el.closest('#panel'))return;
  if(el.closest('[data-check-run]')){if(running!==null){stopping=true;render();}else void check(IDS);return;}
  if(el.closest('[data-check-flagged]')){void check(IDS.filter(id=>results.get(id)&&results.get(id)!.grade!=='good'));return;}
  const one=el.closest<HTMLElement>('[data-check-one]');if(one){void check([Number(one.dataset.checkOne)]);return;}
  const f=el.closest<HTMLElement>('[data-check-filter]');if(f){filter=f.dataset.checkFilter as Grade|'all';render();return;}
  const target=el.closest<HTMLElement>('[data-check-focus]');if(target)focus(Number(target.dataset.checkFocus));
 });
 return {renderPanel,slotClass,get running(){return running!==null;},enter(){shown=true;sync();},async leave(){stopping=true;while(running!==null)await sleep(100);shown=false;filter='all';sync();}};
}
