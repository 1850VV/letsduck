import test from 'node:test';
import assert from 'node:assert/strict';
import {readServoMap} from './fixtures/source-data.js';
import {ACTORS, STEPS, snapshot, OVERVIEW_STEP, chapterFor} from '../frontend/assemble/hardware-state.js';
import {resolveServoMap, servosForStep, deriveServoPreparation} from '../frontend/assemble/servo-map.js';

import {materialFor} from '../frontend/assemble/material-catalog.js';
import {SERVO_IDS} from '../frontend/assemble/servo-horns.js';

const data=readServoMap();

test('ID14 selects the PDF left ankle and its matching lesson',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS});
 const ankle=map.byId.get(14)!;
 assert.equal(ankle.actorId,'l_motor');
 assert.equal(STEPS[ankle.stepIndex]!.id,'l-prepare');
 assert.ok(servosForStep(map,ankle.stepIndex).some(b=>b.id===14));
 assert.equal(map.byId.get(24)!.actorId,'motor');
 assert.equal(STEPS[map.byId.get(24)!.stepIndex]!.id,'r-prepare');
});

test('all fifteen slots navigate to distinct real servos without promoting candidate mappings',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS});
 assert.deepEqual(map.bindings.map(b=>b.id),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
 assert.equal(new Set(map.bindings.map(b=>b.actorId)).size,15);
 for(const b of map.bindings){assert.ok(ACTORS[b.actorId]!.servoPorts);assert.ok(b.stepIndex>8);}
 assert.equal(map.byId.get(30)!.status,'candidate');
 assert.equal(map.byId.get(33)!.status,'candidate');
 assert.equal(map.byId.get(14)!.status,'reference');
});

test('a missing or duplicated actor cannot silently yield an installation link',()=>{
 assert.throws(()=>resolveServoMap({...data,bindings:[...data.bindings,{...data.bindings[0]}]},{actors:ACTORS,steps:STEPS}));
 assert.throws(()=>resolveServoMap({...data,bindings:[{id:10,actorId:'invented'}]},{actors:ACTORS,steps:STEPS}));
});

test('both leg groups match PDF pages 1, 8 and 15 in the actual front-facing model',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS}),poses=snapshot(OVERVIEW_STEP,1);
 for(const id of [10,11,12,13,14])assert.ok(poses[map.byId.get(id)!.actorId]!.position[0]!>0,`ID${id} must be on the front-view image right`);
 for(const id of [20,21,22,23,24])assert.ok(poses[map.byId.get(id)!.actorId]!.position[0]!<0,`ID${id} must be on the front-view image left`);
 for(const b of map.bindings){assert.equal(SERVO_IDS[b.actorId],b.id);assert.match(materialFor(b.actorId).name,new RegExp(`ID${b.id}\\b`));}
});

test('physical ID14 tray slot and saved declaration navigate to its corrected installation',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS}),record:import('../frontend/assemble/servo-types.js').PreparationRecord={id:14,state:'picked',preparedLeads:['existing']};
 const preparation=deriveServoPreparation(map,{requirements:{}},[record]),slot=preparation.byId.get(14)!;
 assert.equal(slot.row,1);assert.equal(slot.column,5);assert.equal(slot.state,'picked');
 assert.equal(slot.actorId,'l_motor');assert.equal(STEPS[slot.installationIndex]!.id,'l-tighten');
 assert.deepEqual(record,{id:14,state:'picked',preparedLeads:['existing']});
 assert.equal(map.version,'tutorial-reference-1','moving a model binding does not renumber a physical servo or invalidate its ID readback');
});


test('leg reference clips follow their physical IDs after the geometry binding is corrected',()=>{
 const step=(id:string)=>STEPS.find(s=>s.id===id)!;
 const clip=(id:string)=>chapterFor(STEPS.findIndex(s=>s.id===id))!.video!;
 assert.match(clip('l-prepare'),/reference-02m06-03m14/);
 assert.equal(step('l-prepare').sourceStart,126);
 assert.match(clip('r-prepare'),/reference-left-ankle/);
 assert.equal(step('r-prepare').sourceStart,194);
 assert.match(clip('l-pair'),/reference-right-leg/);
 assert.match(clip('r-pair'),/reference-left-leg/);
 assert.equal(step('t-motor-r').sourceStart,694,'ID21 reference');
 assert.equal(step('t-motor-l').sourceStart,624,'ID11 reference');
});
