"""Prepared transport stays optional and never rewrites original local assets."""
import gzip
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from prepare_delivery import prepare_files


class DeliveryPreparationTests(unittest.TestCase):
    def test_preparation_produces_valid_sidecars_without_touching_sources_or_audio(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            data = b'synthetic model payload' * 100
            (root / 'model.bin').write_bytes(data)
            (root / 'track.mp3').write_bytes(b'audio')
            self.assertEqual(prepare_files(root, ['model.bin', 'track.mp3', 'missing.glb']), 1)
            self.assertEqual((root / 'model.bin').read_bytes(), data)
            zipped = (root / 'model.bin.gz').read_bytes()
            self.assertEqual(gzip.decompress(zipped), data)
            meta = json.loads((root / 'model.bin.gzip.json').read_text())
            self.assertEqual(meta['raw'], hashlib.sha256(data).hexdigest())
            self.assertEqual(meta['gzip'], hashlib.sha256(zipped).hexdigest())
            self.assertFalse((root / 'track.mp3.gz').exists())
            # A later source update prepares the new bytes, never serves the previous gzip.
            (root / 'model.bin').write_bytes(b'updated')
            prepare_files(root, ['model.bin'])
            self.assertEqual(gzip.decompress((root / 'model.bin.gz').read_bytes()), b'updated')
