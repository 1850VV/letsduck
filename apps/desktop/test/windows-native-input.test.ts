/** Runnable command-boundary tests. The child fixture does not compile C# or send Windows input. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,readFile,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {windowsNativeInput,windowsPowerShell} from '../scripts/windows-native-input.js';
import type {NativeCommandRunner} from '../scripts/windows-native-input.js';

async function fixture(mode='success'){
 const owned=await mkdtemp(join(tmpdir(),'duck-native-prepare-')),program=join(owned,'command.cjs'),log=join(owned,'commands.jsonl'),calls:Array<{args:string[];timeout:number}>=[];
 await writeFile(program,String.raw`const fs=require('node:fs');
const [log,mode,...args]=process.argv.slice(2),value=key=>args[args.indexOf(key)+1],action=value('-Action'),assembly=value('-NativeAssembly');
fs.appendFileSync(log,JSON.stringify({action,assembly})+'\n');
const progress=value('-DiagnosticPath');
if(!assembly)throw new Error('Every command must receive the owned assembly path');
if(action==='prepare'){
 fs.writeFileSync(progress,JSON.stringify({stage:'compiling-native-types'}));
 if(mode==='compile-fails'){process.stderr.write('compile fixture failed');process.exit(2);}
 fs.writeFileSync(assembly,'owned fake assembly');
 fs.writeFileSync(progress,JSON.stringify({stage:'native-types-ready'}));
 console.log(JSON.stringify({action:'prepare',assembly:mode==='wrong-assembly'?assembly+'.wrong':assembly}));
}else{
 if(!fs.existsSync(assembly))throw new Error('Action reached child before assembly preparation');
 if(mode==='action-fails'){process.stderr.write('action fixture failed');process.exit(3);}
 fs.writeFileSync(progress,JSON.stringify({stage:'action-complete'}));
 console.log(JSON.stringify({inputDesktopAvailable:true,sessionId:2,screen:{x:0,y:0,width:1024,height:768},workArea:{x:0,y:0,width:1024,height:720}}));
}
`);
 const run=promisify(execFile),command:NativeCommandRunner=async(_executable,args,options)=>{calls.push({args,timeout:options.timeout});return run(process.execPath,[program,log,mode,...args],options);};
 const evidence:unknown[]=[],input=windowsNativeInput({script:join(owned,'native-input.ps1'),output:owned,page:()=>{throw Error('No browser belongs to this command fixture');},target:async()=>({window:'',ownedPids:[]}),evidence,check:(name,passed)=>assert.ok(passed,name),run:command});
 return{owned,input,calls,evidence,async commands(){return(await readFile(log,'utf8')).trim().split('\n').map(line=>JSON.parse(line) as {action:string;assembly:string});},dispose:()=>rm(owned,{recursive:true,force:true})};
}

test('one owned preparation command runs once and later commands receive that same assembly',async()=>{
 const first=await fixture(),second=await fixture();
 try{
  await Promise.all([first.input.prepare(),first.input.prepare()]);await first.input.prepare();
  assert.equal(first.calls.length,1,'Preparing the same owned helper must launch exactly one compiler command');
  assert.equal((await first.commands())[0]!.action,'prepare');
  assert.equal(await readFile(join(first.owned,'native-input.dll'),'utf8'),'owned fake assembly');
  await first.input.desktop();await first.input.desktop();await second.input.prepare();
  const commands=await first.commands();
  assert.deepEqual(commands.map(command=>command.action),['prepare','desktop','desktop']);
  assert.ok(commands.every(command=>command.assembly===join(first.owned,'native-input.dll')));
  assert.equal((await second.commands())[0]!.assembly,join(second.owned,'native-input.dll'),'A separate owned run must prepare its own assembly');
  assert.ok(first.calls.every(call=>call.timeout===30_000),'The existing command deadline must remain unchanged');
 }finally{await first.dispose();await second.dispose();}
});

test('native commands are refused before preparation without launching a helper',async()=>{
 const value=await fixture();
 try{await assert.rejects(value.input.desktop(),/must be prepared/);assert.equal(value.calls.length,0);}finally{await value.dispose();}
});

test('failed compilation remains failed and never permits a native command or automatic compile retry',async()=>{
 const value=await fixture('compile-fails');
 try{
  await assert.rejects(value.input.prepare(),/compile fixture failed/);
  await assert.rejects(value.input.prepare(),/compile fixture failed/);
  await assert.rejects(value.input.desktop(),/must be prepared/);
  assert.deepEqual((await value.commands()).map(command=>command.action),['prepare']);
 }finally{await value.dispose();}
});

test('a mismatched compiler receipt cannot enable native input',async()=>{
 const value=await fixture('wrong-assembly');
 try{
  await assert.rejects(value.input.prepare(),/owned assembly/);
  await assert.rejects(value.input.desktop(),/must be prepared/);
  assert.deepEqual((await value.commands()).map(command=>command.action),['prepare']);
 }finally{await value.dispose();}
});

test('a failed action is reported once without replaying input',async()=>{
 const value=await fixture('action-fails');
 try{
  await value.input.prepare();
  assert.equal(value.calls.length,1,'Preparation must complete before testing an action failure');
  await assert.rejects(value.input.native('click'),/action fixture failed/);
  assert.deepEqual((await value.commands()).map(command=>command.action),['prepare','click']);
 }finally{await value.dispose();}
});

test('Windows compiles the owned C# DLL and a separate PowerShell process loads it without input',{skip:process.platform!=='win32'?'Real Windows PowerShell and .NET Framework are required':false},async()=>{
 const owned=await mkdtemp(join(tmpdir(),'duck-native-real-compile-')),assembly=join(owned,'native-input.dll');
 const input=windowsNativeInput({script:join(owned,'native-input.ps1'),output:owned,page:()=>{throw Error('Compilation does not use a browser');},target:async()=>({window:'',ownedPids:[]}),evidence:[],check:(name,passed)=>assert.ok(passed,name)});
 try{
  await input.prepare();const first=await stat(assembly);
  assert.equal((await readFile(assembly)).subarray(0,2).toString(),'MZ','The compiler must produce an actual Windows DLL');
  const run=promisify(execFile),loaded=await run(windowsPowerShell,['-NoProfile','-NonInteractive','-Command','Add-Type -Path $env:DUCK_TEST_NATIVE_ASSEMBLY; [DuckNative].FullName'],{env:{...process.env,DUCK_TEST_NATIVE_ASSEMBLY:assembly},timeout:30_000});
  assert.equal(loaded.stdout.trim(),'DuckNative','A fresh process loads the compiled native type without compiling it again');
  await input.prepare();assert.equal((await stat(assembly)).mtimeMs,first.mtimeMs);
 }finally{await rm(owned,{recursive:true,force:true});}
});
