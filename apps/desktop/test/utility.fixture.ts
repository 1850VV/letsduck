/** Compiled into an owned temporary ESM entry by shell.browser.ts. */
import {app,utilityProcess} from 'electron';
import {join} from 'node:path';
import {parseHostReply} from '../src/ipc.js';
import type {HostReply} from '../src/ipc.js';
const profile=process.env.DUCK_DESKTOP_DATA,entry=process.env.DUCK_UTILITY_TEST_ENTRY,mode=process.env.DUCK_UTILITY_TEST_MODE;
if(!profile||!entry)throw new Error('Owned utility test configuration missing');
app.setPath('userData',profile);
void app.whenReady().then(()=>{
 const child=utilityProcess.fork(entry,[],{stdio:'pipe',serviceName:'LetsDuck isolated utility test',env:process.env});
 child.stderr?.on('data',data=>process.stderr.write(data));
 const replies:HostReply[]=[];
 child.on('message',(value:unknown)=>{const reply=parseHostReply(value);if(reply)replies.push(reply);});
 child.once('spawn',()=>{if(mode==='early-stop')child.postMessage({kind:'stop'});});
 child.once('exit',code=>{
  const expected=mode==='early-stop'?code===0&&replies.some(reply=>reply.kind==='stopped')&&!replies.some(reply=>reply.kind==='ready'):code===1&&replies.some(reply=>reply.kind==='failed');
  console.log(JSON.stringify({mode,utilityExit:code,utilityPid:child.pid,replies,expected,runtime:{electron:process.versions.electron,node:process.versions.node,sqlite:process.versions.sqlite},profile:join(profile)}));
  app.exit(expected?0:1);
 });
}).catch(error=>{console.error(error);app.exit(1);});
