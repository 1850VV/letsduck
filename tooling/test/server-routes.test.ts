import { test, describe } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseWireJson } from '@letsduck/domain';
import { ServerStore, jsonStringify } from '@letsduck/storage';
import type { ServerSession } from '@letsduck/storage';
import type { ServerApiContext } from '../../packages/host/src/server-context.js';

const design = { colors: { p: '#ffffff' }, assignments: { p: 'pla-white' } };
async function routes() {
  assert.ok(existsSync(resolve(import.meta.dirname, '../../packages/host/src/server-accounts.ts')), 'Server route modules are not implemented');
  const [accounts, community, context] = await Promise.all([import('../../packages/host/src/server-accounts.js'), import('../../packages/host/src/server-community.js'), import('../../packages/host/src/server-context.js')]);
  return { ...accounts, ...community, UNHANDLED: context.UNHANDLED };
}
function failure(status: number, code: string) { return Object.assign(new Error(code), { status, code }); }
async function fixture(t: TestContext, database?: string) {
  const modules = await routes(), directory = mkdtempSync(join(tmpdir(), 'letsduck-server-routes-'));
  const store = await ServerStore.open({ database: database ?? join(directory, 'server.db'), partIds: ['p'] });
  t.after(async () => { await store.close(); rmSync(directory, { force: true, recursive: true }); });
  function context(method: string, url: string, token: string | null = null, body = '{}', events: string[] = []): ServerApiContext {
    const [path, query] = url.split('?'), params = new URLSearchParams(query);
    return { method, path: path!, store, token: () => { events.push('token'); return token; },
      query: (name, fallback) => params.has(name) ? params.getAll(name).at(-1)! : fallback,
      optionalUser: async () => { events.push('optional'); return store.userFor(token); },
      requireUser: async () => { events.push('auth'); const user = await store.userFor(token); if (!user) throw failure(401, 'auth.required'); return user; },
      readJson: async () => { events.push('body'); const value = parseWireJson(body); if (!value || typeof value !== 'object' || Array.isArray(value)) throw failure(400, 'request.format'); return value as Record<string, unknown>; },
      validId: value => { events.push('id'); if (!/^[\p{L}\p{N}_-]{1,64}$/u.test(value)) throw failure(404, 'request.not_found'); return value; } };
  }
  async function call(method: string, path: string, token: string | null = null, body: unknown = {}, events: string[] = []) {
    const ctx = context(method, path, token, typeof body === 'string' ? body : jsonStringify(body), events);
    const accounts = await modules.serverAccounts(ctx);
    return accounts === modules.UNHANDLED ? modules.serverCommunity(ctx) : accounts;
  }
  return { ...modules, store, context, call };
}

