import { escapeAttribute as _attr } from "./i18n.js";import { t as _t, label as _label, onLocale as _onLocale } from "./i18n.js"; // One explicit deployment origin for every public work link. Never infer it from
// the current browser URL: local previews and reverse-proxy aliases are not share URLs.
import {parseResponseJson} from './json.js';
import {record} from './guards.js';
export function publicOrigin(value:unknown) {
  try {
    if(typeof value!=='string'&&!(value instanceof URL))return null;
    const url = new URL(value),host = url.hostname.replace(/\.$/, '');
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    if (!host.includes('.') || /^[\d.]+$/.test(host) || host.includes(':') || /(^|\.)(localhost|local|internal)$/.test(host)) return null;
    return url.origin;
  } catch {return null;}
}
const validId = (id:unknown):id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
export function workURL(site:unknown, id:unknown) {
  const origin = publicOrigin(site);
  return origin && validId(id) ? origin + '/gallery/#d/' + encodeURIComponent(id) : null;
}
export function parseWorkLink(value:string, site:unknown) {
  try {
    const url = new URL(value),id = decodeURIComponent(url.hash.slice(3));
    return url.origin === publicOrigin(site) && url.pathname === '/gallery/' && !url.search &&
    url.hash.startsWith('#d/') && validId(id) ? id : null;
  } catch {return null;}
}
export async function copyText(value:unknown, clipboard:Pick<Clipboard,'writeText'>|null|undefined = globalThis.navigator?.clipboard) {
  if (typeof value !== 'string' || !value) throw Error('empty text');
  if (!clipboard?.writeText) throw Error('clipboard unavailable');
  await clipboard.writeText(value);
}
let siteRequest:Promise<string|null>|undefined;
export function loadPublicSite() {
  return siteRequest ||= fetch('/api/site').then((r) => {
    if (!r.ok) throw Error('site configuration unavailable');
    return parseResponseJson(r);
  }).then((data) => publicOrigin(record(data)?data.publicUrl:null)).catch(() => null);
}

export const UNCONFIGURED_SHARE = () => _t("text.0819");

// Card/detail fallback: make the exact text selectable when clipboard permission
// is denied. A dialog is also reachable on touch devices with no hover support.
export async function copyWorkLink(site:unknown, id:unknown, status:(message:string)=>void) {
  const url = workURL(site, id);
  if (!url) {status(UNCONFIGURED_SHARE());return;}
  try {await copyText(url);status(_t("text.0814"));}
  catch {
    let dlg = document.querySelector<HTMLDialogElement>('#work-link-dialog');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'work-link-dialog';dlg.className = 'work-link-dialog';
      dlg.setAttribute('data-i18n-aria-label', 'text.0806');dlg.setAttribute('aria-label', _t("text.0806"));
      dlg.innerHTML = `<h2><span data-i18n="text.0806">${_t("text.0806")}</span></h2><p><span data-i18n="text.0805">${_t("text.0805")}</span></p><input readonly aria-label="${_attr(_t("text.0820"))}" data-i18n-aria-label="text.0820"><button type="button"><span data-i18n="text.0153">${_t("text.0153")}</span></button>`;
      const dialog=dlg;dlg.querySelector('button')!.onclick = () => dialog.close();
      document.body.append(dlg);
    }
    const input = dlg.querySelector('input')!;input.value = url;
    if (!dlg.open) dlg.showModal();
    input.focus();input.select();
    status(_t("text.0821"));
  }
}
