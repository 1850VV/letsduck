/** Shared Win32 input for the two disposable Windows acceptance scripts; no DOM input. */
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import type {Locator,Page} from 'playwright';
import {required} from './check-support.js';

export const windowsPowerShell=join(process.env.SystemRoot||'C:\\Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
export type NativeWindow={handle:string;pid:number;className:string;left:number;top:number;right:number;bottom:number};
type Rectangle={x:number;y:number;width:number;height:number};
export type NativeDesktop={inputDesktopAvailable:boolean;sessionId:number;screen:Rectangle;workArea:Rectangle};
export type NativeState=NativeDesktop&{foreground:string;root:NativeWindow;contentHandle:string;client:Rectangle;windows:NativeWindow[]};
type NativeTarget={window:string;ownedPids:number[];chromiumBrowserPid?:number};
type Check=(name:string,passed:boolean,detail?:unknown)=>void;

const nativeScript=String.raw`param([string]$Action,[string]$Window,[double]$X=0,[double]$Y=0,[string]$Key,[string]$Output,[string]$OwnedPids,[System.UInt32]$BrowserPid=0)
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
 [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr parent,EnumProc callback,IntPtr p);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint pid);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h,StringBuilder s,int max);
 [DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y);
 [DllImport("user32.dll",SetLastError=true)] public static extern uint SendInput(uint count,INPUT[] inputs,int size);
 [DllImport("user32.dll")] public static extern IntPtr OpenInputDesktop(uint flags,bool inherit,uint access);
 [DllImport("user32.dll")] public static extern bool CloseDesktop(IntPtr desktop);
 public class WindowInfo {public string handle;public uint pid;public string className;public int left;public int top;public int right;public int bottom;}
 public static WindowInfo[] Renderers(IntPtr root,uint[] owned) {var found=new List<WindowInfo>();EnumChildWindows(root,(h,p)=>{uint pid;GetWindowThreadProcessId(h,out pid);var s=new StringBuilder(256);GetClassName(h,s,256);if(Array.IndexOf(owned,pid)>=0&&IsWindowVisible(h)&&s.ToString()=="Chrome_RenderWidgetHostHWND"){RECT r;GetClientRect(h,out r);POINT point=new POINT();if(!ClientToScreen(h,ref point))throw new Exception("Cannot map renderer client to desktop");if(r.Right>r.Left&&r.Bottom>r.Top)found.Add(new WindowInfo{handle=h.ToInt64().ToString(),pid=pid,className=s.ToString(),left=point.X,top=point.Y,right=point.X+r.Right-r.Left,bottom=point.Y+r.Bottom-r.Top});}return true;},IntPtr.Zero);return found.ToArray();}
 public static WindowInfo[] Windows(uint[] owned) {var found=new List<WindowInfo>();EnumWindows((h,p)=>{uint pid;GetWindowThreadProcessId(h,out pid);if(Array.IndexOf(owned,pid)>=0&&IsWindowVisible(h)){RECT r;GetWindowRect(h,out r);var s=new StringBuilder(256);GetClassName(h,s,256);found.Add(new WindowInfo{handle=h.ToInt64().ToString(),pid=pid,className=s.ToString(),left=r.Left,top=r.Top,right=r.Right,bottom=r.Bottom});}return true;},IntPtr.Zero);return found.ToArray();}
 static void Send(INPUT[] values) {if(SendInput((uint)values.Length,values,Marshal.SizeOf(typeof(INPUT)))!=values.Length)throw new Exception("SendInput rejected: "+Marshal.GetLastWin32Error());}
 public static void Click(int x,int y) {if(!SetCursorPos(x,y))throw new Exception("SetCursorPos failed");Send(new[]{new INPUT{type=0,data=new UNION{mouse=new MOUSEINPUT{dwFlags=2}}},new INPUT{type=0,data=new UNION{mouse=new MOUSEINPUT{dwFlags=4}}}});}
 static INPUT Keyboard(ushort key,bool up){return new INPUT{type=1,data=new UNION{key=new KEYBDINPUT{wVk=key,dwFlags=up?2u:0u}}};}
 public static void Key(ushort key,bool shift,bool alt){var keys=new List<INPUT>();if(shift)keys.Add(Keyboard(16,false));if(alt)keys.Add(Keyboard(18,false));keys.Add(Keyboard(key,false));keys.Add(Keyboard(key,true));if(alt)keys.Add(Keyboard(18,true));if(shift)keys.Add(Keyboard(16,true));Send(keys.ToArray());}
}
'@
[void][DuckNative]::SetProcessDPIAware()
$inputDesktop=[DuckNative]::OpenInputDesktop(0,$false,0x0100)
$inputAvailable=$inputDesktop -ne [IntPtr]::Zero
if($inputAvailable){[void][DuckNative]::CloseDesktop($inputDesktop)}
$sessionId=[System.Diagnostics.Process]::GetCurrentProcess().SessionId
$bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen
$workArea=[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$screen=@{x=$bounds.Left;y=$bounds.Top;width=$bounds.Width;height=$bounds.Height}
$work=@{x=$workArea.Left;y=$workArea.Top;width=$workArea.Width;height=$workArea.Height}
if(!$inputAvailable -or $sessionId -le 0){throw 'native input not_verified: no unlocked interactive input desktop'}
if($Action -eq 'desktop'){@{inputDesktopAvailable=$inputAvailable;sessionId=$sessionId;screen=$screen;workArea=$work}|ConvertTo-Json -Compress;exit}
$owned=[System.UInt32[]]@(($OwnedPids -split ',')|ForEach-Object{[System.UInt32]$_})
$windows=@([DuckNative]::Windows($owned))
$root=$null;$renderer=$null
if($BrowserPid -gt 0){
 if($owned -notcontains $BrowserPid){throw 'Browser PID is not in owned CDP process list'}
 $candidates=@($windows|Where-Object{$_.pid -eq $BrowserPid -and $_.className -eq 'Chrome_WidgetWin_1' -and (!$Window -or $_.handle -eq $Window)})
 $matches=@(foreach($candidate in $candidates){$children=@([DuckNative]::Renderers([IntPtr]::new([long]$candidate.handle),$owned));if($children.Count -eq 1){@{root=$candidate;renderer=$children[0]}}})
 if($matches.Count -ne 1){throw ('native browser mapping not_verified: expected one owned main HWND with one visible Chrome_RenderWidgetHostHWND; '+(@{browserPid=$BrowserPid;requestedWindow=$Window;ownedWindows=$windows;matchingRoots=$matches}|ConvertTo-Json -Depth 7 -Compress))}
 $root=$matches[0].root;$renderer=$matches[0].renderer
}else{
 $matches=@($windows|Where-Object{$_.handle -eq $Window})
 if($matches.Count -ne 1){throw 'Cannot observe the exact owned Electron HWND'}
 $root=$matches[0]
 $children=@([DuckNative]::Renderers([IntPtr]::new([long]$root.handle),$owned))
 if($children.Count -ne 1){throw ('native Electron mapping not_verified: expected one visible owned Chrome_RenderWidgetHostHWND; '+(@{root=$root;ownedPids=$owned;renderers=$children}|ConvertTo-Json -Depth 7 -Compress))}
 $renderer=$children[0]
}
$handle=[IntPtr]::new([long]$root.handle)
if($Action -eq 'activate'){[void][DuckNative]::ShowWindow($handle,9);[void][DuckNative]::SetForegroundWindow($handle);Start-Sleep -Milliseconds 150}
if($Action -eq 'click'){[DuckNative]::Click([int]$X,[int]$Y)}
if($Action -eq 'key'){
 $name=$Key -replace '^(Shift\+|Alt\+)','';$keys=@{Tab=9;Enter=13;Escape=27;Space=32;Home=36;End=35;ArrowUp=38;ArrowDown=40}
 if(!$keys.ContainsKey($name)){throw 'Unsupported native key'}
 [DuckNative]::Key([System.UInt16]$keys[$name],$Key.StartsWith('Shift+'),$Key.StartsWith('Alt+'))
}
if($Action -eq 'capture'){
 $bounds=[System.Windows.Forms.SystemInformation]::VirtualScreen
 $image=New-Object System.Drawing.Bitmap($bounds.Width,$bounds.Height)
 $graphics=[System.Drawing.Graphics]::FromImage($image)
 try{$graphics.CopyFromScreen($bounds.Left,$bounds.Top,0,0,$bounds.Size);$image.Save($Output,[System.Drawing.Imaging.ImageFormat]::Png)}finally{$graphics.Dispose();$image.Dispose()}
}
Start-Sleep -Milliseconds 120
$r=New-Object DuckNative+RECT;$point=New-Object DuckNative+POINT
$content=$handle
if($renderer){$content=[IntPtr]::new([long]$renderer.handle)}
if(![DuckNative]::GetClientRect($content,[ref]$r)){throw 'Cannot observe owned content client rect'}
if(![DuckNative]::ClientToScreen($content,[ref]$point)){throw 'Cannot map owned content to desktop'}
@{foreground=[DuckNative]::GetForegroundWindow().ToInt64().ToString();root=$root;contentHandle=$content.ToInt64().ToString();client=@{x=$point.X;y=$point.Y;width=$r.Right-$r.Left;height=$r.Bottom-$r.Top};windows=@([DuckNative]::Windows($owned));inputDesktopAvailable=$inputAvailable;sessionId=$sessionId;screen=$screen;workArea=$work}|ConvertTo-Json -Depth 7 -Compress
`;

export function windowsNativeInput(options:{script:string;output:string;page:()=>Page;target:()=>Promise<NativeTarget>;evidence:unknown[];check:Check}){
 const run=promisify(execFile),{check}=options;
 let browserWindow:{pid:number;handle:string}|undefined;
 async function execute(action:string,target:NativeTarget,extra:string[]=[]):Promise<NativeState>{
  const browserPid=target.chromiumBrowserPid||0,hwnd=target.window||(browserWindow?.pid===browserPid?browserWindow.handle:'');
  const answer=await run(windowsPowerShell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',options.script,'-Action',action,'-Window',hwnd,'-OwnedPids',target.ownedPids.join(','),'-BrowserPid',String(browserPid),...extra],{timeout:30_000,maxBuffer:1024*1024}).catch(error=>{options.evidence.push({action,extra,target,error:String(error)});throw error;});
  const state=JSON.parse(answer.stdout.trim()) as NativeState;
  options.evidence.push({action,extra,state});assert.equal(state.inputDesktopAvailable,true,'The runner must expose an unlocked input desktop');assert.ok(state.sessionId>0,'An interactive Windows session is required');
  if(action!=='desktop'){
   if(browserPid)browserWindow={pid:browserPid,handle:state.root.handle};
   const viewport=await options.page().evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio})),{client,screen,root}=state,scale=viewport.devicePixelRatio;
   options.evidence.push({action:'renderer-geometry',viewport,state});
   assert.ok(scale>0&&Math.abs(client.width-viewport.width*scale)<=1&&Math.abs(client.height-viewport.height*scale)<=1,'native renderer mapping not_verified: renderer client must match actual innerWidth/innerHeight at devicePixelRatio '+JSON.stringify({viewport,client}));
   assert.ok(root.left>=screen.x&&root.top>=screen.y&&root.right<=screen.x+screen.width&&root.bottom<=screen.y+screen.height&&client.x>=root.left&&client.y>=root.top&&client.x+client.width<=root.right&&client.y+client.height<=root.bottom,'native renderer mapping not_verified: owned main window and renderer must fit the observed desktop '+JSON.stringify({root,client,screen}));
  }
  return state;
 }
 async function native(action:string,extra:string[]=[]){return execute(action,await options.target(),extra);}
 async function desktop():Promise<NativeDesktop>{return execute('desktop',{window:'',ownedPids:[]});}
 async function click(target:Locator){
  await target.evaluate(element=>element.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}));
  const box=required(await target.boundingBox()),state=await native('inspect'),viewport=await options.page().evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio}));
  assert.ok(box.width>0&&box.height>0&&box.x+box.width/2>=0&&box.y+box.height/2>=0&&box.x+box.width/2<viewport.width&&box.y+box.height/2<viewport.height,'Native click target center must be inside the observed viewport '+JSON.stringify({box,viewport}));
  await native('click',['-X',String(Math.round(state.client.x+(box.x+box.width/2)*viewport.devicePixelRatio)),'-Y',String(Math.round(state.client.y+(box.y+box.height/2)*viewport.devicePixelRatio))]);
 }
 async function key(value:string){await native('key',['-Key',value]);}
 async function capture(name:string){await native('capture',['-Output',join(options.output,name+'.png')]);}
