import {CATALOG} from '../full-catalog.mjs';

// Independent teaching state. Geometry stays in CATALOG world coordinates;
// the integrator applies the temporary head-group translation.
export const CHAPTERS = [
  {id:'head-core',name:'头部旋转与接线',start:0,end:8,sourceStart:768,sourceEnd:890},
  {id:'head-mouth-neck',name:'嘴部与双舵机脖子',start:9,end:17,sourceStart:890,sourceEnd:1034},
  {id:'head-finish',name:'头盖与嘴部软垫',start:18,end:24,sourceStart:1034,sourceEnd:1102},
];

export const STEPS = [];
function step(id, short, title, sourceStart, sourceEnd, parts, text, check, caption, target=[0,220,42], duration=2.5) {
  const chapter = CHAPTERS.find(item => STEPS.length >= item.start && STEPS.length <= item.end);
  STEPS.push({id,chapter:chapter.id,short,title,text,check,sourceStart,sourceEnd,parts,duration,
    target:[...target],camera:[target[0]+155,target[1]+108,target[2]+185],caption});
}
step('head-yaw-motor','先轴承后舵机','先压入轴承，再固定 ID32 与第一支架',768,782,
  ['h_pitchSupport','h_bearingCrown','h_motor32','h_yawScrew0'],
  '按原片先在第一只白支架压入一只轴承，再装入已编号、已居中的 ID32，贴合后固定四颗 M2×6。第一支架使用 P6-01。',"ID32 副舵盘可选拆，本教程保留。固定前核对主副盘与插座开口；孔轴和实体配合仍待核。",'先压轴承 · 再贴合固定 M2×6 ×4');
step('head-yaw-wire','插接旋转线','给 ID32 插接舵机线',782,792,
  ['h_plug32','h_wire32','h_motor32'],
  '对准可见接口方向，按压插头到位；保留后续绕过支架的线段。',
  '线束路径和插座身份为教学示意，针脚和极性待核验。','按压到位 · 端点示意');
step('head-bearings','先压入轴承','先在独立支架上压入轴承',792,814,
  ['h_yawSupport','h_bearingFront','h_bearingBack'],
  '取第二只白色开孔支架 P6-08，按原片在这只独立支架的两处轴承位依次压入轴承，再组合 ID33。',
  '首只轴承已在第一支架安装；这里是第二支架的另外两只。轴向位置沿用源网格，实物配合待核验。','第二支架 · 依次压入两只轴承',[0,224,40],3.1);
step('head-roll-motor','装入第二舵机','把 ID33 装入已准备的支架',814,828,
  ['h_motor33','h_yawSupport','h_rollScrew0'],
  '按视频取 ID33，与已压轴承的支架对齐，先固定画面第一处标示的四颗 M2×6。',"核对 ID33 主副盘及插座开口朝向，再装支架。主盘保持安装，实体配合待核。",'第一处固定 · M2×6 ×4');
step('head-core-join','组合旋转模块','连接两只头部舵机的子组件',828,842,
  ['h_motor32','h_motor33','h_coreScrew0','h_bearingFront'],
  '让 ID32 子组件保持原位，把已经装好轴承的 ID33 支架子组件整体对接，再按画面第二处标示，用四颗 M2×6 固定。',"对接前核对 ID32 / ID33 的主副盘与插座方向；P6-08 和两只轴承随 ID33 组件移动。孔轴配合待核。",'子组件整体对接 · 再固定 M2×6 ×4');
step('head-core-horn-wire',"卸副盘并接线","拆下 ID33 副舵盘并接线",842,860,
  ['h_coreHornScrew','h_coreHorn','h_plug33','h_wire33'],"认准 ID33 插座开口同侧，先卸中央固定螺丝，再取下副舵盘并保留，然后插接舵机线。","主舵盘与输出轴不拆。原装螺丝不归为 M2 自攻；插头键位和针脚仍需核对。","只拆副舵盘 · 再接线",undefined,3.1);
step('head-platform','放入头部平台','把旋转子组件整体放入头部平台',860,874,
  ['h_platform','h_motor32','h_motor33','h_wire32','h_wire33'],
  '把已经连接的头部旋转子组件整体放入 P2-02 头部平台。让已接的线从开口引出。',"按本关节主副盘与插座朝向整体放入；已装轴承、螺丝和线束随组件移动，勿夹线。",'子组件整体放入 · 线从开口引出',undefined,3.1);
step('head-mouth-prepare','核对嘴部舵机','取下一只嘴部舵机并核对编号',874,878,
  ['h_mouthMotor','h_mouthHorn','h_mouthHornScrew'],
  '按装配指南第1、19页，取嘴部舵机 ID34。核对实物标签后安装，头部另一只舵机仍为 ID33。',
  '嘴部使用 ID34；主舵盘和输出轴保留。安装孔与实体配合仍待核。','嘴部 · ID34',[18,225,62],1.8);
