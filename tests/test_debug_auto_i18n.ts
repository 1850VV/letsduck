import test from 'node:test';
import assert from 'node:assert/strict';
import {dt,dm} from '../frontend/debug/i18n.js';
import {LOCALES,setLocale} from '../frontend/shared/i18n.js';
import {debugMessages,DEBUG_SOURCE_KEYS,DEBUG_PLACEHOLDERS} from '../frontend/locales/debug.js';

// Public automatic-numbering controls and state labels. Device diagnostics use
// their existing messageCode descriptors rather than this source-label map.
const controls=[
 ['自动编号','Automatic numbering'],['开始后自动识别','Detected automatically after starting'],
 ['当前目标','Current target'],['运行端配置档','Runtime profile'],['尚未开始','Not started'],
 ['开始编号','Start numbering'],['继续编号','Resume numbering'],['暂停编号','Pause numbering'],
 ['停止并卸载','Stop and release'],['关机换接','Shut down and swap'],['下一只','Next servo'],
 ['加入下一只队列','Queue as next servo'],['已加入下一只队列','Queued as next servo'],
 ['等待上电后继续','Waiting for power to resume'],['等待关机换接','Waiting for shutdown and swap'],
 ['已暂停编号','Numbering paused'],['编号完成','Numbering complete'],
 ['关机后等待 {seconds} 秒','Wait {seconds} s after shutdown'],
 ['目标 ID{id}','Target ID{id}'],['已验证 {count}/15','Verified {count}/15'],['下一只 ID{id}','Next ID{id}'],
 ['读回复核','Readback verification'],['初始化写入','Initialization and writing'],
 ['扫描识别','Scanning and detection'],['识别配置档','Detecting profile'],
 ['返回手动设置','Back to manual settings'],
 ['编号完成不代表机械零位已校准。','Numbering completion does not confirm mechanical zero calibration.'],
 ['移除下一只','Remove next servo from queue'],
] as const;

test('automatic-numbering controls render through the existing Debug translation entry point',()=>{
 try{setLocale('en');for(const [source,english]of controls)assert.equal(dt(source),english,source);}
 finally{setLocale('zh-Hans');}
});

test('automatic-numbering copy is explicit in all twelve locales and keeps its placeholder contract',()=>{
 for(const [source,english]of controls){
  const key=DEBUG_SOURCE_KEYS[source];assert.ok(key,'Missing explicit automatic-numbering key: '+source);
  assert.deepEqual(DEBUG_PLACEHOLDERS[key],[...(source.match(/\{\w+\}/g)??[])].sort());
  for(const {code}of LOCALES){
   const copy:string|undefined=debugMessages[code]![key];assert.ok(typeof copy==='string'&&copy.trim(),code+': '+source);
   assert.deepEqual((copy.match(/\{\w+\}/g)??[]).sort(),DEBUG_PLACEHOLDERS[key],code+': '+source);
   if(code!=='zh-Hans')assert.notEqual(copy,source,code+': source fallback');
   if(!['zh-Hans','zh-Hant','ja'].includes(code))assert.doesNotMatch(copy,/[\u3400-\u9fff]/,code+': untranslated Chinese');
   if(!['zh-Hans','en'].includes(code))assert.notEqual(copy,english,code+': English fallback');
  }
 }
});

test('a live automatic-numbering countdown changes locale without rewriting its original parameters',()=>{
 const values={seconds:'15',id:'24',count:'7'},before={...values};
 const countdown=dm('关机后等待 {seconds} 秒',values),target=dm('目标 ID{id}',values),progress=dm('已验证 {count}/15',values);
 try{
  setLocale('en');assert.equal(String(countdown),'Wait 15 s after shutdown');assert.equal(String(target),'Target ID24');assert.equal(String(progress),'Verified 7/15');
  for(const {code}of LOCALES){
   setLocale(code);assert.ok(String(countdown).includes('15'),code);assert.ok(String(target).includes('ID24'),code);assert.ok(String(progress).includes('7/15'),code);
   assert.doesNotMatch(String(countdown)+String(target)+String(progress),/\{\w+\}/);assert.deepEqual(values,before);
  }
  setLocale('zh-Hans');assert.equal(String(countdown),'关机后等待 15 秒');
 }finally{setLocale('zh-Hans');}
});
