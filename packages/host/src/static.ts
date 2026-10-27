import { readFileSync } from 'node:fs';
import { open, readFile, stat } from 'node:fs/promises';
import type { Stats } from 'node:fs';
import { dirname, extname, join, posix, resolve } from 'node:path';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { jsonStringify } from '@letsduck/storage';
import type { AssemblyManifest, PersonalHttpOptions } from './http-types.js';

const publicAssets = new Set(['model.json', 'catalog.json', 'geometry.bin', 'geometry.pack.bin', 'geometry.positions.bin', 'export-schema.json']);
const kinds: Readonly<Record<string, string>> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.bin': 'application/octet-stream', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
const frontendKinds: Readonly<Record<string, string>> = { '.htm': 'text/html', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.py': 'text/x-python', '.conf': 'text/plain', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };
const missingAsset = { error: '资产不存在', code: 'request.asset_missing', params: {} };

export function sendBody(request: FastifyRequest, reply: FastifyReply, status: number, data: unknown, contentType = 'application/json; charset=utf-8', headers: Record<string, string> = {}): FastifyReply {
  const bytes = Buffer.isBuffer(data) ? data : Buffer.from(jsonStringify(data));
  reply.code(status).header('content-type', contentType).header('content-length', String(bytes.length)).headers(headers);
  return reply.send(request.method === 'HEAD' ? undefined : bytes);
}
export function redirect(reply: FastifyReply, status: number, location: string): FastifyReply {
  return reply.code(status).header('location', location).header('content-length', '0').send();
}
export function htmlError(request: FastifyRequest, reply: FastifyReply, status: 404 | 501): FastifyReply {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const message = status === 404 ? 'File not found' : `Unsupported method ('${request.method}')`;
  const explanation = status === 404 ? 'Nothing matches the given URI' : 'Server does not support this operation';
  const body = `<!DOCTYPE HTML>\n<html lang="en">\n    <head>\n        <meta charset="utf-8">\n        <title>Error response</title>\n    </head>\n    <body>\n        <h1>Error response</h1>\n        <p>Error code: ${status}</p>\n        <p>Message: ${escape(message)}.</p>\n        <p>Error code explanation: ${status} - ${explanation}.</p>\n    </body>\n</html>\n`;
  reply.header('connection', 'close');
  return sendBody(request, reply, status, Buffer.from(body), 'text/html;charset=utf-8');
}
async function fileStat(path: string): Promise<Stats | null> { try { return await stat(path); } catch (error) { if (error instanceof Error && 'code' in error && ['ENOENT', 'ENOTDIR'].includes(String(error.code))) return null; throw error; } }
function mime(path: string, frontend = false): string { const suffix = extname(path); return kinds[suffix] ?? (frontend ? kinds[suffix.toLowerCase()] ?? frontendKinds[suffix.toLowerCase()] : undefined) ?? 'application/octet-stream'; }
function stamp(info: Stats): string { return new Date(Math.floor(info.mtimeMs / 1000) * 1000).toUTCString(); }
function loadManifest(frontend: string): AssemblyManifest | undefined {
  try {
    const manifest: unknown = JSON.parse(readFileSync(resolve(frontend, '../scripts/assembly-assets.json'), 'utf8'));
    if (manifest && typeof manifest === 'object' && 'files' in manifest && manifest.files && typeof manifest.files === 'object' && !Array.isArray(manifest.files)) return manifest as AssemblyManifest;
  } catch { /* A programmatic host can run without an assembly bundle. */ }
  return undefined;
}
function decodePath(path: string): string {
  return path.replace(/(?:%[a-f\d]{2})+/ig, encoded => Buffer.from(encoded.replace(/%/g, ''), 'hex').toString('utf8'));
}
async function sendFile(request: FastifyRequest, reply: FastifyReply, target: string, info: Stats, frontend: boolean, range = false): Promise<FastifyReply> {
  const modified = stamp(info);
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(request.headers.range ?? '').trim());
    if (match && (match[1] || match[2])) {
      const size = BigInt(info.size), start = match[1] ? BigInt(match[1]) : size > BigInt(match[2]!) ? size - BigInt(match[2]!) : 0n;
      const end = match[1] ? match[2] ? BigInt(match[2]) < size - 1n ? BigInt(match[2]) : size - 1n : start + 4194304n < size ? start + 4194304n - 1n : size - 1n : size - 1n;
      if (start >= size || start > end) return sendBody(request, reply, 416, Buffer.alloc(0), mime(target), { 'content-range': `bytes */${size}` });
      const bytes = Buffer.alloc(Number(end - start + 1n));
      const handle = await open(target, 'r');
      try { let offset = 0; while (offset < bytes.length) { const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, Number(start) + offset); if (!bytesRead) break; offset += bytesRead; } }
      finally { await handle.close(); }
      return sendBody(request, reply, 206, bytes, mime(target), { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}` });
    }
  }
  const since = request.headers['if-modified-since'];
  let unchanged = since === modified;
  if (frontend) {
    const httpDate = typeof since === 'string' && /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(since) && /\b\d{1,2}:\d{2}(?::\d{2})?\b/.test(since);
    const date = httpDate ? Date.parse(/\d{4}$/.test(since.trim()) ? since + ' GMT' : since) : NaN;
    // The inherited Python handler ignores non-UTC dates and disables this check for If-None-Match.
    const utc = typeof since === 'string' && !/(?:[+-](?!0000)\d{4}|\b(?:PST|PDT|MST|MDT|CST|CDT|EST|EDT))\s*$/i.test(since);
    unchanged = !Object.hasOwn(request.headers, 'if-none-match') && utc && Number.isFinite(date) && date >= Math.floor(info.mtimeMs / 1000) * 1000;
  }
  if (unchanged) { if (!frontend) reply.header('last-modified', modified); return reply.code(304).send(); }
  return sendBody(request, reply, 200, await readFile(target), mime(target, frontend), { 'last-modified': modified, ...(range ? { 'accept-ranges': 'bytes' } : {}) });
}

export function personalStatic(options: PersonalHttpOptions) {
  const manifest = options.assemblyManifest ?? loadManifest(options.frontend);
  const assemblyFiles = new Set(Object.keys(manifest?.files ?? {}));
  const allAssembly = new Set([...assemblyFiles, ...Object.keys(manifest?.optionalFiles ?? {})]);
  return {
    async assemblyReady(): Promise<boolean> {
      if (!manifest || !(await fileStat(join(options.frontend, 'assemble', 'index.html')))?.isFile()) return false;
      return (await Promise.all([...assemblyFiles].map(name => fileStat(join(options.assets, 'assembly', name))))).every(info => info?.isFile());
    },
    async serve(request: FastifyRequest, reply: FastifyReply, path: string): Promise<FastifyReply> {
      if (request.method === 'GET' && ['/assemble', '/assemble/index.html'].includes(path.replace(/\/+$/, '')) && !(await options.debug.numbering()).ready) return redirect(reply, 303, '/debug/?from=assemble');
      if (path.replace(/\/+$/, '') === '/gallery' || path.startsWith('/gallery/')) return redirect(reply, 303, '/');
      if (path === '/paint/') return redirect(reply, 308, '/paint');
      if (path.startsWith('/assets/') || path.startsWith('/assemble/assets/')) {
        const assembly = path.startsWith('/assemble/assets/'), name = path.slice(assembly ? '/assemble/assets/'.length : '/assets/'.length);
        if (!(assembly ? allAssembly : publicAssets).has(name)) return sendBody(request, reply, 404, missingAsset);
        const target = join(options.assets, ...(assembly ? ['assembly'] : []), name), info = await fileStat(target);
        if (!info?.isFile()) return sendBody(request, reply, 404, missingAsset);
        return sendFile(request, reply, target, info, false, assembly);
      }
      const mapped = path === '/' ? '/home.html' : path === '/paint' ? '/index.html' : path;
      const segments = posix.normalize(decodePath(mapped)).split('/').filter(segment => segment && segment !== '.' && segment !== '..' && dirname(segment) === '.');
      let target = join(options.frontend, ...segments), info = await fileStat(target);
      if (info?.isDirectory()) {
        if (!path.endsWith('/')) { const queryIndex = request.raw.url?.indexOf('?') ?? -1; return redirect(reply, 301, path + '/' + (queryIndex >= 0 ? request.raw.url!.slice(queryIndex) : '')); }
        for (const index of ['index.html', 'index.htm']) { const candidate = join(target, index), candidateInfo = await fileStat(candidate); if (candidateInfo?.isFile()) { target = candidate; info = candidateInfo; break; } }
        if (!info.isFile()) return sendBody(request, reply, 404, { error: '文件不存在', code: 'request.not_found', params: {} });
      }
      return info?.isFile() ? sendFile(request, reply, target, info, true) : htmlError(request, reply, 404);
    },
  };
}
