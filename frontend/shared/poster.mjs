import { escapeAttribute as _attr } from "./i18n.mjs";import { t as _t, label as _label, onLocale as _onLocale } from "./i18n.mjs"; // Share previews use a canonical public work link only for published works.
import { encodeLook, designNotes } from '../lib/quick-style.mjs';
import { BRAND, brandName } from './brand.mjs';
import { workURL, loadPublicSite, copyText, UNCONFIGURED_SHARE } from './work-links.mjs';

// The QR encoder only serves published works' posters, so it loads with the first of them.
let qrModule = null;const loadQR = () => import('./qr.mjs').then((m) => qrModule = m);

const RATIOS = { '3:4': [1080, 1440, "text.0469"], '1:1': [1080, 1080, "text.0470"], '9:16': [1080, 1920, "text.0471"] };
const THEMES = { light: { bg: ['#f4f6fb', '#e3e8f5'], ink: '#17243c', muted: '#6b7891', brand: '#4d6bfe', card: '#ffffffcc' }, dark: { bg: ['#1a2140', '#0d1226'], ink: '#f3f5ff', muted: '#9aa6c6', brand: '#8fa2ff', card: '#ffffff14' } };
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function mix(hex, to, t) {const a = parseInt(hex.slice(1), 16),b = parseInt(to.slice(1), 16),c = (s) => Math.round((a >> s & 255) * (1 - t) + (b >> s & 255) * t);return `rgb(${c(16)},${c(8)},${c(0)})`;}

function wrap(ctx, text, maxWidth) {const lines = [''];for (const ch of text) {const t = lines.at(-1) + ch;if (ctx.measureText(t).width > maxWidth) {lines.push(ch);} else lines[lines.length - 1] = t;}return lines;}

