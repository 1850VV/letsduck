import { t as _t, label as _label, onLocale as _onLocale } from "./i18n.mjs"; // Model viewer: real XGO Duck V2 meshes with picking, highlight, view presets, focus,
// assembled / exploded / arranged layouts, an enlarged side-by-side copy of the selection in the same view, and offscreen
// snapshots for posters and 3MF export thumbnails.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { toCreasedNormals } from '../vendor/BufferGeometryUtils.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

import {demandLoop} from './render-policy.mjs';
import {idPicker} from './id-picker.mjs';
import {adaptiveDraw} from './depth-render.mjs';
import {loadModel} from './model-loader.mjs';
export async function loadDuck() {
  const data=await loadModel(),{model,catalog}=data;
  for(const item of [...model.parts,...catalog.products]){const originalName=item.name;Object.defineProperty(item,'name',{get:()=>_label(originalName),enumerable:true,configurable:true});}
  return { ...data, products: new Map(catalog.products.map((p) => [p.id, p])) };
}

const TARGET = new THREE.Vector3(0, 130, 15);
export const VIEWS = { hero: [360, 225, 480], front: [0, 150, 600], side: [590, 160, 15], back: [0, 160, -600], top: [0, 760, 16] };
// Arranged layout: a display-only grid in front of the camera; print layout and source geometry are untouched.
const GRID = { cols: 7, cell: 78, center: new THREE.Vector3(0, 140, 15) };
// Display rig for the action prototype. Pivots are estimated from each link's servo hardware and part
// bounds in the assembled model; they are illustrative, not the robot's calibrated joint frames.
const PIVOTS = { trunk: [0, 100, 5], right_hip_yaw: [-17, 104, 20], left_hip_yaw: [17, 104, 20], right_hip_roll: [-24, 88, 25], left_hip_roll: [24, 88, 25], right_hip_pitch: [-50, 88, 10], left_hip_pitch: [50, 88, 10],
  right_knee: [-48, 63, -18], left_knee: [48, 63, -18], right_ankle: [-49, 29, -9.5], left_ankle: [49, 29, -9.5], neck_pitch: [0, 138, 41], head_pitch: [0, 192, 41], head_yaw: [0, 222, 41], head_roll: [0, 224, 41], jaw: [0, 216, 40] };
const PARENT = { right_hip_yaw: 'trunk', left_hip_yaw: 'trunk', right_hip_roll: 'right_hip_yaw', left_hip_roll: 'left_hip_yaw', right_hip_pitch: 'right_hip_roll', left_hip_pitch: 'left_hip_roll', right_knee: 'right_hip_pitch', left_knee: 'left_hip_pitch',
  right_ankle: 'right_knee', left_ankle: 'left_knee', neck_pitch: 'trunk', head_pitch: 'neck_pitch', head_yaw: 'head_pitch', head_roll: 'head_yaw', jaw: 'head_roll' };
const HEAD_CAD = new Set(['P1-02', 'P2-02', 'P2-06', 'P3-01', 'P4-02']),JAW = new Set(['P1-01', 'P2-01']);
function linkOf(part) {if (JAW.has(part.id)) return 'jaw';if (HEAD_CAD.has(part.id)) return 'head_roll';if (part.id === 'P2-05') return 'right_ankle';if (part.id === 'P2-07') return 'left_ankle';const l = part.assemblyEvidence?.link;return l === 'trunk_base' ? 'trunk' : l;}
export const REST_POSE = { trunk: 0, hip: 0, knee: 0, hipL: 0, hipR: 0, kneeL: 0, kneeR: 0, yawL: 0, yawR: 0, rollL: 0, rollR: 0, neck: 0, headPitch: 0, headYaw: 0, headRoll: 0, jaw: 0, lift: 0 };

