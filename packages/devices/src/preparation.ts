/** Physical declarations are independent from firmware operations and numbering history. */
import { servoLeads } from '@letsduck/contracts';
import { Invalid, JsonNumericValue, pythonTruthy, readJsonField } from '@letsduck/domain';
import type { PreparationUpdate } from '@letsduck/storage';
import { IDS } from './shared.js';

export interface PreparationCatalog { requirements: Record<string, { connections: null | Record<string, unknown>[] }> }
export function validatedUpdates(body: Record<string, unknown>, catalog: PreparationCatalog = servoLeads): PreparationUpdate[] {
  const raw = body.ids;
  const ids = Array.isArray(raw) ? raw.map((_value, index) => {
    const value = readJsonField(raw, String(index));
    if (value instanceof JsonNumericValue) return value.isInteger ? Number(BigInt(value.source)) : NaN;
    return typeof value === 'bigint' ? Number(value) : value;
  }) : [];
  if (!Array.isArray(raw) || !ids.length || ids.some(id => typeof id !== 'number' || !Number.isInteger(id) || !IDS.includes(id)) || new Set(ids).size !== ids.length) {
    throw new Invalid('请选择有效且不重复的舵机编号。');
  }
  const values: Omit<PreparationUpdate, 'id'> = {};
  if (Object.hasOwn(body, 'state')) {
    if (!['available', 'picked', 'installed'].includes(String(body.state)) || typeof body.state !== 'string') throw new Invalid('取件状态不正确。');
    values.state = body.state;
  }
  if (Object.hasOwn(body, 'preparedLeads')) {
    const prepared = body.preparedLeads;
    if (ids.length !== 1 || !Array.isArray(prepared) || prepared.some(key => typeof key !== 'string') || new Set(prepared).size !== prepared.length) throw new Invalid('预接线记录不正确。');
    const connections = catalog.requirements[String(ids[0])]!.connections || [];
    const allowed = new Set(connections.filter(lead => lead.sourceStatus === 'confirmed' && typeof lead.cableClass === 'string' && ['long', 'standard'].includes(lead.cableClass) && pythonTruthy(lead.to)
      && typeof lead.lengthMm === 'number' && lead.lengthMm > 0).map(lead => lead.key));
    if (prepared.some(key => !allowed.has(key))) throw new Invalid('线材规格尚未核定，不能记为已备好。');
    values.preparedLeads = prepared;
  }
  if (!Object.keys(values).length) throw new Invalid('没有要保存的取件或预接线记录。');
  return ids.map(id => ({ id, ...values }));
}
