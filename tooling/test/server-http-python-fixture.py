"""Read the frozen server's actual ASGI contract using only disposable fixtures.

Run with the repository's development Python. Stdout is one replayable JSON oracle.
No TCP listener, real account, user database, licensed asset or device is accessed.
"""
from base64 import b64encode
from email import policy
from email.parser import BytesParser
import importlib.metadata
import json
import os
from pathlib import Path
import re
import sys
import tempfile

REPO = Path(__file__).resolve().parents[2]
STAMP = 1_700_000_000
HEADERS = ('content-type', 'content-length', 'last-modified', 'etag', 'accept-ranges',
           'content-range', 'location', 'allow', 'cache-control',
           'x-content-type-options', 'retry-after')


def encoded(value):
    return b64encode(value).decode('ascii')


def fixtures(custom_404=False):
    rows = [
        ('frontend', 'index.html', b'STUDIO'),
        ('frontend', 'home.html', b'HOME'),
        ('frontend', 'gallery/index.html', b'GALLERY'),
        ('frontend', 'folder/index.html', b'FOLDER'),
        ('frontend', 'empty/.keep', b''),
        ('frontend', 'file.txt', b'0123456789'),
        ('frontend', 'module.mjs', b'export{}'),
        ('frontend', '%zz.txt', b'PERCENT'),
        ('frontend', '鸭子.txt', '机器鸭'.encode()),
        ('assets', 'model.json', b'{"source_sha256":"synthetic","parts":[]}'),
        ('assets', 'catalog.json', b'{"products":[]}'),
        ('assets', 'export-schema.json', b'{"filamentChunks":{}}'),
        ('assets', 'geometry.bin', b'0123456789'),
        ('assets', 'source.3mf', b'PRIVATE-SYNTHETIC-NOT-A-ZIP'),
        ('assets', 'secret.txt', b'PRIVATE-ASSET'),
        ('outside', 'outside.txt', b'PRIVATE-OUTSIDE'),
    ]
    if custom_404:
        rows.append(('frontend', '404.html', b'CUSTOM-404'))
    return [{'root': kind, 'path': name, 'contentBase64': encoded(data), 'mtime': STAMP}
            for kind, name, data in rows]


class CaptureScope:
    def __init__(self, app):
        self.app = app
        self.current = None

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            self.current = {'path': scope['path'],
                            'rawPath': scope.get('raw_path', b'').decode('ascii', 'backslashreplace'),
                            'query': scope.get('query_string', b'').decode('ascii', 'backslashreplace'),
                            'headers': [[k.decode('latin1'), v.decode('latin1')]
                                        for k, v in scope['headers']]}
        await self.app(scope, receive, send)


def multipart_parts(response):
    media = response.headers.get('content-type', '')
    content_range = response.headers.get('content-range', '')
    match = re.search(r'boundary=([^;\s]+)', media + ' ' + content_range)
    if not match:
        return None
    boundary = match[1].strip('"')
    message = BytesParser(policy=policy.default).parsebytes(
        ('Content-Type: multipart/byteranges; boundary=' + boundary + '\r\n\r\n').encode()
        + response.content)
    if not message.is_multipart():
        return None
    return {'boundary': boundary,
            'parts': [{'headers': {k.lower(): v for k, v in part.items()},
                       'contentBase64': encoded(part.get_payload(decode=True))}
                      for part in message.iter_parts()]}


