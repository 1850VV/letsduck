/** Real Windows portable ZIP, BAT launcher, bundled Node, browser UI and console Ctrl+C. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify,parseArgs} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,type Browser,type BrowserContext,type Page,type Frame} from 'playwright';
import {ZipArchive} from '@letsduck/exporter';
import {root,required,seedSimulatedAssembly,failure,assemblyReady} from './check-support.js';

assert.equal(process.platform,'win32');assert.equal(process.arch,'x64');
assert.equal(process.env.GITHUB_ACTIONS,'true','This acceptance owns a disposable Windows runner');
const {values}=parseArgs({options:{archive:{type:'string'}}});
const archive=resolve(values.archive||process.env.DUCK_BROWSER_ARCHIVE||join(root,'output/letsduck-browser-win32-x64.zip'));
const output=resolve(process.env.DUCK_TEST_OUTPUT||join(root,'output/windows-portable-browser'));await mkdir(output,{recursive:true});
const owned=await mkdtemp(join(tmpdir(),'letsduck-win-portable-')),run=promisify(execFile),sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const powershell=join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
const database=join(owned,'personal.db'),profile=join(owned,'profile'),adb=join(owned,'invalid-adb.exe'),wrapper=join(owned,'launcher.cmd');
const checks:unknown[]=[],events:unknown[]=[],launches:Array<{rootPid:number;nodePid:number;url:string;stop?:unknown}>=[],pids=new Set<number>();
let context:BrowserContext|undefined,page:Page|undefined,live:typeof launches[number]|undefined,result:Record<string,unknown>|undefined,launcher='',binary='',port='0',forcedCleanup=false;
function check(name:string,passed:boolean,detail:unknown=null){checks.push({name,passed,detail});console.log(JSON.stringify({check:name,passed,detail}));assert.ok(passed,name+' '+JSON.stringify(detail));}
async function browserPids(browser:Browser){const session=await browser.newBrowserCDPSession();try{return(await session.send('SystemInfo.getProcessInfo')).processInfo.map(item=>item.id);}finally{await session.detach();}}
async function processesExited(owned:Iterable<number>){const remaining=()=>[...owned].filter(pid=>{try{process.kill(pid,0);return true;}catch{return false;}});for(let i=0;i<100&&remaining().length;i++)await delay(50);assert.deepEqual(remaining(),[],'Owned processes exited');}
async function ps(command:string,env:NodeJS.ProcessEnv={},timeout=30_000){return run(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',command],{env:{...process.env,...env},timeout,maxBuffer:1024*1024});}
async function launch(){
 const stdout=join(owned,'stdout-'+launches.length+'.log'),stderr=join(owned,'stderr-'+launches.length+'.log');
 // Start-Process without -NoNewWindow gives this BAT a private console. Redirect inside the BAT.
 const started=await ps(`$p=Start-Process -FilePath $env:ComSpec -ArgumentList @('/d','/c',('"'+$env:DUCK_PORTABLE_WRAPPER+'"')) -WorkingDirectory $env:DUCK_PORTABLE_OWNED -WindowStyle Normal -PassThru; @{pid=$p.Id}|ConvertTo-Json -Compress`,{PATH:'',NODE_OPTIONS:'',NODE_PATH:'',DUCK_PORTABLE_WRAPPER:wrapper,DUCK_PORTABLE_OWNED:owned,DUCK_PORTABLE_LAUNCHER:launcher,DUCK_PORTABLE_PORT:port,DUCK_PORTABLE_STDOUT:stdout,DUCK_PORTABLE_STDERR:stderr,DUCK_PERSONAL_DB:database,DUCK_DB:join(owned,'absent-legacy.db'),DUCK_ADB:adb});
 const rootPid=(JSON.parse(started.stdout.trim()) as {pid:number}).pid;
 live={rootPid,nodePid:0,url:''};launches.push(live);pids.add(rootPid);
 let log='',error='';const deadline=Date.now()+30_000;
 while(Date.now()<deadline){log=await readFile(stdout,'utf8').catch(()=>'');error=await readFile(stderr,'utf8').catch(()=>'');const match=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){live.url=match[0];break;}await delay(50);}
 assert.ok(live.url,'Actual BAT did not start: '+log+error);
 port=new URL(live.url).port;
 const processInfo=await ps(`$children=@(Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${rootPid} -and $_.ExecutablePath -eq $env:DUCK_PORTABLE_NODE } | Select-Object ProcessId,ExecutablePath,CommandLine);@{children=$children}|ConvertTo-Json -Compress`,{DUCK_PORTABLE_NODE:binary});
 const children=(JSON.parse(processInfo.stdout.trim()) as {children:Array<{ProcessId:number;ExecutablePath:string;CommandLine:string}>}).children;
 assert.equal(children.length,1,'One exact bundled Node must be a child of the actual BAT console');live.nodePid=children[0]!.ProcessId;pids.add(live.nodePid);
 const health:unknown=await fetch(live.url+'/api/health').then(response=>response.json());
 check('real BAT starts the bundled Node with empty PATH',true,{rootPid,nodePid:live.nodePid,binary,health,stdout:log,stderr:error});
 return live.url;
}
const stopScript=String.raw`param([int]$RootPid,[int]$NodePid)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;using System.Runtime.InteropServices;
public class DuckConsole {
 [StructLayout(LayoutKind.Sequential)] public struct KEY {public int down;public ushort repeat;public ushort vk;public ushort scan;public char character;public uint state;}
 [StructLayout(LayoutKind.Explicit)] public struct RECORD {[FieldOffset(0)]public ushort kind;[FieldOffset(4)]public KEY key;}
 [DllImport("kernel32.dll")]public static extern bool FreeConsole();
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool AttachConsole(uint pid);
 [DllImport("kernel32.dll")]public static extern bool SetConsoleCtrlHandler(IntPtr routine,bool add);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool GenerateConsoleCtrlEvent(uint kind,uint group);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern IntPtr CreateFileW(string path,uint access,uint share,IntPtr security,uint disposition,uint flags,IntPtr template);
 [DllImport("kernel32.dll")]public static extern bool CloseHandle(IntPtr handle);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern bool WriteConsoleInputW(IntPtr input,RECORD[] records,uint count,out uint written);
 public static void ContinueBatch() {var keys=new RECORD[4];char[] chars={'N','N','\r','\r'};ushort[] vk={78,78,13,13};for(int i=0;i<4;i++)keys[i]=new RECORD{kind=1,key=new KEY{down=i%2==0?1:0,repeat=1,vk=vk[i],character=chars[i]}};var input=CreateFileW("CONIN$",0xC0000000,3,IntPtr.Zero,3,0,IntPtr.Zero);if(input==new IntPtr(-1))throw new Exception("Cannot open owned attached console input");try{uint count;if(!WriteConsoleInputW(input,keys,4,out count)||count!=4)throw new Exception("Owned console input failed");}finally{CloseHandle(input);}}
}
'@
$node=Get-Process -Id $NodePid;$root=Get-Process -Id $RootPid
# Open process handles before signaling so the real exit codes remain observable.
$null=$node.Handle;$null=$root.Handle
[void][DuckConsole]::FreeConsole()
if(![DuckConsole]::AttachConsole([uint]$RootPid)){throw ('AttachConsole failed: '+[Runtime.InteropServices.Marshal]::GetLastWin32Error())}
[void][DuckConsole]::SetConsoleCtrlHandler([IntPtr]::Zero,$true)
if(![DuckConsole]::GenerateConsoleCtrlEvent(0,0)){throw 'Owned console Ctrl+C failed'}
if(!$node.WaitForExit(20000)){throw 'Bundled Node did not drain on actual console Ctrl+C'}
$continued=$false
if(!$root.HasExited){[DuckConsole]::ContinueBatch();$continued=$true}
if(!$root.WaitForExit(5000)){throw 'Owned BAT console did not exit after its Node drained'}
[void][DuckConsole]::FreeConsole()
@{nodeExit=$node.ExitCode;consoleExit=$root.ExitCode;continuedStandardBatchPrompt=$continued;signal='real GenerateConsoleCtrlEvent CTRL_C; no process.emit or forced termination'}|ConvertTo-Json -Compress
`;
async function stop(){
 const target=required(live),script=join(owned,'stop-console.ps1');await writeFile(script,stopScript);
 const receipt=await run(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-RootPid',String(target.rootPid),'-NodePid',String(target.nodePid)],{timeout:30_000,maxBuffer:1024*1024});
 const measured=JSON.parse(receipt.stdout.trim()) as {nodeExit:number;consoleExit:number;continuedStandardBatchPrompt:boolean};target.stop=measured;
 check('actual console Ctrl+C drains the bundled Node and BAT normally',measured.nodeExit===0&&measured.consoleExit===0,measured);
 await assert.rejects(fetch(target.url+'/api/health',{signal:AbortSignal.timeout(1000)}));await processesExited([target.nodePid,target.rootPid]);live=undefined;
}
async function open(url:string){
 context=await chromium.launchPersistentContext(profile,{headless:false,viewport:{width:1280,height:800},locale:'zh-CN',acceptDownloads:true});
 await context.addInitScript('globalThis.__name = value => value');const browser=required(context.browser());for(const pid of await browserPids(browser))pids.add(pid);
 page=context.pages()[0]||await context.newPage();page.setDefaultTimeout(30_000);page.on('pageerror',error=>events.push({kind:'pageerror',message:error.message}));page.on('console',message=>{if(message.type()==='error')events.push({kind:'console',message:message.text()});});
 await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:url});await page.goto(url);await page.waitForFunction(()=>document.body.dataset.homeReady==='true');return page;
}
async function closeBrowser(){if(context){const browser=required(context.browser());const ownedBrowser=await browserPids(browser);for(const pid of ownedBrowser)pids.add(pid);await context.close();context=undefined;await processesExited(ownedBrowser);}}
type State={name:string;dirty:boolean;colors:Record<string,string>;step:number};
async function state(frame:Frame){return frame.evaluate(()=>{const proto=Reflect.get(window,'studioProto') as {state:State}|undefined;if(!proto)throw new Error('Production studio is not ready');return{name:proto.state.name,dirty:proto.state.dirty,colors:proto.state.colors,step:proto.state.step};});}
async function download(frame:Frame,selector:string,name:string){const pending=required(page).waitForEvent('download',{timeout:120_000});await frame.locator(selector).click();const item=await pending;await item.saveAs(join(output,name));assert.equal(await item.failure(),null);return readFile(join(output,name));}
try{
 const archiveBytes=await readFile(archive);await writeFile(adb,'Invalid PE sentinel; this test must never contact real ADB.');
 const unpacked=join(owned,'unpacked');await ps('Expand-Archive -LiteralPath $env:DUCK_PORTABLE_ZIP -DestinationPath $env:DUCK_PORTABLE_OUTPUT',{DUCK_PORTABLE_ZIP:archive,DUCK_PORTABLE_OUTPUT:unpacked},120_000);
 const names=await readdir(unpacked);assert.equal(names.length,1);const folder=join(unpacked,names[0]!);launcher=join(folder,'启动来做鸭.bat');binary=join(folder,'node/node.exe');
 check('portable BAT has no npm/Python/system-runtime setup',! /\b(?:npm|npx|python|curl|wget)\b/i.test(await readFile(launcher,'utf8')));
 const nodeIdentity=JSON.parse((await run(binary,['-p','JSON.stringify({node:process.versions.node,platform:process.platform,arch:process.arch})'],{env:{...process.env,PATH:'',NODE_OPTIONS:'',NODE_PATH:''}})).stdout) as {node:string;platform:string;arch:string};check('extracted binary is native Node24.20.0 Windows x64',nodeIdentity.node==='24.20.0'&&nodeIdentity.platform==='win32'&&nodeIdentity.arch==='x64',nodeIdentity);
 await writeFile(wrapper,'@echo off\r\ncall "%DUCK_PORTABLE_LAUNCHER%" --port %DUCK_PORTABLE_PORT% --no-open > "%DUCK_PORTABLE_STDOUT%" 2> "%DUCK_PORTABLE_STDERR%"\r\nexit /b %errorlevel%\r\n');
 const url=await launch();await open(url);const paint=required(page).locator('[data-duck="paint"]');if(await paint.getAttribute('data-c-position')!=='true'){await paint.click();await page!.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="paint"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');}await paint.click();await page!.locator('#module-frame').waitFor({state:'visible'});
 await page!.frameLocator('#module-frame').locator('#steps').waitFor();const frame=required(page!.frames().find(frame=>frame.url()===url+'/paint'));await frame.waitForFunction(()=>!!Reflect.get(window,'studioProto'));if(await frame.locator('#coach-go').isVisible())await frame.locator('#coach-go').click();
 if(await frame.locator('#start-go').isVisible()){await frame.locator('[data-start="original"]').click();await frame.locator('#start-go').click();}
 check('portable homepage opens its real built paint iframe',frame.url()===url+'/paint');
 const name='Windows portable '+Date.now();await frame.locator('#scheme-btn').click();await frame.locator('#sm-name').fill(name);await frame.locator('#sm-save').click();await frame.waitForFunction(name=>{const value=Reflect.get(window,'studioProto') as {state:State};return value.state.name===name&&!value.state.dirty;},name);
 const savedColors=(await state(frame)).colors;
 if(await frame.locator('#sm-name').isHidden())await frame.locator('#scheme-btn').click();await frame.locator('#sm-name').fill(name+'-failed');await context!.route('**/api/schemes/**',route=>route.request().method()==='PUT'?route.fulfill({status:503,contentType:'application/json',body:'{"error":"test","code":"server.failed","params":{}}'}):route.continue());await frame.locator('#sm-save').click();await frame.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('未能保存'));check('failed portable save retains the draft',(await state(frame)).dirty);
 const rows=await fetch(url+'/api/schemes').then(response=>response.json()) as Array<{name:string}>;check('failed save does not replace SQLite scheme',rows.some(row=>row.name===name)&&!rows.some(row=>row.name===name+'-failed'));await context!.unroute('**/api/schemes/**');await frame.locator('#sm-name').fill(name);await frame.locator('#sm-save').click();await frame.waitForFunction(()=>!(Reflect.get(window,'studioProto') as {state:State}).state.dirty);
 await frame.locator('[data-step="3"]').first().click();await frame.locator('[data-ptab="print"]').click();await frame.locator('#export2').click();const bytes=await download(frame,'#dl-3mf','ui-export.3mf'),zip=new ZipArchive(bytes),source=new ZipArchive(await readFile(join(folder,'runtime/assets/source.3mf')));
 const geometry=[...source.entries.keys()].filter(name=>name.startsWith('3D/'));check('portable download preserves the source manufacturing records',geometry.length===27&&geometry.every(name=>source.entries.get(name)!.local.equals(zip.entries.get(name)?.local||Buffer.alloc(0))));
 const manufacturing=JSON.parse(zip.read('Metadata/duck_studio_materials.json').toString('utf8')) as {validation:{status:string;partCount:number;plateCount:number}};check('portable export validates35parts6plates',manufacturing.validation.status==='passed'&&manufacturing.validation.partCount===35&&manufacturing.validation.plateCount===6,manufacturing.validation);
 const bom=await download(frame,'#dl-bom','ui-bom.csv');check('portable BOM has35parts',bom.toString('utf8').split('\r\n').length===36);await frame.locator('#export-dialog [data-close]').click();await frame.locator('[data-ptab="share"]').click();await frame.locator('#open-poster').click();const poster=await download(frame,'#poster-save','ui-poster.png');check('portable poster saves a real PNG',poster.length>100000&&poster.subarray(0,8).toString('hex')==='89504e470d0a1a0a',{bytes:poster.length});
 await frame.evaluate(async()=>navigator.clipboard.writeText('portable-marker'));await frame.locator('#poster-copy-img').click();let clipboardPng:Buffer=Buffer.alloc(0);
 for(let i=0;i<30;i++){const data=await frame.evaluate(async()=>{const items=await navigator.clipboard.read();for(const item of items)if(item.types.includes('image/png'))return Array.from(new Uint8Array(await(await item.getType('image/png')).arrayBuffer()));return[];});clipboardPng=Buffer.from(data);if(clipboardPng.length)break;await delay(100);}
 check('portable poster writes a new real clipboard PNG',clipboardPng.length>100000&&clipboardPng.subarray(0,8).toString('hex')==='89504e470d0a1a0a',{bytes:clipboardPng.length,permission:'clipboard read/write explicitly granted to owned loopback origin'});await writeFile(join(output,'clipboard.png'),clipboardPng);await frame.locator('#poster-close').click();await page!.screenshot({path:join(output,'paint.png')});
 await frame.evaluate(()=>localStorage.setItem('portable-retained','yes'));await closeBrowser();await stop();
 const restartUrl=await launch();await open(restartUrl);const reopenRows=await fetch(restartUrl+'/api/schemes').then(response=>response.json()) as Array<{name:string;design:{colors:Record<string,string>}}>;
 check('restarted BAT retains SQLite save',reopenRows.some(row=>row.name===name&&JSON.stringify(row.design.colors)===JSON.stringify(savedColors)));
 await page!.goto(restartUrl+'/paint');await page!.waitForFunction(()=>!!Reflect.get(window,'studioProto'));
 const sameOrigin=new URL(url).origin===new URL(restartUrl).origin;check('same-origin Chromium profile survives real BAT and browser restart',sameOrigin&&await page!.evaluate(()=>localStorage.getItem('portable-retained'))==='yes',{sameOrigin,first:url,restart:restartUrl,storageScope:'first launch chooses a free ephemeral port; restarts reuse that owned port'});
 await page!.goto(restartUrl+'/assemble/');check('unverified assembly prerequisite redirects to debug',new URL(page!.url()).pathname==='/debug/');await closeBrowser();await stop();
 seedSimulatedAssembly(database);const mediaUrl=await launch();await open(mediaUrl);await page!.goto(mediaUrl+'/assemble/');await page!.waitForFunction(assemblyReady,undefined,{timeout:60_000});await page!.screenshot({path:join(output,'assemble.png')});await page!.locator('#reference-toggle').click();await page!.waitForFunction(()=>{const video=document.querySelector('#reference-video');return video instanceof HTMLVideoElement&&video.videoWidth>0&&!video.paused&&video.currentTime>1;},null,{timeout:30_000});await page!.locator('#reference-video').evaluate(video=>{if(!(video instanceof HTMLVideoElement))throw new Error('Expected video');video.currentTime=10;});await page!.waitForFunction(()=>{const video=document.querySelector('#reference-video');return video instanceof HTMLVideoElement&&video.currentTime>11;});const video=await page!.locator('#reference-video').evaluate(video=>{if(!(video instanceof HTMLVideoElement))throw new Error('Expected video');return{width:video.videoWidth,duration:video.duration,playedAndSought:true};});check('portable real video plays and seeks',video.width>0&&video.duration>11,video);await page!.screenshot({path:join(output,'video.png')});await closeBrowser();await stop();
 check('no page errors in portable journeys',!events.some(item=>typeof item==='object'&&item!==null&&'kind'in item&&item.kind==='pageerror'),events);
 result={status:'passed',sourceCommit:process.env.GITHUB_SHA||null,archive:{path:archive,bytes:archiveBytes.length,sha256:sha(archiveBytes)},bundledNode:{...nodeIdentity,sha256:sha(await readFile(binary))},managedChromium:chromium.executablePath(),renderer:'default; no ANGLE override',checks,events,launches,assemblyPrerequisite:'15 explicitly simulated records in owned temporary SQLite; no hardware verification',nativeSelect:'not_run by this browser harness; separate Windows native input acceptance',physicalDevices:'not_run: invalid DUCK_ADB sentinel; no real personal database',visualApproval:'automated browser actions and private captures; no human visual approval'};
}catch(error){result={status:'failed',error:failure(error),checks,events,launches};process.exitCode=1;console.error(failure(error));await page?.screenshot({path:join(output,'failure.png'),timeout:5000}).catch(()=>{});}
finally{
 let browserClosed=false,hostExited=false,temporaryRemoved=false;try{await closeBrowser();browserClosed=true;}catch(error){events.push({kind:'browserCleanup',error:String(error)});process.exitCode=1;}
 if(live){try{await stop();}catch(error){forcedCleanup=true;events.push({kind:'forcedOwnedCleanup',error:String(error)});await run('taskkill.exe',['/PID',String(live.rootPid),'/T','/F'],{timeout:20_000}).catch(()=>{});process.exitCode=1;}}
 try{await processesExited(pids);hostExited=true;}catch(error){events.push({kind:'processCleanup',error:String(error)});process.exitCode=1;}
 if(process.exitCode)result={...result,status:'failed'};
 try{await rm(owned,{recursive:true,force:true});temporaryRemoved=true;}finally{await writeFile(join(output,'cleanup.json'),JSON.stringify({browserClosed,ownedProcessIds:[...pids],ownedProcessesExited:hostExited,temporaryDataRemoved:temporaryRemoved,forcedCleanup,fakeAdb:{mode:'existing invalid PE; real ADB never selected',path:adb}},null,2));await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));}
}
console.log(JSON.stringify(result));
