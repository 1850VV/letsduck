// Only the requested tutorial language is imported. No runtime translation service.
const loaders={
 'zh-Hans':()=>import('./locales/zh-Hans.mjs'),'zh-Hant':()=>import('./locales/zh-Hant.mjs'),
 en:()=>import('./locales/en.mjs'),ja:()=>import('./locales/ja.mjs'),ko:()=>import('./locales/ko.mjs'),
 fr:()=>import('./locales/fr.mjs'),de:()=>import('./locales/de.mjs'),es:()=>import('./locales/es.mjs'),
 'pt-BR':()=>import('./locales/pt-BR.mjs'),ru:()=>import('./locales/ru.mjs'),ar:()=>import('./locales/ar.mjs'),hi:()=>import('./locales/hi.mjs')
};
export async function loadAssemblyLocale(locale){
 if(!Object.hasOwn(loaders,locale))throw new Error('Unsupported assembly locale: '+locale);
 return (await loaders[locale]()).default;
}
export function localizeStep(step,copy){
 const text=copy.steps[step.id];if(!text)throw new Error('Missing assembly step: '+step.id);
 return {...step,...text};
}
export function translateAssembly(copy,source,params={}){
 // Identifiers (including technical labels without prose) pass through unchanged.
 const template=copy.ui[source]??(!/[\u3400-\u9fff]/u.test(source)?source:undefined);
 if(template===undefined)throw new Error('Missing assembly message: '+source);
 return template.replace(/\{(\w+)\}/g,(token,key)=>Object.hasOwn(params,key)?String(params[key]):token);
}
export function localizeActor(id,actor,copy){
 const text=copy.actors[id];if(!text)throw new Error('Missing assembly actor: '+id);
 return {...actor,...text};
}

// Isolate technical runs in RTL text; the model uses unchanged coordinates.
export function isolateTechnical(text,locale){
 if(locale!=='ar')return text;
 const technical=/\b(?:ID\s?\d+|P\d-\d\d|M\d+(?:\.\d+)?[×x]\d+|HD-?[A-Z0-9-]+|UNO Q|USB-C|Type-C|(?:\d+(?:\.\d+)?×){1,2}\d+(?:\.\d+)?(?:\s?mm)?)\b/g;
 return String(text).replace(technical,value=>'\u2068'+value+'\u2069');
}
export function localizeFocus(focus,copy){
 const text=(source,params)=>translateAssembly(copy,source,params),result={...focus};
 if(focus.detailTitle)result.detailTitle=copy.ui[focus.detailTitle]??text('{name}放大',{name:text(focus.detailTitle.replace(/放大$/,''))});
 if(focus.detailStatus){
  const parts=/^(\d+)\/(\d+) · (.+)$/.exec(focus.detailStatus);
  result.detailStatus=parts?text('{ordinal}/{total} · {status}',{ordinal:parts[1],total:parts[2],status:text(parts[3])}):text(focus.detailStatus);
 }
 if(focus.message){
  const parts=focus.message.split(' · ');
  result.message=parts.length===2?text('{frame} · {status}',{frame:text(parts[0]),status:text(parts[1])}):text(focus.message);
 }
 return result;
}
