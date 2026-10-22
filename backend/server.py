"""DoodleDuck API server. Python standard library only.

Production: serves /api only; nginx serves the static frontend and proxies /api here.
Development (`python3 run.py`): also serves ../frontend and the local /assets pack from one process.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from functools import partial
from urllib.parse import urlparse, parse_qs
import argparse, json, os, re, sys, traceback, webbrowser

from store import Store, Invalid

ROOT = Path(__file__).resolve().parent
ASSETS = Path(os.environ.get('DUCK_ASSETS', ROOT.parent / 'assets'))
VERSION = '3.0.0'
MAX_BODY = 8_000_000  # 3MF export carries 13 rendered plate thumbnails

try:  # The licensed asset pack powers export and strict design validation; the API still runs without it.
    import exporter
    MODEL, CATALOG = exporter.MODEL, exporter.CATALOG
except Exception as exc:  # noqa: BLE001 - report and continue without export
    exporter = None
    MODEL = CATALOG = None
    print('Asset pack not loaded (%s): export is disabled until DUCK_ASSETS points at it.' % exc, file=sys.stderr)

STORE = Store(part_ids=[p['id'] for p in MODEL['parts']] if MODEL else None)
ROUTES = []


def route(method, pattern, auth=False):
    def wrap(fn):
        ROUTES.append((method, re.compile('^' + pattern + '$'), auth, fn))
        return fn
    return wrap


@route('GET', '/api/health')
def health(h, user, body):
    return {'version': VERSION, 'export': bool(exporter), 'source_sha256': MODEL['source_sha256'] if MODEL else None}

@route('GET', '/api/catalog')
def catalog(h, user, body):
    if not CATALOG:
        raise Invalid('耗材色表未加载')
    return CATALOG

@route('GET', '/api/site')
def site(h, user, body):
    # Explicit deployment configuration, never request Host/forwarded headers.
    return {'publicUrl': os.environ.get('DUCK_PUBLIC_URL', '')}

# ---- accounts: nickname + simple password, bearer token sessions ----
@route('POST', '/api/auth/register')
def register(h, user, body):
    return STORE.register(body.get('name'), body.get('password'))

@route('POST', '/api/auth/login')
def login(h, user, body):
    return STORE.login(body.get('name'), body.get('password'))

@route('POST', '/api/auth/logout', auth=True)
def logout(h, user, body):
    STORE.logout(h.token())
    return {'ok': True}

@route('GET', '/api/me', auth=True)
def me(h, user, body):
    return user

@route('PATCH', '/api/me', auth=True)
def update_me(h, user, body):
    return STORE.update_user(user['id'], body)

# ---- private schemes ----
@route('GET', '/api/schemes', auth=True)
def list_schemes(h, user, body):
    return STORE.schemes(user['id'])

@route('PUT', '/api/schemes/(?P<sid>[\\w-]{1,64})', auth=True)
def put_scheme(h, user, body, sid):
    return STORE.save_scheme(user['id'], sid, body)

@route('DELETE', '/api/schemes/(?P<sid>[\\w-]{1,64})', auth=True)
def delete_scheme(h, user, body, sid):
    STORE.delete_scheme(user['id'], sid)
    return {'ok': True}

# ---- published works ----
@route('GET', '/api/works')
def list_works(h, user, body):
    author = parse_qs(urlparse(h.path).query).get('author', [None])[0]
    return STORE.works(user and user['id'], author)

@route('GET', '/api/works/(?P<wid>[\\w-]{1,64})')
def get_work(h, user, body, wid):
    return STORE.work(wid, user and user['id'])

@route('POST', '/api/works', auth=True)
def publish(h, user, body):
    return STORE.publish(user['id'], body)

@route('DELETE', '/api/works/(?P<wid>[\\w-]{1,64})', auth=True)
def delete_work(h, user, body, wid):
    STORE.delete_work(user['id'], wid)
    return {'ok': True}

@route('PUT', '/api/works/(?P<wid>[\\w-]{1,64})/rating', auth=True)
def rate(h, user, body, wid):
    return STORE.rate(user['id'], wid, body.get('stars'))

# ---- 3MF export (needs the asset pack) ----
@route('POST', '/api/plan')
def plan(h, user, body):
    if not exporter:
        raise Invalid('服务器没有加载模型资产，暂时不能导出')
    return exporter.plan(body)

@route('POST', '/api/export')
def export(h, user, body):
    if not exporter:
        raise Invalid('服务器没有加载模型资产，暂时不能导出')
    content, _ = exporter.export_3mf(body)
    return ('model/3mf', content, 'XGO-Duck-materials.3mf')


class Handler(SimpleHTTPRequestHandler):
    static = False

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def log_message(self, fmt, *args):
        if os.environ.get('DUCK_QUIET') != '1':
            super().log_message(fmt, *args)

    def token(self):
        value = self.headers.get('Authorization', '')
        return value[7:].strip() if value.startswith('Bearer ') else None

    def reply(self, status, data, content_type='application/json; charset=utf-8', filename=None):
        if not isinstance(data, bytes):
            data = json.dumps(data, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        if filename:
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
        self.end_headers()
        self.wfile.write(data)

    def api(self, method):
        path = urlparse(self.path).path
        for m, pattern, auth, fn in ROUTES:
            match = pattern.match(path)
            if m != method or not match:
                continue
            user = STORE.user_for(self.token())
            if auth and not user:
                return self.reply(401, {'error': '请先登录'})
            body = {}
            if method in ('POST', 'PUT', 'PATCH'):
                if self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    return self.reply(415, {'error': '需要 JSON 请求'})
                length = int(self.headers.get('Content-Length', '0') or 0)
                if not 0 <= length <= MAX_BODY:
                    return self.reply(413, {'error': '请求太大'})
                try:
                    body = json.loads(self.rfile.read(length) or b'{}')
                except ValueError:
                    return self.reply(400, {'error': '请求不是有效的 JSON'})
                if not isinstance(body, dict):
                    return self.reply(400, {'error': '请求格式不对'})
            try:
                result = fn(self, user, body, **match.groupdict())
            except (Invalid, ValueError) as exc:
                return self.reply(422, {'error': str(exc)})
            except Exception:  # noqa: BLE001
                traceback.print_exc()
                return self.reply(500, {'error': '服务器出错了，请查看服务日志'})
            if isinstance(result, tuple):
                return self.reply(200, result[1], result[0], result[2])
            return self.reply(200, result)
        return self.reply(404, {'error': '未知接口'})

    def do_GET(self):
        if self.path.startswith('/api/'):
            return self.api('GET')
        if not self.static:
            return self.reply(404, {'error': '静态文件由前端服务提供'})
        if self.path.startswith('/assets/'):
            name = urlparse(self.path).path[len('/assets/'):]
            target = (ASSETS / name).resolve()
            if ASSETS.resolve() not in target.parents or not target.is_file():
                return self.reply(404, {'error': '资产不存在'})
            data = target.read_bytes()
            kind = 'application/json' if name.endswith('.json') else 'application/octet-stream'
            return self.reply(200, data, kind)
        super().do_GET()

    def do_POST(self):
        self.api('POST')

    def do_PUT(self):
        self.api('PUT')

    def do_PATCH(self):
        self.api('PATCH')

    def do_DELETE(self):
        self.api('DELETE')


def main():
    parser = argparse.ArgumentParser(description='DoodleDuck API server')
    parser.add_argument('--host', default=os.environ.get('HOST', '127.0.0.1'))
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', 8876)))
    parser.add_argument('--static', help='also serve this frontend directory (development)')
    parser.add_argument('--open', action='store_true', help='open the browser (development)')
    args = parser.parse_args()
    handler = type('DevHandler', (Handler,), {'static': bool(args.static)})
    server = ThreadingHTTPServer((args.host, args.port), partial(handler, directory=args.static or str(ROOT)))
    url = f'http://{"127.0.0.1" if args.host in ("0.0.0.0", "") else args.host}:{args.port}/'
    print(('涂鸭 DoodleDuck：' if args.static else '涂鸭 API：') + url, flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