step('head-mouth-horn-wire',"嘴部卸副盘线","拆下嘴部副舵盘并接线",878,890,
  ['h_mouthHornScrew','h_mouthHorn','h_plugMouth','h_wireMouth'],"认准嘴部舵机插座开口同侧，先卸中央固定螺丝，再取下副舵盘并保留，然后插接线束。","主舵盘和输出轴保留。嘴部编号为 ID34；键位与针脚仍待核。","只拆副舵盘 · 再接线",[18,225,62],2.8);
step('head-mouth-jaw','装舵机与下巴','放入嘴部舵机，再套上下巴',890,918,
  ['h_mouthMotor','h_jaw','h_wireMouth'],
  '先把嘴部舵机放入平台，再把 P2-01 下巴两侧对准驱动轴与支撑位套入。让线束从开口留出。',"套入下巴前核对主副盘与插座方向。两侧轴孔、间隙及配合精度仍待实物核验。",'先放舵机 · 再套入下巴',[0,218,72],3.5);
step('head-servo-support','盖上固定件','装上头部舵机固定件',918,928,
  ['h_servoSupport','h_supportScrew0','h_jaw'],
  '把 P4-02 头部舵机固定件贴合到平台上的机构。按第一处字幕固定四颗 M2×6。',
  '保持下巴能活动，避开预留线束。具体四孔位置仍为示意。','第一孔组 · M2×6 ×4',[0,226,55],3.0);
step('head-platform-fix','固定下巴输出侧','固定下巴输出侧的四个孔',928,936,
  ['h_jaw','h_platformScrew0','h_mouthMotor'],
  '按原片第二处四颗 M2×6 的提示，从下巴驱动侧外面固定。这里使用 P2-01 源网格的四孔轴线。',"从主舵盘驱动侧核对下巴孔轴，再固定。螺丝随下巴开合，实物规格与配合仍待核验。",'下巴输出侧 · M2×6 ×4',[0,219,55]);
step('head-mouth-check','检查嘴部开合','检查下巴开合与线束状态',936,942,
  ['h_jaw','h_mouthMotor','h_wireMouth'],
  '轻动下巴，检查能否开合、是否明显卡住，以及侧面是否夹线。动画演示一次张开和闭合。',
  '这里只是开合示意，结束时回到闭合位；实物是否顺畅、间隙与舵机角度均待核验。','模拟张开 → 闭合 · 实物待核验',[0,219,76],3.1);
step('head-neck-pair','连接双舵机','排列 ID31 与 ID30，装第一块连接板',942,962,
  ['h_motor31','h_motor30','h_neckA','h_neckAScrew0','h_neckAScrew2'],
  '原片桌面视角左为 ID31、右为 ID30。先把第一连接板固定到一只舵机，再对接另一只，完成连接板其余孔位。',"ID30、ID31 主副舵盘全部保留。核对插座方向；按指南第22页，两侧连接板及头颈固定合计16颗M2×6，孔位与配合另核。",'先固定一端 · 再连另一只舵机',[38,167,52],3.7);
step('head-neck-plate','装第二连接板','安装另一块颈部连接板',962,972,
  ['h_neckB','h_neckBScrew0','h_motor30','h_motor31'],
  '在另一侧装 P3-03 连接板候选，按视频固定四颗 M2×6，形成双舵机脖子子组件。',"核对两只舵机主副盘和插座朝向，保持 ID30 / 31 副盘；先完成连接板，再接头部。",'另一侧连接板 · M2×6 ×4',[38,167,52],2.8);
step('head-neck-join','连接头与脖子','把双舵机脖子接到头部',972,984,
  ['h_motor30','h_motor31','h_neckA','h_neckB','h_pitchSupport'],
  '把已经连接好的脖子整体装到头部的俯仰连接处。原片要求出线口位于操作者左手边。',"核对主副盘和插座开口朝向。原片操作者左手边不能写成机器人左侧，具体配合仍待核验。",'按操作者左手边核对出线口',[0,184,48],3.1);
step('head-neck-fix','固定头颈连接','固定头颈连接的两处孔组',984,1002,
  ['h_pitchSupport','h_neckFixScrew0','h_neckFixScrew4'],
  '按视频依次固定两处头颈连接部位，每处字幕标四颗 M2×6。',"两组固定前核对主副盘侧与插座开口。指南合计16颗；具体孔位、轴向与配合仍需实物逐孔复核。",'两处固定 · 各 M2×6 ×4',[0,190,44],3.2);
