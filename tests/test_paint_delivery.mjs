import test from 'node:test';
import assert from 'node:assert/strict';
import * as workflow from '../frontend/lib/paint-delivery.mjs';
const parts=[{id:'a',plate:2,material:'PLA Basic'},{id:'b',plate:2,material:'PLA Basic'},{id:'c',plate:7,material:'TPU 90A'}];
test('scope counts actual unique instances and separates locked and soft targets',()=>{
 assert.equal(typeof workflow.paintScope,'function');
 assert.deepEqual(workflow.paintScope(parts,['a','a','c','missing'],new Set(['a'])),{ids:['a','c'],count:2,editable:1,locked:1,materials:['PLA','TPU 90A']});
});
test('delivery summary derives plates, instances and distinct assignments from current model',()=>{
 assert.equal(typeof workflow.deliverySummary,'function');
 assert.deepEqual(workflow.deliverySummary(parts,{a:'white',b:'white',c:'soft'}),{plates:2,parts:3,materials:2});
});
test('tool keys leave text editing and modified keys alone',()=>{
 assert.equal(typeof workflow.toolShortcut,'function');
 assert.equal(workflow.toolShortcut({key:'B',target:{tagName:'BUTTON'}},2),'brush');
 for(const target of [{tagName:'INPUT'},{tagName:'TEXTAREA'},{tagName:'SELECT'},{isContentEditable:true}])assert.equal(workflow.toolShortcut({key:'b',target},2),null);
 assert.equal(workflow.toolShortcut({key:'p',altKey:true},2),null);
 assert.equal(workflow.toolShortcut({key:'f'},3),null);
 assert.equal(workflow.toolShortcut({key:'P'},2),'side');
});
