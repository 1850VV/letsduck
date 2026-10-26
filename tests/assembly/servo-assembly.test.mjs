import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServoAssembly} from '../../frontend/assemble/servo-assembly.mjs';
import {updateNumberingReadiness} from '../../frontend/shared/numbering-readiness.mjs';

test('assembly reads shared numbering and inventory but exposes no device configuration writer',async()=>{
 const before={fetch:globalThis.fetch,document:globalThis.document,location:globalThis.location},calls=[],entry={},visits=[];
 const map={bindings:[{id:10,actorId:'t_motor10'}],version:'tutorial-reference-1'};
 try{
  globalThis.document={getElementById:()=>entry};globalThis.location={assign:path=>visits.push(path)};
  globalThis.fetch=async(url,options={})=>{
   calls.push({url:String(url),method:options.method||'GET'});
   const body=String(url).endsWith('/api/site')?{servoSetup:true,servoPreparation:true}:String(url).endsWith('/api/servo-preparation')?{records:[]}:JSON.parse(await readFile(new URL('../../frontend/assemble/servo-leads.json',import.meta.url)));
   return {ok:true,json:async()=>body};
  };
  updateNumberingReadiness({ready:true,verifiedIds:[10],reviewIds:[],records:[{id:10,state:'verified'}]});
  const assembly=await createServoAssembly(map);
  assert.equal(assembly.preparation.loaded,true);assert.equal(assembly.state.complete,true);assert.equal(assembly.recordFor(10).state,'verified');
  assembly.open();assert.deepEqual(visits,['/debug/?from=assemble']);assert.ok(calls.every(c=>c.method==='GET'));
  assert.ok(calls.every(c=>!c.url.includes('/api/servo-setup/')),'assembly never invokes controller configuration endpoints');
  updateNumberingReadiness({ready:false,verifiedIds:[],reviewIds:[10],records:[]});assert.equal(assembly.state.complete,false);
 }finally{Object.assign(globalThis,before);}
});