test('account registration/login/profile/logout routes retain native storage response shapes', async t => {
  const { call, store } = await fixture(t);
  const a = await call('POST', '/api/auth/register', null, { name: '作者鸭', password: 'test-pass' }) as ServerSession;
  assert.equal(a.user.name, '作者鸭'); assert.equal(typeof a.token, 'string');
  assert.deepEqual(await call('GET', '/api/me', a.token), a.user);
  const renamed = await call('PATCH', '/api/me', a.token, { name: '已改名', password: 'new-pass' });
  assert.equal((renamed as { name: string }).name, '已改名');
  const login = await call('POST', '/api/auth/login', null, { name: '已改名', password: 'new-pass' }) as ServerSession;
  assert.equal(login.user.id, a.user.id);
  assert.deepEqual(await call('POST', '/api/auth/logout', a.token), { ok: true });
  assert.equal(await store.userFor(a.token), null); assert.ok(await store.userFor(login.token));
});
test('account field extraction preserves raw Python numeric name conversion', async t => {
  const { call } = await fixture(t);
  const a = await call('POST', '/api/auth/register', null, '{"name":1.0,"password":"pass"}') as ServerSession;
  assert.equal(a.user.name, '1.0');
  const login = await call('POST', '/api/auth/login', null, '{"name":1.0,"password":"pass"}') as ServerSession;
  assert.equal(login.user.id, a.user.id);
});
test('protected routes authenticate before malformed body or invalid handler ID', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass');
  for (const [method, path] of [['POST', '/api/auth/logout'], ['PATCH', '/api/me'], ['PUT', '/api/schemes/bad.id'], ['POST', '/api/works'], ['PUT', '/api/works/bad.id/rating']]) {
    const events: string[] = []; await assert.rejects(call(method!, path!, null, '{bad', events), { status: 401 }); assert.deepEqual(events, ['auth']);
    const authenticated: string[] = []; await assert.rejects(call(method!, path!, a.token, '{bad', authenticated), SyntaxError); assert.deepEqual(authenticated, ['auth', 'body']);
  }
  const events: string[] = []; await assert.rejects(call('PUT', '/api/schemes/bad.id', a.token, { name: 'x', design }, events), { status: 404 }); assert.deepEqual(events, ['auth', 'body', 'id']);
});
test('logout still requires a JSON object before deleting its valid token', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass');
  await assert.rejects(call('POST', '/api/auth/logout', a.token, '[]'), { status: 400 }); assert.ok(await store.userFor(a.token));
});
test('profile failure is atomic through the route and leaves the existing session valid', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass');
  await assert.rejects(call('PATCH', '/api/me', a.token, { name: 'Changed', password: 'x' }), { code: 'auth.password_short' });
  assert.deepEqual(await call('GET', '/api/me', a.token), a.user);
});
test('private scheme routes retain ordering, created time, Unicode, exact integers and ownership', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass'), b = await store.register('B', 'pass');
  const raw = '{"name":"我的鸭","design":{"colors":{"p":"#ffffff"},"assignments":{"p":"pla-white"}},"voiceSalt":9007199254740993,"provenance":{"n":9007199254740995}}';
  const saved = await call('PUT', '/api/schemes/鸭一', a.token, raw) as { id: string; created: unknown; voiceSalt: unknown; provenance: unknown };
  assert.equal(saved.id, '鸭一'); assert.equal(saved.voiceSalt, 9007199254740993n); assert.deepEqual(saved.provenance, { n: 9007199254740995n });
  const renamed = await call('PUT', '/api/schemes/鸭一', a.token, { name: 'Rename', design }) as { created: unknown }; assert.equal(renamed.created, saved.created);
  assert.deepEqual(await call('GET', '/api/schemes', b.token), []);
  await assert.rejects(call('PUT', '/api/schemes/鸭一', b.token, { name: 'Steal', design }), { code: 'schemes.not_owner' });
  assert.deepEqual(await call('DELETE', '/api/schemes/鸭一', b.token), { ok: true }); assert.equal((await store.schemes(a.user.id)).length, 1);
  assert.deepEqual(await call('DELETE', '/api/schemes/鸭一', a.token), { ok: true }); assert.deepEqual(await call('GET', '/api/schemes', a.token), []);
});
test('scheme concurrent routes enforce quota and permit an update at quota', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass');
  for (let i = 0; i < 29; i++) await store.saveScheme(a.user.id, 'old-' + i, { name: 'Old', design });
  const attempts = await Promise.allSettled(Array.from({ length: 8 }, (_v, i) => call('PUT', '/api/schemes/new-' + i, a.token, { name: 'New', design })));
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1); assert.equal((await store.schemes(a.user.id)).length, 30);
  for (const result of attempts) if (result.status === 'rejected') assert.equal(result.reason.code, 'validation.11');
  assert.equal((await call('PUT', '/api/schemes/old-0', a.token, { name: 'Rename', design }) as { name: string }).name, 'Rename');
});
test('community publishes, views owner-only scheme identity, rates and preserves fork deletion behavior', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass'), b = await store.register('B', 'pass');
  const work = await call('POST', '/api/works', a.token, { title: 'White', design, schemeId: 'private' }) as { id: string; schemeId: string };
  assert.equal(work.schemeId, 'private'); assert.equal((await call('GET', '/api/works/' + work.id) as { schemeId: unknown }).schemeId, null);
  assert.equal((await call('GET', '/api/works/' + work.id, a.token) as { schemeId: unknown }).schemeId, 'private');
  assert.equal((await call('GET', '/api/works/' + work.id, 'invalid-token') as { schemeId: unknown }).schemeId, null);
  await assert.rejects(call('PUT', `/api/works/${work.id}/rating`, a.token, { stars: 5 }), { code: 'validation.16' });
  const rated = await call('PUT', `/api/works/${work.id}/rating`, b.token, { stars: 4 }) as { id: string; rating: unknown };
  assert.equal(rated.id, work.id); assert.deepEqual(rated.rating, { count: 1, average: 4, mine: 4 });
  const child = await call('POST', '/api/works', b.token, { title: 'Fork', design, parentId: work.id }) as { id: string };
  assert.equal((await call('GET', '/api/works/' + work.id) as { forks: number }).forks, 1);
  await assert.rejects(call('DELETE', '/api/works/' + work.id, b.token), { code: 'validation.14' });
  assert.deepEqual(await call('DELETE', '/api/works/' + work.id, a.token), { ok: true });
  assert.equal((await call('GET', '/api/works/' + child.id) as { parentId: unknown }).parentId, null);
});
test('rating route preserves raw integer type rather than accepting JSON float or boolean', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass'), b = await store.register('B', 'pass');
  const work = await store.publish(a.user.id, { title: 'x', design });
  for (const token of ['4.0', '4e0', 'true', '"4"', '0', '6', 'null']) await assert.rejects(call('PUT', `/api/works/${work.id}/rating`, b.token, '{"stars":' + token + '}'), { code: 'validation.17' });
  assert.deepEqual((await call('PUT', `/api/works/${work.id}/rating`, b.token, '{"stars":4}') as { rating: unknown }).rating, { count: 1, average: 4, mine: 4 });
});
test('pagination accepts Python integer spelling, last query values, arrays and author filtering', async t => {
  const { call, store } = await fixture(t), a = await store.register('A', 'pass'), b = await store.register('B', 'pass');
  for (let i = 0; i < 4; i++) await store.publish(a.user.id, { title: String(i), design });
  const first = await call('GET', '/api/works?limit=２&offset=0') as { id: string }[], second = await call('GET', '/api/works?limit=1&limit=2&offset=%20%2B2%20') as { id: string }[];
  assert.equal(first.length, 2); assert.equal(second.length, 2); assert.equal(new Set([...first, ...second].map(w => w.id)).size, 4);
  assert.equal((await call('GET', '/api/works?limit=2_0') as unknown[]).length, 4);
  assert.deepEqual(await call('GET', '/api/works?author=' + b.user.id), []);
  assert.equal((await call('GET', '/api/works?author=') as unknown[]).length, 4);
});
test('invalid pagination including blank offset rejects without rounding huge integers', async t => {
  const { call } = await fixture(t);
  for (const query of ['limit=0', 'limit=201', 'offset=-1', 'limit=oops', 'limit=', 'offset=', 'limit=1.0', 'offset=1e2', 'limit=9007199254740993', 'offset=-9007199254740993']) {
    await assert.rejects(call('GET', '/api/works?' + query), { code: 'request.pagination' });
  }
  assert.deepEqual(await call('GET', '/api/works?offset=9007199254740993'), []);
});
test('unhandled methods and multi-segment paths do not authenticate, read bodies or hit storage', async t => {
  const { serverAccounts, serverCommunity, context, UNHANDLED } = await fixture(t);
  for (const [method, path] of [['OPTIONS', '/api/me'], ['POST', '/api/schemes/s'], ['GET', '/api/schemes/a/b'], ['PUT', '/api/works/a/b/rating'], ['GET', '/api/works/'], ['GET', '/api/health']]) {
    const events: string[] = [], ctx = context(method!, path!, null, '{bad', events);
    assert.equal(await serverAccounts(ctx), UNHANDLED); assert.equal(await serverCommunity(ctx), UNHANDLED); assert.deepEqual(events, []);
  }
});
test('public invalid work IDs resolve viewer before ID validation and missing work keeps business error', async t => {
  const { call } = await fixture(t), events: string[] = [];
  await assert.rejects(call('GET', '/api/works/bad.id', null, {}, events), { status: 404 }); assert.deepEqual(events, ['optional', 'id']);
  await assert.rejects(call('GET', '/api/works/missing'), { code: 'validation.15' });
});

