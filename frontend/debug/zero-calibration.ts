import {dt,dm,debugFailure} from './i18n.js';
import type {DebugState,DebugAction,DebugNotice} from './types.js';
import {eventElement} from '../lib/browser.js';
import {role,IDS} from './state.js';
// Fine zero calibration after the hand-set centers: the duck stands up from a crouch and levels itself;
// single servos can still be nudged by hand. The IMU's own mounting tilt is set once, when the person sees the body is level.
// Trims are degrees the runtime adds to commands and subtracts from feedback; servo EEPROM is never touched.
interface Options {getState():DebugState;api:DebugAction;poll(force?:boolean):Promise<void>;say(message:DebugNotice,error?:boolean):void;render():void;focus(id:number):void}
// Every joint but the mouth; the runtime caps a trim at 20°.
const TRIM_IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33],NUDGES=[-1,-.5,.5,1],TRIM_LIMIT=20,WARN_TRIM=15;
// Measured on the duck: the pitch knob (+1 on 12, −1 on 22) tilts the body 0.9° nose up.
const PITCH_GAIN=-.9,KNOB_LIMIT=8,LEVEL_OK=.4,FALLEN=35;
/** Pitch knob u turns both upper legs. Roll knob w folds one leg and unfolds the other (knee twice, hip and ankle once each, so the soles stay flat). */
function knobs(base:Record<number,number>,u:number,w:number){const t={...base},add=(id:number,v:number)=>{t[id]=round((t[id]??0)+v);};add(12,u+w);add(22,w-u);add(13,2*w);add(23,2*w);add(14,w);add(24,w);return t;}
// Eye alignment: both legs hang straight down with flat soles (default hip roll ±5° undoes the CAD sole roll),
// the neck stands plumb and the head sits level. Then each line the person judges depends on one joint only,
// in order hip → knee → ankle, and each is solved by bisection.
const ALIGN_POSE={10:0,11:-5,12:-58.4,13:-58.4,14:0,20:0,21:5,22:58.4,23:58.4,24:0,30:0,31:0,32:0,33:0};
type Part='thigh'|'shin'|'foot'|'sole'|'toe'|'neck'|'head'|'headTop'|'headFront';
type View='left'|'right'|'front'|'top';
// fix: trim sign that corrects the first answer (a); the second answer (b) moves it the other way. From the official model.
interface Step {id:number;view:View;part:Part;a:string;b:string;fix:number;leftLeg?:boolean}
const LEG=(id:number,left:boolean,part:'thigh'|'shin'|'foot',fix:number):Step=>({id,view:left?'left':'right',part,fix,...part==='foot'?{a:'脚尖下垂',b:'脚尖上翘'}:{a:'下端偏尾巴',b:'下端偏鸭嘴'}});
const ALIGN:Step[]=[LEG(12,true,'thigh',-1),LEG(13,true,'shin',1),LEG(14,true,'foot',-1),LEG(22,false,'thigh',1),LEG(23,false,'shin',-1),LEG(24,false,'foot',1),
 {id:11,view:'front',part:'sole',a:'外侧高',b:'内侧高',fix:-1,leftLeg:true},{id:21,view:'front',part:'sole',a:'外侧高',b:'内侧高',fix:1},
 {id:10,view:'top',part:'toe',a:'脚尖朝外',b:'脚尖朝内',fix:1,leftLeg:true},{id:20,view:'top',part:'toe',a:'脚尖朝外',b:'脚尖朝内',fix:-1},
 {id:30,view:'left',part:'neck',a:'上端偏尾巴',b:'上端偏鸭嘴',fix:-1},{id:31,view:'left',part:'head',a:'鸭嘴朝下',b:'鸭嘴朝上',fix:-1},
 {id:32,view:'top',part:'headTop',a:'鸭嘴偏鸭子左边',b:'鸭嘴偏鸭子右边',fix:-1},{id:33,view:'front',part:'headFront',a:'鸭子左边低',b:'鸭子右边低',fix:-1}];
const QUESTIONS:Record<Part,string>={thigh:'大腿盖板上两颗螺丝的连线，和背板平行吗？',shin:'膝螺丝到脚上十字舵盘中心的连线，和背板平行吗？',foot:'脚底和背板垂直吗？',
 sole:'从正面看，这只脚的脚底是平的吗？',toe:'从上往下看，这只脚的脚尖朝正前方吗？',neck:'脖子上两个舵盘中心的连线，和背板平行吗？',head:'头的下边缘和背板垂直吗？',
 headTop:'从上往下看，鸭嘴朝正前方吗？',headFront:'从正面看，头的下边缘是水平的吗？'};
