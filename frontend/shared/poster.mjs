import { escapeAttribute as _attr } from "./i18n.mjs";import { t as _t, label as _label, onLocale as _onLocale } from "./i18n.mjs"; // Share dialog: preview first, then save / copy / share. The QR block is decorative for now (it encodes
// nothing); the 配色码 printed beside it is what carries the design.
import { encodeLook, designNotes } from '../lib/quick-style.mjs';
import { BRAND } from './brand.mjs';

const RATIOS = { '3:4': [1080, 1440, _t("text.0469")], '1:1': [1080, 1080, _t("text.0470")], '9:16': [1080, 1920, _t("text.0471")] };
const THEMES = { light: { bg: ['#f4f6fb', '#e3e8f5'], ink: '#17243c', muted: '#6b7891', brand: '#4d6bfe', card: '#ffffffcc' }, dark: { bg: ['#1a2140', '#0d1226'], ink: '#f3f5ff', muted: '#9aa6c6', brand: '#8fa2ff', card: '#ffffff14' } };
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function mix(hex, to, t) {const a = parseInt(hex.slice(1), 16),b = parseInt(to.slice(1), 16),c = (s) => Math.round((a >> s & 255) * (1 - t) + (b >> s & 255) * t);return `rgb(${c(16)},${c(8)},${c(0)})`;}

// Deterministic QR-looking block derived from the share code; marked as a placeholder in the dialog.
function fakeQR(ctx, x, y, size, seed, ink) {
  const n = 25,cell = size / n;let h = 2166136261;for (const ch of seed) {h ^= ch.charCodeAt(0);h = Math.imul(h, 16777619);}
  const rnd = () => {h ^= h << 13;h ^= h >>> 17;h ^= h << 5;return (h >>> 0) / 4294967296;};
  ctx.fillStyle = '#fff';ctx.beginPath();ctx.roundRect(x - 10, y - 10, size + 20, size + 20, 14);ctx.fill();ctx.fillStyle = ink;
  const finder = (fx, fy) => {ctx.fillRect(x + fx * cell, y + fy * cell, 7 * cell, 7 * cell);ctx.fillStyle = '#fff';ctx.fillRect(x + (fx + 1) * cell, y + (fy + 1) * cell, 5 * cell, 5 * cell);ctx.fillStyle = ink;ctx.fillRect(x + (fx + 2) * cell, y + (fy + 2) * cell, 3 * cell, 3 * cell);};
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {const inFinder = i < 8 && j < 8 || i > n - 9 && j < 8 || i < 8 && j > n - 9;if (!inFinder && rnd() < .48) ctx.fillRect(x + i * cell, y + j * cell, cell + .4, cell + .4);}
  finder(0, 0);finder(n - 7, 0);finder(0, n - 7);
}
function wrap(ctx, text, maxWidth) {const lines = [''];for (const ch of text) {const t = lines.at(-1) + ch;if (ctx.measureText(t).width > maxWidth) {lines.push(ch);} else lines[lines.length - 1] = t;}return lines;}

