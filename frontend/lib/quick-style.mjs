import { escapeAttribute as _attr } from "../shared/i18n.mjs";import { t as _t, label as _label, onLocale as _onLocale } from "../shared/i18n.mjs"; // One-click styling for the fixed XGO Duck V2 regions: four colour roles, recipes, dice, themes and share links.
import { ZONES, SOURCE, editableIds } from './duck-workbench.mjs';
export let SLOTS = [{ id: 'main', get name() {return _t("text.0536");} }, { id: 'sub', get name() {return _t("text.0537");} }, { id: 'accent', get name() {return _t("text.0538");} }, { id: 'pad', get name() {return _t("text.0539");}, material: 'TPU 90A' }];
// Zone → colour role. The eye itself (P3-01) is resolved separately so it always reads against its shell.
export const RECIPES = {
  '经典': { 'head-shell': 'main', 'body-shell': 'main', 'leg-shell': 'sub', structure: 'sub', face: 'accent', feet: 'accent', 'beak-soft': 'pad', soles: 'pad' },
  '撞色': { 'head-shell': 'accent', 'body-shell': 'main', 'leg-shell': 'main', structure: 'sub', face: 'sub', feet: 'accent', 'beak-soft': 'pad', soles: 'pad' },
  '双拼': { 'head-shell': 'sub', 'body-shell': 'main', 'leg-shell': 'sub', structure: 'main', face: 'accent', feet: 'sub', 'beak-soft': 'pad', soles: 'pad' },
  '低调': { 'head-shell': 'main', 'body-shell': 'main', 'leg-shell': 'main', structure: 'sub', face: 'accent', feet: 'main', 'beak-soft': 'pad', soles: 'pad' }
};
export let THEMES = [
{ get name() {return _t("text.0540");}, recipe: '经典', codes: { main: '10100', sub: '10101', accent: '10604', pad: '51103' } },
{ get name() {return _t("text.0541");}, recipe: '经典', codes: { main: '10402', sub: '10100', accent: '10300', pad: '51105' } },
{ get name() {return _t("text.0542");}, recipe: '撞色', codes: { main: '10601', sub: '10101', accent: '10202', pad: '51700' } },
{ get name() {return _t("text.0543");}, recipe: '撞色', codes: { main: '10103', sub: '10105', accent: '10300', pad: '51103' } },
{ get name() {return _t("text.0544");}, recipe: '双拼', codes: { main: '10201', sub: '10203', accent: '10605', pad: '51601' } },
{ get name() {return _t("text.0545");}, recipe: '双拼', codes: { main: '10502', sub: '10201', accent: '10800', pad: '51800' } },
{ get name() {return _t("text.0546");}, recipe: '双拼', codes: { main: '10100', sub: '10200', accent: '10101', pad: '51103' } },
{ get name() {return _t("text.0547");}, recipe: '低调', codes: { main: '10101', sub: '10102', accent: '10603', pad: '51106' } }];

let EYE = 'P3-01',CHECKS = [['P2-06', 'P4-01', _t("text.0548")], ['P5-01', 'P5-06', _t("text.0549")], ['P2-03', 'P5-01', _t("text.0550")]];
const slotMaterial = (slot) => SLOTS.find((s) => s.id === slot)?.material || 'PLA Basic';
const list = (products) => [...(products instanceof Map ? products.values() : products)];
export function byCode(products, code, material) {return list(products).find((p) => p.colorCode === code && (!material || p.series === material));}
export function hsl(hex) {const n = parseInt(hex.slice(1), 16),r = (n >> 16 & 255) / 255,g = (n >> 8 & 255) / 255,b = (n & 255) / 255,mx = Math.max(r, g, b),mn = Math.min(r, g, b),l = (mx + mn) / 2,d = mx - mn;let h = 0,s = 0;if (d) {s = d / (1 - Math.abs(2 * l - 1));h = mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;h *= 60;if (h < 0) h += 360;}return { h, s, l };}
function luminance(hex) {const n = parseInt(hex.slice(1), 16);const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => {v /= 255;return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;});return .2126 * r + .7152 * g + .0722 * b;}
export function contrast(a, b) {const x = luminance(a),y = luminance(b);return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);}
export const isNeutral = (hex) => {const c = hsl(hex);return c.s < .2 || c.l > .88 || c.l < .12;};
const hueGap = (a, b) => {const d = Math.abs(a - b) % 360;return d > 180 ? 360 - d : d;};

