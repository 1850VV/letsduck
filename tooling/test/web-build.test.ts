import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {servoMap,servoLeads} from '@letsduck/contracts';
const frontend=resolve(import.meta.dirname,'../../frontend'),dist=process.env.DUCK_WEB_DIST??join(frontend,'dist');
test('Vite pages keep product routes, hashed modules and classic synchronous prepaint',async()=>{
 for(const page of ['index.html','home.html','assemble/index.html','debug/index.html','gallery/index.html','assemble/audio-credits.html']){
  const html=await readFile(join(dist,page),'utf8');assert.ok(html.includes('<html'),page);assert.doesNotMatch(html, /type=["']importmap|src=["'][^"']+\.ts["']/);
  if(!page.endsWith('audio-credits.html'))assert.match(html,/<script[^>]*type="module"[^>]*src="\/static\/[^" ]+\.js"/);
  if(page==='index.html')assert.doesNotMatch(html,/letsduck-still-paint|data-duck-prepaint/, 'Paint must not restore a previous single-duck image');
  if(page==='assemble/index.html'){assert.doesNotMatch(html,/data-duck-prepaint/);const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];assert.ok(scripts.some(match=>!match[1]!.includes('type=')&&match[2]!.includes('localStorage')&&match[2]!.includes('currentScript')),page+' prepaint must execute synchronously');}
 }
});
test('public servo maps retain exact same paths and bytes, without copying licensed assets',async()=>{
 for(const path of ['assemble/servo-map.json','assemble/servo-leads.json','shared/servo-map.json'])assert.deepEqual(await readFile(join(dist,path)),Buffer.from(JSON.stringify(path.endsWith('servo-leads.json')?servoLeads:servoMap,null,2)+'\n'),path);
 const files=(await readdir(dist,{recursive:true})).map(file=>file.replaceAll('\\','/'));assert.ok(files.some(file=>/^static\/positions-worker-[^/]+\.js$/.test(file)),'model worker must be bundled');assert.equal(files.some(file=>/\.(?:3mf|bin|glb|mp4|mp3|py|ts)$/.test(file)),false,'private assets and source code must stay outside web dist');
});

test('paint startup retains the three model fetch preloads from the original HTML contract',async()=>{
 const html=await readFile(join(dist,'index.html'),'utf8');
 for(const name of ['model.json','geometry.positions.bin','catalog.json'])assert.match(html,new RegExp('<link[^>]*rel="preload"[^>]*href="/assets/'+name.replaceAll('.','\\.')+'"[^>]*as="fetch"[^>]*crossorigin'),name);
});
