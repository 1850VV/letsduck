/** Optional old-Git oracle replay. Nothing in the normal Node build/test path runs Python. */
import {spawn,type ChildProcess} from 'node:child_process';
import {once} from 'node:events';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {prepareHistoricalSource,historicalRevision} from './historical-source.js';

/** Reviewed at d5c38e4: synthetic core/SQLite/loopback HTTP only. No asset/device/MySQL discovery. */
export const historicalSuites={
 core:['test_filaments','test_material_profiles','test_zip_reuse','test_export_transport_unit'],
 storage:['test_store','test_migration','test_store_scaling','test_i18n_errors'],
 http:[
  'test_personal.PersonalTests.test_files_are_revalidated_and_answers_never_stored',
  'test_personal.PersonalTests.test_schemes_persist_without_login',
  'test_personal.PersonalTests.test_validation_matches_the_server_edition',
  'test_personal.PersonalTests.test_accounts_and_gallery_do_not_exist',
  'test_personal.PersonalTests.test_static_files_and_asset_whitelist',
  'test_personal.PersonalTests.test_home_opens_at_root_and_the_studio_at_paint',
  'test_personal.PersonalTests.test_assembly_guide_serves_listed_local_assets_with_byte_ranges',
  'test_personal.PersonalTests.test_a_burst_of_module_requests_is_not_reset',
  'test_personal.PersonalTests.test_earlier_personal_schemes_are_carried_over_once',
  'test_personal.PersonalTests.test_busy_port_moves_to_the_next_one',
 ],
} as const;
type Suite=keyof typeof historicalSuites;

// The old modules run unchanged; this wrapper owns their environment and rejects hardware,
// external/previously-running services, processes and SQLite files outside the replay directory.
const bootstrap=String.raw`
import json, os, pathlib, socket, sys, tempfile, unittest
from urllib.parse import urlsplit, unquote
root=pathlib.Path(sys.argv[1]).resolve()
data=pathlib.Path(os.environ['TMPDIR']).resolve()
tempfile.tempdir=str(data)
sys.path[:0]=[str(root/'tests'),str(root/'personal'),str(root/'backend')]
def owned_path(value):
    path=pathlib.Path(value).resolve()
    return path==data or data in path.parents
def audit(event,args):
    if event in ('subprocess.Popen','os.system','os.exec','os.posix_spawn'):
        raise RuntimeError('Historical replay does not allow subprocesses or hardware tools')
    if event=='sqlite3.connect':
        value=str(args[0])
        if value==':memory:': return
        if value.startswith('file:'): value=unquote(urlsplit(value).path)
        if not owned_path(value): raise RuntimeError('Historical SQLite must remain in the owned data directory')
    if event=='open':
        path,mode,flags=args
        if isinstance(path,(str,bytes,os.PathLike)) and flags & (os.O_WRONLY|os.O_RDWR|os.O_CREAT|os.O_TRUNC|os.O_APPEND):
            if not owned_path(os.fsdecode(path)): raise RuntimeError('Historical writes must remain in the owned data directory')
sys.addaudithook(audit)
owned_ports=set()
class OwnedSocket(socket.socket):
    def bind(self,address):
        if self.family not in (socket.AF_INET,socket.AF_INET6) or address[0] not in ('127.0.0.1','::1','localhost') or address[1]==8876:
            raise RuntimeError('Historical HTTP may only bind disposable loopback ports')
        result=super().bind(address)
        owned_ports.add(self.getsockname()[1])
        return result
    def checked(self,address):
        if not isinstance(address,tuple) or address[0] not in ('127.0.0.1','::1','localhost') or address[1] not in owned_ports:
            raise RuntimeError('Historical replay may only connect to its own loopback listeners')
    def connect(self,address):
        self.checked(address)
        return super().connect(address)
    def connect_ex(self,address):
        self.checked(address)
        return super().connect_ex(address)
socket.socket=OwnedSocket
import servo_setup
class OfflineRuntime:
    serial=None
    port=None
    def connect(self,*args,**kwargs): raise RuntimeError('Historical replay cannot access hardware')
    def request(self,*args,**kwargs): raise RuntimeError('Historical replay cannot access hardware')
    def halt(self,*args,**kwargs): raise RuntimeError('Historical replay cannot access hardware')
    def close(self): pass
servo_setup.AdbRuntime=OfflineRuntime
suite=unittest.defaultTestLoader.loadTestsFromNames(sys.argv[2:])
print(json.dumps(dict(status='historical_suite',tests=suite.countTestCases(),selectors=sys.argv[2:])),flush=True)
result=unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
`;

