import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import * as locale0 from '../../frontend/locales/catalogs.js';
import * as locale1 from '../../frontend/locales/source-keys.js';
import * as locale2 from '../../frontend/locales/extra.js';
import * as locale3 from '../../frontend/locales/personal.js';
import * as locale4 from '../../frontend/locales/home.js';

test('runtime locale dictionaries retain their reviewed snapshots',()=>{
  // The localized product name intentionally changes text.0362/.0454/.0800 in
  // ten non-Chinese locales. All other migrated keys and values remain unchanged.
  assert.equal(createHash('sha256').update(JSON.stringify(locale0)).digest('hex'), "a80261a92d1c831abbc08a280bac87e0f9231adc6a1208f2aac3fa95c73fede0");
  assert.equal(createHash('sha256').update(JSON.stringify(locale1)).digest('hex'), "95a526172b1fe87e92efa1e0d622efad89311131499773c7dfbd89b4afc20a08");
  assert.equal(createHash('sha256').update(JSON.stringify(locale2)).digest('hex'), "60b6808ba00bb18d9d1db14d3884634593b4969460a4567782c70594f2ed9a1c");
  assert.equal(createHash('sha256').update(JSON.stringify(locale3)).digest('hex'), "f156553af792083da0d3f6ff5d7c12531b4ed337087e6af0120d3ac0189c1cfe");
  assert.equal(createHash('sha256').update(JSON.stringify(locale4)).digest('hex'), "6d7fe28da3c6eeb5719780c43d0e1ce9cfd9c3fa19590fbe40938b97c1d656e2");
});
