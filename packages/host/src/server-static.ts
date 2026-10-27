import { createHash, randomBytes } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pythonInteger, pythonStrip } from '@letsduck/domain';
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
  const split = header.indexOf('=');
  if (split < 0) return rangeError(400, 'Malformed range header.');
  if (pythonStrip(header.slice(0, split)).toLowerCase() !== 'bytes') return rangeError(400, 'Only support bytes range');
  const fragments = header.slice(split + 1).split(','); if (fragments.length > 100) return [];
  const parsed: Array<[bigint, bigint]> = [], length = BigInt(size);
  const integer = (value: string) => { if (!value) throw new Error('Empty range integer'); return BigInt(pythonInteger(value)); };
  for (const value of fragments) {
    const part = pythonStrip(value), dash = part.indexOf('-');
    if (!part || part === '-' || dash < 0) continue;
    const startText = pythonStrip(part.slice(0, dash)), endText = pythonStrip(part.slice(dash + 1));
    try {
      const suffix = !startText ? length - integer(endText) : 0n;
      const start = startText ? integer(startText) : suffix > 0n ? suffix : 0n;
      const end = startText && endText && integer(endText) < length ? integer(endText) + 1n : length;
      parsed.push([start, end]);
    } catch { /* The legacy parser ignores invalid individual fragments. */ }
  }
  if (!parsed.length) return rangeError(400, 'Range header: range must be requested');
  if (parsed.some(([start]) => start < 0n || start >= length)) return rangeError(416, '', { 'content-range': 'bytes */' + size });
  if (parsed.some(([start, end]) => start >= end)) return rangeError(400, 'Range header: start must be less than end');
  const result = parsed.map(([start, end]): [number, number] => [Number(start), Number(end - 1n)]).sort((a, b) => a[0] - b[0]);
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
  if (status === 200 && unchanged) { reply.removeHeader('content-length'); reply.removeHeader('last-modified'); reply.removeHeader('accept-ranges'); reply.removeHeader('content-type'); return reply.code(304).send(); }
  const range = request.headers.range, ifRange = request.headers['if-range'];
  if (status === 200 && typeof range === 'string' && (ifRange === undefined || ifRange === etag || ifRange === date)) {
    const parts = ranges(range, size);
    if (parts.length === 1) {
      const [start, end] = parts[0]!; reply.code(206).header('content-range', 'bytes ' + start + '-' + end + '/' + size).header('content-length', String(end - start + 1));
      return reply.send(request.method === 'HEAD' ? undefined : createReadStream(file.path, { start, end }));
    }
    if (parts.length > 1) {
      const boundary = randomBytes(13).toString('hex'), ending = Buffer.from('--' + boundary + '--');
      const headers = parts.map(([start, end]) => Buffer.from('--' + boundary + '\r\nContent-Type: ' + contentType + '\r\nContent-Range: bytes ' + start + '-' + end + '/' + size + '\r\n\r\n'));
      const contentLength = parts.reduce((total, [start, end], index) => total + headers[index]!.length + end - start + 1 + 2, ending.length);
      reply.code(206).header('content-type', 'multipart/byteranges; boundary=' + boundary).header('content-length', String(contentLength));
      if (request.method === 'HEAD') return reply.send();
      const path = file.path;
      async function* content() {
        for (let index = 0; index < parts.length; index++) {
          yield headers[index]!; const [start, end] = parts[index]!;
          for await (const chunk of createReadStream(path, { start, end })) yield chunk as Buffer;
          yield Buffer.from('\r\n');
        }
        yield ending;
      }
      return reply.send(Readable.from(content()));
    }
  }
  return reply.send(request.method === 'HEAD' ? undefined : createReadStream(file.path));
}
