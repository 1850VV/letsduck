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

ROOT = Path(__file__).resolve().parents[1]
NGINX = os.environ.get('DUCK_NGINX_BIN') or shutil.which('nginx')


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
            with socket.socket() as sock:
                sock.bind(('127.0.0.1', 0))
                port = sock.getsockname()[1]
            conf = (ROOT / 'frontend/nginx.conf').read_text()
            conf = conf.replace('listen 80;', f'listen 127.0.0.1:{port};')
            conf = conf.replace('http://backend:8876', 'http://127.0.0.1:1')
            conf = conf.replace('alias /assets/;', f'alias {assets}/;').replace('root /;', f'root {base};')
            config = base / 'nginx.conf'
            config.write_text(f'daemon off; master_process off; pid {base}/nginx.pid; error_log {base}/error.log;\nevents {{}}\nhttp {{ access_log off; {conf} }}')
            process = subprocess.Popen([NGINX, '-p', folder+'/', '-c', str(config)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            try:
                for _ in range(100):
                    try:
                        with socket.create_connection(('127.0.0.1', port), timeout=.05):
                            break
                    except OSError:
                        if process.poll() is not None:
                            self.fail(process.communicate()[1].decode())
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
            finally:
                process.terminate()
                process.communicate(timeout=5)


if __name__ == '__main__':
    unittest.main()
