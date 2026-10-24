import {getLocale,getLanguageChoice,onLocale,setLocale,LOCALES,t} from '../shared/i18n.mjs';
import {createAssemblyLanguageController,localizeStep,localizeActor,translateAssembly,isolateTechnical,localizeFocus} from './assembly-i18n.mjs';
import {assemblyErrors} from './assembly-errors.mjs';
const controller=createAssemblyLanguageController();
await controller.select(getLocale());
const listeners=new Set();
export const hasAssemblyCopy=()=>!!controller.state.copy;
export const assemblyLocale=()=>controller.state.locale||'';
export const assemblyText=(source,params={})=>{
 const {copy,locale}=controller.state;
 const text=copy?translateAssembly(copy,source,params):/[\u3400-\u9fff]/u.test(source)?'':source.replace(/\{(\w+)\}/g,(token,key)=>Object.hasOwn(params,key)?String(params[key]):token);
 return isolateTechnical(text,locale);
};
export const assemblyStep=step=>{
 const {copy,locale}=controller.state,result=copy?localizeStep(step,copy):{...step,short:'',title:'',text:'',check:'',caption:''};
 for(const key of ['short','title','text','check','caption'])result[key]=isolateTechnical(result[key],locale);
 return result;
};
export const assemblyActor=(id,actor)=>{
 const {copy,locale}=controller.state,result=copy?localizeActor(id,actor,copy):{...actor,label:id,source:'',chip:id};
 for(const key of ['label','source','chip'])if(result[key])result[key]=isolateTechnical(result[key],locale);
 return result;
};
export const assemblyChapter=chapter=>({...chapter,...(controller.state.copy?.chapters[chapter.id]||{name:''})});
export const assemblyFocusText=focus=>controller.state.copy?localizeFocus(focus,controller.state.copy):{...focus,detailTitle:'',detailStatus:'',message:''};
export const onAssemblyLocale=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
function effectiveMetadata(){
 const {copy,locale}=controller.state,code=copy?locale:getLocale();
 document.documentElement.lang=code;document.documentElement.dir=code==='ar'?'rtl':'ltr';
 document.documentElement.dataset.assemblyLocale=copy?locale:'';
 document.documentElement.toggleAttribute('data-assembly-language-unavailable',!copy);
 if(!copy)document.documentElement.dataset.assemblyLanguageUnavailable='true';
}
function syncChoice(){
 const select=document.querySelector('#assembly-language');if(!select)return;
 select.value=getLanguageChoice();select.lang=getLocale();select.dir=getLocale()==='ar'?'rtl':'ltr';
 select.setAttribute('aria-label',t('language.label'));
 select.querySelector('[value="auto"]').textContent=t('language.auto');
 controller.state.error?select.setAttribute('aria-invalid','true'):select.removeAttribute('aria-invalid');
}
function failureNotice(){
 const {error,requested}=controller.state;
 let status=document.querySelector('#assembly-language-status');
 if(!error){status?.remove();return;}
 if(!status){status=document.createElement('p');status.id='assembly-language-status';status.setAttribute('role','alert');document.querySelector('.top').after(status);}
 status.lang=requested;status.dir=requested==='ar'?'rtl':'ltr';status.dataset.requestedLocale=requested;
 const name=LOCALES.find(item=>item.code===requested)?.name||requested;
 status.textContent=assemblyErrors[requested].replace('{language}','\u2068'+name+'\u2069');
}
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
 effectiveMetadata();syncChoice();failureNotice();
}
export function mountAssemblyLanguage(header){
 const select=document.createElement('select');select.id='assembly-language';select.className='assembly-language';
 select.add(new Option(t('language.auto'),'auto'));
 for(const {name,code} of LOCALES)select.add(new Option(name,code));
 select.addEventListener('change',()=>setLocale(select.value));header.append(select);syncChoice();
}
onLocale(async next=>{
 // The shared preference changes synchronously; displayed copy keeps its effective language.
 effectiveMetadata();
 const result=await controller.select(next);if(result==='stale')return;
 effectiveMetadata();syncChoice();failureNotice();
 if(result==='loaded'){bindAssembly();for(const listener of listeners)listener();}
});
addEventListener('languagechange',()=>{if(getLanguageChoice()==='auto')setLocale('auto');});
effectiveMetadata();failureNotice();
