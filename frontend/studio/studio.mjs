import {hoverQueue} from '../shared/hover-queue.mjs';
import { message as _message } from "../shared/i18n.mjs";import { escapeAttribute as _attr } from "../shared/i18n.mjs";import { bindTranslations, errorText, relativeTime } from '../shared/i18n.mjs';
import { t as _t, label as _label, onLocale as _onLocale } from "../shared/i18n.mjs"; // 涂装台: one stage, three steps (style → refine → showcase), plus schemes, A/B compare, group replace, close-up, arrange, colour finder, plates check,
// export review and publish ceremony. Colour rules are imported from the shipping modules.
import { loadDuck, createDuckView, renderExportThumbnails } from '../shared/duck-view.mjs';
import { createPosterDialog, lookCode, drawPoster } from '../shared/poster.mjs';
import { ZONES, schemePatch } from '../lib/duck-workbench.mjs';
import { SLOTS, RECIPES, THEMES, quickDesign, rollSlots, themeSlots, designNotes, decodeLook, slotsFromDesign } from '../lib/quick-style.mjs';
import { sideParts, paintTargets } from '../lib/color-workflows.mjs';
import { createActionPlayer, ACTIONS, VOICES, describeVoice, seedFromText } from '../shared/duck-actions.mjs';
import { hexToHsv, hsvToHex } from '../lib/focus-rules.mjs';
import { applyBrand, BRAND, brandName } from '../shared/brand.mjs';
import { mountAccount, initAccount, onAccount, requireLogin, account, avatarHTML } from '../shared/profile.mjs';
import { api } from '../shared/api.mjs';
import { loadEdition } from '../shared/edition.mjs';
applyBrand();

const $ = (s) => document.querySelector(s),$$ = (s) => [...document.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const edition = await loadEdition(), personal = edition === 'personal';
document.body.dataset.edition = edition;
function renderEdition() {
  $('#edition-badge').hidden = !personal;
  $('#import-code').hidden = !personal;
  const brand = $('[data-brand-slot]');brand.href = personal ? './' : './gallery/';
  brand.title = personal ? brandName() + ' / ' + BRAND.en : _t('text.0614');
  if (personal) {
    $('#steps [data-step="3"] [data-i18n]').dataset.i18n = 'personal.show';
    $('#steps [data-step="3"] [data-i18n]').textContent = _t('personal.show');
  }
}
renderEdition();_onLocale(renderEdition);
const duck = await loadDuck(),{ model, catalog, products } = duck,parts = model.parts,partById = new Map(parts.map((p) => [p.id, p]));
const zoneOf = (id) => ZONES.find((z) => z.ids.includes(id));
const match = (p, hex) => catalog.products.find((x) => x.series === p.material && x.hex.toUpperCase() === hex.toUpperCase())?.id || null;
const ORIGINAL = { colors: Object.fromEntries(parts.map((p) => [p.id, p.color.toUpperCase()])), assignments: Object.fromEntries(parts.map((p) => [p.id, match(p, p.color)])) };
// ---------- filament sources ----------
// Bambu Lab is the official colour-table snapshot. The other brands are placeholder swatches for
// prototyping the flow only: names and hex values are NOT checked against any manufacturer, and none
// of them offers the original TPU 90A, so soft pads stay Bambu or free colour.
let DEMO_BRANDS = [
{ id: 'esun', name: 'eSUN', series: 'PLA+', colors: [[_t("text.0001"), '#F3EFE2'], [_t("text.0002"), '#1D1D1F'], [_t("text.0003"), '#8B8F95'], [_t("text.0004"), '#D3262D'], [_t("text.0005"), '#F07A22'], [_t("text.0006"), '#F5D42C'], [_t("text.0007"), '#4CA848'], [_t("text.0008"), '#8ED3B4'], [_t("text.0009"), '#4DA2DA'], [_t("text.0010"), '#1F3E8C'], [_t("text.0011"), '#6A3E9E'], [_t("text.0012"), '#F1A2BC']] },
{ id: 'polymaker', name: 'Polymaker', series: 'PolyTerra PLA', colors: [[_t("text.0013"), '#ECE8DF'], [_t("text.0014"), '#2A2A2C'], [_t("text.0015"), '#9C9A93'], [_t("text.0016"), '#B53A2F'], [_t("text.0017"), '#E0813D'], [_t("text.0018"), '#E9C65A'], [_t("text.0019"), '#4F7A4A'], [_t("text.0020"), '#7FA9C9'], [_t("text.0021"), '#2C3E66'], [_t("text.0022"), '#A893C4'], [_t("text.0023"), '#D88A97'], [_t("text.0024"), '#A26A42']] },
{ id: 'sunlu', name: 'SUNLU', series: 'PLA', colors: [[_t("text.0025"), '#F7F7F5'], [_t("text.0026"), '#161616'], [_t("text.0027"), '#B7B9BC'], [_t("text.0028"), '#E0242B'], [_t("text.0029"), '#F68A1E'], [_t("text.0030"), '#FBD11B'], [_t("text.0031"), '#79C043'], [_t("text.0032"), '#1E9FD0'], [_t("text.0033"), '#2350B4'], [_t("text.0034"), '#7A3FB0'], [_t("text.0035"), '#F27AA6'], [_t("text.0036"), '#DDE6EA']] }];

DEMO_BRANDS[1].finish = 'matte';
for (const b of DEMO_BRANDS) b.colors.forEach(([n, hex], i) => products.set(`demo-${b.id}-${i}`, { id: `demo-${b.id}-${i}`, brand: b.name, series: b.series, material: 'PLA', get colorCode() {return _t("text.0037");}, get name() {return DEMO_BRANDS.find((x) => x.id === b.id).colors[i][0];}, hex, demo: true, finish: b.id === 'sunlu' && i === 11 ? 'translucent' : b.finish }));
let BRANDS = [{ id: 'bambu', get short() {return _t("text.0038");} }, ...DEMO_BRANDS.map((b) => ({ id: b.id, short: b.name, demo: true }))];
const FIN_LABEL = { get basic() {return _t("text.0039");}, get matte() {return _t("text.0040");}, get silk() {return _t("text.0041");}, get translucent() {return _t("text.0042");}, get tpu() {return _t("text.0043");} };
// A colour on a part is a "key": a product id, or 'hex:#RRGGBB[|finish]' for a free colour with no filament yet.
const kindOf = (p) => p.material === 'TPU' || String(p.series).startsWith('TPU') ? 'TPU' : 'PLA',partKind = (part) => part.material.startsWith('TPU') ? 'TPU' : 'PLA';
const isHex = (k) => typeof k === 'string' && k.startsWith('hex:');
const hexFinish = (k) => isHex(k) && k.includes('|') ? k.split('|')[1] : null;
const keyHex = (k) => isHex(k) ? k.slice(4, 11) : products.get(k)?.hex || '#000000';
const finishOfProduct = (p) => p.alpha < 1 || p.finish === 'translucent' ? 'translucent' : kindOf(p) === 'TPU' ? 'tpu' : p.finish || 'basic';
const keyFinish = (k, partId) => isHex(k) ? hexFinish(k) || (partKind(partById.get(partId)) === 'TPU' ? 'tpu' : 'basic') : finishOfProduct(products.get(k));
const keyName = (k) => isHex(k) ? _t("text.0044", { v0: keyHex(k) }) : products.get(k)?.name || k;
const keySub = (k) => {if (isHex(k)) {const f = hexFinish(k);return _t("text.0045", { v0: f ? FIN_LABEL[f] + ' · ' : '' });}const p = products.get(k),f = finishOfProduct(p);return (p.demo ? _t("text.0046", { v0: p.brand, v1: p.series }) : p.series + ' · ' + p.colorCode) + (f === 'matte' || f === 'silk' || f === 'translucent' ? ' · ' + FIN_LABEL[f] : '');};
const fits = (partId, k) => isHex(k) || products.has(k) && kindOf(products.get(k)) === partKind(partById.get(partId));
const ZONE_ORDER = ZONES.flatMap((z) => z.ids);
const clone = (x) => structuredClone(x),same = (a, b) => JSON.stringify(a.assignments) === JSON.stringify(b.assignments) && JSON.stringify(a.colors) === JSON.stringify(b.colors) && JSON.stringify(a.finishes || {}) === JSON.stringify(b.finishes || {});

// ---------- local state: the draft always lives in this browser; schemes too until you sign in ----------
const KEY = personal ? 'dd-studio-personal' : 'dd-studio',read = (k) => {try {return localStorage.getItem(k) ?? (!personal ? localStorage.getItem(k.replace('dd-studio', 'proto-studio-v2')) : null);} catch {return null;}};
let saved = {};try {saved = JSON.parse(read(KEY)) || {};} catch {}
let defaultName = !saved.draft?.name;
let design = saved.draft?.design || clone(ORIGINAL),name = saved.draft?.name || _t("text.0047"),provenance = saved.draft?.provenance || null;
let schemes = Array.isArray(saved.schemes) ? saved.schemes : [],owner = saved.owner || null,activeId = saved.draft?.activeId || null,recent = saved.recent || [],locks = new Set(saved.locks || []),voiceSalt = saved.draft?.voiceSalt || 0;
const baseline = () => schemes.find((s) => s.id === activeId)?.design || ORIGINAL;
const dirty = () => {
  const stored = personal && schemes.find(s => s.id === activeId);
  return !same(design, baseline()) || !!(stored && (name !== stored.name || voiceSalt !== stored.voiceSalt
    || JSON.stringify(provenance) !== JSON.stringify(stored.provenance)));
};
// `updated` changes only when the draft itself does, so the personal home page can say when it was last edited.
let draftUpdated = saved.draft?.updated || 0,draftShape = JSON.stringify([design, name, activeId]);
function persist() {
  const shape = JSON.stringify([design, name, activeId]);if (shape !== draftShape) {draftShape = shape;draftUpdated = Date.now();}
  try {localStorage.setItem(KEY, JSON.stringify({ draft: { design, name, provenance, activeId, voiceSalt, updated: draftUpdated }, ...(!personal ? {schemes, owner} : {}), recent, locks: [...locks] }));} catch {toast(_message("text.0048"));}
}

let step = 1,stepsDone = new Set(),slots = slotsFromDesign(products, design.assignments, themeSlots(products, THEMES[0])),recipe = '经典',slotLocks = {},openSlot = null,activeTheme = null,styleTab = 'themes',showTab = 'move';
let sel = { zone: 'head-shell', scope: 'all', part: null, mirror: true },tool = 'select',brush = null,search = '',replaceFrom = null,finder = '#FF8A3D',takeFrom = 'original',source = 'bambu',dockTab = 'filament',freeFinish = 'basic',freeAuto = true,pickToFree = false,brushMirror = true,brushKind = 'PLA',brushHover = null,toolBefore = 'select';
let freeHsv = hexToHsv('#FF8A3D'),bgPref = 'auto',bgCustom = '#2B3A55';bgPref = read(KEY + '-bg') || 'auto';bgCustom = read(KEY + '-bgc') || bgCustom;
if (!['auto', 'soft', 'sand', 'sage', 'night', 'custom'].includes(bgPref)) bgPref = 'auto';
let renamingId = null,compareId = 'original',splitOn = false,sideOn = false,focused = false,focusKey = '',menuOpen = false,pendingOpen = null;
const undo = [],redo = [];

const view = createDuckView(duck);view.mount($('#stage'));view.setColors(design.colors);$('#loading').remove();
const poster = createPosterDialog({ view, parts, products });
const actions = createActionPlayer(view);
// The playing action's button fills like a progress bar for exactly the action's length.
actions.onChange((id) => {if (id) requestAnimationFrame(followAction);else setTimeout(() => {poseUI = poseOf(view.pose);syncPose();}, 0);const dur = ACTIONS.find((a) => a.id === id)?.duration || 0;$$('[data-act]').forEach((b) => {const on = b.dataset.act === id;b.classList.remove('playing');if (on) {b.style.setProperty('--dur', dur + 's');void b.offsetWidth;b.classList.add('playing');}b.classList.toggle('on', on);});const st = $('#act-stop');if (st) st.disabled = !id;});
// The publish ceremony and its renderer load with the first ceremony.
let evolution = null;const evolutionApi = { createShowcase: view.createShowcase, applyAppearance: (material, id) => {const t = products.get(id)?.alpha < 1;material.transparent = t;material.opacity = t ? .68 : 1;material.depthWrite = !t;material.needsUpdate = true;} };
const playEvolution = async (options) => {evolution ||= (await import('../lib/evolution.mjs')).createEvolution(evolutionApi);evolution.play(options);};

// ---------- design changes ----------
function commit(next, label) {undo.push({ design: clone(design), label });if (undo.length > 60) undo.shift();redo.length = 0;design = next;view.setColors(design.colors);persist();renderAll(true);if (label) toast(label, true);}
function remember(id) {recent = [id, ...recent.filter((x) => x !== id)].slice(0, 8);}
const keyOf = (id) => design.assignments[id] || 'hex:' + design.colors[id].toUpperCase() + (design.finishes?.[id] ? '|' + design.finishes[id] : '');
// Paints a filament (kept to the part's material) or a free colour (any part; filament chosen later).
function paint(ids, key, label) {
  const ok = ids.filter((id) => !locks.has(id) && fits(id, key)),skipped = ids.length - ok.length;
  if (!ok.length) {toast(() => skipped ? _message("text.0049") : _message("text.0050"));return;}
  const hex = keyHex(key).toUpperCase(),fin = hexFinish(key),next = clone(design);next.finishes = { ...(next.finishes || {}) };for (const id of ok) {next.colors[id] = hex;next.assignments[id] = isHex(key) ? null : key;if (fin) next.finishes[id] = fin;else delete next.finishes[id];}remember(key);
  commit(next, _message("text.0051", { v0: label || _message("text.0052"), v1: ()=>keyName(key), v2: ok.length, v3: skipped ? _message("text.0053", { v0: skipped }) : '' }));
}
function applyQuick(label) {const d = quickDesign(parts, products, slots, recipe),next = clone(design);for (const id of Object.keys(d.colors)) if (!locks.has(id)) {next.colors[id] = d.colors[id];next.assignments[id] = d.assignments[id];}stepsDone.add(1);commit(next, label);}
function restore(h, label) {design = h.design;view.setColors(design.colors);persist();renderAll(true);toast(label);}
$('#undo').onclick = () => {const h = undo.pop();if (!h) return;redo.push({ design: clone(design), label: h.label });restore(h, _message("text.0054", { v0: h.label || _message("text.0055") }));};
$('#redo').onclick = () => {const h = redo.pop();if (!h) return;undo.push({ design: clone(design), label: h.label });restore(h, _message("text.0056"));};

// ---------- schemes (named saves, max 30, private). Signed in: kept on the server, this browser keeps a cache. ----------
const schemeBody = (s) => ({ name: s.name, design: s.design, provenance: s.provenance, voiceSalt: s.voiceSalt || 0 });
async function personalWrite(method, id, body) {
  try {return await api(method, '/schemes/' + encodeURIComponent(id), body);}
  catch (error) {toast(_message('personal.saveFailed', {error: () => error.message}));return null;}
}
function pushScheme(s) {if (account.user) api('PUT', '/schemes/' + encodeURIComponent(s.id), schemeBody(s)).then((r) => {s.updated = r.updated;persist();}).catch((err) => toast(_message("text.0057", { v0: ()=>err.message })));}
function dropScheme(id) {if (account.user) api('DELETE', '/schemes/' + encodeURIComponent(id)).catch((err) => toast(_message("text.0058", { v0: ()=>err.message })));}
// On sign-in the account's schemes replace the local list. The local cache remembers whose it is (owner):
// only schemes made as a guest are uploaded, never a cache left behind by another account.
async function syncSchemes() {
  if (!account.user) {schemes = [];owner = null;if (activeId) activeId = null;persist();return renderAll();}
  try {
    const remote = await api('GET', '/schemes'),ids = new Set(remote.map((s) => s.id)),local = schemes.filter((s) => !ids.has(s.id) && (!owner || owner === account.user.id));let up = 0;
    for (const s of local) {try {remote.push(await api('PUT', '/schemes/' + encodeURIComponent(s.id), schemeBody(s)));up++;} catch (err) {if (err.code !== 'schemes.not_owner') remote.push(s);}} // keep it to retry later, unless it is another account's
    schemes = remote.sort((a, b) => b.updated - a.updated);owner = account.user.id;if (activeId && !schemes.some((s) => s.id === activeId)) activeId = null;persist();renderAll();
    if (up) toast(_message("text.0059", { v0: up }));
  } catch (err) {toast(_message("text.0060", { v0: ()=>err.message }));}
}
const savedWhere = () => personal ? _t('personal.savedWhere') : account.user ? '' : _t("text.0061");
const newId = () => 's-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const when = (value) => {const minutes = Math.round((Date.now() - value) / 60000);return minutes < 1 ? _t('text.0062') : minutes < 60 ? relativeTime(-minutes, 'minute') : minutes < 1440 ? relativeTime(-Math.round(minutes / 60), 'hour') : relativeTime(-Math.round(minutes / 1440), 'day');};
let savingScheme = false;
async function saveScheme(asNew) {
  if (personal) {
    if (savingScheme) return false;
    const old = !asNew && schemes.find(s => s.id === activeId);
    if (!old && schemes.length >= 30) {toast(_message('text.0066'));return false;}
    const candidate = {id: old ? old.id : newId(), name: asNew && activeId ? _t('text.0067', {v0:name}) : name,
      design: clone(design), provenance, voiceSalt};
    savingScheme = true;$('#scheme-state').textContent = _t('personal.saving');
    const result = await personalWrite('PUT', candidate.id, schemeBody(candidate));
    savingScheme = false;
    if (!result) {renderHeader();return false;}
    if (old) Object.assign(old, result);else schemes.unshift(result);
    activeId = result.id;name = result.name;persist();renderAll();
    toast(_message('text.0068', {v0:name, v1:savedWhere()}));return true;
  }
  let s;if (!asNew && activeId && (s = schemes.find((s) => s.id === activeId))) Object.assign(s, { name, design: clone(design), provenance, voiceSalt, updated: Date.now() });else
  {if (schemes.length >= 30) return toast(_message("text.0066"));s = { id: newId(), name: asNew && activeId ? _t("text.0067", { v0: name }) : name, design: clone(design), provenance, voiceSalt, created: Date.now(), updated: Date.now() };schemes.unshift(s);activeId = s.id;name = s.name;}
  persist();pushScheme(s);renderAll();toast(_message("text.0068", { v0: name, v1: savedWhere() }));return true;
}
function openScheme(id) {
  const s = id === 'original' ? { get name() {return _t("text.0069");}, design: ORIGINAL, provenance: null } : schemes.find((s) => s.id === id);if (!s) return;
  undo.push({ design: clone(design), get label() {return _t("text.0070");} });design = clone(s.design);name = id === 'original' ? _t("text.0047") : s.name;provenance = s.provenance || null;voiceSalt = s.voiceSalt || 0;activeId = id === 'original' ? null : id;
  slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);pendingOpen = null;menuOpen = false;persist();renderAll();toast(_message("text.0071", { v0: ()=>s.name }));
}
function renderMenu() {
  const m = $('#scheme-menu');m.hidden = !menuOpen;$('#scheme-btn').setAttribute('aria-expanded', menuOpen);if (!menuOpen) return;
  const row = (id, label, sub, strip, active) => `<div class="sm-row ${active ? 'on' : ''}" data-open="${id}"><span class="sm-strip">${strip}</span>${renamingId === id ? `<input class="sm-rename" id="sm-rename" value="${esc(label)}" maxlength="40" aria-label="${_attr(_t("text.0072"))}">` : `<span class="sm-name">${esc(label)}<small>${sub}</small></span>`}${id !== 'original' ? `<button class="sm-act" data-rename="${id}" title="${_attr(_t("text.0073"))}">✎</button><button class="sm-act" data-delete="${id}" title="${_attr(_t("text.0074"))}">🗑</button>` : ''}</div>${pendingOpen === id ? `<div class="sm-confirm">${_t("text.0075")}<button data-confirm="save">${_t("text.0076")}</button><button data-confirm="discard">${_t("text.0077")}</button><button data-confirm="cancel">${_t("text.0078")}</button></div>` : ''}`;
  const strip = (d) => [...new Set(Object.values(d.colors))].slice(0, 5).map((c) => `<i style="--c:${c}"></i>`).join('');
  m.innerHTML = `<div class="sm-current"><label>${_t("text.0087")}<input id="sm-name" value="${esc(name)}" maxlength="40"></label><div class="sm-btns"><button class="primary-sm" id="sm-save">${activeId ? _t("text.0079") : _t("text.0080")}</button>${activeId ? `<button id="sm-saveas">${_t("text.0081")}</button>` : ''}</div>${provenance ? `<p class="sm-prov">${_t("text.0082", { v0: esc(provenance.title), v1: esc(provenance.author) })}</p>` : ''}</div>
  <div class="sm-list"><span class="sm-label">${_t("text.0088", { v4: schemes.length })}</span>${row('original', _t("text.0069"), _t("text.0083"), strip(ORIGINAL), false)}${schemes.map((s) => row(s.id, s.name, when(s.updated) + (s.provenance ? _t("text.0084") : ''), strip(s.design), s.id === activeId)).join('')}</div>
  <div class="sm-paste"><label>${_t(personal ? 'personal.code' : "text.0089")}<span><input id="sm-code" placeholder="${_attr(personal ? 'v1.…' : _t("text.0090"))}" autocomplete="off"><button id="sm-import">${_t("text.0091")}</button></span></label></div>
  <p class="sm-foot">${personal ? _t('personal.storage') : _t("text.0092", { v7: account.user ? _t("text.0085") : _t("text.0086") })}</p>`;
}
$('#scheme-btn').onclick = (e) => {e.stopPropagation();menuOpen = !menuOpen;pendingOpen = null;renderMenu();};
$('#import-code').onclick = e => {e.stopPropagation();menuOpen = true;pendingOpen = null;renderMenu();$('#sm-code').focus();};
document.addEventListener('click', (e) => {if (menuOpen && !e.target.closest('#scheme')) {menuOpen = false;renderMenu();}if (!e.target.closest('.compare')) $('#cmp-menu').hidden = true;});
$('#scheme-menu').addEventListener('click', async (e) => {
  const t = e.target;
  if (t.closest('#sm-import')) {const v = $('#sm-code').value;if (!v.trim()) return $('#sm-code').focus();try {const n = await importLook(v);menuOpen = false;undo.length = 0;step = 2;renderAll();toast(_message("text.0093", { v0: n }));} catch (error) {toast(error.message);}return;}
  if (t.closest('#sm-save')) return saveScheme(false);if (t.closest('#sm-saveas')) return saveScheme(true);
  // Rename in place (native prompt/confirm are unavailable in embedded browsers); delete is undoable instead of confirmed.
  if (t.closest('#sm-rename')) return;
  const rn = t.closest('[data-rename]');if (rn) {renamingId = rn.dataset.rename;renderMenu();const i = $('#sm-rename');i.focus();i.select();return;}
  const del = t.closest('[data-delete]');if (del) {const at = schemes.findIndex((s) => s.id === del.dataset.delete),s = schemes[at],wasActive = activeId === s.id;
    if (personal && !await personalWrite('DELETE', s.id)) return;
    schemes = schemes.filter((x) => x !== s);if (wasActive) activeId = null;if (compareId === s.id) compareId = 'original';persist();if (!personal) dropScheme(s.id);renderAll();
    return toast(_message("text.0094", { v0: s.name }), async () => {if (personal && !await personalWrite('PUT', s.id, schemeBody(s))) return;schemes.splice(at, 0, s);if (wasActive) activeId = s.id;persist();if (!personal) pushScheme(s);renderAll();toast(_message("text.0095", { v0: ()=>s.name }));});}
  const cf = t.closest('[data-confirm]');if (cf) {const id = pendingOpen;if (cf.dataset.confirm === 'cancel') {pendingOpen = null;return renderMenu();}if (cf.dataset.confirm === 'save' && !await saveScheme(false)) return;return openScheme(id);}
  const op = t.closest('[data-open]');if (op) {const id = op.dataset.open;if (id === activeId || id === 'original' && !activeId && !dirty()) return;if (dirty()) {pendingOpen = id;return renderMenu();}return openScheme(id);}
});
$('#scheme-menu').addEventListener('keydown', (e) => {
  if (e.target.id === 'sm-code' && e.key === 'Enter') {e.preventDefault();$('#sm-import').click();}
  if (e.target.id === 'sm-rename') {if (e.key === 'Enter') {e.preventDefault();finishRename(true);}if (e.key === 'Escape') {e.preventDefault();e.stopPropagation();finishRename(false);}}
});
$('#scheme-menu').addEventListener('focusout', (e) => {if (e.target.id === 'sm-rename') finishRename(true);});
async function finishRename(save) {const s = schemes.find((x) => x.id === renamingId),v = $('#sm-rename')?.value.trim();renamingId = null;if (save && s && v && v !== s.name) {
  if (personal) {const result = await personalWrite('PUT', s.id, {...schemeBody(s), name:v.slice(0,40)});if (!result) return renderMenu();Object.assign(s,result);}else s.name = v.slice(0,40);
  if (s.id === activeId) name = s.name;persist();if (!personal) pushScheme(s);renderAll();toast(_message("text.0096", { v0: ()=>s.name }));} else renderMenu();}
