/** Windows disposable-runner acceptance. All user input goes through Win32 SendInput. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify,parseArgs} from 'node:util';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import type {ElectronApplication,Locator,Page} from 'playwright';
import {root,desktop,desktopScope,failure,resizeWindow,required} from './check-support.js';

assert.equal(process.platform,'win32','This native acceptance requires Windows');
assert.equal(process.arch,'x64');
assert.equal(process.env.GITHUB_ACTIONS,'true','A disposable Actions runner is required; never spoof this on a personal PC');
const {values}=parseArgs({options:{installer:{type:'string'}}});
const version=process.env.DUCK_RELEASE_VERSION||'0.1.0-beta.4';
const installer=resolve(values.installer||process.env.DUCK_NATIVE_INSTALLER||join(desktop,`release/win32-x64/letsduck-${version}-win-x64.exe`));
const output=resolve(process.env.DUCK_TEST_OUTPUT||join(root,'output/windows-native-input'));
await mkdir(output,{recursive:true});
const scope=await desktopScope('letsduck-win-native-'),run=promisify(execFile),sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const installation=join(scope.temporary,'app'),executable=join(installation,'letsduck.exe'),script=join(scope.temporary,'native-input.ps1');
const events:unknown[]=[],checks:Array<{name:string;passed:boolean;detail:unknown}>=[],nativeEvidence:unknown[]=[];
let app:ElectronApplication|undefined,page:Page|undefined,hwnd='',clipboardSaved=false,clipboardRestored=false,result:Record<string,unknown>|undefined;
const installationCleanup:Array<{forcedPids:number[];remainingPids:number[]}>=[];
async function stopOwned():Promise<void>{
 const stopped=await run('powershell.exe',['-NoProfile','-NonInteractive','-Command',String.raw`Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | ForEach-Object { if ($_.MainWindowHandle -ne 0) { [void]$_.CloseMainWindow(); [void]$_.WaitForExit(10000) } }; $forced=@(Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Select-Object -ExpandProperty Id); $forced | ForEach-Object { Stop-Process -Id $_ -Force }; @{forcedPids=@($forced);remainingPids=@(Get-Process | Where-Object { $_.Path -eq $env:DUCK_INSTALLED_EXE } | Select-Object -ExpandProperty Id)} | ConvertTo-Json -Compress`],{env:{...scope.env,DUCK_INSTALLED_EXE:executable},timeout:60_000});
 const receipt=JSON.parse(stopped.stdout.trim()) as {forcedPids:number[];remainingPids:number[]};installationCleanup.push(receipt);assert.deepEqual(receipt.remainingPids,[],'Exact owned installed executable processes exited');
}
scope.addCleanup(stopOwned);

// The helper observes only windows owned by this test. It never dispatches DOM events.
const nativeScript=String.raw`param([string]$Action,[string]$Window,[double]$X=0,[double]$Y=0,[string]$Key,[string]$Output,[string]$OwnedPids)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
using System.Collections.Generic;
public class DuckNative {
 [StructLayout(LayoutKind.Sequential)] public struct POINT {public int X;public int Y;}
 [StructLayout(LayoutKind.Sequential)] public struct RECT {public int Left;public int Top;public int Right;public int Bottom;}
 [StructLayout(LayoutKind.Sequential)] public struct MOUSEINPUT {public int dx;public int dy;public uint mouseData;public uint dwFlags;public uint time;public UIntPtr extra;}
 [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT {public ushort wVk;public ushort wScan;public uint dwFlags;public uint time;public UIntPtr extra;}
 [StructLayout(LayoutKind.Explicit)] public struct UNION {[FieldOffset(0)]public MOUSEINPUT mouse;[FieldOffset(0)]public KEYBDINPUT key;}
 [StructLayout(LayoutKind.Sequential)] public struct INPUT {public uint type;public UNION data;}
 public delegate bool EnumProc(IntPtr h,IntPtr p);
 [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int command);
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr h,ref POINT p);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h,out RECT r);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc callback,IntPtr p);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h,StringBuilder s,int max);
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll",SetLastError=true)] public static extern uint SendInput(uint count,INPUT[] inputs,int size);
 [DllImport("user32.dll")] public static extern IntPtr OpenInputDesktop(uint flags,bool inherit,uint access);
 [DllImport("user32.dll")] public static extern bool CloseDesktop(IntPtr desktop);
 public class WindowInfo {public string handle;public uint pid;public string className;public int left;public int top;public int right;public int bottom;}
 public static WindowInfo[] Windows(uint[] owned) {var found=new List<WindowInfo>();EnumWindows((h,p)=>{uint pid;GetWindowThreadProcessId(h,out pid);if(Array.IndexOf(owned,pid)>=0&&IsWindowVisible(h)){RECT r;GetWindowRect(h,out r);var s=new StringBuilder(256);GetClassName(h,s,256);found.Add(new WindowInfo{handle=h.ToInt64().ToString(),pid=pid,className=s.ToString(),left=r.Left,top=r.Top,right=r.Right,bottom=r.Bottom});}return true;},IntPtr.Zero);return found.ToArray();}
 static void Send(INPUT[] values) {if(SendInput((uint)values.Length,values,Marshal.SizeOf(typeof(INPUT)))!=values.Length)throw new Exception("SendInput rejected: "+Marshal.GetLastWin32Error());}
 public static void Click(int x,int y) {if(!SetCursorPos(x,y))throw new Exception("SetCursorPos failed");Send(new[]{new INPUT{type=0,data=new UNION{mouse=new MOUSEINPUT{dwFlags=2}}},new INPUT{type=0,data=new UNION{mouse=new MOUSEINPUT{dwFlags=4}}}});}
 static INPUT Keyboard(ushort key,bool up){return new INPUT{type=1,data=new UNION{key=new KEYBDINPUT{wVk=key,dwFlags=up?2u:0u}}};}
 public static void Key(ushort key,bool shift,bool alt){var keys=new List<INPUT>();if(shift)keys.Add(Keyboard(16,false));if(alt)keys.Add(Keyboard(18,false));keys.Add(Keyboard(key,false));keys.Add(Keyboard(key,true));if(alt)keys.Add(Keyboard(18,true));if(shift)keys.Add(Keyboard(16,true));Send(keys.ToArray());}
}
'@
[void][DuckNative]::SetProcessDPIAware()
$handle=[IntPtr]::new([long]$Window)
if($Action -eq 'activate'){[void][DuckNative]::ShowWindow($handle,9);[void][DuckNative]::SetForegroundWindow($handle);Start-Sleep -Milliseconds 150}
if($Action -eq 'click'){[DuckNative]::Click([int]$X,[int]$Y)}
if($Action -eq 'key'){
 $name=$Key -replace '^(Shift\+|Alt\+)','';$keys=@{Tab=9;Enter=13;Escape=27;Space=32;Home=36;End=35;ArrowUp=38;ArrowDown=40}
 if(!$keys.ContainsKey($name)){throw 'Unsupported native key'}
 [DuckNative]::Key([ushort]$keys[$name],$Key.StartsWith('Shift+'),$Key.StartsWith('Alt+'))
}
if($Action -eq 'capture'){
 $bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen
 $image=New-Object System.Drawing.Bitmap($bounds.Width,$bounds.Height)
 $graphics=[System.Drawing.Graphics]::FromImage($image)
 try{$graphics.CopyFromScreen($bounds.Left,$bounds.Top,0,0,$bounds.Size);$image.Save($Output,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$graphics.Dispose();$image.Dispose()}
}
Start-Sleep -Milliseconds 120
$r=New-Object DuckNative+RECT;$point=New-Object DuckNative+POINT
if(![DuckNative]::GetClientRect($handle,[ref]$r)){throw 'Cannot observe owned window client rect'}
if(![DuckNative]::ClientToScreen($handle,[ref]$point)){throw 'Cannot map owned window to desktop'}
$inputDesktop=[DuckNative]::OpenInputDesktop(0,$false,0x0100)
$inputAvailable=$inputDesktop -ne [IntPtr]::Zero
if($inputAvailable){[void][DuckNative]::CloseDesktop($inputDesktop)}
$owned=[uint[]]@(($OwnedPids -split ',')|ForEach-Object{[uint]$_})
@{foreground=[DuckNative]::GetForegroundWindow().ToInt64().ToString();client=@{x=$point.X;y=$point.Y;width=$r.Right-$r.Left;height=$r.Bottom-$r.Top};windows=@([DuckNative]::Windows($owned));inputDesktopAvailable=$inputAvailable;sessionId=[System.Diagnostics.Process]::GetCurrentProcess().SessionId;screen=@{width=[System.Windows.Forms.SystemInformation]::VirtualScreen.Width;height=[System.Windows.Forms.SystemInformation]::VirtualScreen.Height}}|ConvertTo-Json -Depth 7 -Compress
`;
type NativeWindow={handle:string;pid:number;className:string;left:number;top:number;right:number;bottom:number};
type NativeState={foreground:string;client:{x:number;y:number;width:number;height:number};windows:NativeWindow[];inputDesktopAvailable:boolean;sessionId:number;screen:{width:number;height:number}};
async function native(action:string,extra:string[]=[]):Promise<NativeState>{
 const pids=app?await app.evaluate(({app})=>app.getAppMetrics().map(item=>item.pid)):[];
 const answer=await run('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script,'-Action',action,'-Window',hwnd,'-OwnedPids',pids.join(','),...extra],{timeout:30_000,maxBuffer:1024*1024});
 const state=JSON.parse(answer.stdout.trim()) as NativeState;
 nativeEvidence.push({action,extra,state});assert.equal(state.inputDesktopAvailable,true,'The runner must expose an unlocked input desktop');assert.ok(state.sessionId>0,'An interactive Windows session is required');return state;
}
function check(name:string,passed:boolean,detail:unknown=null){checks.push({name,passed,detail});console.log(JSON.stringify({check:name,passed,detail}));assert.ok(passed,name+' '+JSON.stringify(detail));}
async function click(target:Locator){
 const box=required(await target.boundingBox());const state=await native('inspect');const viewport=await required(page).evaluate(()=>({width:innerWidth,height:innerHeight}));
 await native('click',['-X',String(Math.round(state.client.x+(box.x+box.width/2)*state.client.width/viewport.width)),'-Y',String(Math.round(state.client.y+(box.y+box.height/2)*state.client.height/viewport.height))]);
}
async function key(value:string){await native('key',['-Key',value]);}
async function capture(name:string){await native('capture',['-Output',join(output,name+'.png')]);}
async function observe(select:Locator){return select.evaluate(element=>{if(!(element instanceof HTMLSelectElement))throw new Error('Expected actual select');return{value:element.value,index:element.selectedIndex,options:Array.from(element.options,option=>({value:option.value,text:option.text})),focused:document.activeElement===element,disabled:element.disabled,connected:element.isConnected};});}
async function popup(before:NativeState):Promise<NativeWindow>{
 const known=new Set(before.windows.map(item=>item.handle));let state:NativeState|undefined;
 for(let i=0;i<5;i++){state=await native('inspect');const found=state.windows.find(item=>!known.has(item.handle)&&item.handle!==hwnd&&item.right>item.left&&item.bottom>item.top);if(found)return found;await delay(100);}
 throw new Error('No separate owned native popup window appeared: '+JSON.stringify(state));
}
async function menuJourney(select:Locator,label:string){
 const initial=await observe(select);check(label+' is an enabled actual select',!initial.disabled&&initial.options.length>0,initial);
 const original=required(await select.elementHandle());const baseline=await native('inspect');await click(select);const opened=await popup(baseline);await capture(label+'-mouse-open');
 check(label+' click preserves the control',await original.evaluate(element=>element.isConnected));
 // For these short menus the popup contains every row. Refuse guessed positions in a scrollable menu.
 const row=(opened.bottom-opened.top)/initial.options.length;
 check(label+' native popup rows fit without scrolling',row>=12&&row<=64&&initial.options.length<=12,{popup:opened,row,options:initial.options.length});
 const targetIndex=initial.options.length>1?(initial.index+1)%initial.options.length:initial.index;
 await native('click',['-X',String(Math.round((opened.left+opened.right)/2)),'-Y',String(Math.round(opened.top+row*(targetIndex+.5)))]);
 await select.page().waitForTimeout(150);const afterMouse=await observe(select);
 check(label+' actual mouse option selected',afterMouse.value===initial.options[targetIndex]!.value&&afterMouse.focused,{before:initial,after:afterMouse});
 const beforeKeyboard=await native('inspect');await click(select);await popup(beforeKeyboard);await key('Home');
 const keyboardIndex=initial.options.length>1?(targetIndex+1)%initial.options.length:0;
 if(keyboardIndex===0){await key('ArrowDown');await key('Home');}else for(let index=0;index<keyboardIndex;index++)await key('ArrowDown');
 await key('Enter');const afterKeyboard=await observe(select),expected=initial.options[keyboardIndex]!.value;
 check(label+' Down and Enter select through native input',afterKeyboard.value===expected&&afterKeyboard.focused&&(initial.options.length===1||afterKeyboard.value!==afterMouse.value),{afterKeyboard,mouseValue:afterMouse.value,changedSelectionCovered:initial.options.length>1});
 const beforeCancel=await native('inspect');await click(select);await popup(beforeCancel);await key('ArrowDown');await key('Escape');const afterCancel=await observe(select);
 check(label+' Escape cancels the pending selection and returns focus',afterCancel.value===afterKeyboard.value&&afterCancel.focused,afterCancel);
 await key('Tab');check(label+' Tab moves focus away',!(await observe(select)).focused);await key('Shift+Tab');check(label+' reverse Tab restores select focus',(await observe(select)).focused);
 const beforeSpace=await native('inspect');await key('Space');await popup(beforeSpace);await capture(label+'-space-reopen');await key('Escape');
 check(label+' Space reopens and Escape retains focus',(await observe(select)).focused);
 return{initial,afterMouse,afterKeyboard,afterCancel,changedSelectionCovered:initial.options.length>1};
}
try{
 await writeFile(script,nativeScript);await stat(installer);
 await run(installer,['/S',`/D=${installation}`],{env:scope.env,timeout:180_000});await stopOwned();await stat(executable);
 const resources=join(installation,'resources');
 check('full-assets installation has licensed model',(await stat(join(resources,'runtime/assets/model.json'))).isFile());
 const fileExists=async(path:string)=>stat(path).then(()=>true,()=>false);
 const assetScope={filamentCatalog:await fileExists(join(resources,'runtime/assets/filament-catalog.json')),filamentProfiles:await fileExists(join(resources,'runtime/assets/filament-profiles.json'))};
 app=await scope.launch(undefined,executable);page=await app.firstWindow();page.setDefaultTimeout(30_000);
 page.on('pageerror',error=>events.push({kind:'pageerror',message:error.message}));page.on('console',message=>{if(message.type()==='error')events.push({kind:'console',message:message.text()});});
 app.context().on('requestfailed',request=>events.push({kind:'requestfailed',url:request.url(),failure:request.failure()}));
 const identity=await app.evaluate(({app,screen})=>({packaged:app.isPackaged,version:app.getVersion(),arch:process.arch,execPath:process.execPath,workArea:screen.getPrimaryDisplay().workArea}));
 check('installed x64 package identity',identity.packaged&&identity.arch==='x64'&&identity.version===version,identity);
 const width=Math.max(800,Math.min(1280,identity.workArea.width-50)),height=Math.max(600,Math.min(800,identity.workArea.height-100));
 await resizeWindow(app,page,{width,height});const window=await app.browserWindow(page);
 try{hwnd=await window.evaluate(window=>window.getNativeWindowHandle().readBigUInt64LE().toString());await window.evaluate((window,area)=>{window.setPosition(area.x+10,area.y+10);window.show();window.focus();},identity.workArea);}finally{await window.dispose();}
 const active=await native('activate');check('owned application is in the foreground',active.foreground===hwnd,active);
 await page.waitForFunction(()=>document.body.dataset.homeReady==='true');const paint=page.locator('[data-duck="paint"]');
 if(await paint.getAttribute('data-c-position')!=='true'){await click(paint);await page.waitForFunction(()=>document.querySelector<HTMLElement>('[data-duck="paint"]')?.dataset.cPosition==='true'&&document.querySelector<HTMLElement>('.duck-stage')?.dataset.settled!=='false');}
 await click(paint);await page.locator('#module-frame').waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#module-frame')?.getAttribute('src')==='/paint');
 const frame=required(page.frames().find(frame=>frame.url()==='duck://app/paint'));await frame.waitForFunction(()=>!!Reflect.get(window,'studioProto'));
 if(await frame.locator('#coach-go').isVisible())await click(frame.locator('#coach-go'));
 if(await frame.locator('#start-go').isVisible()){await click(frame.locator('[data-start="original"]'));await click(frame.locator('#start-go'));}
 await click(frame.locator('[data-step="2"]').first());await frame.locator('#filament-series').waitFor();
 check('native input followed the real homepage iframe',frame.url()==='duck://app/paint');
 const series=await menuJourney(frame.locator('#filament-series'),'filament-series');
 // A historical authorized asset pack can have only one series. Never inject extra options.
 const coverage={assetScope,filamentSeries:series,formalMultiBrandSeries:assetScope.filamentCatalog&&series.changedSelectionCovered?'covered for displayed options':'not_run: authorized historical archive lacks current extra filament files or multiple series'};
 await click(frame.locator('#workflow-settings'));await frame.locator('#workflow-settings-dialog').waitFor({state:'visible'});
 const settings=await menuJourney(frame.locator('#workflow-settings-default'),'workflow-default');
 check('a real multi-option native menu changed value',settings.changedSelectionCovered&&settings.afterMouse.value!==settings.initial.value,settings);
 await click(frame.locator('#workflow-settings-dialog .icon-button'));check('neighbor dialog closes through native mouse',!await frame.locator('#workflow-settings-dialog').isVisible());
 await app.evaluate(async({clipboard,ClipboardItem})=>{const copied=[];for(const item of await clipboard.read()){const types:Record<string,Blob|Electron.ClipboardBookmark>={};for(const type of item.types)types[type]=await item.getType(type);copied.push(new ClipboardItem(types));}Reflect.set(globalThis,'duckNativeClipboardBackup',copied);await clipboard.writeText('duck-native-clipboard-marker');});clipboardSaved=true;
 await click(frame.locator('[data-step="3"]').first());await click(frame.locator('[data-ptab="share"]'));await click(frame.locator('#open-poster'));
 await frame.locator('#poster-copy-img').waitFor({state:'visible'});await frame.waitForFunction(()=>!document.querySelector<HTMLButtonElement>('#poster-copy-img')?.disabled);
 await click(frame.locator('#poster-copy-img'));
 let clip:{formats:string[];width:number;height:number;png:string}|undefined;
 for(let i=0;i<30;i++){clip=await app.evaluate(async({clipboard,nativeImage})=>{const entries=await clipboard.read(),formats=entries.flatMap(item=>item.types),item=entries.find(item=>item.types.includes('image/png'));const bytes=item?Buffer.from(await(await item.getType('image/png')).arrayBuffer()):Buffer.alloc(0),image=nativeImage.createFromBuffer(bytes),size=image.getSize();return{formats,width:size.width,height:size.height,png:bytes.toString('base64')};});if(clip.width>0)break;await delay(100);}
 const png=Buffer.from(required(clip).png,'base64');check('native poster action writes a real PNG to Windows clipboard',png.length>100000&&png.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&required(clip).width>0,{formats:clip?.formats,bytes:png.length,width:clip?.width,height:clip?.height});await writeFile(join(output,'clipboard.png'),png);
 await click(frame.locator('#poster-close'));await click(page.locator('#close-x'));check('native close returns to homepage',!await page.locator('#module-window').isVisible());await click(paint);await page.locator('#module-frame').waitFor({state:'visible'});
 const reopened=required(page.frames().find(frame=>frame.url()==='duck://app/paint'));await reopened.waitForFunction(()=>!!Reflect.get(window,'studioProto'));
 check('native homepage module reopens actual paint iframe',reopened.url()==='duck://app/paint');await capture('final-home-iframe');
 check('no page runtime errors',!events.some(value=>typeof value==='object'&&value!==null&&'kind'in value&&value.kind==='pageerror'),events);
 result={status:'passed',installer:{path:installer,bytes:(await stat(installer)).size,sha256:sha(await readFile(installer))},identity,defaultGpu:true,sourceCommit:process.env.GITHUB_SHA||null,coverage,settings,clipboard:{formats:clip?.formats,bytes:png.length,width:clip?.width,height:clip?.height,sha256:sha(png)},checks,events,physicalDevices:'not_run: explicit invalid DUCK_ADB sentinel and temporary DB/profile',visualAcceptance:'automated native input and captured screens; no human visual approval'};
}catch(error){result={status:'failed',error:failure(error),checks,events};process.exitCode=1;if(hwnd)await capture('failure-native').catch(()=>{});console.error(failure(error));}
finally{
 if(app&&clipboardSaved)try{await app.evaluate(async({clipboard})=>{const copied=Reflect.get(globalThis,'duckNativeClipboardBackup') as Electron.ClipboardItem[];if(copied.length)await clipboard.write(copied);else clipboard.clear();});clipboardRestored=true;}catch(error){events.push({kind:'clipboardRestore',error:String(error)});result={...result,status:'failed',clipboardRestoreError:failure(error)};process.exitCode=1;}
 let cleaned=false;try{await scope.dispose();cleaned=true;}catch(error){result={...result,status:'failed',cleanupError:failure(error)};process.exitCode=1;throw error;}finally{if(installationCleanup.some(item=>item.forcedPids.length>0)){result={...result,status:'failed',forcedOwnedProcessTermination:installationCleanup};process.exitCode=1;}await writeFile(join(output,'native-evidence.json'),JSON.stringify(nativeEvidence,null,2));await writeFile(join(output,'cleanup.json'),JSON.stringify({ownedProcessesExited:cleaned,temporaryInstallationRemoved:cleaned,temporaryDataRemoved:cleaned,clipboardRestored,installationCleanup,ownedPids:[...scope.pids],fakeAdb:scope.adbEvidence()},null,2));await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));}
}
console.log(JSON.stringify(result));
