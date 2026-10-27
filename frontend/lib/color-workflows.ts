import {jsonStringify} from '../shared/json.js';
import {compatibleProduct} from './filaments.js';
import type { Catalog, Design, ModelPart, Product, WireInteger } from '../shared/types.js';
import {query as $,queryAll as $$,storedJson,isRecord,stringList,required,eventElement,valueElement,inputElement} from './browser.js';
export type ColorProduct=Pick<Product,'id'|'hex'|'series'|'material'>&Partial<Product>;
type PaintPart = Pick<ModelPart,'id'|'material'|'pair'>;
type Patch = Pick<Design,'colors'|'assignments'>;
interface PaletteGroup {key: string; material: string; productId: string | null; color: string; ids: string[]}
interface Point {x: number; y: number}
interface Saved extends Patch {id: string; name: string; provenance: unknown; locked: string[]; created: WireInteger}
interface WorkflowState extends Patch {source: string; parts: ModelPart[]; products: Map<string,Product>; catalog: Catalog; selected: string|null; pairLink: boolean; active: string|null; provenance?: unknown; locked?: string[]; created?: WireInteger}
interface WorkflowAPI {
 getState(): WorkflowState; escapeHTML(value: unknown): string; persist(): unknown; refresh(): void; toast(message: string): void;
 selectRaw(id: string|null,scroll?: boolean): void; setPairLink(value: boolean): void; apply(ids: string[],color: string,productId: string|null): void;
 reset(ids: string[]): void; activate(id: string,options?: {resetLocks: boolean}): void; screenPosition(id: string|null): Point|null;
 setCompare(id: string): void; clearHistory(): void; onSaved?(id: string): void; keepAsDraft(entry: Saved|undefined): void;
}
import { t as _t, label as _label, onLocale as _onLocale } from "../shared/i18n.js"; // Shared selection rules keep every workflow on the same material-bound design.
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
export function createWorkflowUI(api: WorkflowAPI) {
  const KEY = 'duck-studio-workflows-v1';
  let preferences = { defaultWorkflow: 'project', rememberMode: false, showRecent: true };
  let workflow = 'project',saved: Saved[] = [],recent: string[] = [],tool = 'paint';
  let selectionLabel = '';
  let selectedIds: string[] = [],groupSelection = false,multi = false,popup = false,anchor: Point|null = null,busy = false;
  const state = () => api.getState();
  const esc = api.escapeHTML;
  const s = state();
  let held=colorOf(s.selected||required(s.parts[0]).id);
  let restoreWarning = '';
  try {
    const stored = storedJson(KEY);
    if (isRecord(stored) && stored.version === 1 && stored.source === s.source) {
      const prefs=isRecord(stored.preferences)?stored.preferences:{};
      if (typeof prefs.defaultWorkflow==='string' && WORKFLOWS[prefs.defaultWorkflow]) preferences.defaultWorkflow=prefs.defaultWorkflow;
      preferences.rememberMode=prefs.rememberMode===true;preferences.showRecent=prefs.showRecent!==false;
      workflow=preferences.rememberMode && typeof stored.workflow==='string' && WORKFLOWS[stored.workflow]?stored.workflow:preferences.defaultWorkflow;
      const seen = new Set();
      for (const entry of Array.isArray(stored.saved) ? stored.saved : []) {
        if(!isRecord(entry))continue;
        const design = validDesign(entry, s.parts, s.products);
        if (design && typeof entry.id==='string' && /^custom-[a-z\d-]+$/i.test(entry.id) && !seen.has(entry.id) && typeof entry.name === 'string' && entry.name.trim()) {
          saved.push({ id: entry.id, name: entry.name.trim().slice(0, 40), ...design, ...metadata(entry) });seen.add(entry.id);
        } else restoreWarning = '部分自定义方案数据无效，已跳过；原始浏览器存储尚未覆盖。';
      }
      recent = stringList(stored.recent).filter(id=>s.products.has(id)).slice(0,10);
      const restoredHeld=stored.held;
      if (isRecord(restoredHeld) && typeof restoredHeld.color==='string' && typeof restoredHeld.material==='string' && /^#[\da-f]{6}$/i.test(restoredHeld.color) && s.parts.some((p) => p.material === restoredHeld.material)) {
        const product = typeof restoredHeld.productId==='string'?s.products.get(restoredHeld.productId):undefined;
        held = { color: restoredHeld.color.toUpperCase(), material: restoredHeld.material, productId: product && compatibleProduct(restoredHeld.material,product) && product.hex === restoredHeld.color.toUpperCase() ? product.id : null };
      }
    }
  } catch {restoreWarning = '自定义方案存储暂时无法读取。';}
  selectedIds = s.selected ? [s.selected] : [];
  function colorOf(id: string) {const a = state(),p = required(a.parts.find((p) => p.id === id));return { color: required(a.colors[id]), productId: a.assignments[id] || null, material: p.material };}
  function metadata(entry: {provenance?: unknown; locked?: unknown; created?: unknown}) {return {provenance: entry.provenance?structuredClone(entry.provenance):null,locked:stringList(entry.locked).filter(id=>s.parts.some(p=>p.id===id)),created:typeof entry.created==='number'||typeof entry.created==='bigint'?entry.created:Date.now()};}
  function addSaved(entries: Saved[]) {
    const next = entries.map((entry) => {const design = validDesign(entry, s.parts, s.products);if (!design || !/^custom-[a-z\d-]+$/i.test(entry.id) || !entry.name?.trim()) throw Error('私有方案数据无效');return { id: entry.id, name: entry.name.trim().slice(0, 40), ...design, ...metadata(entry) };});
    const ids = new Set(next.map((x) => x.id));const previous = saved;saved = [...saved.filter((x) => !ids.has(x.id)), ...next];
    if (saved.length > 30) {saved = previous;throw Error('私有方案已达 30 套，请先整理方案，再重试带入。');}
    if (!persist()) {saved = previous;throw Error('私有方案保存失败，当前草稿未切换。');}return next;
  }
  function persist() {
    try {localStorage.setItem(KEY, jsonStringify({ version: 1, source: state().source, preferences, workflow, saved, recent, held }));return true;}
    catch {$('#save-status').textContent = '浏览器保存失败，请导出当前方案备份';return false;}
  }
  function commit() {api.persist();}
  function selectedParts() {const a = state();return selectedIds.map((id) => a.parts.find((p) => p.id === id)).filter((part): part is ModelPart=>part!==undefined);}
  function material() {return workflow === 'paint' ? held?.material : selectedParts()[0]?.material;}
  function targets() {return paintTargets(state().parts, selectedIds, state().pairLink, groupSelection);}
  function remember(productId: string|null) {if (productId) recent = [productId, ...recent.filter((id) => id !== productId)].slice(0, 10);}
  function quickProducts() {const a = state(),mat = material();const used = groupPalette(a.parts, a.colors, a.assignments).filter((g) => g.material === mat).map((g) => g.productId).filter((id):id is string=>typeof id==='string');const ids = [...used, ...(preferences.showRecent ? recent : []), ...a.catalog.products.filter((p) => p.series === mat).map((p) => p.id)];return [...new Set(ids)].map((id) => a.products.get(id)).filter((p):p is Product => p!==undefined && p.series === mat).slice(0, 8);}
  function swatch(p: Product) {return `<button type="button" class="compact-swatch" data-choice-product="${p.id}" aria-label="${esc(p.series + ' ' + p.name + ' 色号 ' + p.colorCode)}"><span style="background:${p.hex}"></span><strong>${esc(p.name)}</strong><small>${p.colorCode}</small></button>`;}
  function setWorkflow(next: string|undefined) {
    if (!next || !WORKFLOWS[next]) return;
    workflow = next;tool = 'paint';popup = false;groupSelection = false;selectionLabel = '';
    selectedIds = state().selected ? [required(state().selected)] : [];
    if (next === 'context') {popup = Boolean(selectedIds.length);anchor = null;}
    api.refresh();commit();
  }
  function selectPart(id: string|undefined, { scroll = false, add = false, point = null, open = true, single = false }: {scroll?:boolean;add?:boolean;point?:Point|null;open?:boolean;single?:boolean} = {}) {
    selectionLabel = '';
    const p = state().parts.find((p) => p.id === id);
    if (!id || !p) {selectedIds = [];groupSelection = false;popup = false;api.selectRaw(null);return;}
    if (add && selectedParts().some((x) => x.material !== p.material)) {api.toast('PLA 与 TPU 需要分别选择，材料与硬度保持不变');return;}
    if (single) api.setPairLink(false);
    if (add) selectedIds = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];else
    selectedIds = [id];
    groupSelection = false;
    if (workflow === 'context' && open) {popup = selectedIds.length > 0;anchor = point;}
    api.selectRaw(selectedIds.includes(id) ? id : selectedIds[0] || null, scroll);
  }
  function handlePartClick(id: string, { shiftKey = false, point = null, reference = false, scroll = false }: {shiftKey?:boolean;point?:Point|null;reference?:boolean;scroll?:boolean} = {}) {
    if (reference) {selectPart(id, { point, scroll });api.toast('已选择基准中的对应零件；基准画面不会被点涂');return;}
    if (workflow !== 'paint') return selectPart(id, { add: multi || shiftKey, point, scroll });
    if (tool === 'sample') {held = colorOf(id);tool = 'paint';remember(held.productId);selectPart(id, { open: false, scroll });api.refresh();commit();api.toast('已吸取颜色与材料，可以继续点涂');return;}
    const p = required(state().parts.find((p) => p.id === id));
    if (p.material !== held.material) {api.toast(`拿着的是 ${held.material}；请先切换到 ${p.material} 的颜色`);return;}
    selectPart(id, { open: false, scroll });
    api.apply(targets(), held.color, held.productId);
  }
  function chooseColor(color: string, productId: string|null = null) {
    if (!/^#[\da-f]{6}$/i.test(color)) {api.toast('请输入六位颜色值，例如 #4D6BFE');return;}
    const a = state(),product = a.products.get(productId??''),mat = material();
    if (!mat) return api.toast('请先选择零件或项目色组');
    if (productId && !compatibleProduct(mat,product)) return api.toast('此耗材与当前材料不匹配');
    if (workflow === 'paint') {
      const match = product || a.catalog.products.find((p) => p.series === mat && p.hex === color.toUpperCase());
      held = { color: color.toUpperCase(), material: mat, productId: match?.id || null };tool = 'paint';remember(held.productId);api.refresh();commit();api.toast('已拿起颜色，连续点击模型或零件列表即可上色');
    } else {
      remember(productId);api.apply(targets(), color, productId);
    }
  }
  function selectGroup(key: string) {
    const a = state(),group = groupPalette(a.parts, a.colors, a.assignments).find((g) => g.key === key);
    if (!group) return;
    selectedIds = [...group.ids];groupSelection = true;selectionLabel = '';popup = false;
    api.selectRaw(selectedIds[0]??null);api.toast(`已选同色组 ${selectedIds.length} 件 · ${group.material}`);
  }
  function selectSet(ids: string[], label: string, { single = false } = {}) {
    const a = state(),chosen = ids.filter((id) => a.parts.some((p) => p.id === id));
    if (!chosen.length || new Set(chosen.map((id) => required(a.parts.find((p) => p.id === id)).material)).size !== 1) return;
    if (single) api.setPairLink(false);
    selectedIds = [...new Set(chosen)];groupSelection = true;selectionLabel = label;popup = false;api.selectRaw(selectedIds[0]??null);
  }
  function renderScopeControls() {
    const a = state(),pair = pairedParts(a.parts, selectedIds),ids = targets(),painting = workflow === 'paint';
    const lateral = pair.some((p) => p.name.includes('左')) && pair.some((p) => p.name.includes('右'));
    const syncLabel = pair.length && !lateral ? '配对同步' : '左右同步';
    const modeRow = groupSelection && !painting ? '' : `<div class="scope-segments" role="group" aria-label="上色联动"><button type="button" data-link-mode="single" aria-pressed="${!a.pairLink}">${painting ? '仅点中零件' : selectedIds.length > 1 ? '仅所选零件' : '仅当前零件'}</button><button type="button" data-link-mode="pair" aria-pressed="${a.pairLink}">${syncLabel}</button></div>`;
    const pairRow = painting || !pair.length ? '' : `<div class="scope-segments pair-choices" role="group" aria-label="选择配对零件">${[pair[0], null, pair[1]].map((p) => `<button type="button" data-pair-choice="${p?.id || 'both'}" aria-pressed="${p ? ids.length === 1 && ids[0] === p.id : ids.length === 2 && pair.every((x) => ids.includes(x.id))}">${p ? lateral ? p.name.includes('左') ? '仅左件' : '仅右件' : esc(p.name) : lateral ? '左右两件' : '配对两件'}</button>`).join('')}</div>`;
    const joined = !painting && selectedIds.length === 1 && ['P2-06', 'P3-01'].includes(selectedIds[0]??'');
    const note = joined ? '源文件将两侧做成一个零件，目前整件上色。' : pairRow && lateral ? '左右按机器鸭自身方向。' : '';
    for (const el of $$('.color-scope')) {
      const html = modeRow + pairRow + (note ? `<small>${note}</small>` : '');
      if (el.innerHTML !== html) el.innerHTML = html;
      el.hidden = !html;
    }
  }
  function changeScope(e: Event) {
    const mode = eventElement(e).closest<HTMLElement>('[data-link-mode]'),choice = eventElement(e).closest<HTMLElement>('[data-pair-choice]');
    if (mode) {api.setPairLink(mode.dataset.linkMode === 'pair');api.refresh();commit();}
    if (choice) {
      const pair = pairedParts(state().parts, selectedIds);if (!pair.length) return;
      const both = choice.dataset.pairChoice === 'both';
      api.setPairLink(both);
      selectPart(both ? required(pair.find((p) => p.id === state().selected) || pair[0]).id : choice.dataset.pairChoice, { open: true });
    }
  }
  function resetSelection() {const ids = targets();if (!ids.length) return;api.reset(ids);}
  function switchScheme(id: string) {selectionLabel = '';groupSelection = false;popup = false;selectedIds = state().selected ? [required(state().selected)] : [];api.activate(id);}
  function positionPopup() {
    const el = $('#context-palette');if (el.hidden) return;
    const rect = $('#viewport').getBoundingClientRect();
    const point = anchor || api.screenPosition(state().selected) || { x: rect.left + rect.width * .45, y: rect.top + rect.height * .4 };
    const width = el.offsetWidth,height = el.offsetHeight;
    let left = point.x - rect.left + 20;
    if (left + width > rect.width - 12) left = point.x - rect.left - width - 20;
    el.style.left = Math.max(12, Math.min(left, rect.width - width - 12)) + 'px';
    el.style.top = Math.max(50, Math.min(point.y - rect.top - 45, rect.height - height - 55)) + 'px';
  }
  function refresh() {
    if (busy) return;busy = true;
    try {
      const a = state(),chosen = selectedParts(),ids = targets(),mat = material();
      document.body.dataset.workflow = workflow;
      $$('button[data-workflow]').forEach((b) => {b.classList.toggle('active', b.dataset.workflow === workflow);b.setAttribute('aria-pressed', String(b.dataset.workflow === workflow));});
      $('#workflow-default').textContent = preferences.defaultWorkflow === workflow ? '默认方式 ✓' : '设为默认';
      $('#workflow-help').textContent = workflow === 'project' ? '点色组整组替换，也可选单件微调 · Shift 多选' : workflow === 'paint' ? '先拿颜色，再连续点零件 · 拖动仍为旋转 · I 吸管 · Esc 返回项目色盘' : '点击零件，在旁边选色 · Shift 或多选开关可选择多件';
      $<HTMLInputElement>('#multi-select').checked = multi;$<HTMLInputElement>('#multi-select').disabled = workflow === 'paint';
      $('#project-palette').hidden = workflow !== 'project';
      const palette = groupPalette(a.parts, a.colors, a.assignments);
      $('#project-colors').innerHTML = palette.map((g, i) => {const product = a.products.get(g.productId??''),on = groupSelection && g.ids.length === selectedIds.length && g.ids.every((id) => selectedIds.includes(id));return `<button type="button" class="project-color ${on ? 'active' : ''}" data-palette-index="${i}" aria-pressed="${on}"><span style="background:${g.color}"></span><div><strong>${esc(product?.name || g.color)}</strong><small>${g.material} · ${g.ids.length} 件${product ? ' · ' + product.colorCode : ' · 待匹配'}</small></div></button>`;}).join('');
      const products = quickProducts(),html = products.map(swatch).join('');
      $('#quick-colors').innerHTML = html || '<span>先选零件，再选择适用耗材</span>';
      $('#quick-heading').textContent = preferences.showRecent ? '项目用色 / 最近使用' : '项目用色 / 常用耗材';
      $('#paint-dock').hidden = workflow !== 'paint';
      $('#paint-colors').innerHTML = html;
      $<HTMLSelectElement>('#paint-material').value = held.material;
      const picked = workflow === 'paint' ? held : chosen[0] ? colorOf(chosen[0].id) : null;
      const product = picked ? a.products.get(picked.productId??'') : null;
      $('#held-label').textContent = tool === 'sample' ? '吸管：点零件取色' : `${product?.name || picked?.color || '未选色'} · ${mat || ''}`;
      $('#sample-color').setAttribute('aria-pressed', String(tool === 'sample'));
      $('#picked-summary').textContent = picked ? `${mat} · ${product ? product.name + ' / ' + product.colorCode : picked.color + ' · 目标色待匹配'}` : '点击模型或项目色组开始';
      $('#selection-scope').textContent = workflow === 'paint' ? '点涂整件' + (a.pairLink ? ' · 配对同步' : ' · 仅点中零件') : ids.length ? `${groupSelection ? selectionLabel ? '部位分区' : '整个同色组' : '已选'} ${ids.length} 件 · ${mat}${groupSelection ? ' · 只改当前范围' : ids.length > selectedIds.length ? ' · 含配对零件' : ''}` : '未选择部件';
      if (chosen.length > 1) {$('#selected-name').textContent = groupSelection ? selectionLabel || '整组换色' : `已选 ${chosen.length} 个零件`;$('#selected-meta').textContent = chosen.map((p) => p.id).join(' / ');}
      if (workflow === 'paint') {
        $('#selected-name').textContent = '连续点涂';$('#selected-meta').textContent = '选色不会立即修改零件';$('#material').textContent = held.material;
        $<HTMLInputElement>('#custom-color').value = held.color.toLowerCase();$<HTMLInputElement>('#hex-input').value = held.color;
        for (const id of ['custom-color', 'hex-input', 'apply-hex', 'product-search']) $<HTMLInputElement>('#' + id).disabled = false;
      }
      renderScopeControls();
      $('#reset-part').textContent = groupSelection ? '恢复此组的基准配色' : ids.length > 1 ? `恢复所选 ${ids.length} 件基准配色` : '恢复此零件的基准颜色';
      $('#context-palette').hidden = workflow !== 'context' || !popup || !chosen.length;
      $('#context-name').textContent = chosen.length === 1 ? required(chosen[0]).name : `已选 ${chosen.length} 件`;
      $('#context-material').textContent = `${mat || ''} · ${ids.length} 件${!groupSelection && ids.length > selectedIds.length ? '（含配对零件）' : ''}`;
      $('#context-colors').innerHTML = html;
      const compare = $<HTMLSelectElement>('#compare-base'),before = compare.value;
      compare.innerHTML = [['baseline', 'DeepSeek · 蓝白黑'], ['ocean', '深海 · 蓝色外壳'], ...saved.map((x) => [x.id, x.name])].map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('');
      compare.value = [...compare.options].some((o) => o.value === before) ? before : 'baseline';
      if (compare.value !== before) api.setCompare(compare.value);
      $<HTMLButtonElement>('#manage-schemes').disabled = !saved.length;
      $<HTMLSelectElement>('#workflow-settings-default').value = preferences.defaultWorkflow;
      $<HTMLInputElement>('#remember-workflow').checked = preferences.rememberMode;$<HTMLInputElement>('#show-recent').checked = preferences.showRecent;
      if (picked) $$('[data-choice-product]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.choiceProduct === picked.productId)));
      positionPopup();
    } finally {busy = false;}
  }
  function openLibrary() {$<HTMLDetailsElement>('#material-library').open = true;$('#product-search').focus();$<HTMLDetailsElement>('#material-library').scrollIntoView({ block: 'nearest', behavior: 'smooth' });}
  function openSave() {const a = state();$<HTMLSelectElement>('#scheme-save-target').innerHTML = '<option value="new">保存为新方案</option>' + saved.map((x) => `<option value="${x.id}">更新：${esc(x.name)}</option>`).join('');$<HTMLSelectElement>('#scheme-save-target').value = 'new';$<HTMLInputElement>('#scheme-name-input').value = saved.find((x) => x.id === a.active)?.name || '';$('#scheme-save-message').textContent = '';$<HTMLDialogElement>('#scheme-save-dialog').showModal();$<HTMLInputElement>('#scheme-name-input').focus();}
  function saveScheme(e: Event) {
    e.preventDefault();const a = state(),name = $<HTMLInputElement>('#scheme-name-input').value.trim(),target = $<HTMLSelectElement>('#scheme-save-target').value;
    if (!name) return;if (target === 'new' && saved.length >= 30) {$('#scheme-save-message').textContent = '已保存 30 套，请更新已有方案或先删除不需要的方案。';return;}
    const id = target === 'new' ? 'custom-' + crypto.randomUUID() : target;
    const design = { id, name: name.slice(0, 40), colors: { ...a.colors }, assignments: { ...a.assignments }, ...metadata(a) };
    const previous = saved;saved = target === 'new' ? [...saved, design] : saved.map((x) => x.id === id ? design : x);
    if (!persist()) {saved = previous;$('#scheme-save-message').textContent = '浏览器保存失败，未覆盖已有方案。';return;}
    api.clearHistory();api.activate(id, { resetLocks: true });$<HTMLDialogElement>('#scheme-save-dialog').close();api.toast('已保存私有方案「' + design.name + '」');api.onSaved?.(id);
  }
  function renderManage() {
    const select = $<HTMLSelectElement>('#manage-scheme-select'),current = select.value;select.innerHTML = saved.map((x) => `<option value="${x.id}">${esc(x.name)}</option>`).join('');
    select.value = saved.some((x) => x.id === current) ? current : saved[0]?.id || '';
    $<HTMLInputElement>('#manage-name').value = saved.find((x) => x.id === select.value)?.name || '';$('#delete-scheme').textContent = '删除方案';$('#delete-scheme').dataset.confirm = '';
  }
  // Insert local workflow controls without changing the model/print data.
  $('.workspace-heading').insertAdjacentHTML('afterend', `<div class="workflow-bar"><div class="workflow-switch" role="group" aria-label="调色方式">${Object.entries(WORKFLOWS).map(([id, name]) => `<button type="button" data-workflow="${id}">${name}</button>`).join('')}</div><div class="workflow-actions"><button type="button" id="workflow-default">默认方式 ✓</button><button type="button" id="workflow-settings">自定义操作</button><label><input type="checkbox" id="multi-select">多选</label></div></div><p id="workflow-help"></p><section id="project-palette" aria-label="项目色盘"><div class="palette-caption"><strong>项目色盘</strong><span>同材质、同色号的零件一起换色</span></div><div id="project-colors"></div></section>`);
  $('#viewport').insertAdjacentHTML('beforeend', `<div id="paint-dock" hidden><div class="paint-dock-heading"><strong id="held-label"></strong><select id="paint-material" aria-label="点涂材料"><option>PLA Basic</option><option>TPU 90A</option></select><button type="button" id="sample-color" aria-pressed="false">吸管 I</button></div><div id="paint-colors"></div></div><section id="context-palette" aria-label="就近调色盘" hidden><div class="context-top"><strong id="context-name"></strong><button type="button" id="close-context" aria-label="关闭就近色盘">×</button></div><small id="context-material"></small><div id="context-colors"></div><button type="button" id="context-library" class="text-button">打开完整耗材库 ↗</button></section>`);
  $('#viewport').after($('#paint-dock'));
  $('.editor-top').insertAdjacentHTML('beforeend', '<div id="editor-color-scope" class="color-scope" aria-label="上色范围"></div>');
  $('#paint-colors').insertAdjacentHTML('beforebegin', '<div id="paint-color-scope" class="color-scope" aria-label="点涂范围"></div>');
  $('#context-colors').insertAdjacentHTML('beforebegin', '<div id="context-color-scope" class="color-scope" aria-label="就近上色范围"></div>');
  $$('.color-scope').forEach((el) => el.addEventListener('click', changeScope));
  $('.editor-scroll').insertAdjacentHTML('afterbegin', '<div id="selection-scope" role="status"></div><section class="quick-palette"><h3 id="quick-heading"></h3><div id="quick-colors"></div><p id="picked-summary"></p></section>');
  const library = document.createElement('details');library.id = 'material-library';library.innerHTML = '<summary>完整耗材库 <span>搜索颜色 / 色号</span></summary>';
  const heading = required($('#catalog-count').parentElement);heading.before(library);for (const el of [heading, $('#product-search'), $('#swatches')]) library.append(el);
  const info = document.createElement('details');info.className = 'product-info';info.innerHTML = '<summary>当前耗材详情与产品链接</summary>';
  library.after(info);info.append($('.material-box'));
  $('#duplicate').textContent = '复制为草稿';$('.scheme-heading').insertAdjacentHTML('beforeend', '<div class="scheme-actions"><button type="button" class="text-button" id="save-scheme">＋ 保存自定义方案</button><button type="button" class="text-button" id="manage-schemes">管理</button></div>');
  $('.editor-bottom p').innerHTML = '改色自动保存为草稿<br><small>命名保存后，可随时切换与对比。</small>';
  document.body.insertAdjacentHTML('beforeend', `<dialog id="workflow-settings-dialog"><form method="dialog"><div class="dialog-head"><h2>自定义操作习惯</h2><button class="icon-button" aria-label="关闭操作设置">×</button></div><label class="settings-field">默认调色方式<select id="workflow-settings-default">${Object.entries(WORKFLOWS).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select></label><label class="settings-check"><input id="remember-workflow" type="checkbox">打开时回到上次使用的调色方式</label><label class="settings-check"><input id="show-recent" type="checkbox">色盘显示最近使用的耗材</label><p>三种方式随时切换；这里只设置打开工作台时的习惯。</p><button class="button subtle">完成</button></form></dialog>
  <dialog id="scheme-save-dialog"><form id="scheme-save-form"><div class="dialog-head"><h2>保存私有配色方案</h2><button type="button" class="icon-button" data-close-dialog="scheme-save-dialog" aria-label="关闭保存方案">×</button></div><label class="settings-field">保存位置<select id="scheme-save-target"></select></label><label class="settings-field">方案名称<input id="scheme-name-input" maxlength="40" required placeholder="例如：蓝白 · 白色脚壳"></label><p>仅自己可见。保存全部 35 件颜色、耗材、来源与当前锁定，可再次打开或作为对比基准。</p><p id="scheme-save-message" role="status"></p><button class="button subtle" type="submit">保存私有方案</button></form></dialog>
  <dialog id="manage-schemes-dialog"><div class="dialog-head"><h2>管理自定义方案</h2><button type="button" class="icon-button" data-close-dialog="manage-schemes-dialog" aria-label="关闭方案管理">×</button></div><label class="settings-field">选择方案<select id="manage-scheme-select"></select></label><label class="settings-field">名称<input id="manage-name" maxlength="40"></label><div class="scheme-actions"><button type="button" class="button" id="rename-scheme">保存名称</button><button type="button" class="button" id="delete-scheme">删除方案</button></div><p id="manage-message" role="status"></p></dialog>`);
  $$('button[data-workflow]').forEach((b) => b.addEventListener('click', () => setWorkflow(b.dataset.workflow)));
  $('#workflow-default').onclick = () => {preferences.defaultWorkflow = workflow;preferences.rememberMode = false;commit();refresh();api.toast('默认方式：' + WORKFLOWS[workflow]);};
  $('#workflow-settings').onclick = () => $<HTMLDialogElement>('#workflow-settings-dialog').showModal();
  $<HTMLSelectElement>('#workflow-settings-default').onchange = (e) => {preferences.defaultWorkflow = valueElement(e).value;commit();refresh();};
  $<HTMLInputElement>('#remember-workflow').onchange = (e) => {preferences.rememberMode = inputElement(e).checked;commit();};
  $<HTMLInputElement>('#show-recent').onchange = (e) => {preferences.showRecent = inputElement(e).checked;commit();refresh();};
  $<HTMLInputElement>('#multi-select').onchange = (e) => {multi = inputElement(e).checked;};
  $('#project-colors').onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-palette-index]');if (b) {const a = state();selectGroup(required(groupPalette(a.parts, a.colors, a.assignments)[Number(b.dataset.paletteIndex)]).key);}};
  for (const id of ['quick-colors', 'paint-colors', 'context-colors']) $('#' + id).onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-choice-product]');if (b) {const p = required(state().products.get(b.dataset.choiceProduct??''));chooseColor(p.hex, p.id);}};
  $<HTMLSelectElement>('#paint-material').onchange = (e) => {const a = state(),p = required(a.catalog.products.find((p) => p.series === valueElement(e).value));held = { material: p.series, color: p.hex, productId: p.id };tool = 'paint';api.refresh();commit();};
  $('#sample-color').onclick = () => {tool = tool === 'sample' ? 'paint' : 'sample';refresh();};
  $('#close-context').onclick = () => {popup = false;refresh();};$('#context-library').onclick = openLibrary;
  $('#save-scheme').onclick = openSave;$('#scheme-save-form').onsubmit = saveScheme;
  $<HTMLSelectElement>('#scheme-save-target').onchange = (e) => {if (valueElement(e).value !== 'new') $<HTMLInputElement>('#scheme-name-input').value = saved.find((x) => x.id === valueElement(e).value)?.name || '';};
  $$('[data-close-dialog]').forEach((b) => b.onclick = () => $<HTMLDialogElement>('#' + b.dataset.closeDialog).close());
  $('#manage-schemes').onclick = () => {renderManage();$('#manage-message').textContent = '';$<HTMLDialogElement>('#manage-schemes-dialog').showModal();};
  $<HTMLSelectElement>('#manage-scheme-select').onchange = renderManage;
  $('#rename-scheme').onclick = () => {const id = $<HTMLSelectElement>('#manage-scheme-select').value,name = $<HTMLInputElement>('#manage-name').value.trim();if (!name) {$('#manage-message').textContent = '请输入方案名称';return;}const previous = saved;saved = saved.map((x) => x.id === id ? { ...x, name } : x);if (!persist()) {saved = previous;$('#manage-message').textContent = '浏览器保存失败，名称未更改';return;}api.refresh();renderManage();$('#manage-message').textContent = '名称已保存';};
  $('#delete-scheme').onclick = () => {const id = $<HTMLSelectElement>('#manage-scheme-select').value,b = $('#delete-scheme');if (b.dataset.confirm !== id) {b.dataset.confirm = id;b.textContent = '再次点击，确认删除';return;}const entry = saved.find((x) => x.id === id),previous = saved;saved = saved.filter((x) => x.id !== id);if (!persist()) {saved = previous;$('#manage-message').textContent = '浏览器保存失败，方案未删除';return;}api.clearHistory();if (state().active === id) api.keepAsDraft(entry);api.refresh();commit();if (!saved.length) $<HTMLDialogElement>('#manage-schemes-dialog').close();else renderManage();api.toast('已删除方案；当前配色仍保留');};
  window.addEventListener('resize', positionPopup);
  document.addEventListener('keydown', (e) => {if (document.body.classList.contains('focus-painting')) return;if (eventElement(e).closest<HTMLElement>('input,textarea,select,[contenteditable]') || document.querySelector('dialog[open]')) return;if (e.key.toLowerCase() === 'i' && workflow === 'paint') {tool = tool === 'sample' ? 'paint' : 'sample';refresh();e.preventDefault();}if (e.key === 'Escape') {if (workflow === 'paint') setWorkflow('project');else {popup = false;refresh();}}});
  if (restoreWarning) setTimeout(() => api.toast(restoreWarning), 500);
  return { refresh, persist, chooseColor, selectPart, selectSet, targets, handlePartClick, switchScheme, resetSelection, setWorkflow, openSave, addSaved,
    replaceSaved: (entries: Saved[]) => {saved = entries;},
    isSelected: (id: string) => selectedIds.includes(id), selection: () => [...selectedIds], material,
    getSaved: () => saved, find: (id: string) => saved.find((x) => x.id === id),
    getState: () => ({ workflow, preferences: { ...preferences }, selectedIds: [...selectedIds], selectionLabel, groupSelection, multi, held: { ...held }, tool, saved: saved.map((x) => ({ ...x, colors: { ...x.colors }, assignments: { ...x.assignments } })), recent: [...recent] }),
    closePopup: () => {popup = false;refresh();} };
}