export function drawPoster({ view, design, parts, products, before, opts, workUrl = null }) {
  const [W, H] = RATIOS[opts.ratio],t = THEMES[opts.theme === 'dark' ? 'dark' : 'light'],cv = document.createElement('canvas');cv.width = W;cv.height = H;const ctx = cv.getContext('2d');
  const used = [...new Set(parts.map((p) => design.assignments[p.id]))].map((id) => products.get(id)).filter(Boolean);
  const main = design.colors['P5-06'] || used[0]?.hex || '#4d6bfe';
  const g = ctx.createLinearGradient(0, 0, W * .3, H);
  if (opts.theme === 'tint') {g.addColorStop(0, mix(main, '#ffffff', .82));g.addColorStop(1, mix(main, '#ffffff', .6));} else {g.addColorStop(0, t.bg[0]);g.addColorStop(1, t.bg[1]);}
  ctx.fillStyle = g;ctx.fillRect(0, 0, W, H);
  const pad = 72,footH = 270,maxRows = Math.max(1, Math.floor((H - footH - 140 - 150 - 240 - 54) / 74));
  const shown = used.slice(0, maxRows * 3),remaining = used.length - shown.length;
  const infoH = (opts.materials ? Math.ceil(shown.length / 3) * 74 + 24 + (remaining ? 30 : 0) : 0) + 150,modelH = H - footH - infoH - 140;
  ctx.fillStyle = t.brand;ctx.font = '700 26px -apple-system,"PingFang SC",sans-serif';ctx.fillText(brandName() + ' ' + BRAND.en + ' · XGO Duck V2', pad, 92);
  ctx.drawImage(view.snapshot(W, modelH, { colors: design.colors }), 0, 120);
  if (opts.compare && before) {const s = Math.round(W * .26),img = view.snapshot(s, Math.round(s * 1.15), { colors: before.colors });const x = W - pad - s,y = 140;ctx.fillStyle = t.card;ctx.beginPath();ctx.roundRect(x - 8, y - 8, s + 16, s * 1.15 + 52, 22);ctx.fill();ctx.drawImage(img, x, y);ctx.fillStyle = t.muted;ctx.font = '600 20px sans-serif';ctx.textAlign = 'center';ctx.fillText(_t("text.0472"), x + s / 2, y + s * 1.15 + 30);ctx.textAlign = 'left';}
  let y = 120 + modelH + 70;
  ctx.fillStyle = t.ink;ctx.font = '800 68px -apple-system,"PingFang SC",sans-serif';for (let size = 66; ctx.measureText(design.name || _t("text.0047")).width > W - pad * 2 && size >= 18; size -= 2) ctx.font = '800 ' + size + 'px -apple-system,"PingFang SC",sans-serif';ctx.fillText(design.name || _t("text.0047"), pad, y);y += 52;
  ctx.fillStyle = t.muted;ctx.font = '28px -apple-system,"PingFang SC",sans-serif';ctx.fillText([opts.author && design.author, _t("text.0473", { v0: designNotes(design.colors, design.assignments).count }), _t("text.0474")].filter(Boolean).join(' · '), pad, y);y += 46;
  if (opts.materials) shown.forEach((p, i) => {const x = pad + i % 3 * ((W - pad * 2) / 3),yy = y + Math.floor(i / 3) * 74;ctx.fillStyle = p.hex;ctx.beginPath();ctx.roundRect(x, yy, 50, 50, 12);ctx.fill();ctx.strokeStyle = '#0002';ctx.lineWidth = 2;ctx.stroke();ctx.fillStyle = t.ink;ctx.font = '600 24px "PingFang SC",sans-serif';ctx.fillText(p.name, x + 66, yy + 22);ctx.fillStyle = t.muted;ctx.font = '19px sans-serif';ctx.fillText(p.series + ' ' + p.colorCode, x + 66, yy + 47);});
  if (opts.materials && remaining) {ctx.fillStyle = t.muted;ctx.font = '20px "PingFang SC",sans-serif';ctx.fillText(_t("text.0796", { v0: remaining }), pad, y + Math.ceil(shown.length / 3) * 74 + 16);}
  const fy = H - footH + 34,qr = 200;
  ctx.fillStyle = t.card;ctx.beginPath();ctx.roundRect(pad - 24, fy - 24, W - pad * 2 + 48, footH - 50, 28);ctx.fill();
  ctx.fillStyle = t.ink;ctx.font = '700 30px "PingFang SC",sans-serif';
  ctx.fillText(workUrl ? _t("text.0797") : _t("text.0798"), pad, fy + 44);
  ctx.fillStyle = t.muted;ctx.font = '24px "PingFang SC",sans-serif';
  ctx.fillText(workUrl ? _t("text.0799") : _t("text.0800"), pad, fy + 91);
  if (workUrl) {
    ctx.font = '19px sans-serif';
    wrap(ctx, new URL(workUrl).host, W - pad * 2 - qr - 40).slice(0, 2).forEach((line, i) => ctx.fillText(line, pad, fy + 135 + i * 25));
    qrModule.drawQR(ctx, workUrl, W - pad - qr, fy, qr);
  }
  return cv;
}
export function lookCode(design, parts, products, withName = true) {try {return encodeLook(parts, products, design.assignments, withName ? design.name : '');} catch {return _t("text.0477");}}

