import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Invalid, isObject, type JsonObject } from '../rules.js';
import { THUMBNAILS } from '../export/exporter.js';
import type { Assets } from './assets.js';
import type { PersonalStore } from './schemes.js';
import type { Exports } from './exports.js';

const MAX_BODY = 8_000_000, CHUNK = 4 << 20;
const MIME: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.bin': 'application/octet-stream', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const missing = () => new Invalid('未知接口', 'request.not_found', {}, 404);

async function readBody(req: IncomingMessage, multipart: boolean): Promise<JsonObject> {
  const type = req.headers['content-type'] || '', kind = type.split(';')[0]!.trim().toLowerCase();
  if (kind !== 'application/json' && !(multipart && kind === 'multipart/form-data')) throw new Invalid('需要 JSON 请求', 'request.content_type', {}, 415);
  if (Number(req.headers['content-length'] || 0) > MAX_BODY) throw new Invalid('请求太大', 'request.too_large', {}, 413);
  const chunks: Buffer[] = []; let length = 0;
  for await (const chunk of req) { length += chunk.length; if (length > MAX_BODY) throw new Invalid('请求太大', 'request.too_large', {}, 413); chunks.push(chunk); }
  const bytes = Buffer.concat(chunks);
  if (kind === 'application/json') {
    let value; try { value = JSON.parse(bytes.toString('utf8') || '{}'); } catch { throw new Invalid('请求不是有效的 JSON', 'request.json', {}, 400); }
    if (!isObject(value)) throw new Invalid('请求格式不对', 'request.format', {}, 400); return value;
  }
  try {
    const boundary = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(type);
    if (type.length > 256 || !boundary || (boundary[1] || boundary[2])!.length > 70 || /content-transfer-encoding:/i.test(bytes.toString('latin1'))) throw new Error();
    const form = await new Request('http://localhost', { method: 'POST', headers: { 'content-type': type }, body: new Uint8Array(bytes) }).formData();
    const fields = new Map<string, FormDataEntryValue>();
    for (const [name, value] of form) { if (fields.has(name) || ![...THUMBNAILS, 'plan'].includes(name)) throw new Error(); fields.set(name, value); }
    if (fields.size !== THUMBNAILS.length + 1 || typeof fields.get('plan') !== 'string' || Buffer.byteLength(fields.get('plan') as string) > 200000) throw new Error();
    const plan = JSON.parse(fields.get('plan') as string); if (!isObject(plan) || Object.hasOwn(plan, 'thumbnails')) throw new Error();
    const thumbnails: Record<string, Buffer> = {};
    for (const name of THUMBNAILS) { const v = fields.get(name); if (!v || typeof v === 'string' || v.type !== 'image/png' || v.size > 600000) throw new Error(); thumbnails[name] = Buffer.from(await v.arrayBuffer()); }
    return { ...plan, thumbnails };
  } catch { throw new Invalid('请求格式不对', 'request.format', {}, 400); }
}

