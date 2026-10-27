import test from 'node:test';
import assert from 'node:assert/strict';
import type {SetupUiState,SetupRecord} from '../frontend/assemble/servo-types.js';
import {deriveServoStatus,ServoSelection} from '../frontend/assemble/servo-status.js';
const ids=[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34];
const map={version:'v1',bindings:ids.map(id=>({id}))},now=10000;
const proof=(id:number,state='verified')=>({id,state,mapVersion:'v1',sourceId:id,profile:{kp:5,kd:10},readback:{kp:5,kd:10},oldIdAbsent:true});
const data=(records:SetupRecord[]=[],onlineIds:number[]=[]):SetupUiState&{telemetry:NonNullable<SetupUiState['telemetry']>}=>({records,online:true,phase:'ready',telemetry:{known:true,ids:onlineIds,readings:{},observedAt:now}});

test('reported and incomplete records never count as verified; live ID1 is not selected target ID11',()=>{
 const state=deriveServoStatus(data([proof(10,'reported')],[1]),map,now);
 assert.equal(state.verified.size,0);assert.equal(state.review.size,1);assert.equal(state.pending.size,14);
 assert.equal(state.items.get(10)!.status,'review');assert.equal(state.items.get(11)!.online,false);
 assert.deepEqual([...state.online],[1]);assert.equal(state.complete,false);
});
test('offline and expired telemetry preserve success while clearing every live claim',()=>{
 for(const mutate of [(d:ReturnType<typeof data>)=>d.online=false,(d:ReturnType<typeof data>)=>d.telemetry.observedAt=1,(d:ReturnType<typeof data>)=>d.telemetry.known=false]){
  const d=data([proof(10)],[10]);mutate(d);const state=deriveServoStatus(d,map,now);
  assert.equal(state.verified.size,1);assert.equal(state.online.size,0);assert.equal(state.known,false);assert.equal(state.liveFor(10),null);
 }
});
test('a different map, pending write or incomplete verification remains reviewable history',()=>{
 const records=[{...proof(10),mapVersion:'older'},proof(11,'pending'),{...proof(12),readback:{}},proof(13,'review')];
 const state=deriveServoStatus(data(records),map,now);
 assert.equal(state.verified.size,0);assert.deepEqual([...state.review],[10,11,12,13]);
 assert.equal(state.items.get(10)!.record!.mapVersion,'older');
});
test('only all fifteen verified can complete, independently of how many currently respond',()=>{
 const d=data(ids.map(id=>proof(id)),[34]);let state=deriveServoStatus(d,map,now);
 assert.equal(state.complete,true);assert.equal(state.verified.size,15);assert.equal(state.online.size,1);
 d.records[0]!.state='review';state=deriveServoStatus(d,map,now);assert.equal(state.complete,false);
 d.records[0]=proof(10);d.phase='working';d.currentId=34;state=deriveServoStatus(d,map,now);
 assert.equal(state.complete,false);assert.equal(state.verified.size,14);assert.equal(state.items.get(34)!.status,'working');
});
test('live data requires the responding selected ID and a recent read, never a historical record',()=>{
 const d=data([proof(10)],[10]);d.telemetry.readings={'10':{target_id:10,kp:5,kd:20,raw_pos:392}};
 const state=deriveServoStatus(d,map,now);assert.equal(state.liveFor(10)!.readback!.kd,20);assert.equal(state.liveFor(14),null);
 assert.equal(state.items.get(10)!.record!.readback!.kd,10);
});
test('an explicit target is in progress during discovery before a source ID is found',()=>{
 const d=data([proof(10)],[1]);d.phase='working';d.activeTarget=14;d.currentId=null;
 const state=deriveServoStatus(d,map,now);assert.equal(state.items.get(14)!.status,'working');
});
test('a stopped interrupted operation can resume and an idle connection can shut down',()=>{
 const d=data([proof(14,'pending')],[1]);let state=deriveServoStatus(d,map,now);
 assert.equal(state.items.get(14)!.canResume,true);assert.equal(state.canHalt,true);
 d.running=true;state=deriveServoStatus(d,map,now);assert.equal(state.items.get(14)!.canResume,false);
 d.phase='working';d.activeTarget=14;state=deriveServoStatus(d,map,now);assert.equal(state.canHalt,false);
 d.running=false;d.phase='blocked';state=deriveServoStatus(d,map,now);assert.equal(state.canHalt,true);
 d.online=false;state=deriveServoStatus(d,map,now);assert.equal(state.canHalt,false);
});
test('an accepted next target takes precedence over the default recommendation',()=>{
 const d=data();d.targetId=11;d.queuedTarget=20;
 assert.equal(deriveServoStatus(d,map,now).nextTarget,20);
 d.queuedTarget=null;assert.equal(deriveServoStatus(d,map,now).nextTarget,11);
});
test('display changes preserve selection; observations cannot replace a manually inspected servo',()=>{
 const choice=new ServoSelection(ids);choice.apply({targetId:11});assert.equal(choice.selected,11);assert.equal(choice.labelTarget,null);
 choice.choose(14);choice.toggle();assert.equal(choice.selected,14);assert.equal(choice.labelTarget,14);assert.equal(choice.view,'tray');
 choice.apply({currentId:11,phase:'working'});assert.equal(choice.selected,14);
 choice.begin();choice.apply({currentId:12,phase:'working'});assert.equal(choice.selected,12);
 choice.choose(10);choice.apply({currentId:13,phase:'working'});assert.equal(choice.selected,10);
 choice.sequential({targetId:14});assert.equal(choice.labelTarget,null);assert.equal(choice.selected,14);
});
