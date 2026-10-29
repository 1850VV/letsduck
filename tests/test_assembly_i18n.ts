import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {ACTORS,STEPS,CHAPTERS,snapshot} from '../frontend/assemble/hardware-state.js';
import {preparationCopy} from '../frontend/assemble/full/prepare.js';
import {materialFor,stepMaterials,chapterMaterials} from '../frontend/assemble/material-catalog.js';

const moduleUrl=new URL('../frontend/locales/assembly-data.ts',import.meta.url);

test('assembly display adapter translates known stable fields and preserves manufacturing identities',async()=>{
  assert.ok(existsSync(moduleUrl),'assembly stable-ID display adapter must exist');
  const {assemblyDataText}=await import('../frontend/locales/assembly-data.js');
  const before=JSON.stringify({ACTORS,STEPS,CHAPTERS,state:snapshot(60,.5)});
  const intro=STEPS[0]!;
  assert.equal(assemblyDataText('en','step',intro.id,'title',intro.title),'Meet the robot and assembly route');
  assert.equal(assemblyDataText('zh-Hans','step',intro.id,'title',intro.title),intro.title);
  assert.equal(assemblyDataText('en','step','unknown','title','我的方案'),'我的方案');
  const material=materialFor('p_motor');
  assert.equal(assemblyDataText('en','material',material.id,'name',material.name),'Single servo awaiting an ID');
  assert.equal(materialFor('p_motor').name,'待编号的单只舵机');
  assert.equal(JSON.stringify({ACTORS,STEPS,CHAPTERS,state:snapshot(60,.5)}),before);
});

test('every tutorial, actor and derived inventory display value has an explicit stable-ID catalog entry',async()=>{
  assert.ok(existsSync(moduleUrl),'assembly stable-ID display adapter must exist');
  const {assemblyDataText,assemblyDataKey}=await import('../frontend/locales/assembly-data.js');
  const rows:{kind:string;id:string;field:string;value:string}[]=[];
  const add=(kind:string,item:object,fields:string[])=>{for(const field of fields){const value:unknown=Reflect.get(item,field);if(typeof value==='string'&&value)rows.push({kind,id:String(Reflect.get(item,'id')),field,value});}};
  for(const item of STEPS)for(const automatic of [true,false])add('step',preparationCopy(item,automatic),['short','title','text','check','caption']);
  for(const item of STEPS)add('step',item,['short','title','text','check','caption']);
  for(const item of CHAPTERS)add('chapter',item,['name']);
  for(const [id,actor]of Object.entries(ACTORS)){add('actor',{id,...actor},['label','source','chip']);add('material',materialFor(id),['name','short','spec','note','quantity']);}
  for(let i=0;i<STEPS.length;i++)for(const item of stepMaterials(i))add('material',item,['name','short','spec','note','quantity']);
  for(const chapter of CHAPTERS)for(const item of chapterMaterials(chapter))add('material',item,['name','short','spec','note','quantity']);
  for(const row of rows){assert.ok(assemblyDataKey(row.kind,row.id,row.field,row.value),JSON.stringify(row));assert.equal(assemblyDataText('zh-Hans',row.kind,row.id,row.field,row.value),row.value);}
});

test('display copies localize tutorial and inventory labels without changing source objects',async()=>{
  const url=new URL('../frontend/assemble/i18n.ts',import.meta.url);
  assert.ok(existsSync(url),'assembly display-copy helpers must exist');
  const {displayStep,displayChapter,displayActor,displayMaterial}=await import('../frontend/assemble/i18n.js');
  const {setLocale}=await import('../frontend/shared/i18n.js');
  setLocale('en');
  assert.equal(displayStep(STEPS[0]!).title,'Meet the robot and assembly route');
  const material=materialFor('p_motor');const translated=displayMaterial(material);
  assert.equal(translated.name,'Single servo awaiting an ID');assert.equal(translated.id,material.id);assert.equal(translated.ids,material.ids);assert.equal(translated.source,material.source);
  assert.notEqual(displayStep(STEPS[0]!),STEPS[0]);
  assert.equal(displayChapter(CHAPTERS[0]!).id,CHAPTERS[0]!.id);
  assert.equal(displayActor('p_motor',ACTORS.p_motor!).sourceId,ACTORS.p_motor!.sourceId);
  assert.equal(STEPS[0]!.title,'认识整机与组装路线');setLocale('zh-Hans');
});

