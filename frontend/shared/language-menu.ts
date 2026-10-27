import { BRAND, brandName } from './brand.js';
import './form-messages.js';
import { escapeAttribute as _attr } from "./i18n.js";import { LOCALES, t, getLocale, setLocale, getLanguageChoice, matchLocales, onLocale, bindTranslations } from './i18n.js';
const slot = document.createElement('div');slot.className = 'language';
const profile = document.querySelector('#profile-slot')!;profile.before(slot);
let open = false;
function render() {
  document.title=brandName()+' / '+BRAND.en+' · '+t(document.body.dataset.title||(location.pathname.includes('/gallery')?'text.0392':'text.0644'));
  const code = getLocale(),choice = getLanguageChoice(),name = LOCALES.find((x) => x.code === code)!.name;
  slot.innerHTML = `<button type="button" id="language-trigger" class="language-trigger" aria-haspopup="dialog" aria-expanded="${open}" aria-controls="language-menu" aria-label="${_attr(t('language.label')+': '+name)}"><span aria-hidden="true">◎</span><bdi>${name}</bdi><span aria-hidden="true">⌄</span></button><div id="language-menu" class="language-menu" role="dialog" ${open ? '' : 'hidden'}><div class="language-head">${t('language.label')}<small>12</small></div><button type="button" class="language-auto" data-locale="auto" aria-pressed="${choice === 'auto'}"><span><b>${t('language.auto')}</b><small>${t('language.browser')} · <bdi>${LOCALES.find((x) => x.code === matchLocales(navigator.languages))!.name}</bdi></small></span><i>${choice === 'auto' ? '✓' : ''}</i></button><div class="language-list">${LOCALES.map((x) => `<button type="button" data-locale="${x.code}" aria-pressed="${choice === x.code}"><bdi lang="${x.code}">${x.name}</bdi><i>${choice === x.code ? '✓' : ''}</i></button>`).join('')}</div><p>${t('language.remember')}</p></div>`;
}
slot.addEventListener('click', (e) => {
  if (e.target instanceof Element&&e.target.closest('#language-trigger')) {open = !open;render();if (open) slot.querySelector<HTMLButtonElement>('[data-locale="' + getLanguageChoice() + '"]')!.focus();return;}
  const option = e.target instanceof Element?e.target.closest<HTMLElement>('[data-locale]'):null;if (!option?.dataset.locale) return;
  open = false;setLocale(option.dataset.locale);slot.querySelector<HTMLButtonElement>('#language-trigger')!.focus();
});
slot.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {open = false;render();slot.querySelector<HTMLButtonElement>('#language-trigger')!.focus();e.stopPropagation();return;}
  if (!open || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();e.stopPropagation();const buttons = [...slot.querySelectorAll<HTMLButtonElement>('[data-locale]')],i = buttons.findIndex(button=>button===document.activeElement);
  buttons[e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]!.focus();
});
document.addEventListener('pointerdown', (e) => {if (open && e.target instanceof Node&&!slot.contains(e.target)) {open = false;render();}});
addEventListener('languagechange', () => {if (getLanguageChoice() === 'auto') setLocale('auto');});
onLocale(() => {render();bindTranslations();});render();bindTranslations();
