import { CATALOG } from '../full-catalog.mjs';
import { ACTORS as LEG_ACTORS } from '../assembly-state.mjs';

// All catalog coordinates are already in the shared Y+2 world frame.
// Primitive anchors and cable routes are teaching illustrations, not measured fits.
const PI = Math.PI;
const add = (a, b) => a.map((v, i) => v + b[i]);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = n => Number.isNaN(Number(n)) ? 0 : Math.min(1, Math.max(0, Number(n)));
const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const phase = (p, start = 0, end = 1) => smooth((p - start) / (end - start));
function removalPath(origin, tray, t) {
  const clear = add(origin, [0, 0, -24]);
  const below = [tray[0], tray[1], clear[2]];
  if (t < .3) return mix(origin, clear, smooth(t / .3));
  if (t < .78) return mix(clear, below, smooth((t - .3) / .48));
  return mix(below, tray, smooth((t - .78) / .22));
}
const stateInput = (index, progress) => ({
  index: Number.isNaN(Number(index)) ? 0 : Math.min(STEPS.length - 1, Math.max(0, Math.trunc(Number(index)))),
  p: clamp(progress),
});

export const CHAPTERS = [
  {id: 'torso-base', name: '身体与髋支撑', start: 0, end: 8, sourceStart: 496, sourceEnd: 624},
  {id: 'torso-legs', name: '髋电机与接腿', start: 9, end: 17, sourceStart: 624, sourceEnd: 768},
];

export const STEPS = [];
function step(id, chapter, short, title, sourceStart, sourceEnd, parts, text, check, caption, extra = {}) {
  const target = chapter === 'torso-base' ? [0, 110, 18] : [0, 72, 14];
  STEPS.push({id, chapter, short, title, sourceStart, sourceEnd, parts, text, check, caption,
    duration: 2.7, camera: add(target, [190, 125, 250]), target, ...extra});
}

step('t-pair', 'torso-base', '排列双舵机', '排列已编号的 ID20 与 ID10', 496, 500,
  ['t_motor20', 't_motor10'],"按原片桌面视角排列已居中的 ID20、ID10。两只副舵盘可选拆，本教程保留。","主舵盘始终保留。桌面左右不直接等于机器人左右，装支撑前核对插座开口。", '画面左 20 · 画面右 10', {duration: 1.8});
step('t-support', 'torso-base', '固定髋支撑', '用六颗螺丝固定双圆孔髋支撑', 500, 518,
  ['t_support', 't_supportScrew0'],
  '把 P6-09 双圆孔髋支撑放到两只舵机上，对齐后固定六颗 M2×6 沉头自攻螺丝。',"先核对主副盘侧及插座朝向；下面中间两孔按原片留空，不加螺丝。", 'M2×6 ×6 · 下面中间两孔留空', {duration: 3.4});
step('t-wire', 'torso-base', '插接穿线', '插合髋部可见线束并穿出', 518, 558,
  ['t_baseWire', 't_baseWireL', 't_rollWireR', 't_rollWireL'],
  '按原片压紧两只身体舵机上的可见插头，分别留出后续髋电机连接线和主板预留线。预留线从开口引出。',"以插座开口识别副盘侧，不以线弯判断。路径、插座身份与针脚仍待核，不把两只身体舵机擅自互接。", '先轴向插紧 · 再穿线 · 接线示意', {duration: 4.8});
step('t-backplate-front', 'torso-base', '装身体背板', '贴合身体背板并固定正面两颗螺丝', 558, 568,
  ['t_backplate', 't_backFrontScrew0'],
  '把 P4-03 身体背板与髋部组件对齐，先固定原片正面可见的两颗 M2×6。',
  '背板与线束先贴合再拧紧，不把线封进接缝。孔位仍为教学示意。', '正面 M2×6 ×2');
