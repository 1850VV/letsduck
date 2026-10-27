import type {Vector,Actor,Port} from '../../frontend/assemble/types.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTORS, CHAPTERS, STEPS, snapshot, headOffset } from '../../frontend/assemble/full/final.js';
import { CATALOG } from '../../frontend/assemble/full-catalog.js';
import * as THREE from '../../frontend/vendor/three.module.js';
import { actorQuaternion } from '../../frontend/assemble/render-pose.js';

const close = (a:Vector, b:Vector, epsilon = 1e-8) => {
  assert.equal(a.length, b.length);
  a.forEach((value, i) => assert.ok(Math.abs(value - b[i]!) < epsilon, `${a} != ${b}`));
};
const delta = (a:Vector, b:Vector) => a.map((value, i) => value - b[i]!);
const worldPort = (board:Actor, port:Port) => [
  board.end[0]! + port.position[0]!,
  board.end[1]! + port.position[2]!,
  board.end[2]! - port.position[1]!,
];

// Catches missing steps or chapter overflow that makes the chapter UI unusable.
test('S60–S70 form two complete, bounded chapters', () => {
  assert.equal(STEPS.length, 11);
  assert.equal(CHAPTERS.length, 2);
  assert.deepEqual(CHAPTERS.map(c => [c.start, c.end]), [[0, 3], [4, 10]]);
  assert.equal(CHAPTERS[0]!.sourceStart, 1102);
  assert.equal(CHAPTERS[1]!.sourceEnd, 1258);
  for (const chapter of CHAPTERS) {
    assert.ok(chapter.id.startsWith('final-'));
    assert.ok(chapter.end - chapter.start < 9);
    for (let i = chapter.start; i <= chapter.end; i++) assert.equal(STEPS[i]!.chapter, chapter.id);
  }
  for (const step of STEPS) {
    assert.ok(step.sourceStart < step.sourceEnd);
    assert.equal(step.camera.length, 3);
    assert.equal(step.target.length, 3);
    assert.ok(step.parts.length);
  }
});

// Catches cover actors leaking into earlier assembly stages.
test('body and thigh shells appear only when their own installation begins', () => {
  assert.equal(snapshot(1).f_sideR!.visible, false);
  assert.equal(snapshot(1).f_sideL!.visible, false);
  assert.equal(snapshot(2).f_sideR!.visible, true);
  assert.equal(snapshot(2).f_sideL!.visible, true);
  assert.equal(snapshot(7).f_thighR!.visible, false);
  assert.equal(snapshot(9).f_thighL!.visible, false);
  assert.equal(snapshot(8).f_thighR!.visible, true);
  assert.equal(snapshot(10).f_thighL!.visible, true);
});

// Catches installing the battery directly in the body or leaving it behind the tray.
test('battery first enters a separate tray; tray, battery and loose power lead then travel together', () => {
  const before = snapshot(0, 0), loaded = snapshot(0, 1), installed = snapshot(1, 1);
  assert.ok(before.f_batteryTray!.visible);
  assert.notDeepEqual(before.f_battery!.position, loaded.f_battery!.position);
  close(delta(loaded.f_batteryTray!.position, ACTORS.f_batteryTray!.end), [-110, -40, 75]);
  close(delta(loaded.f_battery!.position, installed.f_battery!.position), [-110, -40, 75]);
  close(delta(loaded.f_powerCable!.position, installed.f_powerCable!.position), [-110, -40, 75]);
  close(delta(loaded.f_powerPlug!.position, installed.f_powerPlug!.position), [-110, -40, 75]);
  close(installed.f_batteryTray!.position, CATALOG['P5-03']!.end);
});

// Catches moving only the shell instead of applying one transform to all head actors.
test('headOffset holds the entire head group aside until S63, then reaches zero before fastening', () => {
  close(headOffset(2, 1), [120, -95, 65]);
  close(headOffset(3, 0), [120, -95, 65]);
  close(headOffset(3, .275), [60, -47.5, 32.5]);
  close(headOffset(3, .55), [0, 0, 0]);
  close(headOffset(10, 0), [0, 0, 0]);
  assert.equal(snapshot(3, .4).f_neckScrewR0!.visible, false);
  assert.equal(snapshot(3, 1).f_neckScrewR0!.visible, true);
});

