import { Context } from '@deepseek-ai/cordis';
import { AdbRuntime, DuckDebug, ServoSetup } from '@letsduck/devices';
import type { DuckRuntime } from '@letsduck/devices';
import { ExportManager } from '@letsduck/exporter';
import { PersonalStore } from '@letsduck/storage';
import { pythonInteger, pythonStrip } from '@letsduck/domain';
import type { FastifyInstance } from 'fastify';
import { createPersonalHttp } from './http.js';
import type { HostExporter } from './http-types.js';

interface HostAssets { partIds: string[]; exporter: HostExporter }
interface HostDevices { setup: ServoSetup; debug: DuckDebug }
declare module '@deepseek-ai/cordis' {
  interface Context { duckExports: ExportManager; duckAssets: HostAssets; duckStore: PersonalStore; duckDevices: HostDevices; duckHttp: FastifyInstance }
}
export interface HostOptions {
  assets: string;
  frontend: string;
  database?: string;
  legacy?: string;
  runtime?: DuckRuntime;
  uiOrigin?: string;
  host?: string;
  port?: number;
  search?: number;
}

export function parseListenPort(value: string): number {
  try {
    if (!pythonStrip(value)) throw new Error('Empty port');
    const port = Number(pythonInteger(value));
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port out of range');
    return port;
  } catch { throw new RangeError('端口必须是0–65535的整数。'); }
}

export async function startHost(options: HostOptions) {
  const host = options.host ?? '127.0.0.1', port = options.port ?? 0, search = options.search ?? 20;
  if (!Number.isInteger(port) || port < 0 || port > 65535 || !Number.isInteger(search) || search < 1) throw new RangeError('Invalid local listening port or search count');
  const root = new Context();
  let exports: ExportManager | undefined, store: PersonalStore | undefined, devices: HostDevices | undefined, http: FastifyInstance | undefined;
  let closing = false, drained: Promise<void> | undefined, stopped: Promise<void> | undefined;
  const drain = () => drained ??= (async () => {
    closing = true;
    const errors: unknown[] = [];
    const attempt = async (operation: () => unknown) => { try { await operation(); } catch (error) { errors.push(error); } };
    const requests = http ? http.close().catch(error => { errors.push(error); }) : Promise.resolve();
    await attempt(() => devices?.debug.stopBackground());
    await attempt(() => devices?.setup.stopBackground());
    await requests;
    await attempt(() => exports?.close());
    await attempt(() => devices?.debug.close());
    await attempt(() => devices?.setup.close());
    await attempt(() => store?.close());
    if (errors.length) throw new AggregateError(errors, 'Local service cleanup failed');
  })();
  root.effect(() => () => drain());
  const close = () => stopped ??= (async () => { try { await drain(); } finally { await root.fiber.dispose(); } })();
  try {
    await root.plugin({ name: 'duck-exports', async apply(ctx) {
      exports = new ExportManager({ assets: options.assets });
      await exports.ready;
      ctx.provide('duckExports', exports);
    } });
    await root.plugin({ name: 'duck-assets', inject: ['duckExports'], apply(ctx) {
      const manager = ctx.duckExports, metadata = manager.metadata;
      if (manager.available && !metadata) throw new Error('Export worker did not provide validated asset metadata');
      const exporter: HostExporter = {
        get available() { return manager.available; },
        catalog: metadata?.catalog ?? null,
        sourceSha256: metadata?.sourceSha256 ?? null,
        run: manager.run.bind(manager),
      };
      ctx.provide('duckAssets', { partIds: metadata?.partIds ?? [], exporter });
    } });
    await root.plugin({ name: 'duck-store', inject: ['duckAssets'], apply(ctx) {
      store = new PersonalStore({ partIds: ctx.duckAssets.partIds, ...(options.database === undefined ? {} : { path: options.database }), ...(options.legacy === undefined ? {} : { legacy: options.legacy }) });
      ctx.provide('duckStore', store);
    } });
    await root.plugin({ name: 'duck-devices', inject: ['duckStore'], apply(ctx) {
      const setup = new ServoSetup(ctx.duckStore, options.runtime ?? new AdbRuntime());
      devices = { setup, debug: new DuckDebug(ctx.duckStore, setup) };
      ctx.provide('duckDevices', devices);
    } });
    await root.plugin({ name: 'duck-http', inject: ['duckAssets', 'duckStore', 'duckDevices', 'duckExports'], async apply(ctx) {
      const server = http = createPersonalHttp({ assets: options.assets, frontend: options.frontend, store: ctx.duckStore, setup: ctx.duckDevices.setup, debug: ctx.duckDevices.debug, exporter: ctx.duckAssets.exporter, listenHost: host, ...(options.uiOrigin === undefined ? {} : { uiOrigin: options.uiOrigin }) });
      server.addHook('onRequest', async (_request, reply) => {
        if (closing) return reply.code(503).type('application/json; charset=utf-8').send({ error: '服务正在关闭，请稍后重试', code: 'request.failed', params: {} });
      });
      server.addHook('onResponse', async request => {
        // A response completed after close() must not start another 72s keep-alive.
        if (closing && request.raw.socket.writable && !request.raw.socket.writableEnded) request.raw.socket.end();
      });
      for (let attempt = 0; attempt < (port === 0 ? 1 : search); attempt++) {
        try { await server.listen({ host: host === '' ? '0.0.0.0' : host, port: port === 0 ? 0 : port + attempt }); break; }
        catch (error) { if (port === 0 || attempt === search - 1 || !(error instanceof Error) || !('code' in error) || error.code !== 'EADDRINUSE') throw error; }
      }
      ctx.provide('duckHttp', server);
    } });
    if (!root.duckHttp || !store || !exports) throw new Error('Local service did not become ready');
    const server = root.duckHttp, address = server.server.address();
    if (!address || typeof address === 'string') throw new Error('Local service has no TCP listener');
    const display = host === '0.0.0.0' || host === '' ? '127.0.0.1' : host === '::' ? '::1' : host;
    const url = `http://${display.includes(':') ? '[' + display + ']' : display}:${address.port}/`;
    return { url, http: server, storePath: store.path, imported: store.imported, get busy() { return exports!.busy; }, get exportAvailable() { return exports!.available; }, close };
  } catch (error) {
    try { await close(); } catch (cleanup) { throw new AggregateError([error, cleanup], 'Local service startup and cleanup failed'); }
    throw error;
  }
}