step('head-neck-wire','接线并留余量','插接头颈总线并整理线环',1002,1034,
  ['h_neckWire','h_headLead','h_plugNeck','h_wire32','h_wire33','h_wireMouth'],
  '按可见动作插接头颈线束，再整理线环，为俯仰和转动留出余量。将后续总装使用的线端留在外侧。',"以插座开口识别副盘侧，保留 ID30 / 31 副盘。预留活动线环；线弯不代表接口身份或针脚。",'先整理线束 · 再合外壳',[0,185,51],3.2);
step('head-shell','套装头盖','套入白色头盖',1034,1047,
  ['h_shell','h_platform','h_headLead'],
  '将 P4-01 头盖套在已完成的头部机构上，让预留线束留在开口外。',
  '沿用现有真实网格。外壳版本、卡合位置及间隙待核验。','套上头盖 · 避开线束',[0,236,58],2.8);
step('head-shell-fix','内侧固定头盖','从内侧固定头盖',1047,1052,
  ['h_shellScrew0','h_shell'],
  '按装配指南第20页，从内侧用三颗 M2×6 固定头盖。',
  '共需3颗；第3处模型孔位尚待核定，暂不演示该孔插入。确认线束没有夹在头盖与平台之间。','内侧固定 · M2×6 ×3',[0,225,59]);
step('head-eyes','安装眼圈眼睛','安装眼圈和眼睛小件',1052,1064,
  ['h_eyeShell','h_eyes','h_shell'],
  '对齐头盖前孔，安装 P2-06 眼圈与 P3-01 眼睛组件候选。',
  '视频未逐个清楚展示内部小件。这里的先后和卡合方式仅为示意。','对齐前孔 · 小件身份待核验',[0,238,95],2.6);
step('head-lower-tape','下嘴贴双面胶','先在下巴软垫平整面贴双面胶',1064,1070,
  ['h_lowerAdhesive','h_lowerPad'],
  '按原片先处理下巴上的软垫，在其平整底面贴双面胶。动画保留可见软垫与独立胶片。',
  '胶片在网格外表面，厚度及裁剪范围为示意；下一步再把它与软垫一起装入下巴。','先给下巴软垫贴双面胶',[0,211,80]);
step('head-lower-pad','贴下巴软垫','先把软垫贴入下巴',1070,1082,
  ['h_lowerPad','h_lowerAdhesive','h_jaw'],
  '按原片先把已贴胶的下巴软垫整体贴入张开的下巴，压平贴合。源网格使用 P1-01。',
  '胶片与软垫共同移动，源文件的上下身份保留为候选；实物材料和粘接牢度待核验。','先贴下巴软垫',[0,211,80],2.7);
step('head-upper-tape','上嘴贴双面胶','再在上嘴软垫平整面贴双面胶',1082,1090,
  ['h_upperAdhesive','h_upperPad'],
  '再处理上嘴软垫，在其外露平整面贴双面胶，下一步再整体压到上嘴。',
  '胶片位于网格外表面，厚度、轮廓与粘接强度仍为教学示意。','再给上嘴软垫贴双面胶',[0,216,84]);
step('head-upper-pad-check','贴上垫查闭合','贴上嘴软垫，再检查上下嘴贴合',1090,1102,
  ['h_upperPad','h_upperAdhesive','h_jaw','h_lowerPad'],
  '按原片再将上嘴软垫连同胶片贴到上嘴；源网格使用 P1-02。随后检查上下嘴是否贴合，是否有明显缝隙。',
  '本步只模拟一次开合并回到目录闭合姿态；无缝贴合、活动顺畅和线束余量须由实物检查。','贴合后模拟闭合 · 实物待核验',[0,219,82],3.4);
STEPS.at(-1).complete = true;

