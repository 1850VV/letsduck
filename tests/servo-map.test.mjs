import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACTORS, STEPS} from '../frontend/assemble/hardware-state.mjs';
import {resolveServoMap, servosForStep} from '../frontend/assemble/servo-map.mjs';

const data=JSON.parse(readFileSync(new URL('../frontend/assemble/servo-map.json',import.meta.url)));

test('ID14 selects the PDF left ankle and its matching lesson',()=>{
 const map=resolveServoMap(data,{actors:ACTORS,steps:STEPS});
 const ankle=map.byId.get(14);
 assert.equal(ankle.actorId,'l_motor');
 assert.equal(STEPS[ankle.stepIndex].id,'l-prepare');
 assert.ok(servosForStep(map,ankle.stepIndex).some(b=>b.id===14));
 assert.equal(map.byId.get(24).actorId,'motor');
 assert.equal(STEPS[map.byId.get(24).stepIndex].id,'r-prepare');
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