// Catches merging the boards into one placeholder or omitting actual insertion motion.
test('UNO Q and extension are separate board actors, insert independently, then mount as one stack', () => {
  assert.equal(ACTORS.f_uno!.kind, 'board');
  assert.equal(ACTORS.f_extension!.kind, 'board');
  assert.equal(ACTORS.f_uno!.boardType, 'uno-q');
  assert.equal(ACTORS.f_extension!.boardType, 'luwu-extension');
  const apart = snapshot(4, 0), mated = snapshot(4, 1), mounted = snapshot(5, 1);
  assert.equal(snapshot(3).f_uno!.visible, false);
  assert.ok(apart.f_uno!.visible && apart.f_extension!.visible);
  assert.ok(Math.hypot(...delta(apart.f_uno!.position, apart.f_extension!.position)) > Math.hypot(...delta(mated.f_uno!.position, mated.f_extension!.position)) + 25);
  close(delta(mated.f_uno!.position, ACTORS.f_uno!.end), delta(mated.f_extension!.position, ACTORS.f_extension!.end));
  assert.notDeepEqual(mounted.f_uno!.position, mounted.f_extension!.position);
  close(mounted.f_uno!.position, ACTORS.f_uno!.end);
  close(mounted.f_extension!.position, ACTORS.f_extension!.end);
  assert.ok(ACTORS.f_uno!.size!.every(n => n > 0));
  assert.ok(ACTORS.f_extension!.size!.every(n => n > 0));
  assert.ok(ACTORS.f_uno!.ports!.some(p => p.kind === 'usb-c'));
  assert.ok(ACTORS.f_uno!.ports!.some(p => p.kind === 'female-header'));
  assert.ok(ACTORS.f_extension!.ports!.some(p => p.kind === 'male-header'));
  assert.equal(ACTORS.f_extension!.ports!.filter(p => p.kind === 'servo').length, 3);
  assert.equal(ACTORS.f_extension!.ports!.filter(p => p.kind === 'battery').length, 1);
});

// Catches the power connector appearing installed before the video plugs it in.
test('battery lead keeps a free plug until S66, then reaches the declared battery port', () => {
  const loose = snapshot(5, 1), moving = snapshot(6, .4), connected = snapshot(6, 1);
  assert.notDeepEqual(loose.f_powerPlug!.position, connected.f_powerPlug!.position);
  assert.notDeepEqual(moving.f_powerPlug!.position, connected.f_powerPlug!.position);
  const port = ACTORS.f_extension!.ports!.find(p => p.kind === 'battery')!;
  close(connected.f_powerPlug!.position, worldPort(ACTORS.f_extension!, port).map((n, i) => n + (i === 1 ? 3.7 : 0)));
  close(connected.f_powerCable!.points!.at(-1)!, connected.f_powerPlug!.position);
  assert.equal(loose.f_powerPlug!.status, 'prepared');
  assert.equal(connected.f_powerPlug!.status, 'installed');
});

// Catches all three buses inserting together or cable ends missing their plugs.
test('three already present bus leads connect in sequence to three distinct board ports', () => {
  for (let i = 0; i < 3; i++) {
    assert.equal(snapshot(0)[`f_bus${i}`]!.visible, true);
    assert.equal(snapshot(6)[`f_bus${i}`]!.connectProgress, 0);
  }
  const first = snapshot(7, .2), second = snapshot(7, .5), done = snapshot(7, 1);
  assert.equal(first.f_bus0!.visible, true);
  assert.equal(first.f_bus1!.visible, true);
  assert.equal(first.f_bus2!.visible, true);
  assert.equal(first.f_bus1!.connectProgress, 0);
  assert.equal(first.f_bus2!.connectProgress, 0);
  assert.equal(second.f_busPlug0!.status, 'installed');
  assert.equal(second.f_bus1!.visible, true);
  assert.equal(second.f_bus2!.visible, true);
  assert.equal(second.f_bus2!.connectProgress, 0);
  const ports = ACTORS.f_extension!.ports!.filter(p => p.kind === 'servo');
  for (let i = 0; i < 3; i++) {
    assert.equal(done[`f_bus${i}`]!.visible, true);
    assert.equal(done[`f_busPlug${i}`]!.status, 'installed');
    close(done[`f_busPlug${i}`]!.position, worldPort(ACTORS.f_extension!, ports[i]!).map((n, k) => n + (k === 1 ? 3.7 : 0)));
    close(done[`f_bus${i}`]!.points!.at(-1)!, done[`f_busPlug${i}`]!.position);
  }
  assert.notDeepEqual(done.f_busPlug0!.position, done.f_busPlug1!.position);
  assert.notDeepEqual(done.f_busPlug1!.position, done.f_busPlug2!.position);
});

