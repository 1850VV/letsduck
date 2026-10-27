import type { IncomingMessage } from 'node:http';
import Fastify, { LogController } from 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Invalid, errorPayload, isJsonObject, parseWireJson, pythonStrip } from '@letsduck/domain';
import { ExportBodyError, ExportBusy, decodeJsonBytes, parseMultipart } from '@letsduck/exporter';
import type { ServerStore, ServerUser } from '@letsduck/storage';
import type { PersonalHttpServer } from './http-types.js';
import { requestTracker } from './http-lifecycle.js';
import { sendBody } from './static.js';
function sendServerBody(request: FastifyRequest, reply: FastifyReply, status: number, data: unknown, contentType = 'application/json', headers: Record<string, string> = {}) { return sendBody(request, reply, status, data, contentType, headers); }
import { ServerHttpError, UNHANDLED, serverFail, serverNotFound } from './server-context.js';
import type { ServerApiContext } from './server-context.js';
import { serverAccounts } from './server-accounts.js';
import { serverCommunity } from './server-community.js';
import { serverLocation, serveServerStatic } from './server-static.js';

export interface ServerExporter {
  readonly available: boolean;
  readonly catalog: unknown;
  readonly sourceSha256: string | null;
  plan(payload: unknown): unknown;
  run(payload: Record<string, unknown>, signal?: AbortSignal): Promise<Buffer>;
}
export interface ServerHttpOptions {
  store: ServerStore;
  assets: string;
  frontend?: string;
  exporter?: ServerExporter | null;
  publicUrl?: string;
  httpLimit?: number;
  quiet?: boolean;
}
const maxBody = 8_000_000;
const validId = /^[\p{L}\p{N}_-]{1,64}$/u;
// With no static mount, ASGI keeps the first partial route's Allow header
// when a method such as TRACE is outside the seven-method API catchall.
function partialAllow(path: string): string {
  if (['/api/health', '/api/site', '/api/catalog', '/api/me', '/api/schemes', '/api/works'].includes(path) || /^\/api\/works\/[^/]+$/.test(path)) return 'GET';
  if (['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/plan', '/api/export'].includes(path)) return 'POST';
  if (/^\/api\/schemes\/[^/]+$/.test(path) || /^\/api\/works\/[^/]+\/rating$/.test(path)) return 'PUT';
  return 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS';
}
function decodePath(path: string): string { return path.replace(/(?:%[a-f\d]{2})+/ig, encoded => Buffer.from(encoded.replace(/%/g, ''), 'hex').toString('utf8')); }