test('assembly ships explicit complete messages for all twelve locales with matching placeholders',async()=>{
  const {assemblyDataMessages}=await import('../frontend/locales/assembly-data.js');
  const {assembleMessages}=await import('../frontend/locales/assemble.js');
  const {LOCALES}=await import('../frontend/shared/i18n.js');
  for(const dictionary of [assemblyDataMessages,assembleMessages])for(const {code}of LOCALES){
    assert.deepEqual(Object.keys(dictionary[code]??{}).sort(),Object.keys(dictionary['zh-Hans']!).sort(),`${code} has no complete explicit assembly catalog`);
    for(const [key,source]of Object.entries(dictionary['zh-Hans']!)){
      const value=dictionary[code]![key]!;assert.ok(value.trim(),`${code}: ${key}`);
      assert.deepEqual((value.match(/\{\w+\}/g)||[]).sort(),(source.match(/\{\w+\}/g)||[]).sort(),`${code}: ${key} placeholders`);
      if(!['zh-Hans','zh-Hant','ja'].includes(code))assert.doesNotMatch(value,/[\u3400-\u9fff]/,`${code}: ${key} contains untranslated Chinese`);
    }
  }
});

test('servo lead labels translate at display time while the preparation catalog stays unchanged',async()=>{
  const {displayLeadLabel}=await import('../frontend/assemble/i18n.js');
  assert.equal(typeof displayLeadLabel,'function','lead-label display adapter must exist');
  const {resolveServoMap,deriveServoPreparation}=await import('../frontend/assemble/servo-map.js');
  const {readServoMap}=await import('./fixtures/source-data.js');
  const {setLocale}=await import('../frontend/shared/i18n.js');
  const map=resolveServoMap(readServoMap(),{actors:ACTORS,steps:STEPS});
  const preparation=deriveServoPreparation(map,{requirements:{32:{connections:[{key:'a',cableClass:'long',lengthMm:200,to:'example-A',sourceStatus:'confirmed'}]}}});
  const item=preparation.byId.get(32)!;setLocale('en');assert.equal(displayLeadLabel(item),'Long cable · 200 mm');assert.equal(item.leadLabel,'长线 · 200 mm');setLocale('zh-Hans');
});

test('known API descriptors translate when rendered and unknown diagnostic text remains intact',async()=>{
  const {assemblyApiError,assemblyErrorText,assemblyResponseText}=await import('../frontend/assemble/i18n.js');
  assert.equal(typeof assemblyApiError,'function','assembly API errors retain localization descriptors');
  const {setLocale,translate}=await import('../frontend/shared/i18n.js');
  const error=assemblyApiError({code:'request_failed',params:{},error:'连接失败原文'});
  for(const locale of ['en','zh-Hans']){setLocale(locale);assert.equal(assemblyErrorText(error),translate(locale,'error.request_failed'));}
  setLocale('en');assert.equal(assemblyResponseText({message:'白胚'},'message'),'白胚');assert.equal(assemblyResponseText({error:'自定义固件诊断'},'error'),'自定义固件诊断');setLocale('zh-Hans');
});

test('assembly composite titles use the selected brand once and retain their localized subject',async()=>{
  const {assemblyText}=await import('../frontend/assemble/i18n.js');
  const {brandName}=await import('../frontend/shared/brand.js');
  const {assembleMessages}=await import('../frontend/locales/assemble.js');
  const {setLocale,LOCALES}=await import('../frontend/shared/i18n.js');
  for(const {code}of LOCALES){setLocale(code);assert.equal(assemblyText('assemble.ui.0276'),brandName(code));assert.equal(assemblyText('assemble.ui.0275'),brandName(code)+' · '+assemblyText('assemble.ui.0277'));assert.equal(assemblyText('assemble.ui.0368'),brandName(code)+' · '+assembleMessages[code]!['assemble.ui.0368']);}
  setLocale('zh-Hans');
});

