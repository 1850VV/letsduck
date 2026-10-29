import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BRAND, MARK, faviconURL, brandName} from '../frontend/shared/brand.js';
import {LOCALES,translate} from '../frontend/shared/i18n.js';

test('the README logo file is the same drawing as the site mark', () => {
  const file = readFileSync(new URL('../frontend/shared/brand/logo.svg', import.meta.url), 'utf8');
  assert.equal(file.match(/<svg[^>]*>(.*)<\/svg>/s)![1], MARK);
});

test('official account and share copy use the same localized product name',()=>{
  for(const {code}of LOCALES)for(const key of ['text.0362','text.0454','text.0800'])assert.ok(translate(code,key).includes(brandName(code)),code+': '+key);
});

test('name and favicon', () => {
  assert.deepEqual([BRAND.zh, BRAND.en], ['来做鸭', 'letsduck']);
  assert.ok(faviconURL().startsWith('data:image/svg+xml,'));
  assert.equal(brandName('zh-Hant'), '來做鴨');
  assert.equal(brandName('zh-Hans'), '来做鸭');
  assert.equal(brandName('en'), "Let's Duck");
  for (const locale of ['ja', 'ar']) assert.notEqual(brandName(locale), '来做鸭');
});
