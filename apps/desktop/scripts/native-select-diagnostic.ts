/** Synthetic standard-select diagnostic, never product acceptance or a user-profile run. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm,stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {_electron as electron,chromium} from 'playwright';
import type {BrowserContext,ElectronApplication,Page} from 'playwright';
import {windowsNativeInput} from './windows-native-input.js';
import type {NativeState,NativeWindow} from './windows-native-input.js';

assert.equal(process.platform,'win32','Only run on the real disposable Windows runner; do not spoof platform/CI guards');
assert.equal(process.arch,'x64');
assert.equal(process.env.GITHUB_ACTIONS,'true');
assert.equal(process.env.RUNNER_OS,'Windows');
assert.equal(process.env.RUNNER_ENVIRONMENT,'github-hosted','A disposable GitHub-hosted desktop is required');
assert.match(process.env.GITHUB_RUN_ID||'',/^\d+$/);

const fixture=String.raw`<!doctype html><meta charset="utf-8"><title>Synthetic plain select diagnostic</title>
<style>body{font:20px sans-serif;margin:48px}select{font:inherit;width:240px}button{font:inherit}p{max-width:560px}</style>
<p>Synthetic standard HTML select. No product code or selection-changing listeners.</p>
<button id="before" type="button">Before</button>
<select id="rate" aria-label="Synthetic rate">
<option value="0.5">0.5×</option><option value="1">1×</option><option value="1.5">1.5×</option>
<option value="2" selected>2×</option><option value="3">3×</option><option value="4">4×</option>
</select><button id="after" type="button">After</button>`;
const values=['0.5','1','1.5','2','3','4'];
const output=resolve(process.env.DUCK_TEST_OUTPUT||join(process.cwd(),'output/windows-native-select-diagnostic'));
await mkdir(output,{recursive:true});
const temporary=await mkdtemp(join(tmpdir(),'letsduck-plain-select-'));
type SelectEvent={type:string;trusted:boolean;at:number;value:string;selectedIndex:number;key:string|null;focused:boolean;targetId:string|null};
type Store={select:HTMLSelectElement;events:SelectEvent[]};
type DomState={value:string;selectedIndex:number;focused:boolean;connected:boolean;sameNode:boolean;plainDocumentRoot:boolean;disabled:boolean;options:Array<{value:string;defaultSelected:boolean}>;events:SelectEvent[]};
type Snapshot={stage:string;atUtc:string;dom:DomState;native:NativeState};
type Case={engine:'electron'|'chromium';status:'pending'|'observed'|'failed';identity?:unknown;error?:string;observations:Snapshot[];nativeEvidence:unknown[];pageErrors:string[];clickGeometry?:unknown;outcome?:unknown;cleanup?:unknown};
const cases:Case[]=[],cleanupErrors:string[]=[];
const failure=(error:unknown)=>error instanceof Error?error.stack||error.message:String(error);
function required<T>(value:T|null|undefined):T{if(value==null)throw new Error('Missing fixture value');return value;}
function alive(pid:number){try{process.kill(pid,0);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ESRCH')return false;if((error as NodeJS.ErrnoException).code==='EPERM')return true;throw error;}}
async function remainingAfterClose(pids:Set<number>){let remaining=[...pids].filter(alive);for(let n=0;remaining.length&&n<50;n++){await delay(200);remaining=[...pids].filter(alive);}return remaining;}
async function instrument(page:Page){
 await page.evaluate('globalThis.__name = value => value');
 await page.evaluate(()=>{
  const select=document.querySelector('#rate');if(!(select instanceof HTMLSelectElement))throw new Error('Missing synthetic select');
  const store:Store={select,events:[]};Reflect.set(window,'plainSelectDiagnostic',store);
  for(const type of ['input','change','focus','blur','keydown','keyup','click'])document.addEventListener(type,event=>{
   store.events.push({type:event.type,trusted:event.isTrusted,at:performance.now(),value:select.value,selectedIndex:select.selectedIndex,key:event instanceof KeyboardEvent?event.key:null,focused:select.matches(':focus'),targetId:event.target instanceof Element?event.target.id:null});
  },{capture:true,passive:true});
 });
}
async function observe(page:Page):Promise<DomState>{return page.evaluate(()=>{
 const store=Reflect.get(window,'plainSelectDiagnostic') as Store|undefined;if(!store)throw new Error('Missing passive fixture observer');const select=store.select;
 return {value:select.value,selectedIndex:select.selectedIndex,focused:select.matches(':focus'),connected:select.isConnected,sameNode:select===document.querySelector('#rate'),plainDocumentRoot:select.getRootNode()===document,disabled:select.disabled,options:Array.from(select.options,option=>({value:option.value,defaultSelected:option.defaultSelected})),events:store.events};
});}

try{
 for(const engine of ['electron','chromium'] as const){
  const result:Case={engine,status:'pending',observations:[],nativeEvidence:[],pageErrors:[]};cases.push(result);
  const directory=join(temporary,engine);await mkdir(directory);
  let app:ElectronApplication|undefined,context:BrowserContext|undefined,page:Page|undefined,hwnd='',expectedRoot='';const pids=new Set<number>();
  async function target(){
   if(app){const ownedPids=await app.evaluate(({app})=>app.getAppMetrics().map(item=>item.pid));for(const pid of ownedPids)pids.add(pid);return {window:hwnd,ownedPids};}
   const session=await required(required(context).browser()).newBrowserCDPSession();
   try{const info=(await session.send('SystemInfo.getProcessInfo')).processInfo,main=info.filter(item=>item.type==='browser');assert.equal(main.length,1);for(const process of info)pids.add(process.id);return {window:hwnd,ownedPids:info.map(item=>item.id),chromiumBrowserPid:main[0]!.id};}finally{await session.detach();}
  }
  const input=windowsNativeInput({script:join(directory,'native-input.ps1'),output,page:()=>required(page),target,evidence:result.nativeEvidence,check:(name,passed)=>assert.ok(passed,name)});
  async function snapshot(stage:string):Promise<Snapshot>{
   const state=await input.native('inspect');assert.equal(state.root.handle,expectedRoot,'The exact owned root must remain unchanged');assert.equal(state.foreground,expectedRoot,'No background key or mouse input is permitted');
   const dom=await observe(required(page));assert.ok(dom.sameNode&&dom.connected&&dom.plainDocumentRoot&&!dom.disabled,'The same enabled plain-document select must remain connected');assert.deepEqual(dom.options.map(option=>option.value),values);assert.deepEqual(dom.options.filter(option=>option.defaultSelected).map(option=>option.value),['2']);
   const answer={stage,atUtc:new Date().toISOString(),dom,native:state};result.observations.push(answer);return answer;
  }
  try{
   await input.prepare();const desktop=await input.desktop(),area=desktop.workArea;assert.ok(area.width>=660&&area.height>=420,'A contained interactive desktop is required');
   const size={width:Math.min(800,area.width-20),height:Math.min(500,area.height-20)};
   const fixtureUrl='data:text/html;charset=utf-8,'+encodeURIComponent(fixture);
   if(engine==='electron'){
    const main=join(directory,'fixture.cjs');
    await writeFile(main,`const {app,BrowserWindow,screen}=require('electron');const path=require('node:path');app.setPath('userData',path.join(__dirname,'profile'));app.setPath('sessionData',path.join(__dirname,'session'));app.whenReady().then(async()=>{const a=screen.getPrimaryDisplay().workArea;const w=new BrowserWindow({x:a.x+10,y:a.y+10,width:Math.min(800,a.width-20),height:Math.min(500,a.height-20),show:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});await w.loadURL(${JSON.stringify(fixtureUrl)});});app.on('window-all-closed',()=>app.quit());`);
    const executable:unknown=createRequire(import.meta.url)('electron');assert.equal(typeof executable,'string');
    const env:Record<string,string>={};for(const key of ['PATH','Path','SystemRoot','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','USERPROFILE','APPDATA','LOCALAPPDATA','TMP','TEMP'])if(process.env[key]!==undefined)env[key]=process.env[key]!;
    app=await electron.launch({executablePath:executable as string,args:[main],env,timeout:60_000});const child=app.process();if(child.pid)pids.add(child.pid);
    await app.evaluate('globalThis.__name = value => value');context=app.context();page=await app.firstWindow();
    result.identity=await app.evaluate(({app})=>({versions:process.versions,arch:process.arch,execPath:process.execPath,fixtureAppPath:app.getAppPath()}));
    const version=await app.evaluate(()=>process.versions.electron);assert.equal(version,'45.0.0','Use the approved Electron45 fixture runtime');
    const window=await app.browserWindow(page);try{hwnd=await window.evaluate(window=>window.getNativeWindowHandle().readBigUInt64LE().toString());}finally{await window.dispose();}
   }else{
    context=await chromium.launchPersistentContext(join(directory,'profile'),{headless:false,viewport:null,args:[`--window-size=${size.width},${size.height}`,`--window-position=${area.x+10},${area.y+10}`]});
    await context.addInitScript('globalThis.__name = value => value');page=context.pages()[0]||await context.newPage();await page.goto(fixtureUrl);
    result.identity={version:required(context.browser()).version(),executable:chromium.executablePath(),managedBrowser:true,viewport:null};
   }
   page.setDefaultTimeout(30_000);page.on('pageerror',error=>result.pageErrors.push(failure(error)));await page.locator('#rate').waitFor({state:'visible'});await instrument(page);
   const active=await input.native('activate');expectedRoot=active.root.handle;hwnd=expectedRoot;
   const initial=await snapshot('initial');assert.equal(initial.dom.value,'2');assert.equal(initial.dom.selectedIndex,3);
   const box=required(await page.locator('#rate').boundingBox()),viewport=await page.evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio}));
   assert.ok(box.width>0&&box.height>0&&box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width&&box.y+box.height<=viewport.height,'Fixture must be fully visible without scrolling');
   // Read geometry, then SendInput. Do not invoke helper.click: its current implementation scrolls DOM.
   const point={x:Math.round(initial.native.client.x+(box.x+box.width/2)*viewport.devicePixelRatio),y:Math.round(initial.native.client.y+(box.y+box.height/2)*viewport.devicePixelRatio)};
   result.clickGeometry={selector:'#rate',box,viewport,point,rootHwnd:expectedRoot,rendererHwnd:initial.native.contentHandle};
   await input.native('click',['-X',String(point.x),'-Y',String(point.y)]);
   const known=new Set(initial.native.windows.map(window=>window.handle));
   const newPopups=(state:Snapshot)=>state.native.windows.filter(window=>!known.has(window.handle)&&window.handle!==expectedRoot&&window.right>window.left&&window.bottom>window.top);
   let opened=await snapshot('opened');for(let attempt=0;!newPopups(opened).length&&attempt<4;attempt++){await delay(100);opened=await snapshot('opening-poll-'+attempt);}
   assert.equal(newPopups(opened).length,1,'One separate new owned native popup is required');const popup:NativeWindow=newPopups(opened)[0]!;
   await input.key('ArrowDown');const afterDown=await snapshot('after-ArrowDown');
   await input.key('Escape');const afterEscape=await snapshot('after-Escape');
   const isOpen=(state:Snapshot)=>state.native.windows.some(window=>window.handle===popup.handle);
   const selectionEvents=afterEscape.dom.events.filter(event=>event.type==='input'||event.type==='change');
   assert.ok(selectionEvents.every(event=>event.trusted&&event.targetId==='rate'),'Every observed selection event must be trusted and target this exact control');
   if([opened,afterDown,afterEscape].some(state=>state.dom.value!==initial.dom.value))assert.ok(selectionEvents.length>0,'An observed value change must have trusted native input/change evidence');
   result.outcome={initialValue:initial.dom.value,openedValue:opened.dom.value,afterDownValue:afterDown.dom.value,afterEscapeValue:afterEscape.dom.value,initialIndex:initial.dom.selectedIndex,afterDownIndex:afterDown.dom.selectedIndex,afterEscapeIndex:afterEscape.dom.selectedIndex,popup,openAfterClick:isOpen(opened),openAfterDown:isOpen(afterDown),openAfterEscape:isOpen(afterEscape),escapeTestedWhilePopupOpen:isOpen(afterDown),afterDownEqualsInitial:afterDown.dom.value===initial.dom.value,afterEscapeEqualsInitial:afterEscape.dom.value===initial.dom.value,afterEscapeEqualsAfterDown:afterEscape.dom.value===afterDown.dom.value,selectionEvents,interpretation:'Observed platform behavior; no requirement that Escape restores the initial value'};
   assert.deepEqual(result.pageErrors,[]);result.status='observed';
  }catch(error){result.status='failed';result.error=failure(error);}
  finally{
   const errors:string[]=[];let normalCloseSucceeded:boolean|null=null;const normalCloseAttempted=!!(app||context);if(app||context)try{await target();}catch(error){errors.push('Final owned PID observation: '+failure(error));}
   try{if(app)await app.close();else if(context)await context.close();if(normalCloseAttempted)normalCloseSucceeded=true;}catch(error){normalCloseSucceeded=false;errors.push('Normal runtime close: '+failure(error));}
   const remaining=await remainingAfterClose(pids).catch(error=>{errors.push('Owned PID verification: '+failure(error));return [...pids];});
   if(remaining.length)errors.push('Owned runtime PIDs still alive: '+remaining.join(','));
   result.cleanup={normalCloseAttempted,normalCloseSucceeded,forcedTermination:false,observedPids:[...pids].sort((a,b)=>a-b),remainingPids:remaining,errors};
   if(errors.length){result.status='failed';cleanupErrors.push(...errors.map(error=>engine+': '+error));}
  }
 }
}finally{
 let temporaryRemoved=false;try{await rm(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:200});temporaryRemoved=!(await stat(temporary).then(()=>true,error=>{if((error as NodeJS.ErrnoException).code==='ENOENT')return false;throw error;}));}catch(error){cleanupErrors.push('Temporary fixture cleanup: '+failure(error));}
 if(!temporaryRemoved)cleanupErrors.push('Temporary fixture directory remains: '+temporary);
 const receipt={status:cases.length===2&&cases.every(result=>result.status==='observed')&&!cleanupErrors.length?'completed':'failed',scope:'synthetic standard HTML select; no product, model, database, clipboard or device',sourceCommit:process.env.GITHUB_SHA||null,runner:{runId:process.env.GITHUB_RUN_ID,node:process.version,platform:process.platform,arch:process.arch},fixture:{sha256:createHash('sha256').update(fixture).digest('hex'),values,markupSelected:'2',selectionMutation:'none: static markup then real Win32 SendInput only',defaultGpu:true},cases,cleanup:{temporary,temporaryRemoved,errors:cleanupErrors},acceptance:'diagnostic observations only; does not change product acceptance or Escape requirements'};
 await writeFile(join(output,'result.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({...receipt,cases:cases.map(({engine,status,outcome,cleanup})=>({engine,status,outcome,cleanup}))}));if(receipt.status!=='completed')process.exitCode=1;
}
