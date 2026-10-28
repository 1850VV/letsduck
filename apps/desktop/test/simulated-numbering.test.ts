import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {PersonalStore} from '@letsduck/storage';
import {IDS,MAP_VERSION} from '@letsduck/devices';
import {parseSetupRecords} from '../../../frontend/assemble/servo-types.js';
import {deriveServoHistory} from '../../../frontend/assemble/servo-status.js';
import {seedSimulatedAssembly} from '../scripts/check-support.js';

test('simulated desktop prerequisites satisfy automatic and manual numbering proof',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'duck-numbering-prerequisite-')),path=join(directory,'personal.db');
 try{
  seedSimulatedAssembly(path);const store=new PersonalStore({path});
  try{
   const history=deriveServoHistory(parseSetupRecords(store.servoRecords()),{version:MAP_VERSION,bindings:IDS.map(id=>({id}))});
   assert.deepEqual([...history.verified],[...IDS]);assert.equal(history.review.size,0);assert.equal(history.pending.size,0);
  }finally{store.close();}
 }finally{await rm(directory,{recursive:true,force:true});}
});
