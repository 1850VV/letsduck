import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMMUNITY_KEY,MODEL_ID,createCommunity,designEnvelope,assertCompatible,readPrivateDesigns} from '../community-store.mjs';
const model=JSON.parse(readFileSync(new URL('../assets/model.json',import.meta.url)));
const catalog=JSON.parse(readFileSync(new URL('../assets/catalog.json',import.meta.url)));
const clone=x=>JSON.parse(JSON.stringify(x));
function memory(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};}
function setup(){const storage=memory(),community=createCommunity(model,catalog,storage);return {storage,community,design:community.find('demo-1')};}
test('all eight real mesh demos contain exact source mapping and bound original materials',()=>{
 const {community}=setup();assert.equal(community.list().length,8);
 for(const d of community.list()) {assert.equal(d.modelId,MODEL_ID);assert.equal(Object.keys(d.colors).length,35);assert.equal(community.validate(d),true);}
 assert.equal(community.find('demo-7').colors['P2-03'],'#FFFFFF');assert.equal(community.find('demo-7').colors['P2-04'],'#00B1B7');
});
test('compatibility rejects changed source, model, version, missing or extra parts, UUID, series, hardness and products',()=>{
 const {community,design}=setup(),p=model.parts[0];
 const changes=[d=>d.sourceHash='wrong',d=>d.source_sha256='wrong',d=>d.modelId='microduck',d=>d.schemaVersion=2,d=>delete d.colors[p.id],d=>d.assignments.extra='unknown',d=>d.partsById[p.id].uuid='wrong',d=>d.partsById[p.id].material='TPU 95A',d=>d.partsById[p.id].hardness='95A',d=>d.assignments[p.id]='unknown',d=>d.colors[p.id]='#123456',d=>d.assignments[p.id]=catalog.products.find(x=>x.series==='PLA Basic'&&x.hex===p.color).id];
 for(const change of changes){const d=clone(design);change(d);assert.equal(community.validate(d),false);assert.throws(()=>assertCompatible(model,catalog,d));}
 const changedCatalog=clone(catalog);changedCatalog.products.find(x=>x.id===design.assignments[p.id]).hardness='95A';
 assert.throws(()=>assertCompatible(model,changedCatalog,design),/耗材绑定/);
});
test('rating replacement persists one vote and own published works reject rating',()=>{
 const {storage,community,design}=setup();community.rate(design.id,5);assert.equal(community.stats(design).count,129);
 community.rate(design.id,2);assert.equal(community.stats(design).count,129);assert.equal(community.stats(design).average,(128*4.8+2)/129);
 const restored=createCommunity(model,catalog,storage);assert.equal(restored.stats(design).vote,2);
 for(const n of [0,6,2.5,'5'])assert.throws(()=>community.rate(design.id,n));
 const own=community.publish(design,{title:'Mine',consent:true});assert.throws(()=>community.rate(own.id,5),/自己/);
});
test('score ranking uses full Bayesian score so one five-star vote does not top many strong ratings',()=>{
 const {community}=setup(),classic=community.stats(community.find('demo-1')),one=community.stats(community.find('demo-7'));
 assert.ok(classic.rank>one.rank);assert.equal(one.rank,40/11);
});
test('public snapshots cannot be changed by callers, forks, or subsequent publications',()=>{
 const {community,design}=setup();const original=clone(design),provenance={derivedFromSchemeId:design.schemeId,derivedFromVersionId:design.versionId,sourceAuthor:design.author,sourceTitle:design.title};
 const own=community.publish({...design,provenance},{title:'First',consent:true});own.colors['P2-03']='#123456';
 const next=community.publish({...design,provenance},{title:'Second',consent:true});
 assert.notEqual(own.id,next.id);assert.equal(community.stats(next).count,0);assert.equal(community.stats(next).forks,0);assert.deepEqual(community.find(next.id).provenance,provenance);
 assert.deepEqual(community.find(design.id),original);assert.equal(community.find(own.id).colors['P2-03'],design.colors['P2-03']);
 const list=community.list();list[0].colors['P2-03']='#123456';assert.deepEqual(community.find(design.id),original);
});
test('fork intents and receipts are idempotent and count only completed full private copies',()=>{
 const {community,design,storage}=setup(),before=community.stats(design).forks;
 const request=community.requestFork(design.id);assert.equal(community.requestFork(design.id).id,request.id);assert.equal(community.stats(design).forks,before);
 request.design.colors['P2-03']='#123456';assert.equal(community.pending().design.colors['P2-03'],design.colors['P2-03']);
 assert.equal(community.pending().source.sourceAuthor,design.author);assert.equal(community.pending().source.derivedFromVersionId,design.versionId);
 assert.throws(()=>community.completeFork('missing','custom-123'));
 const receipt=community.completeFork(request.id,'custom-123');assert.equal(community.pending(),null);assert.equal(community.stats(design).forks,before+1);
 assert.deepEqual(community.completeFork(request.id,'custom-123'),receipt);assert.equal(community.stats(design).forks,before+1);
 assert.deepEqual(createCommunity(model,catalog,storage).getState().receipts[request.id],receipt);
 assert.throws(()=>community.completeFork(request.id,'custom-456'));
});
test('failed storage writes do not appear as votes, publications, fork intents or receipts',()=>{
 const {community,storage,design}=setup();let fail=false,write=storage.setItem;storage.setItem=(...args)=>{if(fail)throw Error('quota');return write(...args);};
 const request=community.requestFork(design.id),before=community.getState();fail=true;
 for(const action of [()=>community.rate(design.id,5),()=>community.publish(design,{title:'Fail',consent:true}),()=>community.requestFork('demo-2'),()=>community.completeFork(request.id,'custom-123')])assert.throws(action,/存储失败/);
 assert.deepEqual(community.getState(),before);
});
test('publication requires explicit consent, nonempty title, and complete real consumables',()=>{
 const {community,design}=setup();assert.throws(()=>community.publish(design,{title:'No'}),/同意/);assert.throws(()=>community.publish(design,{title:'  ',consent:true}),/名称/);
 const invalid=clone(design);invalid.assignments[model.parts[0].id]=null;assert.throws(()=>community.publish(invalid,{title:'Unbound',consent:true}),/耗材绑定/);
 assert.equal(community.getState().published.length,0);
});
test('private workbench designs keep identity, lineage, locks and unbound target colors without publishing',()=>{
 const {community,storage,design}=setup(),entry={id:'custom-123',name:'Private',colors:design.colors,assignments:design.assignments,provenance:{derivedFromVersionId:'demo-1'},locked:['P2-03']};
 storage.setItem('duck-studio-workflows-v1',JSON.stringify({version:1,source:model.source_sha256,saved:[entry]}));
 const items=readPrivateDesigns(model,catalog,storage);assert.equal(items.length,1);assert.equal(items[0].id,entry.id);assert.equal(items[0].title,entry.name);assert.equal(items[0].private,true);assert.deepEqual(items[0].locked,entry.locked);assert.deepEqual(items[0].provenance,entry.provenance);assert.equal(community.list().length,8);
 const unbound=clone(entry);unbound.colors['P2-03']='#123456';unbound.assignments['P2-03']=null;
 storage.setItem('duck-studio-workflows-v1',JSON.stringify({version:1,source:model.source_sha256,saved:[unbound]}));
 assert.equal(readPrivateDesigns(model,catalog,storage).length,1);assert.equal(community.validate(readPrivateDesigns(model,catalog,storage)[0]),false);
 const broken={...entry,assignments:undefined};storage.setItem('duck-studio-workflows-v1',JSON.stringify({version:1,source:model.source_sha256,saved:[broken]}));
 assert.equal(Object.values(readPrivateDesigns(model,catalog,storage)[0].assignments).filter(x=>x===null).length,35);
 assert.equal(storage.getItem(COMMUNITY_KEY),null);
});
test('envelope clones colors and preserves source metadata without touching the legacy prototype store',()=>{
 const {community,storage,design}=setup();storage.setItem('duck-community-design-prototype-v1','legacy');
 const envelope=designEnvelope(model,design);envelope.colors['P2-03']='#123456';assert.notEqual(envelope.colors['P2-03'],design.colors['P2-03']);
 community.rate(design.id,3);assert.equal(storage.getItem('duck-community-design-prototype-v1'),'legacy');
});

