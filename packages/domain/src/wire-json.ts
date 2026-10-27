/** Numeric tokens are needed because Python distinguishes JSON integers from floats. */
export class JsonNumericValue {
  constructor(readonly value: number, readonly source: string) {}
  get isInteger() { return !/[.eE]/.test(this.source); }
}
const numericFields = new WeakMap<object, Map<string, { value: number; source: string }>>();

/** Retain numeric source tokens without changing ordinary object/array shapes. */
export function parseWireJson(source: string): unknown {
  const value: unknown = JSON.parse(source, function (this: object, key: string, value: unknown, context?: { source?: string }): unknown {
    if (typeof value !== 'number') return value;
    if (!context?.source) throw new Error('Lossless JSON requires numeric source support');
    if (!/[.eE]/.test(context.source)) {
      const exact = BigInt(context.source);
      if (exact > 9007199254740991n || exact < -9007199254740991n) return exact;
    }
    let fields = numericFields.get(this);
    if (!fields) { fields = new Map(); numericFields.set(this, fields); }
    fields.set(key, { value, source: context.source });
    return value;
  });
  return typeof value === 'number' && /[.eE]/.test(source) ? new JsonNumericValue(value, source.trim()) : value;
}
export function readJsonField(value: object, key: string): unknown {
  const current: unknown = Reflect.get(value, key), numeric = numericFields.get(value)?.get(key);
  return numeric && Object.is(current, numeric.value) ? new JsonNumericValue(numeric.value, numeric.source) : current;
}

export function numericString(value: JsonNumericValue): string {
  if (value.isInteger) return BigInt(value.source).toString();
  const number = value.value;
  if (!Number.isFinite(number)) return number < 0 ? '-inf' : 'inf';
  if (number === 0) return Object.is(number, -0) ? '-0.0' : '0.0';
  const result = Math.abs(number) < 0.0001 || Math.abs(number) >= 1e16 ? number.toExponential() : String(number);
  return /[.e]/.test(result) ? result.replace(/e([+-])(\d)$/, 'e$10$2') : result + '.0';
}

export function pythonType(value: unknown): string {
  if (value === null || value === undefined) return 'NoneType';
  if (value instanceof JsonNumericValue) return value.isInteger ? 'int' : 'float';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'bigint') return 'int';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'string') return 'str';
  return Array.isArray(value) ? 'list' : 'dict';
}
