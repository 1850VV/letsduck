import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG} from '../../frontend/assemble/full-catalog.mjs';
import * as THREE from '../../frontend/vendor/three.module.js';

const head = await import('../../frontend/assemble/full/head.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('/full/head.mjs')) return {};
  throw error;
});
function ready() {
  assert.equal(typeof head.snapshot, 'function', 'head 必须提供可直接导入的状态模块');
}
function step(id) {
  ready();
  const index = head.STEPS.findIndex(item => item.id === id);
  assert.ok(index >= 0, `缺少视频动作 ${id}`);
  return index;
}
const close = (actual, expected, message = '') => {
  assert.equal(actual.length, expected.length, message);
  actual.forEach((value, index) => assert.ok(Math.abs(value - expected[index]) < 1e-7, `${message} ${index}: ${value} ≠ ${expected[index]}`));
};

test('按三章连续覆盖 12:48–18:22，点选不会引用缺失演员', () => {
  ready();
  assert.equal(head.CHAPTERS.length, 3);
  assert.equal(head.STEPS[0].sourceStart, 768);
  assert.equal(head.STEPS.at(-1).sourceEnd, 1102);
  let cursor = 0;
  for (const chapter of head.CHAPTERS) {
    assert.equal(chapter.start, cursor);
    assert.ok(chapter.end - chapter.start < 9);
    assert.ok(chapter.id.startsWith('head-'));
    for (let index = chapter.start; index <= chapter.end; index++) {
      const item = head.STEPS[index];
      assert.equal(item.chapter, chapter.id);
      assert.ok(item.sourceEnd > item.sourceStart);
      assert.ok(item.sourceStart >= chapter.sourceStart && item.sourceEnd <= chapter.sourceEnd);
      assert.ok(item.parts.length);
      item.parts.forEach(id => assert.ok(head.ACTORS[id], `${item.id}: ${id}`));
      assert.equal(item.camera.length, 3);
      assert.equal(item.target.length, 3);
      if (index > 0) assert.equal(item.sourceStart, head.STEPS[index - 1].sourceEnd);
    }
    cursor = chapter.end + 1;
  }
  assert.equal(cursor, head.STEPS.length);
});

test('真实网格保留 CATALOG 世界坐标，所有演员都属于 head', () => {
  ready();
  const bindings = {
    h_platform:'P2-02', h_jaw:'P2-01', h_neckA:'P3-02', h_neckB:'P3-03',
    h_shell:'P4-01', h_eyeShell:'P2-06', h_eyes:'P3-01',
    h_upperPad:'P1-02', h_lowerPad:'P1-01', h_yawSupport:'P6-08',
    h_servoSupport:'P4-02', h_pitchSupport:'P6-01',
    h_motor30:'neck_pitch_3', h_motor31:'neck_pitch_1',
    h_motor32:'head_yaw_2', h_motor33:'head_roll_2', h_mouthMotor:'head_roll_0',
  };
  for (const [id, sourceId] of Object.entries(bindings)) {
    assert.equal(head.ACTORS[id].sourceId, sourceId);
    close(head.ACTORS[id].end, CATALOG[sourceId].end, id);
  }
  for (const [id, actor] of Object.entries(head.ACTORS)) {
    assert.ok(id.startsWith('h_'));
    assert.equal(actor.group, 'head', id);
    assert.ok(actor.source);
    if (actor.kind === 'mesh') assert.ok(CATALOG[actor.sourceId]);
  }
});

test('旋转模块、嘴和颈部不会提前显示，已装零件保持存在', () => {
  const start = head.snapshot(step('head-yaw-wire'), 1);
  assert.equal(start.h_motor32.status, 'installed');
  for (const id of ['h_motor33','h_platform','h_mouthMotor','h_jaw','h_motor30','h_shell','h_upperPad']) assert.equal(start[id].visible, false, id);
  const mouth = head.snapshot(step('head-mouth-check'), 1);
  for (const id of ['h_motor32','h_motor33','h_platform','h_mouthMotor','h_jaw','h_servoSupport']) assert.equal(mouth[id].visible, true, id);
  for (const id of ['h_motor30','h_motor31','h_neckA','h_neckB','h_shell','h_eyes','h_upperAdhesive','h_lowerPad']) assert.equal(mouth[id].visible, false, id);
});

