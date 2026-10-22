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
