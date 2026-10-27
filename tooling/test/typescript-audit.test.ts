import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditTypeScript} from '../src/typescript-audit.js';
test('active language audit rejects authored JS/Python and type suppression while retaining declared history',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-source-types-'));
 try{
  await mkdir(join(root,'tools/history'),{recursive:true});await mkdir(join(root,'frontend/vendor'),{recursive:true});
  const contents:Record<string,string>={'main.ts':'export const good:number=1;','old.js':'export{}','tool.py':'pass','escape.ts':['let x:','any'].join(' '),'ignore.ts':['// @ts-','nocheck'].join(''),'tools/history/retired.py':'pass','frontend/vendor/new.js':'unreviewed','tsconfig.json':'{"compilerOptions":{"allowJs":true}}'};
  for(const[name,text]of Object.entries(contents))await writeFile(join(root,name),text);
  const result=await auditTypeScript({root,files:Object.keys(contents)});
  assert.deepEqual(result.findings.map(item=>[item.file,item.rule]),[['old.js','active-javascript'],['tool.py','active-python'],['escape.ts','explicit-any'],['ignore.ts','type-suppression'],['frontend/vendor/new.js','unreviewed-vendor'],['tsconfig.json','allow-javascript']]);assert.equal(result.historicalFiles,1);assert.equal(result.typedSources,3);
 }finally{await rm(root,{recursive:true,force:true});}
});