export const ACTORS = {};
// Opposite rectangular cues in the source servo meshes lie on the +/-10 faces.
// Openings extend 1.3 outside those faces. These are visual teaching sockets;
// electrical identity, keying and pinout are not verified.
export const SERVO_PORTS = Object.fromEntries([
  ['h_motor30',2,[-7,3,0],[0,1,0]],
  ['h_motor31',2,[-7,-3,0],[0,1,0]],
  ['h_motor32',2,[-3,7,0],[1,0,0]],
  ['h_motor33',1,[-3,0,-7],[1,0,0]],
  ['h_mouthMotor',1,[-7.5,0,3],[0,0,1]],
].map(([id,axis,cue,tangent])=>[id,[-1,1].map((sign,i)=>({
  id:i?'bus-b':'bus-a',position:cue.map((v,k)=>k===axis?sign*11.3:v),
  normal:[0,0,0].map((_,k)=>k===axis?sign:0),tangent:[...tangent],
  evidence:'source-face-cue; illustrative-socket; pinout-unverified',
}))]));
const add = (a,b) => a.map((value,index) => value+b[index]);
const mix = (a,b,t) => a.map((value,index) => value+(b[index]-value)*t);
const clamp = value => Math.max(0,Math.min(1,value));
const smooth = value => {const t=clamp(value);return t*t*(3-2*t);};
const span = (p,from=0,to=1) => smooth((p-from)/(to-from));
function actor(id, sourceId, at, extra={}) {
  const item = sourceId ? CATALOG[sourceId] : null;
  if (sourceId && !item) throw new Error(`Unknown head geometry: ${sourceId}`);
  const end = [...(extra.end || item?.end || [0,0,0])];
  ACTORS[id] = {kind:item?'mesh':'screw',label:item?.sourceName||id,
    source:item?(sourceId.startsWith('P')?'真实打印件网格 · 视频对应及配合待核验':'现有硬件网格 · ID 与接口待核验'):'教学简模 · 孔位待核验',
    ...(item?{sourceId,color:item.color,size:[...item.size]}:{}),
    ...(SERVO_PORTS[id]?{servoPorts:SERVO_PORTS[id]}:{}),
    step:at,end,start:add(end,extra.approach||[0,24,0]),...extra,group:'head'};
}
function screws(prefix,at,positions,{axis='x',direction=-1,assembly,from=.35,to=.92,jawAttached=false}={}) {
  positions.forEach((end,index) => {
    const delay = from+(to-from)*index/positions.length;
    actor(prefix+index,null,at,{kind:'screw',label:`M2×6 固定螺丝 ${index+1} · 孔位示意`,
      source:'沉头平尾自攻教学简模 · 孔位和轴向待核验；孔组数量按该处字幕暂列',end,
      approach:axis==='x'?[-direction*22,0,0]:axis==='z'?[0,0,-direction*22]:[0,-direction*22,0],fastener:'M2x6',
      orientationZ:axis==='x'?direction*Math.PI/2:axis==='y'&&direction>0?Math.PI:0,
      spinAxis:axis==='x'?[1,0,0]:axis==='z'?[0,0,1]:[0,1,0],
      ...(axis==='z'?{rotation:[-direction*Math.PI/2,0,0]}:{}),jawAttached,
      chip:`M2×6 ×${positions.length}`,listGroup:prefix,assembly,from:delay,to:Math.min(1,delay+.22)});
  });
}

actor('h_pitchSupport','P6-01',0,{label:'第一支架 · P6-01',assembly:'core',approach:[0,0,0],to:.01});
actor('h_motor32','head_yaw_2',0,{label:'头部旋转舵机 · ID32 候选',assembly:'core',approach:[-35,18,0],from:.27,to:.6});
screws('h_yawScrew',0,[[5.99009,206.10,40.98885],[-6.00991,206.10,40.99799],[-.00533,206.10,46.99341],[-.01448,206.10,34.99343]],{axis:'y',direction:1,assembly:'core',from:.65,to:.91});
actor('h_yawSupport','P6-08',2,{label:'第二开孔支架 · P6-08',assembly:'core',approach:[24,0,0],to:.18});
actor('h_bearingFront','head_yaw_1',2,{label:'头部大轴承前候选 · 16×22×4',assembly:'core',approach:[0,0,26],from:.2,to:.48});
actor('h_bearingBack','head_yaw_3',2,{label:'头部大轴承后候选 · 16×22×4',assembly:'core',approach:[0,0,-26],from:.4,to:.7});
actor('h_bearingCrown','head_yaw_1',0,{label:'第一支架大轴承 · 座面候选',assembly:'core',
  source:'复用 head_yaw_1 完整环形网格；沿P6-01源圆柱轴线x=-0.01,z=40.99，底面落在约y=206.24肩面；轴向座面候选及实物配合待核验',
  end:[-.01,208.24,40.99],approach:[0,24,0],rotation:[Math.PI/2,0,0],from:0,to:.22});
actor('h_motor33','head_roll_2',3,{label:'头部第二舵机 · ID33 候选',assembly:'core',approach:[0,20,-28],to:.4});
screws('h_rollScrew',3,[[-.02051,229.76542,29.10],[-6.02244,223.76735,29.10],[5.97755,223.76349,29.10],[-.02438,217.76543,29.10]],{axis:'z',assembly:'core',from:.45});
screws('h_coreScrew',4,[[-22.51611,237.45,33.00330],[7.48389,237.45,32.99510],[-22.51173,237.45,49.00329],[7.48826,237.45,48.99509]],{axis:'y',assembly:'core',from:.6});
actor('h_platform','P2-02',6,{label:'头部平台 · P2-02',approach:[0,-18,18],to:.6});
actor('h_mouthMotor','head_roll_0',7,{label:'嘴部舵机 · ID34',assembly:'mouth',approach:[15,10,0],to:.65});
actor('h_jaw','P2-01',9,{label:'下巴 · P2-01',approach:[0,0,40],from:.42,to:1});
actor('h_servoSupport','P4-02',10,{label:'头部舵机固定件 · P4-02',approach:[0,32,0],to:.45});
screws('h_supportScrew',10,[[25.0366,221.40,20.9304],[-32.9995,221.40,58.8751],[-.0073,221.40,67.0065],[-32.9633,221.40,20.8752]],{axis:'y',from:.5});
screws('h_platformScrew',11,[[44.15,232.25744,40.96280],[44.15,220.25745,40.94617],[44.15,226.26575,34.95449],[44.15,226.24914,46.95448]],{from:.1,jawAttached:true});

