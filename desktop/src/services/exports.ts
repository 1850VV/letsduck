import { Worker } from 'node:worker_threads';
import { Invalid, type JsonObject } from '../rules.js';

export class Exports {
  available = false;
  readonly ready: Promise<void>;
  private worker: Worker;
  private sequence = 0;
  private closing = false;
  private stopped?: Promise<void>;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; task: Promise<any> }>();
  constructor(assets: string) {
    this.worker = new Worker(new URL('../export/worker.js', import.meta.url), { workerData: { assets } });
    this.ready = new Promise((resolve, reject) => {
      this.worker.on('message', message => {
        if (message.ready) { this.available = message.available; resolve(); return; }
        const job = this.pending.get(message.id); if (!job) return;
        this.pending.delete(message.id);
        if (message.error) job.reject(new Invalid(message.error.error, message.error.code, message.error.params, message.status));
        else job.resolve(message.result instanceof Uint8Array ? Buffer.from(message.result.buffer, message.result.byteOffset, message.result.byteLength) : message.result);
      });
      const fail = (error: Error) => { this.available = false; reject(error); for (const job of this.pending.values()) job.reject(error); this.pending.clear(); };
      this.worker.on('error', fail);
      this.worker.on('exit', code => { if (!this.closing || code !== 0) fail(new Error('Export worker exited')); });
    });
  }
  get busy() { return this.pending.size > 0; }
  run(method: 'plan' | 'export', body: JsonObject): Promise<any> {
    if (!this.available) return Promise.reject(new Invalid('没有加载模型资产，暂时不能导出', 'validation.31'));
    if (this.closing || this.pending.size >= 3) return Promise.reject(new Invalid('正在导出，请稍后再试', 'export.busy', {}, 503));
    const id = ++this.sequence; let resolve!: (v: any) => void, reject!: (e: Error) => void;
    const task = new Promise((ok, no) => { resolve = ok; reject = no; });
    this.pending.set(id, { resolve, reject, task }); this.worker.postMessage({ id, method, body }); return task;
  }
  close(): Promise<void> {
    this.closing = true;
    return this.stopped ??= (async () => { await Promise.allSettled([...this.pending.values()].map(p => p.task)); await this.worker.terminate(); })();
  }
}
