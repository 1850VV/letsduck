import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { Invalid, isObject, type JsonObject } from '../rules.js';
import { ZipArchive, repackZip } from './zip.js';

const BASE = ['bambu-GFA00-10100', 'bambu-GFA00-10101', 'bambu-GFA00-10604', 'bambu-GFU03-51103'];
export const THUMBNAILS = ['cover', ...Array.from({ length: 6 }, (_, i) => [`plate${i + 1}`, `top${i + 1}`]).flat()];

export function thumbnailBytes(value: unknown) {
  if (!Buffer.isBuffer(value) && (typeof value !== 'string' || !value.startsWith('data:image/png;base64,'))) throw new Invalid('导出缩略图缺失，请等待模型载入后重试。', 'export.23');
  const encoded = typeof value === 'string' ? value.slice(22) : null;
  const data = Buffer.isBuffer(value) ? value : Buffer.from(encoded!, 'base64');
  if ((encoded !== null && !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) || data.length > 600000 || data.length < 24 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || data.readUInt32BE(16) !== 512 || data.readUInt32BE(20) !== 512) throw new Invalid('缩略图格式无效。', 'export.28');
  return data;
}

export class Exporter {
  readonly model: JsonObject; readonly catalog: JsonObject; readonly schema: JsonObject;
  readonly source: Buffer; readonly archive: ZipArchive; readonly config: JsonObject;
  private products: Map<string, JsonObject>; private parts: Map<string, JsonObject>;
  constructor(assets: string) {
    const json = (name: string) => JSON.parse(readFileSync(join(assets, name), 'utf8'));
    this.model = json('model.json'); this.catalog = json('catalog.json'); this.schema = json('export-schema.json');
    this.source = readFileSync(join(assets, 'source.3mf'));
    assert.equal(createHash('sha256').update(this.source).digest('hex'), this.model.source_sha256, 'Source model checksum mismatch');
    this.archive = new ZipArchive(this.source); this.config = JSON.parse(this.archive.read('Metadata/project_settings.config').toString());
    this.products = new Map(this.catalog.products.map((p: JsonObject) => [p.id, p])); this.parts = new Map(this.model.parts.map((p: JsonObject) => [p.id, p]));
  }
  plan(payload: JsonObject): JsonObject {
    if (!isObject(payload) || payload.source_sha256 !== this.model.source_sha256) throw new Invalid('源模型不匹配，请刷新工作台后重试。', 'export.20');
    const assignments = payload.assignments;
    if (!isObject(assignments) || Object.keys(assignments).length !== this.parts.size || [...this.parts.keys()].some(k => !Object.hasOwn(assignments, k))) throw new Invalid('必须提供全部 35 个零件的耗材分配。', 'export.21');
    const palette = [...BASE], rows: JsonObject[] = [];
    for (const [id, part] of this.parts) {
      const productId = assignments[id], product = typeof productId === 'string' ? this.products.get(productId) : undefined;
      if (!product) throw new Invalid(`${id} 尚未选择实际耗材；目标色不能直接作为产品导出。`, 'export.25', { v0: id });
      if (product.series !== part.material) throw new Invalid(`${id} 必须保持 ${part.material}，不能替换材料或硬度。`, 'export.26', { v0: id, v1: part.material });
      if (!palette.includes(productId)) palette.push(productId);
      rows.push({ id, uuid: part.uuid, name: part.name, originalName: part.originalName, plate: part.plate, objectId: part.sourceObject, partId: part.sourcePart, slot: palette.indexOf(productId) + 1, product });
    }
    if (palette.length > 16) throw new Invalid('本版最多支持 16 个耗材槽（包含原始 4 槽），请减少颜色后导出。', 'export.22', { v0: 16 });
    const warnings = ['导出的是可编辑项目，不含切片 G-code。请在 Bambu Studio 中复核并重新切片。', 'TPU 90A 沿用原硬度与参数，使用外置进料，不通过 P1P 的 AMS 进料。', '原 4 槽冲刷量沿用源表；新增颜色间用源表最大值作临时值。切片前须按新颜色重新计算冲刷量。', '官方色表用于屏幕预览，半透明外观为示意；未核验库存、价格或实物色差。'];
    const mixed = Array.from({ length: 6 }, (_, i) => i + 1).filter(i => new Set(rows.filter(r => r.plate === i).map(r => r.product.id)).size > 1);
    if (mixed.includes(1)) warnings.unshift('板 1 含多种 TPU 颜色；这些软料不能通过 AMS 自动换色，需由商家拆分任务或另行安排换料。当前项目保留原摆放。');
    if (mixed.some(i => i !== 1)) warnings.push('部分 PLA 板包含多色，需要匹配实际 AMS / 换料方案并检查擦料塔。');
    return { schema: 'duck-studio-materials/2', name: [...String(payload.name ?? '我的方案')].slice(0, 100).join(''), createdAt: new Date().toISOString(), source_sha256: this.model.source_sha256, sourceFile: 'XGO_duckV2.3mf', catalogue: Object.fromEntries(['version', 'sourceUrl', 'sourceSha256', 'scope'].map(k => [k, this.catalog[k]])), sourceBambuVersion: '02.08.02.61', plateCount: 6, objectCount: 25, partCount: 35, slots: palette.map((p, i) => ({ slot: i + 1, sourceTemplateSlot: i < 4 ? i + 1 : this.products.get(p)!.material === 'TPU' ? 4 : 1, product: this.products.get(p), used: rows.some(r => r.product.id === p) })), parts: rows, mixedColorPlates: mixed, warnings };
  }
  private remapConfig(report: JsonObject) {
    const config = this.config, out = structuredClone(config), templates: number[] = report.slots.map((s: JsonObject) => s.sourceTemplateSlot - 1);
    for (const [key, value] of Object.entries(this.schema.filamentChunks)) {
      const sizes = value as number[], chunks: any[][] = []; let at = 0;
      assert.equal(sizes.reduce((a, b) => a + b, 0), config[key].length, key);
      for (const size of sizes) { chunks.push(config[key].slice(at, at + size)); at += size; }
      out[key] = templates.flatMap(t => chunks[t]!);
    }
    out.filament_self_index = templates.flatMap((t, i) => Array(this.schema.filamentChunks.filament_extruder_variant[t]).fill(String(i + 1)));
    for (const key of ['filament_colour', 'filament_multi_colour']) out[key] = report.slots.map((s: JsonObject) => s.product.hex);
    for (const key of ['different_settings_to_system', 'inherits_group', 'compatible_machine_expression_group']) if (key in config) { assert.equal(config[key].length, 6); out[key] = [config[key][0], ...templates.map(t => config[key][t + 1]), config[key][5]]; }
    if ('compatible_process_expression_group' in config) { assert.equal(config.compatible_process_expression_group.length, 4); out.compatible_process_expression_group = templates.map(t => config.compatible_process_expression_group[t]); }
    const maximum = String(Math.max(...config.flush_volumes_matrix.map(Number)));
    out.flush_volumes_matrix = templates.flatMap((a, i) => templates.map((b, j) => i === j ? '0' : i < 4 && j < 4 ? config.flush_volumes_matrix[a * 4 + b] : maximum));
    out.flush_volumes_vector = templates.flatMap(t => config.flush_volumes_vector.slice(t * 2, t * 2 + 2)); return out;
  }
  private remapObjects(report: JsonObject) {
    const slots = new Map<string, number>(report.parts.map((p: JsonObject) => [p.uuid, p.slot])), seen = new Set<string>();
    let text = this.archive.read('Metadata/model_settings.config').toString();
    text = text.replace(/<part\b[^>]*>[\s\S]*?<\/part>/g, block => {
      const uuid = /\buuid="([^"]+)"/.exec(block)?.[1];
      if (!uuid || !slots.has(uuid) || seen.has(uuid)) throw new Invalid('源零件标识重复或不匹配。', 'export.27');
      seen.add(uuid); const tag = `<metadata key="extruder" value="${slots.get(uuid)}"/>`;
      return /<metadata\s+key="extruder"[^>]*\/>/.test(block) ? block.replace(/<metadata\s+key="extruder"[^>]*\/>/g, tag) : block.replace('</part>', '  ' + tag + '\n    </part>');
    });
    assert.deepEqual(seen, new Set(slots.keys()));
    return Buffer.from(text.replace(/<object\b[^>]*>[\s\S]*?<\/object>/g, block => {
      const uuid = /<part\b[^>]*\buuid="([^"]+)"/.exec(block)![1]!, at = block.indexOf('<part ');
      return block.slice(0, at).replace(/<metadata\s+key="extruder"[^>]*\/>/g, `<metadata key="extruder" value="${slots.get(uuid)}"/>`) + block.slice(at);
    }));
  }
  private verify(content: Buffer, report: JsonObject, config: JsonObject) {
    const target = new ZipArchive(content), geometry = [...this.archive.entries.keys()].filter(n => n.startsWith('3D/'));
    for (const name of geometry) {
      const a = this.archive.entries.get(name)!, b = target.entries.get(name);
      // Identical compression method, data and size necessarily decode to the
      // same model bytes. Only a rewritten record needs decompression to compare.
      const identical = b && a.method === b.method && a.size === b.size && a.crc === b.crc && a.compressed.equals(b.compressed);
      assert.ok(identical || this.archive.read(name).equals(target.read(name)), 'geometry changed');
    }
    assert.deepEqual(JSON.parse(target.read('Metadata/project_settings.config').toString()), config);
    const parser = new DOMParser(), sourceXML = parser.parseFromString(this.archive.read('Metadata/model_settings.config').toString(), 'application/xml'), outputXML = parser.parseFromString(target.read('Metadata/model_settings.config').toString(), 'application/xml');
    const elements = (node: any, name?: string): any[] => Array.from(node.childNodes).filter((n: any) => n.nodeType === 1 && (!name || n.tagName === name));
    const objects = elements(outputXML.documentElement, 'object'), parts = objects.flatMap(o => elements(o, 'part'));
    assert.equal(elements(outputXML.documentElement, 'plate').length, 6); assert.equal(objects.length, 25); assert.equal(parts.length, 35);
    const slots = new Map(report.parts.map((p: JsonObject) => [p.uuid, p.slot]));
    for (const part of parts) assert.equal(Number(elements(part, 'metadata').find(m => m.getAttribute('key') === 'extruder')?.getAttribute('value')), slots.get(part.getAttribute('uuid')));
    const shape = (node: any): any => [node.tagName, Array.from(node.attributes).map((a: any) => [a.name, a.value]).sort(), elements(node).filter(n => !(['object', 'part'].includes(node.tagName) && n.tagName === 'metadata' && n.getAttribute('key') === 'extruder')).map(shape)];
    assert.deepEqual(shape(sourceXML.documentElement), shape(outputXML.documentElement), 'non-material structure changed');
    const changed = Object.keys(this.config).filter(k => JSON.stringify(this.config[k]) !== JSON.stringify(config[k]));
    const allowed = new Set([...Object.keys(this.schema.filamentChunks), 'filament_self_index', 'flush_volumes_matrix', 'flush_volumes_vector', 'different_settings_to_system', 'inherits_group', 'compatible_machine_expression_group', 'compatible_process_expression_group']);
    assert.ok(changed.every(k => allowed.has(k)));
    return { status: 'passed', source_sha256: this.model.source_sha256, geometryEntriesByteIdentical: geometry.length, plateCount: 6, objectCount: 25, partCount: 35, nonMaterialObjectMetadataUnchanged: true, changedConfigurationKeys: changed.sort(), sliced: false, physicalPrintVerified: false };
  }
  export(payload: JsonObject) {
    const report = this.plan(payload), config = this.remapConfig(report);
    const replacements: Record<string, Buffer> = { 'Metadata/project_settings.config': Buffer.from(JSON.stringify(config, null, 4)), 'Metadata/model_settings.config': this.remapObjects(report) };
    const thumbs = payload.thumbnails;
    if (!isObject(thumbs) || Object.keys(thumbs).length !== THUMBNAILS.length || THUMBNAILS.some(k => !Object.hasOwn(thumbs, k))) throw new Invalid('缺少当前方案的完整缩略图。', 'export.24');
    for (let i = 1; i <= 6; i++) {
      const plate = thumbnailBytes(thumbs[`plate${i}`]); replacements[`Metadata/plate_${i}.png`] = plate; replacements[`Metadata/plate_no_light_${i}.png`] = plate; replacements[`Metadata/top_${i}.png`] = thumbnailBytes(thumbs[`top${i}`]);
    }
    const cover = thumbnailBytes(thumbs.cover);
    for (const name of this.archive.entries.keys()) if (name.startsWith('Auxiliaries/.thumbnails/') && name.endsWith('.png')) replacements[name] = cover;
    report.previewNote = '板图与封面由当前网格和已选耗材重新渲染。Auxiliaries 中原作者的 Model/Profile Pictures 属于历史参考，未改写。拾取 ID 图保留原版。';
    report.preservationNote = '原始 4 槽保留，新颜色追加同材料模板；材质、硬度、流量、温度等参数按原槽复制。产品识别信息写入本清单。';
    replacements['[Content_Types].xml'] = Buffer.from(this.archive.read('[Content_Types].xml').toString().replace('</Types>', ' <Override PartName="/Metadata/duck_studio_materials.json" ContentType="application/json"/>\n</Types>'));
    const pack = () => repackZip(this.source, { ...replacements, 'Metadata/duck_studio_materials.json': Buffer.from(JSON.stringify(report, null, 2)) });
    report.validation = this.verify(pack(), report, config); return { content: pack(), report };
  }
}
