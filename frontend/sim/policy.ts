// The board runtime's walking policy (rl_core.py + policy.py of xgoduck_runtime_arduino) without ONNX Runtime:
// the exported model is a normalizer and an ELU MLP, evaluated here directly from its weights.
import {initializers} from './onnx.js';

export const MOTOR_IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34];
export const POLICY_IDS=[10,11,12,13,14,30,31,32,33,20,21,22,23,24];
// Walking home pose in MOTOR_IDS order (rl_core.DEFAULT_DEG).
const DEFAULT_DEG=[0,-5,-22,0,22,0,5,22,0,-22,20,20,0,0,0];
const POLICY_INDEX=POLICY_IDS.map(id=>MOTOR_IDS.indexOf(id));
export const HOME_DEG=POLICY_INDEX.map(i=>DEFAULT_DEG[i]!);
const RAD=Math.PI/180;

interface Layer {w:Float32Array;b:Float32Array;rows:number;cols:number}

export class Policy {
 private readonly mean:Float32Array;private readonly scale:Float32Array;private readonly layers:Layer[];
 readonly prevAction=new Float32Array(14);private readonly filtered=new Float32Array(14);
 legAlpha=.35;headAlpha=.45;actionScale=1;
 constructor(onnx:Uint8Array){
  const t=initializers(onnx),norm=[...t].filter(([,v])=>v.dims.length===2&&v.dims[0]===1&&v.dims[1]===61);
  const mean=norm.find(([k])=>k.endsWith('_mean')),div=norm.find(([k])=>!k.endsWith('_mean'));
  if(!mean||!div)throw new Error('walk model has no observation normalizer');
  this.mean=mean[1].data;this.scale=div[1].data.map(v=>1/v);
  this.layers=[...t].filter(([k])=>/^mlp\.\d+\.weight$/.test(k)).sort(([a],[b])=>Number(a.split('.')[1])-Number(b.split('.')[1])).map(([k,v])=>({w:v.data,b:t.get(k.replace('weight','bias'))!.data,rows:v.dims[0]!,cols:v.dims[1]!}));
  if(this.layers[0]?.cols!==61||this.layers.at(-1)?.rows!==14)throw new Error('walk model must map 61 observations to 14 actions');
 }
 reset(){this.prevAction.fill(0);this.filtered.fill(0);}
 /** Raw network output for one observation. */
 run(obs:Float32Array):Float32Array{
  let x=obs.map((v,i)=>(v-this.mean[i]!)*this.scale[i]!);
  this.layers.forEach((l,n)=>{
   const y=new Float32Array(l.rows);
   for(let r=0;r<l.rows;r++){let s=l.b[r]!;const o=r*l.cols;for(let c=0;c<l.cols;c++)s+=l.w[o+c]!*x[c]!;y[r]=n<this.layers.length-1&&s<0?Math.expm1(s):s;}
   x=y;
  });
  return x;
 }
 /** gravity (body frame), gyro rad/s, angles and velocities in degrees by MOTOR_IDS, command [vx, vy, yaw]. Returns filtered actions. */
 infer(grav:ArrayLike<number>,gyro:ArrayLike<number>,anglesDeg:ArrayLike<number>,velsDeg:ArrayLike<number>,cmd:ArrayLike<number>):Float32Array{
  const obs=new Float32Array(61);
  obs.set(Array.from(gyro).slice(0,3),0);obs.set(Array.from(grav).slice(0,3),3);
  POLICY_INDEX.forEach((m,i)=>{obs[6+i]=(anglesDeg[m]!-HOME_DEG[i]!)*RAD;obs[20+i]=velsDeg[m]!*RAD;});
  obs.set(this.prevAction,34);obs.set(Array.from(cmd).slice(0,3),48);
  const action=this.run(obs);this.prevAction.set(action);
  for(let i=0;i<14;i++){const a=i>=5&&i<9?this.headAlpha:this.legAlpha;this.filtered[i]=this.filtered[i]!*a+action[i]!*(1-a);}
  return this.filtered.slice();
 }
 /** Joint targets in degrees by POLICY_IDS order. */
 targets(action:ArrayLike<number>):number[]{return HOME_DEG.map((h,i)=>h+action[i]!*this.actionScale/RAD);}
}
