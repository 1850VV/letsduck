import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { ExportManager } from '@letsduck/exporter';

async function main() {
  const before = process.getActiveResourcesInfo().filter(name => name === 'MessagePort').length;
  const manager = new ExportManager({ assets: '', workers: 1, queueSize: 2, workerUrl: new URL('./export-worker.ts', import.meta.url) });
  await manager.ready;
  if (process.argv[2] === 'immediate') {
    let rejected: Promise<Buffer> | undefined;
    assert.doesNotThrow(() => { rejected = manager.run('export', { uncloneable: () => {} }); });
    await assert.rejects(rejected!, { name: 'DataCloneError' });
    assert.equal(manager.busy, false);
    assert.equal((await manager.run('export', {})).toString(), 'fixture-3mf');
  } else {
    const control = new Int32Array(new SharedArrayBuffer(8));
    const first = manager.run('export', { gate: control.buffer });
    const rejected = manager.run('export', { uncloneable: () => {} });
    const next = manager.run('export', {});
    const settled = Promise.allSettled([first, rejected, next]);
    for (let index = 0; !Atomics.load(control, 1); index++) { assert.ok(index < 1000, 'Owned worker did not start'); await delay(5); }
    Atomics.store(control, 0, 1); Atomics.notify(control, 0);
    const results = await settled;
    assert.equal(results[0]!.status, 'fulfilled');
    assert.equal(results[1]!.status, 'rejected');
    const failure = results[1]!; if (failure.status === 'rejected') assert.equal(failure.reason.name, 'DataCloneError');
    assert.equal(results[2]!.status, 'fulfilled');
    assert.equal((await next).toString(), 'fixture-3mf');
    assert.equal(manager.busy, false);
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { await Promise.race([manager.close(), new Promise<never>((_ok, no) => { timer = setTimeout(() => no(new Error('Submission failure stranded shutdown')), 1000); })]); }
  finally { clearTimeout(timer); }
  assert.equal(process.getActiveResourcesInfo().filter(name => name === 'MessagePort').length, before);
}
// On a failing assertion the parent collects the error and the OS closes every child-owned thread.
void main().catch(error => { console.error(error); process.exit(1); });