step('t-backplate-back', 'torso-base', '固定背面', '固定背板背面的两颗螺丝', 568, 576,
  ['t_backplate', 't_backRearScrew0'],
  '继续处理背面，固定另外两颗 M2×6。背板正面两颗与背面两颗分开演示。',
  '本步新增两颗，不把上一组重复计数。', '背面 M2×6 ×2');
step('t-yaw-r', 'torso-base', '装右连接件', '先压轴承，再装右 Yaw–Roll 连接件', 576, 594,
  ['t_yawBearingR', 't_yawR', 't_yawScrewR0'],
  '先把大轴承压入独立的 P6-06 连接件，再把带轴承的连接件整体对准身体右侧。最后演示固定孔组。',"对照右侧主副盘和插座方向，再装带轴承的连接件。原片四颗 M2×6 的逐侧分配与孔位仍待核。",
  '先压大轴承 → 整体对位 · 孔组示意', {duration: 3.7});
step('t-yaw-l', 'torso-base', '装左连接件', '按镜像方向安装左侧轴承与连接件', 594, 608,
  ['t_yawBearingL', 't_yawL', 't_yawScrewL0'],
  '在 P6-07 独立连接件中先压入另一只大轴承，再把这一组件移到身体左侧固定。',"按左侧镜像核对主副盘和插座方向，不能照搬右侧。逐侧螺丝数量与精确孔位待核。",
  '镜像方向 · 先压轴承再装连接件', {duration: 3.7});
step('t-roll-pair', 'torso-base', '取髋部舵机', '取出 ID21 与 ID11 两只髋部舵机', 608, 612,
  ['t_motor21', 't_motor11'],
  '原片桌面视角为左 ID21、右 ID11。两只舵机先放在独立准备位，此时还没有装进身体。',"核对 ID11、ID21 及主副盘侧，准备拆下插座开口同侧的副舵盘。", '画面左 21 · 画面右 11', {duration: 1.7});
step('t-roll-horns', 'torso-base',"卸副舵盘","拆下 ID11 / ID21 副舵盘", 612, 624,
  ['t_motor11HornScrew', 't_motor11Horn', 't_motor21HornScrew', 't_motor21Horn'],"认准两只舵机插座开口同侧，先卸副舵盘中央螺丝，再取下副盘并保留。","主舵盘与输出轴不拆。中央原装螺丝不归为 M2×6 自攻。","先卸副盘螺丝 → 再取副舵盘", {duration: 3.2});

step('t-motor-r', 'torso-legs', '装右髋电机', '接线后安装右侧 ID11 髋部舵机', 624, 662,
  ['t_rollWireR', 'r_legWireB', 't_motor11', 't_motorScrewR0'],
  '按原片先接身体预留线，再接完整右腿上已有线的自由端。两次插接完成后才把 ID11 放入右侧连接件，最后固定两颗 M2×6。',"先核对右侧 ID11 主副盘及插座朝向，线束不夹入支撑。精确配合仍待实物核对。", '先接线 → 对位 · M2×6 ×2', {duration: 3.4});
step('t-cover-r', 'torso-legs', '装右盖板', '用四颗螺丝固定右 Roll 舵机盖板', 662, 678,
  ['t_coverR', 't_coverScrewR0'],
  '把 P6-02 盖板贴合右侧髋部，确认线束不夹在盖板内，再固定四颗 M2×6。',
  '盖板固定后，先给独立完整腿的上端连接件压轴承；现在还没有接入整条腿。', '对齐盖板 · M2×6 ×4', {duration: 3.2});
step('t-bearing-r', 'torso-legs', '压右大轴承', '接腿前先压入右侧接口大轴承', 678, 684,
  ['t_legBearingR', 'r_topLink'],
  '按 11:18 后的画面，将新的 16×22×4 mm 大轴承沿轴向压入独立右腿的上端连接件，再准备接入身体。',
  '这不是腿模块中已经安装的上端轴承。此步只压新轴承，右腿仍停在准备位；同轴配合为示意。', '先压大轴承 · 完整腿暂不移动');
