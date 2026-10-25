import { parentPort, workerData } from 'node:worker_threads';
import { Exporter, THUMBNAILS } from './exporter.js';
import { Invalid } from '../rules.js';

let engine: Exporter | undefined;
try { engine = new Exporter(workerData.assets); parentPort!.postMessage({ ready: true, available: true }); }
catch (e) { parentPort!.postMessage({ ready: true, available: false, error: String(e) }); }
parentPort!.on('message', ({ id, method, body }) => {
  try {
    if (!engine) throw new Invalid('没有加载模型资产，暂时不能导出', 'validation.31');
    if (body.thumbnails) for (const name of THUMBNAILS) if (body.thumbnails[name] instanceof Uint8Array) body.thumbnails[name] = Buffer.from(body.thumbnails[name]);
    const result = method === 'plan' ? engine.plan(body) : engine.export(body).content;
    if (Buffer.isBuffer(result) && result.byteOffset === 0 && result.byteLength === result.buffer.byteLength && result.buffer instanceof ArrayBuffer) parentPort!.postMessage({ id, result }, [result.buffer]);
    else parentPort!.postMessage({ id, result });
  } catch (e) {
    const error = e instanceof Invalid ? e : new Invalid('导出失败，请检查模型资产', 'server.failed', {}, 500);
    parentPort!.postMessage({ id, error: error.payload(), status: error.status });
  }
});
