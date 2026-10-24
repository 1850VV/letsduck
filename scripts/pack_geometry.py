"""Packs assets/geometry.bin into assets/geometry.pack.bin: about a third of the size after gzip.

Only the frontend's 3D view reads the geometry (3MF export works from the source 3MF), so this is
a transport format: frontend/shared/geometry-pack.mjs rebuilds the original layout in the browser.

- positions: 16-bit per axis over each mesh's bounding box (steps of about 0.002 mm), delta-coded
- indices: delta-coded modulo 65536 (every mesh has fewer than 65536 vertices), so they round-trip exactly
- print layout: the assembled positions under one stored transform when that reproduces them to
  within 0.01 mm, otherwise packed like the assembled positions
- every stream is zigzag-encoded and split into low/high byte planes, which gzip compresses well

Format: b'DDG1', u32 JSON length, JSON header (UTF-8, space-padded to 4 bytes), then the streams.
Standard library only. Usage: python3 scripts/pack_geometry.py [assets dir]
"""
import array
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAGIC = b'DDG1'
PRINT_TOLERANCE = 0.01  # mm


def zigzag16(values):
    """Deltas modulo 65536 as zigzagged unsigned 16-bit numbers."""
    out, prev = array.array('H'), 0
    for v in values:
        d = (v - prev) & 0xFFFF
        d = d - 0x10000 if d >= 0x8000 else d
        out.append(((d << 1) ^ (d >> 15)) & 0xFFFF)
        prev = v
    return out


def planes(stream):
    """Little-endian low bytes, then high bytes."""
    if sys.byteorder != 'little':
        stream = array.array('H', stream)
        stream.byteswap()
    raw = stream.tobytes()
    return raw[0::2] + raw[1::2]


def quantize(pos, n):
    lo = [min(pos[k::3]) for k in range(3)]
    scale = [(max(pos[k::3]) - lo[k]) or 1.0 for k in range(3)]
    q = [[round((pos[i * 3 + k] - lo[k]) / scale[k] * 65535) for i in range(n)] for k in range(3)]
    # One delta stream per axis keeps neighbouring vertices' small differences together.
    return lo, scale, b''.join(planes(zigzag16(axis)) for axis in q), q


def solve(rows, rhs):
    m = [r[:] + [v] for r, v in zip(rows, rhs)]
    for c in range(4):
        p = max(range(c, 4), key=lambda r: abs(m[r][c]))
        m[c], m[p] = m[p], m[c]
        if abs(m[c][c]) < 1e-12:
            raise ZeroDivisionError
        for r in range(4):
            if r != c:
                f = m[r][c] / m[c][c]
                m[r] = [a - f * b for a, b in zip(m[r], m[c])]
    return [m[i][4] / m[i][i] for i in range(4)]


def fit_transform(src, dst, n):
    """3x4 affine matrix mapping src to dst from four well-spread vertices, or None."""
    pts = [tuple(src[i * 3:i * 3 + 3]) for i in range(n)]
    sub = lambda a, b: [a[k] - b[k] for k in range(3)]
    cross = lambda a, b: [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
    dot = lambda a, b: sum(a[k] * b[k] for k in range(3))
    # Four well-spread vertices: far apart, far from that line, then far from that plane.
    i0 = 0
    i1 = max(range(n), key=lambda i: dot(sub(pts[i], pts[i0]), sub(pts[i], pts[i0])))
    axis = sub(pts[i1], pts[i0])
    i2 = max(range(n), key=lambda i: dot(*(2 * [cross(sub(pts[i], pts[i0]), axis)])))
    normal = cross(axis, sub(pts[i2], pts[i0]))
    i3 = max(range(n), key=lambda i: abs(dot(sub(pts[i], pts[i0]), normal)))
    rows = [[*pts[i], 1.0] for i in (i0, i1, i2, i3)]
    try:
        matrix = [solve(rows, [dst[i * 3 + k] for i in (i0, i1, i2, i3)]) for k in range(3)]
    except ZeroDivisionError:
        return None
    for i in range(n):
        x, y, z = pts[i]
        for k in range(3):
            a, b, c, d = matrix[k]
            if abs(a * x + b * y + c * z + d - dst[i * 3 + k]) > PRINT_TOLERANCE:
                return None
    return matrix


def pack(model, binary):
    f32 = lambda off, n: array.array('f', binary[off:off + n * 4])
    u32 = lambda off, n: array.array('I', binary[off:off + n * 4])
    header = {'format': 1, 'geometrySha256': hashlib.sha256(binary).hexdigest(), 'byteLength': len(binary), 'meshes': []}
    blobs, offset = [], 0

    def add(data):
        nonlocal offset
        blobs.append(data)
        start, offset = offset, offset + len(data)
        return [start, len(data)]

    for kind, items in (('part', model['parts']), ('hardware', model['hardware'])):
        for item in items:
            g = item['geometry']
            n, m = g['vertexCount'], g['indexCount']
            if n > 65536:
                raise ValueError('mesh too large for 16-bit indices')
            pos = f32(g['positionOffset'], n * 3)
            lo, scale, stream, q = quantize(pos, n)
            idx = u32(g['indexOffset'], m)
            mesh = {'kind': kind, 'vertexCount': n, 'indexCount': m, 'positionOffset': g['positionOffset'], 'indexOffset': g['indexOffset'],
                    'min': lo, 'scale': scale, 'positions': add(stream), 'indices': add(planes(zigzag16(idx)))}
            # Round-trip check: indices exact, positions within half a quantization step.
            for k in range(3):
                step = scale[k] / 65535
                if any(abs(lo[k] + q[k][i] / 65535 * scale[k] - pos[i * 3 + k]) > step for i in range(n)):
                    raise AssertionError('quantization check failed')
            if kind == 'part':
                mesh['printPositionOffset'] = item['printPositionOffset']
                printed = f32(item['printPositionOffset'], n * 3)
                matrix = fit_transform(pos, printed, n)
                if matrix:
                    mesh['printMatrix'] = matrix
                else:
                    plo, pscale, pstream, _ = quantize(printed, n)
                    mesh['print'] = {'min': plo, 'scale': pscale, 'positions': add(pstream)}
            header['meshes'].append(mesh)
    text = json.dumps(header, separators=(',', ':')).encode()
    text += b' ' * (-len(text) % 4)
    return MAGIC + struct.pack('<I', len(text)) + text + b''.join(blobs)


def write_pack(assets):
    assets = Path(assets)
    model = json.loads((assets / 'model.json').read_text(encoding='utf-8'))
    data = pack(model, (assets / 'geometry.bin').read_bytes())
    temp = assets / 'geometry.pack.bin.tmp'
    temp.write_bytes(data)
    temp.replace(assets / 'geometry.pack.bin')
    # A positions pack from an earlier preparation must never be blessed by this run.
    for suffix in ('', '.br', '.gz'):
        (assets / ('geometry.positions.bin' + suffix)).unlink(missing_ok=True)
    from asset_integrity import write_integrity
    write_integrity(assets)
    return len(data)


if __name__ == '__main__':
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'assets'
    size = write_pack(target)
    print('geometry.pack.bin: %d bytes (geometry.bin: %d)' % (size, (target / 'geometry.bin').stat().st_size))
