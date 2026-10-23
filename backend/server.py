"""Server edition API (FastAPI + MySQL). nginx serves the frontend in Docker; --static serves it for development.

The personal edition is a separate standard-library server in ../personal/."""
import argparse
from contextlib import asynccontextmanager
import json
import logging
import os
from pathlib import Path
import re
import sqlite3
import threading
import time
from urllib.error import URLError
from urllib.request import urlopen
import webbrowser

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.staticfiles import StaticFiles
from sqlalchemy import func, select, text
import uvicorn

from errors import payload as error_payload
from export_jobs import ExportBusy, ExportManager
from database import users
from store import Invalid, Store

ROOT = Path(__file__).resolve().parent
ASSETS = Path(os.environ.get('DUCK_ASSETS', ROOT.parent / 'assets'))
VERSION = '3.1.0'
MAX_BODY = 8_000_000
ID = re.compile(r'^[\w-]{1,64}$')


def token(request):
    value = request.headers.get('authorization', '')
    return value[7:].strip() if value.startswith('Bearer ') else None


def optional_user(request: Request):
    return request.app.state.store.user_for(token(request))


def require_user(user=Depends(optional_user)):
    if not user:
        raise HTTPException(401, {'error': '请先登录', 'code': 'auth.required', 'params': {}})
    return user


async def read_json(request: Request):
    if request.headers.get('content-type', '').split(';')[0] != 'application/json':
        raise HTTPException(415, {'error': '需要 JSON 请求', 'code': 'request.content_type', 'params': {}})
    try:
        length = int(request.headers.get('content-length', '0'))
    except ValueError:
        raise HTTPException(400, {'error': '请求格式不对', 'code': 'request.format', 'params': {}})
    if not 0 <= length <= MAX_BODY:
        raise HTTPException(413, {'error': '请求太大', 'code': 'request.too_large', 'params': {}})
    chunks, size = [], 0
    async for chunk in request.stream():
        size += len(chunk)
        if size > MAX_BODY:
            raise HTTPException(413, {'error': '请求太大', 'code': 'request.too_large', 'params': {}})
        chunks.append(chunk)
    try:
        result = json.loads(b''.join(chunks) or b'{}')
    except (ValueError, UnicodeError):
        raise HTTPException(400, {'error': '请求不是有效的 JSON', 'code': 'request.json', 'params': {}})
    if not isinstance(result, dict):
        raise HTTPException(400, {'error': '请求格式不对', 'code': 'request.format', 'params': {}})
    return result


def valid_id(value):
    if not ID.fullmatch(value):
        raise HTTPException(404, {'error': '未知接口', 'code': 'request.not_found', 'params': {}})
    return value


class PublicAssets(StaticFiles):
    async def get_response(self, path, scope):
        if path not in {'model.json', 'catalog.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', 'export-schema.json'}:
            raise HTTPException(404, {'error': '资产不存在', 'code': 'request.asset_missing', 'params': {}})
        return await super().get_response(path, scope)


