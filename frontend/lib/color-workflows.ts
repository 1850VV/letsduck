import {jsonStringify} from '../shared/json.js';
import {compatibleProduct} from './filaments.js';
import type { Design, ModelPart, Product } from '../shared/types.js';
import {isRecord,required} from './browser.js';
export type ColorProduct=Pick<Product,'id'|'hex'|'series'|'material'>&Partial<Product>;
type PaintPart = Pick<ModelPart,'id'|'material'|'pair'>;
type Patch = Pick<Design,'colors'|'assignments'>;
interface PaletteGroup {key: string; material: string; productId: string | null; color: string; ids: string[]}
import { t as _t } from "../shared/i18n.js"; // Shared selection rules keep every workflow on the same material-bound design.
export const WORKFLOWS: Record<string,string> = { get project() {return _t("text.0578");}, get paint() {return _t("text.0579");}, get context() {return _t("text.0580");} };
export function groupPalette(parts: readonly PaintPart[], colors: Record<string,string>, assignments: Record<string,string|null>) {
  const groups = new Map<string,PaletteGroup>();
  for (const p of parts) {
    const product = assignments[p.id] || null;
    const color=required(colors[p.id]),key = jsonStringify([p.material, product, color.toUpperCase()]);
    if (!groups.has(key)) groups.set(key, { key, material: p.material, productId: product, color, ids: [] });
    required(groups.get(key)).ids.push(p.id);
  }
  return [...groups.values()].sort((a, b) => Number(a.material.startsWith('TPU')) - Number(b.material.startsWith('TPU')) || b.ids.length - a.ids.length);
}
export function paintTargets(parts: readonly PaintPart[], ids: readonly string[], pairLink: boolean, wholeGroup = false) {
  const map = new Map(parts.map((p) => [p.id, p]));
  const result = new Set(ids.filter((id) => map.has(id)));
  if (pairLink && !wholeGroup) for (const id of [...result]) {
    const p = required(map.get(id)),partner = p.pair ? map.get(p.pair) : undefined;
    if (partner?.material === p.material) result.add(partner.id);
  }
  return [...result];
}
// Only explicit, reciprocal pairs in the source model qualify. Camera position
// does not determine the duck's left/right, and a joined mesh is not a pair.
const LEFT_IDS=new Set(['P1-04','P2-04','P2-07','P3-05','P5-02','P5-05','P5-07','P6-03','P6-05','P6-07']);
const RIGHT_IDS=new Set(['P1-03','P2-03','P2-05','P3-04','P5-01','P5-04','P5-06','P6-02','P6-04','P6-06']);
export const partSide=(part: {id:string})=>LEFT_IDS.has(part.id)?'left':RIGHT_IDS.has(part.id)?'right':null;
export function pairedParts<T extends PaintPart>(parts: readonly T[], ids: readonly string[]) {
  if (!ids.length) return [];
  const first = parts.find((p) => p.id === ids[0]),partner = parts.find((p) => p.id === first?.pair);
  if (!first || !partner || partner.pair !== first.id || partner.material !== first.material || ids.some((id) => id !== first.id && id !== partner.id)) return [];
  return parts.filter((p) => p.id === first.id || p.id === partner.id).sort((a, b) => Number(partSide(b)==='left') - Number(partSide(a)==='left'));
}
export function sideParts(parts: readonly PaintPart[], ids: readonly string[], side: string) {
  return ids.filter((id) => {
    const pair = pairedParts(parts, [id]),p = parts.find((p) => p.id === id);
    return !!p && pair.length === 2 && pair.every((x) => ids.includes(x.id)) && pair.some((x) => partSide(x)==='left') && pair.some((x) => partSide(x)==='right') && partSide(p)===side;
  });
}
export function validDesign(value: unknown, parts: readonly PaintPart[], products: ReadonlyMap<string,ColorProduct>): Patch|null {
  if (!isRecord(value) || !isRecord(value.colors)) return null;
  const sourceColors=value.colors,sourceAssignments=isRecord(value.assignments)?value.assignments:{};
  if (!parts.every((p) => typeof sourceColors[p.id]==='string' && /^#[\da-f]{6}$/i.test(String(sourceColors[p.id])))) return null;
  const colors: Record<string,string> = {},assignments: Record<string,string|null> = {};
  for (const p of parts) {
    colors[p.id] = String(sourceColors[p.id]).toUpperCase();
    const productId=sourceAssignments[p.id],product = typeof productId==='string'?products.get(productId):undefined;
    assignments[p.id] = product && compatibleProduct(p.material,product) && product.hex.toUpperCase() === colors[p.id] ? product.id : null;
  }
  return { colors, assignments };
}
