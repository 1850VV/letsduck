import { CATALOG } from '../full-catalog.mjs';

// Video 18:22–20:58. Added hardware positions, wiring and board dimensions are
// teaching geometry, not a mechanical drawing or a verified electrical pinout.
export const CHAPTERS = [
  { id: 'final-body', name: '身体与头颈总装', start: 0, end: 3, sourceStart: 1102, sourceEnd: 1170 },
  { id: 'final-electronics', name: '电控与外壳收尾', start: 4, end: 10, sourceStart: 1170, sourceEnd: 1258 },
];

const add = (a, b) => a.map((v, i) => v + b[i]);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const phase = (p, start = 0, end = 1) => smooth((p - start) / (end - start));
const TRAY_PREP = [-110, -40, 75];
const BOARD_PREP = [-105, 15, -60];
const HEAD_PREP = [120, -95, 65];
const BOARD_ROTATION = [-Math.PI / 2, 0, 0];

export const STEPS = [];
function step(id, chapter, short, title, sourceStart, sourceEnd, parts, text, check, caption, target, camera, duration = 3) {
  STEPS.push({ id: `final-${id}`, chapter, short, title, sourceStart, sourceEnd, parts, text, check, caption, target, camera, duration });
}
const BODY = 'final-body', ELECTRONICS = 'final-electronics';
step('battery', BODY, '电池入仓', '放入电池，并把电源线穿出', 1102, 1112,
  ['f_batteryTray', 'f_battery', 'f_powerCable', 'f_powerPlug'],
  '在独立电池仓中放入电池，把红黑电源线和接头从开口引出，再将电池仓装到身体。',
  '电池大小沿用原模型概念形体，实物尺寸、接头键位和极性尚未核验。线色不代表已验证针脚。',
  '先入仓 · 电源线从开口引出', [-90, 80, 35], [-240, 205, 250]);
step('tray', BODY, '安装电池仓', '把装有电池的电池仓固定到身体', 1112, 1126,
  ['f_batteryTray', 'f_battery', 'f_trayScrew0', 'f_trayScrew1', 'f_trayScrew2', 'f_trayScrew3', 't_backplate'],
  '将电池和电池仓作为一个组件对齐身体背部，按视频用 4 颗 M2×6 沉头平尾自攻螺丝固定。',
  '先对齐再固定，保持电源线引出；螺丝位置和配合是教学示意，须逐孔核对实物。',
  '组件整体就位 · M2×6 ×4', [0, 108, -18], [180, 190, -280], 3.5);
step('body-shells', BODY, '安装身体壳', '安装两侧身体外壳，并保留上部线路', 1126, 1150,
  ['f_sideR', 'f_sideL', 'f_bodyScrew0', 'f_bodyScrew1', 'f_bodyScrew2', 'f_bodyScrew3', 'f_bodyScrew4', 't_support'],
  '将两片身体壳对齐安装，保留上部线束出口。19:05 左右字幕标出 5 颗 M2×6；本步只按这组总数示意。',
  '5 颗的逐侧、逐孔分配尚未核验。图中使用源网格已有圆孔作教学候选，其中上下孔与接缝孔的真实步骤归属仍待核；不据此给出每侧 5 颗的结论。',
  'M2×6 ×5 · 源孔候选，分配待核', [0, 125, 12], [-205, 205, 235], 3.6);
step('head-join', BODY, '连接整个头颈', '把已装好的整个头颈总成接到身体', 1150, 1170,
  ['h_neckA', 'h_neckB', 'h_shell', 't_support', 'f_neckScrewR0', 'f_neckScrewL0'],
  '整体移动已完成的头部、颈部、螺丝与线束，先让下端舵机连接部位就位，再按视频两侧各标示的 4 颗 M2×6 固定。',
  '头颈必须整体移动，不能只移动头盖。两侧各 4 颗在本原型合计演示 8 颗；真实孔位、安装轴向和版本仍待核验。',
  '头颈整体就位 · 两侧各 M2×6 ×4', [0, 125, 25], [355, 295, 460], 4);
