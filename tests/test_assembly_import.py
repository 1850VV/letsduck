import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('assembly_import', Path(__file__).resolve().parents[1] / 'scripts/import_assembly_assets.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AssemblyReferenceTests(unittest.TestCase):
    def test_optional_photo_does_not_break_an_existing_asset_pack(self):
        def meta(data):
            return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
        manifest = {'files': {'model.bin': meta(b'model')}, 'optionalFiles': {'photo.jpg': meta(b'photo')}}
        def read(name):
            if name == 'model.bin':
                return b'model'
            raise ValueError('missing optional reference')
        with tempfile.TemporaryDirectory() as folder, patch.object(module, 'MANIFEST', manifest):
            module.import_assets(read, folder)
            self.assertEqual((Path(folder) / 'model.bin').read_bytes(), b'model')
            self.assertFalse((Path(folder) / 'photo.jpg').exists())

    def test_available_reference_photo_is_imported_and_checked(self):
        manifest = {'files': {}, 'optionalFiles': {'photo.jpg': {'bytes': 5, 'sha256': hashlib.sha256(b'photo').hexdigest()}}}
        with tempfile.TemporaryDirectory() as folder, patch.object(module, 'MANIFEST', manifest):
            module.import_assets(lambda _: b'photo', folder)
            self.assertTrue((Path(folder) / 'photo.jpg').is_file(), 'an available optional photo is copied')
            self.assertEqual((Path(folder) / 'photo.jpg').read_bytes(), b'photo')
            with self.assertRaises(ValueError):
                module.import_assets(lambda _: b'wrong', folder)
