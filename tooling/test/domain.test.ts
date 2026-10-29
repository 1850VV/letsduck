import {frozenOracle} from './fixtures/frozen-oracle.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { buildSync } from 'esbuild';
import * as domain from '@letsduck/domain';

const root = resolve(import.meta.dirname, '../..');
const required = () => { assert.ok(domain, 'The shared domain package is missing'); return domain; };
const design = { colors: { p: '#aBcD09' }, assignments: { p: null }, finishes: { p: 'matte', removed: 'basic' } };
const product = { id: 'example', brand: 'Example', name: 'Example', series: 'PLA Basic', material: 'PLA', hex: '#123456' };
const profiles = { profiles: { generic: { name: 'Generic PETG @BBL P1P', compatibleP1P: true, sourceUrl: 'https://example.invalid/petg', settings: { filament_type: ['PETG'], nozzle_temperature: ['247'] } }, cf: { name: 'Generic PLA-CF @BBL P1P', settings: { filament_type: ['PLA-CF'] } } } };
const cases: { op: string; args: unknown[] }[] = [
  { op: 'validateDesign', args: [design, ['p']] },
  { op: 'validateDesign', args: [{ ...design, colors: { p: '#FFFFFF\n' } }, ['p']] },
  { op: 'compatibleProduct', args: ['PLA Basic', { ...product, hex: '#123456\n' }] },
  ...[[], {}].map(value => ({ op: 'validateDesign', args: [{ ...design, finishes: { p: value } }, ['p']] })),
  ...['\u001c12', '\u001d12', '\u001e12', '\u001f12', '12\u001c', '\u008512\u3000'].map(voiceSalt => ({ op: 'schemeValues', args: ['s', { name: 'n', design, voiceSalt }, ['p']] })),
  { op: 'compatibleProduct', args: ['PLA Basic', { ...product, series: 'ſupport PLA' }] },
  ...[null, [], {}, { colors: {}, assignments: null }, { colors: { p: '#FFFFFF' }, assignments: {} }, { ...design, colors: { p: '#fff' } }, { ...design, colors: { p: 123 } }, { ...design, assignments: { p: 1 } }, { ...design, assignments: { p: '🦆'.repeat(81) } }, { ...design, finishes: ['basic'] }, { ...design, finishes: { p: 'gloss' } }].map(value => ({ op: 'validateDesign', args: [value, ['p']] })),
  ...[null, false, 0, '', []].map(finishes => ({ op: 'validateDesign', args: [{ ...design, finishes }, ['p']] })),
  { op: 'validateDesign', args: [{ ...design, assignments: { p: '🦆'.repeat(80) } }, ['p']] },
  ...['', '🦆'.repeat(65), 12].map(id => ({ op: 'schemeValues', args: [id, { name: 'name', design }, ['p']] })),
  ...['  中文🦆 '.repeat(15), '\u0085\u001cname\u3000', '\uFEFFname\uFEFF', true, 1.2e-5, ['🦆', null], { x: true }].map(name => ({ op: 'schemeValues', args: ['🦆'.repeat(64), { name, design, provenance: [], voiceSalt: '-12' }, ['p']] })),
  ...[null, false, true, -3.9, '  +1_024  ', '１２', '١٢', '9007199254740993', 'not a number', '3.5'].map(voiceSalt => ({ op: 'schemeValues', args: ['s', { name: 'n', design, voiceSalt }, ['p']] })),
  ...[null, '', false, [], {}, 0, ['a', 1, false], '   '].map(value => ({ op: 'text', args: [value, 40, '名称', true] })),
  ...['90A', 'TPU 90a', 'TPU 90.5D', 'TPU 90A中', 'x90A', '９０A', null].map(value => ({ op: 'hardness', args: [value] })),
  ...[null, { ...product, role: 'support' }, { ...product, series: 'PolySupport for PA12' }, { ...product, series: '支撐 PLA' }, { ...product, demo: true }, { ...product, selectable: false }, { ...product, hex: null }, { ...product, hex: '#１２３abc' }, product, { ...product, material: 'TPU', series: 'TPU 90A' }, { ...product, material: 'TPU', series: 'TPU 95A' }].flatMap(value => ['PLA Basic', 'TPU 90A'].map(material => ({ op: 'compatibleProduct', args: [material, value] }))),
  ...[{ ...product, material: 'PETG', series: 'PETG+' }, { ...product, series: 'PLA-CF' }, { ...product, series: 'PLA-CF中' }, { ...product, material: 'PEEK', series: 'PEEK' }, { ...product, material: 'TPU', series: 'TPU 90A', hardness: '90A' }].map(value => ({ op: 'resolveProfile', args: [value, profiles] })),
  { op: 'resolveProfile', args: [{ ...product, material: 'PETG', series: 'PETG+' }, { profiles: { ...profiles.profiles, other: { name: 'Example PETG+ @BBL X1', settings: { filament_type: ['PETG'] } }, preferred: { name: 'Example PETG+ @BBL P1P', compatibleP1P: true, settings: { filament_type: ['PETG'], nozzle_temperature: ['251'] } } } }] },
  { op: 'mergeCatalog', args: [{ version: 'base', products: [product] }, { version: 'extended', scope: 'synthetic', products: [{ ...product, hex: '#FFFFFF' }, { ...product, id: 'new' }, { ...product, id: 'pending', hex: null }] }] },
  { op: 'mergeCatalog', args: [{ version: 'base', products: [product] }, null] },
];