// Catches wire tidying disconnecting ports or being a no-op.
test('S69 tidies intermediate cable loops without disconnecting either end', () => {
  const loose = snapshot(8), routed = snapshot(9);
  for (let i = 0; i < 3; i++) {
    const a = loose[`f_bus${i}`]!.points!, b = routed[`f_bus${i}`]!.points!;
    close(a[0]!, b[0]!);
    close(a.at(-1)!, b.at(-1)!);
    assert.notDeepEqual(a.slice(1, -1), b.slice(1, -1));
  }
});

// Catches conflating short self-tapping screws with M3 board machine screws.
test('fastener groups preserve the video counts and remain absent before their step', () => {
  const expected = [[1, 'M2x6', 4], [2, 'M2x6', 5], [3, 'M2x6', 8], [5, 'M3x16', 4], [8, 'M2.3x4', 2], [10, 'M2.3x4', 2]] satisfies [number,string,number][];
  for (const [step, fastener, count] of expected) {
    const actors = Object.entries(ACTORS).filter(([, a]) => a.kind === 'screw' && a.step === step);
    assert.equal(actors.length, count);
    for (const [id, a] of actors) {
      assert.equal(a.fastener, fastener);
      assert.equal(snapshot(step! - 1)[id]!.visible, false);
      assert.equal(snapshot(step!)[id]!.visible, true);
    }
  }
});

// Catches screw heads facing into the body or a Z-axis approach displayed as X.
test('each screw shaft points in the same direction as its insertion travel', () => {
  for (const [id, actor] of Object.entries(ACTORS).filter(([, a]) => a.kind === 'screw')) {
    const travel = delta(actor.end, actor.start!);
    const length = Math.hypot(...travel);
    for (const p of [0, .73, 1]) {
      const shaft = new THREE.Vector3(0, -1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), actor.orientationZ ?? 0).applyQuaternion(actorQuaternion(actor, snapshot(actor.step!, p)[id]!));
      close(shaft.toArray(), travel.map(n => n / length));
    }
  }
});

