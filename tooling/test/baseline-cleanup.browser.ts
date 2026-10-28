/** Explicit actual-browser cancellation check; run only in the reserved GUI slot. */
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),python='/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/Resources/Python.app/Contents/MacOS/Python';
for(const signal of ['SIGINT','SIGTERM'] as const){
 const temporary=await mkdtemp(join(tmpdir(),'duck-compare-cancel-')),output=join(temporary,'evidence'),pids=new Set<number>();let owned:string|undefined,reference:string|undefined,stderr='';
 const child=spawn(process.execPath,['--import','tsx','tooling/test/baseline-comparison.cli.ts','--python',python,'--revision','21da64b563fd60a71d50597e26a23d26452a9c2b','--output',output],{cwd:root,stdio:['ignore','pipe','pipe','ipc']});child.stderr?.on('data',data=>stderr+=String(data));
 try{
  await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('No comparison resource ownership: '+stderr)),30000);child.once('exit',code=>{clearTimeout(timer);reject(Error('Early exit '+code+': '+stderr));});child.on('message',(value:unknown)=>{if(!value||typeof value!=='object'||!('status'in value))return;
   if(value.status==='comparison_ownership'&&'temporaryDirectory'in value&&typeof value.temporaryDirectory==='string'&&'historicalDirectory'in value&&typeof value.historicalDirectory==='string'&&'processIds'in value&&Array.isArray(value.processIds)){owned=value.temporaryDirectory;reference=value.historicalDirectory;for(const pid of value.processIds)if(typeof pid==='number')pids.add(pid);}
   if(value.status==='comparison_host_starting'&&'pid'in value&&typeof value.pid==='number'){pids.add(value.pid);clearTimeout(timer);resolve();}
  });});const exit=once(child,'exit');child.kill(signal);const[code]=await exit;assert.equal(code,130,stderr);assert.ok(owned&&reference);assert.equal(existsSync(owned),false);assert.equal(existsSync(reference),false);assert.equal(existsSync(join(output,'comparison.json')),false);for(const pid of pids)assert.throws(()=>process.kill(pid,0),{code:'ESRCH'});console.log(JSON.stringify({signal,code,pids:[...pids],ownedRemoved:true,referenceRemoved:true,noSuccessReceipt:true}));
 }finally{if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await once(child,'exit');}if(owned)await rm(owned,{recursive:true,force:true});await rm(temporary,{recursive:true,force:true});}
}