def collect(server, root, scenario, custom_404=False, fake_export=False, with_static=True):
    from fastapi.testclient import TestClient
    from export_jobs import ExportBusy
    from store import Invalid

    base = root / scenario
    assets, frontend = base / 'assets', base / 'frontend'
    assets.mkdir(parents=True)
    frontend.mkdir()
    definitions = fixtures(custom_404)
    for item in definitions:
        folder = base if item['root'] == 'outside' else base / item['root']
        path = folder / item['path']
        path.parent.mkdir(parents=True, exist_ok=True)
        from base64 import b64decode
        path.write_bytes(b64decode(item['contentBase64']))
        os.utime(path, (STAMP, STAMP))
    links = []
    try:
        (frontend / 'link.txt').symlink_to('../outside.txt')
        links.append({'root': 'frontend', 'path': 'link.txt', 'target': '../outside.txt'})
    except (OSError, NotImplementedError):
        pass

    class BusyExports:
        async def run(self, payload):
            raise ExportBusy('导出任务较多，请稍后重试')

        async def close(self):
            pass

    class FakeExporter:
        """Only an explicit preflight/admission boundary; no model/export claim."""
        MODEL = {'source_sha256': 'synthetic'}
        CATALOG = {'products': []}

        def plan(self, body):
            if body.get('preflight') != 'ok':
                raise Invalid('Synthetic preflight rejected', code='export.20')
            return {'fixture': 'preflight-ok'}

    server.ASSETS = assets
    app = server.create_app(database_url='sqlite:///' + str(base / 'oracle.db'),
                            static=str(frontend) if with_static else None, exports=BusyExports() if fake_export else None)
    wrapper = CaptureScope(app)
    output = {'name': scenario, 'fixtures': definitions, 'symlinks': links,
              'fakeExporter': fake_export, 'withStatic': with_static, 'cases': []}
    with TestClient(wrapper, base_url='http://testserver', follow_redirects=False,
                    raise_server_exceptions=False) as client:
        # The module-level exporter fails SHA validation on the synthetic placeholder.
        assert app.state.exporter is None
        if fake_export:
            app.state.exporter = FakeExporter()
        stamps = {}

        def request(case_id, method, url, content=None, headers=None):
            headers = dict(headers or {})
            response = client.request(method, url, content=content, headers=headers)
            record = {'id': case_id,
                      'request': {'method': method, 'url': url, 'headers': headers,
                                  'contentBase64': encoded(content) if content is not None else None},
                      'scope': wrapper.current,
                      'response': {'status': response.status_code,
                                   'headers': {name: response.headers[name] for name in HEADERS
                                               if name in response.headers},
                                   'contentBase64': encoded(response.content)}}
            if response.headers.get('content-type', '').startswith('application/json') and response.content:
                record['response']['json'] = response.json()
            parts = multipart_parts(response)
            if parts is not None:
                record['response']['multipart'] = parts
                record['comparison'] = 'Compare multipart part headers/bytes; boundary is random.'
            output['cases'].append(record)
            return response

        if not with_static:
            paths = [('/', 'root'), ('/gallery', 'gallery'), ('/api', 'api-no-slash'),
                     ('/api/', 'api-slash'), ('/api/health', 'health'),
                     ('/api/health/', 'health-trailing'), ('/api/site', 'site'),
                     ('/api/missing', 'unknown-api'), ('/api/missing/', 'unknown-api-trailing'),
                     ('/api/plan', 'plan'), ('/api/auth/login', 'login'),
                     ('/api/schemes/x', 'scheme'), ('/api/works/w-x/rating', 'rating')]
            for path, name in paths:
                for method in ('GET', 'HEAD', 'OPTIONS', 'POST', 'TRACE'):
                    request(method.lower() + '-' + name, method, path)
            return output

        if fake_export:
            for name, body in [('invalid-preflight', b'{"preflight":"bad"}'),
                               ('valid-no-thumbnails', b'{"preflight":"ok"}')]:
                request('export-' + name, 'POST', '/api/export', body,
                        {'content-type': 'application/json'})
            request('plan-bypasses-busy', 'POST', '/api/plan', b'{"preflight":"ok"}',
                    {'content-type': 'application/json'})
            request('export-bad-json-before-preflight', 'POST', '/api/export', b'{bad',
                    {'content-type': 'application/json'})
            request('export-bad-multipart-before-preflight', 'POST', '/api/export', b'bad',
                    {'content-type': 'multipart/form-data; boundary=synthetic'})
            return output

        if custom_404:
            for name, path in [('missing', '/absent'), ('empty-directory', '/empty/'),
                               ('asset-blocked', '/assets/source.3mf')]:
                request('custom-404-' + name, 'GET', path)
            return output

        paths = [('/', 'root'), ('/home.html', 'home'), ('/gallery', 'gallery-redirect'),
                 ('/gallery?x=1', 'gallery-query-redirect'), ('/gallery/', 'gallery'),
                 ('/folder', 'folder-redirect'), ('/folder/', 'folder'),
                 ('/empty', 'empty-no-slash'), ('/empty/', 'empty'), ('/missing', 'missing'),
                 ('/paint', 'no-personal-paint-alias'), ('/file.txt', 'file'),
                 ('/module.mjs', 'module'), ('/api/health', 'health'),
                 ('/api/health/', 'health-trailing'), ('/api/health//', 'health-double-trailing'),
                 ('/api/site/', 'site-trailing'), ('/api', 'api-no-slash'), ('/api/', 'api-slash'),
                 ('/api/works/鸭子', 'unicode-id'), ('/api/works/%E9%B8%AD%E5%AD%90', 'escaped-unicode-id'),
                 ('/api/works/%zz', 'invalid-percent-id'), ('/api/works/%252F', 'single-percent-decode'),
                 ('/%zz.txt', 'invalid-percent-file'), ('/%E9%B8%AD%E5%AD%90.txt', 'escaped-unicode-file'),
                 ('/鸭子.txt', 'unicode-file'), ('/%2e%2e/outside.txt', 'encoded-parent'),
                 ('/link.txt', 'outside-symlink'), ('/assets/model.json', 'public-model'),
                 ('/assets/%67eometry.bin', 'escaped-public-name'), ('/assets/source.3mf', 'private-source'),
                 ('/assets/source.3mf.gz', 'private-sidecar'), ('/assets/secret.txt', 'private-asset'),
                 ('/assets/../outside.txt', 'plain-parent-client-normalizes'),
                 ('/assets/..%2Foutside.txt', 'escaped-asset-parent')]
        for path, name in paths:
            reply = request(name, 'GET', path)
            if path in ('/file.txt', '/assets/model.json'):
                stamps[path] = (reply.headers.get('etag'), reply.headers.get('last-modified'))
        for path, name in [('/api/health', 'health'), ('/api/health/', 'health-trailing'),
                           ('/', 'root'), ('/file.txt', 'file'), ('/gallery', 'gallery'),
                           ('/assets/model.json', 'asset'), ('/api/missing', 'missing-api')]:
            for method in ('HEAD', 'OPTIONS', 'POST', 'TRACE'):
                request(method.lower() + '-' + name, method, path)

        for name, query in [('last-valid-limit', 'limit=oops&limit=1'),
                            ('last-invalid-limit', 'limit=1&limit=oops'),
                            ('last-empty-limit', 'limit=1&limit='),
                            ('last-valid-offset', 'offset=-1&offset=0'),
                            ('last-invalid-offset', 'offset=0&offset=-1'),
                            ('encoded-integer', 'limit=%2B%D9%A1'),
                            ('underscore-integer', 'limit=1_0')]:
            request('query-' + name, 'GET', '/api/works?' + query)

        for name, kind in [('exact', 'application/json'), ('uppercase', 'Application/JSON'),
                           ('leading-space', ' application/json'), ('trailing-space', 'application/json '),
                           ('space-before-semicolon', 'application/json ;charset=utf-8'),
                           ('parameter', 'application/json; charset=utf-8'),
                           ('tab', 'application/json\t')]:
            request('content-type-' + name, 'POST', '/api/plan', b'{}', {'content-type': kind})
        for name, body in [('empty', b''), ('malformed', b'{bad'), ('list', b'[]'), ('scalar', b'1')]:
            request('json-' + name, 'POST', '/api/plan', body, {'content-type': 'application/json'})
        document = '{"name":"中文🦆"}'
        encodings = [('utf8-bom', document.encode('utf-8-sig')),
                     ('utf16', document.encode('utf-16')), ('utf32', document.encode('utf-32')),
                     ('utf16le-no-bom', document.encode('utf-16-le')), ('utf16be-no-bom', document.encode('utf-16-be')),
                     ('utf32le-no-bom', document.encode('utf-32-le')), ('utf32be-no-bom', document.encode('utf-32-be')),
                     ('bad-utf8', b'\xff{bad')]
        for name, body in encodings:
            request('encoding-' + name, 'POST', '/api/plan', body, {'content-type': 'application/json'})

        etag, modified = stamps['/file.txt']
        for name, value in [('exact', etag), ('weak', 'W/' + etag), ('list', '"different", W/' + etag),
                            ('wildcard', '*'), ('mismatch', '"different"')]:
            request('etag-' + name, 'GET', '/file.txt', headers={'if-none-match': value})
        for name, value in [('exact', modified), ('future', 'Fri, 01 Jan 2100 00:00:00 GMT'),
                            ('past', 'Wed, 01 Jan 2000 00:00:00 GMT'), ('invalid', '9999')]:
            request('modified-' + name, 'GET', '/file.txt', headers={'if-modified-since': value})
        request('etag-mismatch-disables-date', 'GET', '/file.txt',
                headers={'if-none-match': '"different"', 'if-modified-since': 'Fri, 01 Jan 2100 00:00:00 GMT'})
        ranges = [('single', 'bytes=2-5'), ('suffix', 'bytes=-3'), ('open', 'bytes=2-'),
                  ('clamp', 'bytes=8-20'), ('outside', 'bytes=10-'), ('zero-suffix', 'bytes=-0'),
                  ('reverse', 'bytes=5-2'), ('empty', 'bytes=-'), ('invalid', 'bad'),
                  ('multiple', 'bytes=0-1,4-5'), ('overlap', 'bytes=0-3,2-5'),
                  ('huge-start', 'bytes=999999999999999999999999-'),
                  ('huge-suffix', 'bytes=-999999999999999999999999')]
        for name, value in ranges:
            request('range-' + name, 'GET', '/file.txt', headers={'range': value})
        request('head-range', 'HEAD', '/file.txt', headers={'range': 'bytes=2-5'})
        request('range-with-modified', 'GET', '/file.txt',
                headers={'range': 'bytes=2-5', 'if-modified-since': modified})
        request('range-with-etag', 'GET', '/file.txt', headers={'range': 'bytes=2-5', 'if-none-match': etag})
        for name, value in [('etag', etag), ('weak-etag', 'W/' + etag), ('bad-etag', '"different"'),
                            ('date', modified), ('future-date', 'Fri, 01 Jan 2100 00:00:00 GMT')]:
            request('if-range-' + name, 'GET', '/file.txt', headers={'range': 'bytes=2-5', 'if-range': value})
        asset_etag, _asset_modified = stamps['/assets/model.json']
        request('asset-etag', 'GET', '/assets/model.json', headers={'if-none-match': asset_etag})
        request('asset-range', 'GET', '/assets/geometry.bin', headers={'range': 'bytes=2-5'})
    return output