// Filament finishes: physically based presets plus procedural FDM layer lines (0.2 mm). The lines fade
// out by screen-space frequency, so they appear when you zoom in instead of shimmering from afar.
// These are visual approximations, not measured material data.
export const FINISHES = {
  basic: { get label() {return _t("text.0039");}, roughness: .42, metalness: 0, clearcoat: .12, clearcoatRoughness: .4, sheen: 0, transmission: 0, thickness: 0, layer: .35 },
  matte: { get label() {return _t("text.0040");}, roughness: .9, metalness: 0, clearcoat: 0, clearcoatRoughness: .5, sheen: .35, transmission: 0, thickness: 0, layer: .22 },
  silk: { get label() {return _t("text.0041");}, roughness: .2, metalness: .45, clearcoat: .8, clearcoatRoughness: .15, sheen: 0, transmission: 0, thickness: 0, layer: .55 },
  translucent: { get label() {return _t("text.0042");}, roughness: .28, metalness: 0, clearcoat: .3, clearcoatRoughness: .3, sheen: 0, transmission: .6, thickness: 4, layer: .3 },
  tpu: { get label() {return _t("text.0043");}, roughness: .78, metalness: 0, clearcoat: 0, clearcoatRoughness: .5, sheen: .5, transmission: 0, thickness: 0, layer: .18 }
};
const FINISH_KEYS = ['roughness', 'metalness', 'clearcoat', 'clearcoatRoughness', 'sheen', 'transmission', 'thickness'];
function withLayers(mat, value = .35) {
  mat.userData.layer = { value };mat.sheenColor.setScalar(.6);mat.sheenRoughness = .8;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLayer = mat.userData.layer;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLayerY;\nvarying vec3 vUpView;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLayerY=position.y;\nvUpView=normalize(normalMatrix*vec3(0.,1.,0.));');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uLayer;\nvarying float vLayerY;\nvarying vec3 vUpView;').replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{float lp=vLayerY/0.2;float fade=clamp(1.0-fwidth(lp)*1.2,0.0,1.0);if(fade>0.0){normal=normalize(normal+vUpView*sin(lp*6.2831853)*uLayer*fade);}}');
  };
  mat.customProgramCacheKey = () => 'fdm-layers';return mat;
}

function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xf1f5ff, 0xb6c2d8, 2.2));
  for (const [color, intensity, position] of [[0xfffbf7, 3.2, [-160, 380, 290]], [0xdde9ff, 1.4, [240, 180, -100]]]) {const l = new THREE.DirectionalLight(color, intensity);l.position.set(...position);scene.add(l);}
}