step('t-join-r', 'torso-legs', '接入右腿', '将完整右腿子组件接入身体', 684, 694,
  ['r_topLink', 'r_topBearing', 't_legBearingR', 't_legScrewR0'],
  '把已装好的右腿作为一个整体移到身体连接位置，对齐后固定四颗 M2×6。腿上的螺丝、轴承和线束一起移动。',"核对右腿主副盘、插座开口与身体接口方向，再固定完整子组件。实物配合仍待核。", '完整右腿整体接入 · M2×6 ×4', {duration: 3.7});
step('t-motor-l', 'torso-legs', '装左髋电机', '接线后安装另一侧 ID21 髋部舵机', 694, 734,
  ['t_rollWireL', 'l_legWireB', 't_motor21', 't_motorScrewL0'],
  '按镜像方向先接身体预留线，再接完整左腿已有线的自由端。两次插接完成后才将 ID21 装入连接件，固定两颗 M2×6。',"按左侧镜像核对 ID21 主副盘及插座朝向，不照搬右侧。线束不夹入支撑。", '先接线 → 对位 · M2×6 ×2', {duration: 3.4});
step('t-cover-l', 'torso-legs', '装左盖板', '固定另一侧 Roll 舵机盖板', 734, 748,
  ['t_coverL', 't_coverScrewL0'],
  '把 P6-03 盖板贴合左侧髋部，检查线束避开接缝，再固定四颗 M2×6。',
  '左腿仍在独立准备位，下一步先给它的上端连接件安装新轴承。', '对齐盖板 · M2×6 ×4', {duration: 3.2});
step('t-bearing-l', 'torso-legs', '压左大轴承', '第二条腿接入前先压大轴承', 748, 754,
  ['t_legBearingL', 'l_topLink'],
  '按 12:28 后的画面，将另一只新的大轴承压到独立左腿的上端连接件中，再进行第二条完整腿的对接。',
  '右腿已经安装；左腿还不移动。轴承姿态与接触面使用现有模型示意。', '先压大轴承 · 左腿仍在准备位');
step('t-join-l', 'torso-legs', '接入左腿', '接入第二条完整腿并固定', 754, 764,
  ['l_topLink', 'l_topBearing', 't_legBearingL', 't_legScrewL0'],
  '把左腿子组件整体移到身体连接位置，核对方向后固定四颗 M2×6。',"按左腿镜像核对主副盘与插座开口，再固定子组件，不能用零位校准补救装反。", '完整左腿整体接入 · M2×6 ×4', {duration: 3.7});
step('t-complete', 'torso-legs', '检查双腿', '检查身体与双腿的连接状态', 764, 768,
  ['t_support', 't_backplate', 'r_topLink', 'l_topLink'],
  '身体、髋部舵机与两条腿已经在原型中连接。旋转查看两侧朝向、盖板和线束预留。',
  '这里只验证动画状态。孔位、公差、线端与实物承重仍未验收，下一阶段继续头颈与总装。', '',
  {duration: 1.5, complete: true, target: [0, 76, 12], camera: [235, 211, 292]});

const at = id => STEPS.findIndex(s => s.id === id);
const rightJoin = at('t-join-r'), leftJoin = at('t-join-l');
const motorSetup = at('t-roll-pair'), hornRemoval = at('t-roll-horns');

