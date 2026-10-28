import type {DesktopUpdateState} from './updates.js';
import {localURL} from './navigation.js';
import {DESKTOP_LOCALES} from './copy.js';
import type {DesktopLocale} from './copy.js';
export type HostRequest={kind:'stop'}|{kind:'busy';id:number};
export type HostReply={kind:'ready';url:string}|{kind:'failed';message:string}|{kind:'busy';id:number;busy:boolean}|{kind:'stopped'};
export interface ParentPort{postMessage(message:HostReply):void;on(event:'message',listener:(event:{data:unknown})=>void):unknown;off(event:'message',listener:(event:{data:unknown})=>void):unknown}
export type UpdateAction='check'|'download'|'install';
export interface DesktopLocalePayload{locale:DesktopLocale;brand:string}
export interface DesktopBridge{state():Promise<DesktopUpdateState>;action(action:UpdateAction):Promise<void>;onState(callback:(state:DesktopUpdateState)=>void):()=>void;setLocale?(payload:{locale:string;brand:string}):void}
function object(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
const id=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0;
export function parseDesktopLocale(value:unknown):DesktopLocalePayload|undefined{
 if(!object(value)||typeof value.brand!=='string'||!value.brand.trim())return;
 const locale=DESKTOP_LOCALES.find(code=>code===value.locale);if(locale)return{locale,brand:value.brand};
 return;
}
export function parseHostRequest(value:unknown):HostRequest|undefined{
 if(!object(value))return;
 if(value.kind==='stop')return{kind:'stop'};
 if(value.kind==='busy'&&id(value.id))return{kind:'busy',id:value.id};
 return;
}
export function parseHostReply(value:unknown):HostReply|undefined{
 if(!object(value))return;
 if(value.kind==='ready'&&typeof value.url==='string'){try{const url=new URL(value.url);if(url.protocol==='http:'&&url.hostname==='127.0.0.1'&&url.port&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash)return{kind:'ready',url:value.url};}catch{}}
 if(value.kind==='failed'&&typeof value.message==='string')return{kind:'failed',message:value.message};
 if(value.kind==='busy'&&id(value.id)&&typeof value.busy==='boolean')return{kind:'busy',id:value.id,busy:value.busy};
 if(value.kind==='stopped')return{kind:'stopped'};
 return;
}
export function parseDesktopState(value:unknown):DesktopUpdateState|undefined{
 if(!object(value)||!['idle','checking','available','downloading','ready','waiting','installing','error'].includes(String(value.phase))||typeof value.currentVersion!=='string')return;
 if(value.version!==undefined&&typeof value.version!=='string'||value.percent!==undefined&&(typeof value.percent!=='number'||!Number.isFinite(value.percent)||value.percent<0||value.percent>100)||value.retry!==undefined&&!['check','download'].includes(String(value.retry)))return;
 const phase=value.phase;
 if(phase!=='idle'&&phase!=='checking'&&phase!=='available'&&phase!=='downloading'&&phase!=='ready'&&phase!=='waiting'&&phase!=='installing'&&phase!=='error')return;
 return{phase,currentVersion:value.currentVersion,...(typeof value.version==='string'?{version:value.version}:{}),...(typeof value.percent==='number'?{percent:value.percent}:{}),...(value.retry==='check'||value.retry==='download'?{retry:value.retry}:{})};
}
export function trustedFrame(event:{sender:unknown;senderFrame:{url:string}|null},expected:{sender:unknown;mainFrame:unknown}):boolean{return event.sender===expected.sender&&event.senderFrame===expected.mainFrame&&event.senderFrame!==null&&localURL(event.senderFrame.url);}
export function processParentPort():ParentPort|undefined{
 const value:unknown=Reflect.get(process,'parentPort');
 return isParentPort(value)?value:undefined;
}
function isParentPort(value:unknown):value is ParentPort{return object(value)&&typeof value.postMessage==='function'&&typeof value.on==='function'&&typeof value.off==='function';}
