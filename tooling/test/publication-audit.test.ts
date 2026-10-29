import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,symlink,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { audit } from '../../scripts/publication_audit.js';
test('publication audit preserves byte-pattern privacy checks, media limits, unapproved assets and symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-audit-ts-'));
 try{
  await mkdir(join(root,'docs/media'),{recursive:true});await mkdir(join(root,'.env'));await mkdir(join(root,'unreviewed'));
  const home=join('/','Users','fixture\u00a0name','project');
  const cases:Record<string,string|Buffer>={
   'private.txt':['line1',home,join('/','var','folders','temporary'),'?key='+'z'.repeat(20),'gh'+'p_'+'a'.repeat(32),'s'+'k-'+'a'.repeat(30),'-----BEGIN '+'PRIVATE KEY-----','co'+'dex://fixture',['https:', '', 'user:password@example.invalid'].join('/')].join('\n'),
   'docs/media/small.jpg':Buffer.alloc(1),'docs/media/large.gif':Buffer.alloc(3_000_001),'unreviewed/model.json':'{}','.env/fixture.txt':'safe','unreviewed.png':Buffer.alloc(1),
  };
  for(const[name,value]of Object.entries(cases))await writeFile(join(root,name),value);await symlink(join(root,'private.txt'),join(root,'link.txt'));
  const result=await audit({root,files:[...Object.keys(cases),'link.txt']});assert.equal(result.filesChecked,7);
  assert.deepEqual(result.findings.filter(item=>item.file==='private.txt').map(item=>[item.rule,item.line]),[['home-path',2],['temporary-path',3],['preview-access-key',4],['github-token',5],['api-secret',6],['private-key',7],['private-chat-link',8],['credential-url',9]]);
  assert.deepEqual(result.findings.filter(item=>item.file!=='private.txt'),[{file:'docs/media/large.gif',rule:'readme-media-too-large'},{file:'unreviewed/model.json',rule:'local-only-or-unreviewed-binary'},{file:'.env/fixture.txt',rule:'private-or-generated-path'},{file:'unreviewed.png',rule:'local-only-or-unreviewed-binary'},{file:'link.txt',rule:'symlink'}]);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('approved runtime assets can be distributed without bypassing private-path or unlisted-binary checks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-bundled-audit-'));
 try{
  const cases:Record<string,string|Buffer>={
   'assets/source.3mf':Buffer.from([1,2,3]),
   'assets/assembly/full-head.mp4':Buffer.from([4,5,6]),
   'assets/assembly/horn-reference/main.jpg':Buffer.from([7,8,9]),
   'assets/model.json':JSON.stringify({source:join('/','Users','fixture','private-model')}),
   'assets/assembly/unreviewed.mp4':Buffer.from([1]),
  };
  for(const[name,value]of Object.entries(cases)){await mkdir(join(root,name,'..'),{recursive:true});await writeFile(join(root,name),value);}
  const result=await audit({root,files:Object.keys(cases)});
  assert.deepEqual(result.findings,[{file:'assets/model.json',line:1,rule:'home-path'},{file:'assets/assembly/unreviewed.mp4',rule:'local-only-or-unreviewed-binary'}]);
 }finally{await rm(root,{recursive:true,force:true});}
});
