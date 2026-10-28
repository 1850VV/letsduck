import {app,BrowserWindow,Menu,protocol,shell,utilityProcess,session,dialog,ipcMain} from 'electron';
import type {IpcMainInvokeEvent} from 'electron';
import electronUpdater from 'electron-updater';
import {appendFileSync,existsSync,mkdirSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {desktopPaths} from './paths.js';
import {APP_ORIGIN,externalURL,localPermission,localURL} from './navigation.js';
import {parseDesktopLocale,parseHostReply,trustedFrame} from './ipc.js';
import {resolveDesktopLocale} from './copy.js';
import type {DesktopLocale} from './copy.js';
import {nativeMenuTemplate,startupFailureCopy,stoppedServiceCopy} from './native-ui.js';
import {activityCounter,createProtocolHandler,reserveDownloadPath} from './protocol.js';
import {UpdateController} from './updates.js';

protocol.registerSchemesAsPrivileged([{scheme:'duck',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true,codeCache:true}}]);
app.setName('来做鸭');
let locale:DesktopLocale='zh-Hans',brand='来做鸭';
const paths=desktopPaths({packaged:app.isPackaged,moduleDirectory:import.meta.dirname,appPath:app.getAppPath(),resourcesPath:process.resourcesPath,appData:app.getPath('appData'),env:process.env});
mkdirSync(paths.userData,{recursive:true});
app.setPath('userData',paths.userData);app.setAppLogsPath(join(paths.userData,'logs'));
if(!app.requestSingleInstanceLock())app.quit();
else void boot().catch(error=>{console.error(error);const copy=startupFailureCopy(locale,brand,error);dialog.showErrorBox(copy.title,copy.message);app.exit(1);});

