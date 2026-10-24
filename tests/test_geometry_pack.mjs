import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {unpackGeometry} from '../frontend/shared/geometry-pack.mjs';

const assets = new URL('../assets/', import.meta.url);
const ready = existsSync(new URL('geometry.pack.bin', assets));
const read = (name) => readFileSync(new URL(name, assets));
const buffer = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

test('the pack rebuilds geometry.bin: indices exact, positions within 0.01 mm', {skip: !ready && 'run scripts/pack_geometry.py first'}, () => {
  const model = JSON.parse(read('model.json')), original = buffer(read('geometry.bin'));
  const rebuilt = unpackGeometry(buffer(read('geometry.pack.bin')), model);
  assert.equal(rebuilt.byteLength, original.byteLength);
  let worst = 0;
  for (const item of [...model.parts, ...model.hardware]) {
    const g = item.geometry;
    assert.deepEqual(new Uint32Array(rebuilt, g.indexOffset, g.indexCount), new Uint32Array(original, g.indexOffset, g.indexCount));
    for (const offset of [g.positionOffset, item.printPositionOffset].filter((o) => o !== undefined)) {
      const a = new Float32Array(rebuilt, offset, g.vertexCount * 3), b = new Float32Array(original, offset, g.vertexCount * 3);
      for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
    }
  }
  assert.ok(worst < 0.01, 'worst position error ' + worst + ' mm');
});

test('a pack that does not match model.json is refused', {skip: !ready}, () => {
  const model = JSON.parse(read('model.json'));
  model.parts[0].geometry.vertexCount += 1;
  assert.throws(() => unpackGeometry(buffer(read('geometry.pack.bin')), model), /does not match/);
  assert.throws(() => unpackGeometry(new ArrayBuffer(16), model), /Not a geometry pack/);
});


test('truncated geometry streams are refused instead of silently zero-filled', {skip: !ready}, () => {
 const model=JSON.parse(read('model.json')), data=read('geometry.pack.bin');
 assert.throws(()=>unpackGeometry(buffer(data.subarray(0,data.length-8)),model),/Invalid geometry/);
});