test('拆卸时先动中央螺丝后动舵盘，嘴部舵机按PDF统一为34', () => {
  for (const [action, prefix] of [['head-core-horn-wire','h_core'],['head-mouth-horn-wire','h_mouth']]) {
    const n = step(action), early = head.snapshot(n, .2), done = head.snapshot(n, 1);
    assert.notDeepEqual(early[`${prefix}HornScrew`].position, head.snapshot(n, 0)[`${prefix}HornScrew`].position);
    close(early[`${prefix}Horn`].position, head.snapshot(n, 0)[`${prefix}Horn`].position);
    assert.equal(done[`${prefix}Horn`].status, 'removed');
    assert.equal(done[`${prefix}HornScrew`].status, 'removed');
    assert.equal(head.ACTORS[`${prefix}HornScrew`].fastener, null);
  }
  assert.doesNotMatch(head.ACTORS.h_mouthMotor.label, /33/);
  assert.match(head.ACTORS.h_mouthMotor.label, /34/);
  assert.match(head.STEPS[step('head-mouth-prepare')].text, /ID34/);
});

test('原装螺丝先沿真实输出轴向外退出，舵盘和螺丝不穿过舵机实体', () => {
  for(const [action,prefix,motor,axis,direction] of [
    ['head-core-horn-wire','h_core','h_motor33',2,-1],
    ['head-mouth-horn-wire','h_mouth','h_mouthMotor',0,1],
  ]) {
    const n=step(action),initial=head.snapshot(n,0),early=head.snapshot(n,.08);
    const delta=early[prefix+'HornScrew'].position.map((v,i)=>v-initial[prefix+'HornScrew'].position[i]);
    assert.ok(delta[axis]*direction>0,'先沿输出轴向外退出');
    delta.forEach((v,i)=>{if(i!==axis)assert.ok(Math.abs(v)<1e-8,'退出前不横穿舵机');});
    for(const p of [0,.08,.15,.25,.4,.55,.7,1]) {
      const s=head.snapshot(n,p),center=s[motor].position,size=head.ACTORS[motor].size;
      for(const id of [prefix+'Horn',prefix+'HornScrew']) {
        const inside=s[id].position.every((v,i)=>v>center[i]-size[i]/2&&v<center[i]+size[i]/2);
        assert.equal(inside,false,`${id} 不穿过舵机实体 p=${p}`);
      }
    }
  }
  close(head.ACTORS.h_coreHorn.end.slice(0,2),[0,223.75],'ID33源输出轴的X/Y');
  close(head.ACTORS.h_mouthHorn.end.slice(1),[226.55,41],'嘴部源输出轴的Y/Z');
});

test('旋转子组件放进平台时，轴承、已装螺丝、插头和线束刚性同行', () => {
  const n = step('head-platform'), before = head.snapshot(n, 0), after = head.snapshot(n, 1);
  const ids = ['h_motor32','h_motor33','h_yawSupport','h_pitchSupport','h_bearingFront','h_bearingBack','h_yawScrew0','h_rollScrew0','h_plug32','h_wire32'];
  for (const id of ids) close(after[id].position.map((v, i) => v - before[id].position[i]), [0,-28,40], id);
  assert.equal(after.h_coreHorn.status, 'removed');
  close(after.h_coreHorn.position, before.h_coreHorn.position, '已拆舵盘保留在零件区');
});

test('第二旋转子组件先分离准备，再携带支架、轴承、舵盘和已装螺丝整体对接', () => {
  const n=step('head-core-join'),prior=head.snapshot(n-1,1),before=head.snapshot(n,0),docked=head.snapshot(n,.55),done=head.snapshot(n,1);
  const moving=['h_motor33','h_yawSupport','h_bearingFront','h_bearingBack','h_rollScrew0','h_rollScrew1','h_rollScrew2','h_rollScrew3','h_coreHorn','h_coreHornScrew'];
  for (const id of moving) {
    close(before[id].position,prior[id].position,`${id} 从前一步准备位连续进入`);
    close(docked[id].position.map((v,i)=>v-before[id].position[i]),[-45,0,20],`${id} 随第二子组件同行`);
    assert.equal(prior[id].status,'prepared',`${id} 仍是分离子组件`);
    assert.equal(head.snapshot(n,.25)[id].status,'moving',`${id} 正在对接`);
    close(done[id].position,docked[id].position,`${id} 对接后保持不动`);
    assert.equal(done[id].status,'installed');
  }
  for (const id of ['h_motor32','h_pitchSupport','h_bearingCrown','h_yawScrew0','h_plug32','h_wire32']) close(done[id].position,before[id].position,`${id} 保持在第一子组件`);
  assert.equal(head.snapshot(n,.55).h_coreScrew0.opacity,0,'先对接，再旋入连接螺丝');
  assert.ok(done.h_coreScrew0.opacity>0);
});

