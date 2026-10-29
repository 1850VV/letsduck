import {catalogs} from '../shared/i18n.js';
import {deviceFailureNotice} from '../shared/device-messages.js';
import {DEVICE_SOURCE_MESSAGES} from '../../packages/devices/src/messages.js';
import {debugMessages} from '../locales/debug.js';
// Keep the module usable through its direct entry while the host shares one locale controller.
for(const [locale,messages] of Object.entries(debugMessages))Object.assign(catalogs[locale]!,messages);
export {t,message,onLocale,bindTranslations,escapeAttribute,errorText,getLocale} from '../shared/i18n.js';
import {DEBUG_SOURCE_KEYS} from '../locales/debug.js';
import {t,message,errorText} from '../shared/i18n.js';
import type {MessageParameters,LocalizedMessage} from '../shared/i18n.js';
const debugAccessCodes:Readonly<Record<string,string>>={
 'device.access.setup_local':'device.access.debug_local',
 'device.access.setup_origin':'device.access.debug_origin',
};
/** Only explicit system source labels from debug.ts may enter this map. Never pass user or device values. */
export const dt=(source:string,params:MessageParameters={})=>t(DEBUG_SOURCE_KEYS[source]??source,params);
export const dm=(source:string,params:MessageParameters={})=>message(DEBUG_SOURCE_KEYS[source]??source,params);
export function displayError(source:string):Error & {code:string;params:Record<string,unknown>} {
 return Object.assign(new Error(dt(source)),{code:DEBUG_SOURCE_KEYS[source]??source,params:{}});
}
export function debugFailure(error:unknown):LocalizedMessage {
 const source=error instanceof Error?error.message:error&&typeof error==='object'&&typeof Reflect.get(error,'message')==='string'?String(Reflect.get(error,'message')):String(error);
 if(error&&typeof error==='object'){
  const code=Reflect.get(error,'code'),params=Reflect.get(error,'params'),messageCode=Reflect.get(error,'messageCode');
  if(typeof messageCode==='string'&&Object.hasOwn(DEVICE_SOURCE_MESSAGES,messageCode))return deviceFailureNotice(debugAccessCodes[messageCode]?{code:debugAccessCodes[messageCode],params:Reflect.get(error,'messageParams')}:error);
  if(typeof code==='string'&&Object.hasOwn(DEVICE_SOURCE_MESSAGES,code))return deviceFailureNotice(debugAccessCodes[code]?{code:debugAccessCodes[code],params}:error);
  if(typeof code==='string'&&catalogs.en![code])return message(code,params&&typeof params==='object'?params:{});
  if(typeof code==='string'&&catalogs.en!['error.'+code])return {toString:()=>errorText(error)};
 }
 const known=DEBUG_SOURCE_KEYS[source];if(known)return message(known);
 return dm('操作未完成：{detail}',{detail:source});
}
