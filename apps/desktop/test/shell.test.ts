import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {APP_ORIGIN,externalURL,localPermission,localURL,proxyURL} from '../src/navigation.js';
import {desktopPaths} from '../src/paths.js';
import {parseDesktopState,parseHostReply,parseHostRequest,trustedFrame} from '../src/ipc.js';
import {activityCounter,createProtocolHandler,reserveDownloadPath} from '../src/protocol.js';

test('keeps a stable private application origin while preserving paths and queries',()=>{
 assert.equal(APP_ORIGIN,'duck://app');
 assert.equal(proxyURL('duck://app/paint?scheme=test#part','http://127.0.0.1:8123/'),'http://127.0.0.1:8123/paint?scheme=test');
 for(const url of ['https://app/','duck://elsewhere/','duck://app:99/','duck://user@app/'])assert.equal(localURL(url),false);
 assert.equal(localURL('duck://app/assemble/?step=12#pick'),true);
 assert.equal(externalURL('https://example.com/docs'),true);
 assert.equal(externalURL(['https://', 'user:password', '@example.com'].join('')),false);
 assert.equal(externalURL('file:///private/file'),false);
});
test('permits existing copy and video fullscreen actions only for the local app',()=>{
 assert.equal(localPermission('duck://app/paint','clipboard-sanitized-write'),true);
 assert.equal(localPermission('duck://app/assemble/','fullscreen'),true);
 assert.equal(localPermission('duck://app/','clipboard-read'),false);
 assert.equal(localPermission('https://example.com','fullscreen'),false);
});

test('network-path duck URLs cannot replace the backend authority or receive trusted IPC',async()=>{
 const sender={};let fetched=0;
 const handler=createProtocolHandler({backend:'http://127.0.0.1:8123/',panel:async()=>'',write:()=>{},fetch:async()=>{fetched++;return new Response('external HTML');}});
 for(const url of ['duck://app//127.0.0.1:49755/attacker.html','duck://app/\\127.0.0.1:49755/attacker.html']){
  assert.equal(new URL(proxyURL(url,'http://127.0.0.1:8123/')).origin,'http://127.0.0.1:8123');
  assert.equal(localURL(url),false);
  const mainFrame={url};assert.equal(trustedFrame({sender,senderFrame:mainFrame},{sender,mainFrame}),false);
  assert.equal((await handler(new Request(url))).status,403);
 }
 assert.equal(fetched,0);
 assert.equal(proxyURL('duck://app/paint//part?next=//example.invalid','http://127.0.0.1:8123/'),'http://127.0.0.1:8123/paint//part?next=//example.invalid');
});

test('packaged runtime paths use app/resources roots and preserve explicit overrides',()=>{
 const app=resolve('/app'),resources=resolve('/resources'),profile=resolve('/profile'),owned=resolve('/owned');
 const packaged=desktopPaths({packaged:true,moduleDirectory:resolve('/ignored'),appPath:app,resourcesPath:resources,appData:profile,env:{}});
 assert.equal(packaged.host,join(app,'apps/desktop/dist/host.js'));
 assert.equal(packaged.preload,join(app,'apps/desktop/dist/preload.cjs'));
 assert.equal(packaged.frontend,join(resources,'runtime/frontend'));
 assert.equal(packaged.assets,join(resources,'runtime/assets'));
 assert.equal(packaged.userData,join(profile,'letsduck'));
 assert.equal('database' in packaged,false,'Database default remains shared DoodleDuck location');
 const dev=desktopPaths({packaged:false,moduleDirectory:resolve('/repo/apps/desktop/dist'),appPath:resolve('/unused'),resourcesPath:resolve('/unused'),appData:profile,env:{DUCK_ASSETS:join(owned,'assets'),DUCK_FRONTEND:join(owned,'web'),DUCK_ASSEMBLY_MANIFEST:join(owned,'media.json'),DUCK_DESKTOP_DATA:join(owned,'profile')}});
 assert.equal(dev.assets,join(owned,'assets'));assert.equal(dev.frontend,join(owned,'web'));assert.equal(dev.assemblyManifest,join(owned,'media.json'));assert.equal(dev.userData,join(owned,'profile'));
});