export const ACTORS = {};
export const SERVO_PORTS = Object.fromEntries([10, 20, 11, 21].map(number => {
  const yaw = number === 10 || number === 20;
  return [`t_motor${number}`, [-1, 1].map((sign, i) => ({
    id: i ? 'bus-b' : 'bus-a', position: [sign * 11.3, yaw ? 7 : -3, yaw ? -3 : -7], normal: [sign, 0, 0],
    tangent: yaw ? [0, 0, 1] : [0, 1, 0],
    evidence: 'source-face-cue; illustrative-socket; pinout-unverified',
  }))];
}));
export const BOARD_LEADS = {
  right: {actorId: 't_baseWire', motorId: 't_motor10', portIndex: 0, freeEnd: [-12, 137, -37]},
  left: {actorId: 't_baseWireL', motorId: 't_motor20', portIndex: 1, freeEnd: [12, 137, -37]},
};
function dock(actorId, portIndex, position = ACTORS[actorId].end) {
  const port = SERVO_PORTS[actorId][portIndex];
  return add(add(position, port.position), port.normal.map(v => v * 1.65));
}
function cableRoute(motorId, portIndex, freeEnd, sign, board = false) {
  const first = dock(motorId, portIndex), normal = SERVO_PORTS[motorId][portIndex].normal;
  return board
    ? [first, add(first, normal.map(v => v * 10)), [sign * 40, 124, 25], [sign * 2, 112, 13],
      [sign * 2, 102, 13], [sign * 35, 105, -28], [sign * 35, 137, -37], [...freeEnd]]
    : [first, add(first, normal.map(v => v * 10)), [sign * 2, 115, 13], [sign * 2, 103, 13],
      [sign * 40, 96, 52], [...freeEnd]];
}
function connectionPoint(free, target, normal, progress) {
  const t = clamp(progress), approach = add(target, normal.map(v => v * 16));
  return t < .64 ? mix(free, approach, smooth(t / .64)) : mix(approach, target, smooth((t - .64) / .36));
}
function actor(id, kind, stepId, end, extra = {}) {
  ACTORS[id] = {kind, label: id, source: '教学简模 · 孔位/配合待核验', step: at(stepId), end: [...end],
    start: add(end, extra.approach || [0, 0, 24]), ...extra};
  return ACTORS[id];
}
function mesh(id, sourceId, stepId, extra = {}) {
  const c = CATALOG[sourceId];
  return actor(id, 'mesh', stepId, c.end, {sourceId, size: [...c.size], color: c.color,
    label: `${c.sourceName} · ${sourceId}`, source: '真实源网格 · 视频对应候选，孔位/配合待核验', ...extra});
}
function screws(prefix, stepId, positions, extra = {}) {
  const window = extra.phase || [.62, 1];
  positions.forEach((position, i) => actor(`${prefix}${i}`, 'screw', stepId, position,
    {label: `固定螺丝 ${i + 1} · M2×6`, fastener: 'M2x6',
      source: '教学螺丝 · 锚点来自源网格圆孔/沉孔底，配合公差待核验',
      orientationZ: 0, spinAxis: [0, 1, 0], ...extra,
      phase: [window[0] + i * (window[1] - window[0]) / (positions.length + 1), window[1]]}));
}

// Source geometry.bin circular face boundaries, fitted by output/fullrobot-audit/torso/extract-holes.py.
// The head origin is 0.35mm outside the selected face/counterbore floor. This is a visual seat allowance.
const MOUNTS = {
  support: [[25.48787,106.14812,-2.4784],[-25.58264,106.15477,27.4014],[-9.5827,106.15401,27.43908],[-25.51199,106.15057,-2.59852],[25.4172,106.15231,27.52152],[9.41726,106.15308,27.48383]],
  backFront: [[9.52161,103.79015,-2.49397],[-9.4783,103.84589,-2.51006]],
  backRear: [[9.60669,133.49001,-2.50201],[-9.39322,133.54576,-2.5181]],
  yawR: [[-23.48493,101.14986,20.02121],[-17.49495,101.16053,14.01121],[-11.48495,101.15963,20.00119],[-17.47493,101.14895,26.01119]],
  yawL: [[11.51509,101.1527,20.02138],[17.50684,101.15677,14.01315],[23.51507,101.14636,20.0049],[17.52332,101.14232,26.01312]],
  motorR: [[-9.5059,97.52517,5.14402],[-25.50587,97.51215,5.17071]],
  motorL: [[25.49304,97.51275,5.14735],[9.49304,97.52122,5.16933]],
  coverR: [[-25.50669,102.47435,33.06452],[-9.50674,102.46022,33.04204],[-9.53749,67.46031,33.06692],[-25.53745,67.4744,33.0894]],
  coverL: [[9.53454,102.50912,33.05814],[25.53465,102.47192,33.03549],[25.45319,67.47204,33.05867],[9.45321,67.50925,33.08133]],
  legR: [[-17.50455,96.01073,37.83912],[-17.49649,84.01073,37.84623],[-11.5005,90.01474,37.84225],[-23.5005,90.0067,37.8431]],
  legL: [[17.49865,83.97286,37.84675],[17.4818,95.97286,37.85071],[11.49024,89.96444,37.84492],[23.49023,89.98127,37.85255]],
};

