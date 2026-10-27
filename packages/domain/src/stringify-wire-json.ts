import { JsonNumericValue, readJsonField } from './wire-json.js';

function compareKeys(left: string, right: string) {
  const a = Array.from(left), b = Array.from(right);
  for (let index = 0; index < Math.min(a.length, b.length); index++) {
    const difference = a[index]!.codePointAt(0)! - b[index]!.codePointAt(0)!; if (difference) return difference;
  }
  return a.length - b.length;
}
function ordered(value: unknown): unknown {
  if (value instanceof JsonNumericValue || !value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((_item, index) => ordered(readJsonField(value, String(index))));
  return Object.fromEntries(Object.keys(value).sort(compareKeys).map(key => [key, ordered(readJsonField(value, key))]));
}
const nativeJson = JSON as typeof JSON & { rawJSON(source: string): unknown };
export function stringifyWireJson(value: unknown, sortKeys = false): string {
  const result = JSON.stringify(sortKeys ? ordered(value) : value, function (this: object, key: string, current: unknown) {
    const original = readJsonField(this, key);
    if (original instanceof JsonNumericValue) return nativeJson.rawJSON(original.source);
    if (typeof current === 'bigint') return nativeJson.rawJSON(current.toString());
    if (typeof current === 'number' && (!Number.isFinite(current) || (Number.isInteger(current) && !Number.isSafeInteger(current)))) throw new Error('JSON numeric precision is unavailable; use parseWireJson');
    return current;
  });
  if (result === undefined) throw new TypeError('Value cannot be stored as JSON');
  return result;
}
