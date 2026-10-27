/** Native shell startup cancellation and genuine-failure regressions. */
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {build} from 'esbuild';
const require=createRequire(import.meta.url),root=resolve(import.meta.dirname,'../../..'),temporary=await mkdtemp(join(tmpdir(),'duck-startup-electron-'));
const utilityPids:number[]=[];
function object(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object';}
try{
 const executable:unknown=require('electron');assert.equal(typeof executable,'string');assert.ok(typeof executable==='string');
 const fixture=join(temporary,'startup.mjs'),assets=join(temporary,'assets'),frontend=join(temporary,'frontend'),manifest=join(temporary,'assembly.json'),adb=join(temporary,process.platform==='win32'?'adb.exe':'adb'),adbLog=join(temporary,'adb.log');
 await mkdir(assets);await mkdir(frontend);await writeFile(join(frontend,'home.html'),'<html>Owned startup fixture</html>');await writeFile(manifest,'{"files":{}}');
 await writeFile(adb,"#!/bin/sh\nprintf invoked >> '"+adbLog.replaceAll("'","'\\''")+"'\nexit 1\n",{mode:0o755});
 await build({entryPoints:[join(root,'apps/desktop/test/startup.fixture.ts')],outfile:fixture,bundle:true,platform:'node',format:'esm',external:['electron'],logLevel:'silent'});
 const cases:unknown[]=[];
 for(const mode of ['quit','unexpected-stop','unexpected-exit','initialization-error']){
  const profile=join(temporary,mode),database=join(temporary,mode+'.db'),receipt=join(temporary,mode+'.json');await mkdir(profile);if(mode==='initialization-error')await mkdir(database);
  const env:NodeJS.ProcessEnv={...process.env,DUCK_DESKTOP_DATA:profile,DUCK_PERSONAL_DB:database,DUCK_ASSETS:assets,DUCK_FRONTEND:frontend,DUCK_ASSEMBLY_MANIFEST:manifest,DUCK_ADB:adb,DUCK_SHELL_STARTUP_ENTRY:join(root,'apps/desktop/dist/main.js'),DUCK_SHELL_STARTUP_RECEIPT:receipt,DUCK_SHELL_STARTUP_MODE:mode};
  delete env.DUCK_DB;delete env.DUCK_DATABASE_URL;delete env.DUCK_TEST_DATABASE_URL;delete env.DUCK_LEGACY_DB;delete env.ELECTRON_RUN_AS_NODE;
  const result=await new Promise<{code:number|string;stderr:string}>(resolve=>execFile(executable,[fixture],{env,timeout:30_000},(error,_stdout,stderr)=>resolve({code:error?.code??0,stderr})));
  const observed:unknown=JSON.parse(await readFile(receipt,'utf8'));assert.ok(object(observed));
  if(typeof observed.utilityPid==='number')utilityPids.push(observed.utilityPid);
  console.log(JSON.stringify({startupMode:mode,exitCode:result.code,...observed}));
  assert.equal(result.code,mode==='quit'?0:1,result.stderr);
  assert.equal(observed.requestedQuit,mode==='quit');assert.equal(observed.ready,false);
  assert.ok(Array.isArray(observed.dialogs));assert.equal(observed.dialogs.length,mode==='quit'?0:1);
  if(mode==='initialization-error')assert.equal(observed.utilityExit,1);
  else if(mode==='unexpected-exit')assert.equal(typeof observed.utilityExit,'number');
  else assert.equal(observed.utilityExit,0);
  assert.ok(typeof observed.utilityPid==='number');const pid=observed.utilityPid;assert.throws(()=>process.kill(pid,0),'Startup utility was reclaimed');
  cases.push(observed);
 }
 assert.equal(existsSync(adbLog),false);
 console.log(JSON.stringify({actualElectronStartup:true,cases:cases.length,fakeAdbInvocations:0,utilityCleanup:true}));
}finally{
 for(const pid of utilityPids){let live=true;try{process.kill(pid,0);}catch{live=false;}if(live){process.kill(pid,'SIGTERM');for(let attempt=0;attempt<100;attempt++){try{process.kill(pid,0);await delay(20);}catch{live=false;break;}}if(live)process.kill(pid,'SIGKILL');}}
 await rm(temporary,{recursive:true,force:true});
}