$('#scheme-menu').addEventListener('input', (e) => {if (e.target.id === 'sm-name') {defaultName = false;name = e.target.value.trim() || _t("text.0047");$('#scheme-name').textContent = name;persist();}});

// ---------- compare (hold or side by side) ----------
const compareTargets = () => [['original', _t("text.0069")], ...schemes.filter((s) => s.id !== activeId).map((s) => [s.id, s.name]), ...(activeId && dirty() ? [['saved', _t("text.0097")]] : [])];
const compareColors = () => compareId === 'saved' ? baseline().colors : compareId === 'original' ? ORIGINAL.colors : schemes.find((s) => s.id === compareId)?.design.colors || ORIGINAL.colors;
const compareName = () => compareTargets().find(([k]) => k === compareId)?.[1] || _t("text.0069");
function renderCompare() {
  if (!compareTargets().some(([k]) => k === compareId)) compareId = 'original';
  $('#hold').textContent = _t("text.0098", { v0: compareName() });
  $('#cmp-menu').innerHTML = compareTargets().map(([k, l]) => `<button data-cmp="${k}" class="${k === compareId ? 'on' : ''}">${esc(l)}</button>`).join('') + `<hr><button data-cmp-split class="${splitOn ? 'on' : ''}">${_t("text.0099", { v1: splitOn ? '✓ ' : '' })}</button>`;
  view.setSplit(splitOn ? compareColors() : null);$('#split-labels').hidden = !splitOn;$('#split-a').textContent = 'A · ' + compareName();
}
$('#cmp-pick').onclick = (e) => {e.stopPropagation();const m = $('#cmp-menu');m.hidden = !m.hidden;};
$('#cmp-menu').onclick = (e) => {const b = e.target.closest('[data-cmp]');if (b) {compareId = b.dataset.cmp;} else if (e.target.closest('[data-cmp-split]')) {splitOn = !splitOn;if (splitOn && sideOn) toggleSide(false);}renderCompare();$('#cmp-menu').hidden = true;};
const holdOn = () => {view.setColors(compareColors());$('#hold').classList.add('on');},holdOff = () => {view.setColors(design.colors);$('#hold').classList.remove('on');};
$('#hold').addEventListener('pointerdown', holdOn);$('#hold').addEventListener('pointerup', holdOff);$('#hold').addEventListener('pointerleave', holdOff);

// ---------- selection ----------
function targetIds() {
  const z = ZONES.find((z) => z.id === sel.zone);if (!z) return [];
  if (sel.scope === 'one' && sel.part) return sel.mirror ? paintTargets(parts, [sel.part], true) : [sel.part];
  if (sel.scope === 'left' || sel.scope === 'right') return sideParts(parts, z.ids, sel.scope);
  return z.ids;
}
const hasSides = (z) => sideParts(parts, z.ids, 'left').length > 0;
function select(zone, { part = null, scope } = {}) {sel = { ...sel, zone, part, scope: scope || (part ? 'one' : 'all') };if (part) sel.mirror = paintTargets(parts, [part], true).length > 1;replaceFrom = null;renderAll();}
const selectionLabel = () => {const z = ZONES.find((z) => z.id === sel.zone),p = sel.part && partById.get(sel.part);return sel.scope === 'one' && p ? p.name : sel.scope === 'left' ? _t("text.0100", { v0: z.name }) : sel.scope === 'right' ? _t("text.0101", { v0: z.name }) : z.name;};

// ---------- colour finder (nearest real filament to any colour) ----------
function lab(hex) {const n = parseInt(hex.slice(1), 16),f = (v) => {v /= 255;return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;},[r, g, b] = [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)];const x = (r * .4124 + g * .3576 + b * .1805) / .95047,y = r * .2126 + g * .7152 + b * .0722,z = (r * .0193 + g * .1192 + b * .9505) / 1.08883,k = (t) => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;return [116 * k(y) - 16, 500 * (k(x) - k(y)), 200 * (k(y) - k(z))];}
const deltaE = (a, b) => {const p = lab(a),q = lab(b);return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);};
const closeness = (d) => d < 6 ? _t("text.0102") : d < 15 ? _t("text.0103") : d < 28 ? _t("text.0104") : _t("text.0105");

