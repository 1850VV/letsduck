import test from 'node:test';
import assert from 'node:assert/strict';
import * as head from '../../frontend/assemble/full/head.mjs';
import * as final from '../../frontend/assemble/full/final.mjs';
import {materialFor,stepMaterials} from '../../frontend/assemble/material-catalog.mjs';
import {STEPS} from '../../frontend/assemble/pdf-state.mjs';

test('PDF pages 1 and 19 identify the mouth as ID34 throughout its instructions',()=>{
  const text=[head.ACTORS.h_mouthMotor.label,head.ACTORS.h_wireMouth.label,...head.STEPS.filter(s=>s.id.startsWith('head-mouth-')).flatMap(s=>[s.text,s.check,s.caption]),materialFor('h_mouthMotor').note].join(' ');
  assert.match(text,/ID34/);assert.doesNotMatch(text,/33\s*\/\s*34|视频33|编号33|口述 ID33/);
});

test('PDF page 20 requires three head-cover screws, with unknown hole locations explicit',()=>{
  const screws=Object.entries(head.ACTORS).filter(([id])=>/^h_shellScrew\d+$/.test(id));
  assert.equal(screws.length,3);assert.match(head.STEPS.find(s=>s.id==='head-shell-fix').caption,/×3/);
  assert.match(head.STEPS.find(s=>s.id==='head-shell-fix').check,/(第3|第三).*待核/,'the exact limit is visible in the lesson');
  for(const[id,a]of screws)if(a.hardwareStatus==='pending-hole-alignment')assert.equal(head.snapshot(head.STEPS.length-1,1)[id].visible,false);
});

test('PDF page 24 provides four required body fasteners, without deleting an unassigned source candidate',()=>{
  const step=final.STEPS.find(s=>s.id==='final-body-shells');assert.match(step.caption,/×4/);
  assert.equal(final.ACTORS.f_bodyScrew4.hardwareStatus,'pending-step-assignment');
  assert.equal(final.snapshot(final.STEPS.length-1,1).f_bodyScrew4.visible,false);
  const at=STEPS.findIndex(s=>s.id==='final-body-shells');
  const material=stepMaterials(at).find(m=>m.fastener==='M2x6');assert.equal(material.count,4);
});

test('side plates reference retained original screws without asserting two new self-tappers per side',()=>{
  for(const suffix of ['first','second']){
    const step=final.STEPS.find(s=>s.id==='final-thigh-'+suffix);
    assert.match(step.text,/原配|原装|自带/);assert.match(step.check,/待核/);
    assert.ok(step.reusedFasteners?.length);
    assert.doesNotMatch(step.caption,/M2.3×4\s*×2/);
  }
});

test('unknown long-lead requirements cannot become a universal 150mm instruction',()=>{
  for(const id of ['wire','h_wire32','h_wire33','h_wireMouth','h_neckWire']){
    const row=materialFor(id);assert.doesNotMatch(row.spec,/150/);assert.match(row.spec+' '+row.note,/线长.*待核|长度.*待核/);
  }
});
