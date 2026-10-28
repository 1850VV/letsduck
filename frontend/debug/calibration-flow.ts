/** Relative coordinate workflow only. This module has no device I/O or mechanical-zero inference. */
export const CALIBRATION_IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33] as const;
export type Pose=Record<number,number>;
export type Bounds=Record<number,{min:number;max:number}>;
export type CalibrationGroup='both'|'left'|'right'|'head';
export type CalibrationPhase='seat'|'approach'|'review'|'recorded';
export type CalibrationStatus='paused'|'moving'|'released'|'disconnected';
export type CandidateSource='simulation'|'provided';
export type MotionKind='approach'|'nudge'|'return-baseline'|'return-checkpoint';
export interface MotionPlan {
 kind:MotionKind;from:Pose;to:Pose;destination:Pose;elapsed:number;duration:number;
 candidateFrom:Pose|null;
}
const EVENT_TYPES=['seat-saved','segment-started','segment-finished','paused','stopped','released','disconnected','reconnected','nudge','selection','checkpoint','joint-confirmed','loaded'] as const;
export type FlowEventType=typeof EVENT_TYPES[number];
export interface FlowEvent {type:FlowEventType;sequence:number;pose:Pose;jointId?:number}
export interface CalibrationFlowState {
 phase:CalibrationPhase;status:CalibrationStatus;currentPose:Pose;baseline:Pose|null;target:Pose;candidateSource:CandidateSource;
 selectedGroup:CalibrationGroup;selectedJoint:number;motionPlan:MotionPlan|null;autoRunning:boolean;
 checkpoints:Pose[];confirmed:Partial<Record<number,number>>;events:FlowEvent[];
}
export interface FlowOptions {candidateTarget?:Pose;candidateSource?:CandidateSource}
export interface NudgeOptions {mirror?:boolean;headLinked?:boolean}
export interface FlowArchive {format:'letsduck-calibration-flow';version:1;state:CalibrationFlowState}

const JOINT_SET=new Set<number>(CALIBRATION_IDS),MAX_SEGMENT=5,SPEED=2,EPSILON=1e-9;
const GROUP_IDS:Record<CalibrationGroup,readonly number[]>={left:[10,11,12,13,14],right:[20,21,22,23,24],both:[10,11,12,13,14,20,21,22,23,24],head:[30,31,32,33]};
const copy=<T>(value:T):T=>structuredClone(value);
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
const joint=(id:number):boolean=>JOINT_SET.has(id);
const zeroPose=():Pose=>Object.fromEntries(CALIBRATION_IDS.map(id=>[id,0]));
const distance=(a:Pose,b:Pose):number=>Math.max(...CALIBRATION_IDS.map(id=>Math.abs(a[id]!-b[id]!)));

