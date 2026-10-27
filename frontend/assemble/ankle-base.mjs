export const STEPS = [
  { title: '先认清这几件', short: '准备零件', sourceStart:126, sourceEnd:130, duration:1,
    text:'这一段组装一只脚踝。先准备已编号、已居中的舵机，以及脚掌、小腿连接件、轴承和踝轴。',
    check:'先看白色插座开口：同侧是副舵盘，另一侧是主舵盘。编号与居中应在安装前完成。', parts:['motor','foot','shank','bearing','axle'],camera:[137,101,171],target:[5,34,8] },
  { title:'拆下副舵盘', short:'拆副舵盘',sourceStart:126,sourceEnd:138,duration:3.4,
    text:'认准白色插座开口同侧，先卸副舵盘中央固定螺丝，再沿轴向取下副舵盘并保留。',
    check:'主舵盘和输出轴始终不拆。原装固定螺丝不以自攻螺丝替代。',parts:['motor','horn','hornScrew'],camera:[-112,66,108],target:[-3,25,0]},
  { title:'插好舵机线',short:'插入线缆',sourceStart:138,sourceEnd:148,duration:2.8,
    text:'将插头的端子孔对准接口凸起，沿接口方向插入，再按压到位。',
    check:'以插座开口朝向识别副盘侧，不以线缆弯曲方向判断。插头键位与针脚仍需核对。',parts:['motor','plug','wire'],camera:[98,61,123],target:[0,28,5]},
  { title:'固定小腿连接件',short:'固定小腿',sourceStart:148,sourceEnd:162,duration:3.2,
    text:'将白色小腿连接件贴合舵机，对齐安装孔，再拧入两颗 M2×6 沉头自攻螺丝。',
    check:'连接件长端朝上；核对主副盘侧和插座开口。先对孔，不用螺丝硬拉歪件。',parts:['shank','shankScrew0','shankScrew1'],camera:[122,70,111],target:[5,35,0]},
  { title:'把舵机装入脚掌',short:'装入脚掌',sourceStart:162,sourceEnd:176,duration:3.6,
    text:'把舵机和小腿连接件组成的模块放入脚掌，按视频固定四颗 M2×6 沉头自攻螺丝。',
    check:'先核对主副盘、插座和脚掌朝向。左右腿按镜像安装，线缆留在外侧。',parts:['foot','footScrew0','footScrew1','footScrew2','footScrew3'],camera:[-115,72,125],target:[0,27,0]},
  { title:'压入小轴承',short:'压入轴承',sourceStart:176,sourceEnd:181,duration:2.4,
    text:'将小轴承对准脚掌的圆形安装孔，沿轴向压入。',
    check:'轴承要坐正，中心孔与连接件同轴。型号按清单对应 10×15×3 mm。',parts:['bearing','foot'],camera:[130,62,96],target:[9,26,0]},
  { title:'对齐并装入踝轴',short:'装入踝轴',sourceStart:181,sourceEnd:188,duration:2.6,
    text:'对齐中间圆孔，将打印的踝轴放到轴承中心，再把 M2.3×8 自攻螺丝手动旋入。',
    check:'踝轴用了现有 3MF 网格；这里的定位经过展示调整，还没有验证实物配合。',parts:['axle','bearing','axisScrew'],camera:[137,64,92],target:[10,25,0]},
  { title:'拧紧并检查',short:'固定检查',sourceStart:188,sourceEnd:194,duration:3.2,
    text:'沿轴向拧入 M2.3×8 螺丝，直到螺丝头贴合表面，再检查脚踝连接。',
    check:'视频要求螺丝头贴合、末端从另一侧伸出。原型只展示动作，不模拟实际扭矩或公差。',parts:['axisScrew','axle'],camera:[121,73,121],target:[4,30,0]},
  { title:'这一只脚踝装好了',short:'完成查看',sourceStart:188,sourceEnd:194,duration:1.2,
    text:'现在可以转到背面看连接位置，或回到任意步骤重看。另一只脚踝按视频做镜像装配。',
    check:'这段尚未安装脚底软垫；视频在后面的双腿阶段才安装。',parts:['motor','foot','shank','bearing','axle'],camera:[120,88,148],target:[0,28,5]},
];

