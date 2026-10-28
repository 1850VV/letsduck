import type {DebugAction} from './types.js';

export const GUIDE_IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34] as const;
export type RawPose=Record<number,number>;
export interface RawDelta {id:number;delta:number}
export interface RawCapture {raw:RawPose;sampleSeq:number;capturedAt:number;rawSource:'DQS1_angles_to_raw'}
export interface RawCandidate {raw:number;sampleSeq:number;capturedAt:number}
export interface DeviceIdentity {board:string}
export interface DeviceTimers {now():number;setTimeout(fn:()=>void,ms:number):unknown;clearTimeout(handle:unknown):void}
export interface GuideFeedback {
 ok:boolean;version:number;supported:boolean;active:boolean;paused:boolean;state:string;session_id:string|null;
 ids:number[];actual_raw:number[]|null;target_raw:number[]|null;raw_mask:number;feedback_age_ms:number|null;raw_age_ms:number|null;
 imu_ok:boolean;sample_seq:number;command_seq:number;acknowledged_seq:number;raw_source:string;board:string|null;enabled:boolean;arming:boolean;error:string;
}
export interface DeviceEvent {type:string;at:number;sampleSeq:number|null;jointId?:number}
export interface ReadonlyDeviceArchive {
 format:'letsduck-device-calibration';version:1;source:'device'|'synthetic';deviceIdentity:DeviceIdentity|null;
 baseline:RawCapture|null;current:RawCapture|null;checkpoints:RawCapture[];candidates:Partial<Record<number,RawCandidate>>;events:DeviceEvent[];
}
export interface CalibrationDeviceState {
 status:'idle'|'holding'|'moving'|'paused'|'released'|'disconnected'|'error';busy:boolean;autoRunning:boolean;autoSteps:number;
 sessionId:string|null;feedback:GuideFeedback|null;current:RawCapture|null;baseline:RawCapture|null;checkpoints:RawCapture[];
 candidates:Partial<Record<number,RawCandidate>>;deviceIdentity:DeviceIdentity|null;selectedGroup:string;error:string;events:DeviceEvent[];readonlyArchive:ReadonlyDeviceArchive|null;
 previousArchives:ReadonlyDeviceArchive[];returnReached:boolean|null;returnRemainingRaw:number|null;
}
export interface CalibrationDeviceOptions {deviceIdentity?:DeviceIdentity;timers?:DeviceTimers;onChange?:()=>void;arrivalTimeoutMs?:number}