for (const [number, sourceId, sign] of [[10, 'trunk_base_0', -1], [20, 'trunk_base_4', 1]]) {
  mesh(`t_motor${number}`, sourceId, 't-pair', {label: `髋部 Yaw 舵机 · ID${number}`, approach: [sign * 25, 8, 20], servoPorts: SERVO_PORTS[`t_motor${number}`]});
  const axis = [sign * 17.5, 104.5, 20];
  actor(`t_motor${number}Horn`, 'horn', 't-pair', axis,
    {label: `ID${number} 主舵盘（保留）`, carriedBy: `t_motor${number}`, rotation: [0, 0, PI / 2]});
  actor(`t_motor${number}HornScrew`, 'screw', 't-pair', add(axis, [0, -1.5, 0]),
    {label: `ID${number} 主舵盘中央原装螺丝`, fastener: null, source: '原装中央螺丝教学简模 · 规格待核验',
      carriedBy: `t_motor${number}`, orientationZ: PI, spinAxis: [0, 1, 0]});
}
mesh('t_support', 'P6-09', 't-support', {approach: [0, -28, 0], phase: [0, .52]});
// Reserve the two inner holes at Z≈-2.5: the backplate's lower ears use these later.
screws('t_supportScrew', 't-support', MOUNTS.support,
  {carriedBy: 't_support', approach: [0, -22, 0], orientationZ: PI, spinAxis: [0, 1, 0]});
for (const [side, entry] of [['right', [0, .18]], ['left', [.44, .62]]]) {
  const lead = BOARD_LEADS[side], sign = side === 'right' ? -1 : 1;
  actor(lead.actorId, 'cable', 't-wire', [0, 0, 0],
    {label: `${side === 'right' ? '右' : '左'}身体主板预留线 · 自由端示意`,
      source: '原片可见预留线教学示意 · 针脚、板侧分支和完整ID拓扑未核验',
      cableType: 'servo', routeType: 'board', motor: lead.motorId, portIndex: lead.portIndex,
      freeEnd: [...lead.freeEnd], entry, points: cableRoute(lead.motorId, lead.portIndex, lead.freeEnd, sign, true)});
}
mesh('t_backplate', 'P4-03', 't-backplate-front', {approach: [0, 0, -32], phase: [0, .56]});
screws('t_backFrontScrew', 't-backplate-front', MOUNTS.backFront,
  {carriedBy: 't_backplate', approach: [0, -22, 0], orientationZ: PI, spinAxis: [0, 1, 0]});
screws('t_backRearScrew', 't-backplate-back', MOUNTS.backRear,
  {carriedBy: 't_backplate', approach: [0, 22, 0], orientationZ: 0, spinAxis: [0, 1, 0]});