async function boot(){
 await app.whenReady();
 locale=resolveDesktopLocale(app.getLocale());brand=locale==='zh-Hans'?'来做鸭':locale==='zh-Hant'?'來做鴨':"Let's Duck";
 mkdirSync(app.getPath('logs'),{recursive:true});
 const child=utilityProcess.fork(paths.host,[],{stdio:'pipe',serviceName:'LetsDuck shared host',env:{...process.env,DUCK_ASSETS:paths.assets,DUCK_FRONTEND:paths.frontend,DUCK_ASSEMBLY_MANIFEST:paths.assemblyManifest}});
 const log=(data:Buffer)=>appendFileSync(join(app.getPath('logs'),'backend.log'),data);
 child.stdout?.on('data',log);child.stderr?.on('data',log);
 let window:BrowserWindow|null=null,quitting=false,exited=false,writes=0,sequence=0,childStatus=0,updates:UpdateController|undefined;
 const refreshNative=()=>{app.setName(brand);app.setAboutPanelOptions({applicationName:brand});Menu.setApplicationMenu(Menu.buildFromTemplate(nativeMenuTemplate(locale,brand,process.platform)));window?.setTitle(brand);};
 refreshNative();
 const activity=activityCounter();
 const pending=new Map<number,{resolve:(value:boolean)=>void;timer:NodeJS.Timeout}>();
 const finished=new Promise<void>(resolve=>child.once('exit',code=>{childStatus=code;exited=true;for(const request of pending.values()){clearTimeout(request.timer);request.resolve(true);}pending.clear();resolve();}));
 app.on('before-quit',event=>{
  if(quitting)return;event.preventDefault();quitting=true;updates?.dispose();session.defaultSession.flushStorageData();
  void activity.wait().then(()=>{if(!exited)child.postMessage({kind:'stop'});return finished;}).then(()=>{if(childStatus===0)app.quit();else app.exit(1);});
 });
 const backend=await new Promise<string|undefined>((resolve,reject)=>{
  const timeout=setTimeout(()=>{if(quitting)return;reject(new Error('Local service did not become ready'));if(!exited)child.postMessage({kind:'stop'});},30_000);
  const message=(value:unknown)=>{const reply=parseHostReply(value);if(reply?.kind==='ready'){clearTimeout(timeout);child.removeListener('message',message);resolve(reply.url);}if(reply?.kind==='failed'){clearTimeout(timeout);child.removeListener('message',message);reject(new Error(reply.message));}};
  child.on('message',message);child.once('exit',code=>{clearTimeout(timeout);if(quitting&&code===0)resolve(undefined);else reject(new Error('Local service exited: '+code));});
 }).catch(async(error:unknown)=>{if(!exited)child.postMessage({kind:'stop'});await finished;throw error;});
 if(backend===undefined||quitting)return;
 child.on('message',(value:unknown)=>{const reply=parseHostReply(value);if(reply?.kind!=='busy')return;const request=pending.get(reply.id);if(request){clearTimeout(request.timer);pending.delete(reply.id);request.resolve(reply.busy);}});
 const hostBusy=()=>exited?Promise.resolve(true):new Promise<boolean>(resolve=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);resolve(true);},5_000);pending.set(id,{resolve,timer});child.postMessage({kind:'busy',id});});
 protocol.handle('duck',createProtocolHandler({backend,panel:()=>readFile(paths.panel,'utf8'),copy:()=>readFile(paths.copy,'utf8'),accepting:()=>!quitting,write:delta=>{writes+=delta;activity.change(delta);}}));
 session.defaultSession.setPermissionRequestHandler((contents,permission,callback,details)=>callback(contents===window?.webContents&&localPermission(details.requestingUrl||contents.getURL(),permission)));
 session.defaultSession.setPermissionCheckHandler((contents,permission,origin)=>contents===window?.webContents&&localPermission(origin,permission));
 const downloads=new Set<Electron.DownloadItem>(),reserved=new Set<string>();
 session.defaultSession.on('will-download',(_event,item)=>{
  if(quitting){item.cancel();return;}
  activity.change(1);
  downloads.add(item);const path=reserveDownloadPath(app.getPath('downloads'),item.getFilename(),reserved);item.setSavePath(path);
  item.once('done',()=>{downloads.delete(item);reserved.delete(path);activity.change(-1);});
 });
 const {autoUpdater}=electronUpdater;autoUpdater.allowPrerelease=app.getVersion().includes('-beta.');
 updates=new UpdateController(autoUpdater,{canRestart:async()=>{
  if(writes||downloads.size||await hostBusy())return false;
  if(!window||window.isDestroyed())return true;
  try{return await window.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(!document.querySelector("#dl-3mf:disabled")))))')===true;}catch{return false;}
 },prepare:()=>session.defaultSession.flushStorageData()});
 updates.on('state',state=>{if(window&&!window.isDestroyed())window.webContents.send('desktop:update-state',{...state,currentVersion:app.getVersion()});});
 const trusted=(event:IpcMainInvokeEvent)=>{if(!window||!trustedFrame(event,{sender:window.webContents,mainFrame:window.webContents.mainFrame}))throw new Error('Unknown application frame');};
 ipcMain.handle('desktop:update-state',event=>{trusted(event);return{...updates!.state,currentVersion:app.getVersion()};});
 ipcMain.handle('desktop:update-action',(event,action:unknown)=>{trusted(event);if(action==='check')return updates!.check();if(action==='download')return updates!.download();if(action==='install')return updates!.install();throw new Error('Unknown update action');});
 ipcMain.on('desktop:locale',(event,payload:unknown)=>{if(!window||!trustedFrame(event,{sender:window.webContents,mainFrame:window.webContents.mainFrame}))return;const value=parseDesktopLocale(payload);if(!value||locale===value.locale&&brand===value.brand)return;locale=value.locale;brand=value.brand;refreshNative();});
 const openWindow=()=>{
  window=new BrowserWindow({width:1280,height:860,minWidth:800,minHeight:600,backgroundColor:'#f5f6fb',title:brand,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:paths.preload}});
  const contents=window.webContents;
  contents.on('page-title-updated',event=>{event.preventDefault();window?.setTitle(brand);});
  contents.setWindowOpenHandler(({url})=>{if(localURL(url))void contents.loadURL(url);else if(externalURL(url))void shell.openExternal(url);return{action:'deny'};});
  contents.on('will-navigate',(event,url)=>{if(!localURL(url)){event.preventDefault();if(externalURL(url))void shell.openExternal(url);}});
  contents.on('did-finish-load',()=>{if(localURL(contents.getURL()))void contents.executeJavaScript("import('duck://app/__desktop/update-panel.js').then(()=>undefined)").catch(error=>{if(!contents.isDestroyed()&&!String(error).includes('WebFrame was removed'))console.error(error);});});
  window.on('closed',()=>{window=null;});void window.loadURL(APP_ORIGIN+'/');
 };
 app.on('second-instance',()=>{if(!window)openWindow();if(window!.isMinimized())window!.restore();window!.focus();});
 app.on('activate',()=>{if(!window)openWindow();});
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
 child.on('exit',code=>{if(!quitting){const copy=stoppedServiceCopy(locale,brand,code);dialog.showErrorBox(copy.title,copy.message);app.quit();}});
 if(!quitting)openWindow();
 if(app.isPackaged&&existsSync(join(process.resourcesPath,'app-update.yml')))updates.start();
}
