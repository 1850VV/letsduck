#!/usr/bin/env node
/** Real root-context web image acceptance. Run explicitly in Docker-capable CI. */
import assert from 'node:assert/strict';
import {spawn,type ChildProcess} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,readFile,rm,rmdir,lstat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {setTimeout as delay} from 'node:timers/promises';
import {writeSyntheticAssets} from './synthetic-assets.js';

const root=fileURLToPath(new URL('../../',import.meta.url));
const {values}=parseArgs({options:{image:{type:'string'},'backend-image':{type:'string'},help:{type:'boolean'}}});
if(values.help){console.log('Usage: tsx tooling/test/web-container.ts [--image EXISTING_WEB_IMAGE] [--backend-image EXISTING_NODE_IMAGE]\nBuilds frontend/Dockerfile from repository ROOT context; verifies private-context exclusion, six built HTML routes, every hashed JS/CSS MIME/cache, three JSON resources, no Python/data and nginx proxy to an owned temporary Node backend. Cleans all owned Docker resources.');process.exit(0);}
for(const image of [values.image,values['backend-image']])if(image&&!/^[A-Za-z0-9][A-Za-z0-9/_.:@-]*$/.test(image))throw Error('Invalid image reference');
const id=`duck-phase6-web-${process.pid}-${randomBytes(5).toString('hex')}`,webImage=values.image??`${id}:web`,backendImage=values['backend-image']??`${id}:backend`,contextImage=`${id}:context`,network=`${id}-net`,volume=`${id}-data`;
const containers:string[]=[],images:string[]=[],networks:string[]=[],volumes:string[]=[],canaries:string[]=[],directories:string[]=[];
const children=new Set<ChildProcess>(),abort=new AbortController();
const interrupt=()=>{abort.abort();for(const child of children)child.kill('SIGTERM');};process.on('SIGINT',interrupt);process.on('SIGTERM',interrupt);
const message=(error:unknown)=>error instanceof Error?error.message:String(error);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
async function command(binary:string,args:string[],allowFailure=false,cleanup=false):Promise<{output:string;error:string;code:number|null}>{
 if(abort.signal.aborted&&!cleanup)throw Error('Interrupted');
 return new Promise((accept,reject)=>{const child=spawn(binary,args,{cwd:root,stdio:['ignore','pipe','pipe']});children.add(child);let output='',error='';
  child.stdout.on('data',(bytes:Buffer)=>{output=(output+String(bytes)).slice(-2_000_000);});child.stderr.on('data',(bytes:Buffer)=>{error=(error+String(bytes)).slice(-2_000_000);});
  const timeout=setTimeout(()=>child.kill('SIGKILL'),15*60_000);timeout.unref();
  child.once('error',failure=>{clearTimeout(timeout);children.delete(child);reject(failure);});child.once('close',code=>{clearTimeout(timeout);children.delete(child);if(code===0||allowFailure)accept({output,error,code});else reject(Error(`${binary} ${args[0]} failed (${code}): ${error||output}`));});
 });
}
const docker=(...args:string[])=>command('docker',args);
async function ownDirectory(path:string){try{await lstat(path);}catch(error){if(!record(error)||error.code!=='ENOENT')throw error;await mkdir(path);directories.push(path);}}
async function canary(path:string){await writeFile(join(root,path),'Public CI exclusion probe; no private data.\n',{flag:'wx'});canaries.push(path);}
async function contextProbe(temporary:string){
 await ownDirectory(join(root,'.ryugi'));await canary(`.ryugi/${id}.txt`);await canary(`.env.${id}`);await canary(`${id}.db`);await canary(`packages/domain/src/.env.${id}`);await canary(`packages/domain/${id}.tsbuildinfo`);
 // Never write through an existing assets directory or stable-data symlink.
 try{await lstat(join(root,'assets'));}catch(error){if(!record(error)||error.code!=='ENOENT')throw error;await mkdir(join(root,'assets'));directories.push(join(root,'assets'));await canary(`assets/${id}.3mf`);}
 const forbidden=['.ryugi','.git','assets','node_modules',...canaries];
 const shell=forbidden.map(path=>`test ! -e '/context/${path}'`).join(' && ')+ ' && (test ! -d /context/frontend/dist || test -z "$(find /context/frontend/dist -type f -print)") && test -z "$(find /context -type f -name \"*.tsbuildinfo\" -print)"';
 const dockerfile=join(temporary,'context.Dockerfile');await writeFile(dockerfile,`FROM ${webImage}\nCOPY . /context\nRUN ${shell}\n`);images.push(contextImage);await docker('build','--file',dockerfile,'--tag',contextImage,root);
 console.log('PASS private .ryugi/Git/assets/env/DB/dist/node_modules and incremental tsbuildinfo excluded from actual ROOT context');
}
async function request(url:string,path:string,options:RequestInit={}):Promise<Response>{return fetch(url+path,{...options,signal:AbortSignal.timeout(15_000)});}
async function json(url:string,path:string,options:RequestInit={}):Promise<Record<string,unknown>>{const response=await request(url,path,options),body:unknown=await response.json();assert.equal(response.status,200,JSON.stringify(body));assert.ok(record(body));return body;}
async function ready(url:string){const deadline=performance.now()+60_000;while(performance.now()<deadline){if(abort.signal.aborted)throw Error('Interrupted');try{if((await request(url,'/api/health')).status===200)return;}catch{}await delay(150);}throw Error('Owned web/backend proxy did not become ready');}
async function checkImage(){
 const name=`${id}-filesystem`;containers.push(name);await docker('run','--name',name,'--entrypoint','sh',webImage,'-ec',
  'for p in python python3 adb node npm; do ! command -v "$p"; done; for p in /source /context /app /assets /usr/share/nginx/html/.ryugi /usr/share/nginx/html/.git /usr/share/nginx/html/node_modules; do test ! -e "$p"; done; test -z "$(find /usr/share/nginx/html -type f \\( -name \"*.py\" -o -name \"*.db\" -o -name \"*.sqlite*\" -o -name \"*.3mf\" -o -name \"*.bin\" -o -name \".env*\" \\) -print)"');
 console.log('PASS final nginx image has no Python/ADB/Node runtime, licensed model data, DB or private source');
}
async function checkStatic(url:string,container:string){
 const routes=['/','/home.html','/gallery/','/assemble/','/debug/','/assemble/audio-credits.html'];
 for(const path of routes){const response=await request(url,path),html=await response.text();assert.equal(response.status,200,path);assert.match(response.headers.get('content-type')??'',/^text\/html/);assert.equal(response.headers.get('cache-control'),'no-cache');if(path!=='/assemble/audio-credits.html')assert.match(html,/<script[^>]+type="module"[^>]+src="[^"]+-[A-Za-z0-9_-]{8,}\.js"/);else{assert.ok(html.includes('https://creativecommons.org/licenses/by/3.0/'));assert.ok(html.includes('Kevin MacLeod'));}assert.doesNotMatch(html,/<script[^>]+src="[^"]+\.ts(?:\?|"|$)/);}
 const list=(await docker('exec',container,'find','/usr/share/nginx/html','-type','f','-print')).output.trim().split('\n'),code=list.filter(path=>/\.(?:js|css)$/.test(path));assert.ok(code.length>=6);assert.ok(code.some(path=>/positions-worker-[^/]+\.js$/.test(path)));
 for(const path of code){const relative=path.replace('/usr/share/nginx/html','');assert.match(relative,/^\/static\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/);const response=await request(url,relative);assert.equal(response.status,200,relative);assert.match(response.headers.get('content-type')??'',path.endsWith('.css')?/^text\/css/:/^(?:text|application)\/javascript/);assert.match(response.headers.get('cache-control')??'',/public, max-age=31536000, immutable/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.ok((await response.arrayBuffer()).byteLength>0);}
 for(const path of ['/assemble/servo-map.json','/assemble/servo-leads.json','/shared/servo-map.json']){const response=await request(url,path);assert.equal(response.status,200,path);assert.match(response.headers.get('content-type')??'',/^application\/json/);const bytes=Buffer.from(await response.arrayBuffer()),source=await readFile(join(root,'frontend',path==='/shared/servo-map.json'?'assemble/servo-map.json':path.slice(1)));assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(source).digest('hex'));JSON.parse(bytes.toString('utf8'));}
 assert.equal((await request(url,'/assets/source.3mf')).status,404);
 const model=await request(url,'/assets/model.json');assert.equal(model.status,200);assert.match(model.headers.get('content-type')??'',/^application\/json/);assert.equal(model.headers.get('cache-control'),'public, max-age=604800');
 console.log(`PASS six built HTML routes, ${code.length} exact hashed JS/CSS MIME/cache including Worker, three byte-identical authored JSON resources and source3MF denial`);
}
async function checkProxy(url:string){
 const health=await json(url,'/api/health'),site=await json(url,'/api/site');assert.equal(health.version,'3.1.0');assert.equal(site.edition,'server');
 const name=`web${randomBytes(5).toString('hex')}`,session=await json(url,'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,password:'temporary-web-CI-fixture'})});assert.equal(typeof session.token,'string');assert.ok(record(session.user));assert.equal(session.user.name,name);
 const authorization={Authorization:'Bearer '+String(session.token)},me=await json(url,'/api/me',{headers:authorization});assert.equal(me.id,session.user.id);assert.equal(me.name,name);
 const scheme=await json(url,'/api/schemes/container-fixture',{method:'PUT',headers:{...authorization,'Content-Type':'application/json'},body:JSON.stringify({name:'Owned nginx proxy scheme',design:{colors:Object.fromEntries(Array.from({length:35},(_,i)=>['p'+i,'#FFFFFF'])),assignments:{},finishes:{}}})});assert.equal(scheme.name,'Owned nginx proxy scheme');
 assert.equal((await request(url,'/api/duck-debug/status')).status,404);
 console.log('PASS unchanged nginx /api proxy reaches owned Node server: health/site, JSON POST registration, bearer GET /me, authenticated PUT scheme and no hardware API');
}
let temporary:string|undefined,failure:unknown;
try{
 // Fail before filesystem canaries/resources when the daemon is unavailable.
 await docker('info');temporary=await mkdtemp(join(tmpdir(),id+'-'));const assets=join(temporary,'assets');await mkdir(assets);writeSyntheticAssets(assets);
 if(!values.image){images.push(webImage);await docker('build','--file','frontend/Dockerfile','--tag',webImage,root);}
 if(!values['backend-image']){images.push(backendImage);await docker('build','--file','backend/Dockerfile','--tag',backendImage,root);}
 await contextProbe(temporary);await checkImage();networks.push(network);await docker('network','create',network);volumes.push(volume);await docker('volume','create',volume);
 const backend=`${id}-backend`,web=`${id}-nginx`;containers.push(backend);await docker('run','--detach','--name',backend,'--network',network,'--network-alias','backend','--mount',`type=volume,source=${volume},target=/data`,'--mount',`type=bind,source=${assets},target=/assets,readonly`,'--env','DUCK_QUIET=1','--env','DUCK_DATABASE_URL=/data/server.db','--env','DUCK_DB=/data/no-legacy.db',backendImage);
 containers.push(web);await docker('run','--detach','--name',web,'--network',network,'--publish','127.0.0.1::80','--mount',`type=bind,source=${assets},target=/assets,readonly`,webImage);
 const address=(await docker('port',web,'80/tcp')).output.trim();assert.match(address,/^127\.0\.0\.1:\d+$/);const url='http://'+address;console.log(JSON.stringify({id,webImage,backendImage,network,volume,url,assets:'owned synthetic fixture'}));await ready(url);await checkStatic(url,web);await checkProxy(url);
 console.log('PASS actual ROOT-context frontend image and owned nginx→Node integration');
}catch(error){failure=error;for(const name of containers)await command('docker',['logs',name],true,true).then(log=>{if(log.output||log.error)console.error(name+' '+log.output+log.error);},()=>{});}
finally{
 if(containers.length||volumes.length||networks.length||images.length)await command('docker',['info'],false,true).catch(error=>{console.error('Docker cleanup could not be confirmed: '+message(error));failure??=error;});
 for(const [kind,names,args]of [['container',containers,['rm','--force']],['volume',volumes,['volume','rm','--force']],['network',networks,['network','rm']],['image',images,['image','rm','--force']]]as const){
  for(const name of [...names].reverse()){try{await command('docker',[...args,name],true,true);const result=await command('docker',[...(kind==='container'?['inspect']: [kind,'inspect']),name],true,true);assert.notEqual(result.code,0,`Owned ${kind} leaked: ${name}`);}catch(error){console.error('Cleanup '+kind+' '+name+': '+message(error));failure??=error;}}
 }
 for(const path of canaries.reverse())await rm(join(root,path),{force:true}).catch(error=>{failure??=error;});for(const path of directories.reverse())await rmdir(path).catch(error=>{failure??=error;});if(temporary)await rm(temporary,{recursive:true,force:true}).catch(error=>{failure??=error;});
 process.off('SIGINT',interrupt);process.off('SIGTERM',interrupt);assert.equal(children.size,0,'Docker child process leaked');
}
if(failure){console.error(message(failure));process.exitCode=1;}else console.log('PASS all owned containers/images/network/volume/canaries/temp cleaned');