test('HTTP compatibility codes keep their values while preferred device descriptors drive the display',async()=>{
  const {assemblyApiError,assemblyErrorText}=await import('../frontend/assemble/i18n.js');
  const {deviceErrorText}=await import('../frontend/shared/device-messages.js');
  const {setLocale}=await import('../frontend/shared/i18n.js');
  const error=assemblyApiError({code:'request.invalid',params:{legacy:'keep'},messageCode:'device.setup.scan',messageParams:{id:10},error:'原始兼容错误'});
  assert.equal(Reflect.get(error,'code'),'request.invalid');assert.deepEqual(Reflect.get(error,'params'),{legacy:'keep'});
  assert.equal(Reflect.get(error,'messageCode'),'device.setup.scan');assert.deepEqual(Reflect.get(error,'messageParams'),{id:10});
  setLocale('en');assert.equal(assemblyErrorText(error),deviceErrorText({code:'device.setup.scan',params:{id:10}}));setLocale('zh-Hans');
});


test('assembly toggle labels describe enabled states in all twelve languages',async()=>{
  const {assembleMessages}=await import('../frontend/locales/assemble.js');
  const states:Record<string,readonly[string,string]>={'zh-Hans':['开','关'],'zh-Hant':['開','關'],en:['On','Off'],ja:['オン','オフ'],ko:['켜짐','꺼짐'],fr:['Activé','Désactivé'],de:['Ein','Aus'],es:['Activado','Desactivado'],'pt-BR':['Ativado','Desativado'],ru:['Вкл.','Выкл.'],ar:['تشغيل','إيقاف'],hi:['चालू','बंद']};
  for(const [locale,expected]of Object.entries(states))assert.deepEqual(['assemble.ui.0008','assemble.ui.0009'].map(key=>assembleMessages[locale]![key]),expected,locale);
});

test('servo horn display fields avoid steering wheel terms and non-Latin tutorials avoid English passthrough',async()=>{
  const {assemblyDataMessages}=await import('../frontend/locales/assembly-data.js');const {assembleMessages}=await import('../frontend/locales/assemble.js');
  const wheel:Record<string,RegExp>={en:/steering wheel/i,ja:/ステアリング|ハンドル/,ko:/스티어링|핸들/,fr:/volant/i,de:/lenkr[aä]d/i,es:/volante/i,'pt-BR':/volante/i,ru:/рулев/i,ar:/عجل(?:ة|ات) القيادة|المقود/,hi:/स्टीयरिंग/};
  for(const dictionary of [assemblyDataMessages,assembleMessages])for(const [locale,messages]of Object.entries(dictionary))for(const [key,value]of Object.entries(messages)){
    const source=dictionary['zh-Hans']![key]!;
    if(/舵盘|主盘|副盘|主副盘/.test(source)&&wheel[locale])assert.doesNotMatch(value,wheel[locale]!,locale+' '+key);
    if(['ja','ko','ru','ar','hi'].includes(locale)&&/[\u3400-\u9fff]/.test(source)&&/^[\x00-\x7F]*$/.test(value))assert.ok(value.split(/\s+/).length<4,locale+' English passthrough '+key);
  }
});

test('assembly display catalogs preserve literal engineering identifiers and parameter symbols',async()=>{
  const {assemblyDataMessages}=await import('../frontend/locales/assembly-data.js');const {assembleMessages}=await import('../frontend/locales/assemble.js');
  for(const dictionary of [assemblyDataMessages,assembleMessages])for(const [locale,messages]of Object.entries(dictionary))for(const [key,value]of Object.entries(messages))for(const token of new Set(dictionary['zh-Hans']![key]!.match(/UNO\s?Q|\b(?:KP|KD|USB|IMU|MCU|ServoID|ID\s*\d+|M\d(?:\.\d+)?)(?![A-Za-z])/g)||[]))assert.ok(value.replace(/\s/g,'').includes(token.replace(/\s/g,'')),`${locale}: ${key}: ${token}`);
});


test('Arabic PCB display means a printed circuit board',async()=>{const {assemblyDataMessages}=await import('../frontend/locales/assembly-data.js');for(const key of ['assemble.data.0008','assemble.data.0412']){assert.match(assemblyDataMessages.ar![key]!,/PCB/);assert.doesNotMatch(assemblyDataMessages.ar![key]!,/ثنائي الفينيل متعدد الكلور/);}});
