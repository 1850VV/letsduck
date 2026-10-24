import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../../frontend/assemble/full-catalog.mjs';
import { snapshot as legSnapshot, ACTORS as LEG_ACTORS } from '../../frontend/assemble/assembly-state.mjs';
import { readFileSync } from 'node:fs';
import * as THREE from '../../frontend/vendor/three.module.js';
import { actorQuaternion } from '../../frontend/assemble/render-pose.mjs';

const torso = await import('../../frontend/assemble/full/torso.mjs').catch(() => ({}));
const step = id => {
  assert.ok(Array.isArray(torso.STEPS), 'torso must expose the ordered video steps');
  const index = torso.STEPS.findIndex(s => s.id === id);
  assert.ok(index >= 0, `Missing torso video action ${id}`);
  return index;
};
const near = (actual, expected, label = '') => {
  assert.equal(actual.length, expected.length, label);
  actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) < 1e-8,
    `${label}[${i}]: expected ${expected[i]}, got ${v}`));
};
const subtract = (a, b) => a.map((v, i) => v - b[i]);

// Catches a missing public state module and holes in the source-video navigation.
test('torso exports importable, contiguous chapters for 08:16–12:48 with at most nine steps each', () => {
  assert.equal(typeof torso.snapshot, 'function');
  assert.equal(typeof torso.legOffsets, 'function');
  assert.equal(torso.CHAPTERS.length, 2);
  assert.equal(torso.STEPS[0].sourceStart, 496);
  assert.equal(torso.STEPS.at(-1).sourceEnd, 768);
  let cursor = 0;
  for (const chapter of torso.CHAPTERS) {
    assert.ok(chapter.id.startsWith('torso-'));
    assert.equal(chapter.start, cursor);
    assert.ok(chapter.end - chapter.start + 1 <= 9);
    assert.equal(chapter.sourceStart, torso.STEPS[chapter.start].sourceStart);
    assert.equal(chapter.sourceEnd, torso.STEPS[chapter.end].sourceEnd);
    for (let i = chapter.start; i <= chapter.end; i++) {
      const s = torso.STEPS[i];
      assert.equal(s.chapter, chapter.id);
      assert.ok(s.sourceEnd > s.sourceStart);
      if (i) assert.equal(torso.STEPS[i - 1].sourceEnd, s.sourceStart);
      for (const key of ['short', 'title', 'text', 'check', 'caption']) assert.equal(typeof s[key], 'string');
      assert.ok(s.duration > 0);
      assert.equal(s.camera.length, 3);
      assert.equal(s.target.length, 3);
    }
    cursor = chapter.end + 1;
  }
  assert.equal(cursor, torso.STEPS.length);
});

// Catches swapping the source link names for yaw/roll motors or re-registering a real mesh.
test('real torso meshes retain exact catalog centers and the video motor identities', () => {
  assert.ok(torso.ACTORS);
  const expected = {
    t_support: 'P6-09', t_backplate: 'P4-03',
    t_yawR: 'P6-06', t_yawL: 'P6-07', t_coverR: 'P6-02', t_coverL: 'P6-03',
    t_motor10: 'trunk_base_0', t_motor20: 'trunk_base_4',
    t_motor11: 'right_hip_yaw_3', t_motor21: 'left_hip_yaw_1',
    t_yawBearingR: 'trunk_base_3', t_yawBearingL: 'trunk_base_6',
    t_legBearingR: 'right_hip_yaw_0', t_legBearingL: 'left_hip_yaw_2',
  };
  for (const [id, sourceId] of Object.entries(expected)) {
    assert.equal(torso.ACTORS[id].sourceId, sourceId, id);
    assert.equal(torso.ACTORS[id].kind, 'mesh', id);
    assert.deepEqual(torso.ACTORS[id].end, CATALOG[sourceId].end, id);
    assert.deepEqual(torso.ACTORS[id].size, CATALOG[sourceId].size, id);
  }
  for (const id of Object.keys(torso.ACTORS)) assert.ok(id.startsWith('t_'), id);
});

