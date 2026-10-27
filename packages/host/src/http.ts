import { isIP } from 'node:net';
import type { IncomingMessage } from 'node:http';
import Fastify, { LogController } from 'fastify';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { DebugError, SetupError, validatedUpdates } from '@letsduck/devices';
import { Invalid, errorPayload, isJsonObject, parseWireJson, readJsonField } from '@letsduck/domain';
import { ExportBodyError, ExportBusy, decodeJsonBytes, parseMultipart } from '@letsduck/exporter';
import { htmlError, personalStatic, sendBody } from './static.js';
import { jsonStringify } from '@letsduck/storage';
import type { PersonalHttpOptions } from './http-types.js';
export type { AssemblyManifest, HostExporter, HttpDuckDebug, HttpServoSetup, PersonalHttpOptions } from './http-types.js';

const maxBody = 8_000_000;
const contentTypes = new WeakMap<FastifyRequest, string | undefined>();
const contentType = (request: FastifyRequest) => contentTypes.has(request) ? contentTypes.get(request) ?? '' : String(request.headers['content-type'] ?? '');
const notFound = { error: '未知接口', code: 'request.not_found', params: {} };
const supported = new Set(['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH']);
const schemeId = /^[\p{L}\p{N}_-]{1,64}$/u;
class Reply extends Error { constructor(readonly status: number, readonly body: Record<string, unknown>) { super(String(body.code ?? body.error)); } }
const fail = (status: number, error: string, code: string): never => { throw new Reply(status, { error, code, params: {} }); };
function loopback(address: string | undefined): boolean {
  if (!address) return false;
  const normalized = address.toLowerCase().split('%')[0]!;
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  if (normalized.startsWith('::ffff:')) return loopback(normalized.slice(7));
  return isIP(normalized) === 4 && normalized.split('.')[0] === '127';
}
function allowedOrigin(request: FastifyRequest, options: PersonalHttpOptions): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  if (options.uiOrigin !== undefined) return origin === options.uiOrigin;
  const port = request.raw.socket.localPort;
  if (!port) return false;
  let host = options.listenHost ?? '127.0.0.1';
  if (host === '0.0.0.0' || host === '' || host === '::') host = '127.0.0.1';
  const hosts = loopback(host) || host === 'localhost' ? ['127.0.0.1', 'localhost', '::1'] : [host];
  return hosts.some(value => origin === `http://${value.includes(':') ? '[' + value + ']' : value}${port === 80 ? '' : ':' + port}` || origin === `http://${value.includes(':') ? '[' + value + ']' : value}:${port}`);
}
function guardPeer(request: FastifyRequest, message: string): void { if (!loopback(request.raw.socket.remoteAddress)) throw new Reply(403, { error: message }); }
function guardOrigin(request: FastifyRequest, options: PersonalHttpOptions, message: string): void { if (!allowedOrigin(request, options)) throw new Reply(403, { error: message }); }
function length(request: FastifyRequest): number {
  const header = request.headers['content-length'];
  if (header === undefined || header === '') return 0;
  if (typeof header !== 'string' || !/^[\s]*[+-]?\d+[\s]*$/.test(header)) return fail(400, '请求格式不对', 'request.format');
  const parsed = BigInt(header.trim());
  if (parsed < 0n || parsed > BigInt(maxBody)) return fail(413, '请求太大', 'request.too_large');
  return Number(parsed);
}
async function readBytes(request: FastifyRequest): Promise<Buffer> {
  const count = length(request);
  if (count === 0) return Buffer.alloc(0);
  const chunks: Buffer[] = []; let read = 0;
  for await (const chunk of request.raw) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    const take = bytes.subarray(0, count - read); chunks.push(take); read += take.length;
    if (read >= count) break;
  }
  return Buffer.concat(chunks, read);
}
async function readJson(request: FastifyRequest): Promise<Record<string, unknown>> {
  if (contentType(request).split(';')[0]!.trim() !== 'application/json') return fail(415, '需要 JSON 请求', 'request.content_type');
  const bytes = await readBytes(request);
  let body: unknown;
  try { body = parseWireJson(bytes.length ? decodeJsonBytes(bytes) : '{}'); }
  catch { return fail(400, '请求不是有效的 JSON', 'request.json'); }
  if (!isJsonObject(body)) return fail(400, '请求格式不对', 'request.format');
  return body;
}
async function readExport(request: FastifyRequest): Promise<Record<string, unknown>> {
  const kind = contentType(request);
  return kind.split(';')[0]!.trim().toLowerCase() === 'multipart/form-data' ? parseMultipart(await readBytes(request), kind) : readJson(request);
}

