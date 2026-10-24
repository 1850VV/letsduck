// A document works independently, or as one retained page in the personal shell.
const hosted=typeof window!=='undefined'&&window.parent!==window&&!!window.frameElement?.dataset.personalPage;
let active=!hosted,ready=false,revision=0;
const listeners=new Set();
export const isPersonalPage=()=>hosted;
export const pageActive=()=>active;
export const renderActive=()=>active||!ready;
export const onPageActivity=listener=>{listeners.add(listener);return()=>listeners.delete(listener);};
async function setActive(value,detail={}){
 const ticket=++revision;active=value;
 for(const listener of listeners){if(ticket!==revision)return;await listener(value,detail);}
}
export function markPageReady(){
 if(ready)return;
 requestAnimationFrame(()=>requestAnimationFrame(async()=>{
  ready=true;if(!active)await setActive(false);
  document.documentElement.dataset.pageReady='true';
 }));
}
if(hosted){
 window.personalPage={setActive,get ready(){return ready;}};
 document.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href]');
  if(!link||link.download||link.target&&link.target!=='_self')return;
  const url=new URL(link.href);
  if(!parent.personalApp?.owns(url))return;
  event.preventDefault();
  // Existing bubbling handlers persist the studio draft before navigation begins.
  queueMicrotask(()=>parent.personalApp.navigate(url.href));
 });
}
