import { t as _t, label as _label, onLocale as _onLocale } from "./i18n.mjs"; // Prototype action library for the display rig in duck-view.mjs: keyframed joint angles (degrees),
// a sock prop for the pick-up, and MicroDuck's own voice (duck-voice.mjs) with the beak following
// the loudness of each call. Motion is illustrative, not servo data.
import * as THREE from 'three';
import { REST_POSE } from './duck-view.mjs';
import { personalityFromSeed, render, wheeeSegments, variantCount, SR } from './duck-voice.mjs';

const STAND = { hip: 5, knee: -10 },SOCK = 1.4;
// MicroDuck's seven call types. jaw: how wide the beak opens at full loudness (peck is a beak snap, so 0).
export let VOICES = [
{ id: 'chirp', get label() {return _t("text.0499");}, get hint() {return _t("text.0500");}, jaw: 26 }, { id: 'greet', get label() {return _t("text.0501");}, get hint() {return _t("text.0502");}, jaw: 22 }, { id: 'inquire', get label() {return _t("text.0503");}, get hint() {return _t("text.0504");}, jaw: 18 },
{ id: 'peck', get label() {return _t("text.0505");}, get hint() {return _t("text.0506");}, jaw: 0 }, { id: 'coo', get label() {return _t("text.0507");}, get hint() {return _t("text.0508");}, jaw: 10 }, { id: 'alarm', get label() {return _t("text.0509");}, get hint() {return _t("text.0510");}, jaw: 28 }, { id: 'wheee', get label() {return _t("text.0511");}, get hint() {return _t("text.0512");}, jaw: 14 }];

