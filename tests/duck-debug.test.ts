import {setLocale} from '../frontend/shared/i18n.js';
import {test,beforeEach} from 'node:test';
beforeEach(()=>setLocale('zh-Hans'));
import assert from 'node:assert/strict';
import {IDS,ACTORS,role,createState,mergeStatus,parameterErrors,legPlan,mappingError} from '../frontend/debug/state.js';
import {motionFromInput,canControl} from '../frontend/debug/control.js';
import {completePoses} from '../frontend/debug/poses.js';

test('initial state contains no fabricated online devices or gains',()=>{const s=createState();assert.equal(s.devices.length,15);assert.ok(s.devices.every(d=>!d.online&&d.pos===null&&d.kp===null));});
test('PDF leg IDs select their actual joints without renaming a device',()=>{
 assert.equal(ACTORS[IDS.indexOf(12)],'l_upperMotor');assert.equal(ACTORS[IDS.indexOf(14)],'l_motor');
 assert.equal(ACTORS[IDS.indexOf(22)],'r_upperMotor');assert.equal(ACTORS[IDS.indexOf(24)],'motor');
 assert.equal(role(10),'左髋旋转');assert.equal(role(20),'右髋旋转');
 assert.deepEqual(createState().devices.map(d=>[d.uid,d.id]),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34].map(id=>['servo-'+id,id]));
});
test('PDF front view puts 10–14 on image right and 20–24 on image left',()=>{
 const poses=completePoses();
 for(const id of [10,11,12,13,14])assert.ok(poses[ACTORS[IDS.indexOf(id)]!]!.pose.position[0]!>0,'ID'+id);
 for(const id of [20,21,22,23,24])assert.ok(poses[ACTORS[IDS.indexOf(id)]!]!.pose.position[0]!<0,'ID'+id);
});
test('server readback controls online flags and selected address changes',()=>{const s=createState();s.selected='servo-12';mergeStatus(s,{devices:[{id:12,online:true,pos:2040,kp:5,kd:20}],boards:{arduino:{connected:true},expansion:{connected:true}},status:{mode:'shadow'}});assert.equal(s.devices.find(d=>d.id===12)!.pos,2040);assert.equal(legPlan(s)[0]!.to,22);assert.equal(parameterErrors(s,'servo-12',{id:254,kp:5,kd:20}).id,'请输入 0–253 的整数');});
test('mapping blocks occupied targets and duplicate destinations before request',()=>{const s=createState();for(const d of s.devices)d.online=[12,13,14].includes(d.id);assert.match(mappingError(s,[{uid:'servo-12',to:13}]),/已被/);assert.match(mappingError(s,[{uid:'servo-12',to:22},{uid:'servo-13',to:22}]),/重复/);assert.equal(mappingError(s,[{uid:'servo-12',to:13},{uid:'servo-13',to:12}]),'');});
test('keyboard/joystick release and roller disable strafe',()=>{assert.deepEqual(motionFromInput(false,{x:0,y:0},{x:0,y:0},new Set()),[0,0,0]);assert.deepEqual(motionFromInput(true,{x:1,y:1},{x:1,y:0},new Set()),[.4,0,-.25]);assert.equal(motionFromInput(false,{x:.1,y:.1},{x:0,y:0},new Set())[0],0);});
test('control readiness permits partial bus and excludes stale feedback',()=>{assert.equal(canControl({feedback_age_ms:20,imu_ok:true,control_ready:true,servo_ids:[12]}),true);assert.equal(canControl({feedback_age_ms:600,imu_ok:true,control_ready:true}),false);assert.equal(canControl({feedback_age_ms:20,imu_ok:true,control_ready:false,mode:'servo_debug'}),true);});