actor('h_motor30','neck_pitch_3',13,{label:'脖子下端舵机 · ID30 候选',assembly:'neck',approach:[0,-28,0],from:.62,to:.75});
actor('h_motor31','neck_pitch_1',13,{label:'脖子上端舵机 · ID31 候选',assembly:'neck',approach:[-20,0,0],to:.15});
actor('h_neckA','P3-02',13,{label:'颈部连接板 A · P3-02 候选',assembly:'neck',approach:[24,0,0],from:.15,to:.35});
screws('h_neckAScrew',13,[[13.65,167.48824,49.00298],[13.65,167.49227,33.00298],[13.65,162.48824,49.00172],[13.65,162.49227,33.00172]],{assembly:'neck',from:.4});
// S51 shows two, then four. The source plate has four actual holes;
// animate the first pair then the remaining pair, without inventing extra holes.
for (const [index,a] of Object.entries(ACTORS).filter(([id])=>id.startsWith('h_neckAScrew')).map(([,a],i)=>[i,a])) {
  a.from = index < 2 ? .4+index*.07 : .78+(index-2)*.08;
  a.to = Math.min(1,a.from+.14);
  a.chip = index < 2 ? '先固定2孔' : '续装至4孔';
  a.listGroup = index < 2 ? 'h_neckA-first2' : 'h_neckA-next4';
}
actor('h_neckB','P3-03',14,{label:'颈部连接板 B · P3-03 候选',assembly:'neck',approach:[-24,0,0],to:.35});
screws('h_neckBScrew',14,[[-13.65,162.50273,32.99210],[-13.65,167.50273,32.99355],[-13.65,162.49812,48.99210],[-13.65,167.49812,48.99354]],{assembly:'neck',direction:1,from:.4});
screws('h_neckFixScrew',16,[[17.65,189.9984,34.9589],[17.65,183.9909,40.9514],[17.65,189.9833,46.9589],[17.65,195.9909,40.9665],[-17.65,189.9844,46.9833],[-17.65,189.9994,34.9833],[-17.65,183.9919,40.9758],[-17.65,195.9919,40.9909]],{from:.1,to:.85});
for(let i=0;i<8;i++) {
  const a=ACTORS[`h_neckFixScrew${i}`];a.chip='M2×6 ×4';a.listGroup=i<4?'h_neckFixFirst':'h_neckFixSecond';
  if(i>=4) {a.start=add(a.end,[-22,0,0]);a.orientationZ=Math.PI/2;}
}
actor('h_shell','P4-01',18,{label:'头盖 · P4-01',approach:[0,40,-8]});
screws('h_shellScrew',19,[[39.4715,219.20,89.3823],[-39.5284,219.30,89.3072]],{axis:'y',direction:1,from:.05,to:.6});
// A required fastener is counted without inventing its third mounting hole.
actor('h_shellScrew2',null,19,{kind:'screw',fastener:'M2x6',label:'头盖第3颗 M2×6 · 孔位待核',source:'Assembly_Guide 第20页确认共3颗；第3孔未定位',hardwareStatus:'pending-hole-alignment',listGroup:'h_shellScrew',end:[0,0,0],approach:[0,0,0]});
actor('h_eyeShell','P2-06',20,{label:'眼圈 · P2-06 候选',approach:[0,0,28],from:.25,to:1});
actor('h_eyes','P3-01',20,{label:'眼睛小件 · P3-01 候选',approach:[0,0,26],to:.6});
actor('h_upperPad','P1-02',23,{label:'上嘴软垫 · P1-02 候选',approach:[0,18,28],installStep:24,to:.6});
actor('h_lowerPad','P1-01',21,{label:'下嘴软垫 · P1-01 候选',approach:[0,14,28],installStep:22});