// ---------- rendering ----------
const used = () => [...new Set(parts.map((p) => keyOf(p.id)))];
const countOf = (k) => parts.filter((p) => keyOf(p.id) === k).length;
function chips(ids) {return [...new Set(ids.map((id) => design.colors[id]))].slice(0, 4).map((c) => `<i style="--c:${c}"></i>`).join('');}
function renderHeader() {$('#scheme-name').textContent = name;$('#scheme-state').textContent = (activeId ? dirty() ? _t("text.0106") : _t("text.0107") : _t("text.0108")) + (provenance ? _t("text.0084") : '');$('#scheme-state').className = activeId && !dirty() ? 'ok' : '';}
function renderRail() {
  $('#rail').innerHTML = `<div class="rail-head"><span class="eyebrow">${_t("text.0109")}</span><small>${_t("text.0110")}</small></div>` + ZONES.map((z) => {
    const on = sel.zone === z.id,locked = z.ids.every((id) => locks.has(id)),part = on && sel.part && sel.scope === 'one' ? partById.get(sel.part) : null;
    return `<div class="zone ${on ? 'on' : ''} ${z.internal ? 'internal' : ''}"><button class="zone-main" data-zone="${z.id}"><span class="zone-chips">${chips(z.ids)}</span><span class="zone-name">${esc(z.name)}<small>${_t("text.0115", { v5: z.ids.length, v6: partById.get(z.ids[0]).material === 'TPU 90A' ? _t("text.0111") : 'PLA' })}</small></span></button><button class="zone-lock ${locked ? 'on' : ''}" data-lock="${z.id}" title="${_attr(locked ? _t("text.0112") : _t("text.0113"))}" aria-label="${_attr(_t("text.0116", { v10: esc(z.name) }))}">${locked ? '🔒' : '🔓'}</button>${part ? `<div class="zone-part">${_t("text.0114", { v0: esc(part.name) })}</div>` : ''}</div>`;}).join('');
  if (step === 2) $('#rail .zone.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function swatch(k, { current, extra = '' } = {}) {return `<button class="sw ${current ? 'on' : ''} ${isHex(k) ? 'free' : ''}" data-key="${k}" style="--c:${keyHex(k)}" title="${_attr(esc(keyName(k) + ' · ' + keySub(k)))}"><i></i><span>${esc(keyName(k))}<small>${esc(keySub(k))}${extra}</small></span></button>`;}
// Step 1 · 选个起点: one page, four kinds of starting points, every card previews on hover and applies on click.
// 白胚 (all white) · 经典配色 (4) · 灵感骰子 (4 at once, one per colour mapping) · 我的方案 (saved ones).
const prodBy = (code, series) => catalog.products.find((p) => p.colorCode === code && p.series === series);
const BLANK = (() => {const w = prodBy('10100', 'PLA Basic'),t = prodBy('51105', 'TPU 90A');return { colors: Object.fromEntries(parts.map((p) => [p.id, (p.material === 'TPU 90A' ? t : w).hex.toUpperCase()])), assignments: Object.fromEntries(parts.map((p) => [p.id, (p.material === 'TPU 90A' ? t : w).id])) };})();
let CLASSICS = [['original', _t("text.0117"), _t("text.0118"), ORIGINAL], ...[1, 2, 6].map((i) => ['theme-' + i, THEMES[i].name, _t("text.0119", { v0: _label(THEMES[i].recipe) }), quickDesign(parts, products, themeSlots(products, THEMES[i]), THEMES[i].recipe)])];
let DICE_STYLES = [['经典', _t("text.0120")], ['撞色', _t("text.0121")], ['双拼', _t("text.0122")], ['低调', _t("text.0123")]];
// Dice cards are drawn like hextech cards: each slot keeps its style, can be locked, rerolled alone, or saved.
let diceDraw = 0,diceSet = [],startId = null;
function drawCard(i) {const [r, hint] = DICE_STYLES[i],sl = rollSlots(products, slots, r, { recipe: true }).slots,id = `dice-${++diceDraw}`,design = quickDesign(parts, products, sl, r);thumbCache.set(id, view.thumbnail(design.colors, 320, 240));const number = diceDraw;return { id, get name() {return _label(r) + ' #' + number;}, get hint() {return DICE_STYLES[i][1];}, recipe: r, design, locked: false };}
function rollDice() {diceSet = DICE_STYLES.map((_, i) => drawCard(i));}
function startOf(id) {
  if (id === 'blank') return { get name() {return _t("text.0124");}, design: BLANK };
  const c = CLASSICS.find((x) => x[0] === id);if (c) return { get name() {return CLASSICS.find((x) => x[0] === id)[1];}, design: c[3] };
  const d = diceSet.find((x) => x.id === id);if (d) return { get name() {return d.name;}, design: d.design };
  const sc = id.startsWith('scheme-') && schemes.find((x) => x.id === id.slice(7));if (sc) return { name: sc.name, design: sc.design, scheme: sc };
  return null;
}
// Everything fits one screen: a slim 白胚 strip, then three rows of four small cards. The model on the
// left is the big preview (hover a card), so the cards only need to be recognisable.
const startCard = (id, title, extra = '') => `<button class="mini" role="option" data-start="${id}" title="${_attr(esc(title))}"><img data-thumb="${id}" alt=""><span>${esc(title)}</span>${extra}</button>`;
const diceCell = (d, i) => `<div class="dice-cell ${d.locked ? 'locked' : ''}" data-dice-cell="${i}"><button class="mini" role="option" data-start="${d.id}" title="${_attr(esc(_label(d.recipe) + ' · ' + d.hint))}"><img src="${thumbCache.get(d.id) || ''}" class="ready" alt=""><span>${esc(_label(d.recipe))}</span></button>
  <div class="dice-ctl"><button data-dice-lock="${i}" aria-pressed="${d.locked}" title="${_attr(d.locked ? _t("text.0112") : _t("text.0125"))}">${d.locked ? '🔒' : '🔓'}</button><span><button data-dice-one="${i}" ${d.locked ? 'disabled' : ''} title="${_attr(_t("text.0126"))}">↻</button><button data-keep="${d.id}" title="${_attr(_t("text.0127"))}">☆</button></span></div></div>`;
const diceCards = () => diceSet.map(diceCell).join('');
// Flip: turn the card edge-on, swap in the new draw while it is invisible, turn it back with a glint.
function flipCard(i, delay = 0) {
  setTimeout(() => {const cell = $(`[data-dice-cell="${i}"]`);if (!cell) return;cell.classList.add('flip-out');
    setTimeout(() => {diceSet[i] = drawCard(i);const fresh = document.createElement('div');fresh.innerHTML = diceCell(diceSet[i], i);const nc = fresh.firstElementChild;nc.classList.add('flip-in');cell.replaceWith(nc);updateStep1();setTimeout(() => nc.classList.remove('flip-in'), 520);}, 180);
  }, delay);
}
function rerollAll() {const open = diceSet.map((d, i) => d.locked ? null : i).filter((i) => i !== null);if (!open.length) return toast(_message("text.0128"));open.forEach((i, k) => flipCard(i, k * 85));}
function panelStep1() {
  if (!diceSet.length) rollDice();
  const more = schemes.length - 3,mine = schemes.slice(0, more > 1 ? 3 : 4);
  return `<div class="panel-head compact"><span class="eyebrow">${_t("text.0132")}</span><div class="sel-line"><h2>${_t("text.0133")}</h2><span class="kind-tag">${_t("text.0134")}</span></div></div>
  <div class="panel-body starts one-screen" id="starts">
    <button class="blank-strip" data-start="blank"><i></i><span><b>${_t("text.0124")}</b><small>${_t("text.0135")}</small></span><em>→</em></button>
    <section><div class="strip"><span>${_t("text.0136")}</span></div><div class="mini-row">${CLASSICS.map((c) => startCard(c[0], c[1])).join('')}</div></section>
    <section><div class="strip"><span>${_t("text.0137")} <small class="hover-hint">${_t("text.0138")}</small></span><button class="reroll" id="dice"><span class="die">🎲</span> ${_t("text.0139")} <kbd>R</kbd></button></div><div class="mini-row" id="dice-grid">${diceCards()}</div></section>
    <section><div class="strip"><span>${_t("text.0140")}</span>${schemes.length ? `<small>${_t("text.0129", { v0: schemes.length })}</small>` : ''}</div><div class="mini-row">${mine.map((m) => startCard('scheme-' + m.id, m.name)).join('')}${more > 1 ? `<button class="mini more" id="more-schemes"><b>+${more}</b><span>${_t("text.0130")}</span></button>` : ''}${schemes.length ? '' : `<div class="mini-empty">${_t("text.0131")}</div>`}</div></section>
  </div>
  <div class="panel-foot"><button class="primary" data-go="2" id="start-go"></button></div>`;
}
function updateStep1() {
  $$('[data-start]').forEach((b) => b.classList.toggle('on', b.dataset.start === startId));
  const s = startId && startOf(startId);$('#start-go').textContent = s ? `${_t("text.0141", { v0: s.name })}` : _t("text.0142");
}
function applyStart(id) {
  const s = startOf(id);if (!s) return;startId = id;
  if (s.scheme) {openScheme(s.scheme.id);return;}
  const next = clone(design);for (const p of parts) if (!locks.has(p.id)) {next.colors[p.id] = s.design.colors[p.id];next.assignments[p.id] = s.design.assignments[p.id];}
  next.finishes = {};if (!activeId && (defaultName || startId)) name = id === 'blank' ? _t("text.0047") : s.name;stepsDone.add(1);commit(next, _message("text.0143", { v0: ()=>s.name }));
}
async function keepDice(id) {
  const d = diceSet.find((x) => x.id === id);if (!d) return;if (schemes.length >= 30) return toast(_message("text.0144"));
  const s = { id: newId(), name: d.name, design: clone(d.design), provenance: null, voiceSalt: 0, created: Date.now(), updated: Date.now() };
  if (personal) {const result = await personalWrite('PUT', s.id, schemeBody(s));if (!result) return;Object.assign(s,result);}
  schemes.unshift(s);persist();if (!personal) pushScheme(s);renderPanel();toast(_message("text.0145", { v0: d.name, v1: savedWhere() }));
}
const selKind = () => partKind(partById.get(ZONES.find((z) => z.id === sel.zone).ids[0]));
// In 刷子 mode the swatches load the brush instead of painting a selection, so they list the brush's material.
const gridKind = () => tool === 'brush' ? brushKind : selKind();
// The brush colour is simply the current colour: whatever was picked last, in either mode.
function setInk(k) {brush = k;if (!isHex(k) && products.has(k)) brushKind = kindOf(products.get(k));const bar = $('#brush-bar');if (bar) bar.innerHTML = inkBar();markGrid();renderStage();}
const inkBar = () => brush ? `<i style="--c:${keyHex(brush)}"></i><div class="cur-text"><b>${esc(keyName(brush))}</b><small>${_t("text.0146", { v2: esc(keySub(brush)) })}</small></div>` : '';
function setTool(t) {
  if (t === 'brush' && !brush) {const keys = [...new Set(targetIds().map(keyOf))];brush = keys.length === 1 ? keys[0] : recent[0] || keyOf(targetIds()[0]);}
  if (t === 'brush' && brush && !isHex(brush) && products.has(brush)) brushKind = kindOf(products.get(brush));
  if (t === 'pick') toolBefore = tool === 'pick' ? 'select' : tool;else pickToFree = false;
  tool = t;replaceFrom = null;clearBrushHover();renderAll();
}
function clearBrushHover() {if (brushHover) {brushHover = null;view.setColors(design.colors);}}
const brushTargets = (id) => (brushMirror ? paintTargets(parts, [id], true) : [id]).filter((x) => !locks.has(x) && fits(x, brush));
const cursorFor = (hex) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='9' fill='${hex}' stroke='white' stroke-width='3'/><circle cx='14' cy='14' r='10.5' fill='none' stroke='#141c33' stroke-width='1.2'/></svg>`)}") 14 14, crosshair`;
const brandList = (id, kind) => (id === 'bambu' ? catalog.products : [...products.values()].filter((p) => p.demo && p.brand === DEMO_BRANDS.find((b) => b.id === id)?.name)).filter((p) => kindOf(p) === kind);
// Step 2 colour dock. Static structure renders once per selection; painting only refreshes the live parts
// (current colour, in-use chips, selected rings), so hover, focus and scroll never jump.
// Step 2 fits one screen: a two-line header, the tabs, and a pane with no folds or dropdowns.
function panelStep2() {
  const z = ZONES.find((z) => z.id === sel.zone),kind = selKind(),part = sel.part && partById.get(sel.part);
  const pairOf = part && paintTargets(parts, [part.id], true).find((id) => id !== part.id);
  const scopes = [['all', _t("text.0147", { v0: z.ids.length })], ...(hasSides(z) ? [['left', _t("text.0148")], ['right', _t("text.0149")]] : []), ...(part ? [['one', _t("text.0150")]] : [])];
  const kindNow = gridKind(),finishes = kindNow === 'TPU' ? ['tpu'] : ['basic', 'matte', 'silk', 'translucent'];if (!finishes.includes(freeFinish)) freeFinish = finishes[0];
  const head = tool === 'brush' ? `<div class="panel-head compact tight brush-head"><div class="sel-line"><h2>${_t("text.0151")}</h2><div class="cur ink slim" id="brush-bar">${
  inkBar()}</div><button class="exit-brush" data-set-tool="select" title="${_attr(_t("text.0152"))}">${_t("text.0153")}</button></div>
      <div class="brush-opts"><label class="pill-check"><input type="checkbox" id="brush-mirror" ${brushMirror ? 'checked' : ''}>${_t("text.0154")}</label><div class="mini-seg" role="group" aria-label="${_attr(_t("text.0155"))}">${['PLA', 'TPU'].map((k) => `<button data-brush-kind="${k}" class="${brushKind === k ? 'on' : ''}">${k === 'PLA' ? 'PLA' : _t("text.0043")}</button>`).join('')}</div></div></div>` : `<div class="panel-head compact tight"><div class="sel-line"><h2>${
  esc(selectionLabel())}</h2><span class="kind-tag ${kind === 'TPU' ? 'tpu' : ''}">${kind === 'TPU' ? _t("text.0043") : 'PLA'}</span>${z.id === 'face' ? `<span class="info-dot" title="${_attr(_t("text.0156"))}">i</span>` : ''}</div>
      <div class="scope" role="group" aria-label="${_attr(_t("text.0159"))}">${scopes.map(([k, l]) => `<button class="${sel.scope === k ? 'on' : ''}" data-scope="${k}">${l}</button>`).join('')}${sel.scope === 'one' && pairOf ? `<label class="pill-check" title="${_attr(_t("text.0157", { v0: esc(partById.get(pairOf).name) }))}"><input type="checkbox" id="mirror" ${sel.mirror ? 'checked' : ''}>${_t("text.0158")}</label>` : ''}</div></div>`;
  return head + dockHTML(finishes) + `<div class="panel-foot"><button class="primary" data-go="3">${_t("text.0160")}</button></div>`;
}
function dockHTML(finishes) {return `<div class="cdock" id="cdock" data-tab="${dockTab}">
    <div class="dock-tabs" role="tablist"><button data-tab="filament" role="tab">${_t("text.0167")}</button><button data-tab="free" role="tab">${_t("text.0168")}</button><i class="ink"></i></div>
    <div class="panel-body dock-body fit">
      <div id="replace-slot"></div>
      <section class="pane pane-filament">
        <div class="strip"><span>${_t("text.0169")} <small${tool === 'brush' ? '' : ' class="hover-hint"'}>${tool === 'brush' ? _t("text.0161") : _t("text.0162")}</small></span><button class="link-btn" id="take-open" title="${_attr(_t("text.0170"))}">${_t("text.0171")}</button></div>
        <div class="chips one-line" id="inuse-row"></div>
        <div class="take-pop" id="take-pop" hidden></div>
        <div class="brand-row" role="group" aria-label="${_attr(_t("text.0172"))}">${BRANDS.map((b) => `<button data-brand="${b.id}" class="${source === b.id ? 'on' : ''}" title="${_attr(b.demo ? _t("text.0163") : '')}">${b.short}${b.demo ? `<sup>${_t("text.0037")}</sup>` : ''}</button>`).join('')}<label class="mini-search"><span>⌕</span><input id="search" placeholder="${_attr(_t("text.0173"))}" value="${esc(search)}" autocomplete="off"></label></div>
        <div class="grid" id="lib-grid" role="listbox" aria-label="${_attr(_t("text.0167"))}"></div>
        <div class="hover-info static" id="hover-info" aria-live="polite"></div>
      </section>
      <section class="pane pane-free">
        <div class="free-top"><div class="sv" id="sv" role="slider" tabindex="0" aria-label="${_attr(_t("text.0174"))}"><span></span></div>
          <div class="free-side"><div class="hex-row"><i id="free-chip"></i><input id="free-hex" maxlength="7" aria-label="${_attr(_t("text.0175"))}" autocomplete="off"></div>
            <div class="finish-seg grid2" id="finish-seg" role="group" aria-label="${_attr(_t("text.0176"))}">${finishes.map((f) => `<button data-finish="${f}" class="${freeFinish === f ? 'on' : ''}">${FIN_LABEL[f]}</button>`).join('')}</div>
            <button class="ghost-sm" id="free-pick" title="${_attr(_t("text.0177"))}">${_t("text.0178")}</button></div></div>
        <input id="hue" class="hue" type="range" min="0" max="360" step="1" aria-label="${_attr(_t("text.0179"))}">
        ${tool === 'brush' ? `<div class="free-actions brush-note">${_t("text.0164")}</div>` : `<div class="free-actions"><label class="pill-check"><input type="checkbox" id="free-auto" ${freeAuto ? 'checked' : ''}>${_t("text.0165")}</label><button class="free-apply" id="free-apply">${_t("text.0166", { v1: esc(selectionLabel()) })}</button></div>`}
        <div class="chip-line"><span>${_t("text.0180")}</span><div class="chips one-line" id="free-recent"></div></div>
        <div class="chip-line" title="${_attr(_t("text.0181"))}"><span>${_t("text.0182")}</span><div class="chips one-line near" id="free-near"></div></div>
      </section>
    </div>
  </div>`;}
const matchSearch = (p) => !search || (p.name + p.colorCode + (p.nameEn || '') + (p.brand || '')).toLowerCase().includes(search.toLowerCase());
function buildGrid() {
  const g = $('#lib-grid');if (!g) return;const list = brandList(source, gridKind()).filter(matchSearch);
  g.innerHTML = list.length ? list.map((p) => {const f = finishOfProduct(p);return `<button class="dot fin-${f}" role="option" data-key="${p.id}" style="--c:${p.hex}" aria-label="${_attr(esc(p.name))} ${_attr(esc(p.colorCode))}">${f === 'translucent' ? `<b>${_t("text.0183")}</b>` : ''}</button>`;}).join('') : `<p class="tip">${
  search ? _t("text.0184") : _t("text.0185")}</p>`;
  markGrid();
}
function markGrid() {const keys = new Set(tool === 'brush' ? [brush] : targetIds().map(keyOf)),one = keys.size === 1 ? [...keys][0] : null;$$('#lib-grid .dot').forEach((d) => d.classList.toggle('on', d.dataset.key === one));}
const chip = (k, { count, on } = {}) => `<button class="chip ${on ? 'on' : ''} fin-${isHex(k) ? hexFinish(k) || 'basic' : finishOfProduct(products.get(k))}" data-key="${k}" style="--c:${keyHex(k)}" aria-label="${_attr(esc(keyName(k)))}">${count ? `<em>${count}</em>` : ''}</button>`;
function hoverInfo(k) {
  const el = $('#hover-info');if (!el) return;
  if (k) {el.innerHTML = `<i style="--c:${keyHex(k)}"></i><span><b>${esc(keyName(k))}</b><small>${esc(keySub(k))}</small></span><kbd>${_t("text.0186")}</kbd>`;el.classList.add('live');return;}
  const keys = tool === 'brush' ? [brush] : [...new Set(targetIds().map(keyOf))];el.classList.remove('live');
  el.innerHTML = keys.length === 1 && keys[0] ? `<i style="--c:${keyHex(keys[0])}"></i><span><b>${tool === 'brush' ? _t("text.0187") : _t("text.0188")}${esc(keyName(keys[0]))}</b><small>${esc(keySub(keys[0]))}${targetIds().some((id) => locks.has(id)) && tool !== 'brush' ? _t("text.0189") : ''}</small></span><kbd class="hover-hint">${_t("text.0190")}</kbd>` : `<span class="muted">${_t("text.0191", { v0: keys.length })}</span>`;
}
function updateStep2() {
  const ids = targetIds(),keys = [...new Set(ids.map(keyOf))],one = tool === 'brush' ? brush : keys.length === 1 ? keys[0] : null,kind = gridKind();
  if ($('#brush-bar')) $('#brush-bar').innerHTML = inkBar();
  if ($('#cur-bar')) $('#cur-bar').innerHTML = `<div class="cur-chips">${keys.slice(0, 4).map((k) => `<i style="--c:${keyHex(k)}"></i>`).join('')}</div><div class="cur-text"><b>${one ? esc(keyName(one)) : _t("text.0192", { v0: keys.length })}</b><small>${one ? esc(keySub(one)) : _t("text.0193")}${ids.some((id) => locks.has(id)) ? _t("text.0189") : ''}</small></div>`;
  $('#replace-slot').innerHTML = replaceFrom ? `<div class="replace-banner"><span>${_t("text.0194")}<i style="--c:${keyHex(replaceFrom)}"></i><b>${esc(keyName(replaceFrom))}</b>${_t("text.0195", { v2: countOf(replaceFrom) })}</span><small>${_t("text.0196")}</small><button id="replace-cancel">${_t("text.0078")}</button></div>` : '';
  const fitsKind = (k) => isHex(k) || products.has(k) && kindOf(products.get(k)) === kind;
  $('#inuse-row').innerHTML = used().filter(fitsKind).map((k) => `<span class="chip-wrap">${chip(k, { count: countOf(k), on: k === one })}<button class="chip-rep ${replaceFrom === k ? 'on' : ''}" data-replace="${k}" title="${_attr(_t("text.0197", { v3: esc(keyName(k)) }))}" aria-label="${_attr(_t("text.0198", { v4: esc(keyName(k)) }))}">⇄</button></span>`).join('');
  markGrid();hoverInfo(null);syncFree();
}
// ---- free palette (after the original focus palette: SV square, hue rail, HEX, eyedropper) ----
const freeKey = () => {const f = gridKind() === 'TPU' || freeFinish === 'basic' ? null : freeFinish;return 'hex:' + finder.toUpperCase() + (f ? '|' + f : '');};
function syncFree() {
  const sv = $('#sv');if (!sv) return;
  sv.style.backgroundColor = hsvToHex(freeHsv.h, 1, 1);sv.firstElementChild.style.left = freeHsv.s * 100 + '%';sv.firstElementChild.style.top = (1 - freeHsv.v) * 100 + '%';
  $('#hue').value = String(Math.round(freeHsv.h));$('#free-chip').style.background = finder;if (document.activeElement !== $('#free-hex')) $('#free-hex').value = finder.toUpperCase();
  $('#free-apply')?.style.setProperty('--c', finder);
  $$('#finish-seg [data-finish]').forEach((b) => b.classList.toggle('on', b.dataset.finish === freeFinish));
  const kind = gridKind();$('#free-recent').innerHTML = recent.filter(isHex).slice(0, 8).map((k) => chip(k)).join('') || `<small class="muted">${_t("text.0199")}</small>`;
  $('#free-near').innerHTML = [...products.values()].filter((p) => kindOf(p) === kind).map((p) => [p, deltaE(finder, p.hex)]).sort((a, b) => a[1] - b[1]).slice(0, 6).map(([p, d]) => `<span class="near-item">${chip(p.id)}<small>${closeness(d)}</small></span>`).join('');
}
let freeFrame = 0;
function setFree(hex, { hsv, preview = true } = {}) {finder = hex.toUpperCase();freeHsv = hsv || hexToHsv(finder);cancelAnimationFrame(freeFrame);freeFrame = requestAnimationFrame(() => {syncFree();if (tool === 'brush' && preview) setInk(freeKey());else if (preview) previewFree();});}
function previewFree() {const ids = targetIds().filter((id) => !locks.has(id));previewing = true;view.setColors({ ...design.colors, ...Object.fromEntries(ids.map((id) => [id, finder])) });}
function commitFree() {previewing = false;if (tool === 'brush') return setInk(freeKey());paint(targetIds(), freeKey(), _message("text.0052"));}
function plateCheck() {
  return [1, 2, 3, 4, 5, 6].map((n) => {const ps = parts.filter((p) => p.plate === n),ids = [...new Set(ps.map((p) => keyOf(p.id)))],tpu = ps[0].material === 'TPU 90A';
    const warn = tpu && ids.length > 1 ? _t("text.0200") : !tpu && ids.length > 4 ? _t("text.0201") : '';
    return `<li class="${warn ? 'warn-row' : ''}"><b>${_t("text.0203", { v1: n })}</b><span class="pc-chips">${ids.map((k) => `<i style="--c:${keyHex(k)}" title="${_attr(esc(keyName(k)))}"></i>`).join('')}</span><small>${_t("text.0204", { v3: ps.length, v4: ids.length, v5: tpu ? _t("text.0202") : '' })}</small>${warn ? `<em>⚠ ${warn}</em>` : ''}</li>`;}).join('');
}
// Step 3: four short tabs (姿势 · 动作 · 分享 · 打印), each fits one screen; save / publish stay at the bottom.
function panelStep3() {
  const notes = designNotes(design.colors, design.assignments),list = used(),slotsNeeded = new Set([...Object.values(ORIGINAL.assignments), ...parts.map((p) => keyOf(p.id))]).size,code = lookCode({ ...design, name }, parts, products),okCode = code.startsWith('v1.');
  const pending = parts.filter((p) => !design.assignments[p.id] || products.get(design.assignments[p.id])?.demo).length;
  const plates = [1, 2, 3, 4, 5, 6].map((n) => {const ps = parts.filter((p) => p.plate === n),ks = [...new Set(ps.map((p) => keyOf(p.id)))],tpu = ps[0].material === 'TPU 90A',warn = tpu && ks.length > 1 ? _t("text.0205") : !tpu && ks.length > 4 ? _t("text.0206") : '';return `<div class="plate ${warn ? 'warn' : ''}" title="${_attr(warn || _t("text.0207", { v0: ps.length, v1: ks.length }))}"><b>${_t("text.0208", { v2: n })}</b><span>${ks.map((k) => `<i style="--c:${keyHex(k)}"></i>`).join('')}</span><small>${_t("text.0209", { v4: ks.length, v5: tpu ? ' · TPU' : '' })}</small></div>`;}).join('');
  return `<div class="panel-head compact tight"><div class="sel-line"><h2>${_t(personal ? 'personal.show' : "text.0221")}</h2><span class="kind-tag">${_t("text.0222", { v0: notes.count, v1: notes.warnings.length ? ' · ⚠' : '' })}</span></div>${notes.warnings.length ? `<p class="lead warn-lead">⚠ ${esc(notes.warnings[0])}</p>` : ''}</div>
  <div class="cdock" id="pdock" data-tab="${showTab}">
    <div class="dock-tabs three" role="tablist"><button data-ptab="move" role="tab">${_t("text.0223")}</button><button data-ptab="share" role="tab">${_t(personal ? 'personal.share' : "text.0224")}</button><button data-ptab="print" role="tab">${_t("text.0225", { v4: pending ? '<sup>!</sup>' : '' })}</button><i class="ink"></i></div>
    <div class="panel-body dock-body fit">
      <section class="pane pane-move">
        <div class="voice-row slim"><span>${_t("text.0226")}<small id="voice-desc">${voiceDesc ? voiceDesc : _t("text.0210")}</small></span><button id="voice-dice" title="${_attr(_t("text.0227"))}">🎲</button>${voiceSalt ? `<button id="voice-reset" title="${_attr(_t("text.0211"))}">↺</button>` : ''}<label class="pill-check" title="${_attr(_t("text.0228"))}"><input type="checkbox" id="act-sound" ${actions.sound ? 'checked' : ''}>${_t("text.0229")}</label></div>
        <div class="chips one-line voice-line">${VOICES.map((v) => `<button data-voice="${v.id}" title="${_attr(v.hint)}">${v.label}</button>`).join('')}</div>
        <div class="strip"><span>${_t("text.0230")} <small>${_t("text.0231")}</small></span><button class="link-btn" id="act-stop" ${actions.current ? '' : 'disabled'}>${_t("text.0232")}</button></div>
        <div class="move-grid">${ACTIONS.map((a) => `<button class="act move ${actions.current === a.id ? 'on' : ''}" data-act="${a.id}" title="${_attr(a.desc)}"><span>${a.icon}</span><b>${a.name}</b><i class="anim">▶</i></button>`).join('')}<button class="act move show-all" id="act-show" title="${_attr(_t("text.0233"))}"><span>🎬</span><b>${_t("text.0234")}</b><i class="anim">▶</i></button>${MOVE_POSES.map(([n, icon, i]) => `<button class="act move" data-pose-preset="${i}" title="${_attr(_t("text.0212"))}"><span>${icon}</span><b>${n}</b></button>`).join('')}</div>
        <div class="strip"><span>${_t("text.0235")} <small>${_t("text.0236")}</small></span><button class="link-btn" data-pose-reset>${_t("text.0237")}</button></div>
        <div class="joint-grid">${POSE_SLIDERS.map(([g, id, label, min, max]) => `<label class="pose-row joint" title="${_attr(_t("text.0213"))}"><span>${label}</span><input type="range" data-pose="${id}" min="${min}" max="${max}" step="1"><em></em></label>`).join('')}</div>
      </section>
      <section class="pane pane-share">
        <button class="poster-card" id="open-poster"><span class="poster-mini"><img id="poster-mini" alt="${_attr(_t("text.0238"))}"><i class="spin"></i></span><span><b>${_t("text.0239")}</b><small>${_t("text.0240")}</small></span></button>
        <div class="code-box ${okCode ? '' : 'off'}"><span>${_t("text.0241")} <small>${_t("text.0242")}</small></span><code>${esc(okCode ? code : _t("text.0214"))}</code>${okCode ? `<button id="copy-code">${_t("text.0215")}</button>` : ''}</div>
      </section>
      <section class="pane pane-print">
        ${pending ? `<div class="replace-banner"><span>${_t("text.0216", { v0: pending })}</span><small>${_t("text.0217")}</small></div>` : ''}
        <div class="strip"><span>${_t("text.0243")} <small>${_t("text.0244", { v17: list.length })}</small></span></div>
        <div class="bom-grid">${list.map((k) => `<div title="${_attr(esc(keySub(k)))}"><i style="--c:${keyHex(k)}"></i><span>${esc(keyName(k))}</span><b>${countOf(k)}</b></div>`).join('')}</div>
        <div class="strip"><span>${_t("text.0245")} <small>${_t("text.0246", { v19: slotsNeeded, v20: slotsNeeded > 16 ? _t("text.0218") : '' })}</small></span></div>
        <div class="plates-grid">${plates}</div>
        <button class="primary" id="export2">${_t("text.0247")}</button>
      </section>
    </div>
  </div>
  <div class="panel-foot finish"><button class="save-mine ${activeId && !dirty() ? 'done' : ''}" id="finish-save" title="${_attr(_t(personal ? 'personal.saveTitle' : "text.0248"))}">${activeId && !dirty() ? _t("text.0219") : _t("text.0220")}</button>${personal ? '' : `<button class="primary" id="publish" title="${_attr(_t("text.0249"))}">${_t("text.0250")}</button>`}</div>`;
}
// The share tab shows the real poster, rendered once per design when the tab opens.
let miniKey = '';
function fillPosterMini() {
  const img = $('#poster-mini');if (!img) return;const key = JSON.stringify([design, name]);if (key === miniKey && img.dataset.src) {img.src = img.dataset.src;img.parentElement.classList.add('ready');return;}
  img.parentElement.classList.remove('ready');
  setTimeout(() => requestAnimationFrame(() => {const cv = drawPoster({ view, design: { ...design, name, author: account.user?.name || '' }, parts, products, before: ORIGINAL, opts: { ratio: '3:4', theme: 'light', materials: true, compare: false, author: true } }),small = document.createElement('canvas');small.width = 270;small.height = 360;small.getContext('2d').drawImage(cv, 0, 0, 270, 360);miniKey = key;img.dataset.src = small.toDataURL('image/png');if ($('#poster-mini') === img) {img.src = img.dataset.src;img.parentElement.classList.add('ready');}}), 60);
}
function renderPanel() {
  const panel = $('#panel'),top = $('#panel .panel-body')?.scrollTop || 0,outer = panel.scrollTop,again = panel.dataset.step === String(step);
  panel.innerHTML = step === 1 ? panelStep1() : step === 2 ? panelStep2() : panelStep3();panel.dataset.step = step;
  if (again && $('#panel .panel-body')) $('#panel .panel-body').scrollTop = top;
  // On phones the panel itself scrolls under the pinned duck: keep the spot within a step, start a new step at the top.
  panel.scrollTop = again ? outer : 0;
  // A new step slides its content in; re-renders within a step stay still.
  if (!again) {panel.classList.remove('enter');void panel.offsetWidth;panel.classList.add('enter');}
  if (step === 3 && showTab === 'share') fillPosterMini();
  if (step === 3 && $('.joint-grid')) syncPose();
  if (step !== 2 && poseOpen) togglePose(false);
  if (step === 1) {fillThumbs();updateStep1();}if (step === 2) {buildGrid();updateStep2();}
}
const thumbCache = new Map();
function fillThumbs() {const imgs = $$('[data-thumb]');(function next() {const img = imgs.find((i) => !i.src);if (!img) return;const id = img.dataset.thumb,s = startOf(id),key = id.startsWith('scheme-') ? id + JSON.stringify(s?.design.colors) : id;if (s && !thumbCache.has(key)) thumbCache.set(key, view.thumbnail(s.design.colors, 320, 240));img.src = thumbCache.get(key) || 'data:,';img.classList.add('ready');requestAnimationFrame(next);})();}
function renderSteps() {$$('#steps button').forEach((b) => {const n = +b.dataset.step;b.classList.toggle('on', n === step);b.classList.toggle('done', stepsDone.has(n) && n !== step);});$('#studio').dataset.step = step;}
function renderStage() {
  const ids = step === 2 && tool === 'select' ? replaceFrom ? parts.filter((p) => keyOf(p.id) === replaceFrom).map((p) => p.id) : targetIds() : [];if (!brushHover) view.setHighlight(ids, []);
  $('#stage').style.setProperty('--brush-cursor', tool === 'brush' && brush ? cursorFor(keyHex(brush)) : 'crosshair');
  $$('#tools [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
  const bp = brush && keyName(brush);$('#brush-chip').hidden = !(tool === 'brush' && bp);if (bp) $('#brush-chip').innerHTML = `<i style="--c:${keyHex(brush)}"></i>${esc(bp)}`;
  $('#stage').dataset.tool = step === 2 ? tool : 'select';
  $('#hint').textContent = step === 1 ? _t("text.0251") : step === 3 ? _t("text.0252") : replaceFrom ? _t("text.0253") : tool === 'brush' ? _t("text.0254") : tool === 'pick' ? _t("text.0255") : _t("text.0256");
  $('#stage').style.setProperty('--tint', design.colors['P5-06']);
  view.setFinishes(Object.fromEntries(parts.map((p) => [p.id, keyFinish(keyOf(p.id), p.id)])));
  // 自动背景: light selections get a mid-tone backdrop so white parts never melt into it.
  const look = (step === 2 ? targetIds() : ['P4-01', 'P5-06', 'P5-07', 'P5-01', 'P5-02', 'P2-03', 'P2-04']).map((id) => lum(design.colors[id])),avg = look.reduce((a, b) => a + b, 0) / look.length;
  $('#stage').dataset.bg = bgPref === 'auto' ? avg > .55 ? 'mid' : 'soft' : bgPref;$$('#bgs [data-bg]').forEach((b) => b.classList.toggle('on', b.dataset.bg === bgPref));paintBg();
  // The enlarged copy stands beside the duck in the same view; it follows the current selection.
  const showSide = sideOn && step === 2 && !splitOn && view.layout !== 'arrange',ids2 = targetIds(),scale = view.setSideCopy(showSide ? ids2 : null, $('#side-label'));
  $('#side-label').textContent = _t("text.0257", { v0: scale.toFixed(1), v1: selectionLabel() });$('#side-toggle').setAttribute('aria-pressed', sideOn);
  // One button: 聚焦 flies to the selection, 整机 flies back; while focused, a new selection is followed.
  const fk = ids2.join(',');if (focused && step === 2 && fk !== focusKey) {focusKey = fk;view.focus(ids2);}
  $('#focus-icon').textContent = focused ? '⤢' : '⌖';$('#focus-text').textContent = focused ? _t("text.0258") : _t("text.0259");$('#focus-toggle').classList.toggle('active', focused);
  $$('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === view.layout));$('#spin').setAttribute('aria-pressed', view.turntable);
}
const lum = (hex) => {const n = parseInt(hex.slice(1), 16),f = (v) => {v /= 255;return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;};return .2126 * f(n >> 16 & 255) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255);};
// Each colour scheme has its own voice: the seed is derived from the 配色码 (plus an optional re-roll),
// so anyone who brings in the same colours hears the same duck.
let voiceKey = '',voiceDesc = '';
async function updateVoice() {
  const code = lookCode({ ...design, name: '' }, parts, products, false),key = (code.startsWith('v1.') ? code : 'colors:' + parts.map((p) => keyOf(p.id)).join(',')) + (voiceSalt ? '#' + voiceSalt : '');if (key === voiceKey) return;voiceKey = key;
  const seed = await seedFromText(key);if (key !== voiceKey) return;actions.seed = seed;voiceDesc = describeVoice(seed);const el = $('#voice-desc');if (el) el.textContent = voiceDesc + ' · #' + seed.toString(16).padStart(8, '0');
}
function renderAll(lite = false) {renderHeader();renderSteps();renderRail();if (lite && step === 2 && $('#cdock')) updateStep2();else if (lite && step === 1 && $('#sdock')) updateStep1();else renderPanel();renderStage();renderCompare();renderMenu();$('#undo').disabled = !undo.length;$('#redo').disabled = !redo.length;updateVoice();}
function goStep(n) {
  if (step === 3 && n !== 3) {actions.stop();applyPose();}
  if (focused && n !== 2) {focused = false;focusKey = '';view.view('hero');}
  step = n;if (n > 1) stepsDone.add(n - 1);replaceFrom = null;
  if (n === 3) {if (view.layout === 'arrange') setLayout('assembly');view.setTurntable(true);tool = 'select';} else if (view.turntable) {view.setTurntable(false);view.resetSpin();}
  renderAll();
}
function setLayout(l) {view.setLayout(l, { order: ZONE_ORDER });if (l !== 'assembly') {poseUI = { ...POSE_ZERO };syncPose();}renderStage();}
function toggleSide(on = !sideOn) {sideOn = on;if (on && splitOn) {splitOn = false;renderCompare();}renderStage();}
function setFocused(on) {focused = on;focusKey = '';if (!on) {$$('#views button').forEach((x) => x.classList.toggle('on', x.dataset.view === 'hero'));view.view('hero');}renderStage();}

// ---------- events: header ----------
$('#steps').onclick = (e) => {const b = e.target.closest('[data-step]');if (b) goStep(+b.dataset.step);};

// ---------- events: panel ----------
let previewing = false;
$('#panel').addEventListener('click', async (e) => {
  const t = e.target,go = t.closest('[data-go]');if (go) return goStep(+go.dataset.go);
  const ptab = t.closest('[data-ptab]');if (ptab) {showTab = ptab.dataset.ptab;$('#pdock').dataset.tab = showTab;if (showTab === 'share') fillPosterMini();return;}
  const keep = t.closest('[data-keep]');if (keep) {e.stopPropagation();keep.textContent = '★';return keepDice(keep.dataset.keep);}
  if (t.closest('#more-schemes')) {e.stopPropagation();menuOpen = true;return renderMenu();}
  const card = t.closest('[data-start]');if (card) {card.classList.remove('pop');void card.offsetWidth;card.classList.add('pop');return applyStart(card.dataset.start);}
  if (t.closest('#dice')) {const die = $('.die');die?.classList.remove('roll');void die?.offsetWidth;die?.classList.add('roll');return rerollAll();}
  const dl = t.closest('[data-dice-lock]');if (dl) {const i = +dl.dataset.diceLock,d = diceSet[i];d.locked = !d.locked;const cell = dl.closest('.dice-cell');cell.classList.toggle('locked', d.locked);dl.textContent = d.locked ? '🔒' : '🔓';dl.setAttribute('aria-pressed', d.locked);dl.title = d.locked ? _t("text.0112") : _t("text.0125");cell.querySelector('[data-dice-one]').disabled = d.locked;return;}
  const one = t.closest('[data-dice-one]');if (one) {if (!diceSet[+one.dataset.diceOne].locked) flipCard(+one.dataset.diceOne);return;}
  const rp = t.closest('[data-replace]');if (rp) {replaceFrom = replaceFrom === rp.dataset.replace ? null : rp.dataset.replace;renderPanel();return renderStage();}
  if (t.closest('#replace-cancel')) {replaceFrom = null;renderPanel();return renderStage();}
  const sw = t.closest('[data-key]');
  if (sw && step === 2) {
    previewing = false;const pid = sw.dataset.key;
    if (replaceFrom) {const from = replaceFrom,ids = parts.filter((p) => keyOf(p.id) === from).map((p) => p.id);replaceFrom = null;return paint(ids, pid, _message("text.0260", { v0: ()=>keyName(from) }));}
    sw.classList.remove('pop');void sw.offsetWidth;sw.classList.add('pop');
    if (tool === 'brush') {if (isHex(pid)) {setFree(keyHex(pid), { preview: false });if (hexFinish(pid)) freeFinish = hexFinish(pid);}return setInk(pid);}
    if (isHex(pid)) {setFree(keyHex(pid), { preview: false });if (hexFinish(pid)) freeFinish = hexFinish(pid);}
    return paint(targetIds(), pid);
  }
  const tab = t.closest('.dock-tabs [data-tab]');if (tab) {dockTab = tab.dataset.tab;$('#cdock').dataset.tab = dockTab;if (dockTab === 'free') syncFree();return;}
  const br = t.closest('[data-brand]');if (br) {source = br.dataset.brand;$$('[data-brand]').forEach((x) => x.classList.toggle('on', x === br));return buildGrid();}
  const fin = t.closest('[data-finish]');if (fin) {freeFinish = fin.dataset.finish;syncFree();if (freeAuto || tool === 'brush') commitFree();return;}
  if (t.closest('#free-apply')) return commitFree();
  if (t.closest('#free-pick')) {pickToFree = true;setTool('pick');return toast(_message("text.0261"));}
  const st = t.closest('[data-set-tool]');if (st) return setTool(st.dataset.setTool);
  const bk = t.closest('[data-brush-kind]');if (bk) {brushKind = bk.dataset.brushKind;if (brush && !isHex(brush) && kindOf(products.get(brush)) !== brushKind) brush = recent.find((k) => !isHex(k) && products.has(k) && kindOf(products.get(k)) === brushKind) || brandList('bambu', brushKind)[0].id;return renderAll();}
  const sc = t.closest('[data-scope]');if (sc) {sel.scope = sc.dataset.scope;return renderAll();}
  if (t.closest('#take-open')) {const pop = $('#take-pop');pop.hidden = !pop.hidden;if (!pop.hidden) pop.innerHTML = `<b>${_t("text.0263")}</b>${[['original', _t("text.0069")], ...schemes.filter((x) => x.id !== activeId).map((x) => [x.id, x.name])].map(([k, l]) => `<div class="take-row"><span>${esc(l)}</span><button data-take-zone="${k}">${_t("text.0262", { v2: esc(selectionLabel()) })}</button><button data-take-all="${k}">${_t("text.0258")}</button></div>`).join('')}`;return;}
  const tk = t.closest('[data-take-zone],[data-take-all]');if (tk) {
    takeFrom = tk.dataset.takeZone || tk.dataset.takeAll;const src = takeFrom === 'original' ? ORIGINAL : schemes.find((s) => s.id === takeFrom)?.design;if (!src) return;
    const ids = tk.dataset.takeAll ? parts.map((p) => p.id) : targetIds(),patch = schemePatch(parts, ids, [...locks], src, products),next = clone(design);
    Object.assign(next.colors, patch.colors);Object.assign(next.assignments, patch.assignments);
    return commit(next, _message("text.0264", { v0: takeFrom === 'original' ? _message("text.0069") : schemes.find((s) => s.id === takeFrom).name, v1: Object.keys(patch.colors).length }));
  }
  if (t.closest('#open-poster')) return poster.open({ design: { ...design, name, author: account.user?.name || '' }, before: ORIGINAL });
  if (t.closest('#copy-code')) {navigator.clipboard?.writeText(lookCode({ ...design, name }, parts, products)).then(() => toast(_message("text.0265")), () => toast(_message("text.0266")));return;}
  const act = t.closest('[data-act]');if (act) return actions.play(act.dataset.act);
  const vc = t.closest('[data-voice]');if (vc) {vc.classList.remove('pop');void vc.offsetWidth;vc.classList.add('pop');return actions.say(vc.dataset.voice);}
  if (t.closest('#voice-dice')) {voiceSalt = 1 + Math.floor(Math.random() * 99999);persist();renderPanel();updateVoice();return toast(_message("text.0267"));}
  if (t.closest('#voice-reset')) {voiceSalt = 0;persist();renderPanel();updateVoice();return toast(_message("text.0211"));}
  if (t.closest('#act-show')) return actions.show();if (t.closest('#act-stop')) return actions.stop();
  if (t.closest('#export2')) return openExport();
  if (t.closest('#finish-save')) {if (activeId && !dirty()) return toast(_message(personal ? 'personal.saved' : "text.0268"));await saveScheme(false);return renderPanel();}
  if (t.closest('#publish')) return openPublish();
});
$('#panel').addEventListener('change', (e) => {
  if (e.target.id === 'mirror') {sel.mirror = e.target.checked;renderAll();}
  if (e.target.id === 'take-from') {takeFrom = e.target.value;}
  if (e.target.id === 'act-sound') {actions.sound = e.target.checked;}
  if (e.target.id === 'free-auto') {freeAuto = e.target.checked;}
  if (e.target.id === 'brush-mirror') {brushMirror = e.target.checked;}
  if (e.target.id === 'hue' && (freeAuto || tool === 'brush')) commitFree();
  if (e.target.id === 'free-hex' && /^#?[\da-f]{6}$/i.test(e.target.value.trim()) && freeAuto) commitFree();
});
$('#panel').addEventListener('input', (e) => {
  if (e.target.id === 'search') {search = e.target.value;buildGrid();}
  if (e.target.id === 'hue') {freeHsv = { ...freeHsv, h: +e.target.value };setFree(hsvToHex(freeHsv.h, freeHsv.s, freeHsv.v), { hsv: freeHsv });}
  if (e.target.id === 'free-hex') {const v = e.target.value.trim();if (/^#?[\da-f]{6}$/i.test(v)) setFree(v.startsWith('#') ? v : '#' + v);}
});
// Hovering a swatch previews it on the model; leaving restores the real design.
$('#panel').addEventListener('pointerover', (e) => {
  const unlocked = (d) => ({ ...design.colors, ...Object.fromEntries(Object.entries(d.colors).filter(([id]) => !locks.has(id))) });
  const th = e.target.closest('[data-start]');if (th) {const st = startOf(th.dataset.start);if (st) {previewing = true;view.setColors(unlocked(st.design));}return;}
  const sw = e.target.closest('[data-key]');if (!sw) return;const k = sw.dataset.key;if (step === 2) hoverInfo(k);if (tool === 'brush' && !replaceFrom) return;
  if (step !== 2) return;
  const ids = (replaceFrom ? parts.filter((x) => keyOf(x.id) === replaceFrom).map((x) => x.id) : targetIds()).filter((id) => !locks.has(id) && fits(id, k));if (!ids.length) return;
  previewing = true;view.setColors({ ...design.colors, ...Object.fromEntries(ids.map((id) => [id, keyHex(k)])) });
});
$('#panel').addEventListener('pointerout', (e) => {if (e.target.closest('[data-key],[data-start]') && !e.relatedTarget?.closest?.('[data-key],[data-start]')) {if (step === 2) hoverInfo(null);if (previewing && !freeDrag) {previewing = false;view.setColors(design.colors);}}});
$('#panel').addEventListener('focusin', (e) => {if (e.target.matches('.dot,.chip,.theme,.mini,.blank-strip')) e.target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));});
$('#panel').addEventListener('focusout', (e) => {if (e.target.matches('.dot,.chip,.theme,.mini,.blank-strip')) e.target.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: e.relatedTarget }));});
// Arrow keys walk the swatch grid; Enter/Space (native button) paints.
$('#panel').addEventListener('keydown', (e) => {
  const grid = e.target.closest('#lib-grid,.themes,.mini-row');if (!grid || !e.target.matches('.dot,.theme,.mini') || !e.key.startsWith('Arrow')) return;e.preventDefault();
  const dots = [...grid.querySelectorAll('.dot,.theme,.mini')],i = dots.indexOf(e.target),cols = dots.filter((d) => d.offsetTop === dots[0].offsetTop).length;
  const j = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - cols, ArrowDown: i + cols }[e.key];dots[Math.max(0, Math.min(dots.length - 1, j))]?.focus();
});
// SV square: drag previews live on the model; releasing paints once (one undo step).
let freeDrag = false;
$('#panel').addEventListener('pointerdown', (e) => {const sv = e.target.closest('#sv');if (!sv) return;freeDrag = true;sv.setPointerCapture(e.pointerId);moveSV(e);});
$('#panel').addEventListener('pointermove', (e) => {if (freeDrag && e.target.closest('#sv')) moveSV(e);});
$('#panel').addEventListener('pointerup', (e) => {if (!freeDrag) return;freeDrag = false;if (tool === 'brush' || freeAuto) commitFree();else {previewing = false;view.setColors(design.colors);}});
$('#panel').addEventListener('keydown', (e) => {if (e.target.id !== 'sv' || !e.key.startsWith('Arrow')) return;e.preventDefault();const d = e.shiftKey ? .1 : .02;freeHsv = { ...freeHsv, s: Math.min(1, Math.max(0, freeHsv.s + (e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0))), v: Math.min(1, Math.max(0, freeHsv.v + (e.key === 'ArrowUp' ? d : e.key === 'ArrowDown' ? -d : 0))) };setFree(hsvToHex(freeHsv.h, freeHsv.s, freeHsv.v), { hsv: freeHsv });});
$('#panel').addEventListener('keyup', (e) => {if (e.target.id === 'sv' && e.key.startsWith('Arrow') && freeAuto) commitFree();});
function moveSV(e) {const b = $('#sv').getBoundingClientRect();freeHsv = { ...freeHsv, s: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), v: 1 - Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) };setFree(hsvToHex(freeHsv.h, freeHsv.s, freeHsv.v), { hsv: freeHsv });}

