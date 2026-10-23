// First-visit bytes and first-frame time: a stamped source revision against the current release build.
// Both are served by native nginx with their own frontend/nginx.conf; /api goes to a personal-edition
// backend on a throwaway database. Every run is a fresh managed Chromium (empty HTTP and shader caches),
// alternating the order of the two sites, under emulated network and CPU profiles.
//
//   DUCK_NGINX_BIN=/path/to/nginx node tests/load-timing-browser.js --before <git rev> [--rounds 7]
//
// The before revision must contain the duck:first-frame mark (duck-view.mjs) and frontend/stamp.py.
// Needs the licensed local assets, including geometry.positions.bin and its .br/.gz siblings, and
// `npm ci --prefix frontend`. Results are written to output/load-timing/.
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';
import assert from 'node:assert/strict';

const arg=(name,fallback)=>{const i=process.argv.indexOf('--'+name);return i>0?process.argv[i+1]:fallback;};
const before=arg('before'),rounds=Number(arg('rounds',7)),nginx=process.env.DUCK_NGINX_BIN;
assert.ok(before,'Pass --before <git rev> (a revision with the duck:first-frame mark)');
assert.ok(nginx,'Set DUCK_NGINX_BIN to a native nginx');
const PROFILES={
  desktop:{latency:40,download:50e6/8,upload:10e6/8,cpu:1},
  'slow-4x-cpu':{latency:150,download:9e6/8,upload:1.5e6/8,cpu:4},
};
const root=resolve('.'),folder=mkdtempSync(join(tmpdir(),'letsduck-load-')),children=[];
const freePort=async()=>{const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const {port}=s.address();await new Promise(r=>s.close(r));return port;};
async function waitFor(url,child){for(let n=0;n<200;n++){try{await fetch(url);return;}catch{if(child.exitCode!==null)throw Error(url+' exited');await new Promise(r=>setTimeout(r,25));}}throw Error(url+' did not start');}
async function serve(name,site,conf,api){
  const port=await freePort();
  conf=conf.replace('listen 80;',`listen 127.0.0.1:${port};`).replace('root /usr/share/nginx/html;',`root ${site};`).replace('root /;',`root ${folder};`)
    .replace('alias /assets/;',`alias ${folder}/assets/;`).replace('http://backend:8876',`http://127.0.0.1:${api}`);
  const file=join(folder,name+'.conf');
  await fs.writeFile(file,`daemon off; master_process off; pid ${folder}/${name}.pid; error_log ${folder}/${name}.log; events {} http { access_log off; ${conf} }`);
  const child=spawn(nginx,['-p',folder+'/','-c',file]);children.push(child);await waitFor(`http://127.0.0.1:${port}/`,child);return `http://127.0.0.1:${port}`;
}
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?s[Math.floor(s.length/2)]:null;};

async function visit(url,profile){
  const browser=await chromium.launch({headless:false});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,locale:'zh-CN'}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    const cdp=await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile.latency,downloadThroughput:profile.download,uploadThroughput:profile.upload});
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile.cpu});
    await page.goto(url+'/',{waitUntil:'commit'});
    await page.waitForFunction(()=>performance.getEntriesByName('duck:first-frame').length,null,{timeout:120000,polling:50});
    await page.waitForTimeout(500);
    const sample=await page.evaluate(()=>{
      const frame=performance.getEntriesByName('duck:first-frame')[0].startTime,nav=performance.getEntriesByType('navigation')[0];
      const kind=e=>{const u=new URL(e.name);return u.pathname.startsWith('/api/')?'api':u.pathname.startsWith('/assets/')?'model':/\.css$/.test(u.pathname)?'css':/\.(?:m?js)$/.test(u.pathname)?'js':'other';};
      const bytes={html:nav.encodedBodySize,js:0,css:0,model:0,api:0,other:0},requests={js:0,css:0};let beforeFrame=nav.encodedBodySize;
      for(const e of performance.getEntriesByType('resource')){const k=kind(e);bytes[k]+=e.encodedBodySize;if(k in requests)requests[k]++;if(e.responseEnd<=frame)beforeFrame+=e.encodedBodySize;}
      return {firstFrameMs:frame,domContentLoadedMs:nav.domContentLoadedEventEnd,bytes,requests,bytesBeforeFrame:beforeFrame};
    });
    assert.deepEqual(errors,[],'page errors at '+url);
    await context.close();return sample;
  }finally{await browser.close();}
}

const result={before,afterHead:execFileSync('git',['rev-parse','--short','HEAD']).toString().trim(),rounds,profiles:PROFILES,samples:{},summary:{}};
try{
  await fs.symlink(join(root,'assets'),join(folder,'assets'));
  // Before: that revision's frontend and nginx.conf, stamped exactly as its image build did.
  await fs.mkdir(join(folder,'before'));
  execFileSync('sh',['-c',`git archive ${JSON.stringify(before)} frontend | tar -x -C ${JSON.stringify(join(folder,'before'))}`]);
  execFileSync('python3',[join(folder,'before/frontend/stamp.py'),join(folder,'before/frontend')]);
  execFileSync('node',['frontend/build.mjs',join(folder,'after')]);
  const apiPort=await freePort();
  const api=spawn('python3',['-c',`import sys;sys.path.insert(0,'personal');import app;app.create_server('127.0.0.1',${apiPort},db=sys.argv[1],search=1).serve_forever()`,join(folder,'personal.db')],{stdio:['ignore','ignore','inherit']});
  children.push(api);await waitFor(`http://127.0.0.1:${apiPort}/api/site`,api);
  const sites={
    before:await serve('before',join(folder,'before/frontend'),execFileSync('git',['show',`${before}:frontend/nginx.conf`]).toString(),apiPort),
    after:await serve('after',join(folder,'after'),await fs.readFile('frontend/nginx.conf','utf8'),apiPort),
  };
  for(const [name,profile] of Object.entries(PROFILES)){
    const samples={before:[],after:[]};
    for(let r=0;r<rounds;r++)for(const variant of r%2?['after','before']:['before','after']){
      const s=await visit(sites[variant],profile);samples[variant].push(s);
      console.log(name,r,variant,Math.round(s.firstFrameMs)+' ms',Math.round(s.bytes.js/1024)+' KiB js');
    }
    result.samples[name]=samples;
    result.summary[name]=Object.fromEntries(Object.entries(samples).map(([v,list])=>[v,{
      firstFrameMs:median(list.map(s=>s.firstFrameMs)),domContentLoadedMs:median(list.map(s=>s.domContentLoadedMs)),bytesBeforeFrame:median(list.map(s=>s.bytesBeforeFrame)),
      bytes:Object.fromEntries(Object.keys(list[0].bytes).map(k=>[k,median(list.map(s=>s.bytes[k]))])),requests:list[0].requests}]));
  }
  console.log(JSON.stringify(result.summary,null,2));
}finally{
  for(const child of children)if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}
  await fs.mkdir('output/load-timing',{recursive:true});
  await fs.writeFile(`output/load-timing/${new Date().toISOString().replace(/[:.]/g,'-')}.json`,JSON.stringify(result,null,2));
  await fs.rm(folder,{recursive:true,force:true});
}