step('board-mate', ELECTRONICS, '插合两块板', '对准排针，将 UNO Q 与陆吾扩展板插合', 1170, 1190,
  ['f_uno', 'f_extension'],
  '分别拿取 UNO Q 与陆吾扩展板，让扩展板排针对准 UNO Q 排母，再沿插合方向按压到位。两块板始终是独立对象。',
  '板形、排针、USB-C 与接口为教学简模。两板精确尺寸、间距和当前板卡修订尚未测量，不能用此判断针脚或安装公差。',
  '独立两板 · 排针对准排母', [-65, 118, -70], [-230, 210, -310], 3.5);
step('board-mount', ELECTRONICS, '固定控制器', '把插合后的两板组件固定到身体', 1190, 1202,
  ['f_uno', 'f_extension', 'f_boardScrew0', 'f_boardScrew1', 'f_boardScrew2', 'f_boardScrew3', 't_backplate'],
  '保持两块板的插合关系，将整组控制器对齐身体背部，再用视频标示的 4 颗 M3×16 圆头机丝固定。',
  'M3×16 是机丝，不能与前面的 M2 自攻螺丝混用。固定孔、支撑和板间净空仍须对照实物核验。',
  '控制器整体就位 · M3×16 ×4', [0, 105, -35], [195, 190, -290], 3.6);
step('power', ELECTRONICS, '连接电池线', '将留出的电池接头插到控制板电池口', 1202, 1210,
  ['f_powerCable', 'f_powerPlug', 'f_extension'],
  '将电池仓引出的接头移到扩展板电池接口，对准连接器键位后按压到位。此处演示动作和路径。',
  '精确极性、引脚编号、接头键位及视频板卡修订尚未核验；图中红黑双线不构成接线依据。',
  '对准电池口 · 极性与键位待核验', [0, 130, -40], [120, 195, -220]);
step('buses', ELECTRONICS, '逐根插总线', '把三根舵机主总线逐根插到扩展板', 1210, 1230,
  ['f_bus0', 'f_busPlug0', 'f_bus1', 'f_busPlug1', 'f_bus2', 'f_busPlug2', 'f_extension'],
  '依次对准并压紧三只三针插头。视频确认有三根主板端连线；本步将三次插接分别演示。',
  '三根线的分支 ID 拓扑、实际端点和针脚未追清。扩展板存在接口修订差异，不能按模型外观认定 GND、SIGNAL 或供电针位。',
  '三次独立插接 · 端点与针脚待核验', [0, 130, -40], [130, 205, -225], 4.5);
step('thigh-first', ELECTRONICS, '第一侧大腿壳', '安装第一侧大腿外壳', 1230, 1242,
  ['f_thighR', 'f_thighScrewR0', 'f_thighScrewR1'],
  '安装第一侧大腿外壳，字幕标示用 2 颗 M2.3×4 平头自攻固定。原型先演示机器人右侧，视频左右映射待核验。',
  '20:37 字幕 M2.3×4 与官方 BOM 的 M2.3×8 有差异；保留原片规格，不直接替换或用于采购。孔位待核验。',
  '视频 M2.3×4 ×2 · 与 BOM 有差异', [-55, 83, 0], [-240, 150, 225], 3.5);
step('route', ELECTRONICS, '整理线束', '整理线束，给另一侧外壳和关节留出空间', 1242, 1250,
  ['f_bus0', 'f_bus1', 'f_bus2', 'f_powerCable', 'f_thighR'],
  '整理可见的线束环线，让线束避开外壳压合处和关节活动区域，保留适当余量后再安装另一侧外壳。',
  '走线是可视化示意，未验证实体弯曲半径、线长和运动净空；此步骤不拔出已接好的主板端插头。',
  '保持接头连接 · 整理余量', [10, 105, -5], [220, 190, -230]);
step('thigh-second', ELECTRONICS, '另一侧大腿壳', '安装另一侧大腿外壳，完成本段总装', 1250, 1258,
  ['f_thighL', 'f_thighScrewL0', 'f_thighScrewL1', 'f_uno', 'f_extension'],
  '按镜像方向安装另一侧大腿壳。20:57 字幕同样标 2 颗 M2.3×4，保留原片与 BOM 的规格差异。',
  '本段到 20:58 总装收尾为止。控制、编号与校准由后续章节说明，本模块没有验证上电或机械精度。',
  '另一侧 M2.3×4 ×2 · 总装收尾', [0, 125, 25], [235, 220, 295], 3.5);