export function createPosterDialog({ view, parts, products, compact = false }) {
  document.body.insertAdjacentHTML('beforeend', `<dialog id="poster-dialog" class="poster-dialog ${compact ? 'compact' : ''}" aria-label="${_attr(_t("text.0478"))}" data-i18n-aria-label="text.0478">
<div class="poster-head"><h2 id="poster-title"><span data-i18n="text.0443">${_t("text.0443")}</span></h2><button class="poster-x" id="poster-close" aria-label="${_attr(_t("text.0801"))}" data-i18n-aria-label="text.0801">×</button></div>
<div class="poster-wrap"><div class="poster-stage"><img id="poster-img" alt="${_attr(_t("text.0478"))}" data-i18n-alt="text.0478"><span class="poster-busy" id="poster-busy"><span data-i18n="text.0210">${_t("text.0210")}</span></span></div>
<div class="poster-side"><p class="poster-intro"><span data-i18n="text.0802">${_t("text.0802")}</span><br><span data-i18n="text.0803">${_t("text.0803")}</span></p>
<button class="poster-primary poster-link" id="poster-copy-link" disabled><span data-i18n="text.0804">${_t("text.0804")}</span></button>
<div class="poster-manual" id="poster-manual" hidden><p><span data-i18n="text.0805">${_t("text.0805")}</span></p><input readonly id="poster-link-value" aria-label="${_attr(_t("text.0806"))}" data-i18n-aria-label="text.0806"></div>
<div class="poster-actions"><button id="poster-save" disabled><span data-i18n="text.0807">${_t("text.0807")}</span></button><a id="poster-open-link" target="_blank" rel="noopener" hidden><span data-i18n="text.0808">${_t("text.0808")}</span></a></div>
<p class="poster-note" id="poster-note"></p><p class="poster-status" id="poster-status" role="status"></p>
<details class="poster-settings" ${compact ? '' : 'open'}><summary><span data-i18n="text.0809">${_t("text.0809")}</span></summary>
<div class="poster-group"><span><span data-i18n="text.0480">${_t("text.0480")}</span></span><div class="poster-seg" id="poster-ratio">${Object.entries(RATIOS).map(([k, v]) => `<button data-v="${k}"><b>${k}</b><small>${_t(v[2])}</small></button>`).join('')}</div></div>
<div class="poster-group"><span><span data-i18n="text.0481">${_t("text.0481")}</span></span><div class="poster-seg small" id="poster-theme"><button data-v="light"><span data-i18n="text.0482">${_t("text.0482")}</span></button><button data-v="tint"><span data-i18n="text.0483">${_t("text.0483")}</span></button><button data-v="dark"><span data-i18n="text.0484">${_t("text.0484")}</span></button></div></div>
<div class="poster-group"><span><span data-i18n="text.0485">${_t("text.0485")}</span></span><label><input type="checkbox" id="poster-materials" ${compact ? '' : 'checked'}> <span data-i18n="text.0486">${_t("text.0486")}</span></label><label><input type="checkbox" id="poster-compare"> <span data-i18n="text.0487">${_t("text.0487")}</span></label><label><input type="checkbox" id="poster-author" checked> <span data-i18n="text.0488">${_t("text.0488")}</span></label></div>
<div class="poster-group"><span><span data-i18n="text.0241">${_t("text.0241")}</span> <small><span data-i18n="text.0242">${_t("text.0242")}</span></small></span><div class="poster-code"><code id="poster-code"></code><button id="poster-copy-code"><span data-i18n="text.0215">${_t("text.0215")}</span></button></div></div>
<div class="poster-actions"><button id="poster-copy-img" disabled><span data-i18n="text.0492">${_t("text.0492")}</span></button><button id="poster-share" hidden><span data-i18n="text.0493">${_t("text.0493")}</span></button></div>
</details></div></div></dialog>`);
  const $ = (s) => document.querySelector(s),dlg = $('#poster-dialog'),opts = { ratio: '3:4', theme: 'light', materials: !compact, compare: false, author: true };
  let current = null,blob = null,timer,renderVersion = 0,openVersion = 0;
  const status = (m) => {$('#poster-status').textContent = m;clearTimeout(timer);};
  const ready = (on) => {for (const id of ['#poster-save', '#poster-copy-img', '#poster-share']) $(id).disabled = !on;};
  function sync() {for (const [id, key] of [['#poster-ratio', 'ratio'], ['#poster-theme', 'theme']]) dlg.querySelectorAll(id + ' button').forEach((b) => b.classList.toggle('on', b.dataset.v === opts[key]));}
  function render() {
    if (!current) return;
    const version = ++renderVersion,input = current;blob = null;ready(false);$('#poster-busy').hidden = false;sync();
    requestAnimationFrame(async () => {
      if (version !== renderVersion || !dlg.open) return;
      try {
        if (input.workUrl && !qrModule) {await loadQR();if (version !== renderVersion || !dlg.open) return;}
        const cv = drawPoster({ view, parts, products, ...input, opts });
        $('#poster-img').src = cv.toDataURL('image/png');$('#poster-img').style.aspectRatio = cv.width + '/' + cv.height;
        cv.toBlob((b) => {if (version !== renderVersion || !dlg.open) return;blob = b;$('#poster-busy').hidden = true;ready(!!b);if (!b) status(_t("text.0810"));}, 'image/png');
      } catch {if (version === renderVersion) {$('#poster-busy').hidden = true;status(_t("text.0810"));}}
    });
  }
  dlg.querySelector('#poster-ratio').onclick = (e) => {const b = e.target.closest('button');if (b) {opts.ratio = b.dataset.v;render();}};
  dlg.querySelector('#poster-theme').onclick = (e) => {const b = e.target.closest('button');if (b) {opts.theme = b.dataset.v;render();}};
  for (const k of ['materials', 'compare', 'author']) $('#poster-' + k).onchange = (e) => {opts[k] = e.target.checked;render();};
  $('#poster-close').onclick = () => dlg.close();dlg.addEventListener('click', (e) => {if (e.target === dlg) dlg.close();});
  dlg.addEventListener('close', () => {++openVersion;++renderVersion;blob = null;ready(false);});
  const fileName = () => 'XGO-Duck-' + (current.design.name || 'palette').replace(/[\\/:*?"<>|]/g, '_') + '-' + opts.ratio.replace(':', 'x') + '.png';
  $('#poster-save').onclick = () => {if (!blob) return;const url = URL.createObjectURL(blob),a = document.createElement('a');a.href = url;a.download = fileName();a.click();setTimeout(() => URL.revokeObjectURL(url), 30000);status(_t("text.0811"));};
  $('#poster-copy-img').onclick = async () => {if (!blob) return;try {await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);status(_t("text.0812"));} catch {status(_t("text.0813"));}};
  $('#poster-copy-code').onclick = async () => {try {await copyText($('#poster-code').textContent);status(_t("text.0497"));} catch {const selection = getSelection(),range = document.createRange();range.selectNodeContents($('#poster-code'));selection.removeAllRanges();selection.addRange(range);status(_t("text.0498"));}};
  $('#poster-copy-link').onclick = async () => {
    const url = current?.workUrl;if (!url) return;
    try {await copyText(url);$('#poster-manual').hidden = true;status(_t("text.0814"));}
    catch {$('#poster-manual').hidden = false;$('#poster-link-value').value = url;$('#poster-link-value').focus();$('#poster-link-value').select();status(_t("text.0815"));}
  };
  $('#poster-share').onclick = async () => {if (!blob) return;try {await navigator.share({ files: [new File([blob], fileName(), { type: 'image/png' })], title: current.design.name });} catch {}};
  _onLocale(() => {
    dlg.querySelectorAll('#poster-ratio button').forEach((b) => b.querySelector('small').textContent = _t(RATIOS[b.dataset.v][2]));
    if (current) {$('#poster-title').textContent = _t('text.0816', { v0: current.design.name || _t('text.0047') });$('#poster-note').textContent = current.workUrl ? _t('text.0817') : current.workId ? UNCONFIGURED_SHARE() : _t('text.0818');render();}
  });
  return { async open(input) {
      const version = ++openVersion;current = null;++renderVersion;blob = null;ready(false);
      $('#poster-title').textContent = _t("text.0816", { v0: input.design.name || _t("text.0047") });$('#poster-code').textContent = lookCode(input.design, parts, products);
      $('#poster-compare').disabled = !input.before;opts.compare = !!input.before && opts.compare;$('#poster-compare').checked = opts.compare;
      $('#poster-copy-link').disabled = true;$('#poster-open-link').hidden = true;$('#poster-open-link').removeAttribute('href');
      $('#poster-manual').hidden = true;$('#poster-note').textContent = '';status('');$('#poster-img').removeAttribute('src');$('#poster-busy').hidden = false;
      $('#poster-share').hidden = !navigator.canShare?.({ files: [new File([''], 'a.png', { type: 'image/png' })] });
      if (!dlg.open) dlg.showModal();
      const snapshot = structuredClone(input),site = await loadPublicSite();
      if (version !== openVersion || !dlg.open) return;
      current = { ...snapshot, workUrl: workURL(site, snapshot.workId) };
      $('#poster-copy-link').disabled = !current.workUrl;
      $('#poster-note').textContent = current.workUrl ? _t("text.0817") : snapshot.workId ? UNCONFIGURED_SHARE() : _t("text.0818");
      if (current.workUrl) {$('#poster-open-link').href = current.workUrl;$('#poster-open-link').hidden = false;}
      render();
    } };
}
