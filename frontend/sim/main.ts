import loadMujoco from '@mujoco/mujoco';
import wasmUrl from '@mujoco/mujoco/mujoco.wasm?url';
import scene from './model/scene_walk.xml?raw';
import robot from './model/robot_walk.xml?raw';
import bam from './model/1910_m6.json';
import {DuckSim,TRAINING,JOINTS,fitFriction,type ServoParams} from './duck.js';
import {POLICY_IDS} from './policy.js';
import {createView} from './view.js';

// The official walk policy has no redistribution license, so it is fetched from the official repository and cached.
const POLICY_URL='https://raw.githubusercontent.com/LuwuDynamics/xgoduck_runtime_arduino/master/python/xgoduck_walk.onnx';
// The debug duck keeps its servo check results here (servo-check.ts); this page shares its origin.
const CHECK_KEY='letsduck.debug.servoCheck';
const NAMES:Record<number,string>={10:'左髋旋转',11:'左髋侧摆',12:'左腿上端',13:'左腿中部',14:'左脚踝',20:'右髋旋转',21:'右髋侧摆',22:'右腿上端',23:'右腿中部',24:'右脚踝',30:'脖子下端',31:'脖子上端',32:'头部旋转',33:'头部第二关节'};
const meshUrls=import.meta.glob<string>('./model/assets/*.stl',{query:'?url',import:'default',eager:true});
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const status=$('status'),source=$('source');

async function cachedPolicy():Promise<Uint8Array>{
 let cache:Cache|null=null;
 try{cache=await caches.open('duck-sim');const hit=await cache.match(POLICY_URL);if(hit)return new Uint8Array(await hit.arrayBuffer());}catch{cache=null;}
 const reply=await fetch(POLICY_URL);if(!reply.ok)throw new Error('HTTP '+reply.status);
 const bytes=new Uint8Array(await reply.arrayBuffer());
 try{await cache?.put(POLICY_URL,new Response(bytes.slice()));}catch{/* Not cached; fetched again next time. */}
 return bytes;
}
function pickedPolicy():Promise<Uint8Array>{
 const pick=$<HTMLInputElement>('policy-file');$('policy-pick').hidden=false;
 return new Promise(resolve=>pick.addEventListener('change',async()=>{const f=pick.files?.[0];if(f){$('policy-pick').hidden=true;resolve(new Uint8Array(await f.arrayBuffer()));}}));
}

const [mj,meshes,onnx]=await Promise.all([
 loadMujoco({locateFile:()=>wasmUrl}),
 Promise.all(Object.entries(meshUrls).map(async([path,url])=>[path.split('/').pop()!,new Uint8Array(await (await fetch(url)).arrayBuffer())] as const)).then(Object.fromEntries),
 cachedPolicy().catch(()=>{status.textContent='没能下载官方走路模型，请手动选择 xgoduck_walk.onnx';return pickedPolicy();}),
]);
const sim=new DuckSim(mj,{scene,robot,meshes,bam},onnx);
const view=createView($('viewport'),sim.m);
$('loading').remove();

// Per-joint friction table: measured servo check, simulated servo check after fitting, and the multiplier itself.
const table=$('joints');
table.innerHTML=JOINTS.map((_,i)=>{const id=POLICY_IDS[i]!;return `<tr><td>${id}</td><td>${NAMES[id]}</td><td data-real="${i}">—</td><td data-sim="${i}">—</td><td><input data-friction="${i}" type="number" min="0.1" max="8" step="0.05" value="1" aria-label="${NAMES[id]}阻力"></td></tr>`;}).join('');
const frictionInputs=[...table.querySelectorAll<HTMLInputElement>('[data-friction]')];
const cell=(kind:'real'|'sim',i:number)=>table.querySelector<HTMLElement>(`[data-${kind}="${i}"]`)!;
const fmt=(r:{rise:number;err:number})=>`${r.rise.toFixed(2)}s · ${r.err.toFixed(1)}°`;

const sliders=[...document.querySelectorAll<HTMLInputElement>('input[type=range]')];
function show(input:HTMLInputElement){const out=document.querySelector(`output[for=${input.id}]`);if(out)out.textContent=Number(input.value).toFixed(Number(input.step)<1?2:0)+(input.dataset.unit??'');}
function setSlider(id:string,value:number){const input=$<HTMLInputElement>(id);input.value=String(value);show(input);}
function readParams(){
 const v=(id:string)=>Number($<HTMLInputElement>(id).value);
 sim.params={...sim.params,kd:v('kd'),delayMs:v('delay'),vin:v('vin'),friction:frictionInputs.map(input=>Math.max(.1,Number(input.value)||1))};
}
function pressPreset(name:string|null){document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===name)));}
function applyParams(p:ServoParams){
 setSlider('kd',p.kd);setSlider('delay',p.delayMs);setSlider('vin',p.vin);
 frictionInputs.forEach((input,i)=>input.value=String(p.friction[i]??1));
 sim.params={...p,friction:[...p.friction]};
}