export function drawPoster({ view, design, parts, products, before, opts }) {
  const [W, H] = RATIOS[opts.ratio],t = THEMES[opts.theme === 'dark' ? 'dark' : 'light'],cv = document.createElement('canvas');cv.width = W;cv.height = H;const ctx = cv.getContext('2d');
  const used = [...new Set(parts.map((p) => design.assignments[p.id]))].map((id) => products.get(id)).filter(Boolean);
  const main = design.colors['P5-06'] || used[0]?.hex || '#4d6bfe';
  const g = ctx.createLinearGradient(0, 0, W * .3, H);
  if (opts.theme === 'tint') {g.addColorStop(0, mix(main, '#ffffff', .82));g.addColorStop(1, mix(main, '#ffffff', .6));} else {g.addColorStop(0, t.bg[0]);g.addColorStop(1, t.bg[1]);}
  ctx.fillStyle = g;ctx.fillRect(0, 0, W, H);
  const pad = 72,footH = 230,infoH = (opts.materials ? Math.ceil(used.length / 3) * 74 + 24 : 0) + 150,modelH = H - footH - infoH - 140;
  ctx.fillStyle = t.brand;ctx.font = '700 26px -apple-system,"PingFang SC",sans-serif';ctx.fillText(BRAND.zh + ' ' + BRAND.en + ' · XGO Duck V2', pad, 92);
  ctx.drawImage(view.snapshot(W, modelH, { colors: design.colors }), 0, 120);
  if (opts.compare && before) {const s = Math.round(W * .26),img = view.snapshot(s, Math.round(s * 1.15), { colors: before.colors });const x = W - pad - s,y = 140;ctx.fillStyle = t.card;ctx.beginPath();ctx.roundRect(x - 8, y - 8, s + 16, s * 1.15 + 52, 22);ctx.fill();ctx.drawImage(img, x, y);ctx.fillStyle = t.muted;ctx.font = '600 20px sans-serif';ctx.textAlign = 'center';ctx.fillText(_t("text.0472"), x + s / 2, y + s * 1.15 + 30);ctx.textAlign = 'left';}
  let y = 120 + modelH + 70;
  ctx.fillStyle = t.ink;ctx.font = '800 68px -apple-system,"PingFang SC",sans-serif';ctx.fillText(design.name || _t("text.0047"), pad, y);y += 52;
  ctx.fillStyle = t.muted;ctx.font = '28px -apple-system,"PingFang SC",sans-serif';ctx.fillText([opts.author && design.author, _t("text.0473", { v0: designNotes(design.colors, design.assignments).count }), _t("text.0474")].filter(Boolean).join(' · '), pad, y);y += 46;
  if (opts.materials) used.forEach((p, i) => {const x = pad + i % 3 * ((W - pad * 2) / 3),yy = y + Math.floor(i / 3) * 74;ctx.fillStyle = p.hex;ctx.beginPath();ctx.roundRect(x, yy, 50, 50, 12);ctx.fill();ctx.strokeStyle = '#0002';ctx.lineWidth = 2;ctx.stroke();ctx.fillStyle = t.ink;ctx.font = '600 24px "PingFang SC",sans-serif';ctx.fillText(p.name, x + 66, yy + 22);ctx.fillStyle = t.muted;ctx.font = '19px sans-serif';ctx.fillText(p.series + ' ' + p.colorCode, x + 66, yy + 47);});
  const code = lookCode(design, parts, products, false),fy = H - footH + 34,qr = 150;
  ctx.fillStyle = t.card;ctx.beginPath();ctx.roundRect(pad - 24, fy - 24, W - pad * 2 + 48, footH - 50, 28);ctx.fill();
  fakeQR(ctx, W - pad - qr, fy, qr, code, '#17243c');
  ctx.fillStyle = t.ink;ctx.font = '700 30px "PingFang SC",sans-serif';ctx.fillText(_t("text.0475"), pad, fy + 38);
  ctx.fillStyle = t.muted;ctx.font = '21px "PingFang SC",sans-serif';ctx.fillText(_t("text.0476", { v0: BRAND.zh }), pad, fy + 78);
  ctx.font = '17px ui-monospace,Menlo,monospace';wrap(ctx, code, W - pad * 2 - qr - 50).slice(0, 3).forEach((line, i) => ctx.fillText(line, pad, fy + 110 + i * 25));
  return cv;
}
export function lookCode(design, parts, products, withName = true) {try {return encodeLook(parts, products, design.assignments, withName ? design.name : '');} catch {return _t("text.0477");}}

