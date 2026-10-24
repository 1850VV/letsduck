import {personalRoute,createPageNavigator} from './personal-navigation.mjs';

const routes={home:['/home.html','首页'],paint:['/index.html','涂装台'],assemble:['/assemble/index.html','组装教程']};
let visible=null;
const frames=new Map();
function createPage(key){
 const frame=document.createElement('iframe');frame.dataset.personalPage=key;frame.dataset.active='false';frame.dataset.paintWarm='true';
 frame.name='personal-'+key;frame.title='来做鸭 · '+routes[key][1];frame.inert=true;frame.setAttribute('aria-hidden','true');
 const entry={key,frame};frames.set(key,entry);
 return new Promise((resolve,reject)=>{
  let watch,timer;
  const fail=()=>{watch?.disconnect();clearTimeout(timer);frame.remove();frames.delete(key);reject(Error('Page preparation failed: '+key));};
  frame.addEventListener('load',()=>{
   try{
    const doc=frame.contentDocument;
    const finish=()=>{if(!doc.documentElement.dataset.pageReady)return;watch?.disconnect();clearTimeout(timer);resolve(entry);};
    watch=new MutationObserver(finish);watch.observe(doc.documentElement,{attributes:true,attributeFilter:['data-page-ready']});finish();
    new MutationObserver(()=>{if(visible===entry)syncTitle(entry);}).observe(doc.head,{subtree:true,childList:true,characterData:true,attributes:true});
   }catch{fail();}
  },{once:true});
  frame.addEventListener('error',fail,{once:true});timer=setTimeout(fail,20000);
  frame.src=routes[key][0];document.body.append(frame);
 });
}
function syncTitle(entry){
 const doc=entry.frame.contentDocument;document.title=doc.title;
 document.documentElement.lang=doc.documentElement.lang;document.documentElement.dir=doc.documentElement.dir;
 const icon=doc.querySelector('link[rel="icon"]');if(icon)document.querySelector('link[rel="icon"]').href=icon.href;
}
const navigator=createPageNavigator(createPage,async(entry,{route,historyMode='push',focus=true},current)=>{
 await entry.frame.contentWindow.personalPage.setActive(true,{href:route.href});
 if(!current()){if(visible!==entry)await entry.frame.contentWindow.personalPage.setActive(false);return;}
 const previous=visible;visible=entry;
 if(previous&&previous!==entry){
  previous.frame.dataset.active='false';previous.frame.inert=true;previous.frame.setAttribute('aria-hidden','true');
 }
 entry.frame.dataset.active='true';delete entry.frame.dataset.paintWarm;entry.frame.inert=false;entry.frame.removeAttribute('aria-hidden');syncTitle(entry);
 if(historyMode==='push'&&location.pathname+location.search+location.hash!==route.href)history.pushState(null,'',route.href);
 if(entry.key==='paint'&&/^#(?:new$|look=|scheme=)/.test(new URL(route.href,location.origin).hash))history.replaceState(null,'',location.pathname+location.search);
 document.documentElement.dataset.page=entry.key;document.documentElement.dataset.ready='true';
 if(focus)entry.frame.contentWindow.focus();
 if(previous&&previous!==entry)await previous.frame.contentWindow.personalPage.setActive(false);
});
async function navigate(input,{historyMode='push',focus=true}={}){
 const route=personalRoute(input,location.origin);if(!route)return false;
 try{return await navigator.navigate(route.key,{route,historyMode,focus});}
 catch(error){
  console.error(error);
  // The standalone document remains a recovery path if a retained page cannot initialize.
  location.assign(route.source);return false;
 }
}
window.personalApp={navigate,owns:url=>!!personalRoute(url,location.origin)};
addEventListener('popstate',()=>navigate(location.href,{historyMode:'none'}));
const initial=personalRoute(location.href,location.origin)||personalRoute('/',location.origin);
await navigate(initial.href,{historyMode:'none',focus:false});
// Warm one page at a time only after the current page is usable. Hidden scenes then sleep.
// Unvisited documents may paint behind the opaque active frame, while remaining inert and aria-hidden.
// visibility:hidden would defer their DOM raster/pipeline preparation until the first user navigation.
const idle=()=>new Promise(resolve=>{if('requestIdleCallback'in window)requestIdleCallback(resolve,{timeout:2000});else setTimeout(resolve,100);});
const site=await fetch('/api/site').then(response=>response.json()).catch(()=>({}));
for(const key of ['home','paint',...(site.assembly?['assemble']:[])]){
 if(key===initial.key)continue;
 await idle();try{await navigator.prepare(key);}catch{/* Actual navigation retries a failed preparation. */}
}