test('嘴部先放舵机再套下巴，检查中张开并在结束时闭合', () => {
  const placing = step('head-mouth-jaw');
  const first = head.snapshot(placing, .2);
  assert.notDeepEqual(first.h_mouthMotor.position, head.snapshot(placing, 0).h_mouthMotor.position);
  close(first.h_jaw.position, head.snapshot(placing, 0).h_jaw.position, '下巴等舵机入位');
  const checking = step('head-mouth-check');
  const begin = head.snapshot(checking, 0), open = head.snapshot(checking, .5), closed = head.snapshot(checking, 1);
  close(begin.h_jaw.rotation, [0,0,0]);
  assert.ok(open.h_jaw.rotation[0] > .1);
  assert.notDeepEqual(open.h_jaw.position, closed.h_jaw.position, '绕侧轴转动，而非围绕网格中心');
  close(closed.h_jaw.rotation, [0,0,0]);
  close(closed.h_jaw.position, CATALOG['P2-01'].end);
  assert.match(head.STEPS[checking].check, /示意|模拟/);
});

test('双舵机脖子先装连接板，再整体接到头部，螺丝不残留在准备位', () => {
  const plate = head.snapshot(step('head-neck-plate'), 1);
  assert.equal(plate.h_neckA.visible, true);
  assert.equal(plate.h_neckB.visible, true);
  const n = step('head-neck-join'), before = head.snapshot(n, 0), after = head.snapshot(n, 1);
  for (const id of ['h_motor30','h_motor31','h_neckA','h_neckB','h_neckAScrew0','h_neckBScrew0']) {
    close(after[id].position.map((v,i) => v - before[id].position[i]), [-70,0,-25], id);
  }
  assert.match(head.STEPS[n].text, /操作者/);
  assert.match(head.STEPS[n].text, /左手/);
});

test('整体连接和胶片贴合仍在移动时不提前标为已安装', () => {
  for (const [action,id,p] of [
    ['head-platform','h_motor32',.5],
    ['head-neck-join','h_neckA',.5],
    ['head-mouth-jaw','h_mouthMotor',.2],
    ['head-lower-pad','h_lowerAdhesive',.5],
    ['head-upper-pad-check','h_upperAdhesive',.3],
  ]) {
    const n=step(action);
    assert.equal(head.snapshot(n,p)[id].status,'moving',`${id} 动作尚未结束`);
    assert.equal(head.snapshot(n,1)[id].status,'installed',`${id} 完成后安装到位`);
  }
});

