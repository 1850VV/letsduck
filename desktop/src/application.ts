import { Context } from '@deepseek-ai/cordis';
import { Assets } from './services/assets.js';
import { PersonalStore } from './services/schemes.js';
import { Exports } from './services/exports.js';
import { serve } from './services/http.js';

export interface HostOptions { assets: string; frontend: string; db?: string; legacy?: string; assembly: string[]; version: string; port?: number }
declare module '@deepseek-ai/cordis' {
  interface Context { assets: Assets; schemes: PersonalStore; exports: Exports; http: Awaited<ReturnType<typeof serve>> }
}

export async function startHost(options: HostOptions) {
  const root = new Context();
  try {
    await root.plugin(ctx => { ctx.provide('assets', new Assets(options.assets, options.frontend, options.assembly)); });
    await root.plugin({ name: 'schemes', inject: ['assets'], apply(ctx) {
      const store = new PersonalStore(options.db, ctx.assets.partIds, options.legacy);
      ctx.effect(() => () => store.close()); ctx.provide('schemes', store);
    } });
    await root.plugin({ name: 'exports', inject: ['assets'], async apply(ctx) {
      const exports = new Exports(options.assets); ctx.effect(() => () => exports.close());
      await exports.ready; ctx.provide('exports', exports);
    } });
    await root.plugin({ name: 'http', inject: ['assets', 'schemes', 'exports'], async apply(ctx) {
      const http = await serve(ctx.assets, ctx.schemes, ctx.exports, options.version, options.port);
      ctx.effect(() => () => http.close()); ctx.provide('http', http);
    } });
    if (!root.http) throw new Error('Local service did not become ready');
    const http = root.http, exports = root.exports; let stopped: Promise<void> | undefined;
    return { url: http.url, get busy() { return exports.busy; }, close() {
      // Drain HTTP first: unloading independent fibers alone does not order async cleanup.
      return stopped ??= (async () => { await http.close(); await exports.close(); await root.fiber.dispose(); })();
    } };
  } catch (e) { await root.fiber.dispose(); throw e; }
}
