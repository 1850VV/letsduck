import { Worker } from 'node:worker_threads';
import type { ExportPlan } from '@letsduck/contracts';
import { Invalid, LocalizedError, pythonString, readJsonField } from '@letsduck/domain';
import type { ExportReply, ExportRequest } from './protocol.js';

export class ExportBusy extends LocalizedError {
  readonly status = 503;
  constructor() { super('导出任务较多，请稍后重试', 'export.busy'); }
}
type Result = Buffer | ExportPlan;
interface Job extends ExportRequest { task: Promise<Result>; resolve: (value: Result) => void; reject: (error: Error) => void }
interface Slot { worker: Worker; ready: boolean; available: boolean; job: number | null }
export interface ExportOptions { assets: string; workers?: number; queueSize?: number; workerUrl?: URL }

export class ExportManager {
  readonly ready: Promise<void>;
  available = false;
  private readonly slots: Slot[] = [];
  private readonly jobs = new Map<number, Job>();
  private readonly queue: number[] = [];
  private readonly capacity: number;
  private sequence = 0;
  private closing = false;
  private terminating = false;
  private stopped: Promise<void> | undefined;
  private broken: Error | undefined;
  constructor(options: ExportOptions) {
    const workers = options.workers ?? 1, waiting = options.queueSize ?? 2;
    if (!Number.isInteger(workers) || workers < 1 || !Number.isInteger(waiting) || waiting < 0) throw new Error('Export workers must be positive and queue size must be non-negative');
    this.capacity = workers + waiting;
    let readyResolve!: () => void, readyReject!: (error: Error) => void;
    this.ready = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
    void this.ready.catch(() => {});
    const failed = (error: Error) => { this.broken = error; this.available = false; readyReject(error); this.failJobs(error); };
    for (let index = 0; index < workers; index++) {
      const worker = new Worker(options.workerUrl ?? new URL('./worker.js', import.meta.url), { workerData: { assets: options.assets } });
      const slot: Slot = { worker, ready: false, available: false, job: null }; this.slots.push(slot);
      worker.on('message', (reply: ExportReply) => {
        if (reply.type === 'ready') {
          slot.ready = true; slot.available = reply.available;
          if (this.slots.length === workers && this.slots.every(item => item.ready)) {
            this.available = this.slots.every(item => item.available); readyResolve();
            if (this.available) this.dispatch(); else this.failJobs(new Invalid('没有加载模型资产，暂时不能导出', 'validation.31'));
          }
          return;
        }
        const job = this.jobs.get(reply.id); if (!job) return;
        this.jobs.delete(reply.id); slot.job = null;
        if (reply.type === 'error') job.reject(reply.validation ? new Invalid(reply.error.error, reply.error.code, reply.error.params) : new Error(reply.error.error));
        else job.resolve(reply.method === 'export' ? Buffer.from(reply.result) : reply.result);
        this.dispatch();
      });
      worker.on('error', failed);
      worker.on('exit', () => { if (!this.terminating) failed(new Error('Export worker exited')); });
    }
  }
  get busy() { return this.jobs.size > 0; }
  private failJobs(error: Error) { for (const job of this.jobs.values()) job.reject(error); this.jobs.clear(); this.queue.length = 0; }
  private dispatch() {
    if (!this.available || this.broken) return;
    for (const slot of this.slots) {
      if (slot.job !== null) continue;
      const id = this.queue.shift(); if (id === undefined) return;
      const job = this.jobs.get(id); if (!job) continue;
      slot.job = id;
      const request: ExportRequest = { id, method: job.method, body: job.body }; slot.worker.postMessage(request);
    }
  }
  run(method: 'export', body: unknown, signal?: AbortSignal): Promise<Buffer>;
  run(method: 'plan', body: unknown, signal?: AbortSignal): Promise<ExportPlan>;
  run(method: 'plan' | 'export', body: unknown, signal?: AbortSignal): Promise<Result>;
  run(method: 'plan' | 'export', body: unknown, signal?: AbortSignal): Promise<Result> {
    if (this.closing || this.jobs.size >= this.capacity) return Promise.reject(new ExportBusy());
    if (this.broken) return Promise.reject(this.broken);
    if (signal?.aborted) return Promise.reject(new DOMException('Export request cancelled', 'AbortError'));
    if (this.slots.every(slot => slot.ready) && !this.available) return Promise.reject(new Invalid('没有加载模型资产，暂时不能导出', 'validation.31'));
    if (body && typeof body === 'object' && !Array.isArray(body) && Object.hasOwn(body, 'name')) body = { ...body, name: pythonString(readJsonField(body, 'name')) };
    let resolve!: (value: Result) => void, reject!: (error: Error) => void;
    const task = new Promise<Result>((ok, no) => { resolve = ok; reject = no; }), id = ++this.sequence;
    this.jobs.set(id, { id, method, body, task, resolve, reject }); this.queue.push(id);
    const result = new Promise<Result>((ok, no) => {
      const abort = () => no(new DOMException('Export request cancelled', 'AbortError'));
      signal?.addEventListener('abort', abort, { once: true });
      task.then(value => { signal?.removeEventListener('abort', abort); ok(value); }, error => { signal?.removeEventListener('abort', abort); no(error); });
    });
    this.dispatch(); return result;
  }
  async waitIdle() { await Promise.allSettled([...this.jobs.values()].map(job => job.task)); }
  close(): Promise<void> {
    this.closing = true;
    return this.stopped ??= (async () => { try { await this.ready.catch(() => {}); await this.waitIdle(); } finally { this.terminating = true; await Promise.all(this.slots.map(slot => slot.worker.terminate())); } })();
  }
}