test('贴胶时软垫在准备位可见，贴合后两者一起安装并随下巴活动', () => {
  for (const [tapeAction,installAction,padId,adhesiveId,sourceId,offset,midProgress] of [
    ['head-lower-tape','head-lower-pad','h_lowerPad','h_lowerAdhesive','P1-01',[0,14,28],.5],
    ['head-upper-tape','head-upper-pad-check','h_upperPad','h_upperAdhesive','P1-02',[0,18,28],.3],
  ]) {
    const tape=step(tapeAction),install=step(installAction);
    assert.equal(head.snapshot(tape-1,1)[padId].visible,false,'软垫不早于贴胶步骤出现');
    const padEnd=CATALOG[sourceId].end;
    for (const p of [0,.5,1]) {
      const state=head.snapshot(tape,p);
      assert.equal(state[padId].visible,true,`${padId} 贴胶时必须可见`);
      assert.equal(state[padId].status,'prepared');
      close(state[padId].position,padEnd.map((v,i)=>v+offset[i]),`${padId} 停留在准备位`);
    }
    const beginning=head.snapshot(tape,0),glued=head.snapshot(tape,1);
    const startGap=beginning[adhesiveId].position[1]-beginning[padId].position[1];
    const endGap=glued[adhesiveId].position[1]-glued[padId].position[1];
    assert.ok(Math.abs(startGap)>Math.abs(endGap)+9,'胶片沿对应表面法线贴近软垫');
    const localSlab=[endGap-.11,endGap+.11];
    if(padId==='h_lowerPad') assert.ok(localSlab[1]<-3.494168,'胶片在下垫实测底面之外');
    else assert.ok(localSlab[0]>1.198525,'胶片在上垫实测顶面之外');
    const before=head.snapshot(install,0),moving=head.snapshot(install,midProgress),done=head.snapshot(install,1);
    close(before[padId].position,glued[padId].position,'软垫跨步骤连续');
    close(before[adhesiveId].position,glued[adhesiveId].position,'胶片跨步骤连续');
    assert.notDeepEqual(moving[padId].position,before[padId].position,'软垫移向嘴部');
    close(moving[adhesiveId].position.map((v,i)=>v-before[adhesiveId].position[i]),moving[padId].position.map((v,i)=>v-before[padId].position[i]),'胶片与软垫刚性同行');
    close(done[padId].position,padEnd,'最终仍使用目录坐标');
    assert.equal(done[padId].status,'installed');
    assert.equal(done[adhesiveId].status,'installed');
  }
  const n = step('head-upper-pad-check'), open = head.snapshot(n, .85), closed = head.snapshot(n, 1);
  for (const id of ['h_jaw','h_lowerPad','h_lowerAdhesive']) {
    assert.ok(open[id].rotation[0] > 0, id);
    close(closed[id].rotation, [0,0,0], id);
  }
  assert.notDeepEqual(open.h_lowerAdhesive.position, closed.h_lowerAdhesive.position);
});

test('线缆均提供相对 pose.position 的有限路径，不假定电气针脚', () => {
  ready();
  const end = head.snapshot(head.STEPS.length - 1, 1);
  let count = 0;
  for (const [id, actor] of Object.entries(head.ACTORS)) if (actor.kind === 'cable') {
    count++;
    assert.ok(end[id].visible);
    assert.ok(end[id].points.length >= 4, id);
    end[id].points.flat().forEach(value => assert.ok(Number.isFinite(value), id));
    assert.match(actor.source, /示意/);
    assert.match(actor.source, /待核/);
    assert.ok(!actor.ports, '未经核验不提供针脚表');
  }
  assert.ok(count >= 4);
});

test('插线动作中三芯线首端与独立插头一起移动，整理线环后保持接合', () => {
  for (const [wireId,plugId,action] of [
    ['h_wire32','h_plug32','head-yaw-wire'],
    ['h_wire33','h_plug33','head-core-horn-wire'],
    ['h_wireMouth','h_plugMouth','head-mouth-horn-wire'],
  ]) {
    for (const p of [0,.3,.7,1]) {
      const state=head.snapshot(step(action),p);
      close(state[wireId].points[0].map((v,i)=>v+state[wireId].position[i]),state[plugId].position,`${wireId} 插头接合`);
    }
    const done=head.snapshot(step('head-neck-wire'),1);
    close(done[wireId].points[0].map((v,i)=>v+done[wireId].position[i]),done[plugId].position,`${wireId} 整理后接合`);
  }
});

test('最终几何回到目录坐标，五只舵机独立可见，拆下的原装件继续保留', () => {
  ready();
  const final = head.snapshot(head.STEPS.length - 1, 1);
  for (const id of ['h_motor30','h_motor31','h_motor32','h_motor33','h_mouthMotor','h_platform','h_jaw','h_shell','h_eyes','h_eyeShell','h_upperPad','h_lowerPad','h_neckA','h_neckB','h_pitchSupport']) {
    assert.equal(final[id].status, 'installed', id);
    close(final[id].position, head.ACTORS[id].end, id);
  }
  for (const id of ['h_coreHorn','h_coreHornScrew','h_mouthHorn','h_mouthHornScrew']) {
    assert.equal(final[id].visible, true);
    assert.equal(final[id].status, 'removed');
  }
});

