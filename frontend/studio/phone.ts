import {query as $,required,eventElement} from '../lib/browser.js';
// Phone layout (portrait, up to 760px wide): the duck fills the screen between a slim top bar and a
// draggable bottom sheet that holds the step panel; the three steps live in a bottom tab bar; paint and
// view tools float on the stage; touch gestures replace hover and keyboard. Desktop never runs this.
// Everything here drives the studio through its own controls, so the studio logic stays in studio.mjs.
const PHONE = matchMedia('(max-width: 760px)');
const root = document.documentElement, body = document.body, studio = $('#studio'), stage = $('#stage'), panel = $('#panel');
const buzz = (ms = 8) => {try {navigator.vibrate?.(ms);} catch {}};

// ---------- bottom sheet: three snap heights, dragged by the grip or the panel header, flicked to snap ----------
const PEEK:Record<string,number> = {1: 262, 2: 346, 3: 282};       // room for the color grid in the default bottom editor
const MINI = 112;                            // a sliver: the duck gets almost the whole screen
type Snap='mini'|'peek'|'full';
let snap:Snap = 'peek', dragging:{y:number;h:number;t:number;moved:boolean;id:number;from:EventTarget|null;v?:number}|null = null;
const px = (name:string) => parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0;
// Measured, not read from the CSS variables: those hold calc(... + env(safe-area-inset-*)) text.
const room = () => innerHeight - $('.top').getBoundingClientRect().height;
function heightOf(name:Snap) {
  const max = room() - 24;
  if (name === 'mini') return Math.min(MINI, max);
  if (name === 'full') return max;
  return Math.min(PEEK[studio.dataset.step??''] || 262, Math.round(max * .6));
}
function setSheet(h:number, settle = true) {
  root.style.setProperty('--ph-sheet', Math.round(h) + 'px');
  // The stage only resizes when the sheet settles (and never past the default height), so dragging stays smooth.
  if (settle) root.style.setProperty('--ph-stage-sheet', Math.round(Math.min(h, heightOf('peek'))) + 'px');
}
function snapTo(name:Snap) {snap = name;body.dataset.sheet = name;setSheet(heightOf(name));}

const grip = document.createElement('button');
grip.className = 'ph-grip';grip.type = 'button';grip.setAttribute('aria-label', 'Resize panel');
grip.innerHTML = '<i></i>';

function dragStart(e:PointerEvent) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  dragging = {y: e.clientY, h: px('--ph-sheet'), t: performance.now(), moved: false, id: e.pointerId, from: e.currentTarget};
}
function dragMove(e:PointerEvent) {
  if (!dragging || e.pointerId !== dragging.id) return;
  const dy = dragging.y - e.clientY;
  if (!dragging.moved && Math.abs(dy) < 8) return;
  if (!dragging.moved) {dragging.moved = true;body.classList.add('ph-dragging');}
  setSheet(Math.max(64, Math.min(room() - 8, dragging.h + dy)), false);
  dragging.v = dy / Math.max(1, performance.now() - dragging.t);
}
function dragEnd(e:PointerEvent) {
  if (!dragging || e.pointerId !== dragging.id) return;
  const d = dragging;dragging = null;body.classList.remove('ph-dragging');
  if (!d.moved) {if (d.from === grip) {snapTo(snap === 'peek' ? 'full' : 'peek');buzz();}return;}
  const h = px('--ph-sheet'), order = ['mini', 'peek', 'full'] as const, heights = order.map(heightOf);
  // A flick moves one snap in its direction; a slow drag lands on the nearest height.
  let i = heights.reduce((best, x, k) => Math.abs(x - h) < Math.abs(required(heights[best]) - h) ? k : best, 0);
  const v = (h - d.h) / Math.max(1, performance.now() - d.t);
  if (Math.abs(v) > .45) i = Math.max(0, Math.min(2, order.indexOf(snap) + (v > 0 ? 1 : -1)));
  snapTo(required(order[i]));buzz();
  e.preventDefault();
}
for (const el of [grip, panel]) el.addEventListener('pointerdown', (e) => {if (el === grip || eventElement(e).closest<HTMLElement>('.panel-head')) dragStart(e);});
// The finger soon leaves the grip, so the drag is followed on the whole window.
window.addEventListener('pointermove', dragMove);window.addEventListener('pointerup', dragEnd);window.addEventListener('pointercancel', dragEnd);
// A drag that started on the panel header must not also press the button under the finger.
panel.addEventListener('click', (e) => {if (body.classList.contains('ph-dragged')) {e.stopPropagation();e.preventDefault();body.classList.remove('ph-dragged');}}, true);
panel.addEventListener('pointerup', () => {if (body.classList.contains('ph-dragging')) body.classList.add('ph-dragged');}, true);

// ---------- top bar: icon, scheme name, undo/redo and a "⋯" menu for language, account and gallery ----------
const more = document.createElement('button');
more.className = 'ph-more icon';more.type = 'button';more.textContent = '⋯';more.setAttribute('aria-haspopup', 'true');more.setAttribute('aria-expanded', 'false');
const menu = document.createElement('div');
menu.className = 'ph-menu';menu.hidden = true;
const moved:[HTMLElement,HTMLElement,ChildNode|null][] = [];
function openMenu(on:boolean) {menu.hidden = !on;more.setAttribute('aria-expanded', String(on));}
more.addEventListener('click', (e) => {e.stopPropagation();openMenu(Boolean(menu.hidden));});
document.addEventListener('pointerdown', (e) => {if (!menu.hidden && !menu.contains(eventElement(e)) && eventElement(e) !== more && !eventElement(e).closest<HTMLElement>('.language-menu')) openMenu(false);});