// ---------- events: rail ----------
$('#rail').addEventListener('click', (e) => {const lk = e.target.closest('[data-lock]');if (lk) {const z = ZONES.find((z) => z.id === lk.dataset.lock),all = z.ids.every((id) => locks.has(id));z.ids.forEach((id) => all ? locks.delete(id) : locks.add(id));persist();toast(() => (all ? _message("text.0269") : _message("text.0270")) + z.name + (all ? '' : _message("text.0271")));return renderAll();}const zb = e.target.closest('[data-zone]');if (zb) {if (step !== 2) step = 2;select(zb.dataset.zone);}});
$('#rail').addEventListener('dblclick', (e) => {if (e.target.closest('[data-zone]')) setFocused(!focused);});
$('#rail').addEventListener('pointerover', (e) => {const zb = e.target.closest('[data-zone]');if (zb && zb.dataset.zone !== sel.zone) view.setHighlight(targetIds(), ZONES.find((z) => z.id === zb.dataset.zone).ids);});
$('#rail').addEventListener('pointerleave', () => renderStage());

// ---------- events: stage ----------
const stage = $('#stage');let down = null;
const hover=hoverQueue(({clientX,clientY})=>view.pickAsync(clientX,clientY),showHover);
stage.addEventListener('pointerdown', (e) => {hover.cancel();if (e.target === view.canvas) down = { x: e.clientX, y: e.clientY };});
function stageClick(e) {
  const id = view.pick(e.clientX, e.clientY);if (!id) {if (step === 2 && tool === 'select' && !replaceFrom) {sel.part = null;sel.scope = 'all';renderAll();}return;}
  const z = zoneOf(id),p = partById.get(id);
  if (step === 2 && tool === 'brush') {const ids = brushTargets(id);if (!ids.length) return toast(() => locks.has(id) ? _message("text.0272", { v0: p.name }) : _message("text.0273", { v0: p.name, v1: p.material, v2: keyName(brush) }));brushHover = null;return paint(ids, brush, _message("text.0274"));}
  if (step === 2 && tool === 'pick') {
    const k = keyOf(id),back = pickToFree ? toolBefore : 'brush';if (isHex(k) && hexFinish(k)) freeFinish = hexFinish(k);setFree(design.colors[id], { preview: false });brush = k;if (!isHex(k)) brushKind = kindOf(products.get(k));
    pickToFree = false;tool = back;renderAll();return toast(_message("text.0275", { v0: keyName(k), v1: back === 'brush' ? _message("text.0276") : _message("text.0277") }));
  }
  const entering = step !== 2;
  if (entering) {step = 2;stepsDone.add(1);if (view.turntable) {view.setTurntable(false);}}
  // First click picks the whole zone; clicking again inside the same zone narrows to that part.
  if (!entering && sel.zone === z.id && sel.scope !== 'one' && !z.internal && view.layout !== 'arrange') select(z.id, { part: id });else select(z.id, { part: id, scope: z.internal || view.layout === 'arrange' ? 'one' : 'all' });
}
stage.addEventListener('pointerup', (e) => {
  // A long press compares with the original (studio/phone.mjs); lifting that finger is not a tap.
  if (stage.dataset.longpress) {delete stage.dataset.longpress;down = null;return;}
  // A fingertip wobbles more than a mouse, so touch gets a looser tap radius before it counts as an orbit drag.
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > (e.pointerType === 'touch' ? 12 : 5)) {down = null;return;}down = null;
  stageClick(e);
});
// Double-click focuses whatever the two clicks selected; double-clicking again returns to the whole duck.
stage.addEventListener('dblclick', (e) => {if (e.target === view.canvas && step === 2 && (focused || view.pick(e.clientX, e.clientY))) setFocused(!focused);});
stage.addEventListener('pointermove', (e) => {
  if (e.buttons || e.target !== view.canvas) {hover.cancel();$('#part-tag').hidden = true;return;}
  hover.submit({clientX:e.clientX,clientY:e.clientY});
});
function showHover(id,e) {const tag=$('#part-tag');
    if (!id) {tag.hidden = true;if (step === 2) {clearBrushHover();renderStage();}return;}
    const p = partById.get(id),z = zoneOf(id),b = stage.getBoundingClientRect(),prodName = keyName(keyOf(id));
    tag.hidden = false;tag.style.transform = `translate(${e.clientX - b.left + 14}px,${e.clientY - b.top + 14}px)`;
    if (step === 2 && tool === 'brush') {
      const ids = brushTargets(id),key = ids.join(',');
      tag.innerHTML = ids.length ? `<i style="--c:${keyHex(brush)}"></i><span><b>${_t("text.0279", { v1: esc(keyName(brush)) })}</b><small>${esc(p.name)}${ids.length > 1 ? _t("text.0278") : ''}</small></span>` : `<i style="--c:${design.colors[id]}"></i><span><b>${esc(p.name)}</b><small>${locks.has(id) ? _t("text.0280") : _t("text.0281")}</small></span>`;
      if (key !== brushHover) {brushHover = key || null;view.setColors({ ...design.colors, ...Object.fromEntries(ids.map((x) => [x, keyHex(brush)])) });view.setHighlight([], ids.length ? ids : [id]);}
      return;
    }
    if (step === 2 && tool === 'pick') {tag.innerHTML = `<i style="--c:${design.colors[id]}"></i><span><b>${_t("text.0282", { v1: esc(prodName) })}</b><small>${esc(p.name)}</small></span>`;view.setHighlight([], [id]);return;}
    tag.innerHTML = `<i style="--c:${design.colors[id]}"></i><span><b>${esc(step === 2 && sel.zone === z.id || view.layout === 'arrange' ? p.name : z.name)}</b><small>${esc(prodName)} ${locks.has(id) ? '· 🔒' : ''}</small></span>`;
    if (step === 2 && !replaceFrom) view.setHighlight(targetIds(), tool === 'select' && sel.zone !== z.id && view.layout !== 'arrange' ? z.ids : [id]);
}
stage.addEventListener('pointerleave', () => {hover.cancel();$('#part-tag').hidden = true;if (step === 2) {clearBrushHover();renderStage();}});
$('#tools').onclick = (e) => {const b = e.target.closest('[data-tool]');if (b) setTool(b.dataset.tool);};
$('#focus-toggle').onclick = () => setFocused(!focused);
// ---------- simple pose control ----------
// A few friendly controls map onto the rig's joints; 下蹲 and 抬脚 drive hip + knee together.
// Left/right follow the duck's own sides, like the rest of the studio.
let POSE_SLIDERS = [
[_t("text.0283"), 'jaw', _t("text.0284"), 0, 28, '°'], [_t("text.0283"), 'headPitch', _t("text.0285"), -30, 50, '°'], [_t("text.0283"), 'headYaw', _t("text.0286"), -45, 45, '°'], [_t("text.0283"), 'headRoll', _t("text.0287"), -15, 15, '°'], [_t("text.0283"), 'neck', _t("text.0288"), -20, 80, '°'],
[_t("text.0289"), 'crouch', _t("text.0290"), 0, 100, '%'], [_t("text.0289"), 'trunk', _t("text.0291"), -15, 25, '°'], [_t("text.0292"), 'legL', _t("text.0293"), 0, 100, '%'], [_t("text.0292"), 'legR', _t("text.0294"), 0, 100, '%']];