for (const [side, sign, number, sourceId, yawSource, yawBearingSource, coverSource, legBearingSource] of [
  ['R', -1, 11, 'right_hip_yaw_3', 'P6-06', 'trunk_base_3', 'P6-02', 'right_hip_yaw_0'],
  ['L', 1, 21, 'left_hip_yaw_1', 'P6-07', 'trunk_base_6', 'P6-03', 'left_hip_yaw_2'],
]) {
  const lower = side.toLowerCase(), yawStep = `t-yaw-${lower}`, motorStep = `t-motor-${lower}`;
  const group = `yaw-${side}`, name = side === 'R' ? '右' : '左';
  mesh(`t_yaw${side}`, yawSource, yawStep, {group, approach: [0, 0, 0]});
  mesh(`t_yawBearing${side}`, yawBearingSource, yawStep,
    {group, label: `${name} Yaw 连接件大轴承 · 16×22×4`, approach: [0, 28, 0], phase: [0, .28]});
  // The four-anchor drawing is illustrative: 10:05 confirms a four-screw action,
  // but its combined/per-side allocation is not established by the footage.
  screws(`t_yawScrew${side}`, yawStep, MOUNTS[`yaw${side}`],
    {group, phase: [.74, 1], approach: [0, -22, 0], orientationZ: PI, spinAxis: [0, 1, 0],
      label: `${name}连接件固定螺丝示意 · M2×6 · 逐侧数量待核验`, source: '教学简模 · 视频四颗字幕，逐侧数量及孔位待核验'});
  mesh(`t_motor${number}`, sourceId, 't-roll-pair',
    {label: `${name}髋部 Roll 舵机 · ID${number}`, prepareOffset: [sign * 80, 25, 45],
      installStep: at(motorStep), installPhase: [.5, .76], servoPorts: SERVO_PORTS[`t_motor${number}`],
      approach: [sign * 24, 12, 15], phase: [.5, .76]});
  const horn = add(CATALOG[sourceId].end, [0, 7.5, -16.5]);
  actor(`t_motor${number}Horn`, 'horn', 't-roll-pair', horn,
    {label: `ID${number} 副舵盘`, carriedBy: `t_motor${number}`, removeStep: hornRemoval,
      tray: [sign * 104, 3.5, 100], rotation: [0, PI / 2, 0]});
  actor(`t_motor${number}HornScrew`, 'screw', 't-roll-pair', add(horn, [0, 0, -2]),
    {label: `ID${number} 原装中央固定螺丝`, fastener: null,
      source: '原装中央螺丝教学简模 · 规格待核验', carriedBy: `t_motor${number}`, removeStep: hornRemoval,
      tray: [sign * 92, 2.5, 100], orientationZ: 0, rotation: [-PI / 2, 0, 0], spinAxis: [0, 0, 1]});
  const bodyMotor = side === 'R' ? 't_motor10' : 't_motor20', bodyPort = side === 'R' ? 1 : 0;
  const freeEnd = [sign * 38, 94, 52];
  actor(`t_rollWire${side}`, 'cable', 't-wire', [0, 0, 0],
    {label: `${name}身体到髋电机预留线 · 路径/端点示意`, source: '线束教学示意 · 接口身份、极性和总线拓扑未核验',
      cableType: 'servo', routeType: 'roll', motor: bodyMotor, portIndex: bodyPort,
      destination: `t_motor${number}`, destinationPort: bodyPort, connectStep: at(motorStep),
      entry: side === 'R' ? [.22, .4] : [.66, .84], freeEnd,
      points: cableRoute(bodyMotor, bodyPort, freeEnd, sign)});
  screws(`t_motorScrew${side}`, motorStep, MOUNTS[`motor${side}`],
    {carriedBy: `t_motor${number}`, phase: [.8, 1], approach: [0, 0, -24],
      orientationZ: 0, rotation: [-PI / 2, 0, 0], spinAxis: [0, 0, 1]});
  mesh(`t_cover${side}`, coverSource, `t-cover-${lower}`, {approach: [0, 0, 28], phase: [0, .58]});
  screws(`t_coverScrew${side}`, `t-cover-${lower}`, MOUNTS[`cover${side}`],
    {carriedBy: `t_cover${side}`, approach: [0, 0, 22], rotation: [PI / 2, 0, 0], spinAxis: [0, 0, 1]});
  mesh(`t_legBearing${side}`, legBearingSource, `t-bearing-${lower}`,
    {label: `${name}接腿接口大轴承 · 16×22×4`, legSide: side === 'R' ? 'right' : 'left', approach: [0, 0, 28]});
  screws(`t_legScrew${side}`, `t-join-${lower}`, MOUNTS[`leg${side}`],
    {legSide: side === 'R' ? 'right' : 'left', phase: [.82, 1], approach: [0, 0, 22], rotation: [PI / 2, 0, 0], spinAxis: [0, 0, 1]});
}

