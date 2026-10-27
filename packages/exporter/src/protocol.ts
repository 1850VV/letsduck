import type { ApiError, ExportPlan, FilamentCatalog } from '@letsduck/contracts';
export interface ExportMetadata { sourceSha256: string; partIds: string[]; catalog: FilamentCatalog }
export interface ExportRequest { id: number; method: 'plan' | 'export'; body: unknown }
export type ExportReply =
  | { type: 'ready'; available: boolean; metadata?: ExportMetadata }
  | { type: 'result'; id: number; method: 'plan'; result: ExportPlan }
  | { type: 'result'; id: number; method: 'export'; result: Uint8Array }
  | { type: 'error'; id: number; validation: boolean; error: ApiError };
