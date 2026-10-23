// Locale state is independent of designs, model geometry and account data.
import {loadCatalogs} from '../locales/load.mjs';
import {sourceKeys} from '../locales/source-keys.mjs';
// Loaded dictionaries by locale. The source tree provides all of them at once; the release build
// fetches English (the fallback) plus the active locale, and others on first selection.
export const catalogs={};
export const LOCALES=[{code:'zh-Hans',name:'简体中文'},{code:'zh-Hant',name:'繁體中文'},{code:'en',name:'English'},{code:'ja',name:'日本語'},{code:'ko',name:'한국어'},{code:'fr',name:'Français'},{code:'de',name:'Deutsch'},{code:'es',name:'Español'},{code:'pt-BR',name:'Português (Brasil)'},{code:'ru',name:'Русский'},{code:'ar',name:'العربية'},{code:'hi',name:'हिन्दी'}];
const supported=new Set(LOCALES.map(x=>x.code)),KEY='dd-locale';
export function matchLocales(languages=[]){
  for(const raw of languages){
    const code=String(raw).replaceAll('_','-').toLowerCase(),base=code.split('-')[0];
    if(base==='zh')return /(?:hant|tw|hk|mo)(?:-|$)/.test(code)?'zh-Hant':'zh-Hans';
    if(base==='pt')return 'pt-BR';
    if(supported.has(base))return base;
  }
  return 'en';
}
export function createLocaleController({storage,languages=()=>[]}={}){
  let choice=null;try{const saved=storage?.getItem(KEY);if(supported.has(saved))choice=saved;}catch{}
  const listeners=new Set();
  return {get locale(){return choice||matchLocales(languages());},get choice(){return choice||'auto';},
    select(code){if(code!=='auto'&&!supported.has(code))return;choice=code==='auto'?null:code;try{choice?storage?.setItem(KEY,choice):storage?.removeItem(KEY);}catch{}for(const listener of listeners)listener(this.locale);},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
}
let storage;try{storage=globalThis.localStorage;}catch{}
const browserLanguages=()=>globalThis.navigator?.languages||[globalThis.navigator?.language||'en'];
const state=createLocaleController({storage,languages:browserLanguages});
async function ensureCatalogs(codes){
  const missing=codes.filter(code=>supported.has(code)&&!catalogs[code]);
  if(missing.length)Object.assign(catalogs,await loadCatalogs(missing));
}
// English must load; a failed active locale falls back to English per key, as a missing key does.
await ensureCatalogs(['en']);
try{await ensureCatalogs([state.locale]);}catch(error){console.warn('Locale unavailable; using English.',error);}
export const getLocale=()=>state.locale;
export const getLanguageChoice=()=>state.choice;
export const onLocale=fn=>state.subscribe(fn);
// Switches synchronously when the dictionary is already loaded (always, in the source tree);
// otherwise after it arrives. The latest request wins; a failed load keeps the current language.
let localeRequest=0;
export function setLocale(code){
  const request=++localeRequest,target=code==='auto'?matchLocales(browserLanguages()):code;
  if(!supported.has(target)||catalogs[target]){state.select(code);return Promise.resolve();}
  return ensureCatalogs([target]).then(()=>{if(request===localeRequest)state.select(code);},error=>console.warn('Locale unavailable.',error));
}
export function translate(locale,key,params={}){
  const message=catalogs[locale]?.[key]??catalogs.en[key]??key;
  return message.replace(/\{(\w+)\}/g,(token,name)=>Object.hasOwn(params,name)?typeof params[name]==='number'?new Intl.NumberFormat(supported.has(locale)?locale:'en').format(params[name]):String(params[name]):token);
}
export const t=(key,params)=>translate(getLocale(),key,params);
// A notification/history entry keeps its key and raw parameters until rendered.
export function message(key,params={}){
  const values={...params};
  return Object.freeze({toString:()=>t(key,Object.fromEntries(Object.entries(values).map(([name,value])=>[name,typeof value==='function'?value():value])))});
}
// Only call for known system labels (part/catalog names, recipes), never user text.
const labelKeys=new Map(Object.entries(sourceKeys));
export const label=source=>labelKeys.has(source)?t(labelKeys.get(source)):source;
export const escapeAttribute=value=>String(value).replaceAll('"','&quot;').replaceAll("'",'&#39;');
export const formatDate=(value,options)=>new Intl.DateTimeFormat(getLocale(),options).format(value);
export const relativeTime=(value,unit)=>new Intl.RelativeTimeFormat(getLocale(),{numeric:'auto'}).format(value,unit);
export function bindTranslations(root=document){
  for(const node of root.querySelectorAll('[data-i18n]'))node.textContent=t(node.dataset.i18n);
  for(const attr of ['title','aria-label','placeholder','alt'])for(const node of root.querySelectorAll('[data-i18n-'+attr+']'))node.setAttribute(attr,t(node.getAttribute('data-i18n-'+attr)));
}
export function errorText(error){return error?.code&&catalogs.en['error.'+error.code]?t('error.'+error.code,Object.fromEntries(Object.entries(error.params||{}).map(([key,value])=>[key,label(value)]))):t('error.request_failed');}
function direction(){if(typeof document==='undefined')return;document.documentElement.lang=getLocale();document.documentElement.dir=getLocale()==='ar'?'rtl':'ltr';}
direction();onLocale(direction);