function yawOffset(group, index, p) {
  const right = group === 'yaw-R', entry = at(right ? 't-yaw-r' : 't-yaw-l');
  const offset = [right ? -45 : 45, 32, 48];
  if (index < entry) return offset;
  return index === entry ? offset.map(v => v * (1 - phase(p, .34, .72))) : [0, 0, 0];
}

export function legOffsets(localIndex, progress = 1) {
  const {index, p} = stateInput(localIndex, progress);
  const offset = (join, start) => {
    const t = index < join ? 0 : index === join ? phase(p, .2, .8) : 1;
    return start.map(v => v === 0 || t === 1 ? 0 : v * (1 - t));
  };
  return {right: offset(rightJoin, [-95, 0, 65]), left: offset(leftJoin, [95, 0, 65])};
}

export function snapshot(localIndex, progress = 1) {
  const {index, p} = stateInput(localIndex, progress), result = {};
  const legs = legOffsets(index, p);
  for (const [id, a] of Object.entries(ACTORS)) {
    const visible = index >= a.step;
    let position = [...a.end], turn = 0, opacity = visible ? 1 : 0;
    let status = visible ? 'installed' : 'waiting';
    if (index === a.step) {
      const t = phase(p, ...(a.phase || [0, 1]));
      position = mix(a.start, a.end, t);
      turn = a.kind === 'screw' ? 5 * t : 0;
      status = p === 1 ? 'installed' : 'moving';
      if (a.kind === 'screw') opacity = clamp(p * 5);
    }
    if (a.prepareOffset && visible) {
      if (index === motorSetup) {
        position = add(mix(a.start, a.end, smooth(p)), a.prepareOffset);
        status = p === 1 ? 'prepared' : 'moving';
      } else if (index < a.installStep) {
        position = add(a.end, a.prepareOffset); status = 'prepared';
      } else if (index === a.installStep) {
        position = add(a.end, a.prepareOffset.map(v => v * (1 - phase(p, ...a.installPhase))));
        status = p === 1 ? 'installed' : 'moving';
      }
    }
    if (a.carriedBy) {
      const parent = result[a.carriedBy];
      if (visible) position = add(position, parent.position.map((v, i) => v - ACTORS[a.carriedBy].end[i]));
      if (a.kind === 'horn' || a.fastener === null) {
        if (visible) position = add(a.end, parent.position.map((v, i) => v - ACTORS[a.carriedBy].end[i]));
        turn = 0;
        if (visible && parent.status === 'prepared') status = 'prepared';
      }
    }
    if (a.removeStep !== undefined && index >= a.removeStep) {
      // Start at the bench motor pose; later motor installation must not carry removed parts.
      const origin = add(a.end, ACTORS[a.carriedBy].prepareOffset);
      const t = index === a.removeStep ? a.kind === 'screw' ? phase(p, 0, .42) : phase(p, .42, .9) : 1;
      position = removalPath(origin, a.tray, t);
      turn = a.kind === 'screw' ? -6 * t : 0;
      opacity = 1;
      status = t === 1 ? 'removed' : t === 0 ? 'prepared' : 'moving';
    }
    if (a.group && visible) {
      position = add(position, yawOffset(a.group, index, p));
      if (index === a.step && p < 1) status = 'moving';
    }
    if (a.legSide && visible) position = add(position, legs[a.legSide]);
    let shown = visible;
    if (a.kind === 'screw' && a.fastener && index === a.step) {
      const begin = a.phase[0];
      if (p <= begin) {shown = false; opacity = 0; status = 'waiting';}
      else opacity = clamp((p - begin) / .035);
    }
    const pose = {visible: shown, position, turn, status, opacity};
    if (a.rotation) pose.rotation = [...a.rotation];
    if (a.kind === 'cable') {
      pose.position = [0, 0, 0];
      pose.points = a.points.map(v => [...v]);
      const normal = SERVO_PORTS[a.motor][a.portIndex].normal, source = dock(a.motor, a.portIndex, result[a.motor].position);
      const sourceEntry = index === a.step ? phase(p, ...a.entry) : index > a.step ? 1 : 0;
      pose.points[0] = add(source, normal.map(v => v * 18 * (1 - sourceEntry)));
      pose.points[1] = add(pose.points[0], normal.map(v => v * 10));
      if (index === a.step && p < a.entry[0]) {pose.visible = false; pose.opacity = 0; pose.status = 'waiting';}
      if (a.routeType === 'roll' && visible) {
        const q = index < a.connectStep ? 0 : index === a.connectStep ? clamp(p / .2) : 1;
        if (index < a.connectStep) pose.status = 'prepared';
        else if (index === a.connectStep && p < 1) pose.status = 'moving';
        const targetPort = SERVO_PORTS[a.destination][a.destinationPort], target = dock(a.destination, a.destinationPort, result[a.destination].position);
        const endpoint = connectionPoint(a.freeEnd, target, targetPort.normal, q);
        pose.points[pose.points.length - 1] = endpoint;
        pose.points[pose.points.length - 2] = mix(a.points.at(-2), add(endpoint, targetPort.normal.map(v => v * 10)), smooth(clamp(q / .64)));
      }
    }
    result[id] = pose;
  }
  return result;
}

