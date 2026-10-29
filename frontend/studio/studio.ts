import type {Design,ModelPart,Product,Scheme,WireInteger,Notification,Finish,Work} from '../shared/types.js';
import type {ExportPlan} from '@letsduck/contracts';
import {designSchema} from '@letsduck/contracts';
import type {Zone} from '../lib/duck-workbench.js';
import {query as $,queryAll as $$,required,defined,eventElement,valueElement,inputElement,errorMessage,isRecord} from '../lib/browser.js';
import {jsonStringify} from '../shared/json.js';
import {provenanceFields,parseDesign} from '../shared/guards.js';
import {readStudioStored} from './storage.js';
type FreeColorKey=`hex:${string}`;
type Patch=Pick<Design,'colors'|'assignments'> & Partial<Pick<Design,'finishes'>>;
interface HistoryEntry {design:Design;label:Notification|undefined}
interface Dice {id:string;name:string;recipe:string;design:Patch;locked:boolean}
interface PoseUI {jaw:number;headPitch:number;headYaw:number;headRoll:number;neck:number;trunk:number;crouch:number;legL:number;legR:number}
type PoseSlider=[string,keyof PoseUI,string,number,number,string];
type ViewPose=ReturnType<typeof poseFrom>;
import { eventWithin } from './menu-boundary.js';
import {compatibleProduct,brandId,productLabel,seriesProducts,materialRows,csvText} from '../lib/filaments.js';
import {hoverQueue} from '../shared/hover-queue.js';
import { message as _message } from "../shared/i18n.js";import { escapeAttribute as _attr } from "../shared/i18n.js";import { bindTranslations, errorText, relativeTime } from '../shared/i18n.js';
import { t as _t, label as _label, onLocale as _onLocale } from "../shared/i18n.js"; // 涂装台: one stage, three steps (style → refine → showcase), plus schemes, A/B compare, group replace, close-up, arrange, colour finder, plates check,
// export review and publish ceremony. Colour rules are imported from the shipping modules.
import { loadDuck, createDuckView, renderExportThumbnails } from '../shared/duck-view.js';
import { createPosterDialog, lookCode, drawPoster } from '../shared/poster.js';
import { ZONES, schemePatch } from '../lib/duck-workbench.js';
import { THEMES, quickDesign, rollSlots, themeSlots, designNotes, decodeLook, slotsFromDesign } from '../lib/quick-style.js';
import { sideParts, paintTargets } from '../lib/color-workflows.js';
import { createEvolution } from '../lib/evolution.js';
import { createLineup } from './lineup.js';
import { bindCompareHold } from './compare-hold.js';
import { createActionPlayer, ACTIONS, VOICES, describeVoice, seedFromText } from '../shared/duck-actions.js';
import { hexToHsv, hsvToHex } from '../lib/focus-rules.js';
import { applyBrand, brandName } from '../shared/brand.js';
import { mountAccount, initAccount, onAccount, requireLogin, account, avatarHTML } from '../shared/profile.js';
import { api } from '../shared/api.js';
import { loadSite } from '../shared/edition.js';
applyBrand();

const esc = (v:unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]??c);
const siteReady=loadSite();
const initialSchemes=siteReady.then(site=>site.edition==='personal'?api('GET','/schemes'):null).then(schemes=>({schemes}),error=>({error}));
const [site,duck]=await Promise.all([siteReady,loadDuck()]);
const edition = site.edition,personal = edition === 'personal';
// Personal edition with the assembly guide installed: step 3 can open it with this duck's colours.
const assembly = personal && !!(site.edition==='personal'&&site.assembly);
document.body.dataset.edition = edition;
function renderEdition() {
  $('#edition-badge').hidden = !personal;
  $<HTMLButtonElement>('#import-code').hidden = !personal;
  const brand = $<HTMLAnchorElement>('[data-brand-slot]');brand.href = personal ? './' : './gallery/';
  brand.title = personal ? brandName() : _t('text.0614');
  if (personal) {
    $('#steps [data-step="3"] [data-i18n]').dataset.i18n = 'personal.show';
    $('#steps [data-step="3"] [data-i18n]').textContent = _t('personal.show');
  }
}
renderEdition();_onLocale(renderEdition);
const { model, catalog, products } = duck,parts = model.parts,partById = new Map(parts.map((p) => [p.id, p]));
const knownPart=(id:string|null|undefined):ModelPart=>required(partById.get(id??''));
const zoneOf = (id:string) => required(ZONES.find((z) => z.ids.includes(id)));
const match = (p:ModelPart, hex:string) => catalog.products.find((x) => x.series === p.material && x.hex.toUpperCase() === hex.toUpperCase())?.id || null;
const ORIGINAL:Design = { finishes:{},colors: Object.fromEntries(parts.map((p) => [p.id, p.color.toUpperCase()])), assignments: Object.fromEntries(parts.map((p) => [p.id, match(p, p.color)])) };
// ---------- filament sources ----------
// Bambu Lab is the official colour-table snapshot. The other brands are placeholder swatches for
// prototyping the flow only: names and hex values are NOT checked against any manufacturer, and none
// of them offers the original TPU 90A, so soft pads stay Bambu or free colour.
const BRANDS=[{id:'bambu',get short(){return _t('text.0038');}},{id:'esun',short:'eSUN'},{id:'polymaker',short:'Polymaker'},{id:'sunlu',short:'SUNLU'}].filter(b=>catalog.products.some(p=>brandId(p)===b.id));
let filamentSeries='PLA Basic';
const FIN_LABEL:Record<Finish,string> = { get basic() {return _t("text.0039");}, get matte() {return _t("text.0040");}, get silk() {return _t("text.0041");}, get translucent() {return _t("text.0042");}, get tpu() {return _t("text.0043");} };
// A colour on a part is a "key": a product id, or 'hex:#RRGGBB[|finish]' for a free colour with no filament yet.
const kindOf = (value:Partial<Pick<Product,'material'|'series'>>|undefined) => {const p=required(value);return p.material === 'TPU' || String(p.series).startsWith('TPU') ? 'TPU' : 'PLA';};
const partKind = (value:ModelPart|undefined) => required(value).material.startsWith('TPU') ? 'TPU' : 'PLA';
const isHex = (k:unknown):k is FreeColorKey => typeof k==='string'&&k.startsWith('hex:');
const hexFinish = (k:string|null|undefined):Finish|null => {const value=isHex(k)&&k.includes('|')?k.split('|')[1]:null;return designSchema.properties.finishes.additionalProperties.enum.find(f=>f===value)??null;};
const keyHex = (k:string|null|undefined) => isHex(k)?k.slice(4,11):products.get(k??'')?.hex||'#000000';
const finishOfProduct = (value:Product|undefined):Finish => {const p=required(value);return (p.alpha??1)<1||p.finish==='translucent'?'translucent':kindOf(p)==='TPU'?'tpu':p.finish==='carbon'?'matte':p.finish==='matte'||p.finish==='silk'?p.finish:'basic';};
const keyFinish = (k:string,partId:string):Finish => isHex(k)?hexFinish(k)||(partKind(knownPart(partId))==='TPU'?'tpu':'basic'):finishOfProduct(products.get((k)??''));
const keyName = (k:string|null|undefined) => isHex(k)?_t('text.0044',{v0:keyHex(k)}):products.get(k??'')?.name||k||'';
const keySub = (k:string|null|undefined) => {if(isHex(k)){const f=hexFinish(k);return _t('text.0045',{v0:f?FIN_LABEL[f]+' · ':''});}const p=required(products.get(k??'')),f=finishOfProduct(p);return [p.brand,p.series,p.colorCode||p.skus?.[0]].filter(Boolean).join(' · ')+(f==='matte'||f==='silk'||f==='translucent'?' · '+FIN_LABEL[f]:'');};
const fits = (partId:string,k:string|null|undefined) => isHex(k)||compatibleProduct(required(knownPart(partId)).material,products.get(k??''));
const ZONE_ORDER = ZONES.flatMap((z) => z.ids);
const clone = <T>(x:T) => structuredClone(x),same = (a:Patch, b:Patch) => jsonStringify(a.assignments) === jsonStringify(b.assignments) && jsonStringify(a.colors) === jsonStringify(b.colors) && jsonStringify(a.finishes || {}) === jsonStringify(b.finishes || {});

// ---------- local state: the draft always lives in this browser; schemes too until you sign in ----------
const KEY = personal ? 'dd-studio-personal' : 'dd-studio',read = (k:string) => {try {return localStorage.getItem(k) ?? (!personal ? localStorage.getItem(k.replace('dd-studio', 'proto-studio-v2')) : null);} catch {return null;}};
let saved:ReturnType<typeof readStudioStored> = {};try {saved = readStudioStored(read(KEY));} catch {}
let defaultName = !saved.draft?.name;
let design:Design = saved.draft?.design || clone(ORIGINAL),name = saved.draft?.name || _t("text.0047"),provenance:unknown = saved.draft?.provenance || null;
for(const part of parts)if(design.assignments[part.id]&&!products.has(design.assignments[part.id]??''))design.assignments[part.id]=null;
let schemes:Scheme[] = Array.isArray(saved.schemes) ? saved.schemes : [],owner:string|null = saved.owner || null,activeId:string|null = saved.draft?.activeId || null,recent = (saved.recent || []).filter(k=>isHex(k)||products.has(k)),locks = new Set(saved.locks || []),voiceSalt:WireInteger = saved.draft?.voiceSalt || 0;
const baseline = () => schemes.find((s) => s.id === activeId)?.design || ORIGINAL;
const dirty = () => {
  const stored = personal && schemes.find(s => s.id === activeId);
  return !same(design, baseline()) || !!(stored && (name !== stored.name || voiceSalt !== stored.voiceSalt
    || jsonStringify(provenance) !== jsonStringify(stored.provenance)));
};
// `updated` changes only when the draft itself does, so the personal home page can say when it was last edited.
let draftUpdated = saved.draft?.updated || 0,draftShape = jsonStringify([design, name, activeId]);
function persist() {
  const shape = jsonStringify([design, name, activeId]);if (shape !== draftShape) {draftShape = shape;draftUpdated = Date.now();}
  try {localStorage.setItem(KEY, jsonStringify({ draft: { design, name, provenance, activeId, voiceSalt, updated: draftUpdated }, ...(!personal ? {schemes, owner} : {}), recent, locks: [...locks] }));} catch {toast(_message("text.0048"));}
}

let step = 1,stepsDone = new Set<number>(),slots = slotsFromDesign(products, design.assignments, themeSlots(products, required(THEMES[0]))),showTab = 'move';
let sel:{zone:string;scope:string;part:string|null;mirror:boolean} = { zone: 'head-shell', scope: 'all', part: null, mirror: true },tool = 'select',brush:string|null = null,search = '',replaceFrom:string|null = null,finder = '#FF8A3D',takeFrom = 'original',source = 'bambu',dockTab = 'filament',freeFinish:Finish = 'basic',freeAuto = true,pickToFree = false,brushMirror = true,brushKind = 'PLA',brushHover:string|null = null,toolBefore = 'select';
let freeHsv = hexToHsv('#FF8A3D'),bgPref = 'auto',bgCustom = '#2B3A55';bgPref = read(KEY + '-bg') || 'auto';bgCustom = read(KEY + '-bgc') || bgCustom;
if (!['auto', 'soft', 'sand', 'sage', 'night', 'custom'].includes(bgPref)) bgPref = 'auto';
let renamingId:string|null = null,compareId = 'original',splitOn = false,sideOn = false,focused = false,focusKey = '',menuOpen = false,pendingOpen:string|null = null;
const undo:HistoryEntry[] = [],redo:HistoryEntry[] = [];

const view = createDuckView(duck);
// Hydrate the draft and entry route before presenting either the lineup or editor.
view.stage.root.visible=false;view.stage.shadow.visible=false;
view.mount($('#stage'));view.setColors(design.colors, true);
const poster = createPosterDialog({ view, parts, products });
const actions = createActionPlayer(view);
// The playing action's button fills like a progress bar for exactly the action's length.
actions.onChange((id:string|null) => {if (id) requestAnimationFrame(followAction);else setTimeout(() => {poseUI = poseOf(view.pose);syncPose();}, 0);const dur = ACTIONS.find((a) => a.id === id)?.duration || 0;$$('[data-act]').forEach((b) => {const on = b.dataset.act === id;b.classList.remove('playing');if (on) {b.style.setProperty('--dur', dur + 's');void b.offsetWidth;b.classList.add('playing');}b.classList.toggle('on', on);});const st = document.querySelector<HTMLButtonElement>('#act-stop');if (st) st.disabled = !id;});
const evolution = createEvolution({ createShowcase: view.createShowcase, applyAppearance: (material, id) => {const t = (products.get((id)??'')?.alpha??1) < 1;material.transparent = t;material.opacity = t ? .68 : 1;material.depthWrite = !t;material.needsUpdate = true;} });

// ---------- design changes ----------
function commit(next:Design, label:Notification|undefined) {undo.push({ design: clone(design), label });if (undo.length > 60) undo.shift();redo.length = 0;design = next;view.setColors(design.colors);persist();renderAll(true);if (label) toast(label, true);}
function remember(id:string) {recent = [id, ...recent.filter((x) => x !== id)].slice(0, 8);}
const keyOf = (id:string) => design.assignments[id] || 'hex:' + required(design.colors[id]).toUpperCase() + (design.finishes?.[id] ? '|' + design.finishes[id] : '');
// Paints a filament (kept to the part's material) or a free colour (any part; filament chosen later).
function paint(ids:string[], key:string, label?:Notification) {
  const ok = ids.filter((id) => !locks.has(id) && fits(id, key)),skipped = ids.length - ok.length;
  if (!ok.length) {toast(() => skipped ? _message("text.0049") : _message("text.0050"));return;}
  const hex = keyHex(key).toUpperCase(),fin = hexFinish(key),next = clone(design);next.finishes = { ...(next.finishes || {}) };for (const id of ok) {next.colors[id] = hex;next.assignments[id] = isHex(key) ? null : key;if (fin) next.finishes[id] = fin;else delete next.finishes[id];}remember(key);
  commit(next, _message("text.0051", { v0: label || _message("text.0052"), v1: ()=>keyName(key), v2: ok.length, v3: skipped ? _message("text.0053", { v0: skipped }) : '' }));
}
function restore(h:HistoryEntry, label:Notification) {design = h.design;view.setColors(design.colors);persist();renderAll(true);toast(label);}
$<HTMLButtonElement>('#undo').onclick = () => {const h = undo.pop();if (!h) return;redo.push({ design: clone(design), label: h.label });restore(h, _message("text.0054", { v0: h.label || _message("text.0055") }));};
$<HTMLButtonElement>('#redo').onclick = () => {const h = redo.pop();if (!h) return;undo.push({ design: clone(design), label: h.label });restore(h, _message("text.0056"));};

