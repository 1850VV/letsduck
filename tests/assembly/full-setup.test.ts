import test from 'node:test';
import assert from 'node:assert/strict';
import * as prep from '../../frontend/assemble/full/prepare.js';
import * as calibration from '../../frontend/assemble/full/calibration.js';
test('准备阶段覆盖原片开场到已编号的十五只舵机',()=>{
  assert.ok(prep.STEPS,'缺少准备教学');assert.equal(prep.STEPS[0]!.sourceStart,0);assert.equal(prep.STEPS.at(-1)!.sourceEnd,126);
  assert.deepEqual(prep.SERVO_IDS,[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34]);assert.ok(prep.CHAPTERS.every(c=>c.end-c.start<9));
});
test('临时配置两块板独立插合，一次只连一只测试舵机',()=>{
  assert.ok(prep.snapshot,'缺少准备状态');const a=prep.snapshot(1,0),b=prep.snapshot(1,1);
  assert.notDeepEqual(a.p_extension!.position,b.p_extension!.position);assert.deepEqual(a.p_uno!.position,b.p_uno!.position);assert.equal(b.p_extension!.visible,true);assert.equal(b.p_motor!.visible,false);
  const c=prep.snapshot(3,1);assert.equal(c.p_motor!.visible,true);assert.equal(c.p_servoCable!.visible,true);assert.equal(c.p_usb!.visible,false);
});
test('准备阶段回退和重播不遗留电池、线缆或后续对象',()=>{
  assert.ok(prep.snapshot);const a=prep.snapshot(1,.4);prep.snapshot(8,1);assert.deepEqual(prep.snapshot(1,.4),a);assert.equal(a.p_battery!.visible,false);
});
test('校准只提供教程步骤，覆盖全部十五个ID和最终整机查看',()=>{
  assert.ok(calibration.STEPS,'缺少校准教学');assert.equal(calibration.STEPS[0]!.sourceStart,1258);assert.equal(calibration.STEPS.at(-1)!.sourceEnd,1390.042);
  assert.equal(calibration.STEPS.at(-1)!.id,'robot-complete');assert.ok(calibration.STEPS.some(s=>s.servoIds?.length===15));
  assert.deepEqual(calibration.ACTORS,{});assert.match(calibration.STEPS.map(s=>s.text).join(''),/教学/);
});
