// Personal edition home: 想涂鸭 opens the studio, 想做鸭 the assembly tutorial (approved prototype v2). Both cards show
// the MicroDuck sticker in the studio's current draft (read from the studio's own browser storage), so nothing is
// loaded from the server except /api/site.
import { applyBrand } from '../shared/brand.mjs';
import { readDraft } from '../shared/draft.mjs';
import { loadSite } from '../shared/edition.mjs';
import { t, getLocale, onLocale } from '../shared/i18n.mjs';

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const site = await loadSite().catch(() => null);
// The server edition opens its studio at /; this page belongs to the personal edition only.
if (site && site.edition !== 'personal') location.replace('./');
applyBrand();

// Each coloured area of the sticker is a part of the real duck; the sticker's own colours stand in until you paint.
const SLOTS = { head: 'P4-01', face: 'P2-06', jaw: 'P2-01' };
const CLASSIC = { head: '#F4EEE0', face: '#9EA1A8', jaw: '#F2761C', paint: '#2F6BE3' };
// The brush is dipped in the scheme's liveliest colour; a grey-and-white duck keeps the sticker's blue paint.
function paintOf(colors) {
  const chroma = (hex) => {const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));return Math.max(...n) - Math.min(...n);};
  const best = [colors.jaw, colors.face, colors.head].sort((a, b) => chroma(b) - chroma(a))[0];
  return chroma(best) > 40 ? best : CLASSIC.paint;
}
function readDraftSlots() {
  const draft = readDraft();
  if (!draft) return null;
  const colors = Object.fromEntries(Object.entries(SLOTS).map(([slot, id]) => [slot, /^#[0-9A-F]{6}$/i.test(draft.colors[id] || '') ? draft.colors[id] : CLASSIC[slot]]));
  return { ...draft, colors: { ...colors, paint: paintOf(colors) } };
}

// The approved MicroDuck sticker, redrawn as vectors, holding a brush (想涂鸭) or a wrench (想做鸭).
const OUTLINE = 'M40 156 C30 96 66 34 140 30 C210 26 262 56 276 108 L280 150 C296 150 306 164 300 182 C294 198 276 204 258 202 L74 206 C54 206 42 194 42 180 Z';
const BRUSH = `<g class="tool brush">
  <path d="M24 204 L210 170" stroke="#17243c" stroke-width="19" stroke-linecap="round"/><path d="M24 204 L210 170" stroke="#e9b77c" stroke-width="13" stroke-linecap="round"/>
  <path d="M36 198 L198 169" stroke="#fff" stroke-opacity=".4" stroke-width="4" stroke-linecap="round"/>
  <path d="M204 158 L234 153 L238 178 L208 184 Z" fill="#cfd5df" stroke="#17243c" stroke-width="3" stroke-linejoin="round"/><path d="M214 158 L218 181 M224 156 L228 179" stroke="#8d96a8" stroke-width="2.5"/>
  <path d="M236 152 C252 146 266 146 276 152 C281 159 281 170 276 175 C266 180 252 180 239 178 Z" fill="#8a5a33" stroke="#17243c" stroke-width="3" stroke-linejoin="round"/>
  <path d="M244 156 L270 154 M244 166 L274 165 M244 174 L270 175" stroke="#5e3c20" stroke-width="1.6" opacity=".6"/>
  <path class="part" d="M266 146 C280 136 300 138 308 150 C314 160 306 172 294 174 C290 186 280 192 274 182 C266 180 266 170 270 165 C262 160 260 150 266 146 Z" style="fill:var(--paint)" stroke="#17243c" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="292" cy="152" r="4" fill="#fff" opacity=".7"/>
</g>
<g class="splat"><circle cx="300" cy="200" r="6" style="fill:var(--paint)"/><circle cx="314" cy="188" r="3.5" style="fill:var(--paint)"/><circle cx="286" cy="212" r="3" style="fill:var(--paint)"/></g>`;
const WRENCH = `<g class="tool wrench">
  <path d="M30 202 L228 172" stroke="#17243c" stroke-width="21" stroke-linecap="round"/><path d="M30 202 L228 172" stroke="#c3cad6" stroke-width="15" stroke-linecap="round"/>
  <path d="M42 196 L218 170" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>
  <circle cx="34" cy="201" r="13" fill="#c3cad6" stroke="#17243c" stroke-width="3.5"/><circle cx="34" cy="201" r="5.5" fill="#fff" stroke="#17243c" stroke-width="2.5"/>
  <path d="M222 156 C236 144 262 144 278 156 L266 168 L278 182 C262 194 236 194 222 182 Z" fill="#c3cad6" stroke="#17243c" stroke-width="3.5" stroke-linejoin="round"/>
</g>
<g class="nut"><path d="M266 158 L278 164 L278 178 L266 184 L254 178 L254 164 Z" fill="#9aa3b4" stroke="#17243c" stroke-width="3" stroke-linejoin="round"/><circle cx="266" cy="171" r="4.5" fill="#5b6377"/></g>`;
const DUCK = (tool) => `<defs><filter id="shadow-${tool}" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#17243c" flood-opacity=".18"/></filter></defs>
<path d="${OUTLINE}" fill="#fff" stroke="#fff" stroke-width="20" stroke-linejoin="round" filter="url(#shadow-${tool})"/>
<path class="part" d="M48 152 C40 98 72 44 140 40 C204 36 250 64 262 110 L266 152 Z" style="fill:var(--head)" stroke="#17243c" stroke-width="4" stroke-linejoin="round"/>
<path d="M66 128 C64 92 90 60 136 54" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="8" stroke-linecap="round"/>
<path d="M60 152 C54 104 86 58 142 54" fill="none" stroke="#17243c" stroke-opacity=".12" stroke-width="3"/>
<path class="part" d="M130 152 C124 108 148 72 194 68 C232 66 256 88 262 124 L264 152 Z" style="fill:var(--face)" stroke="#17243c" stroke-width="4" stroke-linejoin="round"/>
<path d="M144 146 C140 112 156 88 190 82" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="7" stroke-linecap="round"/>
<path class="part" d="M200 120 C216 122 226 136 222 152 L196 152 C204 142 206 132 200 120 Z" style="fill:var(--jaw)" stroke="#17243c" stroke-width="3" stroke-linejoin="round"/>
<path d="M126 98 L98 94" stroke="#17243c" stroke-width="9" stroke-linecap="round"/>
<g stroke="#17243c" stroke-width="5" stroke-linejoin="round">
  <path d="M120 86 L196 84 C200 84 202 86 202 90 L200 116 C198 128 190 134 176 134 L142 134 C128 134 122 126 121 114 Z" fill="#1d2230"/>
  <path d="M206 84 L276 82 C280 82 282 84 282 88 L280 114 C278 126 270 132 256 132 L224 132 C212 132 206 124 205 112 Z" fill="#1d2230"/>
  <path d="M196 92 C200 88 204 88 208 92" fill="none" stroke-width="7"/>
</g>
<path d="M134 92 L160 92 L144 126 L132 124 Z M218 90 L242 90 L226 122 L214 120 Z" fill="#fff" opacity=".2"/>
<path d="M170 92 L178 92 L160 128 L154 128 Z M250 90 L256 90 L240 124 L234 124 Z" fill="#fff" opacity=".12"/>
<circle cx="126" cy="91" r="2.6" fill="#c9cfdc"/><circle cx="276" cy="89" r="2.6" fill="#c9cfdc"/>
<path class="part" d="M46 150 L270 150 C274 150 276 152 276 156 L276 166 L46 166 Z" style="fill:var(--jaw)" stroke="#17243c" stroke-width="4" stroke-linejoin="round"/>
<path class="part" d="M58 168 L266 168 C282 168 292 176 292 186 C292 196 282 202 266 202 L74 202 C64 202 58 196 58 186 Z" style="fill:var(--jaw)" stroke="#17243c" stroke-width="4" stroke-linejoin="round"/>
<path d="M72 176 L262 176" stroke="#fff" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>
<path class="part" d="M46 128 C46 118 52 112 62 112 L76 112 L76 170 L98 196 L54 196 C48 196 42 192 42 184 Z" style="fill:var(--jaw)" stroke="#17243c" stroke-width="4" stroke-linejoin="round"/>
<circle cx="60" cy="132" r="7.5" fill="#1d2230"/><circle cx="60" cy="132" r="2.5" fill="#5b6377"/>
<circle cx="60" cy="158" r="6" fill="#c9cfdc" stroke="#17243c" stroke-width="2.5"/>
${tool === 'brush' ? BRUSH : WRENCH}
<g class="sparkles"><path d="M34 60 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/><path d="M290 48 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M306 116 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><path d="M18 128 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/></g>`;
const [paintDuck, buildDuck] = document.querySelectorAll('.duck');
paintDuck.innerHTML = DUCK('brush');buildDuck.innerHTML = DUCK('wrench');
const dress = (colors) => {for (const svg of [paintDuck, buildDuck]) for (const [slot, hex] of Object.entries(colors)) svg.style.setProperty('--' + slot, hex);};
const dots = (c) => [...new Set([c.head, c.face, c.jaw])].map((v) => `<i style="background:${esc(v)}"></i>`).join('');
const arrow = ' <span class="arrow" aria-hidden="true">→</span>';

function edited(time) {
  const seconds = (time - Date.now()) / 1000,format = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(seconds) >= size) return t('home.edited', { when: format.format(Math.round(seconds / size), unit) });
  return t('home.editedNow');
}

// The first visit after a new edit is a "just painted" one: sparkles and badges, once.
const SEEN = 'dd-home-seen';
function freshness(draft) {
  let seen = 0;try {seen = Number(localStorage.getItem(SEEN)) || 0;} catch {}
  if (!draft || draft.updated <= seen) return false;
  try {localStorage.setItem(SEEN, String(draft.updated));} catch {}
  return true;
}

let draft = null,fresh = false;
function render() {
  const name = draft && `<b>${esc(draft.name)}</b>`;
  $('#hello').textContent = t(draft ? 'home.helloBack' : 'home.hello');
  $('#lead').textContent = t(draft ? 'home.leadBack' : 'home.lead');
  dress(draft?.colors || CLASSIC);
  for (const card of document.querySelectorAll('.choice')) card.classList.toggle('fresh', fresh);

  $('#paint-context').innerHTML = draft
    ? `<span class="sw">${dots(draft.colors)}</span><span class="grow">${name} · ${esc(t(draft.saved ? 'home.inSchemes' : 'home.draft'))}<small>${esc(edited(draft.updated))}</small></span>`
    : `<span class="icon" aria-hidden="true">🎨</span><span class="grow">${esc(t('home.paintStart'))}<small>${esc(t('home.paintStartSub'))}</small></span>`;
  $('#paint-go').innerHTML = (draft ? esc(t('home.continue', { name: draft.name })) : esc(t('home.paintGo'))) + arrow;
  $('#paint-alt').hidden = !draft;

  const go = $('#build-go');
  if (!site?.assembly) {
    go.removeAttribute('href');go.setAttribute('aria-disabled', 'true');go.textContent = t('home.soonGo');
    $('#build-context').innerHTML = `<span class="icon" aria-hidden="true">🧩</span><span class="grow">${esc(t('home.soon'))}<small>${esc(t('home.soonSub'))}</small></span>`;
    return;
  }
  go.href = './assemble/';go.removeAttribute('aria-disabled');
  go.innerHTML = esc(t(draft ? 'home.buildWith' : 'home.buildGo')) + arrow;
  $('#build-context').innerHTML = draft
    ? `<span class="sw">${dots(draft.colors)}</span><span class="grow">${t('home.withColors', { name })}<small>${esc(t('home.withColorsSub'))}</small></span>`
    : `<span class="icon" aria-hidden="true">🦆</span><span class="grow">${esc(t('home.blank'))}<small>${esc(t('home.blankSub'))}</small></span>`;
}
function load() {draft = readDraftSlots();fresh = freshness(draft);render();}
onLocale(render);
// Coming back with the browser's back button shows the draft as the studio left it.
addEventListener('pageshow', (e) => {if (e.persisted) load();});
load();
