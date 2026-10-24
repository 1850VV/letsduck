// Personal edition home: 想涂鸦 opens the studio, 想做鸭 the assembly tutorial. Both cards show the duck
// in the studio's current draft (read from the studio's own browser storage), so nothing is loaded from the server
// except /api/site.
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

// One printed part stands for each area of the drawing; servos, boards and screws keep their real colours.
const SLOTS = { head: 'P4-01', accent: 'P2-06', body: 'P5-06', leg: 'P5-01', foot: 'P2-03' };
const BLANK = { head: '#F8F9FC', accent: '#DFE4EE', body: '#F8F9FC', leg: '#F8F9FC', foot: '#F8F9FC' };
// Decorative outfits the 想涂鸦 duck tries on while hovered.
const OUTFITS = [
  { head: '#2F6BE3', accent: '#2F6BE3', body: '#EFE2BF', leg: '#EFE2BF', foot: '#2F6BE3' },
  { head: '#F4D23E', accent: '#F4D23E', body: '#F7F7F2', leg: '#F7F7F2', foot: '#F39A2B' },
  { head: '#EC3FA8', accent: '#3341D8', body: '#3341D8', leg: '#3341D8', foot: '#EC3FA8' },
  { head: '#E8483A', accent: '#E8483A', body: '#F4F4F1', leg: '#F4F4F1', foot: '#E8483A' },
  { head: '#6FD6D0', accent: '#6FD6D0', body: '#F4F4F1', leg: '#F4F4F1', foot: '#F5C540' },
];

function readDraftSlots() {
  const draft = readDraft();
  return draft && { ...draft, colors: Object.fromEntries(Object.entries(SLOTS).map(([slot, id]) => [slot, draft.colors[id] || BLANK[slot]])) };
}

const DUCK = `<ellipse cx="100" cy="236" rx="72" ry="8" fill="rgba(23,36,60,.09)"/>
<line class="guide" x1="100" y1="44" x2="100" y2="244" stroke="#c4521a" stroke-width="1.3" stroke-dasharray="3 5" opacity=".55"/>
<g class="part" data-p="feet"><rect class="printed" x="50" y="214" width="46" height="15" rx="6" style="fill:var(--foot)"/><rect class="printed" x="104" y="214" width="46" height="15" rx="6" style="fill:var(--foot)"/></g>
<g class="part" data-p="legs"><rect class="hw" x="62" y="172" width="26" height="44" rx="5"/><rect class="hw" x="112" y="172" width="26" height="44" rx="5"/><rect class="printed" x="58" y="180" width="34" height="17" rx="6" style="fill:var(--leg)"/><rect class="printed" x="108" y="180" width="34" height="17" rx="6" style="fill:var(--leg)"/></g>
<g class="part" data-p="hipL"><rect class="hw" x="42" y="138" width="28" height="28" rx="6"/><circle cx="56" cy="152" r="6.5" style="fill:var(--accent)"/></g>
<g class="part" data-p="hipR"><rect class="hw" x="130" y="138" width="28" height="28" rx="6"/><circle cx="144" cy="152" r="6.5" style="fill:var(--accent)"/></g>
<g class="part" data-p="body"><rect class="printed" x="60" y="124" width="80" height="50" rx="11" style="fill:var(--body)"/><rect x="70" y="160" width="60" height="5" rx="2.5" fill="rgba(23,36,60,.08)"/></g>
<g class="part" data-p="neck"><rect class="hw" x="86" y="78" width="28" height="52" rx="5"/><rect class="printed" x="83" y="110" width="34" height="9" rx="4" style="fill:var(--accent)"/><circle cx="114" cy="95" r="6.5" style="fill:var(--accent)"/></g>
<g class="part" data-p="head"><path class="printed" d="M28 80V62C28 41 50 28 88 28c38 0 62 13 68 36l3 16z" style="fill:var(--head)"/><rect x="28" y="74" width="131" height="6" rx="3" fill="rgba(23,36,60,.12)"/><circle cx="60" cy="56" r="13" fill="#fff" stroke="var(--dark)" stroke-width="5.5"/><circle cx="136" cy="60" r="3" fill="rgba(23,36,60,.18)"/><circle cx="146" cy="66" r="2.4" fill="rgba(23,36,60,.18)"/></g>
<g class="screw"><rect x="27" y="148" width="11" height="3" rx="1.5" fill="var(--metal)"/><rect x="25" y="146" width="3" height="7" rx="1" fill="var(--metal)"/></g>
<g class="screw"><rect x="162" y="148" width="11" height="3" rx="1.5" fill="var(--metal)"/><rect x="172" y="146" width="3" height="7" rx="1" fill="var(--metal)"/></g>`;
const [paintDuck, buildDuck] = document.querySelectorAll('.duck');
paintDuck.innerHTML = buildDuck.innerHTML = DUCK;
const dress = (svg, colors) => {for (const [slot, hex] of Object.entries(colors)) svg.style.setProperty('--' + slot, hex);};
const dots = (c) => [...new Set([c.head, c.body, c.accent, c.foot, '#2A2F3A'])].map((v) => `<i style="background:${esc(v)}"></i>`).join('');
const arrow = ' <span class="arrow" aria-hidden="true">→</span>';