STEPS.at(-1).complete = true;

export const ACTORS = {};
function mesh(id, sourceId, at, approach) {
  const item = CATALOG[sourceId];
  ACTORS[id] = { kind: 'mesh', sourceId, label: `${item.sourceName} · ${sourceId}`, source: '真实源网格 · 安装孔与配合待核验', end: [...item.end], size: [...item.size], color: item.color, start: add(item.end, approach), step: at };
}
mesh('f_batteryTray', 'P5-03', 0, TRAY_PREP);
mesh('f_sideR', 'P5-06', 2, [-60, 8, 22]);
mesh('f_sideL', 'P5-07', 2, [60, 8, 22]);
mesh('f_thighR', 'P5-01', 8, [-62, 0, 0]);
mesh('f_thighL', 'P5-02', 10, [62, 0, 0]);
const battery = CATALOG.trunk_base_8;
ACTORS.f_battery = {
  kind: 'battery', label: '电池组 · 实物尺寸待核验', source: '沿用 trunk_base_8 概念外廓 · 非实物测量', sourceId: 'trunk_base_8',
  end: [...battery.end], start: add(battery.end, [-150, -10, 105]), size: [...battery.size], color: '#252a31', step: 0,
};

// Source-hole fits use world Y+2, exactly as CATALOG. They establish only the
// source mesh location and axis; current kit revision and hole usage remain open.
const hole = (center, normal, sourceId) => ({ center, normal, sourceId });
function screws(prefix, at, holes, fastener, delay = .6) {
  holes.forEach(({ center, normal, sourceId }, i) => {
    const length = Math.hypot(...normal), n = normal.map(v => v / length);
    // The countersunk teaching head top is local Y=.625; the M3 round head
    // underside is Y=-.4. Put the appropriate surface on the existing hole face.
    const end = add(center, n.map(v => v * (fastener === 'M3x16' ? .4 : -.625)));
    ACTORS[`${prefix}${i}`] = {
      kind: 'screw', label: `${fastener.replace('x', '×')} 固定螺丝 ${i + 1} · ${sourceId ? '源网格孔候选' : '板卡教学孔'}`,
      source: sourceId ? `${sourceId} 源 geometry.bin 圆孔拟合 · 实物与具体孔用途待核验` : '匹配板卡工厂教学孔 · 非实物测量',
      end, start: add(end, n.map(v => v * (fastener === 'M3x16' ? 32 : 28))), step: at,
      fastener, delay: delay + i * (1 - delay) / (holes.length + 1),
      orientationZ: 0,
      mountRotation: [Math.atan2(n[2], n[1]), 0, -Math.asin(n[0])],
      spinAxis: n.map(v => -v), sourceHoleCenter: [...center], sourceHoleNormal: [...n], holeSourceId: sourceId,
    };
  });
}
const trayNormal = [.001009835, .002457412, -.999996471];
screws('f_trayScrew', 1, [
  [-23.568677,81.625312,-11.971886], [23.535322,81.655765,-11.924244],
  [-23.590354,115.025204,-11.889830], [23.513645,115.055659,-11.842188],
].map(center => hole(center,trayNormal,'P5-03')), 'M2x6');
// Five candidates in actual source holes, not five per side. The video does not
// establish their exact allocation. In particular the two underside holes remain
// candidate uses, so the text does not assert these are the video's five holes.
screws('f_bodyScrew', 2, [
  hole([-25.593724,146.460852,-2.351885],[-.004374896,.999979794,.004612120],'P5-06'),
  hole([25.581799,146.516801,-2.320751],[.003367032,.999970593,.006890360],'P5-07'),
  hole([-25.633932,130.322330,27.573804],[.004375573,-.999979791,-.004612049],'P5-06'),
  hole([25.649794,130.310151,27.568042],[-.003367250,-.999970593,-.006890160],'P5-07'),
  hole([-.021469,143.524473,-18.334490],[.999983679,.004358459,.003694014],'P5-06'),
], 'M2x6');
const neckRNormal = [-.999983679,-.004358492,-.003693987];
const neckLNormal = [.999986079,-.003339232,-.004085497];
screws('f_neckScrewR', 3, [
  [-17.851478,145.793977,41.174232],[-17.798971,133.794219,41.118892],
  [-17.803182,139.821866,35.146667],[-17.847267,139.766330,47.146458],
].map(center => hole(center,neckRNormal,'P5-06')), 'M2x6');
screws('f_neckScrewL', 3, [
  [17.856940,145.742869,41.206683],[17.816532,133.743221,41.124000],
  [17.812362,139.784469,35.165534],[17.861110,139.701622,47.165149],
].map(center => hole(center,neckLNormal,'P5-07')), 'M2x6');
screws('f_boardScrew', 5, [[-22.65,69.7,-51.8],[22.65,69.7,-51.8],[-22.65,130.3,-51.8],[22.65,130.3,-51.8]].map(center => hole(center,[0,0,-1])), 'M3x16', .64);
screws('f_thighScrewR', 8, [[-70.707102,64.597164,-17.220284],[-72.028416,88.915577,16.969354]].map(center => hole(center,[-.996959794,-.076309614,.015748389],'P5-01')), 'M2.3x4');
screws('f_thighScrewL', 10, [[71.017546,64.119812,-16.580651],[71.889688,89.957777,16.490506]].map(center => hole(center,[.997669905,-.063984561,.023679866],'P5-02')), 'M2.3x4');

