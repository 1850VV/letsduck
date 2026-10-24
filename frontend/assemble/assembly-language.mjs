import {getLocale,getLanguageChoice,onLocale,setLocale,LOCALES,t} from '../shared/i18n.mjs';
import {loadAssemblyLocale,localizeStep,localizeActor,translateAssembly,isolateTechnical,localizeFocus} from './assembly-i18n.mjs';
let locale=getLocale(),copy=await loadAssemblyLocale(locale),request=0;
const listeners=new Set();
export const assemblyLocale=()=>locale;
export const assemblyText=(source,params)=>isolateTechnical(translateAssembly(copy,source,params),locale);
export const assemblyStep=step=>{
 const result=localizeStep(step,copy);
 for(const key of ['short','title','text','check','caption'])result[key]=isolateTechnical(result[key],locale);
 return result;
};
export const assemblyActor=(id,actor)=>{
 const result=localizeActor(id,actor,copy);
 for(const key of ['label','source','chip'])if(result[key])result[key]=isolateTechnical(result[key],locale);
 return result;
};
export const assemblyChapter=chapter=>({...chapter,...copy.chapters[chapter.id]});
export const assemblyFocusText=focus=>localizeFocus(focus,copy);
export const onAssemblyLocale=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
export function bindAssembly(root=document){
 for(const node of root.querySelectorAll('[data-assembly]'))node.textContent=assemblyText(node.dataset.assembly);
 for(const attr of ['aria-label','title','alt'])for(const node of root.querySelectorAll('[data-assembly-'+attr+']')){
  const value=assemblyText(node.getAttribute('data-assembly-'+attr));node.setAttribute(attr,value);
  if(node.localName.startsWith('ryugi-'))node.querySelector(':scope > button,:scope > select,:scope > input')?.setAttribute(attr,value);
 }
 for(const host of root.querySelectorAll('[data-assembly-options]')){
  const labels=JSON.parse(host.dataset.assemblyOptions),select=host.querySelector('select');
  if(select)for(const [i,option] of [...select.options].entries())option.textContent=assemblyText(labels[i]);
 }
 const language=root.querySelector('#assembly-language');
 if(language){language.setAttribute('aria-label',t('language.label'));language.value=getLanguageChoice();language.querySelector('[value="auto"]').textContent=t('language.auto');}
 document.documentElement.dataset.assemblyLocale=locale;
}
export function mountAssemblyLanguage(header){
 const select=document.createElement('select');select.id='assembly-language';select.className='assembly-language';
 select.add(new Option(t('language.auto'),'auto'));
 for(const {name,code} of LOCALES)select.add(new Option(name,code));
 select.value=getLanguageChoice();select.setAttribute('aria-label',t('language.label'));
 select.addEventListener('change',()=>setLocale(select.value));header.append(select);
}
onLocale(async next=>{
 const token=++request;
 try{
  const loaded=await loadAssemblyLocale(next);if(token!==request)return;
  copy=loaded;locale=next;bindAssembly();for(const listener of listeners)listener();
  const status=document.querySelector('#assembly-language-status');if(status)status.remove();
 }catch(error){
  if(token!==request)return;
  let status=document.querySelector('#assembly-language-status');
  if(!status){status=document.createElement('p');status.id='assembly-language-status';status.setAttribute('role','alert');document.querySelector('.top').after(status);}
  status.textContent=t('error.request_failed');console.error('Assembly language failed',error);
 }
});
