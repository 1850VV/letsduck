import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,symlink,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { audit } from '../../scripts/publication_audit.js';
test('publication audit preserves byte-pattern privacy checks, approved media limit, local assets and symlinks',async()=>{
 const root=await mkdtemp(join(tmpdir(),'duck-audit-ts-'));
 try{
  await mkdir(join(root,'docs/media'),{recursive:true});await mkdir(join(root,'.env'));await mkdir(join(root,'assets'));
  const home=join('/','Users','fixture\u00a0name','project');
  const cases:Record<string,string|Buffer>={
   'private.txt':['line1',home,join('/','var','folders','temporary'),'?key='+'z'.repeat(20),'gh'+'p_'+'a'.repeat(32),'s'+'k-'+'a'.repeat(30),'-----BEGIN '+'PRIVATE KEY-----','co'+'dex://fixture',['https:', '', 'user:password@example.invalid'].join('/')].join('\n'),
   'docs/media/small.jpg':Buffer.alloc(1),'docs/media/large.gif':Buffer.alloc(3_000_001),'assets/model.json':'{}','.env/fixture.txt':'safe','unreviewed.png':Buffer.alloc(1),
  };
  for(const[name,value]of Object.entries(cases))await writeFile(join(root,name),value);await symlink(join(root,'private.txt'),join(root,'link.txt'));
  const result=await audit({root,files:[...Object.keys(cases),'link.txt']});assert.equal(result.filesChecked,7);
  assert.deepEqual(result.findings.filter(item=>item.file==='private.txt').map(item=>[item.rule,item.line]),[['home-path',2],['temporary-path',3],['preview-access-key',4],['github-token',5],['api-secret',6],['private-key',7],['private-chat-link',8],['credential-url',9]]);
  assert.deepEqual(result.findings.filter(item=>item.file!=='private.txt'),[{file:'docs/media/large.gif',rule:'readme-media-too-large'},{file:'assets/model.json',rule:'local-only-or-unreviewed-binary'},{file:'.env/fixture.txt',rule:'private-or-generated-path'},{file:'unreviewed.png',rule:'local-only-or-unreviewed-binary'},{file:'link.txt',rule:'symlink'}]);
 }finally{await rm(root,{recursive:true,force:true});}
});
