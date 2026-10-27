import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {parseModelManifest} from '../frontend/shared/guards.js';
import {unpackGeometry} from '../frontend/shared/geometry-pack.js';

const assets = new URL('../assets/', import.meta.url);
const ready = existsSync(new URL('geometry.pack.bin', assets));
const read = (name:string) => readFileSync(new URL(name, assets));
const buffer = (b:Buffer<ArrayBuffer>) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

test('the pack rebuilds geometry.bin: indices exact, positions within 0.01 mm', {skip: !ready && 'run npm run pack:geometry first'}, () => {
  const model = parseModelManifest(JSON.parse(read('model.json').toString('utf8'))), original = buffer(read('geometry.bin'));
  const rebuilt = unpackGeometry(buffer(read('geometry.pack.bin')), model);
  assert.equal(rebuilt.byteLength, original.byteLength);
  let worst = 0;
  for (const item of [...model.parts, ...model.hardware]) {
    const g = item.geometry;
    assert.deepEqual(new Uint32Array(rebuilt, g.indexOffset, g.indexCount), new Uint32Array(original, g.indexOffset, g.indexCount));
    for (const offset of [g.positionOffset, ('printPositionOffset'in item?item.printPositionOffset:undefined)].filter((o):o is number => typeof o==='number')) {
      const a = new Float32Array(rebuilt, offset, g.vertexCount * 3), b = new Float32Array(original, offset, g.vertexCount * 3);
      for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i]! - b[i]!));
    }
  }
  assert.ok(worst < 0.01, 'worst position error ' + worst + ' mm');
});

test('a pack that does not match model.json is refused', {skip: !ready}, () => {
  const model = parseModelManifest(JSON.parse(read('model.json').toString('utf8')));
  model.parts[0]!.geometry.vertexCount += 1;
  assert.throws(() => unpackGeometry(buffer(read('geometry.pack.bin')), model), /does not match/);
  assert.throws(() => unpackGeometry(new ArrayBuffer(16), model), /Not a geometry pack/);
});
