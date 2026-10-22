// Locale state is independent of designs, model geometry and account data.
import {catalogs} from '../locales/catalogs.mjs';
export {catalogs};
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
const state=createLocaleController({storage,languages:()=>globalThis.navigator?.languages||[globalThis.navigator?.language||'en']});
export const getLocale=()=>state.locale;
export const getLanguageChoice=()=>state.choice;
export const onLocale=fn=>state.subscribe(fn);
export const setLocale=code=>state.select(code);
export function translate(locale,key,params={}){
  const message=catalogs[locale]?.[key]??catalogs.en[key]??key;
  return message.replace(/\{(\w+)\}/g,(token,name)=>Object.hasOwn(params,name)?String(params[name]):token);
}
export const t=(key,params)=>translate(getLocale(),key,params);
function direction(){if(typeof document==='undefined')return;document.documentElement.lang=getLocale();document.documentElement.dir=getLocale()==='ar'?'rtl':'ltr';}
direction();onLocale(direction);
