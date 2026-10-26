import * as Legacy from './hardware-state.mjs';

export const FLOW_VERSION='assembly-guide-20261013';
export const GUIDE_SHA256='649e93e883db0296a062e9faf0038ffd82169c7362473cdb3bfe17b9b8213ffe';
// Stable action IDs are retained. The video describes the original filming
// sequence; every action carries its own clip rather than inheriting a PDF page.
const pages=[
 ['编号与连接准备',Legacy.STEPS.filter(s=>s.module===0).map(s=>s.id)],
 ['副舵盘规则',['r-horn','l-horn']],
 ['底部舵机与连接板',['t-pair','t-support','t-wire']],
 ['底座支架',['t-backplate-front','t-backplate-back']],
 ['侧支架与轴承',['t-yaw-r','t-yaw-l']],
 ['腿部舵机连接',['t-roll-pair','t-roll-horns','t-motor-r','t-motor-l']],
 ['腿部连接板',['t-cover-r','t-cover-l']],
 ['左右腿舵机组合',['r-pair','r-support','l-pair','l-support']],
 ['腿部连杆',['r-bearing','r-join','l-bearing','l-join']],
 ['脚部舵机连接',['r-prepare','r-plug','r-wire-a','r-shank','l-prepare','l-plug','l-wire-a','l-shank']],
 ['脚掌安装',['r-foot','r-small-bearing','r-axle','r-tighten','r-ankle-done','l-foot','l-small-bearing','l-axle','l-tighten','l-ankle-done']],
 ['腿部上端支架',['r-top-horn','l-top-horn','r-top-bearing','r-top-link','l-top-bearing','l-top-link']],
 ['腿部与底座连接',['r-wire-b','t-bearing-r','t-join-r','r-leg-done','l-wire-b','t-bearing-l','t-join-l','l-leg-done','t-complete']],
 ['腿部侧板',['final-thigh-first','final-route','final-thigh-second']],
 ['TPU脚垫',['r-sole','l-sole','legs-complete']],
 ['ID32支架',['head-yaw-wire','head-yaw-motor']],
 ['ID33支架',['head-core-horn-wire','head-bearings','head-roll-motor']],
 ['ID32与ID33连接',['head-core-join']],
 ['ID34与下巴',['head-platform','head-mouth-prepare','head-mouth-horn-wire','head-mouth-jaw','head-platform-fix','head-mouth-check']],
 ['头部支架与头盖',['head-servo-support','head-shell','head-shell-fix','head-eyes']],
 ['嘴部软垫',['head-lower-tape','head-lower-pad','head-upper-tape','head-upper-pad-check']],
 ['ID30与ID31颈部',['head-neck-pair','head-neck-plate','head-neck-join','head-neck-fix','head-neck-wire']],
 ['电池架与电路板',['final-battery','final-tray','final-board-mate','final-board-mount','final-power','final-buses']],
 ['上部支架',['final-body-shells']],
 ['上下组件连接',['final-head-join']],
];
const sourceById=new Map(Legacy.STEPS.map((s,i)=>[s.id,{step:s,index:i,chapter:Legacy.chapterFor(i)}]));
export const STEPS=[],CHAPTERS=[];
for(const [i,[name,ids]]of [...pages,['校准与完成',Legacy.STEPS.filter(s=>s.module===5).map(s=>s.id)]].entries()){
 const pdfPage=i<25?i+1:null,start=STEPS.length,id=pdfPage===1?'prepare':pdfPage?`guide-${pdfPage}`:'calibration';
 for(const action of ids){
  const source=sourceById.get(action);if(!source)throw Error(`Missing PDF source action: ${action}`);
  STEPS.push({...structuredClone(source.step),chapter:id,pdfPage,sourceIndex:source.index,
   video:source.chapter.video,videoStart:source.chapter.videoStart,sourceChapter:source.chapter.id});
 }
 const first=STEPS[start];CHAPTERS.push({id,name,pdfPage,start,end:STEPS.length-1,video:first.video,videoStart:first.videoStart,sourceStart:first.sourceStart,sourceEnd:STEPS.at(-1).sourceEnd});
}
if(STEPS.length!==Legacy.STEPS.length||new Set(STEPS.map(s=>s.id)).size!==STEPS.length)throw Error('PDF flow must retain every existing action exactly once');
export const chapterFor=index=>CHAPTERS.find(c=>index>=c.start&&index<=c.end)||CHAPTERS[0];
export const OVERVIEW_STEP=STEPS.findIndex(s=>s.id==='robot-complete');

const patch=(id,copy)=>Object.assign(STEPS.find(s=>s.id===id),copy);
for(const [side,a,b]of [['r',13,14],['l',23,24]]){
 patch(side+'-join',{title:'固定腿部连杆',short:'安装连杆',text:'先将连杆和轴承对准腿部舵机，再用4颗M2×6固定。脚踝舵机随后接线并安装。',check:'连杆已经固定后保持不动，随后把脚部舵机装到连杆另一端。主舵盘和输出轴保留。'});
 patch(side+'-wire-a',{title:`先连接ID${a}与ID${b}`,short:'连接脚部线缆',text:`先完成ID${a}与ID${b}两端线缆的连接，再固定脚部舵机。`+(side==='l'?'这一侧按另一条腿的镜像关系对应。':''),check:'第10页明确13↔14；另一侧为镜像对应。线长、具体端口和针脚仍待核。',caption:`先连接 ${a}↔${b} · 再固定`});
 patch(side+'-shank',{title:`安装脚部舵机ID${b}`,short:'装入脚部舵机',text:'保持已固定的连杆不动，把已接好线的脚部舵机对准另一端，再用两颗M2×6固定。',check:'先确认两端线缆已经连接，固定时不拉扯插头。主舵盘和输出轴保留。'});
 const reference=sourceById.get('t-motor-'+side);
 patch(side+'-wire-b',{title:'先连接腿部与底座线缆',short:'连接腿部总线',text:'按装配指南第13页先连接腿部与底座的线缆，留出关节余量，再把整条腿装到底座。',check:'总线端点、针脚与线长仍按对应硬件资料核对；模型只示意连接顺序。',caption:'先连接线缆 · 再安装整腿',video:reference.chapter.video,videoStart:reference.chapter.videoStart,sourceStart:reference.step.sourceStart,sourceEnd:reference.step.sourceEnd});
}
patch('head-yaw-wire',{text:'先给尚未装入支架的ID32接好线缆，再进行轴承和支架安装。',check:'按指南第16页，接线先于舵机装入支架；独立支架预装轴承不受这一顺序约束。'});
patch('head-yaw-motor',{text:'ID32已接好线缆。先在独立支架压入轴承，再装入ID32，以四颗M2×6固定。'});
patch('head-core-horn-wire',{text:'先拆下ID33副舵盘并保留原配螺丝，接好底部线缆，再安装支架与轴承。',check:'按指南第17页先接底部线。主舵盘与输出轴保留；线长与针脚仍待核。'});
patch('final-route',{title:'整理腿部线束',parts:['r_legWireA','r_legWireB','l_legWireA','l_legWireB','f_thighR'],text:'安装另一侧侧板前，整理腿部线缆，给关节留出活动余量。',check:'避开侧板压合面；原配螺丝与自攻螺丝的逐孔分配仍待核。'});
