import test from 'node:test';import assert from 'node:assert/strict';
import {encodeJournal,decodeJournal} from '../frontend/shared/backup-journal.mjs';
import {browserWrites} from '../frontend/shared/backup-adapter.mjs';
import {STEPS} from '../frontend/assemble/full-state.mjs';
test('maximum confirmation journal deduplicates tutorial keys losslessly',()=>{
 const s={getItem:()=>null};
 const browser={draft:null,progress:Array.from({length:30},(_,i)=>({scope:'scheme:'+String(i).padStart(64,'s'),tutorial:'hardware-v3',stepIds:STEPS.map(s=>s.id),view:{step:0,progress:1},seen:STEPS.map(s=>s.id),built:STEPS.map(s=>s.id)}))};
 const writes=browserWrites(s,browser,STEPS),journal={operation:'test',writes};
 const encoded=encodeJournal(journal);
 assert.deepEqual(decodeJournal(encoded).writes,writes);
 assert.ok(encoded.length<1_500_000,encoded.length);
 // A/B now bounds confirmation keys. Verify lossless compression and a concrete 5 MiB peak budget,
 // rather than requiring the obsolete 4x saving against repeated full-tutorial keys.
 assert.ok(encoded.length<JSON.stringify(journal).length);
 const targetCharacters=writes.reduce((sum,row)=>sum+row.key.length+row.after.length,0);
 assert.ok(2*(targetCharacters+2*encoded.length)<5*1024*1024);
});
