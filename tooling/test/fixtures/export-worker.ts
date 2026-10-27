import { parentPort } from 'node:worker_threads';
parentPort!.postMessage({ type: 'ready', available: true });
parentPort!.on('message', (job: { id: number; method: string; body: { gate?: SharedArrayBuffer; fail?: boolean; crash?: boolean } }) => {
  if (job.body.gate) {
    const gate = new Int32Array(job.body.gate); Atomics.store(gate, 1, 1); Atomics.notify(gate, 1);
    while (!Atomics.load(gate, 0)) Atomics.wait(gate, 0, 0);
  }
  if (job.body.crash) process.exit(1);
  if (job.body.fail) parentPort!.postMessage({ type: 'error', id: job.id, validation: false, error: { error: 'invalid fixture', code: 'server.failed', params: {} } });
  else parentPort!.postMessage({ type: 'result', id: job.id, method: job.method, result: Buffer.from('fixture-3mf') });
});
