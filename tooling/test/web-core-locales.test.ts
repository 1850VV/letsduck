import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import * as locale0 from '../../frontend/locales/catalogs.js';
import * as locale1 from '../../frontend/locales/source-keys.js';
import * as locale2 from '../../frontend/locales/extra.js';
import * as locale3 from '../../frontend/locales/personal.js';
import * as locale4 from '../../frontend/locales/home.js';

test('locale migration retains every existing runtime dictionary value',()=>{
  assert.equal(createHash('sha256').update(JSON.stringify(locale0)).digest('hex'), "970464fd83af265e3ad9f1e9a3baf64cd8f45b1e0bf079ced785cae817102ea0");
  assert.equal(createHash('sha256').update(JSON.stringify(locale1)).digest('hex'), "95a526172b1fe87e92efa1e0d622efad89311131499773c7dfbd89b4afc20a08");
  assert.equal(createHash('sha256').update(JSON.stringify(locale2)).digest('hex'), "60b6808ba00bb18d9d1db14d3884634593b4969460a4567782c70594f2ed9a1c");
  assert.equal(createHash('sha256').update(JSON.stringify(locale3)).digest('hex'), "f156553af792083da0d3f6ff5d7c12531b4ed337087e6af0120d3ac0189c1cfe");
  assert.equal(createHash('sha256').update(JSON.stringify(locale4)).digest('hex'), "6d7fe28da3c6eeb5719780c43d0e1ce9cfd9c3fa19590fbe40938b97c1d656e2");
});