test('回退、跳转、重播和修改返回值都不能污染以后状态', () => {
  ready();
  for (let n = 0; n < head.STEPS.length; n++) {
    const expected = head.snapshot(n, .42);
    head.snapshot(head.STEPS.length - 1, 1);
    const dirty = head.snapshot(n, .42);
    dirty.h_motor32.position[0] += 1000;
    for (const pose of Object.values(dirty)) if (pose.points) pose.points[0][0] += 1000;
    head.snapshot(0, 0);
    assert.deepEqual(head.snapshot(n, .42), expected);
  }
  assert.equal(head.snapshot(step('head-platform'), 1).h_shell.visible, false);
});

test('越界索引和进度会收敛到有效边界，所有步骤都返回完整姿态', () => {
  ready();
  assert.deepEqual(head.snapshot(-10, -1), head.snapshot(0, 0));
  assert.deepEqual(head.snapshot(1000, 2), head.snapshot(head.STEPS.length - 1, 1));
  for (let n = 0; n < head.STEPS.length; n++) for (const p of [0,.25,.5,.75,1]) {
    const state = head.snapshot(n, p);
    assert.equal(Object.keys(state).length, Object.keys(head.ACTORS).length);
    for (const [id, pose] of Object.entries(state)) {
      assert.equal(typeof pose.visible, 'boolean', id);
      assert.equal(pose.position.length, 3, id);
      pose.position.forEach(value => assert.ok(Number.isFinite(value), id));
      assert.ok(Number.isFinite(pose.turn));
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
      if (!pose.visible) assert.equal(pose.status, head.ACTORS[id].hardwareStatus&&n>=head.ACTORS[id].step?'pending':'waiting', id);
    }
  }
});

test('原片先在第一支架压入一只轴承，第二支架再带两只轴承进入', () => {
  const first=head.snapshot(0,.24);
  assert.equal(first.h_pitchSupport.visible,true);
  assert.equal(first.h_yawSupport.visible,false);
  assert.equal(first.h_bearingCrown.visible,true);
  assert.equal(first.h_bearingFront.visible,false);
  assert.equal(first.h_bearingBack.visible,false);
  assert.equal(first.h_bearingCrown.status,'installed');
  assert.notDeepEqual(first.h_motor32.position,head.snapshot(0,1).h_motor32.position,'先压轴承，再装ID32');
  const second=head.snapshot(step('head-bearings'),1);
  assert.equal(second.h_yawSupport.visible,true);
  for(const id of ['h_bearingFront','h_bearingBack']) assert.equal(second[id].visible,true);
  const crown=head.ACTORS.h_bearingCrown;
  assert.ok(Math.abs(crown.end[0])<.05 && Math.abs(crown.end[2]-40.99)<.05,'复用轴承沿P6-01源圆柱轴线');
  assert.ok(crown.end[1]>208.20 && crown.end[1]<208.30,'轴承底面落在源圆柱约206.24的肩面上');
});

test('被固定件到位前螺丝不可出现或旋入', () => {
  for(const [n,part,firstScrew] of [[0,'h_motor32','h_yawScrew0'],[3,'h_motor33','h_rollScrew0'],[10,'h_servoSupport','h_supportScrew0']]) {
    const end=head.snapshot(n,1)[part].position;
    for(const p of [.1,.2,.3,.4,.5,.6,.7,.8,.9,1]) {
      const s=head.snapshot(n,p);
      if(s[firstScrew].opacity>.001) {
        close(s[part].position,end,`${part} 先贴合再固定`);
        for(const id of head.STEPS[n].parts.filter(id=>head.ACTORS[id].kind==='mesh')) {
          if(s[id].visible) close(s[id].position,head.snapshot(n,1)[id].position,`${id} 先贴合再固定`);
        }
      }
    }
  }
});

test('贴合后的胶层位于源网格外表面，不能埋入软垫实体中心', () => {
  for(const [pad,glue,side,surface] of [['h_lowerPad','h_lowerAdhesive',-1,-3.494168],['h_upperPad','h_upperAdhesive',1,1.198525]]) {
    const offset=head.ACTORS[glue].end[1]-head.ACTORS[pad].end[1];
    const innerFace=offset-side*head.ACTORS[glue].size[1]/2;
    assert.ok((innerFace-surface)*side>0,`${glue} 位于真实表面之外`);
  }
});