const VIEWS:Record<View,string>={left:'从鸭子左侧看',right:'从鸭子右侧看',front:'从鸭子正面看',top:'从鸭子上方看'};
const round=(v:number)=>Math.round(v*10)/10;
const clamp=(v:number,limit:number)=>Math.max(-limit,Math.min(limit,v));
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const fmt=(v:number)=>(v>0.05?'+':v< -0.05?'−':'')+Math.abs(v).toFixed(1);
/** Body tilt from the runtime's gravity vector: pitch + is nose down, roll + is leaning right. */
export function tiltOf(s:DebugState):{p:number;r:number}|null{
 const g=s.status.gravity,age=s.status.feedback_age_ms;
 if(!g||g.length!==3||s.status.imu_ok!==true||typeof age!=='number'||age>500)return null;
 const [x,y,z]=g as [number,number,number],deg=180/Math.PI;return {p:Math.atan2(x,-z)*deg,r:Math.atan2(-y,-z)*deg};
}
/** The IMU's own tilt: the measured body tilt with the board's current correction (roll, then pitch) taken back off. */
export function rawTilt(t:{p:number;r:number},level:number[]):{p:number;r:number}{
 const rad=Math.PI/180,[br=0,bp=0]=level.map(v=>v*rad),x=Math.tan(t.p*rad),y=-Math.tan(t.r*rad),z=-1;
 const x1=x*Math.cos(bp)-z*Math.sin(bp),z1=x*Math.sin(bp)+z*Math.cos(bp),y2=y*Math.cos(br)+z1*Math.sin(br),z2=-y*Math.sin(br)+z1*Math.cos(br);
 return {p:Math.atan2(x1,-z2)/rad,r:Math.atan2(-y2,-z2)/rad};
}
export function createZeroCalibration({getState,api,poll,say,render,focus}:Options){
 // The plain official runtime has no trims, only the saved IMU level (/api/level).
 const levelOnly=()=>getState().status.trim===undefined;
 let levelSaved=false;
 let busy=false,progress='',saved=true,justSaved=false,loaded=false,trim:Record<number,number>={},original:Record<number,number>={};
 function load(){const raw=getState().status.trim??{};original=Object.fromEntries(Object.entries(raw).map(([k,v])=>[Number(k),Number(v)]));trim={...original};loaded=true;}
 const clean=(values:Record<number,number>)=>Object.fromEntries(Object.entries(values).filter(([,v])=>v).map(([k,v])=>[k,round(v)]));
 async function send(save=false){await api('trim',{trim:clean(trim),save});if(save){original={...trim};saved=true;}else{saved=false;justSaved=false;}}
 async function guard(work:()=>Promise<void>){busy=true;render();try{await work();}catch(error){say(debugFailure(error),true);}busy=false;progress='';await poll(true);render();}
 const chosen=()=>{const s=getState(),d=s.devices.find(d=>d.uid===s.selected);return d&&TRIM_IDS.includes(d.id)?d.id:null;};
 async function stand(){if(getState().status.mode!=='hold')await api('mode',{mode:'hold'});await api('pose',{targets:null});}
 async function measure(count=5){await sleep(1000);const samples:{p:number;r:number}[]=[],rates:number[][]=[];for(let i=0;i<count;i++){await poll(true);const t=tiltOf(getState()),g=getState().status.gyro;if(t)samples.push(t);if(g?.length===3)rates.push(g);await sleep(120);}
  if(!samples.length)throw new Error(dt('姿态传感器（IMU）没有读数'));const mean=(v:number[])=>v.reduce((a,b)=>a+b,0)/v.length;
  return {p:mean(samples.map(t=>t.p)),r:mean(samples.map(t=>t.r)),gyro:rates.length?[0,1,2].map(k=>Math.round(mean(rates.map(g=>g[k]!))*100)/100):null};}
 // Stand up from the crouch, then close both tilts with the two knobs. The roll gain is learned from the first roll move;
 // the run stops and steps back when the tilt grows, the duck falls, or a knob would pass 8°.
 async function autoCalibrate(){
  progress=dt('鸭子正在慢慢站起来…');render();await stand();await sleep(2500);
  const base={...trim};let u=0,w=0,rollGain=0,rollOff=false,t=await measure();
  const apply=async(nu:number,nw:number)=>{u=nu;w=nw;trim=knobs(base,u,w);await send();};
  if(Math.abs(t.p)>FALLEN||Math.abs(t.r)>FALLEN){say(dm('鸭子倒了，已退回。'),true);return;}
  let best={u,w,e:Math.abs(t.p)+Math.abs(t.r)};progress=dt('正在自己调平…');render();
  for(let i=0;i<24;i++){
   const rollLeft=!rollOff&&Math.abs(t.r)>=LEVEL_OK;
   if(Math.abs(t.p)<LEVEL_OK&&!rollLeft){say(dm(rollOff?'左右调不动，只调了前后。':'调平了，可以保存。'));return;}
   const du=Math.abs(t.p)<LEVEL_OK?0:clamp(-t.p/PITCH_GAIN*.7,1.5),dw=!rollLeft?0:rollGain?clamp(-t.r/rollGain*.7,1):1;
   if(Math.abs(u+du)>KNOB_LIMIT||2*Math.abs(w+dw)>KNOB_LIMIT){await apply(best.u,best.w);say(dm('需要补偿超过 8°，请先用手粗调腿部关节。'),true);return;}
   const before=t;await apply(u+du,w+dw);t=await measure();
   if(Math.abs(t.p)>FALLEN||Math.abs(t.r)>FALLEN){await apply(0,0);say(dm('鸭子倒了，已退回。'),true);return;}
   if(dw&&!rollGain){const gain=(t.r-before.r)/dw;if(Math.abs(gain)<.2){rollOff=true;await apply(u,w-dw);t=await measure();}else rollGain=gain;}
   const e=Math.abs(t.p)+Math.abs(t.r);if(e<best.e)best={u,w,e};else if(e>best.e+1.5){await apply(best.u,best.w);say(dm('越调越歪，已停下并退回。'),true);return;}
  }
  await apply(best.u,best.w);say(dm('没能完全调平，已保留最好的结果。'));
 }
 /** The person sees the body is level: whatever the IMU still reads is its own mounting tilt, and the duck is
  * standing still, so the gyro's raw reading is its offset. Both are saved with the trims. */
 async function markLevel(){const t=await measure(15),raw=rawTilt(t,getState().status.imu_level??[0,0]),imu=[Math.round(raw.r*100)/100,Math.round(raw.p*100)/100];
  if(levelOnly()){const reply=await api('level',{imu});if(!Array.isArray(reply?.imu))throw new Error(dt('板子没有记下水平，请更新板子程序。'));levelSaved=true;say(dm('已记为水平。'));return;}
  const reply=await api('trim',{trim:clean(trim),save:true,imu,...t.gyro?{gyro:t.gyro}:{}});
  // An older board runtime ignores fields it does not know, so only its reply proves the level was kept.
  if(!reply||typeof reply!=='object'||!Array.isArray(Reflect.get(reply,'imu'))||t.gyro&&!Array.isArray(Reflect.get(reply,'gyro')))throw new Error(dt('板子没有记下水平，请更新板子程序。'));
  original={...trim};saved=true;say(dm('已记为水平。'));}
 let aligned=false,step=0;const done=new Set<number>();
 async function alignPose(){if(getState().status.mode!=='hold')await api('mode',{mode:'hold'});await api('pose',{targets:ALIGN_POSE});aligned=true;}
 function pick(i:number){step=i;}
 /** Each answer turns the joint 1° the other way; “straight” moves on to the next joint. */
 async function answer(side:number){
  const {id,fix}=ALIGN[step]!;
  if(!side){done.add(id);pick(Math.min(step+1,ALIGN.length-1));return;}
  done.delete(id);trim[id]=round(clamp((trim[id]??0)+side*fix,TRIM_LIMIT));await send();
 }
 /** What the joint has been trimmed by, and where the servo actually is relative to the pose (it lags on soft joints). */
 function alignLive(){
  const id=ALIGN[step]!.id,i=IDS.indexOf(id),s=getState().status,a=s.angles?.[i],t=s.targets?.[i],value=trim[id]??0;
  // Feedback is reported without the board's trim, so add back the trim the board actually applied.
  const applied=Number(s.trim?.[String(id)]??0),actual=typeof a==='number'&&typeof t==='number'?fmt(applied+a-t)+'°':'—';
  return `${dt('已调')} <b>${fmt(value)}°</b> · ${dt('舵机实际')} <b>${actual}</b>`;
 }
 /** Legs go back to the default pose when the person leaves the alignment. */
 async function endAlign(){if(!aligned)return;aligned=false;try{await api('pose',{targets:null});}catch{/* Nothing to release when the board is gone. */}}
 /** A small sketch of what to look at: the orange part should line up with the dashed line. */
 function figure(s:Step){
  const O='#e2672f',G='#b9c3d4',F='#d7deea',dash=(x1:number,y1:number,x2:number,y2:number)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${G}" stroke-dasharray="3 3"/>`;
  const line=(x1:number,y1:number,x2:number,y2:number,on:boolean)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${on?O:G}" stroke-width="${on?4:2}" stroke-linecap="round"/>`;
  const dot=(x:number,y:number)=>`<circle cx="${x}" cy="${y}" r="4" fill="#17243c"/>`,plate=`<rect x="14" y="8" width="7" height="128" rx="2" fill="${G}"/>`;
  let draw='',label='';
  if(['thigh','shin','foot'].includes(s.part)){
   draw=`${plate}<polygon points="110,18 110,64 88,41" fill="#eef2f8" stroke="${G}"/>${line(110,18,110,64,s.part==='thigh')}${line(110,64,110,112,s.part==='shin')}${dash(110,118,110,146)}
    <rect x="84" y="116" width="52" height="10" rx="3" fill="${s.part==='foot'?O:F}"/>${dot(110,18)}${dot(110,64)}${dot(110,112)}`;
  }else if(s.part==='neck'||s.part==='head'){
   draw=`${plate}<rect x="21" y="92" width="80" height="44" rx="6" fill="${F}"/>${line(80,92,80,40,s.part==='neck')}${s.part==='neck'?dash(80,40,80,8):dash(36,40,200,40)}
    <rect x="36" y="14" width="156" height="26" rx="10" fill="#eef2f8" stroke="${G}"/>${line(36,40,192,40,s.part==='head')}${dot(80,92)}${dot(80,40)}`;
  }else if(s.part==='sole'){
   // Facing the duck: its left leg is on the viewer's right.
   draw=`<rect x="40" y="10" width="140" height="36" rx="6" fill="${F}"/>${line(70,46,70,112,false)}${line(150,46,150,112,false)}
    ${dash(20,126,200,126)}<rect x="48" y="114" width="44" height="9" rx="3" fill="${s.leftLeg?F:O}"/><rect x="128" y="114" width="44" height="9" rx="3" fill="${s.leftLeg?O:F}"/>`;label=dt('鸭子左腿在右边');
  }else if(s.part==='toe'){
   const x=s.leftLeg?75:145;draw=`<rect x="40" y="60" width="140" height="40" rx="6" fill="${F}"/>${dash(x,6,x,146)}<rect x="60" y="20" width="30" height="58" rx="8" fill="${s.leftLeg?O:F}"/><rect x="130" y="20" width="30" height="58" rx="8" fill="${s.leftLeg?F:O}"/>`;label=dt('↑ 鸭嘴　左腿在左边');
  }else if(s.part==='headTop'){
   draw=`<rect x="60" y="80" width="100" height="56" rx="8" fill="${F}"/>${dash(110,4,110,146)}<rect x="82" y="22" width="56" height="84" rx="16" fill="#eef2f8" stroke="${O}" stroke-width="3"/><polygon points="110,8 100,26 120,26" fill="${O}"/>`;label=dt('↑ 鸭嘴　鸭子左边在左边');
  }else{
   draw=`<rect x="60" y="96" width="100" height="40" rx="6" fill="${F}"/><rect x="104" y="58" width="12" height="38" fill="${G}"/><rect x="40" y="22" width="140" height="36" rx="12" fill="#eef2f8" stroke="${G}"/>${dash(20,58,200,58)}${line(40,58,180,58,true)}`;label=dt('鸭子左边在右边');
  }
  const mirror=s.view==='right';
  if(s.view==='left'||s.view==='right')label=mirror?dt('← 鸭嘴'):dt('鸭嘴 →');
  return `<svg class="zero-figure" viewBox="0 0 220 150" role="img" aria-hidden="true">${mirror?`<g transform="translate(220,0) scale(-1,1)">${draw}</g>`:draw}
   <text x="${mirror?14:206}" y="146" text-anchor="${mirror?'start':'end'}" font-size="11" fill="#7b89a0">${label}</text></svg>`;
 }
 function renderAlign(){
  if(!loaded)load();
  const dis=busy?'disabled':'',s=ALIGN[step]!;
  // On a side view the buttons sit where the line points: the tail is on the left when looking at the duck's left side.
  const answers=[`<button data-align-answer="1" ${dis}>${dt(s.a)}</button>`,`<button class="ok" data-align-answer="0" ${dis}>${dt('正了')}</button>`,`<button data-align-answer="-1" ${dis}>${dt(s.b)}</button>`];
  if(s.view==='right'&&s.part!=='foot')answers.reverse();
  return `<div class="zero-body"><p class="zero-note">${dt('先把鸭子拿起来，双脚悬空，再点“摆好对齐姿势”。每一步只看一条线和背板。')}</p>
   <button class="${aligned?'secondary':'primary'}" data-zero="align" ${dis}>${dt('摆好对齐姿势')}</button>
   <div class="zero-trims">${ALIGN.map((a,i)=>`<button data-align-step="${i}" class="${i===step?'on':''}">${done.has(a.id)?'✓ ':''}ID ${a.id} ${fmt(trim[a.id]??0)}°</button>`).join('')}</div>
   ${aligned?`<p class="zero-motor">ID ${s.id} · ${role(s.id)} · ${dt(VIEWS[s.view])}</p><p class="zero-q">${dt(QUESTIONS[s.part])}</p>${figure(s)}
   <p class="zero-live" data-align-live>${alignLive()}</p><div class="zero-answer">${answers.join('')}</div><p class="zero-note">${dt('每点一下转 1°，等舵机实际到位再看。')}</p>`:''}
   ${saved?'':`<button class="primary" data-zero="save" ${dis}>${dt('保存')}</button><button class="secondary" data-zero="discard" ${dis}>${dt('不保存，恢复原样')}</button>`}</div>`;
 }
 async function nudge(delta:number){const id=chosen();if(id===null)return;const value=round((trim[id]??0)+delta);if(Math.abs(value)>TRIM_LIMIT)return;trim[id]=value;await guard(()=>send());}
 async function act(name:string){
  if(name==='stand')await guard(stand);
  else if(name==='auto')await guard(autoCalibrate);
  else if(name==='level')await guard(markLevel);
  else if(name==='align')await guard(alignPose);
  else if(name==='save')await guard(async()=>{await send(true);justSaved=true;say(dm('已保存。可以先试默认姿态，再试行走。'));});
  else if(name==='discard')await guard(async()=>{trim={...original};await send();saved=true;});
 }
 function tiltView(){const t=tiltOf(getState());if(!t)return `<p class="zero-note">${dt('姿态传感器（IMU）没有读数')}</p>`;const ok=(v:number)=>Math.abs(v)<.5?'ok':'off';
  return `<dl class="zero-tilt"><dt>${dt('前后')}</dt><dd class="${ok(t.p)}" data-zero-tilt="p">${fmt(t.p)}°</dd><dt>${dt('左右')}</dt><dd class="${ok(t.r)}" data-zero-tilt="r">${fmt(t.r)}°</dd></dl>`;}
 function renderLevel(){
  const [r=0,p=0]=getState().status.imu_level??[];
  return `<div class="zero-body"><p class="zero-note">${dt('在 Calibration 对好零点后，点 Default pose，让鸭子在平地上站稳。看着是平的，就点下面的按钮。每次重新对零后点一次。')}</p>
   ${tiltView()}<button class="primary" data-zero="level" ${busy?'disabled':''}>${dt('记为水平')}</button>
   <p class="zero-note">${levelSaved?`<span class="zero-ok">${dt('已记为水平')}</span> · `:''}${dt('IMU 补偿：前后 {p}° · 左右 {r}°',{p:fmt(p),r:fmt(r)})}${levelSaved?dt('，立刻生效，断电也保留'):''}</p></div>`;
 }
 function renderPanel(){
  if(levelOnly())return renderLevel();
  if(!loaded)load();
  const dis=busy?'disabled':'',id=chosen(),value=id===null?0:trim[id]??0,set=TRIM_IDS.filter(i=>trim[i]);
  const adjust=id===null?`<p class="zero-note">${dt('在 3D 或下方舵机条里点一个舵机，再用 ± 微调它。')}</p>`
   :`<div class="zero-adjust"><p class="zero-motor">ID ${id} · ${role(id)}</p><div>${NUDGES.map((n,i)=>`${i===2?`<b>${fmt(value)}°</b>`:''}<button data-zero-nudge="${n}" ${dis||Math.abs(value+n)>TRIM_LIMIT?'disabled':''}>${n>0?'+':'−'}${Math.abs(n)}</button>`).join('')}</div></div>
    ${Math.abs(value)>=WARN_TRIM?`<p class="zero-warn">${dt('已经调了 15° 以上还没对齐。可能舵盘装偏了一个齿，建议拆下来重新对准。')}</p>`:''}`;
  return `<div class="zero-body"><p class="zero-note">${justSaved?dt('已保存。可以先试默认姿态，再试行走。'):dt('让鸭子蹲在平桌上，点“自动校准”，它会慢慢站起来再自己调平。')}</p>
   <div class="zero-pair"><button class="primary" data-zero="auto" ${dis}>${dt('自动校准')}</button><button class="secondary" data-zero="stand" ${dis}>${dt('站好')}</button></div>
   ${progress?`<p class="zero-q">${progress}</p>`:''}${tiltView()}
   <div class="zero-level"><p class="zero-note">${dt('身体看起来正了，就点“记为水平”。每只鸭子只需一次。')}</p><button class="secondary" data-zero="level" ${dis}>${dt('记为水平')}</button></div>
   ${adjust}<p class="zero-note">${dt('前后歪：调 12 / 22。左右歪：交给自动校准。')}</p>
   ${set.length?`<div class="zero-trims">${set.map(i=>`<button data-zero-pick="${i}" class="${i===id?'on':''}">ID ${i} ${fmt(trim[i]!)}°</button>`).join('')}</div>`:''}
   ${saved?'':`<button class="primary" data-zero="save" ${dis}>${dt('保存')}</button><button class="secondary" data-zero="discard" ${dis}>${dt('不保存，恢复原样')}</button>`}</div>`;
 }
 function updateLive(){const t=tiltOf(getState());for(const el of document.querySelectorAll<HTMLElement>('[data-zero-tilt]')){const v=t?t[el.dataset.zeroTilt as 'p'|'r']:null;el.textContent=v===null?'—':fmt(v)+'°';el.className=v!==null&&Math.abs(v)<.5?'ok':'off';}
  const live=document.querySelector<HTMLElement>('[data-align-live]');if(live)live.innerHTML=alignLive();}
 document.body.addEventListener('click',e=>{const el=eventElement(e);if(!el.closest('.zero-body'))return;
  const n=el.closest<HTMLElement>('[data-zero-nudge]');if(n){void nudge(Number(n.dataset.zeroNudge));return;}
  const p=el.closest<HTMLElement>('[data-zero-pick]');if(p){focus(Number(p.dataset.zeroPick));return;}
  const s=el.closest<HTMLElement>('[data-align-step]');if(s){pick(Number(s.dataset.alignStep));render();return;}
  const r=el.closest<HTMLElement>('[data-align-answer]');if(r){const v=Number(r.dataset.alignAnswer);void guard(()=>answer(v));return;}
  const z=el.closest<HTMLElement>('[data-zero]');if(z)void act(z.dataset.zero!);});
 /** A new hand-set center makes that servo's trim meaningless, so it goes back to zero, saved. */
 async function centered(id:number){if(levelOnly())return;if(!loaded)load();delete trim[id];delete original[id];await api('trim',{trim:clean(original),save:true});if(!saved)await send();render();}
 /** Unsaved trims go back to what was saved; the duck keeps whatever mode it is in. */
 async function leave(){levelSaved=false;await endAlign();if(!loaded)return;const dirty=!saved;loaded=false;justSaved=false;if(!dirty)return;trim={...original};try{await send();}catch{/* Nothing to restore when the board is gone. */}}
 return {renderPanel,renderAlign,endAlign,updateLive,leave,centered,levelOnly};
}
