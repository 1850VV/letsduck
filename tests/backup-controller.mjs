import test from 'node:test';import assert from 'node:assert/strict';
import {createBackupController} from '../frontend/shared/backup-controller.mjs';
import {JOURNAL_KEY} from '../frontend/shared/backup-adapter.mjs';
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}};
test('failed browser write retains journal and restore recovers both storage boundaries',async()=>{
 const s=storage(),steps=[{id:'a'}];s.setItem('dd-studio-personal','{"draft":null}');
 let recovered=false,fail=false;
 const rawSet=s.setItem;s.setItem=(k,v)=>{if(fail&&k.startsWith('dd-assembly-view:'))throw Error('quota');rawSet(k,v);};
 const request=async(method,path)=>{
  if(path==='/backup/preview')return{revision:'r',conflicts:[]};
  if(path==='/backup/import'){fail=true;return{idMap:{},recovery:'token'};}
  if(path==='/backup/restore'){recovered=true;return{ok:true};}
 };
 const c=createBackupController(s,steps,request);
 const bundle={browser:{draft:null,progress:[{scope:'blank',tutorial:'hardware-v3',stepIds:['a'],view:{step:0,progress:1},seen:['a'],built:[]}]}};
 const preview=await c.preview(bundle);
 await assert.rejects(c.import(bundle,'keep',preview),/quota/);
 assert.ok(s.getItem(JOURNAL_KEY));fail=false;
 await c.restore();assert.ok(recovered);assert.equal(s.getItem(JOURNAL_KEY),null);
 assert.equal(s.getItem('dd-studio-personal'),'{"draft":null}');
});
test('recovery after unknown network outcome preserves a concurrent browser draft',async()=>{
 const s=storage(),steps=[{id:'a'}];s.setItem('dd-studio-personal','{"draft":null}');
 const c=createBackupController(s,steps,async(method,path)=>{
  if(path==='/backup/preview')return{revision:'r'};
  if(path==='/backup/import')throw Error('network');
  if(path==='/backup/restore')return{ok:true};
 });
 const bundle={browser:{draft:null,progress:[]}},p=await c.preview(bundle);
 await assert.rejects(c.import(bundle,'keep',p));
 s.setItem('dd-studio-personal','{"draft":{"name":"new edit"}}');
 await c.restore();
 assert.equal(s.getItem('dd-studio-personal'),'{"draft":{"name":"new edit"}}');
});
test('a browser edit made during SQLite recovery is never overwritten after await',async()=>{
 const s=storage(),steps=[{id:'a'}];
 s.setItem('dd-studio-personal','after');
 s.setItem(JOURNAL_KEY,JSON.stringify({operation:'x',writes:[{key:'dd-studio-personal',before:'before',after:'after'}]}));
 const c=createBackupController(s,steps,async()=>{s.setItem('dd-studio-personal','concurrent edit');return{ok:true};});
 await c.restore();
 assert.equal(s.getItem('dd-studio-personal'),'concurrent edit');
});
import {createProgressStore} from '../frontend/assemble/progress-store.mjs';
test('progress changed after preview invalidates import before SQLite write',async()=>{
 const s=storage(),steps=[{id:'a'}];let imported=false;
 const c=createBackupController(s,steps,async(method,path)=>{
  if(path==='/backup/preview')return{revision:'r'};
  if(path==='/schemes')return[];
  if(path==='/backup/import'){imported=true;return{idMap:{}};}
 });
 const bundle={browser:{draft:null,progress:[]}},preview=await c.preview(bundle);
 createProgressStore(s,steps,'hardware-v3').setCheck('blank','a','built',true);
 await assert.rejects(c.import(bundle,'keep',preview),/stale/);
 assert.equal(imported,false);
});
test('failed server recovery compensates browser rollback',async()=>{
 const s=storage();s.setItem('dd-studio-personal','after');s.setItem(JOURNAL_KEY,JSON.stringify({operation:'x',writes:[{key:'dd-studio-personal',before:'before',after:'after'}]}));
 const c=createBackupController(s,[{id:'a'}],async()=>{throw Error('database busy');});
 await assert.rejects(c.restore());assert.equal(s.getItem('dd-studio-personal'),'after');assert.ok(c.pending());
});
test('insufficient browser capacity rejects before SQLite import',async()=>{
 const s=storage();let imported=false;
 const set=s.setItem;s.setItem=(k,v)=>{if(k==='dd-backup-capacity')throw Error('quota');set(k,v);};
 const c=createBackupController(s,[{id:'a'}],async(method,path)=>{
  if(path==='/backup/preview')return{revision:'r'};if(path==='/schemes')return[];
  if(path==='/backup/import')imported=true;
 });
 const bundle={browser:{draft:null,progress:[]}},p=await c.preview(bundle);
 await assert.rejects(c.import(bundle,'keep',p),/quota/);assert.equal(imported,false);assert.equal(c.pending(),null);
});
