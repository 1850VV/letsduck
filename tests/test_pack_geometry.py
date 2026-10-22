"""Geometry packer on synthetic meshes (no asset pack needed); tests/test_geometry_pack.mjs checks the real model."""
import array
import json
import struct
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import pack_geometry as pg  # noqa: E402


def unzig(stream_bytes, count):
    """Python mirror of frontend/shared/geometry-pack.mjs for one stream."""
    out, acc = [], 0
    for i in range(count):
        v = stream_bytes[i] | stream_bytes[count + i] << 8
        acc = (acc + ((v >> 1) ^ -(v & 1))) & 0xFFFF
        out.append(acc)
    return out


def mesh(n):
    pos = array.array('f', [v for i in range(n) for v in (float(i * 7 % 50), float(i * 13 % 31), float(i * 3 % 17))])
    idx = array.array('I', [(i * 37) % n for i in range(n * 3)])
    return pos, idx


class PackTest(unittest.TestCase):
    def test_delta_coding_round_trips_across_the_16_bit_range(self):
        values = [0, 65535, 1, 40000, 3, 3, 65000, 12]
        data = pg.planes(pg.zigzag16(values))
        self.assertEqual(unzig(data, len(values)), values)

    def test_print_layout_becomes_a_transform_and_indices_survive(self):
        n = 40
        pos, idx = mesh(n)
        printed = array.array('f', [v for i in range(n) for v in (pos[i * 3 + 1] + 5, -pos[i * 3] + 2, pos[i * 3 + 2] - 1)])  # rotated + moved
        binary = pos.tobytes() + idx.tobytes() + printed.tobytes()
        model = {'parts': [{'geometry': {'positionOffset': 0, 'vertexCount': n, 'indexOffset': n * 12, 'indexCount': n * 3},
                            'printPositionOffset': n * 12 + n * 12}], 'hardware': []}
        data = pg.pack(model, binary)
        self.assertEqual(data[:4], b'DDG1')
        length = struct.unpack('<I', data[4:8])[0]
        header = json.loads(data[8:8 + length])
        m = header['meshes'][0]
        self.assertIn('printMatrix', m)
        body = data[8 + length:]
        start, size = m['indices']
        self.assertEqual(unzig(body[start:start + size], n * 3), list(idx))

    def test_meshes_too_large_for_16_bit_indices_are_refused(self):
        model = {'parts': [{'geometry': {'positionOffset': 0, 'vertexCount': 70000, 'indexOffset': 0, 'indexCount': 3}, 'printPositionOffset': 0}], 'hardware': []}
        with self.assertRaises(ValueError):
            pg.pack(model, b'\0' * 16)


if __name__ == '__main__':
    unittest.main()
