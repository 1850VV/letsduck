import { BRAND, brandName } from './brand.mjs';
import './form-messages.mjs';
import { escapeAttribute as _attr } from "./i18n.mjs";import { LOCALES, t, getLocale, setLocale, getLanguageChoice, matchLocales, onLocale, bindTranslations } from './i18n.mjs';
const slot = document.createElement('div');slot.className = 'language';
const profile = document.querySelector('#profile-slot');profile.before(slot);
let open = false;
function render() {
  document.title=brandName()+' / '+BRAND.en+' · '+t(location.pathname.includes('/gallery')?'text.0392':'text.0644');
  const code = getLocale(),choice = getLanguageChoice(),name = LOCALES.find((x) => x.code === code).name;
  slot.innerHTML = `<button type="button" id="language-trigger" class="language-trigger" aria-haspopup="dialog" aria-expanded="${open}" aria-controls="language-menu" aria-label="${_attr(t('language.label')+': '+name)}"><span aria-hidden="true">◎</span><bdi>${name}</bdi><span aria-hidden="true">⌄</span></button><div id="language-menu" class="language-menu" role="dialog" ${open ? '' : 'hidden'}><div class="language-head">${t('language.label')}<small>12</small></div><button type="button" class="language-auto" data-locale="auto" aria-pressed="${choice === 'auto'}"><span><b>${t('language.auto')}</b><small>${t('language.browser')} · <bdi>${LOCALES.find((x) => x.code === matchLocales(navigator.languages)).name}</bdi></small></span><i>${choice === 'auto' ? '✓' : ''}</i></button><div class="language-list">${LOCALES.map((x) => `<button type="button" data-locale="${x.code}" aria-pressed="${choice === x.code}"><bdi lang="${x.code}">${x.name}</bdi><i>${choice === x.code ? '✓' : ''}</i></button>`).join('')}</div><p>${t('language.remember')}</p></div>`;
}
slot.addEventListener('click', (e) => {
  if (e.target.closest('#language-trigger')) {open = !open;render();if (open) slot.querySelector('[data-locale="' + getLanguageChoice() + '"]').focus();return;}
  const option = e.target.closest('[data-locale]');if (!option) return;
  // The menu re-renders once the language applies (later when its dictionary is still loading).
  open = false;render();setLocale(option.dataset.locale).then(() => slot.querySelector('#language-trigger').focus());
});
slot.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {open = false;render();slot.querySelector('#language-trigger').focus();e.stopPropagation();return;}
  if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();e.stopPropagation();const buttons = [...slot.querySelectorAll('[data-locale]')],i = buttons.indexOf(document.activeElement);
  buttons[e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
});
document.addEventListener('pointerdown', (e) => {if (open && !slot.contains(e.target)) {open = false;render();}});
addEventListener('languagechange', () => {if (getLanguageChoice() === 'auto') setLocale('auto');});
onLocale(() => {render();bindTranslations();});render();bindTranslations();
