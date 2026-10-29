import type {ModelPart,Product,Design} from '../shared/types.js';
import {required} from './browser.js';
import {jsonParse,jsonStringify} from '../shared/json.js';
type ProductList=Map<string,Product>|Iterable<Product>;
export type Slots=Record<string,string|undefined>;
export interface Theme {name:string;recipe:string;codes:Record<string,string>}
import { t as _t, onLocale as _onLocale } from "../shared/i18n.js"; // One-click styling for the fixed XGO Duck V2 regions: four colour roles, recipes, dice, themes and share links.
import { ZONES, SOURCE } from './duck-workbench.js';
import {compatibleProduct} from './filaments.js';
export const SLOTS:{id:string;name:string;material?:string}[] = [{ id: 'main', get name() {return _t("text.0536");} }, { id: 'sub', get name() {return _t("text.0537");} }, { id: 'accent', get name() {return _t("text.0538");} }, { id: 'pad', get name() {return _t("text.0539");}, material: 'TPU 90A' }];
// Zone → colour role. The eye itself (P3-01) is resolved separately so it always reads against its shell.
export const RECIPES:Record<string,Record<string,string>> = {
  '经典': { 'head-shell': 'main', 'body-shell': 'main', 'leg-shell': 'sub', structure: 'sub', face: 'accent', feet: 'accent', 'beak-soft': 'pad', soles: 'pad' },
  '撞色': { 'head-shell': 'accent', 'body-shell': 'main', 'leg-shell': 'main', structure: 'sub', face: 'sub', feet: 'accent', 'beak-soft': 'pad', soles: 'pad' },
  '双拼': { 'head-shell': 'sub', 'body-shell': 'main', 'leg-shell': 'sub', structure: 'main', face: 'accent', feet: 'sub', 'beak-soft': 'pad', soles: 'pad' },
  '低调': { 'head-shell': 'main', 'body-shell': 'main', 'leg-shell': 'main', structure: 'sub', face: 'accent', feet: 'main', 'beak-soft': 'pad', soles: 'pad' }
};
export const THEMES:Theme[] = [
{ get name() {return _t("text.0540");}, recipe: '经典', codes: { main: '10100', sub: '10101', accent: '10604', pad: '51103' } },
{ get name() {return _t("text.0541");}, recipe: '经典', codes: { main: '10402', sub: '10100', accent: '10300', pad: '51105' } },
{ get name() {return _t("text.0542");}, recipe: '撞色', codes: { main: '10601', sub: '10101', accent: '10202', pad: '51700' } },
{ get name() {return _t("text.0543");}, recipe: '撞色', codes: { main: '10103', sub: '10105', accent: '10300', pad: '51103' } },
{ get name() {return _t("text.0544");}, recipe: '双拼', codes: { main: '10201', sub: '10203', accent: '10605', pad: '51601' } },
{ get name() {return _t("text.0545");}, recipe: '双拼', codes: { main: '10502', sub: '10201', accent: '10800', pad: '51800' } },
{ get name() {return _t("text.0546");}, recipe: '双拼', codes: { main: '10100', sub: '10200', accent: '10101', pad: '51103' } },
{ get name() {return _t("text.0547");}, recipe: '低调', codes: { main: '10101', sub: '10102', accent: '10603', pad: '51106' } }];

const EYE = 'P3-01';let CHECKS:[string,string,string][] = [['P2-06', 'P4-01', _t("text.0548")], ['P5-01', 'P5-06', _t("text.0549")], ['P2-03', 'P5-01', _t("text.0550")]];
const slotMaterial = (slot:string) => SLOTS.find((s) => s.id === slot)?.material || 'PLA Basic';
const list = (products:ProductList) => [...(products instanceof Map ? products.values() : products)];
export function byCode(products:ProductList, code:string|undefined, material?:string) {return list(products).find((p) => p.colorCode === code && (!material || p.series === material));}
export function hsl(hex:string) {const n = parseInt(hex.slice(1), 16),r = (n >> 16 & 255) / 255,g = (n >> 8 & 255) / 255,b = (n & 255) / 255,mx = Math.max(r, g, b),mn = Math.min(r, g, b),l = (mx + mn) / 2,d = mx - mn;let h = 0,s = 0;if (d) {s = d / (1 - Math.abs(2 * l - 1));h = mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;h *= 60;if (h < 0) h += 360;}return { h, s, l };}
function luminance(hex:string) {const n = parseInt(hex.slice(1), 16);const f=(v:number)=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;};const [r,g,b]=[f(n>>16&255),f(n>>8&255),f(n&255)];return .2126 * r + .7152 * g + .0722 * b;}
export function contrast(a:string, b:string) {const x = luminance(a),y = luminance(b);return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);}
export const isNeutral = (hex:string) => {const c = hsl(hex);return c.s < .2 || c.l > .88 || c.l < .12;};
const hueGap = (a:number, b:number) => {const d = Math.abs(a - b) % 360;return d > 180 ? 360 - d : d;};

