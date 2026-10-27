import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { Ajv, type ValidateFunction } from 'ajv';
import { DOMParser, type Element, type Node } from '@xmldom/xmldom';
import { catalogSchema, profileDataSchema, sourceModelSchema, exportSchemaSchema, type FilamentCatalog, type FilamentProduct, type ProfileData, type SourceModel, type ExportSchema, type ExportPlan, type ManufacturingValidation } from '@letsduck/contracts';
import { Invalid, compatibleProduct, mergeCatalog, resolveProfile, readJsonField, pythonString } from '@letsduck/domain';
import { ZipArchive, repackZip } from './zip.js';

const BASE = ['bambu-GFA00-10100', 'bambu-GFA00-10101', 'bambu-GFA00-10604', 'bambu-GFU03-51103'];
export const THUMBNAILS = ['cover', ...Array.from({ length: 6 }, (_, index) => [`plate${index + 1}`, `top${index + 1}`]).flat()];
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const ajv = new Ajv({ coerceTypes: false, removeAdditional: false, useDefaults: false });
const validateModel = ajv.compile<SourceModel>(sourceModelSchema), validateCatalog = ajv.compile<FilamentCatalog>(catalogSchema), validateProfiles = ajv.compile<ProfileData>(profileDataSchema), validateSchema = ajv.compile<ExportSchema>(exportSchemaSchema);
function decoded<T>(data: unknown, validate: ValidateFunction<T>): T { if (!validate(data)) throw new Error('Invalid local asset structure: ' + ajv.errorsText(validate.errors)); return data; }
function array(value: unknown): unknown[] { assert.ok(Array.isArray(value), 'Expected source array'); return value; }
function dictionary(value: unknown): Record<string, unknown> { assert.ok(object(value), 'Expected source object'); return value; }
const elements = (node: Node) => Array.from(node.childNodes).filter((child): child is Element => child.nodeType === 1);
function canonical(node: Element): string {
  const attributes = Array.from(node.attributes).map(attribute => [attribute.name, attribute.value]).sort(([a], [b]) => (a || '').localeCompare(b || ''));
  const children = elements(node).filter(child => !(['object', 'part'].includes(node.tagName) && child.tagName === 'metadata' && child.getAttribute('key') === 'extruder'));
  return JSON.stringify([node.tagName, attributes, children.map(canonical)]);
}
export function thumbnailBytes(value: unknown): Buffer {
  if (!Buffer.isBuffer(value) && (typeof value !== 'string' || !value.startsWith('data:image/png;base64,'))) throw new Invalid('导出缩略图缺失，请等待模型载入后重试。', 'export.23');
  const encoded = typeof value === 'string' ? value.slice(22) : null, data = Buffer.isBuffer(value) ? value : Buffer.from(encoded!, 'base64');
  if ((encoded !== null && !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) || data.length > 600000 || data.length < 24 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || data.readUInt32BE(16) !== 512 || data.readUInt32BE(20) !== 512) throw new Invalid('缩略图格式无效。', 'export.28');
  return data;
}