test('IPC validates host messages, update DTOs and the exact trusted main frame',()=>{
 assert.deepEqual(parseHostRequest({kind:'busy',id:1}),{kind:'busy',id:1});
 assert.equal(parseHostRequest({kind:'busy',id:1.5}),undefined);
 assert.equal(parseHostReply({kind:'ready',url:'https://example.com/'}),undefined);
 assert.deepEqual(parseHostReply({kind:'ready',url:'http://127.0.0.1:8123/'}),{kind:'ready',url:'http://127.0.0.1:8123/'});
 assert.equal(parseDesktopState({phase:'downloading',percent:NaN,currentVersion:'1.0.0'}),undefined);
 assert.deepEqual(parseDesktopState({phase:'available',version:'2.0.0',currentVersion:'1.0.0'}),{phase:'available',version:'2.0.0',currentVersion:'1.0.0'});
 const sender={},mainFrame={url:'duck://app/'};
 assert.equal(trustedFrame({sender,senderFrame:mainFrame},{sender,mainFrame}),true);
 assert.equal(trustedFrame({sender,senderFrame:{url:'duck://app/'}},{sender,mainFrame}),false);
 assert.equal(trustedFrame({sender:{},senderFrame:mainFrame},{sender,mainFrame}),false);
});

test('protocol preserves request origin/body/query and safe redirects, and releases write accounting',async()=>{
 const calls:{url:string;origin:string|null;host:string|null;length:string|null;body:string}[]=[];let writes=0;
 const handler=createProtocolHandler({backend:'http://127.0.0.1:8123/',panel:()=>Promise.resolve('export {};'),copy:()=>Promise.resolve('export const copy = {};'),write:delta=>{writes+=delta;},fetch:async(input,init)=>{
  const request=new Request(input,init);calls.push({url:request.url,origin:request.headers.get('origin'),host:request.headers.get('host'),length:request.headers.get('content-length'),body:await request.text()});
  return new Response('saved',{status:302,headers:{location:'http://127.0.0.1:8123/paint?scheme=one'}});
 }});
 const result=await handler(new Request('duck://app/api/schemes/one?x=1',{method:'PUT',headers:{origin:APP_ORIGIN,host:'untrusted','content-type':'application/json'},body:'{"name":"one"}'}));
 assert.equal(result.headers.get('location'),'duck://app/paint?scheme=one');
 assert.deepEqual(calls,[{url:'http://127.0.0.1:8123/api/schemes/one?x=1',origin:APP_ORIGIN,host:null,length:'14',body:'{"name":"one"}'}]);assert.equal(writes,1,'Response body still owns its in-flight write');
 assert.equal(await result.text(),'saved');assert.equal(writes,0);
 const cancelled=await handler(new Request('duck://app/api/schemes/cancelled',{method:'PUT',body:'{}'}));assert.equal(writes,1);
 await cancelled.body?.cancel();assert.equal(writes,0,'Cancelled response releases its write exactly once');
 assert.equal(await(await handler(new Request('duck://app/__desktop/update-panel.js'))).text(),'export {};');
 assert.equal(await(await handler(new Request('duck://app/__desktop/copy.js'))).text(),'export const copy = {};');
 const failed=createProtocolHandler({backend:'http://127.0.0.1:8123/',panel:async()=>'',write:delta=>{writes+=delta;},fetch:async()=>{throw new Error('offline');}});
 await assert.rejects(failed(new Request('duck://app/api/export',{method:'POST'})),/offline/);assert.equal(writes,0);
 const external=createProtocolHandler({backend:'http://127.0.0.1:8123/',panel:async()=>'',write:()=>{},fetch:async()=>new Response(null,{status:302,headers:{location:'https://example.com/'}})});
 assert.equal((await external(new Request('duck://app/'))).status,502);
 assert.equal((await external(new Request('duck://other/'))).status,403);
});

test('native download reservations never overwrite files or simultaneous pending downloads',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-desktop-download-')),reserved=new Set<string>();
 try{await writeFile(join(root,'model.3mf'),'retained');
  assert.equal(reserveDownloadPath(root,'../../model.3mf',reserved),join(root,'model (1).3mf'));
  assert.equal(reserveDownloadPath(root,'model.3mf',reserved),join(root,'model (2).3mf'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('ordinary quit drains every existing write/download and rejects new writes',async()=>{
 const activity=activityCounter();activity.change(1);activity.change(1);let drained=false;
 const done=activity.wait().then(()=>{drained=true;});activity.change(-1);await Promise.resolve();assert.equal(drained,false);
 activity.change(-1);await done;assert.equal(drained,true);
 const handler=createProtocolHandler({backend:'http://127.0.0.1:8123/',panel:async()=>'',write:()=>{},accepting:()=>false,fetch:async()=>{throw new Error('New write reached host while quitting');}});
 assert.equal((await handler(new Request('duck://app/api/schemes/one',{method:'PUT',body:'{}'}))).status,503);
});
