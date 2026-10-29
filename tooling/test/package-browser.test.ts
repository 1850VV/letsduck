import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,readdir,rm,copyFile,chmod,stat,realpath} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {unzipSync} from 'fflate';
import {isJsonObject} from '@letsduck/domain';
import {createPackage,listPackage} from '@electron/asar';
import {PNG} from 'pngjs';
import {packageBrowser} from '../src/package-browser.js';
import {stageProductionApp,stageRuntimeAssets} from '../src/stage-runtime-assets.js';
import {writeSyntheticAssets} from './synthetic-assets.js';

let electronBinary:string|undefined;
try{const loaded:unknown=await import('electron');if(isJsonObject(loaded)&&typeof loaded.default==='string'&&(await stat(loaded.default)).isFile())electronBinary=loaded.default;}catch{/* Source-only Node CI deliberately omits the Electron binary. */}

test('retired Intel Mac browser delivery is refused before staging or runtime execution',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-browser-retired-'));
 try{await assert.rejects(packageBrowser({root,nodeDirectory:join(root,'missing'),platform:'darwin',arch:'x64',output:join(root,'retired.zip'),withoutAssets:true}),/Only Windows x64 and macOS arm64/);assert.deepEqual(await readdir(root),[]);}
 finally{await rm(root,{recursive:true,force:true});}
});

