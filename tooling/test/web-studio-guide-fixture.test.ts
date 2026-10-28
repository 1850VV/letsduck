import test from 'node:test';
import assert from 'node:assert/strict';
import {IDS} from '@letsduck/devices';
import {isJsonObject} from '@letsduck/domain';
import {BrowserFirmware,createBrowserFixture} from '../../tests/browser/fixture.js';

const object=(value:unknown)=>{assert.ok(isJsonObject(value));return value;};
const raw=(status:Record<string,unknown>,key='actual_raw',index=2)=>{const value=status[key];assert.ok(Array.isArray(value));return Number(value[index]);};
const get=async(rt:BrowserFirmware)=>object(await rt.request('GET','/api/guide/status'));
const post=async(rt:BrowserFirmware,name:string,body:Record<string,unknown>={})=>object(await rt.request('POST','/api/guide/'+name,body));

test('opt-in guide fixture exposes all fifteen real fake motors and passive version-one status',async()=>{
 const rt=new BrowserFirmware({guide:true});
 const status=object(await rt.request('GET','/api/status')),guide=await get(rt);
 assert.equal(status.guide_version,1);assert.deepEqual(status.servo_ids,IDS);assert.deepEqual(guide.ids,IDS);
 assert.equal(guide.active,false);assert.equal(guide.enabled,false);assert.equal(guide.raw_mask,0x7fff);assert.equal(guide.imu_ok,true);
 assert.equal(guide.raw_source,'DQS1_angles_to_raw');assert.equal(guide.speed_raw_s,20);assert.equal(raw(guide),2212);
 assert.ok(rt.calls.every(call=>call.method==='GET'));
});
test('fake guide moves over elapsed samples at twenty raw per second and confirms final target after its command',async()=>{
 let now=0;const rt=new BrowserFirmware({guide:true,now:()=>now});
 const held=await post(rt,'hold'),token={session_id:held.session_id};
 assert.equal(held.enabled,true);assert.equal(held.arming,false);assert.equal(raw(held),raw(held,'target_raw'));
 const moving=await post(rt,'step',{...token,deltas:[{id:12,delta:5},{id:22,delta:-2}]});
 assert.equal(moving.state,'moving');assert.equal(raw(moving),2212);assert.equal(raw(moving,'target_raw'),2217);
 assert.ok(Number(moving.acknowledged_seq)<Number(moving.command_seq));
 now=100;const partial=await get(rt);assert.equal(raw(partial),2214);assert.equal(partial.state,'moving');assert.ok(Number(partial.sample_seq)>Number(moving.sample_seq));
 now=320;const reached=await get(rt);assert.equal(raw(reached),2217);assert.equal(raw(reached,'actual_raw',7),2220);assert.equal(reached.state,'holding');
 assert.ok(Number(reached.acknowledged_seq)>=Number(reached.command_seq));assert.ok(Number(reached.sample_seq)>Number(partial.sample_seq));
 assert.ok(Number(reached.sent_seq)>Number(reached.command_seq));
});
test('fake pause discards an unfinished target and release requires a later disabled feedback sample',async()=>{
 let now=0;const rt=new BrowserFirmware({guide:true,now:()=>now});const held=await post(rt,'hold'),token={session_id:held.session_id};
 await post(rt,'step',{...token,deltas:[{id:12,delta:10}]});now=100;
 const paused=await post(rt,'pause',token);assert.equal(paused.state,'paused');assert.equal(raw(paused),2214);assert.equal(raw(paused,'target_raw'),2214);
 now=400;const still=await get(rt);assert.equal(raw(still),2214);assert.equal(still.state,'paused');
 const released=await post(rt,'release',token);assert.equal(released.active,false);assert.equal(released.target_raw,null);assert.equal(released.enabled,true);
 now=420;const disabled=await get(rt);assert.equal(disabled.enabled,false);assert.ok(Number(disabled.sample_seq)>Number(released.sample_seq));
});
test('fake runtime rejects busy control, unreferenced mouth, wrong session and expired heartbeats',async()=>{
 let now=0;const rt=new BrowserFirmware({guide:true,now:()=>now});rt.state.mode='hold';rt.state.enabled=true;
 await assert.rejects(post(rt,'hold'));rt.state.mode='off';rt.state.enabled=true;
 await assert.rejects(post(rt,'hold'));rt.state.enabled=false;
 const held=await post(rt,'hold'),token={session_id:held.session_id};await assert.rejects(post(rt,'hold'));
 await assert.rejects(post(rt,'step',{...token,deltas:[{id:34,delta:1}]}));await assert.rejects(post(rt,'pause',{session_id:'old'}));
 await assert.rejects(rt.request('POST','/api/cal/enter',{}));
 now=1001;const expired=await get(rt);assert.equal(expired.active,false);assert.equal(expired.state,'fault');assert.match(String(expired.error),/heartbeat/);
 await assert.rejects(post(rt,'heartbeat',token));now=1020;assert.equal((await get(rt)).enabled,false);
});
test('guide browser fixture traverses the real HTTP action/backend and records runtime requests for browser assertions',async()=>{
 const f=await createBrowserFixture({mode:'debug',guide:true});
 const action=async(name:string,body:Record<string,unknown>={})=>{const response=await fetch(f.url+'/api/duck-debug/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:name,...body})});return {response,body:object(await response.json())};};
 try{
  const initial=await action('guide-status');assert.equal(initial.response.status,200);assert.equal(initial.body.board,'test-board');
  const held=await action('guide-hold');assert.equal(held.response.status,200);assert.equal(held.body.enabled,true);
  const token={session_id:held.body.session_id};const denied=await action('cal-enter');assert.equal(denied.response.status,422);
  const step=await action('guide-step',{...token,deltas:[{id:12,delta:5}]});assert.equal(step.body.state,'moving');
  const paused=await action('guide-pause',token);assert.equal(raw(paused.body,'target_raw'),raw(paused.body));
  const info=object(await(await fetch(f.url+'/api/fixture/state')).json());assert.equal(info.hardware,false);assert.ok(Array.isArray(info.calls));
  const calls=info.calls as unknown[][];assert.equal(calls.some(call=>call[0]==='POST'&&call[1]==='/api/cal/enter'),false);
  assert.ok(calls.some(call=>call[1]==='/api/guide/step'));assert.equal(object(info.guide).state,'paused');
  assert.equal((await action('guide-release',token)).response.status,200);
  assert.equal((await fetch(f.url+'/api/fixture/reset',{method:'POST'})).status,200);
  assert.equal((await action('guide-hold')).response.status,200);
 }finally{await f.close();assert.equal(f.app.server.address(),null);await assert.rejects(fetch(f.url));}
});