// ---------- schemes (named saves, max 30, private). Signed in: kept on the server, this browser keeps a cache. ----------
const schemeBody = (s:Pick<Scheme,'name'|'design'|'provenance'|'voiceSalt'>) => ({ name: s.name, design: s.design, provenance: s.provenance, voiceSalt: s.voiceSalt || 0 });
function personalWrite(method:'PUT',id:string,body:unknown):Promise<Scheme|null>;
function personalWrite(method:'DELETE',id:string,body?:unknown):Promise<{ok:true}|null>;
async function personalWrite(method:'PUT'|'DELETE', id:string, body?:unknown) {
  try {return method==='PUT'?await api('PUT',`/schemes/${encodeURIComponent(id)}`,body):await api('DELETE',`/schemes/${encodeURIComponent(id)}`);}
  catch (error) {toast(_message('personal.saveFailed', {error: () => errorMessage(error)}));return null;}
}
function pushScheme(s:Scheme) {if (account.user) api('PUT', `/schemes/${encodeURIComponent(s.id)}`, schemeBody(s)).then((r) => {s.updated = r.updated;persist();}).catch((err) => toast(_message("text.0057", { v0: ()=>errorMessage(err) })));}
function dropScheme(id:string) {if (account.user) api('DELETE', `/schemes/${encodeURIComponent(id)}`).catch((err) => toast(_message("text.0058", { v0: ()=>errorMessage(err) })));}
// On sign-in the account's schemes replace the local list. The local cache remembers whose it is (owner):
// only schemes made as a guest are uploaded, never a cache left behind by another account.
async function syncSchemes(render=true) {
  if (!account.user) {schemes = [];owner = null;if (activeId) activeId = null;persist();if(render)renderAll();return;}
  try {
    const remote:Scheme[] = await api('GET', '/schemes'),ids = new Set(remote.map((s) => s.id)),local = schemes.filter((s) => !ids.has(s.id) && (!owner || owner === required(account.user).id));let up = 0;
    for (const s of local) {try {remote.push(await api('PUT', `/schemes/${encodeURIComponent(s.id)}`, schemeBody(s)));up++;} catch (err) {if ((isRecord(err)?err.code:undefined) !== 'schemes.not_owner') remote.push(s);}} // keep it to retry later, unless it is another account's
    schemes = remote.sort((a, b) => a.updated<b.updated?1:a.updated>b.updated?-1:0);owner = required(account.user).id;if (activeId && !schemes.some((s) => s.id === activeId)) activeId = null;persist();if(render)renderAll();
    if (up) toast(_message("text.0059", { v0: up }));
  } catch (err) {toast(_message("text.0060", { v0: ()=>errorMessage(err) }));}
}
const savedWhere = () => personal ? _t('personal.savedWhere') : account.user ? '' : _t("text.0061");
const newId = () => 's-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const when = (value:WireInteger) => {const minutes = Math.round((Date.now() - Number(value)) / 60000);return minutes < 1 ? _t('text.0062') : minutes < 60 ? relativeTime(-minutes, 'minute') : minutes < 1440 ? relativeTime(-Math.round(minutes / 60), 'hour') : relativeTime(-Math.round(minutes / 1440), 'day');};
let savingScheme = false;
async function saveScheme(asNew:boolean) {
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
function openScheme(id:string|null) {
  const s = id === 'original' ? { get name() {return _t("text.0069");}, design: ORIGINAL, provenance: null,voiceSalt:0 } : schemes.find((s) => s.id === id);if (!s) return;
  undo.push({ design: clone(design), get label() {return _t("text.0070");} });design = clone(s.design);name = id === 'original' ? _t("text.0047") : s.name;provenance = s.provenance || null;voiceSalt = s.voiceSalt || 0;activeId = id === 'original' ? null : id;
  slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);pendingOpen = null;menuOpen = false;persist();renderAll();toast(_message("text.0071", { v0: ()=>s.name }));
}
function renderMenu() {
  const m = $('#scheme-menu');m.hidden = !menuOpen;$<HTMLButtonElement>('#scheme-btn').setAttribute('aria-expanded', String(menuOpen));if (!menuOpen) return;
  const row = (id:string, label:string, sub:string, strip:string, active:boolean) => `<div class="sm-row ${active ? 'on' : ''}" data-open="${id}"><span class="sm-strip">${strip}</span>${renamingId === id ? `<input class="sm-rename" id="sm-rename" value="${esc(label)}" maxlength="40" aria-label="${_attr(_t("text.0072"))}">` : `<span class="sm-name">${esc(label)}<small>${sub}</small></span>`}${id !== 'original' ? `<button class="sm-act" data-rename="${id}" title="${_attr(_t("text.0073"))}">✎</button><button class="sm-act" data-delete="${id}" title="${_attr(_t("text.0074"))}">🗑</button>` : ''}</div>${pendingOpen === id ? `<div class="sm-confirm">${_t("text.0075")}<button data-confirm="save">${_t("text.0076")}</button><button data-confirm="discard">${_t("text.0077")}</button><button data-confirm="cancel">${_t("text.0078")}</button></div>` : ''}`;
  const strip = (d:Patch) => [...new Set(Object.values(d.colors))].slice(0, 5).map((c) => `<i style="--c:${c}"></i>`).join('');
  m.innerHTML = `<div class="sm-current"><label>${_t("text.0087")}<input id="sm-name" value="${esc(name)}" maxlength="40"></label><div class="sm-btns"><button class="primary-sm" id="sm-save">${activeId ? _t("text.0079") : _t("text.0080")}</button>${activeId ? `<button id="sm-saveas">${_t("text.0081")}</button>` : ''}</div>${provenance ? `<p class="sm-prov">${_t("text.0082", { v0: esc(provenanceFields(provenance).title), v1: esc(provenanceFields(provenance).author) })}</p>` : ''}</div>
  <div class="sm-list"><span class="sm-label">${_t("text.0088", { v4: schemes.length })}</span>${row('original', _t("text.0069"), _t("text.0083"), strip(ORIGINAL), false)}${schemes.map((s) => row(s.id, s.name, when(s.updated) + (s.provenance ? _t("text.0084") : ''), strip(s.design), s.id === activeId)).join('')}</div>
  <div class="sm-paste"><label>${_t(personal ? 'personal.code' : "text.0089")}<span><input id="sm-code" placeholder="${_attr(personal ? 'v1.…' : _t("text.0090"))}" autocomplete="off"><button id="sm-import">${_t("text.0091")}</button></span></label></div>
  <p class="sm-foot">${personal ? _t('personal.storage') : _t("text.0092", { v7: account.user ? _t("text.0085") : _t("text.0086") })}</p>`;
}
$<HTMLButtonElement>('#scheme-btn').onclick = (e) => {e.stopPropagation();menuOpen = !menuOpen;pendingOpen = null;renderMenu();};
$<HTMLButtonElement>('#import-code').onclick = e => {e.stopPropagation();menuOpen = true;pendingOpen = null;renderMenu();$<HTMLInputElement>('#sm-code').focus();};
document.addEventListener('click', (e) => {if (menuOpen && !eventWithin(e, $('#scheme'))) {menuOpen = false;renderMenu();}if (!eventElement(e).closest<HTMLElement>('.compare')) $('#cmp-menu').hidden = true;});
$('#scheme-menu').addEventListener('click', async (e) => {
  const t = eventElement(e);
  if (t.closest<HTMLElement>('#sm-import')) {const v = $<HTMLInputElement>('#sm-code').value;if (!v.trim()) return $<HTMLInputElement>('#sm-code').focus();try {const n = await importLook(v);menuOpen = false;undo.length = 0;step = 2;renderAll();toast(_message("text.0093", { v0: n }));} catch (error) {toast(errorMessage(error));}return;}
  if (t.closest<HTMLElement>('#sm-save')) return saveScheme(false);if (t.closest<HTMLElement>('#sm-saveas')) return saveScheme(true);
  // Rename in place (native prompt/confirm are unavailable in embedded browsers); delete is undoable instead of confirmed.
  if (t.closest<HTMLElement>('#sm-rename')) return;
  const rn = t.closest<HTMLElement>('[data-rename]');if (rn) {renamingId = required(rn.dataset.rename);renderMenu();const i = $<HTMLInputElement>('#sm-rename');i.focus();i.select();return;}
  const del = t.closest<HTMLElement>('[data-delete]');if (del) {const at = schemes.findIndex((s) => s.id === del.dataset.delete),s = required(schemes[at]),wasActive = activeId === s.id;
    if (personal && !await personalWrite('DELETE', s.id)) return;
    schemes = schemes.filter((x) => x !== s);if (wasActive) activeId = null;if (compareId === s.id) compareId = 'original';persist();if (!personal) dropScheme(s.id);renderAll();
    return toast(_message("text.0094", { v0: s.name }), async () => {if (personal && !await personalWrite('PUT', s.id, schemeBody(s))) return;schemes.splice(at, 0, s);if (wasActive) activeId = s.id;persist();if (!personal) pushScheme(s);renderAll();toast(_message("text.0095", { v0: ()=>s.name }));});}
  const cf = t.closest<HTMLElement>('[data-confirm]');if (cf) {const id = pendingOpen;if (cf.dataset.confirm === 'cancel') {pendingOpen = null;return renderMenu();}if (cf.dataset.confirm === 'save' && !await saveScheme(false)) return;return openScheme(id);}
  const op = t.closest<HTMLElement>('[data-open]');if (op) {const id = required(op.dataset.open);if (id === activeId || id === 'original' && !activeId && !dirty()) return;if (dirty()) {pendingOpen = id;return renderMenu();}return openScheme(id);}
});
$('#scheme-menu').addEventListener('keydown', (e) => {
  if (eventElement(e).id === 'sm-code' && e.key === 'Enter') {e.preventDefault();$<HTMLButtonElement>('#sm-import').click();}
  if (eventElement(e).id === 'sm-rename') {if (e.key === 'Enter') {e.preventDefault();finishRename(true);}if (e.key === 'Escape') {e.preventDefault();e.stopPropagation();finishRename(false);}}
});
$('#scheme-menu').addEventListener('focusout', (e) => {if (eventElement(e).id === 'sm-rename') finishRename(true);});
async function finishRename(save:boolean) {const s = schemes.find((x) => x.id === renamingId),v = document.querySelector<HTMLInputElement>('#sm-rename')?.value.trim();renamingId = null;if (save && s && v && v !== s.name) {
  if (personal) {const result = await personalWrite('PUT', s.id, {...schemeBody(s), name:v.slice(0,40)});if (!result) return renderMenu();Object.assign(s,result);}else s.name = v.slice(0,40);
  if (s.id === activeId) name = s.name;persist();if (!personal) pushScheme(s);renderAll();toast(_message("text.0096", { v0: ()=>s.name }));} else renderMenu();}
$('#scheme-menu').addEventListener('input', (e) => {if (eventElement(e).id === 'sm-name') {defaultName = false;name = valueElement(e).value.trim() || _t("text.0047");$('#scheme-name').textContent = name;persist();}});

// ---------- compare (hold or side by side) ----------
const compareTargets = ():[string,string][] => [['original', _t("text.0069")], ...schemes.filter((s) => s.id !== activeId).map((s):[string,string] => [s.id, s.name]), ...(activeId && dirty() ? [['saved', _t("text.0097")]] as [string,string][] : [])];
const compareColors = () => compareId === 'saved' ? baseline().colors : compareId === 'original' ? ORIGINAL.colors : schemes.find((s) => s.id === compareId)?.design.colors || ORIGINAL.colors;
const compareName = () => compareTargets().find(([k]) => k === compareId)?.[1] || _t("text.0069");
function renderCompare() {
  if (!compareTargets().some(([k]) => k === compareId)) compareId = 'original';
  $<HTMLButtonElement>('#hold').textContent = _t("text.0600");
  $('#cmp-menu').innerHTML = compareTargets().map(([k, l]) => `<button data-cmp="${k}" class="${k === compareId ? 'on' : ''}">${esc(l)}</button>`).join('') + `<hr><button data-cmp-split class="${splitOn ? 'on' : ''}">${_t("text.0099", { v1: splitOn ? '✓ ' : '' })}</button>`;
  view.setSplit(splitOn ? compareColors() : null);$('#split-labels').hidden = !splitOn;$('#split-a').textContent = 'A · ' + compareName();
  requestAnimationFrame(layoutCompareDock);
}
function layoutCompareDock() {
  const dock=$('#dock'),stage=$('#stage');
  if(innerWidth<=900){delete dock.dataset.flow;dock.style.width='';return;}
  if(step===1||!stage.clientWidth)return;
  const left=$('#views').offsetWidth+$<HTMLButtonElement>('#spin').offsetWidth+8,right=$('#bgs').scrollWidth,hold=$<HTMLButtonElement>('#hold').offsetWidth,room=stage.clientWidth-28,wing=Math.max(left,right+26);
  const full=2*wing+hold+30;
  dock.style.setProperty('--wing',wing+'px');dock.dataset.flow=full<=room?'balanced':left+right+22<=room?'two':'stack';
  dock.style.width=(full<=room?full:room)+'px';stage.style.setProperty('--dock-height',dock.offsetHeight+'px');
  const tools=$('#tools');stage.style.setProperty('--compare-top',Math.max(80,tools.offsetTop+tools.offsetHeight+10)+'px');
}
new ResizeObserver(()=>requestAnimationFrame(layoutCompareDock)).observe($('#stage'));
$<HTMLButtonElement>('#cmp-pick').onclick = (e) => {e.stopPropagation();const m = $('#cmp-menu');m.hidden = !m.hidden;};
$('#cmp-menu').onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-cmp]');if (b) {compareId = required(b.dataset.cmp);} else if (eventElement(e).closest<HTMLElement>('[data-cmp-split]')) {splitOn = !splitOn;if (splitOn && sideOn) toggleSide(false);}renderCompare();$('#cmp-menu').hidden = true;};
const comparison=bindCompareHold({button:$<HTMLButtonElement>('#hold'),stage:$('#stage'),line:$('#compare-wipe'),canStart:()=>step!==1,
  begin:()=>{hover.cancel();$('#part-tag').hidden=true;view.setColors(design.colors,true);view.setWipe(compareColors());view.stage.controls.enabled=false;$('#split-labels').hidden=true;$('#compare-before').textContent=compareName();},
  move:at=>view.setWipe(compareColors(),at),
  rotate:(dx,dy)=>view.orbitBy(dx,dy),
  end:()=>{view.setWipe(null);view.stage.controls.enabled=true;$('#split-labels').hidden=!splitOn;}
});

