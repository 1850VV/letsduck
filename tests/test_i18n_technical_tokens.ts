import test from 'node:test';
import assert from 'node:assert/strict';
import {debugMessages} from '../frontend/locales/debug.js';
import {deviceMessages} from '../frontend/locales/device.js';
const technical=['Arduino App Lab','Duck Runtime','Duck OS','UNO Q','KP','KD','USB','MCU','IMU','ADB','ID','PING','UART','EEPROM'];
const count=(text:string,token:string)=>(text.match(new RegExp('(?<![A-Za-z])'+token+'(?![A-Za-z])','g'))??[]).length;
test('all Debug and device locales preserve explicit protocol and hardware identifiers in system literals',()=>{
 const missing:string[]=[];
 for(const [module,catalogs]of [['debug',debugMessages],['device',deviceMessages]]as const){
  for(const [key,source]of Object.entries(catalogs['zh-Hans']!))for(const token of technical){
   const expected=count(source,token);if(!expected)continue;
   for(const [locale,messages]of Object.entries(catalogs))if(count(messages[key]!,token)<expected)missing.push([module,locale,key,token].join(' '));
  }
 }
 assert.deepEqual(missing,[]);
});
test('non-Latin locales contain no complete English system sentences',()=>{
 const scripts:Record<string,RegExp>={ja:/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,ko:/\p{Script=Hangul}/u,ru:/\p{Script=Cyrillic}/u,ar:/\p{Script=Arabic}/u,hi:/\p{Script=Devanagari}/u};
 for(const catalogs of [debugMessages,deviceMessages])for(const [locale,script]of Object.entries(scripts))for(const [key,text]of Object.entries(catalogs[locale]!)){
  const plain=text.replace(/\{\w+\}/g,'');if((plain.match(/[A-Za-z]+/g)??[]).length>=4)assert.ok(script.test(plain),locale+' '+key);
 }
});
test('single-paragraph system literals do not receive adjacent translation row fragments',()=>{
 for(const catalogs of [debugMessages,deviceMessages])for(const [key,source]of Object.entries(catalogs['zh-Hans']!))if(!source.includes('\n'))for(const [locale,messages]of Object.entries(catalogs))assert.equal(messages[key]!.includes('\n'),false,locale+' '+key);
});
