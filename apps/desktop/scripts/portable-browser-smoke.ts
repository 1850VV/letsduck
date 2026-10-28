/** Real Windows portable ZIP, BAT launcher, bundled Node, browser UI and console Ctrl+C. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify,parseArgs} from 'node:util';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium,type Browser,type BrowserContext,type Page,type Frame,type Locator} from 'playwright';
import {ZipArchive} from '@letsduck/exporter';
import {root,required,seedSimulatedAssembly,failure,assemblyReady} from './check-support.js';
import {windowsNativeInput,windowsPowerShell} from './windows-native-input.js';
import {experimentalAccessState,unlockExperimentalHome} from './experimental-access-check.js';
import {capturePortableFailure,observePortablePage} from './portable-browser-diagnostics.js';

assert.equal(process.platform,'win32');assert.equal(process.arch,'x64');
assert.equal(process.env.GITHUB_ACTIONS,'true','This acceptance owns a disposable Windows runner');
const {values}=parseArgs({options:{archive:{type:'string'}}});
const archive=resolve(values.archive||process.env.DUCK_BROWSER_ARCHIVE||join(root,'output/letsduck-browser-win32-x64.zip'));
const output=resolve(process.env.DUCK_TEST_OUTPUT||join(root,'output/windows-portable-browser'));await mkdir(output,{recursive:true});
const owned=await mkdtemp(join(tmpdir(),'letsduck-win-portable-')),run=promisify(execFile),sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const powershell=windowsPowerShell;
const artifactIdentity:{path:string;bytes:number|null;sha256:string|null;sourceCommit:string|null}={path:archive,bytes:null,sha256:null,sourceCommit:process.env.GITHUB_SHA||null};
const database=join(owned,'personal.db'),profile=join(owned,'profile'),adb=join(owned,'invalid-adb.exe'),wrapper=join(owned,'launcher.cmd');
const stopFailures:unknown[]=[];
const checks:unknown[]=[],events:unknown[]=[],nativeEvidence:unknown[]=[],effectiveViewports:unknown[]=[],launches:Array<{rootPid:number;nodePid:number;url:string;stdoutPath:string;stderrPath:string;stop?:unknown}>=[],pids=new Set<number>();
let context:BrowserContext|undefined,page:Page|undefined,live:typeof launches[number]|undefined,result:Record<string,unknown>|undefined,launcher='',binary='',port='0',forcedCleanup=false,nativeCoverage:unknown;
function check(name:string,passed:boolean,detail:unknown=null){checks.push({name,passed,detail});console.log(JSON.stringify({check:name,passed,detail}));assert.ok(passed,name+' '+JSON.stringify(detail));}
const input=windowsNativeInput({script:join(owned,'native-input.ps1'),output,page:()=>required(page),target:async()=>{
 const browser=required(context?.browser()),session=await browser.newBrowserCDPSession();
 try{const info=(await session.send('SystemInfo.getProcessInfo')).processInfo,main=info.filter(item=>item.type==='browser');assert.equal(main.length,1,'One owned Chromium browser PID is required');return{window:'',ownedPids:info.map(item=>item.id),chromiumBrowserPid:main[0]!.id};}finally{await session.detach();}
},evidence:nativeEvidence,check});
async function browserPids(browser:Browser){const session=await browser.newBrowserCDPSession();try{return(await session.send('SystemInfo.getProcessInfo')).processInfo.map(item=>item.id);}finally{await session.detach();}}
async function processesExited(owned:Iterable<number>){const remaining=()=>[...owned].filter(pid=>{try{process.kill(pid,0);return true;}catch{return false;}});for(let i=0;i<100&&remaining().length;i++)await delay(50);assert.deepEqual(remaining(),[],'Owned processes exited');}
async function ps(command:string,env:NodeJS.ProcessEnv={},timeout=30_000){return run(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',command],{env:{...process.env,...env},timeout,maxBuffer:1024*1024});}
async function launch(){
 const stdout=join(owned,'stdout-'+launches.length+'.log'),stderr=join(owned,'stderr-'+launches.length+'.log');
 // The isolated runner's inherited Ctrl+C ignore flag was reproduced by the builtin-only canary.
 // Reset only this fresh launch helper before it creates the private BAT console.
 const started=await ps(`$ErrorActionPreference='Stop'; Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class DuckLaunch{[DllImport("kernel32.dll",SetLastError=true)]public static extern bool SetConsoleCtrlHandler(IntPtr routine,bool add);}'; if(![DuckLaunch]::SetConsoleCtrlHandler([IntPtr]::Zero,$false)){throw 'Cannot restore Ctrl+C handling in this owned launch helper'}; $p=Start-Process -FilePath $env:ComSpec -ArgumentList @('/d','/c',('"'+$env:DUCK_PORTABLE_WRAPPER+'"')) -WorkingDirectory $env:DUCK_PORTABLE_OWNED -WindowStyle Normal -PassThru; @{pid=$p.Id;launchHelperPID=$PID;parentIgnoreReset=$true}|ConvertTo-Json -Compress`,{PATH:'',NODE_OPTIONS:'',NODE_PATH:'',DUCK_PORTABLE_WRAPPER:wrapper,DUCK_PORTABLE_OWNED:owned,DUCK_PORTABLE_LAUNCHER:launcher,DUCK_PORTABLE_PORT:port,DUCK_PORTABLE_STDOUT:stdout,DUCK_PORTABLE_STDERR:stderr,DUCK_PERSONAL_DB:database,DUCK_DB:join(owned,'absent-legacy.db'),DUCK_ADB:adb});
 const launchReceipt=JSON.parse(started.stdout.trim()) as {pid:number;launchHelperPID:number;parentIgnoreReset:boolean};
 assert.equal(launchReceipt.parentIgnoreReset,true);const rootPid=launchReceipt.pid;
 live={rootPid,nodePid:0,url:'',stdoutPath:stdout,stderrPath:stderr};launches.push(live);pids.add(rootPid);
 let log='',error='';const deadline=Date.now()+30_000;
 while(Date.now()<deadline){log=await readFile(stdout,'utf8').catch(()=>'');error=await readFile(stderr,'utf8').catch(()=>'');const match=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){live.url=match[0];break;}await delay(50);}
 assert.ok(live.url,'Actual BAT did not start: '+log+error);
 port=new URL(live.url).port;
 const processInfo=await ps(`$children=@(Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${rootPid} -and $_.ExecutablePath -eq $env:DUCK_PORTABLE_NODE } | Select-Object ProcessId,ExecutablePath,CommandLine);@{children=$children}|ConvertTo-Json -Compress`,{DUCK_PORTABLE_NODE:binary});
 const children=(JSON.parse(processInfo.stdout.trim()) as {children:Array<{ProcessId:number;ExecutablePath:string;CommandLine:string}>}).children;
 assert.equal(children.length,1,'One exact bundled Node must be a child of the actual BAT console');live.nodePid=children[0]!.ProcessId;pids.add(live.nodePid);
 const health:unknown=await fetch(live.url+'/api/health').then(response=>response.json());
 check('real BAT starts the bundled Node with empty PATH',true,{rootPid,nodePid:live.nodePid,binary,health,launchReceipt,stdout:log,stderr:error});
 return live.url;
}
const stopScript=String.raw`param([int]$RootPid,[int]$NodePid,[string]$EvidencePath)
$ErrorActionPreference='Stop'
Add-Type -TypeDefinition @'
using System;using System.Runtime.InteropServices;
public class DuckConsole {
 [StructLayout(LayoutKind.Sequential)] public struct KEY {public int down;public ushort repeat;public ushort vk;public ushort scan;public char character;public uint state;}
 [StructLayout(LayoutKind.Explicit)] public struct RECORD {[FieldOffset(0)]public ushort kind;[FieldOffset(4)]public KEY key;}
 [DllImport("kernel32.dll")]public static extern bool FreeConsole();
 [DllImport("kernel32.dll",SetLastError=true)]public static extern uint GetConsoleProcessList([Out]uint[] members,uint count);
 public static uint[] Members() {var members=new uint[128];var count=GetConsoleProcessList(members,(uint)members.Length);if(count==0||count>members.Length)throw new Exception("Owned console process-list failed or exceeded 128 entries");Array.Resize(ref members,(int)count);return members;}
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool AttachConsole(uint pid);
 [DllImport("kernel32.dll")]public static extern bool SetConsoleCtrlHandler(IntPtr routine,bool add);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool GenerateConsoleCtrlEvent(uint kind,uint group);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern IntPtr CreateFileW(string path,uint access,uint share,IntPtr security,uint disposition,uint flags,IntPtr template);
 [DllImport("kernel32.dll")]public static extern bool CloseHandle(IntPtr handle);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern bool WriteConsoleInputW(IntPtr input,RECORD[] records,uint count,out uint written);
 public static void ContinueBatch() {var keys=new RECORD[4];char[] chars={'N','N','\r','\r'};ushort[] vk={78,78,13,13};for(int i=0;i<4;i++)keys[i]=new RECORD{kind=1,key=new KEY{down=i%2==0?1:0,repeat=1,vk=vk[i],character=chars[i]}};var input=CreateFileW("CONIN$",0xC0000000,3,IntPtr.Zero,3,0,IntPtr.Zero);if(input==new IntPtr(-1))throw new Exception("Cannot open owned attached console input");try{uint count;if(!WriteConsoleInputW(input,keys,4,out count)||count!=4)throw new Exception("Owned console input failed");}finally{CloseHandle(input);}}
}
'@
$attached=$false
$evidence=[ordered]@{rootPID=$RootPid;nodePID=$NodePid;status='pending';signalSent=$false;before=$null;afterSignal=$null;afterWait=$null}
function Snapshot([string]$stage) {
 $members=@();$memberError=$null
 if($attached){try{$members=@([DuckConsole]::Members())}catch{$memberError=$_.Exception.Message}}
 @{stage=$stage;atUtc=[DateTime]::UtcNow.ToString('o');consoleMembers=$members;rootPID=$RootPid;nodePID=$NodePid;rootAlive=[bool](Get-Process -Id $RootPid -ErrorAction SilentlyContinue);nodeAlive=[bool](Get-Process -Id $NodePid -ErrorAction SilentlyContinue);memberError=$memberError}
}
try {
 $node=Get-Process -Id $NodePid;$root=Get-Process -Id $RootPid
 # Keep real exit codes observable. The helper ignores Ctrl+C only after attaching.
 $null=$node.Handle;$null=$root.Handle
 [void][DuckConsole]::FreeConsole()
 if(![DuckConsole]::AttachConsole([System.UInt32]$RootPid)){throw ('AttachConsole failed: '+[Runtime.InteropServices.Marshal]::GetLastWin32Error())}
 $attached=$true;$evidence.before=Snapshot 'before_signal'
 if(![DuckConsole]::SetConsoleCtrlHandler([IntPtr]::Zero,$true)){throw 'Cannot protect owned signal helper from Ctrl+C'}
 $evidence.signalSent=[DuckConsole]::GenerateConsoleCtrlEvent(0,0)
 $signalError=0;if(!$evidence.signalSent){$signalError=[Runtime.InteropServices.Marshal]::GetLastWin32Error()}
 $evidence.afterSignal=Snapshot 'after_signal'
 if(!$evidence.signalSent){throw ('Owned console Ctrl+C failed: '+$signalError)}
 if(!$node.WaitForExit(20000)){$evidence.status='node_timeout';$evidence.afterWait=Snapshot 'node_timeout';throw 'Bundled Node did not drain on actual console Ctrl+C'}
 $continued=$false
 if(!$root.HasExited){[DuckConsole]::ContinueBatch();$continued=$true}
 if(!$root.WaitForExit(5000)){$evidence.status='console_timeout';$evidence.afterWait=Snapshot 'console_timeout';throw 'Owned BAT console did not exit after its Node drained'}
 $evidence.afterWait=Snapshot 'completed';$evidence.status='passed'
 $evidence.nodeExit=$node.ExitCode;$evidence.consoleExit=$root.ExitCode;$evidence.continuedStandardBatchPrompt=$continued
 $evidence.signal='real GenerateConsoleCtrlEvent CTRL_C; no process.emit or forced termination'
} catch {
 $evidence.error=$_.Exception.Message
 if($evidence.status -eq 'pending'){$evidence.status='failed'}
 if(!$evidence.afterWait){$evidence.afterWait=Snapshot 'helper_failure'}
 throw
} finally {
 $json=$evidence|ConvertTo-Json -Depth 8 -Compress
 # A file survives even if attaching/detaching changes this helper's stdout handle.
 [System.IO.File]::WriteAllText($EvidencePath,$json,[System.Text.UTF8Encoding]::new($false))
 if($attached){[void][DuckConsole]::FreeConsole()}
 Write-Output $json
}
`;
async function stop(){
 const target=required(live),script=join(owned,'stop-console.ps1'),evidencePath=join(owned,'stop-console-'+target.rootPid+'.json');await writeFile(script,stopScript);
 try {
  await run(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-RootPid',String(target.rootPid),'-NodePid',String(target.nodePid),'-EvidencePath',evidencePath],{timeout:30_000,maxBuffer:1024*1024});
  const measured=JSON.parse(await readFile(evidencePath,'utf8')) as {nodeExit:number;consoleExit:number;continuedStandardBatchPrompt:boolean};target.stop=measured;
  check('actual console Ctrl+C drains the bundled Node and BAT normally',measured.nodeExit===0&&measured.consoleExit===0,measured);
  await assert.rejects(fetch(target.url+'/api/health',{signal:AbortSignal.timeout(1000)}));await processesExited([target.nodePid,target.rootPid]);live=undefined;
 } catch(error) {
  const childError=error as {stdout?:unknown;stderr?:unknown};
  const consoleText=await readFile(evidencePath,'utf8').catch(()=>'');let consoleEvidence:unknown;
  try{consoleEvidence=JSON.parse(consoleText);}catch{consoleEvidence={unavailable:true,raw:consoleText};}
  let health:unknown;try{const response=await fetch(target.url+'/api/health',{signal:AbortSignal.timeout(1500)});health={reachable:true,status:response.status,body:(await response.text()).slice(0,2000)};}catch(healthError){health={reachable:false,error:failure(healthError)};}
  const diagnostic={atUtc:new Date().toISOString(),rootPID:target.rootPid,nodePID:target.nodePid,error:failure(error),helperStdout:typeof childError.stdout==='string'?childError.stdout:null,helperStderr:typeof childError.stderr==='string'?childError.stderr:null,consoleEvidence,health,stdoutTail:(await readFile(target.stdoutPath,'utf8').catch(()=>'' )).slice(-8000),stderrTail:(await readFile(target.stderrPath,'utf8').catch(()=>'' )).slice(-8000)};
  stopFailures.push(diagnostic);await writeFile(join(output,'stop-failure.json'),JSON.stringify({failures:stopFailures},null,2));
  console.error(JSON.stringify({kind:'portable-stop-failure',...diagnostic}));throw error;
 }
}
async function open(url:string){
 const desktop=await input.desktop(),area=desktop.workArea;assert.ok(area.width>=800&&area.height>=600,'An interactive desktop large enough for the existing UI is required');
 const windowSize={width:Math.min(1280,area.width-20),height:Math.min(800,area.height-20)};
 context=await chromium.launchPersistentContext(profile,{headless:false,viewport:null,locale:'zh-CN',acceptDownloads:true,args:[`--window-size=${windowSize.width},${windowSize.height}`,`--window-position=${area.x+10},${area.y+10}`]});
 await context.addInitScript('globalThis.__name = value => value');const browser=required(context.browser());for(const pid of await browserPids(browser))pids.add(pid);
 page=context.pages()[0]||await context.newPage();page.setDefaultTimeout(30_000);observePortablePage(page,events);
 await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:url});await page.goto(url);await page.waitForFunction(()=>document.body.dataset.homeReady==='true');
 const active=await input.native('activate'),viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio}));
 check('owned managed Chromium is foreground with a validated renderer HWND',active.foreground===active.root.handle,{browserPid:active.root.pid,hwnd:active.root.handle,rendererHwnd:active.contentHandle,viewport,client:active.client,desktop,windowSize});effectiveViewports.push({url,viewport,client:active.client,window:active.root,desktop});return page;
}
async function closeBrowser(){if(context){const browser=required(context.browser());const ownedBrowser=await browserPids(browser);for(const pid of ownedBrowser)pids.add(pid);await context.close();context=undefined;await processesExited(ownedBrowser);}}
type State={name:string;dirty:boolean;colors:Record<string,string>;step:number;activeId:string|null};
async function state(frame:Frame){return frame.evaluate(()=>{const proto=Reflect.get(window,'studioProto') as {state:State}|undefined;if(!proto)throw new Error('Production studio is not ready');return{name:proto.state.name,dirty:proto.state.dirty,colors:proto.state.colors,step:proto.state.step,activeId:proto.state.activeId};});}
async function physicalClick(target:Locator){
 await target.waitFor({state:'visible'});const handle=required(await target.elementHandle());
 try{await handle.waitForElementState('enabled');}finally{await handle.dispose();}
 const selector=target.toString(),geometry=await target.evaluate(element=>{
  const rect=element.getBoundingClientRect(),style=getComputedStyle(element),hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2),host=window.frameElement?.getBoundingClientRect();
  return{id:element.id,connected:element.isConnected,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},viewport:{width:innerWidth,height:innerHeight},display:style.display,visibility:style.visibility,pointerEvents:style.pointerEvents,documentFocused:document.hasFocus(),localHitMatches:!!hit&&(element===hit||element.contains(hit)),frameRect:host?{x:host.x,y:host.y,width:host.width,height:host.height}:null};
 });
 const intent={kind:'nativeClickBegin',selector,geometry,atUtc:new Date().toISOString()};events.push(intent);console.log(JSON.stringify(intent));
 await input.click(target);events.push({kind:'nativeClickCompleted',selector,atUtc:new Date().toISOString()});
}
async function download(frame:Frame,selector:string,name:string){const pending=required(page).waitForEvent('download',{timeout:120_000});await physicalClick(frame.locator(selector));const item=await pending;await item.saveAs(join(output,name));assert.equal(await item.failure(),null);return readFile(join(output,name));}
async function saveScheme(frame:Frame,name:string,origin:string){
 const pending=required(page).waitForResponse(response=>{const address=new URL(response.url());return address.origin===origin&&/^\/api\/schemes\/[^/]+$/.test(address.pathname)&&response.request().method()==='PUT';});
 await physicalClick(frame.locator('#sm-save'));const response=await pending;assert.equal(response.ok(),true,'The actual SQLite save request must succeed: '+response.status());
 await frame.waitForFunction(name=>{const value=Reflect.get(window,'studioProto') as {state:State};return value.state.name===name&&!value.state.dirty&&!!value.state.activeId;},name);
 const saved=await state(frame),readback=await fetch(origin+'/api/schemes');assert.equal(readback.ok,true);
 const rows=await readback.json() as Array<{id:string;name:string;design:{colors:Record<string,string>}}>,row=required(rows.find(item=>item.id===saved.activeId));
 check('portable SQLite save completes and reads back',row.name===name&&JSON.stringify(row.design.colors)===JSON.stringify(saved.colors),{activeId:saved.activeId,status:response.status(),name:row.name});
 return saved;
}
try{
 const archiveBytes=await readFile(archive);artifactIdentity.bytes=archiveBytes.length;artifactIdentity.sha256=sha(archiveBytes);await writeFile(join(output,'identity.json'),JSON.stringify(artifactIdentity));console.log(JSON.stringify(artifactIdentity));
 await input.prepare();await writeFile(adb,'Invalid PE sentinel; this test must never contact real ADB.');
 const unpacked=join(owned,'unpacked');await ps('Expand-Archive -LiteralPath $env:DUCK_PORTABLE_ZIP -DestinationPath $env:DUCK_PORTABLE_OUTPUT',{DUCK_PORTABLE_ZIP:archive,DUCK_PORTABLE_OUTPUT:unpacked},120_000);
 const names=await readdir(unpacked);assert.equal(names.length,1);const folder=join(unpacked,names[0]!);launcher=join(folder,'启动来做鸭.bat');binary=join(folder,'node/node.exe');
 check('portable BAT has no npm/Python/system-runtime setup',! /\b(?:npm|npx|python|curl|wget)\b/i.test(await readFile(launcher,'utf8')));
 const nodeIdentity=JSON.parse((await run(binary,['-p','JSON.stringify({node:process.versions.node,platform:process.platform,arch:process.arch})'],{env:{...process.env,PATH:'',NODE_OPTIONS:'',NODE_PATH:''}})).stdout) as {node:string;platform:string;arch:string};check('extracted binary is native Node24.20.0 Windows x64',nodeIdentity.node==='24.20.0'&&nodeIdentity.platform==='win32'&&nodeIdentity.arch==='x64',nodeIdentity);
 await writeFile(wrapper,'@echo off\r\ncall "%DUCK_PORTABLE_LAUNCHER%" --port %DUCK_PORTABLE_PORT% --no-open > "%DUCK_PORTABLE_STDOUT%" 2> "%DUCK_PORTABLE_STDERR%"\r\nexit /b %errorlevel%\r\n');
 const url=await launch();await open(url);
 await unlockExperimentalHome(required(page),'debug',input,check);await unlockExperimentalHome(required(page),'assemble',input,check);
 const paint=required(page).locator('[data-duck="paint"]');if(await paint.getAttribute('data-c-position')!=='true'){await input.click(paint);await page!.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="paint"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');}await input.click(paint);await page!.locator('#module-frame').waitFor({state:'visible'});
 await page!.frameLocator('#module-frame').locator('#steps').waitFor();let frame=required(page!.frames().find(frame=>frame.url()===url+'/paint'));await frame.waitForFunction(()=>!!Reflect.get(window,'studioProto'));if(await frame.locator('#coach-go').isVisible())await input.click(frame.locator('#coach-go'));
 if(await frame.locator('#start-go').isVisible()){await input.click(frame.locator('[data-start="original"]'));await input.click(frame.locator('#start-go'));}
 check('portable homepage opens its real built paint iframe',frame.url()===url+'/paint');
 await input.click(frame.locator('[data-step="2"]').first());await frame.locator('#filament-series').waitFor();
 const series=await input.menuJourney(frame.locator('#filament-series'),'portable-filament-series');
 const fileExists=async(path:string)=>readFile(path).then(()=>true,()=>false),assetScope={filamentCatalog:await fileExists(join(folder,'runtime/assets/filament-catalog.json')),filamentProfiles:await fileExists(join(folder,'runtime/assets/filament-profiles.json'))};
 await input.click(page!.locator('#close-x'));check('portable native close returns to homepage',!await page!.locator('#module-window').isVisible());await input.click(paint);await page!.locator('#module-frame').waitFor({state:'visible'});await page!.frameLocator('#module-frame').locator('#steps').waitFor();
 frame=required(page!.frames().find(frame=>frame.url()===url+'/paint'));await frame.waitForFunction(()=>!!Reflect.get(window,'studioProto'));check('portable native homepage module reopens actual paint iframe',frame.url()===url+'/paint');await input.capture('portable-native-home-reopened');
 nativeCoverage={status:'partial',entry:'actual homepage paint iframe; Win32 SendInput',assetScope,filamentSeries:series,formalMultiBrandSeries:assetScope.filamentCatalog&&assetScope.filamentProfiles&&series.changedSelectionCovered?'covered for displayed options':'not_run: historical authorized archive has a single displayed filament series or lacks current extra catalog/profile files',visualApproval:'native popup HWND observations and private desktop captures; no human visual approval'};
 const name='Windows portable '+Date.now();await physicalClick(frame.locator('#scheme-btn'));await frame.locator('#sm-name').fill(name);await saveScheme(frame,name,new URL(url).origin);
 const savedColors=(await state(frame)).colors;
 if(await frame.locator('#sm-name').isHidden())await physicalClick(frame.locator('#scheme-btn'));await frame.locator('#sm-name').fill(name+'-failed');await context!.route('**/api/schemes/**',route=>route.request().method()==='PUT'?route.fulfill({status:503,contentType:'application/json',body:'{"error":"test","code":"server.failed","params":{}}'}):route.continue());await physicalClick(frame.locator('#sm-save'));await frame.waitForFunction(()=>document.querySelector('#toast')?.textContent?.includes('未能保存'));check('failed portable save retains the draft',(await state(frame)).dirty);
 const rows=await fetch(url+'/api/schemes').then(response=>response.json()) as Array<{name:string}>;check('failed save does not replace SQLite scheme',rows.some(row=>row.name===name)&&!rows.some(row=>row.name===name+'-failed'));await context!.unroute('**/api/schemes/**');await frame.locator('#sm-name').fill(name);await saveScheme(frame,name,new URL(url).origin);
 await physicalClick(frame.locator('[data-step="3"]').first());await physicalClick(frame.locator('[data-ptab="print"]'));await physicalClick(frame.locator('#export2'));const bytes=await download(frame,'#dl-3mf','ui-export.3mf'),zip=new ZipArchive(bytes),source=new ZipArchive(await readFile(join(folder,'runtime/assets/source.3mf')));
 const geometry=[...source.entries.keys()].filter(name=>name.startsWith('3D/'));check('portable download preserves the source manufacturing records',geometry.length===27&&geometry.every(name=>source.entries.get(name)!.local.equals(zip.entries.get(name)?.local||Buffer.alloc(0))));
 const manufacturing=JSON.parse(zip.read('Metadata/duck_studio_materials.json').toString('utf8')) as {validation:{status:string;partCount:number;plateCount:number}};check('portable export validates35parts6plates',manufacturing.validation.status==='passed'&&manufacturing.validation.partCount===35&&manufacturing.validation.plateCount===6,manufacturing.validation);
 const bom=await download(frame,'#dl-bom','ui-bom.csv');check('portable BOM has35parts',bom.toString('utf8').split('\r\n').length===36);await physicalClick(frame.locator('#export-dialog [data-close]'));await physicalClick(frame.locator('[data-ptab="share"]'));
 const textCode=required(await frame.locator('.code-box code').textContent());assert.ok(textCode.startsWith('v1.'),'The real share panel has an exportable code');await input.click(frame.locator('#copy-code'));
 let copiedCode='';for(let i=0;i<30;i++){copiedCode=await frame.evaluate(async()=>navigator.clipboard.readText());if(copiedCode===textCode)break;await delay(100);}
 check('portable UI copies the displayed palette code to Windows text clipboard',copiedCode===textCode,{displaySelector:'.code-box code',buttonSelector:'#copy-code',expected:textCode,actual:copiedCode});
 await physicalClick(frame.locator('#open-poster'));const poster=await download(frame,'#poster-save','ui-poster.png');check('portable poster saves a real PNG',poster.length>100000&&poster.subarray(0,8).toString('hex')==='89504e470d0a1a0a',{bytes:poster.length});
 await frame.evaluate(async()=>navigator.clipboard.writeText('portable-marker'));await physicalClick(frame.locator('#poster-copy-img'));let clipboardPng:Buffer=Buffer.alloc(0);
 for(let i=0;i<30;i++){const data=await frame.evaluate(async()=>{const items=await navigator.clipboard.read();for(const item of items)if(item.types.includes('image/png'))return Array.from(new Uint8Array(await(await item.getType('image/png')).arrayBuffer()));return[];});clipboardPng=Buffer.from(data);if(clipboardPng.length)break;await delay(100);}
 check('portable poster writes a new real clipboard PNG',clipboardPng.length>100000&&clipboardPng.subarray(0,8).toString('hex')==='89504e470d0a1a0a',{bytes:clipboardPng.length,permission:'clipboard read/write explicitly granted to owned loopback origin'});await writeFile(join(output,'clipboard.png'),clipboardPng);await physicalClick(frame.locator('#poster-close'));await page!.screenshot({path:join(output,'paint.png')});
 await frame.evaluate(()=>localStorage.setItem('portable-retained','yes'));await closeBrowser();await stop();
 const restartUrl=await launch();await open(restartUrl);const reopenRows=await fetch(restartUrl+'/api/schemes').then(response=>response.json()) as Array<{name:string;design:{colors:Record<string,string>}}>;
 check('restarted BAT retains SQLite save',reopenRows.some(row=>row.name===name&&JSON.stringify(row.design.colors)===JSON.stringify(savedColors)));
 await page!.goto(restartUrl+'/paint');await page!.waitForFunction(()=>!!Reflect.get(window,'studioProto'));
 const sameOrigin=new URL(url).origin===new URL(restartUrl).origin;check('same-origin Chromium profile survives real BAT and browser restart',sameOrigin&&await page!.evaluate(()=>localStorage.getItem('portable-retained'))==='yes',{sameOrigin,first:url,restart:restartUrl,storageScope:'first launch chooses a free ephemeral port; restarts reuse that owned port'});
 check('portable retains both native first-use acknowledgements after BAT and browser restart',JSON.stringify(await experimentalAccessState(required(page)))===JSON.stringify({debug:true,assemble:true}));
 await page!.goto(restartUrl+'/assemble/');await page!.waitForURL(restartUrl+'/debug/?from=assemble');check('unverified assembly prerequisite still redirects acknowledged users to debug',new URL(page!.url()).pathname==='/debug/');await closeBrowser();await stop();
 seedSimulatedAssembly(database);const mediaUrl=await launch();await open(mediaUrl);
 const assemble=page!.locator('[data-duck="assemble"]');if(await assemble.getAttribute('data-c-position')!=='true'){await input.click(assemble);await page!.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="assemble"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');}await input.click(assemble);await page!.locator('#module-frame').waitFor({state:'visible'});await page!.frameLocator('#module-frame').locator('#playback-rate select').waitFor();
 const assembly=required(page!.frames().find(frame=>frame.url()===mediaUrl+'/assemble/'));await assembly.waitForFunction(assemblyReady,undefined,{timeout:60_000});check('portable native assembly follows the real homepage iframe',assembly.url()===mediaUrl+'/assemble/');
 const settings=await input.menuJourney(assembly.locator('#playback-rate select'),'portable-assembly-playback-rate');check('portable real six-option native menu changed value',settings.initial.options.length===6&&settings.changedSelectionCovered&&settings.afterMouse.value!==settings.initial.value,settings);
 await input.click(assembly.locator('#sound-controls summary'));check('portable adjacent sound controls open',await assembly.locator('#sound-controls').getAttribute('open')!==null);await input.click(assembly.locator('#sound-close'));check('portable adjacent sound controls close',await assembly.locator('#sound-controls').getAttribute('open')===null);
 await page!.screenshot({path:join(output,'assemble.png')});await input.click(assembly.locator('#reference-toggle'));await assembly.waitForFunction(()=>{const video=document.querySelector('#reference-video');return video instanceof HTMLVideoElement&&video.videoWidth>0&&!video.paused&&video.currentTime>1;},null,{timeout:30_000});await assembly.locator('#reference-video').evaluate(video=>{if(!(video instanceof HTMLVideoElement))throw new Error('Expected video');video.currentTime=10;});await assembly.waitForFunction(()=>{const video=document.querySelector('#reference-video');return video instanceof HTMLVideoElement&&video.currentTime>11;});const video=await assembly.locator('#reference-video').evaluate(video=>{if(!(video instanceof HTMLVideoElement))throw new Error('Expected video');return{width:video.videoWidth,duration:video.duration,playedAndSought:true};});check('portable real video plays and seeks',video.width>0&&video.duration>11,video);await page!.screenshot({path:join(output,'video.png')});
 await input.click(page!.locator('#close-x'));check('portable native assembly closes to homepage',!await page!.locator('#module-window').isVisible());await input.click(assemble);await page!.locator('#module-frame').waitFor({state:'visible'});await page!.frameLocator('#module-frame').locator('#playback-rate select').waitFor();const assemblyReopened=required(page!.frames().find(frame=>frame.url()===mediaUrl+'/assemble/'));await assemblyReopened.waitForFunction(assemblyReady,undefined,{timeout:60_000});check('portable native assembly iframe and select reopen',await assemblyReopened.locator('#playback-rate select').isVisible());await input.capture('portable-native-assembly-reopened');
 nativeCoverage={status:'passed',entry:'actual homepage paint and assembly iframes; Win32 SendInput',assetScope,filamentSeries:series,assemblyPlaybackRate:settings,formalMultiBrandSeries:assetScope.filamentCatalog&&assetScope.filamentProfiles&&series.changedSelectionCovered?'covered for displayed options':'not_run: historical authorized archive has a single displayed filament series or lacks current extra catalog/profile files',assemblyPrerequisite:'15 explicitly simulated records in owned temporary SQLite; no hardware verification',visualApproval:'native popup HWND observations and private desktop captures; no human visual approval'};
 await closeBrowser();await stop();
 check('no page errors in portable journeys',!events.some(item=>typeof item==='object'&&item!==null&&'kind'in item&&item.kind==='pageerror'),events);
 result={status:'passed',artifactIdentity,sourceCommit:process.env.GITHUB_SHA||null,archive:{path:archive,bytes:archiveBytes.length,sha256:sha(archiveBytes)},bundledNode:{...nodeIdentity,sha256:sha(await readFile(binary))},managedChromium:chromium.executablePath(),renderer:'default; no ANGLE override',clipboardText:{displaySelector:'.code-box code',buttonSelector:'#copy-code',expected:textCode,actual:copiedCode},checks,events,launches,assemblyPrerequisite:'15 explicitly simulated records in owned temporary SQLite; no hardware verification',nativeSelect:nativeCoverage,effectiveViewports,clipboardRestored:'not_run: this disposable Actions runner has no personal clipboard; existing PNG write/read assertion retained',physicalDevices:'not_run: invalid DUCK_ADB sentinel; no real personal database',visualApproval:'automated browser actions and private captures; no human visual approval'};
}catch(error){const browserFailure=await capturePortableFailure(page,output);result={status:'failed',artifactIdentity,error:failure(error),browserFailure,checks,events,launches,nativeSelect:nativeCoverage||{status:'not_verified',reason:'native journey did not complete; see error/native-evidence.json'},effectiveViewports};console.log(JSON.stringify(artifactIdentity));process.exitCode=1;console.error(failure(error));}
finally{
 let browserClosed=false,hostExited=false,temporaryRemoved=false;try{await closeBrowser();browserClosed=true;}catch(error){events.push({kind:'browserCleanup',error:String(error)});process.exitCode=1;}
 if(live){try{await stop();}catch(error){forcedCleanup=true;events.push({kind:'forcedOwnedCleanup',error:String(error)});await run('taskkill.exe',['/PID',String(live.rootPid),'/T','/F'],{timeout:20_000}).catch(()=>{});process.exitCode=1;}}
 try{await processesExited(pids);hostExited=true;}catch(error){events.push({kind:'processCleanup',error:String(error)});process.exitCode=1;}
 if(process.exitCode)result={...result,status:'failed'};
 try{await rm(owned,{recursive:true,force:true,maxRetries:5,retryDelay:200});temporaryRemoved=true;}catch(error){events.push({kind:'temporaryCleanup',error:failure(error)});process.exitCode=1;result={...result,status:'failed'};}finally{await writeFile(join(output,'identity.json'),JSON.stringify(artifactIdentity));await writeFile(join(output,'native-evidence.json'),JSON.stringify(nativeEvidence,null,2));await writeFile(join(output,'cleanup.json'),JSON.stringify({browserClosed,ownedProcessIds:[...pids],ownedProcessesExited:hostExited,temporaryDataRemoved:temporaryRemoved,forcedCleanup,fakeAdb:{mode:'existing invalid PE; real ADB never selected',path:adb}},null,2));await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));}
}
console.log(JSON.stringify(result));