export function createDuckView({ model, binary, geometry: prepared }) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: false });
  // Phones: a lighter pixel ratio keeps the frame rate up, and firmer damping/slower rotation keep the duck under the finger on a short stage.
  const coarse = matchMedia('(pointer: coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 1.75));renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1.05;renderer.setClearColor(0, 0);
  const scene = new THREE.Scene(),camera = new THREE.PerspectiveCamera(31, 1, 1, 5000),meshes = new Map(),root = new THREE.Group();scene.add(root);
  const controls = new OrbitControls(camera, renderer.domElement);controls.enableDamping = true;if (coarse) {controls.dampingFactor = .2;controls.rotateSpeed = .6;}controls.enablePan = false;controls.minDistance = 60;controls.maxDistance = 1600;controls.target.copy(TARGET);
  const pmrem = new THREE.PMREMGenerator(renderer),room = new RoomEnvironment(),env = pmrem.fromScene(room, .04);scene.environment = env.texture;scene.environmentIntensity = .65;room.dispose();pmrem.dispose();
  addLights(scene);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(105, 48), new THREE.MeshBasicMaterial({ color: 0x1b2440, transparent: true, opacity: .05, depthWrite: false }));shadow.rotation.x = -Math.PI / 2;shadow.position.set(0, -2, 15);scene.add(shadow);
  function geometry(p) {const m=prepared?.get((p.id?'part:':'hardware:')+(p.id||p.name));if(m){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(m.normals,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));g.computeBoundingBox();return g;}const g = new THREE.BufferGeometry();g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(binary, p.geometry.positionOffset, p.geometry.vertexCount * 3).slice(), 3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary, p.geometry.indexOffset, p.geometry.indexCount).slice(), 1));const s = toCreasedNormals(g, Math.PI / 5);g.dispose();s.computeBoundingBox();return s;}
  const center = new THREE.Vector3(0, 120, 15),hardware = [];
  const prep = (m) => {const b = m.geometry.boundingBox;m.userData.c = b.getCenter(new THREE.Vector3());m.userData.size = b.getSize(new THREE.Vector3());m.userData.dir = m.userData.c.clone().sub(center);m.userData.goal = { pos: new THREE.Vector3(), scale: 1 };};
  // Nested joint groups; every mesh keeps world-space geometry and sits at -pivot inside its link.
  const rig = new THREE.Group(),joints = {},objects = [];root.add(rig);
  const joint = (name) => {if (joints[name]) return joints[name];const g = new THREE.Group(),pv = new THREE.Vector3(...PIVOTS[name]),parent = PARENT[name] ? joint(PARENT[name]) : rig;g.position.copy(pv).sub(PARENT[name] ? new THREE.Vector3(...PIVOTS[PARENT[name]]) : new THREE.Vector3());g.userData.pivot = pv;parent.add(g);return joints[name] = g;};
  const place = (m, link) => {const g = joint(link);m.userData.rest = g.userData.pivot.clone().negate();m.position.copy(m.userData.rest);g.add(m);objects.push(m);};
  for (const p of model.parts) {const f = FINISHES[p.material.startsWith('TPU') ? 'tpu' : 'basic'],m = new THREE.Mesh(geometry(p), withLayers(new THREE.MeshPhysicalMaterial({ color: p.color, envMapIntensity: .65, ...Object.fromEntries(FINISH_KEYS.map((k) => [k, f[k]])) }), f.layer));m.userData.id = p.id;prep(m);place(m, linkOf(p));meshes.set(p.id, m);}
  for (const h of model.hardware) {const m = new THREE.Mesh(geometry(h), new THREE.MeshStandardMaterial({ color: h.color, roughness: .5, metalness: .12 }));prep(m);const l = h.name.replace(/_\d+$/, '');place(m, l === 'trunk_base' ? 'trunk' : l);hardware.push(m);}
  const box = new THREE.Box3().setFromObject(root),bounds = { center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) };
  // Sole markers for foot locking and a beak marker for props.
  const marker = (link, at) => {const o = new THREE.Object3D();o.position.set(...at).sub(joints[link].userData.pivot);joints[link].add(o);return o;};
  const soles = { L: marker('left_ankle', [49, 0, -11]), R: marker('right_ankle', [-49, 0, -11]) },beak = marker('head_roll', [0, 211, 104]);
  const soleRest = { L: new THREE.Vector3(49, 0, -11), R: new THREE.Vector3(-49, 0, -11) },deg = THREE.MathUtils.degToRad;
  let pose = { ...REST_POSE };
  // Applies joint angles in degrees. Ankles keep feet flat and the rig shifts so both soles stay planted.
  function setPose(next) {
    invalidate();pose = { ...REST_POSE, ...next };const P = pose;
    joints.trunk.rotation.set(deg(P.trunk), 0, 0);
    for (const [s, side] of [['L', 'left'], ['R', 'right']]) {
      const hip = P.hip + P['hip' + s],knee = P.knee + P['knee' + s];
      joints[side + '_hip_yaw'].rotation.set(0, deg(P['yaw' + s]), 0);joints[side + '_hip_roll'].rotation.set(0, 0, deg(P['roll' + s]));
      joints[side + '_hip_pitch'].rotation.set(deg(hip), 0, 0);joints[side + '_knee'].rotation.set(deg(knee), 0, 0);joints[side + '_ankle'].rotation.set(deg(-(P.trunk + hip + knee)), 0, deg(-P['roll' + s]));
    }
    joints.neck_pitch.rotation.set(deg(P.neck), 0, 0);joints.head_pitch.rotation.set(deg(P.headPitch), 0, 0);joints.head_yaw.rotation.set(0, deg(P.headYaw), 0);joints.head_roll.rotation.set(0, 0, deg(P.headRoll));joints.jaw.rotation.set(deg(P.jaw), 0, 0);
    rig.position.set(0, 0, 0);root.updateMatrixWorld(true);
    // The leg that moves least stays planted (symmetric poses average both feet); no sole may sink below the floor.
    const w = { L: 1 / (1 + (Math.abs(P.hipL) + Math.abs(P.kneeL)) * .15), R: 1 / (1 + (Math.abs(P.hipR) + Math.abs(P.kneeR)) * .15) },off = new THREE.Vector3();
    for (const s of ['L', 'R']) off.addScaledVector(soleRest[s].clone().sub(root.worldToLocal(soles[s].getWorldPosition(new THREE.Vector3()))), w[s] / (w.L + w.R));
    rig.position.copy(off);root.updateMatrixWorld(true);
    const low = Math.min(...['L', 'R'].map((s) => root.worldToLocal(soles[s].getWorldPosition(new THREE.Vector3())).y));if (low < 0) rig.position.y -= low;
    rig.position.y += P.lift;root.updateMatrixWorld(true);
  }

  let revision=0;
  const schedule=demandLoop(animate),invalidate=()=>{revision++;schedule();};
  const draw=adaptiveDraw(renderer,scene,camera);let finishState='';
  let host = null,observer = null,turntable = false,tween = null,frame,selected = new Set(),hovered = new Set(),layout = 'assembly',beforeArrange = null,moving = false,split = null;
  const tanV = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // Selection is drawn as an outline (an inverted hull), never by tinting the part, so the colour on
  // screen is always the colour that will be printed — and matches the enlarged copy beside the duck.
  const outline = (color, opacity) => {const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, transparent: opacity < 1, opacity });m.onBeforeCompile = (sh) => {sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 1.6;');};return m;};
  const OUTLINE = { sel: outline(0x3d5cff, 1), hover: outline(0x9fb1ff, .8) };
  function paintHighlight() {for (const [id, m] of meshes) {m.material.emissiveIntensity = 0;const s = selected.has(id),h = hovered.has(id);let o = m.userData.outline;if ((s || h) && !o) {o = new THREE.Mesh(m.geometry, OUTLINE.sel);o.raycast = () => {};m.add(o);m.userData.outline = o;}if (o) {o.visible = s || h;o.material = s ? OUTLINE.sel : OUTLINE.hover;}}}
  // Colour changes glide over ~150 ms instead of snapping; snapshots and A/B halves set colours instantly.
  const targets = new Map();let tweening = false;
  function setColors(colors, instant = false) {invalidate();for (const [id, m] of meshes) if (colors[id]) {let t = targets.get(id);if (!t) targets.set(id, t = new THREE.Color());t.set(colors[id]);if (instant) m.material.color.copy(t);}tweening = true;}
  function stepColors() {if (!tweening) return;let busy = false;for (const [id, t] of targets) {const c = meshes.get(id).material.color;if (Math.abs(c.r - t.r) + Math.abs(c.g - t.g) + Math.abs(c.b - t.b) > .003) {c.lerp(t, .3);busy = true;} else c.copy(t);}tweening = busy;}
  const flushColors = () => {for (const [id, t] of targets) meshes.get(id).material.color.copy(t);tweening = false;};
  function setFinishes(map) {invalidate();finishState=JSON.stringify(map);for (const [id, m] of meshes) {const f = FINISHES[map[id]] || FINISHES.basic;for (const k of FINISH_KEYS) m.material[k] = f[k];m.material.userData.layer.value = f.layer;}}
  function setHighlight(ids = [], hover = []) {invalidate();selected = new Set(ids);hovered = new Set(hover);paintHighlight();}

  // ---- camera ----
  const framed = (name) => new THREE.Vector3(...VIEWS[name]).sub(TARGET).multiplyScalar(1.32 * (camera.aspect < .9 ? .9 / camera.aspect : 1)).add(TARGET);
  function fly(to, target) {invalidate();tween = { from: camera.position.clone(), to, tFrom: controls.target.clone(), tTo: target.clone(), start: performance.now() };}
  function arrangedCamera() {const w = GRID.cols * GRID.cell,h = Math.ceil(model.parts.length / GRID.cols) * GRID.cell,d = Math.max(h / 2 / tanV(), w / 2 / (tanV() * camera.aspect)) * 1.12;return GRID.center.clone().add(new THREE.Vector3(0, 0, d * 1.18));}
  function view(name) {if (layout === 'arrange') return fly(arrangedCamera(), GRID.center);fly(framed(name), TARGET);}
  function placeCamera(name) {camera.position.copy(framed(name));controls.target.copy(TARGET);controls.update();}
  function boxOf(ids) {const b = new THREE.Box3();root.updateMatrixWorld(true);for (const id of ids) {const m = meshes.get(id);if (m) b.expandByObject(m);}return b;}
  // Flies to the selection from the current direction so the viewer keeps their bearings.
  function focus(ids) {if (!ids.length) return;const b = boxOf(ids),c = b.getCenter(new THREE.Vector3()),r = Math.max(b.getSize(new THREE.Vector3()).length() / 2, 18);const dir = camera.position.clone().sub(controls.target).normalize(),fit = camera.aspect < 1 ? 1 / camera.aspect : 1;fly(c.clone().addScaledVector(dir, r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.25 * fit), c);}

  // ---- layouts ----
  function setLayout(name, { order } = {}) {
    if (name === layout) return;
    setPose(REST_POSE);if (name === 'arrange') setSideCopy(null);
    if (name === 'arrange') {beforeArrange = { pos: camera.position.clone(), target: controls.target.clone() };turntable = false;root.rotation.y = 0;}
    const leaving = layout === 'arrange';layout = name;
    const ids = order || model.parts.map((p) => p.id),rows = Math.ceil(ids.length / GRID.cols);
    for (const m of objects) {
      const g = m.userData.goal;
      if (name === 'explode') {g.pos.copy(m.userData.dir).multiplyScalar(.9);g.scale = 1;} else
      if (name === 'arrange' && m.userData.id) {const i = ids.indexOf(m.userData.id),col = i % GRID.cols,row = Math.floor(i / GRID.cols),s = Math.min(2.4, GRID.cell * .72 / Math.max(m.userData.size.x, m.userData.size.y, m.userData.size.z));g.scale = s;g.pos.set((col - (GRID.cols - 1) / 2) * GRID.cell, GRID.center.y + ((rows - 1) / 2 - row) * GRID.cell, GRID.center.z).sub(m.userData.c.clone().multiplyScalar(s));} else
      {g.pos.set(0, 0, 0);g.scale = 1;}
    }
    hardware.forEach((m) => m.visible = name !== 'arrange');shadow.visible = name !== 'arrange';moving = true;
    if (name === 'arrange') fly(arrangedCamera(), GRID.center);else if (leaving && beforeArrange) {fly(beforeArrange.pos, beforeArrange.target);beforeArrange = null;}
  }
  function stepLayout() {if (!moving) return;let still = true;const want = new THREE.Vector3();for (const m of objects) {const g = m.userData.goal;want.copy(m.userData.rest).add(g.pos);m.position.lerp(want, .16);const s = m.scale.x + (g.scale - m.scale.x) * .16;m.scale.setScalar(s);if (m.position.distanceToSquared(want) > .01 || Math.abs(s - g.scale) > .001) still = false;}if (still) moving = false;}

  // ---- side-by-side copy: the selection, enlarged, standing next to the duck in the same scene ----
  // It shares the camera, so orbiting turns both together; it always sits to the screen-right of the
  // duck, and a view offset keeps the pair centred. Clicks on the copy select and paint the real part.
  const side = { group: new THREE.Group(), inner: new THREE.Group(), key: '', label: null, scale: 1, radius: 0, on: false };side.group.add(side.inner);scene.add(side.group);side.group.visible = false;
  function setSideCopy(ids, label) {invalidate();
    const key = ids?.length && layout !== 'arrange' ? ids.join(',') : '';side.label = label || side.label;
    if (key === side.key) return side.scale;side.key = key;
    side.inner.children.forEach((m) => m.material.dispose());side.inner.clear();
    if (!key) {side.group.visible = false;if (side.label) side.label.hidden = true;camera.clearViewOffset();side.on = false;return 1;}
    const box = new THREE.Box3();
    for (const id of ids) {const src = meshes.get(id);if (!src) continue;const m = new THREE.Mesh(src.geometry, withLayers(src.material.clone(), src.userData?.layer?.value));m.material.emissiveIntensity = 0;m.userData = { id, src };side.inner.add(m);box.union(src.geometry.boundingBox);}
    const size = box.getSize(new THREE.Vector3());side.scale = Math.min(4, Math.max(1, 150 / Math.max(size.x, size.y, size.z)));
    side.inner.position.copy(box.getCenter(new THREE.Vector3())).negate();side.group.scale.setScalar(side.scale);side.radius = size.length() / 2 * side.scale;side.group.visible = true;
    // Turning it on pulls the camera back a little so the pair fits.
    if (!side.on && !tween) {side.on = true;fly(camera.position.clone().sub(controls.target).multiplyScalar(1.6).add(controls.target), controls.target.clone());}
    return side.scale;
  }
  const up = new THREE.Vector3(0, 1, 0),scratch = new THREE.Vector3();
  function placeSide() {
    if (!side.group.visible) return;
    for (const m of side.inner.children) {const src = m.userData.src.material;m.material.color.copy(src.color);for (const k of FINISH_KEYS) m.material[k] = src[k];m.material.userData.layer.value = src.userData.layer.value;}
    const right = controls.target.clone().sub(camera.position).cross(up).setY(0).normalize();
    side.group.position.set(0, 135, 15).addScaledVector(right, 170 + side.radius);side.group.rotation.y = root.rotation.y;
    camera.clearViewOffset();camera.updateMatrixWorld();
    const a = scratch.set(0, 135, 15).project(camera).x,b = side.group.position.clone().project(camera).x,w = renderer.domElement.clientWidth,h = renderer.domElement.clientHeight;
    camera.setViewOffset(w, h, (a + b) / 2 * w / 2, 0, w, h);camera.updateMatrixWorld();
    if (side.label) {const top = side.group.position.clone();top.y += side.radius * .9;top.project(camera);side.label.hidden = false;side.label.style.transform = `translate(calc(${(top.x + 1) / 2 * w}px - 50%),${(1 - top.y) / 2 * h - 28}px)`;}
  }

  // ---- A/B split: same camera, compare colours on the left, the live design on the right ----
  function renderSplit() {
    const cb = renderer.domElement.getBoundingClientRect(),w = cb.width / 2,h = cb.height,aspect = camera.aspect,current = [...meshes].map(([id, m]) => [m, m.material.color.clone()]);
    camera.aspect = w / h;camera.updateProjectionMatrix();renderer.setScissorTest(true);
    for (const [id, m] of meshes) if (split[id]) m.material.color.set(split[id]);
    renderer.setScissor(0, 0, w, h);renderer.setViewport(0, 0, w, h);renderer.render(scene, camera);
    current.forEach(([m, c]) => m.material.color.copy(c));paintHighlight();
    renderer.setScissor(w, 0, w, h);renderer.setViewport(w, 0, w, h);renderer.render(scene, camera);
    renderer.setScissorTest(false);renderer.setViewport(0, 0, cb.width, cb.height);camera.aspect = aspect;camera.updateProjectionMatrix();
  }

  // ---- loop ----
  function resize() {invalidate();if (!host) return;const w = host.clientWidth,h = host.clientHeight;if (w <= 0 || h <= 0) return;renderer.setSize(w, h);camera.aspect = w / h;camera.updateProjectionMatrix();}
  function mount(el, { view: name = 'hero', preserveView=false } = {}) {host = el;observer?.disconnect();el.prepend(renderer.domElement);observer = new ResizeObserver(resize);observer.observe(el);resize();if(!preserveView)placeCamera(name);}
  const ray = new THREE.Raycaster(),pointer = new THREE.Vector2();
  function pick(clientX, clientY) {
    const b = renderer.domElement.getBoundingClientRect(),aspect = camera.aspect;let x = (clientX - b.left) / b.width;
    if (split) {if (x < .5) return null;x = (x - .5) * 2;camera.aspect = aspect / 2;camera.updateProjectionMatrix();}
    pointer.set(x * 2 - 1, -(clientY - b.top) / b.height * 2 + 1);ray.setFromCamera(pointer, camera);const hit = ray.intersectObjects([...meshes.values(), ...(side.group.visible ? side.inner.children : [])], false)[0];
    if (split) {camera.aspect = aspect;camera.updateProjectionMatrix();}return hit?.object.userData.id || null;}
  const gpuPick=idPicker(renderer,scene,camera,()=>[...meshes.values(),...(side.group.visible?side.inner.children:[])],()=>!!split);
  let gpuPickFailed=false;
  async function pickAsync(x,y) {
    if(gpuPickFailed||renderer.getContext().isContextLost())return pick(x,y);
    const version=revision;
    try{const id=await gpuPick(x,y);return revision===version?id:undefined;}
    catch{gpuPickFailed=true;return revision===version?pick(x,y):undefined;}
  }
  controls.addEventListener('start', () => {tween = null;invalidate();});
  controls.addEventListener('change', invalidate);
  renderer.domElement.addEventListener('webglcontextrestored',invalidate);
  function animate() {
    if(!renderer.domElement.isConnected)return false;
    if (tween) {const t = Math.min(1, (performance.now() - tween.start) / 560),e = 1 - (1 - t) ** 3;camera.position.lerpVectors(tween.from, tween.to, e);controls.target.lerpVectors(tween.tFrom, tween.tTo, e);if (t >= 1) tween = null;}
    stepLayout();stepColors();
    if (turntable && !tween) root.rotation.y += .006;
    if (renderer.domElement.isConnected) {controls.update();placeSide();if (split) renderSplit();else draw(layout==='assembly'&&!side.group.visible&&!selected.size&&!hovered.size&&root.children.length===1&&[...meshes.values()].some(m=>m.material.transmission>0),finishState);}
    return !!(tween||moving||tweening||turntable);
  }


  // Renders the assembled duck alone at an exact size from the current camera direction, then restores the live view.
  function snapshot(w, h, { colors, angle } = {}) {
    const saved = { size: renderer.getSize(new THREE.Vector2()), ratio: renderer.getPixelRatio(), aspect: camera.aspect, pos: camera.position.clone(), target: controls.target.clone(), colors: colors && Object.fromEntries([...meshes].map(([id, m]) => [id, '#' + (targets.get(id) || m.material.color).getHexString(THREE.SRGBColorSpace)])), hl: [selected, hovered], spin: root.rotation.y,
      objs: objects.map((o) => [o, o.position.clone(), o.scale.x, o.visible]), shadow: shadow.visible, side: side.group.visible };
    side.group.visible = false;camera.clearViewOffset();
    // A spinning turntable or a non-assembled layout would not read as the finished duck.
    root.rotation.y = 0;objects.forEach((o) => {o.position.copy(o.userData.rest);o.scale.setScalar(1);o.visible = true;});shadow.visible = true;setHighlight([], []);flushColors();if (colors) setColors(colors, true);
    renderer.setPixelRatio(1);renderer.setSize(w, h, false);camera.aspect = w / h;camera.updateProjectionMatrix();
    const look = layout === 'arrange' ? new THREE.Vector3(...VIEWS.hero) : angle ? new THREE.Vector3(...VIEWS[angle]) : camera.position.clone().sub(controls.target).add(TARGET);
    const dir = look.sub(TARGET).normalize(),dist = Math.max(bounds.size.y / 2 / tanV(), Math.max(bounds.size.x, bounds.size.z) / 2 / (tanV() * w / h)) * 1.22;
    camera.position.copy(bounds.center).addScaledVector(dir, dist);camera.lookAt(bounds.center);
    renderer.render(scene, camera);const out = document.createElement('canvas');out.width = w;out.height = h;out.getContext('2d').drawImage(renderer.domElement, 0, 0, w, h);
    renderer.setPixelRatio(saved.ratio);renderer.setSize(saved.size.x, saved.size.y, false);camera.aspect = saved.aspect;camera.updateProjectionMatrix();camera.position.copy(saved.pos);controls.target.copy(saved.target);camera.lookAt(saved.target);controls.update();
    saved.objs.forEach(([o, p, s, v]) => {o.position.copy(p);o.scale.setScalar(s);o.visible = v;});shadow.visible = saved.shadow;side.group.visible = saved.side;
    root.rotation.y = saved.spin;if (saved.colors) setColors(saved.colors, true);selected = saved.hl[0];hovered = saved.hl[1];paintHighlight();invalidate();return out;
  }
  const thumbnail = (colors, w = 540, h = 390) => snapshot(w, h, { colors, angle: 'hero' }).toDataURL('image/png');
  // A separate assembled scene for the publish ceremony (evolution.mjs renders it with its own renderer).
  function createShowcase() {
    const s = new THREE.Scene();s.environment = scene.environment;s.environmentIntensity = .65;addLights(s);
    const list = model.parts.map((p) => {const m = new THREE.Mesh(meshes.get(p.id).geometry, meshes.get(p.id).material.clone());m.material.emissiveIntensity = 0;s.add(m);return [p, m];});
    for (const h of hardware) s.add(new THREE.Mesh(h.geometry, h.material));
    return { scene: s, meshes: list };
  }
  return { invalidate, mount, setColors, setFinishes, setHighlight, pick, pickAsync, view, focus, snapshot, thumbnail, createShowcase, canvas: renderer.domElement,
    setLayout, get layout() {return layout;}, setPose, get pose() {return { ...pose };}, beakPosition: () => root.worldToLocal(beak.getWorldPosition(new THREE.Vector3())), root, joints, debug: () => ({ cam: camera.position.toArray().map(Math.round), target: controls.target.toArray().map(Math.round), aspect: camera.aspect }),
    setSideCopy, setSplit: (colors) => {split = colors || null;invalidate();},
    setTurntable: (on) => {invalidate();if (layout === 'arrange') on = false;turntable = on;if (!on) root.rotation.y = root.rotation.y % (Math.PI * 2);}, resetSpin: () => {root.rotation.y = 0;invalidate();},
    setExplode: (on) => setLayout(on ? 'explode' : 'assembly'), get turntable() {return turntable;} };
}