// Catches screw animations reaching the right direction but missing actual source holes.
test('tray, neck and thigh fasteners pass through extracted source hole centers and seat on their faces', () => {
  const rows = [
    ['f_trayScrew0', [-23.568677, 81.625312, -11.971886], [.001009835, .002457412, -.999996471]],
    ['f_trayScrew1', [23.535322, 81.655765, -11.924244], [.001009835, .002457412, -.999996471]],
    ['f_trayScrew2', [-23.590354, 115.025204, -11.889830], [.001009835, .002457412, -.999996471]],
    ['f_trayScrew3', [23.513645, 115.055659, -11.842188], [.001009835, .002457412, -.999996471]],
    ['f_neckScrewR0', [-17.851478,145.793977,41.174232], [-.999983679,-.004358492,-.003693987]],
    ['f_neckScrewR1', [-17.798971,133.794219,41.118892], [-.999983679,-.004358492,-.003693987]],
    ['f_neckScrewR2', [-17.803182,139.821866,35.146667], [-.999983679,-.004358492,-.003693987]],
    ['f_neckScrewR3', [-17.847267,139.766330,47.146458], [-.999983679,-.004358492,-.003693987]],
    ['f_neckScrewL0', [17.856940,145.742869,41.206683], [.999986079,-.003339232,-.004085497]],
    ['f_neckScrewL1', [17.816532,133.743221,41.124000], [.999986079,-.003339232,-.004085497]],
    ['f_neckScrewL2', [17.812362,139.784469,35.165534], [.999986079,-.003339232,-.004085497]],
    ['f_neckScrewL3', [17.861110,139.701622,47.165149], [.999986079,-.003339232,-.004085497]],
    ['f_thighScrewR0', [-70.707102,64.597164,-17.220284], [-.996959794,-.076309614,.015748389]],
    ['f_thighScrewR1', [-72.028416,88.915577,16.969354], [-.996959794,-.076309614,.015748389]],
    ['f_thighScrewL0', [71.017546,64.119812,-16.580651], [.997669905,-.063984561,.023679866]],
    ['f_thighScrewL1', [71.889688,89.957777,16.490506], [.997669905,-.063984561,.023679866]],
  ] satisfies [string,(number)[],(number)[]][];
  for (const [id, center, normal] of rows) {
    const actor = ACTORS[id!]!, pose = snapshot(actor.step!, 1)[id!]!;
    const out = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), actor.orientationZ ?? 0).applyQuaternion(actorQuaternion(actor, pose));
    close(out.toArray(), normal!, 1e-6);
    close(add(pose.position, out.toArray().map(n => n * .625)), center!, 1e-5);
  }
});

const add = (a:Vector, b:Vector) => a.map((n, i) => n + b[i]!);

// Catches mismatch between generated board holes and separately declared screws.
test('M3 screw axes meet all four rendered board holes and head undersides touch the outer board', () => {
  const holes = [[-22.65,69.7,-51.8],[22.65,69.7,-51.8],[-22.65,130.3,-51.8],[22.65,130.3,-51.8]] satisfies [number,number,number][];
  for (let i = 0; i < 4; i++) {
    const pose = snapshot(5)[`f_boardScrew${i}`]!;
    close(add(pose.position, [0, 0, .4]), holes[i]!);
  }
});

test('body shell fasteners use source hole candidate normals rather than one tangent Z direction', () => {
  const rows = [
    [[-25.593724,146.460852,-2.351885],[-.004374896,.999979794,.004612120]],
    [[25.581799,146.516801,-2.320751],[.003367032,.999970593,.006890360]],
    [[-25.633932,130.322330,27.573804],[.004375573,-.999979791,-.004612049]],
    [[25.649794,130.310151,27.568042],[-.003367250,-.999970593,-.006890160]],
    [[-.021469,143.524473,-18.334490],[.999983679,.004358459,.003694014]],
  ] satisfies [(number)[],(number)[]][];
  rows.forEach(([center, normal], i) => {
    const id = `f_bodyScrew${i}`, actor = ACTORS[id]!, pose = snapshot(2)[id]!;
    const out = new THREE.Vector3(0,1,0).applyAxisAngle(new THREE.Vector3(0,0,1), actor.orientationZ ?? 0).applyQuaternion(actorQuaternion(actor,pose));
    close(out.toArray(),normal!,1e-6);
    close(add(pose.position,out.toArray().map(n=>n*.625)),center!,1e-5);
  });
});

test('battery and body installation views are not blocked by the staged head shell', () => {
  const shell = CATALOG['P4-01']!, center = add(shell.end,[120,-95,65]);
  const box = new THREE.Box3(new THREE.Vector3(...center.map((n,i)=>n-shell.size[i]!/2)),new THREE.Vector3(...center.map((n,i)=>n+shell.size[i]!/2)));
  for (const index of [0,1,2]) {
    const step=STEPS[index]!, origin=new THREE.Vector3(...step.camera), target=new THREE.Vector3(...step.target);
    const ray=new THREE.Ray(origin,target.clone().sub(origin).normalize()),hit=ray.intersectBox(box,new THREE.Vector3());
    assert.ok(!hit || origin.distanceTo(hit)>origin.distanceTo(target),`staged head blocks final step ${index}`);
  }
});

