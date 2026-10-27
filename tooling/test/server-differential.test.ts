import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Invalid, isJsonObject } from '@letsduck/domain';
import { ExportBusy } from '@letsduck/exporter';
import { ServerStore } from '@letsduck/storage';
import { createServerHttp } from '../../packages/host/src/server-http.js';
import type { ServerExporter } from '../../packages/host/src/server-http.js';

interface OracleResponse {
  status: number;
  headers: Record<string, string>;
  contentBase64: string;
  multipart?: { boundary: string; parts: { headers: Record<string, string>; contentBase64: string }[] };
}
interface OracleCase {
  id: string;
  request: { method: string; url: string; headers: Record<string, string>; contentBase64: string | null };
  scope: { path: string; rawPath: string; query: string };
  response: OracleResponse;
}
interface OracleScenario {
  name: string;
  fixtures: { root: string; path: string; contentBase64: string; mtime: number }[];
  symlinks: { root: string; path: string; target: string }[];
  fakeExporter: boolean;
  withStatic: boolean;
  cases: OracleCase[];
}
interface Oracle { schema: string; runtime: Record<string, string>; scenarios: OracleScenario[] }
interface Difference { scenario: string; id: string; field: string; expected: unknown; actual: unknown }
const comparableHeaders = ['content-type', 'content-length', 'last-modified', 'etag', 'accept-ranges', 'content-range', 'location', 'allow', 'cache-control', 'x-content-type-options', 'retry-after'];
const decode = (value: string) => Buffer.from(value, 'base64');
function boundary(headers: Record<string, unknown>): string | undefined {
  const source = String(headers['content-type'] ?? '') + ' ' + String(headers['content-range'] ?? '');
  return /boundary=([^;\s]+)/.exec(source)?.[1]?.replace(/^"|"$/g, '');
}
function normalizeBoundary(value: string | undefined, current: string | undefined): string | undefined { return current && value !== undefined ? value.split(current).join('BOUNDARY') : value; }
function multipart(body: Buffer, value: string) {
  const sections = body.toString('latin1').split('--' + value);
  assert.equal(sections.shift(), '', 'multipart preamble');
  assert.match(sections.pop() ?? '', /^--(?:\r\n|\n)?$/, 'multipart closing delimiter');
  return sections.map(section => {
    const frame = section.replace(/^\r?\n/, ''), separator = /\r?\n\r?\n/.exec(frame);
    assert.ok(separator, 'multipart header separator');
    const headers = Object.fromEntries(frame.slice(0, separator.index).split(/\r?\n/).map(line => {
      const colon = line.indexOf(':'); assert.ok(colon > 0, 'multipart field');
      return [line.slice(0, colon).toLowerCase(), line.slice(colon + 1).trim().replace(/charset="([^"]+)"/i, 'charset=$1')];
    }));
    const content = frame.slice(separator.index + separator[0].length).replace(/\r?\n$/, '');
    return { headers, contentBase64: Buffer.from(content, 'latin1').toString('base64') };
  });
}

// Only the historical preflight/admission boundary is synthetic in this scenario.
const busyExporter: ServerExporter = {
  available: true, catalog: { products: [] }, sourceSha256: 'synthetic',
  plan(body: unknown) { if (!isJsonObject(body) || body.preflight !== 'ok') throw new Invalid('Synthetic preflight rejected', 'export.20'); return { fixture: 'preflight-ok' }; },
  async run() { throw new ExportBusy(); },
};

