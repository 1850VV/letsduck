import {getLocale,onLocale,errorText,catalogs} from '../shared/i18n.js';
import {brandName} from '../shared/brand.js';
import {deviceErrorText} from '../shared/device-messages.js';
import type {MessageParameters} from '../shared/types.js';
import {assemblyDataText} from '../locales/assembly-data.js';
import {assembleMessages} from '../locales/assemble.js';
import type {PreparationSlot} from './servo-types.js';
import type {Step,Chapter,Actor,MaterialItem} from './types.js';

export function assemblyText(key:string,params:MessageParameters={}):string{
 if(key==='assemble.ui.0276')return brandName();
 if(key==='assemble.ui.0275')return brandName()+' · '+assemblyText('assemble.ui.0277');
 const source=assembleMessages[getLocale()]?.[key]??assembleMessages['zh-Hans']?.[key]??key,text=key==='assemble.ui.0368'?brandName()+' · '+source:source;
 return text.replace(/\{(\w+)\}/g,(token,name:string)=>Object.hasOwn(params,name)?String(params[name]):token);
}

// Only these known system diagnostics are eligible for source-text lookup. User text is never passed here.
const diagnosticKeys:Record<string,string>={"数据格式不正确": "assemble.ui.0363", "数值格式不正确": "assemble.ui.0362", "文本格式不正确": "assemble.ui.0364", "列表格式不正确": "assemble.ui.0361", "舵机映射与模型不一致": "assemble.ui.0260", "取件记录格式不正确": "assemble.ui.0263", "线材要求格式不正确": "assemble.ui.0366", "记录格式不正确": "assemble.ui.0367", "状态格式不正确": "assemble.ui.0365", "找不到舵机的安装步骤": "assemble.ui.0261", "舵机安装节点与教程不一致": "assemble.ui.0262", "取件记录没有保存成功": "assemble.ui.0123", "线材要求没有加载成功": "assemble.ui.0124", "取件记录尚不可用": "assemble.ui.0125", "连接没有响应": "assemble.ui.0257", "记录未加载": "assemble.ui.0258", "模型清单加载失败": "assemble.ui.0035", "模型几何加载失败": "assemble.ui.0036"};
const diagnosticText=(source:string)=>diagnosticKeys[source]?assemblyText(diagnosticKeys[source]!):source;
export function assemblyResponseText(value:object,raw='error',code=raw==='error'?'code':raw+'Code',params=raw==='error'?'params':raw+'Params'){
 const preferred:unknown=Reflect.get(value,'messageCode'),id:unknown=code==='code'&&typeof preferred==='string'?preferred:Reflect.get(value,code),parameters:unknown=code==='code'&&typeof preferred==='string'?Reflect.get(value,'messageParams'):Reflect.get(value,params),source:unknown=Reflect.get(value,raw);
 if(typeof id==='string'&&catalogs.en?.['error.'+id])return deviceErrorText({code:id,params:parameters,error:source,message:source});
 return typeof source==='string'?diagnosticText(source):'';
}
export function assemblyApiError(value:object){const source:unknown=Reflect.get(value,'error'),code:unknown=Reflect.get(value,'code'),params:unknown=Reflect.get(value,'params'),messageCode:unknown=Reflect.get(value,'messageCode'),messageParams:unknown=Reflect.get(value,'messageParams');return Object.assign(new Error(typeof source==='string'?source:'连接没有响应'),{code,params,messageCode,messageParams});}
export function assemblyErrorText(error:unknown){if(error instanceof TypeError&&/fetch|network|load failed/i.test(error.message))return errorText({code:'request_failed'});return error&&typeof error==='object'?assemblyResponseText(error,'message','code','params')||diagnosticText(error instanceof Error?error.message:String(error)):diagnosticText(String(error??''));}

export const assemblyField=(kind:string,id:string,field:string,source:string)=>assemblyDataText(getLocale(),kind,id,field,source);
export function displayStep(step:Step):Step{return {...step,short:assemblyField('step',step.id,'short',step.short),title:assemblyField('step',step.id,'title',step.title),text:assemblyField('step',step.id,'text',step.text),check:assemblyField('step',step.id,'check',step.check),...(step.caption?{caption:assemblyField('step',step.id,'caption',step.caption)}:{})};}
export function displayChapter(chapter:Chapter):Chapter{return {...chapter,name:assemblyField('chapter',chapter.id,'name',chapter.name)};}
export function displayActor(id:string,actor:Actor):Actor{return {...actor,label:assemblyField('actor',id,'label',actor.label),source:assemblyField('actor',id,'source',actor.source),...(actor.chip?{chip:assemblyField('actor',id,'chip',actor.chip)}:{})};}
export function displayMaterial(material:MaterialItem):MaterialItem{return {...material,...Object.fromEntries(['name','short','spec','note','quantity'].flatMap(field=>{const source=Reflect.get(material,field);return typeof source==='string'?[[field,assemblyField('material',material.id,field,source)]]:[];}))};}
const cueKeys:Record<string,string>={"原装螺丝": "assemble.ui.0355", "副舵盘": "assemble.ui.0271", "线端余量": "assemble.ui.0356", "插头": "assemble.ui.0357", "踝轴": "assemble.ui.0358", "轴承": "assemble.ui.0359", "线束整理": "assemble.ui.0360"};
export const displayCueLabel=(source:string)=>cueKeys[source]?assemblyText(cueKeys[source]!):source;
export function displayLeadLabel(item:PreparationSlot){return item.leadKnown?item.leads.map(lead=>`${assemblyText(lead.cableClass==='long'?'assemble.ui.0112':'assemble.ui.0264')} · ${lead.lengthMm} mm`).join(' / '):assemblyText('assemble.ui.0265');}
export function bindAssemblyTranslations(root:ParentNode=document){
 for(const node of root.querySelectorAll<HTMLElement>('[data-assemble-i18n]')){const target=node.querySelector<HTMLButtonElement>(':scope > button')??node;const text=assemblyText(node.dataset.assembleI18n!);if(target!==node){const icon=target.querySelector(':scope > svg');target.replaceChildren(...(icon?[icon]:[]),document.createTextNode(text));}else target.textContent=text;}
 for(const attr of ['title','aria-label','placeholder','alt'])for(const node of root.querySelectorAll(`[data-assemble-i18n-${attr}]`)){const text=assemblyText(node.getAttribute(`data-assemble-i18n-${attr}`)!);node.setAttribute(attr,text);node.querySelector(':scope > button,:scope > select,:scope > input')?.setAttribute(attr,text);}
}
if(typeof document!=='undefined'){bindAssemblyTranslations();onLocale(()=>bindAssemblyTranslations());}
