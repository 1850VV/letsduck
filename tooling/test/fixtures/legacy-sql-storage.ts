/** Independent SQL fixture/consumer. Does not import the migration, Store or their JSON helpers. */
import {readFileSync} from 'node:fs';
import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {createHash,pbkdf2Sync} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createConnection} from 'mysql2/promise';

type Row=Record<string,string|number|bigint|null>;
const object=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Oracle object expected');return v as Record<string,unknown>;};
const text=(v:unknown):string=>{if(typeof v!=='string')throw Error('Oracle text expected');return v;};
const file=object(JSON.parse(readFileSync(new URL('../oracles/storage-python-v1.json',import.meta.url),'utf8')));
const columns=Object.fromEntries(Object.entries(object(file.columns)).map(([name,v])=>{if(!Array.isArray(v))throw Error('Oracle columns expected');return[name,v.map(text)];}));
export const storageOracle={sourceSha:text(file.sourceSha),snapshot:text(file.snapshot),fingerprint:text(object(file.receipt).fingerprint),legacySql:text(file.legacySql),migratedSql:text(file.migratedSql),sortFingerprint:text(object(file.sort).fingerprint),fractionFingerprint:text(object(file.fraction).fingerprint),canonicalExpected:text(object(file.canonical).expected)};

/** A fixture status confirms that today's input is the exact recorded Python input. */
export function frozenPythonResult(kind:'sort'|'fraction'|'canonical',input:unknown):{status:number;stderr:string;stdout:string}{
 const saved=object(file[kind]),matched=stringify(input)===text(saved.input);
 return{status:matched?0:1,stderr:matched?'':'Input differs from the frozen Python oracle',stdout:text(kind==='canonical'?saved.expected:saved.fingerprint)};
}

// JSON integer tokens stay literal. The source rows come from native integer reads,
// never from the serializer whose canonical behavior the tests are checking.
function stringify(v:unknown,canonical=false):string {
 if(v===null)return'null';
 if(typeof v==='bigint')return String(v);
 if(typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);
 if(typeof v==='number'){if(!Number.isFinite(v))throw Error('Non-finite SQL cell');return JSON.stringify(v);}
 if(Array.isArray(v))return'['+v.map(v=>stringify(v,canonical)).join(',')+']';
 const entries=Object.entries(object(v));if(canonical)entries.sort(([a],[b])=>compare(a,b));
 return'{'+entries.map(([k,v])=>JSON.stringify(k)+':'+stringify(v,canonical)).join(',')+'}';
}
function compare(a:string,b:string):number {const x=Array.from(a),y=Array.from(b);for(let i=0;i<Math.min(x.length,y.length);i++){const d=x[i]!.codePointAt(0)!-y[i]!.codePointAt(0)!;if(d)return d;}return x.length-y.length;}
const pythonString=(v:Row[string])=>v===null?'None':String(v);
function sorted(data:Record<string,Row[]>):Record<string,Row[]>{return Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,[...rows].sort((a,b)=>{for(const key of columns[name]!){const d=compare(pythonString(a[key]!),pythonString(b[key]!));if(d)return d;}return 0;})]));}
const digest=(data:Record<string,Row[]>)=>createHash('sha256').update(stringify(sorted(data),true)).digest('hex');
interface Reader {rows(sql:string,params?:SQLInputValue[]):Promise<Row[]>;run(sql:string,params?:SQLInputValue[]):Promise<void>;close():Promise<void>}
function sqlitePath(target:string):string {return target.startsWith('sqlite:///')?target.slice('sqlite:///'.length).split('?')[0]!:target;}
function cell(value:unknown):Row[string]{if(value===null||typeof value==='string'||typeof value==='bigint'||typeof value==='number')return value;throw Error('Unexpected fixture SQL cell');}
function mysqlParameters(values:SQLInputValue[]):(string|number|null)[]{return values.map(v=>{if(typeof v==='bigint')return String(v);if(v===null||typeof v==='string'||typeof v==='number')return v;throw Error('Unexpected binary fixture parameter');});}

