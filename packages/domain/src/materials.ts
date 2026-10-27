import type { FilamentCatalog, FilamentProduct, ProfileData } from '@letsduck/contracts';
import { string, truthy } from './python-values.js';

const rigid = new Set(['PLA', 'PETG', 'PET', 'ABS', 'ASA', 'PC', 'PC-ABS', 'PA', 'PA6', 'PA12', 'PA612', 'PAHT', 'PPA', 'PPS', 'PEEK', 'PP', 'HIPS', 'PVB', 'PBT', 'CoPA', 'CoPE']);
export const hardness = (value: unknown) => string(truthy(value) ? value : '').match(/(?<![\p{L}\p{N}_])(\p{Nd}+(?:\.\p{Nd}+)?[AD])(?![\p{L}\p{N}_])/iu)?.[1]?.toUpperCase() ?? null;
export function selectable(product: Partial<FilamentProduct>): boolean {
  return !truthy(product.demo) && product.selectable !== false && /^#[\p{Nd}a-f]{6}$/iu.test(string(product.hex || ''));
}
export function compatibleProduct(material: string, product: Partial<FilamentProduct> | null | undefined): boolean {
  if (!product || !selectable(product) || product.role === 'support' || /support|支撑|支撐/i.test(product.series || '')) return false;
  const family = product.material || (product.series || '').split(/[ -]/)[0] || '';
  return string(material).startsWith('TPU') ? family === 'TPU' && !!hardness(material) && hardness(product.hardness || product.series) === hardness(material) : rigid.has(family);
}
export function mergeCatalog(base: FilamentCatalog, extra: FilamentCatalog | null = null): FilamentCatalog {
  if (!extra) return base;
  const known = new Map(base.products.map(product => [product.id, product])), pending: FilamentProduct[] = [];
  for (const product of extra.products) {
    if (!selectable(product)) pending.push(product);
    else if (!known.has(product.id)) known.set(product.id, product);
  }
  const extension = Object.fromEntries(['version', 'checkedAt', 'scope', 'summary'].filter(key => Object.hasOwn(extra, key)).map(key => [key, extra[key]]));
  return { ...base, ...Object.fromEntries(['version', 'scope', 'summary'].filter(key => Object.hasOwn(extra, key)).map(key => [key, extra[key]])), checkedAt: extra.checkedAt ?? null, products: [...known.values()], pendingProducts: pending, extension };
}
export const normalized = (value: unknown) => string(value).toLowerCase().replace(/[^a-z0-9+]/g, '');
export function resolveProfile(product: Pick<FilamentProduct, 'material' | 'series' | 'brand' | 'hardness'>, data: ProfileData) {
  const material = product.material;
  const suffix = ['CF', 'GF'].find(tag => new RegExp('(?<![\\p{L}\\p{N}_])' + tag + '\\p{Nd}*(?![\\p{L}\\p{N}_])', 'iu').test(product.series));
  const materialType = material + (suffix && !material.endsWith('-' + suffix) ? '-' + suffix : '');
  if (material === 'TPU' && string(product.hardness || product.series).endsWith('90A')) return { status: 'source-tpu90a', name: 'Source TPU 90A', type: 'TPU', settings: {} };
  const profiles = Object.values(data.profiles || {}), brand = (product.brand || '').replaceAll('Bambu Lab', 'Bambu');
  const identities = new Set([normalized(brand + ' ' + product.series)]);
  if (normalized(product.series).startsWith(normalized(brand))) identities.add(normalized(product.series));
  const exact = profiles.filter(profile => identities.has(normalized(profile.name.split(' @')[0])));
  const family = new Map([['PA6', 'PA'], ['PA12', 'PA'], ['PA612', 'PA'], ['PAHT', 'PA'], ['CoPA', 'PA']]).get(material) || material;
  const genericTypes = [materialType, ...(family !== material ? [family + (suffix ? '-' + suffix : '')] : [])];
  const genericNames = new Set(genericTypes.map(kind => normalized('Generic ' + kind)));
  const generic = profiles.filter(profile => genericNames.has(normalized(profile.name.split(' @')[0])));
  for (const [status, choices] of [['official-product', exact], ['official-generic', generic]] as const) {
    const chosen = [...choices].sort((a, b) => Number(!a.compatibleP1P) - Number(!b.compatibleP1P))[0];
    if (chosen) return { status, name: chosen.name, type: chosen.settings.filament_type?.[0] ?? materialType, sourceUrl: chosen.sourceUrl ?? null, compatibleP1P: chosen.compatibleP1P ?? false, settings: chosen.settings };
  }
  return { status: 'unavailable', name: product.series, type: materialType, settings: {} };
}
