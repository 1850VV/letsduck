import {frozenOracle} from './fixtures/frozen-oracle.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const modules = async () => {
  const m = await import('../../packages/devices/src/preparation.js');
  assert.equal(typeof m?.validatedUpdates, 'function', 'The physical-preparation validator is missing');
  return m!;
};
test('physical pickup validates all selected mapped IDs before producing updates', async () => {
  const m = await modules();
  assert.deepEqual(m.validatedUpdates({ ids: [12, 13], state: 'installed' }), [{ id: 12, state: 'installed' }, { id: 13, state: 'installed' }]);
  assert.throws(() => m.validatedUpdates({ ids: [12, 99], state: 'installed' }));
});

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { PersonalStore, jsonParse } from '@letsduck/storage';
import { errorPayload } from '@letsduck/domain';
test('pickup, installation and return persist independently from numbering and schemes without a runtime', async t => {
  const path = mkdtempSync(resolve(tmpdir(), 'duck-preparation-')); t.after(() => rmSync(path, { recursive: true, force: true }));
  const store = new PersonalStore({ path: resolve(path, 'personal.db'), partIds: [] }); t.after(() => store.close());
  const { validatedUpdates } = await modules();
  const record = { id: 10, state: 'reported', mapVersion: 'tutorial-reference-1' }; store.saveServoRecord('existing-board', record);
  const scheme = store.saveScheme('existing', { name: 'Existing scheme', voiceSalt: 7, design: { colors: {}, assignments: {} } });
  assert.deepEqual(store.servoPreparationRecords(), []);
  store.saveServoPreparation(validatedUpdates({ ids: [14], state: 'picked' })); store.saveServoPreparation(validatedUpdates({ ids: [12, 13], state: 'installed' }));
  store.close(); const reopened = new PersonalStore({ path: resolve(path, 'personal.db'), partIds: [] }); t.after(() => reopened.close());
  assert.deepEqual(reopened.servoPreparationRecords().map(r => [r.id, r.state]), [[12, 'installed'], [13, 'installed'], [14, 'picked']]);
  assert.deepEqual(reopened.servoRecords(), [record]); assert.deepEqual(reopened.schemes(), [scheme]);
  reopened.saveServoPreparation(validatedUpdates({ ids: [14], state: 'available' })); assert.equal(reopened.servoPreparationRecords().find(r => r.id === 14)?.state, 'available');
});
test('invalid update batches, boolean or float IDs never partially consume a part', async t => {
  const path = mkdtempSync(resolve(tmpdir(), 'duck-preparation-')); t.after(() => rmSync(path, { recursive: true, force: true }));
  const store = new PersonalStore({ path: resolve(path, 'personal.db') }); t.after(() => store.close()); const m = await modules();
  for (const body of [{ ids: [12, 99], state: 'installed' }, { ids: [14], state: 'done' }, { ids: [true], state: 'picked' }, { ids: [], state: 'picked' }, { ids: [12, 12], state: 'picked' }, jsonParse('{"ids":[12.0],"state":"picked"}')]) {
    assert.throws(() => store.saveServoPreparation(m.validatedUpdates(body as Record<string, unknown>))); assert.deepEqual(store.servoPreparationRecords(), []);
  }
});
test('unknown cables cannot be claimed prepared while an empty declaration clears them', async () => {
  const m = await modules(); assert.throws(() => m.validatedUpdates({ ids: [32], preparedLeads: ['assumed-long'] }), /线材规格尚未核定/);
  assert.deepEqual(m.validatedUpdates({ ids: [32], preparedLeads: [] }), [{ id: 32, preparedLeads: [] }]);
  assert.throws(() => m.validatedUpdates({ ids: [12, 13], preparedLeads: [] }), /预接线记录不正确/);
  assert.throws(() => m.validatedUpdates({ ids: [12] }), /没有要保存/);
});
test('preparation validation matches the original Python messages and complete update values', async () => {
  const m = await modules();
  const cases = [{ ids: [10], state: 'picked' }, { ids: [12, 13], state: 'installed' }, { ids: [32], preparedLeads: [] }, { ids: [32], preparedLeads: ['x'] }, { ids: [12], state: 'bad' }, { ids: [true], state: 'picked' }, { ids: [12, 12], state: 'picked' }, { ids: [12] }, { ids: [14], preparedLeads: [1] }];
  const run=frozenOracle('servo-preparation',JSON.stringify(cases));assert.equal(run.status,0,run.stderr);
  const expected: unknown[] = JSON.parse(run.stdout);
  for (const [index, body] of cases.entries()) {
    let actual: unknown; try { actual = { value: m.validatedUpdates(body) }; } catch (error) { actual = { failure: errorPayload(error) }; }
    assert.deepEqual(actual, expected[index]);
  }
});
test('only confirmed leads with exact cable classes, destination and positive length can be declared', async () => {
  const m = await modules();
  const lead = { key: 'known', sourceStatus: 'confirmed', cableClass: 'long', to: 'board', lengthMm: 120 };
  const catalog = { requirements: { '32': { connections: [lead] } } };
  assert.deepEqual(m.validatedUpdates({ ids: [32], preparedLeads: ['known'] }, catalog), [{ id: 32, preparedLeads: ['known'] }]);
  for (const invalid of [{ ...lead, cableClass: ['long'] }, { ...lead, sourceStatus: 'unknown' }, { ...lead, to: '' }, { ...lead, lengthMm: 0 }, { ...lead, lengthMm: true }]) {
    assert.throws(() => m.validatedUpdates({ ids: [32], preparedLeads: ['known'] }, { requirements: { '32': { connections: [invalid] } } }), /线材规格尚未核定/);
  }
});