const cableSource='三芯线教学示意 · 路径、插座身份、端点与电气针脚待核验';
function wire(id,at,points,assembly,extra={}) {
  actor(id,null,at,{kind:'cable',label:'头颈三芯线 · 端点示意',source:cableSource,end:[0,0,0],start:[0,0,0],points,assembly,...extra});
}
function servoDock(motorId,portIndex,position=ACTORS[motorId].end) {
  const port=SERVO_PORTS[motorId][portIndex];
  return position.map((v,i)=>v+port.position[i]+port.normal[i]*1.65);
}
function plug(id,at,motorId,portIndex,label) {
  const motor=ACTORS[motorId],port=SERVO_PORTS[motorId][portIndex],end=servoDock(motorId,portIndex);
  const rotation=port.normal[1]
    ?[-port.normal[1]*Math.PI/2,0,port.tangent[2]?-port.normal[1]*Math.PI/2:0]
    :[0,port.normal[2]<0?Math.PI:0,port.tangent[1]?Math.PI/2:port.normal[2]<0?Math.PI:0];
  actor(id,null,at,{kind:'plug',label,source:'源矩形面定位的教学插头 · 实际接口身份、键位和针脚待核验',end,
    approach:port.normal.map(v=>v*18),assembly:motor.assembly,rotation,portMotor:motorId,portIndex,from:.55,to:1});
}
const dock32=servoDock('h_motor32',1),dock33=servoDock('h_motor33',1),dockMouth=servoDock('h_mouthMotor',1);
const dockNeck31=servoDock('h_motor31',1),dockNeck30=servoDock('h_motor30',1),dockHeadLead=servoDock('h_motor30',0);
wire('h_wire32',1,[dock32,add(dock32,[0,0,8]),[43,234,62],[46,214,28],[28,200,34]],'core',
  {label:'ID32 预留线 · 端点示意',routeAfter:17,finalPoints:[dock32,add(dock32,[0,0,8]),[47,222,62],[46,194,32],[22,183,42]],from:.55,attachedPlug:'h_plug32',plugEnd:0,endpointPlugs:[false,true]});
wire('h_wire33',5,[dock33,add(dock33,[0,8,0]),[-37,238,10],[-43,218,35],[-30,200,45]],'core',
  {label:'ID33 预留线 · 端点示意',routeAfter:17,finalPoints:[dock33,add(dock33,[0,8,0]),[-43,221,10],[-44,192,27],[-25,181,42]],from:.55,attachedPlug:'h_plug33',plugEnd:0,endpointPlugs:[false,true]});
wire('h_wireMouth',8,[dockMouth,add(dockMouth,[0,8,0]),[54,229,38],[51,212,24],[31,200,31]],'mouth',
  {label:'嘴部舵机 ID34 线 · 线长待核',routeAfter:17,finalPoints:[dockMouth,add(dockMouth,[0,8,0]),[58,218,39],[52,191,31],[28,174,43]],from:.55,attachedPlug:'h_plugMouth',plugEnd:0,endpointPlugs:[false,true]});
wire('h_neckWire',17,[dockNeck31,add(dockNeck31,[0,0,8]),[48,174,63],add(dockNeck30,[0,0,8]),dockNeck30],null,
  {label:'脖子线环 · 端点及串接次序示意',attachedPlug:'h_plugNeck',plugEnd:4,endpointPlugs:[true,false],sourceMotor:'h_motor31',sourcePort:1,sourceEntry:[0,.5]});
wire('h_headLead',17,[dockHeadLead,add(dockHeadLead,[0,0,-8]),[-52,141,57],[-45,120,60],[-22,117,55]],null,
  {label:'留给总装的头颈线端 · 端点示意',from:.35,sourceMotor:'h_motor30',sourcePort:0,sourceEntry:[.35,1]});
plug('h_plug32',1,'h_motor32',1,'ID32 插头 · 教学接口');
plug('h_plug33',5,'h_motor33',1,'ID33 插头 · 教学接口');
plug('h_plugMouth',8,'h_mouthMotor',1,'嘴部插头 · 教学接口');
plug('h_plugNeck',17,'h_motor30',1,'脖子线插头 · 教学接口');

function removable(prefix,at,removeStep,end,assembly,axis='x',direction=1) {
  const outward=axis==='z'?[0,0,direction]:[direction,0,0];
  actor(prefix+'Horn',null,at,{kind:'horn',label:'拆下保留的副舵盘',source:'插座开口同侧副舵盘 · 轴头保留',
    end,start:[...end],assembly,removeStep,tray:[77,204+(prefix==='h_core'?9:0),-1],outward,
    rotation:axis==='z'?[0,-direction*Math.PI/2,0]:[0,0,0],carriedBy:prefix==='h_core'?'h_motor33':'h_mouthMotor'});
  actor(prefix+'HornScrew',null,at,{kind:'screw',label:'副舵盘中央固定螺丝 · 规格待核验',source:'原装中央螺丝教学简模 · 不归为自攻螺丝',
    end:add(end,outward.map(v=>v*2)),assembly,removeStep,tray:[65,204+(prefix==='h_core'?9:0),-1],outward,
    fastener:null,orientationZ:axis==='x'?-direction*Math.PI/2:0,spinAxis:axis==='x'?[1,0,0]:[0,0,1],
    ...(axis==='z'?{rotation:[direction*Math.PI/2,0,0]}:{}),
    carriedBy:prefix==='h_core'?'h_motor33':'h_mouthMotor'});
}
removable('h_core',3,5,[0,223.75,-6.65],'core','z',-1);
removable('h_mouth',7,8,[41.25,226.55,41.0],'mouth','x',1);

