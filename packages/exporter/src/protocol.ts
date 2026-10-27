import type { ApiError, ExportPlan, FilamentCatalog } from '@letsduck/contracts';
import type { PlanningData } from './planner.js';
export interface ExportMetadata { sourceSha256: string; partIds: string[]; catalog: FilamentCatalog; planning: PlanningData }
export interface ExportRequest { id: number; method: 'plan' | 'export'; body: unknown }
export type ExportReply =
  | { type: 'ready'; available: boolean; metadata?: ExportMetadata }
  | { type: 'result'; id: number; method: 'plan'; result: ExportPlan }
  | { type: 'result'; id: number; method: 'export'; result: Uint8Array }
  | { type: 'error'; id: number; validation: boolean; error: ApiError };
