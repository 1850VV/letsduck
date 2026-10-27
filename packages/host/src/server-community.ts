import { Invalid, pythonInteger, readJsonField } from '@letsduck/domain';
import { UNHANDLED } from './server-context.js';
import type { ServerApiContext } from './server-context.js';

function pagination(source: string): number | bigint {
  // pythonInteger models falsy business values as zero; Python int('') raises.
  if (source === '') throw new Invalid('分页范围不对', 'request.pagination');
  try { return pythonInteger(source); }
  catch { throw new Invalid('分页范围不对', 'request.pagination'); }
}

/** Community routing preserves anonymous viewing and raw integer inputs. */
export async function serverCommunity(ctx: ServerApiContext): Promise<unknown> {
  const { method, path, store } = ctx;
  if (method === 'GET' && path === '/api/works') {
    const user = await ctx.optionalUser();
    const limit = pagination(ctx.query('limit', '200') ?? '200'), offset = pagination(ctx.query('offset', '0') ?? '0');
    return store.works(user?.id, ctx.query('author'), limit, offset);
  }
  if (method === 'POST' && path === '/api/works') {
    const user = await ctx.requireUser(), body = await ctx.readJson();
    return store.publish(user.id, body);
  }
  const work = /^\/api\/works\/([^/]+)$/.exec(path);
  if (work && method === 'GET') {
    const user = await ctx.optionalUser();
    return store.work(ctx.validId(work[1]!), user?.id);
  }
  if (work && method === 'DELETE') {
    const user = await ctx.requireUser();
    await store.deleteWork(user.id, ctx.validId(work[1]!));
    return { ok: true };
  }
  const rating = /^\/api\/works\/([^/]+)\/rating$/.exec(path);
  if (rating && method === 'PUT') {
    const user = await ctx.requireUser(), body = await ctx.readJson();
    return store.rate(user.id, ctx.validId(rating[1]!), readJsonField(body, 'stars'));
  }
  return UNHANDLED;
}
