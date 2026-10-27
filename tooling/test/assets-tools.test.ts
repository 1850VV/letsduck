import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
import { importAssets } from '../../scripts/import_local_assets.js';
import { importAssemblyAssets, AssetMissing } from '../../scripts/import_assembly_assets.js';
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'duck-import-ts-')), source = join(root, 'source'), target = join(root, 'target'); await mkdir(source);
  const zip = zipSync({ '3D/test.model': strToU8('synthetic test fixture') });
  const files: Record<string, Uint8Array> = { 'source.3mf': zip, 'model.json': Buffer.from(JSON.stringify({ source_sha256: sha(zip), parts: Array.from({ length: 35 }, (_, i) => ({ id: String(i) })), hardware: [] })), 'catalog.json': Buffer.from('{"products":[{"id":"synthetic","series":"PLA Basic"}]}'), 'export-schema.json': Buffer.from('{"filamentChunks":{},"variantKeys":[]}'), 'geometry.bin': Buffer.alloc(12) };
  for (const [name, bytes] of Object.entries(files)) await writeFile(join(source, name), bytes);
  return { root, source, target, files };
}
test('asset importer preserves original bytes, repeats identical imports and keeps optional profiles', async () => {
  const f = await fixture();
  try {
    for (const name of ['filament-catalog.json', 'filament-profiles.json']) { f.files[name] = Buffer.from('{}'); await writeFile(join(f.source, name), f.files[name]!); }
    await importAssets(f.source, f.target); await importAssets(f.source, f.target);
    for (const [name, bytes] of Object.entries(f.files)) { assert.deepEqual(await readFile(join(f.source, name)), Buffer.from(bytes)); assert.deepEqual(await readFile(join(f.target, name)), Buffer.from(bytes)); }
  } finally { await rm(f.root, { recursive: true, force: true }); }
});
test('asset importer rejects missing/mismatched packs before creating target', async () => {
  const f = await fixture();
  try { await rm(join(f.source, 'geometry.bin')); await assert.rejects(importAssets(f.source, f.target), /Incomplete/); await assert.rejects(readdir(f.target), { code: 'ENOENT' }); await writeFile(join(f.source, 'geometry.bin'), Buffer.alloc(12)); await writeFile(join(f.source, 'source.3mf'), 'changed'); await assert.rejects(importAssets(f.source, f.target), /does not match/); await assert.rejects(readdir(f.target), { code: 'ENOENT' }); }
  finally { await rm(f.root, { recursive: true, force: true }); }
});
test('asset importer never overwrites different existing files or adds partial files', async () => {
  const f = await fixture();
  try { await mkdir(f.target); await writeFile(join(f.target, 'geometry.bin'), 'user data'); await assert.rejects(importAssets(f.source, f.target), /Different local asset/); assert.deepEqual(await readdir(f.target), ['geometry.bin']); assert.equal(await readFile(join(f.target, 'geometry.bin'), 'utf8'), 'user data'); }
  finally { await rm(f.root, { recursive: true, force: true }); }
});
test('assembly importer accepts absent optional reference, validates present reference and stages before writing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'duck-assembly-import-ts-')), target = join(root, 'target'), model = Buffer.from('model'), photo = Buffer.from('photo');
  const meta = (value: Buffer) => ({ bytes: value.length, sha256: sha(value) });
  try {
    const manifest = { files: { 'model.bin': meta(model) }, optionalFiles: { 'photo.jpg': meta(photo) } };
    await importAssemblyAssets(name => { if (name === 'model.bin') return model; throw new AssetMissing(name); }, target, manifest);
    assert.deepEqual(await readdir(target), ['model.bin']);
    await importAssemblyAssets(name => name === 'model.bin' ? model : photo, target, manifest); assert.deepEqual(await readFile(join(target, 'photo.jpg')), photo);
    await assert.rejects(importAssemblyAssets(() => Buffer.from('wrong'), target, manifest), /does not match/); assert.deepEqual(await readFile(join(target, 'photo.jpg')), photo);
    const badTarget = join(root, 'bad'); await assert.rejects(importAssemblyAssets(() => Buffer.from('wrong'), badTarget, { files: { 'a.bin': meta(model), 'b.bin': meta(model) } }), /does not match/); assert.deepEqual(await readdir(badTarget), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('DDG1 delta coding preserves modulo16 values and print layout transform', async () => {
  const { zigzag16, planes, pack } = await import('../../scripts/pack_geometry.js');
  const values=[0,65535,1,40000,3,3,65000,12],stream=planes(zigzag16(values));let previous=0;
  const decoded=values.map((_,i)=>{const value=stream[i]!|(stream[values.length+i]!<<8);previous=(previous+((value>>1)^-(value&1)))&65535;return previous;});assert.deepEqual(decoded,values);
  const n=40,positions=Float32Array.from(Array.from({length:n},(_,i)=>[i*7%50,i*13%31,i*3%17]).flat()),indices=Uint32Array.from({length:n*3},(_,i)=>i*37%n),printed=Float32Array.from(Array.from({length:n},(_,i)=>[positions[i*3+1]!+5,-positions[i*3]!+2,positions[i*3+2]!-1]).flat());
  const binary=Buffer.concat([Buffer.from(positions.buffer),Buffer.from(indices.buffer),Buffer.from(printed.buffer)]),model={parts:[{id:'synthetic',geometry:{positionOffset:0,vertexCount:n,indexOffset:n*12,indexCount:n*3},printPositionOffset:n*24}],hardware:[]};
  const data=pack(model,binary);assert.equal(data.subarray(0,4).toString(),'DDG1');const header:unknown=JSON.parse(data.subarray(8,8+data.readUInt32LE(4)).toString());assert.ok(header&&typeof header==='object'&&'meshes'in header&&Array.isArray(header.meshes));assert.ok('printMatrix'in header.meshes[0]);
  const { unpackGeometry }=await import('../../frontend/shared/geometry-pack.js');const rebuilt=unpackGeometry(Uint8Array.from(data).buffer,model);const actual=new Uint32Array(rebuilt,n*12,n*3);assert.deepEqual(Array.from(actual),Array.from(indices));
  assert.throws(()=>pack({parts:[{id:'too-big',geometry:{positionOffset:0,vertexCount:70000,indexOffset:0,indexCount:3},printPositionOffset:0}],hardware:[]},Buffer.alloc(16)),/mesh too large/);
});
