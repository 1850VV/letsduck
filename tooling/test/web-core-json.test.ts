import assert from 'node:assert/strict';
import { test } from 'node:test';
import { jsonParse, jsonStringify, parseResponseJson } from '../../frontend/shared/json.js';

test('browser API and storage share exact integer and raw float serialization', () => {
  const source = '{"voiceSalt":18446744073709551615,"created":9007199254740993,"float":1.0,"nested":[-9007199254740993]}';
  assert.equal(jsonStringify(jsonParse(source)), source);
  assert.equal(jsonStringify({ voiceSalt: 18446744073709551615n }), '{"voiceSalt":18446744073709551615}');
  assert.throws(() => jsonStringify({ value: Number(9007199254740993n) }), /precision/);
  assert.equal(jsonStringify({ b: 1, a: 2 }, true), '{"a":2,"b":1}');
});

test('fetch JSON reads numeric source text before an engine can round it', async () => {
  const result = await parseResponseJson(new Response('{"voiceSalt":18446744073709551615}'));
  assert.deepEqual(result, { voiceSalt: 18446744073709551615n });
});
