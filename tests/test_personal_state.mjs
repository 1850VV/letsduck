import test from 'node:test';
import assert from 'node:assert/strict';
const state=await import('../frontend/shared/personal-state.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),values};};
const scheme={id:'one',name:'Saved',updated:123,design:{colors:{'P4-01':'#123456'},assignments:{'P4-01':'hex:#123456'}}};
test('first visit seeds the same saved draft before any page reads it, without writing the API',async()=>{
 assert.equal(typeof state.ensurePersonalDraft,'function');const storage=memory();
 await state.ensurePersonalDraft(storage,async()=>[scheme]);const result=JSON.parse(storage.getItem('dd-studio-personal')).draft;
 assert.equal(result.name,'Saved');assert.equal(result.activeId,'one');assert.equal(result.updated,123);assert.deepEqual(result.design,scheme.design);
});
test('an edit made while initialization is pending wins over the saved fallback',async()=>{
 assert.equal(typeof state.ensurePersonalDraft,'function');const storage=memory();let resolve;const pending=state.ensurePersonalDraft(storage,()=>new Promise(r=>resolve=r));
 const draft={...scheme,activeId:'other',updated:456};storage.setItem('dd-studio-personal',JSON.stringify({draft}));resolve([scheme]);await pending;
 assert.equal(JSON.parse(storage.getItem('dd-studio-personal')).draft.activeId,'other');
});
test('valid legacy drafts including untouched drafts survive initialization; corrupt records can recover',async()=>{
 assert.equal(typeof state.ensurePersonalDraft,'function');const storage=memory();storage.setItem('dd-studio-personal',JSON.stringify({draft:{...scheme,updated:0},locks:['P4-01']}));
 await state.ensurePersonalDraft(storage,async()=>{throw Error('must not fetch');});assert.equal(JSON.parse(storage.getItem('dd-studio-personal')).draft.updated,0);assert.equal(typeof JSON.parse(storage.getItem('dd-studio-personal')).draft.draftId,'string');
 for(const bad of ['{bad',JSON.stringify({draft:{design:{colors:[]}}})]){storage.setItem('dd-studio-personal',bad);await state.ensurePersonalDraft(storage,async()=>[scheme]);assert.equal(JSON.parse(storage.getItem('dd-studio-personal')).draft.activeId,'one');}
});
test('empty API and network failure keep initialization recoverable',async()=>{
 assert.equal(typeof state.ensurePersonalDraft,'function');const storage=memory();await state.ensurePersonalDraft(storage,async()=>[]);assert.equal(storage.getItem('dd-studio-personal'),null);await assert.rejects(state.ensurePersonalDraft(storage,async()=>{throw Error('offline');}),/offline/);
});
const progress=await import('../frontend/assemble/progress-store.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
test('step and fractional viewing progress survive a new store instance; schemes and tutorial versions are isolated',()=>{
 assert.equal(typeof progress.createProgressStore,'function');const storage=memory(),steps=[{id:'start'},{id:'stage-8-step-59'}];const a=progress.createProgressStore(storage,steps,'tutorial-v1');
 a.write('scheme:one',{step:1,progress:.42});assert.deepEqual(progress.createProgressStore(storage,steps,'tutorial-v1').read('scheme:one'),{step:1,progress:.42});assert.deepEqual(a.read('scheme:two'),{step:0,progress:1});assert.deepEqual(progress.createProgressStore(storage,steps,'tutorial-v2').read('scheme:one'),{step:0,progress:1});
});
test('corrupt, out of range and unknown old records reset without poisoning other schemes',()=>{
 assert.equal(typeof progress.createProgressStore,'function');const storage=memory(),store=progress.createProgressStore(storage,[{id:'start'},{id:'next'}],'v1');
 store.write('good',{step:1,progress:.7});const key=store.key('bad');for(const value of ['bad','{}','{"version":0,"step":1,"progress":0.5}',JSON.stringify({version:1,step:1,stepId:'next',progress:2}),JSON.stringify({version:1,step:99,stepId:'next',progress:.5}),JSON.stringify({version:1,step:1,stepId:'renamed',progress:.5})]){storage.setItem(key,value);assert.deepEqual(store.read('bad'),{step:0,progress:1});}
 assert.equal(store.write('bad',{step:NaN,progress:NaN}),false);assert.equal(store.write('bad',{step:2,progress:.5}),false);assert.deepEqual(store.read('good'),{step:1,progress:.7});
});
test('unsaved designs have stable distinct scopes; named schemes retain identity through edits',()=>{
 assert.equal(typeof progress.progressScope,'function');const a={draftId:'draft-a',design:scheme.design,name:'a'},b={...a,draftId:'draft-b',design:{...scheme.design,colors:{'P4-01':'#654321'}}};
 assert.equal(progress.progressScope(a),progress.progressScope(structuredClone(a)));assert.equal(progress.progressScope(a),progress.progressScope({...a,design:b.design}));assert.notEqual(progress.progressScope(a),progress.progressScope(b));assert.equal(progress.progressScope({...a,activeId:'one'}),progress.progressScope({...b,activeId:'one'}));
});

test('legacy draft identity also works when randomUUID is unavailable on HTTP origins',async()=>{
 const storage=memory();storage.setItem('dd-studio-personal',JSON.stringify({draft:{...scheme,updated:0}}));
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'crypto');try{Object.defineProperty(globalThis,'crypto',{value:{},configurable:true});await state.ensurePersonalDraft(storage,async()=>[]);assert.equal(typeof JSON.parse(storage.getItem('dd-studio-personal')).draft.draftId,'string');}finally{if(descriptor)Object.defineProperty(globalThis,'crypto',descriptor);else delete globalThis.crypto;}
});
