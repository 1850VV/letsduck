// Locale state is independent of designs, model geometry and account data.
import {catalogs} from '../locales/catalogs.js';
import {sourceKeys} from '../locales/source-keys.js';
import {extra} from '../locales/extra.js';
import {personalMessages} from '../locales/personal.js';
import {homeMessages} from '../locales/home.js';
import {uiMessages} from '../locales/ui.js';
import {experimentalMessages} from '../locales/experimental.js';
import {identityMessages} from '../locales/identity.js';
import type { LocalizedMessage, MessageParameters, MessageScalar } from './types.js';
export type { LocalizedMessage, MessageParameters, Notification } from './types.js';
for(const code of Object.keys(catalogs))Object.assign(catalogs[code]!,extra[code],personalMessages[code],homeMessages[code],experimentalMessages[code],identityMessages[code],uiMessages[code]);
export {catalogs};
export const LOCALES=[{code:'zh-Hans',name:'简体中文'},{code:'zh-Hant',name:'繁體中文'},{code:'en',name:'English'},{code:'ja',name:'日本語'},{code:'ko',name:'한국어'},{code:'fr',name:'Français'},{code:'de',name:'Deutsch'},{code:'es',name:'Español'},{code:'pt-BR',name:'Português (Brasil)'},{code:'ru',name:'Русский'},{code:'ar',name:'العربية'},{code:'hi',name:'हिन्दी'}];
const supported=new Set(LOCALES.map(x=>x.code)),KEY='dd-locale';
export function matchLocales(languages:readonly string[]=[]):string {
  for(const raw of languages){
    const code=String(raw).replaceAll('_','-').toLowerCase(),base=code.split('-')[0]!;
    if(base==='zh')return /(?:hant|tw|hk|mo)(?:-|$)/.test(code)?'zh-Hant':'zh-Hans';
    if(base==='pt')return 'pt-BR';
    if(supported.has(base))return base;
  }
  return 'en';
}
type LocaleStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function createLocaleController({storage,languages=()=>[]}:{storage?:LocaleStorage|undefined;languages?:()=>readonly string[]}={}){
  let choice:string|null=null;try{const saved=storage?.getItem(KEY);if(saved&&supported.has(saved))choice=saved;}catch{}
  const listeners=new Set<(locale:string)=>void>();
  return {get locale(){return choice||matchLocales(languages());},get choice(){return choice||'auto';},
    select(code:string){if(code!=='auto'&&!supported.has(code))return;choice=code==='auto'?null:code;try{choice?storage?.setItem(KEY,choice):storage?.removeItem(KEY);}catch{}for(const listener of listeners)listener(this.locale);},
    reload(){
      if(!storage)return;const previous=this.locale,previousChoice=this.choice;
      try{const saved=storage.getItem(KEY);choice=saved&&supported.has(saved)?saved:null;}catch{return;}
      if(this.locale!==previous||this.choice!==previousChoice)for(const listener of listeners)listener(this.locale);
    },
    subscribe(fn:(locale:string)=>void){listeners.add(fn);return()=>listeners.delete(fn);}
  };
}
let storage:Storage|undefined;try{storage=globalThis.localStorage;}catch{}
const state=createLocaleController({storage,languages:()=>globalThis.navigator?.languages||[globalThis.navigator?.language||'en']});
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===KEY||event.key===null)state.reload();});
export const getLocale=()=>state.locale;
export const getLanguageChoice=()=>state.choice;
export const onLocale=(fn:(locale:string)=>void)=>state.subscribe(fn);
export const setLocale=(code:string)=>state.select(code);
export function translate(locale:string,key:string,params:MessageParameters={}){
  const text=catalogs[locale]?.[key]??catalogs.en![key]??key;
  return text.replace(/\{(\w+)\}/g,(token:string,name:string)=>Object.hasOwn(params,name)?typeof params[name]==='number'?new Intl.NumberFormat(supported.has(locale)?locale:'en').format(params[name]):String(params[name]):token);
}
export const t=(key:string,params?:MessageParameters)=>translate(getLocale(),key,params);
// A notification/history entry keeps its key and raw parameters until rendered.
export function message(key:string,params:MessageParameters={}):LocalizedMessage{
  const values={...params};
  return Object.freeze({toString:()=>t(key,Object.fromEntries(Object.entries(values).map(([name,value])=>[name,typeof value==='function'?value():value])))});
}
// Only call for known system labels (part/catalog names, recipes), never user text.
const labelKeys=new Map(Object.entries(sourceKeys));
export function label(source:string):string;
export function label<T>(source:T):T|string;
export function label(source:unknown):unknown{return typeof source==='string'&&labelKeys.has(source)?t(labelKeys.get(source)!):source;}
export const escapeAttribute=(value:unknown)=>String(value).replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const formatDate=(value:Date|number,options?:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat(getLocale(),options).format(value);
export const relativeTime=(value:number,unit:Intl.RelativeTimeFormatUnit)=>new Intl.RelativeTimeFormat(getLocale(),{numeric:'auto'}).format(value,unit);
export function bindTranslations(root:ParentNode=document){
  for(const node of root.querySelectorAll<HTMLElement>('[data-i18n]'))node.textContent=t(node.dataset.i18n!);
  for(const attr of ['title','aria-label','aria-roledescription','placeholder','alt'])for(const node of root.querySelectorAll('[data-i18n-'+attr+']'))node.setAttribute(attr,t(node.getAttribute('data-i18n-'+attr)!));
}
export function errorText(error:unknown):string {
  if(!error||typeof error!=='object')return t('error.request_failed');
  const code:unknown=Reflect.get(error,'code'),params:unknown=Reflect.get(error,'params');
  if(typeof code!=='string'||!catalogs.en!['error.'+code])return t('error.request_failed');
  const values:Record<string,MessageScalar>={};
  if(params&&typeof params==='object')for(const [key,value]of Object.entries(params)){const text:unknown=label(value);values[key]=typeof text==='number'||typeof text==='bigint'||typeof text==='boolean'||text===null||text===undefined?text:String(text);}
  return t('error.'+code,values);
}
function direction(){if(typeof document==='undefined')return;document.documentElement.lang=getLocale();document.documentElement.dir=getLocale()==='ar'?'rtl':'ltr';}
direction();onLocale(direction);
