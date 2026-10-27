import {frozenOracle} from './fixtures/frozen-oracle.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { errorPayload, parseWireJson } from '@letsduck/domain';
import { jsonStringify } from '@letsduck/storage';
import type { FilamentCatalog, ProfileData, SourceModel } from '@letsduck/contracts';
import * as exports from '@letsduck/exporter';
import type { ExportMetadata } from '@letsduck/exporter';
import { writeSyntheticAssets } from './synthetic-assets.js';

const fixed = '2001-02-03T04:05:06.000Z';
const json = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const Planner = () => { assert.equal(typeof Reflect.get(exports, 'Planner'), 'function', 'The standalone pure Planner is missing'); return Reflect.get(exports, 'Planner') as typeof exports.Planner; };
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'duck-planner-')), assets = join(root, 'assets'); mkdirSync(assets); writeSyntheticAssets(assets);
  const base = json<FilamentCatalog>(join(assets, 'catalog.json')), model = json<SourceModel>(join(assets, 'model.json'));
  const products: FilamentCatalog['products'] = [
    { id: 'petg', brand: 'Example', series: 'PETG+', material: 'PETG', hex: '#123456', colorCode: 'P1', name: 'Blue' },
    { id: 'pa6', brand: 'Other', series: 'PA6-CF', material: 'PA6', hex: '#112233', name: 'Composite' },
    { id: 'peek', brand: 'Unknown', series: 'PEEK', material: 'PEEK', hex: '#445566' },
    { id: 'soft', brand: 'Other', series: 'TPU 90A', material: 'TPU', hardness: '90A', hex: '#AABBCC' },
    { id: 'hard-soft', brand: 'Other', series: 'TPU 95A', material: 'TPU', hardness: '95A', hex: '#AABBCC' },
    { id: 'support', brand: 'Other', series: 'Support PLA', material: 'PLA', hex: '#AABBCC' },
    ...Array.from({ length: 13 }, (_unused, index) => ({ id: 'extra-' + index, brand: 'Other', series: 'PLA', material: 'PLA', hex: '#112233' })),
  ];
  writeFileSync(join(assets, 'catalog.json'), JSON.stringify({ ...base, sourceUrl: 'https://example.invalid/base', sourceSha256: 'palette-source', scope: 'synthetic' }));
  writeFileSync(join(assets, 'filament-catalog.json'), JSON.stringify({ version: 'projected-extension', checkedAt: 'fixed', scope: 'extended', products }));
  const profiles: ProfileData = { profiles: {
    wrongMachine: { name: 'Example PETG+ @BBL X1', settings: { filament_type: ['PETG'], nozzle_temperature: ['240'] } },
    preferred: { name: 'Example PETG+ @BBL P1P', compatibleP1P: true, sourceUrl: 'https://example.invalid/exact', settings: { filament_type: ['PETG'], nozzle_temperature: ['251'] } },
    samePriority: { name: 'Example PETG+ @Another P1P', compatibleP1P: true, settings: { filament_type: ['PETG'], nozzle_temperature: ['255'] } },
    generic: { name: 'Generic PA-CF @BBL P1P', compatibleP1P: true, sourceUrl: 'https://example.invalid/generic', settings: { filament_type: ['PA-CF'], nozzle_temperature: ['280'] } },
  } };
  writeFileSync(join(assets, 'filament-profiles.json'), JSON.stringify(profiles));
  const payload = { source_sha256: model.source_sha256, assignments: Object.fromEntries(model.parts.map((part, index) => [part.id, base.products[index % 4]!.id])) };
  return { root, assets, payload, model };
}
function metadata(engine: exports.Exporter): ExportMetadata {
  return { sourceSha256: engine.model.source_sha256, partIds: engine.model.parts.map(part => part.id), catalog: engine.catalog, planning: engine.planningData };
}
function pythonPlans(_assets: string, cases: unknown[]): unknown[] {
  const child=frozenOracle('planner',jsonStringify(cases));assert.equal(child.status,0,child.stderr);return JSON.parse(child.stdout) as unknown[];
}
function outcome(planner: exports.Planner, payload: unknown) { try { return { ok: planner.plan(payload, fixed) }; } catch (error) { return { error: errorPayload(error) }; } }

