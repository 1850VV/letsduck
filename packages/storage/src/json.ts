import { parseWireJson } from '@letsduck/domain';
export { stringifyWireJson as jsonStringify } from '@letsduck/domain';
export type ExactInteger = number | bigint;
export const jsonParse = parseWireJson;
export const safeInteger = (value: bigint): ExactInteger => value >= -9007199254740991n && value <= 9007199254740991n ? Number(value) : value;