/** The connected duck's gains and battery (via the local service), plus the debug duck's saved servo check. */
async function readDuck():Promise<{params:ServoParams;checks:Map<number,{rise:number;err:number}>;notes:string[]}>{
 const notes:string[]=[],params:ServoParams={...TRAINING,kd:10,delayMs:50,friction:JOINTS.map(()=>1)};
 try{
  const reply=await fetch('/api/duck-debug/status');const d=reply.ok?await reply.json():null,s=d?.connected?d.status:null;
  if(s){
   const pd=Object.values<{p:number;d:number}>(s.boot_pd??{}).filter(x=>Number.isFinite(x?.p)),median=(v:number[])=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)]!;
   if(pd.length){params.kp=median(pd.map(x=>x.p));params.kd=median(pd.map(x=>x.d));}
   if(Number.isFinite(s.voltage_v))params.vin=s.voltage_v;
   notes.push(`KP ${params.kp} · KD ${params.kd} · ${params.vin.toFixed(1)} V`,s.imu_calibration?.calibrated?'IMU 已校准':'IMU 未校准');
  }else notes.push('没连上鸭子，增益和电压用默认值');
 }catch{notes.push('没连上鸭子，增益和电压用默认值');}
 const checks=new Map<number,{rise:number;err:number}>();
 try{const saved:unknown=JSON.parse(localStorage.getItem(CHECK_KEY)??'[]');if(Array.isArray(saved))for(const [id,r] of saved)if(POLICY_IDS.includes(id)&&Number.isFinite(r?.rise)&&Number.isFinite(r?.err))checks.set(id,{rise:r.rise,err:r.err});}catch{/* No saved check. */}
 notes.push(checks.size?`舵机质检 ${checks.size}/14 个关节`:'还没有舵机质检结果，先在调试鸭做一次');
 return {params,checks,notes};
}
let fitting=false;
async function myDuck(){
 if(fitting)return;fitting=true;pressPreset('mine');source.textContent='正在读取…';
 try{
  const {params,checks,notes}=await readDuck();applyParams(params);
  const fitted=new Map<number,number>();
  for(const [i] of JOINTS.entries()){
   const id=POLICY_IDS[i]!,real=checks.get(id);cell('real',i).textContent=real?fmt(real):'—';cell('sim',i).textContent='—';
   if(!real)continue;
   source.textContent=`正在按质检结果拟合 ${NAMES[id]}…`;await new Promise(requestAnimationFrame);
   const r=fitFriction(sim,i,real);fitted.set(i,r.friction);cell('sim',i).textContent=fmt(r);
  }
  // Joints without a measurement take the median of the measured ones.
  const values=[...fitted.values()].sort((a,b)=>a-b),fallback=values.length?values[Math.floor(values.length/2)]!:1;
  applyParams({...params,friction:JOINTS.map((_,i)=>fitted.get(i)??fallback)});
  source.textContent=notes.join(' · ');
 }finally{fitting=false;restart();}
}

let running=true,startAt=0,clock=0,owed=0;
function restart(){sim.reset();startAt=0;owed=0;view.recenter();}
sliders.forEach(input=>{show(input);input.addEventListener('input',()=>{show(input);if(input.dataset.servo!==undefined){readParams();pressPreset(null);}});});
frictionInputs.forEach(input=>input.addEventListener('input',()=>{readParams();pressPreset(null);}));
document.querySelector('[data-preset=training]')!.addEventListener('click',()=>{pressPreset('training');applyParams(TRAINING);JOINTS.forEach((_,i)=>{cell('real',i).textContent='—';cell('sim',i).textContent='—';});source.textContent='官方训练时的舵机设定';restart();});
document.querySelector('[data-preset=mine]')!.addEventListener('click',()=>void myDuck());
$('restart').addEventListener('click',restart);
$('pause').addEventListener('click',()=>{running=!running;$('pause').textContent=running?'暂停':'继续';});

// Real-time loop: run as many 20 ms control periods as wall time allows (capped so a background tab does not stall).
function frame(now:number){
 const dt=Math.min(.1,(now-(clock||now))/1000);clock=now;
 if(running&&!fitting&&sim.fell===null){
  const vx=Number($<HTMLInputElement>('vx').value),yaw=Number($<HTMLInputElement>('yaw').value);
  for(owed+=dt;owed>=.02&&sim.fell===null;owed-=.02){startAt+=.02;sim.command=startAt>1?[vx,0,yaw]:[0,0,0];sim.tick();}
 }
 view.render(sim.d);
 const dist=Math.hypot(sim.d.qpos[0],sim.d.qpos[1]);
 status.textContent=sim.fell!==null?`摔倒了 · 第 ${sim.fell.toFixed(1)} 秒 · 走了 ${dist.toFixed(2)} 米`:`${startAt<1?'站稳中':'行走中'} · ${sim.time.toFixed(1)} 秒 · ${dist.toFixed(2)} 米`;
 status.dataset.state=sim.fell!==null?'fell':'ok';
 requestAnimationFrame(frame);
}
pressPreset('training');applyParams(TRAINING);source.textContent='官方训练时的舵机设定';requestAnimationFrame(frame);
