import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setImmediate as immediate} from 'node:timers/promises';
import {PersonalStore} from '../../packages/storage/src/personal.js';
import {DuckDebug} from '../../packages/devices/src/duck-debug.js';
import {ServoSetup} from '../../packages/devices/src/servo-setup.js';
import {DebugSetup,Firmware} from './duck-debug-fixture.js';
import {SetupError,Offline} from '../../packages/devices/src/errors.js';
import {deviceMessage,deviceFailure} from '../../packages/devices/src/messages.js';
import {errorPayload} from '@letsduck/domain';

function fixture(t:{after(fn:()=>unknown):void}){
 const directory=mkdtempSync(join(tmpdir(),'device-messages-'));
 const store=new PersonalStore({path:join(directory,'personal.db')}),runtime=new Firmware(),bridge=new DebugSetup(runtime);
 const debug=new DuckDebug(store,bridge),setup=new ServoSetup(store,runtime);
 t.after(async()=>{await debug.close();await setup.close();store.close();rmSync(directory,{recursive:true,force:true});});
 return {store,runtime,debug,setup};
}
test('invalid debug operations have stable descriptors without changing their original error or contacting hardware',async t=>{
 const {debug,runtime}=fixture(t);
 await assert.rejects(debug.action({action:'unknown'}),error=>{
  assert.ok(error instanceof Error);assert.equal(error.message,'未知调试操作');
  assert.equal(Reflect.get(error,'code'),'device.debug.unknown_action');
  assert.deepEqual(Reflect.get(error,'params'),{});return true;
 });
 assert.deepEqual(runtime.calls,[]);
});
test('debug validation describes a known parameter label and preserves numeric bounds',async t=>{
 const {debug,runtime}=fixture(t);
 await assert.rejects(debug.action({action:'jog',id:12,delta:11}),error=>{
  assert.ok(error instanceof Error);assert.equal(error.message,'微动步幅 需要 -10–10 的整数');
  assert.equal(Reflect.get(error,'code'),'device.debug.integer');
  assert.deepEqual(Reflect.get(error,'params'),{name:'device.field.jog_step',low:-10,high:10});return true;
 });
 assert.deepEqual(runtime.calls,[]);
});
test('unknown controller diagnostics remain exact data in a localizable status descriptor',async t=>{
 const {debug,runtime}=fixture(t);const detail='controller trace E731 · ID12';
 runtime.before=async()=>{throw new Error(detail);};
 const status=await debug.status();assert.equal(status.error,detail);
 assert.equal(Reflect.get(status,'errorCode'),'device.diagnostic');
 assert.deepEqual(Reflect.get(status,'errorParams'),{detail});
 assert.ok(runtime.calls.every(call=>call.method==='GET'));
});
test('servo setup phase messages expose a descriptor alongside the existing text',async t=>{
 const {setup,runtime}=fixture(t);await setup.refresh();
 const deadline=Date.now()+2000;while(setup.running){assert.ok(Date.now()<deadline,'fake observation should complete');await immediate();}
 const snapshot=setup.snapshot();
 assert.equal(snapshot.message,'已读取当前在线舵机，配置时只连接一只。');
 assert.equal(Reflect.get(snapshot,'messageCode'),'device.setup.ready');
 assert.deepEqual(Reflect.get(snapshot,'messageParams'),{});
 assert.ok(runtime.calls.every(call=>!['set_id','set_gains','reset_mid'].includes(String(call.body?.action))));
});
test('setup keeps the existing HTTP error code and raw text while adding optional message metadata',()=>{
 const cause=new Error('USB trace E731'),error=new Offline(deviceMessage('device.runtime.003'),{cause});
 assert.equal(error.cause,cause);assert.ok(error instanceof SetupError);
 assert.deepEqual(errorPayload(error),{error:'USB 连接没有响应，请重新插接 UNO Q。',code:'request.invalid',params:{}});
 assert.equal(Reflect.get(error,'messageCode'),'device.runtime.003');assert.deepEqual(Reflect.get(error,'messageParams'),{});
 assert.equal(deviceFailure(error).code,'device.runtime.003');
});
test('empty unknown errors retain their raw text and never produce a visible placeholder token',()=>{
 assert.deepEqual(deviceFailure(new Error('')),{text:'',code:'device.diagnostic',params:{detail:''}});
});
