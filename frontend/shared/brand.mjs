// Shared product identity. Storage names remain stable across the rename.
export const BRAND = Object.freeze({zh:'来做鸭',en:'letsduck',tagline:'机器鸭涂装与配色社区'});
const asset = name => new URL('./brand/' + name, import.meta.url).href;
export const avatarURL = () => asset('avatar.png');
export const faviconURL = avatarURL;
export function logoSVG() {
  return `<svg class="logo" viewBox="0 225 1254 760" aria-hidden="true" focusable="false"><image href="${avatarURL()}" width="1254" height="1254"/></svg>`;
}
export function brandHTML() {
  return `${logoSVG()}<span class="wordmark"><img class="brand-zh" src="${asset('wordmark-zh.svg')}" alt="${BRAND.zh}"><img class="brand-en" src="${asset('wordmark-en.svg')}" alt="${BRAND.en}"></span>`;
}
export function applyBrand() {
  document.querySelectorAll('[data-brand-slot]').forEach(el => {
    el.innerHTML = brandHTML();
    el.setAttribute('aria-label', BRAND.zh + ' / ' + BRAND.en);
  });
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {link = document.createElement('link');link.rel = 'icon';document.head.append(link);}
  link.type = 'image/png';link.href = faviconURL();
}
