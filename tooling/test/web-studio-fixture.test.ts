import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {once} from 'node:events';
import {access} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserFixture,BrowserFirmware} from '../../tests/browser/fixture.js';
import {IDS} from '@letsduck/devices';
import {isJsonObject} from '@letsduck/domain';

test('isolated debug fixture preserves all historical IDs and live fake motors, then closes every listener',async()=>{
 const f=await createBrowserFixture({mode:'debug'});
 try{
  const numbering:unknown=await(await fetch(f.url+'/api/duck-debug/numbering')).json();assert.ok(isJsonObject(numbering));assert.equal(numbering.ready,true);assert.deepEqual(numbering.verifiedIds,IDS);
  const status:unknown=await(await fetch(f.url+'/api/duck-debug/status')).json();assert.ok(isJsonObject(status));assert.deepEqual(status.onlineIds,[12,13,14]);
  assert.ok(f.runtime instanceof BrowserFirmware);assert.ok(f.runtime.calls.every(call=>call.method==='GET'));
 }finally{await f.close();assert.equal(f.app.server.address(),null);await assert.rejects(fetch(f.url));}
});

test('debug reset restores fake firmware and seeded history after a fake write or disconnect',async()=>{
 const f=await createBrowserFixture({mode:'debug'});
 try{
  assert.ok(f.runtime instanceof BrowserFirmware);
  await f.debug.action({action:'parameters',id:12,new_id:22,kp:5,kd:12});assert.ok(f.runtime.motors.has(22));
  await fetch(f.url+'/api/fixture/offline',{method:'POST',headers:{'content-type':'application/json'},body:'{"offline":true}'});
  const offline:unknown=await(await fetch(f.url+'/api/duck-debug/status')).json();assert.ok(isJsonObject(offline));assert.equal(offline.connected,false);
  const reset=await fetch(f.url+'/api/fixture/reset',{method:'POST'});assert.equal(reset.status,200);
  assert.deepEqual([...f.runtime.motors.keys()],[12,13,14]);assert.equal(f.runtime.offline,false);assert.equal(f.debug.numbering().ready,true);assert.equal(f.debug.held.size,0);
  const info:unknown=await(await fetch(f.url+'/api/fixture')).json();assert.ok(isJsonObject(info));assert.ok(Array.isArray(info.calls));assert.deepEqual(Object.keys(isJsonObject(info.motors)?info.motors:{}),['12','13','14']);
 }finally{await f.close();assert.equal(f.app.server.address(),null);}
});

test('preparation fixture retains missing numbering and explicit lead declarations in an owned database',async()=>{
 const f=await createBrowserFixture({mode:'preparation',confirmedLeads:true});
 try{
  assert.equal(f.debug.numbering().ready,false);assert.deepEqual(f.store.servoRecords().map(row=>[row.id,row.state]),[[10,'reported'],[11,'verified']]);
  assert.deepEqual(f.store.servoPreparationRecords().map(row=>[row.id,row.state]),[[14,'picked'],[24,'installed']]);
  const page=await fetch(f.url+'/assemble/',{redirect:'manual'});assert.equal(page.status,200);assert.equal(page.headers.get('x-duck-fixture-admission'),'preparation-only');assert.match(await page.text(),/\/static\/assemble-[\w-]+\.js/);
  const saved=await fetch(f.url+'/api/servo-preparation',{method:'POST',headers:{'content-type':'application/json'},body:'{"ids":[11],"preparedLeads":["fixture-a","fixture-b"]}'});assert.equal(saved.status,200);assert.deepEqual(f.store.servoPreparationRecords().find(row=>row.id===11)?.preparedLeads,['fixture-a','fixture-b']);
  await assert.rejects(f.runtime.request('POST','/api/servo',{}),/must not issue device operations/);
 }finally{await f.close();assert.equal(f.app.server.address(),null);}
});

test('the normal product admission still redirects missing numbering, outside the preparation-only fixture override',async()=>{
 const f=await createBrowserFixture({mode:'debug'});
 try{
  f.store.db.exec('DELETE FROM servo_setup WHERE id=34');assert.equal(f.debug.numbering().ready,false);
  const response=await fetch(f.url+'/assemble/',{redirect:'manual'});assert.equal(response.status,303);assert.equal(response.headers.get('location'),'/debug/?from=assemble');
 }finally{await f.close();assert.equal(f.store.db.isOpen,false);assert.equal(f.runtime.closed,1);}
});

test('standalone fixture CLI publishes its allocated port and removes its resources after SIGTERM',async()=>{
 const child=spawn(process.execPath,['--import','tsx','tests/debug_browser_fixture.ts'],{stdio:['ignore','pipe','pipe']});
 let url='',temporaryDirectory='';
 try{
  const lines=createInterface({input:child.stdout}),entry=await Promise.race([once(lines,'line'),once(child,'exit').then(()=>{throw Error('Fixture failed before listening');})]);lines.close();
  const raw:unknown=JSON.parse(String(entry[0]));assert.ok(isJsonObject(raw));assert.equal(raw.isolated,true);assert.equal(raw.hardware,false);assert.equal(typeof raw.url,'string');assert.equal(typeof raw.temporaryDirectory,'string');
  if(typeof raw.url!=='string'||typeof raw.temporaryDirectory!=='string')throw Error('Fixture receipt malformed');url=raw.url;temporaryDirectory=raw.temporaryDirectory;
  assert.notEqual(new URL(url).port,'8876');assert.equal((await fetch(url+'/api/health')).status,200);
 }finally{
  if(child.exitCode===null){child.kill('SIGTERM');await once(child,'exit');}assert.equal(child.exitCode,0);assert.ok(child.pid);const ownedPid=child.pid;assert.throws(()=>process.kill(ownedPid,0));
  if(url)await assert.rejects(fetch(url));if(temporaryDirectory)await assert.rejects(access(temporaryDirectory));
 }
});
