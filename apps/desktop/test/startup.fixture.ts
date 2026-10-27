/** Observes the real shell; only replaces the blocking error dialog with a receipt. */
import {app,dialog,utilityProcess} from 'electron';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {parseHostReply} from '../src/ipc.js';
const entry=process.env.DUCK_SHELL_STARTUP_ENTRY,receipt=process.env.DUCK_SHELL_STARTUP_RECEIPT,mode=process.env.DUCK_SHELL_STARTUP_MODE;
if(!entry||!receipt)throw new Error('Owned startup test configuration missing');
const observed:{mode:string|undefined;requestedQuit:boolean;ready:boolean;utilityPid?:number;utilityExit?:number;appExit?:number;dialogs:{title:string;message:string}[]}={mode,requestedQuit:false,ready:false,dialogs:[]};
const save=()=>writeFileSync(receipt,JSON.stringify(observed));
dialog.showErrorBox=(title,message)=>{observed.dialogs.push({title,message});save();};
const fork=utilityProcess.fork;
utilityProcess.fork=(modulePath,args,options)=>{
 const child=fork(modulePath,args,options);
 child.on('message',(value:unknown)=>{if(parseHostReply(value)?.kind==='ready'){observed.ready=true;save();}});
 child.once('exit',code=>{observed.utilityExit=code;save();});
 child.once('spawn',()=>{
  if(child.pid!==undefined)observed.utilityPid=child.pid;
  if(mode==='quit'){observed.requestedQuit=true;save();app.quit();}
  else if(mode==='unexpected-exit')child.kill();
  else if(mode==='unexpected-stop')child.postMessage({kind:'stop'});
 });
 return child;
};
app.on('quit',(_event,code)=>{observed.appExit=code;save();});
save();
await import(pathToFileURL(entry).href);