// Builds a full 35-part patch; every colour is a catalogue product of the part's own material.
export function quickDesign(parts:readonly Pick<ModelPart,'id'|'material'>[], products:ProductList, slots:Slots, recipe:string) {
  const map = RECIPES[recipe];if (!map) throw Error(_t("text.0551"));
  const colors:Record<string,string> = {},assignments:Record<string,string|null> = {},byId = new Map(list(products).map((p) => [p.id, p]));
  for (const slot of SLOTS) {const p = byId.get(slots[slot.id]??'');if (!p || p.series !== slotMaterial(slot.id)) throw Error(_t("text.0552", { v0: slot.name, v1: slotMaterial(slot.id) }));}
  for (const zone of ZONES) for (const id of zone.ids) {
    const part = parts.find((p) => p.id === id);if (!part) continue;
    const product = byId.get(slots[required(map[zone.id])]??'');
    if (!product || !compatibleProduct(part.material,product)) throw Error(_t("text.0553", { v0: zone.name, v1: product?.series??'' }));
    colors[id] = product.hex.toUpperCase();assignments[id] = product.id;
  }
  if (colors[EYE]) {const shell = required(colors['P2-06'] || colors['P4-01']),eye = required(byCode(products, luminance(shell) < .12 ? '10100' : '10101', 'PLA Basic'));colors[EYE] = eye.hex.toUpperCase();assignments[EYE] = eye.id;}
  return { colors, assignments };
}
// Rolls unlocked roles: a base, a harmony (complement / analogous / neutral) and an accent that stands out from the base.
export function rollSlots(products:ProductList, slots:Slots, recipe:string, locks:Record<string,boolean> = {}, rand = Math.random) {
  const pick = <T>(a:readonly T[]):T => required(a[Math.floor(rand() * a.length) % a.length]),all = list(products);
  const pla = all.filter((p) => p.series === 'PLA Basic'),tpu = all.filter((p) => p.series === 'TPU 90A');
  const colorful = pla.filter((p) => !isNeutral(p.hex)),neutrals = pla.filter((p) => isNeutral(p.hex));
  const near = (hue:number, exclude:(string|undefined)[]) => colorful.filter((p) => !exclude.includes(p.id)).sort((a, b) => hueGap(hsl(a.hex).h, hue) - hueGap(hsl(b.hex).h, hue))[0];
  const hex = (id:string|undefined) => required(all.find((p) => p.id === id)).hex,next = { ...slots };
  if (!locks.main) next.main = (rand() < .35 ? pick(neutrals) : pick(colorful)).id;
  const base = isNeutral(hex(next.main)) ? rand() * 360 : hsl(hex(next.main)).h,style = pick(['互补', '邻近', '中性']);
  if (!locks.sub) next.sub = (style === '中性' || isNeutral(hex(next.main)) ? pick(neutrals.filter((p) => p.id !== next.main)) : required(near((base + (style === '互补' ? 180 : 35)) % 360, [next.main]))).id;
  if (!locks.accent) {let accent,tries = 0;do {accent = isNeutral(hex(next.main)) && isNeutral(hex(next.sub)) ? pick(colorful) : near((base + pick([150, 180, 210])) % 360, [next.main, next.sub]);tries++;} while ((!accent || contrast(accent.hex, hex(next.main)) < 1.4 || accent.id === next.sub) && tries < 10);next.accent = required(accent || colorful[0]).id;}
  if (!locks.pad) {const hue = hsl(hex(next.accent)).h,tinted = tpu.filter((p) => !isNeutral(p.hex)).sort((a, b) => hueGap(hsl(a.hex).h, hue) - hueGap(hsl(b.hex).h, hue));next.pad = (rand() < .5 || !tinted.length ? pick(tpu.filter((p) => isNeutral(p.hex))) : required(tinted[0])).id;}
  return { slots: next, recipe: locks.recipe ? recipe : pick(Object.keys(RECIPES)) };
}
export function themeSlots(products:ProductList, theme:Theme):Slots {return Object.fromEntries(SLOTS.map((s) => [s.id, byCode(products, theme.codes[s.id], slotMaterial(s.id))?.id]));}
// Reads the four roles back from an existing design so the panel opens on what is already painted.
export function slotsFromDesign(products:ProductList, assignments:Design['assignments'], fallback:Slots) {
  const read = (id:string, slot:string) => {const p = list(products).find((x) => x.id === assignments?.[id]);return p?.series === slotMaterial(slot) ? p.id : fallback[slot];};
  return { main: read('P5-06', 'main'), sub: read('P5-01', 'sub'), accent: read('P2-06', 'accent'), pad: read('P1-02', 'pad') };
}
export function designNotes(colors:Design['colors'], assignments?:Design['assignments']) {
  const used = assignments && Object.values(assignments).every(Boolean) ? Object.values(assignments) : Object.values(colors);
  return { count: new Set(used).size, warnings: CHECKS.filter(([a, b]) => colors[a] && colors[b] && colors[a] !== colors[b] && contrast(required(colors[a]), required(colors[b])) < 1.25).map((x) => _t("text.0554", { v0: x[2] })) };
}
// Share format: look=v1.<source prefix>.<colour codes>.<one base36 index per part, model order>[.<name>]
export function encodeLook(parts:readonly Pick<ModelPart,'id'|'material'>[], products:ProductList, assignments:Design['assignments'], name = '', source = SOURCE) {
  const byId = new Map(list(products).map((p) => [p.id, p])),used:string[] = [];
  const legacy=parts.every(part=>{const p=byId.get(assignments[part.id]??'');return p?.brand==='Bambu Lab'&&p.series===part.material&&p.colorCode;});
  const index = parts.map((part) => {const p = byId.get(assignments[part.id]??'');if (!p || !compatibleProduct(part.material,p)) throw Error(_t("text.0555", { v0: parts.length }));const key = legacy?(p.series === 'TPU 90A' ? 't' : '') + p.colorCode:p.id;if (!used.includes(key)) used.push(key);return used.indexOf(key).toString(36);}).join('');
  const codes=legacy?used.join('-'):btoa(jsonStringify(used)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  return [legacy?'v1':'v2', source.slice(0, 8), codes, index, encodeURIComponent(String(name).trim().slice(0, 40))].join('.').replace(/\.$/, '');
}
export function decodeLook(parts:readonly Pick<ModelPart,'id'|'material'>[], products:ProductList, text:string, source = SOURCE) {
  const [version, prefix, codes, index, name = ''] = String(text).split('.');
  if (!version || !['v1','v2'].includes(version) || !codes || !index) throw Error(_t("text.0556"));
  if (prefix !== source.slice(0, 8)) throw Error(_t("text.0557"));
  if (index.length !== parts.length) throw Error(_t("text.0558"));
  let keys:unknown[];try{const parsed:unknown=version==='v1'?codes.split('-'):jsonParse(atob(codes.replace(/-/g,'+').replace(/_/g,'/')));if(!Array.isArray(parsed))throw Error();keys=parsed;}catch{throw Error(_t('text.0556'));}
  const colors:Record<string,string> = {},assignments:Record<string,string|null> = {},byId=new Map(list(products).map(p=>[p.id,p]));
  parts.forEach((part, i) => {const key = keys[parseInt(required(index[i]), 36)];if (typeof key!=='string') throw Error(_t("text.0559"));const tpu = key.startsWith('t'),p = version==='v2'?byId.get(key):byCode(products, tpu ? key.slice(1) : key, tpu ? 'TPU 90A' : 'PLA Basic');if (!p || !compatibleProduct(part.material,p)) throw Error(_t("text.0560"));colors[part.id] = p.hex.toUpperCase();assignments[part.id] = p.id;});
  let title = '';try {title = decodeURIComponent(name).slice(0, 40);} catch {}
  return { colors, assignments, name: title };
}

_onLocale(() => {CHECKS = [['P2-06', 'P4-01', _t("text.0548")], ['P5-01', 'P5-06', _t("text.0549")], ['P2-03', 'P5-01', _t("text.0550")]];});
