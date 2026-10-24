import test from 'node:test';
import assert from 'node:assert/strict';
import {captureBrowser, remapBrowser, applyBrowser} from '../frontend/shared/backup-adapter.mjs';
import {createProgressStore} from '../frontend/assemble/progress-store.mjs';
const steps=[{id:'a'},{id:'b'}];
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}};
test('captures only related progress, remaps IDs and keeps seen separate from built',()=>{
 const a=memory(),b=memory();
 a.setItem('dd-studio-personal',JSON.stringify({draft:{activeId:'old',name:'Duck',design:{colors:{p:'#ffffff'},assignments:{p:null}}}}));
 const progress=createProgressStore(a,steps,'hardware-v3');progress.setCheck('scheme:old','a','seen',true);progress.write('scheme:old',{step:1,progress:.5});
 progress.setCheck('scheme:unrelated','a','built',true);
 const snapshot=captureBrowser(a,[{id:'old'}],steps);
 assert.equal(snapshot.progress.length,2);
 const remapped=remapBrowser(snapshot,{old:'new'});
 applyBrowser(b,remapped,steps);
 const result=createProgressStore(b,steps,'hardware-v3');
 assert.deepEqual(result.readChecks('scheme:new'),{seen:['a'],built:[]});
 assert.deepEqual(result.read('scheme:new'),{step:1,progress:.5});
 assert.equal(JSON.parse(b.getItem('dd-studio-personal')).draft.activeId,'new');
});
test('rejects tutorial mismatch before writing',()=>{
 const storage=memory();
 assert.throws(()=>applyBrowser(storage,{draft:null,progress:[{tutorial:'new',stepIds:['a'],scope:'blank',view:{step:0,progress:1},seen:[],built:[]}]},steps));
 assert.equal(storage.getItem('dd-studio-personal'),null);
});
import {browserWrites,restoreWrites} from '../frontend/shared/backup-adapter.mjs';
test('write journal rolls back a partial browser import and refuses concurrent edits',()=>{
 const s=memory();s.setItem('dd-studio-personal','{"draft":null}');
 const writes=browserWrites(s,{draft:null,progress:[{scope:'blank',tutorial:'hardware-v3',stepIds:['a','b'],view:{step:1,progress:.4},seen:['a'],built:[]}]},steps);
 for(const row of writes.slice(0,2))s.setItem(row.key,row.after);
 restoreWrites(s,writes);
 assert.equal(s.getItem(writes[0].key),null);
 s.setItem(writes[0].key,'new edit');
 assert.throws(()=>restoreWrites(s,writes),/stale/);
});
import {copyProgress} from '../frontend/shared/backup-adapter.mjs';
test('naming a draft carries resume and explicit checks to its new scheme identity',()=>{
 const s=memory(),p=createProgressStore(s,steps,'hardware-v3');p.write('draft:d',{step:1,progress:.2});p.setCheck('draft:d','b','built',true);
 copyProgress(s,steps,'draft:d','scheme:s');
 assert.deepEqual(p.read('scheme:s'),{step:1,progress:.2});
 assert.deepEqual(p.readChecks('scheme:s'),{seen:[],built:['b']});
});
import {dataMessages} from '../frontend/locales/data.mjs';
import {readFileSync} from 'node:fs';
import {STEPS} from '../frontend/assemble/full-state.mjs';
test('backup tutorial IDs stay aligned with production and all twelve locales have complete placeholders',()=>{
 const schema=JSON.parse(readFileSync(new URL('../frontend/shared/backup-steps.json',import.meta.url)));
 assert.deepEqual(schema.steps.map(s=>s.id),STEPS.map(s=>s.id));
 assert.equal(Object.keys(dataMessages).length,12);
 const keys=Object.keys(dataMessages.en);
 for(const values of Object.values(dataMessages)){
  assert.deepEqual(Object.keys(values),keys);
  for(const key of keys){assert.ok(values[key]);assert.deepEqual(values[key].match(/\{\w+\}/g),dataMessages.en[key].match(/\{\w+\}/g));}
 }
});
test('sparse backups do not allocate false confirmation records for every step',()=>{
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const many=Array.from({length:111},(_,i)=>({id:String(i)}));
 applyBrowser(storage,{draft:null,progress:[{scope:'blank',tutorial:'hardware-v3',stepIds:many.map(s=>s.id),view:{step:0,progress:1},seen:[],built:[]}]},many);
 assert.equal(map.size,2);
});
test('failed naming migration removes partial destination records and retains original progress',()=>{
 const s=memory(),p=createProgressStore(s,steps,'hardware-v3');p.write('draft:d',{step:1,progress:.2});p.setCheck('draft:d','b','built',true);
 const write=s.setItem;let failed=false;s.setItem=(key,value)=>{if(!failed&&key.includes('scheme:s')&&key.startsWith('dd-assembly-check:')){failed=true;throw Error('quota');}write(key,value);};
 assert.throws(()=>copyProgress(s,steps,'draft:d','scheme:s'));
 assert.deepEqual(p.read('scheme:s'),{step:0,progress:1});
 assert.deepEqual(p.readChecks('scheme:s'),{seen:[],built:[]});
 assert.deepEqual(p.read('draft:d'),{step:1,progress:.2});
});