const portableHost=process.platform==='darwin'&&process.arch==='arm64'||process.platform==='win32'&&process.arch==='x64';
test('browser ZIP contains a standalone bundled runtime, exact Web and no npm, Electron or build tooling',{skip:!portableHost&&'Browser binary deliveries target macOS arm64 and Windows x64; Linux keeps the Node CLI'},async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-browser-package-test-'));
 try{
  for(const name of ['apps/local/dist','frontend/dist/static','scripts','node/bin'])await mkdir(join(root,name),{recursive:true});
  await writeFile(join(root,'apps/local/package.json'),'{"name":"@letsduck/local","version":"1.0.0","type":"module"}');await writeFile(join(root,'apps/local/dist/main.js'),"console.log('bundled host')");await writeFile(join(root,'frontend/dist/home.html'),'<html>built</html>');await writeFile(join(root,'frontend/dist/static/worker-12345678.js'),'postMessage(1)');await writeFile(join(root,'scripts/assembly-assets.json'),'{"files":{}}');await writeFile(join(root,'LICENSE'),'MIT');await writeFile(join(root,'THIRD_PARTY_NOTICES.md'),'Terms');await writeFile(join(root,'node/LICENSE'),'Node license');
  const binary=process.platform==='win32'?'node.exe':'bin/node';await mkdir(join(root,'node',binary,'..'),{recursive:true});await copyFile(process.execPath,join(root,'node',binary));await chmod(join(root,'node',binary),0o755);await writeFile(join(root,'node/npm'),'must not ship');
  const output=join(root,'browser.zip'),result=await packageBrowser({root,nodeDirectory:join(root,'node'),platform:process.platform==='win32'?'win32':'darwin',arch:process.arch==='arm64'?'arm64':'x64',output,withoutAssets:true});
  const zip=unzipSync(await readFile(output)),names=Object.keys(zip);assert.ok(names.some(name=>name.endsWith('/node/'+binary)));assert.ok(names.some(name=>name.endsWith('/node/LICENSE')));assert.ok(!names.some(name=>/(?:^|\/)(?:npm|npx|electron|electron-builder)(?:\/|$)/.test(name)));const web=names.find(name=>name.endsWith('/runtime/frontend/home.html'));assert.ok(web);assert.equal(Buffer.from(zip[web]!).toString(),'<html>built</html>');assert.equal(result.node.version,'24.20.0');assert.equal(result.node.platform,process.platform);assert.equal(result.node.arch,process.arch);
  const launcher=names.find(name=>name.endsWith(process.platform==='win32'?'.bat':'.command'));assert.ok(launcher);const text=Buffer.from(zip[launcher]!).toString();assert.ok(text.includes('DUCK_FRONTEND'));assert.ok(text.includes('DUCK_ASSEMBLY_MANIFEST'));assert.ok(text.includes('apps/local/dist/main.js')||text.includes('apps\\local\\dist\\main.js'));assert.doesNotMatch(text,/\b(?:npm|npx|python|curl|wget)\b/);
  await assert.rejects(packageBrowser({root,nodeDirectory:join(root,'node'),platform:process.platform==='win32'?'win32':'darwin',arch:process.arch==='arm64'?'arm64':'x64',output,withoutAssets:true}),/exists/i);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('a mismatched bundled runtime is rejected before an archive is written',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-browser-wrong-runtime-'));try{await assert.rejects(packageBrowser({root,nodeDirectory:join(root,'missing'),platform:'win32',arch:'x64',output:join(root,'wrong.zip'),withoutAssets:true}),/node|ENOENT|runtime/i);}finally{await rm(root,{recursive:true,force:true});}
});

async function exercise(binary:string,entry:string,runtime:string,owned:string,electron=false,entryKind:'browser'|'desktop'='browser'){
 await mkdir(owned,{recursive:true});
 const {DatabaseSync}=await import('node:sqlite'),legacy=join(owned,'legacy.db'),legacyDesign={colors:{p0:'#112233'},assignments:{}};
 const old=new DatabaseSync(legacy);try{old.exec('CREATE TABLE schemes(id TEXT,user_id TEXT,name TEXT,design TEXT,provenance TEXT,voice_salt INTEGER,created INTEGER,updated INTEGER)');old.prepare('INSERT INTO schemes VALUES(?,?,?,?,?,?,?,?)').run('legacy','personal-owner','Imported packaged scheme',JSON.stringify(legacyDesign),null,7,1,2);}finally{old.close();}
 const legacyBefore=await readFile(legacy);
 const fakeAdb=join(owned,process.platform==='win32'?'fake-adb.exe':'fake-adb'),adbLog=join(owned,'fake-adb-calls.log');
 await writeFile(fakeAdb,process.platform==='win32'?'Owned non-executable PE fixture; no device access.':`#!/bin/sh\nprintf '%s\\n' "$*" >> '${adbLog.replaceAll("'","'\\''")}'\nexit 1\n`);await chmod(fakeAdb,0o755);
 const harness=join(owned,'stop-harness.mjs');
 if(entryKind==='desktop')await mkdir(join(owned,'electron-profile'));
 const startup=entryKind==='desktop'?`const {app,utilityProcess}=await import('electron');app.setPath('userData',${JSON.stringify(join(owned,'electron-profile'))});let utility;app.whenReady().then(()=>{utility=utilityProcess.fork(${JSON.stringify(entry)},[],{stdio:'pipe',env:process.env});utility.stdout.on('data',bytes=>process.stdout.write(bytes));utility.stderr.on('data',bytes=>process.stderr.write(bytes));utility.on('message',message=>{if(message.kind==='ready')console.log(message.url);else if(message.kind==='failed')console.error(message.message);});utility.on('exit',code=>app.exit(code));}).catch(error=>{console.error(error);app.exit(1);});`:`const {main}=await import(${JSON.stringify(pathToFileURL(entry).href)});await main(['--port','0','--no-open']);`;
 const stop=entryKind==='desktop'?"utility.postMessage({kind:'stop'});":"process.emit('SIGTERM');";
 await writeFile(harness,`import cp from 'node:child_process';import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const execFile=cp.execFile;cp.execFile=function(file,...args){if(file===${JSON.stringify(fakeAdb)})fs.appendFileSync(${JSON.stringify(adbLog)},JSON.stringify(args.slice(0,1))+'\\n');return execFile.call(this,file,...args);};syncBuiltinESMExports();${startup}process.on('message',message=>{if(message==='stop'){${stop}process.disconnect();}});`);
 const env:NodeJS.ProcessEnv={...process.env,PATH:'',NODE_OPTIONS:'',NODE_PATH:'',DUCK_ASSETS:join(runtime,'assets'),DUCK_FRONTEND:join(runtime,'frontend'),DUCK_ASSEMBLY_MANIFEST:join(runtime,'assembly-assets.json'),DUCK_PERSONAL_DB:join(owned,'personal.db'),DUCK_DB:legacy,DUCK_LEGACY_DB:legacy,DUCK_ADB:fakeAdb};
 delete env.ELECTRON_RUN_AS_NODE;
 if(electron&&entryKind!=='desktop')env.ELECTRON_RUN_AS_NODE='1';
 const child=spawn(binary,[harness],{cwd:owned,env,stdio:['ignore','pipe','pipe','ipc']});
 assert.ok(child.stdout&&child.stderr);
 let output='',error='',closed=false;child.stdout.on('data',(bytes:Buffer)=>output+=String(bytes));child.stderr.on('data',(bytes:Buffer)=>error+=String(bytes));const exited=new Promise<number|null>((accept,reject)=>{child.once('error',reject);child.once('close',code=>{closed=true;accept(code);});});
 try{
  const deadline=performance.now()+20_000;while(!/http:\/\/127\.0\.0\.1:\d+\//.test(output)&&!closed&&performance.now()<deadline)await delay(20);
  const url=output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];assert.ok(url,output+error);
  const response=await fetch(url+'/assets/model.json'),model:unknown=await response.json();assert.ok(isJsonObject(model));assert.equal(typeof model.source_sha256,'string');
  const schemes:unknown=await(await fetch(url+'/api/schemes')).json();assert.ok(Array.isArray(schemes));const imported:unknown=schemes.find((scheme:unknown)=>isJsonObject(scheme)&&scheme.id==='legacy');assert.ok(isJsonObject(imported));assert.equal(imported.name,'Imported packaged scheme');assert.deepEqual(imported.design,legacyDesign);
  const ids=['bambu-GFA00-10100','bambu-GFA00-10101','bambu-GFA00-10604','bambu-GFU03-51103'];
  const assignments=Object.fromEntries(Array.from({length:35},(_,index)=>['p'+index,ids[index%4]])),colors=Object.fromEntries(Array.from({length:35},(_,index)=>['p'+index,'#FFFFFF']));
  const saved=await fetch(url+'/api/schemes/bundled',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Retained packaged scheme',design:{colors,assignments}})});assert.equal(saved.status,200,await saved.text());
  const thumbnail='data:image/png;base64,'+PNG.sync.write(new PNG({width:512,height:512})).toString('base64'),thumbnails=Object.fromEntries(['cover',...Array.from({length:6},(_,index)=>['plate'+(index+1),'top'+(index+1)]).flat()].map(name=>[name,thumbnail]));
  const exported=await fetch(url+'/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source_sha256:model.source_sha256,assignments,thumbnails})});assert.equal(exported.status,200,await exported.clone().text());const archive=unzipSync(new Uint8Array(await exported.arrayBuffer()));assert.ok(archive['Metadata/project_settings.config']);assert.ok(archive['Metadata/model_settings.config']);
  child.send('stop');const stopDeadline=AbortSignal.timeout(20_000);const timeout=new Promise<never>((_,reject)=>stopDeadline.addEventListener('abort',()=>reject(new Error('Packaged signal handler did not drain: '+output+error)),{once:true}));assert.equal(await Promise.race([exited,timeout]),0,output+error);assert.throws(()=>process.kill(child.pid!,0),{code:'ESRCH'});await assert.rejects(fetch(url+'/api/health',{signal:AbortSignal.timeout(1000)}));
  assert.ok((await stat(join(owned,'personal.db'))).size>0);const database=new DatabaseSync(join(owned,'personal.db'),{readOnly:true});try{assert.equal(database.prepare('SELECT name FROM schemes WHERE id=?').get('bundled')?.name,'Retained packaged scheme');assert.equal(database.prepare('SELECT name FROM schemes WHERE id=?').get('legacy')?.name,'Imported packaged scheme');}finally{database.close();}assert.deepEqual(await readFile(legacy),legacyBefore,'Legacy source stays byte-identical after import/save/export');assert.equal(await stat(adbLog).then(()=>true,()=>false),false,'No device command should run during save/export');
 }finally{if(!closed){child.kill('SIGKILL');await exited;}}
}
test('unpacked browser ZIP uses bundled Node with empty PATH to save, export and drain the real signal handler',{skip:!portableHost&&'Browser binary deliveries target macOS arm64 and Windows x64'},async()=>{
 const owned=await mkdtemp(join(tmpdir(),'duck-bundled-runtime-test-')),root=resolve(import.meta.dirname,'../..');
 try{
  const source=join(owned,'synthetic'),node=join(owned,'node');await mkdir(source);writeSyntheticAssets(source);await writeFile(join(source,'geometry.bin'),'synthetic geometry');const binary=process.platform==='win32'?'node.exe':'bin/node';await mkdir(dirname(join(node,binary)),{recursive:true});await copyFile(process.execPath,join(node,binary));await chmod(join(node,binary),0o755);await writeFile(join(node,'LICENSE'),'Synthetic test wrapper; no distribution');
  const zip=join(owned,'bundle.zip');await packageBrowser({root,source,nodeDirectory:node,platform:process.platform==='win32'?'win32':'darwin',arch:process.arch==='arm64'?'arm64':'x64',output:zip});const entries=unzipSync(await readFile(zip)),folder=Object.keys(entries)[0]?.split('/')[0];assert.ok(folder);assert.ok(!Object.keys(entries).some(name=>name.startsWith(folder+'/app/packages/')),'Browser ZIP contains one production dependency closure');const extracted=join(owned,'extracted'),execute=promisify(execFile);
  if(process.platform==='darwin')await execute('/usr/bin/unzip',['-q',zip,'-d',extracted]);
  else await execute(join(process.env.SystemRoot??'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-NonInteractive','-Command','Expand-Archive -LiteralPath $env:DUCK_PACKAGE_ZIP -DestinationPath $env:DUCK_PACKAGE_OUTPUT'],{env:{...process.env,DUCK_PACKAGE_ZIP:zip,DUCK_PACKAGE_OUTPUT:extracted}});
  const launcher=join(extracted,folder,process.platform==='win32'?'启动来做鸭.bat':'启动来做鸭.command');
  const help=process.platform==='win32'?await execute(process.env.ComSpec??join(process.env.SystemRoot??'C:\\Windows','System32/cmd.exe'),['/d','/s','/c',`""${launcher}" --help"`],{windowsVerbatimArguments:true,env:{...process.env,PATH:''}}):await execute(launcher,['--help'],{env:{...process.env,PATH:''}});
  assert.match(help.stdout,/letsduck personal edition/);if(process.platform==='darwin'){assert.ok((await stat(launcher)).mode&0o100);assert.ok((await stat(join(extracted,folder,'node/bin/node'))).mode&0o100);}
  await exercise(join(extracted,folder,'node',binary),join(extracted,folder,'app/apps/local/dist/main.js'),join(extracted,folder,'runtime'),owned);
 }finally{await rm(owned,{recursive:true,force:true});}
});
test('real ASAR production closure runs without workspace mirrors',{skip:!electronBinary&&'Desktop CI installs Electron and runs this real ASAR gate'},async(t)=>{
 // Match Electron's resolved utility module URL, including macOS /var symlinks.
 const owned=await realpath(await mkdtemp(join(tmpdir(),'duck-asar-runtime-test-'))),root=resolve(import.meta.dirname,'../..');
 try{
  const source=join(owned,'synthetic'),runtime=join(owned,'runtime');await mkdir(source);writeSyntheticAssets(source);await writeFile(join(source,'geometry.bin'),'synthetic geometry');await stageRuntimeAssets({root,source,target:runtime});
  assert.ok(electronBinary);
  for(const entry of ['browser','desktop'] as const)await t.test(entry==='browser'?'local host in Electron Node mode':'desktop host through real utility IPC',{skip:entry==='desktop'&&!portableHost&&'Desktop clients target macOS arm64 and Windows x64; local ASAR coverage remains enabled'},async()=>{
   const app=join(owned,entry+'-app'),asar=join(owned,entry+'.asar');await stageProductionApp({root,target:app,entry});await createPackage(app,asar);
   assert.ok(!listPackage(asar,{isPack:false}).some(name=>/^packages(?:\/|$)/.test(name.replaceAll('\\','/').replace(/^\//,''))),'ASAR contains one production dependency closure');
   await exercise(electronBinary,join(asar,entry==='desktop'?'apps/desktop/dist/host.js':'apps/local/dist/main.js'),runtime,join(owned,entry+'-run'),true,entry);
  });
 }finally{await rm(owned,{recursive:true,force:true});}
});
