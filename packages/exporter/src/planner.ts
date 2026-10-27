import assert from 'node:assert/strict';
import type { ExportPlan, FilamentProduct, FilamentProfile, SourceModel } from '@letsduck/contracts';
import { Invalid, compatibleProduct, resolveProfile, readJsonField, pythonString } from '@letsduck/domain';
import type { ExportMetadata } from './protocol.js';

export type PlannerPart = Pick<SourceModel['parts'][number], 'id' | 'uuid' | 'name' | 'originalName' | 'plate' | 'material' | 'sourceObject' | 'sourcePart'>;
export type PlanningProfile = Pick<FilamentProfile, 'name' | 'compatibleP1P' | 'sourceUrl'> & { settings: Pick<FilamentProfile['settings'], 'filament_type'> };
export type PlanningProfileData = { profiles?: Record<string, PlanningProfile> };
export interface PlanningData {
  parts: readonly PlannerPart[];
  legacyProductIds: readonly string[];
  profiles: PlanningProfileData;
  // Preserve the original deferred array/string assertions inside plan().
  sourceFilamentSettingsId: unknown;
}
const BASE = ['bambu-GFA00-10100', 'bambu-GFA00-10101', 'bambu-GFA00-10604', 'bambu-GFU03-51103'];
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
function array(value: unknown): unknown[] { assert.ok(Array.isArray(value), 'Expected source array'); return value; }

/** One deterministic plan algorithm shared by the host and manufacturing worker. */
export class Planner {
  private readonly legacy: Set<string>;
  private readonly products: Map<string, FilamentProduct>;
  constructor(private readonly metadata: ExportMetadata) {
    this.legacy = new Set(metadata.planning.legacyProductIds);
    this.products = new Map(metadata.catalog.products.map(product => [product.id, product]));
  }
  plan(payload: unknown, createdAt: string): ExportPlan {
    if (!object(payload) || payload.source_sha256 !== this.metadata.sourceSha256) throw new Invalid('源模型不匹配，请刷新工作台后重试。', 'export.20');
    const assignments = payload.assignments;
    if (!object(assignments) || Object.keys(assignments).length !== this.metadata.planning.parts.length || this.metadata.planning.parts.some(part => !Object.hasOwn(assignments, part.id))) throw new Invalid('必须提供全部 35 个零件的耗材分配。', 'export.21');
    const palette = [...BASE], rows: ExportPlan['parts'] = [];
    for (const part of this.metadata.planning.parts) {
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
    const unavailable = added.filter(product => resolveProfile(product, this.metadata.planning.profiles).status === 'unavailable');
    if (unavailable.length) warnings.push('以下材料暂无匹配打印预设，可导出耗材清单；3MF 需补齐预设：' + unavailable.map(product => product.brand + ' ' + product.series).join(', '));
    const sourceNames = array(this.metadata.planning.sourceFilamentSettingsId);
    return { schema: 'duck-studio-materials/2', name: Array.from(pythonString(Object.hasOwn(payload, 'name') ? readJsonField(payload, 'name') : '我的方案')).slice(0, 100).join(''), createdAt, source_sha256: this.metadata.sourceSha256, sourceFile: 'XGO_duckV2.3mf', catalogue: Object.fromEntries(['version', 'sourceUrl', 'sourceSha256', 'scope', 'extension'].filter(key => Object.hasOwn(this.metadata.catalog, key)).map(key => [key, this.metadata.catalog[key]])), sourceBambuVersion: '02.08.02.61', plateCount: 6, objectCount: 25, partCount: 35, slots: palette.map((id, index) => {
      const product = this.products.get(id)!;
      const { settings: _settings, ...profile } = resolveProfile(product, this.metadata.planning.profiles);
      const sourceName = sourceNames[index < 4 ? index : product.material === 'TPU' ? 3 : 0]; assert.equal(typeof sourceName, 'string');
      return { slot: index + 1, sourceTemplateSlot: index < 4 ? index + 1 : product.material === 'TPU' ? 4 : 1, product, profile: this.legacy.has(id) ? { status: 'source-template', name: String(sourceName) } : profile, used: rows.some(row => row.product.id === id) };
    }), parts: rows, mixedColorPlates: mixed, warnings };
  }
}
