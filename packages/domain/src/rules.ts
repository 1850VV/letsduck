import type { ApiError, Design, Finish } from '@letsduck/contracts';
import { integer, record, string, strip, truthy } from './python-values.js';
import { pythonType, readJsonField } from './wire-json.js';

export class LocalizedError extends Error {
  constructor(message: string, readonly code = 'request.invalid', readonly params: Record<string, unknown> = {}) { super(message); }
}
export class Invalid extends LocalizedError {}
export function errorPayload(error: unknown): ApiError {
  return { error: error instanceof Error ? error.message : String(error), code: record(error) && typeof error.code === 'string' ? error.code : 'request.invalid', params: record(error) && record(error.params) ? error.params : {} };
}
export const FINISHES = ['basic', 'matte', 'silk', 'translucent', 'tpu'] as const;
export const MAX_SCHEMES = 30;
const finish = (value: unknown): value is Finish => FINISHES.some(item => item === value);
export function validateDesign(input: unknown, partIds: Iterable<string> = []): Design {
  if (!record(input) || !record(input.colors) || !record(input.assignments)) throw new Invalid('配色数据格式不对', 'validation.1');
  const ids = new Set(partIds);
  if (ids.size && [input.colors, input.assignments].some(values => Object.keys(values).length !== ids.size || Object.keys(values).some(id => !ids.has(id)))) throw new Invalid(`配色必须包含全部 ${ids.size} 个零件`, 'validation.2', { v0: ids.size });
  const colors = new Map<string, string>(), assignments = new Map<string, string | null>(), finishes = new Map<string, Finish>();
  for (const [id, value] of Object.entries(input.colors)) {
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new Invalid('颜色格式不对', 'validation.18');
    colors.set(id, value.toUpperCase());
  }
  for (const [id, value] of Object.entries(input.assignments)) {
    if (value !== null && (typeof value !== 'string' || Array.from(value).length > 80)) throw new Invalid('耗材编号格式不对', 'validation.19');
    assignments.set(id, value);
  }
  const rawFinishes = truthy(input.finishes) ? input.finishes : {};
  if (!record(rawFinishes)) throw new Invalid('质感格式不对', 'validation.3');
  for (const [id, value] of Object.entries(rawFinishes)) {
    if (Array.isArray(value) || record(value)) throw new TypeError("unhashable type: '" + (Array.isArray(value) ? 'list' : 'dict') + "'");
    if (!finish(value)) throw new Invalid('质感格式不对', 'validation.3');
    if (colors.has(id)) finishes.set(id, value);
  }
  return { colors: Object.fromEntries(colors), assignments: Object.fromEntries(assignments), finishes: Object.fromEntries(finishes) };
}
export function text(value: unknown, limit: number, field: string, required = true): string {
  const result = strip(string(truthy(value) ? value : ''));
  if (required && !result) throw new Invalid(field + '不能为空', 'validation.4', { v0: field });
  return Array.from(result).slice(0, limit).join('');
}
export function schemeValues(id: unknown, data: unknown, partIds: Iterable<string> = []) {
  if (typeof id !== 'string' || Array.from(id).length < 1 || Array.from(id).length > 64) throw new Invalid('方案编号不对', 'validation.9');
  if (!record(data)) throw new TypeError("'" + pythonType(data) + "' object has no attribute 'get'");
  return { name: text(readJsonField(data, 'name'), 40, '方案名称'), design: validateDesign(data.design, partIds), provenance: truthy(data.provenance) ? data.provenance : null, voiceSalt: integer(readJsonField(data, 'voiceSalt')) };
}