export class CalibrationFlow {
 readonly bounds:Bounds;
 state:CalibrationFlowState;
 constructor(initialPose:Pose,bounds:Bounds,options:FlowOptions={}){
  if(!object(bounds)||Object.keys(bounds).length!==CALIBRATION_IDS.length||!CALIBRATION_IDS.every(id=>{
   const range=bounds[id];return range&&finite(range.min)&&finite(range.max)&&range.min<=range.max;
  }))throw new Error('Complete finite coordinate bounds are required');
  this.bounds=copy(bounds);
  const candidateSource=options.candidateSource??(options.candidateTarget?'provided':'simulation');
  if(!['simulation','provided'].includes(candidateSource)||(candidateSource==='provided'&&!options.candidateTarget))throw new Error('A provided candidate requires an explicit target');
  const target=options.candidateTarget??zeroPose();
  if(!this.validPose(initialPose)||!this.validPose(target))throw new Error('Complete bounded coordinate poses are required');
  this.state={phase:'seat',status:'paused',currentPose:copy(initialPose),baseline:null,target:copy(target),candidateSource,
   selectedGroup:'both',selectedJoint:13,motionPlan:null,autoRunning:false,checkpoints:[],confirmed:{},events:[]};
 }
 private validValue(id:number,value:unknown):value is number {
  const range=this.bounds[id];return joint(id)&&finite(value)&&!!range&&value>=range.min&&value<=range.max;
 }
 private validPose(value:unknown):value is Pose {
  return object(value)&&Object.keys(value).length===CALIBRATION_IDS.length&&CALIBRATION_IDS.every(id=>this.validValue(id,value[id]));
 }
 private available():boolean{return this.state.status!=='released'&&this.state.status!=='disconnected';}
 private stationary():boolean{return this.state.status==='paused';}
 private allConfirmed():boolean{return CALIBRATION_IDS.every(id=>this.state.confirmed[id]!==undefined);}
 private phase(next:CalibrationPhase):void{this.state.phase=this.allConfirmed()?'recorded':next;}
 private event(type:FlowEventType,jointId?:number):void {
  const event:FlowEvent={type,sequence:this.state.events.length+1,pose:copy(this.state.currentPose)};
  if(jointId!==undefined)event.jointId=jointId;this.state.events.push(event);
 }
 private halt(type:FlowEventType,status?:CalibrationStatus):void {
  this.state.motionPlan=null;this.state.autoRunning=false;
  this.state.status=status??(this.available()?'paused':this.state.status);this.event(type);
 }
 saveSeat():boolean {
  if(!this.stationary()||this.state.baseline!==null)return false;
  this.state.baseline=copy(this.state.currentPose);this.phase('approach');this.event('seat-saved');return true;
 }
 private candidateDestination():Pose {
  const destination=copy(this.state.currentPose);
  for(const id of GROUP_IDS[this.state.selectedGroup])destination[id]=this.state.target[id]!;
  return destination;
 }
 private startSegment(destination:Pose,kind:MotionKind,candidateFrom:Pose|null=null):boolean {
  if(!this.validPose(destination)||!this.available())return false;
  const from=copy(this.state.currentPose),span=distance(from,destination);
  if(span<=EPSILON)return false;
  const ratio=Math.min(1,MAX_SEGMENT/span),to:Pose={};
  for(const id of CALIBRATION_IDS)to[id]=from[id]!+(destination[id]!-from[id]!)*ratio;
  this.state.motionPlan={kind,from,to,destination:copy(destination),elapsed:0,duration:Math.min(MAX_SEGMENT,span)/SPEED,candidateFrom:candidateFrom&&copy(candidateFrom)};
  this.state.status='moving';this.phase(kind==='approach'?'approach':'review');this.event('segment-started');return true;
 }
 private approach(auto:boolean):boolean {
  if(!this.stationary()||!this.state.baseline)return false;
  const destination=this.candidateDestination();
  if(distance(this.state.currentPose,destination)<=EPSILON){this.state.autoRunning=false;this.phase('review');return false;}
  this.state.autoRunning=auto;return this.startSegment(destination,'approach');
 }
 nextSegment():boolean{return this.approach(false);}
 startAuto():boolean{return this.approach(true);}
 tick(dtSeconds:number):boolean {
  if(!finite(dtSeconds)||dtSeconds<=0||this.state.status!=='moving'||!this.state.motionPlan)return false;
  let remaining=dtSeconds,changed=false;
  while(remaining>0&&this.state.status==='moving'&&this.state.motionPlan){
   const plan=this.state.motionPlan,elapsed=Math.min(remaining,plan.duration-plan.elapsed);
   plan.elapsed+=elapsed;remaining-=elapsed;const t=Math.min(1,plan.elapsed/plan.duration);
   for(const id of CALIBRATION_IDS){
    this.state.currentPose[id]=plan.from[id]!+(plan.to[id]!-plan.from[id]!)*t;
    if(plan.candidateFrom)this.state.target[id]=plan.candidateFrom[id]!+(this.state.currentPose[id]!-plan.from[id]!);
   }
   changed=true;if(t<1)break;
   this.state.currentPose=copy(plan.to);this.state.motionPlan=null;this.state.status='paused';this.event('segment-finished');
   const reached=distance(this.state.currentPose,plan.destination)<=EPSILON;
   if(plan.kind==='approach'){
    if(reached){this.state.autoRunning=false;this.phase('review');}
    else if(this.state.autoRunning)this.startSegment(this.candidateDestination(),'approach');
   }else if((plan.kind==='return-baseline'||plan.kind==='return-checkpoint')&&!reached){this.startSegment(plan.destination,plan.kind);}
   else{this.state.autoRunning=false;this.phase('review');}
  }
  return changed;
 }
 pause():boolean {if(!this.available())return false;this.halt('paused');return true;}
 stop():boolean {this.halt('stopped');return true;}
 release():boolean {this.halt('released','released');return true;}
 disconnect():boolean {this.halt('disconnected','disconnected');return true;}
 reconnect():boolean {if(this.available())return false;this.halt('reconnected','paused');return true;}
 nudge(id:number,delta:number,options:NudgeOptions={}):boolean {
  if(!joint(id)||!finite(delta)||delta===0||Math.abs(delta)>MAX_SEGMENT||!this.available()||!this.state.baseline)return false;
  // A correction always stops approach before using the current stopped pose.
  if(this.state.status==='moving')this.pause();
  const changes:Partial<Record<number,number>>={[id]:delta};
  if(options.mirror&&id<30)changes[id<20?id+10:id-10]=-delta;
  if(options.headLinked&&id===30)changes[31]=delta;
  const destination=copy(this.state.currentPose),candidate=copy(this.state.target);
  for(const [key,value]of Object.entries(changes)){const changedId=Number(key);destination[changedId]=destination[changedId]!+value!;candidate[changedId]=candidate[changedId]!+value!;}
  if(!this.validPose(destination)||!this.validPose(candidate))return false;
  this.state.autoRunning=false;this.event('nudge',id);return this.startSegment(destination,'nudge',this.state.target);
 }
 selectGroup(group:CalibrationGroup):boolean {
  if(!Object.hasOwn(GROUP_IDS,group))return false;
  this.halt('selection');this.state.selectedGroup=group;
  if(!GROUP_IDS[group].includes(this.state.selectedJoint))this.state.selectedJoint=GROUP_IDS[group][0]!;
  return true;
 }
 selectJoint(id:number):boolean {
  if(!joint(id))return false;
  this.halt('selection');this.state.selectedJoint=id;
  if(!GROUP_IDS[this.state.selectedGroup].includes(id))this.state.selectedGroup=id>=30?'head':id<20?'left':'right';
  return true;
 }
 saveCheckpoint():boolean {
  if(!this.stationary()||!this.state.baseline)return false;
  this.state.checkpoints.push(copy(this.state.currentPose));this.event('checkpoint');return true;
 }
 private returnTo(destination:Pose|undefined,kind:'return-baseline'|'return-checkpoint'):boolean {
  if(!destination||!this.available()||!this.validPose(destination))return false;
  this.halt('paused');this.phase('review');
  return distance(this.state.currentPose,destination)<=EPSILON||this.startSegment(destination,kind);
 }
 returnBaseline():boolean{return this.returnTo(this.state.baseline??undefined,'return-baseline');}
 returnLastCheckpoint():boolean{return this.returnTo(this.state.checkpoints.at(-1),'return-checkpoint');}
 confirmJoint(id:number=this.state.selectedJoint):boolean {
  if(!joint(id)||!this.stationary()||!this.state.baseline)return false;
  this.state.confirmed[id]=this.state.currentPose[id]!;this.phase('review');this.event('joint-confirmed',id);return true;
 }
 serialize():FlowArchive{return {format:'letsduck-calibration-flow',version:1,state:copy({...this.state,motionPlan:null})};}
 load(archive:unknown):boolean {
  try{
   if(!object(archive)||archive.format!=='letsduck-calibration-flow'||archive.version!==1||!object(archive.state))return false;
   const s=archive.state;
   if(!this.validPose(s.currentPose)||!this.validPose(s.target)||(s.baseline!==null&&!this.validPose(s.baseline))||
    typeof s.candidateSource!=='string'||!['simulation','provided'].includes(s.candidateSource)||typeof s.phase!=='string'||!['seat','approach','review','recorded'].includes(s.phase)||
    typeof s.status!=='string'||!['paused','moving','released','disconnected'].includes(s.status)||typeof s.autoRunning!=='boolean'||s.motionPlan!==null||
    !finite(s.selectedJoint)||!joint(s.selectedJoint)||typeof s.selectedGroup!=='string'||!Object.hasOwn(GROUP_IDS,s.selectedGroup)||
    !Array.isArray(s.checkpoints)||!s.checkpoints.every(p=>this.validPose(p))||!object(s.confirmed)||!Array.isArray(s.events))return false;
   const selectedGroup=s.selectedGroup as CalibrationGroup;
   if(!GROUP_IDS[selectedGroup].includes(s.selectedJoint)||!Object.entries(s.confirmed).every(([id,value])=>String(Number(id))===id&&this.validValue(Number(id),value)))return false;
   const allConfirmed=Object.keys(s.confirmed).length===CALIBRATION_IDS.length;
   if((s.phase==='recorded')!==allConfirmed||(s.phase==='seat')!==(s.baseline===null)||(s.baseline===null&&(s.checkpoints.length>0||Object.keys(s.confirmed).length>0)))return false;
   const events:FlowEvent[]=[];
   for(const [index,event]of s.events.entries()){
    if(!object(event)||!EVENT_TYPES.includes(event.type as FlowEventType)||event.sequence!==index+1||!this.validPose(event.pose)||
     (event.jointId!==undefined&&(!finite(event.jointId)||!joint(event.jointId))))return false;
    const valid:FlowEvent={type:event.type as FlowEventType,sequence:index+1,pose:copy(event.pose)};
    if(event.jointId!==undefined)valid.jointId=event.jointId as number;events.push(valid);
   }
   const next:CalibrationFlowState={phase:s.phase as CalibrationPhase,status:'paused',currentPose:copy(s.currentPose),baseline:s.baseline===null?null:copy(s.baseline as Pose),target:copy(s.target),candidateSource:s.candidateSource as CandidateSource,
    selectedGroup,selectedJoint:s.selectedJoint,motionPlan:null,autoRunning:false,checkpoints:copy(s.checkpoints as Pose[]),confirmed:copy(s.confirmed as Partial<Record<number,number>>),events};
   this.state=next;this.event('loaded');return true;
  }catch{return false;}
 }
}