// Catches future covers, motor21 or leg bearings appearing as installed before their action.
test('unintroduced torso parts stay hidden and staged roll motors are not installed early', () => {
  let s = torso.snapshot(step('t-pair'), 1);
  assert.equal(s.t_motor10.status, 'installed');
  assert.equal(s.t_motor20.status, 'installed');
  for (const id of ['t_support', 't_backplate', 't_yawR', 't_motor11', 't_coverR', 't_legBearingR']) {
    assert.equal(s[id].visible, false, id);
    assert.equal(s[id].status, 'waiting', id);
  }
  s = torso.snapshot(step('t-roll-pair'), 1);
  for (const id of ['t_motor11', 't_motor21']) {
    assert.equal(s[id].visible, true, id);
    assert.equal(s[id].status, 'prepared', id);
    assert.notDeepEqual(s[id].position, torso.ACTORS[id].end, id);
  }
  s = torso.snapshot(step('t-join-r'), 1);
  assert.equal(s.t_motor11.status, 'installed');
  assert.equal(s.t_coverR.status, 'installed');
  assert.equal(s.t_motor21.status, 'prepared');
  assert.equal(s.t_coverL.visible, false);
  assert.equal(s.t_legBearingL.visible, false);
});

// Catches mounting the Yaw connector before its large bearing or losing the bearing during docking.
test('each yaw bearing seats in its independent connector before both travel to the body', () => {
  for (const side of ['R', 'L']) {
    const n = step(side === 'R' ? 't-yaw-r' : 't-yaw-l');
    const first = torso.snapshot(n, 0);
    const seated = torso.snapshot(n, .32);
    const moving = torso.snapshot(n, .55);
    const done = torso.snapshot(n, 1);
    const connector = `t_yaw${side}`, bearing = `t_yawBearing${side}`;
    assert.notDeepEqual(first[bearing].position, seated[bearing].position);
    near(first[connector].position, seated[connector].position, 'connector waits during bearing press');
    near(subtract(seated[bearing].position, seated[connector].position),
      subtract(torso.ACTORS[bearing].end, torso.ACTORS[connector].end), 'bearing is seated');
    near(subtract(moving[bearing].position, seated[bearing].position),
      subtract(moving[connector].position, seated[connector].position), 'bearing travels with connector');
    near(done[bearing].position, torso.ACTORS[bearing].end);
    near(done[connector].position, torso.ACTORS[connector].end);
    assert.equal(done[bearing].status, 'installed');
  }
});

// Catches original screws staying at final motor coordinates while the motor is still on the bench.
test('original roll horns and central screws enter with their motor, then screw removal precedes horn removal', () => {
  const n = step('t-roll-pair');
  const a = torso.snapshot(n, .2), b = torso.snapshot(n, .8);
  for (const number of [11, 21]) {
    for (const suffix of ['Horn', 'HornScrew']) {
      const id = `t_motor${number}${suffix}`;
      near(subtract(b[id].position, a[id].position),
        subtract(b[`t_motor${number}`].position, a[`t_motor${number}`].position), id);
    }
    assert.equal(torso.ACTORS[`t_motor${number}HornScrew`].fastener, null);
  }
  const remove = step('t-roll-horns');
  const early = torso.snapshot(remove, .2);
  const middle = torso.snapshot(remove, .55);
  assert.ok(early.t_motor11HornScrew.turn < 0);
  assert.equal(early.t_motor11Horn.turn, 0);
  near(early.t_motor11Horn.position, torso.snapshot(remove, 0).t_motor11Horn.position, 'horn waits for screw');
  assert.notDeepEqual(middle.t_motor11Horn.position, early.t_motor11Horn.position);
  const removed = torso.snapshot(remove, 1);
  for (const number of [11, 21]) for (const suffix of ['Horn', 'HornScrew']) {
    const id = `t_motor${number}${suffix}`;
    assert.equal(removed[id].status, 'removed');
    assert.equal(removed[id].visible, true);
    near(torso.snapshot(step('t-complete'), 1)[id].position, removed[id].position, 'removed parts stay in tray');
  }
});

// Catches beginning the leg translation before the newly inserted interface bearing is seated.
test('right and left fresh interface bearings are installed before either complete leg moves', () => {
  assert.ok(step('t-cover-r') < step('t-bearing-r'));
  assert.ok(step('t-bearing-r') < step('t-join-r'));
  assert.ok(step('t-cover-l') < step('t-bearing-l'));
  assert.ok(step('t-bearing-l') < step('t-join-l'));
  for (const [side, id, offset] of [['r', 't_legBearingR', [-95, 0, 65]], ['l', 't_legBearingL', [95, 0, 65]]]) {
    const bearing = step(`t-bearing-${side}`), a = torso.snapshot(bearing, 0), b = torso.snapshot(bearing, 1);
    assert.equal(a[id].visible, true);
    assert.notDeepEqual(a[id].position, b[id].position);
    near(b[id].position, torso.ACTORS[id].end.map((v, i) => v + offset[i]), 'new bearing seats on the waiting complete leg');
    assert.equal(b[id].status, 'installed');
  }
  assert.deepEqual(torso.legOffsets(step('t-bearing-r'), 1), {right: [-95, 0, 65], left: [95, 0, 65]});
  assert.deepEqual(torso.legOffsets(step('t-bearing-l'), 1), {right: [0, 0, 0], left: [95, 0, 65]});
});