test('pure Planner matches independent frozen Python plans, profile choices, raw names and error precedence', context => {
  const PurePlanner = Planner(), f = fixture();
  try {
    const engine = new exports.Exporter(f.assets), data = metadata(engine), planner = new PurePlanner(data);
    const change = (assignments: Record<string, unknown>) => ({ ...f.payload, assignments: { ...f.payload.assignments, ...assignments } });
    const overflow: Record<string, string> = {}; f.model.parts.filter(part => !part.material.startsWith('TPU')).slice(0, 13).forEach((part, index) => { overflow[part.id] = 'extra-' + index; });
    const rawName = (name: string) => parseWireJson('{"name":' + name + ',' + JSON.stringify(f.payload).slice(1));
    const cases: unknown[] = [f.payload, change({ p0: 'petg' }), change({ p0: 'pa6' }), change({ p0: 'peek' }), change({ p3: 'soft' }),
      rawName('1.0'), rawName('9007199254740993'), rawName('1e-7'), rawName('null'), rawName('true'), rawName('{"raw":1.0}'),
      { ...f.payload, name: '🦆'.repeat(101) }, null, {}, { ...f.payload, source_sha256: 'wrong' }, { ...f.payload, assignments: {} },
      change({ p0: 'missing' }), change({ p0: 1 }), change({ p0: 'support' }), change({ p3: 'hard-soft' }), change(overflow),
      { ...f.payload, source_sha256: 'wrong', assignments: {} },
    ];
    const before = jsonStringify(cases), expected = pythonPlans(f.assets, cases);
    assert.deepEqual(cases.map(body => outcome(planner, body)), expected);
    assert.equal(jsonStringify(cases), before);
    assert.equal(planner.plan(change({ p0: 'petg' }), fixed).slots[4]?.profile.name, 'Example PETG+ @BBL P1P');
    assert.equal(planner.plan(change({ p0: 'pa6' }), fixed).slots[4]?.profile.status, 'official-generic');
    assert.equal(planner.plan(change({ p0: 'peek' }), fixed).slots[4]?.profile.status, 'unavailable');
    const { createdAt: _time, ...oldReport } = engine.plan(f.payload), { createdAt: _fixed, ...directReport } = planner.plan(f.payload, fixed);
    assert.deepEqual(oldReport, directReport); context.diagnostic(`Python Planner oracle: ${cases.length} cases`);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('real ready metadata supports planning after assets disappear without carrying ZIP/config/settings', async () => {
  const PurePlanner = Planner(), f = fixture(); let manager: exports.ExportManager | undefined;
  try {
    const expected = pythonPlans(f.assets, [f.payload])[0];
    manager = new exports.ExportManager({ assets: f.assets }); await manager.ready; assert.equal(manager.available, true); assert.ok(manager.metadata);
    const data = manager.metadata; assert.ok(data.planning);
    assert.deepEqual(Object.keys(data).sort(), ['catalog', 'partIds', 'planning', 'sourceSha256']);
    assert.deepEqual(Object.keys(data.planning.parts[0]!).sort(), ['id', 'material', 'name', 'originalName', 'plate', 'sourceObject', 'sourcePart', 'uuid']);
    assert.deepEqual(data.planning.profiles.profiles?.preferred, { name: 'Example PETG+ @BBL P1P', compatibleP1P: true, sourceUrl: 'https://example.invalid/exact', settings: { filament_type: ['PETG'] } });
    const planner = new PurePlanner(structuredClone(data)); rmSync(f.assets, { recursive: true });
    assert.deepEqual(outcome(planner, f.payload), expected);
  } finally { await manager?.close(); rmSync(f.root, { recursive: true, force: true }); }
});

test('source configuration names retain lazy plan failure after semantic payload checks', async () => {
  const PurePlanner = Planner(), f = fixture(); let manager: exports.ExportManager | undefined;
  try {
    const source = readFileSync(join(f.assets, 'source.3mf')), archive = new exports.ZipArchive(source);
    const config = JSON.parse(archive.read('Metadata/project_settings.config').toString()) as Record<string, unknown>; config.filament_settings_id = null;
    const changed = exports.repackZip(source, { 'Metadata/project_settings.config': Buffer.from(JSON.stringify(config)) });
    writeFileSync(join(f.assets, 'source.3mf'), changed); f.model.source_sha256 = createHash('sha256').update(changed).digest('hex'); writeFileSync(join(f.assets, 'model.json'), JSON.stringify(f.model));
    manager = new exports.ExportManager({ assets: f.assets }); await manager.ready; assert.equal(manager.available, true); assert.ok(manager.metadata);
    const planner = new PurePlanner(manager.metadata);
    assert.throws(() => planner.plan({}, fixed), error => errorPayload(error).code === 'export.20');
    assert.throws(() => planner.plan({ source_sha256: f.model.source_sha256, assignments: {} }, fixed), error => errorPayload(error).code === 'export.21');
    assert.throws(() => planner.plan({ ...f.payload, source_sha256: f.model.source_sha256 }, fixed), /Expected source array/);
  } finally { await manager?.close(); rmSync(f.root, { recursive: true, force: true }); }
});

const gate = () => new Int32Array(new SharedArrayBuffer(8));
function release(control: Int32Array) { Atomics.store(control, 0, 1); Atomics.notify(control, 0); }
async function started(control: Int32Array) { for (let index = 0; index < 1000; index++) { if (Atomics.load(control, 1)) return; await delay(5); } throw new Error('Planner fixture did not start'); }
const workerUrl = new URL('./fixtures/planner-worker.ts', import.meta.url);
test('direct plans bypass full or broken pools while personal run(plan) retains bounded admission', async () => {
  const PurePlanner = Planner(), f = fixture(); let manager: exports.ExportManager | undefined; const control = gate();
  try {
    manager = new exports.ExportManager({ assets: f.assets, workers: 1, queueSize: 0, workerUrl }); await manager.ready; assert.ok(manager.metadata);
    const planner = new PurePlanner(manager.metadata), task = manager.run('export', { gate: control.buffer }); await started(control);
    await assert.rejects(manager.run('plan', f.payload), exports.ExportBusy);
    assert.equal(planner.plan(f.payload, fixed).source_sha256, f.model.source_sha256); assert.equal(manager.busy, true);
    await assert.rejects(manager.run('export', f.payload), exports.ExportBusy);
    release(control); await task;
    await assert.rejects(manager.run('export', { crash: true }), /worker exited/i); assert.equal(manager.available, false);
    assert.equal(planner.plan(f.payload, fixed).parts.length, 35);
  } finally { release(control); await manager?.close(); rmSync(f.root, { recursive: true, force: true }); }
});

test('invalid asset checksums cannot publish apparently sufficient planning metadata', async () => {
  Planner(); const f = fixture(); let manager: exports.ExportManager | undefined;
  try {
    writeFileSync(join(f.assets, 'source.3mf'), 'invalid'); manager = new exports.ExportManager({ assets: f.assets }); await manager.ready;
    assert.equal(manager.available, false); assert.equal(manager.metadata, null);
  } finally { await manager?.close(); rmSync(f.root, { recursive: true, force: true }); }
});
