import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startDesktopHost} from '../src/host.js';
import type {HostReply,ParentPort} from '../src/ipc.js';
class Port implements ParentPort{
 readonly replies:HostReply[]=[];
 private readonly listeners=new Set<(event:{data:unknown})=>void>();
 postMessage(message:HostReply){this.replies.push(message);}
 on(_event:'message',listener:(event:{data:unknown})=>void){this.listeners.add(listener);}
 off(_event:'message',listener:(event:{data:unknown})=>void){this.listeners.delete(listener);}
 send(data:unknown){for(const listener of this.listeners)listener({data});}
}
test('utility adapter fixes desktop origin/loopback and awaits shared host cleanup once',async()=>{
 const port=new Port();let closes=0,release:()=>void=()=>{};
 const held=new Promise<void>(resolve=>{release=resolve;});
 const session=await startDesktopHost({DUCK_ASSETS:'/owned/assets',DUCK_FRONTEND:'/owned/frontend',DUCK_PERSONAL_DB:'/owned/db'},port,async options=>{
  assert.equal(options.uiOrigin,'duck://app');assert.equal(options.host,'127.0.0.1');assert.equal(options.port,0);assert.equal(options.database,'/owned/db');
  return{url:'http://127.0.0.1:8123/',busy:true,close:async()=>{closes++;await held;}};
 });
 assert.deepEqual(port.replies,[{kind:'ready',url:'http://127.0.0.1:8123/'}]);
 port.send({kind:'busy',id:3});assert.deepEqual(port.replies.at(-1),{kind:'busy',id:3,busy:true});
 const stopped=session.stop();port.send({kind:'stop'});await Promise.resolve();assert.equal(closes,1);
 assert.equal(port.replies.some(reply=>reply.kind==='stopped'),false);release();await stopped;
 assert.equal(closes,1);assert.equal(port.replies.filter(reply=>reply.kind==='stopped').length,1);
});
test('utility startup failure reports the real failure without a false ready notification',async()=>{
 const port=new Port();await assert.rejects(startDesktopHost({DUCK_ASSETS:'/owned/assets',DUCK_FRONTEND:'/owned/web'},port,async()=>{throw new Error('synthetic startup failure');}),/synthetic startup failure/);
 assert.deepEqual(port.replies,[{kind:'failed',message:'synthetic startup failure'}]);
});
test('stop received during startup awaits initialization and closes without publishing ready',async()=>{
 const port=new Port();let ready:(value:{url:string;busy:boolean;close:()=>Promise<void>})=>void=()=>{},closes=0;
 const pending=startDesktopHost({DUCK_ASSETS:'/owned/assets',DUCK_FRONTEND:'/owned/web'},port,()=>new Promise(resolve=>{ready=resolve;}));
 port.send({kind:'stop'});ready({url:'http://127.0.0.1:8123/',busy:false,close:async()=>{closes++;}});
 const session=await pending;await session.stop();assert.equal(closes,1);assert.equal(port.replies.some(reply=>reply.kind==='ready'),false);
});
test('cleanup failure reports failed and preserves a nonzero utility exit status',async()=>{
 const port=new Port();let exit:unknown;
 const session=await startDesktopHost({DUCK_ASSETS:'/owned/assets',DUCK_FRONTEND:'/owned/web'},port,async()=>({url:'http://127.0.0.1:8123/',busy:false,close:async()=>{throw new Error('cleanup failed');}}),code=>{exit=code;});
 await assert.rejects(session.stop(),/cleanup failed/);
 assert.equal(exit,1);assert.deepEqual(port.replies.at(-1),{kind:'failed',message:'cleanup failed'});
});
