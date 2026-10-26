// letsduck framing around the assembly prototype. Runs before prototype-v3.mjs builds the model, so the printed parts
// wear the studio draft's colours and finishes in the studio's own material (or plain white, 白胚); servos, boards,
// cables and screws keep their own.
import { applyBrand } from '../shared/brand.mjs';
import { readDraft } from '../shared/draft.mjs';
import { printedMaterial } from '../shared/duck-look.mjs';
import { ACTORS } from './pdf-state.mjs';

const WHITE = '#F7F8FB';
const draft = readDraft();
// The soft pads (P1-xx) are TPU, like in the studio's model.
const finishOf = (id) => draft?.finishes[id] || (id.startsWith('P1-') ? 'tpu' : 'basic');
for (const actor of Object.values(ACTORS)) {
  const id = actor.sourceId || '';if (!/^P\d-\d\d$/.test(id)) continue;
  actor.color = draft?.colors[id] || WHITE;actor.material = printedMaterial(actor.color, finishOf(id));
}

applyBrand();
const tag = document.createElement('span');
tag.className = 'scheme-tag';
tag.title = draft ? '打印件用涂装台当前的配色，舵机、板子和螺丝保持原样' : '还没有涂色，打印件先用白色演示';
const dots = draft ? [...new Set(['P4-01', 'P2-06', 'P5-06', 'P2-03'].map((id) => draft.colors[id]))] : [WHITE];
tag.innerHTML = dots.map((hex) => `<i style="background:${hex}"></i>`).join('') + '<span></span>';
tag.lastChild.textContent = draft ? '配色 · ' + draft.name : '白胚';
document.querySelector('.header-name').after(tag);

// Fade the studio's picture (see index.html) once prototype-v3.mjs marks the model ready.
const picture = document.querySelector('.handoff');
if (picture) {
  const fade = () => {picture.classList.add('done');picture.addEventListener('transitionend', () => picture.remove(), { once: true });};
  if (document.documentElement.dataset.ready) fade();
  else new MutationObserver((_, watch) => {if (document.documentElement.dataset.ready) {watch.disconnect();requestAnimationFrame(fade);}}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ready'] });
}