def main():
    with tempfile.TemporaryDirectory(prefix='duck-python-server-oracle-') as temporary:
        root = Path(temporary)
        # Import-time asset resolution and default legacy path cannot reach real files.
        missing = root / 'missing-assets'
        os.environ['DUCK_ASSETS'] = str(missing)
        os.environ['DUCK_DB'] = str(root / 'unused-legacy.db')
        os.environ['DUCK_PUBLIC_URL'] = 'https://example.invalid'
        sys.path.insert(0, str(REPO / 'backend'))
        import server
        result = {'schema': 'letsduck-server-http-oracle/1',
                  'runtime': {name: importlib.metadata.version(name) for name in ('fastapi', 'starlette', 'httpx2')},
                  'baseUrl': 'http://testserver',
                  'notes': ['ASGI TestClient contract; native HTTP parser framing is outside this oracle.',
                            'All files/accounts/databases are disposable synthetic fixtures.',
                            'Only export-ordering scenario substitutes exporter and busy queue.'],
                  'scenarios': [collect(server, root, 'static'),
                                collect(server, root, 'custom-404', custom_404=True),
                                collect(server, root, 'export-ordering', fake_export=True),
                                collect(server, root, 'no-static', with_static=False)]}
    # TemporaryDirectory and every TestClient lifespan have already closed here.
    print(json.dumps(result, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    main()