function edited(time) {
  const seconds = (time - Date.now()) / 1000,format = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(seconds) >= size) return t('home.edited', { when: format.format(Math.round(seconds / size), unit) });
  return t('home.editedNow');
}

// 想涂鸦: the duck tries on outfits while the card is hovered or its button focused, then puts the draft back on.
const outfits = $('#outfits'),still = matchMedia('(prefers-reduced-motion: reduce)');
outfits.innerHTML = OUTFITS.map((o) => `<i style="background:${o.head}"></i>`).join('');
let draft = null,shown = -1,timer = null;
function wear(i) {
  shown = i;dress(paintDuck, i < 0 ? draft?.colors || OUTFITS[0] : OUTFITS[i]);
  outfits.querySelectorAll('i').forEach((dot, j) => dot.classList.toggle('on', j === (i < 0 && !draft ? 0 : i)));
}
const tryOn = () => {if (!timer && !still.matches) timer = setInterval(() => wear((shown + 1) % OUTFITS.length), 900);};
const stop = () => {clearInterval(timer);timer = null;wear(-1);};
const paintCard = $('#paint');
paintCard.addEventListener('mouseenter', tryOn);paintCard.addEventListener('mouseleave', stop);
$('#paint-go').addEventListener('focus', tryOn);$('#paint-go').addEventListener('blur', stop);

function render() {
  draft = readDraftSlots();
  const name = draft && `<b>${esc(draft.name)}</b>`;
  $('#hello').textContent = t(draft ? 'home.helloBack' : 'home.hello');
  $('#lead').textContent = t(draft ? 'home.leadBack' : 'home.lead');
  wear(-1);

  $('#paint-context').innerHTML = draft
    ? `<span class="sw">${dots(draft.colors)}</span><span class="grow">${name} · ${esc(t(draft.saved ? 'home.inSchemes' : 'home.draft'))}<small>${esc(edited(draft.updated))}</small></span>`
    : `<span class="icon" aria-hidden="true">🎨</span><span class="grow">${esc(t('home.paintStart'))}<small>${esc(t('home.paintStartSub'))}</small></span>`;
  $('#paint-go').innerHTML = (draft ? esc(t('home.continue', { name: draft.name })) : esc(t('home.paintGo'))) + arrow;
  $('#paint-alt').hidden = !draft;

  dress(buildDuck, draft?.colors || BLANK);
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
onLocale(render);
// Coming back with the browser's back button shows the draft as the studio left it.
addEventListener('pageshow', (e) => {if (e.persisted) render();});
render();
