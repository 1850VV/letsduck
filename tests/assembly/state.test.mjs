import test from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, snapshot } from '../../frontend/assemble/lesson-state.mjs';

test('拆舵盘只拆输出盘和原装螺丝，后续零件不提前装入', () => {
  const state = snapshot(1, 1);
  assert.equal(state.motor.visible, true);
  assert.equal(state.horn.status, 'removed');
  assert.equal(state.hornScrew.status, 'removed');
  assert.equal(state.foot.visible, false);
  assert.equal(state.shank.visible, false);
});

test('任何步骤回退或重播均由同一状态计算，不能积累位移或遗留螺丝', () => {
  for (let step = 0; step < STEPS.length; step++) {
    const expected = snapshot(step, 1);
    for (let pass = 0; pass < 4; pass++) {
      snapshot(STEPS.length - 1, 1);
      snapshot(step, 0);
      snapshot(step, 0.45);
      assert.deepEqual(snapshot(step, 1), expected);
    }
  }
  assert.equal(snapshot(2, 1).shankScrew0.visible, false);
  assert.equal(snapshot(4, 1).bearing.visible, false);
});

test('完成态保留两颗小腿螺丝、四颗脚掌螺丝，以及轴承、踝轴和长螺丝', () => {
  const state = snapshot(STEPS.length - 1, 1);
  for (const id of ['motor','foot','shank','bearing','axle','wire','plug','axisScrew',
    'shankScrew0','shankScrew1','footScrew0','footScrew1','footScrew2','footScrew3']) {
    assert.equal(state[id].visible, true, id);
    assert.equal(state[id].status, 'installed', id);
  }
  assert.equal(state.horn.status, 'removed');
  assert.equal(state.hornScrew.status, 'removed');
  assert.equal(STEPS[1].sourceStart, 194);
  assert.equal(STEPS.at(-1).sourceEnd, 496);
});
