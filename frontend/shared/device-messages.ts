// Feature entry points load this module. Home does not need the device catalog.
import {DEVICE_SOURCE_MESSAGES} from '../../packages/devices/src/messages.js';
import {deviceMessages} from '../locales/device.js';
import {catalogs,t,errorText} from './i18n.js';
import type {LocalizedMessage,MessageParameters} from './i18n.js';
for(const [locale,messages]of Object.entries(deviceMessages))Object.assign(catalogs[locale]!,messages);
const knownCode=(code:unknown):code is keyof typeof DEVICE_SOURCE_MESSAGES=>typeof code==='string'&&Object.hasOwn(DEVICE_SOURCE_MESSAGES,code);
const legacyKeys=new Map<string,string>(Object.entries(DEVICE_SOURCE_MESSAGES).filter(([key,text])=>!key.startsWith('device.field.')&&!text.includes('{')).map(([key,text])=>[text,key]));
function descriptor(value:unknown){
 if(!value||typeof value!=='object')return;
 const messageCode=Reflect.get(value,'messageCode'),preferred=knownCode(messageCode);
 const code=preferred?messageCode:Reflect.get(value,'code');
 return knownCode(code)?{code,params:Reflect.get(value,preferred?'messageParams':'params')}:undefined;
}
function displayValue(value:unknown):string|number|boolean|null|undefined{
 const notice=descriptor(value);if(notice)return t('error.'+notice.code,displayParams(notice.params));
 if(typeof value==='string'&&value.startsWith('device.field.')&&knownCode(value))return t('error.'+value);
 return value===null||value===undefined||typeof value==='string'||typeof value==='number'||typeof value==='boolean'?value:String(value);
}
function displayParams(params:unknown):MessageParameters{
 return params&&typeof params==='object'?Object.fromEntries(Object.entries(params).map(([key,value])=>[key,displayValue(value)])):{};
}
export function deviceErrorText(error:unknown):string{
 const notice=descriptor(error);if(notice)return t('error.'+notice.code,displayParams(notice.params));
 if(error&&typeof error==='object'){
  const code=Reflect.get(error,'code');
  if(typeof code==='string'&&catalogs.en!['error.'+code])return errorText(error);
 }
 // Exact static legacy system messages are known; hardware diagnostics are never guessed.
 const raw=error instanceof Error?error.message:typeof error==='string'?error:error&&typeof error==='object'?Reflect.get(error,'error')??Reflect.get(error,'message'):undefined;
 const legacy=typeof raw==='string'?legacyKeys.get(raw):undefined;
 return legacy?t('error.'+legacy):typeof raw==='string'?raw:errorText(error);
}
export const deviceFailureNotice=(error:unknown):LocalizedMessage=>({toString:()=>deviceErrorText(error)});
