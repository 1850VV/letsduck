/** Windows Actions diagnostic only. Node24 native strip-types; no npm, app or model. */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';

if(process.platform!=='win32'||process.arch!=='x64'||process.env.GITHUB_ACTIONS!=='true'){
 console.log(JSON.stringify({status:'not_run',reason:'Requires an actual isolated Windows x64 GitHub Actions runner; do not spoof GITHUB_ACTIONS.'}));process.exit(2);
}
const run=promisify(execFile),output=resolve(process.env.DUCK_CANARY_OUTPUT||'output/windows-console-canary');
const powershell=join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
const binary=resolve(process.env.DUCK_CONSOLE_NODE||process.execPath),env={...process.env,PATH:'',NODE_OPTIONS:'',NODE_PATH:''};
const nodeIdentity:unknown=JSON.parse((await run(binary,['-p','JSON.stringify({node:process.versions.node,uv:process.versions.uv,platform:process.platform,arch:process.arch})'],{env,timeout:10_000})).stdout);
await mkdir(output,{recursive:true});
const owned=await mkdtemp(join(tmpdir(),'letsduck-console-canary-'));
type Snapshot={consoleMembers?:number[];rootAlive?:boolean;nodeAlive?:boolean};
type StopEvidence={signalSent?:boolean;status?:string;before?:Snapshot;afterSignal?:Snapshot;afterWait?:Snapshot;nodeExit?:number;consoleExit?:number;helperPID?:number};
type Marker={kind:string;pid:number;ppid?:number;code?:number;execPath?:string};
type CaseResult={name:string;resetParentIgnore:boolean;rootPID?:number;nodePID?:number;launchHelperPID?:number;signalReceived:boolean;normalExit:boolean;forcedCleanup:boolean;ownedRootNodeExited:boolean;helperStdout:string;helperStderr:string;stdout:string;stderr:string;markers:Marker[];console?:StopEvidence;error?:string};
const cases:CaseResult[]=[];
function failure(error:unknown){return error instanceof Error?error.stack||error.message:String(error);}
function alive(pid:number){try{process.kill(pid,0);return true;}catch{return false;}}
async function text(path:string){return readFile(path,'utf8').catch(()=>'');}
async function json(path:string):Promise<unknown>{const value=await text(path);try{return JSON.parse(value);}catch{return{unavailable:true,raw:value};}}
async function markers(path:string):Promise<Marker[]>{return(await text(path)).split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line) as Marker);}
const payload=String.raw`import {appendFileSync} from 'node:fs';
const file=process.argv[2];
const mark=kind=>appendFileSync(file,JSON.stringify({kind,pid:process.pid,ppid:process.ppid,execPath:process.execPath,atUtc:new Date().toISOString()})+'\n');
const timer=setInterval(()=>{},1000);
process.once('SIGINT',()=>{mark('SIGINT');clearInterval(timer);process.exitCode=0;});
process.once('exit',code=>appendFileSync(file,JSON.stringify({kind:'exit',pid:process.pid,code,atUtc:new Date().toISOString()})+'\n'));
mark('started');console.log('CANARY_READY '+process.pid);
`;
const launchScript=String.raw`$ErrorActionPreference='Stop'
$reset=$false
if($env:DUCK_CANARY_RESET_IGNORE -eq '1'){
 Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class CanaryLaunch{[DllImport("kernel32.dll",SetLastError=true)]public static extern bool SetConsoleCtrlHandler(IntPtr routine,bool add);}'
 if(![CanaryLaunch]::SetConsoleCtrlHandler([IntPtr]::Zero,$false)){throw 'Cannot restore Ctrl+C handling in this owned launch helper'}
 $reset=$true
}
$p=Start-Process -FilePath $env:ComSpec -ArgumentList @('/d','/c',('"'+$env:DUCK_PORTABLE_WRAPPER+'"')) -WorkingDirectory $env:DUCK_PORTABLE_OWNED -WindowStyle Normal -PassThru
$receipt=@{pid=$p.Id;helperPID=$PID;parentIgnoreReset=$reset}|ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($env:DUCK_CANARY_LAUNCH_RECEIPT,$receipt,[System.Text.UTF8Encoding]::new($false))
Write-Output $receipt
`;
// Same owned-console stop helper as the acceptance script, with diagnostic snapshots.
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
$evidence=[ordered]@{helperPID=$PID;rootPID=$RootPid;nodePID=$NodePid;status='pending';signalSent=$false;before=$null;afterSignal=$null;afterWait=$null}
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
}`;

async function oneCase(name:string,resetParentIgnore:boolean):Promise<CaseResult>{
 const folder=join(owned,name);await mkdir(folder);
 const wrapper=join(folder,'wrapper.cmd'),launcher=join(folder,'launcher.bat'),script=join(folder,'marker-node.mjs'),marker=join(folder,'markers.jsonl');
 const stdout=join(folder,'stdout.log'),stderr=join(folder,'stderr.log'),launchReceipt=join(folder,'launch.json'),stopReceipt=join(folder,'stop.json'),stopFile=join(folder,'stop.ps1');
 const result:CaseResult={name,resetParentIgnore,signalReceived:false,normalExit:false,forcedCleanup:false,ownedRootNodeExited:false,helperStdout:'',helperStderr:'',stdout:'',stderr:'',markers:[]};
 cases.push(result);
 await writeFile(script,payload);await writeFile(launcher,'@echo off\r\n"%DUCK_CANARY_NODE%" "%DUCK_CANARY_SCRIPT%" "%DUCK_CANARY_MARKER%" %*\r\n');
 // This is the portable smoke's actual wrapper and Start-Process/CMD topology.
 await writeFile(wrapper,'@echo off\r\ncall "%DUCK_PORTABLE_LAUNCHER%" --port %DUCK_PORTABLE_PORT% --no-open > "%DUCK_PORTABLE_STDOUT%" 2> "%DUCK_PORTABLE_STDERR%"\r\nexit /b %errorlevel%\r\n');
 await writeFile(stopFile,stopScript);
 try{
  await run(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-Command',launchScript],{env:{...env,DUCK_PORTABLE_WRAPPER:wrapper,DUCK_PORTABLE_OWNED:folder,DUCK_PORTABLE_LAUNCHER:launcher,DUCK_PORTABLE_PORT:'0',DUCK_PORTABLE_STDOUT:stdout,DUCK_PORTABLE_STDERR:stderr,DUCK_CANARY_NODE:binary,DUCK_CANARY_SCRIPT:script,DUCK_CANARY_MARKER:marker,DUCK_CANARY_LAUNCH_RECEIPT:launchReceipt,DUCK_CANARY_RESET_IGNORE:resetParentIgnore?'1':'0'},timeout:30_000,maxBuffer:1024*1024});
  const launch=await json(launchReceipt) as {pid:number;helperPID:number};result.rootPID=launch.pid;result.launchHelperPID=launch.helperPID;
  const deadline=Date.now()+30_000;while(Date.now()<deadline&&!(await text(stdout)).includes('CANARY_READY '))await delay(50);
  result.markers=await markers(marker);const started=result.markers.find(item=>item.kind==='started');assert.ok(started,'Canary did not reach its installed SIGINT listener');
  result.nodePID=started.pid;assert.equal(started.ppid,result.rootPID,'Exact marker Node must be a direct child of the owned BAT root');
  const receipt=await run(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',stopFile,'-RootPid',String(result.rootPID),'-NodePid',String(result.nodePID),'-EvidencePath',stopReceipt],{timeout:30_000,maxBuffer:1024*1024});
  result.helperStdout=receipt.stdout;result.helperStderr=receipt.stderr;
  result.console=await json(stopReceipt) as StopEvidence;result.markers=await markers(marker);result.signalReceived=result.markers.some(item=>item.kind==='SIGINT');
  result.normalExit=result.signalReceived&&result.markers.some(item=>item.kind==='exit'&&item.code===0)&&result.console.nodeExit===0&&result.console.consoleExit===0;
  assert.ok(result.normalExit,'Actual SIGINT marker and both real zero exit codes are required');
 }catch(error){const child=error as {stdout?:unknown;stderr?:unknown};result.error=failure(error);result.helperStdout=typeof child.stdout==='string'?child.stdout:result.helperStdout;result.helperStderr=typeof child.stderr==='string'?child.stderr:result.helperStderr;process.exitCode=1;}
 finally{
  // Recover only our own launch receipt and marker when a subprocess fails early.
  const launch=await json(launchReceipt) as {pid?:number;helperPID?:number};if(result.rootPID===undefined&&typeof launch.pid==='number')result.rootPID=launch.pid;if(result.launchHelperPID===undefined&&typeof launch.helperPID==='number')result.launchHelperPID=launch.helperPID;
  result.markers=await markers(marker);const started=result.markers.find(item=>item.kind==='started');if(started&&result.nodePID===undefined)result.nodePID=started.pid;
  result.signalReceived=result.markers.some(item=>item.kind==='SIGINT');result.console=await json(stopReceipt) as StopEvidence;
  const tracked=[result.rootPID,result.nodePID].filter((pid):pid is number=>Number.isInteger(pid)&&Number(pid)>0);
  if(tracked.some(alive)){
   result.forcedCleanup=true;result.normalExit=false;process.exitCode=1;
   if(result.rootPID&&alive(result.rootPID))await run('taskkill.exe',['/PID',String(result.rootPID),'/T','/F'],{timeout:10_000}).catch(error=>{result.error=(result.error||'')+'\nOwned root cleanup: '+failure(error);});
   if(result.nodePID&&alive(result.nodePID))await run('taskkill.exe',['/PID',String(result.nodePID),'/F'],{timeout:10_000}).catch(error=>{result.error=(result.error||'')+'\nOwned Node cleanup: '+failure(error);});
  }
  for(let i=0;i<100&&tracked.some(alive);i++)await delay(50);
  result.ownedRootNodeExited=tracked.length>0&&tracked.every(pid=>!alive(pid));if(!result.ownedRootNodeExited)process.exitCode=1;
  result.stdout=await text(stdout);result.stderr=await text(stderr);await writeFile(join(output,name+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({case:name,...result}));
 }
 return result;
}
let temporaryDataRemoved=false,fatalError:string|undefined;
try{
 const baseline=await oneCase('baseline',false);
 const nodeWasConsoleMember=!!baseline.nodePID&&!!baseline.console?.before?.consoleMembers?.includes(baseline.nodePID);
 if(!baseline.signalReceived&&baseline.console?.signalSent&&nodeWasConsoleMember&&baseline.ownedRootNodeExited)await oneCase('reset-ignore-in-owned-parent',true);
 else console.log(JSON.stringify({case:'reset-ignore-in-owned-parent',status:'not_run',reason:'Requires baseline missing SIGINT after successful signal submission with its Node confirmed in the owned console'}));
}catch(error){fatalError=failure(error);process.exitCode=1;console.error(fatalError);}finally{
 try{await rm(owned,{recursive:true,force:true,maxRetries:5,retryDelay:200});temporaryDataRemoved=true;}catch(error){process.exitCode=1;console.error(failure(error));}
 const bytes=await readFile(binary);const result={status:process.exitCode?'failed':'passed',purpose:'transport diagnostic only; no app/host/GPU/device acceptance',fatalError:fatalError||null,node:{path:binary,identity:nodeIdentity,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')},topology:'PowerShell Start-Process -> private CMD -> wrapper CALL BAT -> Node; stdout redirected in wrapper; PATH empty',cases,temporaryDataRemoved};
 await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