const RAW_SOURCE='DQS1_angles_to_raw',FULL_MASK=0x7fff,FRESH_MS=150;
const copy=<T>(value:T):T=>structuredClone(value);
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
const raw=(value:unknown):value is number=>finite(value)&&Number.isInteger(value)&&value>=0&&value<=4095;
const seq=(value:unknown):value is number=>finite(value)&&Number.isInteger(value)&&value>=0;
const editable=(id:number)=>GUIDE_IDS.includes(id as typeof GUIDE_IDS[number])&&id!==34;
const rawPose=(value:unknown):value is RawPose=>object(value)&&Object.keys(value).length===15&&GUIDE_IDS.every(id=>raw(value[id]));
const timers:DeviceTimers={now:()=>Date.now(),setTimeout:(fn,ms)=>globalThis.setTimeout(fn,ms),clearTimeout:handle=>globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>)};
function feedback(value:Record<string,unknown>):GuideFeedback {
 if(value.ok!==true||typeof value.supported!=='boolean')throw Error('运行端反馈格式无效');
 if(value.supported===false)return {ok:true,version:0,supported:false,active:false,paused:true,state:'unavailable',session_id:null,ids:[],actual_raw:null,target_raw:null,raw_mask:0,feedback_age_ms:null,raw_age_ms:null,imu_ok:false,sample_seq:0,command_seq:0,acknowledged_seq:0,raw_source:'',board:typeof value.board==='string'?value.board:null,enabled:false,arming:false,error:typeof value.error==='string'?value.error:'运行端不支持坐姿保持'};
 const array=(v:unknown):v is number[]=>Array.isArray(v)&&v.length===15&&v.every(raw);
 const ids=value.ids;
 if(value.version!==1||!Array.isArray(ids)||ids.length!==15||!GUIDE_IDS.every((id,i)=>ids[i]===id)||
  (value.actual_raw!==null&&!array(value.actual_raw))||(value.target_raw!==null&&!array(value.target_raw))||
  !seq(value.sample_seq)||!seq(value.command_seq)||!seq(value.acknowledged_seq)||!seq(value.raw_mask)||
  (value.raw_age_ms!==null&&(!finite(value.raw_age_ms)||value.raw_age_ms<0))||(value.feedback_age_ms!==null&&(!finite(value.feedback_age_ms)||value.feedback_age_ms<0))||
  typeof value.active!=='boolean'||typeof value.paused!=='boolean'||typeof value.enabled!=='boolean'||typeof value.arming!=='boolean'||typeof value.imu_ok!=='boolean'||
  typeof value.state!=='string'||!['inactive','holding','paused','moving','fault'].includes(value.state)||(value.session_id!==null&&typeof value.session_id!=='string'))throw Error('运行端反馈格式无效');
 return {ok:true,version:1,supported:true,active:value.active,paused:value.paused,state:String(value.state),session_id:value.session_id as string|null,
  ids:[...ids] as number[],actual_raw:value.actual_raw===null?null:[...value.actual_raw as number[]],target_raw:value.target_raw===null?null:[...value.target_raw as number[]],raw_mask:value.raw_mask,
  feedback_age_ms:value.feedback_age_ms as number|null,raw_age_ms:value.raw_age_ms as number|null,imu_ok:value.imu_ok,sample_seq:value.sample_seq,command_seq:value.command_seq,acknowledged_seq:value.acknowledged_seq,
  raw_source:typeof value.raw_source==='string'?value.raw_source:'',board:typeof value.board==='string'?value.board:null,enabled:value.enabled,arming:value.arming,error:typeof value.error==='string'?value.error:''};
}

