import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync,mkdirSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,basename,relative,delimiter} from 'node:path';
import {connect} from 'node:net';
import {once} from 'node:events';

const repository=resolve(import.meta.dirname,'../..'),cli=join(repository,'tooling/src/historical-replay.ts');
interface Observation {args:string[];cwd:string;pid:number;port:number;readonly:boolean;env:Record<string,string|undefined>}
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'duck-replay-test-')),runner=join(root,'fake-python'),observation=join(root,'observation.json');
 writeFileSync(runner,`#!${process.execPath}\nconst fs=require('node:fs'),net=require('node:net');const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const keys=['DUCK_DB','DUCK_DATABASE_URL','DUCK_TEST_DATABASE_URL','DUCK_PERSONAL_DB','DUCK_LEGACY_DB','DUCK_ASSETS','TMPDIR','DUCK_ADB'];fs.writeFileSync(process.env.HISTORICAL_TEST_OBSERVATION,JSON.stringify({args:process.argv.slice(2),cwd:process.cwd(),pid:process.pid,port:server.address().port,readonly:(fs.statSync(process.cwd()).mode&0o222)===0,env:Object.fromEntries(keys.map(key=>[key,process.env[key]]))}));console.log('fake-runner-ready');if(process.env.HISTORICAL_FAKE_WAIT!=='1')server.close(()=>process.exit(Number(process.env.HISTORICAL_FAKE_EXIT||'0')));});for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));\n`,{mode:0o755});
 // A restricted PATH proves scheduler tests have no Python executable dependency.
 const bin=join(root,'bin');mkdirSync(bin);symlinkSync(process.execPath,join(bin,'node'));
 const git=(process.env.PATH??'').split(delimiter).map(directory=>join(directory,'git')).find(existsSync);assert.ok(git);symlinkSync(git,join(bin,'git'));
 const env={...process.env,PATH:bin,HISTORICAL_TEST_OBSERVATION:observation,DUCK_DB:join(root,'sentinel.db'),DUCK_DATABASE_URL:'mysql://external.invalid/real',DUCK_TEST_DATABASE_URL:'mysql://external.invalid/real',DUCK_ASSETS:join(root,'external-assets'),DUCK_ADB:'external-adb',PYTHON:'/must-not-run'};
 // The fake runner tests scheduling only; HEAD is available even in a shallow CI checkout.
 const args=['--import','tsx',cli,'--python',relative(repository,runner),'--revision','HEAD'];
 return{root,runner,observation,env,args,cleanup(){rmSync(root,{recursive:true,force:true});assert.equal(existsSync(root),false);}};
}
async function assertClean(observation:Observation){
 assert.equal(existsSync(observation.cwd),false,'reference directory must be removed');
 assert.ok(observation.env.TMPDIR);assert.equal(existsSync(observation.env.TMPDIR),false,'owned data must be removed');
 assert.throws(()=>process.kill(observation.pid,0),{code:'ESRCH'});
 await new Promise<void>((done,reject)=>{const socket=connect(observation.port,'127.0.0.1');socket.once('error',()=>done());socket.once('connect',()=>{socket.destroy();reject(Error('runner port leaked'));});});
}

test('historical replay schedules curated old suites in a readonly reference with isolated data and no Python in PATH',async()=>{
 const owned=fixture();try{
  for(const name of ['python','python3']){const error=spawnSync(name,['--version'],{env:owned.env}).error;assert.ok(error&&'code'in error);assert.equal(error.code,'ENOENT');}
  const run=spawnSync(process.execPath,owned.args,{cwd:repository,env:owned.env,encoding:'utf8',timeout:30000});assert.equal(run.status,0,run.stderr);
  const observed=JSON.parse(readFileSync(owned.observation,'utf8')) as Observation;
  assert.equal(observed.readonly,true);assert.deepEqual(observed.args.slice(0,3),['-I','-B','-c']);assert.ok(observed.args[4]);assert.equal(join(realpathSync(dirname(observed.args[4])),basename(observed.args[4])),observed.cwd);
  assert.ok(observed.args.includes('test_store'));assert.ok(observed.args.includes('test_personal.PersonalTests.test_busy_port_moves_to_the_next_one'));assert.equal(observed.args.some(name=>name.includes('test_mysql')),false);
  assert.equal(observed.env.DUCK_TEST_DATABASE_URL,undefined);assert.equal(observed.env.DUCK_ADB,undefined);assert.ok(observed.env.TMPDIR);
  for(const name of ['DUCK_DB','DUCK_PERSONAL_DB','DUCK_LEGACY_DB','DUCK_ASSETS'])assert.ok(observed.env[name]?.startsWith(observed.env.TMPDIR));
  assert.match(observed.env.DUCK_DATABASE_URL??'',/^sqlite:\/\//);assert.match(run.stdout,/historical_finished/);await assertClean(observed);
 }finally{owned.cleanup();}
});

test('historical replay preserves a failing runner exit status and removes its reference and temporary data',async()=>{
 const owned=fixture();try{
  const run=spawnSync(process.execPath,[...owned.args,'--suite','storage'],{cwd:repository,env:{...owned.env,HISTORICAL_FAKE_EXIT:'7'},encoding:'utf8',timeout:30000});
  assert.equal(run.status,7,run.stderr);const observed=JSON.parse(readFileSync(owned.observation,'utf8')) as Observation;
  assert.ok(observed.args.includes('test_migration'));assert.equal(observed.args.includes('test_filaments'),false);await assertClean(observed);
 }finally{owned.cleanup();}
});

for(const signal of ['SIGINT','SIGTERM'] as const)test(`historical replay ${signal} cancels its runner and removes both owned directories`,{skip:process.platform==='win32'?'POSIX signal lifecycle':false},async()=>{
 const owned=fixture();let child:ReturnType<typeof spawn>|undefined;
 try{
  child=spawn(process.execPath,owned.args,{cwd:repository,env:{...owned.env,HISTORICAL_FAKE_WAIT:'1'},stdio:['ignore','pipe','pipe']});const ownedChild=child;let output='',errors='';ownedChild.stderr?.on('data',data=>{errors+=String(data);});
  await new Promise<void>((done,reject)=>{const timer=setTimeout(()=>reject(Error('runner never started: '+errors)),30000);ownedChild.once('error',reject);ownedChild.once('exit',()=>{clearTimeout(timer);reject(Error('runner ended before cancellation: '+errors));});ownedChild.stdout?.on('data',data=>{output+=String(data);if(output.includes('fake-runner-ready')){clearTimeout(timer);done();}});});
  const observed=JSON.parse(readFileSync(owned.observation,'utf8')) as Observation,exited=once(ownedChild,'exit');ownedChild.kill(signal);const[code,childSignal]=await exited;
  assert.equal(code,signal==='SIGINT'?130:143,errors);assert.equal(childSignal,null);await assertClean(observed);
 }finally{
  if(child&&child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGTERM');await exited;}
  owned.cleanup();
 }
});

test('historical replay lists its explicit subset and rejects arbitrary suites before preparing a reference',()=>{
 const list=spawnSync(process.execPath,['--import','tsx',cli,'--list'],{cwd:repository,encoding:'utf8',timeout:30000});assert.equal(list.status,0,list.stderr);
 const value:unknown=JSON.parse(list.stdout);assert.ok(value&&typeof value==='object'&&'suites'in value);
 const invalid=spawnSync(process.execPath,['--import','tsx',cli,'--suite','test_servo_setup'],{cwd:repository,encoding:'utf8',timeout:30000});assert.equal(invalid.status,2);assert.match(invalid.stderr,/Unknown historical suite/);
});
