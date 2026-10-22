import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

test('language runtime selects supported browser preferences and retains explicit choices',async()=>{
  assert.ok(existsSync(new URL('../frontend/shared/i18n.mjs',import.meta.url)),'locale runtime must exist');
  const {matchLocales,createLocaleController}=await import('../frontend/shared/i18n.mjs');
  for(const [input,want]of [[['th-TH','fr-CA'],'fr'],[['zh-HK'],'zh-Hant'],[['zh-SG'],'zh-Hans'],[['pt-PT'],'pt-BR'],[['ar-SA'],'ar'],[['xx'],'en']])assert.equal(matchLocales(input),want);
  const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
  const controller=createLocaleController({storage,languages:()=>['ja-JP']});
  assert.equal(controller.locale,'ja');controller.select('fr');assert.equal(controller.locale,'fr');
  assert.equal(createLocaleController({storage,languages:()=>['en-US']}).locale,'fr');
  controller.select('auto');assert.equal(controller.locale,'ja');assert.equal(memory.size,0);
  controller.select('invalid');assert.equal(controller.locale,'ja');
  const unavailable=createLocaleController({storage:{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');},removeItem(){throw Error('blocked');}},languages:()=>['de-DE']});
  unavailable.select('ko');assert.equal(unavailable.locale,'ko');
});

test('translations preserve interpolated user text and expose complete consistent catalogs',async()=>{
  assert.ok(existsSync(new URL('../frontend/shared/i18n.mjs',import.meta.url)),'locale runtime must exist');
  const {translate,LOCALES,catalogs}=await import('../frontend/shared/i18n.mjs');
  assert.equal(LOCALES.length,12);
  assert.equal(translate('en','common.save'),'Save');
  assert.equal(translate('fr','common.save'),'Enregistrer');
  assert.equal(translate('ar','common.save'),'حفظ');
  assert.equal(translate('en','common.saved',{name:'我的猫 <b>海风</b>'}),'Saved “我的猫 <b>海风</b>”');
  for(const locale of LOCALES.map(x=>x.code)){
    assert.deepEqual(Object.keys(catalogs[locale]).sort(),Object.keys(catalogs.en).sort(),locale);
    for(const key of Object.keys(catalogs.en)){
      assert.ok(catalogs[locale][key].trim(),`${locale}: ${key}`);
      assert.deepEqual((catalogs[locale][key].match(/\{\w+\}/g)||[]).sort(),(catalogs.en[key].match(/\{\w+\}/g)||[]).sort(),`${locale}: ${key} placeholders`);
    }
  }
});

test('anatomical side selection never depends on translated display names',async()=>{
  const {sideParts}=await import('../frontend/lib/color-workflows.mjs');
  const parts=[{id:'P2-03',pair:'P2-04',material:'PLA Basic',name:'A'},{id:'P2-04',pair:'P2-03',material:'PLA Basic',name:'B'}];
  assert.deepEqual(sideParts(parts,['P2-03','P2-04'],'left'),['P2-04']);
  assert.deepEqual(sideParts(parts,['P2-03','P2-04'],'right'),['P2-03']);
});

test('network failures expose a stable localized error instead of browser-native English',async()=>{
  const {api}=await import('../frontend/shared/api.mjs');
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};
  try{await assert.rejects(api('GET','/works'),error=>error.code==='request_failed'&&error.message!=='Failed to fetch');}
  finally{globalThis.fetch=original;}
});

test('source labels retain their identity when other languages share the same word',async()=>{
  const {label,setLocale,translate}=await import('../frontend/shared/i18n.mjs');
  for(const locale of ['en','ja','zh-Hans']){setLocale(locale);assert.equal(label('青色'),translate(locale,'text.0700'));}
});

test('stored notification descriptors translate again without changing user parameters',async()=>{
  const {message,setLocale,translate}=await import('../frontend/shared/i18n.mjs');
  assert.equal(typeof message,'function');
  setLocale('en');const saved=message('common.saved',{name:'青色 <作品>'});
  assert.equal(String(saved),'Saved “青色 <作品>”');
  setLocale('fr');assert.equal(String(saved),translate('fr','common.saved',{name:'青色 <作品>'}));
});

test('new backend queue and pagination errors have localized messages',async()=>{
  const {errorText,setLocale}=await import('../frontend/shared/i18n.mjs');
  setLocale('en');assert.match(errorText({code:'export.busy'}),/export.*busy/i);
  assert.match(errorText({code:'request.pagination'}),/page/i);
});
