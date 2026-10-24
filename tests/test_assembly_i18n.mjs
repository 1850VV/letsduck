import test from 'node:test';
import assert from 'node:assert/strict';
import {STEPS,CHAPTERS,ACTORS} from '../frontend/assemble/hardware-state.mjs';

// Catches an absent language, wrong step association, or replacement of motion data.
test('assembly text loads independently for every locale and preserves instruction identities',async()=>{
 const {loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs');
 for(const locale of ['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi']){
  const copy=await loadAssemblyLocale(locale);
  assert.equal(Object.keys(copy.steps).length,111,locale);
  for(const s of STEPS){assert.ok(copy.steps[s.id].title);assert.ok(copy.steps[s.id].text);assert.ok(copy.steps[s.id].check);}
  for(const c of CHAPTERS)assert.ok(copy.chapters[c.id].name);
  for(const [id,a] of Object.entries(ACTORS))if(a.label)assert.ok(copy.actors[id].label);
 }
});
test('switching text preserves tutorial timing, parts and camera and never falls back silently',async()=>{
 const {loadAssemblyLocale,localizeStep}=await import('../frontend/assemble/assembly-i18n.mjs');
 const copy=await loadAssemblyLocale('en'),s=STEPS.find(x=>x.id==='head-neck-join');
 const localized=localizeStep(s,copy);
 assert.equal(localized.sourceStart,s.sourceStart);assert.equal(localized.parts,s.parts);assert.equal(localized.camera,s.camera);
 assert.match(localized.text,/operator.s left/i);
 assert.throws(()=>localizeStep({...s,id:'missing'},copy),/missing/i);
 await assert.rejects(loadAssemblyLocale('xx'),/unsupported/i);
});
test('Arabic isolates hardware identifiers without mirroring or changing their spelling',async()=>{
 const {isolateTechnical}=await import('../frontend/assemble/assembly-i18n.mjs');
 assert.equal(isolateTechnical('ID32 P6-08 M2×6 16×22×4 mm','ar'),'\u2068ID32\u2069 \u2068P6-08\u2069 \u2068M2×6\u2069 \u206816×22×4 mm\u2069');
 assert.equal(isolateTechnical('ID32 P6-08','en'),'ID32 P6-08');
});
test('localized focus warnings retain pending fit status',async()=>{
 const {localizeFocus}=await import('../frontend/assemble/assembly-i18n.mjs');
 const copy={ui:{'模型配合待核':'Fit not verified','红框':'Red frame','接头放大':'Connector detail','{ordinal}/{total} · {status}':'{ordinal}/{total} · {status}','{frame} · {status}':'{frame} · {status}'}};
 const focus={detailTitle:'接头放大',detailStatus:'1/3 · 模型配合待核',message:'红框 · 模型配合待核',detailPhase:'pending',boxes:[{center:[1,2,3]}]};
 const result=localizeFocus(focus,copy);
 assert.equal(result.message,'Red frame · Fit not verified');assert.equal(result.detailStatus,'1/3 · Fit not verified');
 assert.equal(result.boxes,focus.boxes);assert.equal(result.detailPhase,'pending');
});
test('complete corpora reject missing fields, changed identifiers and Chinese fallback',async()=>{
 const {auditAssemblyLocales}=await import('../scripts/check_assembly_i18n.mjs');
 const result=await auditAssemblyLocales();assert.deepEqual(result.sourceDrift,[]);
 for(const row of result.reports)assert.deepEqual(row.errors,[],row.locale);
});
test('real locale data covers every focus action and retains technical warnings',async()=>{
 const {loadAssemblyLocale,localizeFocus}=await import('../frontend/assemble/assembly-i18n.mjs');
 for(const locale of ['zh-Hans','zh-Hant','en','ja','ko','fr','de','es','pt-BR','ru','ar','hi']){
  const copy=await loadAssemblyLocale(locale);
  for(const status of ['拧入中','已紧固','预拧中','预拧到位','正在取下','已取下','插接中','已接合','整理中','余量已留好','压入中','已就位','模型配合待核']){
   for(const detailTitle of ['螺丝放大','舵盘放大','轴承放大','踝轴放大','线端放大','接头放大']){
    const output=localizeFocus({detailTitle,detailStatus:'1/4 · '+status,message:'红框 · '+status,detailPhase:'pending'},copy);
    assert.ok(output.detailTitle&&output.detailStatus.includes('1/4'));assert.equal(output.detailPhase,'pending');
    if(!['zh-Hans','zh-Hant','ja'].includes(locale))assert.equal(/[\u3400-\u9fff]/u.test(output.message+output.detailTitle+output.detailStatus),false,locale);
   }
  }
 }
});
test('RTL technical ranges, times and fastener counts retain left-to-right order',async()=>{
 const {isolateTechnical}=await import('../frontend/assemble/assembly-i18n.mjs');
 assert.equal(isolateTechnical('10–14 20:37 M2×6 ×4 KP=5 1.27mm','ar'),'\u206810–14\u2069 \u206820:37\u2069 \u2068M2×6 ×4\u2069 \u2068KP=5\u2069 \u20681.27mm\u2069');
});
test('mouth instructions refer to robot components and preserve the through-opening cable route',async()=>{
 const {loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs'),copy=await loadAssemblyLocale('en');
 assert.match(copy.steps['head-mouth-jaw'].title,/mouth servo/i);assert.doesNotMatch(copy.steps['head-mouth-jaw'].title,/your mouth|your chin/i);
 assert.match(copy.steps['head-mouth-jaw'].text,/through the opening/i);
});
test('force-fitting with screws remains an explicit prohibition',async()=>{
 const {loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs'),copy=await loadAssemblyLocale('en');
 for(const id of ['r-shank','l-shank']){assert.match(copy.steps[id].check,/do not use screws/i);assert.match(copy.steps[id].check,/misaligned|skewed/i);}
});
test('video evidence is not translated into nonexistent press actions',async()=>{
 const {loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs'),copy=await loadAssemblyLocale('en');
 for(const id of ['prepare-usb','t-bearing-r','t-bearing-l','t-wire','head-servo-support','head-core-join','head-upper-pad-check','final-head-join','calibration-power'])assert.doesNotMatch(copy.steps[id].text,/press (?:the )?(?:video|subtitle|screen|original piece|12:28|4)/i,id);
});
test('approximate timestamp does not invent per-side fastener evidence',async()=>{
 const {loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs'),copy=await loadAssemblyLocale('en');
 assert.match(copy.steps['final-body-shells'].text,/around 19:05/i);assert.doesNotMatch(copy.steps['final-body-shells'].text,/left and right subtitles/i);
});
test('first locale failure leaves an initialized recoverable language controller',async()=>{
 const {createAssemblyLanguageController,loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs');
 let attempts=0;const controller=createAssemblyLanguageController(async locale=>{if(!attempts++)throw new Error('temporary asset failure');return loadAssemblyLocale(locale);});
 assert.equal(await controller.select('en'),'failed');assert.equal(controller.state.copy,null);assert.equal(controller.state.locale,null);assert.equal(controller.state.requested,'en');assert.ok(controller.state.error);
 assert.equal(await controller.select('ja'),'loaded');assert.equal(controller.state.locale,'ja');assert.ok(controller.state.copy.steps['prepare-intro'].title);assert.equal(controller.state.error,null);
});
test('failed switch retains effective language and ignores stale imports',async()=>{
 const {createAssemblyLanguageController,loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs');
 let finish;
 const controller=createAssemblyLanguageController(async locale=>{if(locale==='ar')throw new Error('missing locale');if(locale==='de')await new Promise(resolve=>{finish=resolve;});return loadAssemblyLocale(locale);});
 await controller.select('en');const copy=controller.state.copy;
 assert.equal(await controller.select('ar'),'failed');assert.equal(controller.state.copy,copy);assert.equal(controller.state.locale,'en');assert.equal(controller.state.requested,'ar');
 const slow=controller.select('de');await controller.select('ja');finish();assert.equal(await slow,'stale');assert.equal(controller.state.locale,'ja');assert.equal(controller.state.requested,'ja');assert.equal(controller.state.error,null);
});

test('controller placement describes the robot body',async()=>{
 const {loadAssemblyLocale}=await import('../frontend/assemble/assembly-i18n.mjs'),copy=await loadAssemblyLocale('en');
 assert.doesNotMatch(copy.steps['final-board-mount'].text,/your body/i);assert.match(copy.steps['final-board-mount'].text,/robot.*body|body.*robot/i);
});