test('the head join view keeps the completed head and feet inside the model viewport', () => {
  const step=STEPS[3]!,camera=new THREE.PerspectiveCamera(34,699/487,.1,1600);
  camera.position.fromArray(step.camera);camera.lookAt(new THREE.Vector3(...step.target));camera.updateMatrixWorld();
  for(const id of ['P4-01','P2-01','P2-03','P2-04']) {
    const part=CATALOG[id]!;
    for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]) {
      const point=new THREE.Vector3(...part.end.map((n,i)=>n+[x,y,z][i]!*part.size[i]!/2)).project(camera);
      assert.ok(Math.abs(point.x)<.98&&Math.abs(point.y)<.98,`${id} clipped at ${point.toArray()}`);
    }
  }
});

// Catches late cable creation or violation of the provisional handoff contract.
// The global compositor will replace these provisional body coordinates after
// the torso audit; this test makes no assertion about physical branch topology.
test('bus handoff supplies progress and carries the provisional head endpoint during S63', () => {
  const free = snapshot(6);
  close(free.f_busPlug0!.position, [-76,83,45]);
  close(free.f_busPlug1!.position, [76,83,45]);
  close(free.f_busPlug2!.position, [-22,117,55]);
  close(delta(snapshot(2).f_busPlug2!.position, free.f_busPlug2!.position), [120,-95,65]);
  close(delta(snapshot(3, .275).f_busPlug2!.position, free.f_busPlug2!.position), [60,-47.5,32.5]);
  for (let i = 0; i < 3; i++) {
    assert.equal(free[`f_bus${i}`]!.connectProgress, 0);
    assert.equal(snapshot(7)[`f_bus${i}`]!.connectProgress, 1);
    assert.deepEqual(ACTORS[`f_bus${i}`]!.endpointPlugs, [false, false]);
  }
  assert.deepEqual(ACTORS.f_powerCable!.endpointPlugs, [false, false]);
});

// Catches a diagonal final approach and a plug tip perpendicular to the opening.
test('power and bus plugs align their tips then finish with a downward axial insertion', () => {
  const cases = [['f_powerPlug', 6, .78, .86], ['f_busPlug0', 7, .24, .27], ['f_busPlug1', 7, .54, .57], ['f_busPlug2', 7, .84, .87]] satisfies [string,number,number,number][];
  for (const [id, index, early, late] of cases) {
    const a = snapshot(index!, early)[id!]!, b = snapshot(index!, late)[id!]!;
    close([a.position[0]!, a.position[2]!], [b.position[0]!, b.position[2]!]);
    assert.ok(a.position[1]! > b.position[1]!);
    const tip = new THREE.Vector3(0, 0, -1).applyQuaternion(actorQuaternion(ACTORS[id!]!, b));
    close(tip.toArray(), [0,-1,0]);
  }
});

// Catches re-registering original geometry or losing mesh identity.
test('printed actors retain catalog world positions and source identities', () => {
  for (const id of ['f_batteryTray', 'f_sideR', 'f_sideL', 'f_thighR', 'f_thighL']) {
    assert.equal(ACTORS[id]!.kind, 'mesh');
    close(ACTORS[id]!.end, CATALOG[ACTORS[id]!.sourceId!]!.end);
  }
});

// Catches accumulated animation state and arrays accidentally shared with callers.
test('rewind and replay produce fresh deterministic poses for every actor', () => {
  const early = snapshot(2, .35), late = snapshot(10, .6);
  assert.deepEqual(snapshot(2, .35), early);
  assert.deepEqual(snapshot(10, .6), late);
  late.f_bus0!.points![1]![0] = 99999;
  late.f_thighR!.position[0] = 99999;
  assert.notEqual(snapshot(10, .6).f_bus0!.points![1]![0], 99999);
  assert.notEqual(snapshot(10, .6).f_thighR!.position[0], 99999);
  const result = snapshot(10, 1);
  assert.deepEqual(Object.keys(result).sort(), Object.keys(ACTORS).sort());
  for (const pose of Object.values(result)) {
    assert.ok(pose.position.every(Number.isFinite));
    assert.ok(Number.isFinite(pose.turn));
    assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
  }
  assert.ok(Object.values(snapshot(-1)).every(p => !p.visible));
});
