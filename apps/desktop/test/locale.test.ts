import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {build} from 'esbuild';
import type {DesktopUpdateState} from '../src/updates.js';
import {DESKTOP_LOCALES,desktopMessages,desktopText,resolveDesktopLocale} from '../src/copy.js';
import {nativeMenuTemplate,startupFailureCopy} from '../src/native-ui.js';
import {parseDesktopLocale} from '../src/ipc.js';

const root=resolve(fileURLToPath(new URL('../../../',import.meta.url)));

test('all desktop languages cover the same menu, error and update placeholders',()=>{
 assert.equal(DESKTOP_LOCALES.length,12);const source=desktopMessages['zh-Hans'],keys=Object.keys(source).sort(),tokens=(value:string)=>(value.match(/\{\w+\}/g)||[]).sort();
 for(const locale of DESKTOP_LOCALES){
  const copy=desktopMessages[locale];assert.deepEqual(Object.keys(copy).sort(),keys,locale);
  for(const key of keys){const message=copy[key as keyof typeof source];assert.ok(message.trim(),locale+' '+key);assert.deepEqual(tokens(message),tokens(source[key as keyof typeof source]),locale+' '+key);}
  assert.ok(desktopText(locale,'menu.hide',{brand:'我的方案'}).includes('我的方案'),'payload brand remains literal');
  for(const platform of ['darwin','win32'] as const){const visit=(items:Electron.MenuItemConstructorOptions[])=>{for(const item of items){if(item.type==='separator')continue;assert.ok(item.label?.trim(),locale+' '+item.role);if(Array.isArray(item.submenu))visit(item.submenu);}};visit(nativeMenuTemplate(locale,'Literal brand',platform));}
  const error=startupFailureCopy(locale,'Literal brand',new Error('Local service did not become ready'));assert.ok(error.title.includes('Literal brand'));assert.equal(error.message,desktopMessages[locale]['startup.timeout']);
 }
});

test('desktop locale matching and IPC use supported locales without storing another preference',()=>{
 assert.equal(resolveDesktopLocale('zh-TW'),'zh-Hant');assert.equal(resolveDesktopLocale('fr-FR'),'fr');assert.equal(resolveDesktopLocale('pt-PT'),'pt-BR');assert.equal(resolveDesktopLocale('en-US'),'en');
 assert.deepEqual(parseDesktopLocale({locale:'ja',brand:'私のブランド'}),{locale:'ja',brand:'私のブランド'});
 for(const value of [null,{locale:'xx',brand:'Other'},{locale:'fr',brand:''},{locale:'fr',brand:23}])assert.equal(parseDesktopLocale(value),undefined);
});

test('the actual update panel follows French instead of falling back to Chinese',async()=>{
 const output=await build({entryPoints:[join(root,'apps/desktop/src/update-panel.ts')],bundle:true,write:false,format:'iife',platform:'browser',logLevel:'silent'});
 const button={hidden:true,disabled:false,title:'',dataset:{}},label={textContent:''},progress={style:{width:''}};
 let listener:((state:DesktopUpdateState)=>void)|undefined,changed:(()=>void)|undefined;
 const shadow={innerHTML:'',querySelector:(selector:string)=>selector==='button'?button:selector==='.label'?label:progress};
 const document={documentElement:{lang:'fr'},querySelector:()=>({after(){}}),createElement:()=>({id:'',textContent:'',attachShadow:()=>shadow}),head:{append(){}}};
 runInNewContext(output.outputFiles[0]!.text,{document,window:{letsduckDesktop:{state:async()=>({phase:'idle',currentVersion:'1.2.3'}),action:async()=>{},onState:(callback:typeof listener)=>{listener=callback;return()=>{};}}},MutationObserver:class{constructor(callback:()=>void){changed=callback;}observe(){}},console});
 await Promise.resolve();listener?.({phase:'available',currentVersion:'1.2.3'});
 assert.equal(String(label.textContent),'Mise à jour disponible');
 document.documentElement.lang='es';changed?.();assert.equal(String(label.textContent),'Actualización disponible');
 listener?.({phase:'downloading',currentVersion:'1.2.3',percent:42.9});assert.ok(label.textContent.includes('42%'));
 for(const locale of DESKTOP_LOCALES){
  document.documentElement.lang=locale;changed?.();
  const expected={idle:'v1.2.3',checking:'v1.2.3',available:desktopText(locale,'update.available'),downloading:desktopText(locale,'update.downloading',{percent:42}),error:desktopText(locale,'update.error'),ready:desktopText(locale,'update.ready'),waiting:desktopText(locale,'update.waiting'),installing:desktopText(locale,'update.installing')};
  for(const phase of Object.keys(expected) as DesktopUpdateState['phase'][]){listener?.({phase,currentVersion:'1.2.3',percent:42.9});assert.equal(String(label.textContent),expected[phase],locale+' '+phase);assert.equal(button.title,['idle','checking'].includes(phase)?desktopText(locale,'update.current',{version:'v1.2.3'}):expected[phase]);assert.equal(button.disabled,!['available','error','ready'].includes(phase));assert.equal(progress.style.width,phase==='downloading'?'42%':'0%');}
 }
});