test('shared validation normalizes design without changing caller data', () => {
  const d = required(), before = structuredClone(design);
  assert.deepEqual(d.validateDesign(design, ['p']), { colors: { p: '#ABCD09' }, assignments: { p: null }, finishes: { p: 'matte' } });
  assert.deepEqual(design, before);
  assert.equal(d.MAX_SCHEMES, 30);
});

test('shared rules match frozen Python errors, Unicode, integer, catalogue and profile behavior', t => {
  const d = required();
  const run = frozenOracle('domain-rules',JSON.stringify(cases));
  assert.equal(run.status, 0, run.stderr);
  const expected = JSON.parse(run.stdout);
  for (const [index, c] of cases.entries()) {
    let actual: unknown;
    const operation: unknown = Reflect.get(d, c.op);
    assert.equal(typeof operation, 'function');
    if (typeof operation !== 'function') throw new Error('Missing shared operation: ' + c.op);
    try { actual = { value: Reflect.apply(operation, undefined, c.args) }; } catch (error) { actual = { failure: d.errorPayload(error) }; }
    actual = JSON.parse(JSON.stringify(actual, (_key, value) => typeof value === 'bigint' ? { $integer: String(value) } : value));
    assert.deepEqual(actual, expected[index], `case ${index}: ${JSON.stringify(c)}`);
  }
  t.diagnostic(`Compared ${cases.length} cases against frozen Python reference`);
});

test('the shared error payload retains codes and parameters supplied by adapters', () => {
  const d = required();
  const error = Object.assign(new Error('offline'), { code: 'device.offline', params: { v0: 'board' } });
  assert.deepEqual(d.errorPayload(error), { error: 'offline', code: 'device.offline', params: { v0: 'board' } });
});

test('raw numeric JSON preserves Python text coercion and exact integer identity', () => {
  const d = required();
  const tokens = ['1.0', '1e16', '1e20', '1e21', '1e-5', '1e-7', '-0.0', '-0', '9007199254740993', '-9007199254740993', '[1.0,9007199254740993]', '{"n":1e16}'];
  const raw = tokens.map(token => '{"name":' + token + ',"design":{"colors":{"p":"#FFFFFF"},"assignments":{"p":null}},"voiceSalt":9007199254740993}');
  const run = frozenOracle('domain-raw',JSON.stringify(raw));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(typeof d.parseWireJson, 'function', 'The numeric input boundary is missing');
  const expected = JSON.parse(run.stdout);
  for (const [index, source] of raw.entries()) {
    const data: unknown = d.parseWireJson(source);
    assert.ok(data && typeof data === 'object' && !Array.isArray(data));
    let result: unknown;
    try { const value = d.schemeValues('s', data, ['p']); result = { value: { name: value.name, voiceSalt: String(value.voiceSalt) } }; }
    catch (error) { result = { failure: d.errorPayload(error) }; }
    assert.deepEqual(result, expected[index], source);
  }
});

test('integer parsing rejects Python strip-only control separators', () => {
  const d = required();
  for (const voiceSalt of ['\u001c12', '\u001d12', '\u001e12', '\u001f12', '12\u001c']) {
    assert.throws(() => d.schemeValues('s', { name: 'n', design, voiceSalt }, ['p']), error => {
      assert.equal(d.errorPayload(error).code, 'request.invalid');
      assert.match(d.errorPayload(error).error, /invalid literal for int/); return true;
    });
  }
});

test('an already rounded native integer cannot silently become a stored voice identity', () => {
  assert.throws(() => required().schemeValues('s', { name: 'n', design, voiceSalt: 9007199254740992 }, ['p']), /precision|parseWireJson/i);
});

test('nested malformed finishes preserve the generic TypeError category', () => {
  const d = required();
  for (const value of [[], {}]) assert.throws(() => d.validateDesign({ ...design, finishes: { p: value } }, ['p']), TypeError);
});

test('Unicode case folding excludes the same support products as Python', () => {
  assert.equal(required().compatibleProduct('PLA Basic', { ...product, series: 'ſupport PLA' }), false);
});

test('shared device definitions exactly preserve current mapping and unresolved lead requirements', () => {
  const d = required();
  assert.equal(d.servoMap.version, 'tutorial-reference-1');
  assert.deepEqual(d.servoMap.bindings.map(binding => binding.id), [10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);
  assert.deepEqual(d.servoLeads.reportedRequirement, { source: 'setup-notes', servosRequiringLongLead: 3, regionHint: 'head-neck', regionConfirmed: false, ids: null, lengthMm: null, connectionEndpoints: null });
  assert.deepEqual(Object.keys(d.servoLeads.requirements), ['10','11','12','13','14','20','21','22','23','24','30','31','32','33','34']);
  assert.ok(Object.values(d.servoLeads.requirements).every(requirement => requirement.connections === null));
  assert.equal(d.SERVO_BINDINGS.length, 15);
  assert.equal(d.SERVO_IDS.t_motor20, 10);
  assert.equal(d.SERVO_IDS.t_motor10, 20);
});

test('public contracts and domain exports form a real browser bundle with no Node dependencies', () => {
  required();
  const bundle = buildSync({ stdin: { contents: 'import * as c from "@letsduck/contracts"; import * as d from "@letsduck/domain"; globalThis.duck = { c, d };', resolveDir: root }, platform: 'browser', bundle: true, write: false, format: 'esm', metafile: true });
  assert.ok(bundle.outputFiles[0]!.text.includes('validateDesign'));
  assert.ok(Object.keys(bundle.metafile.inputs).every(path => !path.includes('node_modules') && !path.startsWith('node:')));
});
