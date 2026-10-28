import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogs,LOCALES,translate} from '../frontend/shared/i18n.js';

const approvedChinese={
 'beta.badge':'内测 · 长按解锁',
 'beta.localOnly':'仅本地客户端可用',
 'beta.lockedLabel':'{name}未解锁，长按2秒体验',
 'beta.debugLabel':'调试鸭仅本地客户端可用',
 'beta.title':'功能正在内测',
 'beta.warning':'内测功能，请勿用于实际生产。',
 'beta.hold':'体验请长按 2 秒解锁。',
 'beta.server':'服务器版不支持设备调试。',
 'beta.unavailable':'功能信息暂不可用，请刷新重试。',
 'beta.holding':'继续按住 · {seconds} 秒',
 'beta.restored':'{name}已恢复正常。',
 'beta.next':'现在可以点击进入，之后无需重复解锁。',
 'beta.storage':'无法保存解锁状态，请允许本地存储后重试。',
 'beta.dismiss':'关闭说明',
 'beta.progress':'长按解锁进度',
};

test('experimental access keeps the approved Chinese copy exactly',()=>{
 const keys=Object.keys(approvedChinese);
 assert.deepEqual(Object.fromEntries(keys.map(key=>[key,catalogs['zh-Hans']![key]])),approvedChinese);
 assert.equal(translate('zh-Hans','beta.lockedLabel',{name:'调试鸭'}),'调试鸭未解锁，长按2秒体验');
 assert.equal(translate('zh-Hans','beta.restored',{name:'组装鸭'}),'组装鸭已恢复正常。');
});

test('experimental access supplies the same 15 keys and placeholders in all 12 existing languages',()=>{
 const keys=Object.keys(approvedChinese).sort();assert.equal(LOCALES.length,12);
 for(const {code}of LOCALES){
  const dictionary=catalogs[code]!;
  assert.deepEqual(Object.keys(dictionary).filter(key=>key.startsWith('beta.')).sort(),keys,code);
  for(const key of keys){
   const value=dictionary[key]!;assert.ok(value.trim(),code+': '+key);
   assert.deepEqual((value.match(/\{\w+\}/g)??[]).sort(),(catalogs['zh-Hans']![key]!.match(/\{\w+\}/g)??[]).sort(),code+': '+key+' placeholders');
  }
 }
});
