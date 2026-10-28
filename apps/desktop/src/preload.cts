import electron=require('electron');
import ipc=require('./ipc.js');
import type {DesktopBridge,UpdateAction} from './ipc.js';
const {contextBridge,ipcRenderer}=electron;
const bridge:DesktopBridge={
 setLocale(payload){const value=ipc.parseDesktopLocale(payload);if(value)ipcRenderer.send('desktop:locale',value);},
 async state(){const value:unknown=await ipcRenderer.invoke('desktop:update-state');const state=ipc.parseDesktopState(value);if(!state)throw new Error('Invalid desktop update state');return state;},
 async action(action:UpdateAction){if(!['check','download','install'].includes(action))throw new Error('Unknown update action');await ipcRenderer.invoke('desktop:update-action',action);},
 onState(callback){const listener=(_event:Electron.IpcRendererEvent,value:unknown)=>{const state=ipc.parseDesktopState(value);if(state)callback(state);};ipcRenderer.on('desktop:update-state',listener);return()=>{ipcRenderer.removeListener('desktop:update-state',listener);};},
};
contextBridge.exposeInMainWorld('letsduckDesktop',bridge);