interface ReplayOptions {python?:string;revision?:string;repository?:string;suites:Suite[]}
const signalCode=(signal:NodeJS.Signals|null)=>signal==='SIGINT'?130:signal==='SIGTERM'?143:signal==='SIGKILL'?137:1;
async function stop(child:ChildProcess|undefined,signal:NodeJS.Signals){
 if(!child?.pid||child.exitCode!==null||child.signalCode!==null)return;
 const ended=once(child,'exit');child.kill(signal);const timer=setTimeout(()=>child.kill('SIGKILL'),5000);
 try{await ended;}finally{clearTimeout(timer);}
}
export async function replayHistorical(options:ReplayOptions):Promise<number>{
 const repository=resolve(options.repository??resolve(import.meta.dirname,'../..'));
 const venv=join(repository,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
 const requestedPython=options.python??(existsSync(venv)?venv:'python3');
 const python=/[/\\]/.test(requestedPython)?resolve(requestedPython):requestedPython;
 let reference:Awaited<ReturnType<typeof prepareHistoricalSource>>|undefined,referenceAcquisition:ReturnType<typeof prepareHistoricalSource>|undefined,child:ChildProcess|undefined,cancelled:NodeJS.Signals|undefined,cleanupPromise:Promise<void>|undefined;
 const dataAcquisition=mkdtemp(join(tmpdir(),'duck-historical-replay-')).then(async data=>{await mkdir(join(data,'assets'));return data;});
 const cleanup=()=>cleanupPromise??=(async()=>{
  await stop(child,cancelled??'SIGTERM');
  const acquired=reference??await referenceAcquisition?.catch(()=>undefined);
  try{await acquired?.cleanup();}finally{await rm(await dataAcquisition,{recursive:true,force:true});}
 })();
 const interrupt=(signal:NodeJS.Signals)=>{cancelled??=signal;void cleanup().catch(error=>console.error(error)).finally(()=>{process.exitCode=signalCode(cancelled??null);});};
 const onInt=()=>interrupt('SIGINT'),onTerm=()=>interrupt('SIGTERM');process.once('SIGINT',onInt);process.once('SIGTERM',onTerm);
 try{
  const data=await dataAcquisition;if(cancelled)return signalCode(cancelled);
  const assets=join(data,'assets');
  referenceAcquisition=prepareHistoricalSource({repository,revision:options.revision??historicalRevision});reference=await referenceAcquisition;
  if(cancelled)return signalCode(cancelled);
  const env:NodeJS.ProcessEnv={...process.env};
  for(const key of Object.keys(env))if(key.startsWith('DUCK_')||/^(?:http|https|all)_proxy$/i.test(key))delete env[key];
  Object.assign(env,{DUCK_DB:join(data,'server.db'),DUCK_DATABASE_URL:'sqlite:///'+join(data,'server.db').replaceAll('\\','/'),DUCK_PERSONAL_DB:join(data,'personal.db'),DUCK_LEGACY_DB:join(data,'absent-legacy.db'),DUCK_ASSETS:assets,TMPDIR:data,TMP:data,TEMP:data,NO_PROXY:'127.0.0.1,localhost,::1'});
  const selectors=[...new Set(options.suites.flatMap(suite=>[...historicalSuites[suite]]))];
  const runner=spawn(python,['-I','-B','-c',bootstrap,reference.root,...selectors],{cwd:reference.root,env,stdio:['ignore','pipe','pipe']});child=runner;
  runner.stdout?.pipe(process.stdout);runner.stderr?.pipe(process.stderr);
  console.log(JSON.stringify({status:'historical_started',engine:'historical-python',revision:reference.revision,referenceDirectory:reference.root,dataDirectory:data,runnerPid:child.pid,suites:options.suites,python}));
  const[code,signal]=await new Promise<[number|null,NodeJS.Signals|null]>((done,reject)=>{runner.once('error',reject);runner.once('exit',(code,signal)=>done([code,signal]));});
  const exitCode=cancelled?signalCode(cancelled):code??signalCode(signal);
  console.log(JSON.stringify({status:'historical_finished',exitCode,signal}));return exitCode;
 }finally{
  try{await cleanup();}finally{process.removeListener('SIGINT',onInt);process.removeListener('SIGTERM',onTerm);}
 }
}

function readArgs(argv:string[]){return parseArgs({args:argv,options:{python:{type:'string'},revision:{type:'string'},repository:{type:'string'},suite:{type:'string',multiple:true},list:{type:'boolean'},help:{type:'boolean'}},strict:true,allowPositionals:false});}
export async function main(argv=process.argv.slice(2)):Promise<number>{
 let parsed:ReturnType<typeof readArgs>;
 try{parsed=readArgs(argv);}
 catch(error){console.error(error instanceof Error?error.message:String(error));return 2;}
 const values=parsed.values;
 if(values.help){console.log('historical-replay [--python executable] [--revision commit] [--repository path] [--suite core|storage|http ...] [--list]\nExplicit old-Git Python oracle only; safe subset, owned temporary SQLite/assets, no hardware.');return 0;}
 if(values.list){console.log(JSON.stringify({revision:historicalRevision,suites:historicalSuites}));return 0;}
 const requested=values.suite??Object.keys(historicalSuites),suites:Suite[]=[];
 for(const value of typeof requested==='string'?[requested]:requested){if(value!=='core'&&value!=='storage'&&value!=='http'){console.error('Unknown historical suite: '+value);return 2;}suites.push(value);}
 const options:ReplayOptions={suites};if(values.python!==undefined)options.python=values.python;if(values.revision!==undefined)options.revision=values.revision;if(values.repository!==undefined)options.repository=values.repository;
 try{return await replayHistorical(options);}
 catch(error){console.error(error instanceof Error?error.message:String(error));return 1;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=await main();