export class Exporter {
  readonly model: SourceModel; readonly catalog: FilamentCatalog; readonly schema: ExportSchema; readonly profiles: ProfileData;
  readonly source: Buffer; readonly archive: ZipArchive; readonly config: Record<string, unknown>;
  private readonly legacy: Set<string>; private readonly products: Map<string, FilamentProduct>;
  constructor(assets: string) {
    const json = (name: string): unknown => JSON.parse(readFileSync(join(assets, name), 'utf8'));
    this.model = decoded(json('model.json'), validateModel);
    const base = decoded(json('catalog.json'), validateCatalog); this.legacy = new Set(base.products.map(product => product.id));
    this.catalog = mergeCatalog(base, existsSync(join(assets, 'filament-catalog.json')) ? decoded(json('filament-catalog.json'), validateCatalog) : null);
    this.profiles = existsSync(join(assets, 'filament-profiles.json')) ? decoded(json('filament-profiles.json'), validateProfiles) : { profiles: {} };
    this.schema = decoded(json('export-schema.json'), validateSchema);
    this.source = readFileSync(join(assets, 'source.3mf'));
    assert.equal(createHash('sha256').update(this.source).digest('hex'), this.model.source_sha256, 'Source model checksum mismatch');
    this.archive = new ZipArchive(this.source); this.config = dictionary(JSON.parse(this.archive.read('Metadata/project_settings.config').toString()));
    this.products = new Map(this.catalog.products.map(product => [product.id, product]));
  }
  plan(payload: unknown): ExportPlan {
    if (!object(payload) || payload.source_sha256 !== this.model.source_sha256) throw new Invalid('源模型不匹配，请刷新工作台后重试。', 'export.20');
    const assignments = payload.assignments;
    if (!object(assignments) || Object.keys(assignments).length !== this.model.parts.length || this.model.parts.some(part => !Object.hasOwn(assignments, part.id))) throw new Invalid('必须提供全部 35 个零件的耗材分配。', 'export.21');
    const palette = [...BASE], rows: ExportPlan['parts'] = [];
    for (const part of this.model.parts) {
      const productId = assignments[part.id], product = typeof productId === 'string' ? this.products.get(productId) : undefined;
      if (!product || typeof productId !== 'string') throw new Invalid(`${part.id} 尚未选择实际耗材；目标色不能直接作为产品导出。`, 'export.25', { v0: part.id });
      if (!compatibleProduct(part.material, product)) throw new Invalid(`${part.id} 必须保持 ${part.material}，不能替换材料或硬度。`, 'export.26', { v0: part.id, v1: part.material });
      if (!palette.includes(productId)) palette.push(productId);
      rows.push({ id: part.id, uuid: part.uuid, name: part.name, originalName: part.originalName, plate: part.plate, objectId: part.sourceObject, partId: part.sourcePart, slot: palette.indexOf(productId) + 1, product });
    }
    if (palette.length > 16) throw new Invalid('本版最多支持 16 个耗材槽（包含原始 4 槽），请减少颜色后导出。', 'export.22', { v0: 16 });
    const warnings = ['导出的是可编辑项目，不含切片 G-code。请在 Bambu Studio 中复核并重新切片。', 'TPU 90A 沿用原硬度与参数，使用外置进料，不通过 P1P 的 AMS 进料。', '原 4 槽冲刷量沿用源表；新增颜色间用源表最大值作临时值。切片前须按新颜色重新计算冲刷量。', '官方色表用于屏幕预览，半透明外观为示意；未核验库存、价格或实物色差。'];
    const mixed = Array.from({ length: 6 }, (_, index) => index + 1).filter(plate => new Set(rows.filter(row => row.plate === plate).map(row => row.product.id)).size > 1);
    if (mixed.includes(1)) warnings.unshift('板 1 含多种 TPU 颜色；这些软料不能通过 AMS 自动换色，需由商家拆分任务或另行安排换料。当前项目保留原摆放。');
    const added = palette.filter(id => !this.legacy.has(id)).map(id => this.products.get(id)!);
    if (added.length) warnings.push('新增耗材使用厂商或通用官方预设；TPU 90A 沿用源项目参数。切片前须核对机型、喷嘴及耗材参数，未进行实物打印验证。');
    if (mixed.some(plate => plate !== 1)) warnings.push('部分 PLA 板包含多色，需要匹配实际 AMS / 换料方案并检查擦料塔。');
    const unavailable = added.filter(product => resolveProfile(product, this.profiles).status === 'unavailable');
    if (unavailable.length) warnings.push('以下材料暂无匹配打印预设，可导出耗材清单；3MF 需补齐预设：' + unavailable.map(product => product.brand + ' ' + product.series).join(', '));
    const sourceNames = array(this.config.filament_settings_id);
    return { schema: 'duck-studio-materials/2', name: Array.from(pythonString(Object.hasOwn(payload, 'name') ? readJsonField(payload, 'name') : '我的方案')).slice(0, 100).join(''), createdAt: new Date().toISOString(), source_sha256: this.model.source_sha256, sourceFile: 'XGO_duckV2.3mf', catalogue: Object.fromEntries(['version', 'sourceUrl', 'sourceSha256', 'scope', 'extension'].filter(key => Object.hasOwn(this.catalog, key)).map(key => [key, this.catalog[key]])), sourceBambuVersion: '02.08.02.61', plateCount: 6, objectCount: 25, partCount: 35, slots: palette.map((id, index) => {
      const product = this.products.get(id)!;
      const { settings: _settings, ...profile } = resolveProfile(product, this.profiles);
      const sourceName = sourceNames[index < 4 ? index : product.material === 'TPU' ? 3 : 0]; assert.equal(typeof sourceName, 'string');
      return { slot: index + 1, sourceTemplateSlot: index < 4 ? index + 1 : product.material === 'TPU' ? 4 : 1, product, profile: this.legacy.has(id) ? { status: 'source-template', name: String(sourceName) } : profile, used: rows.some(row => row.product.id === id) };
    }), parts: rows, mixedColorPlates: mixed, warnings };
  }
  private remapConfig(report: ExportPlan): Record<string, unknown> {
    const config = this.config, out = structuredClone(config), templates = report.slots.map(slot => slot.sourceTemplateSlot - 1);
    for (const [key, sizes] of Object.entries(this.schema.filamentChunks)) {
      const values = array(config[key]); assert.equal(sizes.reduce((sum, size) => sum + size, 0), values.length, key);
      const chunks: unknown[][] = []; let offset = 0;
      for (const size of sizes) { chunks.push(values.slice(offset, offset + size)); offset += size; }
      out[key] = templates.flatMap(template => chunks[template]!);
    }
    const variants = this.schema.filamentChunks.filament_extruder_variant; assert.ok(variants);
    out.filament_self_index = templates.flatMap((template, index) => Array.from({ length: variants[template]! }, () => String(index + 1)));
    for (const key of ['filament_colour', 'filament_multi_colour']) out[key] = report.slots.map(slot => slot.product.hex);
    for (const [index, slot] of report.slots.entries()) {
      const product = slot.product; if (this.legacy.has(product.id)) continue;
      const profile = resolveProfile(product, this.profiles);
      const settings: Record<string, unknown> = profile.settings;
      for (const [key, sizes] of Object.entries(this.schema.filamentChunks)) {
        const input: unknown = settings[key]; if (!Array.isArray(input) || !input.length) continue;
        const size = sizes[templates[index]!]!, values = input.length === 1 ? Array.from({ length: size }, () => input[0]) : input;
        if (values.length !== size) continue;
        const offset = templates.slice(0, index).reduce((sum, template) => sum + sizes[template]!, 0);
        array(out[key]).splice(offset, size, ...values);
      }
      const label = [product.brand, product.series, product.name, product.colorCode || product.skus?.[0]].filter(Boolean).join(' · ');
      array(out.filament_vendor)[index] = product.brand; array(out.filament_type)[index] = profile.type;
      array(out.filament_ids)[index] = product.brand === 'Bambu Lab' && product.familyId ? product.familyId : 'DUCK-' + createHash('sha256').update(product.id).digest('hex').slice(0, 12);
      array(out.filament_settings_id)[index] = label;
      array(out.filament_colour)[index] = product.hex;
      array(out.filament_multi_colour)[index] = (product.colors?.length ? product.colors : [product.hex]).join(' ');
      if (Object.hasOwn(out, 'filament_colour_type')) array(out.filament_colour_type)[index] = (product.colors?.length || 0) > 1 ? '2' : '1';
    }
    for (const key of ['different_settings_to_system', 'inherits_group', 'compatible_machine_expression_group']) if (Object.hasOwn(config, key)) {
      const old = array(config[key]); assert.equal(old.length, 6, key); out[key] = [old[0], ...templates.map(template => old[template + 1]), old[5]];
    }
    if (Object.hasOwn(config, 'compatible_process_expression_group')) { const old = array(config.compatible_process_expression_group); assert.equal(old.length, 4); out.compatible_process_expression_group = templates.map(template => old[template]); }
    for (const [index, slot] of report.slots.entries()) if (!this.legacy.has(slot.product.id)) {
      const profile = resolveProfile(slot.product, this.profiles);
      if (profile.status.startsWith('official-')) {
        if (Object.hasOwn(out, 'inherits_group')) array(out.inherits_group)[index + 1] = profile.name;
        if (Object.hasOwn(out, 'different_settings_to_system')) array(out.different_settings_to_system)[index + 1] = 'filament_vendor;filament_type;filament_ids;filament_settings_id;filament_colour;filament_multi_colour';
      }
    }
    const old = array(config.flush_volumes_matrix), maximum = String(Math.max(...old.map(Number)));
    out.flush_volumes_matrix = templates.flatMap((a, i) => templates.map((b, j) => i === j ? '0' : i < 4 && j < 4 ? old[a * 4 + b] : maximum));
    out.flush_volumes_vector = templates.flatMap(template => array(config.flush_volumes_vector).slice(template * 2, template * 2 + 2));
    return out;
  }
  private remapObjects(report: ExportPlan): Buffer {
    const slots = new Map(report.parts.map(part => [part.uuid, part.slot])), seen = new Set<string>();
    const text = this.archive.read('Metadata/model_settings.config').toString().replace(/<part\b[^>]*>[\s\S]*?<\/part>/g, block => {
      const uuid = /\buuid="([^"]+)"/.exec(block)?.[1];
      if (!uuid || !slots.has(uuid) || seen.has(uuid)) throw new Invalid('源零件标识重复或不匹配。', 'export.27');
      seen.add(uuid); const tag = `<metadata key="extruder" value="${slots.get(uuid)}"/>`;
      return /<metadata\s+key="extruder"[^>]*\/>/.test(block) ? block.replace(/<metadata\s+key="extruder"[^>]*\/>/g, tag) : block.replace('</part>', '  ' + tag + '\n    </part>');
    });
    assert.deepEqual(seen, new Set(slots.keys()));
    return Buffer.from(text.replace(/<object\b[^>]*>[\s\S]*?<\/object>/g, block => {
      const uuid = /<part\b[^>]*\buuid="([^"]+)"/.exec(block)?.[1]; assert.ok(uuid);
      const at = block.indexOf('<part '); return block.slice(0, at).replace(/<metadata\s+key="extruder"[^>]*\/>/g, `<metadata key="extruder" value="${slots.get(uuid)}"/>`) + block.slice(at);
    }));
  }
  private verify(content: Buffer, report: ExportPlan, config: Record<string, unknown>): ManufacturingValidation {
    const target = new ZipArchive(content), geometry = [...this.archive.entries.keys()].filter(name => name.startsWith('3D/'));
    for (const name of geometry) assert.deepEqual(target.entries.get(name)?.local, this.archive.entries.get(name)!.local, 'geometry changed');
    assert.deepEqual(JSON.parse(target.read('Metadata/project_settings.config').toString()), config);
    const parser = new DOMParser(), original = parser.parseFromString(this.archive.read('Metadata/model_settings.config').toString(), 'application/xml'), output = parser.parseFromString(target.read('Metadata/model_settings.config').toString(), 'application/xml');
    assert.ok(original.documentElement && output.documentElement);
    const objects = elements(output.documentElement).filter(node => node.tagName === 'object'), parts = objects.flatMap(elements).filter(node => node.tagName === 'part');
    assert.equal(elements(output.documentElement).filter(node => node.tagName === 'plate').length, 6); assert.equal(objects.length, 25); assert.equal(parts.length, 35);
    const slots = new Map(report.parts.map(part => [part.uuid, part.slot]));
    for (const part of parts) {
      const extruder = elements(part).find(node => node.tagName === 'metadata' && node.getAttribute('key') === 'extruder');
      assert.equal(Number(extruder?.getAttribute('value')), slots.get(part.getAttribute('uuid') || ''));
    }
    assert.equal(canonical(output.documentElement), canonical(original.documentElement), 'non-material structure changed');
    const changed = Object.keys(this.config).filter(key => JSON.stringify(this.config[key]) !== JSON.stringify(config[key])).sort();
    const allowed = new Set([...Object.keys(this.schema.filamentChunks), 'filament_self_index', 'flush_volumes_matrix', 'flush_volumes_vector', 'different_settings_to_system', 'inherits_group', 'compatible_machine_expression_group', 'compatible_process_expression_group']);
    assert.ok(changed.every(key => allowed.has(key)), 'non-material configuration changed');
    return { status: 'passed', source_sha256: this.model.source_sha256, geometryEntriesByteIdentical: geometry.length, plateCount: 6, objectCount: 25, partCount: 35, nonMaterialObjectMetadataUnchanged: true, changedConfigurationKeys: changed, sliced: false, physicalPrintVerified: false };
  }
  export(payload: unknown) {
    const report = this.plan(payload), unresolved = report.slots.filter(slot => slot.used && slot.profile.status === 'unavailable');
    if (unresolved.length) throw new Invalid('暂无法导出 3MF：尚无匹配打印预设（' + unresolved.map(slot => slot.product.brand + ' ' + slot.product.series).join('、') + '）。可先导出耗材清单。');
    const config = this.remapConfig(report), replacements: Record<string, Buffer> = { 'Metadata/project_settings.config': Buffer.from(JSON.stringify(config, null, 4)), 'Metadata/model_settings.config': this.remapObjects(report) };
    const thumbnails = object(payload) ? payload.thumbnails : undefined;
    if (!object(thumbnails) || Object.keys(thumbnails).length !== THUMBNAILS.length || THUMBNAILS.some(name => !Object.hasOwn(thumbnails, name))) throw new Invalid('缺少当前方案的完整缩略图。', 'export.24');
    for (let plate = 1; plate <= 6; plate++) {
      const image = thumbnailBytes(thumbnails[`plate${plate}`]); replacements[`Metadata/plate_${plate}.png`] = image; replacements[`Metadata/plate_no_light_${plate}.png`] = image; replacements[`Metadata/top_${plate}.png`] = thumbnailBytes(thumbnails[`top${plate}`]);
    }
    const cover = thumbnailBytes(thumbnails.cover);
    for (const name of this.archive.entries.keys()) if (name.startsWith('Auxiliaries/.thumbnails/') && name.endsWith('.png')) replacements[name] = cover;
    report.previewNote = '板图与封面由当前网格和已选耗材重新渲染。Auxiliaries 中原作者的 Model/Profile Pictures 属于历史参考，未改写。拾取 ID 图保留原版。';
    report.preservationNote = '原始 4 槽与原 36 色预设保留。新增真实耗材写入原生品牌、材料类型、系列与色号，并使用匹配的本地官方预设；TPU 90A 沿用源项目参数。完整产品身份与预设来源保存在本清单。';
    replacements['[Content_Types].xml'] = Buffer.from(this.archive.read('[Content_Types].xml').toString().replace('</Types>', ' <Override PartName="/Metadata/duck_studio_materials.json" ContentType="application/json"/>\n</Types>'));
    const pack = (value: ExportPlan) => repackZip(this.source, { ...replacements, 'Metadata/duck_studio_materials.json': Buffer.from(JSON.stringify(value, null, 2)) });
    const complete = { ...report, validation: this.verify(pack(report), report, config) };
    return { content: pack(complete), report: complete };
  }
}
