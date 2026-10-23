"""Real nginx config contract. Set DUCK_NGINX_BIN, or install nginx on PATH."""
import gzip
import http.client
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
from contextlib import contextmanager

ROOT = Path(__file__).resolve().parents[1]
NGINX = os.environ.get('DUCK_NGINX_BIN') or shutil.which('nginx')


@contextmanager
def serve(base, assets, site=None):
    """frontend/nginx.conf on a free loopback port; yields get(accept, path, extra) -> (status, headers, body)."""
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    conf = (ROOT / 'frontend/nginx.conf').read_text()
    conf = conf.replace('listen 80;', f'listen 127.0.0.1:{port};')
    conf = conf.replace('http://backend:8876', 'http://127.0.0.1:1')
    conf = conf.replace('alias /assets/;', f'alias {assets}/;').replace('root /;', f'root {base};')
    if site:
        conf = conf.replace('root /usr/share/nginx/html;', f'root {site};')
    config = base / 'nginx.conf'
    config.write_text(f'daemon off; master_process off; pid {base}/nginx.pid; error_log {base}/error.log;\nevents {{}}\nhttp {{ access_log off; {conf} }}')
    process = subprocess.Popen([NGINX, '-p', str(base) + '/', '-c', str(config)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    try:
        for _ in range(100):
            try:
                with socket.create_connection(('127.0.0.1', port), timeout=.05):
                    break
            except OSError:
                if process.poll() is not None:
                    raise AssertionError(process.communicate()[1].decode())
                time.sleep(.02)

        def get(encoding=None, path='/assets/geometry.positions.bin', extra=None):
            conn = http.client.HTTPConnection('127.0.0.1', port)
            headers = dict(extra or {})
            if encoding is not None:
                headers['Accept-Encoding'] = encoding
            try:
                conn.request('GET', path, headers=headers)
                r = conn.getresponse()
                return r.status, dict(r.getheaders()), r.read()
            finally:
                conn.close()
        yield get
    finally:
        process.terminate()
        process.communicate(timeout=5)


@unittest.skipUnless(NGINX, 'native nginx is not installed; no Docker required')
class NginxAssets(unittest.TestCase):
    def test_negotiation_sidecars_fallback_and_license_boundary(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            assets = base / 'assets'
            assets.mkdir()
            raw = b'hello world'
            # A small known Brotli stream for b'hello world'. Payload passthrough
            # is tested byte-for-byte; real model decompression is checked separately.
            br = bytes.fromhex('0b058068656c6c6f20776f726c6403')
            pack = assets / 'geometry.positions.bin'
            pack.write_bytes(raw)
            pack.with_suffix('.bin.br').write_bytes(br)
            gz = gzip.compress(raw, mtime=0)
            pack.with_suffix('.bin.gz').write_bytes(gz)
            for name in ['source.3mf', 'source.3mf.br', 'source.3mf.gz']:
                (assets / name).write_bytes(b'private')
            with serve(base, assets) as get:
                for accept, want, payload in [('br, gzip', 'br', br), ('gzip', 'gzip', gz), ('BR;q=0.5, gzip', 'br', br), ('br;q=0, gzip', 'gzip', gz), ('br;q=0.000, gzip;q=0', None, raw), ('xbr', None, raw), ('identity', None, raw), (None, None, raw)]:
                    with self.subTest(accept=accept):
                        code, headers, body = get(accept)
                        self.assertEqual(code, 200)
                        self.assertEqual(headers.get('Content-Encoding'), want)
                        self.assertEqual(body, payload)
                        self.assertIn('Accept-Encoding', headers.get('Vary', ''))
                        self.assertEqual(headers['Content-Type'], 'application/octet-stream')
                _, headers, _ = get('br')
                self.assertEqual(get('br', extra={'If-None-Match': headers['ETag']})[0], 304)
                pack.with_suffix('.bin.br').unlink()
                self.assertEqual(get('br, gzip')[2], gz)
                pack.with_suffix('.bin.gz').unlink()
                self.assertEqual(get('br, gzip')[2], raw)
                self.assertNotIn('Content-Encoding', get('br, gzip')[1])
                for name in ['source.3mf', 'source.3mf.br', 'source.3mf.gz']:
                    self.assertEqual(get('br, gzip', '/assets/'+name)[0], 404)
                pack.unlink()
                self.assertEqual(get('br, gzip')[0], 404)

    def test_release_build_code_is_negotiated_and_cached_for_a_year(self):
        with tempfile.TemporaryDirectory() as folder:
            base = Path(folder)
            (base / 'assets').mkdir()
            build = base / 'site/build'
            build.mkdir(parents=True)
            files = {}
            for name, raw in [('studio-ABC.js', b'export const a=1;'), ('studio-page-ABC.css', b'body{color:red}')]:
                (build / name).write_bytes(raw)
                files[name] = {None: raw, 'br': raw[::-1], 'gzip': gzip.compress(raw, mtime=0)}
                (build / (name + '.br')).write_bytes(files[name]['br'])  # bytes passed through unchanged
                (build / (name + '.gz')).write_bytes(files[name]['gzip'])
            with serve(base, base / 'assets', site=base / 'site') as get:
                for name, kind in [('studio-ABC.js', 'text/javascript'), ('studio-page-ABC.css', 'text/css')]:
                    for accept, want in [('gzip, deflate, br, zstd', 'br'), ('gzip', 'gzip'), ('br;q=0, gzip', 'gzip'), ('identity', None), (None, None)]:
                        with self.subTest(name=name, accept=accept):
                            code, headers, body = get(accept, '/build/' + name)
                            self.assertEqual(code, 200)
                            self.assertEqual(headers.get('Content-Encoding'), want)
                            self.assertEqual(body, files[name][want])
                            self.assertEqual(headers['Content-Type'], kind)
                            self.assertEqual(headers['Cache-Control'], 'public, max-age=31536000, immutable')
                            self.assertIn('Accept-Encoding', headers.get('Vary', ''))
                            self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
                _, headers, _ = get('br', '/build/studio-ABC.js')
                self.assertEqual(get('br', '/build/studio-ABC.js', {'If-None-Match': headers['ETag']})[0], 304)
                (build / 'studio-ABC.js.br').unlink()
                self.assertEqual(get('br, gzip', '/build/studio-ABC.js')[1].get('Content-Encoding'), 'gzip')
                for path in ['/build/missing.js', '/build/', '/build/notes.txt']:
                    self.assertEqual(get('br', path)[0], 404, path)


if __name__ == '__main__':
    unittest.main()
