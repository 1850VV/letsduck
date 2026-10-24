// Personal edition only: keep the three existing documents and their GPU scenes alive.
const routes={home:['/','/home.html'],paint:['/paint','/index.html'],assemble:['/assemble/','/assemble/index.html']};
export function personalRoute(input,origin){
 let url;try{url=new URL(input,origin);}catch{return null;}
 if(url.origin!==origin)return null;
 const found=Object.entries(routes).find(([,paths])=>paths.includes(url.pathname));
 if(!found)return null;
 const [key,[path,source]]=found,suffix=url.search+url.hash;
 return {key,href:path+suffix,source:source+suffix};
}
export function createPageNavigator(load,commit){
 const pages=new Map();let revision=0;
 function prepare(key){
  if(!pages.has(key)){
   const pending=Promise.resolve().then(()=>load(key)).catch(error=>{if(pages.get(key)===pending)pages.delete(key);throw error;});
   pages.set(key,pending);
  }
  return pages.get(key);
 }
 return {prepare,async navigate(key,detail={}){
  const ticket=++revision,entry=await prepare(key),current=()=>ticket===revision;
  if(!current())return false;
  await commit(entry,detail,current);return current();
 }};
}