ACTORS.f_uno = {
  kind: 'board', boardType: 'uno-q', label: 'Arduino UNO Q · 独立教学板', color: '#17688b',
  source: '视频独立板对象 · 约 53.3×68.6 mm 概念外廓 · 孔位与元件位置待核验',
  size: [53.3, 1.6, 68.6], end: [0, 100, -39], step: 4,
  ports: [
    { label: 'UNO Q 扩展排母 A · 位置示意', position: [-24, 3, 0], kind: 'female-header' },
    { label: 'UNO Q 扩展排母 B · 位置示意', position: [24, 3, 0], kind: 'female-header' },
    { label: 'UNO Q USB-C · 位置示意', position: [0, 3, -32], kind: 'usb-c' },
  ],
};
ACTORS.f_extension = {
  kind: 'board', boardType: 'luwu-extension', label: '陆吾扩展板 · 独立教学板', color: '#234fa0',
  source: '视频独立板对象与可见接口 · 板形、精确尺寸、修订和针脚待核验',
  size: [53.3, 1.6, 68.6], end: [0, 100, -51], step: 4,
  ports: [
    { label: '扩展板排针 A · 位置示意', position: [-24, -3, 0], kind: 'male-header' },
    { label: '扩展板排针 B · 位置示意', position: [24, -3, 0], kind: 'male-header' },
    { label: '主总线口 1 · 实际端点与针脚待核', position: [-17, 4, 31], kind: 'servo' },
    { label: '主总线口 2 · 实际端点与针脚待核', position: [-5, 4, 31], kind: 'servo' },
    { label: '主总线口 3 · 实际端点与针脚待核', position: [7, 4, 31], kind: 'servo' },
    { label: '电池口 · 极性和键位待核', position: [20, 4, 31], kind: 'battery' },
    { label: '开关 · 位置示意', position: [23, 3, 19], kind: 'switch' },
  ],
};
// Board local +Y faces the robot rear (-Z); local +Z points up (+Y).
const boardPort = port => add(ACTORS.f_extension.end, [port.position[0], port.position[2], -port.position[1]]);
// Socket opening is local +Z, which is world +Y after the board rotation.
// The plug's tip is local -Z, 1.65 mm from its center; the opening sits 2.05 mm
// outside the socket center in the teaching factory. Match tip to opening.
const dockPosition = port => add(boardPort(port), [0, 3.7, 0]);
const powerEnd = dockPosition(ACTORS.f_extension.ports.find(p => p.kind === 'battery'));
const powerFree = [8, 151, -19];
const powerSource = [0, 130, -18];
ACTORS.f_powerCable = { kind: 'cable', cableType: 'power', endpointPlugs: [false,false], label: '电池双芯电源线 · 极性待核', source: '原片可见红黑线 · 路径、线长、极性及实际接头未核验', color: '#b74343', wireCount: 2, wireColors: ['#c63e3e', '#252931'], end: [0, 0, 0], step: 0 };
ACTORS.f_powerPlug = { kind: 'plug', label: '电池接头 · 键位与极性待核', source: '教学简模 · 无已验证的电气针脚定义', color: '#edf0f3', pins: 2, end: powerEnd, start: powerFree, size: [7, 5, 6], step: 0 };
// Provisional geometric handoff only. Torso audit found that legWireB itself
// later connects inside the hip. The global compositor owns the final mapping
// to the body's actual reserved leads; these coordinates do not assert topology.
const busFree = [[-76,83,45],[76,83,45],[-22,117,55]];
const busPreparedPaths = [
  [[-52,96,28],[-64,111,34],[-84,118,40],[-94,96,45],busFree[0]],
  [[52,96,28],[64,111,34],[84,118,40],[94,96,45],busFree[1]],
  [[-13,147,42],[-37,154,52],[-52,141,57],[-45,120,60],busFree[2]],
];
const servoPorts = ACTORS.f_extension.ports.filter(p => p.kind === 'servo');
for (let i = 0; i < 3; i++) {
  const end = dockPosition(servoPorts[i]);
  ACTORS[`f_bus${i}`] = { kind: 'cable', endpointPlugs: [false,false], label: `三针主总线 ${i + 1} · 分支对应示意`, source: '由全局合成器重定向到身体预留线的几何交接 · 模块初始点为临时候选，实际分支 ID、板口对应、线长和针脚待核验', color: '#292d34', wireCount: 3, end: [0, 0, 0], step: 0 };
  ACTORS[`f_busPlug${i}`] = { kind: 'plug', label: `主总线插头 ${i + 1} · 键位待核`, source: '教学简模 · 不指定 GND、SIGNAL 或供电针位', color: '#edf0f3', pins: 3, end, start: busFree[i], size: [8, 5, 6], step: 0 };
}

