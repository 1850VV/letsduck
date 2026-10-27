import type { ApiError, ExportPlan } from '@letsduck/contracts';
export interface ExportRequest { id: number; method: 'plan' | 'export'; body: unknown }
export type ExportReply =
  | { type: 'ready'; available: boolean }
  | { type: 'result'; id: number; method: 'plan'; result: ExportPlan }
  | { type: 'result'; id: number; method: 'export'; result: Uint8Array }
  | { type: 'error'; id: number; validation: boolean; error: ApiError };
