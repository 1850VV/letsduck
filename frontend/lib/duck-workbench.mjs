import { t as _t, label as _label, onLocale as _onLocale } from "../shared/i18n.mjs"; // These regions describe this exact XGO Duck V2 project, not arbitrary imported meshes.
import { sideParts } from './color-workflows.mjs';
export const SOURCE = '731b5be439edd589d2c46330e4ed8c9bc3bd6d4ddcb7bebbc02026a6a740c58c';
export let ZONES = [
{ id: 'head-shell', get name() {return _t("text.0561");}, get note() {return _t("text.0562");}, ids: ['P4-01', 'P2-01', 'P2-02'] },
{ id: 'face', get name() {return _t("text.0563");}, get note() {return _t("text.0564");}, ids: ['P2-06', 'P3-01'] },
{ id: 'body-shell', get name() {return _t("text.0565");}, get note() {return _t("text.0566");}, ids: ['P5-06', 'P5-07', 'P4-03', 'P5-03'] },
{ id: 'leg-shell', get name() {return _t("text.0567");}, get note() {return _t("text.0568");}, ids: ['P5-01', 'P5-02', 'P6-04', 'P6-05', 'P6-02', 'P6-03'] },
{ id: 'feet', get name() {return _t("text.0569");}, get note() {return _t("text.0570");}, ids: ['P2-03', 'P2-04'] },
{ id: 'beak-soft', get name() {return _t("text.0571");}, get note() {return _t("text.0572");}, ids: ['P1-01', 'P1-02'] },
{ id: 'soles', get name() {return _t("text.0573");}, get note() {return _t("text.0574");}, ids: ['P1-03', 'P1-04'] },
{ id: 'structure', get name() {return _t("text.0575");}, get note() {return _t("text.0576");}, internal: true, ids: ['P2-05', 'P2-07', 'P3-02', 'P3-03', 'P3-04', 'P3-05', 'P4-02', 'P5-04', 'P5-05', 'P6-01', 'P6-06', 'P6-07', 'P6-08', 'P6-09'] }];

