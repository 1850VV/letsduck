// Explicit diagnostic only: npx tsx THIS_FILE [repository]. No services/assets/Python.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';

// Independently measured old MJS on macOS/Linux: near-gimbal Euler asin
// amplifies 2.22e-16 at its input to 1.09e-8 rad. Seven decimals preserve
// sub-micron positions while keeping structure/strings/integers exact.
const revision='d5c38e4fa890a4eca40d8857317ac463163b46c3',digits=7,quantum=1e-7;
const repository=resolve(process.argv[2]??'.');
const reference=await mkdtemp(join(process.env.RUNNER_TEMP??tmpdir(),'duck-assembly-reference-'));
const sha=(text:string)=>createHash('sha256').update(text).digest('hex');
function object(value:unknown):value is Record<string,unknown>{return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function canonical(value:unknown):string{
 const result=JSON.stringify(value,(_key:string,item:unknown)=>{
  if(typeof item!=='number')return item;
  assert.ok(Number.isFinite(item),'Assembly values must be finite');
  return Number(item.toFixed(digits));
 });
 assert.ok(typeof result==='string');return result;
}
function capture(module:unknown){
 assert.ok(object(module)&&object(module.ACTORS)&&Array.isArray(module.STEPS)&&Array.isArray(module.CHAPTERS)&&typeof module.snapshot==='function','Invalid independent assembly module');
 const {ACTORS,STEPS,CHAPTERS,snapshot}=module;
 const snapshots=STEPS.map((_:unknown,index:number)=>[0,.2,.5,1].map((progress):unknown=>snapshot(index,progress)));
 return {ACTORS,STEPS,CHAPTERS,snapshots};
}
try{
 const resolved=execFileSync('git',['rev-parse',revision+'^{commit}'],{cwd:repository,encoding:'utf8'}).trim();
 assert.equal(resolved,revision);
 const archive=execFileSync('git',['archive','--format=tar',revision,'frontend','package.json'],{cwd:repository,maxBuffer:64<<20});
 execFileSync('tar',['-xf','-','-C',reference],{input:archive});
 const old=capture(await import(pathToFileURL(join(reference,'frontend/assemble/hardware-state.mjs')).href));
 const current=capture(await import(pathToFileURL(join(repository,'frontend/assemble/hardware-state.ts')).href));
 const oldRaw=JSON.stringify(old),currentRaw=JSON.stringify(current);
 const oldPortable=canonical(old),currentPortable=canonical(current);
 const counts=(value:typeof old)=>({steps:value.STEPS.length,actors:Object.keys(value.ACTORS).length,snapshots:value.snapshots.flat().length});
 const structural:{path:string;old:unknown;current:unknown}[]=[],numeric:{path:string;old:number;current:number;absolute:number}[]=[];
 let structuralCount=0,numericCount=0,maximumAbsolute=0,maximum:typeof numeric[number]|undefined;
 function compare(a:unknown,b:unknown,path='$'):void{
  if(typeof a==='number'&&typeof b==='number'){
   if(a!==b){const difference={path,old:a,current:b,absolute:Math.abs(a-b)};numericCount++;if(numeric.length<10)numeric.push(difference);if(difference.absolute>maximumAbsolute){maximumAbsolute=difference.absolute;maximum=difference;}}
   return;
  }
  const record=(oldValue:unknown,currentValue:unknown)=>{structuralCount++;if(structural.length<10)structural.push({path,old:oldValue,current:currentValue});};
  if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length)record(a.length,b.length);for(let index=0;index<Math.min(a.length,b.length);index++)compare(a[index],b[index],path+'['+index+']');return;}
  if(object(a)&&object(b)){const keys=Object.keys(a),other=Object.keys(b);if(JSON.stringify(keys)!==JSON.stringify(other))record(keys,other);for(const key of keys)if(key in b)compare(a[key],b[key],path+'.'+key);return;}
  if(a!==b)record(a,b);
 }
 compare(JSON.parse(oldRaw)as unknown,JSON.parse(currentRaw)as unknown);
 const report={reference:{revision,entry:'frontend/assemble/hardware-state.mjs'},current:{entry:'frontend/assemble/hardware-state.ts'},runtime:{platform:process.platform,arch:process.arch,node:process.version,v8:process.versions.v8,execArgv:process.execArgv},canonical:{decimalPlaces:digits,maxQuantum:quantum,old:sha(oldPortable),current:sha(currentPortable)},raw:{old:sha(oldRaw),current:sha(currentRaw)},counts:{old:counts(old),current:counts(current)},differences:{structuralCount,firstStructural:structural,numericCount,maximumAbsolute,maximum,firstNumeric:numeric}};
 console.log(JSON.stringify(report,null,2));
 const output=process.env.DUCK_ASSEMBLY_DIAGNOSTIC_OUTPUT;
 if(output){await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');await writeFile(output+'.old.json.gz',gzipSync(oldRaw));await writeFile(output+'.current.json.gz',gzipSync(currentRaw));}
 assert.deepEqual(counts(old),{steps:111,actors:275,snapshots:444});
 assert.deepEqual(counts(current),counts(old));
 assert.equal(structuralCount,0,'Legacy/current structure, order, strings and enums differ');
 assert.equal(sha(oldPortable),'c1df395ad72e025a59cd0a1fce7d0292ecd775c43ef18908cc9c6e1a46be538b','Independent legacy portable golden changed');
 assert.equal(sha(currentPortable),sha(oldPortable),'Legacy/current portable poses differ');
 assert.ok(maximumAbsolute<=quantum,'A numeric change exceeds the documented quantum');
}finally{await rm(reference,{recursive:true,force:true});assert.equal(await import('node:fs').then(fs=>fs.existsSync(reference)),false);console.log(JSON.stringify({temporaryReferenceRemoved:true}));}
