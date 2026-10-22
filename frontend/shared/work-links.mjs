// One explicit deployment origin for every public work link. Never infer it from
// the current browser URL: local previews and reverse-proxy aliases are not share URLs.
export function publicOrigin(value) {
  try {
    const url = new URL(value), host = url.hostname.replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || /(^|\.)(localhost|local|internal)$/.test(host)) return null;
    return url.origin;
  } catch { return null; }
}
const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
export function workURL(site, id) {
  const origin = publicOrigin(site);
  return origin && validId(id) ? origin + '/gallery/#d/' + encodeURIComponent(id) : null;
}
export function parseWorkLink(value, site) {
  try {
    const url = new URL(value), id = decodeURIComponent(url.hash.slice(3));
    return url.origin === publicOrigin(site) && url.pathname === '/gallery/' && !url.search &&
      url.hash.startsWith('#d/') && validId(id) ? id : null;
  } catch { return null; }
}
export async function copyText(value, clipboard = globalThis.navigator?.clipboard) {
  if (typeof value !== 'string' || !value) throw Error('empty text');
  if (!clipboard?.writeText) throw Error('clipboard unavailable');
  await clipboard.writeText(value);
}
let siteRequest;
export function loadPublicSite() {
  return siteRequest ||= fetch('/api/site').then(r => {
    if (!r.ok) throw Error('site configuration unavailable');
    return r.json();
  }).then(data => publicOrigin(data.publicUrl)).catch(() => null);
}

export const UNCONFIGURED_SHARE = '站点尚未配置正式分享地址，暂时不能分享作品链接。';

// Card/detail fallback: make the exact text selectable when clipboard permission
// is denied. A dialog is also reachable on touch devices with no hover support.
export async function copyWorkLink(site, id, status) {
  const url = workURL(site, id);
  if (!url) { status(UNCONFIGURED_SHARE); return; }
  try { await copyText(url); status('作品链接已复制'); }
  catch {
    let dlg = document.querySelector('#work-link-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'work-link-dialog'; dlg.className = 'work-link-dialog';
      dlg.setAttribute('aria-label', '手动复制作品链接');
      dlg.innerHTML = '<h2>手动复制作品链接</h2><p>自动复制未成功，请选择下方链接复制。</p><input readonly aria-label="作品链接"><button type="button">完成</button>';
      dlg.querySelector('button').onclick = () => dlg.close();
      document.body.append(dlg);
    }
    const input = dlg.querySelector('input'); input.value = url;
    if (!dlg.open) dlg.showModal();
    input.focus(); input.select();
    status('尚未复制，请手动选择链接');
  }
}
