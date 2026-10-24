import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProgressStore} from '../frontend/assemble/progress-store.mjs';

const steps=[{id:'prepare'},{id:'plug'}];
function fixture(){const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};}
test('explicit watched and physical confirmations remain independent of resume position',()=>{
 const storage=fixture(),store=createProgressStore(storage,steps,'v3');
 store.write('scheme:a',{step:1,progress:1});
 assert.deepEqual(store.readChecks?.('scheme:a'),{seen:[],built:[]});
 assert.equal(store.setCheck('scheme:a','plug','seen',true),true);
 assert.deepEqual(store.readChecks('scheme:a'),{seen:['plug'],built:[]});
 store.setCheck('scheme:a','plug','built',true);
 store.setCheck('scheme:a','plug','seen',false);
 assert.deepEqual(createProgressStore(storage,steps,'v3').readChecks('scheme:a'),{seen:[],built:['plug']});
 assert.deepEqual(store.read('scheme:a'),{step:1,progress:1});
 assert.deepEqual(store.readChecks('scheme:b'),{seen:[],built:[]});
 assert.deepEqual(createProgressStore(storage,steps,'v4').readChecks('scheme:a'),{seen:[],built:[]});
});
test('separate windows preserve unrelated confirmations and reject invalid/corrupt records',()=>{
 const storage=fixture(),a=createProgressStore(storage,steps,'v3'),b=createProgressStore(storage,steps,'v3');
 assert.equal(typeof a.setCheck,'function');
 a.setCheck('a','prepare','built',true);b.setCheck('a','plug','seen',true);b.setCheck('a','prepare','seen',true);
 assert.deepEqual(a.readChecks('a'),{seen:['prepare','plug'],built:['prepare']});
 assert.equal(a.setCheck('a','missing','built',true),false);
 assert.equal(a.setCheck('a','plug','other',true),false);
 assert.equal(a.setCheck('a','plug','built','yes'),false);
 const keys=[...storage.data.keys()];assert.equal(keys.every(key=>a.isChecksKey('a',key)),true);
 assert.equal(keys.some(key=>a.isChecksKey('b',key)),false);
 for(const key of keys)storage.data.set(key,'{broken');
 assert.deepEqual(a.readChecks('a'),{seen:[],built:[]});
 for(const key of keys)storage.data.set(key,JSON.stringify({version:2,checked:true}));
 assert.deepEqual(a.readChecks('a'),{seen:[],built:[]});
});
test('unavailable storage reports failure without claiming a confirmation',()=>{
 const store=createProgressStore({getItem(){throw Error('denied');},setItem(){throw Error('quota');}},steps,'v3');
 assert.equal(typeof store.setCheck,'function');
 assert.equal(store.setCheck('a','plug','built',true),false);
 assert.deepEqual(store.readChecks('a'),{seen:[],built:[]});
});
test('all 30 supported schemes can retain 111 two-field confirmations within a 5 MiB store',()=>{
 const values=new Map(),steps=Array.from({length:111},(_,i)=>({id:'assembly-step-'+i}));let bytes=0;
 const storage={getItem:key=>values.get(key)??null,setItem(key,value){
  const next=bytes+2*(key.length+value.length)-(values.has(key)?2*(key.length+values.get(key).length):0);
  if(next>5*1024*1024)throw Error('quota');values.set(key,value);bytes=next;
 }};
 const store=createProgressStore(storage,steps,'hardware-v3');
 for(let scheme=0;scheme<30;scheme++)for(const {id}of steps)for(const kind of ['seen','built']){
  assert.equal(store.setCheck('scheme:'+scheme,id,kind,true),true,'supported scheme confirmation must fit');
 }
 assert.equal(store.readChecks('scheme:29').built.length,111);
});
