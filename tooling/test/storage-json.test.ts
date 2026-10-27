import { test } from 'node:test';
import assert from 'node:assert/strict';
import {frozenPythonResult} from './fixtures/legacy-sql-storage.js';
import { jsonParse, jsonStringify, safeInteger } from '../../packages/storage/src/json.js';

test('stored numeric JSON retains exact large integers and raw float identities', () => {
  const input = '{"voiceSalt":9007199254740993,"nested":[1.0,1e20,-0.0],"text":"🦆"}';
  const value = jsonParse(input);
  assert.equal(jsonStringify(value), input);
  assert.equal(safeInteger(9007199254740993n), 9007199254740993n);
  assert.equal(safeInteger(10n), 10);
  assert.deepEqual(jsonParse(jsonStringify(value)), value);
});

test('canonical storage JSON matches frozen Python compact UTF8 object key ordering', () => {
  const value = { z: [{ voice: 9007199254740993n, a: '🦆\n' }], a: null };
  const actual = jsonStringify(value, true);
  const result = frozenPythonResult('canonical',value);
  assert.equal(result.status, 0, result.stderr); assert.equal(actual, result.stdout.trim());
  assert.throws(() => jsonStringify(undefined), /JSON/);
});