test('server matches the frozen independent Python ASGI oracle for all replayed protocol cases', async context => {
  const oracle = JSON.parse(readFileSync(new URL('./oracles/server-http.json',import.meta.url),'utf8')) as Oracle; assert.equal(oracle.schema, 'letsduck-server-http-oracle/1');
  const differences: Difference[] = []; let cases = 0;
  for (const scenario of oracle.scenarios) {
    const root = await mkdtemp(join(tmpdir(), 'duck-server-differential-'));
    const store = await ServerStore.open({ database: join(root, 'node.db') });
    let app: ReturnType<typeof createServerHttp> | undefined;
    try {
      for (const item of scenario.fixtures) {
        const path = join(item.root === 'outside' ? root : join(root, item.root), item.path);
        await mkdir(resolve(path, '..'), { recursive: true }); await writeFile(path, decode(item.contentBase64)); await utimes(path, item.mtime, item.mtime);
      }
      for (const item of scenario.symlinks) {
        const path = join(root, item.root, item.path); await mkdir(resolve(path, '..'), { recursive: true }); await symlink(item.target, path);
      }
      app = createServerHttp({ store, assets: join(root, 'assets'), ...(scenario.withStatic ? { frontend: join(root, 'frontend') } : {}), publicUrl: 'https://example.invalid', quiet: true, ...(scenario.fakeExporter ? { exporter: busyExporter } : {}) });
      let originalPath = '/';
      // light-my-request runs URL canonicalization before Fastify. Restore the actual
      // raw_path/query recorded by Python so both adapters receive the same target.
      app.addHook('onRequest', async request => { request.raw.url = originalPath; });
      await app.ready();
      for (const item of scenario.cases) {
        cases++;
        await context.test(scenario.name + '/' + item.id, async () => {
          const current: Difference[] = [];
          const add = (field: string, expected: unknown, actual: unknown) => current.push({ scenario: scenario.name, id: item.id, field, expected, actual });
          originalPath = item.scope.rawPath + (item.scope.query ? '?' + item.scope.query : '');
          const request = item.request;
          const response = await app!.inject({ method: request.method, url: request.url, headers: { host: 'testserver', ...request.headers }, ...(request.contentBase64 === null ? {} : { payload: decode(request.contentBase64) }) });
          const expected = item.response, expectedBoundary = expected.multipart?.boundary, actualBoundary = boundary(response.headers);
          if (response.statusCode !== expected.status) add('status', expected.status, response.statusCode);
          for (const header of comparableHeaders) {
            const raw = response.headers[header];
            let actual = normalizeBoundary(raw === undefined ? undefined : String(raw), actualBoundary);
            let want = normalizeBoundary(expected.headers[header], expectedBoundary);
            // Allow is a method set; Starlette's set iteration changes wire order
            // across Python hash seeds, without changing the allowed methods.
            if (header === 'allow') {
              const methods = (value: string | undefined) => value?.split(',').map(method => method.trim()).sort().join(', ');
              actual = methods(actual); want = methods(want);
            }
            if (actual !== want) add('header.' + header, want ?? null, actual ?? null);
          }
          const expectedBody = normalizeBoundary(decode(expected.contentBase64).toString('latin1'), expectedBoundary)!;
          const actualBody = normalizeBoundary(response.rawPayload.toString('latin1'), actualBoundary)!;
          if (actualBody !== expectedBody) add('body.base64', Buffer.from(expectedBody, 'latin1').toString('base64'), Buffer.from(actualBody, 'latin1').toString('base64'));
          if (expected.multipart) {
            if (!actualBoundary) add('multipart.boundary', 'present', null);
            else {
              try {
                const actual = multipart(response.rawPayload, actualBoundary);
                const wanted = expected.multipart.parts.map(part => ({ ...part, headers: Object.fromEntries(Object.entries(part.headers).map(([name, value]) => [name, value.replace(/charset="([^"]+)"/i, 'charset=$1')])) }));
                try { assert.deepEqual(actual, wanted); } catch { add('multipart.parts', wanted, actual); }
              } catch (error) { add('multipart.parse', 'valid complete byte-range parts', error instanceof Error ? error.message : String(error)); }
            }
          }
          differences.push(...current);
          assert.deepEqual(current, [], JSON.stringify(current));
        });
      }
    } finally { if (app) { await app.waitRequests(); await app.close(); assert.equal(app.server.address(), null); } await store.close(); await rm(root, { recursive: true, force: true }); }
  }
  const report = { oracle: oracle.runtime, cases, differingCases: new Set(differences.map(item => item.scenario + '/' + item.id)).size, differences };
  if (process.env.DUCK_SERVER_DIFFERENTIAL_REPORT) await writeFile(process.env.DUCK_SERVER_DIFFERENTIAL_REPORT, JSON.stringify(report, null, 2));
  context.diagnostic(`Independent server differential: ${cases} cases, ${report.differingCases} differ, ${differences.length} field differences`);
});
