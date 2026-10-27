/** Synthetic SQL captured from old Python; independent of PersonalStore and domain JSON code. */
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {frozenOracle} from './frozen-oracle.js';

type ObjectValue=Record<string,unknown>;
const object=(value:unknown):ObjectValue=>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid personal SQL oracle');return value as ObjectValue;};
const text=(value:unknown):string=>{if(typeof value!=='string')throw Error('Invalid personal SQL text');return value;};
const oracle=object(JSON.parse(readFileSync(new URL('../oracles/personal-storage-v1.json',import.meta.url),'utf8')));
const fixtures=object(oracle.fixtures);
// Native Node24 JSON source tokens retain integers; no adapter/serializer under test is used.
function json(source:string):unknown{return JSON.parse(source,(_key:string,value:unknown,context?:{source?:string})=>typeof value==='number'&&!Number.isSafeInteger(value)&&context?.source&&/^-?\d+$/.test(context.source)?BigInt(context.source):value);}
function readback(path:string):string {
 const db=new DatabaseSync(path,{readOnly:true});
 const rows=(sql:string,...params:(string|number)[])=>{const query=db.prepare(sql);query.setReadBigInts(true);return query.all(...params);};
 try{
  const schemes=rows('SELECT * FROM schemes ORDER BY updated DESC,id DESC'),scheme=schemes[0];assert.ok(scheme);
  assert.equal(scheme.name,'Node🦆');assert.equal(scheme.voice_salt,9007199254740993n);assert.equal(scheme.created,9007199254740999n);
  assert.deepEqual(json(text(scheme.provenance)),{nested:9007199254740995n});
  for(const[board,counter]of [['Python板',9007199254740997n],['Node板',-9007199254741005n]] as const){
   const row=rows('SELECT record FROM servo_setup WHERE board=? ORDER BY id',board)[0];assert.ok(row);
   const record=object(json(text(row.record)));assert.equal(object(record.evidence).counter,counter);
  }
  const preparation=rows('SELECT * FROM servo_preparation ORDER BY id');
  assert.deepEqual(preparation.map(row=>[row.id,row.state,json(text(row.prepared_leads))]),[[12n,'installed',['线']],[14n,'available',[9007199254741007n]]]);
  assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check,'ok');
  return JSON.stringify({schemes:schemes.length,servo:rows('SELECT board,id FROM servo_setup').length,preparation:preparation.length});
 }finally{db.close();}
}
export function legacyPersonalSql(path:string,operation:'records'|'readback'|'legacy30'|'legacy1'|'busy'):{status:number;stderr:string;stdout:string}{
 try{
  if(operation==='readback')return{status:0,stderr:'',stdout:readback(path)};
  const fixture=object(fixtures[operation==='busy'?'empty':operation]);
  const db=new DatabaseSync(path);try{db.exec(text(fixture.sql));assert.equal(db.prepare('PRAGMA integrity_check').get()?.integrity_check,'ok');}finally{db.close();}
  if(operation==='busy')return frozenOracle('personal-storage-v1',JSON.stringify({operation:'busy-timeout'}));
  return{status:0,stderr:'',stdout:''};
 }catch(error){return{status:1,stderr:error instanceof Error?error.message:String(error),stdout:''};}
}
