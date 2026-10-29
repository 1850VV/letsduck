import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAutomaticNumbering} from '../frontend/debug/automatic.js';

function deferred(){let resolve=()=>{};const promise=new Promise<void>(done=>{resolve=done;});return {promise,resolve};}
function lifecycle(native:boolean){
 const keys=['document','window','Element','navigator','fetch'] as const;
 const saved=keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const),handlers:Record<string,unknown>={},calls:{path:string;init?:RequestInit|undefined}[]=[];
 const listen=(name:string,handler:unknown)=>{handlers[name]=handler;};
 class Target {dataset={autoAction:'start'};disabled=false;closest(){return this;}}
 const values={document:{body:{addEventListener:listen}},window:{addEventListener:listen},Element:Target,navigator:{sendBeacon(path:string){if(native)throw new TypeError('Beacons are only supported over HTTP(S).');calls.push({path});return true;}},fetch:async(path:string,init?:RequestInit)=>{calls.push({path,init});return new Response(JSON.stringify({phase:'idle',records:[],targetId:10,running:false,online:false,profile:null}));}};
 for(const key of keys)Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:values[key]});
 function dispatch(name:string,event?:unknown){const handler=handlers[name];assert.equal(typeof handler,'function');(handler as (event?:unknown)=>void)(event);}
 return {calls,dispatch,start:()=>dispatch('click',{target:new Target()}),restore(){try{dispatch('pagehide');}finally{for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}}};
}
test('native automatic exit sends a keepalive pause without HTTP-only beacon support',async()=>{
 const env=lifecycle(true),panel=createAutomaticNumbering({api:async()=>{},busy:()=>false,setBusy(){},select(){},render(){},poll:async()=>{}});
 try{await panel.enter();assert.doesNotThrow(()=>env.dispatch('pagehide'));assert.equal(panel.active,false);const pause=env.calls.find(call=>call.path==='/api/servo-setup/pause');assert.ok(pause);assert.equal(pause.init?.method,'POST');assert.equal(pause.init?.keepalive,true);assert.equal(pause.init?.body,'{}');}
 finally{env.restore();}
});
test('release acknowledgement after pagehide cannot restart automatic numbering',async()=>{
 const env=lifecycle(false),release=deferred(),done=deferred();let busy=false;
 const panel=createAutomaticNumbering({api:async()=>release.promise,busy:()=>busy,setBusy(value){busy=value;if(!value)done.resolve();},select(){},render(){},poll:async()=>{}});
 try{await panel.enter();env.start();assert.equal(busy,true);env.dispatch('pagehide');release.resolve();await done.promise;assert.equal(panel.active,false);assert.ok(env.calls.some(call=>call.path==='/api/servo-setup/pause'));assert.equal(env.calls.some(call=>call.path==='/api/servo-setup/start'),false);}
 finally{release.resolve();await done.promise;env.restore();}
});