export function legLeadOverrides(localIndex, progress = 1) {
  const {index, p} = stateInput(localIndex, progress), state = snapshot(index, p), offsets = legOffsets(index, p), result = {};
  for (const [side, motor, portIndex] of [['right', 't_motor11', 0], ['left', 't_motor21', 1]]) {
    const entry = at(side === 'right' ? 't-motor-r' : 't-motor-l');
    if (index < entry) continue;
    const id = side === 'right' ? 'r_legWireB' : 'l_legWireB', base = LEG_ACTORS[id].points.map(v => add(v, offsets[side]));
    const q = index > entry ? 1 : clamp((p - .22) / .26), port = SERVO_PORTS[motor][portIndex];
    const endpoint = connectionPoint(base.at(-1), dock(motor, portIndex, state[motor].position), port.normal, q);
    const points = base.map(v => [...v]);
    points[points.length - 1] = endpoint;
    points[points.length - 2] = mix(base.at(-2), add(endpoint, port.normal.map(v => v * 10)), smooth(clamp(q / .64)));
    result[id] = {position: [0, 0, 0], points};
  }
  return result;
}

export function legsLeadTarget(side, localIndex, progress = 1) {
  const key = side === 'right' || side === 'r' ? 'right' : 'left', id = key === 'right' ? 'r_legWireB' : 'l_legWireB';
  const override = legLeadOverrides(localIndex, progress)[id];
  return override ? [...override.points.at(-1)] : add(LEG_ACTORS[id].points.at(-1), legOffsets(localIndex, progress)[key]);
}

export function boardLeadFreeEnds(localIndex, progress = 1) {
  const state = snapshot(localIndex, progress);
  return Object.fromEntries(Object.entries(BOARD_LEADS).map(([side, lead]) => [side, [...state[lead.actorId].points.at(-1)]]));
}