// Catches joining both legs simultaneously, moving the wrong side, or leaving a preparation offset.
test('the right leg offset reaches zero first and the left leg joins independently later', () => {
  const right = step('t-join-r'), left = step('t-join-l');
  assert.ok(right < left);
  assert.deepEqual(torso.legOffsets(right, 0), {right: [-95, 0, 65], left: [95, 0, 65]});
  near(torso.legOffsets(right, .5).right, [-47.5, 0, 32.5]);
  assert.deepEqual(torso.legOffsets(right, 1), {right: [0, 0, 0], left: [95, 0, 65]});
  assert.deepEqual(torso.legOffsets(left, 0), {right: [0, 0, 0], left: [95, 0, 65]});
  near(torso.legOffsets(left, .5).left, [47.5, 0, 32.5]);
  assert.deepEqual(torso.legOffsets(left, 1), {right: [0, 0, 0], left: [0, 0, 0]});
});

// Catches screws left in world space when their connector or the whole leg is translated.
test('fasteners follow their connector and already completed leg components retain rigid offsets', () => {
  const yaw = step('t-yaw-r'), a = torso.snapshot(yaw, .36), b = torso.snapshot(yaw, .55);
  near(subtract(b.t_yawScrewR0.position, a.t_yawScrewR0.position),
    subtract(b.t_yawR.position, a.t_yawR.position), 'yaw fastener moves with connector');
  const leg = legSnapshot(40, 1);
  const n = step('t-join-r'), start = torso.legOffsets(n, 0), end = torso.legOffsets(n, 1);
  for (const id of ['foot', 'motor', 'shank', 'axle', 'axisScrew', 'footScrew3', 'r_topLink', 'r_topBearing', 'r_topScrew0', 'wire']) {
    assert.equal(leg[id].visible, true, id);
    const from = leg[id].position.map((v, i) => v + start.right[i]);
    const to = leg[id].position.map((v, i) => v + end.right[i]);
    near(subtract(to, from), [95, 0, -65], id);
  }
  const joinStart = torso.snapshot(n, .2), joinEnd = torso.snapshot(n, .5);
  near(subtract(joinEnd.t_legScrewR0.position, joinStart.t_legScrewR0.position), [47.5, 0, -32.5], 'new leg screw is carried before tightening');
  near(subtract(joinEnd.t_legBearingR.position, joinStart.t_legBearingR.position), [47.5, 0, -32.5], 'new bearing travels on the complete leg');
});

// Catches stateful accumulation, mutation of exported anchors, and stale future actors on replay.
test('arbitrary scrubbing and replay are deterministic without mutating catalog or actor anchors', () => {
  const n = step('t-motor-l'), expected = torso.snapshot(n, .43);
  const actors = JSON.stringify(torso.ACTORS), catalog = JSON.stringify(CATALOG);
  for (let k = 0; k < 4; k++) {
    torso.snapshot(step('t-complete'), 1);
    torso.snapshot(step('t-pair'), 0);
    torso.snapshot(step('t-roll-horns'), .12);
    assert.deepEqual(torso.snapshot(n, .43), expected);
  }
  expected.t_motor21.position[0] = 9999;
  assert.notEqual(torso.snapshot(n, .43).t_motor21.position[0], 9999);
  assert.equal(JSON.stringify(torso.ACTORS), actors);
  assert.equal(JSON.stringify(CATALOG), catalog);
  const rewind = torso.snapshot(step('t-support'), 1);
  assert.equal(rewind.t_coverR.visible, false);
  assert.equal(rewind.t_motor11Horn.visible, false);
});

