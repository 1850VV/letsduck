import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import type { BigIntStats } from 'node:fs';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { frontendMime } from './mime.js';
import { ServerHttpError, serverNotFound } from './server-context.js';

const publicAssets = new Set(['model.json', 'catalog.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', 'export-schema.json']);
export function serverLocation(request: FastifyRequest, path: string): string { return request.protocol + '://' + String(request.headers.host ?? 'localhost') + path; }
function missing(): never { throw new ServerHttpError(404, serverNotFound); }
async function locate(root: string, path: string): Promise<{ path: string; info: BigIntStats } | null> {
  try {
    const base = await realpath(root), target = await realpath(resolve(base, '.' + (path.startsWith('/') ? path : '/' + path))), rel = relative(base, target);
    if (isAbsolute(rel) || rel === '..' || rel.startsWith('..' + sep)) return null;
    return { path: target, info: await stat(target, { bigint: true }) };
  } catch (error) { if (error instanceof Error && 'code' in error && ['ENOENT', 'ENOTDIR', 'EACCES'].includes(String(error.code))) return null; throw error; }
}
function modified(info: BigIntStats): { date: string; etag: string } {
  const seconds = Number(info.mtimeNs / 1_000_000_000n) + Number(info.mtimeNs % 1_000_000_000n) / 1e9;
  const value = Number.isInteger(seconds) ? seconds.toFixed(1) : String(seconds);
  return { date: new Date(Number(info.mtimeNs / 1_000_000n)).toUTCString(), etag: '"' + createHash('md5').update(value + '-' + info.size).digest('hex') + '"' };
}
function rangeError(status: number, message: string, headers: Record<string, string> = {}): never { throw new ServerHttpError(status, Buffer.from(message), headers, 'text/plain; charset=utf-8'); }
function ranges(header: string, size: number): Array<[number, number]> {
  const match = /^bytes=(.*)$/i.exec(header);
  if (!match) return rangeError(400, 'Malformed range header.');
  const result: Array<[number, number]> = [];
  for (const value of match[1]!.split(',')) {
    const parts = /^\s*(\d*)-(\d*)\s*$/.exec(value); if (!parts || (!parts[1] && !parts[2])) return rangeError(400, 'Range header: range must be requested');
    const start = parts[1] ? Number(parts[1]) : Math.max(0, size - Number(parts[2])), end = parts[1] && parts[2] ? Math.min(size - 1, Number(parts[2])) : size - 1;
    if (start >= size || start < 0 || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) return rangeError(416, '', { 'content-range': 'bytes */' + size });
    if (end < start) return rangeError(400, 'Range header: start must be less than end');
    result.push([start, end]);
  }
  result.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of result) { const last = merged.at(-1); if (last && range[0] <= last[1] + 1) last[1] = Math.max(last[1], range[1]); else merged.push(range); }
  return merged;
}
export async function serveServerStatic(request: FastifyRequest, reply: FastifyReply, options: { frontend?: string; assets: string }, path: string, query: string): Promise<FastifyReply> {
  if (!options.frontend) return missing();
  if (!['GET', 'HEAD'].includes(request.method)) throw new ServerHttpError(404, serverNotFound, { allow: 'GET, HEAD' });
  const asset = path === '/assets' || path.startsWith('/assets/');
  if (path === '/assets') return reply.code(307).header('content-length', '0').header('location', serverLocation(request, '/assets/' + query)).send();
  if (asset && !publicAssets.has(path.slice(8))) return missing();
  let file = await locate(asset ? options.assets : options.frontend, asset ? path.slice(7) : path);
  if (file?.info.isDirectory()) {
    const index = await locate(options.frontend, path + '/index.html');
    if (index?.info.isFile()) {
      if (!path.endsWith('/')) return reply.code(307).header('content-length', '0').header('location', serverLocation(request, path + '/' + query)).send();
      file = index;
    }
  }
  let status = 200;
  if (!file?.info.isFile()) { file = asset ? null : await locate(options.frontend, '/404.html'); status = 404; }
  if (!file?.info.isFile()) return missing();
  const size = Number(file.info.size), { date, etag } = modified(file.info);
  const media = frontendMime(extname(file.path)) ?? 'text/plain', contentType = media.startsWith('text/') ? media + '; charset=utf-8' : media;
  reply.code(status).header('content-type', contentType).header('content-length', String(size)).header('last-modified', date).header('etag', etag).header('accept-ranges', 'bytes');
  const noneMatch = request.headers['if-none-match'], since = request.headers['if-modified-since'];
  const unchanged = typeof noneMatch === 'string' ? noneMatch.trim() === '*' || noneMatch.split(',').some(tag => tag.trim().replace(/^W\//, '') === etag) : typeof since === 'string' && /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(since) && /\b\d{1,2}:\d{2}/.test(since) && Number.isFinite(Date.parse(since)) && Date.parse(since) >= Date.parse(date);
  if (unchanged) { reply.removeHeader('content-length'); reply.removeHeader('last-modified'); reply.removeHeader('accept-ranges'); reply.removeHeader('content-type'); return reply.code(304).send(); }
  const range = request.headers.range, ifRange = request.headers['if-range'];
  if (typeof range === 'string' && (ifRange === undefined || ifRange === etag || ifRange === date)) {
    const parts = ranges(range, size);
    if (parts.length === 1) {
      const [start, end] = parts[0]!; reply.code(206).header('content-range', 'bytes ' + start + '-' + end + '/' + size).header('content-length', String(end - start + 1));
      return reply.send(request.method === 'HEAD' ? undefined : createReadStream(file.path, { start, end }));
    }
    // FileResponse's multipart byte ranges use a fresh boundary for each response.
    const boundary = createHash('sha256').update(String(Math.random())).digest('hex').slice(0, 26);
    const chunks: Buffer[] = [];
    for (const [start, end] of parts) {
      chunks.push(Buffer.from('--' + boundary + '\r\nContent-Type: ' + contentType + '\r\nContent-Range: bytes ' + start + '-' + end + '/' + size + '\r\n\r\n'));
      if (request.method !== 'HEAD') for await (const chunk of createReadStream(file.path, { start, end })) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      else chunks.push(Buffer.alloc(end - start + 1));
      chunks.push(Buffer.from('\r\n'));
    }
    chunks.push(Buffer.from('--' + boundary + '--'));
    const body = Buffer.concat(chunks);
    return reply.code(206).header('content-type', 'multipart/byteranges; boundary=' + boundary).header('content-length', String(body.length)).send(request.method === 'HEAD' ? undefined : body);
  }
  return reply.send(request.method === 'HEAD' ? undefined : createReadStream(file.path));
}
