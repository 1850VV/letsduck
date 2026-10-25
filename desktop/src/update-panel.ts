import type { UpdateState } from './updates.js';
declare global { interface Window { letsduckDesktop?: { state(): Promise<UpdateState>; action(action: 'check' | 'download' | 'install'): Promise<void>; onState(callback: (state: UpdateState) => void): () => void } } }
const api = window.letsduckDesktop;
if (api) {
  const host = document.createElement('div'); host.id = 'letsduck-update'; document.body.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>:host{position:fixed;right:24px;bottom:24px;z-index:2147483647;font:14px/1.5 system-ui;color:#17243c}*{box-sizing:border-box}.card{width:350px;max-width:calc(100vw - 48px);background:white;border:1px solid #e5e9f2;border-radius:18px;box-shadow:0 12px 38px #273c6a1c;padding:20px}strong{display:block;font-size:16px}p{color:#7c89a2;margin:8px 0 16px}footer{display:flex;justify-content:flex-end;gap:8px}button{font:inherit;border:0;border-radius:12px;padding:9px 16px;cursor:pointer;color:#4d6bfe;background:#f1f3f9}button.primary{background:#4d6bfe;color:white;font-weight:650}button:focus-visible{outline:3px solid #9eaaff;outline-offset:2px}button:disabled{cursor:default;opacity:.7}.badge{box-shadow:0 5px 24px #273c6a1c;background:white;border:1px solid #e5e9f2}progress{width:100%;accent-color:#4d6bfe;margin-bottom:12px}[hidden]{display:none!important}</style><button class="badge" hidden></button><section class="card" role="status" aria-live="polite" hidden><strong></strong><p></p><progress max="100" hidden></progress><footer><button class="later"></button><button class="primary"></button></footer></section>`;
  const card = root.querySelector<HTMLElement>('.card')!, badge = root.querySelector<HTMLButtonElement>('.badge')!, title = root.querySelector('strong')!, message = root.querySelector('p')!, progress = root.querySelector<HTMLProgressElement>('progress')!, later = root.querySelector<HTMLButtonElement>('.later')!, action = root.querySelector<HTMLButtonElement>('.primary')!;
  let state: UpdateState = { phase: 'idle' }, collapsed = false, previous = '';
  const en = () => document.documentElement.lang.startsWith('en'), text = (cn: string, english: string) => en() ? english : cn;
  function render(next: UpdateState) {
    state = next;
    if (next.phase !== previous) { if (['available', 'error', 'ready'].includes(next.phase)) collapsed = false; previous = next.phase; }
    const active = !['idle', 'checking'].includes(state.phase); card.hidden = !active || collapsed; badge.hidden = !active || !collapsed;
    badge.textContent = text('有新版本', 'Update available'); title.textContent = text('来做鸭有新版本', 'A new letsduck version is available'); later.textContent = text('稍后', 'Later');
    progress.hidden = state.phase !== 'downloading'; progress.value = state.percent || 0; action.disabled = ['downloading', 'waiting'].includes(state.phase);
    const copy = {
      available: [text('新版已准备好，可以更新了。', 'A new version is available.'), text('更新', 'Update')],
      downloading: [text(`正在下载 ${Math.floor(state.percent || 0)}%`, `Downloading ${Math.floor(state.percent || 0)}%`), text('下载中', 'Downloading')],
      error: [text('更新未完成，请检查网络后重试。', 'Update did not finish. Check your connection and try again.'), text('重试', 'Retry')],
      ready: [text('下载完成，重启后即可使用新版。', 'The download is ready. Restart to use the new version.'), text('重启更新', 'Restart and update')],
      waiting: [text('正在完成当前导出，完成后更新。', 'Finishing current work before updating.'), text('等待完成', 'Waiting')],
      idle: ['', ''], checking: ['', ''],
    }[state.phase]; message.textContent = copy[0]!; action.textContent = copy[1]!;
  }
  later.onclick = () => { collapsed = true; render(state); }; badge.onclick = () => { collapsed = false; render(state); };
  action.onclick = () => { const command = state.phase === 'ready' ? 'install' : state.phase === 'error' ? state.retry || 'check' : 'download'; void api!.action(command); };
  api.onState(render); void api.state().then(render);
  new MutationObserver(() => render(state)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
