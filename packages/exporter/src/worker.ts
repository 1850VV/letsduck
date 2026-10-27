import { parentPort, workerData } from 'node:worker_threads';
import { Invalid, errorPayload } from '@letsduck/domain';
import { Exporter } from './exporter.js';
import type { ExportRequest, ExportReply } from './protocol.js';
if (!parentPort) throw new Error('Export worker requires a parent port');
const port = parentPort, data: unknown = workerData;
let engine: Exporter | undefined;
try {
  if (!data || typeof data !== 'object' || !('assets' in data) || typeof data.assets !== 'string') throw new Error('Missing assets path');
  engine = new Exporter(data.assets);
} catch { /* Missing or invalid local assets disable export without crashing the host. */ }
const ready: ExportReply = { type: 'ready', available: !!engine, ...(engine ? { metadata: { sourceSha256: engine.model.source_sha256, partIds: engine.model.parts.map(part => part.id), catalog: engine.catalog } } : {}) }; port.postMessage(ready);
// Requests and replies share this private, compiled protocol; request bodies remain untrusted.
port.on('message', (job: ExportRequest) => {
  try {
    if (!engine) throw new Invalid('没有加载模型资产，暂时不能导出', 'validation.31');
    const body = job.body;
    if (body && typeof body === 'object' && 'thumbnails' in body && body.thumbnails && typeof body.thumbnails === 'object') {
      for (const [key, value] of Object.entries(body.thumbnails)) if (value instanceof Uint8Array) Object.defineProperty(body.thumbnails, key, { value: Buffer.from(value.buffer, value.byteOffset, value.byteLength), enumerable: true, writable: true, configurable: true });
    }
    if (job.method === 'plan') { const reply: ExportReply = { type: 'result', id: job.id, method: 'plan', result: engine.plan(body) }; port.postMessage(reply); }
    else {
      const content = engine.export(body).content, reply: ExportReply = { type: 'result', id: job.id, method: 'export', result: content };
      if (content.buffer instanceof ArrayBuffer && content.byteOffset === 0 && content.byteLength === content.buffer.byteLength) port.postMessage(reply, [content.buffer]);
      else port.postMessage(reply);
    }
  } catch (error) {
    const reply: ExportReply = { type: 'error', id: job.id, validation: error instanceof Invalid, error: error instanceof Invalid ? errorPayload(error) : { error: '导出失败，请检查模型资产', code: 'server.failed', params: {} } };
    port.postMessage(reply);
  }
});
