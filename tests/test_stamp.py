"""The server edition's build step: hashed code URLs, one import map, preloads. No asset pack needed."""
import hashlib
import json
import re
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'frontend'))
import stamp  # noqa: E402


class StampTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.site = Path(self.tmp.name) / 'site'
        shutil.copytree(ROOT / 'frontend', self.site)
        stamp.stamp(self.site)

    def tearDown(self):
        self.tmp.cleanup()

    def page(self, name):
        html = (self.site / name).read_text(encoding='utf-8')
        imports = json.loads(re.search(r'<script type="importmap" data-stamped>(.*?)</script>', html, re.S).group(1))['imports']
        return html, imports

    def check_url(self, value):
        path, version = value.split('?v=')
        self.assertEqual(hashlib.sha256((self.site / path.lstrip('/')).read_bytes()).hexdigest()[:10], version, value)

    def test_every_code_url_is_hashed_and_correct(self):
        for name in stamp.PAGES:
            html, imports = self.page(name)
            refs = re.findall(r'(?:href|src)="([^"]+\.(?:mjs|js|css)(?:\?[^"]*)?)"', html)
            self.assertTrue(refs)
            for ref in refs:
                self.assertIn('?v=', ref, (name, ref))
                self.check_url(ref)
            for key, value in imports.items():
                self.check_url(value)
            self.assertEqual(imports['three'], imports['/vendor/three.module.js'])

    def test_whole_module_graph_and_model_are_preloaded(self):
        html, _ = self.page('index.html')
        preloaded = {h.split('?')[0] for h in re.findall(r'rel="modulepreload" href="([^"]+)"', html)}
        for path in ['/shared/duck-view.mjs', '/locales/catalogs.mjs', '/vendor/three.core.js', '/lib/quick-style.mjs']:
            self.assertIn(path, preloaded)
        for path in stamp.MODEL:
            self.assertIn('<link rel="preload" href="%s" as="fetch" crossorigin>' % path, html)
        # Preloads follow the import map, which must come first.
        self.assertLess(html.index('type="importmap"'), html.index('rel="modulepreload"'))

    def test_source_pages_are_untouched_and_restamping_is_refused(self):
        for name in stamp.PAGES:
            self.assertNotIn('?v=', (ROOT / 'frontend' / name).read_text(encoding='utf-8'))
        with self.assertRaises(SystemExit):
            stamp.stamp(self.site)


if __name__ == '__main__':
    unittest.main()
