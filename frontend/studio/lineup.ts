import type {DuckView} from '../shared/duck-view.js';
import type {Design} from '../shared/types.js';
import {required} from '../lib/browser.js';
interface Spring {v:number;vel:number;goal:number}
type Look=Pick<Design,'colors'> & Partial<Pick<Design,'finishes'>>;
interface LineupDuck {g:THREE.Group;turn:THREE.Group;mats:Map<string,THREE.MeshPhysicalMaterial>;ring:THREE.Mesh<THREE.RingGeometry,THREE.MeshBasicMaterial>;x:Spring;y:Spring;s:Spring;lift:Spring;spin:{t:number;look:Look;painted?:boolean}|null;filled:boolean}
// Step 1 · 选个起点 as a lineup: four real ducks stand on the stage like a character select. They share the
// studio duck's geometry (only the materials are their own) in a layer of the same scene, and draw only while
// something moves. Picking one and going on hands over to the studio duck: the chosen duck walks to the centre,
// where the studio duck stands in exactly the same place, and the camera flies to the usual view.
import * as THREE from 'three';
import { FINISHES, FINISH_KEYS, withLayers } from '../shared/duck-look.js';

const SX = 215,SY = 330,BASE_YAW = -.5,FILL = { wide: { w: .7, h: .6 }, narrow: { w: .84, h: .9 } };
const ringGeo = new THREE.RingGeometry(82, 88, 72),discGeo = new THREE.CircleGeometry(92, 48);
const spring = (v:number) => ({ v, vel: 0, goal: v });
const settle = (s:Spring, dt:number, k = 170, c = 17) => {s.vel += (k * (s.goal - s.v) - c * s.vel) * dt;s.v += s.vel * dt;if (Math.abs(s.goal - s.v) < .002 && Math.abs(s.vel) < .002) {s.v = s.goal;s.vel = 0;}return s.v !== s.goal;};
const ease = (t:number) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// looks: up to four { colors, finishes } (part id → hex / finish name). tags: the element whose [data-slot] children
// are kept under each duck's feet. onPick(i) on a click, onStart(i) on a double-click.
export function createLineup(view:DuckView, { tags, onPick, onStart }:{tags:HTMLElement;onPick(index:number):void;onStart(index:number):void}) {
  const { layer, camera, controls, root, shadow, meshes, hardware, onFrame } = view.stage,canvas = view.canvas,host = required(canvas.parentElement);
  const box = new THREE.Box3();for (const m of meshes.values()) box.union(required(m.geometry.boundingBox));
  const mid = box.getCenter(new THREE.Vector3()),HEIGHT = box.max.y,v = new THREE.Vector3();
  const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3() },yaw = spring(0);
  let ducks:LineupDuck[] = [],count = 4,shown = false,snap = false,size = '',flying = false,active = false,leaving:{i:number}|null = null,narrow = false,hover = -1,selected = -1,drag:{x:number;y:number;yaw:number;moved:boolean;id:number}|null = null,last = 0,timers:ReturnType<typeof setTimeout>[] = [],maxDistance = controls.maxDistance;

  function build() {
    ducks = [0, 1, 2, 3].map(() => {
      // turn spins about the duck's own centre; at yaw 0 and the origin the duck sits exactly where the studio duck does.
      const g = new THREE.Group(),turn = new THREE.Group(),body = new THREE.Group(),mats = new Map<string,THREE.MeshPhysicalMaterial>();
      turn.position.set(mid.x, 0, mid.z);body.position.set(-mid.x, 0, -mid.z);turn.add(body);g.add(turn);
      for (const [id, src] of meshes) {const mat = withLayers(src.material.clone(), src.material.userData.layer?.value);mat.emissiveIntensity = 0;body.add(new THREE.Mesh(src.geometry, mat));mats.set(id, mat);}
      for (const h of hardware) body.add(new THREE.Mesh(h.geometry, h.material));
      const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: 0x1b2440, transparent: true, opacity: .06, depthWrite: false }));
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x4d6bfe, transparent: true, opacity: 0, depthWrite: false }));
      for (const m of [disc, ring]) {m.rotation.x = -Math.PI / 2;m.position.set(mid.x, 0, mid.z);g.add(m);}disc.position.y = -1.5;ring.position.y = -1;
      g.visible = false;layer.add(g);
      return { g, turn, mats, ring, x: spring(0), y: spring(0), s: spring(0), lift: spring(0), spin: null, filled: false };
    });
  }
  function paint(d:LineupDuck, look:Look) {
    for (const [id, mat] of d.mats) {
      if (look.colors[id]) mat.color.set(look.colors[id]);
      const f = FINISHES[look.finishes?.[id]??'basic'] || FINISHES.basic;for (const k of FINISH_KEYS) mat[k] = f[k];mat.userData.layer.value = f.layer;
    }
  }
  // Four abreast on a wide stage, a 2×2 group photo on a narrow one; a smaller squad stands centred.
  const slot = (i:number):[number,number] => {
    if (!narrow) return [(i - (count - 1) / 2) * SX, 0];
    const row = count > 2 && i >= 2 ? 0 : SY,inRow = count <= 2 ? count : i < 2 ? 2 : count - 2;
    return [((i % 2) - (inRow - 1) / 2) * SX * .98, count <= 2 ? SY / 2 : row];
  };
  function framing(goalPos:THREE.Vector3, goalTarget:THREE.Vector3) {
    const w = host.clientWidth,h = host.clientHeight,aspect = w / h,tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const cw = (narrow ? 2 : 4) * SX,ch = narrow ? SY + HEIGHT : HEIGHT,top = narrow ? 70 : 80,bottom = narrow ? 200 : 140;
    // Leave room in pixels for the tabs above and the names and buttons below, and some air around the squad:
    // the row spans at most FILL.w of the width and FILL.h of the height left between them.
    const fill = narrow ? FILL.narrow : FILL.wide,band = (h - top - bottom) / h;
    const dist = Math.max(ch / 2 / tan / (band * fill.h), cw / 2 / (tan * aspect) / fill.w),cy = ch / 2 + (top - bottom) * dist * tan / h;
    goalTarget.set(0, cy, 0);goalPos.set(0, cy + dist * .1, dist);
  }
  function place() {
    if (!ducks.length) return;const w = host.clientWidth,h = host.clientHeight;
    for (const el of tags.querySelectorAll<HTMLElement>('[data-slot]')) {
      const d = required(ducks[Number(el.dataset.slot)]);v.set(d.x.v, d.y.v - 14, 40).project(camera);
      el.style.transform = `translate(calc(${(v.x + 1) / 2 * w}px - 50%),${(1 - v.y) / 2 * h}px)`;el.style.opacity = String(Math.max(0, Math.min(1, d.s.v)));el.classList.toggle('hot', Number(el.dataset.slot) === hover);
    }
  }
  function frame(now:number) {
    if (!active && !leaving) return false;
    const dt = Math.min(.05, (now - last) / 1000);last = now;
    const was = narrow;narrow = host.clientWidth < 640 || host.clientWidth / host.clientHeight < .9;
    if (was !== narrow) ducks.forEach((d, i) => {if (d.filled && !leaving) [d.x.goal, d.y.goal] = slot(i);});
    let busy = settle(yaw, dt, 90, 19);
    if (active && !leaving) {
      const goalPos = new THREE.Vector3(),goalTarget = new THREE.Vector3();framing(goalPos, goalTarget);
      // A resized stage (the window, the phone layout settling) re-frames at once; only a real move glides.
      const dims = host.clientWidth + 'x' + host.clientHeight;if (dims !== size) {if (size && !flying) snap = true;size = dims;}
      const k = snap ? 1 : 1 - Math.exp(-dt * 6);snap = false;cam.pos.lerp(goalPos, k);cam.target.lerp(goalTarget, k);flying = cam.pos.distanceToSquared(goalPos) > .25;busy = busy || flying;
      camera.position.copy(cam.pos);controls.target.copy(cam.target);
    }
    ducks.forEach((d, i) => {
      const chosen = leaving && leaving.i === i,on = i === selected && !leaving,hot = i === hover && !leaving;
      d.lift.goal = on || hot ? 6 : 0;
      for (const s of [d.x, d.y, d.lift]) busy = settle(s, dt) || busy;busy = settle(d.s, dt, 210, 15) || busy;
      let turn = chosen ? 0 : yaw.v + (hot ? BASE_YAW + .3 : BASE_YAW),up = d.lift.v;
      if (d.spin) {
        d.spin.t += dt / .6;const t = Math.min(1, d.spin.t);turn += ease(t) * Math.PI * 2;up += Math.sin(Math.PI * t) * 34;
        if (t >= .5 && !d.spin.painted) {d.spin.painted = true;paint(d, d.spin.look);}
        if (t >= 1) d.spin = null;busy = true;
      }
      if (chosen) turn = (d.turn.rotation.y + (0 - d.turn.rotation.y) * Math.min(1, dt * 9));
      const s = Math.max(0, d.s.v) * (on ? 1.06 : 1);
      d.turn.rotation.y = turn;d.turn.position.y = up;d.g.position.set(d.x.v, d.y.v, 0);d.g.scale.setScalar(Math.max(1e-4, s));d.g.visible = s > .01;
      if (chosen && Math.abs(turn) > .002) busy = true;
      const ring = leaving ? 0 : on ? .95 : hot ? .35 : 0,o = d.ring.material;if (Math.abs(ring - o.opacity) > .01) {o.opacity += (ring - o.opacity) * Math.min(1, dt * 12);busy = true;} else o.opacity = ring;
    });
    place();
    // Hand-off done: the studio duck takes over from the chosen duck, which stands exactly where it does.
    if (leaving && !busy) finish();
    return busy;
  }
  function finish() {
    leaving = null;active = false;ducks.forEach((d) => {d.g.visible = false;d.filled = false;});
    root.visible = true;shadow.visible = true;controls.enabled = true;controls.maxDistance = maxDistance;canvas.style.cursor = '';view.invalidate();
  }
  const clear = () => {timers.forEach(clearTimeout);timers = [];};
  const later = (fn:()=>void, ms:number) => timers.push(setTimeout(() => {fn();view.invalidate();}, ms));

  // Shows a squad: from the studio duck the four pop up in turn; a squad already standing drops out duck by duck,
  // each one changing colours while it is hidden.
  function show(looks:Look[]) {
    const initial=!shown;
    if(initial)narrow=host.clientWidth<640||host.clientWidth/host.clientHeight<.9;
    if (!ducks.length) build();clear();count = looks.length;
    if (!active || leaving) {
      // The page opens straight onto the lineup; coming back from painting, the camera flies out to it.
      if (!active) {cam.pos.copy(camera.position);cam.target.copy(controls.target);maxDistance = controls.maxDistance;snap = !shown;shown = true;}
      active = true;leaving = null;root.visible = false;shadow.visible = false;controls.enabled = false;controls.maxDistance = Infinity;yaw.goal = 0;
    }
    ducks.forEach((d, i) => {
      const look = looks[i],swap = () => {
        d.filled = !!look;if (look) paint(d, look);const [x, y] = slot(i);
        if (d.s.v < .05) {d.x.v = x;d.y.v = y - 30;}d.x.goal = x;d.y.goal = y;d.s.goal = look ? 1 : 0;d.spin = null;
      };
      if(initial){swap();d.x.v=d.x.goal;d.y.v=d.y.goal;d.s.v=d.s.goal;}
      else if (d.filled && d.s.v > .05) {d.s.goal = 0;d.y.goal = slot(i)[1] - 30;later(swap, 150 + i * 70);} else later(swap, i * 70);
    });
    view.invalidate();
  }
  // Dice: the duck spins once on the spot and changes colours while it faces away.
  function spin(i:number, look:Look, delay = 0) {later(() => {required(ducks[i]).spin = { t: 0, look };}, delay);}
  function hide(i = -1) {
    if (!active || leaving) return;clear();hover = -1;leaving = { i: ducks[i]?.filled ? i : -1 };yaw.goal = 0;
    ducks.forEach((d, k) => {if (k === i) {d.x.goal = 0;d.y.goal = 0;d.s.goal = 1;} else {d.s.goal = 0;d.y.goal -= 60;}});
    view.view('hero');view.invalidate();
  }
  function select(i:number) {selected = i;view.invalidate();}

  // Hit test in screen space: the whole column above a platform counts, so a duck is easy to grab.
  function hit(cx:number, cy:number) {
    const r = canvas.getBoundingClientRect(),px = cx - r.left,py = cy - r.top;let best = -1,bestD = Infinity;
    ducks?.forEach((d, i) => {
      if (!d.filled || d.s.goal < .5) return;
      const a = v.set(d.x.v, d.y.v, 0).project(camera),ax = (a.x + 1) / 2 * r.width,ay = (1 - a.y) / 2 * r.height,by = (1 - v.set(d.x.v, d.y.v + HEIGHT, 0).project(camera).y) / 2 * r.height;
      const dx = Math.abs(px - ax);if (py > by - 10 && py < ay + 30 && dx < (ay - by) * .42 && dx < bestD) {bestD = dx;best = i;}
    });
    return best;
  }
  const live = () => active && !leaving;
  function setHover(i:number) {if (i === hover) return;hover = i;tags.querySelectorAll<HTMLElement>('[data-slot]').forEach((el) => el.classList.toggle('hot', Number(el.dataset.slot) === i));view.invalidate();}
  canvas.addEventListener('pointerdown', (e) => {if (live()) drag = { x: e.clientX, y: e.clientY, yaw: yaw.goal, moved: false, id: e.pointerId };});
  canvas.addEventListener('pointermove', (e) => {
    if (!live()) return;
    if (drag && e.pointerId === drag.id) {const dx = e.clientX - drag.x;if (!drag.moved && Math.hypot(dx, e.clientY - drag.y) > (e.pointerType === 'touch' ? 12 : 5)) drag.moved = true;if (drag.moved) {yaw.goal = drag.yaw + dx * .01;view.invalidate();}}
    const i = drag?.moved ? -1 : hit(e.clientX, e.clientY);setHover(i);canvas.style.cursor = i >= 0 ? 'pointer' : drag?.moved ? 'grabbing' : 'grab';
  });
  canvas.addEventListener('pointerup', (e) => {const d = drag;drag = null;if (!live() || !d || d.moved || e.pointerId !== d.id) return;const i = hit(e.clientX, e.clientY);if (i >= 0) onPick(i);});
  canvas.addEventListener('pointercancel', () => {drag = null;});
  canvas.addEventListener('pointerleave', () => {if (live()) setHover(-1);});
  canvas.addEventListener('dblclick', (e) => {if (!live()) return;const i = hit(e.clientX, e.clientY);if (i >= 0) onStart(i);});
  onFrame(frame);

  return { show, spin, hide, select, place, get active() {return active && !leaving;} };
}