// ---------- gestures on the duck ----------
let tap:{t:number;x:number;y:number}|null = null, press:{x:number;y:number;id:number;fired:boolean;timer:ReturnType<typeof setTimeout>}|null = null, synthetic = 0;
stage.addEventListener('dblclick', (e) => {if (e.isTrusted && performance.now() - synthetic < 600) {e.stopPropagation();synthetic = 0;}}, true);
function canvasAt(e:Event) {return eventElement(e) === stage.querySelector('canvas');}
stage.addEventListener('pointerdown', (e) => {
  if (!body.classList.contains('phone') || e.pointerType === 'mouse' || !canvasAt(e)) return;
  clearTimeout(press?.timer);
  // Long press: show the original colours while the finger stays down (the studio's 按住对比).
  press = {x: e.clientX, y: e.clientY, id: e.pointerId, fired: false, timer: setTimeout(() => {
    if(!press)return;press.fired = true;stage.dataset.longpress = '1';body.classList.add('ph-holding');buzz(14);
    $('#hold').dispatchEvent(new Event('compare-start'));
  }, 480)};
});
stage.addEventListener('pointermove', (e) => {if (press && e.pointerId === press.id && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) {clearTimeout(press.timer);if (!press.fired) press = null;}});
function release(e:PointerEvent) {
  if (!press || e.pointerId !== press.id) return;
  clearTimeout(press.timer);
  if (press.fired) {body.classList.remove('ph-holding');$('#hold').dispatchEvent(new Event('compare-end'));press = null;return;}
  press = null;
  // Double tap: focus the tapped part in step 2 (the studio's double-click), elsewhere reset the view.
  const now = performance.now();
  if (tap && now - tap.t < 320 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 32) {
    tap = null;buzz();
    // iOS sends no double-click for touch, so send one; Chrome's own copy that may follow is dropped below.
    if (studio.dataset.step === '2') {synthetic = performance.now();required(stage.querySelector('canvas')).dispatchEvent(new MouseEvent('dblclick', {bubbles: true, clientX: e.clientX, clientY: e.clientY}));}
    else document.querySelector<HTMLElement>('#views [data-view="hero"]')?.click();
    return;
  }
  tap = {t: now, x: e.clientX, y: e.clientY};
}
stage.addEventListener('pointerup', release);stage.addEventListener('pointercancel', (e) => {if (press && e.pointerId === press.id) {clearTimeout(press.timer);if (press.fired) {body.classList.remove('ph-holding');$('#hold').dispatchEvent(new Event('compare-end'));}press = null;}});

// Light haptics where the browser offers them: steps, colours, parts, cards and moves.
document.addEventListener('click', (e) => {if (body.classList.contains('phone') && eventElement(e).closest<HTMLElement>('#steps button,[data-key],[data-zone],[data-start],[data-act],[data-tool],[data-scope]')) buzz();});

// ---------- switching in and out of phone mode ----------
function enter() {
  body.classList.add('phone');
  const actions = $('.top-actions');
  if (!more.isConnected) actions.append(more);
  for (const el of [document.querySelector<HTMLElement>('#scheme'), document.querySelector<HTMLElement>('#save-scheme'), document.querySelector<HTMLElement>('#undo'), document.querySelector<HTMLElement>('#redo'), document.querySelector<HTMLElement>('.language'), document.querySelector<HTMLElement>('#profile-slot'), document.querySelector<HTMLElement>('.top-actions a.ghost'), document.querySelector<HTMLElement>('#import-code')]) {
    if (el && el.parentElement !== menu) {moved.push([el, required(el.parentElement), el.nextSibling]);menu.append(el);}
  }
  if (!menu.isConnected) document.body.append(menu);
  if (!grip.isConnected) studio.append(grip);
  snapTo(snap);
}
function leave() {
  body.classList.remove('phone', 'ph-holding', 'ph-dragging');delete body.dataset.sheet;openMenu(false);
  while (moved.length) {const [el, parent, next] = required(moved.pop());parent.insertBefore(el, next && next.parentElement === parent ? next : null);}
  more.remove();grip.remove();
  root.style.removeProperty('--ph-sheet');root.style.removeProperty('--ph-stage-sheet');
}
const sync = () => PHONE.matches ? enter() : leave();
PHONE.addEventListener('change', sync);
window.addEventListener('resize', () => {if (body.classList.contains('phone') && !dragging) snapTo(snap);});
// Each step opens with its default sheet height.
new MutationObserver(() => {if (body.classList.contains('phone')) snapTo('peek');}).observe(studio, {attributes: true, attributeFilter: ['data-step']});
// The language menu and profile chip are created by other modules; wait for them before moving them.
const ready = () => document.querySelector('.language') && document.querySelector('#profile-slot');
if (ready()) sync();else {const wait = new MutationObserver(() => {if (ready()) {wait.disconnect();sync();}});wait.observe(document.body, {childList: true, subtree: true});setTimeout(() => {wait.disconnect();sync();}, 3000);}
