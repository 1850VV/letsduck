import {mkdtemp,readFile,rm,realpath,mkdir,readdir,stat,cp,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {PersonalStore,jsonStringify} from '@letsduck/storage';
import {DuckDebug,ServoSetup,Offline,IDS,MAP_VERSION,validatedUpdates} from '@letsduck/devices';
import type {DuckRuntime,PreparationCatalog} from '@letsduck/devices';
import {servoLeads} from '@letsduck/contracts';
import {ExportManager} from '@letsduck/exporter';
import {isJsonObject,parseWireJson} from '@letsduck/domain';
import {createPersonalHttp} from '../../packages/host/src/http.js';
import type {AssemblyManifest,HostExporter} from '../../packages/host/src/http-types.js';
import {Firmware} from '../../tooling/test/duck-debug-fixture.js';
import {BrowserGuide} from './guide-firmware.js';

const root=resolve(import.meta.dirname,'../..');
export class DisconnectedRuntime implements DuckRuntime {
 serial=null;port=null;closed=0;
 async connect():Promise<string>{throw new Offline('Fixture device is disconnected');}
 async request():Promise<never>{throw Error('Browser inventory checks must not issue device operations');}
 async halt():Promise<never>{throw Error('Browser inventory checks must not issue device operations');}
 async close():Promise<void>{this.closed++;}
}
export class BrowserFirmware extends Firmware {
 offline=false;
 private guide:BrowserGuide|null=null;
 constructor(private readonly options:{guide?:boolean;now?:()=>number}={}){super();this.restore();}
 restore():void{
  const fresh=new Firmware(this.options.guide?IDS:undefined);this.calls=[];this.motors=fresh.motors;this.state=fresh.state;delete this.state.servo_scan_version;
  Object.assign(this.state,{angles:Array.from({length:15},(_,i)=>i),targets:Array.from({length:15},(_,i)=>i+15)});
  this.fail=null;this.wrong=false;this.offline=false;this.pingDelay=8;
  this.guide=this.options.guide?new BrowserGuide(this,this.options.now??(()=>performance.now())):null;
  if(this.guide)this.state.guide_version=1;
 }
 guideStatus():Record<string,unknown>|null{return this.guide?.status()??null;}
 override async request(method:'GET'|'POST',path:string,body?:unknown):Promise<unknown>{
  if(this.offline)throw Error('隔离测试控制器已断开');
  this.guide?.advance();
  if(path.startsWith('/api/guide/')&&this.guide){
   this.calls.push({method,path,body:isJsonObject(body)?structuredClone(body):undefined});
   return parseWireJson(JSON.stringify(method==='GET'&&path==='/api/guide/status'?this.guide.status():this.guide.request(path,body)));
  }
  if(method==='POST'&&this.guide?.active)throw Error('release guide before other fixture control');
  if(method==='GET'&&path==='/servo.html')return super.request('GET','/api/status');
  if(method==='POST'&&['/api/action-scale','/api/filter','/api/imu-filter'].includes(path)&&isJsonObject(body)){
   const roller=this.state.roller,profile=isJsonObject(roller)&&roller.enabled?roller:this.state.deployment;
   if(!isJsonObject(profile))throw Error('Fixture profile missing');
   const keys:Record<string,string>={scale:'action_scale',leg:'action_alpha',head:'action_alpha_head'};
   for(const [key,value]of Object.entries(body))profile[keys[key]??key]=value;
  }
  return super.request(method,path,body);
 }
}
export interface FixtureOptions {mode:'debug'|'preparation';guide?:boolean;database?:string;confirmedLeads?:boolean;assets?:string;frontend?:string}
export async function createBrowserFixture(options:FixtureOptions){
 const directory=await mkdtemp(join(tmpdir(),'duck-browser-'));
 const runtime=options.mode==='debug'?new BrowserFirmware({guide:options.guide??false}):new DisconnectedRuntime();
 let manager:ExportManager|undefined,store:PersonalStore|undefined,setup:ServoSetup|undefined,debug:DuckDebug|undefined;
 let app:ReturnType<typeof createPersonalHttp>|undefined,closing:Promise<void>|undefined,stopping=false;
 const close=()=>closing??=(async()=>{
  stopping=true;const errors:unknown[]=[];const attempt=async(operation:()=>unknown)=>{try{await operation();}catch(error){errors.push(error);}};await attempt(()=>debug?.stopBackground());await attempt(()=>setup?.stopBackground());await attempt(()=>app?.waitRequests());await attempt(()=>app?.close());await attempt(()=>manager?.close());await attempt(()=>setup?.close());await attempt(()=>store?.close());await attempt(()=>rm(directory,{recursive:true,force:true}));if(errors.length)throw new AggregateError(errors,'Browser fixture cleanup failed');
 })();
 try{
  const database=options.database??join(directory,'personal.db');
  const temporary=await realpath(tmpdir()),parent=await realpath(resolve(database,'..'));
  if(parent!==temporary&&!parent.startsWith(temporary+sep))throw Error('Browser fixture requires a temporary SQLite path');
  const assets=options.assets??join(root,'assets'),frontend=options.frontend??process.env.DUCK_FRONTEND_DIST??join(root,'frontend/dist');
  await readFile(join(frontend,'index.html'));
  manager=new ExportManager({assets});await manager.ready;
  store=new PersonalStore({path:database,partIds:manager.metadata?.partIds??[]});
  const catalog:PreparationCatalog&{reportedRequirement:unknown}=structuredClone(servoLeads);
  if(options.confirmedLeads){const entry=catalog.requirements['11'];if(!entry)throw Error('Fixture lead slot missing');entry.connections=[{key:'fixture-a',cableClass:'long',lengthMm:200,to:'fixture-A',sourceStatus:'confirmed'},{key:'fixture-b',cableClass:'standard',lengthMm:100,to:'fixture-B',sourceStatus:'confirmed'}];}
  const seed=()=>{
   if(!store)throw Error('Fixture store missing');
   if(options.mode==='debug')for(const id of IDS)store.saveServoRecord('test-board',{id,sourceId:id,state:'verified',mapVersion:MAP_VERSION,profile:{kp:5,kd:id},readback:{ok:true,target_id:id,kp:5,kd:id,raw_pos:2200+id},verifiedAt:'fixture',midEvidence:'existing'});
   else{
    for(const [id,state]of [[10,'reported'],[11,'verified']] as const)store.saveServoRecord('fixture-board',{id,state,sourceId:id,actorId:'t_motor'+id,mapVersion:'tutorial-reference-1',oldIdAbsent:true,profile:{kp:5,kd:20},readback:{id,kp:5,kd:20,raw_pos:2047,center_pos:2047}});
    store.saveServoPreparation([{id:14,state:'picked'},{id:24,state:'installed'}]);
   }
  };
  seed();
  setup=new ServoSetup(store,runtime);debug=new DuckDebug(store,setup);
  const metadata=manager.metadata,exporter:HostExporter={get available(){return manager?.available??false;},catalog:metadata?.catalog??null,sourceSha256:metadata?.sourceSha256??null,run:manager.run.bind(manager)};
  const rawManifest:unknown=parseWireJson(await readFile(join(root,'scripts/assembly-assets.json'),'utf8'));
  if(!isJsonObject(rawManifest)||!isJsonObject(rawManifest.files))throw Error('Assembly allowlist missing');
  const assemblyManifest:AssemblyManifest={files:rawManifest.files,...(isJsonObject(rawManifest.optionalFiles)?{optionalFiles:rawManifest.optionalFiles}:{})};
  app=createPersonalHttp({assets,frontend,store,setup,debug,exporter,assemblyManifest,listenHost:'127.0.0.1'});
  const service=app,storage=store,device=debug;
  app.addHook('onRequest',async(request,reply)=>{
   if(stopping)return reply.code(503).send({error:'Fixture closing'});
   const path=request.raw.url?.split('?')[0];
   const body=async()=>{const chunks:Buffer[]=[];for await(const chunk of request.raw){if(!Buffer.isBuffer(chunk))throw Error('Fixture expected bytes');chunks.push(chunk);}const value:unknown=parseWireJson(Buffer.concat(chunks).toString('utf8'));if(!isJsonObject(value))throw Error('Fixture requires object');return value;};
   if(options.mode==='preparation'&&request.method==='GET'&&['/assemble','/assemble/','/assemble/index.html'].includes(path??''))return reply.header('x-duck-fixture-admission','preparation-only').type('text/html; charset=utf-8').send(await readFile(join(frontend,'assemble/index.html')));
   if(options.confirmedLeads&&request.method==='GET'&&path==='/assemble/servo-leads.json')return reply.type('application/json').send(jsonStringify(catalog));
   if(options.confirmedLeads&&request.method==='POST'&&path==='/api/servo-preparation')return reply.type('application/json').send(jsonStringify({records:storage.saveServoPreparation(validatedUpdates(await body(),catalog))}));
   if(!(runtime instanceof BrowserFirmware))return;
   if(request.method==='POST'&&path==='/api/fixture/offline'){runtime.offline=Boolean((await body()).offline);return reply.send({ok:true});}
   if(request.method==='POST'&&path==='/api/fixture/reset'){
    await device.action({action:'scan-stop'});const deadline=Date.now()+5000;while(device.scan.active){if(Date.now()>deadline)throw Error('Fixture scan did not stop');await delay(1);}
    runtime.restore();if(options.guide)await device.action({action:'guide-status'});device.readbacks.clear();device.pendingReadback.clear();device.held.clear();device.owned=false;device.calibrating=false;device.scan={active:false,checked:0,total:254,found:[],stopped:false,error:''};storage.db.exec('DELETE FROM servo_setup');seed();return reply.send({ok:true});
   }
   if(request.method==='GET'&&['/api/fixture','/api/fixture/state'].includes(path??''))return reply.type('application/json').send(jsonStringify({isolated:true,hardware:false,calls:runtime.calls.map(call=>[call.method,call.path,call.body??null]),motors:Object.fromEntries(runtime.motors),guide:runtime.guideStatus()}));
  });
  await service.listen({host:'127.0.0.1',port:0});const address=service.server.address();if(!address||typeof address==='string')throw Error('Fixture listener missing');
  return {url:`http://127.0.0.1:${address.port}`,catalog,app:service,store:storage,setup,debug,runtime,directory,close};
 }catch(error){await close();throw error;}
}

/** Community mode composes only the normal server host, with an owned temporary SQLite DB. */
export async function createCommunityBrowserFixture(frontend:string){
 const directory=await mkdtemp(join(tmpdir(),'duck-community-browser-'));
 const {startServer}=await import('@letsduck/host');
 try{
  const assets=join(directory,'assets');await mkdir(assets);for(const name of await readdir(join(root,'assets'))){const source=join(root,'assets',name);if((await stat(source)).isFile()){const target=join(assets,name);await cp(source,target,{dereference:true});await chmod(target,0o444);}}
  const host=await startServer({assets,frontend,database:join(directory,'community.db'),legacy:join(directory,'absent-legacy.db'),host:'127.0.0.1',port:0,quiet:true});
  let closing:Promise<void>|undefined;
  return {url:new URL(host.url).origin,directory,close:()=>closing??=(async()=>{try{await host.close();}finally{await rm(directory,{recursive:true,force:true});}})()};
 }catch(error){await rm(directory,{recursive:true,force:true});throw error;}
}
