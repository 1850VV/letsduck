"""Personal edition: standard-library server, no login, no gallery, schemes in a local SQLite file.

Runs with the plain system Python (3.9+) and no installed packages, like the personal edition itself.
"""
import json
import sqlite3
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPErrorProcessor, urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'personal'))
import app  # noqa: E402


class NoRedirect(HTTPErrorProcessor):
    def http_response(self, request, response):
        return response


class PersonalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / 'personal.db'
        self.servers = []

    def tearDown(self):
        for server in self.servers:
            if getattr(server, 'running', False):
                server.shutdown()
            server.server_close()
            server.store.close()
        self.tmp.cleanup()

    def start(self, legacy=None):
        server = app.create_server('127.0.0.1', 0, db=self.db, legacy=legacy)
        server.running = True
        threading.Thread(target=server.serve_forever, daemon=True).start()
        self.servers.append(server)
        self.base = 'http://127.0.0.1:%d' % server.server_address[1]
        return server

    def call(self, method, path, body=None, content_type='application/json'):
        data = json.dumps(body).encode() if isinstance(body, dict) else body
        request = Request(self.base + path, data=data, method=method, headers={'Content-Type': content_type} if data is not None else {})
        try:
            with urlopen(request) as response:
                return response.status, json.loads(response.read() or b'null')
        except HTTPError as error:
            return error.code, json.loads(error.read() or b'null')

    def design(self, server):
        parts = sorted(server.store.part_ids) or ['P1-01']
        return {'colors': {p: '#ffffff' for p in parts}, 'assignments': {p: None for p in parts}}

    @unittest.skipUnless(app.exporter, 'requires local assets')
    def test_binary_export_uses_standard_library_and_preserves_archive(self):
        import io, zipfile
        from test_export import payload
        from export_fixtures import multipart
        self.start()
        request = Request(self.base+'/api/export', data=multipart(payload()), headers={'Content-Type':'multipart/form-data; boundary=duck-test'})
        with urlopen(request) as response:
            self.assertEqual(response.status,200)
            with zipfile.ZipFile(io.BytesIO(response.read())) as archive:
                self.assertIsNone(archive.testzip())
                for name in app.exporter.SOURCE_ZIP.namelist():
                    if name.startswith('3D/'):
                        self.assertEqual(archive.read(name), app.exporter.SOURCE_ZIP.read(name))

    def test_schemes_persist_without_login(self):
        server = self.start()
        status, created = self.call('PUT', '/api/schemes/personal-1', {'name': '我的个人方案', 'design': self.design(server), 'voiceSalt': 7})
        self.assertEqual(status, 200)
        self.assertEqual(created['design']['colors'][sorted(server.store.part_ids or ['P1-01'])[0]], '#FFFFFF')
        server.shutdown(); server.server_close(); server.store.close(); self.servers.remove(server)
        # A fresh process: no token, cookie or browser storage, same file.
        self.start()
        self.assertEqual(self.call('GET', '/api/schemes'), (200, [created]))
        status, renamed = self.call('PUT', '/api/schemes/personal-1', {**created, 'name': '已改名'})
        self.assertEqual((status, renamed['name'], renamed['created'], renamed['voiceSalt']), (200, '已改名', created['created'], 7))
        self.assertEqual(self.call('DELETE', '/api/schemes/personal-1'), (200, {'ok': True}))
        self.assertEqual(self.call('GET', '/api/schemes'), (200, []))
        with sqlite3.connect(str(self.db)) as conn:
            self.assertEqual(conn.execute('PRAGMA integrity_check').fetchone()[0], 'ok')

    def test_validation_matches_the_server_edition(self):
        server = self.start()
        bad = self.design(server)
        bad['colors'] = {p: 'red' for p in bad['colors']}
        self.assertEqual(self.call('PUT', '/api/schemes/bad', {'name': '坏', 'design': bad}), (422, {'error': '颜色格式不对', 'code': 'validation.18', 'params': {}}))
        self.assertEqual(self.call('PUT', '/api/schemes/bad', {'name': '坏', 'design': 'nope'})[1]['code'], 'validation.1')
        self.assertEqual(self.call('PUT', '/api/schemes/x', {'name': '', 'design': self.design(server)})[1]['code'], 'validation.4')
        self.assertEqual(self.call('PUT', '/api/schemes/x', b'not json', 'text/plain')[0], 415)
        self.assertEqual(self.call('PUT', '/api/schemes/x', b'{oops')[1]['code'], 'request.json')
        self.assertEqual(self.call('PUT', '/api/schemes/a%20b', {'name': 'x', 'design': self.design(server)})[0], 404)
        for i in range(30):
            self.assertEqual(self.call('PUT', '/api/schemes/s%d' % i, {'name': 'n', 'design': self.design(server)})[0], 200)
        self.assertEqual(self.call('PUT', '/api/schemes/s30', {'name': 'n', 'design': self.design(server)})[1]['code'], 'validation.11')

    def test_accounts_and_gallery_do_not_exist(self):
        self.start()
        self.assertEqual(self.call('GET', '/api/site'), (200, {'publicUrl': '', 'edition': 'personal', 'assembly': app.assembly_ready()}))
        for method, path in [('POST', '/api/auth/register'), ('POST', '/api/auth/login'), ('GET', '/api/me'), ('PATCH', '/api/me'),
                             ('GET', '/api/works'), ('POST', '/api/works'), ('GET', '/api/works/w-1'), ('PUT', '/api/works/w-1/rating')]:
            with self.subTest(path=path, method=method):
                status, body = self.call(method, path, {} if method != 'GET' else None)
                self.assertEqual((status, body['code']), (404, 'request.not_found'))
        opener = build_opener(NoRedirect)
        for path in ['/gallery', '/gallery/', '/gallery/index.html']:
            with opener.open(self.base + path) as response:
                self.assertEqual((response.status, response.headers['Location']), (303, '/'))

    def test_static_files_and_asset_whitelist(self):
        self.start()
        with urlopen(self.base + '/') as response:
            self.assertTrue(response.headers['Content-Type'].startswith('text/html'))
        with urlopen(self.base + '/studio/studio.mjs') as response:
            self.assertEqual(response.headers['Content-Type'], 'text/javascript')  # ES modules need this on Windows too
        for path in ['/assets/source.3mf', '/assets/../run.py', '/locales/']:
            with self.subTest(path=path):
                with self.assertRaises(HTTPError) as caught:
                    urlopen(self.base + path)
                self.assertEqual(caught.exception.code, 404)

    def test_home_opens_at_root_and_the_studio_at_paint(self):
        self.start()
        pages = {'/': 'personal.html', '/?from=launcher': 'personal.html', '/paint': 'personal.html', '/index.html': 'index.html', '/home.html': 'home.html'}
        for path, name in pages.items():
            with self.subTest(path=path), urlopen(self.base + path) as response:
                self.assertEqual(response.read(), (app.FRONTEND / name).read_bytes())
        # The studio's ./shared/ and ./studio/ links only resolve from /paint, so /paint/ goes back there.
        opener = build_opener(NoRedirect)
        for method in ['GET', 'HEAD']:
            with self.subTest(method=method), opener.open(Request(self.base + '/paint/', method=method)) as response:
                self.assertEqual((response.status, response.headers['Location'], response.read()), (308, '/paint', b''))
        with self.assertRaises(HTTPError) as caught:
            urlopen(self.base + '/paint/index.html')
        self.assertEqual(caught.exception.code, 404)

    def test_personal_routes_share_one_application_shell(self):
        self.start()
        with urlopen(self.base + '/') as response:
            home = response.read()
        for path in ['/paint', '/assemble/']:
            with self.subTest(path=path), urlopen(self.base + path) as response:
                self.assertEqual(response.read(), home)

    def test_assembly_guide_serves_listed_local_assets_with_byte_ranges(self):
        assets = Path(self.tmp.name) / 'assets'
        (assets / 'assembly').mkdir(parents=True)
        (assets / 'assembly' / 'clip.mp4').write_bytes(b'0123456789')
        (assets / 'secret.mp4').write_bytes(b'not listed')
        saved = app.ASSETS, app.ASSEMBLY, app.CHUNK
        app.ASSETS, app.ASSEMBLY, app.CHUNK = assets, {'clip.mp4': {}}, 4
        self.addCleanup(lambda: setattr(app, 'ASSETS', saved[0]) or setattr(app, 'ASSEMBLY', saved[1]) or setattr(app, 'CHUNK', saved[2]))
        self.start()
        with urlopen(self.base + '/assemble/') as response:
            self.assertEqual(response.read(), (app.FRONTEND / 'personal.html').read_bytes())
        with urlopen(self.base + '/assemble/index.html') as response:
            self.assertEqual(response.read(), (app.FRONTEND / 'assemble' / 'index.html').read_bytes())
        self.assertTrue(app.assembly_ready())
        url = self.base + '/assemble/assets/clip.mp4'
        with urlopen(url) as response:
            self.assertEqual((response.status, response.headers['Content-Type'], response.headers['Accept-Ranges'], response.read()), (200, 'video/mp4', 'bytes', b'0123456789'))
        for header, body, content_range in [('bytes=2-5', b'2345', 'bytes 2-5/10'), ('bytes=-3', b'789', 'bytes 7-9/10'),
                                            ('bytes=0-', b'0123', 'bytes 0-3/10'), ('bytes=8-20', b'89', 'bytes 8-9/10')]:
            with self.subTest(range=header), urlopen(Request(url, headers={'Range': header})) as response:
                self.assertEqual((response.status, response.headers['Content-Range'], response.read()), (206, content_range, body))
        with self.assertRaises(HTTPError) as caught:
            urlopen(Request(url, headers={'Range': 'bytes=10-'}))
        self.assertEqual((caught.exception.code, caught.exception.headers['Content-Range']), (416, 'bytes */10'))
        with urlopen(Request(url, method='HEAD')) as response:
            self.assertEqual((response.status, response.headers['Content-Length'], response.read()), (200, '10', b''))
        for path in ['/assemble/assets/secret.mp4', '/assemble/assets/../secret.mp4', '/assemble/assets/%2e%2e/secret.mp4', '/assemble/assets/']:
            with self.subTest(path=path), self.assertRaises(HTTPError) as caught:
                urlopen(self.base + path)
            self.assertEqual(caught.exception.code, 404)
        (assets / 'assembly' / 'clip.mp4').unlink()
        self.assertEqual(self.call('GET', '/api/site')[1]['assembly'], False)

    def test_a_burst_of_module_requests_is_not_reset(self):
        # Opening the studio loads ~40 modules in parallel; none may be dropped.
        from concurrent.futures import ThreadPoolExecutor
        self.start()
        files = ['/studio/studio.mjs', '/shared/i18n.mjs', '/lib/quick-style.mjs', '/vendor/three.module.js', '/locales/catalogs.mjs', '/api/site']
        def fetch(i):
            with urlopen(self.base + files[i % len(files)]) as response:
                return response.status, len(response.read())
        with ThreadPoolExecutor(max_workers=60) as pool:
            results = list(pool.map(fetch, range(60)))
        self.assertTrue(all(status == 200 and size > 0 for status, size in results))

    def test_earlier_personal_schemes_are_carried_over_once(self):
        legacy = Path(self.tmp.name) / 'old.db'
        with sqlite3.connect(str(legacy)) as old:
            old.execute('CREATE TABLE schemes(id TEXT PRIMARY KEY, user_id TEXT, name TEXT, design TEXT, provenance TEXT, voice_salt INTEGER, created INTEGER, updated INTEGER)')
            old.execute("INSERT INTO schemes VALUES('mine','personal-owner','旧方案','{\"colors\":{},\"assignments\":{}}',NULL,3,1,2)")
            old.execute("INSERT INTO schemes VALUES('other','u-someone','别人的','{}',NULL,0,1,2)")
        server = self.start(legacy=legacy)
        self.assertEqual(server.store.imported, 1)
        self.assertEqual([s['name'] for s in self.call('GET', '/api/schemes')[1]], ['旧方案'])

    def test_busy_port_moves_to_the_next_one(self):
        first = app.create_server('127.0.0.1', 0, db=self.db)
        self.servers.append(first)
        taken = first.server_address[1]
        second = app.create_server('127.0.0.1', taken, db=Path(self.tmp.name) / 'second.db')
        self.servers.append(second)
        self.assertNotEqual(second.server_address[1], taken)


if __name__ == '__main__':
    unittest.main()