// ---------- selection ----------
function targetIds() {
  const z = ZONES.find((z) => z.id === sel.zone);if (!z) return [];
  if (sel.scope === 'one' && sel.part) return sel.mirror ? paintTargets(parts, [sel.part], true) : [sel.part];
  if (sel.scope === 'left' || sel.scope === 'right') return sideParts(parts, z.ids, sel.scope);
  return z.ids;
}
const hasSides = (z:Zone) => sideParts(parts, z.ids, 'left').length > 0;
function select(zone:string, { part = null, scope }:{part?:string|null;scope?:string} = {}) {sel = { ...sel, zone, part, scope: scope || (part ? 'one' : 'all') };if (part) sel.mirror = paintTargets(parts, [part], true).length > 1;replaceFrom = null;renderAll();}
const selectionLabel = () => {const z = required(ZONES.find((z) => z.id === sel.zone)),p = sel.part && knownPart(sel.part);return sel.scope === 'one' && p ? p.name : sel.scope === 'left' ? _t("text.0100", { v0: z.name }) : sel.scope === 'right' ? _t("text.0101", { v0: z.name }) : z.name;};

// ---------- colour finder (nearest real filament to any colour) ----------
function lab(hex:string):[number,number,number] {const n = parseInt(hex.slice(1), 16),f = (v:number) => {v /= 255;return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;},[r, g, b] = [f(n >> 16 & 255), f(n >> 8 & 255), f(n & 255)];const x = (r * .4124 + g * .3576 + b * .1805) / .95047,y = r * .2126 + g * .7152 + b * .0722,z = (r * .0193 + g * .1192 + b * .9505) / 1.08883,k = (t:number) => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;return [116 * k(y) - 16, 500 * (k(x) - k(y)), 200 * (k(y) - k(z))];}
const deltaE = (a:string, b:string) => {const p = lab(a),q = lab(b);return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);};
const closeness = (d:number) => d < 6 ? _t("text.0102") : d < 15 ? _t("text.0103") : d < 28 ? _t("text.0104") : _t("text.0105");

