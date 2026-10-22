// Shared product identity. Storage names (dd-* keys, doodleduck databases) stay stable across renames.
import { getLocale, onLocale } from './i18n.mjs';
export const BRAND = Object.freeze({zh: '来做鸭', en: 'letsduck', tagline: '机器鸭涂装与配色社区'});
// Traditional Chinese readers see the same name in their script, matching the translated text.
export const brandName = (locale = getLocale()) => locale === 'zh-Hant' ? '來做鴨' : BRAND.zh;

// The mark: a duck head drawn in one thick blue stroke, whose jaw is a paintbrush that has just
// painted it (blue tip). Same drawing as brand/logo.svg, which the README uses; a test keeps them equal.
export const MARK = '<rect width="64" height="64" rx="18" fill="#eef1ff"/>' +
  '<path d="M14 40V30C14 21.6 21.6 15.5 31.8 15.5c10.2 0 18 5.6 19.4 13.5L52.2 40z" fill="none" stroke="#4d6bfe" stroke-width="5.5" stroke-linejoin="round"/>' +
  '<circle cx="40.5" cy="27.5" r="4.6" fill="#17243c"/><circle cx="39.2" cy="26.2" r="1.3" fill="#fff"/>' +
  '<rect x="12.5" y="43.7" width="22.5" height="5.6" rx="2.8" fill="#ff8a3d"/><circle cx="16.4" cy="46.5" r="1.1" fill="#eef1ff"/>' +
  '<rect x="34" y="42.6" width="7.2" height="7.8" rx="1.5" fill="#c6d0ee"/><rect x="36.8" y="42.6" width="1.4" height="7.8" fill="#a9b6dc"/>' +
  '<path d="M41 42.8h2.6c4.6 0 8.6 1.6 10.2 3.7-1.6 2.1-5.6 3.7-10.2 3.7H41z" fill="#17243c"/>' +
  '<path d="M48.2 43.4c2.6.6 4.6 1.7 5.6 3.1-1 1.4-3 2.5-5.6 3.1z" fill="#4d6bfe"/>';

export const logoSVG = () => `<svg class="logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${MARK}</svg>`;
export const faviconURL = () => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${MARK}</svg>`);
// The name in the system font, Chinese above, English below (lower case, like letsduck.club).
export const brandHTML = () => `${logoSVG()}<span class="wordmark"><b>${brandName()}</b><small>${BRAND.en}</small></span>`;

// Fills every [data-brand-slot] and the tab icon; the name follows language changes.
let following = false;
export function applyBrand() {
  document.querySelectorAll('[data-brand-slot]').forEach((el) => {
    el.innerHTML = brandHTML();
    el.setAttribute('aria-label', brandName() + ' / ' + BRAND.en);
  });
  if (!following) {following = true;onLocale(() => applyBrand());}
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {link = document.createElement('link');link.rel = 'icon';document.head.append(link);}
  link.type = 'image/svg+xml';link.href = faviconURL();
}
