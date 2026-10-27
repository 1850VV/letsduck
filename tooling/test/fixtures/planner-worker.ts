/** Owns real asset metadata but uses a deterministic export gate/crash for admission tests. */
import { parentPort, workerData } from 'node:worker_threads';
import { Exporter } from '@letsduck/exporter';
import type { ExportMetadata } from '@letsduck/exporter';
const port = parentPort!;
const data: unknown = workerData;
if (!data || typeof data !== 'object' || !('assets' in data) || typeof data.assets !== 'string') throw new Error('Missing synthetic assets');
const engine = new Exporter(data.assets);
const metadata: ExportMetadata = { sourceSha256: engine.model.source_sha256, partIds: engine.model.parts.map(part => part.id), catalog: engine.catalog, planning: engine.planningData };
port.postMessage({ type: 'ready', available: true, metadata });
port.on('message', (job: { id: number; method: string; body: { gate?: SharedArrayBuffer; crash?: boolean } }) => {
  if (job.body.gate) {
    const control = new Int32Array(job.body.gate); Atomics.store(control, 1, 1); Atomics.notify(control, 1);
    while (!Atomics.load(control, 0)) Atomics.wait(control, 0, 0);
  }
  if (job.body.crash) process.exit(1);
  port.postMessage({ type: 'result', id: job.id, method: job.method, result: Buffer.from('fixture-3mf') });
});
