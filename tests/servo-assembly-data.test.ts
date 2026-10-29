import test from 'node:test';
import assert from 'node:assert/strict';
import {createServoAssemblyData} from '../frontend/assemble/servo-preparation.js';
import {resolveServoMap} from '../frontend/assemble/servo-map.js';
import {STEPS,ACTORS} from '../frontend/assemble/hardware-state.js';
import type {SetupRecord} from '../frontend/assemble/servo-types.js';
import {readServoMap,replaceProperty} from './fixtures/source-data.js';

const map=resolveServoMap(readServoMap(),{actors:ACTORS,steps:STEPS});
const createData=()=>createServoAssemblyData(map);
const proof=(id:number):SetupRecord=>({id,state:'verified',mapVersion:map.version,sourceId:id,profile:{kp:5,kd:10},readback:{kp:5,kd:10},oldIdAbsent:true});
const catalog={requirements:{14:{connections:[{key:'lead-a',cableClass:'long',lengthMm:200,to:'fixture',sourceStatus:'confirmed'}]}}};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});

test('Assembly loads inventory and verified history through GETs without opening or inspecting the Workbench',async t=>{
 const calls:string[]=[],history=[proof(10),{...proof(11),mapVersion:'older'},{...proof(12),state:'reported'}];
 const restoreLocation=replaceProperty(globalThis,'location',{href:'http://assembly.test/assemble/'});
 const restoreFetch=replaceProperty(globalThis,'fetch',async(input:string|URL|Request,init?:RequestInit)=>{
  const path=new URL(String(input),'http://assembly.test').pathname;calls.push((init?.method??'GET')+' '+path);
  if(path==='/api/site')return json({mode:'personal',servoSetup:true,servoPreparation:true});
  if(path==='/assemble/servo-leads.json')return json(catalog);
  if(path==='/api/servo-preparation')return json({records:[{id:14,state:'picked',preparedLeads:['lead-a']},{id:24,state:'installed'}]});
  if(path==='/api/servo-setup/records')return json({records:history});
  throw Error('Unexpected hardware request '+path);
 });
 t.after(()=>{restoreFetch();restoreLocation();});
 const data=createData();await data.load();
 assert.deepEqual(calls,['GET /api/site','GET /assemble/servo-leads.json','GET /api/servo-preparation','GET /api/servo-setup/records']);
 assert.equal(data.supported,true);assert.equal(data.historyLoaded,true);assert.equal(data.preparation.loaded,true);
 assert.deepEqual(data.preparation.view.slots.map(s=>s.id),[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
 assert.deepEqual(data.preparation.view.counts,{available:13,picked:1,installed:1,prepared:1});
 assert.deepEqual([data.preparation.view.byId.get(14)!.row,data.preparation.view.byId.get(14)!.column],[1,5]);
 assert.deepEqual(data.recordFor(10)!.readback,{kp:5,kd:10});assert.equal(data.recordFor(11)!.mapVersion,'older');
 assert.deepEqual(data.history.verified,[10]);assert.deepEqual(data.history.review,[11,12]);
 assert.equal(data.history.pending.length,12);assert.deepEqual(data.records,history);
});

test('a failed history read leaves physical pickup and installation saving available',async t=>{
 const calls:string[]=[],restoreLocation=replaceProperty(globalThis,'location',{href:'http://assembly.test/assemble/'});
 const restoreFetch=replaceProperty(globalThis,'fetch',async(input:string|URL|Request,init?:RequestInit)=>{
  const path=new URL(String(input),'http://assembly.test').pathname;calls.push((init?.method??'GET')+' '+path);
  if(path==='/api/site')return json({mode:'personal',servoSetup:true,servoPreparation:true});
  if(path==='/assemble/servo-leads.json')return json(catalog);
  if(path==='/api/servo-setup/records')return json({error:'fixture unavailable'},503);
  if(path==='/api/servo-preparation'){
   if(init?.method==='POST'){
    assert.deepEqual(JSON.parse(String(init.body)),{ids:[24],state:'installed'});
    return json({records:[{id:24,state:'installed'}]});
   }
   return json({records:[]});
  }
  throw Error('Unexpected hardware request '+path);
 });
 t.after(()=>{restoreFetch();restoreLocation();});
 const data=createData();await data.load();
 assert.equal(data.historyLoaded,false);assert.equal(data.preparation.loaded,true);assert.equal(data.recordFor(24),undefined);
 await data.preparation.update([24],{state:'installed'});
 assert.equal(data.preparation.view.byId.get(24)!.state,'installed');
 assert.deepEqual(calls,['GET /api/site','GET /assemble/servo-leads.json','GET /api/servo-preparation','GET /api/servo-setup/records','POST /api/servo-preparation']);
});

test('teaching mode reads the lead catalog without accessing personal inventory or hardware history',async t=>{
 const calls:string[]=[],restoreLocation=replaceProperty(globalThis,'location',{href:'http://assembly.test/assemble/'});
 const restoreFetch=replaceProperty(globalThis,'fetch',async(input:string|URL|Request)=>{
  const path=new URL(String(input),'http://assembly.test').pathname;calls.push(path);
  if(path==='/api/site')return json({mode:'server',servoSetup:false,servoPreparation:false});
  if(path==='/assemble/servo-leads.json')return json(catalog);
  throw Error('Personal API requested in teaching mode');
 });
 t.after(()=>{restoreFetch();restoreLocation();});
 const data=createData();await data.load();
 assert.equal(data.supported,false);assert.equal(data.historyLoaded,false);assert.equal(data.preparation.supported,false);
 assert.deepEqual(calls,['/api/site','/assemble/servo-leads.json']);
});

test('an existing Workbench readback can refresh the shared history without an extra request',()=>{
 const data=createData();data.setRecords([proof(14)]);
 assert.equal(data.historyLoaded,true);assert.deepEqual(data.history.verified,[14]);assert.deepEqual(data.recordFor(14)!.readback,{kp:5,kd:10});
 data.setRecords([{...proof(14),readback:{kp:5,kd:11}}]);
 assert.deepEqual(data.history.verified,[]);assert.deepEqual(data.history.review,[14]);
});