test('publication derives the dominant exterior hue and ignores inherited family',()=>{
 const {community,design}=setup();
 const recolor=(hex,ids=model.parts.filter(p=>p.material==='PLA Basic').map(p=>p.id))=>{
  const d=clone(design);d.family='wrong-source-family';
  for(const id of ids){d.colors[id]=hex;d.assignments[id]=catalog.products.find(p=>p.series==='PLA Basic'&&p.hex===hex).id;}
  return d;
 };
 for(const [hex,family] of [['#0056B8','blue'],['#3F8E43','green'],['#FF6A13','warm'],['#5E43B7','purple'],['#FFFFFF','mono'],['#545454','mono']]) {
  const result=community.publish(recolor(hex),{title:family,consent:true});assert.equal(result.family,family);
 }
 // One vivid exterior accent remains discoverable among white shells and black structure.
 const accent=recolor('#FFFFFF');accent.colors['P2-03']='#3F8E43';accent.assignments['P2-03']=catalog.products.find(p=>p.series==='PLA Basic'&&p.hex==='#3F8E43').id;
 assert.equal(community.publish(accent,{title:'Accent',consent:true}).family,'green');
 // Visible shells take precedence over a larger number of differently colored internal parts.
 const exteriorIds=['P4-01','P2-01','P2-02','P3-01','P5-06','P5-07','P4-03','P5-03','P5-01','P5-02','P6-04','P6-05','P6-02','P6-03','P2-03','P2-04'];
 const visible=recolor('#5E43B7');for(const id of exteriorIds){visible.colors[id]='#FFFFFF';visible.assignments[id]=catalog.products.find(p=>p.series==='PLA Basic'&&p.hex==='#FFFFFF').id;}
 visible.colors['P2-03']='#FF6A13';visible.assignments['P2-03']=catalog.products.find(p=>p.series==='PLA Basic'&&p.hex==='#FF6A13').id;
 assert.equal(community.publish(visible,{title:'Visible',consent:true}).family,'warm');
 // With neutral shells, use the complete design's remaining chromatic parts.
 visible.colors['P2-03']='#FFFFFF';visible.assignments['P2-03']=catalog.products.find(p=>p.series==='PLA Basic'&&p.hex==='#FFFFFF').id;
 assert.equal(community.publish(visible,{title:'Internal',consent:true}).family,'purple');
});
