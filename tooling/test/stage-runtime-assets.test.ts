import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,lstat,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {stageRuntimeAssets,stageProductionApp} from '../src/stage-runtime-assets.js';

const sha=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
async function file(root:string,name:string,value:string|Buffer){const path=join(root,name);await mkdir(join(path,'..'),{recursive:true});await writeFile(path,value);}
async function fixture(){
 const root=await mkdtemp(join(tmpdir(),'duck-runtime-stage-test-'));
 await file(root,'frontend/dist/home.html','<html>built home</html>');await file(root,'frontend/dist/static/worker-ab123456.js','postMessage(42)');await file(root,'LICENSE','MIT');await file(root,'THIRD_PARTY_NOTICES.md','Independent material terms');
 for(const [name,value]of Object.entries({'source.3mf':'reviewed source','geometry.bin':'geometry','catalog.json':'{"products":[]}','export-schema.json':'{}','filament-catalog.json':'{"products":[]}','filament-profiles.json':'{"profiles":{"current":{"name":"kept"}}}','geometry.positions.bin':'packed','geometry.positions.bin.br':'compressed'}))await file(root,'assets/'+name,value);
 await file(root,'assets/model.json',JSON.stringify({source_sha256:sha('reviewed source'),parts:[]}));
 await file(root,'assets/assembly/main.bin','tutorial');await file(root,'assets/assembly/optional/reference.jpg','reference');
 await file(root,'scripts/assembly-assets.json',JSON.stringify({files:{'main.bin':{bytes:8,sha256:sha('tutorial')}},optionalFiles:{'optional/reference.jpg':{bytes:9,sha256:sha('reference')},'absent.mp4':{bytes:7,sha256:sha('missing')}}}));
 return root;
}
test('one resource stage keeps exact built Web, profiles, reviewed optional assets and source hashes',async()=>{
 const root=await fixture();try{const output=join(root,'output/runtime'),before=await readFile(join(root,'assets/source.3mf'));const result=await stageRuntimeAssets({root,target:output});
  for(const name of ['frontend/home.html','frontend/static/worker-ab123456.js','assets/filament-catalog.json','assets/filament-profiles.json','assets/geometry.positions.bin.br','assets/assembly/optional/reference.jpg','assembly-assets.json'])assert.ok((await readFile(join(output,name))).length,name);
  assert.deepEqual(await readFile(join(output,'assets/source.3mf')),before);assert.deepEqual(await readFile(join(root,'assets/source.3mf')),before);assert.deepEqual(await readFile(join(output,'frontend/static/worker-ab123456.js')),await readFile(join(root,'frontend/dist/static/worker-ab123456.js')));assert.equal(result.sourceSha256,sha(before));assert.ok(result.files.some(file=>file.path==='assets/filament-profiles.json'));assert.ok(!result.files.some(file=>file.path.endsWith('absent.mp4')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('reviewed source symlinks are read-only and materialized instead of retained in the package',async()=>{
 const root=await fixture();try{await file(root,'external-authorized-profile','{"profiles":{"brand":"present"}}');await rm(join(root,'assets/filament-profiles.json'));await symlink(join(root,'external-authorized-profile'),join(root,'assets/filament-profiles.json'));const before=await readFile(join(root,'external-authorized-profile'));await stageRuntimeAssets({root,target:join(root,'runtime')});assert.equal((await lstat(join(root,'runtime/assets/filament-profiles.json'))).isSymbolicLink(),false);assert.equal((await lstat(join(root,'assets/filament-profiles.json'))).isSymbolicLink(),true);assert.deepEqual(await readFile(join(root,'external-authorized-profile')),before);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('bad model source or present optional tutorial hash cannot become a candidate',async()=>{
 const root=await fixture();try{await file(root,'assets/source.3mf','wrong');await assert.rejects(stageRuntimeAssets({root,target:join(root,'bad-model')}),/source|3MF/i);await assert.rejects(access(join(root,'bad-model')));await file(root,'assets/source.3mf','reviewed source');await file(root,'assets/assembly/optional/reference.jpg','modified');await assert.rejects(stageRuntimeAssets({root,target:join(root,'bad-tutorial')}),/manifest|match/i);await assert.rejects(access(join(root,'bad-tutorial')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('staging never overwrites an existing target or writes into the source asset tree',async()=>{
 const root=await fixture();try{await file(root,'owned/sentinel','unchanged');await assert.rejects(stageRuntimeAssets({root,target:join(root,'owned')}),/exists|empty/i);assert.equal(await readFile(join(root,'owned/sentinel'),'utf8'),'unchanged');await assert.rejects(stageRuntimeAssets({root,target:join(root,'assets/nested')}),/source|overlap/i);assert.equal(await readFile(join(root,'assets/geometry.bin'),'utf8'),'geometry');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('a source-only candidate stages the same built Web without inspecting licensed sources',async()=>{
 const root=await fixture();try{await rm(join(root,'assets'),{recursive:true});const result=await stageRuntimeAssets({root,target:join(root,'runtime'),withoutAssets:true});assert.equal(result.sourceSha256,null);assert.equal(await readFile(join(root,'runtime/frontend/home.html'),'utf8'),'<html>built home</html>');assert.ok(!result.files.some(file=>file.path.startsWith('assets/')));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('production app resolves transitive and nested dependency versions without dev dependencies or external links',async()=>{
 const root=await fixture();try{
  await file(root,'apps/local/package.json',JSON.stringify({name:'@letsduck/local',version:'1.0.0',type:'module',dependencies:{'@letsduck/host':'1.0.0'},devDependencies:{'never-ship':'1'}}));await file(root,'apps/local/dist/main.js',"import {value} from '@letsduck/host';console.log(value)");
  await file(root,'packages/host/package.json',JSON.stringify({name:'@letsduck/host',version:'1.0.0',type:'module',exports:'./dist/index.js',dependencies:{first:'1.0.0',second:'1.0.0'}}));await file(root,'packages/host/dist/index.js',"import first from 'first';import second from 'second';export const value=first+second;");
  for(const [name,version,body,deps]of [['first','1.0.0',"module.exports=require('nested')",{nested:'1'}],['second','1.0.0',"module.exports=require('nested')",{nested:'2'}],['first/node_modules/nested','1.0.0','module.exports=1',{}],['second/node_modules/nested','2.0.0','module.exports=2',{}]]as const){await file(root,'node_modules/'+name+'/package.json',JSON.stringify({name:name.split('/').at(-1),version,main:'index.js',dependencies:deps}));await file(root,'node_modules/'+name+'/index.js',body);}
  await file(root,'node_modules/never-ship/package.json','{"name":"never-ship","version":"1"}');await mkdir(join(root,'node_modules/@letsduck'),{recursive:true});await symlink(join(root,'packages/host'),join(root,'node_modules/@letsduck/host'),'junction');
  await stageProductionApp({root,target:join(root,'app'),entry:'browser'});assert.equal((await lstat(join(root,'app/node_modules/@letsduck/host'))).isSymbolicLink(),false);assert.equal(await readFile(join(root,'app/node_modules/first/node_modules/nested/index.js'),'utf8'),'module.exports=1');assert.equal(await readFile(join(root,'app/node_modules/second/node_modules/nested/index.js'),'utf8'),'module.exports=2');await assert.rejects(access(join(root,'app/node_modules/never-ship')));await assert.rejects(access(join(root,'app/node_modules/electron')));assert.deepEqual(await readFile(join(root,'app/packages/host/dist/index.js')),await readFile(join(root,'packages/host/dist/index.js')));
  const {execFile}=await import('node:child_process');const {promisify}=await import('node:util');const result=await promisify(execFile)(process.execPath,[join(root,'app/apps/local/dist/main.js')],{env:{PATH:''}});assert.equal(result.stdout.trim(),'3');
 }finally{await rm(root,{recursive:true,force:true});}
});
test('the built application ships runtime schema validation without schema typing libraries',async()=>{
 const root=resolve(import.meta.dirname,'../..'),temporary=await mkdtemp(join(tmpdir(),'duck-production-type-boundary-'));
 try{
  const staged=await stageProductionApp({root,target:join(temporary,'app'),entry:'browser'});
  assert.ok(staged.files.some(file=>file.path.endsWith('node_modules/ajv/package.json')),'runtime schema validator remains available');
  for(const name of ['json-schema-to-ts','ts-algebra','@babel/runtime'])assert.ok(!staged.files.some(file=>file.path.endsWith('node_modules/'+name+'/package.json')),name+' is not part of the executable dependency closure');
 }finally{await rm(temporary,{recursive:true,force:true});}
});
