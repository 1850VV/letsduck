// letsduck framing around the assembly prototype. Runs before prototype-v3.mjs builds the model, so the printed parts
// wear the studio draft's colours and finishes in the studio's own material (or plain white, 白胚); servos, boards,
// cables and screws keep their own.
import { applyBrand } from '../shared/brand.mjs';
import { readDraft } from '../shared/draft.mjs';
import { printedMaterial } from '../shared/duck-look.mjs';
import { ACTORS } from './hardware-state.mjs';
import {onPageActivity} from '../shared/personal-page.mjs';

const WHITE = '#F7F8FB';
applyBrand();
const tag = document.createElement('span');
tag.className = 'scheme-tag';
document.querySelector('.header-name').after(tag);
let signature;
function refreshDraft(){
 const draft=readDraft(),next=JSON.stringify(draft&&[draft.name,draft.colors,draft.finishes]);
 if(next===signature)return;signature=next;
 for(const actor of Object.values(ACTORS)){
  const id=actor.sourceId||'';if(!/^P\d-\d\d$/.test(id))continue;
  actor.material?.dispose();actor.color=draft?.colors[id]||WHITE;
  actor.material=printedMaterial(actor.color,draft?.finishes[id]||(id.startsWith('P1-')?'tpu':'basic'));
 }
 tag.title=draft?'打印件用涂装台当前的配色，舵机、板子和螺丝保持原样':'还没有涂色，打印件先用白色演示';
 const dots=draft?[...new Set(['P4-01','P2-06','P5-06','P2-03'].map(id=>draft.colors[id]))]:[WHITE];
 tag.replaceChildren(...dots.map(hex=>{const dot=document.createElement('i');dot.style.background=hex;return dot;}),document.createElement('span'));
 tag.lastChild.textContent=draft?'配色 · '+draft.name:'白胚';
 dispatchEvent(new Event('personal:appearance'));
}
refreshDraft();onPageActivity(active=>{if(active)refreshDraft();});

// Fade the studio's picture (see index.html) once prototype-v3.mjs marks the model ready.
const picture = document.querySelector('.handoff');
if (picture) {
  const fade = () => {picture.classList.add('done');picture.addEventListener('transitionend', () => picture.remove(), { once: true });};
  if (document.documentElement.dataset.ready) fade();
  else new MutationObserver((_, watch) => {if (document.documentElement.dataset.ready) {watch.disconnect();requestAnimationFrame(fade);}}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-ready'] });
}
