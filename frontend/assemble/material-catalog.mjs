import {ACTORS,STEPS,CHAPTERS,snapshot} from './hardware-state.mjs';

const BOM='https://github.com/LuwuDynamics/xgoduck_hardware/blob/master/docs/BOM.md';
const GUIDE='https://github.com/LuwuDynamics/xgoduck_hardware/blob/master/Assembly_Guide.pdf';
const clean=s=>(s||'').replace(/ · (已确认.*|教学简模.*)$/,'');
const fasteners={
 'M2x6':['M2×6 沉头平尾自攻螺丝','直径 2 mm × 长 6 mm；沉头、平尾、自攻螺纹。'],
 'M2.3x8':['M2.3×8 平顶圆头平尾自攻螺丝','直径 2.3 mm × 长 8 mm；顶面平、侧面圆，平尾、自攻螺纹。'],
 'M3x16':['M3×16 圆头机丝螺丝','直径 3 mm × 长 16 mm；顶部略鼓，机丝螺纹。螺距、批头规格未提供。'],
 'M2.3x4':['M2.3×4 大腿外壳螺丝（原片）','原片标注直径 2.3 mm × 长 4 mm；头型和螺纹仍需核对。']
};
export function materialFor(id){
 const a=ACTORS[id];if(!a)throw Error('未知零件 '+id);
 let name=clean(a.label),spec='',note='',source=GUIDE,short=name;
 if(a.servoPorts){
  const ids=[...a.label.matchAll(/ID\s*(\d+)/g)].map(m=>m[1]);
  name=id==='p_motor'?'待编号的单只舵机':id==='h_mouthMotor'?'嘴部舵机 · 官方 ID34':`舵机 · ID${ids[0]||'待核对'}`;
  short=id==='p_motor'?'待编号舵机':id==='h_mouthMotor'?'嘴部 · ID34':`舵机 ID${ids[0]||'待核对'}`;
  spec='飞特 HD-1910-C001 / HD1910M；串行总线舵机，机身 34×20×23 mm。';source=BOM;
  note=id==='p_motor'?'整机共 15 只：ID10–14、20–24、30–34；每次只接 1 只配置。':id==='h_mouthMotor'?'装配指南第1、19页：嘴部ID34；安装配合另行核对。':/候选/.test(a.label)?'这个安装位置与编号的对应仍按教程候选记录，需对照原片和实物。':'';
 }else if(a.fastenerRole==='pending'){
  name='侧板固定件';short=name;spec='M2.3×4 自攻螺丝＋副舵盘原配螺丝。';note='指南第14页标注2颗，逐侧数量和两处固定点的规格分配待核；原配件拆下保留复用。';
 }else if(fasteners[a.fastener]){[name,spec]=fasteners[a.fastener];short=name.split(' ')[0];source=BOM;
  if(a.fastener==='M2.3x4'){note='原片为 M2.3×4，官方 BOM 列 M2.3×8；两者长度不同，不能混用，需核对实际外壳与配套螺丝。';const at=STEPS.findIndex(s=>s.parts.includes(id)),c=CHAPTERS.find(c=>at>=c.start&&at<=c.end);source=new URL(c.video,import.meta.url).href+'#t='+Math.max(0,STEPS[at].sourceStart-c.videoStart);}
 }
 else if(a.kind==='screw'){name=clean(a.label);short='原装中央螺丝';spec='随舵机的原装螺丝，拆下后保留。';note='原件的具体规格尚未核对，不按普通 M2×6 补配。';}
 else if(a.kind==='board'){
  const uno=a.boardType==='uno-q';name=uno?'Arduino UNO Q':'陆吾 UNO Q 扩展板';short=name;
  spec=uno?'UNO Q 主控板 ×1；官方支持 2 GB / 4 GB 两种版本。':'对应 UNO Q 的成品扩展板 ×1；PCB 约 68.55×53.38 mm，含供电、舵机接口和 IMU。';
  note=uno?'需选 UNO Q，不能只按“Arduino UNO”名称替换。':'接线前核对板卡版本与匹配接头；旧版接口修订需按官方说明核对。';source=BOM;
 }else if(a.kind==='battery'){
  name=id==='p_battery'?'临时供电用电池组':'电池组';short=name;
  spec='原 BOM：18650 电池组“8.4 V”，容量 >2500 mAh、放电倍率 >3C，XH2.54 接头。';
  note='准备与总装可复用同一组电池，不是额外两组。实际电池配置、配套充电器、板端接头及极性仍需核对。';source=BOM;
 }else if(a.kind==='cable'&&a.cableType==='usb-c'){
  name='USB 数据线 · UNO Q 端 Type-C';short='Type-C 数据线';spec='另一端匹配电脑接口；选能传输数据的线。';note='现有 USB 线模型为连接方向示意。';source=BOM;
 }else if(a.kind==='cable'&&a.cableType==='power'){
  name=id==='p_powerCable'?'测试电池电源线':'电池电源线';short=name;
  spec='电池配套两芯电源引线；电池端按官方 XH2.54 标注核对。';
  note='板端适配、线长、线径和极性尚未核对；不套用三芯舵机线规格。';source=BOM;
 }else if(a.kind==='cable'){
  name=clean(a.label).split(' · ')[0];short=name;
  spec='AMP2.0-3P · 三芯双头线 · 2.0 mm 间距；线长待核。';
  note='三根长线的对应编号与长度待核，不能把通用供货规格当作每个位置的要求。模型中的线弯不代表实物线长；针脚与适配另核。';source=GUIDE;
 }else if(a.kind==='plug'){
  spec=/power/i.test(id)?'电池电源线自带接头，不另算一条线。':'三芯舵机线自带插头，不另算一条线。';note='接头键位与实际针脚需按匹配硬件资料核对。';
 }else if(a.kind==='horn'){spec=a.label.includes('主舵盘')?'主舵盘始终保留，不拆。':'插座开口同侧为副舵盘；仅按本只 ID 的步骤拆除，拆后保留。';}
 else if(/bearing/i.test(id)){
  const small=['bearing','l_bearing'].includes(id);const size=small?'10×15×3':'16×22×4';
  spec=`轴承 ${size} mm，依次为内径 × 外径 × 宽。`;short=`${small?'小':'大'}轴承 ${size}`;
  note='防尘盖、密封、游隙及具体供应商型号未提供。';source=BOM;
 }else if(a.kind==='adhesive'){name='嘴部软垫用双面胶';short='双面胶';spec='用于把嘴部软垫贴到对应结构件。';note='胶型、厚度和轮廓未给定；按实际软垫和原片核对。';}
 else{
  const code=/P\d+-\d+/.exec(name)?.[0];short=name;
  spec=/(sole|Pad)/.test(id)?'TPU 柔性打印件，按左右侧或上下嘴区分。':'3D 打印结构件，按名称、编号和左右侧取件。';
  if(code)spec=`零件编号 ${code}；${spec}`;
  if(/候选/.test(name))note='当前名称或对应位置仍是教程候选，需与原片、实物核对。';
 }
 return{id,ids:[id],name,short,spec,note,source,count:1,fastener:a.fastener,color:a.color||'#9ba7b9',kind:a.kind};
}
function group(ids,reused=[]){
 const rows=[],seen=new Set();
 for(const id of ids){if(seen.has(id))continue;const a=ACTORS[id],m=materialFor(id);
  const prefix=/\d+$/.test(id)&&a.kind==='screw'&&a.fastener?id.replace(/\d+$/,''):null;
  const siblings=(a.listGroup?Object.keys(ACTORS).filter(k=>ACTORS[k].listGroup===a.listGroup):prefix?Object.keys(ACTORS).filter(k=>k.replace(/\d+$/,'')===prefix&&ACTORS[k].kind==='screw'&&ACTORS[k].fastener===a.fastener&&ACTORS[k].step===a.step):[id]).filter(k=>ACTORS[k].hardwareStatus!=='pending-step-assignment');
  m.ids=siblings;m.count=siblings.length;
  if(/^t_yawScrew/.test(id)){m.name=(id.includes('R')?'右':'左')+'连接件固定螺丝 · M2×6';m.quantity='数量待核对';m.note='原片左右合计 8 颗；逐侧数量仍待核对。模型每侧 4 颗仅作示意。';}
  if(/^f_boardScrew/.test(id))m.note='原片需 4 颗；当前模型只有 2 处近共轴孔可示意，另外 2 处孔位仍待核对。';
  if(a.fastenerRole==='pending'){m.fastener=null;m.quantity='数量待核对';}
  if(reused.includes(id)){m.reused=true;m.quantity='数量待核对';m.note='拆下保留的副舵盘原配螺丝；复用件来源为对应舵机候选，固定孔与逐侧数量待核，不计为新增自攻螺丝。';}
  m.quantity??=`×${m.count}`;siblings.forEach(k=>seen.add(k));rows.push(m);
 }
 const combined=[];
 for(const row of rows){const existing=row.fastener&&row.quantity!=='数量待核对'?combined.find(m=>m.fastener===row.fastener&&m.quantity!=='数量待核对'):null;
  if(existing){existing.ids=[...new Set([...existing.ids,...row.ids])];existing.count=existing.ids.length;existing.quantity=`×${existing.count}`;if(row.note&&!existing.note.includes(row.note))existing.note+=' '+row.note;}
  else combined.push(row);
 }return combined;
}
export function stepMaterials(index){const s=STEPS[index];return group([...s.parts,...(s.reusedFasteners||[])],s.reusedFasteners||[]);}
export function chapterMaterials(chapter){
 const before=chapter.start? snapshot(chapter.start-1,1):{},after=snapshot(chapter.end,1),ids=[];
 for(const[id,pose]of Object.entries(after)){
  const a=ACTORS[id];if(!pose.visible||before[id]?.visible||['horn','plug'].includes(a.kind)||a.kind==='screw'&&!a.fastener)continue;
  ids.push(id);
 }
 const chapterSteps=STEPS.slice(chapter.start,chapter.end+1),reused=chapterSteps.flatMap(s=>s.reusedFasteners||[]);
 ids.push(...chapterSteps.flatMap(s=>s.parts.filter(id=>ACTORS[id].fastenerRole==='pending')),...reused);
 const rows=group(ids,reused);
 if(chapter.id==='prepare'){const motor=rows.find(m=>m.id==='p_motor');if(motor){motor.name='待编号总线舵机';motor.count=15;motor.quantity='×15';}}
 if(rows.length)return rows;
 const complete=snapshot(STEPS.length-1,1),all=Object.keys(complete).filter(id=>complete[id].visible&&complete[id].status!=='removed');
 return[{id:'assembled-robot',ids:all,name:'已组装的机器鸭',short:'机器鸭整机',count:1,quantity:'×1',kind:'assembly',spec:'使用前面已组装的整机，进行本章校准与检查。',note:'本章不另取新的零件。',source:GUIDE}];
}