async function observe(select:Locator){return select.evaluate(element=>{
 if(!(element instanceof HTMLSelectElement))throw new Error('Expected actual select');
 let lessonPlaybackRate:number|null=null;
 if(element.closest('#playback-rate')){const prototype=Reflect.get(window,'anklePrototype') as {playback:{rate:number}}|undefined;if(!prototype||!Number.isFinite(prototype.playback.rate))throw new Error('Actual lesson playback diagnostic is unavailable');lessonPlaybackRate=prototype.playback.rate;}
 return{value:element.value,index:element.selectedIndex,options:Array.from(element.options,option=>({value:option.value,text:option.text})),focused:element.matches(':focus'),disabled:element.disabled,connected:element.isConnected,lessonPlaybackRate};
});}
async function popup(before:NativeState):Promise<NativeWindow>{
 const known=new Set(before.windows.map(item=>item.handle));let state:NativeState|undefined;
 for(let i=0;i<5;i++){state=await native('inspect');const found=state.windows.find(item=>!known.has(item.handle)&&item.handle!==before.root.handle&&item.right>item.left&&item.bottom>item.top);if(found)return found;await delay(100);}
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
 check(label+' mouse selection closes the actual native popup',!(await native('inspect')).windows.some(item=>item.handle===opened.handle));
 check(label+' actual mouse option selected',afterMouse.value===initial.options[targetIndex]!.value&&afterMouse.focused,{before:initial,after:afterMouse});
 if(afterMouse.lessonPlaybackRate!==null)check(label+' mouse change updates the actual lesson clock',afterMouse.lessonPlaybackRate===Number(afterMouse.value),{selected:afterMouse.value,actualRate:afterMouse.lessonPlaybackRate});
 const beforeKeyboard=await native('inspect');await click(select);const keyboardPopup=await popup(beforeKeyboard);await key('Home');
 const keyboardIndex=initial.options.length>1?(targetIndex+1)%initial.options.length:0;
 if(keyboardIndex===0){await key('ArrowDown');await key('Home');}else for(let index=0;index<keyboardIndex;index++)await key('ArrowDown');
 await key('Enter');const afterKeyboard=await observe(select),expected=initial.options[keyboardIndex]!.value;
 check(label+' Enter closes the actual native popup',!(await native('inspect')).windows.some(item=>item.handle===keyboardPopup.handle));
 check(label+' Down and Enter select through native input',afterKeyboard.value===expected&&afterKeyboard.focused&&(initial.options.length===1||afterKeyboard.value!==afterMouse.value),{afterKeyboard,mouseValue:afterMouse.value,changedSelectionCovered:initial.options.length>1});
 if(afterKeyboard.lessonPlaybackRate!==null)check(label+' keyboard change updates the actual lesson clock',afterKeyboard.lessonPlaybackRate===Number(afterKeyboard.value),{selected:afterKeyboard.value,actualRate:afterKeyboard.lessonPlaybackRate});
 const beforeCancel=await native('inspect');await click(select);const cancelling=await popup(beforeCancel);await key(keyboardIndex===initial.options.length-1?'ArrowUp':'ArrowDown');await key('Escape');const afterCancel=await observe(select);
 check(label+' Escape closes the actual native popup',!(await native('inspect')).windows.some(item=>item.handle===cancelling.handle));
 check(label+' Escape cancels the pending selection and returns focus',afterCancel.value===afterKeyboard.value&&afterCancel.focused,afterCancel);
 if(afterCancel.lessonPlaybackRate!==null)check(label+' Escape retains the actual lesson clock rate',afterCancel.lessonPlaybackRate===afterKeyboard.lessonPlaybackRate,{afterKeyboard:afterKeyboard.lessonPlaybackRate,afterEscape:afterCancel.lessonPlaybackRate});
 await key('Tab');check(label+' Tab moves focus away',!(await observe(select)).focused);await key('Shift+Tab');check(label+' reverse Tab restores select focus',(await observe(select)).focused);
 const beforeSpace=await native('inspect');await key('Space');await popup(beforeSpace);await capture(label+'-space-reopen');await key('Escape');
 check(label+' Space reopens and Escape retains focus',(await observe(select)).focused);
 return{initial,afterMouse,afterKeyboard,afterCancel,changedSelectionCovered:initial.options.length>1};
}
 return{prepare:()=>writeFile(options.script,nativeScript),desktop,native,click,key,capture,menuJourney};
}