test('颈部两侧螺丝从外向内，锚点对应源网格四孔且不重复造孔', () => {
  const holes={
    h_neckA:[[162.4882,49.0017],[167.4882,49.0030],[162.4923,33.0017],[167.4923,33.0030]],
    h_neckB:[[162.5027,32.9921],[167.5027,32.9935],[162.4981,48.9921],[167.4981,48.9935]],
  };
  for(const [plate,fixture] of Object.entries(holes)) {
    const screws=Object.entries(head.ACTORS).filter(([id])=>id.startsWith(plate+'Screw'));
    assert.equal(screws.length,4,'源连接板只有四个实际孔');
    const sign=plate==='h_neckA'?1:-1;
    const used=new Set();
    for(const [id,a] of screws) {
      assert.ok((a.start[0]-a.end[0])*sign>0,`${id} 从该侧外部进入`);
      const at=fixture.findIndex(([y,z])=>Math.hypot(a.end[1]-y,a.end[2]-z)<.03);
      assert.ok(at>=0,`${id} 应穿过源孔轴线`);assert.ok(!used.has(at));used.add(at);
      assert.ok(Math.sign(Math.sin(a.orientationZ))===-sign,'螺丝轴线朝向连接板');
    }
  }
});

test('原片先给ID31固定连接板一端，再把ID30接入并固定另一端', () => {
  const n=step('head-neck-pair'),begin=head.snapshot(n,0),first=head.snapshot(n,.615),joining=head.snapshot(n,.7),done=head.snapshot(n,1);
  close(first.h_motor30.position,begin.h_motor30.position,'第一端固定时另一只舵机仍分离');
  close(first.h_motor31.position,done.h_motor31.position,'先到位的ID31保持不动');
  for(const id of ['h_neckAScrew0','h_neckAScrew1']) {
    assert.equal(first[id].status,'installed');
    assert.ok(head.ACTORS[id].end[1]>165,'首两孔在上端ID31一侧');
  }
  assert.notDeepEqual(joining.h_motor30.position,begin.h_motor30.position,'固定第一端后再接入ID30');
  assert.equal(head.snapshot(n,.75).h_neckAScrew2.opacity,0,'第二只贴合后再固定另一端');
  assert.equal(done.h_neckAScrew2.status,'installed');
});

test('颈部插线的末端始终跟随独立插头，工厂不再生成重复插头', () => {
  for(const p of [0,.3,.55,.7,1]) {
    const s=head.snapshot(step('head-neck-wire'),p);
    close(s.h_neckWire.points.at(-1).map((v,i)=>v+s.h_neckWire.position[i]),s.h_plugNeck.position,'线末端与插头接合');
  }
  for(const id of ['h_wire32','h_wire33','h_wireMouth']) assert.deepEqual(head.ACTORS[id].endpointPlugs,[false,true]);
  assert.deepEqual(head.ACTORS.h_neckWire.endpointPlugs,[true,false]);
  close(head.snapshot(24,1).h_headLead.points.at(-1),[-22,117,55],'保留总装线连续交接末端');
});

test('按原片先贴下巴软垫，后贴上嘴，最后闭合检查', () => {
  assert.equal(head.STEPS[21].id,'head-lower-tape');
  assert.equal(head.STEPS[22].id,'head-lower-pad');
  assert.equal(head.STEPS[23].id,'head-upper-tape');
  assert.equal(head.STEPS[24].id,'head-upper-pad-check');
  const lower=head.snapshot(22,1);
  assert.equal(lower.h_lowerPad.status,'installed');
  assert.equal(lower.h_upperPad.visible,false);
  const n=step('head-upper-pad-check');
  assert.equal(head.snapshot(n,1).h_upperPad.status,'installed');
  const before=head.snapshot(n,.65),open=head.snapshot(n,.85);
  assert.notDeepEqual(open.h_platformScrew0.position,before.h_platformScrew0.position,'已装下巴侧螺丝随下巴活动');
});

