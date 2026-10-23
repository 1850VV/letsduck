// Release build for the server edition's nginx image. The personal edition and development servers
// keep serving this source tree unchanged; nothing here runs on an installed machine.
//
// - esbuild bundles, tree-shakes and minifies each page's module scripts into content-hashed files
//   under build/, with chunks shared between the studio and the gallery;
// - dictionaries become one chunk per locale: a page loads English (the fallback) and the active
//   locale, preloaded from an inline check of the same saved/browser preference as i18n.mjs;
// - the model Worker is bundled separately and the loader points at its hashed name;
// - each page gets one minified stylesheet in the original cascade order, module preloads for its
//   static chunks and the model files, and every build/ file a .br and .gz sibling for nginx.
//
// Usage: node build.mjs <output dir>   (after npm ci in this directory)
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import zlib from 'node:zlib';

const SRC=path.dirname(fileURLToPath(import.meta.url));
const PAGES=['index.html','gallery/index.html'];
const MODEL=['/assets/model.json','/assets/geometry.positions.bin','/assets/catalog.json']; // fetched by shared/model-loader.mjs
const BUILD_ONLY=new Set(['build.mjs','package.json','package-lock.json','node_modules','Dockerfile','.dockerignore','nginx.conf']);
const CODE=/\.(?:mjs|js|css)$/;

