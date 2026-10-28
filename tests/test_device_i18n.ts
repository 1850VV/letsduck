import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCALES,setLocale} from '../frontend/shared/i18n.js';
import {deviceErrorText,deviceFailureNotice} from '../frontend/shared/device-messages.js';
import {deviceMessages} from '../frontend/locales/device.js';
import {DEVICE_SOURCE_MESSAGES} from '../packages/devices/src/messages.js';

test('device descriptors translate known parameter labels and nested failure reasons',()=>{
 const error={error:'原始错误保持兼容',code:'device.debug.not_retried',params:{detail:{code:'device.debug.integer',params:{name:'device.field.jog_step',low:-10,high:10}}}};
 const before=structuredClone(error),notice=deviceFailureNotice(error);
 try{
  setLocale('en');assert.equal(String(notice),'Jog step requires an integer from -10 to 10; no automatic retry was made. Read again');
  setLocale('zh-Hans');assert.equal(String(notice),'微动步幅 需要 -10–10 的整数；未自动重试，请重新读取');
  assert.deepEqual(error,before);
 }finally{setLocale('auto');}
});
test('device display preserves unknown diagnostic text and physical identifiers as data',()=>{
 const detail='runtime E731 · SN_设备原文 · UNO Q · ID12';
 try{
  setLocale('en');assert.equal(deviceErrorText({code:'device.diagnostic',params:{detail}}),'Device operation failed: '+detail);
  assert.equal(deviceErrorText(new Error(detail)),detail);
  assert.equal(deviceErrorText({code:'device.setup.pending',params:{sourceId:'0012',id:'0034'}}),'The previous write result needs review. First reconnect the servo with ID0012 or ID0034.');
  assert.equal(deviceErrorText({code:'request.invalid',params:{},messageCode:'device.setup.pending',messageParams:{sourceId:'0012',id:'0034'}}),'The previous write result needs review. First reconnect the servo with ID0012 or ID0034.');
  assert.equal(deviceErrorText({error:'参数与配置档不一致'}),'Parameters do not match the profile');
 }finally{setLocale('auto');}
});
test('all twelve device catalogs have the exact system key and placeholder contracts',()=>{
 assert.deepEqual(Object.keys(deviceMessages).sort(),LOCALES.map(locale=>locale.code).sort());
 const keys=Object.keys(DEVICE_SOURCE_MESSAGES).map(key=>'error.'+key).sort();
 for(const locale of LOCALES){
  const dictionary=deviceMessages[locale.code]!;assert.deepEqual(Object.keys(dictionary).sort(),keys,locale.code);
  for(const key of keys){assert.ok(dictionary[key]?.trim(),locale.code+' '+key);assert.deepEqual((dictionary[key]!.match(/\{\w+\}/g)??[]).sort(),(deviceMessages['zh-Hans']![key]!.match(/\{\w+\}/g)??[]).sort(),locale.code+' '+key);}
  if(!['zh-Hans','en'].includes(locale.code))assert.notEqual(dictionary['error.device.diagnostic'],deviceMessages.en!['error.device.diagnostic'],locale.code+' must contain a language candidate');
 }
});
