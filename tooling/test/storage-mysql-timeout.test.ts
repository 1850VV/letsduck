import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acquireMysqlConnection, mysqlOperation } from '../../packages/storage/src/mysql-timeout.js';

test('pool acquisition times out after the original 15 seconds and releases a late connection', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let finish!: (connection: { release(): void }) => void, released = 0;
  const pending = new Promise<{ release(): void }>(resolve => { finish = resolve; });
  const result = acquireMysqlConnection(() => pending); void result.catch(() => {});
  t.mock.timers.tick(14_999); await Promise.resolve(); assert.equal(released, 0);
  t.mock.timers.tick(1); await assert.rejects(result, /pool.*timeout/i);
  finish({ release() { released++; } }); await new Promise<void>(resolve => setImmediate(resolve)); assert.equal(released, 1);
});

test('transaction and prepared I/O timeout after 30 seconds and dispose their owned connection', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let disposed = 0, finish!: (value: string) => void;
  const pending = new Promise<string>(resolve => { finish = resolve; });
  const result = mysqlOperation(() => pending, () => { disposed++; }); void result.catch(() => {});
  t.mock.timers.tick(29_999); assert.equal(disposed, 0);
  t.mock.timers.tick(1); await assert.rejects(result, /MySQL.*timed out/i); assert.equal(disposed, 1);
  finish('late commit response'); await Promise.resolve(); await assert.rejects(result, /timed out/i);
});

test('settled MySQL operations clear timers and preserve their original success or failure', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let disposed = 0; const failure = new Error('query failed');
  assert.equal(await mysqlOperation(async () => 42, () => { disposed++; }), 42);
  await assert.rejects(mysqlOperation(async () => { throw failure; }, () => { disposed++; }), error => error === failure);
  t.mock.timers.tick(30_000); assert.equal(disposed, 0);
  let released = 0; const connection = { release() { released++; } };
  assert.equal(await acquireMysqlConnection(async () => connection), connection);
  t.mock.timers.tick(15_000); assert.equal(released, 0);
});