/** Construct a listener-free personal adapter. The caller owns storage, workers and devices. */
export function createPersonalHttp(options: PersonalHttpOptions): FastifyInstance {
  const originalUrls = new WeakMap<IncomingMessage, string>();
  const app = Fastify({ rewriteUrl(request) { originalUrls.set(request, request.url ?? '/'); return '/'; }, logger: { level: 'warn' }, logController: new LogController({ disableRequestLogging: true }), exposeHeadRoutes: false, trustProxy: false, routerOptions: { ignoreTrailingSlash: false, maxParamLength: 4096 },
    clientErrorHandler(error, socket) {
      if (!socket.writable || socket.writableEnded) return;
      const packet = Buffer.isBuffer(error.rawPacket) ? error.rawPacket.toString('latin1') : '';
      const declared = /^content-length:[ \t]*(.*)$/im.exec(packet)?.[1]?.trim();
      const tooLarge = error.code === 'HPE_INVALID_CONTENT_LENGTH' && declared !== undefined && /^[+-]?\d+$/.test(declared) && (BigInt(declared) < 0n || BigInt(declared) > BigInt(maxBody));
      const status = tooLarge ? 413 : 400, code = tooLarge ? 'request.too_large' : 'request.format';
      const bytes = Buffer.from(jsonStringify({ error: tooLarge ? '请求太大' : '请求格式不对', code, params: {} }));
      const path = packet.split('\r\n')[0]?.split(' ')[1] ?? '';
      socket.end(Buffer.concat([Buffer.from(`HTTP/1.1 ${status} ${tooLarge ? 'Request Entity Too Large' : 'Bad Request'}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: ${bytes.length}\r\nCache-Control: ${path.startsWith('/api/') ? 'no-store' : 'no-cache'}\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n`), bytes]));
    },
  });
  const files = personalStatic(options);
  const needExporter = (catalog = false) => { if (!options.exporter?.available) throw new Invalid(catalog ? '耗材色表未加载' : '没有加载模型资产，暂时不能导出', catalog ? 'validation.29' : 'validation.31'); return options.exporter; };
  async function api(request: FastifyRequest, path: string): Promise<unknown> {
    const method = request.method === 'HEAD' ? 'GET' : request.method;
    const scheme = /^\/api\/schemes\/([^/]+)$/.exec(path);
    if (scheme && !schemeId.test(scheme[1]!)) throw new Reply(404, notFound);
    if (method === 'GET' && path === '/api/health') return { version: '3.1.0', export: Boolean(options.exporter?.available), source_sha256: options.exporter?.available ? options.exporter.sourceSha256 : null };
    if (method === 'GET' && path === '/api/site') return { publicUrl: '', edition: 'personal', assembly: await files.assemblyReady(), servoSetup: loopback(request.raw.socket.remoteAddress), servoPreparation: loopback(request.raw.socket.remoteAddress) };
    if (path.startsWith('/api/duck-debug/')) {
      guardPeer(request, '请在连接 UNO Q 的这台电脑上打开调试鸭。');
      if (method === 'GET' && path === '/api/duck-debug/status') return options.debug.status();
      if (method === 'GET' && path === '/api/duck-debug/numbering') return options.debug.numbering();
      if (method === 'POST' && path === '/api/duck-debug/action') { guardOrigin(request, options, '请从本机调试鸭执行操作。'); return options.debug.action(await readJson(request)); }
      throw new Reply(404, notFound);
    }
    if (path === '/api/servo-preparation') {
      guardPeer(request, '请在本机组装台记录取件。');
      if (method === 'GET') return { records: options.store.servoPreparationRecords() };
      if (method === 'POST') { guardOrigin(request, options, '请从本机组装台记录取件。'); return { records: options.store.saveServoPreparation(validatedUpdates(await readJson(request))) }; }
    }
    if (path === '/api/servo-setup' || path.startsWith('/api/servo-setup/')) {
      guardPeer(request, '请在连接 UNO Q 的这台电脑上打开组装台。');
      if (method === 'GET' && path === '/api/servo-setup') return options.setup.inspect();
      if (method === 'GET' && path === '/api/servo-setup/records') return { records: options.store.servoRecords() };
      const action = path.slice('/api/servo-setup/'.length);
      if (method === 'POST' && ['start', 'pause', 'halt', 'refresh', 'audit', 'repair', 'queue'].includes(action)) {
        guardOrigin(request, options, '请从本机组装台执行此操作。');
        const body = await readJson(request);
        if (action === 'start') return options.setup.start(readJsonField(body, 'targetId'));
        if (action === 'audit' || action === 'repair' || action === 'queue') return options.setup[action](readJsonField(body, 'id'));
        if (action === 'pause' || action === 'halt' || action === 'refresh') return options.setup[action]();
      }
      throw new Reply(404, notFound);
    }
    if (method === 'GET' && path === '/api/catalog') return needExporter(true).catalog;
    if (method === 'GET' && path === '/api/schemes') return options.store.schemes();
    if (method === 'PUT' && scheme) return options.store.saveScheme(scheme[1]!, await readJson(request));
    if (method === 'DELETE' && scheme) { options.store.deleteScheme(scheme[1]!); return { ok: true }; }
    if (method === 'POST' && (path === '/api/plan' || path === '/api/export')) {
      const exporter = needExporter();
      const cancellation = new AbortController();
      const abort = () => cancellation.abort();
      request.raw.once('aborted', abort);
      request.raw.socket.once('close', abort);
      try { return path === '/api/plan' ? await exporter.run('plan', await readJson(request), cancellation.signal) : await exporter.run('export', await readExport(request), cancellation.signal); }
      finally { request.raw.off('aborted', abort); request.raw.socket.off('close', abort); }
    }
    throw new Reply(404, notFound);
  }
  async function dispatch(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    const raw = request.raw.url ?? '/', path = raw.split('?')[0]!.split('#')[0]!;
    reply.header('cache-control', raw.startsWith('/api/') ? 'no-store' : 'no-cache').header('x-content-type-options', 'nosniff');
    if (!supported.has(request.method)) return htmlError(request, reply, 501);
    try {
      if ((request.method === 'GET' || request.method === 'HEAD') && !path.startsWith('/api/')) return await files.serve(request, reply, path);
      const result = await api(request, path.replace(/\/+$/, ''));
      return Buffer.isBuffer(result) ? sendBody(request, reply, 200, result, 'model/3mf', { 'content-disposition': 'attachment; filename="XGO-Duck-materials.3mf"' }) : sendBody(request, reply, 200, result);
    } catch (error) {
      if (error instanceof Reply) return sendBody(request, reply, error.status, error.body);
      if (error instanceof ExportBodyError) return sendBody(request, reply, error.status, error.body);
      if (error instanceof ExportBusy) return sendBody(request, reply, 503, errorPayload(error), undefined, { 'retry-after': '2' });
      if (error instanceof DebugError) return sendBody(request, reply, 422, { error: error.message, ...error.details });
      if (error instanceof Invalid || error instanceof SetupError || (error instanceof Error && error.name === 'ValueError')) return sendBody(request, reply, 422, errorPayload(error));
      request.log.error({ err: error }, 'Unhandled API failure');
      return sendBody(request, reply, 500, { error: '出错了，请查看启动窗口里的日志', code: 'server.failed', params: {} });
    }
  }
  // One raw-path dispatcher owns routing. Avoid framework URI decoding (Python
  // does not decode API paths), including invalid percent escapes and long IDs.
  app.addHook('onRequest', async request => { request.raw.url = originalUrls.get(request.raw) ?? request.raw.url; });
  // Leave the stream unread until dispatch has checked the route, availability and
  // Origin. In particular, Fastify must never run its native JSON number parser.
  app.removeAllContentTypeParsers();
  // Fastify validates media syntax even for a wildcard parser. Python only checks
  // the essence when the selected route reads JSON, so retain the original type.
  app.addHook('preParsing', async (request, _reply, payload) => {
    contentTypes.set(request, request.headers['content-type']);
    request.headers['content-type'] = 'application/octet-stream';
    return payload;
  });
  app.addContentTypeParser('*', (_request, _payload, done) => { done(null, undefined); });
  app.all('/*', dispatch);
  return app;
}