// Builds a full 35-part patch; every colour is a catalogue product of the part's own material.
export function quickDesign(parts, products, slots, recipe) {
  const map = RECIPES[recipe];if (!map) throw Error(_t("text.0551"));
  const colors = {},assignments = {},byId = new Map(list(products).map((p) => [p.id, p]));
  for (const slot of SLOTS) {const p = byId.get(slots[slot.id]);if (!p || p.series !== slotMaterial(slot.id)) throw Error(_t("text.0552", { v0: slot.name, v1: slotMaterial(slot.id) }));}
  for (const zone of ZONES) for (const id of zone.ids) {
    const part = parts.find((p) => p.id === id);if (!part) continue;
    const product = byId.get(slots[map[zone.id]]);
    if (product.series !== part.material) throw Error(_t("text.0553", { v0: zone.name, v1: product.series }));
    colors[id] = product.hex.toUpperCase();assignments[id] = product.id;
  }
  if (colors[EYE]) {const shell = colors['P2-06'] || colors['P4-01'],eye = byCode(products, luminance(shell) < .12 ? '10100' : '10101', 'PLA Basic');colors[EYE] = eye.hex.toUpperCase();assignments[EYE] = eye.id;}
  return { colors, assignments };
}
// Rolls unlocked roles: a base, a harmony (complement / analogous / neutral) and an accent that stands out from the base.
export function rollSlots(products, slots, recipe, locks = {}, rand = Math.random) {
  const pick = (a) => a[Math.floor(rand() * a.length) % a.length],all = list(products);
  const pla = all.filter((p) => p.series === 'PLA Basic'),tpu = all.filter((p) => p.series === 'TPU 90A');
  const colorful = pla.filter((p) => !isNeutral(p.hex)),neutrals = pla.filter((p) => isNeutral(p.hex));
  const near = (hue, exclude) => colorful.filter((p) => !exclude.includes(p.id)).sort((a, b) => hueGap(hsl(a.hex).h, hue) - hueGap(hsl(b.hex).h, hue))[0];
  const hex = (id) => all.find((p) => p.id === id).hex,next = { ...slots };
  if (!locks.main) next.main = (rand() < .35 ? pick(neutrals) : pick(colorful)).id;
  const base = isNeutral(hex(next.main)) ? rand() * 360 : hsl(hex(next.main)).h,style = pick(['互补', '邻近', '中性']);
  if (!locks.sub) next.sub = (style === '中性' || isNeutral(hex(next.main)) ? pick(neutrals.filter((p) => p.id !== next.main)) : near((base + (style === '互补' ? 180 : 35)) % 360, [next.main])).id;
  if (!locks.accent) {let accent,tries = 0;do {accent = isNeutral(hex(next.main)) && isNeutral(hex(next.sub)) ? pick(colorful) : near((base + pick([150, 180, 210])) % 360, [next.main, next.sub]);tries++;} while ((!accent || contrast(accent.hex, hex(next.main)) < 1.4 || accent.id === next.sub) && tries < 10);next.accent = (accent || colorful[0]).id;}
  if (!locks.pad) {const hue = hsl(hex(next.accent)).h,tinted = tpu.filter((p) => !isNeutral(p.hex)).sort((a, b) => hueGap(hsl(a.hex).h, hue) - hueGap(hsl(b.hex).h, hue));next.pad = (rand() < .5 || !tinted.length ? pick(tpu.filter((p) => isNeutral(p.hex))) : tinted[0]).id;}
  return { slots: next, recipe: locks.recipe ? recipe : pick(Object.keys(RECIPES)) };
}
export function themeSlots(products, theme) {return Object.fromEntries(SLOTS.map((s) => [s.id, byCode(products, theme.codes[s.id], slotMaterial(s.id))?.id]));}
// Reads the four roles back from an existing design so the panel opens on what is already painted.
export function slotsFromDesign(products, assignments, fallback) {
  const read = (id, slot) => {const p = list(products).find((x) => x.id === assignments?.[id]);return p?.series === slotMaterial(slot) ? p.id : fallback[slot];};
  return { main: read('P5-06', 'main'), sub: read('P5-01', 'sub'), accent: read('P2-06', 'accent'), pad: read('P1-02', 'pad') };
}
export function designNotes(colors, assignments) {
  const used = assignments && Object.values(assignments).every(Boolean) ? Object.values(assignments) : Object.values(colors);
  return { count: new Set(used).size, warnings: CHECKS.filter(([a, b]) => colors[a] && colors[b] && colors[a] !== colors[b] && contrast(colors[a], colors[b]) < 1.25).map((x) => _t("text.0554", { v0: x[2] })) };
}
// Share format: look=v1.<source prefix>.<colour codes>.<one base36 index per part, model order>[.<name>]
export function encodeLook(parts, products, assignments, name = '', source = SOURCE) {
  const byId = new Map(list(products).map((p) => [p.id, p])),used = [];
  const index = parts.map((part) => {const p = byId.get(assignments[part.id]);if (!p || p.series !== part.material) throw Error(_t("text.0555", { v0: parts.length }));const key = (p.series === 'TPU 90A' ? 't' : '') + p.colorCode;if (!used.includes(key)) used.push(key);return used.indexOf(key).toString(36);}).join('');
  return ['v1', source.slice(0, 8), used.join('-'), index, encodeURIComponent(String(name).trim().slice(0, 40))].join('.').replace(/\.$/, '');
}
export function decodeLook(parts, products, text, source = SOURCE) {
  const [version, prefix, codes, index, name = ''] = String(text).split('.');
  if (version !== 'v1' || !codes || !index) throw Error(_t("text.0556"));
  if (prefix !== source.slice(0, 8)) throw Error(_t("text.0557"));
  if (index.length !== parts.length) throw Error(_t("text.0558"));
  const keys = codes.split('-'),colors = {},assignments = {};
  parts.forEach((part, i) => {const key = keys[parseInt(index[i], 36)];if (!key) throw Error(_t("text.0559"));const tpu = key.startsWith('t'),p = byCode(products, tpu ? key.slice(1) : key, tpu ? 'TPU 90A' : 'PLA Basic');if (!p || p.series !== part.material) throw Error(_t("text.0560"));colors[part.id] = p.hex.toUpperCase();assignments[part.id] = p.id;});
  let title = '';try {title = decodeURIComponent(name).slice(0, 40);} catch {}
  return { colors, assignments, name: title };
}