// ---------- rendering ----------
const used = () => [...new Set(parts.map((p) => keyOf(p.id)))];
const countOf = (k:string) => parts.filter((p) => keyOf(p.id) === k).length;
function chips(ids:string[]) {return [...new Set(ids.map((id) => design.colors[id]))].slice(0, 4).map((c) => `<i style="--c:${c}"></i>`).join('');}
function renderHeader() {$('#scheme-name').textContent = name;$('#scheme-state').textContent = (activeId ? dirty() ? _t("text.0106") : _t("text.0107") : _t("text.0108")) + (provenance ? _t("text.0084") : '');$('#scheme-state').className = activeId && !dirty() ? 'ok' : '';}
function renderRail() {
  $('#rail').innerHTML = `<div class="rail-head"><span class="eyebrow">${_t("text.0109")}</span><small>${_t("text.0110")}</small></div>` + ZONES.map((z) => {
    const on = sel.zone === z.id,locked = z.ids.every((id) => locks.has(id)),part = on && sel.part && sel.scope === 'one' ? knownPart(sel.part) : null;
    return `<div class="zone ${on ? 'on' : ''} ${z.internal ? 'internal' : ''}"><button class="zone-main" data-zone="${z.id}"><span class="zone-chips">${chips(z.ids)}</span><span class="zone-name">${esc(z.name)}<small>${_t("text.0115", { v5: z.ids.length, v6: knownPart(z.ids[0]).material === 'TPU 90A' ? _t("text.0111") : 'PLA' })}</small></span></button><button class="zone-lock ${locked ? 'on' : ''}" data-lock="${z.id}" title="${_attr(locked ? _t("text.0112") : _t("text.0113"))}" aria-label="${_attr(_t("text.0116", { v10: esc(z.name) }))}">${locked ? '🔒' : '🔓'}</button>${part ? `<div class="zone-part">${_t("text.0114", { v0: esc(part.name) })}</div>` : ''}</div>`;}).join('');
  if (step === 2) document.querySelector<HTMLElement>('#rail .zone.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
// Step 1 · 选个起点: the stage itself is the picker. Four real ducks stand in a row (studio/lineup.mjs); the tabs
// swap the squad between 经典配色, 灵感骰子 and 我的方案, 白胚 starts from all white. Clicking a duck dresses the
// design in it, going on to step 2 walks that duck into the studio.
const prodBy = (code:string, series:string) => catalog.products.find((p) => p.colorCode === code && p.series === series);
const BLANK = (() => {const w = required(prodBy('10100', 'PLA Basic')),t = required(prodBy('51105', 'TPU 90A'));return { colors: Object.fromEntries(parts.map((p) => [p.id, (p.material === 'TPU 90A' ? t : w).hex.toUpperCase()])), assignments: Object.fromEntries(parts.map((p) => [p.id, (p.material === 'TPU 90A' ? t : w).id])) };})();
let CLASSICS:[string,string,Patch][] = [['original', _t("text.0117"), ORIGINAL], ...[1, 2, 6].map<[string,string,Patch]>((i) => {const theme=required(THEMES[i]);return ['theme-'+i,theme.name,quickDesign(parts,products,themeSlots(products,theme),theme.recipe)];})];
const DICE_STYLES = ['经典', '撞色', '双拼', '低调'];
// Each dice slot keeps its style and can be locked, rerolled alone, or kept as a scheme.
let diceDraw = 0,diceSet:Dice[] = [],startId:string|null = null,startTab = 'classic',minePage = 0,squadKey = '';
function drawCard(i:number) {const r = required(DICE_STYLES[i]),design = quickDesign(parts, products, rollSlots(products, slots, r, { recipe: true }).slots, r),id = `dice-${++diceDraw}`,number = diceDraw;return { id, get name() {return _label(r) + ' #' + number;}, recipe: r, design, locked: false };}
function startOf(id:string|null|undefined) {
  if(!id)return null;
  if (id === 'blank') return { get name() {return _t("text.0124");}, design: BLANK };
  const c = CLASSICS.find((x) => x[0] === id);if (c) return { get name() {return required(CLASSICS.find((x) => x[0] === id))[1];}, design: c[2] };
  const d = diceSet.find((x) => x.id === id);if (d) return { get name() {return d.name;}, design: d.design };
  const sc = id.startsWith('scheme-') && schemes.find((x) => x.id === id.slice(7));if (sc) return { name: sc.name, design: sc.design, scheme: sc };
  return null;
}
const minePages = () => Math.max(1, Math.ceil(schemes.length / 4));
// The four starting points on stage now: [id, label].
function squad():[string,string][] {
  if (startTab === 'dice') return diceSet.map((d) => [d.id, _label(d.recipe)]);
  if (startTab === 'mine') {minePage = Math.min(minePage, minePages() - 1);return schemes.slice(minePage * 4, minePage * 4 + 4).map((s) => ['scheme-' + s.id, s.name]);}
  return CLASSICS.map((c) => [c[0], c[1]]);
}
const finishesOf = (d:Patch) => Object.fromEntries(parts.map((p) => {const k = d.assignments?.[p.id];return [p.id, k && products.has(k) ? finishOfProduct(products.get((k)??'')) : d.finishes?.[p.id] || (partKind(p) === 'TPU' ? 'tpu' : 'basic')];}));
const squadKeyOf = (list:[string,string][]) => startTab + '|' + list.map(([id]) => id + (id.startsWith('scheme-') ? jsonStringify(required(startOf(id)).design.colors) : '')).join(',');
const lookOf = (id:string) => {const d = required(startOf(id)).design;return { colors: d.colors, finishes: finishesOf(d) };};
const lineup = createLineup(view, { tags: $('#lineup-tags'), onPick: (i) => {const s = squad()[i];if (s) applyStart(s[0]);}, onStart: (i) => {const s = squad()[i];if (s) {applyStart(s[0]);goStep(2);}} });
// The overlay re-renders freely; the ducks only change when the squad itself does.
function renderStarts() {
  const box = $('#lineup');box.hidden = step !== 1;if (step !== 1) return;
  if (!diceSet.length) diceSet = DICE_STYLES.map((_, i) => drawCard(i));
  const list = squad(),key = squadKeyOf(list);
  if (key !== squadKey || !lineup.active) {squadKey = key;lineup.show(list.map(([id]) => lookOf(id)));}
  const tabs = [['classic', _t("text.0136")], ['dice', _t("text.0137")], ['mine', _t("text.0140"), schemes.length ? `<small>${schemes.length}</small>` : '']];
  $('#lineup-tabs').innerHTML = tabs.map(([k, label, extra = '']) => `<button role="tab" data-start-tab="${k}" aria-selected="${startTab === k}" class="${startTab === k ? 'on' : ''}">${label}${extra}</button>`).join('');
  $('#lineup-tags').innerHTML = list.map(([id, label], i) => {
    const d = startTab === 'dice' ? diceSet[i] : undefined;
    const ctl = d ? `<span class="ctl"><button data-dice-lock="${i}" aria-pressed="${d.locked}" title="${_attr(d.locked ? _t("text.0112") : _t("text.0125"))}">${d.locked ? '🔒' : '🔓'}</button><button data-dice-one="${i}" ${d.locked ? 'disabled' : ''} title="${_attr(_t("text.0126"))}">↻</button><button data-keep="${d.id}" title="${_attr(_t("text.0127"))}">☆</button></span>` : '';
    return `<div class="lineup-tag ${id === startId ? 'on' : ''} ${d?.locked ? 'locked' : ''}" data-slot="${i}"><button data-start="${id}">${esc(label)}</button>${ctl}</div>`;
  }).join('');
  const paged = startTab === 'mine' && minePages() > 1;$<HTMLButtonElement>('#lineup-prev').hidden = $<HTMLButtonElement>('#lineup-next').hidden = !paged;$<HTMLButtonElement>('#lineup-prev').disabled = minePage === 0;$<HTMLButtonElement>('#lineup-next').disabled = minePage >= minePages() - 1;
  $('#lineup-empty').hidden = !(startTab === 'mine' && !schemes.length);$<HTMLButtonElement>('#lineup-dice').hidden = startTab !== 'dice';
  const at = list.findIndex(([id]) => id === startId),s = at >= 0 && startOf(startId);lineup.select(at);
  $<HTMLButtonElement>('#start-go').textContent = s ? _t("text.0141", { v0: s.name }) : _t("text.0142");lineup.place();
}
function setStartTab(tab:string) {if (tab === startTab) return;startTab = tab;minePage = 0;renderStarts();}
function rerollAll() {
  if (startTab !== 'dice') return setStartTab('dice');
  const open = diceSet.map((d, i) => d.locked ? null : i).filter((i) => i !== null);if (!open.length) return toast(_message("text.0128"));
  const die = $('#lineup-dice .die');die.classList.remove('roll');void die.offsetWidth;die.classList.add('roll');
  open.forEach((i, k) => rerollOne(i, k * 90));
}
// A rerolled duck spins into its new colours on its own, so the squad is not swapped.
function rerollOne(i:number, delay = 0) {if (startId === required(diceSet[i]).id) startId = null;diceSet[i] = drawCard(i);squadKey = squadKeyOf(squad());lineup.spin(i, lookOf(required(diceSet[i]).id), delay);renderStarts();}
function applyStart(id:string) {
  const s = startOf(id);if (!s) return;startId = id;
  if (s.scheme) {openScheme(s.scheme.id);return;}
  const next = clone(design);for (const p of parts) if (!locks.has(p.id)) {next.colors[p.id] = required(s.design.colors[p.id]);next.assignments[p.id] = defined(s.design.assignments[p.id]);}
  next.finishes = {};if (!activeId && (defaultName || startId)) name = id === 'blank' ? _t("text.0047") : s.name;stepsDone.add(1);commit(next, _message("text.0143", { v0: ()=>s.name }));
}
async function keepDice(id:string) {
  const d = diceSet.find((x) => x.id === id);if (!d) return;if (schemes.length >= 30) return toast(_message("text.0144"));
  const s = { id: newId(), name: d.name, design: parseDesign(clone(d.design)), provenance: null, voiceSalt: 0, created: Date.now(), updated: Date.now() };
  if (personal) {const result = await personalWrite('PUT', s.id, schemeBody(s));if (!result) return;Object.assign(s,result);}
  schemes.unshift(s);persist();if (!personal) pushScheme(s);renderStarts();toast(_message("text.0145", { v0: d.name, v1: savedWhere() }));
}
const selKind = () => partKind(knownPart(required(ZONES.find((z) => z.id === sel.zone)).ids[0]));
// In 刷子 mode the swatches load the brush instead of painting a selection, so they list the brush's material.
const gridKind = () => tool === 'brush' ? brushKind : selKind();
// The brush colour is simply the current colour: whatever was picked last, in either mode.
function setInk(k:string) {brush = k;if (!isHex(k) && products.has(k)) brushKind = kindOf(products.get((k)??''));const bar = document.querySelector<HTMLElement>('#brush-bar');if (bar) bar.innerHTML = inkBar();markGrid();renderStage();}
const inkBar = () => brush ? `<i style="--c:${keyHex(brush)}"></i><div class="cur-text"><b>${esc(keyName(brush))}</b><small>${_t("text.0146", { v2: esc(keySub(brush)) })}</small></div>` : '';
function setTool(t:string) {
  if (t === 'brush' && !brush) {const keys = [...new Set(targetIds().map(keyOf))];brush = keys.length === 1 ? required(keys[0]) : recent[0] || keyOf(required(targetIds()[0]));}
  if (t === 'brush' && brush && !isHex(brush) && products.has(brush)) brushKind = kindOf(products.get((brush)??''));
  if (t === 'pick') toolBefore = tool === 'pick' ? 'select' : tool;else pickToFree = false;
  tool = t;replaceFrom = null;clearBrushHover();renderAll();
}
function clearBrushHover() {if (brushHover) {brushHover = null;view.setColors(design.colors);}}
const brushTargets = (id:string) => (brushMirror ? paintTargets(parts, [id], true) : [id]).filter((x) => !locks.has(x) && fits(x, brush));
const cursorFor = (hex:string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><circle cx='14' cy='14' r='9' fill='${hex}' stroke='white' stroke-width='3'/><circle cx='14' cy='14' r='10.5' fill='none' stroke='#141c33' stroke-width='1.2'/></svg>`)}") 14 14, crosshair`;
const brandList=(id:string,kind:string)=>seriesProducts(catalog.products,id,kind==='TPU'?'TPU 90A':'PLA Basic');
// Step 2 colour dock. Static structure renders once per selection; painting only refreshes the live parts
// (current colour, in-use chips, selected rings), so hover, focus and scroll never jump.
// Step 2 fits one screen: a two-line header, the tabs, and a pane with no folds or dropdowns.
function panelStep2() {
  const z = required(ZONES.find((z) => z.id === sel.zone)),kind = selKind(),part = sel.part && knownPart(sel.part);
  const pairOf = part && paintTargets(parts, [part.id], true).find((id) => id !== part.id);
  const scopes = [['all', _t("text.0147", { v0: z.ids.length })], ...(hasSides(z) ? [['left', _t("text.0148")], ['right', _t("text.0149")]] : []), ...(part ? [['one', _t("text.0150")]] : [])];
  const kindNow = gridKind(),finishes:Finish[] = kindNow === 'TPU' ? ['tpu'] : ['basic', 'matte', 'silk', 'translucent'];if (!finishes.includes(freeFinish)) freeFinish = required(finishes[0]);
  const head = tool === 'brush' ? `<div class="panel-head compact tight brush-head"><div class="sel-line"><h2>${_t("text.0151")}</h2><div class="cur ink slim" id="brush-bar">${
  inkBar()}</div><button class="exit-brush" data-set-tool="select" title="${_attr(_t("text.0152"))}">${_t("text.0153")}</button></div>
      <div class="brush-opts"><label class="pill-check"><input type="checkbox" id="brush-mirror" ${brushMirror ? 'checked' : ''}>${_t("text.0154")}</label><div class="mini-seg" role="group" aria-label="${_attr(_t("text.0155"))}">${['PLA', 'TPU'].map((k) => `<button data-brush-kind="${k}" class="${brushKind === k ? 'on' : ''}">${k === 'PLA' ? 'PLA' : _t("text.0043")}</button>`).join('')}</div></div></div>` : `<div class="panel-head compact tight"><div class="sel-line"><h2>${
  esc(selectionLabel())}</h2><span class="kind-tag ${kind === 'TPU' ? 'tpu' : ''}">${kind === 'TPU' ? 'TPU 90A' : _t('filament.rigid')}</span>${z.id === 'face' ? `<span class="info-dot" title="${_attr(_t("text.0156"))}">i</span>` : ''}</div>
      <div class="scope" role="group" aria-label="${_attr(_t("text.0159"))}">${scopes.map(([k, l]) => `<button class="${sel.scope === k ? 'on' : ''}" data-scope="${k}">${l}</button>`).join('')}${sel.scope === 'one' && pairOf ? `<label class="pill-check" title="${_attr(_t("text.0157", { v0: esc(knownPart(pairOf).name) }))}"><input type="checkbox" id="mirror" ${sel.mirror ? 'checked' : ''}>${_t("text.0158")}</label>` : ''}</div></div>`;
  return head + dockHTML(finishes) + `<div class="panel-foot"><button class="primary" data-go="3">${_t("text.0160")}</button></div>`;
}
function dockHTML(finishes:Finish[]) {return `<div class="cdock" id="cdock" data-tab="${dockTab}">
    <div class="dock-tabs" role="tablist"><button data-tab="filament" role="tab">${_t("text.0167")}</button><button data-tab="free" role="tab">${_t("text.0168")}</button><i class="ink"></i></div>
    <div class="panel-body dock-body fit">
      <div id="replace-slot"></div>
      <section class="pane pane-filament">
        <div class="strip"><span>${_t("text.0169")} <small${tool === 'brush' ? '' : ' class="hover-hint"'}>${tool === 'brush' ? _t("text.0161") : _t("text.0162")}</small></span><button class="link-btn" id="take-open" title="${_attr(_t("text.0170"))}">${_t("text.0171")}</button></div>
        <div class="chips one-line" id="inuse-row"></div>
        <div class="take-pop" id="take-pop" hidden></div>
        <div class="brand-row" role="group" aria-label="${_attr(_t("text.0172"))}">${BRANDS.map(b=>`<button data-brand="${b.id}" class="${source===b.id?'on':''}">${b.short}</button>`).join('')}</div>
        <div id="series-slot"></div>
        <label class="mini-search filament-search"><span>⌕</span><input id="search" placeholder="${_attr(_t('filament.search'))}" value="${esc(search)}" autocomplete="off"></label>
        <div class="filament-count" id="filament-count"></div>
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
const matchSearch = (p:Product) => !search || [p.name,p.colorCode,p.nameEn,p.brand,p.series,...(p.skus||[])].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
function buildGrid() {
  const g=document.querySelector<HTMLElement>('#lib-grid');if(!g)return;const all=brandList(source,gridKind()),series=[...new Set(all.map(p=>p.series))];if(!series.includes(filamentSeries))filamentSeries=series[0]||'';
  if(document.querySelector<HTMLSelectElement>('#filament-series')?.dataset.seriesScope!==source+':'+gridKind())$('#series-slot').innerHTML=`<label class="filament-series"><span>${_t('filament.series')}</span><select id="filament-series" data-series-scope="${source+':'+gridKind()}" aria-label="${_attr(_t('filament.series'))}" ${series.length?'':'disabled'}>${series.map(s=>`<option value="${_attr(s)}" ${s===filamentSeries?'selected':''}>${esc(s)}</option>`).join('')}</select></label>`;
  $$('[data-brand]').forEach(button=>button.classList.toggle('on',button.dataset.brand===source));
  const list=all.filter(p=>p.series===filamentSeries).filter(matchSearch);$('#filament-count').textContent=_t('filament.colours',{count:list.length});
  g.innerHTML = list.length ? list.map((p) => {const f = finishOfProduct(p);return `<button class="dot fin-${f}" role="option" data-key="${p.id}" style="--c:${p.hex};${(p.colors?.length??0)>1?'background:linear-gradient(135deg,'+(p.colors??[]).join(',')+')':''}" aria-label="${_attr(productLabel(p))}">${f === 'translucent' ? `<b>${_t("text.0183")}</b>` : ''}</button>`;}).join('') : `<p class="tip">${
  search ? _t("text.0184") : _t("text.0185")}</p>`;
  markGrid();
}
function markGrid() {const keys = new Set(tool === 'brush' ? [brush] : targetIds().map(keyOf)),one = keys.size === 1 ? [...keys][0] : null;$$('#lib-grid .dot').forEach((d) => d.classList.toggle('on', d.dataset.key === one));}
const chip = (k:string, { count, on }:{count?:number;on?:boolean} = {}) => `<button class="chip ${on ? 'on' : ''} fin-${isHex(k) ? hexFinish(k) || 'basic' : finishOfProduct(products.get((k)??''))}" data-key="${k}" style="--c:${keyHex(k)}" aria-label="${_attr(esc(keyName(k)))}">${count ? `<em>${count}</em>` : ''}</button>`;
function productLink(k:string){const p=products.get((k)??''),url=p?.productUrl||p?.sourceUrl;return url?`<a href="${_attr(url)}" target="_blank" rel="noreferrer">${_t('filament.source')}</a>`:'';}
function hoverInfo(k:string|null) {
  const el = document.querySelector<HTMLElement>('#hover-info');if (!el) return;
  if (k) {el.innerHTML = `<i style="--c:${keyHex(k)}"></i><span><b>${esc(keyName(k))}</b><small>${esc(keySub(k))}</small></span>${productLink(k)}<kbd>${_t("text.0186")}</kbd>`;el.classList.add('live');return;}
  const keys = tool === 'brush' ? [brush] : [...new Set(targetIds().map(keyOf))];el.classList.remove('live');
  el.innerHTML = keys.length === 1 && keys[0] ? `<i style="--c:${keyHex(keys[0])}"></i><span><b>${tool === 'brush' ? _t("text.0187") : _t("text.0188")}${esc(keyName(keys[0]))}</b><small>${esc(keySub(keys[0]))}${targetIds().some((id) => locks.has(id)) && tool !== 'brush' ? _t("text.0189") : ''}</small></span>${productLink(keys[0])}<kbd class="hover-hint">${_t("text.0190")}</kbd>` : `<span class="muted">${_t("text.0191", { v0: keys.length })}</span>`;
}
function updateStep2() {
  const ids = targetIds(),keys = [...new Set(ids.map(keyOf))],one = tool === 'brush' ? brush : keys.length === 1 ? keys[0] : null,kind = gridKind();
  if (document.querySelector<HTMLElement>('#brush-bar')) $('#brush-bar').innerHTML = inkBar();
  if (document.querySelector<HTMLElement>('#cur-bar')) $('#cur-bar').innerHTML = `<div class="cur-chips">${keys.slice(0, 4).map((k) => `<i style="--c:${keyHex(k)}"></i>`).join('')}</div><div class="cur-text"><b>${one ? esc(keyName(one)) : _t("text.0192", { v0: keys.length })}</b><small>${one ? esc(keySub(one)) : _t("text.0193")}${ids.some((id) => locks.has(id)) ? _t("text.0189") : ''}</small></div>`;
  $('#replace-slot').innerHTML = replaceFrom ? `<div class="replace-banner"><span>${_t("text.0194")}<i style="--c:${keyHex(replaceFrom)}"></i><b>${esc(keyName(replaceFrom))}</b>${_t("text.0195", { v2: countOf(replaceFrom) })}</span><small>${_t("text.0196")}</small><button id="replace-cancel">${_t("text.0078")}</button></div>` : '';
  const fitsKind = (k:string) => isHex(k) || products.has(k) && kindOf(products.get((k)??'')) === kind;
  $('#inuse-row').innerHTML = used().filter(fitsKind).map((k) => `<span class="chip-wrap">${chip(k, { count: countOf(k), on: k === one })}<button class="chip-rep ${replaceFrom === k ? 'on' : ''}" data-replace="${k}" title="${_attr(_t("text.0197", { v3: esc(keyName(k)) }))}" aria-label="${_attr(_t("text.0198", { v4: esc(keyName(k)) }))}">⇄</button></span>`).join('');
  markGrid();hoverInfo(null);syncFree();
}
// ---- free palette (after the original focus palette: SV square, hue rail, HEX, eyedropper) ----
const freeKey = () => {const f = gridKind() === 'TPU' || freeFinish === 'basic' ? null : freeFinish;return 'hex:' + finder.toUpperCase() + (f ? '|' + f : '');};
function syncFree() {
  const sv = document.querySelector<HTMLElement>('#sv');if (!sv) return;
  sv.style.backgroundColor = hsvToHex(freeHsv.h, 1, 1);required(sv.querySelector<HTMLElement>('span')).style.left = freeHsv.s * 100 + '%';required(sv.querySelector<HTMLElement>('span')).style.top = (1 - freeHsv.v) * 100 + '%';
  $<HTMLInputElement>('#hue').value = String(Math.round(freeHsv.h));$('#free-chip').style.background = finder;if (document.activeElement !== $<HTMLInputElement>('#free-hex')) $<HTMLInputElement>('#free-hex').value = finder.toUpperCase();
  document.querySelector<HTMLButtonElement>('#free-apply')?.style.setProperty('--c', finder);
  $$('#finish-seg [data-finish]').forEach((b) => b.classList.toggle('on', b.dataset.finish === freeFinish));
  const kind = gridKind();$('#free-recent').innerHTML = recent.filter(isHex).slice(0, 8).map((k) => chip(k)).join('') || `<small class="muted">${_t("text.0199")}</small>`;
  $('#free-near').innerHTML = [...products.values()].filter((p) => kindOf(p) === kind).map<[Product,number]>((p) => [p, deltaE(finder, p.hex)]).sort((a, b) => a[1] - b[1]).slice(0, 6).map(([p, d]) => `<span class="near-item">${chip(p.id)}<small>${closeness(d)}</small></span>`).join('');
}
let freeFrame = 0;
function setFree(hex:string, { hsv, preview = true }:{hsv?:ReturnType<typeof hexToHsv>;preview?:boolean} = {}) {finder = hex.toUpperCase();freeHsv = hsv || hexToHsv(finder);cancelAnimationFrame(freeFrame);freeFrame = requestAnimationFrame(() => {syncFree();if (tool === 'brush' && preview) setInk(freeKey());else if (preview) previewFree();});}
function previewFree() {const ids = targetIds().filter((id) => !locks.has(id));previewing = true;view.setColors({ ...design.colors, ...Object.fromEntries(ids.map((id) => [id, finder])) });}
function commitFree() {previewing = false;if (tool === 'brush') return setInk(freeKey());paint(targetIds(), freeKey(), _message("text.0052"));}

function panelStep3() {
  const notes = designNotes(design.colors, design.assignments),list = used(),slotsNeeded = new Set([...Object.values(ORIGINAL.assignments), ...parts.map((p) => keyOf(p.id))]).size,code = lookCode({ ...design, name }, parts, products),okCode = /^v[12]\./.test(code);
  const pending = parts.filter((p) => !design.assignments[p.id] || products.get((design.assignments[p.id])??'')?.demo).length;
  const plates = [1, 2, 3, 4, 5, 6].map((n) => {const ps = parts.filter((p) => p.plate === n),ks = [...new Set(ps.map((p) => keyOf(p.id)))],tpu = required(ps[0]).material === 'TPU 90A',warn = tpu && ks.length > 1 ? _t("text.0205") : !tpu && ks.length > 4 ? _t("text.0206") : '';return `<div class="plate ${warn ? 'warn' : ''}" title="${_attr(warn || _t("text.0207", { v0: ps.length, v1: ks.length }))}"><b>${_t("text.0208", { v2: n })}</b><span>${ks.map((k) => `<i style="--c:${keyHex(k)}"></i>`).join('')}</span><small>${_t("text.0209", { v4: ks.length, v5: tpu ? ' · TPU' : '' })}</small></div>`;}).join('');
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
        <div class="joint-grid">${POSE_SLIDERS.map(([_g, id, label, min, max]) => `<label class="pose-row joint" title="${_attr(_t("text.0213"))}"><span>${label}</span><input type="range" data-pose="${id}" min="${min}" max="${max}" step="1"><em></em></label>`).join('')}</div>
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
  <div class="panel-foot finish"><button class="save-mine ${activeId && !dirty() ? 'done' : ''}" id="finish-save" title="${_attr(_t(personal ? 'personal.saveTitle' : "text.0248"))}">${activeId && !dirty() ? _t("text.0219") : _t("text.0220")}</button>${personal ? assembly ? `<a class="primary go-assemble" id="go-assemble" href="./assemble/" title="${_attr(_t('personal.assembleTitle'))}">${_t('personal.assemble')} →</a>` : '' : `<button class="primary" id="publish" title="${_attr(_t("text.0249"))}">${_t("text.0250")}</button>`}</div>`;
}
// The share tab shows the real poster, rendered once per design when the tab opens.
let miniKey = '';
function fillPosterMini() {
  const img = document.querySelector<HTMLImageElement>('#poster-mini');if (!img) return;const key = jsonStringify([design, name]);if (key === miniKey && img.dataset.src) {img.src = img.dataset.src;required(img.parentElement).classList.add('ready');return;}
  required(img.parentElement).classList.remove('ready');
  setTimeout(() => requestAnimationFrame(() => {const cv = drawPoster({ view, design: { ...design, name, author: account.user?.name || '' }, parts, products, before: ORIGINAL, opts: { ratio: '3:4', theme: 'light', materials: true, compare: false, author: true } }),small = document.createElement('canvas');small.width = 270;small.height = 360;required(small.getContext('2d')).drawImage(cv, 0, 0, 270, 360);miniKey = key;img.dataset.src = small.toDataURL('image/png');if (document.querySelector<HTMLImageElement>('#poster-mini') === img) {img.src = img.dataset.src;required(img.parentElement).classList.add('ready');}}), 60);
}
function renderPanel() {
  const panel = $('#panel'),top = document.querySelector<HTMLElement>('#panel .panel-body')?.scrollTop || 0,outer = panel.scrollTop,again = panel.dataset.step === String(step);
  panel.innerHTML = step === 1 ? '' : step === 2 ? panelStep2() : panelStep3();panel.dataset.step = String(step);
  if (again && document.querySelector<HTMLElement>('#panel .panel-body')) $('#panel .panel-body').scrollTop = top;
  // On phones the panel itself scrolls under the pinned duck: keep the spot within a step, start a new step at the top.
  panel.scrollTop = again ? outer : 0;
  // A new step slides its content in; re-renders within a step stay still.
  if (!again) {panel.classList.remove('enter');void panel.offsetWidth;panel.classList.add('enter');}
  if (step === 3 && showTab === 'share') fillPosterMini();
  if (step === 3 && document.querySelector<HTMLElement>('.joint-grid')) syncPose();
  if (step !== 2 && poseOpen) togglePose(false);
  renderStarts();if (step === 2) {buildGrid();updateStep2();}
}
function renderSteps() {$$('#steps button').forEach((b) => {const n = Number(b.dataset.step);b.classList.toggle('on', n === step);b.classList.toggle('done', stepsDone.has(n) && n !== step);});$('#studio').dataset.step = String(step);}
function renderStage() {
  const ids = step === 2 && tool === 'select' ? replaceFrom ? parts.filter((p) => keyOf(p.id) === replaceFrom).map((p) => p.id) : targetIds() : [];if (!brushHover) view.setHighlight(ids, []);
  $('#stage').style.setProperty('--brush-cursor', tool === 'brush' && brush ? cursorFor(keyHex(brush)) : 'crosshair');
  $$('#tools [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool));
  const bp = brush && keyName(brush);$('#brush-chip').hidden = !(tool === 'brush' && bp);if (bp) $('#brush-chip').innerHTML = `<i style="--c:${keyHex(brush)}"></i>${esc(bp)}`;
  $('#stage').dataset.tool = step === 2 ? tool : 'select';
  $('#hint').textContent = step === 1 ? _t("text.0251") : step === 3 ? _t("text.0252") : replaceFrom ? _t("text.0253") : tool === 'brush' ? _t("text.0254") : tool === 'pick' ? _t("text.0255") : _t("text.0256");
  $('#stage').style.setProperty('--tint', required(design.colors['P5-06']));
  view.setFinishes(Object.fromEntries(parts.map((p) => [p.id, keyFinish(keyOf(p.id), p.id)])));
  // 自动背景: light selections get a mid-tone backdrop so white parts never melt into it.
  const look = (step === 2 ? targetIds() : ['P4-01', 'P5-06', 'P5-07', 'P5-01', 'P5-02', 'P2-03', 'P2-04']).map((id) => lum(required(design.colors[id]))),avg = look.reduce((a, b) => a + b, 0) / look.length;
  $('#stage').dataset.bg = bgPref === 'auto' ? avg > .55 && step !== 1 ? 'mid' : 'soft' : bgPref;$$('#bgs [data-bg]').forEach((b) => b.classList.toggle('on', b.dataset.bg === bgPref));paintBg();
  // The enlarged copy stands beside the duck in the same view; it follows the current selection.
  const showSide = sideOn && step === 2 && !splitOn && view.layout !== 'arrange',ids2 = targetIds(),scale = view.setSideCopy(showSide ? ids2 : null, $('#side-label'));
  $('#side-label').textContent = _t("text.0257", { v0: scale.toFixed(1), v1: selectionLabel() });$<HTMLButtonElement>('#side-toggle').setAttribute('aria-pressed', String(sideOn));
  // One button: 聚焦 flies to the selection, 整机 flies back; while focused, a new selection is followed.
  const fk = ids2.join(',');if (focused && step === 2 && fk !== focusKey) {focusKey = fk;view.focus(ids2);}
  $('#focus-icon').textContent = focused ? '⤢' : '⌖';$('#focus-text').textContent = focused ? _t("text.0258") : _t("text.0259");$<HTMLButtonElement>('#focus-toggle').classList.toggle('active', focused);
  $$('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === view.layout));$<HTMLButtonElement>('#spin').setAttribute('aria-pressed', String(view.turntable));
}
const lum = (hex:string) => {const n = parseInt(hex.slice(1), 16),f = (v:number) => {v /= 255;return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;};return .2126 * f(n >> 16 & 255) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255);};
// Each colour scheme has its own voice: the seed is derived from the 配色码 (plus an optional re-roll),
// so anyone who brings in the same colours hears the same duck.
let voiceKey = '',voiceDesc = '';
async function updateVoice() {
  const code = lookCode({ ...design, name: '' }, parts, products, false),key = (/^v[12]\./.test(code) ? code : 'colors:' + parts.map((p) => keyOf(p.id)).join(',')) + (voiceSalt ? '#' + voiceSalt : '');if (key === voiceKey) return;voiceKey = key;
  const seed = await seedFromText(key);if (key !== voiceKey) return;actions.seed = seed;voiceDesc = describeVoice(seed);const el = document.querySelector<HTMLElement>('#voice-desc');if (el) el.textContent = voiceDesc + ' · #' + seed.toString(16).padStart(8, '0');
}
function renderAll(lite = false) {renderHeader();renderSteps();renderRail();if (lite && step === 2 && document.querySelector('#cdock')) updateStep2();else if (lite && step === 1) renderStarts();else renderPanel();renderStage();renderCompare();renderMenu();$<HTMLButtonElement>('#undo').disabled = !undo.length;$<HTMLButtonElement>('#redo').disabled = !redo.length;updateVoice();}
function goStep(n:number) {
  comparison.stop();
  if (step === 3 && n !== 3) {actions.stop();applyPose();}
  if (focused && n !== 2) {focused = false;focusKey = '';view.view('hero');}
  if (step === 1 && n !== 1) lineup.hide(squad().findIndex(([id]) => id === startId));
  step = n;if (n > 1) stepsDone.add(n - 1);replaceFrom = null;
  if (n === 3) {if (view.layout === 'arrange') setLayout('assembly');view.setTurntable(true);tool = 'select';} else if (view.turntable) {view.setTurntable(false);view.resetSpin();}
  renderAll();
}
function setLayout(l:string|undefined) {if(l!=='assembly'&&l!=='explode'&&l!=='arrange'&&l!=='plates')return;view.setLayout(l, { order: ZONE_ORDER });if (l !== 'assembly') {poseUI = { ...POSE_ZERO };syncPose();}renderStage();}
function toggleSide(on = !sideOn) {sideOn = on;if (on && splitOn) {splitOn = false;renderCompare();}renderStage();}
function setFocused(on:boolean) {focused = on;focusKey = '';if (!on) {$$('#views button').forEach((x) => x.classList.toggle('on', x.dataset.view === 'hero'));view.view('hero');}renderStage();}

// ---------- events: header ----------
$('#steps').onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-step]');if (b) goStep(Number(b.dataset.step));};

// ---------- events: panel ----------
let previewing = false;
$('#panel').addEventListener('click', async (e) => {
  const t = eventElement(e),go = t.closest<HTMLElement>('[data-go]');if (go) return goStep(Number(go.dataset.go));
  const ptab = t.closest<HTMLElement>('[data-ptab]');if (ptab) {showTab = required(required(ptab.dataset.ptab));$('#pdock').dataset.tab = showTab;if (showTab === 'share') fillPosterMini();return;}
  const rp = t.closest<HTMLElement>('[data-replace]');if (rp) {replaceFrom = replaceFrom === rp.dataset.replace ? null : required(rp.dataset.replace);renderPanel();return renderStage();}
  if (t.closest<HTMLElement>('#replace-cancel')) {replaceFrom = null;renderPanel();return renderStage();}
  const sw = t.closest<HTMLElement>('[data-key]');
  if (sw && step === 2) {
    previewing = false;const pid = required(sw.dataset.key);
    if (replaceFrom) {const from = replaceFrom,ids = parts.filter((p) => keyOf(p.id) === from).map((p) => p.id);replaceFrom = null;return paint(ids, pid, _message("text.0260", { v0: ()=>keyName(from) }));}
    sw.classList.remove('pop');void sw.offsetWidth;sw.classList.add('pop');
    if (tool === 'brush') {if (isHex(pid)) {setFree(keyHex(pid), { preview: false });if (hexFinish(pid)) freeFinish = required(hexFinish(pid));}return setInk(pid);}
    if (isHex(pid)) {setFree(keyHex(pid), { preview: false });if (hexFinish(pid)) freeFinish = required(hexFinish(pid));}
    return paint(targetIds(), pid);
  }
  const tab = t.closest<HTMLElement>('.dock-tabs [data-tab]');if (tab) {dockTab = required(tab.dataset.tab);$('#cdock').dataset.tab = dockTab;if (dockTab === 'free') syncFree();return;}
  const br = t.closest<HTMLElement>('[data-brand]');if (br) {source = required(br.dataset.brand);$$('[data-brand]').forEach((x) => x.classList.toggle('on', x === br));return buildGrid();}
  const fin = t.closest<HTMLElement>('[data-finish]');if (fin) {freeFinish = required(designSchema.properties.finishes.additionalProperties.enum.find(f=>f===fin.dataset.finish));syncFree();if (freeAuto || tool === 'brush') commitFree();return;}
  if (t.closest<HTMLElement>('#free-apply')) return commitFree();
  if (t.closest<HTMLElement>('#free-pick')) {pickToFree = true;setTool('pick');return toast(_message("text.0261"));}
  const st = t.closest<HTMLElement>('[data-set-tool]');if (st) return setTool(required(st.dataset.setTool));
  const bk = t.closest<HTMLElement>('[data-brush-kind]');if (bk) {brushKind = required(bk.dataset.brushKind);if (brush && !isHex(brush) && kindOf(products.get((brush)??'')) !== brushKind) brush = recent.find((k) => !isHex(k) && products.has(k) && kindOf(products.get((k)??'')) === brushKind) || required(brandList('bambu', brushKind)[0]).id;return renderAll();}
  const sc = t.closest<HTMLElement>('[data-scope]');if (sc) {sel.scope = required(sc.dataset.scope);return renderAll();}
  if (t.closest<HTMLElement>('#take-open')) {const pop = $('#take-pop');pop.hidden = !pop.hidden;if (!pop.hidden) pop.innerHTML = `<b>${_t("text.0263")}</b>${[['original', _t("text.0069")], ...schemes.filter((x) => x.id !== activeId).map((x) => [x.id, x.name])].map(([k, l]) => `<div class="take-row"><span>${esc(l)}</span><button data-take-zone="${k}">${_t("text.0262", { v2: esc(selectionLabel()) })}</button><button data-take-all="${k}">${_t("text.0258")}</button></div>`).join('')}`;return;}
  const tk = t.closest<HTMLElement>('[data-take-zone],[data-take-all]');if (tk) {
    takeFrom = required(tk.dataset.takeZone || tk.dataset.takeAll);const src = takeFrom === 'original' ? ORIGINAL : schemes.find((s) => s.id === takeFrom)?.design;if (!src) return;
    const ids = tk.dataset.takeAll ? parts.map((p) => p.id) : targetIds(),patch = schemePatch(parts, ids, [...locks], src, products),next = clone(design);
    Object.assign(next.colors, patch.colors);Object.assign(next.assignments, patch.assignments);
    return commit(next, _message("text.0264", { v0: takeFrom === 'original' ? _message("text.0069") : required(schemes.find((s) => s.id === takeFrom)).name, v1: Object.keys(patch.colors).length }));
  }
  if (t.closest<HTMLElement>('#open-poster')) return poster.open({ design: { ...design, name, author: account.user?.name || '' }, before: ORIGINAL });
  if (t.closest<HTMLElement>('#copy-code')) {navigator.clipboard?.writeText(lookCode({ ...design, name }, parts, products)).then(() => toast(_message("text.0265")), () => toast(_message("text.0266")));return;}
  const act = t.closest<HTMLElement>('[data-act]');if (act) return actions.play(required(act.dataset.act));
  const vc = t.closest<HTMLElement>('[data-voice]');if (vc) {vc.classList.remove('pop');void vc.offsetWidth;vc.classList.add('pop');return actions.say(required(vc.dataset.voice));}
  if (t.closest<HTMLElement>('#voice-dice')) {voiceSalt = 1 + Math.floor(Math.random() * 99999);persist();renderPanel();updateVoice();return toast(_message("text.0267"));}
  if (t.closest<HTMLElement>('#voice-reset')) {voiceSalt = 0;persist();renderPanel();updateVoice();return toast(_message("text.0211"));}
  if (t.closest<HTMLElement>('#act-show')) return actions.show();if (t.closest<HTMLElement>('#act-stop')) return actions.stop();
  if (t.closest<HTMLElement>('#export2')) return openExport();
  // The guide wears the current draft; an untouched duck counts too once you choose to build it.
  if (t.closest<HTMLElement>('#go-assemble')) {draftUpdated ||= Date.now();persist();handOff();return;}
  if (t.closest<HTMLElement>('#finish-save')) {if (activeId && !dirty()) return toast(_message(personal ? 'personal.saved' : "text.0268"));await saveScheme(false);return renderPanel();}
  if (t.closest<HTMLElement>('#publish')) return openPublish();
});
$('#panel').addEventListener('change', (e) => {
  if (eventElement(e).id === 'mirror') {sel.mirror = inputElement(e).checked;renderAll();}
  if (eventElement(e).id === 'take-from') {takeFrom = valueElement(e).value;}
  if (eventElement(e).id === 'act-sound') {actions.sound = inputElement(e).checked;}
  if (eventElement(e).id === 'free-auto') {freeAuto = inputElement(e).checked;}
  if (eventElement(e).id === 'brush-mirror') {brushMirror = inputElement(e).checked;}
  if (eventElement(e).id === 'hue' && (freeAuto || tool === 'brush')) commitFree();
  if (eventElement(e).id === 'free-hex' && /^#?[\da-f]{6}$/i.test(valueElement(e).value.trim()) && freeAuto) commitFree();
});
$('#panel').addEventListener('change',e=>{if(eventElement(e).id==='filament-series'){filamentSeries=valueElement(e).value;buildGrid();}});
$('#panel').addEventListener('input', (e) => {
  if (eventElement(e).id === 'search') {search = valueElement(e).value;buildGrid();}
  if (eventElement(e).id === 'hue') {freeHsv = { ...freeHsv, h: +valueElement(e).value };setFree(hsvToHex(freeHsv.h, freeHsv.s, freeHsv.v), { hsv: freeHsv });}
  if (eventElement(e).id === 'free-hex') {const v = valueElement(e).value.trim();if (/^#?[\da-f]{6}$/i.test(v)) setFree(v.startsWith('#') ? v : '#' + v);}
});
// Hovering a swatch previews it on the model; leaving restores the real design.
$('#panel').addEventListener('pointerover', (e) => {
  const sw = eventElement(e).closest<HTMLElement>('[data-key]');if (!sw) return;const k = required(sw.dataset.key);if (step === 2) hoverInfo(k);if (tool === 'brush' && !replaceFrom) return;
  if (step !== 2) return;
  const ids = (replaceFrom ? parts.filter((x) => keyOf(x.id) === replaceFrom).map((x) => x.id) : targetIds()).filter((id) => !locks.has(id) && fits(id, k));if (!ids.length) return;
  previewing = true;view.setColors({ ...design.colors, ...Object.fromEntries(ids.map((id) => [id, keyHex(k)])) });
});
$('#panel').addEventListener('pointerout', (e) => {if (eventElement(e).closest<HTMLElement>('[data-key]') && !(e.relatedTarget instanceof Element?e.relatedTarget.closest('[data-key]'):null)) {if (step === 2) hoverInfo(null);if (previewing && !freeDrag) {previewing = false;view.setColors(design.colors);}}});
$('#panel').addEventListener('focusin', (e) => {if (eventElement(e).matches('.dot,.chip,.theme')) eventElement(e).dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));});
$('#panel').addEventListener('focusout', (e) => {if (eventElement(e).matches('.dot,.chip,.theme')) eventElement(e).dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: e.relatedTarget }));});
// Arrow keys walk the swatch grid; Enter/Space (native button) paints.
$('#panel').addEventListener('keydown', (e) => {
  const grid = eventElement(e).closest<HTMLElement>('#lib-grid,.themes');if (!grid || !eventElement(e).matches('.dot,.theme') || !e.key.startsWith('Arrow')) return;e.preventDefault();
  const dots = [...grid.querySelectorAll<HTMLElement>('.dot,.theme')],i = dots.indexOf(eventElement(e)),cols = dots.filter((d) => d.offsetTop === required(dots[0]).offsetTop).length;
  const j = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - cols, ArrowDown: i + cols }[e.key];dots[Math.max(0, Math.min(dots.length - 1, required(j)))]?.focus();
});
// SV square: drag previews live on the model; releasing paints once (one undo step).
let freeDrag = false;
$('#panel').addEventListener('pointerdown', (e) => {const sv = eventElement(e).closest<HTMLElement>('#sv');if (!sv) return;freeDrag = true;sv.setPointerCapture(e.pointerId);moveSV(e);});
$('#panel').addEventListener('pointermove', (e) => {if (freeDrag && eventElement(e).closest<HTMLElement>('#sv')) moveSV(e);});
$('#panel').addEventListener('pointerup', () => {if (!freeDrag) return;freeDrag = false;if (tool === 'brush' || freeAuto) commitFree();else {previewing = false;view.setColors(design.colors);}});
$('#panel').addEventListener('keydown', (e) => {if (eventElement(e).id !== 'sv' || !e.key.startsWith('Arrow')) return;e.preventDefault();const d = e.shiftKey ? .1 : .02;freeHsv = { ...freeHsv, s: Math.min(1, Math.max(0, freeHsv.s + (e.key === 'ArrowRight' ? d : e.key === 'ArrowLeft' ? -d : 0))), v: Math.min(1, Math.max(0, freeHsv.v + (e.key === 'ArrowUp' ? d : e.key === 'ArrowDown' ? -d : 0))) };setFree(hsvToHex(freeHsv.h, freeHsv.s, freeHsv.v), { hsv: freeHsv });});
$('#panel').addEventListener('keyup', (e) => {if (eventElement(e).id === 'sv' && e.key.startsWith('Arrow') && freeAuto) commitFree();});
function moveSV(e:PointerEvent) {const b = $('#sv').getBoundingClientRect();freeHsv = { ...freeHsv, s: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), v: 1 - Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)) };setFree(hsvToHex(freeHsv.h, freeHsv.s, freeHsv.v), { hsv: freeHsv });}

