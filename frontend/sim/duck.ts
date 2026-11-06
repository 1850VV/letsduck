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
 private queue:number[][]=[];private target:number[]=[];private readonly frictionDof:number;
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
 }
 dispose(){this.d.delete();this.m.delete();}
}
