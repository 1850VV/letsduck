import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groupPalette,paintTargets,pairedParts,sideParts,validDesign} from '../frontend/lib/color-workflows.mjs';
const root=new URL('../',import.meta.url);
const {parts}=JSON.parse(readFileSync(new URL('assets/model.json',root)));
const {products:entries}=JSON.parse(readFileSync(new URL('assets/catalog.json',root)));
const products=new Map(entries.map(p=>[p.id,p]));
const colors=Object.fromEntries(parts.map(p=>[p.id,p.color]));
const assignments=Object.fromEntries(parts.map(p=>[p.id,entries.find(x=>x.series===p.material&&x.hex===p.color)?.id]));
test('reopening a real cross-brand colour keeps its exact product ID',()=>{
 const product={id:'sample-cf',brand:'Sample',series:'PLA-CF',material:'PLA',hex:'#123456'};
 const custom=new Map([...products,[product.id,product]]),design={colors:{...colors,'P4-01':product.hex},assignments:{...assignments,'P4-01':product.id}};
 assert.equal(validDesign(design,parts,custom).assignments['P4-01'],product.id);
});
test('baseline palette keeps PLA black and TPU black in distinct groups',()=>{
 const groups=groupPalette(parts,colors,assignments);
 assert.equal(groups.length,4);assert.equal(groups.filter(g=>g.color==='#000000').length,2);
 assert.deepEqual(groups.map(g=>g.ids.length).sort((a,b)=>a-b),[4,5,7,19]);
 assert.equal(groups.flatMap(g=>g.ids).length,35);
});
test('bulk replacement stays within selected color group despite pair linking',()=>{
 const p=parts.find(p=>p.pair),ids=[p.id];
 assert.deepEqual(paintTargets(parts,ids,true,true),ids);
 assert.deepEqual(paintTargets(parts,ids,true,false).sort(),[p.id,p.pair].sort());
});
test('multi selection deduplicates mirrored parts and ignores invalid ids',()=>{
 const p=parts.find(p=>p.pair);
 assert.deepEqual(paintTargets(parts,[p.id,p.pair,p.id,'missing'],true).sort(),[p.id,p.pair].sort());
});
test('every source pair can be painted on either side independently',()=>{
 for(const p of parts.filter(p=>p.pair)) {
  assert.deepEqual(paintTargets(parts,[p.id],false),[p.id]);
  assert.deepEqual(new Set(paintTargets(parts,[p.id],true)),new Set([p.id,p.pair]));
  assert.equal(pairedParts(parts,[p.id]).length,2);
 }
});
test('pair chooser follows anatomical names and does not invent pairs for joined eyes or mixed selection',()=>{
 assert.deepEqual(pairedParts(parts,['P2-03']).map(p=>p.id),['P2-04','P2-03']);
 assert.deepEqual(pairedParts(parts,['P2-03','P2-04']).map(p=>p.id),['P2-04','P2-03']);
 for(const ids of [[],['missing'],['P2-06'],['P3-01'],['P2-03','P5-01']])assert.deepEqual(pairedParts(parts,ids),[]);
 assert.deepEqual(pairedParts(parts,['P3-02']).map(p=>p.name),['颈部连接板 A','颈部连接板 B']);
});
test('side selection excludes center body panels and keeps the original material',()=>{
 const body=['P5-06','P5-07','P4-03','P5-03'];
 assert.deepEqual(sideParts(parts,body,'left'),['P5-07']);
 assert.deepEqual(sideParts(parts,body,'right'),['P5-06']);
 assert.deepEqual(sideParts(parts,['P3-02','P3-03'],'left'),[]);
 assert.deepEqual(sideParts(parts,['P1-03','P1-04'],'left'),['P1-04']);
 const legs=['P5-01','P5-02','P6-04','P6-05','P6-02','P6-03'];
 assert.deepEqual(sideParts(parts,legs,'left'),['P5-02','P6-05','P6-03']);
 assert.deepEqual(sideParts(parts,legs,'right'),['P5-01','P6-04','P6-02']);
});
test('saved scheme revalidation rejects changed hardness/product mismatch but retains target colors',()=>{
 const p=parts.find(p=>p.material==='TPU 90A');
 const invalid={...assignments,[p.id]:entries.find(x=>x.series==='PLA Basic'&&x.hex===p.color).id};
 const result=validDesign({colors,assignments:invalid},parts,products);
 assert.equal(result.assignments[p.id],null);assert.equal(result.colors[p.id],p.color);
 assert.equal(Object.keys(result.colors).length,35);
});
test('incomplete saved schemes cannot silently omit model parts',()=>{
 const incomplete={...colors};delete incomplete[parts[0].id];
 assert.equal(validDesign({colors:incomplete,assignments},parts,products),null);
});
test('unbound brand blue survives round trip without inventing a product',()=>{
 const p=parts.find(p=>p.material==='PLA Basic');
 const changed={...colors,[p.id]:'#4d6bfe'};
 const result=validDesign({colors:changed,assignments},parts,products);
 assert.equal(result.colors[p.id],'#4D6BFE');assert.equal(result.assignments[p.id],null);
});
