import test from 'node:test';
import assert from 'node:assert/strict';
import {readServoMap} from './fixtures/source-data.js';
import * as module from '../frontend/assemble/servo-map.js';
import {STEPS,ACTORS} from '../frontend/assemble/hardware-state.js';
const raw=readServoMap();
const map=module.resolveServoMap(raw,{actors:ACTORS,steps:STEPS});
const unknown={requirements:Object.fromEntries(raw.bindings.map(b=>[b.id,{connections:null}]))};

test('physical pickup keeps all fifteen literal positions and independent counts',()=>{
 assert.equal(typeof module.deriveServoPreparation,'function');
 const p=module.deriveServoPreparation(map,unknown,[{id:14,state:'picked'},{id:24,state:'installed'}]);
 assert.deepEqual(p.slots.map(s=>s.id),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
 assert.deepEqual([p.byId.get(14)!.row,p.byId.get(14)!.column,p.byId.get(14)!.state],[1,5,'picked']);
 assert.deepEqual([p.byId.get(24)!.row,p.byId.get(24)!.column],[2,5]);
 assert.deepEqual(p.counts,{available:13,picked:1,installed:1,prepared:0});
 assert.equal(p.byId.get(32)!.leadKnown,false);
});

test('unknown leads remain unprepared even when firmware or pickup is complete',()=>{
 assert.equal(typeof module.deriveServoPreparation,'function');
 const p=module.deriveServoPreparation(map,unknown,raw.bindings.map(b=>({id:b.id,state:'installed',preparedLeads:['guessed']})));
 assert.equal(p.counts.available,0);assert.equal(p.counts.prepared,0);
 assert.equal(p.byId.get(32)!.leadLabel,'线材规格待核定');
});

test('preparation requires every confirmed connection on a multi-lead servo',()=>{
 assert.equal(typeof module.deriveServoPreparation,'function');
 const catalog={requirements:{...unknown.requirements,32:{connections:[
  {key:'a',cableClass:'long',lengthMm:200,to:'example-A',sourceStatus:'confirmed'},
  {key:'b',cableClass:'standard',lengthMm:100,to:'example-B',sourceStatus:'confirmed'}]}}};
 assert.equal(module.deriveServoPreparation(map,catalog,[{id:32,state:'available',preparedLeads:['a']}]).counts.prepared,0);
 const p=module.deriveServoPreparation(map,catalog,[{id:32,state:'available',preparedLeads:['a','b']}]);
 assert.equal(p.counts.prepared,1);assert.equal(p.byId.get(32)!.leadLabel,'长线 · 200 mm / 标准线 · 100 mm');
});

test('only explicit installation milestones identify motors for normal next',()=>{
 assert.equal(typeof module.installationServosForStep,'function');
 const at=(id:string)=>STEPS.findIndex(s=>s.id===id);
 assert.deepEqual(module.installationServosForStep(map,at('r-prepare')).map(b=>b.id),[]);
 assert.deepEqual(module.installationServosForStep(map,at('r-tighten')).map(b=>b.id),[24]);
 assert.deepEqual(module.installationServosForStep(map,at('r-leg-done')).map(b=>b.id),[22,23]);
 assert.deepEqual(module.installationServosForStep(map,at('head-neck-plate')).map(b=>b.id),[30,31]);
});
