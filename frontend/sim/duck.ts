// XGO Duck in MuJoCo: the official training model (xgoduck_rl robot_walk.xml), its HLS1910 servo model
// (BAM m6, params/1910_m6.json) and the board runtime's walking policy, stepped like the board: 50 Hz policy, 5 ms physics.
import type {MainModule,MjModel,MjData} from '@mujoco/mujoco';
import {Policy,MOTOR_IDS,POLICY_IDS} from './policy.js';

export const JOINTS=['left_hip_yaw','left_hip_roll','left_hip_pitch','left_knee','left_ankle','neck_pitch','head_pitch','head_yaw','head_roll','right_hip_yaw','right_hip_roll','right_hip_pitch','right_knee','right_ankle'];
const PHYS_DT=.005,TICKS=4,RAD=Math.PI/180;

/** Servo-side settings. Training: kp 5, no D term, 15–30 ms delay, 7.4–8.0 V. */
export interface ServoParams {kp:number;kd:number;kdGain:number;delayMs:number;vin:number;friction:number[]}
export const TRAINING:ServoParams={kp:5,kd:0,kdGain:.02,delayMs:22.5,vin:7.7,friction:JOINTS.map(()=>1)};

interface Bam {kt:number;R:number;error_gain_ratio:number;armature:number;friction_base:number;friction_stribeck:number;load_friction_motor:number;load_friction_external:number;load_friction_motor_stribeck:number;load_friction_external_stribeck:number;load_friction_motor_quad:number;load_friction_external_quad:number;dtheta_stribeck:number;alpha:number;friction_viscous:number}
const ERROR_GAIN=.166,MAX_PWM=.97; // Feetech STS duty per (rad × firmware P), from BAM's STS3215 actuator

export interface ModelFiles {scene:string;robot:string;meshes:Record<string,Uint8Array>;bam:Bam}