// Exercise the real main module against owned in-memory Electron surfaces; no GUI or host starts.
test('native menus and subsequent service errors follow the trusted homepage locale',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'duck-native-locale-')),timers=new Set<ReturnType<typeof setTimeout>>();
 const menus:Electron.MenuItemConstructorOptions[][]=[],dialogs:{title:string;message:string}[]=[],handles=new Map<string,Function>();
 const app=Object.assign(new EventEmitter(),{isPackaged:false,name:'',getPath:()=>temporary,getAppPath:()=>root,getVersion:()=>'1.2.3',getLocale:()=>'en-US',setName(value:string){this.name=value;},setPath(){},setAppLogsPath(){},requestSingleInstanceLock:()=>true,whenReady:async()=>{},quit(){},exit(){},setAboutPanelOptions(){}});
 const child=Object.assign(new EventEmitter(),{stdout:new EventEmitter(),stderr:new EventEmitter(),postMessage(message:{kind:string}){if(message.kind==='stop')queueMicrotask(()=>child.emit('exit',0));}});
 const mainFrame={url:'duck://app/'},contents=Object.assign(new EventEmitter(),{mainFrame,getURL:()=>'duck://app/',setWindowOpenHandler(){},executeJavaScript:async()=>{},send(){}});
 let title='';
 class Window extends EventEmitter{webContents=contents;constructor(options:{title:string}){super();title=options.title;}loadURL(){return Promise.resolve();}setTitle(value:string){title=value;}isDestroyed(){return false;}}
 const ipcMain=Object.assign(new EventEmitter(),{handle(name:string,callback:Function){handles.set(name,callback);}});
 const electron={app,BrowserWindow:Window,Menu:{buildFromTemplate:(template:Electron.MenuItemConstructorOptions[])=>template,setApplicationMenu:(template:Electron.MenuItemConstructorOptions[])=>menus.push(template)},protocol:{registerSchemesAsPrivileged(){},handle(){}},shell:{openExternal(){}},utilityProcess:{fork(){setImmediate(()=>child.emit('message',{kind:'ready',url:'http://127.0.0.1:8123/'}));return child;}},session:{defaultSession:{flushStorageData(){},setPermissionRequestHandler(){},setPermissionCheckHandler(){},on(){}}},dialog:{showErrorBox:(dialogTitle:string,message:string)=>dialogs.push({title:dialogTitle,message})},ipcMain};
 try{
  const output=await build({entryPoints:[join(root,'apps/desktop/src/main.ts')],bundle:true,write:false,format:'iife',platform:'node',define:{'import.meta.dirname':JSON.stringify(join(root,'apps/desktop/src'))},plugins:[{name:'owned-electron-surfaces',setup(builder){builder.onResolve({filter:/^(electron|electron-updater)$/},args=>({path:args.path,namespace:'owned'}));builder.onLoad({filter:/.*/,namespace:'owned'},args=>({contents:args.path==='electron'?'const f=globalThis.fixture;export const {app,BrowserWindow,Menu,protocol,shell,utilityProcess,session,dialog,ipcMain}=f;':'export default {autoUpdater:globalThis.updater};',loader:'js'}));}}],logLevel:'silent'});
  runInNewContext(output.outputFiles[0]!.text,{fixture:electron,updater:new EventEmitter(),process:{env:{},platform:'darwin',resourcesPath:temporary},console,require:createRequire(import.meta.url),URL,Buffer,queueMicrotask,setImmediate,setInterval,clearInterval,setTimeout:(callback:()=>void,ms:number)=>{const timer=setTimeout(callback,ms);timers.add(timer);return timer;},clearTimeout:(timer:ReturnType<typeof setTimeout>)=>{timers.delete(timer);clearTimeout(timer);}});
  for(let i=0;i<4;i++)await new Promise<void>(ok=>setImmediate(ok));
  ipcMain.emit('desktop:locale',{sender:contents,senderFrame:mainFrame},{locale:'fr',brand:'Canard'});
  assert.equal(title,'Canard','window title follows the selected homepage brand');
  assert.ok(menus.at(-1)?.some(item=>item.label==='Fichier'),'native File menu follows homepage French');
  ipcMain.emit('desktop:locale',{sender:contents,senderFrame:{url:'https://example.com'}},{locale:'ja',brand:'Untrusted'});
  assert.equal(title,'Canard','untrusted frames cannot change the native language');
  child.emit('exit',7);assert.equal(dialogs.at(-1)?.title,'Le service local de Canard s’est arrêté');assert.ok(dialogs.at(-1)?.message.includes('7'));
 }finally{app.emit('before-quit',{preventDefault(){}});for(const timer of timers)clearTimeout(timer);await rm(temporary,{recursive:true,force:true});}
});
