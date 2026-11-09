import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CheckupMeter, checkup, mergeCheckup } from '../../packages/devices/src/duck-checkup.js';

// Default pose, MOTOR order 10–14, 20–24, 30–34.
const HOME = [0, -5, -22, 0, 22, 0, 5, 22, 0, -22, 20, 20, 0, 0, 0];
const STILL = new Array(15).fill(0);
const DEG = Math.PI / 180;
const upright = (rollDeg = 0) => [0, Math.sin(rollDeg * DEG), -Math.cos(rollDeg * DEG)];

/** Feed `seconds` of 50 Hz frames built by `frame(t)` (t in s). */
function feed(meter: CheckupMeter, seconds: number, frame: (t: number) => Record<string, unknown>, from = 0) {
  let seq = from;
  for (let i = 0; i < seconds * 50; i++) { const t = i / 50; meter.add({ mcu_seq: seq += 2, voltage_v: 7.8, acc: [0.1, 0.2, -9.8 + Math.sin(i) * .01], gyro: [Math.sin(i) * .1, 0, 0], ...frame(t) }, 1_000_000 + from * 10 + i * 20); }
  return seq;
}
const stand = (err = 0) => () => ({ mode: 'hold', angles: HOME.map((v, i) => i === 3 ? v + err : v), targets: HOME, velocities: STILL, gravity: upright(), gyro_corrected: [0.2, -0.3, 0.1] });
/** A step every 0.4 s; the body rolls ±roll, every leg joint misses its target by up to `err`, knees are told to swing ±swing/2. */
const walk = (roll: number, err: number, swing: number) => (t: number) => {
  const phase = Math.sin(2 * Math.PI * 2.5 * t), targets = HOME.map((v, i) => [3, 8].includes(i) ? v + phase * swing / 2 : v + phase * 5);
  return { mode: 'policy', recovery: { phase: 'walk' }, command: [0.2, 0, 0], targets, angles: targets.map((v, i) => [1, 2, 3, 4, 6, 7, 8, 9].includes(i) ? v + Math.SQRT2 * err * Math.cos(2 * Math.PI * 2.5 * t) : v), velocities: targets.map(() => 30), gravity: upright(roll * phase), inference_hz: 46 };
};

test('a walk like 11-09 passes every measured stage', () => {
  const m = new CheckupMeter(); feed(m, 5, stand()); feed(m, 12, walk(2.2, 5, 32), 1000);
  const c = checkup(m.data());
  assert.deepEqual(c.rows.map(r => r.grade), ['good', 'manual', 'manual', 'good', 'good', 'good', 'good']);
  assert.equal(c.first, null);
  assert.ok(Math.abs(c.rows[5]!.values.sway as number - 2.2) < .3, 'sway is the roll half-span');
});

test('a walk like 11-07 is red on looseness, which comes first, and on walking', () => {
  const m = new CheckupMeter(); feed(m, 5, stand()); feed(m, 12, walk(10, 16, 75), 1000);
  const c = checkup(m.data()), byStage = Object.fromEntries(c.rows.map(r => [r.stage, r]));
  assert.equal(byStage.structure!.grade, 'bad'); assert.equal(byStage.walk!.grade, 'bad');
  assert.deepEqual(byStage.walk!.problems.map(p => p.id), ['walk-err', 'knee-swing']);
  assert.equal(c.first?.id, 'sway'); assert.equal(byStage.stand!.grade, 'good', 'standing looked fine on 11-07 too');
});

test('a fall during walking is counted', () => {
  const m = new CheckupMeter(); const seq = feed(m, 4, walk(2, 5, 30));
  assert.equal(m.add({ mode: 'policy', recovery: { phase: 'default_pose' }, mcu_seq: seq + 2 }, 2_000_000), true);
  const d = m.data(); assert.equal(d.falls.length, 1);
  assert.equal(checkup(d).first?.id, 'falls');
});

test('an IMU pinned at its range is red and blocks the later stages, whatever the board says', () => {
  const m = new CheckupMeter(); feed(m, 2, t => ({ ...stand()(), acc: [-19.6, 19.6, -19.6], imu_ok: true, gyro: [-561.5, -314.6, 249.3 + t * 0] }));
  feed(m, 6, walk(10, 16, 75), 1000);
  const c = checkup(m.data());
  assert.equal(c.first?.id, 'imu-stuck'); assert.equal(c.first?.values.how, 'saturated');
  assert.deepEqual(c.rows.slice(4).map(r => r.grade), ['blocked', 'blocked', 'blocked']);
});

test('a gyro that repeats the same reading while frames advance is frozen', () => {
  const m = new CheckupMeter(); feed(m, 3, () => ({ ...stand()(), gyro: [-561.5, -314.6, 249.3] }));
  assert.equal(m.data().imuStuck, 'frozen');
});

test('a servo missing for three readings is red; a single blink is not', () => {
  const blink = new CheckupMeter(); feed(blink, 2, t => ({ ...stand()(), missing_joint_ids: t === .5 ? [22] : [] }));
  assert.deepEqual(blink.data().missing, []);
  const gone = new CheckupMeter(); feed(gone, 2, t => ({ ...stand()(), missing_joint_ids: t > 1 ? [22] : [] }));
  const c = checkup(gone.data()); assert.deepEqual(gone.data().missing, [22]);
  assert.equal(c.first?.id, 'missing'); assert.equal(c.rows[4]!.grade, 'blocked');
});

test('a knee straining while standing names the joint', () => {
  const m = new CheckupMeter(); feed(m, 4, stand(5));
  const c = checkup(m.data());
  assert.equal(c.first?.id, 'stand-err'); assert.equal(c.first?.values.id, 13); assert.equal(c.first?.grade, 'warn');
  assert.deepEqual(c.rows.slice(5).map(r => r.grade), ['skip', 'skip'], 'no walking, nothing judged');
});

test('sittings of one power-on merge: walking from the one that walked, standing from the one that stood', () => {
  const a = new CheckupMeter(); feed(a, 4, stand());
  const b = new CheckupMeter(); feed(b, 10, walk(10, 16, 75));
  const d = mergeCheckup([a.data(), b.data()]);
  assert.equal(d.holdS, a.data().holdS); assert.equal(d.sway, b.data().sway);
  assert.equal(checkup(d).first?.id, 'sway');
});
