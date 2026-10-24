// Release build contract (frontend/build.mjs). No licensed assets needed; skipped without
// `npm ci --prefix frontend`, which the public CI installs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),frontend=path.join(root,'frontend');
const ready=fs.existsSync(path.join(frontend,'node_modules/esbuild'));
const skip=ready?false:'run npm ci --prefix frontend to test the release build';
let out,result;
test.before(async()=>{
  if(!ready)return;
  out=fs.mkdtempSync(path.join(os.tmpdir(),'letsduck-build-'));
  result=await (await import(pathToFileURL(path.join(frontend,'build.mjs')))).build(out);
});
test.after(()=>{if(out)fs.rmSync(out,{recursive:true,force:true});});
const page=name=>fs.readFileSync(path.join(out,name),'utf8');

test('pages reference only existing hashed build files, one stylesheet, and no import map',{skip},()=>{
  for(const [name,prefix] of [['index.html','build/'],['gallery/index.html','../build/']]){
    const html=page(name),refs=[...html.matchAll(/(?:src|href)="([^"]+\.(?:m?js|css))"/g)].map(m=>m[1]);
    assert.ok(refs.length>3,name);
    for(const ref of refs){
      assert.ok(ref.startsWith(prefix),`${name}: ${ref}`);
      assert.match(ref,/-[A-Z0-9]{8}\.(?:js|css)$/,ref);
      assert.ok(fs.existsSync(path.join(path.dirname(path.join(out,name)),ref)),ref);
    }
    assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1,name);
    assert.doesNotMatch(html,/importmap|\.mjs"/,name);
    for(const asset of ['model.json','geometry.positions.bin','catalog.json'])assert.ok(html.includes(`<link rel="preload" href="/assets/${asset}" as="fetch" crossorigin>`),asset);
  }
  // Only pages, build/ and licence/brand files are published; no source modules.
  const files=fs.readdirSync(out,{recursive:true}).filter(f=>fs.statSync(path.join(out,f)).isFile()&&!f.startsWith('build'+path.sep));
  assert.deepEqual(files.filter(f=>/\.(?:m?js|css|py|json)$/.test(f)),[]);
  assert.ok(!files.includes('home.html'),'the personal home page is not part of the server edition');
});

test('every build file has .br and .gz siblings with identical content',{skip},()=>{
  const dir=path.join(out,'build'),files=fs.readdirSync(dir).filter(f=>!/\.(?:br|gz)$/.test(f));
  assert.ok(files.length>10);
  for(const f of files){
    const raw=fs.readFileSync(path.join(dir,f));
    assert.deepEqual(zlib.brotliDecompressSync(fs.readFileSync(path.join(dir,f+'.br'))),raw,f);
    assert.deepEqual(zlib.gunzipSync(fs.readFileSync(path.join(dir,f+'.gz'))),raw,f);
  }
});

test('each locale chunk holds exactly the merged source dictionary',{skip},async()=>{
  const {loadCatalogs}=await import(pathToFileURL(path.join(frontend,'locales/load.mjs')));
  const source=await loadCatalogs([]);
  assert.equal(Object.keys(result.localeChunks).length,12);
  for(const [code,file] of Object.entries(result.localeChunks))
    assert.deepEqual((await import(pathToFileURL(path.join(out,'build',file)))).default,source[code],code);
});

test('the inline preload picks the same locale as i18n.mjs',{skip},async()=>{
  const {matchLocales}=await import(pathToFileURL(path.join(frontend,'shared/i18n.mjs')));
  const script=page('index.html').match(/<script>(\(\(\)=>\{const supported[\s\S]*?)<\/script>/)[1];
  for(const [saved,languages] of [[null,['zh-HK']],[null,['th-TH','fr-CA']],['ko',['de-DE']],['invalid',['xx']],[null,['en-US']]]){
    const links=[],head={append:l=>links.push(l.href)};
    vm.runInNewContext(script,{document:{head,createElement:()=>({})},localStorage:{getItem:()=>saved},navigator:{languages}});
    const want=saved==='ko'?'ko':matchLocales(languages);
    assert.deepEqual(links,[...new Set(['en',want])].map(c=>'build/'+result.localeChunks[c]),String(languages));
  }
});

test('the model loader points at the hashed Worker bundle',{skip},()=>{
  const dir=path.join(out,'build'),worker=result.worker;
  assert.match(worker,/^positions-worker-[A-Z0-9]{8}\.js$/);
  assert.ok(fs.existsSync(path.join(dir,worker)));
  const code=fs.readdirSync(dir).filter(f=>f.endsWith('.js')).map(f=>fs.readFileSync(path.join(dir,f),'utf8')).join('\n');
  assert.ok(code.includes(`"./${worker}"`));
  assert.ok(!code.includes('positions-worker.mjs'));
  // The Worker is self-contained: no imports left to resolve without an import map.
  assert.doesNotMatch(fs.readFileSync(path.join(dir,worker),'utf8'),/\bimport\s*[{*(]|\bfrom\s*["']/);
});
