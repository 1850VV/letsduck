import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BRAND, MARK, faviconURL, brandName} from '../frontend/shared/brand.mjs';

test('the README logo file is the same drawing as the site mark', () => {
  const file = readFileSync(new URL('../frontend/shared/brand/logo.svg', import.meta.url), 'utf8');
  assert.equal(file.match(/<svg[^>]*>(.*)<\/svg>/s)[1], MARK);
});

test('name and favicon', () => {
  assert.deepEqual([BRAND.zh, BRAND.en], ['来做鸭', 'letsduck']);
  assert.ok(faviconURL().startsWith('data:image/svg+xml,'));
  assert.equal(brandName('zh-Hant'), '來做鴨');
  for (const locale of ['zh-Hans', 'en', 'ja', 'ar']) assert.equal(brandName(locale), '来做鸭');
});
