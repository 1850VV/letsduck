import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { strToU8, zipSync } from 'fflate';
import { PNG } from 'pngjs';
import { errorPayload, parseWireJson, isJsonObject } from '@letsduck/domain';
import { writeSyntheticAssets } from './synthetic-assets.js';
import * as module from '@letsduck/exporter';

const root = resolve(import.meta.dirname, '../..');
const python = process.env.PYTHON || (existsSync(resolve(root, '.venv/bin/python')) ? resolve(root, '.venv/bin/python') : 'python3');
const required = () => { assert.ok(module, 'The shared exporter package is missing'); return module; };
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'letsduck-export-')), assets = join(directory, 'assets'); mkdirSync(assets); writeSyntheticAssets(assets);
  const catalog = json(join(assets, 'catalog.json')), model = json(join(assets, 'model.json'));
  const extras = [
    { id: 'example-petg', brand: 'Example', series: 'PETG+', material: 'PETG', name: 'Blue', hex: '#2040C0', colorCode: 'B', colors: ['#2040C0'], diameter: 1.75 },
    { id: 'unknown-peek', brand: 'Example', series: 'PEEK', material: 'PEEK', name: 'Unknown', hex: '#010203' },
    { id: 'support', brand: 'Example', series: 'PolySupport for PLA', material: 'PLA', name: 'Support', hex: '#FFFFFF' },
  ];
  writeFileSync(join(assets, 'filament-catalog.json'), JSON.stringify({ version: 'synthetic-extended', products: extras }));
  writeFileSync(join(assets, 'filament-profiles.json'), JSON.stringify({ profiles: { exact: { name: 'Example PETG+ @BBL P1P', compatibleP1P: true, sourceUrl: 'https://example.invalid/profile', settings: { filament_type: ['PETG'], nozzle_temperature: ['251'] } } } }));
  const image = 'data:image/png;base64,' + PNG.sync.write(new PNG({ width: 512, height: 512 })).toString('base64');
  const names = ['cover', ...Array.from({ length: 6 }, (_, index) => [`plate${index + 1}`, `top${index + 1}`]).flat()];
  const payload = { name: '合成🦆', source_sha256: model.source_sha256, assignments: Object.fromEntries(model.parts.map((part: { id: string; material: string; color: string }) => [part.id, catalog.products.find((product: { series: string; hex: string }) => product.series === part.material && product.hex === part.color).id])), thumbnails: Object.fromEntries(names.map(name => [name, image])) };
  return { directory, assets, payload };
}
function pythonExport(assets: string, payload: unknown, output: string) {
  const script = `import sys,json\nfrom pathlib import Path\nsys.path.insert(0,'backend')\nimport exporter\ncontent,report=exporter.export_3mf(json.load(sys.stdin))\nPath(sys.argv[1]).write_bytes(content)\nprint(json.dumps(report))`;
  const result = spawnSync(python, ['-I', '-c', script, output], { cwd: root, env: { ...process.env, DUCK_ASSETS: assets }, input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr); return JSON.parse(result.stdout);
}

test('ZIP rewrites retain exact untouched local records and archive comments', () => {
  const { ZipArchive, repackZip } = required();
  const source = Buffer.from(zipSync({ '3D/model.model': strToU8('synthetic geometry '.repeat(1000)), 'config.json': strToU8('old'), '中文.txt': strToU8('unchanged') }, { comment: 'archive comment' }));
  const target = repackZip(source, { 'config.json': Buffer.from('new'), 'new.txt': Buffer.from('added') });
  const old = new ZipArchive(source), current = new ZipArchive(target);
  assert.equal(current.read('config.json').toString(), 'new'); assert.equal(current.read('new.txt').toString(), 'added');
  assert.deepEqual(current.comment, old.comment);
  for (const name of ['3D/model.model', '中文.txt']) assert.deepEqual(current.entries.get(name)!.local, old.entries.get(name)!.local);
});

test('synthetic 3MF entries, BOM and manufacturing validation match current Python', () => {
  const { Exporter, ZipArchive } = required(), f = fixture();
  try {
    const engine = new Exporter(f.assets);
    for (const payload of [f.payload, { ...f.payload, assignments: { ...f.payload.assignments, p0: 'example-petg' } }]) {
    const result = engine.export(payload);
    const reference = pythonExport(f.assets, payload, join(f.directory, 'python.3mf'));
    const { createdAt: _createdAt, ...report } = result.report;
    const { createdAt: _referenceTime, ...expectedReport } = reference;
    assert.deepEqual(report, expectedReport);
    const expected = new ZipArchive(readFileSync(join(f.directory, 'python.3mf'))), actual = new ZipArchive(result.content);
    assert.deepEqual([...actual.entries.keys()].sort(), [...expected.entries.keys()].sort());
    for (const name of expected.entries.keys()) {
      const a = actual.read(name), b = expected.read(name);
      if (name === 'Metadata/duck_studio_materials.json') { const x = JSON.parse(a.toString()), y = JSON.parse(b.toString()); delete x.createdAt; delete y.createdAt; assert.deepEqual(x, y); }
      else if (name.endsWith('project_settings.config')) assert.deepEqual(JSON.parse(a.toString()), JSON.parse(b.toString()));
      else assert.deepEqual(a, b, name);
    }
    assert.equal(report.validation.geometryEntriesByteIdentical, 1);
    assert.equal(report.validation.objectCount, 25); assert.equal(report.validation.partCount, 35);
    }
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('export plans use current cross-polymer compatibility and explicit unavailable profiles', () => {
  const { Exporter } = required(), f = fixture();
  try {
    const engine = new Exporter(f.assets);
    const changed = { ...f.payload, assignments: { ...f.payload.assignments, p0: 'example-petg' } };
    const report = engine.plan(changed);
    assert.equal(report.parts[0]!.product.id, 'example-petg');
    assert.equal(report.slots[4]!.profile.status, 'official-product');
    const unavailable = { ...f.payload, assignments: { ...f.payload.assignments, p0: 'unknown-peek' } };
    assert.equal(engine.plan(unavailable).slots[4]!.profile.status, 'unavailable');
    assert.throws(() => engine.export(unavailable), error => errorPayload(error).code === 'request.invalid');
    assert.throws(() => engine.plan({ ...f.payload, assignments: { ...f.payload.assignments, p0: 'support' } }), error => errorPayload(error).code === 'export.26');
    assert.throws(() => engine.plan({}), error => errorPayload(error).code === 'export.20');
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('the real worker preserves raw names, binary previews and current print profiles', async () => {
  const f = fixture(); let manager: module.ExportManager | undefined;
  try {
    const data = parseWireJson(JSON.stringify(f.payload).replace('"name":"合成🦆"', '"name":1.0'));
    assert.ok(isJsonObject(data));
    data.assignments = { ...f.payload.assignments, p0: 'example-petg' };
    const previews = Object.fromEntries(Object.entries(f.payload.thumbnails).map(([name, value]) => [name, Buffer.from(value.slice(22), 'base64')]));
    data.thumbnails = previews;
    manager = new module.ExportManager({ assets: f.assets }); await manager.ready; assert.equal(manager.available, true);
    assert.equal((await manager.run('plan', data)).name, '1.0');
    const content = await manager.run('export', data), archive = new module.ZipArchive(content);
    const report = JSON.parse(archive.read('Metadata/duck_studio_materials.json').toString());
    const config = JSON.parse(archive.read('Metadata/project_settings.config').toString());
    assert.equal(report.name, '1.0'); assert.equal(report.validation.status, 'passed');
    assert.equal(config.filament_type[4], 'PETG'); assert.equal(config.nozzle_temperature[4], '251');
    assert.equal(config.filament_settings_id[4], 'Example · PETG+ · Blue · B');
    assert.deepEqual(archive.read('Metadata/plate_1.png'), previews.plate1);
  } finally { await manager?.close(); rmSync(f.directory, { recursive: true, force: true }); }
});

test('multiple unavailable profiles preserve the complete current Python error payload', () => {
  const f = fixture();
  try {
    const catalog = json(join(f.assets, 'filament-catalog.json'));
    catalog.products.push({ id: 'unknown-pps', brand: 'Example', series: 'PPS', material: 'PPS', name: 'Unknown', hex: '#010203' });
    writeFileSync(join(f.assets, 'filament-catalog.json'), JSON.stringify(catalog));
    const payload = { ...f.payload, assignments: { ...f.payload.assignments, p0: 'unknown-peek', p1: 'unknown-pps' } };
    const script = "import sys,json;sys.path.insert(0,'backend');import exporter;from errors import payload\ntry: exporter.export_3mf(json.load(sys.stdin))\nexcept Exception as exc: print(json.dumps(payload(exc),ensure_ascii=False))";
    const reference = spawnSync(python, ['-I', '-c', script], { cwd: root, env: { ...process.env, DUCK_ASSETS: f.assets }, input: JSON.stringify(payload), encoding: 'utf8' });
    assert.equal(reference.status, 0, reference.stderr);
    assert.throws(() => new module.Exporter(f.assets).export(payload), error => { assert.deepEqual(errorPayload(error), JSON.parse(reference.stdout)); return true; });
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});

test('export validation preserves source, assignment, palette and preview error codes', () => {
  const f = fixture();
  try {
    const engine = new module.Exporter(f.assets);
    const cases: [unknown, string][] = [
      [null, 'export.20'], [{ ...f.payload, source_sha256: 'wrong' }, 'export.20'], [{ ...f.payload, assignments: {} }, 'export.21'],
      [{ ...f.payload, assignments: { ...f.payload.assignments, p0: 'missing' } }, 'export.25'],
      [{ ...f.payload, thumbnails: {} }, 'export.24'], [{ ...f.payload, thumbnails: { ...f.payload.thumbnails, cover: 12 } }, 'export.23'],
      [{ ...f.payload, thumbnails: { ...f.payload.thumbnails, cover: 'data:image/png;base64,bad!' } }, 'export.28'],
    ];
    for (const [payload, code] of cases) assert.throws(() => engine.export(payload), error => errorPayload(error).code === code);
    const catalog = json(join(f.assets, 'filament-catalog.json'));
    for (let index = 0; index < 13; index++) catalog.products.push({ id: `extra-${index}`, brand: 'Example', series: 'PLA', material: 'PLA', name: 'Extra', hex: '#123456' });
    writeFileSync(join(f.assets, 'filament-catalog.json'), JSON.stringify(catalog));
    const parts = json(join(f.assets, 'model.json')).parts.filter((part: { material: string }) => part.material !== 'TPU 90A');
    const assignments = { ...f.payload.assignments }; for (let index = 0; index < 13; index++) assignments[parts[index].id] = `extra-${index}`;
    assert.throws(() => new module.Exporter(f.assets).plan({ ...f.payload, assignments }), error => errorPayload(error).code === 'export.22');
  } finally { rmSync(f.directory, { recursive: true, force: true }); }
});
