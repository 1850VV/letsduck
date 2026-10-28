import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {CalibrationFlow as Flow,Pose,Bounds} from '../frontend/debug/calibration-flow.js';

let api:typeof import('../frontend/debug/calibration-flow.js')|null=null;
try{api=await import('../frontend/debug/calibration-flow.js');}catch(error:unknown){if(!(error instanceof Error)||!('code' in error)||error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33];
const pose=(value=0):Pose=>Object.fromEntries(IDS.map(id=>[id,value]));
const bounds:Bounds=Object.fromEntries(IDS.map(id=>[id,{min:-180,max:180}]));
const clone=<T>(value:T):T=>structuredClone(value);
function flow(initial:Pose=pose(20),limits:Bounds=bounds):Flow{assert.equal(typeof api?.CalibrationFlow,'function','CalibrationFlow must implement the seated calibration contract');return new api!.CalibrationFlow(initial,limits);}
function finish(s:Flow){assert.equal(s.tick(1000),true);assert.equal(s.state.motionPlan,null);assert.equal(s.state.status,'paused');}

// A target leaking into current pose, or a made-up device target, fails here.
test('saving a seated baseline is required and never moves the pose or fabricates confirmed zeros',()=>{
 const initial=pose(20),s=flow(initial);initial[13]=80;assert.equal(s.state.currentPose[13],20);
 assert.equal(s.state.phase,'seat');assert.equal(s.state.candidateSource,'simulation');assert.deepEqual(s.state.target,pose());
 assert.equal(s.nextSegment(),false);assert.equal(s.startAuto(),false);assert.equal(s.confirmJoint(13),false);
 assert.equal(s.saveSeat(),true);assert.equal(s.state.phase,'approach');assert.deepEqual(s.state.baseline,pose(20));assert.deepEqual(s.state.confirmed,{});
 const before=clone(s.state);assert.equal(s.saveSeat(),false);assert.deepEqual(s.state,before);
 assert.throws(()=>new api!.CalibrationFlow(pose(20),bounds,{candidateSource:'provided'}));
 const provided=new api!.CalibrationFlow(pose(20),bounds,{candidateTarget:pose(7),candidateSource:'provided'});assert.deepEqual(provided.state.target,pose(7));
});

test('each approach segment changes no axis by more than five and follows a common two-degree-per-second fraction',()=>{
 const initial=pose();initial[12]=20;initial[13]=10;const s=flow(initial);s.saveSeat();assert.equal(s.nextSegment(),true);
 const plan=s.state.motionPlan!;assert.equal(plan.duration,2.5);assert.equal(plan.to[12],15);assert.equal(plan.to[13],7.5);
 assert.equal(s.tick(1),true);assert.equal(s.state.currentPose[12],18);assert.equal(s.state.currentPose[13],9);
 assert.equal(s.pause(),true);assert.equal(s.nextSegment(),true);assert.equal(s.state.motionPlan!.from[12],18);finish(s);
 assert.equal(s.state.currentPose[12],13);assert.equal(s.state.currentPose[13],6.5);assert.deepEqual(s.state.confirmed,{});
});

test('automatic segments stop at the selected candidate in review and never auto-confirm a joint',()=>{
 const s=flow();s.saveSeat();s.selectGroup('head');assert.equal(s.startAuto(),true);finish(s);
 for(const id of [30,31,32,33])assert.equal(s.state.currentPose[id],0);
 assert.equal(s.state.currentPose[13],20);assert.equal(s.state.phase,'review');assert.equal(s.state.autoRunning,false);assert.deepEqual(s.state.confirmed,{});
 const before=clone(s.state.currentPose);assert.equal(s.tick(100),false);assert.deepEqual(s.state.currentPose,before);
});

test('pause stops at current position and continuation does not jump back to a previous segment start',()=>{
 const s=flow();s.saveSeat();s.startAuto();s.tick(1);assert.equal(s.state.currentPose[13],18);s.pause();
 const paused=clone(s.state.currentPose);assert.equal(s.tick(20),false);assert.deepEqual(s.state.currentPose,paused);assert.equal(s.state.autoRunning,false);
 assert.equal(s.nextSegment(),true);assert.equal(s.state.motionPlan!.from[13],18);assert.equal(s.state.motionPlan!.to[13],13);finish(s);assert.equal(s.state.currentPose[13],13);
});

test('a manual correction tracks executed movement in both current and candidate, including an interrupted correction',()=>{
 const s=flow();s.saveSeat();s.startAuto();s.tick(1);assert.equal(s.nudge(13,4),true);assert.equal(s.state.autoRunning,false);
 assert.equal(s.state.currentPose[13],18);assert.equal(s.state.target[13],0);s.tick(.5);
 assert.equal(s.state.currentPose[13],19);assert.equal(s.state.target[13],1);s.pause();
 assert.equal(s.nextSegment(),true);assert.equal(s.state.motionPlan!.from[13],19);assert.equal(s.state.motionPlan!.destination[13],1);finish(s);
 assert.equal(s.state.currentPose[13],14);assert.equal(s.state.target[13],1);
});

test('mirrored legs and linked neck corrections move atomically and retain their candidate offsets',()=>{
 const initial=pose();initial[12]=20;initial[22]=-20;initial[30]=25;initial[31]=40;const s=flow(initial);s.saveSeat();
 assert.equal(s.nudge(12,2,{mirror:true}),true);finish(s);assert.equal(s.state.currentPose[12],22);assert.equal(s.state.currentPose[22],-22);assert.equal(s.state.target[12],2);assert.equal(s.state.target[22],-2);
 assert.equal(s.nudge(30,-4,{headLinked:true}),true);finish(s);assert.equal(s.state.currentPose[30],21);assert.equal(s.state.currentPose[31],36);assert.equal(s.state.target[30],-4);assert.equal(s.state.target[31],-4);
});

test('invalid or out-of-bounds steps are rejected without clipping poses or half-updating mirrored targets',()=>{
 const tight:Bounds=clone(bounds);tight[22]={min:-20,max:20};const initial=pose();initial[12]=20;initial[22]=-20;const s=flow(initial,tight);s.saveSeat();
 for(const action of [()=>s.nudge(12,1,{mirror:true}),()=>s.nudge(13,5.01),()=>s.nudge(34,1),()=>s.nudge(13,NaN),()=>s.selectJoint(34)]){
  const before=clone(s.state);assert.equal(action(),false);assert.deepEqual(s.state,before);
 }
 assert.throws(()=>flow({...pose(),13:Infinity}));assert.throws(()=>flow({...pose(),34:0}));
});

test('selecting another group or joint stops motion and requires an explicit next segment',()=>{
 const s=flow();s.saveSeat();s.startAuto();s.tick(.5);assert.equal(s.selectGroup('head'),true);const stopped=clone(s.state.currentPose);
 assert.equal(s.state.motionPlan,null);assert.equal(s.state.autoRunning,false);assert.equal(s.tick(10),false);assert.deepEqual(s.state.currentPose,stopped);
 s.startAuto();s.tick(.5);assert.equal(s.selectJoint(12),true);assert.equal(s.state.motionPlan,null);assert.equal(s.state.autoRunning,false);assert.equal(s.state.selectedJoint,12);assert.equal(s.tick(10),false);
});

test('stop, unload and disconnect discard pending motion and reconnect never resumes it',()=>{
 for(const action of ['stop','release','disconnect'] as const){const s=flow();s.saveSeat();s.startAuto();s.tick(.5);s[action]();const stopped=clone(s.state.currentPose);
  assert.equal(s.state.motionPlan,null);assert.equal(s.state.autoRunning,false);assert.equal(s.tick(100),false);assert.deepEqual(s.state.currentPose,stopped);
  if(action!=='stop'){assert.equal(s.nextSegment(),false);assert.equal(s.confirmJoint(13),false);s.reconnect();assert.equal(s.tick(100),false);assert.deepEqual(s.state.currentPose,stopped);}
 }
});

test('baseline and checkpoint returns are slow bounded trips and preserve confirmations and corrected target',()=>{
 const s=flow();s.saveSeat();s.confirmJoint(10);s.nextSegment();finish(s);assert.equal(s.saveCheckpoint(),true);const point=clone(s.state.currentPose);
 s.nudge(13,2);finish(s);const corrected=clone(s.state.target),confirmed=clone(s.state.confirmed);assert.equal(s.returnBaseline(),true);
 assert.ok(Math.max(...IDS.map(id=>Math.abs(s.state.motionPlan!.to[id]!-s.state.currentPose[id]!)))<=5);s.tick(.5);assert.ok(s.state.currentPose[13]!<20);finish(s);
 assert.deepEqual(s.state.currentPose,pose(20));assert.deepEqual(s.state.target,corrected);assert.deepEqual(s.state.confirmed,confirmed);assert.equal(s.state.autoRunning,false);assert.equal(s.tick(1),false);
 assert.equal(s.returnLastCheckpoint(),true);finish(s);assert.deepEqual(s.state.currentPose,point);assert.deepEqual(s.state.confirmed,confirmed);
});

test('manual confirmation records only stopped current coordinates and all fourteen are required for recorded phase',()=>{
 const s=flow();s.saveSeat();s.startAuto();s.tick(.5);assert.equal(s.confirmJoint(13),false);s.pause();
 assert.equal(s.confirmJoint(13),true);assert.equal(s.state.confirmed[13],19);assert.equal(s.state.target[13],0);assert.notEqual(s.state.phase,'recorded');
 assert.equal(s.confirmJoint(34),false);for(const id of IDS.filter(id=>id!==13))assert.equal(s.confirmJoint(id),true);
 assert.equal(s.state.phase,'recorded');assert.equal(Object.keys(s.state.confirmed).length,14);assert.ok(s.state.events.some(event=>event.type==='joint-confirmed'));
});

test('archives preserve seated progress and confirmations but always load paused without a runnable plan',()=>{
 const s=flow();s.saveSeat();s.nudge(13,2);finish(s);s.saveCheckpoint();s.confirmJoint(13);s.startAuto();s.tick(.25);
 const archive=s.serialize(),restored=flow();assert.equal(restored.load(archive),true);
 for(const key of ['currentPose','baseline','target','checkpoints','confirmed'] as const)assert.deepEqual(restored.state[key],s.state[key]);
 assert.equal(restored.state.status,'paused');assert.equal(restored.state.motionPlan,null);assert.equal(restored.state.autoRunning,false);const current=clone(restored.state.currentPose);assert.equal(restored.tick(100),false);assert.deepEqual(restored.state.currentPose,current);
});

test('malformed archives never replace current data or permit outlying current, target or historical coordinates',()=>{
 const s=flow();s.saveSeat();s.saveCheckpoint();s.confirmJoint(13);const archive=s.serialize(),before=clone(s.state);
 const mutations=[
  (a:typeof archive)=>{a.state.currentPose[13]=Infinity;},(a:typeof archive)=>{delete a.state.target[12];},
  (a:typeof archive)=>{a.state.baseline![13]=181;},(a:typeof archive)=>{a.state.checkpoints[0]![13]=NaN;},
  (a:typeof archive)=>{a.state.confirmed[34]=0;},(a:typeof archive)=>{a.state.confirmed[13]=181;},
  (a:typeof archive)=>{a.state.phase='recorded';},(a:typeof archive)=>{a.state.events[0]!.pose![13]=181;},
 ];
 for(const mutate of mutations){const bad=clone(archive);mutate(bad);assert.equal(s.load(bad),false);assert.deepEqual(s.state,before);}
 for(const bad of [null,{},'archive']){assert.equal(s.load(bad),false);assert.deepEqual(s.state,before);}
});

// Import must validate enums as strings rather than accepting arrays by coercion.
test('archive enum fields reject coercible arrays while preserving existing progress',()=>{
 const s=flow();s.saveSeat();const archive=s.serialize(),before=clone(s.state);
 for(const [key,value]of [['phase',['review']],['status',['paused']],['candidateSource',['simulation']],['selectedGroup',['both']]] as const){
  const bad={...archive,state:{...archive.state,[key]:value}};assert.equal(s.load(bad),false,key);assert.deepEqual(s.state,before);
 }
});