// Catches undefined motion fields or broken index/progress boundaries at the integration surface.
test('every returned pose stays finite at interpolation boundaries and input ranges clamp safely', () => {
  assert.equal(typeof torso.snapshot, 'function');
  for (let i = 0; i < torso.STEPS.length; i++) for (const p of [0, .2, .32, .5, .72, 1]) {
    const state = torso.snapshot(i, p);
    assert.deepEqual(Object.keys(state).sort(), Object.keys(torso.ACTORS).sort());
    for (const [id, pose] of Object.entries(state)) {
      assert.equal(typeof pose.visible, 'boolean', id);
      assert.ok(pose.position.length === 3 && pose.position.every(Number.isFinite), id);
      assert.ok(Number.isFinite(pose.turn), id);
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1, id);
      assert.ok(['waiting', 'prepared', 'moving', 'installed', 'removed'].includes(pose.status), id);
      if (pose.points) assert.ok(pose.points.length >= 2 && pose.points.every(v => v.length === 3 && v.every(Number.isFinite)), id);
    }
  }
  assert.deepEqual(torso.snapshot(-5, -.5), torso.snapshot(0, 0));
  assert.deepEqual(torso.snapshot(999, 2), torso.snapshot(torso.STEPS.length - 1, 1));
  assert.deepEqual(torso.legOffsets(-5, -.5), {right: [-95, 0, 65], left: [95, 0, 65]});
});

// Catches incomplete final installation while preserving removed original hardware.
test('final torso state has both legs joined, all introduced meshes installed and removed original parts retained', () => {
  const n = step('t-complete'), s = torso.snapshot(n, 1);
  assert.equal(torso.STEPS[n].complete, true);
  assert.deepEqual(torso.legOffsets(n, 1), {right: [0, 0, 0], left: [0, 0, 0]});
  for (const [id, actor] of Object.entries(torso.ACTORS)) {
    assert.equal(s[id].visible, true, id);
    assert.equal(s[id].status, actor.removeStep === undefined ? 'installed' : 'removed', id);
    if (actor.kind === 'mesh') near(s[id].position, actor.end, id);
  }
  assert.equal(torso.ACTORS.r_topLink, undefined, 'existing leg parts are referenced, never redefined');
  assert.equal(torso.ACTORS.l_topLink, undefined);
});

// The expectations come from independently fitted source-geometry boundaries, not actor constants.
const sourceHoles = JSON.parse(readFileSync(new URL('./fixtures/torso-holes.json', import.meta.url), 'utf8'));
test('all torso fasteners meet the source holes and face the receiving surface', () => {
  const groups = [
    ['t_supportScrew', 6, 'P6-09', 1, -1, h => h.radius > .95 && h.radius < 1.05 && !(Math.abs(h.center[0]) < 15 && h.center[2] < 0)],
    ['t_backFrontScrew', 2, 'P4-03', 1, -1, h => h.radius < 1.05 && h.center[1] < 110],
    ['t_backRearScrew', 2, 'P4-03', 1, 1, h => h.radius < 1.05 && h.center[1] > 125],
    ['t_yawScrewR', 4, 'P6-06', 1, -1, h => h.radius > .95 && h.radius < 1.05 && h.center[1] > 101 && h.center[1] < 102],
    ['t_yawScrewL', 4, 'P6-07', 1, -1, h => h.radius > .95 && h.radius < 1.05 && h.center[1] > 101 && h.center[1] < 102],
    ['t_motorScrewR', 2, 'P6-06', 2, -1, h => h.radius > .95 && h.radius < 1.05 && h.center[2] < 6],
    ['t_motorScrewL', 2, 'P6-07', 2, -1, h => h.radius > .95 && h.radius < 1.05 && h.center[2] < 6],
    ['t_coverScrewR', 4, 'P6-02', 2, 1, h => h.radius > .95 && h.radius < 1.05],
    ['t_coverScrewL', 4, 'P6-03', 2, 1, h => h.radius > .95 && h.radius < 1.05],
    ['t_legScrewR', 4, 'P3-04', 2, 1, h => h.radius > 1.95 && h.radius < 2.05 && h.center[2] > 37 && h.center[2] < 38],
    ['t_legScrewL', 4, 'P3-05', 2, 1, h => h.radius > 1.95 && h.radius < 2.05 && h.center[2] > 37 && h.center[2] < 38],
  ];
  for (const [prefix, count, pid, axis, face, select] of groups) {
    const holes = sourceHoles[pid].filter(h => h.axis === axis && h.face === face && h.residual < .001 && select(h));
    assert.equal(holes.length, count, `${prefix}: independent source-hole fixture`);
    const used = new Set();
    for (let i = 0; i < count; i++) {
      const a = torso.ACTORS[prefix + i];
      const candidates = holes.map((h, n) => ({h, n, distance: Math.hypot(...h.center.map((v, d) => d === axis ? 0 : v - a.end[d]))})).sort((a, b) => a.distance - b.distance);
      const {h, n, distance} = candidates[0];
      assert.ok(distance < .015, `${prefix + i} misses the source hole by ${distance}mm`);
      assert.equal(used.has(n), false, `${prefix}: two screws cannot share a hole`);
      used.add(n);
      assert.ok(Math.abs((a.end[axis] - h.center[axis]) * face - .35) < .02, `${prefix + i} does not sit on its face/counterbore floor`);
      const q = actorQuaternion(a, {turn: 0}).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, a.orientationZ || 0)));
      const shaft = new THREE.Vector3(0, -1, 0).applyQuaternion(q);
      assert.ok(shaft.getComponent(axis) * -face > .999, `${prefix + i} faces away from the receiving surface`);
    }
  }
});

