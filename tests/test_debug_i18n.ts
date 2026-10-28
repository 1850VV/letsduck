import test from 'node:test';
import assert from 'node:assert/strict';
import {setLocale} from '../frontend/shared/i18n.js';
import {createState,role,parameterErrors,mappingError,mappingNotice,IDS,ROLES} from '../frontend/debug/state.js';
import {MODE_NAMES} from '../frontend/debug/control.js';

test('Debug role and controller mode labels follow the selected language without changing physical IDs',()=>{
 const state=createState(),before=structuredClone(state.devices);
 try{
  setLocale('en');
  assert.equal(role(10),'Left hip rotation');
  assert.equal(role(20),'Right hip rotation');
  assert.equal(MODE_NAMES.off,'Release all');
  assert.equal(MODE_NAMES.calibrate,'Midpoint calibration');
  assert.deepEqual(state.devices,before);
  setLocale('zh-Hans');assert.equal(role(10),'左髋旋转');
 }finally{setLocale('auto');}
});

test('Debug validation follows the selected language and preserves the in-progress parameter draft',()=>{
 const state=createState();for(const device of state.devices)device.online=[12,13].includes(device.id);
 state.selected='servo-12';state.view='tray';state.draft={id:22,kp:6,kd:21};
 const data=()=>({...state,message:undefined}),before=structuredClone(data());
 try{
  setLocale('en');
  assert.equal(parameterErrors(state,'servo-12',{id:254,kp:6,kd:21}).id,'Enter an integer from 0 to 253');
  assert.equal(mappingError(state,[{uid:'servo-12',to:13}]),'ID13 is already used by another online servo');
  assert.deepEqual(data(),before);
  setLocale('zh-Hans');assert.equal(parameterErrors(state,'servo-12',{id:254,kp:6,kd:21}).id,'请输入 0–253 的整数');
 }finally{setLocale('auto');}
});

test('the initial Debug notification translates again after a language switch',()=>{
 try{
  setLocale('zh-Hans');const state=createState();assert.equal(String(state.message),'正在读取控制器状态…');
  setLocale('en');assert.equal(String(state.message),'Reading controller status…');
 }finally{setLocale('auto');}
});

test('Debug error descriptors follow a later language switch and retain unknown device diagnostics',async()=>{
 const {debugFailure}=await import('../frontend/debug/i18n.js');
 try{
  setLocale('zh-Hans');const failure=debugFailure({code:'debug.copy.004',params:{},message:'操作未完成'});
  setLocale('en');assert.equal(String(failure),'The operation did not complete');
  const diagnostic=debugFailure({message:'MCU_SLOW / HD-1910-C001 / ID12'});
  assert.equal(String(diagnostic),'Operation failed: MCU_SLOW / HD-1910-C001 / ID12');
 }finally{setLocale('auto');}
});


test('Debug mapping feedback retains the rejected physical ID while its copy changes language',()=>{
 const state=createState();for(const device of state.devices)device.online=[12,13].includes(device.id);
 try{
  setLocale('zh-Hans');const notice=mappingNotice(state,[{uid:'servo-12',to:13}]);
  setLocale('en');assert.equal(String(notice),'ID13 is already used by another online servo');
 }finally{setLocale('auto');}
});

test('Debug source and English catalogs expose matching keys and a placeholder contract',async()=>{
 const {debugMessages,DEBUG_KEYS,DEBUG_PLACEHOLDERS}=await import('../frontend/locales/debug.js');
 for(const locale of ['zh-Hans','en']){
  assert.deepEqual(Object.keys(debugMessages[locale]!).sort(),[...DEBUG_KEYS].sort());
  for(const key of DEBUG_KEYS){const copy:string=debugMessages[locale]![key]!;assert.ok(copy.trim());assert.deepEqual((copy.match(/\{\w+\}/g)??[]).sort(),DEBUG_PLACEHOLDERS[key],locale+': '+key);}
 }
});


test('Chinese Debug role labels retain the canonical servo map names for every fixed ID',()=>{
 try{setLocale('zh-Hans');for(const [index,id]of IDS.entries())assert.equal(role(id),ROLES[index],'ID'+id);}
 finally{setLocale('auto');}
});

test('Debug provides a complete static catalog in every existing application language',async()=>{
 const {LOCALES}=await import('../frontend/shared/i18n.js');
 const {debugMessages,DEBUG_KEYS,DEBUG_PLACEHOLDERS}=await import('../frontend/locales/debug.js');
 assert.deepEqual(Object.keys(debugMessages).sort(),LOCALES.map(locale=>locale.code).sort());
 for(const {code}of LOCALES){
  assert.ok(debugMessages[code],'Missing Debug catalog for '+code);
  assert.deepEqual(Object.keys(debugMessages[code]!).sort(),[...DEBUG_KEYS].sort(),code);
  if(code!=='en')assert.notEqual(debugMessages[code]!['debug.status.reading'],debugMessages.en!['debug.status.reading'],code+' must not fall back to English');
  for(const key of DEBUG_KEYS){const copy:string=debugMessages[code]![key]!;assert.ok(copy.trim(),code+': '+key);assert.deepEqual((copy.match(/\{\w+\}/g)??[]).sort(),DEBUG_PLACEHOLDERS[key],code+': '+key);}
 }
});
