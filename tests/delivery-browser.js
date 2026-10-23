// Build and serve the real stamped frontend under a task-owned native nginx.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';
import net from 'node:net';
import {brotliDecompressSync,gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
const root=resolve('.'),nginx=process.env.DUCK_NGINX_BIN;
assert.ok(nginx,'Set DUCK_NGINX_BIN to a native nginx with gzip_static');
const folder=mkdtempSync(join(tmpdir(),'letsduck-delivery-')),result={errors:[],workers:[],responses:[]};let server,browser;
try{
 await fs.cp('frontend',join(folder,'site'),{recursive:true});await fs.symlink(join(root,'assets'),join(folder,'assets'));
 execFileSync('python3',['frontend/stamp.py',join(folder,'site')]);
 const portServer=net.createServer();portServer.listen(0,'127.0.0.1');await once(portServer,'listening');const port=portServer.address().port;await new Promise(r=>portServer.close(r));
 let config=await fs.readFile('frontend/nginx.conf','utf8');
 config=config.replace('listen 80;',`listen 127.0.0.1:${port};`).replace('root /usr/share/nginx/html;',`root ${folder}/site;`).replace('root /;',`root ${folder};`).replace('alias /assets/;',`alias ${folder}/assets/;`).replace('http://backend:8876','http://127.0.0.1:8897');
 await fs.writeFile(join(folder,'nginx.conf'),`daemon off; master_process off; pid ${folder}/nginx.pid; error_log ${folder}/error.log; events {} http { access_log off; ${config} }`);
 server=spawn(nginx,['-p',folder+'/', '-c',join(folder,'nginx.conf')]);let stderr='';server.stderr.on('data',b=>stderr+=b);
 const url=`http://127.0.0.1:${port}`;
 for(let n=0;n<100;n++){try{await fetch(url);break;}catch{if(server.exitCode!==null)throw Error(stderr);await new Promise(r=>setTimeout(r,20));}}
 const wire=encoding=>new Promise((res,rej)=>http.get(url+'/assets/geometry.positions.bin',{headers:{'Accept-Encoding':encoding}},r=>{const chunks=[];r.on('data',b=>chunks.push(b));r.on('end',()=>res({headers:r.headers,body:Buffer.concat(chunks)}));}).on('error',rej));
 const raw=readFileSync('assets/geometry.positions.bin');
 for(const [encoding,decode] of [['br',brotliDecompressSync],['gzip',gunzipSync]]){
  const response=await wire(encoding);assert.equal(response.headers['content-encoding'],encoding);assert.deepEqual(response.body,readFileSync(`assets/geometry.positions.bin.${encoding==='gzip'?'gz':'br'}`));assert.deepEqual(decode(response.body),raw);
  result[encoding]={bytes:response.body.length,etag:response.headers.etag,vary:response.headers.vary};
 }
 browser=await chromium.launch({headless:false});const context=await browser.newContext(),p=await context.newPage();
 const workerRefs=[];context.on('response',r=>{if(/positions-worker|positions\.mjs|meshopt_decoder/.test(r.url()))workerRefs.push({url:r.url(),cache:r.headers()['cache-control']});});
 p.on('pageerror',e=>result.errors.push(String(e)));p.on('worker',w=>result.workers.push(w.url()));
 // Slow just the model: a real Worker must exist before its response is released.
 let release;const gate=new Promise(r=>release=r);await p.route('**/assets/geometry.positions.bin',async route=>{await gate;await route.continue();});
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForEvent('worker',{timeout:10000}).catch(e=>{if(!result.workers.length)throw e;});
 assert.ok(result.workers.length);release();await p.waitForFunction(()=>window.studioProto);
 await p.unroute('**/assets/geometry.positions.bin');
 result.shared=await p.evaluate(async()=>{
  const images=await studioProto.view.exportThumbnails(studioProto.state.colors);
  return {count:Object.keys(images).length,legacy:performance.getEntriesByType('resource').filter(e=>/\/geometry(?:\.pack)?\.bin(?:\?|$)/.test(e.name)).map(e=>e.name)};
 });assert.equal(result.shared.count,13);assert.deepEqual(result.shared.legacy,[]);
 for(const ref of workerRefs){assert.match(ref.url,/\?v=[a-f0-9]{10}$/);assert.match(ref.cache,/immutable/);}
 assert.ok(workerRefs.some(r=>r.url.includes('positions-worker')));assert.ok(workerRefs.some(r=>r.url.includes('meshopt_decoder')));
 result.responses=workerRefs;assert.deepEqual(result.errors,[]);console.log(JSON.stringify(result));
} catch(e){result.failure=String(e.stack||e);throw e;}finally{
 if(browser)await browser.close();if(server&&server.exitCode===null){server.kill('SIGTERM');await once(server,'exit');}
 await fs.writeFile('output/integration/delivery-browser.json',JSON.stringify(result,null,2));await fs.rm(folder,{recursive:true,force:true});
}
