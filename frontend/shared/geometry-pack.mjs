// Rebuilds geometry.bin's exact layout from geometry.pack.bin (written by scripts/pack_geometry.py),
// so the 3D view reads the same offsets from model.json whichever file it downloaded. The pack is
// about a third of the size after gzip: 16-bit positions per mesh bounding box (~0.002 mm steps),
// indices that round-trip exactly, and print layouts stored as one transform where possible.
// Throws when the pack does not match model.json; the caller then falls back to geometry.bin.

function delta16(bytes, start, count, out, stride = 1, offset = 0, map = (v) => v) {
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const v = bytes[start + i] | bytes[start + count + i] << 8; // low-byte plane, then high-byte plane
    acc = acc + (v >>> 1 ^ -(v & 1)) & 0xFFFF;                   // zigzag delta, modulo 65536
    out[i * stride + offset] = map(acc);
  }
}

function positions(bytes, start, n, min, scale, out) {
  for (let k = 0; k < 3; k++) delta16(bytes, start + k * 2 * n, n, out, 3, k, (q) => min[k] + q / 65535 * scale[k]);
}

export function unpackGeometry(buffer, model) {
  const bytes = new Uint8Array(buffer), view = new DataView(buffer);
  if (String.fromCharCode(...bytes.subarray(0, 4)) !== 'DDG1') throw Error('Not a geometry pack');
  const length = view.getUint32(4, true), header = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + length))), data = 8 + length;
  const items = [...model.parts.map((p) => ['part', p.geometry, p.printPositionOffset]), ...model.hardware.map((h) => ['hardware', h.geometry])];
  if (header.format !== 1 || header.meshes.length !== items.length) throw Error('Geometry pack does not match model.json');
  const out = new ArrayBuffer(header.byteLength);
  header.meshes.forEach((m, i) => {
    const [kind, g, printOffset] = items[i];
    if (m.kind !== kind || m.vertexCount !== g.vertexCount || m.indexCount !== g.indexCount || m.positionOffset !== g.positionOffset ||
      m.indexOffset !== g.indexOffset || (kind === 'part' && m.printPositionOffset !== printOffset)) throw Error('Geometry pack does not match model.json');
    const n = m.vertexCount, assembled = new Float32Array(out, m.positionOffset, n * 3);
    positions(bytes, data + m.positions[0], n, m.min, m.scale, assembled);
    delta16(bytes, data + m.indices[0], m.indexCount, new Uint32Array(out, m.indexOffset, m.indexCount));
    if (kind !== 'part') return;
    const printed = new Float32Array(out, m.printPositionOffset, n * 3);
    if (m.printMatrix) {
      const [a, b, c] = m.printMatrix;
      for (let v = 0; v < n * 3; v += 3) {
        const x = assembled[v], y = assembled[v + 1], z = assembled[v + 2];
        printed[v] = a[0] * x + a[1] * y + a[2] * z + a[3];
        printed[v + 1] = b[0] * x + b[1] * y + b[2] * z + b[3];
        printed[v + 2] = c[0] * x + c[1] * y + c[2] * z + c[3];
      }
    } else positions(bytes, data + m.print.positions[0], n, m.print.min, m.print.scale, printed);
  });
  return out;
}