export async function serve(assets: Assets, schemes: PersonalStore, exports: Exports, version: string, port = 0) {
  let closing = false, stopped: Promise<void> | undefined;
  const server = createServer((req, res) => { void handle(req, res).catch(error => {
    if (res.headersSent || res.destroyed) { res.destroy(); return; }
    const e = error instanceof Invalid ? error : new Invalid('出错了，请查看启动日志', 'server.failed', {}, 500);
    if (!(error instanceof Invalid)) console.error(error);
    if (e.status === 503) res.setHeader('Retry-After', '2'); send(req, res, e.status, e.payload());
  }); });
  function send(req: IncomingMessage, res: ServerResponse, status: number, value: unknown, type = 'application/json; charset=utf-8') {
    const data = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value)); res.writeHead(status, { 'Content-Type': type, 'Content-Length': data.length }); res.end(req.method === 'HEAD' ? undefined : data);
  }
  function redirect(req: IncomingMessage, res: ServerResponse, status: number, location: string) { res.setHeader('Location', location); send(req, res, status, Buffer.alloc(0)); }
  async function file(req: IncomingMessage, res: ServerResponse, path: string, media = false) {
    let info; try { info = await stat(path); } catch { throw new Invalid('资产不存在', 'request.asset_missing', {}, 404); }
    if (info.isDirectory()) return redirect(req, res, 301, new URL(req.url!, 'http://localhost').pathname + '/');
    if (!info.isFile()) throw missing();
    const modified = new Date(Math.floor(info.mtimeMs / 1000) * 1000).toUTCString(), type = MIME[extname(path)] || 'application/octet-stream';
    const match = media ? /^bytes=(\d*)-(\d*)$/.exec(req.headers.range?.trim() || '') : null;
    if (media) res.setHeader('Accept-Ranges', 'bytes');
    let start = 0, end = info.size - 1, status = 200;
    if (match && (match[1] || match[2])) {
      if (match[1]) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : Math.min(start + CHUNK, info.size) - 1; }
      else start = Math.max(info.size - Number(match[2]), 0);
      if (start >= info.size || start > end) { res.setHeader('Content-Range', `bytes */${info.size}`); return send(req, res, 416, Buffer.alloc(0), type); }
      status = 206; res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
    } else {
      res.setHeader('Last-Modified', modified);
      if (req.headers['if-modified-since'] === modified) { res.writeHead(304); res.end(); return; }
    }
    res.writeHead(status, { 'Content-Type': type, 'Content-Length': Math.max(0, end - start + 1) });
    if (req.method === 'HEAD' || !info.size) { res.end(); return; }
    if (!media) { res.end(await readFile(path)); return; }
    await pipeline(createReadStream(path, { start, end }), res).catch(error => { if (error.code !== 'ERR_STREAM_PREMATURE_CLOSE') throw error; });
  }
  async function handle(req: IncomingMessage, res: ServerResponse) {
    const path = new URL(req.url || '/', 'http://localhost').pathname, method = req.method === 'HEAD' ? 'GET' : req.method;
    res.setHeader('Cache-Control', path.startsWith('/api/') ? 'no-store' : 'no-cache'); res.setHeader('X-Content-Type-Options', 'nosniff');
    if (closing) throw new Invalid('应用正在退出', 'server.stopping', {}, 503);
    if (path.startsWith('/api/')) {
      let api: string; try { api = decodeURIComponent(path).replace(/\/+$/, ''); } catch { throw missing(); }
      const scheme = /^\/api\/schemes\/([\p{L}\p{N}_-]{1,64})$/u.exec(api); let result: unknown;
      if (method === 'GET' && api === '/api/site') result = { publicUrl: '', edition: 'personal', assembly: assets.assemblyReady };
      else if (method === 'GET' && api === '/api/health') result = { version, export: exports.available, source_sha256: exports.available ? assets.model!.source_sha256 : null };
      else if (method === 'GET' && api === '/api/catalog') { if (!exports.available) throw new Invalid('耗材色表未加载', 'validation.29'); result = assets.catalog; }
      else if (method === 'GET' && api === '/api/schemes') result = schemes.schemes();
      else if (method === 'PUT' && scheme) result = schemes.save(scheme[1]!, await readBody(req, false));
      else if (method === 'DELETE' && scheme) { schemes.delete(scheme[1]!); result = { ok: true }; }
      else if (method === 'POST' && (api === '/api/plan' || api === '/api/export')) {
        if (!exports.available) throw new Invalid('没有加载模型资产，暂时不能导出', 'validation.31');
        result = await exports.run(api === '/api/plan' ? 'plan' : 'export', await readBody(req, api === '/api/export'));
        if (Buffer.isBuffer(result)) { res.setHeader('Content-Disposition', 'attachment; filename="XGO-Duck-materials.3mf"'); return send(req, res, 200, result, 'model/3mf'); }
      } else throw missing();
      return send(req, res, 200, result);
    }
    if (method !== 'GET') throw missing();
    if (path === '/gallery' || path.startsWith('/gallery/')) return redirect(req, res, 303, '/');
    if (path === '/paint/') return redirect(req, res, 308, '/paint');
    if (path.startsWith('/assets/')) { const name = path.slice(8); if (!assets.publicNames.has(name)) throw missing(); return file(req, res, join(assets.path, name)); }
    if (path.startsWith('/assemble/assets/')) { const name = path.slice(17); if (!assets.assemblyNames.has(name)) throw missing(); return file(req, res, join(assets.path, 'assembly', name), true); }
    let relative: string; try { relative = decodeURIComponent(path); } catch { throw missing(); }
    if (relative.includes('\0') || relative.includes('\\')) throw missing();
    if (relative === '/') relative = '/home.html'; else if (relative === '/paint') relative = '/index.html'; else if (relative.endsWith('/')) relative += 'index.html';
    const target = resolve(assets.frontend, '.' + relative), base = resolve(assets.frontend);
    if (!target.startsWith(base + sep)) throw missing();
    return file(req, res, target);
  }
  await new Promise<void>((ok, no) => { server.once('error', no); server.listen(port, '127.0.0.1', () => { server.off('error', no); ok(); }); });
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('No local listener');
  return { url: `http://127.0.0.1:${address.port}`, close() { closing = true; return stopped ??= new Promise<void>((ok, no) => server.close(e => e ? no(e) : ok())); } };
}
