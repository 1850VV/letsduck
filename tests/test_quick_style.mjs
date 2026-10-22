import test from 'node:test';
import {setLocale} from '../frontend/shared/i18n.mjs';
setLocale('zh-Hans');
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SLOTS,RECIPES,THEMES,quickDesign,rollSlots,themeSlots,slotsFromDesign,designNotes,encodeLook,decodeLook} from '../frontend/lib/quick-style.mjs';
const {parts}=JSON.parse(readFileSync(new URL('../assets/model.json',import.meta.url)));
const {products:entries}=JSON.parse(readFileSync(new URL('../assets/catalog.json',import.meta.url)));
const products=new Map(entries.map(p=>[p.id,p]));
const seeded=seed=>()=>((seed=Math.imul(seed^seed>>>15,2246822519)+0x9e3779b9>>>0)/4294967296);
test('every theme resolves to real products of the right material and paints all 35 parts',()=>{
 for(const theme of THEMES){
  const slots=themeSlots(products,theme);
  for(const slot of SLOTS)assert.equal(products.get(slots[slot.id])?.series,slot.material||'PLA Basic',theme.name+' '+slot.id);
  const {colors,assignments}=quickDesign(parts,products,slots,theme.recipe);
  assert.equal(Object.keys(colors).length,35);
  for(const p of parts){const product=products.get(assignments[p.id]);assert.equal(product.series,p.material,p.id);assert.equal(product.hex,colors[p.id]);}
 }
});
test('every recipe keeps soft parts on TPU and the eye readable against its shell',()=>{
 const slots=themeSlots(products,THEMES.find(t=>t.name==='银河漫游'));
 for(const recipe of Object.keys(RECIPES)){
  const {colors}=quickDesign(parts,products,{...slots,accent:'bambu-GFA00-10101'},recipe);
  assert.notEqual(colors['P3-01'],colors['P2-06'],recipe);
 }
 assert.throws(()=>quickDesign(parts,products,{...slots,pad:'bambu-GFA00-10100'},'经典'),/TPU 90A/);
});
test('dice respects locks and always returns valid slots',()=>{
 const start=themeSlots(products,THEMES[0]),rand=seeded(7);
 for(let i=0;i<200;i++){
  const r=rollSlots(products,start,'经典',{main:true,pad:true,recipe:true},rand);
  assert.equal(r.slots.main,start.main);assert.equal(r.slots.pad,start.pad);assert.equal(r.recipe,'经典');
  assert.notEqual(r.slots.accent,r.slots.sub);
  quickDesign(parts,products,r.slots,r.recipe);
 }
});
test('the panel reads its roles back from an existing design',()=>{
 const slots=themeSlots(products,THEMES[2]),{assignments}=quickDesign(parts,products,slots,'经典');
 assert.deepEqual(slotsFromDesign(products,assignments,{}),slots);
});
test('share links round-trip, carry the name and reject other models or broken data',()=>{
 const {colors,assignments}=quickDesign(parts,products,themeSlots(products,THEMES[4]),'双拼');
 const look=encodeLook(parts,products,assignments,'马卡龙 · 春天');
 assert.ok(encodeLook(parts,products,assignments).length<80);
 assert.deepEqual(decodeLook(parts,products,look),{colors,assignments,name:'马卡龙 · 春天'});
 assert.throws(()=>decodeLook(parts,products,look.replace(/^v1\.\w{8}/,'v1.deadbeef')),/模型版本/);
 assert.throws(()=>decodeLook(parts,products,look.replace(/\.[0-9a-z]{35}/,'.000')),/零件数量/);
 assert.throws(()=>encodeLook(parts,products,{...assignments,'P2-06':null}),/匹配实际耗材/);
});
test('notes count filaments and warn about near-identical neighbours',()=>{
 const slots=themeSlots(products,THEMES[0]),{colors,assignments}=quickDesign(parts,products,slots,'经典');
 assert.equal(designNotes(colors,assignments).count,4);
 assert.equal(designNotes(colors).count,3,'PLA and TPU black share a hex');
 const close=quickDesign(parts,products,{...slots,main:'bambu-GFA00-10601',accent:'bambu-GFA00-10701'},'经典').colors;
 assert.ok(designNotes({...close,'P2-06':'#0A2989','P4-01':'#0A2989'}).warnings.length===0);
 assert.ok(designNotes({...colors,'P2-06':'#FFFFFF','P4-01':'#F7E6DE'}).warnings[0].includes('眼框'));
});
