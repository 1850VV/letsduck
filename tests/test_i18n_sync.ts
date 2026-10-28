import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocaleController} from '../frontend/shared/i18n.js';
test('an existing frame observes another frame language choice without writing it back',()=>{
 const memory=new Map<string,string>();let writes=0;
 const storage={getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>{writes++;memory.set(key,value);},removeItem:(key:string)=>{writes++;memory.delete(key);}};
 const controller=createLocaleController({storage,languages:()=>['ja-JP']}),seen:string[]=[];controller.subscribe(locale=>seen.push(locale));
 const reload:unknown=Reflect.get(controller,'reload');assert.ok(typeof reload==='function','Existing frames need a read-only locale receiver');
 memory.set('dd-locale','fr');
 reload.call(controller);
 assert.equal(controller.locale,'fr');assert.deepEqual(seen,['fr']);assert.equal(writes,0);
 reload.call(controller);assert.deepEqual(seen,['fr']);
 memory.delete('dd-locale');reload.call(controller);
 assert.equal(controller.locale,'ja');assert.deepEqual(seen,['fr','ja']);assert.equal(writes,0);
});