/** The server adapter owns no database, worker, device, or TCP listener until listen(). */
export function createServerHttp(options: ServerHttpOptions): PersonalHttpServer {
  const limit = options.httpLimit ?? 64;
  if (!Number.isInteger(limit) || limit < 1) throw new RangeError('HTTP limit must be a positive integer');
  const originalUrls = new WeakMap<IncomingMessage, string>(), media = new WeakMap<FastifyRequest, string>();
  const tracker = requestTracker();
  const app = Fastify({
    rewriteUrl(request) { originalUrls.set(request, request.url ?? '/'); return '/'; },
    logger: { level: options.quiet ? 'error' : 'warn' }, logController: new LogController({ disableRequestLogging: true }),
    exposeHeadRoutes: false, trustProxy: false, keepAliveTimeout: 5000,
  });
  app.addHook('onRequest', async (request, reply) => {
    request.raw.url = originalUrls.get(request.raw) ?? request.raw.url;
    reply.header('cache-control', 'no-store').header('x-content-type-options', 'nosniff');
    const connections = await new Promise<number>((resolve, reject) => app.server.getConnections((error, count) => error ? reject(error) : resolve(count)));
    if (connections >= limit || tracker.size >= limit) return reply.code(503).header('connection', 'close').type('text/plain; charset=utf-8').send('Service Unavailable');
  });
  app.removeAllContentTypeParsers();
  app.addHook('preParsing', async (request, _reply, payload) => {
    media.set(request, String(request.headers['content-type'] ?? ''));
    request.headers['content-type'] = 'application/octet-stream';
    return payload;
  });
  app.addContentTypeParser('*', (_request, _payload, done) => done(null, undefined));
  async function readBytes(request: FastifyRequest): Promise<Buffer> {
    const declared = request.headers['content-length'];
    if (declared !== undefined) {
      if (typeof declared !== 'string' || !/^[\s]*[+-]?\d+[\s]*$/.test(declared)) return serverFail(400, '请求格式不对', 'request.format');
      const count = BigInt(declared.trim());
      if (count < 0n || count > BigInt(maxBody)) return serverFail(413, '请求太大', 'request.too_large', { connection: 'close' });
    }
    const chunks: Buffer[] = []; let size = 0;
    // Early 413 must leave the response socket alive long enough to send its error.
    for await (const chunk of request.raw.iterator({ destroyOnReturn: false })) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array); size += bytes.length;
      if (size > maxBody) return serverFail(413, '请求太大', 'request.too_large', { connection: 'close' });
      chunks.push(bytes);
    }
    return Buffer.concat(chunks, size);
  }
  async function readJson(request: FastifyRequest): Promise<Record<string, unknown>> {
    if ((media.get(request) ?? '').split(';')[0] !== 'application/json') return serverFail(415, '需要 JSON 请求', 'request.content_type');
    const bytes = await readBytes(request);
    let body: unknown;
    try { body = parseWireJson(bytes.length ? decodeJsonBytes(bytes) : '{}'); }
    catch { return serverFail(400, '请求不是有效的 JSON', 'request.json'); }
    if (!isJsonObject(body)) return serverFail(400, '请求格式不对', 'request.format');
    return body;
  }
  async function readExport(request: FastifyRequest): Promise<Record<string, unknown>> {
    const kind = media.get(request) ?? '';
    return kind.split(';')[0]!.trim().toLowerCase() === 'multipart/form-data' ? parseMultipart(await readBytes(request), kind) : readJson(request);
  }
  function context(request: FastifyRequest, path: string, query: URLSearchParams): ServerApiContext {
    let user: Promise<ServerUser | null> | undefined;
    const token = () => { const value = String(request.headers.authorization ?? ''); return value.startsWith('Bearer ') ? pythonStrip(value.slice(7)) : null; };
    const optionalUser = () => user ??= options.store.userFor(token());
    return {
      method: request.method, path, store: options.store, token, optionalUser,
      query(name, fallback) { return query.getAll(name).at(-1) ?? fallback; },
      async requireUser() { const found = await optionalUser(); if (!found) return serverFail(401, '请先登录', 'auth.required'); return found; },
      readJson: () => readJson(request),
      validId(value) { if (!validId.test(value)) throw new ServerHttpError(404, serverNotFound); return value; },
    };
  }
  const exporter = (catalog = false): ServerExporter => {
    if (!options.exporter?.available) throw new Invalid(catalog ? '耗材色表未加载' : '服务器没有加载模型资产，暂时不能导出', catalog ? 'validation.29' : 'validation.31');
    return options.exporter;
  };
  async function api(request: FastifyRequest, ctx: ServerApiContext): Promise<unknown> {
    const { method, path } = ctx;
    if (method === 'GET' && path === '/api/health') {
      await options.store.db.transaction(connection => connection.rows('SELECT 1'));
      const available = Boolean(options.exporter?.available);
      return { version: '3.1.0', export: available, source_sha256: available ? options.exporter!.sourceSha256 : null };
    }
    if (method === 'GET' && path === '/api/site') return { publicUrl: options.publicUrl ?? '', edition: 'server' };
    if (method === 'GET' && path === '/api/catalog') return exporter(true).catalog;
    const account = await serverAccounts(ctx); if (account !== UNHANDLED) return account;
    const community = await serverCommunity(ctx); if (community !== UNHANDLED) return community;
    if (method === 'POST' && path === '/api/plan') { const body = await readJson(request); return exporter().plan(body); }
    if (method === 'POST' && path === '/api/export') {
      const body = await readExport(request), source = exporter(); source.plan(body);
      const abort = new AbortController(), socket = request.raw.socket;
      const disconnected = () => abort.abort(); socket.once('close', disconnected);
      try { return await source.run(body, abort.signal); }
      finally { socket.off('close', disconnected); }
    }
    throw new ServerHttpError(404, serverNotFound);
  }
  async function dispatch(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const url = request.raw.url ?? '/', split = url.indexOf('?'), path = decodePath(split >= 0 ? url.slice(0, split) : url), query = split >= 0 ? url.slice(split) : '';
    try {
      if (!options.frontend && path === '/api') return reply.code(307).header('content-length', '0').header('location', serverLocation(request, '/api/' + query)).send();
      if (!options.frontend && path.startsWith('/api/') && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(request.method)) throw new ServerHttpError(404, serverNotFound, { allow: partialAllow(path) });
      if (path.startsWith('/api/') && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const result = await api(request, context(request, path, new URLSearchParams(query.slice(1))));
        if (Buffer.isBuffer(result)) return sendServerBody(request, reply, 200, result, 'model/3mf', { 'content-disposition': 'attachment; filename="XGO-Duck-materials.3mf"' });
        return sendServerBody(request, reply, 200, result);
      }
      return await serveServerStatic(request, reply, options, path, query);
    } catch (error) {
      for (const header of ['content-length', 'content-type', 'etag', 'last-modified', 'accept-ranges', 'content-range']) reply.removeHeader(header);
      if (error instanceof ServerHttpError) return sendServerBody(request, reply, error.status, error.body, error.contentType, error.headers);
      if (error instanceof ExportBodyError) return sendServerBody(request, reply, error.status, error.body);
      if (error instanceof ExportBusy) return sendServerBody(request, reply, 503, errorPayload(error), 'application/json', { 'retry-after': '2' });
      if (error instanceof Invalid) return sendServerBody(request, reply, 422, errorPayload(error));
      request.log.error({ errorType: error instanceof Error ? error.name : typeof error }, 'Unhandled server API failure');
      return sendServerBody(request, reply, 500, { error: '服务器出错了，请查看服务日志', code: 'server.failed', params: {} });
    }
  }
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ errorType: error instanceof Error ? error.name : typeof error }, 'Server transport failure');
    return sendServerBody(request, reply, 500, { error: '服务器出错了，请查看服务日志', code: 'server.failed', params: {} });
  });
  // This also preserves handlers after client aborts; shutdown waits for actual work.
  app.all('/*', (request, reply) => tracker.run(reply, () => dispatch(request, reply)));
  return Object.assign(app, { waitRequests: tracker.waitRequests });
}
