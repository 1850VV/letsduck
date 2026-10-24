import test from 'node:test';
import assert from 'node:assert/strict';
import * as lesson from '../../frontend/assemble/lesson-state.mjs';
const step=id=>{const n=lesson.STEPS.findIndex(s=>s.id===id);assert.ok(n>=0,`缺少视频步骤 ${id}`);return n;};

test('从第一侧脚踝连续覆盖到双腿及脚底软垫，阶段内可直接点选',()=>{
  assert.equal(lesson.STEPS.at(-1).sourceEnd,496);
  assert.equal(lesson.CHAPTERS.length,5);
  for(const chapter of lesson.CHAPTERS){assert.ok(chapter.end-chapter.start+1<=9);assert.equal(lesson.STEPS[chapter.start].chapter,chapter.id);}
  assert.equal(lesson.STEPS[step('l-prepare')].sourceStart,194);
  assert.equal(lesson.STEPS[step('r-pair')].sourceStart,248);
  assert.equal(lesson.STEPS[step('l-pair')].sourceStart,324);
});

test('第二侧脚踝和腿内硬件不提前安装，完成的第一侧保持存在',()=>{
  const first=lesson.snapshot(step('r-ankle-done'),1);
  assert.equal(first.foot.status,'installed');assert.equal(first.l_foot.visible,false);assert.equal(first.r_upperMotor.visible,false);
  const both=lesson.snapshot(step('l-ankle-done'),1);
  assert.equal(both.l_foot.status,'installed');assert.equal(both.foot.status,'installed');assert.equal(both.r_support.visible,false);
  const right=lesson.snapshot(step('r-leg-done'),1);
  assert.equal(right.r_lowerBearing.status,'installed');assert.equal(right.l_support.visible,false);assert.equal(right.r_topLink.visible,false);
});

test('连接右脚踝时，已安装的脚掌、舵机、螺丝与线缆一起移动',()=>{
  const n=step('r-join'),a=lesson.snapshot(n,0),b=lesson.snapshot(n,1);
  for(const id of ['foot','motor','shank','bearing','axle','axisScrew','shankScrew0','footScrew3','wire']){
    const delta=b[id].position.map((v,i)=>v-a[id].position[i]);
    for(let i=0;i<3;i++)assert.ok(Math.abs(delta[i]-[65,0,-45][i])<1e-5,`${id} 未随子装配移动`);
  }
});

test('上端连接件先压入轴承，再连同轴承一起安装，左右独立',()=>{
  const press=lesson.snapshot(step('r-top-bearing'),1);
  assert.equal(press.r_topLink.visible,true);assert.equal(press.r_topBearing.visible,true);assert.equal(press.l_topLink.visible,false);
  const n=step('r-top-link'),a=lesson.snapshot(n,0),b=lesson.snapshot(n,1);
  for(const id of ['r_topLink','r_topBearing']){
    for(let i=0;i<3;i++)assert.ok(Math.abs((b[id].position[i]-a[id].position[i])-[-35,-20,-30][i])<1e-5);
  }
});

test('任意跳步、回退和重播不残留后来安装的零件',()=>{
  const n=step('l-pair'),expected=lesson.snapshot(n,.4);
  for(let k=0;k<3;k++){
    lesson.snapshot(lesson.STEPS.length-1,1);lesson.snapshot(step('r-prepare'),0);
    assert.deepEqual(lesson.snapshot(n,.4),expected);
  }
  const early=lesson.snapshot(step('r-leg-done'),1);
  assert.equal(early.l_upperMotor.visible,false);assert.equal(early.r_sole.visible,false);assert.equal(early.r_topLink.visible,false);
});

test('完成态有两侧各三只舵机、四个大轴承和两只软垫，不误装身体与外壳',()=>{
  const s=lesson.snapshot(lesson.STEPS.length-1,1);
  for(const id of ['motor','l_motor','r_upperMotor','r_lowerMotor','l_upperMotor','l_lowerMotor','r_lowerBearing','l_lowerBearing','r_topBearing','l_topBearing','r_sole','l_sole']){assert.ok(s[id],id);assert.equal(s[id].status,'installed',id);}
  assert.equal(s.r_upperHorn.status,'removed');assert.equal(s.l_upperHorn.status,'removed');
  assert.equal(Object.values(lesson.ACTORS).filter(a=>a.fastener==='M2x6').length,44);
  assert.equal(Object.values(lesson.ACTORS).filter(a=>a.fastener==='M2.3x8').length,2);
  assert.equal(s.r_bodyShell,undefined);
});

test('上端原装舵盘和中央螺丝随舵机进入',()=>{
  for(const side of ['r','l']){
    const birth=step(`${side}-pair`),s=lesson.snapshot(birth,.2),motor=lesson.ACTORS[`${side}_upperMotor`];
    for(const id of [`${side}_upperHorn`,`${side}_upperHornScrew`]){
      for(let i=0;i<3;i++)assert.ok(Math.abs((s[id].position[i]-lesson.ACTORS[id].end[i])-(s[`${side}_upperMotor`].position[i]-motor.end[i]))<1e-5,`${id} 随舵机移动`);
    }
  }
});

test('上端拆卸先卸中央螺丝，再移动舵盘',()=>{
  for(const side of ['r','l']){
    const removing=lesson.snapshot(step(`${side}-top-horn`),.2);
    assert.deepEqual(removing[`${side}_upperHorn`].position,lesson.ACTORS[`${side}_upperHorn`].end);
    assert.notDeepEqual(removing[`${side}_upperHornScrew`].position,lesson.ACTORS[`${side}_upperHornScrew`].end);
  }
});
