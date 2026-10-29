import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTORS,CHAPTERS,STEPS,snapshot} from '../frontend/assemble/hardware-state.js';
import {SERVO_IDS,preparationCopy} from '../frontend/assemble/full/prepare.js';
import {displayStep,assemblyText} from '../frontend/assemble/i18n.js';
import {identityMessages} from '../frontend/locales/identity.js';
import {LOCALES,setLocale} from '../frontend/shared/i18n.js';

const step=(id:string)=>{const value=STEPS.find(item=>item.id===id);assert.ok(value);return value;};
const automatic:Record<string,RegExp>={'zh-Hans':/自动/,'zh-Hant':/自動/,en:/automat/i,ja:/自動/,ko:/자동/,fr:/automati/i,de:/automatisch/i,es:/automátic/i,'pt-BR':/autom[aá]tic/i,ru:/автомат/i,ar:/تلقائي/,hi:/स्वचालित/};
// Catches the tutorial directing readers to the removed in-page device controls,
// including a stale translated copy that would hide the corrected source text.
for(const {code}of LOCALES)test(`${code}: personal assembly guidance sends device work to the named Debug feature`,()=>{
 try{
  setLocale(code);const name=identityMessages[code]!['hub.debug.name']!;
  for(const [id,field]of [['prepare-intro','check'],['prepare-app','text'],['prepare-scan','title'],['prepare-scan','text'],['prepare-id','title'],['prepare-id','text'],['prepare-all-ids','text']] as const){
   const copy=displayStep(preparationCopy(step(id),true));assert.ok(copy[field].includes(name),`${id}.${field}: ${copy[field]}`);
  }
  const write=displayStep(preparationCopy(step('prepare-id'),true));
  for(const field of ['title','text'] as const)for(const token of ['ID','KP','KD'])assert.ok(write[field].includes(token),`${field} preserves ${token}`);
  assert.match(write.title+' '+write.text,automatic[code]!,`${code}: profile-based automatic writing remains in Debug`);
  assert.match(displayStep(preparationCopy(step('prepare-all-ids'),true)).text,automatic[code]!,`${code}: automatic continuation after exchanging and powering a servo remains`);
  const note=assemblyText('assemble.ui.0020');assert.ok(note.includes(name),note);
  for(const token of ['ID','KP','KD'])assert.ok(note.includes(token),`software note preserves ${token}`);
  for(const id of ['prepare-intro','prepare-app'])assert.ok(displayStep(preparationCopy(step(id),false)).check.includes(name),`${id}: instructional environment states the personal Debug boundary`);
  assert.ok(assemblyText('assemble.ui.0021').includes(name),'software note retains the instructional environment boundary');
 }finally{setLocale('zh-Hans');}
});

test('non-personal assembly guidance keeps the separate runtime procedure',()=>{
 try{
  setLocale('en');
  const scan=displayStep(preparationCopy(step('prepare-scan'),false)),write=displayStep(preparationCopy(step('prepare-id'),false));
  for(const token of ['Duck Runtime','Servo setup','Scan all IDs','Reset Mid'])assert.ok(scan.text.includes(token),token);
  for(const token of ['Servo setup','KP','KD','Set KpKd','ID','Change ID'])assert.ok(write.text.includes(token),token);
  assert.ok(!scan.text.includes('Debug Duck'));assert.ok(!write.text.includes('Debug Duck'));
 }finally{setLocale('zh-Hans');}
});

test('guidance rendering preserves tutorial structure, physical IDs and source state',()=>{
 assert.equal(CHAPTERS.length,14);assert.equal(STEPS.length,111);assert.equal(Object.keys(ACTORS).length,275);
 assert.deepEqual(SERVO_IDS,[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
 const before=JSON.stringify({ACTORS,STEPS,CHAPTERS,pose:snapshot(6,.5)}),display=new Set(['short','title','text','check','caption']);
 try{
  for(const {code}of LOCALES){setLocale(code);for(const source of STEPS)for(const automatic of [true,false]){
   const original=preparationCopy(source,automatic),copy=displayStep(original);
   assert.deepEqual(Object.keys(copy).sort(),Object.keys(original).sort());
   for(const key of Object.keys(original))if(!display.has(key))assert.deepEqual(Reflect.get(copy,key),Reflect.get(original,key),source.id+'.'+key);
  }}
  assert.equal(JSON.stringify({ACTORS,STEPS,CHAPTERS,pose:snapshot(6,.5)}),before);
 }finally{setLocale('zh-Hans');}
});
