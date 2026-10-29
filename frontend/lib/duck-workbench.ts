import { t as _t } from "../shared/i18n.js"; // These regions describe this exact XGO Duck V2 project, not arbitrary imported meshes.
import type {ColorProduct} from './color-workflows.js';
import {compatibleProduct} from './filaments.js';
import type { Design, ModelPart } from '../shared/types.js';
import { required } from './browser.js';
type Patch=Pick<Design,'colors'|'assignments'>;
export interface Zone {id:string;name:string;note:string;ids:string[];internal?:boolean}
export const SOURCE = '731b5be439edd589d2c46330e4ed8c9bc3bd6d4ddcb7bebbc02026a6a740c58c';
export const ZONES: Zone[] = [
{ id: 'head-shell', get name() {return _t("text.0561");}, get note() {return _t("text.0562");}, ids: ['P4-01', 'P2-01', 'P2-02'] },
{ id: 'face', get name() {return _t("text.0563");}, get note() {return _t("text.0564");}, ids: ['P2-06', 'P3-01'] },
{ id: 'body-shell', get name() {return _t("text.0565");}, get note() {return _t("text.0566");}, ids: ['P5-06', 'P5-07', 'P4-03', 'P5-03'] },
{ id: 'leg-shell', get name() {return _t("text.0567");}, get note() {return _t("text.0568");}, ids: ['P5-01', 'P5-02', 'P6-04', 'P6-05', 'P6-02', 'P6-03'] },
{ id: 'feet', get name() {return _t("text.0569");}, get note() {return _t("text.0570");}, ids: ['P2-03', 'P2-04'] },
{ id: 'beak-soft', get name() {return _t("text.0571");}, get note() {return _t("text.0572");}, ids: ['P1-01', 'P1-02'] },
{ id: 'soles', get name() {return _t("text.0573");}, get note() {return _t("text.0574");}, ids: ['P1-03', 'P1-04'] },
{ id: 'structure', get name() {return _t("text.0575");}, get note() {return _t("text.0576");}, internal: true, ids: ['P2-05', 'P2-07', 'P3-02', 'P3-03', 'P3-04', 'P3-05', 'P4-02', 'P5-04', 'P5-05', 'P6-01', 'P6-06', 'P6-07', 'P6-08', 'P6-09'] }];

export function editableIds(parts:readonly {id:string}[], ids:readonly string[], locked:readonly string[] = []) {
  const known = new Set(parts.map((p) => p.id)),protectedIds = new Set(locked);
  return [...new Set(ids)].filter((id) => known.has(id) && !protectedIds.has(id));
}
export function schemePatch(parts:readonly Pick<ModelPart,'id'|'material'>[], ids:readonly string[], locked:readonly string[], design:Partial<Patch>|null|undefined, products:ReadonlyMap<string,ColorProduct>) {
  const colors:Record<string,string> = {},assignments:Record<string,string|null> = {};
  for (const id of editableIds(parts, ids, locked)) {
    const color = design?.colors?.[id];
    if (typeof color!=='string'||!/^#[\da-f]{6}$/i.test(color)) throw Error(_t("text.0577"));
    const p = required(parts.find((p) => p.id === id)),product = products.get(design?.assignments?.[id]??'');
    colors[id] = color.toUpperCase();
    assignments[id] = product && compatibleProduct(p.material,product) && product.hex.toUpperCase() === colors[id] ? product.id : null;
  }
  return { colors, assignments };
}