async function connect(target:string,readOnly=false):Promise<Reader>{
 if(!/^mysql(?:\+pymysql)?:/.test(target)){
  const db=new DatabaseSync(sqlitePath(target),{readOnly});
  return{async rows(sql,params=[]){const statement=db.prepare(sql);statement.setReadBigInts(true);return statement.all(...params).map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,cell(v)])));},async run(sql,params=[]){db.prepare(sql).run(...params);},async close(){db.close();}};
 }
 const url=new URL(target.replace(/^mysql\+pymysql:/,'mysql:'));if(!/^\/duck_test_[^/]+$/.test(decodeURIComponent(url.pathname)))throw Error('Legacy SQL consumer requires disposable duck_test_* MySQL');
 url.searchParams.set('supportBigNumbers','true');url.searchParams.set('bigNumberStrings','true');
 const db=await createConnection(url.toString());
 return{async rows(sql,params=[]){const [raw]=await db.execute(sql,mysqlParameters(params));if(!Array.isArray(raw))throw Error('Expected SQL rows');return raw.map(v=>Object.fromEntries(Object.entries(object(v)).map(([k,v])=>[k,typeof v==='string'&&/^(?:created|updated|voice_salt|stars|count|mine)$/.test(k)&&/^-?\d+$/.test(v)?BigInt(v):cell(v)])));},async run(sql,params=[]){await db.execute(sql,mysqlParameters(params));},async close(){await db.end();}};
}
async function dataFrom(reader:Reader):Promise<Record<string,Row[]>>{const data:Record<string,Row[]>={};for(const[name,keys]of Object.entries(columns))data[name]=await reader.rows('SELECT '+keys.join(',')+' FROM '+name);return sorted(data);}
export async function legacySnapshot(target:string):Promise<string>{const reader=await connect(target,true);try{const data=await dataFrom(reader);return stringify({fingerprint:digest(data),data});}finally{await reader.close();}}
const check=(condition:unknown,message:string)=>{if(!condition)throw Error(message);};
async function rollback(target:string):Promise<string>{
 const r=await connect(target);
 try{
  const user=(await r.rows('SELECT id,pw_salt,pw_hash FROM users WHERE name_key=?',['alpha']))[0];
  check(user&&user.id==='u-a'&&typeof user.pw_salt==='string'&&pbkdf2Sync('legacy-pass',Buffer.from(user.pw_salt,'hex'),120000,32,'sha256').toString('hex')===user.pw_hash,'Legacy SQL password authentication failed');
  check((await r.rows('SELECT user_id FROM sessions WHERE token=?',['retained-token-b']))[0]?.user_id==='u-b','Retained session token changed');
  const scheme=(await r.rows('SELECT name,voice_salt FROM schemes WHERE id=? AND user_id=?',['node-added','u-a']))[0];
  check(scheme?.name==='Node 写入🦆'&&BigInt(scheme.voice_salt!)===9007199254740993n,'Node-written scheme or exact salt changed');
  const rating=(await r.rows('SELECT COUNT(*) AS count,AVG(stars) AS average FROM ratings WHERE work_id=?',['w-root']))[0];
  check(BigInt(rating!.count!)===1n&&Number(rating!.average)===4,'Legacy rating aggregate changed');
  check(BigInt((await r.rows('SELECT stars FROM ratings WHERE work_id=? AND user_id=?',['w-root','u-b']))[0]!.stars!)===4n,'Legacy viewer rating changed');
  check((await r.rows('SELECT parent_id FROM works WHERE id=?',['w-fork']))[0]?.parent_id==='w-root','Fork relationship changed');
  const design='{"colors": {"P1-01": "#FFFFFF"}, "assignments": {"P1-01": "pla-white"}, "finishes": {}}',now=BigInt(Date.now());
  await r.run('INSERT INTO schemes (id,user_id,name,design,provenance,voice_salt,created,updated) VALUES (?,?,?,?,?,?,?,?)',['python-added','u-a','Python 回退写入',design,null,9007199254740995n,now,now]);
  return'{"ok":true}';
 }finally{await r.close();}
}
async function receipt(source:string,target:string):Promise<string>{
 check(await legacySnapshot(source)===storageOracle.snapshot,'Frozen legacy receipt fixture requires its original synthetic source');
 const db=new DatabaseSync(sqlitePath(target));
 try{
  const exists=db.prepare("SELECT name FROM sqlite_master WHERE name='migration_runs'").get();
  if(!exists){db.exec('PRAGMA foreign_keys=OFF;'+storageOracle.migratedSql+';PRAGMA foreign_keys=ON');check(db.prepare('PRAGMA foreign_key_check').all().length===0,'Frozen receipt foreign keys failed');return'{"status":"migrated"}';}
  check(db.prepare('SELECT fingerprint FROM migration_runs WHERE fingerprint=?').get(storageOracle.fingerprint),'Receipt was not recognized');
 }finally{db.close();}
 check(await legacySnapshot(target)===storageOracle.snapshot,'Node target original fields differ from the frozen Python snapshot');
 return'{"status":"already_migrated"}';
}
async function main(op:string,path:string,extra:string|undefined):Promise<string>{
 if(op==='create'){const db=new DatabaseSync(path);try{db.exec(storageOracle.legacySql);}finally{db.close();}return'';}
 if(op==='snapshot'||op==='target')return legacySnapshot(path);
 if(op==='rollback')return rollback(path);
 if(op==='receipt'&&extra)return receipt(path,extra);
 throw Error('Unknown independent SQL fixture operation');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const[op,path,extra]=process.argv.slice(2);if(!op||!path)throw Error('Legacy fixture needs an operation and temporary path');process.stdout.write(await main(op,path,extra));}
 catch(error){process.stderr.write(error instanceof Error?error.message:String(error));process.exitCode=1;}
}
