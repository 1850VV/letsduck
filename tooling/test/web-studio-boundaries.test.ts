import test from 'node:test';
import assert from 'node:assert/strict';
import {jsonStringify} from '../../frontend/shared/json.js';
import {readStudioStored} from '../../frontend/studio/storage.js';
import {readDebugSnapshot,readMCUStatus} from '../../frontend/debug/types.js';
import {validDesign} from '../../frontend/lib/color-workflows.js';
import type {Product} from '../../frontend/shared/types.js';

test('existing drafts and schemes retain legacy finishes, raw provenance and exact integer fields',()=>{
  const provenance={title:'Original',author:'Painter',workId:'w-1',extra:{exact:18446744073709551615n}};
  const design={colors:{'P4-01':'#123456'},assignments:{'P4-01':null}};
  const scheme={id:'s-1',name:'Saved',design,provenance,created:9007199254740993n,updated:9007199254740995n};
  const stored=readStudioStored(jsonStringify({draft:{name:'Draft',design,provenance,voiceSalt:18446744073709551615n,updated:9007199254740993n},schemes:[scheme],locks:['P4-01'],recent:['hex:#123456']}));
  assert.deepEqual(stored.draft?.design,{...design,finishes:{}});
  assert.equal(stored.draft?.voiceSalt,18446744073709551615n);
  assert.equal(stored.draft?.updated,9007199254740993n);
  assert.deepEqual(stored.draft?.provenance,provenance);
  assert.equal(stored.schemes?.[0]?.created,9007199254740993n);
  assert.equal(stored.schemes?.[0]?.updated,9007199254740995n);
  assert.equal(stored.schemes?.[0]?.voiceSalt,0);
  assert.deepEqual(stored.schemes?.[0]?.provenance,provenance);
});

test('unknown saved design input cannot introduce an unverified product binding',()=>{
  const products=new Map<string,Product>([['rigid',{id:'rigid',material:'PLA',series:'PLA Basic',name:'Rigid',hex:'#123456'}]]);
  const parts=[{id:'soft',material:'TPU 90A'}];
  for(const value of [null,[],true,{colors:'bad'},{colors:{soft:123456}}])assert.equal(validDesign(value,parts,products),null);
  assert.deepEqual(validDesign({colors:{soft:'#123456'},assignments:{soft:'rigid'}},parts,products),{colors:{soft:'#123456'},assignments:{soft:null}});
});

test('Debug reads telemetry without manufacturing online state, identity or control commands',()=>{
  const snapshot=readDebugSnapshot({devices:[{id:12,online:false,pos:2048,kp:5,kd:20}],boards:{arduino:{connected:false},expansion:{connected:false}},transport:'usb',status:{mode:'shadow',mcu_command_seq:18446744073709551615n,feedback_age_ms:600,imu_ok:false},scan:{active:false,checked:0,found:[]},numbering:{ready:true,verifiedIds:[12]},onlineIds:[]});
  assert.equal(snapshot.devices[0]?.online,false);
  assert.equal(snapshot.devices[0]?.uid,'servo-12');
  assert.equal(snapshot.devices[0]?.jogReady,false);
  assert.equal(snapshot.status.mcu_command_seq,18446744073709551615n);
  assert.equal(snapshot.status.feedback_age_ms,600);
  assert.deepEqual(snapshot.onlineIds,[]);
  assert.deepEqual(snapshot.numbering,{ready:true,verifiedIds:[12]});
  assert.throws(()=>readDebugSnapshot({devices:'bad'}));
  assert.throws(()=>readMCUStatus(null));
  assert.throws(()=>readMCUStatus({angles:[1,'invalid',3]}),'invalid telemetry must not shift later joint readings into another slot');
});
