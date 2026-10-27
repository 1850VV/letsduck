import { pythonInteger, pythonStrip } from '@letsduck/domain';

export function parseListenPort(value: string): number {
  try {
    if (!pythonStrip(value)) throw new Error('Empty port');
    const port = Number(pythonInteger(value));
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port out of range');
    return port;
  } catch { throw new RangeError('端口必须是0–65535的整数。'); }
}