export const ACTORS = {
  motor:{label:'舵机 · ID24',source:'现有辅助网格',color:'#242832',end:[0,26.5,0],start:[0,26.5,0],step:0},
  foot:{label:'脚掌 · P2-03',source:'真实 3MF 网格',color:'#f7ce3c',end:[1.17,14.98,6.78],start:[1.17,14.98,61.78],step:4},
  shank:{label:'小腿连接件 · P6-04',source:'真实 3MF 网格',color:'#f7f8fb',end:[13.52,41.47,-.01],start:[48,44,0],step:3},
  bearing:{label:'小轴承 · 10×15×3',source:'现有辅助网格',color:'#b3bac8',end:[16.7,19,0],start:[48,19,0],step:5},
  axle:{label:'踝轴 · P2-05',source:'真实网格 · 定位示意',color:'#f7ce3c',end:[18.3,19,0],start:[48,19,0],step:6},
  horn:{label:'拆下的副舵盘',source:'插座开口同侧 · 拆盘保留轴头',color:'#303543',end:[-45,3,30],start:[-15.6,19,0],step:1},
  hornScrew:{label:'副舵盘中央原装螺丝',source:'原装固定螺丝 · 规格待核',color:'#a7afbd',end:[-32,3,30],start:[-17.2,19,0],step:1},
  plug:{label:'三针舵机插头',source:'新增教学示意',color:'#e7e9ef',end:[3,35,11.8],start:[3,35,39],step:2},
  wire:{label:'三芯舵机线',source:'新增教学示意 · 路径未核验',color:'#242a36',end:[3,35,11.8],start:[3,35,39],step:2},
  shankScrew0:{label:'小腿固定螺丝 1 · M2×6',source:'新增教学示意 · 孔位未核验',end:[18.0,31.3,7.2],start:[43,31.3,7.2],step:3},
  shankScrew1:{label:'小腿固定螺丝 2 · M2×6',source:'新增教学示意 · 孔位未核验',end:[18.0,31.3,-7.2],start:[43,31.3,-7.2],step:3},
  footScrew0:{label:'脚掌固定螺丝 1 · M2×6',source:'新增教学示意 · 孔位未核验',end:[-20.3,25,6],start:[-47,25,6],step:4},
  footScrew1:{label:'脚掌固定螺丝 2 · M2×6',source:'新增教学示意 · 孔位未核验',end:[-20.3,25,-6],start:[-47,25,-6],step:4},
  footScrew2:{label:'脚掌固定螺丝 3 · M2×6',source:'新增教学示意 · 孔位未核验',end:[-20.3,13,6],start:[-47,13,6],step:4},
  footScrew3:{label:'脚掌固定螺丝 4 · M2×6',source:'新增教学示意 · 孔位未核验',end:[-20.3,13,-6],start:[-47,13,-6],step:4},
  axisScrew:{label:'踝轴固定螺丝 · M2.3×8',source:'新增教学示意 · 配合未核验',end:[21.0,19,0],start:[42,19,0],step:6},
};

const clamp = n => Math.min(1,Math.max(0,n));
const smooth = n => { const v=clamp(n);return v*v*(3-2*v); };
const mix = (a,b,t) => a.map((v,i)=>v+(b[i]-v)*t);
export function snapshot(step,progress=1) {
  const index=Math.min(STEPS.length-1,Math.max(0,Math.trunc(step)));
  const p=clamp(progress);
  const result={};
  for (const [id,a] of Object.entries(ACTORS)) {
    let visible=true,position=[...a.end],turn=0,status='installed',opacity=1;
    if (index===0) {
      const layout={foot:[39,13,16],shank:[-30,46,-14],bearing:[36,12,-29],axle:[40,5,-11]};
      position=layout[id]||[...a.start];
      visible=['motor','foot','shank','bearing','axle','horn','hornScrew'].includes(id);
      status=id==='motor'?'installed':'prepared';
    } else if (id==='motor') {
      position=[...a.end];
    } else if (id==='horn'||id==='hornScrew') {
      status='removed';
      if (index===1) {
        const t=id==='hornScrew'?smooth(p/.48):smooth((p-.52)/.48);
        position=mix(a.start,a.end,t);turn=id==='hornScrew'?-t*6:0;
        status=t>=.999?'removed':'moving';
      }
    } else if (index<a.step) {
      visible=false;position=[...a.start];status='waiting';opacity=0;
    } else if (index===a.step) {
      let t=smooth(p);
      if(id==='shank')t=smooth(p/.45);
      if(id==='foot')t=smooth(p/.4);
      if(id==='axle')t=smooth(p/.5);
      if (id.startsWith('shankScrew'))t=smooth((p-.48)/.52);
      if (id.startsWith('footScrew'))t=smooth((p-.44-Number(id.at(-1))*.08)/.32);
      if (id==='axisScrew')t=smooth((p-.55)/.45)*.45;
      position=mix(a.start,a.end,t);
      turn=id.includes('Screw')?t*5:0;
      status=(id==='axisScrew'||p<.999)?'moving':'installed';
      opacity=id.includes('Screw')?clamp((p-.2)*5):1;
    }
    if (id==='axisScrew'&&index===7) {
      const t=.45+.55*smooth(p);position=mix(a.start,a.end,t);turn=t*7;
      status=p>=.999?'installed':'moving';
    }
    result[id]={position,turn,visible,opacity,status};
  }
  return result;
}
