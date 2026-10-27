import { Context } from '@deepseek-ai/cordis';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { ExportManager, Planner } from '@letsduck/exporter';
import { ServerStore } from '@letsduck/storage';
import { pythonInteger, pythonStrip } from '@letsduck/domain';
import { parseListenPort } from './listen.js';
import { createServerHttp } from './server-http.js';
import type { ServerExporter } from './server-http.js';
import type { PersonalHttpServer } from './http-types.js';

declare module '@deepseek-ai/cordis' {
  interface Context { serverExports: ExportManager; serverAssets: { partIds: string[]; exporter: ServerExporter }; serverStore: ServerStore; serverHttp: PersonalHttpServer }
}
export interface ServerOptions {
  assets: string;
  frontend?: string;
  database?: string;
  legacy?: string;
  host?: string;
  port?: number;
  exportWorkers?: number;
  exportQueue?: number;
  httpLimit?: number;
  quiet?: boolean;
  publicUrl?: string;
}
function environmentInteger(name: string, fallback: string): number {
  const value = process.env[name] ?? fallback;
  if (!pythonStrip(value)) throw new RangeError(name + ' must be an integer');
  const result = pythonInteger(value); if (typeof result !== 'number') throw new RangeError(name + ' is out of range'); return result;
}
/** A mode switch must never silently expose an empty MySQL site over legacy accounts. */
export async function checkLegacyAccounts(store: ServerStore, source: string): Promise<void> {
  if (store.db.dialect !== 'mysql' || !existsSync(source)) return;
  const legacy = new DatabaseSync(resolve(source), { readOnly: true, timeout: 5000 });
  let oldUsers: unknown;
  try { const statement = legacy.prepare('SELECT COUNT(*) AS n FROM users'); statement.setReadBigInts(true); oldUsers = statement.get()?.n; }
  finally { legacy.close(); }
  const target = await store.db.transaction(connection => connection.rows('SELECT COUNT(*) AS n FROM users'));
  if (typeof oldUsers !== 'bigint' || !target[0]) throw new Error('Cannot verify legacy account migration');
  if (oldUsers > 0n && BigInt(target[0].n!) === 0n) throw new Error('Existing SQLite accounts require node tooling/dist/migrate-database.js before MySQL startup');
}

/** Cordis composes server storage and workers; no hardware services are constructed. */
export async function startServer(options: ServerOptions) {
  const host = options.host ?? process.env.HOST ?? '127.0.0.1', port = options.port ?? parseListenPort(process.env.PORT ?? '8876');
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new RangeError('Invalid server listening port');
  const workers = options.exportWorkers ?? environmentInteger('DUCK_EXPORT_WORKERS', '1'), queueSize = options.exportQueue ?? environmentInteger('DUCK_EXPORT_QUEUE', '2');
  const httpLimit = options.httpLimit ?? environmentInteger('DUCK_HTTP_LIMIT', '64');
  const root = new Context();
  let exports: ExportManager | undefined, store: ServerStore | undefined, http: PersonalHttpServer | undefined;
  let closing = false, drained: Promise<void> | undefined, stopped: Promise<void> | undefined;
  const drain = () => drained ??= (async () => {
    closing = true; const errors: unknown[] = [];
    const attempt = async (operation: () => unknown) => { try { await operation(); } catch (error) { errors.push(error); } };
    // Match the old 60-second graceful HTTP budget. Abort sockets, then still await
    // accepted SQL/worker work before releasing the resources it can use.
    const deadline = setTimeout(() => http?.server.closeAllConnections(), 60_000); deadline.unref();
    try { await attempt(() => http?.waitRequests()); await attempt(() => http?.close()); }
    finally { clearTimeout(deadline); }
    await attempt(() => exports?.close()); await attempt(() => store?.close());
    if (errors.length) throw new AggregateError(errors, 'Server cleanup failed');
  })();
  root.effect(() => () => drain());
  const close = () => stopped ??= (async () => { try { await drain(); } finally { await root.fiber.dispose(); } })();
  try {
    await root.plugin({ name: 'server-exports', async apply(ctx) {
      exports = new ExportManager({ assets: options.assets, workers, queueSize }); await exports.ready; ctx.provide('serverExports', exports);
    } });
    await root.plugin({ name: 'server-assets', inject: ['serverExports'], apply(ctx) {
      const manager = ctx.serverExports, metadata = manager.metadata, available = manager.available;
      if (available && !metadata) throw new Error('Export worker did not provide validated planning metadata');
      const planner = available && metadata ? new Planner(metadata) : null;
      const exporter: ServerExporter = {
        // Asset capability survives a failed pool, just as Python's parent exporter did.
        available, catalog: metadata?.catalog ?? null, sourceSha256: metadata?.sourceSha256 ?? null,
        plan(body) { if (!planner) throw new Error('Planner unavailable'); return planner.plan(body, new Date().toISOString()); },
        async run(body, signal) { const content = await manager.run('export', body, signal); if (!Buffer.isBuffer(content)) throw new Error('Export worker returned an invalid archive'); return content; },
      };
      ctx.provide('serverAssets', { partIds: metadata?.partIds ?? [], exporter });
    } });
    await root.plugin({ name: 'server-store', inject: ['serverAssets'], async apply(ctx) {
      store = await ServerStore.open({ partIds: ctx.serverAssets.partIds, ...(options.database === undefined ? {} : { database: options.database }) });
      await checkLegacyAccounts(store, options.legacy ?? process.env.DUCK_DB ?? resolve(import.meta.dirname, '../../../backend/data/doodleduck.db'));
      ctx.provide('serverStore', store);
    } });
    await root.plugin({ name: 'server-http', inject: ['serverAssets', 'serverStore'], async apply(ctx) {
      const server = http = createServerHttp({ assets: options.assets, store: ctx.serverStore, exporter: ctx.serverAssets.exporter, httpLimit,
        publicUrl: options.publicUrl ?? process.env.DUCK_PUBLIC_URL ?? '', quiet: options.quiet ?? process.env.DUCK_QUIET === '1',
        ...(options.frontend === undefined ? {} : { frontend: options.frontend }),
      });
      server.addHook('onRequest', async (_request, reply) => {
        if (closing) return reply.code(503).type('application/json; charset=utf-8').send({ error: '服务正在关闭，请稍后重试', code: 'request.failed', params: {} });
      });
      await server.listen({ host: host === '' ? '0.0.0.0' : host, port }); ctx.provide('serverHttp', server);
    } });
    if (!root.serverHttp || !store || !exports) throw new Error('Server did not become ready');
    const server = root.serverHttp, address = server.server.address(); if (!address || typeof address === 'string') throw new Error('Server has no TCP listener');
    const display = host === '0.0.0.0' || host === '' ? '127.0.0.1' : host === '::' ? '::1' : host;
    const url = 'http://' + (display.includes(':') ? '[' + display + ']' : display) + ':' + address.port + '/';
    return { url, http: server, get exportAvailable() { return root.serverAssets.exporter.available; }, close };
  } catch (error) {
    try { await close(); } catch (cleanup) { throw new AggregateError([error, cleanup], 'Server startup and cleanup failed'); }
    throw error;
  }
}