/** Owns a temporary raw-feedback hold; never computes encoder positions from model angles. */
export class CalibrationDevice {
 readonly state:CalibrationDeviceState;
 private readonly clock:DeviceTimers;
 private readonly timeout:number;
 private readonly notify:()=>void;
 private epoch=0;private run=0;private operation=0;private closed=false;private seenAt=0;
 private heartbeat:unknown=null;
 private ending:Promise<boolean>|null=null;
 private sleepers=new Map<unknown,(active:boolean)=>void>();
 constructor(private readonly action:DebugAction,options:CalibrationDeviceOptions={}){
  if(options.deviceIdentity&&(!options.deviceIdentity.board||typeof options.deviceIdentity.board!=='string'))throw Error('设备身份无效');
  this.clock=options.timers??timers;this.timeout=options.arrivalTimeoutMs??2000;
  if(!finite(this.timeout)||this.timeout<=0)throw Error('到位超时无效');this.notify=options.onChange??(()=>{});
  this.state={status:'idle',busy:false,autoRunning:false,autoSteps:0,sessionId:null,feedback:null,current:null,baseline:null,checkpoints:[],candidates:{},deviceIdentity:options.deviceIdentity?copy(options.deviceIdentity):null,selectedGroup:'single',error:'',events:[],readonlyArchive:null,previousArchives:[],returnReached:null,returnRemainingRaw:null};
 }
 private emit(type:string,jointId?:number):void {
  const event:DeviceEvent={type,at:this.clock.now(),sampleSeq:this.state.current?.sampleSeq??null};if(jointId!==undefined)event.jointId=jointId;this.state.events.push(event);this.notify();
 }
 private frameFresh(f:GuideFeedback):boolean{return f.supported&&f.raw_source===RAW_SOURCE&&f.actual_raw!==null&&f.raw_mask===FULL_MASK&&f.imu_ok&&finite(f.raw_age_ms)&&finite(f.feedback_age_ms)&&f.raw_age_ms<FRESH_MS&&f.feedback_age_ms<FRESH_MS;}
 private fresh():boolean {const f=this.state.feedback;if(!f||!this.frameFresh(f))return false;const elapsed=this.clock.now()-this.seenAt;return elapsed>=0&&f.raw_age_ms!+elapsed<FRESH_MS&&f.feedback_age_ms!+elapsed<FRESH_MS;}
 private sameSession(epoch:number,session:string):boolean{return !this.closed&&this.epoch===epoch&&this.state.sessionId===session;}
 private ingest(f:GuideFeedback,newEpoch=false):void {
  if(this.state.deviceIdentity&&f.board!==this.state.deviceIdentity.board)throw Error('设备身份发生变化');
  if(f.supported&&!f.board)throw Error('缺少设备身份');
  if(!newEpoch&&this.state.feedback&&this.state.feedback.sample_seq>f.sample_seq)return;
  if(f.board&&!this.state.deviceIdentity)this.state.deviceIdentity={board:f.board};
  this.state.feedback=copy(f);this.seenAt=this.clock.now();
  if(this.frameFresh(f))this.state.current={raw:Object.fromEntries(GUIDE_IDS.map((id,i)=>[id,f.actual_raw![i]!])),sampleSeq:f.sample_seq,capturedAt:this.clock.now(),rawSource:RAW_SOURCE};
  this.notify();
 }
 private cancelRun():void {this.run++;this.state.autoRunning=false;for(const [handle,resolve]of this.sleepers){this.clock.clearTimeout(handle);resolve(false);}this.sleepers.clear();}
 private sleep(ms:number):Promise<boolean>{return new Promise(resolve=>{const handle=this.clock.setTimeout(()=>{this.sleepers.delete(handle);resolve(true);},ms);this.sleepers.set(handle,resolve);});}
 private stopHeartbeat():void {if(this.heartbeat!==null)this.clock.clearTimeout(this.heartbeat);this.heartbeat=null;}
 private startHeartbeat(epoch:number,session:string):void {
  this.stopHeartbeat();this.heartbeat=this.clock.setTimeout(()=>{this.heartbeat=null;void(async()=>{
   if(!this.sameSession(epoch,session))return;
   try{const f=feedback(await this.action('guide-heartbeat',{session_id:session}));if(!this.sameSession(epoch,session))return;
    if(!f.active||f.session_id!==session||!f.enabled||f.arming||!this.frameFresh(f))throw Error('保持会话或实时反馈已失效');this.ingest(f);
    this.startHeartbeat(epoch,session);
   }catch(error){if(this.sameSession(epoch,session)){const message=error instanceof Error?error.message:'保持心跳失败';await this.end('error');this.state.error=message;this.notify();}}
  })();},200);
 }
 async refresh():Promise<boolean>{
  if(this.closed)return false;const epoch=this.epoch,session=this.state.sessionId;
  try{const f=feedback(await this.action('guide-status',{}));if(this.closed||epoch!==this.epoch)return false;
   if(session&&(!f.active||f.session_id!==session||!f.enabled||f.arming))throw Error('保持会话已失效');this.ingest(f,session===null);return true;
  }catch(error){if(epoch===this.epoch){if(session)await this.end('error');this.state.error=error instanceof Error?error.message:'读取失败';this.notify();}return false;}
 }
 async hold():Promise<boolean>{
  if(this.closed||this.state.busy||this.state.sessionId)return false;
  const previous=this.state.baseline?this.serialize():null;
  const epoch=++this.epoch,operation=++this.operation;this.cancelRun();this.state.busy=true;this.state.error='';this.notify();
  try{
   const observed=feedback(await this.action('guide-status',{}));if(this.closed||epoch!==this.epoch)return false;this.ingest(observed,true);
   if(!this.frameFresh(observed))throw Error(observed.error||'需要完整新鲜的十五路反馈');
   const result=await this.action('guide-hold',{}),f=feedback(result);
   if(this.closed||epoch!==this.epoch){if(f.active&&f.session_id)await this.action('guide-release',{session_id:f.session_id}).catch(()=>{});return false;}
   if(!f.active||!f.session_id||!f.enabled||f.arming||!this.frameFresh(f)||!['holding','paused'].includes(f.state)){
    if(f.active&&f.session_id)await this.action('guide-release',{session_id:f.session_id}).catch(()=>{});throw Error('保持回执缺少完整实时反馈');
   }
   this.ingest(f);if(previous){this.state.previousArchives.push(previous);this.state.readonlyArchive=copy(previous);}
   this.state.candidates={};this.state.checkpoints=[];this.state.events=[];this.state.returnReached=null;this.state.returnRemainingRaw=null;
   this.state.sessionId=f.session_id;this.state.baseline=copy(this.state.current);this.state.status='holding';this.startHeartbeat(epoch,f.session_id);this.emit('hold');return true;
  }catch(error){if(epoch===this.epoch){this.state.status='error';this.state.error=error instanceof Error?error.message:'保持失败';this.notify();}return false;
  }finally{if(operation===this.operation){this.state.busy=false;this.notify();}}
 }
 private ready():boolean{return !this.closed&&!this.state.busy&&!!this.state.sessionId&&!this.state.error&&['holding','paused'].includes(this.state.status);}
 private validDeltas(deltas:readonly RawDelta[]):boolean {
  return Array.isArray(deltas)&&deltas.length>0&&deltas.length<=14&&new Set(deltas.map(d=>d.id)).size===deltas.length&&deltas.every(d=>editable(d.id)&&Number.isInteger(d.delta)&&d.delta!==0&&Math.abs(d.delta)<=5&&!!this.state.current&&raw(this.state.current.raw[d.id]!+d.delta));
 }
 private async arrivedStep(deltas:readonly RawDelta[],epoch:number,run:number,session:string):Promise<boolean>{
  if(!this.fresh()){
   const observed=feedback(await this.action('guide-status',{}));if(!this.sameSession(epoch,session)||run!==this.run)return false;
   if(!observed.active||observed.session_id!==session||!observed.enabled||observed.arming||!this.frameFresh(observed)||!['holding','paused'].includes(observed.state))throw Error('实际反馈已过期');this.ingest(observed);
  }
  const before=this.state.feedback!.sample_seq;
  let f=feedback(await this.action('guide-step',{session_id:session,deltas:copy(deltas)}));
  if(!this.sameSession(epoch,session)||run!==this.run)return false;
  const expected=f.target_raw&&[...f.target_raw];if(!expected)throw Error('缺少运动目标回执');let required=f.command_seq;const deadline=this.clock.now()+this.timeout;
  for(;;){
   if(!this.sameSession(epoch,session)||run!==this.run)return false;
   if(!f.active||f.session_id!==session||!f.enabled||f.arming||!this.frameFresh(f)||f.state==='fault')throw Error(f.error||'运动期间实际反馈失效');
   if(!f.target_raw||!expected.every((v,i)=>v===f.target_raw![i]))throw Error('运动目标回执发生变化');required=Math.max(required,f.command_seq);this.ingest(f);
   if(['holding','paused'].includes(f.state)&&f.sample_seq>before&&f.acknowledged_seq>=required&&f.actual_raw!.every((v,i)=>Math.abs(v-expected[i]!)<=1))return true;
   if(this.clock.now()>=deadline)throw Error('等待实际到位反馈超时');
   if(!await this.sleep(Math.min(50,deadline-this.clock.now())))return false;
   if(!this.sameSession(epoch,session)||run!==this.run)return false;
   f=feedback(await this.action('guide-status',{}));
  }
 }
 private async movement(next:(index:number)=>readonly RawDelta[],count:number,automatic:boolean):Promise<boolean>{
  if(!this.ready())return false;const epoch=this.epoch,session=this.state.sessionId!,run=++this.run,operation=++this.operation;
  this.state.busy=true;this.state.autoRunning=automatic;this.state.autoSteps=0;this.state.returnReached=null;this.state.returnRemainingRaw=null;this.state.status='moving';this.notify();
  try{for(let i=0;i<count;i++){
    if(!this.sameSession(epoch,session)||run!==this.run)return false;const deltas=next(i);if(!deltas.length)break;
    if(!this.validDeltas(deltas))throw Error('微调超出单段范围');if(!await this.arrivedStep(deltas,epoch,run,session))return false;
    this.state.autoSteps++;this.notify();
   }
   if(!this.sameSession(epoch,session)||run!==this.run)return false;this.state.status='paused';this.state.autoRunning=false;this.emit('segment-complete');return true;
  }catch(error){if(this.sameSession(epoch,session)&&run===this.run){const message=error instanceof Error?error.message:'微调失败';await this.pause();this.state.error=message;this.state.status='error';this.emit('motion-error');}return false;
  }finally{if(operation===this.operation){this.state.busy=false;this.state.autoRunning=false;this.notify();}}
 }
 step(deltas:readonly RawDelta[]):Promise<boolean>{if(!this.ready()||!this.validDeltas(deltas))return Promise.resolve(false);const frozen=copy(deltas);return this.movement(()=>frozen,1,false);}
 startAuto(deltas:readonly RawDelta[],count=10):Promise<boolean>{if(!this.ready()||!this.validDeltas(deltas)||!Number.isInteger(count)||count<1||count>10)return Promise.resolve(false);const frozen=copy(deltas);return this.movement(()=>frozen,count,true);}
 async pause():Promise<boolean>{
  this.cancelRun();const session=this.state.sessionId,epoch=this.epoch,operation=++this.operation;
  if(!session){this.epoch++;this.state.busy=false;if(!this.closed)this.state.status='paused';this.notify();return false;}
  this.state.busy=true;this.notify();
  try{const f=feedback(await this.action('guide-pause',{session_id:session}));if(!this.sameSession(epoch,session))return false;
   if(!f.active||f.session_id!==session||!this.frameFresh(f)||!f.enabled||f.arming)throw Error('暂停保持反馈无效');this.ingest(f);this.state.status=this.state.error?'error':'paused';this.emit('pause');return true;
  }catch(error){if(this.sameSession(epoch,session)){this.state.status='error';this.state.error=error instanceof Error?error.message:'暂停保持失败';this.notify();}return false;
  }finally{if(operation===this.operation){this.state.busy=false;this.notify();}}
 }
 async selectGroup(group:string):Promise<boolean>{if(!['single','mirror','left','right','both','head'].includes(group))return false;this.state.selectedGroup=group;if(this.state.sessionId)return this.pause();this.cancelRun();this.notify();return true;}
 private async end(status:'released'|'disconnected'|'error'):Promise<boolean>{
  if(this.ending)return this.ending;
  const session=this.state.sessionId,before=this.state.feedback?.sample_seq??-1,epoch=++this.epoch;
  this.operation++;this.cancelRun();this.stopHeartbeat();this.state.sessionId=null;
  if(!session){this.state.busy=false;if(this.state.status==='error')return false;this.state.status=status;this.notify();return true;}
  this.state.busy=true;this.state.status=status==='released'?'paused':status;this.notify();
  const pending=(async()=>{try{
   let f=feedback(await this.action('guide-release',{session_id:session}));const deadline=this.clock.now()+this.timeout;
   for(;;){
    if(epoch!==this.epoch)return false;this.ingest(f);
    if(!f.active&&!f.enabled&&!f.arming&&f.sample_seq>before&&finite(f.feedback_age_ms)&&f.feedback_age_ms<FRESH_MS){this.state.status=status;this.emit(status);return true;}
    if(this.clock.now()>=deadline)throw Error('卸载已请求，实物状态未确认');
    if(!await this.sleep(Math.min(50,deadline-this.clock.now())))return false;
    if(epoch!==this.epoch)return false;f=feedback(await this.action('guide-status',{}));
   }
  }catch(error){this.state.status='error';this.state.error=error instanceof Error?error.message:'卸载已请求，实物状态未确认';this.notify();return false;
  }finally{if(epoch===this.epoch){this.state.busy=false;this.notify();}}})();
  this.ending=pending;try{return await pending;}finally{if(this.ending===pending)this.ending=null;}
 }
 release():Promise<boolean>{return this.end('released');}
 disconnect():Promise<boolean>{return this.end('disconnected');}
 async reconnect():Promise<boolean>{if(this.closed||this.state.sessionId)return false;const ok=await this.refresh();if(ok){this.state.status='idle';this.notify();}return ok;}
 async close():Promise<boolean>{this.closed=true;return this.end('released');}
 pageHidden():Promise<boolean>{return this.release();}
 private recordable():boolean{return !this.state.busy&&!this.state.autoRunning&&!!this.state.sessionId&&!this.state.error&&['holding','paused'].includes(this.state.status)&&this.fresh()&&['holding','paused'].includes(this.state.feedback!.state);}
 recordCandidate(id:number):boolean {if(!editable(id)||!this.recordable()||!this.state.current)return false;const c=this.state.current;this.state.candidates[id]={raw:c.raw[id]!,sampleSeq:c.sampleSeq,capturedAt:c.capturedAt};this.emit('candidate-recorded',id);return true;}
 saveCheckpoint():boolean{if(!this.recordable()||!this.state.current)return false;this.state.checkpoints.push(copy(this.state.current));this.emit('checkpoint');return true;}
 private async returnTo(capture:RawCapture|null|undefined):Promise<boolean>{
  if(!capture||!this.ready())return Promise.resolve(false);const saved=copy(capture.raw);
  const result=await this.movement(()=>GUIDE_IDS.filter(id=>id!==34).flatMap(id=>{const delta=saved[id]!-this.state.current!.raw[id]!;return delta?[{id,delta:Math.sign(delta)*Math.min(5,Math.abs(delta))}]:[];}),10,true);
  if(this.state.current){const remaining=Math.max(...GUIDE_IDS.filter(id=>id!==34).map(id=>Math.abs(saved[id]!-this.state.current!.raw[id]!)));this.state.returnRemainingRaw=remaining;this.state.returnReached=remaining<=1;this.notify();}return result;
 }
 returnBaseline():Promise<boolean>{return this.returnTo(this.state.baseline);}
 returnLastCheckpoint():Promise<boolean>{return this.returnTo(this.state.checkpoints.at(-1));}
 serialize():ReadonlyDeviceArchive{return {format:'letsduck-device-calibration',version:1,source:'device',deviceIdentity:copy(this.state.deviceIdentity),baseline:copy(this.state.baseline),current:copy(this.state.current),checkpoints:copy(this.state.checkpoints),candidates:copy(this.state.candidates),events:copy(this.state.events)};}
 serializePrevious(index=this.state.previousArchives.length-1):ReadonlyDeviceArchive|null{return this.state.previousArchives[index]?copy(this.state.previousArchives[index]!):null;}
 loadReadonly(value:unknown):boolean {
  const capture=(v:unknown):v is RawCapture=>object(v)&&rawPose(v.raw)&&seq(v.sampleSeq)&&finite(v.capturedAt)&&v.rawSource===RAW_SOURCE;
  if(!object(value)||value.format!=='letsduck-device-calibration'||value.version!==1||typeof value.source!=='string'||!['device','synthetic'].includes(value.source)||
   (value.deviceIdentity!==null&&(!object(value.deviceIdentity)||typeof value.deviceIdentity.board!=='string'||!value.deviceIdentity.board))||
   (value.baseline!==null&&!capture(value.baseline))||(value.current!==null&&!capture(value.current))||!Array.isArray(value.checkpoints)||!value.checkpoints.every(capture)||!object(value.candidates)||!Array.isArray(value.events))return false;
  if(!Object.entries(value.candidates).every(([id,c])=>String(Number(id))===id&&editable(Number(id))&&object(c)&&raw(c.raw)&&seq(c.sampleSeq)&&finite(c.capturedAt)))return false;
  if(!value.events.every(e=>object(e)&&typeof e.type==='string'&&finite(e.at)&&(e.sampleSeq===null||seq(e.sampleSeq))&&(e.jointId===undefined||(finite(e.jointId)&&editable(e.jointId)))))return false;
  if(value.source==='device'&&!value.deviceIdentity&&(value.baseline||value.current||value.checkpoints.length||Object.keys(value.candidates).length))return false;
  this.state.readonlyArchive=copy(value as unknown as ReadonlyDeviceArchive);this.notify();return true;
 }
}
