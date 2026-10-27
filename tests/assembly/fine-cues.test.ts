import test from 'node:test';
import assert from 'node:assert/strict';
import {STEPS} from '../../frontend/assemble/full-state.js';
import {buildFineCues,selectFineCue} from '../../frontend/assemble/fine-cues.js';
const cues=(id:string)=>buildFineCues(STEPS.findIndex(s=>s.id===id));

test('小腿两颗螺丝都有精细提示，整体搬腿不重复提示旧螺丝',()=>{
 assert.deepEqual(cues('r-shank').filter(c=>c.type==='screw').map(c=>c.actorId),['shankScrew0','shankScrew1']);
 assert.equal(cues('t-pair').filter(c=>c.type==='screw').length,0);
});
test('原装螺丝拆卸和踝轴预拧不会被标成最终紧固',()=>{
 assert.equal(cues('r-horn').find(c=>c.actorId==='hornScrew')?.operation,'remove');
 assert.equal(cues('r-axle').find(c=>c.actorId==='axisScrew')?.operation,'partial');
 assert.equal(cues('r-tighten').find(c=>c.actorId==='axisScrew')?.operation,'fasten');
});
test('准备、左右腿、身体和头颈的线端都有具体提示',()=>{
 for(const [step,id]of [['prepare-usb','p_usb:0'],['r-plug','plug'],['l-wire-a','l_legWireA:1'],['t-wire','t_baseWire:0'],['t-motor-r','r_legWireB:1'],['head-yaw-wire','h_plug32'],['head-neck-wire','h_neckWire:0']] satisfies [string,string][])assert.ok(cues(step).some(c=>c.id===id),step+' missing '+id);
});
test('预留自由端和整理线束不会被误标成插入接口',()=>{
 assert.equal(cues('r-wire-b').find(c=>c.id==='r_legWireB:1')?.operation,'route');
 assert.ok(cues('final-route').every(c=>c.operation==='route'));
 assert.ok(!cues('head-neck-wire').some(c=>c.id==='h_headLead:1'));
});
test('头颈接合的八颗螺丝都可逐个查看，不包含早先已装好的螺丝',()=>{
 const all=cues('final-head-join').filter(c=>c.type==='screw');
 assert.equal(all.length,8);assert.ok(all.every(c=>c.actorId.startsWith('f_neckScrew')));
});
test('当前细节跟随三路插接次序和并行螺丝的不同位置',()=>{
 const buses=cues('final-buses');assert.equal(selectFineCue(buses,.45)?.id,'f_busPlug1');assert.equal(selectFineCue(buses,.82)?.id,'f_busPlug2');
 const screws=cues('r-shank');assert.notEqual(selectFineCue(screws,.55)?.id,selectFineCue(screws,.95)?.id);
});
test('软件说明和整机预览不产生精细装配提示',()=>{
 assert.equal(cues('prepare-app').length,0);assert.equal(cues('robot-complete').length,0);
});
test('两侧同时旋入的头颈螺丝也逐一获得放大时段',()=>{
 const all=cues('final-head-join'),seen=new Set(Array.from({length:1001},(_,i)=>selectFineCue(all,i/1000)?.id));
 for(const id of ['f_neckScrewR0','f_neckScrewR1','f_neckScrewR2','f_neckScrewR3','f_neckScrewL0','f_neckScrewL1','f_neckScrewL2','f_neckScrewL3'])assert.ok(seen.has(id),id+' never receives focus');
});
