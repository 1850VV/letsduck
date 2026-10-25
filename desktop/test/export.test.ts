import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import { fixture, png } from './fixtures.js';
import { Exporter, THUMBNAILS } from '../src/export/exporter.js';
import { repackZip } from '../src/export/zip.js';

const backend = fileURLToPath(new URL('../../backend', import.meta.url));
// The compatibility oracle must read UTF-8 asset JSON consistently on Windows too.
test('real licensed source: Python and Node produce the same printable model and BOM', { skip: !process.env.DUCK_REAL_ASSETS }, () => {
  const assets = process.env.DUCK_REAL_ASSETS!;
  const model = JSON.parse(readFileSync(assets + '/model.json', 'utf8')), catalog = JSON.parse(readFileSync(assets + '/catalog.json', 'utf8'));
  const assignments = Object.fromEntries(model.parts.map((p: any) => [p.id, catalog.products.find((x: any) => x.series === p.material && x.hex === p.color).id]));
  assignments['P2-03'] = 'bambu-GFA00-10200'; assignments['P1-03'] = 'bambu-GFU03-51601';
  const payload = { source_sha256: model.source_sha256, assignments, name: '真实模型比较', thumbnails: Object.fromEntries(THUMBNAILS.map(n => [n, 'data:image/png;base64,' + png().toString('base64')])) };
  const python = JSON.parse(execFileSync(process.env.PYTHON || 'python3', ['-X', 'utf8', '-c', `import sys,json,base64;sys.path.insert(0,sys.argv[1]);import exporter;out,report=exporter.export_3mf(json.load(sys.stdin));print(json.dumps({'archive':base64.b64encode(out).decode(),'report':report}))`, backend], { env: { ...process.env, DUCK_ASSETS: assets }, input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 128 << 20 }));
  const { content, report } = new Exporter(assets).export(payload), a = unzipSync(Buffer.from(python.archive, 'base64')), b = unzipSync(content);
  delete report.createdAt; delete python.report.createdAt; assert.deepEqual(report, python.report);
  assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort());
  for (const name of Object.keys(a)) {
    if (name.endsWith('materials.json')) { const x = JSON.parse(Buffer.from(a[name]!).toString()), y = JSON.parse(Buffer.from(b[name]!).toString()); delete x.createdAt; delete y.createdAt; assert.deepEqual(x, y); }
    else if (name === 'Metadata/project_settings.config') assert.deepEqual(JSON.parse(Buffer.from(a[name]!).toString()), JSON.parse(Buffer.from(b[name]!).toString()));
    else assert.deepEqual(b[name], a[name], name);
  }
});
test('produces the same material plan and print configuration as Python while preserving geometry', () => {
  const f = fixture();
  try {
    f.payload.assignments.p0 = 'blue'; f.payload.assignments.p7 = 'red';
    const python = JSON.parse(execFileSync(process.env.PYTHON || 'python3', ['-X', 'utf8', '-c', `import sys,json,base64;sys.path.insert(0,sys.argv[1]);import exporter;out,report=exporter.export_3mf(json.load(sys.stdin));print(json.dumps({'archive':base64.b64encode(out).decode(),'report':report}))`, backend], { env: { ...process.env, DUCK_ASSETS: f.assets }, input: JSON.stringify(f.payload), encoding: 'utf8' }));
    const engine = new Exporter(f.assets); const { content, report } = engine.export(f.payload);
    const a = unzipSync(Buffer.from(python.archive, 'base64')), b = unzipSync(content);
    delete report.createdAt; delete python.report.createdAt;
    assert.deepEqual(report, python.report);
    assert.deepEqual(JSON.parse(Buffer.from(b['Metadata/project_settings.config']!).toString()), JSON.parse(Buffer.from(a['Metadata/project_settings.config']!).toString()));
    assert.equal(Buffer.from(b['Metadata/model_settings.config']!).toString(), Buffer.from(a['Metadata/model_settings.config']!).toString());
    assert.deepEqual(b['3D/model.model'], unzipSync(f.source)['3D/model.model']);
    for (const name of Object.keys(a).filter(n => n.endsWith('.png'))) assert.deepEqual(b[name], a[name]);
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('rejects mismatched sources, missing parts, wrong materials and invalid thumbnails', () => {
  const f = fixture();
  try {
    const engine = new Exporter(f.assets);
    assert.throws(() => engine.plan({ ...f.payload, source_sha256: 'wrong' }), (e: any) => e.code === 'export.20');
    assert.throws(() => engine.plan({ ...f.payload, assignments: {} }), (e: any) => e.code === 'export.21');
    assert.throws(() => engine.plan({ ...f.payload, assignments: { ...f.payload.assignments, p0: 'red' } }), (e: any) => e.code === 'export.26');
    assert.throws(() => engine.export({ ...f.payload, thumbnails: {} }), (e: any) => e.code === 'export.24');
    assert.throws(() => engine.export({ ...f.payload, thumbnails: { ...f.payload.thumbnails, cover: 'data:image/png;base64,!!!!' } }), (e: any) => e.code === 'export.28');
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});

test('ZIP updates preserve unaffected compressed records as well as uncompressed content', () => {
  const f = fixture();
  try {
    const result = repackZip(Buffer.from(f.source), { 'Metadata/test.json': Buffer.from('{"ok":true}') });
    const a = Buffer.from(f.source), firstDirectory = a.indexOf(Buffer.from('504b0102', 'hex'));
    assert.deepEqual(result.subarray(0, firstDirectory), a.subarray(0, firstDirectory));
    assert.equal(Buffer.from(unzipSync(result)['Metadata/test.json']!).toString(), '{"ok":true}');
  } finally { rmSync(f.root, { recursive: true, force: true }); }
});
