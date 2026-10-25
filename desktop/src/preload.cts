import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('letsduckDesktop', {
  state: () => ipcRenderer.invoke('desktop:update-state'),
  action: (action: 'check' | 'download' | 'install') => ipcRenderer.invoke('desktop:update-action', action),
  onState: (callback: (state: unknown) => void) => { const listener = (_event: unknown, state: unknown) => callback(state); ipcRenderer.on('desktop:update-state', listener); return () => ipcRenderer.removeListener('desktop:update-state', listener); },
});