// 3MF export thumbnails (512×512 PNG data URLs): a cover of the assembled duck plus, for each of the
// six plates, a ¾ view and a top view of its parts in print position. Rendered in a throwaway context.
export async function renderExportThumbnails(data, colors) {
  const {model}=data,binary=data.binary||await data.loadLegacy();
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });r.setSize(512, 512);r.outputColorSpace = THREE.SRGBColorSpace;r.toneMapping = THREE.ACESFilmicToneMapping;r.toneMappingExposure = 1.05;r.setClearColor(0xf4f6fa, 1);
  const s = new THREE.Scene(),cam = new THREE.PerspectiveCamera(36, 1, .1, 3000),pmrem = new THREE.PMREMGenerator(r),room = new RoomEnvironment(),env = pmrem.fromScene(room, .04),owned = [];
  s.environment = env.texture;s.environmentIntensity = .65;room.dispose();pmrem.dispose();addLights(s);
  const geo = (p, print) => {const g = new THREE.BufferGeometry();g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(binary, print ? p.printPositionOffset : p.geometry.positionOffset, p.geometry.vertexCount * 3).slice(), 3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary, p.geometry.indexOffset, p.geometry.indexCount).slice(), 1));const c = toCreasedNormals(g, Math.PI / 5);g.dispose();owned.push(c);return c;};
  const output = {};
  try {
    const items = model.parts.map((p) => {const mat = new THREE.MeshStandardMaterial({ color: colors[p.id] || p.color, roughness: p.material.startsWith('TPU') ? .82 : .47, envMapIntensity: .65 });owned.push(mat);const m = new THREE.Mesh(geo(p, false), mat);s.add(m);return [p, m];});
    const hw = model.hardware.map((h) => {const mat = new THREE.MeshStandardMaterial({ color: h.color, roughness: .5, metalness: .12 });owned.push(mat);const m = new THREE.Mesh(geo(h, false), mat);s.add(m);return m;});
    cam.position.set(330, 225, 460);cam.lookAt(0, 130, 12);r.render(s, cam);output.cover = r.domElement.toDataURL('image/png');
    hw.forEach((m) => s.remove(m));
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xe0e6f0, roughness: 1 }),plate = new THREE.Mesh(new THREE.BoxGeometry(258, .5, 258), plateMat);owned.push(plateMat, plate.geometry);plate.position.y = -1;s.add(plate);
    for (const [p, m] of items) m.geometry = geo(p, true);
    for (let i = 1; i <= 6; i++) {
      const cx = ((i - 1) % 3 - 1) * 290,cz = (Math.floor((i - 1) / 3) - .5) * 290;
      for (const [p, m] of items) {m.visible = p.plate === i;m.position.set(-cx, 0, -cz);}
      cam.position.set(240, 440, 300);cam.up.set(0, 1, 0);cam.lookAt(0, 6, 0);r.render(s, cam);output['plate' + i] = r.domElement.toDataURL('image/png');
      cam.position.set(0, 465, .001);cam.up.set(0, 0, -1);cam.lookAt(0, 0, 0);r.render(s, cam);output['top' + i] = r.domElement.toDataURL('image/png');
    }
    return output;
  } finally {owned.forEach((o) => o.dispose());env.dispose();r.dispose();r.forceContextLoss();}
}