// S43 prepares a bearing bracket independently; S44 then joins it to ID32.
// This split expresses that observed order. The source-part binding is provisional.
for(const id of ['h_motor33','h_yawSupport','h_bearingFront','h_bearingBack',
  'h_rollScrew0','h_rollScrew1','h_rollScrew2','h_rollScrew3','h_coreHorn','h_coreHornScrew']) {
  ACTORS[id].subassembly='head-second';
  ACTORS[id].source+='；按原片随第二支架/ID33 子组件，实物配合待核验';
}

function adhesive(id,at,padId,installStep,approach,side) {
  // Keep the slab outside the source mesh, on the selected bonding side.
  const end=add(CATALOG[padId].end,[0,side*(CATALOG[padId].size[1]/2+.16),0]);
  actor(id,null,at,{kind:'adhesive',label:'双面胶薄片 · 厚度与轮廓示意',
    source:'双面胶教学示意 · 材料、厚度、轮廓和贴合强度待核验',end,
    size:[CATALOG[padId].size[0]*.9,.22,CATALOG[padId].size[2]*.84],
    color:'#e5e7ec',start:add(end,add(approach,[0,side*10,0])),padApproach:approach,installStep,surfaceSide:side});
}
adhesive('h_upperAdhesive',23,'P1-02',24,[0,18,28],1);
adhesive('h_lowerAdhesive',21,'P1-01',22,[0,14,28],-1);

