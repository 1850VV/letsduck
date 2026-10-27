import { readJsonField } from '@letsduck/domain';
import { UNHANDLED } from './server-context.js';
import type { ServerApiContext } from './server-context.js';

/** Account and private-scheme routes; storage owns validation and transactions. */
export async function serverAccounts(ctx: ServerApiContext): Promise<unknown> {
  const { method, path, store } = ctx;
  if (method === 'POST' && path === '/api/auth/register') {
    const body = await ctx.readJson();
    return store.register(readJsonField(body, 'name'), readJsonField(body, 'password'));
  }
  if (method === 'POST' && path === '/api/auth/login') {
    const body = await ctx.readJson();
    return store.login(readJsonField(body, 'name'), readJsonField(body, 'password'));
  }
  if (method === 'POST' && path === '/api/auth/logout') {
    await ctx.requireUser();
    await ctx.readJson();
    await store.logout(ctx.token()!);
    return { ok: true };
  }
  if (method === 'GET' && path === '/api/me') return ctx.requireUser();
  if (method === 'PATCH' && path === '/api/me') {
    const user = await ctx.requireUser(), body = await ctx.readJson();
    return store.updateUser(user.id, body);
  }
  if (method === 'GET' && path === '/api/schemes') return store.schemes((await ctx.requireUser()).id);
  const scheme = /^\/api\/schemes\/([^/]+)$/.exec(path);
  if (scheme && method === 'PUT') {
    const user = await ctx.requireUser(), body = await ctx.readJson();
    return store.saveScheme(user.id, ctx.validId(scheme[1]!), body);
  }
  if (scheme && method === 'DELETE') {
    const user = await ctx.requireUser();
    await store.deleteScheme(user.id, ctx.validId(scheme[1]!));
    return { ok: true };
  }
  return UNHANDLED;
}
