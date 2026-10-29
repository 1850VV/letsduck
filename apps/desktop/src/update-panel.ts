import type { DesktopUpdateState } from './updates.js';
import type { DesktopBridge } from './ipc.js';
import {desktopText,resolveDesktopLocale} from './copy.js';
declare global { interface Window { letsduckDesktop?: DesktopBridge } }
const api = window.letsduckDesktop, brand = document.querySelector<HTMLElement>('header.top .brand, header.home-top .home-brand');
if (api && brand) {
  const host = document.createElement('div'); host.id = 'letsduck-update'; brand.after(host);
  // Only the desktop shell reserves header space; the browser edition stays unchanged.
  const layout = document.createElement('style');
  layout.textContent = `
    header.top:has(> #letsduck-update) > .brand{margin-inline-end:0}
    header.home-top:has(> #letsduck-update) > .home-brand{margin-inline-end:0}
    body:has(main.home) #letsduck-update{margin-inline-start:18px;margin-inline-end:auto}
    header.top:has(#letsduck-update):has(#steps){gap:12px}
    header.top:has(#letsduck-update) .step-line{width:18px;flex:none}
    header.top:has(#letsduck-update) .steps button{gap:8px;padding:7px 8px}
    header.top:has(#letsduck-update) .steps span,header.top:has(#letsduck-update) .top-actions{white-space:nowrap}
    header.top:has(#letsduck-update) .top-actions{flex:none}
    header.top:has(#letsduck-update) > .scheme{min-width:100px;flex:0 1 190px}
    header.top:has(#letsduck-update) .scheme-btn{max-width:100%}
    @media(max-width:1200px){
      header.top:has(#letsduck-update):has(#steps){height:auto;flex-wrap:wrap;padding-block:6px}
      header.top:has(#letsduck-update) #steps{order:3;width:100%;justify-content:space-between;margin:0}
      header.top:has(#letsduck-update) #steps small,header.top:has(#letsduck-update) .step-line{display:none}
      header.top:has(#letsduck-update) .top-actions{margin-inline-start:auto}
    }
    @media(max-width:1400px){
      html:not([lang^=zh]) header.top:has(#letsduck-update):has(#steps){height:auto;flex-wrap:wrap;padding-block:6px}
      html:not([lang^=zh]) header.top:has(#letsduck-update) #steps{order:3;width:100%;justify-content:space-between;margin:0}
      html:not([lang^=zh]) header.top:has(#letsduck-update) #steps small,html:not([lang^=zh]) header.top:has(#letsduck-update) .step-line{display:none}
      html:not([lang^=zh]) header.top:has(#letsduck-update) .top-actions{margin-inline-start:auto}
    }
  `;
  document.head.append(layout);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    :host{display:inline-flex;flex:none;align-self:center;font:600 12px/1.5 system-ui;color:#17243c}
    *{box-sizing:border-box}
    button{position:relative;display:flex;align-items:center;justify-content:center;gap:6px;height:32px;min-width:132px;padding:0 11px;border:1px solid #dce3ef;border-radius:9px;background:#fff;color:#758299;font:inherit;white-space:nowrap;cursor:pointer;overflow:hidden;box-shadow:0 2px 7px #17243c08}
    button:disabled{cursor:default}button:focus-visible{outline:3px solid #a9b6ff;outline-offset:3px}
    .label,.icon{position:relative;z-index:1}.icon{width:13px;height:13px;display:none;flex:none}
    .progress{position:absolute;inset:0 auto 0 0;width:0;background:#4d6bfe12}
    button[data-phase=available],button[data-phase=ready]{color:#4d6bfe;border-color:#d7dfff;background:#f8f9ff}
    button[data-phase=available] .icon,button[data-phase=ready] .icon{display:block}
    button[data-phase=error]{color:#a65d24;border-color:#eedccc;background:#fffaf5}
    button[data-phase=downloading],button[data-phase=waiting],button[data-phase=installing]{color:#68758d}
    [hidden]{display:none!important}
  </style><button type="button" hidden><span class="progress" aria-hidden="true"></span>
    <svg class="icon" aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v8m-3-3 3 3 3-3M3 12v2h10v-2"/></svg><span class="label" aria-live="polite"></span></button>`;
  const required = <T>(value: T | null): T => { if (value === null) throw new Error('Missing desktop update controls'); return value; };
  const button = required(root.querySelector('button')), label = required(root.querySelector('.label')), progress = required(root.querySelector<HTMLElement>('.progress'));
  let state: DesktopUpdateState | undefined;
  function render(next: DesktopUpdateState) {
    state = next;
    const version = 'v' + state.currentVersion, percent = Math.floor(state.percent || 0);
    const locale=resolveDesktopLocale(document.documentElement.lang);
    const copy = {
      idle: version, checking: version,
      available: desktopText(locale,'update.available'),
      downloading: desktopText(locale,'update.downloading',{percent}),
      error: desktopText(locale,'update.error'),
      ready: desktopText(locale,'update.ready'),
      waiting: desktopText(locale,'update.waiting'),
      installing: desktopText(locale,'update.installing'),
    };
    label.textContent = copy[state.phase]; button.dataset.phase = state.phase;
    button.disabled = !['available', 'error', 'ready'].includes(state.phase);
    button.title = ['idle', 'checking'].includes(state.phase) ? desktopText(locale,'update.current',{version}) : copy[state.phase];
    progress.style.width = state.phase === 'downloading' ? percent + '%' : '0%';
    button.hidden = false;
  }
  button.onclick = () => {
    if (!state || button.disabled) return;
    const action = state.phase === 'ready' ? 'install' : state.phase === 'error' ? state.retry || 'check' : 'download';
    void api.action(action);
  };
  api.onState(render); void api.state().then(render);
  new MutationObserver(() => { if (state) render(state); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