test('五只头颈舵机的教学插座使用源矩形面特征，开口不埋入实体', () => {
  const fixtures={
    h_motor30:{axis:2,cue:[-7,3,0],tangent:[0,1,0]},
    h_motor31:{axis:2,cue:[-7,-3,0],tangent:[0,1,0]},
    h_motor32:{axis:2,cue:[-3,7,0],tangent:[1,0,0]},
    h_motor33:{axis:1,cue:[-3,0,-7],tangent:[1,0,0]},
    h_mouthMotor:{axis:1,cue:[-7.5,0,3],tangent:[0,0,1]},
  };
  for(const [id,f] of Object.entries(fixtures)) {
    const ports=head.ACTORS[id].servoPorts;
    assert.equal(ports?.length,2,`${id} 必须覆盖源网格两侧可见矩形面`);
    for(const sign of [-1,1]) {
      const port=ports.find(p=>p.normal[f.axis]===sign);
      assert.ok(port);
      close(port.position,f.cue.map((v,i)=>i===f.axis?sign*11.3:v),'开口比源面向外1.3');
      close(port.tangent,f.tangent);
      assert.match(port.evidence,/illustrative.*unverified/);
      assert.ok(port.position[f.axis]*sign-1.3>=9.999,'插座内壁止于源矩形面，不塞入机身');
    }
  }
});

test('独立插头前端、相邻线段与渲染插座共用开口和法线，末段轴向插入', () => {
  for(const [plugId,wireId,motorId,action,endIndex] of [
    ['h_plug32','h_wire32','h_motor32','head-yaw-wire',0],
    ['h_plug33','h_wire33','h_motor33','head-core-horn-wire',0],
    ['h_plugMouth','h_wireMouth','h_mouthMotor','head-mouth-horn-wire',0],
    ['h_plugNeck','h_neckWire','h_motor30','head-neck-wire',4],
  ]) {
    const a=head.ACTORS[plugId],port=head.ACTORS[motorId].servoPorts?.[a.portIndex];
    assert.ok(port,`${plugId} 必须引用实际声明的教学插座`);
    assert.equal(a.portMotor,motorId);
    const n=step(action),done=head.snapshot(n,1);
    const opening=done[motorId].position.map((v,i)=>v+port.position[i]);
    const front=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(...done[plugId].rotation));
    close(front.toArray(),port.normal.map(v=>-v),'插头前端指向插座');
    close(done[plugId].position.map((v,i)=>v+front.getComponent(i)*1.65),opening,'前端落在开口中心');
    const longAxis=new THREE.Vector3(1,0,0).applyEuler(new THREE.Euler(...done[plugId].rotation));
    assert.ok(longAxis.dot(new THREE.Vector3(...port.tangent))>.999,'插头长边与源矩形长边一致');
    for(const p of [.6,.8,1]) {
      const s=head.snapshot(n,p);
      const gap=s[plugId].position.map((v,i)=>v-done[plugId].position[i]);
      assert.ok(gap.reduce((sum,v,i)=>sum+v*port.normal[i],0)>=-1e-7,'插入从外侧靠近');
      const tangentGap=gap.map((v,i)=>v-port.normal[i]*gap.reduce((sum,x,j)=>sum+x*port.normal[j],0));
      assert.ok(Math.hypot(...tangentGap)<1e-7,'最后阶段只沿法线移动');
      const points=s[wireId].points,neighbor=points[endIndex===0?1:points.length-2];
      const delta=neighbor.map((v,i)=>v-points[endIndex][i]);
      close(delta.map(v=>v/Math.hypot(...delta)),port.normal,'相邻线段保持轴向');
    }
  }
});

test('已连接插头始终随电机或子组件移动，预留线只调整舵机端', () => {
  for(const [action,plugId,motorId] of [
    ['head-platform','h_plug32','h_motor32'],['head-platform','h_plug33','h_motor33'],['head-mouth-jaw','h_plugMouth','h_mouthMotor'],
  ]) {
    const n=step(action),a=head.ACTORS[plugId],port=head.ACTORS[motorId].servoPorts?.[a.portIndex];
    assert.ok(port);
    for(const p of [0,.3,.7,1]) {
      const s=head.snapshot(n,p);
      close(s[plugId].position,s[motorId].position.map((v,i)=>v+port.position[i]+port.normal[i]*1.65));
    }
  }
  const s=head.snapshot(24,1),lead=head.ACTORS.h_headLead;
  assert.equal(lead.sourceMotor,'h_motor30');
  const port=head.ACTORS.h_motor30.servoPorts[lead.sourcePort];
  close(s.h_headLead.points[0],s.h_motor30.position.map((v,i)=>v+port.position[i]+port.normal[i]*1.65));
  close(s.h_headLead.points.at(-1),[-22,117,55]);
});
