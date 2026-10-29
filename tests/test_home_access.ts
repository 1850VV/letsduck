import test from 'node:test';
import assert from 'node:assert/strict';
import {ExperimentalAccess,ACCESS_KEY} from '../frontend/home/experimental-access.js';

function storage(value:string|null=null){return {getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}};}
test('first use requires separate unlocks and preserves them on revisit',()=>{
 const saved=storage(),access=new ExperimentalAccess('personal',saved);
 assert.equal(access.locked('paint'),false);assert.equal(access.locked('debug'),true);assert.equal(access.locked('assemble'),true);
 assert.equal(access.unlock('debug'),true);assert.equal(access.locked('debug'),false);assert.equal(access.locked('assemble'),true);
 const revisit=new ExperimentalAccess('personal',saved);assert.equal(revisit.locked('debug'),false);assert.equal(revisit.unlock('assemble'),true);
 assert.equal(new ExperimentalAccess('personal',saved).locked('assemble'),false);
});
test('server debug ignores a saved personal unlock and refuses another unlock',()=>{
 const saved=storage('{"debug":true,"assemble":false}'),access=new ExperimentalAccess('server',saved);
 assert.equal(access.locked('debug'),true);assert.equal(access.unlock('debug'),false);assert.equal(access.locked('debug'),true);
 assert.equal(access.unlock('assemble'),true);assert.equal(new ExperimentalAccess('personal',saved).locked('debug'),false);
});
test('invalid records and unknown deployment keep both experiments locked',()=>{
 for(const value of ['invalid','null','[]','{"debug":"true","assemble":1}']){const access=new ExperimentalAccess(null,storage(value));assert.equal(access.locked('debug'),true);assert.equal(access.locked('assemble'),true);assert.equal(access.unlock('debug'),false);}
 const access=new ExperimentalAccess('personal',storage('{"debug":true}'));assert.equal(access.locked('debug'),false);assert.equal(access.locked('assemble'),true);
});
test('unavailable storage never reports a durable unlock',()=>{
 const saved={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}},access=new ExperimentalAccess('personal',saved);
 assert.equal(access.unlock('debug'),false);assert.equal(access.locked('debug'),true);
 assert.ok(ACCESS_KEY);
});