test('Yaw screw shafts pass through the central clearance instead of the steel bearing track', () => {
  for (const side of ['R', 'L']) for (let i = 0; i < 4; i++) {
    const bolt = torso.ACTORS[`t_yawScrew${side}${i}`], ring = torso.ACTORS[`t_yawBearing${side}`];
    const radial = Math.hypot(bolt.end[0] - ring.end[0], bolt.end[2] - ring.end[2]);
    assert.ok(radial + 1 < 8, `${side}${i}: shaft radius intersects 16mm bearing bore`);
  }
});

test('removed original screws and horns first withdraw axially and never cross the motor bounding volume', () => {
  const n = step('t-roll-horns'), start = torso.snapshot(n, 0), early = torso.snapshot(n, .08);
  for (const number of [11, 21]) {
    const motor = `t_motor${number}`, id = `${motor}HornScrew`;
    assert.ok(early[id].position[2] < start[id].position[2], `${id} initially moves into the motor`);
    near(early[id].position.slice(0, 2), start[id].position.slice(0, 2), 'initial axial extraction');
    const center = start[motor].position, size = torso.ACTORS[motor].size;
    for (let p = .01; p <= 1; p += .01) {
      const s = torso.snapshot(n, p);
      for (const suffix of ['Horn', 'HornScrew']) {
        const point = s[`${motor}${suffix}`].position;
        const inside = point.every((v, i) => v > center[i] - size[i] / 2 && v < center[i] + size[i] / 2);
        assert.equal(inside, false, `${motor}${suffix} crosses motor at p=${p}`);
      }
    }
  }
});

test('future fastening substeps remain hidden until the component is seated', () => {
  for (const [id, a] of Object.entries(torso.ACTORS)) {
    if (a.kind !== 'screw' || !a.fastener) continue;
    const before = torso.snapshot(a.step, .2)[id];
    assert.equal(before.visible, false, `${id} is floating before its fastening phase`);
    assert.equal(before.opacity, 0, id);
    assert.equal(before.turn, 0, id);
    const after = torso.snapshot(a.step, 1)[id];
    assert.equal(after.visible, true, id);
    assert.equal(after.status, 'installed', id);
  }
});

test('dual visual ports share source face cues and cable plugs reach the rendered openings', () => {
  assert.ok(torso.SERVO_PORTS, 'dual socket anchors must be exported');
  assert.equal(torso.ACTORS.t_basePlug, undefined, 'cable already owns its endpoint plug');
  for (const number of [10, 20, 11, 21]) {
    const id = `t_motor${number}`, ports = torso.SERVO_PORTS[id];
    assert.equal(ports.length, 2);
    assert.deepEqual(torso.ACTORS[id].servoPorts, ports);
    const yz = number === 10 || number === 20 ? [7, -3] : [-3, -7];
    for (let i = 0; i < 2; i++) {
      near(ports[i].position, [i ? 11.3 : -11.3, ...yz]);
      near(ports[i].normal, [i ? 1 : -1, 0, 0]);
      assert.equal(ports[i].evidence, 'source-face-cue; illustrative-socket; pinout-unverified');
    }
  }
  const dock = (id, port, state) => torso.SERVO_PORTS[id][port].position.map((v, i) => v + state[id].position[i] + torso.SERVO_PORTS[id][port].normal[i] * 1.65);
  const done = torso.snapshot(step('t-complete'), 1);
  for (const [wire, from, fromPort, to, toPort] of [['t_rollWireR', 't_motor10', 1, 't_motor11', 1], ['t_rollWireL', 't_motor20', 0, 't_motor21', 0]]) {
    near(done[wire].points[0], dock(from, fromPort, done));
    near(done[wire].points.at(-1), dock(to, toPort, done));
    const n = step(wire.endsWith('R') ? 't-motor-r' : 't-motor-l'), a = torso.snapshot(n, .5), b = torso.snapshot(n, .72);
    near(subtract(b[wire].points.at(-1), a[wire].points.at(-1)), subtract(b[to].position, a[to].position), 'plug remains on moving motor');
    const finalAxis = subtract(done[wire].points.at(-2), done[wire].points.at(-1));
    near(finalAxis.map(v => v / Math.hypot(...finalAxis)), torso.SERVO_PORTS[to][toPort].normal, 'last segment is axial');
  }
});