export function createQuickStyle(api) {
  const $ = (s) => document.querySelector(s),$$ = (s) => [...document.querySelectorAll(s)],esc = api.escapeHTML,KEY = 'duck-studio-quick-style-v1';
  const products = () => api.getState().products,parts = () => api.getState().parts;
  let state = { slots: themeSlots(products(), THEMES[0]), recipe: '经典', locks: {}, active: 'main', open: true, name: '' };
  try {const saved = JSON.parse(localStorage.getItem(KEY));if (saved?.source === SOURCE) {state = { ...state, recipe: RECIPES[saved.recipe] ? saved.recipe : state.recipe, locks: saved.locks || {}, open: saved.open !== false };}} catch {}
  state.slots = slotsFromDesign(products(), api.getState().assignments, state.slots);
  function persist() {try {localStorage.setItem(KEY, JSON.stringify({ source: SOURCE, recipe: state.recipe, locks: state.locks, open: state.open }));} catch {}}
  function apply(label) {
    let patch;try {patch = quickDesign(parts(), products(), state.slots, state.recipe);} catch (error) {api.toast(error.message);return;}
    api.apply(patch, label);render();
  }
  // Joins the existing workflow switch as its first tab; while active it takes the place of the project palette.
  $('.workflow-switch').insertAdjacentHTML('afterbegin', '<button type="button" id="quick-tab" aria-pressed="false">一键套色</button>');
  $('.workflow-bar').insertAdjacentHTML('afterend', `<section id="quick-style" aria-label="一键套色" hidden><div class="quick-head"><span>选四个颜色，自动涂到 8 个部位；细节再到左侧按部位调整，可随时撤销</span><div class="quick-actions"><button type="button" id="quick-dice" title="随机一套配色，已锁定的颜色不变">🎲 灵感骰子</button><button type="button" id="quick-share">复制分享链接</button><button type="button" id="quick-poster">分享海报</button></div></div><div class="quick-body"><div class="quick-left"><div id="quick-slots" role="group" aria-label="颜色角色"></div><p id="quick-picker-label"></p><div id="quick-picker"></div><div class="quick-recipes"><span>分配方式</span><div id="quick-recipes" role="group" aria-label="分配方式"></div><button type="button" id="quick-recipe-lock" aria-pressed="false" title="锁定后骰子不改分配方式"></button></div></div><div class="quick-right"><div class="quick-notes" id="quick-notes" role="status"></div><span class="quick-label">主题预设</span><div id="quick-themes"></div></div></div></section>`);
  const panel = $('#quick-style');
  function setOpen(value) {state.open = Boolean(value);document.body.classList.toggle('quick-mode', state.open);panel.hidden = !state.open;$('#quick-tab').classList.toggle('active', state.open);$('#quick-tab').setAttribute('aria-pressed', String(state.open));persist();}
  $('#quick-tab').onclick = () => setOpen(true);
  $$('.workflow-switch [data-workflow]').forEach((b) => b.addEventListener('click', () => setOpen(false)));
  panel.addEventListener('click', (e) => {
    const lock = e.target.closest('[data-quick-lock]');if (lock) {e.preventDefault();e.stopPropagation();const k = lock.dataset.quickLock;state.locks = { ...state.locks, [k]: !state.locks[k] };persist();render();return;}
    const slot = e.target.closest('[data-quick-slot]');if (slot) {state.active = slot.dataset.quickSlot;render();return;}
    const sw = e.target.closest('[data-quick-product]');if (sw) {state.slots = { ...state.slots, [state.active]: sw.dataset.quickProduct };apply('一键套色 · ' + SLOTS.find((s) => s.id === state.active).name + '换成 ' + products().get(sw.dataset.quickProduct).name);return;}
    const recipe = e.target.closest('[data-quick-recipe]');if (recipe) {state.recipe = recipe.dataset.quickRecipe;persist();apply('一键套色 · 分配方式「' + state.recipe + '」');return;}
    const theme = e.target.closest('[data-quick-theme]');if (theme) {const t = THEMES[Number(theme.dataset.quickTheme)];state.slots = themeSlots(products(), t);state.recipe = t.recipe;state.name = t.name;persist();apply('主题预设「' + t.name + '」');return;}
  });
  $('#quick-recipe-lock').onclick = () => {state.locks = { ...state.locks, recipe: !state.locks.recipe };persist();render();};
  $('#quick-dice').onclick = () => {const r = rollSlots(products(), state.slots, state.recipe, state.locks);state.slots = r.slots;state.recipe = r.recipe;state.name = '';persist();apply('灵感骰子 · 「' + state.recipe + '」');api.spin?.();};
  $('#quick-share').onclick = async () => {const url = shareURL();if (!url) return;try {await navigator.clipboard.writeText(url);api.toast('分享链接已复制，对方打开后可一键带入这套配色');} catch {window.prompt('复制这条分享链接', url);}};
  $('#quick-poster').onclick = () => poster();
  function shareURL(name = api.getState().name) {
    try {const s = api.getState();return location.origin + location.pathname + '#look=' + encodeLook(s.parts, s.products, s.assignments, name);} catch (error) {api.toast(error.message);return null;}
  }
  async function poster(name = api.getState().name, author = '') {
    const s = api.getState(),url = shareURL(name);if (!url) return;
    const W = 1080,H = 1440,cv = document.createElement('canvas');cv.width = W;cv.height = H;const ctx = cv.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, H);bg.addColorStop(0, '#f4f6fb');bg.addColorStop(1, '#e4e9f6');ctx.fillStyle = bg;ctx.fillRect(0, 0, W, H);
    const image = await api.renderImage(s.colors, s.assignments, W, 960);ctx.drawImage(image, 0, 90);
    ctx.fillStyle = '#4d6bfe';ctx.font = '700 26px sans-serif';ctx.fillText('DUCK STUDIO · XGO Duck V2', 64, 80);
    ctx.fillStyle = '#17243c';ctx.font = '800 64px sans-serif';ctx.fillText(name || '我的机器鸭', 64, 1120);
    ctx.fillStyle = '#6b7891';ctx.font = '26px sans-serif';ctx.fillText((author ? author + ' · ' : '') + designNotes(s.colors, s.assignments).count + ' 种耗材 · 35 个打印零件', 64, 1170);
    const used = [...new Set(Object.values(s.assignments))].map((id) => s.products.get(id));
    used.forEach((p, i) => {const x = 64 + i % 4 * 240,y = 1220 + Math.floor(i / 4) * 70;ctx.fillStyle = p.hex;ctx.beginPath();ctx.roundRect(x, y, 44, 44, 10);ctx.fill();ctx.strokeStyle = '#0002';ctx.stroke();ctx.fillStyle = '#24344f';ctx.font = '22px sans-serif';ctx.fillText(p.name, x + 58, y + 22);ctx.fillStyle = '#8a93a5';ctx.font = '18px sans-serif';ctx.fillText(p.series + ' ' + p.colorCode, x + 58, y + 44);});
    ctx.fillStyle = '#8a93a5';ctx.font = '18px sans-serif';ctx.fillText('屏幕颜色仅供参考 · 配套的分享链接已复制，发给朋友即可一键带入这套配色', 64, H - 36);
    cv.toBlob((blob) => {if (!blob) return;api.download(blob, 'XGO-Duck-' + (name || 'palette').replace(/[\\/:*?"<>|]/g, '_') + '-poster.png');api.toast('分享海报已保存，配套的分享链接也已准备好');navigator.clipboard?.writeText(url).catch(() => {});}, 'image/png');
  }
  function openShared() {
    const m = location.hash.match(/^#look=(.+)$/);if (!m) return;
    try {const s = api.getState(),look = decodeLook(s.parts, s.products, m[1]);api.apply({ colors: look.colors, assignments: look.assignments }, '从分享链接带入' + (look.name ? '「' + look.name + '」' : '配色'), { name: look.name });state.slots = slotsFromDesign(s.products, look.assignments, state.slots);state.name = look.name;setOpen(true);api.toast('已带入分享的配色，可随时撤销');}
    catch (error) {api.toast(error.message);}
    history.replaceState(null, '', location.pathname + location.search);render();
  }
  function render() {
    const all = [...products().values()],s = api.getState(),material = slotMaterial(state.active),current = state.slots[state.active];
    $('#quick-slots').innerHTML = SLOTS.map((slot) => {const p = products().get(state.slots[slot.id]);return `<button type="button" class="quick-slot ${state.active === slot.id ? 'active' : ''}" data-quick-slot="${slot.id}" aria-pressed="${state.active === slot.id}"><i style="background:${p.hex}"></i><span><strong>${slot.name}</strong><small>${esc(p.name)}${slot.material ? ' · TPU' : ''}</small></span><span class="quick-lock ${state.locks[slot.id] ? 'locked' : ''}" data-quick-lock="${slot.id}" role="button" tabindex="0" aria-label="${_attr(state.locks[slot.id] ? '解锁' : '锁定')}${_attr(slot.name)}" title="锁定后骰子不会换掉它">${state.locks[slot.id] ? '🔒' : '🔓'}</span></button>`;}).join('');
    $('#quick-picker-label').textContent = `为「${SLOTS.find((x) => x.id === state.active).name}」选择 ${material}，整只鸭子一起变`;
    $('#quick-picker').innerHTML = all.filter((p) => p.series === material).map((p) => `<button type="button" class="quick-swatch ${p.id === current ? 'active' : ''}" data-quick-product="${p.id}" style="background:${p.hex}" title="${_attr(esc(p.name))} · ${_attr(p.colorCode)}" aria-label="${_attr(esc(p.name))}"></button>`).join('');
    $('#quick-recipes').innerHTML = Object.keys(RECIPES).map((r) => `<button type="button" data-quick-recipe="${r}" aria-pressed="${r === state.recipe}" class="${r === state.recipe ? 'active' : ''}">${r}</button>`).join('');
    $('#quick-recipe-lock').textContent = state.locks.recipe ? '🔒 已锁定' : '🔓';$('#quick-recipe-lock').setAttribute('aria-pressed', String(Boolean(state.locks.recipe)));
    $('#quick-themes').innerHTML = THEMES.map((t, i) => {const ids = themeSlots(products(), t);return `<button type="button" data-quick-theme="${i}"><span class="quick-strip">${SLOTS.map((x) => `<i style="background:${products().get(ids[x.id])?.hex}"></i>`).join('')}</span><span>${t.name}</span></button>`;}).join('');
    const notes = designNotes(s.colors, s.assignments);
    $('#quick-notes').innerHTML = `<span class="${notes.count <= 4 ? 'ok' : ''}">${notes.count} 种耗材${notes.count <= 4 ? ' · 省料' : ''}</span>${notes.warnings.slice(0, 1).map((w) => `<span class="warn">${w}</span>`).join('')}`;
  }
  $('#quick-style').addEventListener('keydown', (e) => {if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-quick-lock]')) {e.preventDefault();e.target.click();}});
  setOpen(state.open);render();openShared();
  return { refresh: render, shareURL, poster, getState: () => ({ ...state, slots: { ...state.slots }, locks: { ...state.locks } }) };
}_onLocale(() => {SLOTS = [{ id: 'main', get name() {return _t("text.0536");} }, { id: 'sub', get name() {return _t("text.0537");} }, { id: 'accent', get name() {return _t("text.0538");} }, { id: 'pad', get name() {return _t("text.0539");}, material: 'TPU 90A' }];THEMES = [{ get name() {return _t("text.0540");}, recipe: '经典', codes: { main: '10100', sub: '10101', accent: '10604', pad: '51103' } }, { get name() {return _t("text.0541");}, recipe: '经典', codes: { main: '10402', sub: '10100', accent: '10300', pad: '51105' } }, { get name() {return _t("text.0542");}, recipe: '撞色', codes: { main: '10601', sub: '10101', accent: '10202', pad: '51700' } }, { get name() {return _t("text.0543");}, recipe: '撞色', codes: { main: '10103', sub: '10105', accent: '10300', pad: '51103' } }, { get name() {return _t("text.0544");}, recipe: '双拼', codes: { main: '10201', sub: '10203', accent: '10605', pad: '51601' } }, { get name() {return _t("text.0545");}, recipe: '双拼', codes: { main: '10502', sub: '10201', accent: '10800', pad: '51800' } }, { get name() {return _t("text.0546");}, recipe: '双拼', codes: { main: '10100', sub: '10200', accent: '10101', pad: '51103' } }, { get name() {return _t("text.0547");}, recipe: '低调', codes: { main: '10101', sub: '10102', accent: '10603', pad: '51106' } }];CHECKS = [['P2-06', 'P4-01', _t("text.0548")], ['P5-01', 'P5-06', _t("text.0549")], ['P2-03', 'P5-01', _t("text.0550")]];});