const mysql = process.env.DUCK_TEST_DATABASE_URL;
function mysqlTarget(value: string): string {
  const address = new URL(value.replace(/^mysql\+pymysql:/, 'mysql:'));
  if (address.protocol !== 'mysql:' || !/^duck_test_[^/]+$/.test(decodeURIComponent(address.pathname.slice(1)))) throw new Error('HTTP tests require a disposable MySQL database named duck_test_*');
  return value;
}
if (mysql) mysqlTarget(mysql);
async function httpFixture(t: TestContext, dialect: 'sqlite' | 'mysql') {
  assert.ok(existsSync(resolve(import.meta.dirname, '../../packages/host/src/server-http.ts')), 'Server HTTP factory is not implemented');
  const { createServerHttp } = await import('../../packages/host/src/server-http.js');
  const directory = mkdtempSync(join(tmpdir(), 'letsduck-server-http-'));
  const store = await ServerStore.open({ database: dialect === 'mysql' ? mysqlTarget(mysql!) : join(directory, 'server.db'), partIds: ['p'] });
  if (dialect === 'mysql') await store.db.transaction(async conn => { for (const table of ['ratings', 'works', 'schemes', 'sessions', 'users', 'migration_runs']) await conn.run('DELETE FROM ' + table); }, true);
  const http = createServerHttp({ store, exporter: null, assets: directory, quiet: true });
  t.after(async () => { await http.close(); await store.close(); rmSync(directory, { recursive: true, force: true }); });
  const register = async (name: string): Promise<ServerSession> => {
    const response = await http.inject({ method: 'POST', url: '/api/auth/register', payload: { name, password: 'test-pass' } });
    assert.equal(response.statusCode, 200, response.body); return response.json() as ServerSession;
  };
  return { http, store, register };
}
const authorized = (session: ServerSession) => ({ authorization: 'Bearer ' + session.token });