const POSE_ZERO = Object.fromEntries(POSE_SLIDERS.map((r) => [r[1], 0]));
// Static poses that sit next to the animated actions on 动起来: [label, icon, preset index].
let MOVE_POSES = [[_t("text.0284"), '😮', 1], [_t("text.0295"), '👇', 2], [_t("text.0293"), '🦵', 4], [_t("text.0287"), '🤔', 5]];
let POSE_PRESETS = [[_t("text.0296"), {}], [_t("text.0297"), { jaw: 24, headPitch: -20 }], [_t("text.0295"), { neck: 45, headPitch: 35 }], [_t("text.0298"), { crouch: 100, trunk: -15, neck: -8 }], [_t("text.0293"), { legL: 70, headRoll: 6 }], [_t("text.0299"), { headRoll: 12, headYaw: 20, jaw: 8 }]];
let poseUI = { ...POSE_ZERO },poseOpen = false,poseTween = 0;
const poseFrom = (u) => ({ jaw: u.jaw, headPitch: u.headPitch, headYaw: u.headYaw, headRoll: u.headRoll, neck: u.neck, trunk: u.trunk, hip: u.crouch * .6, knee: -u.crouch * 1.15, hipL: u.legL * .55, kneeL: -u.legL * 1.1, hipR: u.legR * .55, kneeR: -u.legR * 1.1 });
const clampN = (v, lo, hi) => Math.round(Math.min(hi, Math.max(lo, v)));
const poseOf = (P) => ({ jaw: clampN(P.jaw, 0, 28), headPitch: clampN(P.headPitch, -30, 50), headYaw: clampN(P.headYaw, -45, 45), headRoll: clampN(P.headRoll, -15, 15), neck: clampN(P.neck, -20, 80), trunk: clampN(P.trunk, -15, 25), crouch: clampN(P.hip / .6, 0, 100), legL: clampN(P.hipL / .55, 0, 100), legR: clampN(P.hipR / .55, 0, 100) });
function applyPose() {view.setPose(poseFrom(poseUI));}
function followAction() {if (!actions.current) return;poseUI = poseOf(view.pose);syncPose();requestAnimationFrame(followAction);}
function buildPose(el = $('#pose-panel'), inline = false) {
  let group = '';
  el.innerHTML = `<div class="pose-head"><b>${_t("text.0303")}</b><button data-pose-reset title="${_attr(_t("text.0304"))}">${_t("text.0237")}</button>${inline ? '' : `<button id="pose-close" aria-label="${_attr(_t("text.0300"))}">×</button>`}</div>
    <div class="pose-presets">${POSE_PRESETS.map(([n], i) => `<button data-pose-preset="${i}">${n}</button>`).join('')}</div>
    ${POSE_SLIDERS.map(([g, id, label, min, max]) => {const head = g !== group ? `${group ? '</div>' : ''}<div class="pose-group"><span>${g}</span>` : '';group = g;return head + `<label class="pose-row" title="${_attr(_t("text.0301"))}"><span>${label}</span><input type="range" data-pose="${id}" min="${min}" max="${max}" step="1"><em></em></label>`;}).join('')}</div>
    ${inline ? '' : `<p class="pose-note">${_t("text.0302")}</p>`}`;
  syncPose();
}
function syncPose() {$$('[data-pose]').forEach((i) => {const r = POSE_SLIDERS.find((x) => x[1] === i.dataset.pose);i.value = poseUI[r[1]];i.nextElementSibling.textContent = poseUI[r[1]] + r[5];i.style.setProperty('--p', (poseUI[r[1]] - r[3]) / (r[4] - r[3]) * 100 + '%');});}
// Presets and reset glide over ~300 ms instead of jumping.
function poseTo(target) {
  const from = { ...poseUI },to = { ...POSE_ZERO, ...target },t0 = performance.now();cancelAnimationFrame(poseTween);
  (function step(now) {const k = Math.min(1, (now - t0) / 320),e = 1 - (1 - k) ** 3;for (const id in to) poseUI[id] = Math.round(from[id] + (to[id] - from[id]) * e);applyPose();syncPose();if (k < 1) poseTween = requestAnimationFrame(step);})(t0);
}
function readyToPose() {if (actions.current) actions.stop();if (view.layout !== 'assembly') setLayout('assembly');}
function togglePose(on = !poseOpen) {poseOpen = on;$('#pose-panel').hidden = !on;$('#pose-toggle').setAttribute('aria-pressed', on);if (on) {if (view.layout !== 'assembly') setLayout('assembly');if (view.turntable) {view.setTurntable(false);renderStage();}buildPose();}}
$('#pose-toggle').onclick = () => togglePose();
for (const root of [$('#pose-panel'), $('#panel')]) {
  root.addEventListener('input', (e) => {const id = e.target.dataset.pose;if (!id) return;readyToPose();cancelAnimationFrame(poseTween);poseUI[id] = +e.target.value;applyPose();syncPose();});
  root.addEventListener('dblclick', (e) => {const row = e.target.closest('.pose-row');if (!row) return;const id = row.querySelector('[data-pose]').dataset.pose;readyToPose();poseTo({ ...poseUI, [id]: 0 });});
  root.addEventListener('click', (e) => {
    if (e.target.closest('#pose-close')) return togglePose(false);
    if (e.target.closest('[data-pose-reset]')) {readyToPose();return poseTo({});}
    const p = e.target.closest('[data-pose-preset]');if (p) {readyToPose();$$('[data-pose-preset]').forEach((b) => b.classList.toggle('on', b.dataset.posePreset === p.dataset.posePreset));poseTo(POSE_PRESETS[+p.dataset.posePreset][1]);}
  });
}
$('#side-toggle').onclick = () => toggleSide();
$('#views').onclick = (e) => {const b = e.target.closest('[data-view]');if (!b) return;focused = false;focusKey = '';$$('#views button').forEach((x) => x.classList.toggle('on', x === b));view.view(b.dataset.view);};
$('#layouts').onclick = (e) => {const b = e.target.closest('[data-layout]');if (b) setLayout(b.dataset.layout);};
$('#spin').onclick = () => {if (view.layout === 'arrange') return toast(_message("text.0305"));const on = !view.turntable;view.setTurntable(on);if (!on) view.resetSpin();renderStage();};
// ---------- background: four distinct presets, 自动, and a picker for any colour ----------
const BG_SWATCHES = ['#F4F1EA', '#F3E3CF', '#F9DCD3', '#F6E9A8', '#DCEBD6', '#D2E8E2', '#D6E4F5', '#E3DDF4', '#B9C3D6', '#6F7789', '#2B3A55', '#1B1D24'];
function hexToHsl(hex) {const n = parseInt(hex.slice(1), 16),r = (n >> 16 & 255) / 255,g = (n >> 8 & 255) / 255,b = (n & 255) / 255,mx = Math.max(r, g, b),mn = Math.min(r, g, b),l = (mx + mn) / 2,d = mx - mn;let h = 0,s = 0;if (d) {s = d / (1 - Math.abs(2 * l - 1));h = (mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;if (h < 0) h += 360;}return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };}
function hslToHex(h, s, l) {s /= 100;l /= 100;const k = (n) => (n + h / 30) % 12,a = s * Math.min(l, 1 - l),f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');return ('#' + f(0) + f(8) + f(4)).toUpperCase();}
function paintBg() {
  const st = $('#stage');st.style.setProperty('--bgc', bgCustom);$('#bg-custom').style.setProperty('--c', bgCustom);
  const dark = st.dataset.bg === 'custom' && lum(bgCustom) < .3 || st.dataset.bg === 'night' || st.dataset.bg === 'mid';st.classList.toggle('dark-bg', dark);
}
function syncBgPop() {const c = hexToHsl(bgCustom);$('#bg-h').value = c.h;$('#bg-s').value = Math.min(80, c.s);$('#bg-l').value = c.l;$('#bg-chip').style.background = bgCustom;if (document.activeElement !== $('#bg-hex')) $('#bg-hex').value = bgCustom;$('#bg-pop').style.setProperty('--sl', `hsl(${c.h} 60% 55%)`);$$('#bg-swatches [data-bgc]').forEach((b) => b.classList.toggle('on', b.dataset.bgc === bgCustom));}
function setBg(hex) {bgCustom = hex.toUpperCase();bgPref = 'custom';try {localStorage.setItem(KEY + '-bg', 'custom');localStorage.setItem(KEY + '-bgc', bgCustom);} catch {}renderStage();syncBgPop();}
$('#bg-swatches').innerHTML = BG_SWATCHES.map((c) => `<button data-bgc="${c}" style="--c:${c}" title="${_attr(c)}"></button>`).join('');
$('#bgs').onclick = (e) => {
  if (e.target.closest('#bg-pop')) {const sw = e.target.closest('[data-bgc]');if (sw) setBg(sw.dataset.bgc);
    // Random keeps to backgrounds that flatter a duck: soft pastels most of the time, sometimes a deep tone.
    if (e.target.closest('#bg-random')) {const h = Math.floor(Math.random() * 360),dark = Math.random() < .3;setBg(hslToHex(h, dark ? 25 + Math.random() * 20 : 30 + Math.random() * 30, dark ? 12 + Math.random() * 10 : 84 + Math.random() * 9));}
    return;}
  const b = e.target.closest('[data-bg]');if (!b) return;
  if (b.dataset.bg === 'custom') {const pop = $('#bg-pop'),wasOn = bgPref === 'custom';bgPref = 'custom';try {localStorage.setItem(KEY + '-bg', 'custom');} catch {}renderStage();pop.hidden = wasOn ? !pop.hidden : false;if (!pop.hidden) syncBgPop();return;}
  $('#bg-pop').hidden = true;bgPref = b.dataset.bg;try {localStorage.setItem(KEY + '-bg', bgPref);} catch {}renderStage();
};
$('#bgs').addEventListener('input', (e) => {
  if (['bg-h', 'bg-s', 'bg-l'].includes(e.target.id)) return setBg(hslToHex(+$('#bg-h').value, +$('#bg-s').value, +$('#bg-l').value));
  if (e.target.id === 'bg-hex') {const v = e.target.value.trim();if (/^#?[\da-f]{6}$/i.test(v)) setBg(v.startsWith('#') ? v : '#' + v);}
});
document.addEventListener('click', (e) => {if (!e.target.closest('#bgs')) $('#bg-pop').hidden = true;});

// ---------- export review: /api/plan checks every part, /api/export writes the recoloured 3MF ----------
let plan = null;
async function openExport() {
  const dlg = $('#export-dialog'),body = $('#export-body');body.innerHTML = `<p class="muted">${_t("text.0306")}</p>`;if (!dlg.open) dlg.showModal();
  // 3MF export only knows the Bambu catalogue: free colours and illustrative brands are matched first.
  const pending = parts.filter((p) => !design.assignments[p.id] || products.get(design.assignments[p.id])?.demo);
  if (pending.length) {
    const keys = [...new Set(pending.map((p) => keyOf(p.id)))];
    body.innerHTML = `<p class="ex-status">${_t("text.0308", { v0: pending.length })}</p>
      <ul class="bom">${keys.map((k) => {const n = nearestBambu(keyHex(k), kindOf(products.get(k) || { material: partKind(partById.get(pending.find((p) => keyOf(p.id) === k).id)) === 'TPU' ? 'TPU' : 'PLA' }));return `<li><i style="--c:${keyHex(k)}"></i><span>${esc(keyName(k))}<small>${_t("text.0307", { v2: countOf(k), v3: esc(n.name), v4: n.colorCode })}</small></span><b style="--c:${n.hex}" class="to-chip"></b></li>`;}).join('')}</ul>
      <div class="sheet-foot"><button class="ghost-btn" data-close-export>${_t("text.0309")}</button><button class="primary" id="match-bambu">${_t("text.0310")}</button></div>`;
    body.querySelector('[data-close-export]').onclick = () => dlg.close();
    $('#match-bambu').onclick = () => {const next = clone(design);for (const p of pending) {const n = nearestBambu(design.colors[p.id], partKind(p));next.colors[p.id] = n.hex.toUpperCase();next.assignments[p.id] = n.id;}commit(next, _message("text.0311", { v0: pending.length }));openExport();};
    return;
  }
  try {
    plan = await api('POST', '/plan', { source_sha256: model.source_sha256, name, assignments: design.assignments });const usedSlots = plan.slots.filter((s) => s.used);
    body.innerHTML = `<div class="ex-stats"><span><b>6</b>${_t("text.0245")}</span><span><b>35</b>${_t("text.0315")}</span><span><b>${usedSlots.length}</b>${_t("text.0316")}</span><span><b>${plan.slots.length}</b>${_t("text.0317")}</span></div>
    <div class="ex-products">${usedSlots.map((s) => {const p = s.product,n = plan.parts.filter((x) => x.slot === s.slot).length;return `<div class="ex-p"><i style="--c:${p.hex}"></i><span><b>${p.series} · ${esc(_label(p.name))}</b><small>${_t("text.0313", { v3: p.colorCode, v4: n, v5: s.slot })}</small></span><a href="${p.productUrl}" target="_blank" rel="noreferrer">${_t("text.0314")}</a></div>`;}).join('')}</div>
    <details class="ex-parts"><summary>${_t("text.0318")}</summary><table><thead><tr><th>${_t("text.0319")}</th><th>${_t("text.0315")}</th><th>${_t("text.0243")}</th><th>${_t("text.0320")}</th></tr></thead><tbody>${plan.parts.map((p) => `<tr><td>${p.plate}</td><td>${p.id} ${esc(_label(p.name))}</td><td>${esc(_label(p.product.name))} ${p.product.colorCode}</td><td>${p.slot}</td></tr>`).join('')}</tbody></table></details>
    <ul class="ex-notes">${plan.warnings.map((w) => `<li>${esc(_label(w))}</li>`).join('')}</ul>
    <div class="sheet-foot"><button class="ghost-btn" id="dl-bom">${_t("text.0321")}</button><button class="primary" id="dl-3mf">${_t("text.0322")}</button></div><p class="ex-status" id="ex-status"></p>`;
    $('#dl-bom').onclick = downloadBOM;$('#dl-3mf').onclick = download3MF;
  } catch (error) {body.innerHTML = `<p class="warn">${esc(error.message)}</p>`;}
}
async function download3MF() {
  const btn = $('#dl-3mf'),status = $('#ex-status');btn.disabled = true;status.textContent = _t("text.0323");
  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const thumbnails = await renderExportThumbnails(duck, design.colors, {binaryUpload:true,view});
    const body=new FormData();body.append('plan',JSON.stringify({source_sha256:model.source_sha256,name,assignments:design.assignments}));
    for(const [key,blob] of Object.entries(thumbnails))body.append(key,blob,key+'.png');
    const r = await fetch('/api/export', { method: 'POST', body });
    if (!r.ok) throw Error(errorText(await r.json().catch(() => ({}))));
    const a = document.createElement('a');a.href = URL.createObjectURL(await r.blob());a.download = 'XGO-Duck-' + name + '-materials.3mf';a.click();setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = _t("text.0325");
  } catch (error) {status.textContent = error.message;} finally
  {btn.disabled = false;}
}
function nearestBambu(hex, kind) {return catalog.products.filter((p) => kindOf(p) === kind).map((p) => [p, deltaE(hex, p.hex)]).sort((x, y) => x[1] - y[1])[0][0];}
function downloadBOM() {
  const rows = [[_t("text.0326"), _t("text.0319"), _t("text.0327"), _t("text.0328"), _t("text.0329"), _t("text.0330"), _t("text.0331"), _t("text.0332"), _t("text.0333"), _t("text.0334"), _t("text.0335"), _t("text.0336"), _t("text.0337"), _t("text.0338")], ...plan.parts.map((p) => [p.id, p.plate, _label(p.name), p.originalName, p.product.series, p.product.brand, _label(p.product.name), p.product.colorCode, p.product.diameter, p.product.hex, p.slot, p.product.preset, p.product.productUrl, p.uuid])];
  const csv = '﻿' + rows.map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\r\n'),a = document.createElement('a');a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));a.download = 'XGO-Duck-' + name + '-BOM.csv';a.click();$('#ex-status').textContent = _t("text.0339");
}
$$('dialog [data-close]').forEach((b) => b.onclick = () => b.closest('dialog').close());

// ---------- publish + evolution ceremony ----------
const byline = () => account.user ? `${_t("text.0340", { v0: avatarHTML(account.user) })}<b>${esc(account.user.name)}</b>` : _t("text.0341");
async function openPublish() {
  if (personal) return;
  if (parts.some((p) => !design.assignments[p.id] || products.get(design.assignments[p.id])?.demo)) {showTab = 'print';renderPanel();return toast(_message("text.0342"));}
  try {await requireLogin(_message("text.0343"));} catch {return;}
  $('#publish-preview').src = view.snapshot(640, 520, { angle: 'hero' }).toDataURL('image/png');$('#publish-title').value = name;$('#publish-by').innerHTML = byline();
  $('#publish-source').textContent = provenance ? _t("text.0344", { v0: provenance.title, v1: provenance.author }) : _t("text.0345");$('#publish-dialog').showModal();
}
$('#publish-form').onsubmit = async (e) => {
  e.preventDefault();const title = $('#publish-title').value.trim() || name,btn = e.submitter || $('#publish-form [type=submit]');if (btn) btn.disabled = true;
  // Publishing also keeps a private copy in 我的方案; the work itself is a new public version.
  let work;
  try {name = title;saveScheme(false);work = await api('POST', '/works', { title, description: $('#publish-desc').value.trim(), design: { colors: clone(design.colors), assignments: clone(design.assignments), finishes: clone(design.finishes || {}) }, provenance, parentId: provenance?.workId || null, schemeId: activeId });}
  catch (err) {toast(_message("text.0346", { v0: ()=>err.message }));return;} finally
  {if (btn) btn.disabled = false;}
  $('#publish-dialog').close();
  const goGallery = () => {location.href = './gallery/#d/' + work.id;};
  if (!$('#publish-evolve').checked) {toast(_message("text.0347", { v0: title }));setTimeout(goGallery, 700);return;}
  playEvolution({ name: title, author: account.user.name, before: ORIGINAL, after: design, sound: $('#publish-sound').checked, onDone: goGallery, onPoster: () => poster.open({ workId: work.id, design: { ...work.design, name: work.title, author: work.author.name }, before: ORIGINAL }) }).catch(goGallery);
};

// ---------- keyboard ----------
addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea,select') || document.querySelector('dialog[open]') || $('#evo')?.hidden === false) return;
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === 'z') {e.preventDefault();(e.shiftKey ? $('#redo') : $('#undo')).click();return;}
  if ((e.metaKey || e.ctrlKey) && k === 's') {e.preventDefault();saveScheme(false);return;}
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'Space' && !e.repeat) {e.preventDefault();holdOn();return;}
  if (k === 'r' && step === 1) {$('#dice')?.click();return;}
  if (k === '1' || k === '2' || k === '3') {setLayout(['assembly', 'explode', 'arrange'][+k - 1]);return;}
  if (k === 'f') return setFocused(!focused);
  if (step !== 2) return;
  if (k === 'p') return toggleSide();
  if (k === 'escape' || k === 'v') setTool('select');else if (k === 'b') setTool(tool === 'brush' ? 'select' : 'brush');else if (k === 'i') setTool('pick');
});
addEventListener('keyup', (e) => {if (e.code === 'Space') holdOff();});