test('both plug operations finish before a roll motor docks and fasteners appear', () => {
  for (const [side, number] of [['r', 11], ['l', 21]]) {
    const n = step(`t-motor-${side}`), a = torso.snapshot(n, 0), connected = torso.snapshot(n, .48), moving = torso.snapshot(n, .7), seated = torso.snapshot(n, .78);
    near(connected[`t_motor${number}`].position, a[`t_motor${number}`].position, 'motor waits for both plugs');
    assert.notDeepEqual(moving[`t_motor${number}`].position, a[`t_motor${number}`].position);
    near(seated[`t_motor${number}`].position, torso.ACTORS[`t_motor${number}`].end);
    assert.equal(seated[`t_motorScrew${side.toUpperCase()}0`].visible, false);
  }
});

test('existing leg leads change only their free end and neighboring bend and stay connected during leg joining', () => {
  assert.equal(typeof torso.legLeadOverrides, 'function');
  assert.equal(typeof torso.legsLeadTarget, 'function');
  for (const [side, id, motor, port] of [['r', 'r_legWireB', 't_motor11', 0], ['l', 'l_legWireB', 't_motor21', 1]]) {
    const n = step(`t-motor-${side}`), join = step(`t-join-${side}`), key = side === 'r' ? 'right' : 'left';
    assert.equal(torso.legLeadOverrides(n - 1, 1)[id], undefined);
    const origin = torso.legLeadOverrides(n, 0)[id], attached = torso.legLeadOverrides(n, .48)[id], offset = torso.legOffsets(n, .48)[key];
    assert.deepEqual(attached.position, [0, 0, 0]);
    for (let i = 0; i < 3; i++) near(attached.points[i], LEG_ACTORS[id].points[i].map((v, d) => v + offset[d]), 'leg-side points remain on leg');
    near(origin.points.at(-1), LEG_ACTORS[id].points.at(-1).map((v, d) => v + offset[d]));
    assert.notDeepEqual(attached.points.at(-1), origin.points.at(-1));
    const targetPort = torso.SERVO_PORTS[motor][port], s = torso.snapshot(n, .48), expected = targetPort.position.map((v, i) => v + s[motor].position[i] + targetPort.normal[i] * 1.65);
    near(attached.points.at(-1), expected);
    near(torso.legsLeadTarget(side, n, .48), expected);
    const beforeJoin = torso.legLeadOverrides(join, 0)[id], afterJoin = torso.legLeadOverrides(join, 1)[id];
    near(beforeJoin.points.at(-1), afterJoin.points.at(-1), 'connected end remains on hip motor');
    near(subtract(afterJoin.points[0], beforeJoin.points[0]), side === 'r' ? [95, 0, -65] : [-95, 0, -65]);
  }
});

test('separate body-to-board reserved leads remain after leg leads have connected', () => {
  assert.ok(torso.BOARD_LEADS);
  assert.equal(typeof torso.boardLeadFreeEnds, 'function');
  const state = torso.snapshot(step('t-complete'), 1), ends = torso.boardLeadFreeEnds(step('t-complete'), 1);
  for (const [side, actorId, expected] of [['right', 't_baseWire', [-12, 137, -37]], ['left', 't_baseWireL', [12, 137, -37]]]) {
    assert.equal(torso.BOARD_LEADS[side].actorId, actorId);
    assert.equal(state[actorId].visible, true);
    near(state[actorId].points.at(-1), expected);
    near(ends[side], expected);
  }
});