export function editableIds(parts, ids, locked = []) {
  const known = new Set(parts.map((p) => p.id)),protectedIds = new Set(locked);
  return [...new Set(ids)].filter((id) => known.has(id) && !protectedIds.has(id));
}
export function schemePatch(parts, ids, locked, design, products) {
  const colors = {},assignments = {};
  for (const id of editableIds(parts, ids, locked)) {
    const color = design?.colors?.[id];
    if (!/^#[\da-f]{6}$/i.test(color)) throw Error(_t("text.0577"));
    const p = parts.find((p) => p.id === id),product = products.get(design.assignments?.[id]);
    colors[id] = color.toUpperCase();
    assignments[id] = product?.series === p.material && product.hex.toUpperCase() === colors[id] ? product.id : null;
  }
  return { colors, assignments };
}
export function createDuckWorkbench(api) {
  const $ = (s) => document.querySelector(s),$$ = (s) => [...document.querySelectorAll(s)],esc = api.escapeHTML;
  const KEY = 'duck-studio-xgo-workbench-v1',state = api.getState;
  if (state().source !== SOURCE) throw Error('专用涂装分区与源模型不匹配');
  let locked = [],contexts = {},context = state().active || 'draft',nav = 'zones',isolated = false,presentation = false,rotating = false;
  const knownLocks = (ids) => [...new Set(Array.isArray(ids) ? ids : [])].filter((id) => state().parts.some((p) => p.id === id));
  try {const saved = JSON.parse(localStorage.getItem(KEY));if (saved?.source === SOURCE) {contexts = Object.fromEntries(Object.entries(saved.contexts || {}).map(([id, ids]) => [id, knownLocks(ids)]));if (!saved.contexts) contexts.draft = knownLocks(saved.locked);locked = knownLocks(contexts[context] || saved.locked);contexts[context] = locked;}} catch {}
  function persist() {try {contexts[context] = [...locked];localStorage.setItem(KEY, JSON.stringify({ source: SOURCE, locked, contexts, context }));return true;} catch {$('#save-status').textContent = '锁定状态未保存';api.toast('锁定状态未能保存，刷新后可能丢失');return false;}}
  function useContext(id, fallback = [], reset = false) {contexts[context] = [...locked];context = id;locked = knownLocks(reset ? fallback : contexts[id] || fallback);return persist();}
  const targets = () => state().targets;
  const editable = (ids) => editableIds(state().parts, ids, locked);
  function chooseZone(id, side) {
    const zone = ZONES.find((z) => z.id === id);if (!zone) return;
    api.selectSet(side ? sideParts(state().parts, zone.ids, side) : zone.ids, zone.name + (side ? side === 'left' ? ' · 左侧' : ' · 右侧' : ''), { single: Boolean(side) });api.preview([], null);
  }
  function toggleLock() {
    const ids = targets();if (!ids.length) return;
    if (ids.every((id) => locked.includes(id))) locked = locked.filter((id) => !ids.includes(id));else
    locked = [...new Set([...locked, ...ids])];
    persist();api.refresh();
  }
  function setNav(value) {nav = value;refresh();}
  function setIsolation(value) {isolated = Boolean(value && targets().length);api.setVisibility(isolated ? targets() : null);refresh();}
  function setPresentation(value) {
    presentation = value;api.closePopup();api.preview([], null);
    document.body.classList.toggle('presentation', presentation);
    if (!presentation) setRotation(false);
    api.refresh();
  }
  function setRotation(value) {rotating = Boolean(value && state().mode !== 'plates');api.rotate(rotating);refresh();}
  function scopeIds() {return $('#theme-scope').value === 'all' ? state().parts.map((p) => p.id) : targets();}
  function previewTheme() {const ids = scopeIds();api.preview(ids, '套用方案的范围');}
  $('.panel-heading h1').innerHTML = '涂装部位 <span class="count">8</span>';
  $('.panel-heading').insertAdjacentHTML('afterend', `<div class="duck-nav" role="group" aria-label="部位导航"><button data-duck-nav="zones">按部位</button><button data-duck-nav="parts">全部零件</button></div><div id="duck-zones"></div>`);
  $('#selection-scope').insertAdjacentHTML('afterend', `<div class="scope-actions"><button id="focus-selection">聚焦部位</button><button id="isolate-selection" aria-pressed="false">单独查看</button><button id="lock-selection">锁定改色</button></div><p id="lock-summary"></p><details class="theme-transfer"><summary>从其他方案取色</summary><label>取色方案<select id="theme-source" aria-label="取色方案"></select></label><label>应用到<select id="theme-scope" aria-label="套用范围"><option value="selection">当前选中部位</option><option value="all">整机未锁定部位</option></select></label><p id="theme-scope-summary"></p><button id="apply-theme" class="button full">套用这些颜色</button><small>保留每件的材料与已锁定颜色。切换下方方案卡则查看完整方案。</small></details>`);
  $('#viewport').insertAdjacentHTML('afterend', `<div class="display-toolbar" aria-label="模型展示工具"><div><button id="view-back">背面</button><button id="view-top">俯视</button><button id="turntable" aria-pressed="false">自动转台</button><button id="restore-view">显示整机</button></div><div><button id="save-view">保存展示图</button><button id="presentation" aria-pressed="false">纯展示 ↗</button></div></div>`);
  $('#viewport').insertAdjacentHTML('beforeend', '<div id="scope-preview" role="status" hidden></div><button id="exit-presentation" hidden>← 返回涂装</button>');
  $('#duck-zones').addEventListener('click', (e) => {const z = e.target.closest('[data-zone]');if (z) chooseZone(z.dataset.zone, z.dataset.zoneSide);const p = e.target.closest('[data-zone-part]');if (p) api.selectPart(p.dataset.zonePart);});
  for (const kind of ['pointerover', 'focusin']) $('#duck-zones').addEventListener(kind, (e) => {const z = e.target.closest('[data-zone]'),p = e.target.closest('[data-zone-part]');if (z) {const zone = ZONES.find((x) => x.id === z.dataset.zone);api.preview(z.dataset.zoneSide ? sideParts(state().parts, zone.ids, z.dataset.zoneSide) : zone.ids, zone.name);} else if (p) api.preview([p.dataset.zonePart], state().parts.find((x) => x.id === p.dataset.zonePart).name);});
  $('#duck-zones').addEventListener('pointerleave', () => api.preview([], null));$('#duck-zones').addEventListener('focusout', () => api.preview([], null));
  $$('[data-duck-nav]').forEach((b) => b.onclick = () => setNav(b.dataset.duckNav));
  $('#focus-selection').onclick = () => api.focus(targets());$('#isolate-selection').onclick = () => setIsolation(!isolated);$('#lock-selection').onclick = toggleLock;
  $('#view-back').onclick = () => api.view('back');$('#view-top').onclick = () => api.view('top');
  $('#turntable').onclick = () => setRotation(!rotating);
  $('#restore-view').onclick = () => {setIsolation(false);api.resetView();};
  $('#presentation').onclick = () => setPresentation(!presentation);$('#exit-presentation').onclick = () => setPresentation(false);
  $('#save-view').onclick = api.saveView;
  $('#apply-theme').onpointerenter = previewTheme;$('#apply-theme').onpointerleave = () => api.preview([], null);
  $('#apply-theme').onfocus = previewTheme;$('#apply-theme').onblur = () => api.preview([], null);
  $('#theme-scope').onchange = refresh;
  $('#apply-theme').onclick = () => {api.applyTheme($('#theme-source').value, scopeIds());api.preview([], null);};
  document.addEventListener('keydown', (e) => {if (e.key === 'Escape' && presentation) setPresentation(false);});
  document.addEventListener('visibilitychange', () => {if (document.hidden) setRotation(false);});
  function refresh() {
    const a = state(),ids = targets(),open = new Set($$('#duck-zones details[open]').map((x) => x.dataset.zoneDetails));
    $('.panel-heading h1').innerHTML = nav === 'zones' ? '涂装部位 <span class="count">8</span>' : '全部零件 <span class="count">35</span>';
    $('#duck-zones').hidden = nav !== 'zones';$('.parts-panel .search').hidden = nav !== 'parts';$('#filters').hidden = nav !== 'parts';$('#part-list').hidden = nav !== 'parts';
    $$('[data-duck-nav]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.duckNav === nav)));
    $('#duck-zones').innerHTML = ZONES.map((z) => {
      const active = z.ids.length === a.selectedIds.length && z.ids.every((id) => a.selectedIds.includes(id));
      const colors = [...new Set(z.ids.map((id) => a.colors[id]))].slice(0, 4),locks = z.ids.filter((id) => locked.includes(id)).length;
      const sides = sideParts(a.parts, z.ids, 'left').length ? `<div class="zone-sides" role="group" aria-label="${z.name}的左右侧">${['left', 'right'].map((side) => {const sideIds = sideParts(a.parts, z.ids, side);return `<button data-zone="${z.id}" data-zone-side="${side}" aria-pressed="${ids.length === sideIds.length && sideIds.every((id) => ids.includes(id))}">仅${side === 'left' ? '左' : '右'}侧</button>`;}).join('')}</div>` : '';
      return `<section class="duck-zone ${active ? 'active' : ''}"><button data-zone="${z.id}" aria-pressed="${active}"><span class="zone-colors">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span><span><strong>${z.name}</strong><small>${z.ids.length} 件 · ${z.internal ? '连接与支撑' : a.parts.find((p) => p.id === z.ids[0]).material}${locks ? ' · ' + locks + ' 件已锁定' : ''}</small></span></button>${sides}<details data-zone-details="${z.id}" ${open.has(z.id) ? 'open' : ''}><summary>分别调整 <span>⌄</span></summary><p>${z.note}</p>${z.ids.map((id) => {const p = a.parts.find((p) => p.id === id);return `<button data-zone-part="${id}" aria-pressed="${a.selectedIds.includes(id)}"><i style="background:${a.colors[id]}"></i><span>${esc(p.name)}</span>${locked.includes(id) ? '<small>锁</small>' : ''}</button>`;}).join('')}</details></section>`;
    }).join('');
    for (const id of ['focus-selection', 'isolate-selection', 'lock-selection']) $('#' + id).disabled = !ids.length;
    $('#lock-selection').textContent = ids.length && ids.every((id) => locked.includes(id)) ? '解锁改色' : '锁定改色';
    $('#lock-summary').textContent = locked.length ? `已锁定 ${locked.length} 件 · 本次可改 ${editable(ids).length} 件` : '锁定满意的部位，其他地方继续尝试。';
    $('#selection-scope').textContent = $('#selection-scope').textContent.replace(/ · 跳过 \d+ 件锁定/g, '') + (ids.some((id) => locked.includes(id)) ? ` · 跳过 ${ids.length - editable(ids).length} 件锁定` : '');
    if (a.selectionLabel && a.workflow !== 'paint') $('#selected-name').textContent = a.selectionLabel;
    if (isolated && !ids.length) isolated = false;
    api.setVisibility(isolated ? ids : null);
    $('#isolate-selection').setAttribute('aria-pressed', String(isolated));$('#isolate-selection').textContent = isolated ? '退出单独查看' : '单独查看';
    const source = $('#theme-source'),before = source.value;
    source.innerHTML = a.designs.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    source.value = a.designs.some((d) => d.id === before) ? before : 'ocean';
    const scope = scopeIds(),available = editable(scope);
    $('#theme-scope-summary').textContent = `${available.length} 件将取色 · ${scope.length - available.length} 件锁定保留`;
    $('#apply-theme').disabled = !available.length;
    $('#exit-presentation').hidden = !presentation;$('#presentation').textContent = presentation ? '返回涂装' : '纯展示 ↗';$('#presentation').setAttribute('aria-pressed', String(presentation));
    $('#turntable').disabled = a.mode === 'plates';$('#turntable').setAttribute('aria-pressed', String(rotating));$('#turntable').textContent = rotating ? '暂停转台' : '自动转台';
    $('#view-back').disabled = $('#view-top').disabled = a.mode === 'plates';
    $$('[data-part]').forEach((row) => {row.classList.toggle('locked', locked.includes(row.dataset.part));});
  }
  return { refresh, persist, editable, useContext, isLocked: (id) => locked.includes(id),
    contextLocks: (id) => knownLocks(contexts[id] || []),
    restoreContexts: (value) => {({ context, contexts, locked } = JSON.parse(JSON.stringify(value)));},
    stopRotation: () => {if (rotating) setRotation(false);},
    onModeChange: () => {isolated = false;setRotation(false);},
    getState: () => ({ locked: [...locked], context, contexts: JSON.parse(JSON.stringify(contexts)), isolated, presentation, rotating, nav }),
    isPresentation: () => presentation };
}_onLocale(() => {ZONES = [{ id: 'head-shell', get name() {return _t("text.0561");}, get note() {return _t("text.0562");}, ids: ['P4-01', 'P2-01', 'P2-02'] }, { id: 'face', get name() {return _t("text.0563");}, get note() {return _t("text.0564");}, ids: ['P2-06', 'P3-01'] }, { id: 'body-shell', get name() {return _t("text.0565");}, get note() {return _t("text.0566");}, ids: ['P5-06', 'P5-07', 'P4-03', 'P5-03'] }, { id: 'leg-shell', get name() {return _t("text.0567");}, get note() {return _t("text.0568");}, ids: ['P5-01', 'P5-02', 'P6-04', 'P6-05', 'P6-02', 'P6-03'] }, { id: 'feet', get name() {return _t("text.0569");}, get note() {return _t("text.0570");}, ids: ['P2-03', 'P2-04'] }, { id: 'beak-soft', get name() {return _t("text.0571");}, get note() {return _t("text.0572");}, ids: ['P1-01', 'P1-02'] }, { id: 'soles', get name() {return _t("text.0573");}, get note() {return _t("text.0574");}, ids: ['P1-03', 'P1-04'] }, { id: 'structure', get name() {return _t("text.0575");}, get note() {return _t("text.0576");}, internal: true, ids: ['P2-05', 'P2-07', 'P3-02', 'P3-03', 'P3-04', 'P3-05', 'P4-02', 'P5-04', 'P5-05', 'P6-01', 'P6-06', 'P6-07', 'P6-08', 'P6-09'] }];});