function plugMotion(free, dock, t) {
  const approach = add(dock, [0, 18, 0]);
  return t <= .65 ? mix(free,approach,phase(t,0,.65)) : mix(approach,dock,phase(t,.65,1));
}
const plugRotation = t => [-Math.PI / 2 * phase(t,0,.6),0,0];

function trayOffset(index, p) {
  return index < 1 ? [...TRAY_PREP] : index === 1 ? mix(TRAY_PREP, [0, 0, 0], phase(p, 0, .56)) : [0, 0, 0];
}

export function headOffset(localIndex, progress = 1) {
  const p = clamp(progress);
  return localIndex < 3 ? [...HEAD_PREP] : localIndex === 3 ? mix(HEAD_PREP, [0, 0, 0], phase(p, 0, .55)) : [0, 0, 0];
}

export function snapshot(localIndex, progress = 1) {
  const index = Math.max(-1, Math.min(STEPS.length - 1, Math.trunc(Number.isFinite(localIndex) ? localIndex : 0)));
  const p = clamp(progress), result = {};
  for (const [id, actor] of Object.entries(ACTORS)) {
    let visible = index >= actor.step, position = [...actor.end], turn = 0;
    let status = visible ? 'installed' : 'waiting', opacity = visible ? 1 : 0;
    if (index === actor.step && actor.start && actor.kind !== 'board') {
      const delay = actor.delay ?? 0;
      const t = phase(p, delay, actor.kind === 'screw' ? 1 : .58);
      position = mix(actor.start, actor.end, t);
      if (actor.kind === 'screw') {
        visible = p >= delay;
        turn = 5 * t;
        opacity = visible ? clamp((p - delay) * 12) : 0;
      }
      status = !visible ? 'waiting' : t >= .999 ? 'installed' : 'moving';
    }
    result[id] = { visible, position, turn, status, opacity };
    if (actor.mountRotation) result[id].rotation = [...actor.mountRotation];
  }

  // The battery is loaded into a tray staged separately from the torso.
  const offset = trayOffset(index, p);
  const packApproach = index === 0 ? mix([-40, 30, 30], [0, 0, 0], phase(p, 0, .75)) : [0, 0, 0];
  const packOffset = add(offset, packApproach);
  result.f_batteryTray.position = add(ACTORS.f_batteryTray.end, offset);
  result.f_battery.position = add(ACTORS.f_battery.end, packOffset);
  for (const id of ['f_batteryTray', 'f_battery']) if (result[id].visible) result[id].status = index === 0 ? 'prepared' : index === 1 && p < .56 ? 'moving' : 'installed';

  // Boards mate outside the body, then move together before M3 fastening.
  for (const id of ['f_uno', 'f_extension']) {
    const pose = result[id];
    let boardOffset = index < 5 ? [...BOARD_PREP] : index === 5 ? mix(BOARD_PREP, [0, 0, 0], phase(p, 0, .6)) : [0, 0, 0];
    if (id === 'f_extension' && index <= 4) boardOffset = add(boardOffset, [0, 0, -55 * (1 - (index === 4 ? phase(p, .15, .9) : 0))]);
    pose.position = add(ACTORS[id].end, boardOffset);
    pose.rotation = [...BOARD_ROTATION];
    if (pose.visible) pose.status = index === 4 ? (p >= .9 ? 'prepared' : 'moving') : index === 5 && p < .6 ? 'moving' : 'installed';
  }

  // Battery lead is present from insertion; its board end stays free until S66.
  const powerT = index < 6 ? 0 : index === 6 ? phase(p, .12, .9) : 1;
  const powerEndpoint = plugMotion(powerFree,powerEnd,powerT);
  const powerPlug = add(powerEndpoint, packOffset);
  const powerPose = result.f_powerCable;
  powerPose.position = [...packOffset];
  powerPose.points = [powerSource, [0, 143, -20], mix([14, 158, -28], [25, 153, -42], powerT), powerEndpoint].map(v => [...v]);
  result.f_powerPlug.position = powerPlug;
  result.f_powerPlug.rotation = plugRotation(powerT);
  for (const id of ['f_powerCable', 'f_powerPlug']) if (result[id].visible) result[id].status = powerT === 1 ? 'installed' : powerT > 0 ? 'moving' : 'prepared';

  // Three distinct plugs insert sequentially; S69 changes only cable middle points.
  const routed = index < 9 ? 0 : index === 9 ? smooth(p) : 1;
  for (let i = 0; i < 3; i++) {
    const begin = i * .3, t = index < 7 ? 0 : index === 7 ? phase(p, begin, begin + .28) : 1;
    const visible = index >= 0;
    const end = plugMotion(busFree[i], ACTORS[`f_busPlug${i}`].end, t);
    const sign = i === 0 ? -1 : 1;
    const original = busPreparedPaths[i];
    const path = [original[0], [sign*77,118+i*8,24], [sign*55,160+i*2,-30], add(ACTORS[`f_busPlug${i}`].end,[0,18,0]), end];
    const points = original.map((point,j) => j === 4 ? [...end] : mix(point,path[j],t));
    if (routed > 0) {
      points[1] = mix(points[1],add(path[1],[-sign*8,-6,-7]),routed);
      points[2] = mix(points[2],add(path[2],[-sign*11,-7,-8]),routed);
      points[3] = mix(points[3],add(path[3],[sign*4,2,0]),routed);
    }
    const status = !visible ? 'waiting' : t === 0 ? 'prepared' : t >= .999 ? 'installed' : 'moving';
    const carried = i === 2 ? headOffset(index,p) : [0,0,0];
    result[`f_bus${i}`] = { visible, position: carried, points, turn: 0, status, opacity: visible ? 1 : 0, connectProgress: t };
    result[`f_busPlug${i}`] = { visible, position: add(end,carried), rotation: plugRotation(t), turn: 0, status, opacity: visible ? 1 : 0, connectProgress: t };
  }
  return result;
}