// ---------- events: rail ----------
$('#rail').addEventListener('click', (e) => {const lk = eventElement(e).closest<HTMLElement>('[data-lock]');if (lk) {const z = required(ZONES.find((z) => z.id === lk.dataset.lock)),all = z.ids.every((id) => locks.has(id));z.ids.forEach((id) => all ? locks.delete(id) : locks.add(id));persist();toast(() => (all ? _message("text.0269") : _message("text.0270")) + z.name + (all ? '' : _message("text.0271")));return renderAll();}const zb = eventElement(e).closest<HTMLElement>('[data-zone]');if (zb) {if (step !== 2) step = 2;select(required(zb.dataset.zone));}});
$('#rail').addEventListener('dblclick', (e) => {if (eventElement(e).closest<HTMLElement>('[data-zone]')) setFocused(!focused);});
$('#rail').addEventListener('pointerover', (e) => {const zb = eventElement(e).closest<HTMLElement>('[data-zone]');if (zb && zb.dataset.zone !== sel.zone) view.setHighlight(targetIds(), required(ZONES.find((z) => z.id === zb.dataset.zone)).ids);});
$('#rail').addEventListener('pointerleave', () => renderStage());

// ---------- events: step 1 lineup ----------
$('#lineup').addEventListener('click', (e) => {
  const t = eventElement(e),tab = t.closest<HTMLElement>('[data-start-tab]');if (tab) return setStartTab(required(tab.dataset.startTab));
  const keep = t.closest<HTMLElement>('[data-keep]');if (keep) {keep.textContent = '★';return keepDice(required(keep.dataset.keep));}
  const dl = t.closest<HTMLElement>('[data-dice-lock]');if (dl) {const d = required(diceSet[Number(dl.dataset.diceLock)]);d.locked = !d.locked;return renderStarts();}
  const one = t.closest<HTMLElement>('[data-dice-one]');if (one) {if (!required(diceSet[Number(one.dataset.diceOne)]).locked) rerollOne(Number(one.dataset.diceOne));return;}
  if (t.closest<HTMLElement>('#lineup-dice')) return rerollAll();
  const page = t.closest<HTMLElement>('#lineup-prev,#lineup-next');if (page) {minePage += page.id === 'lineup-next' ? 1 : -1;return renderStarts();}
  const go = t.closest<HTMLElement>('[data-go]');if (go) return goStep(Number(go.dataset.go));
  // 白胚 is not one of the four on stage, so it goes straight on to painting.
  const start = t.closest<HTMLElement>('[data-start]');if (start) {applyStart(required(start.dataset.start));if (start.dataset.start === 'blank') goStep(2);return;}
});
$('#lineup').addEventListener('dblclick', (e) => {const start = eventElement(e).closest<HTMLElement>('[data-start]');if (start && start.dataset.start !== 'blank') goStep(2);});

