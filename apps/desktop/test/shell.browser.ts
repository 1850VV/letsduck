/** Actual Electron shell/utility test with synthetic web data and owned storage only. */
import assert from 'node:assert/strict';
import {_electron as electron} from 'playwright';
import type {ElectronApplication,Page} from 'playwright';
import {createRequire} from 'node:module';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {existsSync} from 'node:fs';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {build} from 'esbuild';
import {createServer} from 'node:http';

const require=createRequire(import.meta.url),root=resolve(import.meta.dirname,'../../..');
const temporary=await mkdtemp(join(tmpdir(),'duck-shell-electron-')),frontend=join(temporary,'frontend'),database=join(temporary,'personal.db'),downloads=join(temporary,'downloads'),assets=join(temporary,'empty-assets');
const children:ReturnType<ElectronApplication['process']>[]=[],utilityPids:number[]=[];
const errors:string[]=[];let application:ElectronApplication|undefined;
let externalRequests=0;
const external=createServer((_request,response)=>{externalRequests++;response.setHeader('content-type','text/html');response.end('<html><title>External response at trusted origin</title><body id="external-owned"><script>globalThis.externalRead=localStorage.getItem("owned-profile");</script></body></html>');});
const env:NodeJS.ProcessEnv={...process.env,DUCK_DESKTOP_DATA:join(temporary,'profile'),DUCK_PERSONAL_DB:database,DUCK_ASSETS:assets,DUCK_FRONTEND:frontend,DUCK_ASSEMBLY_MANIFEST:join(temporary,'assembly.json'),DUCK_ADB:join(temporary,process.platform==='win32'?'adb.exe':'adb')};
delete env.DUCK_DB;delete env.DUCK_DATABASE_URL;delete env.DUCK_TEST_DATABASE_URL;delete env.DUCK_LEGACY_DB;
delete env.ELECTRON_RUN_AS_NODE;
function object(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object';}
async function launch(){
 const executable:unknown=require('electron');assert.ok(typeof executable==='string');
 const electronEnv:Record<string,string>={};for(const[key,value]of Object.entries(env))if(value!==undefined)electronEnv[key]=value;
 const packaged=process.env.DUCK_APP_EXECUTABLE;
 application=await electron.launch({executablePath:packaged??executable,args:packaged?[]:[join(root,'apps/desktop')],env:electronEnv,timeout:30_000});
 children.push(application.process());application.process().stderr?.on('data',data=>process.stderr.write(data));
 await application.evaluate(({app},directory)=>app.setPath('downloads',directory),downloads);
 utilityPids.push(...await application.evaluate(({app})=>app.getAppMetrics().filter(item=>item.name==='LetsDuck shared host').map(item=>item.pid)));
 const page=await application.firstWindow();page.on('pageerror',error=>errors.push(String(error)));
 await page.waitForURL('duck://app/');await page.waitForFunction(()=>typeof window.letsduckDesktop?.state==='function');
 return page;
}
async function download(page:Page){
 assert.ok(application);
 await application.evaluate(({session})=>{Reflect.set(globalThis,'ownedDownload',new Promise(resolve=>session.defaultSession.once('will-download',(_event,item)=>item.once('done',(_event,state)=>resolve({path:item.getSavePath(),state})))));});
 await page.locator('#download').click();
 const result:unknown=await application.evaluate(()=>Reflect.get(globalThis,'ownedDownload'));
 assert.ok(object(result)&&typeof result.path==='string'&&result.state==='completed');
 assert.equal(await readFile(result.path,'utf8'),'owned download');
 return result.path;
}
try{
 await mkdir(frontend);await mkdir(join(frontend,'static'));await mkdir(downloads);await mkdir(assets);
 const adbLog=join(temporary,'adb-argv.log'),quotedLog="'"+adbLog.replaceAll("'","'\\''")+"'";
 assert.ok(env.DUCK_ADB);await writeFile(env.DUCK_ADB,"#!/bin/sh\nprintf '%s\\n' \"$*\" >> "+quotedLog+"\nexit 1\n",{mode:0o755});
 await writeFile(join(temporary,'assembly.json'),'{"files":{}}');
 await writeFile(join(frontend,'home.html'),'<html><header class="top"><a class="brand">来做鸭</a></header><body><a id="download" download="fixture.txt" href="/static/fixture.txt">Download</a><a id="paused" download="paused.bin" href="/static/paused.bin">Paused download</a><iframe id="child" src="/frame.html"></iframe></body></html>');
 await writeFile(join(frontend,'frame.html'),'<html><body>Untrusted subframe</body></html>');
 await writeFile(join(frontend,'static/fixture.txt'),'owned download');
 await writeFile(join(frontend,'static/paused.bin'),Buffer.alloc(262144,42));
 await writeFile(join(downloads,'fixture.txt'),'existing user file');
 let page=await launch();
 assert.equal(await page.evaluate(()=>typeof Reflect.get(window,'process')),'undefined');
 assert.equal(await page.evaluate(()=>typeof Reflect.get(window,'require')),'undefined');
 const version=await application!.evaluate(({app})=>app.getVersion());
 assert.deepEqual(await page.evaluate(()=>window.letsduckDesktop!.state()),{phase:'idle',currentVersion:version});
 const saved=await page.evaluate(async()=>{
  localStorage.setItem('owned-profile','retained');
  const response=await fetch('/api/schemes/owned',{method:'PUT',headers:{'content-type':'application/json'},body:'{"name":"Owned","design":{"colors":{},"assignments":{}},"voiceSalt":9007199254740993}'});
  return{status:response.status,body:await response.text()};
 });
 assert.equal(saved.status,200,saved.body);assert.match(saved.body,/9007199254740993/);
 assert.equal(await application!.evaluate(async({net})=>{const response=await net.fetch('duck://app/api/servo-setup/start',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/json'},body:'not-json'});return response.status;}),403);
 const automatic=await page.evaluate(async()=>{const response=await fetch('/api/servo-setup/state');const body:unknown=await response.json();return {status:response.status,cache:response.headers.get('cache-control'),body};});
 assert.equal(automatic.status,200);assert.equal(automatic.cache,'no-store');
 assert.ok(object(automatic.body));
 assert.equal(automatic.body.phase,'idle');assert.equal(automatic.body.profile,null);assert.deepEqual(automatic.body.records,[]);
 await page.evaluate(()=>window.addEventListener('pagehide',()=>{void fetch('/api/servo-setup/pause',{method:'POST',headers:{'content-type':'application/json'},body:'{}',keepalive:true}).catch(()=>{});},{once:true}));
 await page.goto('duck://app/?after-automatic-exit');
 await page.waitForFunction(async()=>{const value:unknown=await(await fetch('/api/servo-setup/state')).json();return value!==null&&typeof value==='object'&&'phase'in value&&value.phase==='paused';});
 // The malformed body cannot start hardware even if a transport changes headers.
 const url=await application!.evaluate(({app})=>app.getAppMetrics().filter(item=>item.name==='LetsDuck shared host').length);
 assert.equal(url,1,'Exactly one shared utility host');
 await new Promise<void>(resolve=>external.listen(0,'127.0.0.1',resolve));
 const address=external.address();assert.ok(address&&typeof address!=='string');
 const attack='duck://app//127.0.0.1:'+address.port+'/attacker.html';
 await page.goto(attack);
 const escaped=await page.evaluate(async()=>({external:document.body.id==='external-owned',marker:Reflect.get(window,'externalRead'),bridge:window.letsduckDesktop?await window.letsduckDesktop.state().then(()=>'allowed',()=> 'rejected'):'absent'}));
 assert.equal(externalRequests,0,JSON.stringify(escaped));assert.equal(escaped.external,false);assert.equal(escaped.marker,undefined);assert.notEqual(escaped.bridge,'allowed','Network-path main frame must not pass trusted IPC');
 await page.goto('duck://app/');
 assert.equal(await download(page),join(downloads,'fixture (1).txt'));
 assert.equal(await download(page),join(downloads,'fixture (2).txt'));
 assert.equal(await readFile(join(downloads,'fixture.txt'),'utf8'),'existing user file');
 const frame=page.frames().find(value=>value.parentFrame()!==null);assert.ok(frame);
 const access=await frame.evaluate(async()=>{if(!window.letsduckDesktop)return'absent';try{await window.letsduckDesktop.state();return'allowed';}catch{return'rejected';}});
 assert.notEqual(access,'allowed');
 assert.ok(application);
 await application.evaluate(({session})=>{Reflect.set(globalThis,'pausedReady',new Promise(resolve=>session.defaultSession.once('will-download',(_event,item)=>{item.pause();Reflect.set(globalThis,'pausedItem',item);resolve(item.isPaused());})));});
 await page.locator('#paused').click();
 assert.equal(await application.evaluate(()=>Reflect.get(globalThis,'pausedReady')),true);
 const exiting=once(application.process(),'exit');
 await application.evaluate(({app})=>app.quit());
 await delay(80);
 assert.equal(application.process().exitCode,null,'Ordinary quit waits for a paused native download');
 assert.equal(await application.evaluate(({app})=>app.getAppMetrics().filter(item=>item.name==='LetsDuck shared host').length),1,'Shared host remains alive until native download completion');
 await application.evaluate(()=>{const item:unknown=Reflect.get(globalThis,'pausedItem');if(item&&typeof item==='object'&&'resume'in item&&typeof item.resume==='function')item.resume();});
 await exiting;application=undefined;
 assert.equal((await readFile(join(downloads,'paused.bin'))).byteLength,262144);
 page=await launch();
 assert.equal(await page.evaluate(()=>localStorage.getItem('owned-profile')),'retained');
 assert.match(await page.evaluate(async()=>await(await fetch('/api/schemes')).text()),/9007199254740993/);
 assert.deepEqual(errors,[]);
 await application!.close();application=undefined;
 assert.deepEqual(errors,[],'no late renderer error during native close');
 const db=new DatabaseSync(database,{readOnly:true});try{const statement=db.prepare('SELECT voice_salt FROM schemes WHERE id=?');statement.setReadBigInts(true);assert.equal(statement.get('owned')?.voice_salt,9007199254740993n);}finally{db.close();}
 assert.equal(existsSync(adbLog),false,'Shell verification did not request even the owned fake ADB');
 const executable:unknown=require('electron');assert.ok(typeof executable==='string');
 const fixture=join(temporary,'utility.mjs');
 await build({entryPoints:[join(root,'apps/desktop/test/utility.fixture.ts')],outfile:fixture,bundle:true,platform:'node',format:'esm',external:['electron'],logLevel:'silent'});
 const utilityCases:unknown[]=[];
 for(const mode of ['early-stop','startup-failure']){
  const profile=join(temporary,mode);await mkdir(profile);
  const path=mode==='startup-failure'?join(temporary,'invalid-db'):join(temporary,'early.db');if(mode==='startup-failure')await mkdir(path);
  const result=await promisify(execFile)(executable,[fixture],{env:{...env,DUCK_DESKTOP_DATA:profile,DUCK_PERSONAL_DB:path,DUCK_UTILITY_TEST_ENTRY:join(root,'apps/desktop/dist/host.js'),DUCK_UTILITY_TEST_MODE:mode},timeout:30_000});
  const line=result.stdout.trim().split('\n').find(value=>value.startsWith('{"mode"'));assert.ok(line);const recorded:unknown=JSON.parse(line);assert.ok(object(recorded)&&recorded.expected===true);utilityCases.push(recorded);
 }
 await import('./startup.browser.js');
 console.log(JSON.stringify({actualElectron:true,packaged:!!process.env.DUCK_APP_EXECUTABLE,version,utilityStarts:utilityPids.length,utilityCases,origin:'duck://app',sharedHost:true,isolatedPreload:true,externalRequests,nativeDownloads:3,quitWaitsNativeDownload:true,profileRestart:true,bigintSqlite:true,fakeAdbInvocations:0,errors}));
}finally{
 external.closeAllConnections();if(external.listening)await new Promise<void>((resolve,reject)=>external.close(error=>error?reject(error):resolve()));
 if(application&&application.process().exitCode===null)await application.close();
 for(const child of children)assert.ok(child.exitCode!==null||child.signalCode!==null,'Owned Electron exited');
 for(const pid of utilityPids)assert.throws(()=>process.kill(pid,0),'Owned utility process exited');
 await rm(temporary,{recursive:true,force:true});
}
