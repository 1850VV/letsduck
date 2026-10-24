import test from 'node:test';
import assert from 'node:assert/strict';
const lesson=await import('../../frontend/assemble/full-state.mjs').catch(()=>({}));
test('整机教程按原片覆盖准备、双腿、身体、头颈、总装到校准',()=>{
 assert.ok(lesson.STEPS,'缺少整机合成模块');assert.equal(lesson.STEPS[0].sourceStart,0);assert.equal(lesson.STEPS.at(-1).sourceEnd,1390.042);
 assert.equal(lesson.STEPS.at(-1).id,'robot-complete');assert.ok(lesson.CHAPTERS.length>=12);
 for(let i=0;i<lesson.STEPS.length;i++){assert.equal(lesson.chapterFor(i).id,lesson.STEPS[i].chapter);for(const id of lesson.STEPS[i].parts)assert.ok(lesson.ACTORS[id],`${i} 引用未知零件 ${id}`);}
 for(const c of lesson.CHAPTERS)assert.ok(c.end-c.start+1<=9,`${c.id} 超过同屏步骤数`);
});
test('完整机器人包括35个打印件、15个舵机及两块独立控制板',()=>{
 assert.ok(lesson.snapshot);const s=lesson.snapshot(lesson.STEPS.length-1,1),actors=Object.entries(lesson.ACTORS).filter(([id])=>s[id].visible);
 const printed=new Set(actors.map(([,a])=>a.sourceId).filter(id=>/^P\d-\d\d$/.test(id||'')));
 assert.equal(printed.size,35);const motors=new Set(['neck_pitch_1','neck_pitch_3','right_hip_pitch_2','right_hip_pitch_3','head_yaw_2','left_knee_0','right_knee_0','left_hip_pitch_0','left_hip_pitch_4','head_roll_0','head_roll_2','trunk_base_0','trunk_base_4','right_hip_yaw_3','left_hip_yaw_1']);assert.equal(new Set(actors.map(([,a])=>a.sourceId).filter(id=>motors.has(id))).size,15);for(const id of ['foot','l_foot','t_support','h_shell','h_neckA','h_jaw','f_uno','f_extension','f_batteryTray','f_thighL','f_thighR'])assert.equal(s[id].visible,true,id);
 assert.notDeepEqual(s.f_uno.position,s.f_extension.position);
});
test('跳回右脚踝时不遗留身体、头、总装外壳或配置台',()=>{
 assert.ok(lesson.snapshot);const i=lesson.STEPS.findIndex(s=>s.id==='r-ankle-done'),state=lesson.snapshot(i,1);
 assert.equal(state.foot.visible,true);for(const id of ['t_support','h_shell','f_uno','f_sideR','p_uno'])assert.equal(state[id].visible,false,id);
 assert.equal(state.l_foot.visible,false);
});
test('跨章跳步、回退和重播确定且无累积位移',()=>{
 assert.ok(lesson.snapshot);for(let i=0;i<lesson.STEPS.length;i++){
  const expected=lesson.snapshot(i,.37);lesson.snapshot(lesson.STEPS.length-1,1);lesson.snapshot(0,0);
  assert.deepEqual(lesson.snapshot(i,.37),expected,lesson.STEPS[i].id);
 }
});
test('头颈总装时，所有已安装头部组件按同一刚性偏移移动',()=>{
 assert.ok(lesson.snapshot);const index=lesson.STEPS.findIndex(s=>s.sourceStart<=1150&&s.sourceEnd>1150);
 const a=lesson.snapshot(index,0),b=lesson.snapshot(index,1);
 for(const id of ['h_shell','h_neckA','h_jaw','h_upperPad','h_lowerPad']){
  assert.equal(b[id].visible,true,id);for(let j=0;j<3;j++)assert.ok(Math.abs((b[id].position[j]-a[id].position[j])-[-120,95,-65][j])<1e-4,id);
 }
});
test('所有步骤的可见状态、位姿与线缆坐标完整且数值有限',()=>{
 assert.ok(lesson.snapshot);for(let i=0;i<lesson.STEPS.length;i++)for(const p of [0,.25,.6,1]){
  const state=lesson.snapshot(i,p);for(const [id,a] of Object.entries(lesson.ACTORS)){
   const pose=state[id];assert.ok(pose,`${i}:${id}`);assert.equal(typeof pose.visible,'boolean',id);assert.ok(pose.position.length===3&&pose.position.every(Number.isFinite),id);assert.ok(Number.isFinite(pose.opacity)&&pose.opacity>=0&&pose.opacity<=1,id);
   if(pose.visible&&a.kind==='cable')assert.ok(pose.points?.length>=2&&pose.points.flat().every(Number.isFinite),id);
  }
 }
});
