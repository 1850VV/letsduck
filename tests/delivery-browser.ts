import * as browserChecks from './browser/checks.js';
// Build and serve the real stamped frontend under a task-owned native nginx.

import fs from 'node:fs/promises';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';
import net from 'node:net';
import {brotliDecompressSync,gunzipSync,brotliCompressSync,gzipSync,constants} from 'node:zlib';
import assert from 'node:assert/strict';
type WorkerReference={url:string;cache:string|undefined;decoderBundled:boolean};
type Compression={bytes:number;etag:string|undefined;vary:string|string[]|undefined};
const root=resolve('.'),nginx=process.env.DUCK_NGINX_BIN,backend=browserChecks.browserUrl();
assert.ok(nginx,'Set DUCK_NGINX_BIN to a native nginx with gzip_static');
const folder=mkdtempSync(join(tmpdir(),'letsduck-delivery-')),result:{errors:string[];workers:string[];responses:WorkerReference[];br?:Compression;gzip?:Compression;shared?:{count:number;legacy:string[]};failure?:string}={errors:[],workers:[],responses:[]};let server,browser;
try{
 await fs.cp(process.env.DUCK_FRONTEND_DIST??'frontend/dist',join(folder,'site'),{recursive:true});await fs.mkdir(join(folder,'assets'));for(const name of await fs.readdir(join(root,'assets'))){const source=join(root,'assets',name);if((await fs.stat(source)).isFile())await fs.copyFile(source,join(folder,'assets',name));}const positionBytes=await fs.readFile(join(folder,'assets/geometry.positions.bin'));await fs.writeFile(join(folder,'assets/geometry.positions.bin.br'),brotliCompressSync(positionBytes,{params:{[constants.BROTLI_PARAM_QUALITY]:11}}));await fs.writeFile(join(folder,'assets/geometry.positions.bin.gz'),gzipSync(positionBytes,{level:9}));
 const portServer=net.createServer();portServer.listen(0,'127.0.0.1');await once(portServer,'listening');const address=portServer.address();assert.ok(address&&typeof address==='object');const port=address.port;await new Promise<void>((resolve,reject)=>portServer.close(error=>error?reject(error):resolve()));
 let config=await fs.readFile('frontend/nginx.conf','utf8');
 config=config.replace('listen 80;',`listen 127.0.0.1:${port};`).replace('root /usr/share/nginx/html;',`root ${folder}/site;`).replace('root /;',`root ${folder};`).replace('alias /assets/;',`alias ${folder}/assets/;`).replace('http://backend:8876',backend);
 await fs.writeFile(join(folder,'nginx.conf'),`daemon off; master_process off; pid ${folder}/nginx.pid; error_log ${folder}/error.log; events {} http { access_log off; ${config} }`);
 server=spawn(nginx,['-p',folder+'/', '-c',join(folder,'nginx.conf')]);let stderr='';server.stderr.on('data',b=>stderr+=b);
 const url=`http://127.0.0.1:${port}`;
 for(let n=0;n<100;n++){try{await fetch(url);break;}catch{if(server.exitCode!==null)throw Error(stderr);await new Promise(r=>setTimeout(r,20));}}
 const wire=(encoding:string)=>new Promise<{headers:http.IncomingHttpHeaders;body:Buffer}>((res,rej)=>http.get(url+'/assets/geometry.positions.bin',{headers:{'Accept-Encoding':encoding}},r=>{const chunks:Buffer[]=[];r.on('data',b=>chunks.push(b));r.on('end',()=>res({headers:r.headers,body:Buffer.concat(chunks)}));}).on('error',rej));
 const raw=readFileSync('assets/geometry.positions.bin');
 for(const [encoding,decode] of [['br',brotliDecompressSync],['gzip',gunzipSync]] as const){
  const response=await wire(encoding);assert.equal(response.headers['content-encoding'],encoding);assert.deepEqual(response.body,readFileSync(join(folder,`assets/geometry.positions.bin.${encoding==='gzip'?'gz':'br'}`)));assert.deepEqual(decode(response.body),raw);
  result[encoding]={bytes:response.body.length,etag:response.headers.etag,vary:response.headers.vary};
 }
 browser=await browserChecks.launchBrowser({headless:false});const context=await browser.newContext(),p=await context.newPage();
 const workerRefs:WorkerReference[]=[],workerChecks:Promise<void>[]=[];context.on('response',r=>{if(/positions-worker|positions\.mjs|meshopt_decoder/.test(r.url()))workerChecks.push((async()=>{workerRefs.push({url:r.url(),cache:r.headers()['cache-control'],decoderBundled:(await r.text()).includes('decodeGltfBuffer')});})());});
 p.on('pageerror',e=>result.errors.push(String(e)));p.on('worker',w=>result.workers.push(w.url()));
 // Slow just the model: a real Worker must exist before its response is released.
 let release:()=>void=()=>{throw Error('Model gate missing');};const gate=new Promise<void>(r=>release=r);await p.route('**/assets/geometry.positions.bin',async route=>{await gate;await route.continue();});
 await browserChecks.preparePage(p);await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForEvent('worker',{timeout:10000}).catch(e=>{if(!result.workers.length)throw e;});
 assert.ok(result.workers.length);release();await p.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(p);
 await p.unroute('**/assets/geometry.positions.bin');
 result.shared=await p.evaluate(async()=>{
  const images=await window.studioProto.view.exportThumbnails(window.studioProto.state.colors);
  return {count:Object.keys(images).length,legacy:performance.getEntriesByType('resource').filter(e=>/\/geometry(?:\.pack)?\.bin(?:\?|$)/.test(e.name)).map(e=>e.name)};
 });assert.equal(result.shared.count,13);assert.deepEqual(result.shared.legacy,[]);
 await Promise.all(workerChecks);for(const ref of workerRefs){assert.match(ref.url,/\/static\/[^/?]+-[\w-]+\.js$/);assert.match(browserChecks.required(ref.cache),/immutable/);}
 assert.ok(workerRefs.some(r=>r.url.includes('positions-worker')));assert.ok(workerRefs.some(r=>r.decoderBundled),'the immutable production worker includes the actual meshopt decoder');
 result.responses=workerRefs;assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
} catch(e){result.failure=browserChecks.failure(e);throw e;}finally{
 if(browser)await browser.close();if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}
 await fs.writeFile('output/integration/delivery-browser.json',JSON.stringify(result,null,2));await fs.rm(folder,{recursive:true,force:true});
}