// ---------- misc ----------
let toastTimer,lastToast;
function renderToast(){
 const t=$('#toast');if(!lastToast||!t.classList.contains('show'))return;
 const {msg,withUndo}=lastToast;t.innerHTML=esc(typeof msg==='function'?msg():msg)+(withUndo?` <button id="toast-undo">${_t('text.0348')}</button>`:'');
 $('#toast-undo')?.addEventListener('click',()=>{typeof withUndo==='function'?withUndo():$('#undo').click();t.classList.remove('show');});
}
function toast(msg,withUndo){lastToast={msg,withUndo};$('#toast').classList.add('show');renderToast();clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
const COACH = KEY + '-coach';let seen = !!read(COACH);
// Unsaved work becomes a scheme before something replaces the draft.
async function backupDraft() {
  if (dirty() && schemes.length < 30) {const s = { id: newId(), name: _t("text.0349", { v0: name }), design: clone(design), provenance, voiceSalt, created: Date.now(), updated: Date.now() };
    if (personal) {const result = await personalWrite('PUT', s.id, schemeBody(s));if (!result) throw Error(_t('personal.loadFailed'));Object.assign(s,result);}
    schemes.unshift(s);if (!personal) pushScheme(s);setTimeout(() => toast(_message("text.0350")), 2200);}
}
// "做同款" from the gallery arrives as #look=<配色码>&src=<title>|<author>|<workId>.
// Accepts a bare 配色码, a '#look=' fragment or a whole share link. Unsaved work is backed up first.
async function importLook(text, src = '') {
  const raw = String(text).trim(),code = (raw.match(/#look=([^&\s]+)/) || [, raw])[1];
  const d = decodeLook(parts, products, code),[title, author, workId] = decodeURIComponent(src || '').split('|');
  await backupDraft();
  design = { colors: d.colors, assignments: d.assignments };voiceSalt = 0;slots = slotsFromDesign(products, d.assignments, slots);name = _t("text.0351", { v0: d.name || title || _t("text.0352") });provenance = title ? { title, author: author || _t("text.0353"), ...(workId ? { workId } : {}) } : null;activeId = null;
  view.setColors(design.colors);stepsDone.add(1);persist();return d.name || title || _t("text.0354");
}
if (personal) {
  try {
    schemes = await api('GET', '/schemes');owner = null;
    if (!saved.draft && schemes.length) {
      const s = schemes[0];design = clone(s.design);name = s.name;provenance = s.provenance;voiceSalt = s.voiceSalt;activeId = s.id;
      slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);
    }
    if (activeId && !schemes.some(s => s.id === activeId)) activeId = null;
    persist();
  } catch {schemes = [];activeId = null;toast(_message('personal.loadFailed'));}
} else {
  const accountUI = mountAccount($('#profile-slot'), { toast });
  if (await initAccount()) {accountUI.refresh();await syncSchemes();} else
  if (owner) {schemes = [];owner = null;activeId = null;persist();}
  onAccount(() => syncSchemes());
}
const look = location.hash.match(/^#look=([^&]+)(?:&src=(.*))?$/),openId = location.hash.match(/^#scheme=(.+)$/);
if (look) {try {const n = await importLook(look[1], look[2]);step = 2;seen = true;setTimeout(() => toast(_message("text.0355", { v0: n })), 300);} catch (error) {toast(error.message);}history.replaceState(null, '', location.pathname);}
// 我的方案 in the gallery opens a saved scheme here with #scheme=<id>.
if (openId) {const s = schemes.find((x) => x.id === decodeURIComponent(openId[1]));if (s) {design = clone(s.design);name = s.name;provenance = s.provenance || null;voiceSalt = s.voiceSalt || 0;activeId = s.id;slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);stepsDone.add(1);step = 2;seen = true;persist();setTimeout(() => toast(_message("text.0071", { v0: s.name })), 300);}history.replaceState(null, '', location.pathname);}
// 或者新开一只 on the personal home page arrives as #new: start again from the original colours.
// With no room left to back up unsaved work, the draft stays open instead of being lost.
if (location.hash === '#new') {
  if (dirty() && schemes.length >= 30) setTimeout(() => toast(_message("text.0066")), 300);
  else try {
    await backupDraft();
    design = clone(ORIGINAL);name = _t("text.0047");provenance = null;voiceSalt = 0;activeId = null;
    slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);stepsDone.clear();step = 1;persist();
  } catch (error) {toast(error.message);}
  history.replaceState(null, '', location.pathname);
}
if (!personal && (!seen || location.hash === '#coach')) $('#coach').hidden = false;
const coachDone = () => {$('#coach').hidden = true;try {localStorage.setItem(COACH, '1');} catch {}};
$('#coach-go').onclick = coachDone;
$('#coach-login').hidden = personal || !!account.user;$('#coach-login').onclick = () => {coachDone();requireLogin('').catch(() => {});};
renderAll();
window.studioProto = { view, actions, get state() {return { step, sel, tool, brush, name, activeId, dirty: dirty(), schemes: schemes.length, locks: [...locks], undo: undo.length, layout: view.layout, sideOn, focused, splitOn, compareId, replaceFrom, colors: design.colors, provenance };} };_onLocale(() => {DEMO_BRANDS = [{ id: 'esun', name: 'eSUN', series: 'PLA+', colors: [[_t("text.0001"), '#F3EFE2'], [_t("text.0002"), '#1D1D1F'], [_t("text.0003"), '#8B8F95'], [_t("text.0004"), '#D3262D'], [_t("text.0005"), '#F07A22'], [_t("text.0006"), '#F5D42C'], [_t("text.0007"), '#4CA848'], [_t("text.0008"), '#8ED3B4'], [_t("text.0009"), '#4DA2DA'], [_t("text.0010"), '#1F3E8C'], [_t("text.0011"), '#6A3E9E'], [_t("text.0012"), '#F1A2BC']] }, { id: 'polymaker', name: 'Polymaker', series: 'PolyTerra PLA', colors: [[_t("text.0013"), '#ECE8DF'], [_t("text.0014"), '#2A2A2C'], [_t("text.0015"), '#9C9A93'], [_t("text.0016"), '#B53A2F'], [_t("text.0017"), '#E0813D'], [_t("text.0018"), '#E9C65A'], [_t("text.0019"), '#4F7A4A'], [_t("text.0020"), '#7FA9C9'], [_t("text.0021"), '#2C3E66'], [_t("text.0022"), '#A893C4'], [_t("text.0023"), '#D88A97'], [_t("text.0024"), '#A26A42']] }, { id: 'sunlu', name: 'SUNLU', series: 'PLA', colors: [[_t("text.0025"), '#F7F7F5'], [_t("text.0026"), '#161616'], [_t("text.0027"), '#B7B9BC'], [_t("text.0028"), '#E0242B'], [_t("text.0029"), '#F68A1E'], [_t("text.0030"), '#FBD11B'], [_t("text.0031"), '#79C043'], [_t("text.0032"), '#1E9FD0'], [_t("text.0033"), '#2350B4'], [_t("text.0034"), '#7A3FB0'], [_t("text.0035"), '#F27AA6'], [_t("text.0036"), '#DDE6EA']] }];BRANDS = [{ id: 'bambu', get short() {return _t("text.0038");} }, ...DEMO_BRANDS.map((b) => ({ id: b.id, short: b.name, demo: true }))];CLASSICS = [['original', _t("text.0117"), _t("text.0118"), ORIGINAL], ...[1, 2, 6].map((i) => ['theme-' + i, THEMES[i].name, _t("text.0119", { v0: _label(THEMES[i].recipe) }), quickDesign(parts, products, themeSlots(products, THEMES[i]), THEMES[i].recipe)])];DICE_STYLES = [['经典', _t("text.0120")], ['撞色', _t("text.0121")], ['双拼', _t("text.0122")], ['低调', _t("text.0123")]];POSE_SLIDERS = [[_t("text.0283"), 'jaw', _t("text.0284"), 0, 28, '°'], [_t("text.0283"), 'headPitch', _t("text.0285"), -30, 50, '°'], [_t("text.0283"), 'headYaw', _t("text.0286"), -45, 45, '°'], [_t("text.0283"), 'headRoll', _t("text.0287"), -15, 15, '°'], [_t("text.0283"), 'neck', _t("text.0288"), -20, 80, '°'], [_t("text.0289"), 'crouch', _t("text.0290"), 0, 100, '%'], [_t("text.0289"), 'trunk', _t("text.0291"), -15, 25, '°'], [_t("text.0292"), 'legL', _t("text.0293"), 0, 100, '%'], [_t("text.0292"), 'legR', _t("text.0294"), 0, 100, '%']];MOVE_POSES = [[_t("text.0284"), '😮', 1], [_t("text.0295"), '👇', 2], [_t("text.0293"), '🦵', 4], [_t("text.0287"), '🤔', 5]];POSE_PRESETS = [[_t("text.0296"), {}], [_t("text.0297"), { jaw: 24, headPitch: -20 }], [_t("text.0295"), { neck: 45, headPitch: 35 }], [_t("text.0298"), { crouch: 100, trunk: -15, neck: -8 }], [_t("text.0293"), { legL: 70, headRoll: 6 }], [_t("text.0299"), { headRoll: 12, headYaw: 20, jaw: 8 }]];});

_onLocale(() => {
  const active = document.activeElement,focusId = active?.id;
  const inputs = [...document.querySelectorAll('#panel input,#panel textarea,#panel select')].map((e) => ({ id: e.id, value: e.value, checked: e.checked }));
  voiceKey = '';miniKey = '';renderAll();bindTranslations();renderHeader();renderStage();
  if (poseOpen) buildPose();
  renderToast();
  if ($('#export-dialog').open && !$('#dl-3mf')?.disabled) openExport();
  if ($('#publish-dialog').open) {$('#publish-by').innerHTML = byline();$('#publish-source').textContent = provenance ? _t('text.0344', { v0: provenance.title, v1: provenance.author }) : _t('text.0345');}
  for (const old of inputs) {const e = old.id && document.getElementById(old.id);if (e) {e.value = old.value;e.checked = old.checked;}}
  if (focusId) document.getElementById(focusId)?.focus();
});
