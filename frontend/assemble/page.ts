import {assemblyText} from './i18n.js';
import {onLocale} from '../shared/i18n.js';
// letsduck framing around the assembly prototype. Runs before prototype-v3.mjs builds the model, so the printed parts
// wear the studio draft's colours and finishes in the studio's own material (or plain white, 白胚); servos, boards,
// cables and screws keep their own.
import { applyBrand } from '../shared/brand.js';
import { readDraft } from '../shared/draft.js';
import { printedMaterial } from '../shared/duck-look.js';
import { ACTORS } from './hardware-state.js';

const WHITE = '#F7F8FB';
const draft = readDraft();
// The soft pads (P1-xx) are TPU, like in the studio's model.
const finishOf = (id:string) => draft?.finishes[id] || (id.startsWith('P1-') ? 'tpu' : 'basic');
for (const actor of Object.values(ACTORS)) {
  const id = actor.sourceId || '';if (!/^P\d-\d\d$/.test(id)) continue;
  actor.color = draft?.colors[id] || WHITE;actor.material = printedMaterial(actor.color!, finishOf(id));
}

applyBrand();
const tag = document.createElement('span');
tag.className = 'scheme-tag';
tag.title = draft ? assemblyText("assemble.ui.0266") : assemblyText("assemble.ui.0267");
const dots = draft ? [...new Set(['P4-01', 'P2-06', 'P5-06', 'P2-03'].map((id) => draft.colors[id]))] : [WHITE];
tag.innerHTML = dots.map((hex) => `<i style="background:${hex}"></i>`).join('') + '<span></span>';
tag.lastChild!.textContent = draft ? assemblyText("assemble.ui.0268") + draft.name : assemblyText("assemble.ui.0269");
document.querySelector('.header-name')!.after(tag);
onLocale(()=>{tag.title=draft?assemblyText('assemble.ui.0266'):assemblyText('assemble.ui.0267');tag.lastChild!.textContent=draft?assemblyText('assemble.ui.0268')+draft.name:assemblyText('assemble.ui.0269');});

// Fade the studio's picture (see index.html) once prototype-v3.mjs marks the model ready.
const picture = document.querySelector('.handoff');
if (picture) {
  const fade = () => {picture.classList.add('done');picture.addEventListener('transitionend', () => picture.remove(), { once: true });};
  if (document.documentElement.dataset.ready) fade();
  else new MutationObserver((_, watch) => {if (document.documentElement.dataset.ready) {watch.disconnect();requestAnimationFrame(fade);}}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ready'] });
}
