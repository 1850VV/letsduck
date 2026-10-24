import test from 'node:test';import assert from 'node:assert/strict';
import {createSaveStatus} from '../frontend/shared/save-status.mjs';
test('save failure retains latest editable data and reports error',async()=>{
 const states=[],status=createSaveStatus(s=>states.push(s));const draft={name:'Duck',design:{colors:{p:'#ffffff'}}};
 await assert.rejects(status.save(draft,async()=>{throw Error('disk')}));
 assert.equal(states.at(-1).state,'failed');assert.equal(draft.name,'Duck');
 const result=await status.save(draft,async()=>({id:'saved'}));
 assert.equal(result.id,'saved');assert.equal(states.at(-1).state,'saved');
});