// keys: [seconds, partial pose]; events: [seconds, name] ('voice:<tag>' speaks); end: 'start' returns to the
// starting pose, 'rest' to standing, 'keep' holds the last key (sitting stays seated until 站起来).
// relative: channels whose key values are offsets from the starting pose, so a seated duck can still quack or nod.
export let ACTIONS = [
{ id: 'pickup', get name() {return _t("text.0513");}, icon: '🧦', get desc() {return _t("text.0514");}, end: 'start', duration: 5.4,
  events: [[0, 'sockShow'], [.45, 'voice:inquire'], [1.45, 'sockGrab'], [1.47, 'voice:peck'], [2.85, 'voice:greet'], [4.25, 'sockDrop'], [4.3, 'voice:alarm'], [5.3, 'sockHide']],
  keys: [[.45, { headPitch: 22, neck: 8 }], [1.3, { hip: 40, knee: -80, trunk: 25, neck: 80, headPitch: 50, jaw: 16 }], [1.55, { jaw: 0 }],
  [2.8, { ...STAND, trunk: 0, neck: -6, headPitch: -16 }], [3.05, { headYaw: 20 }], [3.3, { headYaw: -20 }], [3.55, { headYaw: 14 }], [3.85, { headYaw: 0, headRoll: 9 }], [4.2, { jaw: 12 }], [4.55, { jaw: 0, headRoll: 0, headPitch: -22 }]] },
{ id: 'quack', get name() {return _t("text.0515");}, icon: '🦆', get desc() {return _t("text.0516");}, end: 'start', relative: ['hip', 'knee', 'neck', 'headPitch'], duration: 2.9,
  events: [[.55, 'voice:chirp'], [1.15, 'voice:chirp'], [1.75, 'voice:chirp']],
  keys: [[.35, { headPitch: -16, neck: -5 }],
  [.55, { headPitch: -24, hip: 8, knee: -16 }], [.75, { headPitch: -14, hip: 0, knee: 0 }],
  [1.15, { headPitch: -24, hip: 8, knee: -16 }], [1.35, { headPitch: -14, hip: 0, knee: 0 }],
  [1.75, { headPitch: -26, hip: 10, knee: -20, headRoll: 6 }], [2.0, { headPitch: -12, hip: 0, knee: 0, headRoll: 0 }]] },
{ id: 'sit', get name() {return _t("text.0298");}, icon: '🪑', get desc() {return _t("text.0517");}, end: 'keep', duration: 2.6, events: [[1.7, 'voice:coo']],
  keys: [[.6, { hip: 22, knee: -44, trunk: 10, neck: 6 }], [1.6, { hip: 60, knee: -115, trunk: -15, neck: -8, headPitch: -6, headYaw: 0, jaw: 0 }], [2.1, { headRoll: 7 }]] },
{ id: 'stand', get name() {return _t("text.0518");}, icon: '⬆️', get desc() {return _t("text.0519");}, end: 'rest', duration: 2.4, events: [[1.35, 'voice:greet']],
  keys: [[.5, { hip: 48, knee: -95, trunk: 18, neck: 14, headRoll: 0 }], [1.3, { ...STAND, trunk: -2, neck: -4, headPitch: -10 }], [1.6, { headYaw: 10 }], [1.85, { headYaw: -10 }], [2.1, { headYaw: 0, hip: 0, knee: 0, trunk: 0, neck: 0, headPitch: 0 }]] },
{ id: 'nod', get name() {return _t("text.0520");}, icon: '👋', get desc() {return _t("text.0521");}, end: 'start', relative: ['hip', 'knee', 'neck', 'headPitch'], duration: 2.1, events: [[.5, 'voice:greet']],
  keys: [[.35, { headRoll: 10, headPitch: -6 }], [.65, { headPitch: 22, neck: 6, hip: 8, knee: -16 }], [.95, { headPitch: -4, neck: 0, hip: 0, knee: 0 }], [1.25, { headPitch: 20, neck: 6, hip: 8, knee: -16 }], [1.6, { headPitch: 0, neck: 0, hip: 0, knee: 0, headRoll: 0 }]] },
{ id: 'look', get name() {return _t("text.0522");}, icon: '👀', get desc() {return _t("text.0523");}, end: 'start', relative: ['neck'], duration: 3.2, events: [[.6, 'voice:inquire'], [1.9, 'voice:inquire']],
  keys: [[.5, { headYaw: 42, neck: -4 }], [1.2, { headYaw: 42, headRoll: -6 }], [1.7, { headYaw: -42, headRoll: 0 }], [2.4, { headYaw: -42, headRoll: 6 }], [2.85, { headYaw: 0, headRoll: 0, neck: 0 }]] },
{ id: 'sway', get name() {return _t("text.0524");}, icon: '🎵', get desc() {return _t("text.0525");}, end: 'start', relative: ['hip', 'knee'], duration: 3.6, events: [[.1, 'voice:wheee']],
  keys: [[.4, { rollL: 9, rollR: 9, headRoll: -10, hip: 10, knee: -20 }], [.8, { rollL: -9, rollR: -9, headRoll: 10, hip: 0, knee: 0 }], [1.2, { rollL: 9, rollR: 9, headRoll: -10, hip: 10, knee: -20 }],
  [1.6, { rollL: -9, rollR: -9, headRoll: 10, hip: 0, knee: 0 }], [2.0, { rollL: 9, rollR: 9, headRoll: -10, hip: 10, knee: -20 }], [2.4, { rollL: -9, rollR: -9, headRoll: 10, hip: 0, knee: 0 }], [2.8, { rollL: 9, rollR: 9, headRoll: -10 }], [3.2, { rollL: 0, rollR: 0, headRoll: 0 }]] }];

export const SHOW = ['pickup', 'quack', 'sit', 'stand', 'sway'];
const ease = (t) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// Plain-language summary of a voice's traits for the UI.
export function describeVoice(seed) {
  const p = personalityFromSeed(seed),tags = [p.pitchCenterHz < 230 ? _t("text.0526") : p.pitchCenterHz < 380 ? _t("text.0527") : _t("text.0528")];
  if (p.quackiness > .7) tags.push(_t("text.0529"));else if (p.quackiness < .4) tags.push(_t("text.0530"));
  if (p.nasal > .7) tags.push(_t("text.0531"));if (p.breath > .2) tags.push(_t("text.0532"));if (p.vibratoDepth > .5) tags.push(_t("text.0533"));
  if (p.speed > 1.1) tags.push(_t("text.0534"));else if (p.speed < .9) tags.push(_t("text.0535"));
  return tags.slice(0, 4).join(' · ');
}
// SHA-256 of a text, first 4 bytes as u32: the same derivation MicroDuck uses for its hardware seed.
export async function seedFromText(text) {const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));return (d[0] << 24 | d[1] << 16 | d[2] << 8 | d[3]) >>> 0;}