export function createPosterDialog({ view, parts, products }) {
  document.body.insertAdjacentHTML('beforeend', `<dialog id="poster-dialog" class="poster-dialog" aria-label="${_attr(_t("text.0478"))}" data-i18n-aria-label="text.0478"><div class="poster-wrap"><div class="poster-stage"><img id="poster-img" alt="${_attr(_t("text.0478"))}" data-i18n-alt="text.0478"><span class="poster-busy" id="poster-busy"><span data-i18n="text.0210">${_t("text.0210")}</span></span></div><div class="poster-side"><div class="poster-head"><div><span class="poster-eyebrow"><span data-i18n="text.0479">${_t("text.0479")}</span></span><h2 id="poster-title"><span data-i18n="text.0443">${_t("text.0443")}</span></h2></div><button class="poster-x" id="poster-close" aria-label="${_attr(_t("text.0438"))}" data-i18n-aria-label="text.0438">×</button></div>
<div class="poster-group"><span><span data-i18n="text.0480">${_t("text.0480")}</span></span><div class="poster-seg" id="poster-ratio">${Object.entries(RATIOS).map(([k, v]) => `<button data-v="${k}"><b>${k}</b><small>${v[2]}</small></button>`).join('')}</div></div>
<div class="poster-group"><span><span data-i18n="text.0481">${_t("text.0481")}</span></span><div class="poster-seg small" id="poster-theme"><button data-v="light"><span data-i18n="text.0482">${_t("text.0482")}</span></button><button data-v="tint"><span data-i18n="text.0483">${_t("text.0483")}</span></button><button data-v="dark"><span data-i18n="text.0484">${_t("text.0484")}</span></button></div></div>
<div class="poster-group"><span><span data-i18n="text.0485">${_t("text.0485")}</span></span><label><input type="checkbox" id="poster-materials" checked> <span data-i18n="text.0486">${_t("text.0486")}</span></label><label><input type="checkbox" id="poster-compare"> <span data-i18n="text.0487">${_t("text.0487")}</span></label><label><input type="checkbox" id="poster-author" checked> <span data-i18n="text.0488">${_t("text.0488")}</span></label></div>
<div class="poster-group"><span><span data-i18n="text.0241">${_t("text.0241")}</span> <small><span data-i18n="text.0489">${_t("text.0489")}</span></small></span><div class="poster-code"><code id="poster-code"></code><button id="poster-copy-code"><span data-i18n="text.0215">${_t("text.0215")}</span></button></div></div>
<p class="poster-note"><span data-i18n="text.0490">${_t("text.0490")}</span></p>
<div class="poster-actions"><button class="poster-primary" id="poster-save"><span data-i18n="text.0491">${_t("text.0491")}</span></button><button id="poster-copy-img"><span data-i18n="text.0492">${_t("text.0492")}</span></button><button id="poster-share" hidden><span data-i18n="text.0493">${_t("text.0493")}</span></button></div><p class="poster-status" id="poster-status" role="status"></p></div></div></dialog>`);
  const $ = (s) => document.querySelector(s),dlg = $('#poster-dialog'),opts = { ratio: '3:4', theme: 'light', materials: true, compare: false, author: true };let current = null,blob = null,timer;
  const status = (m) => {$('#poster-status').textContent = m;clearTimeout(timer);timer = setTimeout(() => $('#poster-status').textContent = '', 3200);};
  function sync() {for (const [id, key] of [['#poster-ratio', 'ratio'], ['#poster-theme', 'theme']]) dlg.querySelectorAll(id + ' button').forEach((b) => b.classList.toggle('on', b.dataset.v === opts[key]));}
  function render() {
    if (!current) return;$('#poster-busy').hidden = false;sync();
    requestAnimationFrame(() => {const cv = drawPoster({ view, parts, products, ...current, opts });$('#poster-img').src = cv.toDataURL('image/png');$('#poster-img').style.aspectRatio = cv.width + '/' + cv.height;cv.toBlob((b) => {blob = b;$('#poster-busy').hidden = true;}, 'image/png');});
  }
  dlg.querySelector('#poster-ratio').onclick = (e) => {const b = e.target.closest('button');if (b) {opts.ratio = b.dataset.v;render();}};
  dlg.querySelector('#poster-theme').onclick = (e) => {const b = e.target.closest('button');if (b) {opts.theme = b.dataset.v;render();}};
  for (const k of ['materials', 'compare', 'author']) $('#poster-' + k).onchange = (e) => {opts[k] = e.target.checked;render();};
  $('#poster-close').onclick = () => dlg.close();dlg.addEventListener('click', (e) => {if (e.target === dlg) dlg.close();});
  const fileName = () => 'XGO-Duck-' + (current.design.name || 'palette').replace(/[\\/:*?"<>|]/g, '_') + '-' + opts.ratio.replace(':', 'x') + '.png';
  $('#poster-save').onclick = () => {if (!blob) return;const url = URL.createObjectURL(blob),a = document.createElement('a');a.href = url;a.download = fileName();a.click();setTimeout(() => URL.revokeObjectURL(url), 30000);status(_t("text.0494", { v0: fileName() }));};
  $('#poster-copy-img').onclick = async () => {try {await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);status(_t("text.0495"));} catch {status(_t("text.0496"));}};
  $('#poster-copy-code').onclick = async () => {try {await navigator.clipboard.writeText($('#poster-code').textContent);status(_t("text.0497"));} catch {status(_t("text.0498"));}};
  $('#poster-share').onclick = async () => {try {await navigator.share({ files: [new File([blob], fileName(), { type: 'image/png' })], title: current.design.name });} catch {}};
  _onLocale(() => {dlg.querySelectorAll('#poster-ratio button').forEach((b) => b.querySelector('small').textContent = _label(RATIOS[b.dataset.v][2]));render();});
  return { open(input) {current = input;$('#poster-title').textContent = '「' + (input.design.name || _t("text.0047")) + '」';$('#poster-code').textContent = lookCode(input.design, parts, products);$('#poster-compare').disabled = !input.before;$('#poster-share').hidden = !navigator.canShare?.({ files: [new File([''], 'a.png', { type: 'image/png' })] });if (!dlg.open) dlg.showModal();render();} };
}
