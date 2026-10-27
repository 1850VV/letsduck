import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';

const moduleURL = new URL('../src/zip-evidence.js', import.meta.url).href;
const entries = {
  '[Content_Types].xml': strToU8('<Types/>'),
  '3D/3dmodel.model': strToU8('<model unit="millimeter"/>'),
  'Metadata/duck_studio_materials.json': strToU8('{"schema":"duck-studio-materials/2","parts":[]}'),
};

test('export evidence records readable content and the exact compressed local records', async () => {
  const implementation = await import(moduleURL).catch(() => null);
  assert.equal(typeof implementation?.describeExport, 'function', 'The 3MF evidence reader is missing');
  const archive = Buffer.from(zipSync(entries, { level: 0 }));
  const result = implementation.describeExport(archive);
  assert.equal(result.bytes, archive.length);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.entries.map((entry: { name: string }) => entry.name), ['[Content_Types].xml', '3D/3dmodel.model', 'Metadata/duck_studio_materials.json']);
  assert.equal(result.entries[1].bytes, 26);
  assert.match(result.entries[1].compressedRecordSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(result.bom, { schema: 'duck-studio-materials/2', parts: [] });
});

test('a successful HTTP response containing invalid or corrupted 3MF bytes cannot become evidence', async () => {
  const implementation = await import(moduleURL).catch(() => null);
  assert.equal(typeof implementation?.describeExport, 'function', 'The 3MF evidence reader is missing');
  assert.throws(() => implementation.describeExport(Buffer.from('not a model')));
  const corrupt = Buffer.from(zipSync(entries, { level: 0 }));
  const position = corrupt.indexOf(Buffer.from('<model unit="millimeter"/>'));
  assert.ok(position >= 0); corrupt[position] = corrupt[position]! ^ 1;
  assert.throws(() => implementation.describeExport(corrupt), /CRC/);
});
