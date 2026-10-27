import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {build} from 'vite';
import type {Plugin} from 'vite';
const root=resolve(import.meta.dirname,'../..');
test('changing a Worker dependency invalidates its URL, its loader and the paint entry',async()=>{
 const scratch=await mkdtemp(join(tmpdir(),'duck-worker-hash-'));
 async function output(name:string,mutate:boolean){
  const outDir=join(scratch,name),change:Plugin={name:'test-worker-dependency',transform(code,id){if(id.replaceAll('\\','/').endsWith('/frontend/vendor/meshopt_decoder.mjs'))return {code:code+'\nglobalThis.__duck_dependency_cache_check="changed";',map:null};return null;}};
  await build({configFile:join(root,'vite.config.ts'),logLevel:'silent',build:{outDir,emptyOutDir:true},...(mutate?{worker:{plugins:()=>[change]}}:{})});
  const paths=await readdir(join(outDir,'static')),worker=paths.find(file=>/^positions-worker-.*\.js$/.test(file));assert.ok(worker);
  const loaders:string[]=[];for(const file of paths.filter(file=>file.endsWith('.js')&&file!==worker))if((await readFile(join(outDir,'static',file),'utf8')).includes(worker))loaders.push(file);
  assert.ok(loaders.length,'a real loader must reference its emitted Worker URL');const html=await readFile(join(outDir,'index.html'),'utf8'),entry=/<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(html)?.[1];assert.ok(entry);return {worker,loaders,entry};
 }
 try{const before=await output('before',false),after=await output('after',true);assert.notEqual(after.worker,before.worker);assert.notDeepEqual(after.loaders,before.loaders);assert.notEqual(after.entry,before.entry);}finally{await rm(scratch,{recursive:true,force:true});}
});