def create_app(database_url=None, static=None, exports=None):
    @asynccontextmanager
    async def lifespan(app):
        try:
            import exporter
        except (OSError, ValueError, AssertionError):
            exporter = None
        app.state.exporter = exporter
        app.state.store = Store(database_url=database_url,
            part_ids=[p['id'] for p in exporter.MODEL['parts']] if exporter else None)
        app.state.exports = exports or ExportManager(
            workers=int(os.environ.get('DUCK_EXPORT_WORKERS', '1')),
            queue_size=int(os.environ.get('DUCK_EXPORT_QUEUE', '2')))
        try:
            # A mode switch must not silently present an empty site over existing local accounts.
            legacy = Path(os.environ.get('DUCK_DB', ROOT / 'data' / 'doodleduck.db')).resolve()
            if app.state.store.engine.dialect.name == 'mysql' and legacy.is_file():
                with sqlite3.connect(legacy.as_uri() + '?mode=ro', uri=True) as conn:
                    old_users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
                with app.state.store.engine.connect() as conn:
                    new_users = conn.scalar(select(func.count()).select_from(users))
                if old_users and not new_users:
                    raise RuntimeError('Existing SQLite accounts require migrate_database.py before MySQL startup')
            yield
        finally:
            await app.state.exports.close()
            app.state.store.close()

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware('http')
    async def response_headers(request, call_next):
        response = await call_next(request)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_error(request, exc):
        status = 404 if exc.status_code == 405 else exc.status_code
        detail={'error':'未知接口','code':'request.not_found','params':{}} if status==404 else exc.detail
        body=detail if isinstance(detail,dict) else {'error':detail,'code':'request_failed','params':{}}
        return JSONResponse(body, status_code=status, headers=exc.headers)

    @app.exception_handler(Invalid)
    @app.exception_handler(ValueError)
    async def invalid_error(request, exc):
        return JSONResponse(error_payload(exc), status_code=422)

    @app.exception_handler(ExportBusy)
    async def export_busy(request, exc):
        return JSONResponse({'error':str(exc),'code':'export.busy','params':{}}, status_code=503, headers={'Retry-After': '2'})

    @app.exception_handler(Exception)
    async def unexpected_error(request, exc):
        logging.getLogger(__name__).error('Unhandled API failure: %s', type(exc).__name__)
        return JSONResponse({'error':'服务器出错了，请查看服务日志','code':'server.failed','params':{}}, status_code=500,
            headers={'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'})

    @app.get('/api/health')
    def health(request: Request):
        with request.app.state.store.engine.connect() as conn:
            conn.execute(text('SELECT 1'))
        e = request.app.state.exporter
        return {'version': VERSION, 'export': bool(e), 'source_sha256': e.MODEL['source_sha256'] if e else None}

    @app.get('/api/site')
    def site():
        return {'publicUrl': os.environ.get('DUCK_PUBLIC_URL', ''), 'edition': 'server'}

    @app.get('/api/catalog')
    def catalog(request: Request):
        e = request.app.state.exporter
        if not e:
            raise Invalid('耗材色表未加载', code='validation.29')
        return e.CATALOG

    @app.post('/api/auth/register')
    def register(request: Request, body=Depends(read_json)):
        return request.app.state.store.register(body.get('name'), body.get('password'))

    @app.post('/api/auth/login')
    def login(request: Request, body=Depends(read_json)):
        return request.app.state.store.login(body.get('name'), body.get('password'))

    @app.post('/api/auth/logout')
    def logout(request: Request, user=Depends(require_user), body=Depends(read_json)):
        request.app.state.store.logout(token(request))
        return {'ok': True}

    @app.get('/api/me')
    def me(user=Depends(require_user)):
        return user

    @app.patch('/api/me')
    def update_me(request: Request, user=Depends(require_user), body=Depends(read_json)):
        return request.app.state.store.update_user(user['id'], body)

    @app.get('/api/schemes')
    def list_schemes(request: Request, user=Depends(require_user)):
        return request.app.state.store.schemes(user['id'])

    @app.put('/api/schemes/{sid}')
    def put_scheme(sid: str, request: Request, user=Depends(require_user), body=Depends(read_json)):
        return request.app.state.store.save_scheme(user['id'], valid_id(sid), body)

    @app.delete('/api/schemes/{sid}')
    def delete_scheme(sid: str, request: Request, user=Depends(require_user)):
        request.app.state.store.delete_scheme(user['id'], valid_id(sid))
        return {'ok': True}

    @app.get('/api/works')
    def list_works(request: Request, user=Depends(optional_user)):
        try:
            limit = int(request.query_params.get('limit', '200'))
            offset = int(request.query_params.get('offset', '0'))
        except ValueError:
            raise Invalid('分页范围不对', code='request.pagination')
        return request.app.state.store.works(user and user['id'], request.query_params.get('author'), limit, offset)

    @app.get('/api/works/{wid}')
    def get_work(wid: str, request: Request, user=Depends(optional_user)):
        return request.app.state.store.work(valid_id(wid), user and user['id'])

    @app.post('/api/works')
    def publish(request: Request, user=Depends(require_user), body=Depends(read_json)):
        return request.app.state.store.publish(user['id'], body)

    @app.delete('/api/works/{wid}')
    def delete_work(wid: str, request: Request, user=Depends(require_user)):
        request.app.state.store.delete_work(user['id'], valid_id(wid))
        return {'ok': True}

    @app.put('/api/works/{wid}/rating')
    def rate(wid: str, request: Request, user=Depends(require_user), body=Depends(read_json)):
        return request.app.state.store.rate(user['id'], valid_id(wid), body.get('stars'))

    def exporter_for(request):
        e = request.app.state.exporter
        if not e:
            raise Invalid('服务器没有加载模型资产，暂时不能导出', code='validation.31')
        return e

    @app.post('/api/plan')
    def plan(request: Request, body=Depends(read_json)):
        return exporter_for(request).plan(body)

    @app.post('/api/export')
    async def export(request: Request, body=Depends(read_json)):
        # Keep the existing blocking download contract; no job IDs or UI changes required.
        exporter_for(request).plan(body)
        content, _ = await request.app.state.exports.run(body)
        return Response(content, media_type='model/3mf',
            headers={'Content-Disposition': 'attachment; filename="XGO-Duck-materials.3mf"'})

    @app.api_route('/api/{path:path}', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])
    def missing_api(path: str):
        raise HTTPException(404, {'error': '未知接口', 'code': 'request.not_found', 'params': {}})

    if static:
        app.mount('/assets', PublicAssets(directory=str(ASSETS), check_dir=False))
        app.mount('/', StaticFiles(directory=static, html=True))
    return app


app = create_app()


def open_when_ready(url):
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        try:
            with urlopen(url.rstrip('/') + '/api/health', timeout=1) as response:
                if response.status == 200:
                    webbrowser.open(url)
                    return
        except (OSError, URLError):
            pass
        time.sleep(0.05)


def main():
    parser = argparse.ArgumentParser(description='letsduck FastAPI server')
    parser.add_argument('--host', default=os.environ.get('HOST', '127.0.0.1'))
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '8876')))
    parser.add_argument('--static', help='serve the frontend directory too (lightweight deployment)')
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()
    if args.open:
        host = '127.0.0.1' if args.host == '0.0.0.0' else args.host
        if ':' in host:
            host = '[' + host + ']'
        threading.Thread(target=open_when_ready, args=(f'http://{host}:{args.port}/',), daemon=True).start()
    # One API process owns the export limit. Scale export processes with DUCK_EXPORT_WORKERS.
    uvicorn.run(create_app(static=args.static), host=args.host, port=args.port, workers=1,
        limit_concurrency=int(os.environ.get('DUCK_HTTP_LIMIT', '64')), timeout_keep_alive=5,
        timeout_graceful_shutdown=60, access_log=os.environ.get('DUCK_QUIET') != '1')


if __name__ == '__main__':
    main()