for (const dialect of ['sqlite', 'mysql'] as const) describe(`${dialect} actual server routes HTTP`, { skip: dialect === 'mysql' && !mysql ? 'DUCK_TEST_DATABASE_URL not configured' : false }, () => {
  test('accounts/private schemes/community/rating/logout preserve the old HTTP journey', async t => {
    const { http, register } = await httpFixture(t, dialect), a = await register('Alpha'), b = await register('Beta');
    assert.deepEqual((await http.inject({ url: '/api/me', headers: authorized(a) })).json(), a.user);
    const saved = await http.inject({ method: 'PUT', url: '/api/schemes/s-1', headers: authorized(a), payload: { name: '白鸭', design } }); assert.equal(saved.statusCode, 200, saved.body);
    assert.deepEqual((await http.inject({ url: '/api/schemes', headers: authorized(b) })).json(), []);
    const published = await http.inject({ method: 'POST', url: '/api/works', headers: authorized(a), payload: { title: '白鸭', design, schemeId: 's-1' } }); assert.equal(published.statusCode, 200, published.body); const wid = published.json<{ id: string }>().id;
    assert.equal((await http.inject({ url: '/api/works/' + wid })).json().schemeId, null);
    assert.equal((await http.inject({ url: '/api/works/' + wid, headers: authorized(a) })).json().schemeId, 's-1');
    const rated = await http.inject({ method: 'PUT', url: `/api/works/${wid}/rating`, headers: authorized(b), payload: { stars: 4 } }); assert.equal(rated.statusCode, 200, rated.body); assert.deepEqual(rated.json().rating, { count: 1, average: 4, mine: 4 });
    assert.equal((await http.inject({ url: '/api/works', headers: authorized(b) })).json()[0].rating.mine, 4);
    assert.equal((await http.inject({ method: 'DELETE', url: '/api/works/' + wid, headers: authorized(b) })).statusCode, 422);
    assert.deepEqual((await http.inject({ method: 'DELETE', url: '/api/works/' + wid, headers: authorized(a) })).json(), { ok: true });
    assert.deepEqual((await http.inject({ method: 'DELETE', url: '/api/schemes/s-1', headers: authorized(a) })).json(), { ok: true });
    assert.deepEqual((await http.inject({ method: 'POST', url: '/api/auth/logout', headers: authorized(a), payload: {} })).json(), { ok: true });
    assert.equal((await http.inject({ url: '/api/me', headers: authorized(a) })).statusCode, 401);
  });
  test('auth dependency order, exact Bearer prefix and raw numeric fields survive real HTTP', async t => {
    const { http } = await httpFixture(t, dialect);
    const aResponse = await http.inject({ method: 'POST', url: '/api/auth/register', headers: { 'content-type': 'application/json' }, payload: '{"name":1.0,"password":"test-pass"}' });
    assert.equal(aResponse.statusCode, 200, aResponse.body); const a = aResponse.json<ServerSession>(); assert.equal(a.user.name, '1.0');
    assert.equal((await http.inject({ url: '/api/me', headers: { authorization: 'bearer ' + a.token } })).statusCode, 401);
    assert.equal((await http.inject({ url: '/api/me', headers: { authorization: 'Bearer    ' + a.token + '  ' } })).statusCode, 200);
    for (const [method, url] of [['POST', '/api/auth/logout'], ['PATCH', '/api/me'], ['PUT', '/api/schemes/bad.id'], ['POST', '/api/works'], ['PUT', '/api/works/bad.id/rating']] as const) {
      const rejected = await http.inject({ method, url, headers: { 'content-type': 'application/json' }, payload: '{bad' }); assert.equal(rejected.statusCode, 401, rejected.body); assert.equal(rejected.json().code, 'auth.required');
      assert.equal((await http.inject({ method, url, headers: { ...authorized(a), 'content-type': 'application/json' }, payload: '{bad' })).statusCode, 400);
    }
    const raw = '{"name":"我的鸭","design":{"colors":{"p":"#ffffff"},"assignments":{"p":"pla-white"}},"voiceSalt":9007199254740993,"provenance":{"counter":9007199254740995}}';
    const saved = await http.inject({ method: 'PUT', url: '/api/schemes/' + encodeURIComponent('鸭一'), headers: { ...authorized(a), 'content-type': 'application/json' }, payload: raw });
    assert.equal(saved.statusCode, 200, saved.body); assert.equal(saved.json().id, '鸭一');
    const exact = parseWireJson(saved.body) as Record<string, unknown>; assert.equal(exact.voiceSalt, 9007199254740993n); assert.deepEqual(exact.provenance, { counter: 9007199254740995n });
  });
  test('rating input keeps strict integers, private viewer data and fork lineage through HTTP', async t => {
    const { http, register } = await httpFixture(t, dialect), a = await register('A'), b = await register('B');
    const root = (await http.inject({ method: 'POST', url: '/api/works', headers: authorized(a), payload: { title: 'Root', design, schemeId: 'private' } })).json<{ id: string }>();
    for (const value of ['4.0', '4e0', 'true', '"4"', '0', '6']) {
      const response = await http.inject({ method: 'PUT', url: `/api/works/${root.id}/rating`, headers: { ...authorized(b), 'content-type': 'application/json' }, payload: '{"stars":' + value + '}' }); assert.equal(response.statusCode, 422); assert.equal(response.json().code, 'validation.17');
    }
    const fork = (await http.inject({ method: 'POST', url: '/api/works', headers: authorized(b), payload: { title: 'Fork', design, parentId: root.id } })).json<{ id: string }>();
    assert.equal((await http.inject({ url: '/api/works/' + root.id })).json().forks, 1);
    assert.equal((await http.inject({ url: '/api/works/' + root.id, headers: { authorization: 'Bearer invalid' } })).json().schemeId, null);
    assert.equal((await http.inject({ method: 'DELETE', url: '/api/works/' + root.id, headers: authorized(a) })).statusCode, 200);
    assert.equal((await http.inject({ url: '/api/works/' + fork.id })).json().parentId, null);
  });
  test('HTTP pagination preserves arrays, author filters, Python spelling and bigint database behavior', async t => {
    const { http, register, store } = await httpFixture(t, dialect), a = await register('A'), b = await register('B');
    for (let i = 0; i < 4; i++) await store.publish(a.user.id, { title: String(i), design });
    const first = (await http.inject({ url: '/api/works?limit=1&limit=%EF%BC%92&offset=0' })).json<{ id: string }[]>(), second = (await http.inject({ url: '/api/works?limit=2&offset=%2B2' })).json<{ id: string }[]>();
    assert.equal(first.length, 2); assert.equal(second.length, 2); assert.equal(new Set([...first, ...second].map(w => w.id)).size, 4);
    assert.deepEqual((await http.inject({ url: '/api/works?author=' + b.user.id })).json(), []);
    for (const query of ['limit=0', 'limit=201', 'offset=-1', 'offset=', 'limit=', 'limit=oops']) { const response = await http.inject({ url: '/api/works?' + query }); assert.equal(response.statusCode, 422); assert.equal(response.json().code, 'request.pagination'); }
    const large = await http.inject({ url: '/api/works?offset=9007199254740993' }); assert.equal(large.statusCode, 200, large.body); assert.deepEqual(large.json(), []);
    if (dialect === 'sqlite') assert.equal((await http.inject({ url: '/api/works?offset=9223372036854775808' })).statusCode, 500);
  });
  test('concurrent HTTP writes respect scheme ownership and the account quota', async t => {
    const { http, register, store } = await httpFixture(t, dialect), a = await register('A'), b = await register('B');
    const race = await Promise.all([a, b].map(session => http.inject({ method: 'PUT', url: '/api/schemes/shared', headers: authorized(session), payload: { name: 'Private', design } })));
    assert.deepEqual(race.map(response => response.statusCode).sort(), [200, 422]);
    const winner = race[0]!.statusCode === 200 ? a : b;
    for (let i = 0; i < 28; i++) await store.saveScheme(winner.user.id, 'old-' + i, { name: 'Old', design });
    const quota = await Promise.all(Array.from({ length: 8 }, (_v, i) => http.inject({ method: 'PUT', url: '/api/schemes/new-' + i, headers: authorized(winner), payload: { name: 'New', design } })));
    assert.equal(quota.filter(response => response.statusCode === 200).length, 1); assert.equal((await store.schemes(winner.user.id)).length, 30);
  });
});
