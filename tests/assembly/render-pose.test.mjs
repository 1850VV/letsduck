import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../../frontend/vendor/three.module.js';
const render=await import('../../frontend/assemble/render-pose.mjs').catch(()=>({}));
test('背板和控制板螺丝保留Z轴安装姿态，再绕世界Z轴旋入',()=>{
 assert.ok(render.actorQuaternion,'缺少姿态合成');
 for(const turn of [0,.25,3.7]){const q=render.actorQuaternion({kind:'screw',spinAxis:[0,0,1]},{rotation:[-Math.PI/2,0,0],turn});const shaft=new THREE.Vector3(0,-1,0).applyQuaternion(q);assert.ok(shaft.distanceTo(new THREE.Vector3(0,0,1))<1e-9);}
});
test('舵盘和独立两板保持已有基础姿态',()=>{
 assert.ok(render.actorQuaternion);const q=render.actorQuaternion({kind:'board'},{rotation:[-Math.PI/2,0,0],turn:0});assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).distanceTo(new THREE.Vector3(0,0,-1))<1e-9);
});
test('电源保持双芯两针，舵机总线保持三芯三针',()=>{
 assert.ok(render.cableStyle);assert.equal(render.cableStyle({wireCount:2,wireColors:['#a00','#111']}).count,2);assert.equal(render.cableStyle({cableType:'power'}).count,2);assert.equal(render.cableStyle({}).count,3);assert.equal(render.cableStyle({cableType:'usb-c'}).count,1);
 assert.equal(render.plugPins({pins:2}),2);assert.equal(render.plugPins({}),3);
});

test('头部准备位的方向提示以当前步骤的完成位置为目标',async()=>{
 assert.ok(render.guidanceDelta,'缺少组件目标修正');const lesson=await import('../../frontend/assemble/full-state.mjs');const i=lesson.STEPS.findIndex(s=>s.id==='head-yaw-motor');
 const head=await import('../../frontend/assemble/full/head.mjs'),at=lesson.snapshot(i,.5),done=lesson.snapshot(i,1);const delta=render.guidanceDelta(at.h_motor32,done.h_motor32),expected=head.snapshot(0,1).h_motor32.position.map((n,k)=>n+[120,-95,65][k]-at.h_motor32.position[k]);assert.ok(Math.hypot(...delta.map((n,k)=>n-expected[k]))<1e-9,'以组件准备位内的完成位置引导，不误指向整机原点');
 const moving=render.guidanceDelta({position:[120,60,65]},{position:[120,70,65]});assert.deepEqual(moving,[0,10,0]);
});
