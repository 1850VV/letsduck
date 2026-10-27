import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { jsonParse, jsonStringify, safeInteger } from '../../packages/storage/src/json.js';

test('stored numeric JSON retains exact large integers and raw float identities', () => {
  const input = '{"voiceSalt":9007199254740993,"nested":[1.0,1e20,-0.0],"text":"🦆"}';
  const value = jsonParse(input);
  assert.equal(jsonStringify(value), input);
  assert.equal(safeInteger(9007199254740993n), 9007199254740993n);
  assert.equal(safeInteger(10n), 10);
  assert.deepEqual(jsonParse(jsonStringify(value)), value);
});

test('canonical storage JSON matches Python compact UTF8 object key ordering', () => {
  const value = { z: [{ voice: 9007199254740993n, a: '🦆\n' }], a: null };
  const actual = jsonStringify(value, true);
  const result = spawnSync(process.env.PYTHON || 'python3', ['-I', '-c', 'import json,sys;print(json.dumps(json.load(sys.stdin),ensure_ascii=False,sort_keys=True,separators=(",",":")))'], { input: actual, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(actual, result.stdout.trim());
  assert.throws(() => jsonStringify(undefined), /JSON/);
});
