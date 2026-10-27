import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import * as exporter from '@letsduck/exporter';
const workerUrl = new URL('./fixtures/export-worker.ts', import.meta.url);
const gate = () => new Int32Array(new SharedArrayBuffer(8));
function release(value: Int32Array) { Atomics.store(value, 0, 1); Atomics.notify(value, 0); }
async function started(value: Int32Array) { for (let index = 0; index < 1000; index++) { if (Atomics.load(value, 1)) return; await delay(5); } throw new Error('The owned worker did not start'); }
const ports = () => process.getActiveResourcesInfo().filter(name => name === 'MessagePort').length;

for (const mode of ['immediate', 'queued']) test(`${mode} submission errors release capacity and cannot strand shutdown`, () => {
  // A child owns the real threads, including when the old submission bug throws or hangs.
  const result = spawnSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./fixtures/export-submission.ts', import.meta.url)), mode], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});

test('active plus waiting exports have a hard bound and owned threads exit', async () => {
  assert.equal(typeof exporter.ExportManager, 'function', 'The bounded worker manager is missing');
  const before = ports(), manager = new exporter.ExportManager({ assets: '', workers: 1, queueSize: 1, workerUrl }), control = gate();
  try {
    await manager.ready;
    const tasks = Array.from({ length: 6 }, () => manager.run('export', { gate: control.buffer }));
    const settled = Promise.allSettled(tasks); await started(control); release(control);
    const results = await settled;
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 2);
    assert.equal(results.filter(result => result.status === 'rejected' && result.reason instanceof exporter.ExportBusy).length, 4);
  } finally { release(control); await manager.close(); }
  assert.equal(ports(), before);
});

test('HTTP cancellation retains capacity until CPU work completes', async () => {
  assert.equal(typeof exporter.ExportManager, 'function', 'The bounded worker manager is missing');
  const manager = new exporter.ExportManager({ assets: '', workers: 1, queueSize: 0, workerUrl }), control = gate(), cancel = new AbortController();
  try {
    await manager.ready;
    const task = manager.run('export', { gate: control.buffer }, cancel.signal); await started(control); cancel.abort();
    await assert.rejects(task, { name: 'AbortError' });
    await assert.rejects(manager.run('export', {}), exporter.ExportBusy);
    release(control); await manager.waitIdle();
    assert.equal((await manager.run('export', {})).toString(), 'fixture-3mf');
  } finally { release(control); await manager.close(); }
});

test('failures release capacity and shutdown drains accepted work before exiting', async () => {
  assert.equal(typeof exporter.ExportManager, 'function', 'The bounded worker manager is missing');
  const manager = new exporter.ExportManager({ assets: '', workers: 1, queueSize: 0, workerUrl }), control = gate();
  try {
    await manager.ready;
    await assert.rejects(manager.run('export', { fail: true }), /invalid fixture/);
    const task = manager.run('export', { gate: control.buffer }); await started(control);
    let closed = false; const closing = manager.close().then(() => { closed = true; });
    await delay(10); assert.equal(closed, false);
    await assert.rejects(manager.run('export', {}), exporter.ExportBusy);
    release(control); assert.equal((await task).toString(), 'fixture-3mf'); await closing;
  } finally { release(control); await manager.close(); }
});

test('a worker exit during shutdown rejects accepted work and cannot hang cleanup', async () => {
  const manager = new exporter.ExportManager({ assets: '', workers: 1, queueSize: 0, workerUrl }), control = gate();
  await manager.ready;
  const task = manager.run('export', { gate: control.buffer, crash: true }); void task.catch(() => {});
  await started(control);
  const closing = manager.close(); release(control);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([closing, new Promise<never>((_ok, no) => { timeout = setTimeout(() => no(new Error('Shutdown ignored the owned worker exit')), 1000); })]);
    await assert.rejects(task, /worker exited/i);
  } finally { if (timeout) clearTimeout(timeout); release(control); }
});
