"""Public tests use generated placeholders; no third-party meshes or data."""
import hashlib, importlib.util, json, tempfile, unittest, zipfile
from pathlib import Path

SCRIPT=Path(__file__).resolve().parents[1]/'scripts/import_local_assets.py'

class AssetImportTests(unittest.TestCase):
    def importer(self):
        self.assertTrue(SCRIPT.exists(), 'local asset import entry point is missing')
        spec=importlib.util.spec_from_file_location('local_assets',SCRIPT)
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        return module

    def fixture(self,root):
        root.mkdir()
        with zipfile.ZipFile(root/'source.3mf','w') as z:z.writestr('3D/test.model','synthetic test fixture')
        digest=hashlib.sha256((root/'source.3mf').read_bytes()).hexdigest()
        (root/'model.json').write_text(json.dumps({'source_sha256':digest,'parts':[{'id':str(i)} for i in range(35)],'hardware':[]}))
        (root/'catalog.json').write_text(json.dumps({'products':[{'id':'synthetic','series':'PLA Basic'}]}))
        (root/'export-schema.json').write_text(json.dumps({'filamentChunks':{},'variantKeys':[]}))
        (root/'geometry.bin').write_bytes(b'\x00'*12)

    def test_complete_pack_copies_without_changing_original(self):
        module=self.importer()
        with tempfile.TemporaryDirectory()as tmp:
            src=Path(tmp)/'source';dst=Path(tmp)/'target';self.fixture(src)
            original={p.name:p.read_bytes() for p in src.iterdir()}
            module.import_assets(src,dst)
            self.assertEqual(original,{p.name:p.read_bytes() for p in dst.iterdir()})
            self.assertEqual(original,{p.name:p.read_bytes() for p in src.iterdir()})
            module.import_assets(src,dst) # identical import is safe to repeat

    def test_optional_catalogue_and_profiles_are_copied_with_the_pack(self):
        module=self.importer()
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'source';dst=Path(tmp)/'target';self.fixture(src)
            for name,data in [('filament-catalog.json',{'products':[]}),('filament-profiles.json',{'profiles':{}})]:
                (src/name).write_text(json.dumps(data))
            module.import_assets(src,dst)
            for name in ['filament-catalog.json','filament-profiles.json']:self.assertEqual((src/name).read_bytes(),(dst/name).read_bytes())
    def test_missing_pack_fails_before_writing(self):
        module=self.importer()
        with tempfile.TemporaryDirectory()as tmp:
            src=Path(tmp)/'source';dst=Path(tmp)/'target';self.fixture(src);(src/'geometry.bin').unlink()
            with self.assertRaises(ValueError):module.import_assets(src,dst)
            self.assertFalse(dst.exists())

    def test_mismatched_source_fails_before_writing(self):
        module=self.importer()
        with tempfile.TemporaryDirectory()as tmp:
            src=Path(tmp)/'source';dst=Path(tmp)/'target';self.fixture(src)
            (src/'source.3mf').write_bytes(b'changed')
            with self.assertRaises(ValueError):module.import_assets(src,dst)
            self.assertFalse(dst.exists())

    def test_different_existing_assets_are_not_overwritten(self):
        module=self.importer()
        with tempfile.TemporaryDirectory()as tmp:
            src=Path(tmp)/'source';dst=Path(tmp)/'target';self.fixture(src);dst.mkdir()
            (dst/'geometry.bin').write_bytes(b'user data')
            with self.assertRaises(FileExistsError):module.import_assets(src,dst)
            self.assertEqual((dst/'geometry.bin').read_bytes(),b'user data')
            self.assertEqual(len(list(dst.iterdir())),1)

if __name__=='__main__':unittest.main()
