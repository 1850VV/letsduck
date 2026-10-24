// Structural audit, intentionally separate from native-language/hardware review.
import {pathToFileURL} from 'node:url';
import {loadAssemblyLocale} from '../frontend/assemble/assembly-i18n.mjs';
import {STEPS,CHAPTERS,ACTORS} from '../frontend/assemble/hardware-state.mjs';
const LOCALES=['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi'];
const fields=['short','title','text','check','caption'];
const placeholders=s=>[...s.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort();
const identifiers=s=>s.match(/\b(?:ID\s?\d+|P\d-\d\d|M\d+(?:\.\d+)?[×x]\d+|(?:\d+(?:\.\d+)?×){1,2}\d+(?:\.\d+)?)/g)||[];
function walk(source,target,path,locale,errors){
 if(typeof source==='string'){
  if(typeof target!=='string'||(source&&!target.trim())){errors.push(path+': missing text');return;}
  if(JSON.stringify(placeholders(source))!==JSON.stringify(placeholders(target)))errors.push(path+': placeholders changed');
  for(const id of identifiers(source))if(!target.includes(id))errors.push(path+': identifier lost '+id);
  const digits=value=>value.match(/\d+(?:\.\d+)?/g)||[];
  const before=digits(source),after=digits(target);
  for(const number of new Set(before))if(after.filter(x=>x===number).length<before.filter(x=>x===number).length)errors.push(path+': numeric token lost '+number);
  if(!['zh-Hans','zh-Hant','ja'].includes(locale)&&/[\u3400-\u9fff]/u.test(target))errors.push(path+': unexpected Chinese text');
  if(/ZXQ\d|QZX\d/i.test(target))errors.push(path+': authoring marker');
  return;
 }
 if(typeof source!=='object')return;
 if(!target||typeof target!=='object'){errors.push(path+': missing group');return;}
 if(JSON.stringify(Object.keys(source).sort())!==JSON.stringify(Object.keys(target).sort()))errors.push(path+': key set differs');
 for(const key of Object.keys(source))walk(source[key],target[key],path+'.'+key,locale,errors);
}
export async function auditAssemblyLocales(){
 const source=await loadAssemblyLocale('zh-Hans'),reports=[];
 const stale=[];
 for(const s of STEPS)for(const key of fields)if(source.steps[s.id]?.[key]!==String(s[key]||''))stale.push('step.'+s.id+'.'+key);
 for(const c of CHAPTERS)if(source.chapters[c.id]?.name!==c.name)stale.push('chapter.'+c.id);
 for(const [id,a] of Object.entries(ACTORS))for(const key of ['label','source','chip'])if(typeof a[key]==='string'&&source.actors[id]?.[key]!==a[key])stale.push('actor.'+id+'.'+key);
 for(const locale of LOCALES){
  const copy=await loadAssemblyLocale(locale),errors=[];walk(source,copy,'assembly',locale,errors);
  reports.push({locale,chapters:Object.keys(copy.chapters).length,steps:Object.keys(copy.steps).length,actors:Object.keys(copy.actors).length,ui:Object.keys(copy.ui).length,errors});
 }
 return{sourceDrift:stale,reports,ok:!stale.length&&reports.every(r=>!r.errors.length)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=await auditAssemblyLocales();console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}
