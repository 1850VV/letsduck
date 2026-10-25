export class Invalid extends Error {
  constructor(message: string, public code: string, public params: Record<string, unknown> = {}, public status = 422) { super(message); }
  payload() { return { error: this.message, code: this.code, params: this.params }; }
}

export type JsonObject = Record<string, any>;
export const isObject = (value: unknown): value is JsonObject => value !== null && typeof value === 'object' && !Array.isArray(value);
export const truthy = (v: any): boolean => isObject(v) ? Object.keys(v).length > 0 : Array.isArray(v) ? v.length > 0 : Boolean(v);
export const FINISHES = new Set(['basic', 'matte', 'silk', 'translucent', 'tpu']);
export const MAX_SCHEMES = 30;

export function validateDesign(design: unknown, partIds: string[] = []) {
  if (!isObject(design) || !isObject(design.colors) || !isObject(design.assignments)) throw new Invalid('配色数据格式不对', 'validation.1');
  const { colors, assignments } = design;
  if (partIds.length && [colors, assignments].some(v => Object.keys(v).length !== partIds.length || partIds.some(id => !Object.hasOwn(v, id)))) throw new Invalid(`配色必须包含全部 ${partIds.length} 个零件`, 'validation.2', { v0: partIds.length });
  if (Object.values(colors).some(v => typeof v !== 'string' || !/^#[\da-fA-F]{6}$/.test(v))) throw new Invalid('颜色格式不对', 'validation.18');
  if (Object.values(assignments).some(v => v !== null && (typeof v !== 'string' || [...v].length > 80))) throw new Invalid('耗材编号格式不对', 'validation.19');
  const finishes = truthy(design.finishes) ? design.finishes : {};
  if (!isObject(finishes) || Object.values(finishes).some(v => !FINISHES.has(v))) throw new Invalid('质感格式不对', 'validation.3');
  return { colors: Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, v.toUpperCase()])), assignments, finishes: Object.fromEntries(Object.entries(finishes).filter(([k]) => Object.hasOwn(colors, k))) };
}

export function schemeValues(id: string, data: JsonObject, partIds: string[]) {
  if (typeof id !== 'string' || [...id].length < 1 || [...id].length > 64) throw new Invalid('方案编号不对', 'validation.9');
  const name = String(truthy(data.name) ? data.name : '').trim();
  if (!name) throw new Invalid('方案名称不能为空', 'validation.4', { v0: '方案名称' });
  const raw = data.voiceSalt || 0;
  if ((typeof raw === 'string' && !/^[+-]?\d+$/.test(raw.trim())) || !['string', 'boolean', 'number'].includes(typeof raw) || !Number.isFinite(Number(raw))) throw new Invalid('嗓音编号格式不对', 'request.invalid');
  return { name: [...name].slice(0, 40).join(''), design: validateDesign(data.design, partIds), provenance: truthy(data.provenance) ? data.provenance : null, voiceSalt: Math.trunc(Number(raw)) };
}