// ---------- events: stage ----------
const stage = $('#stage');let down:{x:number;y:number}|null = null;
const hover=hoverQueue(({clientX,clientY})=>view.pickAsync(clientX,clientY),showHover);
stage.addEventListener('pointerdown', (e) => {hover.cancel();if (eventElement(e) === view.canvas && step !== 1) down = { x: e.clientX, y: e.clientY };});
function stageClick(e:PointerEvent) {
  const id = view.pick(e.clientX, e.clientY);if (!id) {if (step === 2 && tool === 'select' && !replaceFrom) {sel.part = null;sel.scope = 'all';renderAll();}return;}
  const z = zoneOf(id),p = knownPart(id);
  if (step === 2 && tool === 'brush') {const ids = brushTargets(id);if (!ids.length) return toast(() => locks.has(id) ? _message("text.0272", { v0: p.name }) : _message("text.0273", { v0: p.name, v1: p.material, v2: keyName(brush) }));brushHover = null;return paint(ids, required(brush), _message("text.0274"));}
  if (step === 2 && tool === 'pick') {
    const k = keyOf(id),back = pickToFree ? toolBefore : 'brush';if (isHex(k) && hexFinish(k)) freeFinish = required(hexFinish(k));setFree(required(design.colors[id]), { preview: false });brush = k;if (!isHex(k)) brushKind = kindOf(products.get((k)??''));
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
stage.addEventListener('dblclick', (e) => {if (eventElement(e) === view.canvas && step === 2 && (focused || view.pick(e.clientX, e.clientY))) setFocused(!focused);});
stage.addEventListener('pointermove', (e) => {
  if (e.buttons || eventElement(e) !== view.canvas || step === 1) {hover.cancel();$('#part-tag').hidden = true;return;}
  hover.submit({clientX:e.clientX,clientY:e.clientY});
});
function showHover(id:string|null,e:{clientX:number;clientY:number}) {const tag=$('#part-tag');
    if (!id) {tag.hidden = true;if (step === 2) {clearBrushHover();renderStage();}return;}
    const p = knownPart(id),z = zoneOf(id),b = stage.getBoundingClientRect(),prodName = keyName(keyOf(id));
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
$('#tools').onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-tool]');if (b) setTool(required(b.dataset.tool));};
$<HTMLButtonElement>('#focus-toggle').onclick = () => setFocused(!focused);
// ---------- simple pose control ----------
// A few friendly controls map onto the rig's joints; 下蹲 and 抬脚 drive hip + knee together.
// Left/right follow the duck's own sides, like the rest of the studio.
let POSE_SLIDERS:PoseSlider[] = [
[_t("text.0283"), 'jaw', _t("text.0284"), 0, 28, '°'], [_t("text.0283"), 'headPitch', _t("text.0285"), -30, 50, '°'], [_t("text.0283"), 'headYaw', _t("text.0286"), -45, 45, '°'], [_t("text.0283"), 'headRoll', _t("text.0287"), -15, 15, '°'], [_t("text.0283"), 'neck', _t("text.0288"), -20, 80, '°'],
[_t("text.0289"), 'crouch', _t("text.0290"), 0, 100, '%'], [_t("text.0289"), 'trunk', _t("text.0291"), -15, 25, '°'], [_t("text.0292"), 'legL', _t("text.0293"), 0, 100, '%'], [_t("text.0292"), 'legR', _t("text.0294"), 0, 100, '%']];

const POSE_ZERO:PoseUI={jaw:0,headPitch:0,headYaw:0,headRoll:0,neck:0,trunk:0,crouch:0,legL:0,legR:0};
// Static poses that sit next to the animated actions on 动起来: [label, icon, preset index].
let MOVE_POSES:[string,string,number][] = [[_t("text.0284"), '😮', 1], [_t("text.0295"), '👇', 2], [_t("text.0293"), '🦵', 4], [_t("text.0287"), '🤔', 5]];
let POSE_PRESETS:[string,Partial<PoseUI>][] = [[_t("text.0296"), {}], [_t("text.0297"), { jaw: 24, headPitch: -20 }], [_t("text.0295"), { neck: 45, headPitch: 35 }], [_t("text.0298"), { crouch: 100, trunk: -15, neck: -8 }], [_t("text.0293"), { legL: 70, headRoll: 6 }], [_t("text.0299"), { headRoll: 12, headYaw: 20, jaw: 8 }]];
let poseUI = { ...POSE_ZERO },poseOpen = false,poseTween = 0;
const poseFrom = (u:PoseUI) => ({ jaw: u.jaw, headPitch: u.headPitch, headYaw: u.headYaw, headRoll: u.headRoll, neck: u.neck, trunk: u.trunk, hip: u.crouch * .6, knee: -u.crouch * 1.15, hipL: u.legL * .55, kneeL: -u.legL * 1.1, hipR: u.legR * .55, kneeR: -u.legR * 1.1 });
const clampN = (v:number, lo:number, hi:number) => Math.round(Math.min(hi, Math.max(lo, v)));
const poseOf = (P:ViewPose) => ({ jaw: clampN(P.jaw, 0, 28), headPitch: clampN(P.headPitch, -30, 50), headYaw: clampN(P.headYaw, -45, 45), headRoll: clampN(P.headRoll, -15, 15), neck: clampN(P.neck, -20, 80), trunk: clampN(P.trunk, -15, 25), crouch: clampN(P.hip / .6, 0, 100), legL: clampN(P.hipL / .55, 0, 100), legR: clampN(P.hipR / .55, 0, 100) });
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
function syncPose() {$$<HTMLInputElement>('[data-pose]').forEach((i) => {const r = required(POSE_SLIDERS.find((x) => x[1] === i.dataset.pose));i.value = String(poseUI[r[1]]);required(i.nextElementSibling).textContent = poseUI[r[1]] + r[5];i.style.setProperty('--p', (poseUI[r[1]] - r[3]) / (r[4] - r[3]) * 100 + '%');});}
// Presets and reset glide over ~300 ms instead of jumping.
function poseTo(target:Partial<PoseUI>) {
  const from = { ...poseUI },to = { ...POSE_ZERO, ...target },t0 = performance.now();cancelAnimationFrame(poseTween);
  (function step(now:number) {const k = Math.min(1, (now - t0) / 320),e = 1 - (1 - k) ** 3;for (const [,id] of POSE_SLIDERS) poseUI[id] = Math.round(from[id] + (to[id] - from[id]) * e);applyPose();syncPose();if (k < 1) poseTween = requestAnimationFrame(step);})(t0);
}
function readyToPose() {if (actions.current) actions.stop();if (view.layout !== 'assembly') setLayout('assembly');}
function togglePose(on = !poseOpen) {poseOpen = on;$('#pose-panel').hidden = !on;$<HTMLButtonElement>('#pose-toggle').setAttribute('aria-pressed', String(on));if (on) {if (view.layout !== 'assembly') setLayout('assembly');if (view.turntable) {view.setTurntable(false);renderStage();}buildPose();}}
$<HTMLButtonElement>('#pose-toggle').onclick = () => togglePose();
for (const root of [$('#pose-panel'), $('#panel')]) {
  root.addEventListener('input', (e) => {const slider=POSE_SLIDERS.find(row=>row[1]===eventElement(e).dataset.pose);if(!slider)return;const id=slider[1];readyToPose();cancelAnimationFrame(poseTween);poseUI[id] = +valueElement(e).value;applyPose();syncPose();});
  root.addEventListener('dblclick', (e) => {const row = eventElement(e).closest<HTMLElement>('.pose-row');if (!row) return;const id = required(required(row.querySelector<HTMLElement>('[data-pose]')).dataset.pose);readyToPose();poseTo({ ...poseUI, [id]: 0 });});
  root.addEventListener('click', (e) => {
    if (eventElement(e).closest<HTMLElement>('#pose-close')) return togglePose(false);
    if (eventElement(e).closest<HTMLElement>('[data-pose-reset]')) {readyToPose();return poseTo({});}
    const p = eventElement(e).closest<HTMLElement>('[data-pose-preset]');if (p) {readyToPose();$$('[data-pose-preset]').forEach((b) => b.classList.toggle('on', b.dataset.posePreset === p.dataset.posePreset));poseTo(required(POSE_PRESETS[Number(p.dataset.posePreset)])[1]);}
  });
}
$<HTMLButtonElement>('#side-toggle').onclick = () => toggleSide();
$('#views').onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-view]');if (!b) return;focused = false;focusKey = '';$$('#views button').forEach((x) => x.classList.toggle('on', x === b));view.view(required(b.dataset.view));};
$('#layouts').onclick = (e) => {const b = eventElement(e).closest<HTMLElement>('[data-layout]');if (b) setLayout(required(b.dataset.layout));};
$<HTMLButtonElement>('#spin').onclick = () => {if (view.layout === 'arrange') return toast(_message("text.0305"));const on = !view.turntable;view.setTurntable(on);if (!on) view.resetSpin();renderStage();};
// ---------- background: four distinct presets, 自动, and a picker for any colour ----------
const BG_SWATCHES = ['#F4F1EA', '#F3E3CF', '#F9DCD3', '#F6E9A8', '#DCEBD6', '#D2E8E2', '#D6E4F5', '#E3DDF4', '#B9C3D6', '#6F7789', '#2B3A55', '#1B1D24'];
function hexToHsl(hex:string) {const n = parseInt(hex.slice(1), 16),r = (n >> 16 & 255) / 255,g = (n >> 8 & 255) / 255,b = (n & 255) / 255,mx = Math.max(r, g, b),mn = Math.min(r, g, b),l = (mx + mn) / 2,d = mx - mn;let h = 0,s = 0;if (d) {s = d / (1 - Math.abs(2 * l - 1));h = (mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;if (h < 0) h += 360;}return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };}
function hslToHex(h:number, s:number, l:number) {s /= 100;l /= 100;const k = (n:number) => (n + h / 30) % 12,a = s * Math.min(l, 1 - l),f = (n:number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');return ('#' + f(0) + f(8) + f(4)).toUpperCase();}
function paintBg() {
  const st = $('#stage');st.style.setProperty('--bgc', bgCustom);$<HTMLButtonElement>('#bg-custom').style.setProperty('--c', bgCustom);
  const dark = st.dataset.bg === 'custom' && lum(bgCustom) < .3 || st.dataset.bg === 'night' || st.dataset.bg === 'mid';st.classList.toggle('dark-bg', dark);
}
function syncBgPop() {const c = hexToHsl(bgCustom);$<HTMLInputElement>('#bg-h').value = String(c.h);$<HTMLInputElement>('#bg-s').value = String(Math.min(80, c.s));$<HTMLInputElement>('#bg-l').value = String(c.l);$('#bg-chip').style.background = bgCustom;if (document.activeElement !== $<HTMLInputElement>('#bg-hex')) $<HTMLInputElement>('#bg-hex').value = bgCustom;$('#bg-pop').style.setProperty('--sl', `hsl(${c.h} 60% 55%)`);$$('#bg-swatches [data-bgc]').forEach((b) => b.classList.toggle('on', b.dataset.bgc === bgCustom));}
function setBg(hex:string) {bgCustom = hex.toUpperCase();bgPref = 'custom';try {localStorage.setItem(KEY + '-bg', 'custom');localStorage.setItem(KEY + '-bgc', bgCustom);} catch {}renderStage();syncBgPop();}
$('#bg-swatches').innerHTML = BG_SWATCHES.map((c) => `<button data-bgc="${c}" style="--c:${c}" title="${_attr(c)}"></button>`).join('');
$('#bgs').onclick = (e) => {
  if (eventElement(e).closest<HTMLElement>('#bg-pop')) {const sw = eventElement(e).closest<HTMLElement>('[data-bgc]');if (sw) setBg(required(sw.dataset.bgc));
    // Random keeps to backgrounds that flatter a duck: soft pastels most of the time, sometimes a deep tone.
    if (eventElement(e).closest<HTMLElement>('#bg-random')) {const h = Math.floor(Math.random() * 360),dark = Math.random() < .3;setBg(hslToHex(h, dark ? 25 + Math.random() * 20 : 30 + Math.random() * 30, dark ? 12 + Math.random() * 10 : 84 + Math.random() * 9));}
    return;}
  const b = eventElement(e).closest<HTMLElement>('[data-bg]');if (!b) return;
  if (b.dataset.bg === 'custom') {const pop = $('#bg-pop'),wasOn = bgPref === 'custom';bgPref = 'custom';try {localStorage.setItem(KEY + '-bg', 'custom');} catch {}renderStage();pop.hidden = wasOn ? !pop.hidden : false;if (!pop.hidden) syncBgPop();return;}
  $('#bg-pop').hidden = true;bgPref = required(required(b.dataset.bg));try {localStorage.setItem(KEY + '-bg', bgPref);} catch {}renderStage();
};
$('#bgs').addEventListener('input', (e) => {
  if (['bg-h', 'bg-s', 'bg-l'].includes(eventElement(e).id)) return setBg(hslToHex(+$<HTMLInputElement>('#bg-h').value, +$<HTMLInputElement>('#bg-s').value, +$<HTMLInputElement>('#bg-l').value));
  if (eventElement(e).id === 'bg-hex') {const v = valueElement(e).value.trim();if (/^#?[\da-f]{6}$/i.test(v)) setBg(v.startsWith('#') ? v : '#' + v);}
});
document.addEventListener('click', (e) => {if (!eventElement(e).closest<HTMLElement>('#bgs')) $('#bg-pop').hidden = true;});

// ---------- export review: /api/plan checks every part, /api/export writes the recoloured 3MF ----------
let plan:ExportPlan|null = null;
async function openExport() {
  const dlg = $<HTMLDialogElement>('#export-dialog'),body = $('#export-body');body.innerHTML = `<p class="muted">${_t("text.0306")}</p>`;if (!dlg.open) dlg.showModal();
  // Only unbound target colours need matching; real catalogue identities pass through unchanged.
  const pending = parts.filter((p) => !design.assignments[p.id] || products.get((design.assignments[p.id])??'')?.demo);
  if (pending.length) {
    const keys = [...new Set(pending.map((p) => keyOf(p.id)))];
    body.innerHTML = `<p class="ex-status">${_t("text.0308", { v0: pending.length })}</p>
      <ul class="bom">${keys.map((k) => {const n = nearestBambu(keyHex(k), kindOf(products.get((k)??'') || { material: partKind(knownPart(required(pending.find((p) => keyOf(p.id) === k)).id)) === 'TPU' ? 'TPU' : 'PLA' }));return `<li><i style="--c:${keyHex(k)}"></i><span>${esc(keyName(k))}<small>${_t("text.0307", { v2: countOf(k), v3: esc(n.name), v4: n.colorCode })}</small></span><b style="--c:${n.hex}" class="to-chip"></b></li>`;}).join('')}</ul>
      <div class="sheet-foot"><button class="ghost-btn" data-close-export>${_t("text.0309")}</button><button class="primary" id="match-bambu">${_t("text.0310")}</button></div>`;
    required(body.querySelector<HTMLButtonElement>('[data-close-export]')).onclick = () => dlg.close();
    $<HTMLButtonElement>('#match-bambu').onclick = () => {const next = clone(design);for (const p of pending) {const n = nearestBambu(required(design.colors[p.id]), partKind(p));next.colors[p.id] = n.hex.toUpperCase();next.assignments[p.id] = n.id;}commit(next, _message("text.0311", { v0: pending.length }));openExport();};
    return;
  }
  try {
    plan = await api('POST', '/plan', { source_sha256: model.source_sha256, name, assignments: design.assignments });const report=required(plan),usedSlots = report.slots.filter((s) => s.used);
    body.innerHTML = `<div class="ex-stats"><span><b>6</b>${_t("text.0245")}</span><span><b>35</b>${_t("text.0315")}</span><span><b>${usedSlots.length}</b>${_t("text.0316")}</span><span><b>${report.slots.length}</b>${_t("text.0317")}</span></div>
    <div class="ex-products">${usedSlots.map((s) => {const p = s.product,n = report.parts.filter((x) => x.slot === s.slot).length;return `<div class="ex-p"><i style="--c:${p.hex}"></i><span><b>${esc(p.brand)} · ${esc(p.series)} · ${esc(_label(p.name))}</b><small>${_t('filament.slot',{code:p.colorCode||p.skus?.[0]||'—',count:n,slot:s.slot})}</small></span><a href="${_attr(p.productUrl||p.sourceUrl)}" target="_blank" rel="noreferrer">${_t("text.0314")}</a></div>`;}).join('')}</div>
    <details class="ex-parts"><summary>${_t("text.0318")}</summary><table><thead><tr><th>${_t("text.0319")}</th><th>${_t("text.0315")}</th><th>${_t("text.0243")}</th><th>${_t("text.0320")}</th></tr></thead><tbody>${report.parts.map((p) => `<tr><td>${p.plate}</td><td>${p.id} ${esc(_label(p.name))}</td><td>${esc(productLabel(p.product))}</td><td>${p.slot}</td></tr>`).join('')}</tbody></table></details>
    <ul class="ex-notes">${report.warnings.map((w) => `<li>${esc(_label(w))}</li>`).join('')}</ul>
    <div class="sheet-foot"><button class="ghost-btn" id="dl-bom">${_t("text.0321")}</button><button class="primary" id="dl-3mf">${_t("text.0322")}</button></div><p class="ex-status" id="ex-status"></p>`;
    $<HTMLButtonElement>('#dl-bom').onclick = downloadBOM;$<HTMLButtonElement>('#dl-3mf').onclick = download3MF;
  } catch (error) {body.innerHTML = `<p class="warn">${esc(errorMessage(error))}</p>`;}
}
async function download3MF() {
  const btn = $<HTMLButtonElement>('#dl-3mf'),status = $('#ex-status');btn.disabled = true;status.textContent = _t("text.0323");
  try {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const thumbnails = await renderExportThumbnails(duck, design.colors, {binaryUpload:true,view});
    const body=new FormData();body.append('plan',jsonStringify({source_sha256:model.source_sha256,name,assignments:design.assignments}));
    for(const [key,blob] of Object.entries(thumbnails))body.append(key,blob,key+'.png');
    const r = await fetch('/api/export', { method: 'POST', body });
    if (!r.ok) throw Error(errorText(await r.json().catch(() => ({}))));
    const a = document.createElement('a');a.href = URL.createObjectURL(await r.blob());a.download = 'XGO-Duck-' + name + '-materials.3mf';a.click();setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    status.textContent = _t("text.0325");
  } catch (error) {status.textContent = errorMessage(error);} finally
  {btn.disabled = false;}
}
function nearestBambu(hex:string, kind:string):Product {return required(catalog.products.filter((p) => brandId(p)==='bambu'&&compatibleProduct(kind==='TPU'?'TPU 90A':'PLA Basic',p)).map<[Product,number]>((p) => [p, deltaE(hex, p.hex)]).sort((x, y) => x[1] - y[1])[0])[0];}
function downloadBOM() {
  const rows=[[_t('text.0326'),_t('text.0319'),_t('text.0327'),_t('text.0328'),_t('text.0329'),_t('text.0330'),_t('filament.series'),_t('text.0331'),_t('text.0332'),'SKU',_t('filament.productId'),_t('text.0333'),_t('text.0334'),_t('filament.multiColours'),_t('text.0335'),_t('filament.profile'),_t('text.0337'),_t('text.0338')],...materialRows(required(plan),_label)];
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csvText(rows)],{type:'text/csv;charset=utf-8'}));a.download = 'XGO-Duck-' + name + '-BOM.csv';a.click();$('#ex-status').textContent = _t("text.0339");
}
$$('dialog [data-close]').forEach((b) => b.onclick = () => required(b.closest<HTMLDialogElement>('dialog')).close());

// ---------- publish + evolution ceremony ----------
const byline = () => account.user ? `${_t("text.0340", { v0: avatarHTML(account.user) })}<b>${esc(account.user.name)}</b>` : _t("text.0341");
async function openPublish() {
  if (personal) return;
  if (parts.some((p) => !design.assignments[p.id] || products.get((design.assignments[p.id])??'')?.demo)) {showTab = 'print';renderPanel();return toast(_message("text.0342"));}
  try {await requireLogin(_message("text.0343"));} catch {return;}
  $<HTMLImageElement>('#publish-preview').src = view.snapshot(640, 520, { angle: 'hero' }).toDataURL('image/png');$<HTMLInputElement>('#publish-title').value = name;$('#publish-by').innerHTML = byline();
  $('#publish-source').textContent = provenance ? _t("text.0344", { v0: provenanceFields(provenance).title, v1: provenanceFields(provenance).author }) : _t("text.0345");$<HTMLDialogElement>('#publish-dialog').showModal();
}
$<HTMLFormElement>('#publish-form').onsubmit = async (e) => {
  e.preventDefault();const title = $<HTMLInputElement>('#publish-title').value.trim() || name,submitter = e.submitter || $<HTMLButtonElement>('#publish-form [type=submit]'),btn=submitter instanceof HTMLButtonElement||submitter instanceof HTMLInputElement?submitter:null;if (btn) btn.disabled = true;
  // Publishing also keeps a private copy in 我的方案; the work itself is a new public version.
  let work:Work;
  try {name = title;saveScheme(false);work = await api('POST', '/works', { title, description: $<HTMLTextAreaElement>('#publish-desc').value.trim(), design: { colors: clone(design.colors), assignments: clone(design.assignments), finishes: clone(design.finishes || {}) }, provenance, parentId: (isRecord(provenance)?provenance.workId:undefined) || null, schemeId: activeId });}
  catch (err) {toast(_message("text.0346", { v0: ()=>errorMessage(err) }));return;} finally
  {if (btn) btn.disabled = false;}
  $<HTMLDialogElement>('#publish-dialog').close();
  const goGallery = () => {location.href = './gallery/#d/' + work.id;};
  if (!$<HTMLInputElement>('#publish-evolve').checked) {toast(_message("text.0347", { v0: title }));setTimeout(goGallery, 700);return;}
  evolution.play({ name: title, author: required(account.user).name, before: ORIGINAL, after: design, sound: $<HTMLInputElement>('#publish-sound').checked, onDone: goGallery, onPoster: () => poster.open({ workId: work.id, design: { ...work.design, name: work.title, author: work.author.name }, before: ORIGINAL }) });
};

// ---------- keyboard ----------
window.addEventListener('keydown', (e) => {
  if (eventElement(e).matches('input,textarea,select') || document.querySelector('dialog[open]') || !$('#evo').hidden) return;
  const k = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && k === 'z') {e.preventDefault();(e.shiftKey ? $<HTMLButtonElement>('#redo') : $<HTMLButtonElement>('#undo')).click();return;}
  if ((e.metaKey || e.ctrlKey) && k === 's') {e.preventDefault();saveScheme(false);return;}
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === 'Space' && !e.repeat) {e.preventDefault();comparison.start();return;}
  if (step === 1) {
    const list = squad(),tabs = ['classic', 'dice', 'mine'];
    if (k === 'r') rerollAll();else if (/^[1-4]$/.test(k) && list[+k - 1]) applyStart(required(list[+k - 1])[0]);
    else if (k === 'arrowright' || k === 'arrowleft') {const next = tabs[tabs.indexOf(startTab) + (k === 'arrowright' ? 1 : -1)];if (next) setStartTab(next);}
    else if (k === 'enter' && !eventElement(e).closest<HTMLElement>('button,a')) goStep(2);
    return;
  }
  if (k === '1' || k === '2' || k === '3') {setLayout(['assembly', 'explode', 'arrange'][+k - 1]);return;}
  if (k === 'f') return setFocused(!focused);
  if (step !== 2) return;
  if (k === 'p') return toggleSide();
  if (k === 'escape' || k === 'v') setTool('select');else if (k === 'b') setTool(tool === 'brush' ? 'select' : 'brush');else if (k === 'i') setTool('pick');
});
window.addEventListener('keyup', (e) => {if (e.code === 'Space') comparison.stop();});