export class DuckSim {
 readonly m:MjModel;readonly d:MjData;readonly policy:Policy;
 params:ServoParams={...TRAINING,friction:[...TRAINING.friction]};
 command=[0,0,0];time=0;fell:number|null=null;
 private readonly qadr:number[];private readonly vadr:number[];private readonly imu:number;private readonly gyro:number;
 private queue:number[][]=[];private target:number[]=[];private readonly frictionDof:number;private pin:Float64Array|null=null;
 constructor(private readonly mj:MainModule,files:ModelFiles,onnx:Uint8Array,private readonly bam=files.bam){
  const vfs=new mj.MjVFS();
  try{
   vfs.addBuffer('robot_walk.xml',new TextEncoder().encode(files.robot));
   for(const [name,bytes] of Object.entries(files.meshes))vfs.addBuffer('assets/'+name,bytes);
   this.m=mj.MjModel.from_xml_string(files.scene,vfs);
  }finally{vfs.delete();}
  this.m.opt.timestep=PHYS_DT;
  // The servo model computes torque itself: every <position> actuator becomes a plain motor.
  for(let i=0;i<this.m.nu;i++){
   this.m.actuator_gaintype[i]=0;this.m.actuator_biastype[i]=0;this.m.actuator_ctrllimited[i]=0;this.m.actuator_forcelimited[i]=0;
   for(let k=0;k<10;k++){this.m.actuator_gainprm[i*10+k]=k?0:1;this.m.actuator_biasprm[i*10+k]=0;}
  }
  this.d=new mj.MjData(this.m);
  const joint=(n:string)=>this.m.jnt(n).id;
  this.qadr=JOINTS.map(n=>this.m.jnt_qposadr[joint(n)]);this.vadr=JOINTS.map(n=>this.m.jnt_dofadr[joint(n)]);
  // As in training (bam.mjlab): servo armature, and a stiff joint-friction constraint so a held joint does not creep.
  for(const v of this.vadr){this.m.dof_armature[v]=bam.armature;this.m.dof_solref.set([-5e4,-2e2],v*2);this.m.dof_solimp.set([.99,.9999,.001,.5,2],v*5);}
  this.imu=this.m.site('imu').id;this.gyro=this.m.sensor_adr[this.m.sensor('imu_ang_vel').id];
  this.frictionDof=mj.mjtConstraint.mjCNSTR_FRICTION_DOF.value;
  this.policy=new Policy(onnx);
  this.reset();
 }
 reset(){
  this.mj.mj_resetDataKeyframe(this.m,this.d,0);this.mj.mj_forward(this.m,this.d);
  this.policy.reset();this.time=0;this.fell=null;
  this.target=this.qadr.map(a=>this.d.qpos[a]);
  this.queue=Array.from({length:Math.max(1,Math.round(this.params.delayMs/1000/PHYS_DT))},()=>[...this.target]);
 }
 /** Body-frame gravity, gyro, and joint angles/velocities in degrees by MOTOR_IDS — what the board feeds the policy. */
 sense(){
  const R=this.d.site_xmat.subarray(this.imu*9,this.imu*9+9),grav=[-R[6],-R[7],-R[8]];
  const gyro=[0,1,2].map(i=>this.d.sensordata[this.gyro+i]),angles=new Array(15).fill(0),vels=new Array(15).fill(0);
  JOINTS.forEach((_,i)=>{const k=MOTOR_IDS.indexOf(POLICY_IDS[i]!);angles[k]=this.d.qpos[this.qadr[i]!]/RAD;vels[k]=this.d.qvel[this.vadr[i]!]/RAD;});
  return {grav,gyro,angles,vels};
 }
 /** One 20 ms control period: policy inference, then four physics steps. */
 tick(){
  if(this.fell!==null)return;
  const s=this.sense();
  this.target=this.policy.targets(this.policy.infer(s.grav,s.gyro,s.angles,s.vels,this.command)).map(v=>v*RAD);
  for(let i=0;i<TICKS;i++)this.step();
  this.time+=PHYS_DT*TICKS;
  const z=this.d.qpos[2],up=this.d.site_xmat[this.imu*9+8];
  if(z<.08||up<Math.cos(50*RAD))this.fell=this.time;
 }
 private step(){
  const lag=Math.max(1,Math.round(this.params.delayMs/1000/PHYS_DT));
  this.queue.push(this.target);while(this.queue.length>lag)this.queue.shift();
  const goal=this.queue[0]!,b=this.bam,p=this.params,d=this.d,eg=ERROR_GAIN*b.error_gain_ratio;
  const friction=new Map<number,number>();
  for(let e=0;e<d.nefc;e++)if(d.efc_type[e]===this.frictionDof)friction.set(d.efc_id[e],(friction.get(d.efc_id[e])??0)+d.efc_force[e]);
  JOINTS.forEach((_,i)=>{
   const v=this.vadr[i]!,q=d.qpos[this.qadr[i]!],dq=d.qvel[v];
   const duty=Math.max(-MAX_PWM,Math.min(MAX_PWM,((goal[i]!-q)*p.kp-p.kd*p.kdGain*dq)*eg));
   d.ctrl[i]=b.kt*p.vin*duty/b.R-b.kt*b.kt*dq/b.R;
   // BAM m6 friction budget from the motor and external torques of the last step.
   const motor=d.qfrc_actuator[v],external=-d.qfrc_bias[v]+d.qfrc_constraint[v]-(friction.get(v)??0);
   const gear=Math.abs(external*b.load_friction_external-motor*b.load_friction_motor);
   const gearS=Math.abs(external*b.load_friction_external_stribeck-motor*b.load_friction_motor_stribeck);
   const stribeck=Math.exp(-(Math.abs(dq/b.dtheta_stribeck)**b.alpha));
   let loss=b.friction_base+gear+stribeck*(b.friction_stribeck+gearS);
   loss+=stribeck*(Math.abs(motor)>Math.abs(external)?b.load_friction_external_quad*external*external:b.load_friction_motor_quad*motor*motor);
   this.m.dof_frictionloss[v]=loss*(p.friction[i]??1);this.m.dof_damping[v]=b.friction_viscous;
  });
  this.mj.mj_step(this.m,d);
  if(this.pin){d.qpos.set(this.pin,0);d.qvel.fill(0,0,6);}
 }
 /**
  * The debug duck's servo check (duck-debug.ts servoCheck) on joint i: the trunk is held still in the air in the
  * standing pose and the joint swings ±8° about its standing angle as a square wave of 0.5 s halves. rise is seconds
  * to cover 90% of a swing (0.5 when it never gets there), err is degrees short when a half ends, both averaged over five swings.
  */
 servoCheck(i:number):{rise:number;err:number}{
  const home=this.policy.targets(new Float32Array(14)).map(v=>v*RAD),d=this.d;
  this.mj.mj_resetDataKeyframe(this.m,d,0);d.qpos[2]+=.1;this.qadr.forEach((a,k)=>d.qpos[a]=home[k]!);this.mj.mj_forward(this.m,d);
  this.pin=d.qpos.slice(0,7);this.queue=[[...home]];
  const halves:{t:number;a:number;tg:number}[][]=[];
  try{
   for(let half=0;half<6;half++){
    const goal=[...home];goal[i]=goal[i]!+(half%2?-8:8)*RAD;this.target=goal;
    const samples:{t:number;a:number;tg:number}[]=[];
    // The board samples /api/status about every 20 ms.
    for(let k=1;k<=100;k++){this.step();if(k%4===0)samples.push({t:k*PHYS_DT,a:d.qpos[this.qadr[i]!]/RAD,tg:goal[i]!/RAD});}
    halves.push(samples);
   }
  }finally{this.pin=null;this.reset();}
  const swings=halves.slice(1).map((h,n)=>{const from=halves[n]!.at(-1)!.a,last=h.at(-1)!,span=last.tg-from;return {rise:h.find(x=>(x.a-from)/span>=.9)?.t??.5,err:Math.abs(last.a-last.tg)};});
  const mean=(k:'rise'|'err')=>swings.reduce((s,x)=>s+x[k],0)/swings.length;
  return {rise:mean('rise'),err:mean('err')};
 }
 dispose(){this.d.delete();this.m.delete();}
}

const FRICTIONS=[.15,.25,.35,.5,.65,.8,1,1.25,1.5,2,2.5,3,4,6];
/** Friction multiplier on joint i whose simulated servo check comes closest to a measured one (rise in 0.05 s ≈ err in 0.5°). */
export function fitFriction(sim:DuckSim,i:number,real:{rise:number;err:number}):{friction:number;rise:number;err:number}{
 const saved=sim.params.friction[i]!;let best={friction:1,rise:0,err:0,cost:Infinity};
 try{
  for(const f of FRICTIONS){
   sim.params.friction[i]=f;const r=sim.servoCheck(i),cost=((r.rise-real.rise)/.05)**2+((r.err-real.err)/.5)**2;
   if(cost<best.cost)best={friction:f,...r,cost};
  }
 }finally{sim.params.friction[i]=saved;}
 return {friction:best.friction,rise:best.rise,err:best.err};
}
