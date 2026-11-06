import loadMujoco from '@mujoco/mujoco';
import wasmUrl from '@mujoco/mujoco/mujoco.wasm?url';
import scene from './model/scene_walk.xml?raw';
import robot from './model/robot_walk.xml?raw';
import bam from './model/1910_m6.json';
import {DuckSim,TRAINING,JOINTS,type ServoParams} from './duck.js';
import {createView} from './view.js';

// The official walk policy has no redistribution license, so it is fetched from the official repository and cached.
const POLICY_URL='https://raw.githubusercontent.com/LuwuDynamics/xgoduck_runtime_arduino/master/python/xgoduck_walk.onnx';
const meshUrls=import.meta.glob<string>('./model/assets/*.stl',{query:'?url',import:'default',eager:true});
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const status=$('status');

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

// Controls: command sliders apply live; servo sliders apply live too, except delay which restarts the queue on reset.
const LEFT=JOINTS.map(n=>n.startsWith('left_')),RIGHT=JOINTS.map(n=>n.startsWith('right_'));
const PRESETS:Record<string,ServoParams>={training:TRAINING,servos:{...TRAINING,kd:10,delayMs:70}};
const sliders=[...document.querySelectorAll<HTMLInputElement>('input[type=range]')];
function show(input:HTMLInputElement){const out=document.querySelector(`output[for=${input.id}]`);if(out)out.textContent=Number(input.value).toFixed(Number(input.step)<1?2:0)+(input.dataset.unit??'');}
function readParams(){
 const v=(id:string)=>Number($<HTMLInputElement>(id).value),left=v('left'),right=v('right');
 sim.params={...sim.params,kd:v('kd'),delayMs:v('delay'),vin:v('vin'),friction:JOINTS.map((_,i)=>LEFT[i]?left:RIGHT[i]?right:1)};
}
function applyPreset(name:string){
 const p=PRESETS[name]!;
 const set=(id:string,value:number)=>{const input=$<HTMLInputElement>(id);input.value=String(value);show(input);};
 set('kd',p.kd);set('delay',p.delayMs);set('vin',p.vin);set('left',1);set('right',1);
 document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===name)));
 readParams();restart();
}
let running=true,startAt=0,clock=0;
function restart(){sim.reset();startAt=0;view.recenter();}
sliders.forEach(input=>{show(input);input.addEventListener('input',()=>{show(input);if(input.dataset.servo!==undefined){readParams();document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed','false'));}});});
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(b=>b.addEventListener('click',()=>applyPreset(b.dataset.preset!)));
$('restart').addEventListener('click',restart);
$('pause').addEventListener('click',()=>{running=!running;$('pause').textContent=running?'暂停':'继续';});

// Real-time loop: run as many 20 ms control periods as wall time allows (capped so a background tab does not stall).
function frame(now:number){
 const dt=Math.min(.1,(now-(clock||now))/1000);clock=now;
 if(running&&sim.fell===null){
  startAt+=dt;
  const walking=startAt>1,vx=Number($<HTMLInputElement>('vx').value),yaw=Number($<HTMLInputElement>('yaw').value);
  sim.command=walking?[vx,0,yaw]:[0,0,0];
  for(let t=0;t<dt;t+=.02)sim.tick();
 }
 view.render(sim.d);
 const dist=Math.hypot(sim.d.qpos[0],sim.d.qpos[1]);
 status.textContent=sim.fell!==null?`摔倒了 · 第 ${sim.fell.toFixed(1)} 秒 · 走了 ${dist.toFixed(2)} 米`:`${startAt<1?'站稳中':'行走中'} · ${sim.time.toFixed(1)} 秒 · ${dist.toFixed(2)} 米`;
 status.dataset.state=sim.fell!==null?'fell':'ok';
 requestAnimationFrame(frame);
}
applyPreset('training');requestAnimationFrame(frame);