// ---------- misc ----------
let toastTimer:ReturnType<typeof setTimeout>|undefined,lastToast:{msg:Notification;withUndo:boolean|(()=>void)|undefined}|undefined;
function renderToast(){
 const t=$('#toast');if(!lastToast||!t.classList.contains('show'))return;
 const {msg,withUndo}=lastToast;t.innerHTML=esc(typeof msg==='function'?msg():msg)+(withUndo?` <button id="toast-undo">${_t('text.0348')}</button>`:'');
 document.querySelector<HTMLButtonElement>('#toast-undo')?.addEventListener('click',()=>{typeof withUndo==='function'?withUndo():$<HTMLButtonElement>('#undo').click();t.classList.remove('show');});
}
function toast(msg:Notification,withUndo?:boolean|(()=>void)){lastToast={msg,withUndo};$('#toast').classList.add('show');renderToast();clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3600);}
const COACH = KEY + '-coach';let seen = !!read(COACH);
// The assembly guide shows this picture of the duck in the same stage until its own model has loaded.
function handOff() {
  try {const r = view.canvas.getBoundingClientRect(),s = Math.min(devicePixelRatio, 1.5);
    sessionStorage.setItem('dd-handoff', jsonStringify({ at: Date.now(), image: view.snapshot(Math.round(r.width * s), Math.round(r.height * s)).toDataURL('image/webp', .85) }));} catch {}
}
// Unsaved work becomes a scheme before something replaces the draft.
async function backupDraft() {
  if (dirty() && schemes.length < 30) {const s = { id: newId(), name: _t("text.0349", { v0: name }), design: clone(design), provenance, voiceSalt, created: Date.now(), updated: Date.now() };
    if (personal) {const result = await personalWrite('PUT', s.id, schemeBody(s));if (!result) throw Error(_t('personal.loadFailed'));Object.assign(s,result);}
    schemes.unshift(s);if (!personal) pushScheme(s);setTimeout(() => toast(_message("text.0350")), 2200);}
}
// "做同款" from the gallery arrives as #look=<配色码>&src=<title>|<author>|<workId>.
// Accepts a bare 配色码, a '#look=' fragment or a whole share link. Unsaved work is backed up first.
async function importLook(text:string, src = '') {
  const raw = String(text).trim(),code = (raw.match(/#look=([^&\s]+)/) || [, raw])[1];
  const d = decodeLook(parts, products, required(code)),[title, author, workId] = decodeURIComponent(src || '').split('|');
  await backupDraft();
  design = { colors: d.colors, assignments: d.assignments,finishes:{} };voiceSalt = 0;slots = slotsFromDesign(products, d.assignments, slots);name = _t("text.0351", { v0: d.name || title || _t("text.0352") });provenance = title ? { title, author: author || _t("text.0353"), ...(workId ? { workId } : {}) } : null;activeId = null;
  view.setColors(design.colors);stepsDone.add(1);persist();return d.name || title || _t("text.0354");
}
if (personal) {
  try {
    const result=await initialSchemes;if('error'in result)throw result.error;
    schemes = result.schemes??[];owner = null;
    if (!saved.draft && schemes.length) {
      const s = required(schemes[0]);design = clone(s.design);name = s.name;provenance = s.provenance;voiceSalt = s.voiceSalt;activeId = s.id;
      slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);
    }
    if (activeId && !schemes.some(s => s.id === activeId)) activeId = null;
    persist();
  } catch {schemes = [];activeId = null;toast(_message('personal.loadFailed'));}
} else {
  const accountUI = mountAccount($('#profile-slot'), { toast });
  if (await initAccount()) {accountUI.refresh();await syncSchemes(false);} else
  if (owner) {schemes = [];owner = null;activeId = null;persist();}
  onAccount(() => syncSchemes());
}
const look = location.hash.match(/^#look=([^&]+)(?:&src=(.*))?$/),openId = location.hash.match(/^#scheme=(.+)$/);
if (look) {try {const n = await importLook(required(look[1]), look[2]);step = 2;seen = true;setTimeout(() => toast(_message("text.0355", { v0: n })), 300);} catch (error) {toast(errorMessage(error));}history.replaceState(null, '', location.pathname);}
// 我的方案 in the gallery opens a saved scheme here with #scheme=<id>.
if (openId) {const s = schemes.find((x) => x.id === decodeURIComponent(required(openId[1])));if (s) {design = clone(s.design);name = s.name;provenance = s.provenance || null;voiceSalt = s.voiceSalt || 0;activeId = s.id;slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);stepsDone.add(1);step = 2;seen = true;persist();setTimeout(() => toast(_message("text.0071", { v0: s.name })), 300);}history.replaceState(null, '', location.pathname);}
// 或者新开一只 on the personal home page arrives as #new: start again from the original colours.
// With no room left to back up unsaved work, the draft stays open instead of being lost.
if (location.hash === '#new') {
  if (dirty() && schemes.length >= 30) setTimeout(() => toast(_message("text.0066")), 300);
  else try {
    await backupDraft();
    design = clone(ORIGINAL);name = _t("text.0047");provenance = null;voiceSalt = 0;activeId = null;
    slots = slotsFromDesign(products, design.assignments, slots);view.setColors(design.colors);stepsDone.clear();step = 1;persist();
  } catch (error) {toast(errorMessage(error));}
  history.replaceState(null, '', location.pathname);
}
if (!personal && (!seen || location.hash === '#coach')) $('#coach').hidden = false;
const coachDone = () => {$('#coach').hidden = true;try {localStorage.setItem(COACH, '1');} catch {}};
$<HTMLButtonElement>('#coach-go').onclick = coachDone;
$<HTMLButtonElement>('#coach-login').hidden = personal || !!account.user;$<HTMLButtonElement>('#coach-login').onclick = () => {coachDone();requireLogin('').catch(() => {});};
if(step!==1){view.stage.root.visible=true;view.stage.shadow.visible=true;}
const studioProto = { view, actions, get state() {return { step, sel, tool, brush, name, activeId, dirty: dirty(), schemes: schemes.length, locks: [...locks], undo: undo.length, layout: view.layout, sideOn, focused, splitOn, compareId, replaceFrom, colors: design.colors, provenance };} };window.studioProto=studioProto;
renderAll();if(step===1)await view.stage.prepareLineup();$('#loading').remove();performance.mark('duck-ready');
declare global {interface Window {studioProto:typeof studioProto}}
_onLocale(() => {CLASSICS = CLASSICS.map(([id, , d], i) => [id, i ? required(THEMES[required([1,2,6][i-1])]).name : _t("text.0117"), d]);POSE_SLIDERS = [[_t("text.0283"), 'jaw', _t("text.0284"), 0, 28, '°'], [_t("text.0283"), 'headPitch', _t("text.0285"), -30, 50, '°'], [_t("text.0283"), 'headYaw', _t("text.0286"), -45, 45, '°'], [_t("text.0283"), 'headRoll', _t("text.0287"), -15, 15, '°'], [_t("text.0283"), 'neck', _t("text.0288"), -20, 80, '°'], [_t("text.0289"), 'crouch', _t("text.0290"), 0, 100, '%'], [_t("text.0289"), 'trunk', _t("text.0291"), -15, 25, '°'], [_t("text.0292"), 'legL', _t("text.0293"), 0, 100, '%'], [_t("text.0292"), 'legR', _t("text.0294"), 0, 100, '%']];MOVE_POSES = [[_t("text.0284"), '😮', 1], [_t("text.0295"), '👇', 2], [_t("text.0293"), '🦵', 4], [_t("text.0287"), '🤔', 5]];POSE_PRESETS = [[_t("text.0296"), {}], [_t("text.0297"), { jaw: 24, headPitch: -20 }], [_t("text.0295"), { neck: 45, headPitch: 35 }], [_t("text.0298"), { crouch: 100, trunk: -15, neck: -8 }], [_t("text.0293"), { legL: 70, headRoll: 6 }], [_t("text.0299"), { headRoll: 12, headYaw: 20, jaw: 8 }]];});

_onLocale(() => {
  const active = document.activeElement,focusId = active?.id;
  const inputs = [...document.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('#panel input,#panel textarea,#panel select')].map((e) => ({ id: e.id, value: e.value, checked: e instanceof HTMLInputElement?e.checked:undefined }));
  voiceKey = '';miniKey = '';renderAll();bindTranslations();renderHeader();renderStage();
  if (poseOpen) buildPose();
  renderToast();
  if ($<HTMLDialogElement>('#export-dialog').open && !document.querySelector<HTMLButtonElement>('#dl-3mf')?.disabled) openExport();
  if ($<HTMLDialogElement>('#publish-dialog').open) {$('#publish-by').innerHTML = byline();$('#publish-source').textContent = provenance ? _t('text.0344', { v0: provenanceFields(provenance).title, v1: provenanceFields(provenance).author }) : _t('text.0345');}
  for (const old of inputs) {const e = old.id && document.getElementById(old.id);if (e instanceof HTMLInputElement||e instanceof HTMLSelectElement||e instanceof HTMLTextAreaElement) {e.value = old.value;if(e instanceof HTMLInputElement&&old.checked!==undefined)e.checked = old.checked;}}
  if (focusId) document.getElementById(focusId)?.focus();
});
