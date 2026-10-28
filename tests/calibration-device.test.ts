import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {CalibrationDevice as Device,DeviceTimers,RawDelta} from '../frontend/debug/calibration-device.js';
let api:typeof import('../frontend/debug/calibration-device.js')|null=null;
try{api=await import('../frontend/debug/calibration-device.js');}catch(error:unknown){if(!(error instanceof Error)||!('code'in error)||error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34];
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
class Clock implements DeviceTimers {
 time=0;sequence=0;tasks=new Map<number,{at:number;fn:()=>void}>();now=()=>this.time;
 setTimeout=(fn:()=>void,ms:number):unknown=>{const id=++this.sequence;this.tasks.set(id,{at:this.time+ms,fn});return id;};
 clearTimeout=(id:unknown)=>{this.tasks.delete(id as number);};
 async advance(ms:number){const end=this.time+ms;await flush();for(;;){const next=[...this.tasks.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;this.time=next[1].at;this.tasks.delete(next[0]);next[1].fn();await flush();}this.time=end;await flush();}
}
class Runtime {
 actual=IDS.map(id=>2000+id);target=[...this.actual];active=false;session='';seq=0;sample=1;arrive=true;age=10;mask=0x7fff;supported=true;calls:{action:string;body:Record<string,unknown>}[]=[];
 pendingHold:((value:Record<string,unknown>)=>void)|null=null;deferHold=false;
 feedback():Record<string,unknown>{return {ok:true,version:1,supported:this.supported,active:this.active,paused:true,state:this.active?(this.actual.every((v,i)=>v===this.target[i])?'holding':'moving'):'inactive',session_id:this.active?this.session:null,ids:IDS,actual_raw:[...this.actual],target_raw:[...this.target],raw_mask:this.mask,feedback_age_ms:this.age,raw_age_ms:this.age,imu_ok:true,sample_seq:this.sample,command_seq:this.seq,acknowledged_seq:this.seq,raw_source:'DQS1_angles_to_raw',max_delta:10,heartbeat_timeout_ms:1000,arming:false,enabled:this.active,error:'',board:'uno-test'};}
 action=async(action:string,body:Record<string,unknown>={}):Promise<Record<string,unknown>>=>{
  this.calls.push({action,body:structuredClone(body)});
  if(action==='guide-status'){if(this.arrive&&this.active){this.actual=[...this.target];this.sample++;}return this.feedback();}
  if(action==='guide-hold'){this.active=true;this.session='session-'+(++this.seq);this.target=[...this.actual];this.sample++;if(this.deferHold)return new Promise(resolve=>{this.pendingHold=resolve;});return this.feedback();}
  if(body.session_id!==this.session)throw Error('old session');
  if(action==='guide-step'){for(const {id,delta}of body.deltas as RawDelta[])this.target[IDS.indexOf(id)]=this.actual[IDS.indexOf(id)]!+delta;this.seq++;}
  if(action==='guide-pause'){this.target=[...this.actual];this.sample++;}
  if(action==='guide-release'){this.active=false;this.target=[...this.actual];this.sample++;}
  return this.feedback();
 };
}
function setup(){assert.equal(typeof api?.CalibrationDevice,'function','CalibrationDevice must implement real-feedback calibration');const clock=new Clock(),rt=new Runtime(),device=new api!.CalibrationDevice(rt.action,{timers:clock,deviceIdentity:{board:'uno-test'},arrivalTimeoutMs:300});return {clock,rt,device};}
async function held(){const h=setup();assert.equal(await h.device.hold(),true);return h;}
async function stepDone(device:Device,clock:Clock,deltas:RawDelta[]){const result=device.step(deltas);await clock.advance(100);assert.equal(await result,true);}

test('inspection is read-only and hold captures measured fifteen raw values with an explicit session',async()=>{
 const {device,rt}=setup();assert.equal(await device.refresh(),true);assert.deepEqual(rt.calls.map(c=>c.action),['guide-status']);assert.equal(device.state.sessionId,null);
 assert.equal(await device.hold(),true);assert.equal(device.state.baseline!.raw[12],2012);assert.equal(device.state.current!.raw[34],2034);assert.equal(device.state.baseline!.rawSource,'DQS1_angles_to_raw');assert.equal(device.state.sessionId,'session-1');assert.deepEqual(device.state.candidates,{});await device.close();
});

test('stale or incomplete actual feedback cannot arm a hold or become a fabricated baseline',async()=>{
 for(const mutate of [(rt:Runtime)=>{rt.age=150;},(rt:Runtime)=>{rt.mask=0x3fff;},(rt:Runtime)=>{rt.supported=false;}]){const h=setup();mutate(h.rt);assert.equal(await h.device.hold(),false);assert.equal(h.device.state.baseline,null);assert.equal(h.device.state.sessionId,null);await h.device.close();}
});

test('a step waits for fresh arrived feedback and never uses its unexecuted target as actual',async()=>{
 const {device,rt,clock}=await held();const pending=device.step([{id:12,delta:5}]);await flush();
 assert.equal(device.state.current!.raw[12],2012);assert.equal(device.state.busy,true);assert.equal(device.recordCandidate(12),false);assert.equal(await device.step([{id:12,delta:1}]),false);
 await clock.advance(100);assert.equal(await pending,true);assert.equal(device.state.current!.raw[12],2017);assert.equal(device.recordCandidate(12),true);assert.equal(device.state.candidates[12]!.raw,2017);
 assert.equal(rt.calls.filter(c=>c.action==='guide-step').length,1);for(const c of rt.calls.filter(c=>!['guide-status','guide-hold'].includes(c.action)))assert.equal(c.body.session_id,'session-1');await device.close();
});

test('an explicit automatic segment performs at most ten five-raw steps and stops for observation',async()=>{
 const {device,rt,clock}=await held();const result=device.startAuto([{id:12,delta:5},{id:22,delta:-5}],10);await clock.advance(1000);assert.equal(await result,true);
 assert.equal(rt.calls.filter(c=>c.action==='guide-step').length,10);assert.equal(device.state.current!.raw[12],2062);assert.equal(device.state.current!.raw[22],1972);assert.equal(device.state.autoRunning,false);assert.deepEqual(device.state.candidates,{});
 await clock.advance(1000);assert.equal(rt.calls.filter(c=>c.action==='guide-step').length,10);assert.equal(await device.startAuto([{id:12,delta:1}],11),false);await device.close();
});

test('pause holds measured current and cancels the rest of an automatic segment',async()=>{
 const {device,rt,clock}=await held();rt.arrive=false;const run=device.startAuto([{id:12,delta:5}],10);await flush();assert.equal(rt.target[2],2017);rt.actual[2]=2014;rt.sample++;
 assert.equal(await device.pause(),true);await clock.advance(100);assert.equal(await run,false);assert.equal(device.state.current!.raw[12],2014);assert.equal(rt.target[2],2014);assert.equal(device.state.autoRunning,false);assert.equal(rt.calls.filter(c=>c.action==='guide-step').length,1);await device.close();
});

test('arrival timeout sends pause and blocks further movement until a new explicit session',async()=>{
 const {device,rt,clock}=await held();rt.arrive=false;const run=device.startAuto([{id:12,delta:5}],10);await clock.advance(500);assert.equal(await run,false);
 assert.match(device.state.error,/到位|反馈|timeout/i);assert.equal(rt.calls.filter(c=>c.action==='guide-step').length,1);assert.ok(rt.calls.some(c=>c.action==='guide-pause'));assert.equal(await device.step([{id:12,delta:1}]),false);await device.close();
});

test('heartbeat runs every two hundred milliseconds and closing releases only the owned session',async()=>{
 const {device,rt,clock}=await held();await clock.advance(600);assert.equal(rt.calls.filter(c=>c.action==='guide-heartbeat').length,3);
 assert.equal(await device.pageHidden(),true);assert.equal(rt.active,false);assert.equal(device.state.sessionId,null);const before=rt.calls.length;await clock.advance(2000);assert.equal(rt.calls.length,before);await device.close();
});

test('a delayed hold response cannot resurrect a closed controller session',async()=>{
 const {device,rt}=setup();rt.deferHold=true;const pending=device.hold();await flush();await device.close();const old=rt.feedback();rt.pendingHold!(old);await flush();assert.equal(await pending,false);assert.equal(device.state.sessionId,null);assert.equal(rt.active,false);assert.equal(device.state.status,'released');
});

test('raw limits, duplicate IDs and mouth movement reject before a step request',async()=>{
 const {device,rt}=await held();const before=rt.calls.length;
 for(const deltas of [[{id:12,delta:6}],[{id:12,delta:.5}],[{id:12,delta:0}],[{id:34,delta:1}],[{id:12,delta:1},{id:12,delta:-1}]])assert.equal(await device.step(deltas),false);
 assert.equal(rt.calls.length,before);await device.close();
});

test('saved feedback checkpoints return in arrived bounded steps and never turn a file into an active session',async()=>{
 const {device,clock,rt}=await held();assert.equal(device.saveCheckpoint(),true);await stepDone(device,clock,[{id:12,delta:5}]);assert.equal(device.recordCandidate(12),true);
 const back=device.returnBaseline();await clock.advance(200);assert.equal(await back,true);assert.equal(device.state.current!.raw[12],2012);assert.equal(device.state.candidates[12]!.raw,2017);
 const archive=device.serialize(),capture=structuredClone(device.state.current),calls=rt.calls.length;assert.equal(device.loadReadonly(archive),true);assert.deepEqual(device.state.current,capture);assert.equal(rt.calls.length,calls);assert.ok(device.state.readonlyArchive);
 const bad=structuredClone(archive);bad.current!.raw[12]=Infinity;assert.equal(device.loadReadonly(bad),false);assert.deepEqual(device.state.current,capture);await device.close();
});

test('release waits for a new disabled feedback sample and reports an unconfirmed disarm as an error',async()=>{
 for(const stuck of [false,true]){
  assert.ok(api);const clock=new Clock(),rt=new Runtime();let released=false;
  const action=async(name:string,body:Record<string,unknown>={})=>{const f=await rt.action(name,body);if(name==='guide-release'){released=true;f.enabled=true;f.sample_seq=(f.sample_seq as number)-1;}else if(name==='guide-status'&&released){f.sample_seq=++rt.sample;if(stuck)f.enabled=true;}return f;};
  const d=new api.CalibrationDevice(action,{timers:clock,arrivalTimeoutMs:300});assert.equal(await d.hold(),true);const pending=d.release();await flush();assert.notEqual(d.state.status,'released');await clock.advance(500);
  assert.equal(await pending,!stuck);if(stuck){assert.equal(d.state.status,'error');assert.equal(d.state.error,'卸载已请求，实物状态未确认');}else assert.equal(d.state.status,'released');
  await d.close();
 }
});

test('a new hold archives old session records and never mixes them into the new seated baseline',async()=>{
 const {device,rt}=await held();device.recordCandidate(12);device.saveCheckpoint();const old=device.serialize();await device.release();rt.actual[2]=2050;rt.target=[...rt.actual];
 assert.equal(await device.hold(),true);assert.equal(device.state.baseline!.raw[12],2050);assert.deepEqual(device.state.candidates,{});assert.deepEqual(device.state.checkpoints,[]);
 assert.deepEqual(device.serializePrevious()!.candidates,old.candidates);assert.equal(device.state.previousArchives.length,1);assert.deepEqual(device.state.readonlyArchive!.checkpoints,old.checkpoints);await device.close();
});

test('a bounded return exposes its remaining distance rather than claiming the baseline was reached',async()=>{
 const {device,clock}=await held();let p=device.startAuto([{id:12,delta:5}],10);await clock.advance(1000);assert.equal(await p,true);
 await stepDone(device,clock,[{id:12,delta:5}]);await stepDone(device,clock,[{id:12,delta:5}]);assert.equal(device.state.current!.raw[12],2072);
 p=device.returnBaseline();await clock.advance(1000);assert.equal(await p,true);assert.equal(device.state.current!.raw[12],2022);assert.equal(device.state.returnReached,false);assert.equal(device.state.returnRemainingRaw,10);
 p=device.returnBaseline();await clock.advance(200);assert.equal(await p,true);assert.equal(device.state.returnReached,true);assert.equal(device.state.returnRemainingRaw,0);await device.close();
});

test('stale cached status is refreshed within the one-operation lock before a step',async()=>{
 const {device,clock,rt}=await held();await clock.advance(145);const before=rt.calls.length,p=device.step([{id:12,delta:1}]);
 assert.equal(await device.step([{id:12,delta:1}]),false);await clock.advance(100);assert.equal(await p,true);assert.equal(device.state.current!.raw[12],2013);assert.equal(rt.calls[before]!.action,'guide-status');await device.close();
});

test('feedback states and archive source tags cannot be accepted by string coercion',async()=>{
 const {device,rt}=await held();const archive=device.serialize(),bad={...archive,source:['device']};assert.equal(device.loadReadonly(bad),false);assert.equal(device.state.readonlyArchive,null);await device.close();
 assert.ok(api);const clock=new Clock(),malformed=new api.CalibrationDevice(async(name,body)=>{const f=await rt.action(name,body);f.state=[f.state];return f;},{timers:clock});assert.equal(await malformed.hold(),false);await malformed.close();
});

test('a fresh hold after a runtime sample counter reset rebases from the new measured positions',async()=>{
 const {device,rt}=await held();device.recordCandidate(12);await device.release();rt.sample=0;rt.actual[2]=2500;rt.target=[...rt.actual];
 assert.equal(await device.hold(),true);assert.equal(device.state.current!.raw[12],2500);assert.equal(device.state.baseline!.raw[12],2500);assert.equal(device.serializePrevious()!.candidates[12]!.raw,2012);await device.close();
});

test('matching targets alone cannot complete a step without a new sample and final command acknowledgement',async()=>{
 for(const missing of ['sample','ack']){assert.ok(api);const clock=new Clock(),rt=new Runtime();let armed=false,firstSample=0;
  const action=async(name:string,body:Record<string,unknown>={})=>{const f=await rt.action(name,body);if(name==='guide-hold'){armed=true;firstSample=f.sample_seq as number;}else if(armed&&['guide-status','guide-heartbeat'].includes(name)&&rt.active){if(missing==='sample')f.sample_seq=firstSample;else f.acknowledged_seq=0;}return f;};
  const d=new api.CalibrationDevice(action,{timers:clock,arrivalTimeoutMs:300});await d.hold();const pending=d.step([{id:12,delta:5}]);await clock.advance(500);assert.equal(await pending,false);assert.equal(d.state.status,'error');await d.close();
 }
});

test('disconnect cancels queued automatic work and a delayed step response cannot revive that session',async()=>{
 assert.ok(api);const clock=new Clock(),rt=new Runtime();let resolveStep:((value:Record<string,unknown>)=>void)|null=null,old:Record<string,unknown>|null=null;
 const action=async(name:string,body:Record<string,unknown>={})=>{const f=await rt.action(name,body);if(name==='guide-step'){old=f;return new Promise<Record<string,unknown>>(resolve=>{resolveStep=resolve;});}return f;};
 const d=new api.CalibrationDevice(action,{timers:clock});await d.hold();const pending=d.startAuto([{id:12,delta:5}],10);await flush();await d.disconnect();
 (resolveStep as unknown as (value:Record<string,unknown>)=>void)(old!);await flush();assert.equal(await pending,false);assert.equal(d.state.sessionId,null);assert.equal(d.state.status,'disconnected');assert.equal(await d.reconnect(),true);
 await clock.advance(1000);assert.equal(rt.calls.filter(c=>c.action==='guide-step').length,1);assert.equal(d.state.sessionId,null);await d.close();
});
