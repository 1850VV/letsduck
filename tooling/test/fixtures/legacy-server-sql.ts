/** Independent SQL consumer of frozen Python schema/account fields; never imports ServerStore. */
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createConnection} from 'mysql2/promise';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';

type Cell=string|number|bigint|null;
type Row=Record<string,Cell>;
const object=(value:unknown):Record<string,unknown>=>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid server SQL oracle');return value as Record<string,unknown>;};
const text=(value:unknown):string=>{if(typeof value!=='string')throw Error('Invalid server SQL text');return value;};
const cell=(value:unknown):Cell=>{if(value===null||typeof value==='string'||typeof value==='bigint'||typeof value==='number'&&Number.isSafeInteger(value))return value;throw Error('Unsafe SQL fixture value');};
const oracle=object(JSON.parse(readFileSync(new URL('../oracles/server-storage-v1.json',import.meta.url),'utf8'))),standalone=object(oracle.standalone);
const user=Object.fromEntries(Object.entries(object(standalone.user)).map(([name,value])=>[name,cell(value)])),session=Object.fromEntries(Object.entries(object(standalone.session)).map(([name,value])=>[name,cell(value)]));
interface Account {token:string;user:{id:string;name:string;avatar:string;color:string;created:number}}
function account():Account{const value=object(standalone.account),entry=object(value.user);if(typeof entry.created!=='number'||!Number.isSafeInteger(entry.created))throw Error('Invalid fixture timestamp');return{token:text(value.token),user:{id:text(entry.id),name:text(entry.name),avatar:text(entry.avatar),color:text(entry.color),created:entry.created}};}
const originalAccount=account();
interface Reader {rows(sql:string,params?:Cell[]):Promise<Row[]>;run(sql:string,params?:Cell[]):Promise<void>;close():Promise<void>}
function mysqlUrl(target:string):string{const url=new URL(target.replace(/^mysql\+pymysql:/,'mysql:'));if(url.protocol!=='mysql:'||!/^\/duck_test_[^/]+$/.test(decodeURIComponent(url.pathname)))throw Error('Legacy SQL consumer requires disposable duck_test_* MySQL');url.searchParams.set('supportBigNumbers','true');url.searchParams.set('bigNumberStrings','true');return url.toString();}
function sqlitePath(target:string){return target.startsWith('sqlite:///')?target.slice('sqlite:///'.length):target;}
async function connect(target:string):Promise<Reader>{
 if(!/^mysql(?:\+pymysql)?:/.test(target)){
  const db=new DatabaseSync(sqlitePath(target));
  return{async rows(sql,params=[]){const query=db.prepare(sql);query.setReadBigInts(true);return query.all(...params).map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[key,cell(value)])));},async run(sql,params=[]){db.prepare(sql).run(...params);},async close(){db.close();}};
 }
 const db=await createConnection(mysqlUrl(target));
 return{async rows(sql,params=[]){const[raw]=await db.execute(sql,params.map(value=>typeof value==='bigint'?String(value):value));if(!Array.isArray(raw))throw Error('Expected server SQL rows');return raw.map(row=>Object.fromEntries(Object.entries(object(row)).map(([key,value])=>[key,cell(value)])));},async run(sql,params=[]){await db.execute(sql,params.map(value=>typeof value==='bigint'?String(value):value));},async close(){await db.end();}};
}
function same(left:Cell|undefined,right:Cell){return typeof right==='number'||typeof right==='bigint'?left!==null&&left!==undefined&&BigInt(left)===BigInt(right):left===right;}
async function insert(reader:Reader,table:'users'|'sessions',row:Row){const names=Object.keys(row);await reader.run(`INSERT INTO ${table} (${names.join(',')}) VALUES (${names.map(()=>'?').join(',')})`,Object.values(row));}
export async function legacyServerAccount(target:string):Promise<{status:number;stderr:string;stdout:string;account:Account}>{
 let reader:Reader|undefined;
 try{
  reader=await connect(target);const old=(await reader.rows('SELECT * FROM users WHERE id=?',[originalAccount.user.id]))[0];
  if(!old)await insert(reader,'users',user);else for(const[key,value]of Object.entries(user))assert.ok(same(old[key],value),'Frozen legacy account changed: '+key);
  const prior=(await reader.rows('SELECT * FROM sessions WHERE token=?',[originalAccount.token]))[0];
  if(!prior)await insert(reader,'sessions',session);else for(const[key,value]of Object.entries(session))assert.ok(same(prior[key],value),'Frozen legacy session changed: '+key);
  return{status:0,stderr:'',stdout:text(standalone.accountOutput),account:originalAccount};
 }catch(error){return{status:1,stderr:error instanceof Error?error.message:String(error),stdout:'',account:originalAccount};}
 finally{await reader?.close();}
}
function json(source:string):unknown{return JSON.parse(source,(_key:string,value:unknown,context?:{source?:string})=>typeof value==='number'&&!Number.isSafeInteger(value)&&context?.source&&/^-?\d+$/.test(context.source)?BigInt(context.source):value);}
export async function legacyServerReadback(target:string,token:string,workId:string):Promise<{status:number;stderr:string;stdout:string}>{
 let reader:Reader|undefined;
 try{
  reader=await connect(target);
  const profile=(await reader.rows('SELECT u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=?',[token]))[0];assert.ok(profile);assert.equal(profile.name,'新鸭🦆');
  const login=(await reader.rows('SELECT * FROM users WHERE name_key=?',['新鸭🦆']))[0];assert.ok(login);assert.equal(login.id,profile.id);
  assert.equal(pbkdf2Sync('new-password',Buffer.from(text(login.pw_salt),'hex'),120000,32,'sha256').toString('hex'),login.pw_hash);
  // Old Store.login writes a new retained session as well as verifying the hash.
  const freshToken=randomBytes(32).toString('base64url');await reader.run('INSERT INTO sessions (token,user_id,created) VALUES (?,?,?)',[freshToken,text(profile.id),Date.now()]);assert.equal((await reader.rows('SELECT user_id FROM sessions WHERE token=?',[freshToken]))[0]?.user_id,profile.id);
  const scheme=(await reader.rows('SELECT * FROM schemes WHERE user_id=? ORDER BY updated DESC,id DESC',[text(profile.id)]))[0];assert.ok(scheme);assert.equal(scheme.name,'往返🦆');assert.equal(BigInt(cell(scheme.voice_salt)!),9007199254740993n);assert.equal(object(json(text(scheme.provenance))).n,9007199254740993n);
  const work=(await reader.rows('SELECT * FROM works WHERE id=? AND user_id=?',[workId,text(profile.id)]))[0];assert.ok(work);assert.equal(work.scheme_id,scheme.id);assert.equal(work.title,'TS作品');
  return{status:0,stderr:'',stdout:'legacy-sql-readback-ok'};
 }catch(error){return{status:1,stderr:error instanceof Error?error.message:String(error),stdout:''};}
 finally{await reader?.close();}
}
/** Closed, disposable target only. Replay actual old Python DDL, including MySQL dialect compilation. */
export async function legacyServerSchema(target:string):Promise<void>{
 const tables=['ratings','works','schemes','sessions','users','migration_runs'];
 if(!/^mysql(?:\+pymysql)?:/.test(target)){
  const db=new DatabaseSync(sqlitePath(target));try{db.exec('PRAGMA foreign_keys=OFF;'+tables.map(name=>'DROP TABLE IF EXISTS '+name+';').join('')+text(standalone.sqliteSql));db.exec('PRAGMA foreign_keys=ON');assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);}finally{db.close();}return;
 }
 const db=await connect(target);
 try{await db.run('SET FOREIGN_KEY_CHECKS=0');for(const table of tables)await db.run('DROP TABLE IF EXISTS '+table);if(!Array.isArray(standalone.mysqlStatements))throw Error('Invalid MySQL schema oracle');for(const sql of standalone.mysqlStatements)await db.run(text(sql));}
 finally{try{await db.run('SET FOREIGN_KEY_CHECKS=1');}finally{await db.close();}}
}
