import type { PersonalStore } from '@letsduck/storage';

export interface DuckRuntime {
  serial: string | null;
  port: number | null;
  connect(): Promise<string>;
  request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown>;
  halt(): Promise<void>;
  close(): Promise<void>;
}

export type DeviceStore = Pick<PersonalStore, 'servoRecords' | 'saveServoRecord' | 'servoPreparationRecords' | 'saveServoPreparation'>;
export interface DeviceTiming {
  now(): number;
  monotonic(): number;
  sleep(ms: number, signal?: AbortSignal): Promise<void>;
}
