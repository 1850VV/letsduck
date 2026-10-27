import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCE,ZONES,editableIds,schemePatch} from '../frontend/lib/duck-workbench.mjs';
const {parts,source_sha256}=JSON.parse(readFileSync(new URL('../assets/model.json',import.meta.url)));
const {products:entries}=JSON.parse(readFileSync(new URL('../assets/catalog.json',import.meta.url)));
const products=new Map(entries.map(p=>[p.id,p]));
const baseline={colors:Object.fromEntries(parts.map(p=>[p.id,p.color])),assignments:Object.fromEntries(parts.map(p=>[p.id,entries.find(x=>x.series===p.material&&x.hex===p.color)?.id]))};
test('fixed model regions cover each real part exactly once, with no cross-material groups',()=>{
 assert.equal(SOURCE,source_sha256);
 const ids=ZONES.flatMap(z=>z.ids);
 assert.equal(ids.length,35);assert.equal(new Set(ids).size,35);
 assert.deepEqual([...ids].sort(),parts.map(p=>p.id).sort());
 for(const zone of ZONES)assert.equal(new Set(zone.ids.map(id=>parts.find(p=>p.id===id).material)).size,1,zone.name);
});
test('locked mirrored parts and unknown IDs cannot enter a mutation',()=>{
 assert.deepEqual(editableIds(parts,['P2-03','P2-04','P2-03','unknown'],['P2-04']),['P2-03']);
 assert.deepEqual(editableIds(parts,['P1-03','P1-04'],['P1-03','P1-04']),[]);
});
test('whole-model theme application excludes locks and preserves both original material families',()=>{
 const patch=schemePatch(parts,parts.map(p=>p.id),['P4-01','P1-03'],baseline,products);
 assert.equal(Object.keys(patch.colors).length,33);assert.ok(!('P4-01' in patch.colors));assert.ok(!('P1-03' in patch.assignments));
 for(const [id,productId]of Object.entries(patch.assignments))assert.equal(products.get(productId).series,parts.find(p=>p.id===id).material);
});
test('theme transfer keeps unbound targets and never copies a PLA binding to TPU',()=>{
 const design={colors:{...baseline.colors,'P1-03':'#4d6bfe'},assignments:{...baseline.assignments,'P1-03':'bambu-GFA00-10604'}};
 const patch=schemePatch(parts,['P1-03'],[],design,products);
 assert.deepEqual(patch,{colors:{'P1-03':'#4D6BFE'},assignments:{'P1-03':null}});
});
test('incomplete source theme fails before any patch can be committed',()=>{
 const colors={...baseline.colors};delete colors['P4-01'];
 assert.throws(()=>schemePatch(parts,['P2-03','P4-01'],[],{colors,assignments:baseline.assignments},products));
 assert.equal(baseline.colors['P2-03'],'#0056B8');
});
test('applying a saved cross-brand design retains its product binding',()=>{
 const product={id:'sample-cf',brand:'Sample',series:'PLA-CF',material:'PLA',hex:'#123456'};
 const design={colors:{...baseline.colors,'P4-01':product.hex},assignments:{...baseline.assignments,'P4-01':product.id}};
 assert.equal(schemePatch(parts,['P4-01'],[],design,new Map([...products,[product.id,product]])).assignments['P4-01'],product.id);
});