export async function build(out) {
  out=path.resolve(out);
  if(out===SRC||out.startsWith(SRC+path.sep))throw Error('Output must be outside the source tree');
  fs.rmSync(out,{recursive:true,force:true});
  // Static files the pages still reference directly (licences, brand files); bundled code is not copied.
  fs.cpSync(SRC,out,{recursive:true,filter:file=>{const rel=path.relative(SRC,file);return !rel||!BUILD_ONLY.has(rel.split(path.sep)[0])&&!CODE.test(rel)&&path.basename(rel)!=='.DS_Store';}});
  const prune=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true}))if(entry.isDirectory())prune(path.join(dir,entry.name));if(dir!==out&&!fs.readdirSync(dir).length)fs.rmdirSync(dir);};
  prune(out);
  const dist=path.join(out,'build');

  const {LOCALES,matchLocales}=await import(pathToFileURL(path.join(SRC,'shared/i18n.mjs')));
  const {loadCatalogs}=await import(pathToFileURL(path.join(SRC,'locales/load.mjs')));
  const codes=LOCALES.map(x=>x.code),dictionaries=await loadCatalogs(codes);

  const worker=await esbuild.build({entryPoints:[path.join(SRC,'shared/positions-worker.mjs')],bundle:true,minify:true,charset:'utf8',format:'esm',legalComments:'eof',
    outdir:dist,entryNames:'[name]-[hash]',metafile:true,logLevel:'warning'});
  const workerFile=path.basename(Object.keys(worker.metafile.outputs)[0]);

  const pages=PAGES.map(name=>{
    const html=fs.readFileSync(path.join(SRC,name),'utf8'),dir=path.dirname(path.join(SRC,name));
    const scripts=[...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g)].map(m=>({tag:m[0],file:path.resolve(dir,m[1])}));
    const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css)">/g)].map(m=>({tag:m[0],file:path.resolve(dir,m[1])}));
    return {name,html,scripts,styles,css:path.dirname(name)==='.'?'studio-page':path.dirname(name)+'-page'};
  });
  const entryPoints=[...new Set(pages.flatMap(p=>p.scripts.map(s=>s.file)))];
  const sourcePlugin={name:'letsduck-source',setup(b){
    b.onResolve({filter:/^three$/},()=>({path:path.join(SRC,'vendor/three.module.js')}));
    b.onResolve({filter:/\/locales\/load\.mjs$/},()=>({path:'load',namespace:'locales'}));
    b.onLoad({filter:/.*/,namespace:'locales'},()=>({loader:'js',contents:
      `const chunks={${codes.map(c=>`${JSON.stringify(c)}:()=>import(${JSON.stringify('locale:'+c)})`).join(',')}};\n`+
      'export async function loadCatalogs(codes){const out={};await Promise.all([...new Set(codes)].filter(c=>chunks[c]).map(async c=>{out[c]=(await chunks[c]()).default;}));return out;}'}));
    b.onResolve({filter:/^locale:/},a=>({path:a.path.slice(7),namespace:'locale'}));
    b.onLoad({filter:/.*/,namespace:'locale'},a=>({loader:'json',contents:JSON.stringify(dictionaries[a.path])}));
    b.onLoad({filter:/shared\/model-loader\.mjs$/},a=>{
      const source=fs.readFileSync(a.path,'utf8'),ref="new URL('./positions-worker.mjs',import.meta.url)";
      if(source.split(ref).length!==2)throw Error('model-loader.mjs must create the Worker exactly once as '+ref);
      return {loader:'js',contents:source.replace(ref,`new URL(${JSON.stringify('./'+workerFile)},import.meta.url)`)};
    });
    b.onResolve({filter:/^page-css:/},a=>({path:a.path.slice(9),namespace:'page-css'}));
    b.onLoad({filter:/.*/,namespace:'page-css'},a=>({loader:'css',resolveDir:SRC,
      contents:pages.find(p=>p.css===a.path).styles.map(s=>`@import ${JSON.stringify(s.file)};`).join('\n')}));
  }};
  const result=await esbuild.build({entryPoints:[...entryPoints,...pages.map(p=>({in:'page-css:'+p.css,out:p.css}))],bundle:true,splitting:true,format:'esm',
    minify:true,charset:'utf8',legalComments:'eof',outdir:dist,entryNames:'[name]-[hash]',chunkNames:'chunk-[hash]',metafile:true,plugins:[sourcePlugin],logLevel:'warning'});

  const outputs=Object.entries(result.metafile.outputs).map(([file,o])=>({file:path.resolve(file),...o}));
  const byEntry=file=>outputs.find(o=>o.entryPoint&&path.resolve(o.entryPoint)===file);
  const name=o=>path.basename(o.file);
  const staticGraph=(start)=>{const seen=new Set(),todo=[start];while(todo.length){const o=todo.pop();for(const i of o.imports)if(i.kind==='import-statement'&&!seen.has(i.path)){seen.add(i.path);todo.push(outputs.find(x=>x.file===path.resolve(i.path)));}}return [...seen].map(p=>path.basename(p));};
  const localeChunks=Object.fromEntries(codes.map(c=>[c,name(outputs.find(o=>o.entryPoint==='locale:'+c))]));

  for(const page of pages){
    const rel=path.relative(path.dirname(path.join(SRC,page.name)),path.join(SRC,'build')).split(path.sep).join('/')||'.',at=f=>rel+'/'+f;
    let html=page.html;
    const entries=page.scripts.map(s=>byEntry(s.file));
    for(const [i,s] of page.scripts.entries())html=html.replace(s.tag,`<script type="module" src="${at(name(entries[i]))}"></script>`);
    page.styles.forEach((s,i)=>{html=html.replace(s.tag,i?'':`<link rel="stylesheet" href="${at(name(outputs.find(o=>o.entryPoint==='page-css:'+page.css)))}">`);});
    const chunks=[...new Set(entries.flatMap(staticGraph))].filter(f=>!entries.some(e=>name(e)===f));
    const preload=chunks.map(f=>`<link rel="modulepreload" href="${at(f)}">`).join('')+MODEL.map(p=>`<link rel="preload" href="${p}" as="fetch" crossorigin>`).join('');
    // Same decision as i18n.mjs at startup: saved choice, else the first supported browser language.
    const locale=`<script>(()=>{const supported=new Set(${JSON.stringify(codes)}),files=${JSON.stringify(localeChunks)},matchLocales=${matchLocales.toString()};`+
      `let code;try{code=localStorage.getItem('dd-locale');}catch{}if(!supported.has(code))code=matchLocales(navigator.languages||[navigator.language||'en']);`+
      `for(const c of new Set(['en',code])){const l=document.createElement('link');l.rel='modulepreload';l.href=${JSON.stringify(rel+'/')}+files[c];document.head.append(l);}})();</script>`;
    const importmap=html.match(/<script type="importmap">.*?<\/script>/s);
    if(!importmap)throw Error(page.name+': import map not found');
    html=html.replace(importmap[0],preload+locale);
    fs.writeFileSync(path.join(out,page.name),html);
  }

  const sizes={};
  for(const file of fs.readdirSync(dist)){
    const full=path.join(dist,file),data=fs.readFileSync(full);
    const br=zlib.brotliCompressSync(data,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11,[zlib.constants.BROTLI_PARAM_SIZE_HINT]:data.length}}),gz=zlib.gzipSync(data,{level:9});
    fs.writeFileSync(full+'.br',br);fs.writeFileSync(full+'.gz',gz);sizes[file]={bytes:data.length,br:br.length,gzip:gz.length};
  }
  return {sizes,localeChunks,worker:workerFile,metafile:result.metafile};
}

if(import.meta.url===pathToFileURL(process.argv[1]).href){
  if(!process.argv[2])throw Error('Usage: node build.mjs <output dir>');
  const {sizes}=await build(process.argv[2]),total=Object.values(sizes).reduce((a,s)=>({bytes:a.bytes+s.bytes,br:a.br+s.br}),{bytes:0,br:0});
  console.log(`build/: ${Object.keys(sizes).length} files, ${total.bytes} bytes, ${total.br} bytes Brotli`);
}
