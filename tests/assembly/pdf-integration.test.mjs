import test from 'node:test';
import assert from 'node:assert/strict';
import * as old from '../../frontend/assemble/hardware-state.mjs';
import * as flow from '../../frontend/assemble/pdf-state.mjs';
import {readFile} from 'node:fs/promises';
import {resolveServoMap} from '../../frontend/assemble/servo-map.mjs';
const position=await import('../../frontend/assemble/lesson-position.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND'&&e.message.includes('/lesson-position.mjs'))return null;throw e;});
const ready=()=>assert.ok(position,'saved positions and reference clips need a flow-aware resolver');

test('every old numeric bookmark migrates to the same stable action, discarding obsolete camera coordinates',()=>{
 ready();for(const[step,s]of old.STEPS.entries()){
  const migrated=position.restoreLessonPosition({step,total:old.STEPS.length,camera:[1,2,3],target:[4,5,6]});
  assert.equal(flow.STEPS[migrated.step].id,s.id);assert.equal(migrated.camera,undefined);assert.equal(migrated.target,undefined);
 }
});
test('new bookmarks roundtrip stable IDs and camera; damaged or unknown old formats start safely',()=>{
 ready();const n=flow.STEPS.findIndex(s=>s.id==='head-yaw-wire');
 const saved=position.saveLessonPosition(n,{camera:[1,2,3],target:[4,5,6]});
 assert.equal(saved.stepId,'head-yaw-wire');assert.equal(position.restoreLessonPosition(saved).step,n);assert.deepEqual(position.restoreLessonPosition(saved).camera,[1,2,3]);
 assert.equal(position.restoreLessonPosition({...saved,step:999}).step,n);
 for(const value of [null,{}, {step:-1},{step:99,total:112},{stepId:'unknown',step:99,total:111},{flowVersion:'future',step:30,total:111}])assert.equal(position.restoreLessonPosition(value).step,0);
});
test('mixed PDF chapters resolve each step to its actual source video and local timestamps',()=>{
 ready();for(const s of flow.STEPS){const clip=position.referenceClip(s);assert.ok(clip.video);assert.ok(clip.start>=0);assert.ok(clip.end>=clip.start);assert.equal(clip.start,s.sourceStart-s.videoStart);}
 const chapter=flow.CHAPTERS.find(c=>c.pdfPage===14),clips=flow.STEPS.slice(chapter.start,chapter.end+1).map(position.referenceClip);
 assert.equal(new Set(clips.map(c=>c.video)).size,2,'the leg-routing clip is independent of the side-plate clip');
 const a=flow.STEPS.find(s=>s.id==='r-wire-b'),b=flow.STEPS.find(s=>s.id==='t-join-r');assert.equal(position.referenceClip(a).video,position.referenceClip(b).video);
});
test('physical installation declarations use the PDF mounting milestones without invalidating existing numbering evidence',async()=>{
 const data=JSON.parse(await readFile(new URL('../../frontend/assemble/servo-map.json',import.meta.url))),map=resolveServoMap(data,{actors:flow.ACTORS,steps:flow.STEPS});
 assert.equal(map.version,'tutorial-reference-1');
 for(const id of [10,20])assert.equal(map.byId.get(id).installedAt,'t-support');
 for(const id of [12,13])assert.equal(map.byId.get(id).installedAt,'r-support');
 for(const id of [22,23])assert.equal(map.byId.get(id).installedAt,'l-support');
});
test('the chapter chooser offers every PDF chapter with the same names and ordering',async()=>{
 const html=await readFile(new URL('../../frontend/assemble/index.html',import.meta.url),'utf8');
 const chooser=html.match(/<ryugi-select id="phase-select"[^>]*>([\s\S]*?)<\/ryugi-select>/)[1];
 const options=[...chooser.matchAll(/<ryugi-option value="(\d+)">([^<]+)<\/ryugi-option>/g)].map(m=>({value:Number(m[1]),label:m[2]}));
 assert.deepEqual(options,flow.CHAPTERS.map((c,i)=>({value:i,label:`${i+1} · ${c.name}`})));
});
