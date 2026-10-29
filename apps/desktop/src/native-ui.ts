import type {MenuItemConstructorOptions} from 'electron';
import {desktopText} from './copy.js';
import type {DesktopLocale,DesktopMessageKey} from './copy.js';

export function nativeMenuTemplate(locale:DesktopLocale,brand:string,platform:NodeJS.Platform):MenuItemConstructorOptions[]{
 const text=(key:DesktopMessageKey)=>desktopText(locale,key,{brand});
 const item=(role:NonNullable<MenuItemConstructorOptions['role']>,key:DesktopMessageKey):MenuItemConstructorOptions=>({role,label:text(key)}),separator:MenuItemConstructorOptions={type:'separator'};
 const mac=platform==='darwin';
 return[
  ...(mac?[{label:brand,submenu:[item('about','menu.about'),separator,{role:'services' as const,label:text('menu.services'),submenu:[]},separator,item('hide','menu.hide'),item('hideOthers','menu.hideOthers'),item('unhide','menu.showAll'),separator,item('quit','menu.quit')]}]:[]),
  {label:text('menu.file'),submenu:[mac?item('close','menu.close'):item('quit','menu.quit')]},
  {label:text('menu.edit'),submenu:[item('undo','menu.undo'),item('redo','menu.redo'),separator,item('cut','menu.cut'),item('copy','menu.copy'),item('paste','menu.paste'),item('pasteAndMatchStyle','menu.pasteMatch'),item('delete','menu.delete'),item('selectAll','menu.selectAll'),...(mac?[separator,{label:text('menu.speech'),submenu:[item('startSpeaking','menu.startSpeaking'),item('stopSpeaking','menu.stopSpeaking')]}]:[])]},
  {label:text('menu.view'),submenu:[item('reload','menu.reload'),item('forceReload','menu.forceReload'),item('toggleDevTools','menu.devtools'),separator,item('resetZoom','menu.resetZoom'),item('zoomIn','menu.zoomIn'),item('zoomOut','menu.zoomOut'),separator,item('togglefullscreen','menu.fullscreen')]},
  {role:'windowMenu',label:text('menu.window'),submenu:[item('minimize','menu.minimize'),item('zoom','menu.zoom'),...(mac?[separator,item('front','menu.front')]:[item('close','menu.close')])]},
  ...(!mac?[{label:text('menu.help'),submenu:[item('about','menu.about')]}]:[]),
 ];
}

export function startupFailureCopy(locale:DesktopLocale,brand:string,error:unknown){
 const detail=error instanceof Error?error.message:String(error),exited=/^Local service exited: (\d+)$/.exec(detail);
 const message=detail==='Local service did not become ready'?desktopText(locale,'startup.timeout'):exited?desktopText(locale,'startup.exited',{code:exited[1]!}):desktopText(locale,'startup.failed')+'\n\n'+desktopText(locale,'startup.details',{detail});
 return{title:desktopText(locale,'startup.title',{brand}),message};
}
export function stoppedServiceCopy(locale:DesktopLocale,brand:string,code:number){return{title:desktopText(locale,'stopped.title',{brand}),message:desktopText(locale,'stopped.message',{code})};}
