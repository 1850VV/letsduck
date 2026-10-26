import test from 'node:test';
import assert from 'node:assert/strict';
import {STEPS,CHAPTERS} from '../../frontend/assemble/hardware-state.mjs';
const catalog=await import('../../frontend/assemble/material-catalog.mjs').catch(()=>null);
const layout=await import('../../frontend/assemble/material-layout.mjs').catch(()=>null);
function api(){assert.ok(catalog?.chapterMaterials&&layout?.specimenLayout,'chapter material catalog and quantity layout are available');return catalog;}

test('chapter preparation includes all 15 servos, while configuration steps take one at a time',()=>{
 const c=api();assert.equal(c.chapterMaterials(CHAPTERS[0]).find(m=>m.id==='p_motor').count,15);
 assert.equal(c.stepMaterials(STEPS.findIndex(s=>s.parts.includes('p_motor'))).find(m=>m.id==='p_motor').count,1);
});
test('grouped screws represent every required fastener rather than only the animated representative',()=>{
 const rows=api().chapterMaterials(CHAPTERS[1]);assert.equal(rows.find(m=>m.fastener==='M2x6').count,6);
 assert.equal(rows.find(m=>m.fastener==='M2.3x8').count,1);
});
test('all 111 steps provide material identification and specifications without HTML entities',()=>{
 const c=api();assert.equal(STEPS.length,111);
 for(let i=0;i<STEPS.length;i++)for(const m of c.stepMaterials(i)){assert.ok(m.name&&m.spec,`${i}: ${m.id}`);assert.doesNotMatch(m.name,/&#/);assert.ok(m.ids.length);}
 assert.match(c.materialFor('p_servoCable').spec,/2\.0|2.0/);
});
test('source conflicts and unknown quantities stay explicit instead of becoming verified part counts',()=>{
 const c=api();assert.match(c.materialFor('h_mouthMotor').note,/ID34/);assert.doesNotMatch(c.materialFor('h_mouthMotor').note,/ID33/);
 const rows=CHAPTERS.flatMap(ch=>c.chapterMaterials(ch)),unknown=rows.filter(m=>m.quantity==='数量待核对');assert.equal(unknown.length,6);
 for(const m of unknown){assert.equal(layout.displayQuantity(m),null);assert.equal(layout.specimenLayout(m).positions.length,1);}
 assert.equal(unknown.filter(m=>m.reused).length,2);
 assert.equal(unknown.filter(m=>m.name==='侧板固定件'&&m.spec.includes('M2.3×4')).length,2);
});
test('the servo queue has 15 distinct positions in one straight row',()=>{
 api();const s=layout.specimenLayout({id:'p_motor',count:15,quantity:'×15'});assert.equal(s.positions.length,15);
 assert.equal(new Set(s.positions.map(p=>p[0])).size,15);assert.ok(s.positions.every(p=>p[2]===0));
});
test('calibration reuses one complete robot without inventing new component requirements',()=>{
 const rows=api().chapterMaterials(CHAPTERS[13]);assert.equal(rows.length,1);assert.equal(rows[0].kind,'assembly');assert.equal(rows[0].count,1);
});
