import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACTORS, STEPS, snapshot, OVERVIEW_STEP} from '../frontend/assemble/hardware-state.mjs';
import {STEPS as pdfSteps} from '../frontend/assemble/pdf-state.mjs';
import {resolveServoMap, servosForStep, deriveServoPreparation} from '../frontend/assemble/servo-map.mjs';
import {materialFor} from '../frontend/assemble/material-catalog.mjs';
import {SERVO_IDS} from '../frontend/assemble/servo-horns.mjs';

const data=JSON.parse(readFileSync(new URL('../frontend/assemble/servo-map.json',import.meta.url)));

test('ID14 selects the PDF left ankle and ID24 selects the PDF right ankle',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS});
 const ankle=map.byId.get(14);
 assert.equal(ankle.actorId,'l_motor');
 assert.equal(STEPS[ankle.stepIndex].id,'l-prepare');
 assert.ok(servosForStep(map,ankle.stepIndex).some(b=>b.id===14));
 assert.equal(map.byId.get(24).actorId,'motor');
 assert.equal(STEPS[map.byId.get(24).stepIndex].id,'r-prepare');
});

test('both leg groups match PDF pages 1, 8 and 15 in the actual front-facing model',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS}),poses=snapshot(OVERVIEW_STEP,1);
 for(const id of [10,11,12,13,14])assert.ok(poses[map.byId.get(id).actorId].position[0]>0,`ID${id} must be on the front-view image right`);
 for(const id of [20,21,22,23,24])assert.ok(poses[map.byId.get(id).actorId].position[0]<0,`ID${id} must be on the front-view image left`);
 for(const b of map.bindings){assert.equal(SERVO_IDS[b.actorId],b.id);assert.match(materialFor(b.actorId).name,new RegExp(`ID${b.id}\\b`));}
});

test('physical ID14 tray slot and saved declaration navigate to its corrected installation',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:pdfSteps}),record={id:14,state:'picked',preparedLeads:['existing']};
 const preparation=deriveServoPreparation(map,{requirements:{}},[record]),slot=preparation.byId.get(14);
 assert.equal(slot.row,1);assert.equal(slot.column,5);assert.equal(slot.state,'picked');
 assert.equal(slot.actorId,'l_motor');assert.equal(pdfSteps[slot.installationIndex].id,'l-tighten');
 assert.deepEqual(record,{id:14,state:'picked',preparedLeads:['existing']});
 assert.equal(map.version,'tutorial-reference-1','moving a model binding does not renumber a physical servo or invalidate its ID readback');
});

test('tutorial text follows PDF leg IDs at prewiring and horn-removal actions',()=>{
 const step=id=>pdfSteps.find(s=>s.id===id);
 assert.match(step('r-prepare').text,/ID24/);assert.match(step('l-prepare').text,/ID14/);
 assert.match(step('r-wire-a').title,/ID23.*ID24/);assert.match(step('l-wire-a').title,/ID13.*ID14/);
 assert.match(step('r-top-horn').title,/ID22/);assert.match(step('l-top-horn').title,/ID12/);
 assert.match(step('t-motor-r').text,/ID21/);assert.match(step('t-motor-l').text,/ID11/);
 assert.match(step('calibration-servos').text,/右腿 20–24，左腿 10–14/);
});

test('leg reference clips follow their physical IDs after the geometry binding is corrected',()=>{
 const step=id=>pdfSteps.find(s=>s.id===id);
 assert.match(step('l-prepare').video,/reference-02m06-03m14/);
 assert.equal(step('l-prepare').sourceStart,126);
 assert.match(step('r-prepare').video,/reference-left-ankle/);
 assert.equal(step('r-prepare').sourceStart,194);
 assert.match(step('l-pair').video,/reference-right-leg/);
 assert.match(step('r-pair').video,/reference-left-leg/);
 assert.equal(step('t-motor-r').sourceStart,694,'ID21 reference');
 assert.equal(step('t-motor-l').sourceStart,624,'ID11 reference');
});

test('all fifteen slots navigate to distinct real servos without promoting candidate mappings',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS});
 assert.deepEqual(map.bindings.map(b=>b.id),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
 assert.equal(new Set(map.bindings.map(b=>b.actorId)).size,15);
 for(const b of map.bindings){assert.ok(ACTORS[b.actorId].servoPorts);assert.ok(b.stepIndex>8);}
 assert.equal(map.byId.get(30).status,'candidate');
 assert.equal(map.byId.get(33).status,'candidate');
 assert.equal(map.byId.get(14).status,'reference');
});

test('a missing or duplicated actor cannot silently yield an installation link',()=>{
 assert.throws(()=>resolveServoMap({...data,bindings:[...data.bindings,{...data.bindings[0]}]},{actors:ACTORS,steps:STEPS}));
 assert.throws(()=>resolveServoMap({...data,bindings:[{id:10,actorId:'invented'}]},{actors:ACTORS,steps:STEPS}));
});
