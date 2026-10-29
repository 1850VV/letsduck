import test from 'node:test';
import assert from 'node:assert/strict';
import {debugFailure} from '../frontend/debug/i18n.js';
import {deviceErrorText} from '../frontend/shared/device-messages.js';
import {LOCALES,setLocale} from '../frontend/shared/i18n.js';
import {deviceMessages} from '../frontend/locales/device.js';
import {identityMessages} from '../frontend/locales/identity.js';

for(const kind of ['local','origin'])for(const field of ['code','messageCode'])test(`Debug ${kind} access failures reuse the Debug descriptor through ${field} in every locale`,()=>{
 const setupCode='device.access.setup_'+kind,debugCode='device.access.debug_'+kind;
 const values=Object.freeze(field==='code'?{code:setupCode,params:Object.freeze({}),error:'原始响应保持不变'}:{code:'request.invalid',params:Object.freeze({}),messageCode:setupCode,messageParams:Object.freeze({}),error:'原始响应保持不变'});
 const before=JSON.stringify(values),notice=debugFailure(values);
 try{
  for(const {code}of LOCALES){
   setLocale(code);const actual=String(notice);
   assert.equal(actual,deviceMessages[code]!['error.'+debugCode],code+' '+field);
   assert.ok(actual.includes(identityMessages[code]!['hub.debug.name']!),code+' must name the displayed Debug feature');
   assert.equal(deviceErrorText(values),deviceMessages[code]!['error.'+setupCode],code+' shared/Assembly rendering keeps the original descriptor');
   assert.equal(JSON.stringify(values),before,'Rendering must not rewrite the backend response');
  }
 }finally{setLocale('zh-Hans');}
});

test('existing Debug access descriptors name the same feature as the twelve-language identity catalog',()=>{
 try{for(const {code}of LOCALES){setLocale(code);for(const kind of ['local','origin']){
  const notice=debugFailure({code:'device.access.debug_'+kind});
  assert.ok(String(notice).includes(identityMessages[code]!['hub.debug.name']!),code+' '+kind+': '+String(notice));
 }}}finally{setLocale('zh-Hans');}
});

test('Debug leaves preparation access descriptions in the Assembly context',()=>{
 try{for(const {code}of LOCALES){setLocale(code);for(const kind of ['local','origin']){
  const key='device.access.preparation_'+kind;
  assert.equal(String(debugFailure({code:key})),deviceMessages[code]!['error.'+key],code);
 }}}finally{setLocale('zh-Hans');}
});
