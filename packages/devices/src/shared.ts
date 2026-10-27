import { setImmediate as immediate, setTimeout as delay } from 'node:timers/promises';
import { servoMap } from '@letsduck/contracts';
import { jsonParse, jsonStringify } from '@letsduck/storage';
import { Cancelled } from './errors.js';
import type { DeviceTiming } from './types.js';
export type { DeviceTiming } from './types.js';

export const IDS: number[] = servoMap.bindings.map(binding => binding.id);
export const MAP_VERSION: string = servoMap.version;

/** Snapshots are JSON data; this also retains original integer/float tokens. */
export function cloneJson<T>(value: T): T { return jsonParse(jsonStringify(value)) as T; }
export async function yieldToEventLoop(): Promise<void> { await immediate(); }
export function deviceTiming(overrides: Partial<DeviceTiming> = {}): DeviceTiming {
  return {
    now: overrides.now ?? (() => Date.now()),
    monotonic: overrides.monotonic ?? (() => performance.now()),
    sleep: overrides.sleep ?? (async (ms, signal) => {
      try { await delay(ms, undefined, signal ? { signal } : undefined); }
      catch (error) { if (signal?.aborted) throw new Cancelled('操作已暂停'); throw error; }
    }),
  };
}
