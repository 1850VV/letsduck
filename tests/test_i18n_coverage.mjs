import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogs,LOCALES} from '../frontend/shared/i18n.mjs';

test('every Latin, Arabic, Korean and Hindi UI message has a translated value',()=>{
  for(const {code}of LOCALES.filter(x=>!['zh-Hans','zh-Hant','ja'].includes(x.code))){
    const missing=Object.entries(catalogs[code]).filter(([,value])=>/[\u3400-\u9fff]/.test(value));
    assert.deepEqual(missing.map(([key])=>key),[],`${code} still contains untranslated system messages`);
  }
});
