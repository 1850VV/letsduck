import test from 'node:test';
import assert from 'node:assert/strict';
import {api} from '../frontend/shared/api.js';
import {setLocale} from '../frontend/shared/i18n.js';
import {deviceErrorText} from '../frontend/shared/device-messages.js';
test('API errors retain the legacy code and both optional message descriptor fields',async()=>{
 const previous=globalThis.fetch,payload={error:'请选择清单里的舵机编号。',code:'request.invalid',params:{legacy:'keep'},messageCode:'device.setup.002',messageParams:{id:'0012'}};
 const calls:unknown[]=[];globalThis.fetch=async(input,init)=>{calls.push([input,init?.method,init?.body]);return new Response(JSON.stringify(payload),{status:422});};
 try{
  setLocale('en');
  await assert.rejects(api('POST','/servo-setup/start',{targetId:12}),error=>{
   assert.ok(error instanceof Error);assert.equal(Reflect.get(error,'code'),payload.code);assert.deepEqual(Reflect.get(error,'params'),payload.params);
   assert.equal(Reflect.get(error,'messageCode'),payload.messageCode);assert.deepEqual(Reflect.get(error,'messageParams'),payload.messageParams);
   assert.equal(deviceErrorText(error),'Select a servo ID from the list.');return true;
  });
  assert.deepEqual(calls,[['/api/servo-setup/start','POST','{"targetId":12}']]);
 }finally{globalThis.fetch=previous;setLocale('auto');}
});
