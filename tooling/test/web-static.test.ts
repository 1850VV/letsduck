import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {isJsonObject} from '@letsduck/domain';
import * as assets from '../../packages/host/src/static.js';
test('built frontend accepts an explicit assembly manifest independent of its dist directory',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-dist-static-'));
 try{
  const frontend=join(root,'frontend/dist'),bundle=join(root,'assets');await mkdir(join(frontend,'assemble'),{recursive:true});await mkdir(join(bundle,'assembly'),{recursive:true});await mkdir(join(root,'scripts'));
  await writeFile(join(frontend,'assemble/index.html'),'ASSEMBLE');await writeFile(join(bundle,'assembly/model.bin'),'synthetic');await writeFile(join(root,'scripts/assembly-assets.json'),'{"files":{"model.bin":{}}}');
  const loader:unknown=Reflect.get(assets,'loadAssemblyManifest');assert.equal(typeof loader,'function');if(typeof loader!=='function')throw new Error('Missing manifest loader');const manifest:unknown=Reflect.apply(loader,undefined,[join(root,'scripts/assembly-assets.json')]);assert.ok(isJsonObject(manifest)&&isJsonObject(manifest.files));
  // Static delivery consumes resource paths and the read-only numbering gate.
  const handler=assets.personalStatic({frontend,assets:bundle,assemblyManifest:{files:manifest.files},debug:{numbering:()=>({ready:false})}});assert.equal(await handler.assemblyReady(),true);
  await rm(join(bundle,'assembly/model.bin'));assert.equal(await handler.assemblyReady(),false);
 }finally{await rm(root,{recursive:true,force:true});}
});
