"""来做鸭 letsduck personal edition: one local process serves the studio, the asset pack and a small API.

Python standard library only (3.9+), so it starts without installing anything. No accounts and no
配色广场: named schemes are saved to a local SQLite file. The full server edition is ../backend (Docker).
The JSON API matches the server edition's /api/site, /api/schemes, /api/plan and /api/export.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
import argparse
import errno
import ipaddress
import json
import logging
import os
import re
import sys
import threading
import webbrowser

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
for folder in (ROOT, REPO / 'backend'):  # rules.py, errors.py and exporter.py are shared, stdlib-only
    if str(folder) not in sys.path:
        sys.path.insert(0, str(folder))
ASSETS = Path(os.environ.setdefault('DUCK_ASSETS', str(REPO / 'assets')))
FRONTEND = REPO / 'frontend'

from errors import payload  # noqa: E402
from rules import Invalid  # noqa: E402
from schemes import PersonalStore  # noqa: E402
from servo_setup import ServoSetup  # noqa: E402

from export_transport import parse_multipart, ExportBodyError

VERSION = '3.1.0'
MAX_BODY = 8_000_000
ID = re.compile(r'^[\w-]{1,64}$')
PUBLIC_ASSETS = {'model.json', 'catalog.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', 'export-schema.json'}
NOT_FOUND = {'error': '未知接口', 'code': 'request.not_found', 'params': {}}
# The home page opens at /, the studio (frontend/index.html) at /paint. No trailing slash keeps the studio's ./ links at the root.
PAGES = {'/': '/home.html', '/paint': '/index.html'}
# The assembly guide's models, videos and music: local-only, imported by scripts/import_assembly_assets.py.
ASSEMBLY = json.loads((REPO / 'scripts' / 'assembly-assets.json').read_text())['files']
CHUNK = 4 << 20  # an open-ended Range gets at most this much; players ask for the rest as they need it
log = logging.getLogger('doodleduck')

try:
    import exporter  # noqa: E402
except (OSError, ValueError, AssertionError):
    exporter = None


class Reply(Exception):
    def __init__(self, status, body):
        super().__init__(body.get('code'))
        self.status, self.body = status, body


class Download(bytes):
    """A 3MF file to send as an attachment instead of JSON."""


class Handler(SimpleHTTPRequestHandler):
    server_version = 'letsduck'
    protocol_version = 'HTTP/1.1'  # keep-alive: every response below carries Content-Length
    # Explicit types: on Windows the registry can map .js/.mjs to text/plain, which breaks ES modules.
    extensions_map = {'': 'application/octet-stream', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
                      '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
                      '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.bin': 'application/octet-stream',
                      '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg'}
    store = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND), **kwargs)

    def end_headers(self):
        # Pages, code and models are checked on every visit, so an update is never served stale, yet an unchanged
        # file comes from the browser's cache and pages can return through the back/forward cache. API answers are never kept.
        self.send_header('Cache-Control', 'no-store' if self.path.startswith('/api/') else 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, fmt, *args):
        if os.environ.get('DUCK_VERBOSE') == '1':
            super().log_message(fmt, *args)

    def send_body(self, status, data, content_type='application/json; charset=utf-8', headers=()):
        if not isinstance(data, bytes):
            data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        for key, value in headers:
            self.send_header(key, value)
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def read_json(self):
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            raise Reply(415, {'error': '需要 JSON 请求', 'code': 'request.content_type', 'params': {}})
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            raise Reply(400, {'error': '请求格式不对', 'code': 'request.format', 'params': {}})
        if not 0 <= length <= MAX_BODY:
            raise Reply(413, {'error': '请求太大', 'code': 'request.too_large', 'params': {}})
        try:
            body = json.loads(self.rfile.read(length) or b'{}')
        except (ValueError, UnicodeError):
            raise Reply(400, {'error': '请求不是有效的 JSON', 'code': 'request.json', 'params': {}})
        if not isinstance(body, dict):
            raise Reply(400, {'error': '请求格式不对', 'code': 'request.format', 'params': {}})
        return body

    def read_export(self):
        kind = self.headers.get('Content-Type', '')
        if kind.split(';')[0].strip().lower() != 'multipart/form-data':
            return self.read_json()
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            raise Reply(400, {'error': '请求格式不对', 'code': 'request.format', 'params': {}})
        if not 0 <= length <= MAX_BODY:
            raise Reply(413, {'error': '请求太大', 'code': 'request.too_large', 'params': {}})
        try:
            return parse_multipart(self.rfile.read(length), kind)
        except ExportBodyError as error:
            raise Reply(error.status, error.body)

    # ---- API ----
    def api(self, method, path):
        scheme = re.fullmatch(r'/api/schemes/([^/]+)', path)
        if scheme and not ID.fullmatch(scheme.group(1)):
            raise Reply(404, NOT_FOUND)
        if method == 'GET' and path == '/api/health':
            return {'version': VERSION, 'export': bool(exporter), 'source_sha256': exporter.MODEL['source_sha256'] if exporter else None}
        if method == 'GET' and path == '/api/site':
            return {'publicUrl': '', 'edition': 'personal', 'assembly': assembly_ready(),
                    'servoSetup': ipaddress.ip_address(self.client_address[0]).is_loopback}
        if path == '/api/servo-setup' or path.startswith('/api/servo-setup/'):
            if not ipaddress.ip_address(self.client_address[0]).is_loopback:
                raise Reply(403, {'error': '请在连接 UNO Q 的这台电脑上打开组装台。'})
            if method == 'GET' and path == '/api/servo-setup':
                return self.server.servo.inspect()
            if method == 'GET' and path == '/api/servo-setup/records':
                return {'records': self.store.servo_records()}
            actions = {'/api/servo-setup/start': self.server.servo.start,
                       '/api/servo-setup/pause': self.server.servo.pause,
                       '/api/servo-setup/halt': self.server.servo.halt}
            if method == 'POST' and path in actions:
                origin = self.headers.get('Origin')
                if origin and origin != 'http://' + self.headers.get('Host', ''):
                    raise Reply(403, {'error': '请从本机组装台执行此操作。'})
                self.read_json()
                return actions[path]()
            raise Reply(404, NOT_FOUND)
        if method == 'GET' and path == '/api/catalog':
            return self.need_exporter('耗材色表未加载', 'validation.29').CATALOG
        if method == 'GET' and path == '/api/schemes':
            return self.store.schemes()
        if method == 'PUT' and scheme:
            return self.store.save_scheme(scheme.group(1), self.read_json())
        if method == 'DELETE' and scheme:
            self.store.delete_scheme(scheme.group(1))
            return {'ok': True}
        if method == 'POST' and path == '/api/plan':
            return self.need_exporter().plan(self.read_json())
        if method == 'POST' and path == '/api/export':
            content, _ = self.need_exporter().export_3mf(self.read_export())
            return Download(content)
        # Accounts, works and ratings exist only in the server edition.
        raise Reply(404, NOT_FOUND)

    @staticmethod
    def need_exporter(message='没有加载模型资产，暂时不能导出', code='validation.31'):
        if not exporter:
            raise Invalid(message, code=code)
        return exporter

    def handle_api(self, method):
        try:
            result = self.api(method, urlparse(self.path).path.rstrip('/'))
        except Reply as reply:
            return self.send_body(reply.status, reply.body)
        except (Invalid, ValueError) as error:
            return self.send_body(422, payload(error))
        except Exception:  # noqa: BLE001 - report without leaking internals
            log.exception('Unhandled API failure')
            return self.send_body(500, {'error': '出错了，请查看启动窗口里的日志', 'code': 'server.failed', 'params': {}})
        if isinstance(result, Download):
            return self.send_body(200, bytes(result), 'model/3mf', [('Content-Disposition', 'attachment; filename="XGO-Duck-materials.3mf"')])
        self.send_body(200, result)

    # ---- static files ----
    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith('/api/'):
            return self.handle_api('GET')
        if path.rstrip('/') == '/gallery' or path.startswith('/gallery/'):
            return self.redirect(303, '/')
        if path == '/paint/':
            return self.redirect(308, '/paint')
        if path.startswith('/assets/'):
            name = path[len('/assets/'):]
            target = ASSETS / name
            if name not in PUBLIC_ASSETS or not target.is_file():
                return self.send_body(404, {'error': '资产不存在', 'code': 'request.asset_missing', 'params': {}})
            return self.send_file(target)
        if path.startswith('/assemble/assets/'):
            name = path[len('/assemble/assets/'):]
            if name not in ASSEMBLY or not (ASSETS / 'assembly' / name).is_file():
                return self.send_body(404, {'error': '资产不存在', 'code': 'request.asset_missing', 'params': {}})
            return self.send_range(ASSETS / 'assembly' / name)
        super().do_GET()

    def send_file(self, target, headers=()):
        """A model or media file, or 304 Not Modified when the browser already holds this version."""
        stamp = self.date_time_string(int(target.stat().st_mtime))
        if self.headers.get('If-Modified-Since') == stamp:
            self.send_response(304)
            self.send_header('Last-Modified', stamp)
            return self.end_headers()
        kind = self.extensions_map.get(target.suffix, 'application/octet-stream')
        return self.send_body(200, target.read_bytes(), kind, [('Last-Modified', stamp), *headers])

    def send_range(self, target):
        """A local file whole, or one byte range of it so videos can seek (Safari will not play them otherwise)."""
        size, kind = target.stat().st_size, self.extensions_map.get(target.suffix, 'application/octet-stream')
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', self.headers.get('Range', '').strip())
        if not match or not (match[1] or match[2]):
            return self.send_file(target, [('Accept-Ranges', 'bytes')])
        if match[1]:
            start = int(match[1])
            end = min(int(match[2]), size - 1) if match[2] else min(start + CHUNK, size) - 1
        else:  # bytes=-N: the last N bytes
            start, end = max(size - int(match[2]), 0), size - 1
        if start >= size or start > end:
            return self.send_body(416, b'', kind, [('Content-Range', 'bytes */%d' % size)])
        with target.open('rb') as file:
            file.seek(start)
            data = file.read(end - start + 1)
        return self.send_body(206, data, kind, [('Accept-Ranges', 'bytes'), ('Content-Range', 'bytes %d-%d/%d' % (start, end, size))])

    def redirect(self, status, location):
        self.send_response(status)
        self.send_header('Location', location)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def translate_path(self, path):
        return super().translate_path(PAGES.get(urlparse(path).path, path))

    def list_directory(self, path):
        self.send_body(404, {'error': '文件不存在', 'code': 'request.not_found', 'params': {}})

    def do_HEAD(self):
        path = urlparse(self.path).path
        if path.startswith(('/api/', '/assets/', '/gallery', '/assemble/assets/')) or path == '/paint/':
            return self.do_GET()
        super().do_HEAD()

    def do_POST(self):
        self.handle_api('POST')

    def do_PUT(self):
        self.handle_api('PUT')

    def do_DELETE(self):
        self.handle_api('DELETE')

    def do_PATCH(self):
        self.handle_api('PATCH')


def assembly_ready():
    return (FRONTEND / 'assemble' / 'index.html').is_file() and all((ASSETS / 'assembly' / name).is_file() for name in ASSEMBLY)


class Server(ThreadingHTTPServer):
    daemon_threads = True
    # A page load requests ~40 ES modules at once; the default backlog of 5 makes the OS reset the rest.
    request_queue_size = 128
    # On Windows SO_REUSEADDR would let a second copy bind a port that is already in use.
    allow_reuse_address = os.name != 'nt'

    def server_close(self):
        if getattr(self, 'servo', None):
            self.servo.close()
        super().server_close()

    def handle_error(self, request, client_address):
        if not isinstance(sys.exc_info()[1], ConnectionError):  # browsers routinely drop downloads they no longer need
            super().handle_error(request, client_address)


def create_server(host='127.0.0.1', port=8876, db=None, legacy=None, search=20, servo_runtime=None):
    """Binds the first free port from `port` (up to `search` tries); port 0 picks any free port."""
    store = PersonalStore(db, part_ids=[p['id'] for p in exporter.MODEL['parts']] if exporter else (), legacy=legacy)
    handler = type('PersonalHandler', (Handler,), {'store': store})
    candidates = [0] if port == 0 else list(range(port, port + max(1, search)))
    for candidate in candidates:
        try:
            server = Server((host, candidate), handler)
        except OSError as error:
            if candidate != candidates[-1] and (error.errno == errno.EADDRINUSE or getattr(error, 'winerror', None) == 10048):
                continue  # already taken (perhaps by another copy): try the next port
            store.close()
            raise
        server.store = store
        server.servo = ServoSetup(store, servo_runtime)
        return server


def main(argv=None):
    parser = argparse.ArgumentParser(description='来做鸭 letsduck personal edition')
    parser.add_argument('--host', default=os.environ.get('HOST', '127.0.0.1'))
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '8876')))
    parser.add_argument('--no-open', action='store_true', help='do not open the browser')
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format='%(message)s')
    legacy = Path(os.environ.get('DUCK_DB') or REPO / 'backend' / 'data' / 'doodleduck.db')
    server = create_server(args.host, args.port, legacy=legacy)
    host = '127.0.0.1' if args.host in ('0.0.0.0', '') else args.host
    url = 'http://%s:%d/' % (host, server.server_address[1])
    print('来做鸭 letsduck 个人版已启动：' + url, flush=True)
    print('方案保存在：' + str(server.store.path), flush=True)
    if server.store.imported:
        print('已从旧版本带入 %d 套方案。' % server.store.imported, flush=True)
    if not exporter:
        print('提示：没有加载模型资产包，3MF 导出暂不可用。', flush=True)
    print('关闭这个窗口（或按 Ctrl+C）即可退出。', flush=True)
    if not args.no_open:
        threading.Timer(0.3, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        server.store.close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
