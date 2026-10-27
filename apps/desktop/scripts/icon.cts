import electron = require('electron');
import fs = require('node:fs');
import path = require('node:path');
// Build-time renderer only; production acceleration and layout are unchanged.
electron.app.disableHardwareAcceleration();
void electron.app.whenReady().then(async()=>{
 const window=new electron.BrowserWindow({show:false,webPreferences:{sandbox:true,nodeIntegration:false}});
 try{
  const directory=path.resolve(__dirname,'..'),svg=fs.readFileSync(path.resolve(directory,'../../frontend/shared/brand/logo.svg'),'utf8');
  await window.loadURL('data:text/html;charset=utf-8,<html></html>');
  const png:unknown=await window.webContents.executeJavaScript(`(async()=>{const image=new Image();image.src=${JSON.stringify('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg))};await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const context=canvas.getContext('2d');if(!context)throw Error('No icon canvas');context.drawImage(image,0,0,1024,1024);if(!context.getImageData(0,0,1024,1024).data.some((value,index)=>index%4===3&&value!==0))throw Error('The brand icon rendered as an empty image');return canvas.toDataURL('image/png');})()`);
  if(typeof png!=='string'||!png.startsWith('data:image/png;base64,'))throw new Error('Invalid icon renderer response');
  fs.mkdirSync(path.join(directory,'build'),{recursive:true});fs.writeFileSync(path.join(directory,'build/icon.png'),Buffer.from(png.slice('data:image/png;base64,'.length),'base64'));
 }finally{window.destroy();electron.app.quit();}
}).catch(error=>{console.error(error);electron.app.exit(1);});
