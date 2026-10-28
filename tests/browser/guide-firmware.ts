import {IDS} from '@letsduck/devices';
import {isJsonObject} from '@letsduck/domain';
import type {Motor} from '../../tooling/test/duck-debug-fixture.js';

interface SimulatedHost {state:Record<string,unknown>;motors:Map<number,Motor>}
interface Plan {start:number[];at:number;duration:number;finalSample:number|null}

/** Fake 50 Hz feedback and a 20 raw/s trajectory, used only by isolated browser fixtures. */
export class BrowserGuide {
 private session:string|null=null;private sessionCount=0;
 private phase='inactive';private error='';private target:number[]|null=null;private command:number[];
 private plan:Plan|null=null;private sample=1;private required=0;private sent=0;private acknowledged=0;
 private sampledAt:number;private heartbeatAt=0;private enabled=false;private enableCommand=false;private disarming=false;
 constructor(private readonly host:SimulatedHost,private readonly now:()=>number){this.sampledAt=now();this.command=this.actual();}
 private actual():number[]{return IDS.map(id=>this.host.motors.get(id)!.pos);}
 private send(required=false):void{this.sent++;if(required)this.required=this.sent;}
 private end(error=''):void{
  this.session=null;this.target=null;this.plan=null;this.phase=error?'fault':'inactive';this.error=error;this.enableCommand=false;
  this.disarming=true;this.host.state.mode='off';this.send(true);
 }
 advance():void{
  const now=this.now();
  if(!this.session&&!this.disarming)this.enableCommand=this.enabled=this.host.state.enabled===true;
  if(this.session&&now-this.heartbeatAt>=1000)this.end('guide heartbeat expired');
  while(now-this.sampledAt>=20){
   this.sampledAt+=20;this.sample++;this.acknowledged=this.sent;this.enabled=this.enableCommand;this.disarming=false;
   if(this.enabled)IDS.forEach((id,i)=>{this.host.motors.get(id)!.pos=Math.round(this.command[i]!);});
   if(!this.session)continue;
   if(this.plan&&this.target){
    const p=this.plan,t=p.duration===0?1:Math.min(1,(this.sampledAt-p.at)/p.duration);
    this.command=p.start.map((start,i)=>start+(this.target![i]!-start)*t);
    const firstFinal=t===1&&p.finalSample===null;this.send(firstFinal);
    if(firstFinal)p.finalSample=this.sample;
    if(t===1&&p.finalSample!==null&&this.sample>p.finalSample&&this.acknowledged>=this.required&&this.actual().every((value,i)=>Math.abs(value-this.target![i]!)<=1)){
     this.plan=null;this.phase='holding';
    }
   }else this.send();
  }
  this.host.state.enabled=this.enabled;
 }
 status():Record<string,unknown>{
  this.advance();const age=Math.max(0,this.now()-this.sampledAt);
  return {ok:true,version:1,supported:true,active:this.session!==null,paused:this.phase==='paused',state:this.phase,session_id:this.session,ids:[...IDS],
   actual_raw:this.actual(),target_raw:this.target?[...this.target]:null,raw_mask:0x7fff,feedback_age_ms:age,raw_age_ms:age,
   raw_source:'DQS1_angles_to_raw',imu_ok:this.host.state.imu_ok===true,enabled:this.enabled,sample_seq:this.sample,
   command_seq:this.required,acknowledged_seq:this.acknowledged,sent_seq:this.sent,arming:false,max_delta:10,heartbeat_timeout_ms:1000,
   speed_raw_s:20,position_tolerance_raw:1,error:this.error};
 }
 request(path:string,raw:unknown):Record<string,unknown>{
  this.advance();const body=isJsonObject(raw)?raw:{};
  if(path==='/api/guide/hold'){
   if(this.session||!['off','shadow'].includes(String(this.host.state.mode))||this.enabled||this.host.state.enabled===true)throw Error('disable existing control before guide hold');
   if(this.host.state.imu_ok!==true||this.host.motors.size!==15)throw Error('guide requires complete fresh feedback and IMU');
   this.session='browser-guide-'+(++this.sessionCount);this.target=this.actual();this.command=[...this.target];this.phase='holding';this.error='';this.plan=null;
   this.heartbeatAt=this.now();this.host.state.mode='guide';this.enableCommand=this.enabled=true;this.host.state.enabled=true;
   this.send(true);this.acknowledged=this.required;this.sample++;this.sampledAt=this.now();
   return this.status();
  }
  if(!this.session||body.session_id!==this.session)throw Error('guide session_id does not match the active session');
  if(path==='/api/guide/release'){this.end();return this.status();}
  if(this.host.state.imu_ok!==true)throw Error('guide feedback IMU unavailable');
  if(path==='/api/guide/step'){
   if(this.phase==='moving')throw Error('pause the moving guide before another step');
   const deltas=body.deltas;if(!Array.isArray(deltas)||deltas.length<1||deltas.length>14)throw Error('invalid guide deltas');
   const seen=new Set<number>(),actual=this.actual(),target=[...this.target!];
   for(const entry of deltas){
    if(!isJsonObject(entry)||Object.keys(entry).length!==2||typeof entry.id!=='number'||!IDS.includes(entry.id)||entry.id===34||seen.has(entry.id)||typeof entry.delta!=='number'||!Number.isInteger(entry.delta)||Math.abs(entry.delta)<1||Math.abs(entry.delta)>10)throw Error('invalid referenced guide delta');
    seen.add(entry.id);const i=IDS.indexOf(entry.id),value=actual[i]!+entry.delta;if(value<0||value>4095)throw Error('guide target exceeds encoder range');target[i]=value;
   }
   this.plan={start:[...this.command],at:this.now(),duration:Math.max(...target.map((value,i)=>Math.abs(value-this.command[i]!)))/20*1000,finalSample:null};
   this.target=target;this.phase='moving';this.heartbeatAt=this.now();this.send(true);
  }else if(path==='/api/guide/pause'){
   this.target=this.actual();this.command=[...this.target];this.plan=null;this.phase='paused';this.heartbeatAt=this.now();this.send(true);
  }else if(path==='/api/guide/heartbeat')this.heartbeatAt=this.now();
  else throw Error('unknown browser guide endpoint');
  return this.status();
 }
 get active():boolean{return this.session!==null;}
}
