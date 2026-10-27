/** Native nginx protocol checks with synthetic bytes; no Docker, asset pack or backend. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,writeFile,rm,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,delimiter} from 'node:path';
import {createServer} from 'node:net';
import {request,type IncomingHttpHeaders} from 'node:http';
import {gzipSync} from 'node:zlib';
import {setTimeout as delay} from 'node:timers/promises';

const repository=resolve(import.meta.dirname,'../..');
const nginx=process.env.DUCK_NGINX_BIN||(process.env.PATH??'').split(delimiter).map(directory=>join(directory,process.platform==='win32'?'nginx.exe':'nginx')).find(existsSync)||(existsSync('/opt/homebrew/bin/nginx')?'/opt/homebrew/bin/nginx':undefined);
const skip=nginx?false:'native nginx is not installed; no Docker required';
interface Reply {status:number;headers:IncomingHttpHeaders;body:Buffer}
async function temporaryPort():Promise<number>{const listener=createServer();await new Promise<void>((done,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',done);});try{const address=listener.address();if(!address||typeof address==='string')throw Error('Missing temporary port');assert.notEqual(address.port,8876);return address.port;}finally{await new Promise<void>((done,reject)=>listener.close(error=>error?reject(error):done()));}}
function get(port:number,encoding?:string,path='/assets/geometry.positions.bin',extra:Record<string,string>={}):Promise<Reply>{return new Promise((done,reject)=>{const headers={...extra,...(encoding===undefined?{}:{'Accept-Encoding':encoding})};const req=request({host:'127.0.0.1',port,path,headers,agent:false},response=>{const chunks:Buffer[]=[];response.on('data',(chunk:Buffer)=>chunks.push(chunk));response.once('error',reject);response.once('end',()=>done({status:response.statusCode??0,headers:response.headers,body:Buffer.concat(chunks)}));});req.once('error',reject);req.setTimeout(2000,()=>req.destroy(Error('Synthetic nginx request timed out')));req.end();});}
async function stop(child:ChildProcess){if(!child.pid||child.exitCode!==null||child.signalCode!==null)return;const exited=once(child,'exit');child.kill('SIGTERM');const timer=setTimeout(()=>child.kill('SIGKILL'),3000);try{await exited;}finally{clearTimeout(timer);}}
async function fixture(body:(value:{base:string;assets:string;port:number})=>Promise<void>){
 const base=await mkdtemp(join(tmpdir(),'duck-nginx-static-')),assets=join(base,'assets');let port=0,child:ChildProcess|undefined;
 try{
  port=await temporaryPort();await mkdir(assets);await mkdir(join(base,'static'));await writeFile(join(base,'index.html'),'<p>synthetic</p>');
  let config=await readFile(join(repository,'frontend/nginx.conf'),'utf8');
  const quote=(path:string)=>JSON.stringify(path.replaceAll('\\','/'));
  config=config.replace('listen 80;',`listen 127.0.0.1:${port};`).replace('http://backend:8876','http://127.0.0.1:1').replace('alias /assets/;',`alias ${quote(assets+'/')};`).replace('root /;',`root ${quote(base)};`).replace('root /usr/share/nginx/html;',`root ${quote(base)};`);
  const path=join(base,'nginx.conf');await writeFile(path,`daemon off; master_process off; pid ${quote(join(base,'nginx.pid'))}; error_log ${quote(join(base,'error.log'))};\nevents {}\nhttp { access_log off; ${config} }`);
  assert.ok(nginx);child=spawn(nginx,['-p',base+'/','-c',path],{stdio:['ignore','pipe','pipe']});let stderr='';child.stderr?.on('data',chunk=>{stderr+=String(chunk);});let spawnError:Error|undefined;child.once('error',error=>{spawnError=error;});
  let ready=false;for(let attempt=0;attempt<100;attempt++){if(spawnError)throw spawnError;if(child.exitCode!==null||child.signalCode!==null)throw Error('nginx rejected its actual configuration: '+stderr);try{await get(port,undefined,'/index.html');ready=true;break;}catch{await delay(20);}}
  assert.ok(ready,'nginx did not start: '+stderr);await body({base,assets,port});
 }finally{
  if(child)await stop(child);await rm(base,{recursive:true,force:true});
  const pid=child?.pid;if(pid)assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});
  assert.equal(existsSync(base),false);
  if(port)await assert.rejects(get(port,undefined,'/index.html'),/ECONNREFUSED|socket|connect/);
 }
}

test('nginx negotiates identity/br/gzip, q=0, validators, missing sidecars and licensed-source boundaries',{skip},async()=>fixture(async({assets,port})=>{
 const raw=Buffer.from('hello world'),br=Buffer.from('0b058068656c6c6f20776f726c6403','hex'),gzip=gzipSync(raw),pack=join(assets,'geometry.positions.bin');
 await writeFile(pack,raw);await writeFile(pack+'.br',br);await writeFile(pack+'.gz',gzip);
 for(const name of ['source.3mf','source.3mf.br','source.3mf.gz'])await writeFile(join(assets,name),'private');
 const cases:[string|undefined,string|undefined,Buffer][]=[['br, gzip','br',br],['gzip','gzip',gzip],['BR;q=0.5, gzip','br',br],['br;q=0, gzip','gzip',gzip],['br;q=0.000, gzip;q=0',undefined,raw],['xbr',undefined,raw],['identity',undefined,raw],[undefined,undefined,raw],['br;q=0,br,gzip','gzip',gzip],['gzip;q=0,gzip',undefined,raw]];
 for(const[accept,want,payload]of cases){const answer=await get(port,accept);assert.equal(answer.status,200);assert.equal(answer.headers['content-encoding'],want);assert.deepEqual(answer.body,payload);assert.match(answer.headers.vary??'',/Accept-Encoding/);assert.equal(answer.headers['content-type'],'application/octet-stream');assert.equal(answer.headers['cache-control'],'public, max-age=604800');}
 const before=await get(port,'br');assert.ok(typeof before.headers.etag==='string');assert.equal((await get(port,'br',undefined,{'If-None-Match':before.headers.etag})).status,304);
 await unlink(pack+'.br');assert.deepEqual((await get(port,'br, gzip')).body,gzip);
 await unlink(pack+'.gz');assert.deepEqual((await get(port,'br, gzip')).body,raw);assert.equal((await get(port,'br, gzip')).headers['content-encoding'],undefined);
 for(const name of ['source.3mf','source.3mf.br','source.3mf.gz'])assert.equal((await get(port,'br, gzip','/assets/'+name)).status,404);
 await unlink(pack);assert.equal((await get(port,'br, gzip')).status,404);
}));

test('nginx keeps Vite-hashed code immutable and revalidates unhashed code',{skip},async()=>fixture(async({base,port})=>{
 const hashed=['/static/name-01234567.js','/static/style-AB_cd-12.css'],plain=['/static/name.js','/static/name-1234567.js','/plain.mjs','/plain.css'];
 for(const path of [...hashed,...plain])await writeFile(join(base,path),'synthetic code');
 for(const path of hashed){const answer=await get(port,undefined,path);assert.equal(answer.status,200);assert.equal(answer.headers['cache-control'],'public, max-age=31536000, immutable');}
 for(const path of plain){const answer=await get(port,undefined,path);assert.equal(answer.status,200);assert.equal(answer.headers['cache-control'],'no-cache');}
 assert.equal((await get(port,undefined,'/static/name.js?v=legacy')).headers['cache-control'],'public, max-age=31536000, immutable');
 assert.equal((await get(port,undefined,'/index.html')).headers['cache-control'],'no-cache');
}));
