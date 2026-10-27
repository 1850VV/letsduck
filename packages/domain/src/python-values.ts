/** JSON-value conversions at the existing Python business-rule boundary. */
import { JsonNumericValue, numericString, readJsonField } from './wire-json.js';

export function truthy(value: unknown): boolean {
  if (value instanceof JsonNumericValue) return value.value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}
export const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof JsonNumericValue);
export const strip = (value: string) => value.replace(/^[\t-\r\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+|[\t-\r\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/gu, '');

function repr(value: unknown): string {
  if (typeof value !== 'string') return string(value);
  const quote = value.includes("'") && !value.includes('"') ? '"' : "'";
  return quote + Array.from(value, char => {
    if (char === '\n') return '\\n'; if (char === '\r') return '\\r'; if (char === '\t') return '\\t';
    if (char === '\\' || char === quote) return '\\' + char;
    if (char !== ' ' && /[\p{C}\p{Z}]/u.test(char)) {
      const point = char.codePointAt(0)!;
      return point < 256 ? '\\x' + point.toString(16).padStart(2, '0') : point < 65536 ? '\\u' + point.toString(16).padStart(4, '0') : '\\U' + point.toString(16).padStart(8, '0');
    }
    return char;
  }).join('') + quote;
}
export function string(value: unknown): string {
  if (value instanceof JsonNumericValue) return numericString(value);
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number' && value !== 0 && Math.abs(value) < 0.0001) return value.toExponential().replace(/e([+-])(\d)$/, 'e$10$2');
  if (Array.isArray(value)) return '[' + value.map((_item, index) => repr(readJsonField(value, String(index)))).join(', ') + ']';
  if (record(value)) return '{' + Object.keys(value).map(key => repr(key) + ': ' + repr(readJsonField(value, key))).join(', ') + '}';
  return String(value);
}
export function integer(value: unknown): number | bigint {
  const fromWire = value instanceof JsonNumericValue;
  if (value instanceof JsonNumericValue) value = value.isInteger ? BigInt(value.source) : value.value;
  if (!truthy(value)) return 0;
  let result: bigint;
  if (typeof value === 'bigint') result = value;
  else if (typeof value === 'boolean') result = 1n;
  else if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('cannot convert float infinity to integer');
    if (!Number.isSafeInteger(Math.trunc(value)) && !fromWire) throw new Error('Numeric precision is unavailable; use parseWireJson at the input boundary');
    result = BigInt(Math.trunc(value));
  }
  else if (typeof value === 'string' && !/[\u001c-\u001f]/u.test(value) && /^[+-]?\p{Nd}(?:_?\p{Nd})*$/u.test(strip(value))) {
    const digits = Array.from(strip(value).replaceAll('_', ''), char => {
      if (char === '+' || char === '-') return char;
      const point = char.codePointAt(0)!; let zero = point;
      while (/\p{Nd}/u.test(String.fromCodePoint(zero - 1))) zero--;
      return String((point - zero) % 10);
    }).join('');
    result = BigInt(digits);
  } else if (typeof value === 'string') throw new Error('invalid literal for int() with base 10: ' + repr(value));
  else throw new Error("int() argument must be a string, a bytes-like object or a real number, not '" + (Array.isArray(value) ? 'list' : 'dict') + "'");
  return result >= -9007199254740991n && result <= 9007199254740991n ? Number(result) : result;
}
