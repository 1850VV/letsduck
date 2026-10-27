import { MIMEType } from 'node:util';
import type { ApiError } from '@letsduck/contracts';
import { parseWireJson, isJsonObject } from '@letsduck/domain';
import { THUMBNAILS } from './exporter.js';
import { decodeJsonBytes } from './json-bytes.js';

export class ExportBodyError extends Error {
  readonly body: ApiError;
  constructor(readonly status = 400, code = 'request.format') { super(code); this.body = { error: status === 413 ? '请求太大' : '请求格式不对', code, params: {} }; }
}
const MAX_BODY = 8_000_000;
function parameter(type: MIMEType, key: string): string | null {
  const plain = type.params.get(key); if (plain !== null) return plain;
  const extended = type.params.get(key + '*'); if (extended === null) return null;
  const parts = extended.split("'"); return decodeURIComponent(parts.length >= 3 ? parts.slice(2).join("'") : extended);
}
export async function parseMultipart(bytes: Buffer, contentType: string): Promise<Record<string, unknown> & { thumbnails: Record<string, Buffer> }> {
  if (bytes.length > MAX_BODY) throw new ExportBodyError(413, 'request.too_large');
  try {
    if (contentType.length > 256 || /[\r\n\u0080-\uffff]/u.test(contentType)) throw new Error();
    const type = new MIMEType(contentType), boundary = parameter(type, 'boundary');
    if (type.essence !== 'multipart/form-data' || !boundary || boundary.length > 70) throw new Error();
    const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const text = bytes.toString('latin1'), pattern = new RegExp('(?:^|\\r\\n|\\n|\\r)--' + escaped + '(--)?[ \\t]*(?:\\r\\n|\\n|\\r|$)', 'g');
    const frames = [...text.matchAll(pattern)], fields = new Map<string, Buffer>();
    let closed = false;
    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index]!; if (frame[1]) { closed = true; break; }
      const next = frames[index + 1]; if (!next) throw new Error();
      const start = frame.index + frame[0].length, part = text.slice(start, next.index), separator = /\r\n\r\n|\n\n|\r\r/.exec(part);
      if (!separator) throw new Error();
      const headerText = part.slice(0, separator.index).replace(/(?:\r\n|\n|\r)[ \t]+/g, ' '), headers = new Map<string, string[]>();
      for (const line of headerText.split(/\r\n|\n|\r/)) {
        const colon = line.indexOf(':'); if (colon < 1 || !/^[\x21-\x39\x3b-\x7e]+$/.test(line.slice(0, colon))) throw new Error();
        const name = line.slice(0, colon).toLowerCase(), values = headers.get(name) ?? []; values.push(line.slice(colon + 1).trim()); headers.set(name, values);
      }
      const dispositions = headers.get('content-disposition'); if (dispositions?.length !== 1 || headers.get('content-transfer-encoding')?.[0]) throw new Error();
      const disposition = new MIMEType('x/' + dispositions[0]), name = parameter(disposition, 'name');
      if (disposition.essence !== 'x/form-data' || !name || ![...THUMBNAILS, 'plan'].includes(name) || fields.has(name)) throw new Error();
      const media = new MIMEType(headers.get('content-type')?.[0] ?? 'text/plain').essence;
      if (media.startsWith('multipart/') || (name !== 'plan' && media !== 'image/png')) throw new Error();
      const value = bytes.subarray(start + separator.index + separator[0].length, next.index);
      if (value.length > (name === 'plan' ? 200_000 : 600_000)) throw new Error();
      fields.set(name, value);
    }
    if (!closed || fields.size !== THUMBNAILS.length + 1) throw new Error();
    const rawPlan = fields.get('plan'); if (!rawPlan) throw new Error();
    const plan = parseWireJson(decodeJsonBytes(rawPlan));
    if (!isJsonObject(plan) || Object.hasOwn(plan, 'thumbnails')) throw new Error();
    const thumbnails = Object.fromEntries(THUMBNAILS.map(name => { const bytes = fields.get(name); if (!bytes) throw new Error(); return [name, bytes]; }));
    return Object.assign(plan, { thumbnails });
  } catch { throw new ExportBodyError(); }
}