function assemblyOffset(group,index,p) {
  const setup = group==='core'?[6,[0,28,-40]]:group==='neck'?[15,[70,0,25]]:group==='mouth'?[9,[60,20,32]]:null;
  if(!setup || index>setup[0]) return [0,0,0];
  const t=index===setup[0]?span(p,0,group==='mouth'?.42:1):0;
  return setup[1].map(value=>value*(1-t));
}
function secondCoreOffset(index,p) {
  const t=index<4?0:index===4?span(p,0,.55):1;
  return [45,0,-20].map(value=>value*(1-t));
}
// Rotation is an illustrative side-axis motion, not a measured joint limit.
// P2-01 side bores share an X axis near y=226.30,z=40.92.
const jawPivot=[0,226.30,40.92];
function rotateJawPoint(position,angle) {
  const [x,y,z]=position.map((value,index)=>value-jawPivot[index]);
  return [jawPivot[0]+x,jawPivot[1]+y*Math.cos(angle)-z*Math.sin(angle),jawPivot[2]+y*Math.sin(angle)+z*Math.cos(angle)];
}
export function snapshot(localIndex,progress=1) {
  const index=Math.min(STEPS.length-1,Math.max(0,Math.trunc(Number.isFinite(localIndex)?localIndex:0)));
  const p=clamp(Number.isFinite(progress)?progress:1);
  const result={};
  for(const [id,a] of Object.entries(ACTORS)) {
    const visible=index>=a.step;
    let position=[...a.end],turn=0,status=visible?'installed':'waiting',opacity=visible?1:0;
    let rotation=a.rotation?[...a.rotation]:undefined;
    if(visible && index===a.step) {
      const t=span(p,a.from??0,a.to??1);
      position=mix(a.start,a.end,t);
      status=t>=.999?'installed':'moving';
      if(a.kind==='screw') {turn=t*5;opacity=clamp((p-(a.from??0))*12);}
    }
    if(visible && a.carriedBy) {
      const carrier=ACTORS[a.carriedBy];
      if(index===carrier.step) {
        const t=span(p,carrier.from??0,carrier.to??1);
        position=add(a.end,mix(carrier.start,carrier.end,t).map((value,i)=>value-carrier.end[i]));
      }
      turn=0;
    }
    if(visible && a.kind==='mesh' && a.installStep!==undefined) {
      if(index<a.installStep) {position=[...a.start];status='prepared';}
      else if(index===a.installStep) {
        const t=span(p,0,a.to??1);
        position=mix(a.start,a.end,t);status=t>=.999?'installed':'moving';
      }
    }
    if(visible && a.kind==='adhesive') {
      const waiting=add(a.end,a.padApproach);
      if(index===a.step) position=mix(a.start,waiting,smooth(p));
      else if(index<a.installStep) position=waiting;
      else if(index===a.installStep) {
        const t=span(p,0,a.installStep===24?.6:1);
        position=mix(waiting,a.end,t);status=t>=.999?'installed':'moving';
      }
      if(index<a.installStep) status='prepared';
    }
    position=add(position,assemblyOffset(a.assembly,index,p));
    if(a.subassembly==='head-second') {
      position=add(position,secondCoreOffset(index,p));
      if(visible && index<4 && status==='installed') status='prepared';
      if(visible && index===4 && p<.55) status='moving';
    }
    if(visible && a.assembly) {
      const joining=a.assembly==='core'?6:a.assembly==='mouth'?9:15;
      const t=span(p,0,a.assembly==='mouth'?.42:1);
      if(index===joining && t<.999) status='moving';
    }
    if(visible && a.removeStep!==undefined && index>=a.removeStep) {
      const atStart=add(a.end,assemblyOffset(a.assembly,a.removeStep,0));
      const t=index===a.removeStep?span(p,a.kind==='screw'?0:.33,a.kind==='screw'?.48:.78):1;
      const withdrawn=add(atStart,a.outward.map(v=>v*16));
      position=t<.45?mix(atStart,withdrawn,smooth(t/.45)):mix(withdrawn,a.tray,smooth((t-.45)/.55));
      status=t>=.999?'removed':'moving';
      turn=a.kind==='screw'?-6*t:0;opacity=1;
    }
    const pose={visible,position,turn,status,opacity};
    if(rotation) pose.rotation=rotation;
    if(a.kind==='cable') {
      const routeT=a.routeAfter===undefined?0:index>a.routeAfter?1:index===a.routeAfter?smooth(p):0;
      pose.points=a.points.map((point,i)=>a.finalPoints?mix(point,a.finalPoints[i],routeT):[...point]);
      if(visible && index===a.step) {
        const t=span(p,a.from??0,1);
        if(!a.attachedPlug) pose.points[0]=add(pose.points[0],[0,0,18*(1-t)]);
        pose.status=t>=.999?'installed':'moving';
      }
      // Cable vertices are relative to pose.position, so a parent translation
      // moves the complete cable without adding the offset to its vertices twice.
      pose.position=assemblyOffset(a.assembly,index,p);
    }
    if(visible && (['h_jaw','h_lowerPad','h_lowerAdhesive'].includes(id)||a.jawAttached)) {
      const t=index===12?p:index===24?clamp((p-.65)/.35):0;
      const angle=Math.abs(Math.sin(t*Math.PI))*.32;
      pose.position=rotateJawPoint(pose.position,angle);
      pose.rotation=[angle,0,0];
    }
    if(a.hardwareStatus==='pending-hole-alignment')Object.assign(pose,{visible:false,opacity:0,status:index>=a.step?'pending':'waiting'});
    result[id]=pose;
  }
  for(const [id,a] of Object.entries(ACTORS)) if(a.portMotor) {
    const pose=result[id],port=SERVO_PORTS[a.portMotor][a.portIndex];
    const t=index>a.step?1:index===a.step?span(p,a.from??0,a.to??1):0;
    pose.position=servoDock(a.portMotor,a.portIndex,result[a.portMotor].position).map((v,i)=>v+port.normal[i]*18*(1-t));
    if(pose.visible) pose.status=t>=.999?'installed':'moving';
  }
  for(const [id,a] of Object.entries(ACTORS)) if(a.kind==='cable' && a.sourceMotor) {
    const pose=result[id],port=SERVO_PORTS[a.sourceMotor][a.sourcePort];
    const t=index>a.step?1:index===a.step?span(p,...a.sourceEntry):0;
    const point=servoDock(a.sourceMotor,a.sourcePort,result[a.sourceMotor].position).map((v,i)=>v+port.normal[i]*18*(1-t)-pose.position[i]);
    pose.points[0]=point;
    pose.points[1]=add(point,port.normal.map(v=>v*8));
  }
  for(const [id,a] of Object.entries(ACTORS)) if(a.kind==='cable' && a.attachedPlug) {
    const pose=result[id],plug=result[a.attachedPlug];
    pose.points[a.plugEnd]=plug.position.map((v,i)=>v-pose.position[i]);
    const port=SERVO_PORTS[ACTORS[a.attachedPlug].portMotor][ACTORS[a.attachedPlug].portIndex];
    const neighbor=a.plugEnd===0?1:pose.points.length-2;
    pose.points[neighbor]=add(pose.points[a.plugEnd],port.normal.map(v=>v*8));
  }
  return result;
}