function makeSock() {
  const g = new THREE.Group(),white = new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: .9, transparent: true }),red = new THREE.MeshStandardMaterial({ color: 0xe2483d, roughness: .85, transparent: true });
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 26, 18), white);leg.position.y = 13;
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(7, 14, 4, 14), white);foot.rotation.x = Math.PI / 2;foot.position.set(0, 0, 9);
  const toe = new THREE.Mesh(new THREE.SphereGeometry(7.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), red);toe.rotation.x = Math.PI / 2;toe.position.set(0, 0, 16);
  const s1 = new THREE.Mesh(new THREE.TorusGeometry(7.2, 1.6, 8, 24), red);s1.rotation.x = Math.PI / 2;s1.position.y = 22;const s2 = s1.clone();s2.position.y = 17;
  g.add(leg, foot, toe, s1, s2);g.userData.materials = [white, red];return g;
}

export function createActionPlayer(view) {
  let run = null,audio = null,sound = true,sock = null,sockAnim = null,listeners = new Set(),resumeSpin = false,frame = 0,seed = 100,speech = null,idlePose = null;
  const calls = new Map(),emit = () => listeners.forEach((f) => f(run?.action.id || null));
  // Renders (and caches) one call: samples plus a 10 ms loudness envelope that drives the beak.
  function call(tag, variant) {
    const key = seed + ':' + tag + ':' + variant;if (calls.has(key)) return calls.get(key);
    const p = personalityFromSeed(seed),samples = tag === 'wheee' ? (([s, l, e]) => {const o = new Float32Array(s.length + l.length + e.length);o.set(s);o.set(l, s.length);o.set(e, s.length + l.length);return o;})(wheeeSegments(p, variant)) : render(tag, p, variant);
    const hop = SR / 100,env = new Float32Array(Math.ceil(samples.length / hop));let peak = 1e-6;
    for (let k = 0; k < env.length; k++) {let sum = 0;const a = k * hop,b = Math.min(samples.length, a + hop);for (let i = a; i < b; i++) sum += samples[i] * samples[i];env[k] = Math.sqrt(sum / (b - a || 1));peak = Math.max(peak, env[k]);}
    for (let k = 0; k < env.length; k++) env[k] /= peak;
    const out = { samples, env, duration: samples.length / SR };if (calls.size > 160) calls.delete(calls.keys().next().value);calls.set(key, out);return out;
  }
  function say(tag) {
    const meta = VOICES.find((v) => v.id === tag);if (!meta) return;
    const c = call(tag, Math.floor(Math.random() * variantCount(tag)));
    if (sound) {try {audio = audio || new (window.AudioContext || window.webkitAudioContext)();audio.resume();const buf = audio.createBuffer(1, c.samples.length, SR);buf.copyToChannel(c.samples, 0);const src = audio.createBufferSource(),g = audio.createGain();g.gain.value = .8;src.buffer = buf;src.connect(g).connect(audio.destination);src.start();} catch {}}
    if (!run) idlePose = speech && idlePose ? idlePose : { ...view.pose, jaw: 0 };
    speech = { env: c.env, start: performance.now(), jaw: meta.jaw, duration: c.duration };
  }
  const jawNow = (now) => {if (!speech) return 0;const k = Math.floor((now - speech.start) / 10);if (k >= speech.env.length) {speech = null;return 0;}return speech.env[k] * speech.jaw;};
  const sockTarget = () => {const saved = view.pose;view.setPose({ ...saved, hip: 40, knee: -80, trunk: 25, neck: 80, headPitch: 50 });const b = view.beakPosition();view.setPose(saved);return new THREE.Vector3(b.x, 7 * SOCK, b.z + 4);};
  function setSockOpacity(v) {sock?.userData.materials.forEach((m) => {m.opacity = v;});}
  const EVENTS = {
    sockShow: () => {if (!sock) sock = makeSock();const p = sockTarget();view.root.add(sock);sock.position.copy(p);sock.rotation.set(0, .5, Math.PI / 2);setSockOpacity(1);sock.scale.setScalar(.01);sockAnim = { type: 'pop', start: performance.now() };},
    sockGrab: () => {if (!sock) return;sockAnim = { type: 'grab', start: performance.now(), from: sock.position.clone() };},
    sockDrop: () => {if (!sock) return;view.root.attach(sock);sockAnim = { type: 'fall', start: performance.now(), from: sock.position.clone(), vy: 0 };},
    sockHide: () => {if (!sock) return;sockAnim = { type: 'fade', start: performance.now() };}
  };
  function stepSock(now) {
    if (!sock || !sockAnim) return;const t = (now - sockAnim.start) / 1000;
    if (sockAnim.type === 'pop') {const k = Math.min(1, t / .35);sock.scale.setScalar(SOCK * (.01 + .99 * (1 - (1 - k) ** 3) * (1 + .18 * Math.sin(k * Math.PI))));if (k >= 1) sockAnim = null;}
    // The beak takes the sock by its cuff, so it hangs upright just in front of the bill.
    else if (sockAnim.type === 'grab') {const k = Math.min(1, t / .25),e = ease(k),b = view.beakPosition();sock.position.lerpVectors(sockAnim.from, b.clone().add(new THREE.Vector3(0, -35, 10)), e);sock.rotation.set(0, .5 * (1 - e), Math.PI / 2 * (1 - e));if (k >= 1) {view.joints.head_roll.attach(sock);sockAnim = null;}} else
    if (sockAnim.type === 'fall') {sockAnim.vy -= 980 * .016;sock.position.y = Math.max(7 * SOCK, sock.position.y + sockAnim.vy * .016);sock.rotation.z += (Math.PI / 2 - sock.rotation.z) * .12;if (sock.position.y <= 7 * SOCK) {if (Math.abs(sockAnim.vy) > 120) sockAnim.vy *= -.3;else sockAnim = null;}} else
    if (sockAnim.type === 'fade') {const k = Math.min(1, t / .4);setSockOpacity(1 - k);if (k >= 1) {sock.removeFromParent();sockAnim = null;}}
  }
  // Each channel interpolates from the starting pose through every key that mentions it.
  function timeline(action, start) {
    const end = action.end === 'start' ? start : action.end === 'rest' ? REST_POSE : null,tracks = {};
    for (const ch of Object.keys(REST_POSE)) {const pts = [[0, start[ch]]],rel = action.relative?.includes(ch);for (const [t, p] of action.keys) if (ch in p) pts.push([t, rel ? start[ch] + p[ch] : p[ch]]);if (end && pts.length > 1) pts.push([action.duration, end[ch]]);tracks[ch] = pts;}
    return tracks;
  }
  function sample(tracks, t) {const pose = {};for (const [ch, pts] of Object.entries(tracks)) {let i = pts.findIndex((p) => p[0] > t);if (i === -1) {pose[ch] = pts.at(-1)[1];continue;}if (i === 0) {pose[ch] = pts[0][1];continue;}const [t0, v0] = pts[i - 1],[t1, v1] = pts[i];pose[ch] = v0 + (v1 - v0) * ease((t - t0) / (t1 - t0 || 1));}return pose;}
  function loop(now) {
    frame = requestAnimationFrame(loop);if(sockAnim)view.invalidate();stepSock(now);
    if (!run) {
      // A call outside an action only moves the beak, on top of whatever pose the duck holds.
      // A call can outlast the action that started it (wheee runs past the sway), so adopt the final pose.
      if (speech && !idlePose) idlePose = { ...view.pose, jaw: 0 };
      if (speech || idlePose) {const jaw = jawNow(now);view.setPose({ ...idlePose, jaw: Math.max(idlePose.jaw, jaw) });if (!speech) idlePose = null;}
      return;
    }
    if (run.hold != null) run.start = now - run.hold * 1000;
    const t = (now - run.start) / 1000;
    while (run.events.length && run.events[0][0] <= t) {const [, name] = run.events.shift();if (name.startsWith('voice:')) say(name.slice(6));else EVENTS[name]?.();}
    const pose = sample(run.tracks, Math.min(t, run.action.duration));pose.jaw = Math.max(pose.jaw, jawNow(now));view.setPose(pose);
    if (t >= run.action.duration) {const next = run.queue;run = null;if (next.length) return start(next[0], next.slice(1));if (resumeSpin) view.setTurntable(true);emit();}
  }
  function start(id, queue = []) {
    const action = ACTIONS.find((a) => a.id === id);if (!action) return;
    if (view.layout !== 'assembly') view.setLayout('assembly');
    if (!run && view.turntable) {resumeSpin = true;view.setTurntable(false);} else if (!run) resumeSpin = false;
    if (sock && sockAnim?.type !== 'fade' && id !== 'pickup') {sock.removeFromParent();sockAnim = null;}
    const base = idlePose || view.pose;idlePose = null;
    run = { action, start: performance.now(), tracks: timeline(action, { ...base, jaw: 0 }), events: [...(action.events || [])], queue };emit();
  }
  frame = requestAnimationFrame(loop);
  return {
    play: (id) => start(id), show: () => start(SHOW[0], SHOW.slice(1)), say,
    // Review aid: freeze an action at a moment (events up to that moment still fire).
    hold(id, t) {if (run?.action.id !== id) start(id);run.hold = t;}, release() {if (run) run.hold = null;},
    stop() {if (!run) return;run = null;speech = null;view.setPose(REST_POSE);if (sock) {sock.removeFromParent();sockAnim = null;}if (resumeSpin) view.setTurntable(true);emit();},
    set sound(v) {sound = v;}, get sound() {return sound;}, get current() {return run?.action.id || null;},
    set seed(v) {seed = v >>> 0;}, get seed() {return seed;},
    get seated() {return view.pose.hip > 40;}, onChange: (f) => {listeners.add(f);return () => listeners.delete(f);}
  };
}_onLocale(() => {VOICES = [{ id: 'chirp', get label() {return _t("text.0499");}, get hint() {return _t("text.0500");}, jaw: 26 }, { id: 'greet', get label() {return _t("text.0501");}, get hint() {return _t("text.0502");}, jaw: 22 }, { id: 'inquire', get label() {return _t("text.0503");}, get hint() {return _t("text.0504");}, jaw: 18 }, { id: 'peck', get label() {return _t("text.0505");}, get hint() {return _t("text.0506");}, jaw: 0 }, { id: 'coo', get label() {return _t("text.0507");}, get hint() {return _t("text.0508");}, jaw: 10 }, { id: 'alarm', get label() {return _t("text.0509");}, get hint() {return _t("text.0510");}, jaw: 28 }, { id: 'wheee', get label() {return _t("text.0511");}, get hint() {return _t("text.0512");}, jaw: 14 }];ACTIONS = [{ id: 'pickup', get name() {return _t("text.0513");}, icon: '🧦', get desc() {return _t("text.0514");}, end: 'start', duration: 5.4, events: [[0, 'sockShow'], [.45, 'voice:inquire'], [1.45, 'sockGrab'], [1.47, 'voice:peck'], [2.85, 'voice:greet'], [4.25, 'sockDrop'], [4.3, 'voice:alarm'], [5.3, 'sockHide']], keys: [[.45, { headPitch: 22, neck: 8 }], [1.3, { hip: 40, knee: -80, trunk: 25, neck: 80, headPitch: 50, jaw: 16 }], [1.55, { jaw: 0 }], [2.8, { ...STAND, trunk: 0, neck: -6, headPitch: -16 }], [3.05, { headYaw: 20 }], [3.3, { headYaw: -20 }], [3.55, { headYaw: 14 }], [3.85, { headYaw: 0, headRoll: 9 }], [4.2, { jaw: 12 }], [4.55, { jaw: 0, headRoll: 0, headPitch: -22 }]] }, { id: 'quack', get name() {return _t("text.0515");}, icon: '🦆', get desc() {return _t("text.0516");}, end: 'start', relative: ['hip', 'knee', 'neck', 'headPitch'], duration: 2.9, events: [[.55, 'voice:chirp'], [1.15, 'voice:chirp'], [1.75, 'voice:chirp']], keys: [[.35, { headPitch: -16, neck: -5 }], [.55, { headPitch: -24, hip: 8, knee: -16 }], [.75, { headPitch: -14, hip: 0, knee: 0 }], [1.15, { headPitch: -24, hip: 8, knee: -16 }], [1.35, { headPitch: -14, hip: 0, knee: 0 }], [1.75, { headPitch: -26, hip: 10, knee: -20, headRoll: 6 }], [2.0, { headPitch: -12, hip: 0, knee: 0, headRoll: 0 }]] }, { id: 'sit', get name() {return _t("text.0298");}, icon: '🪑', get desc() {return _t("text.0517");}, end: 'keep', duration: 2.6, events: [[1.7, 'voice:coo']], keys: [[.6, { hip: 22, knee: -44, trunk: 10, neck: 6 }], [1.6, { hip: 60, knee: -115, trunk: -15, neck: -8, headPitch: -6, headYaw: 0, jaw: 0 }], [2.1, { headRoll: 7 }]] }, { id: 'stand', get name() {return _t("text.0518");}, icon: '⬆️', get desc() {return _t("text.0519");}, end: 'rest', duration: 2.4, events: [[1.35, 'voice:greet']], keys: [[.5, { hip: 48, knee: -95, trunk: 18, neck: 14, headRoll: 0 }], [1.3, { ...STAND, trunk: -2, neck: -4, headPitch: -10 }], [1.6, { headYaw: 10 }], [1.85, { headYaw: -10 }], [2.1, { headYaw: 0, hip: 0, knee: 0, trunk: 0, neck: 0, headPitch: 0 }]] }, { id: 'nod', get name() {return _t("text.0520");}, icon: '👋', get desc() {return _t("text.0521");}, end: 'start', relative: ['hip', 'knee', 'neck', 'headPitch'], duration: 2.1, events: [[.5, 'voice:greet']], keys: [[.35, { headRoll: 10, headPitch: -6 }], [.65, { headPitch: 22, neck: 6, hip: 8, knee: -16 }], [.95, { headPitch: -4, neck: 0, hip: 0, knee: 0 }], [1.25, { headPitch: 20, neck: 6, hip: 8, knee: -16 }], [1.6, { headPitch: 0, neck: 0, hip: 0, knee: 0, headRoll: 0 }]] }, { id: 'look', get name() {return _t("text.0522");}, icon: '👀', get desc() {return _t("text.0523");}, end: 'start', relative: ['neck'], duration: 3.2, events: [[.6, 'voice:inquire'], [1.9, 'voice:inquire']], keys: [[.5, { headYaw: 42, neck: -4 }], [1.2, { headYaw: 42, headRoll: -6 }], [1.7, { headYaw: -42, headRoll: 0 }], [2.4, { headYaw: -42, headRoll: 6 }], [2.85, { headYaw: 0, headRoll: 0, neck: 0 }]] }, { id: 'sway', get name() {return _t("text.0524");}, icon: '🎵', get desc() {return _t("text.0525");}, end: 'start', relative: ['hip', 'knee'], duration: 3.6, events: [[.1, 'voice:wheee']], keys: [[.4, { rollL: 9, rollR: 9, headRoll: -10, hip: 10, knee: -20 }], [.8, { rollL: -9, rollR: -9, headRoll: 10, hip: 0, knee: 0 }], [1.2, { rollL: 9, rollR: 9, headRoll: -10, hip: 10, knee: -20 }], [1.6, { rollL: -9, rollR: -9, headRoll: 10, hip: 0, knee: 0 }], [2.0, { rollL: 9, rollR: 9, headRoll: -10, hip: 10, knee: -20 }], [2.4, { rollL: -9, rollR: -9, headRoll: 10, hip: 0, knee: 0 }], [2.8, { rollL: 9, rollR: 9, headRoll: -10 }], [3.2, { rollL: 0, rollR: 0, headRoll: 0 }]] }];});
