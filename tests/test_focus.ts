import test from 'node:test';
import assert from 'node:assert/strict';
import {readModel} from './fixtures/source-data.js';
import {detailRegion,gridSlots,hsvToHex,hexToHsv} from '../frontend/lib/focus-rules.js';
const parts=readModel(new URL('../assets/model.json',import.meta.url)).parts;
test('every real instance opens a nonempty region containing itself',()=>{
  for(const p of parts){const region=detailRegion(parts,p.id);assert.ok(region.ids.includes(p.id));assert.equal(new Set(region.ids).size,region.ids.length);assert.ok(region.ids.every(id=>parts.some(p=>p.id===id)));}
});
test('head selection shows head; left and right legs are independent',()=>{
  assert.equal(detailRegion(parts,'P4-01').name,'头部');assert.ok(detailRegion(parts,'P4-01').ids.includes('P1-01'));
  assert.ok(!detailRegion(parts,'P4-01').ids.includes('P6-01'));
  const left=detailRegion(parts,'P2-04'),right=detailRegion(parts,'P2-03');assert.ok(left.ids.every(id=>!right.ids.includes(id)));
  assert.deepEqual(detailRegion(parts,'P2-06',true).ids,['P2-06']);
});
test('array slots are unique, separated and bounded for every region size',()=>{
  for(const n of [1,2,4,5,8,9,17,35]){const slots=gridSlots(n);assert.equal(slots.length,n);assert.equal(new Set(slots.map(s=>s.x+','+s.y)).size,n);
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)assert.ok(Math.hypot(slots[i]!.x-slots[j]!.x,slots[i]!.y-slots[j]!.y)>=150);
  }
  assert.deepEqual(gridSlots(0),[]);
});
test('HSV preserves source palette, grey, black and hue boundary',()=>{
  for(const hex of ['#4D6BFE','#0056B8','#FFFFFF','#000000','#C12E1F','#808080','#00FFFF']){const {h,s,v}=hexToHsv(hex);assert.equal(hsvToHex(h,s,v),hex);}
  assert.equal(hsvToHex(360,1,1),'#FF0000');assert.equal(hsvToHex(-120,1,1),'#0000FF');
});
