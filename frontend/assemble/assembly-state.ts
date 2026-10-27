import type {ActorOptions} from './types.js';
import type {Pose} from './types.js';
import type {Chapter,Vector,Step,Actor,State} from './types.js';
import {STEPS as ANKLE_STEPS,ACTORS as ANKLE_ACTORS,snapshot as ankleSnapshot} from './ankle-base.js';
import {MESHES} from './mesh-spec.js';
import {LEG_MOUNTS} from './leg-mounts.js';
import {SERVO_IDS} from '../shared/servo-map.js';

export const CHAPTERS: Chapter[]=[
  {id:'right-ankle',name:'右脚踝',start:0,end:8,sourceStart:194,sourceEnd:248,video:'assets/reference-left-ankle.mp4'},
  {id:'left-ankle',name:'左脚踝',start:9,end:17,sourceStart:126,sourceEnd:194,video:'assets/reference-02m06-03m14.mp4'},
  {id:'right-leg',name:'右腿连接',start:18,end:24,sourceStart:324,sourceEnd:396,video:'assets/reference-left-leg.mp4'},
  {id:'left-leg',name:'左腿连接',start:25,end:31,sourceStart:248,sourceEnd:324,video:'assets/reference-right-leg.mp4'},
  {id:'finish',name:'双腿收尾',start:32,end:40,sourceStart:396,sourceEnd:496,video:'assets/reference-leg-finish.mp4'},
];
const localIds=['prepare','horn','plug','shank','foot','small-bearing','axle','tighten','ankle-done'];
const leftTimes:[number,number][]=[[194,198],[194,204],[204,212],[212,220],[220,236],[236,240],[240,244],[244,248],[244,248]];
const add=(a: Vector,b: Vector)=>a.map((v,i)=>v+b[i]!);
const transform=(v: Vector,side: string)=>[side==='r'?v[0]!-50:50-v[0]!,v[1]!+7,v[2]!-17.75];
export const STEPS: Step[]=[];
for(const side of ['r','l']){
  for(let i=0;i<9;i++){
    const s=ANKLE_STEPS[i]!,left=side==='l',referenceLeft=side==='r',parts=s.parts.map(id=>left?'l_'+id:id),servo=SERVO_IDS[left?'l_motor':'motor'];
    STEPS.push({...s,id:`${side}-${localIds[i]}`,chapter:left?'left-ankle':'right-ankle',parts,camera:transform(s.camera,side),target:transform(s.target,side),
      sourceStart:referenceLeft?leftTimes[i]![0]:s.sourceStart,sourceEnd:referenceLeft?leftTimes[i]![1]:s.sourceEnd,
      title:i===0?`准备${left?'左':'右'}脚踝零件`:i===1?`拆下${left?'左':'右'}脚踝 ID${servo} 副舵盘`:i===8?`${left?'左':'右'}脚踝装好了`:s.title,
      text:i===0?`准备已编号、已居中的 ID${servo} 舵机，以及这一侧的脚掌、小腿、轴承和踝轴。`:i===8?'可以旋转检查，再继续下一阶段。脚底软垫会在双腿收尾阶段安装。':s.text,
      caption:i===0||i===8?'':i===1?'只拆副舵盘 · 主舵盘保留':i===2?'对准接口，按压到位':i===3?'对孔 · M2×6 ×2':i===4?'固定脚掌 · M2×6 ×4':i===5?'沿轴向压入':i===6?'对齐轴承中心':'拧至螺丝头贴合',complete:i===8});
  }
}
function push(id: string,chapter: string,short: string,title: string,start: number,end: number,parts:string[],text: string,check: string,caption: string,duration=2.7){
  const side=chapter==='right-leg'?'r':chapter==='left-leg'?'l':null;
  const target=side?[side==='r'?-65:65,55,5]:[0,54,0];
  const delta=side?[side==='r'?210:-210,130,250]:[205,135,260];
  STEPS.push({id,chapter,short,title,sourceStart:start,sourceEnd:end,parts,text,check,caption,duration,target,camera:add(target,delta)});
}
for(const [side,chapter,t] of [['r','right-leg',[324,330,342,350,360,378,390,396]],['l','left-leg',[248,254,264,272,286,306,320,324]]] satisfies [string,string,(number)[]][]){
  const name=side==='r'?'右':'左',ids=`ID${SERVO_IDS[side+'_upperMotor']} / ID${SERVO_IDS[side+'_lowerMotor']}`,lower=SERVO_IDS[side+'_lowerMotor'];
  push(`${side}-pair`,chapter!,'对齐双舵机',`对齐${name}腿的两只舵机`,t![0]!,t![1]!,[`${side}_upperMotor`,`${side}_lowerMotor`],`核对 ${ids} 的主副盘和插座朝向。装支撑前，卸下 ID${lower} 副舵盘的固定螺丝，再取下副舵盘。`,`主舵盘和输出轴保留。${name}腿按各自镜像方向安装，不照搬画面左右。`,'先处理副盘 · 再装支撑',3.2);
  push(`${side}-support`,chapter!,'固定大腿支撑','固定双圆孔大腿支撑',t![1]!,t![2]!,[`${side}_support`,`${side}_supportScrew0`],'把白色双圆孔支撑贴合这对舵机，对齐四个固定位置，按视频拧入四颗 M2×6。',`确认 ID${lower} 副盘已拆、主盘保留；核对本侧主副盘与插座朝向，再逐孔固定。配合仍待实物核验。`,'M2×6 ×4 · 固定支撑',3.3);
  push(`${side}-bearing`,chapter!,'压入大轴承','压入连接脚踝的大轴承',t![2]!,t![3]!,[`${side}_lowerBearing`,`${side}_support`],'将 16×22×4 mm 大轴承对准支撑圆孔，沿轴向压到位。','轴承应坐正，再连接已经装好的脚踝。','沿轴向压入大轴承');
  push(`${side}-join`,chapter!,'连接已装脚踝',`接上${name}脚踝子组件`,t![3]!,t![4]!,[side==='r'?'shank':'l_shank',`${side}_joinScrew0`],'把已经完成的脚踝与小腿作为一个整体，移到大腿支撑的轴承位置，再固定四颗 M2×6。',`核对${name}腿主副盘、插座开口与镜像朝向；已有螺丝、踝轴与线缆随组件移动。`,'整体对齐 · M2×6 ×4',3.6);
  push(`${side}-wire-a`,chapter!,'插接腿内线束','插接可见的腿内总线',t![4]!,t![5]!,[`${side}_legWireA`,side==='r'?'wire':'l_wire'],'按视频插接并压紧可见的三针舵机线，留出关节活动需要的余量。','插座开口同侧是副盘侧，线弯不是判据。准确接口和针脚仍待核验。','插接线束 · 端点示意',3.0);
  push(`${side}-wire-b`,chapter!,'整理线束余量','整理线束并留出上端连接线',t![5]!,t![6]!,[`${side}_legWireB`],'整理环线，让线束留在机构外侧，并保留后续与身体相连的线端。','不要夹线，也不要根据三芯黑线的外观判断针脚定义。','留出活动余量 · 不夹线',2.6);
  push(`${side}-leg-done`,chapter!,`${name}腿连接完成`,`${name}腿连接部分完成`,t![6]!,t![7]!,[`${side}_support`,side==='r'?'foot':'l_foot'],'检查已连接的脚踝、双舵机支撑与线束，然后继续下一阶段。','上端连接件和脚底软垫还没有安装。','',1.2);STEPS.at(-1)!.complete=true;
}
push('r-top-horn','finish',"卸右腿副盘",`拆下右腿 ID${SERVO_IDS.r_upperMotor} 副舵盘`,413,428,['r_upperHorn','r_upperHornScrew'],`认准 ID${SERVO_IDS.r_upperMotor} 白色插座开口同侧，先卸中央固定螺丝，再取下副舵盘并保留。`,"主舵盘和输出轴保持安装，不拆动已固定的脚踝。","只拆副舵盘 · 主舵盘保留");
push('l-top-horn','finish',"卸左腿副盘",`拆下左腿 ID${SERVO_IDS.l_upperMotor} 副舵盘`,396,413,['l_upperHorn','l_upperHornScrew'],`认准 ID${SERVO_IDS.l_upperMotor} 白色插座开口同侧，先卸中央固定螺丝，再取下副舵盘并保留。`,"主舵盘和输出轴保持安装，不拆动已固定的脚踝。","只拆副舵盘 · 主舵盘保留");
push('r-top-bearing','finish','右连接件压轴承','先给右上端连接件压入轴承',428,438,['r_topLink','r_topBearing'],'在独立的上端连接件中压入大轴承，然后再把这一组件装到腿上。','先压轴承，再安装连接件；不要把这两步倒过来。','先在连接件中压入轴承');
push('r-top-link','finish','安装右连接件','固定右上端连接件与轴承',438,454,['r_topLink','r_topScrew0'],'把已压入轴承的连接件整体对齐上端位置，用四颗 M2×6 固定。',"核对右侧主副盘和插座朝向；连接件与轴承整体安装。左右按镜像，不能照搬画面左右。",'组件整体安装 · M2×6 ×4',3.4);
push('l-top-bearing','finish','左连接件压轴承','给左上端连接件压入轴承',454,464,['l_topLink','l_topBearing'],'在另一侧连接件中压入大轴承，保持镜像朝向。','左右连接件使用各自的真实网格。','镜像方向 · 先压轴承');
push('l-top-link','finish','安装左连接件','固定左上端连接件与轴承',464,474,['l_topLink','l_topScrew0'],'把另一侧的连接件与轴承整体装到位，用四颗 M2×6 固定。',"核对左侧主副盘和插座朝向；连接件与轴承整体安装。左右按镜像，不能照搬画面左右。",'组件整体安装 · M2×6 ×4',3.4);
push('r-sole','finish','固定右脚底软垫','安装右脚底软垫',474,486,['r_sole','r_soleScrew0'],'将软垫贴合脚底，按视频对齐四个孔，固定四颗 M2×6。','这是脚底软垫，不是稍后总装阶段的大腿外壳。','对准脚底 · M2×6 ×4',3.3);
push('l-sole','finish','固定左脚底软垫','安装左脚底软垫',486,496,['l_sole','l_soleScrew0'],'在另一只脚底安装软垫，按视频固定四颗 M2×6。','检查两只脚底与线束状态，然后进入身体与髋部装配。','对准脚底 · M2×6 ×4',3.3);
push('legs-complete','finish','双腿完成查看','双腿子组件装好了',490,496,['foot','l_foot','r_topLink','l_topLink','r_sole','l_sole'],'现在可以旋转查看两条腿，或回到任意阶段重新看。','当前阶段到 08:16；下一阶段安装身体髋部，之后再做头颈和电控总装。','',1.2);STEPS.at(-1)!.complete=true;
// Filming order used the opposite leg names; keep each clip with its PDF ID.
for(const [a,b]of [['r-top-bearing','l-top-bearing'],['r-top-link','l-top-link'],['r-sole','l-sole']] satisfies [string,string][]){
 const first=STEPS.find(s=>s.id===a)!,second=STEPS.find(s=>s.id===b)!;
 [first.sourceStart,second.sourceStart]=[second.sourceStart,first.sourceStart];
 [first.sourceEnd,second.sourceEnd]=[second.sourceEnd,first.sourceEnd];
}
for(const i of [17,24,31])Object.assign(STEPS[i]!,{target:[0,54,0],camera:[205,189,260]});

export const ACTORS: Record<string,Actor>={};
const clamp=(n: number)=>Math.min(1,Math.max(0,n));
const smooth=(n: number)=>{const t=clamp(n);return t*t*(3-2*t);};
const mix=(a: Vector,b: Vector,t: number)=>a.map((v,i)=>v+(b[i]!-v)*t);
const insert=(from: Vector,dock: Vector,p: number)=>p<.65?mix(from,add(dock,[0,0,18]),smooth(p/.65)):mix(add(dock,[0,0,18]),dock,smooth((p-.65)/.35));
const keyFor=(side: string,id: string)=>side==='r'?id:'l_'+id;
const ankleIds=Object.keys(ANKLE_ACTORS);
for(const side of ['r','l'])for(const [id,a] of Object.entries(ANKLE_ACTORS)){
  const key=keyFor(side,id),mesh=MESHES[key],isScrew=id.includes('Screw');
  ACTORS[key]={...a,kind:mesh?'mesh':id==='wire'?'cable':isScrew?'screw':id==='plug'?'plug':'horn',mesh:mesh?key:null,side,
    label:mesh?`${side==='r'?'右':'左'}${(id==='motor'?'舵机':id==='bearing'?'小轴承':mesh.sourceName.replace(/^[左右]/,''))} · ${mesh.sourceId.startsWith('P')?mesh.sourceId:id==='motor'?'ID'+SERVO_IDS[side==='r'?'motor':'l_motor']:'10×15×3'}`:`${side==='r'?'右':'左'}${a.label}`,
    end:mesh&&id!=='axle'?mesh.end:id==='axle'?[side==='r'?-31.7:31.7,26,-17.75]:transform(a.end,side),
    fastener:isScrew?(id==='axisScrew'?'M2.3x8':id==='hornScrew'?null:'M2x6'):null,
    chip:id==='shankScrew0'?'M2×6 ×2':id==='footScrew0'?'M2×6 ×4':id==='axisScrew'?'M2.3×8':id==='motor'?'舵机':id==='bearing'?'小轴承':mesh?.sourceName.replace(/^[左右]/,''),
    listGroup:isScrew&&id!=='axisScrew'&&id!=='hornScrew'?`${side}-${id.startsWith('shank')?'shank':'foot'}`:null,
    orientationZ:(id.startsWith('footScrew')?1:-1)*(side==='r'?1:-1)*Math.PI/2,spinAxis:[1,0,0]};
}
function actor(id: string,mesh: string|null,at: number,extra: ActorOptions={}){
  const spec=mesh?MESHES[mesh]:null,end=extra.end||spec?.end||[0,0,0];
  ACTORS[id]={kind:mesh?'mesh':'screw',mesh,step:at,end,start:add(end,extra.approach||[30,0,0]),label:spec?.sourceName||id,source:mesh?(spec!.sourceId.startsWith('P')?'真实 3MF 网格 · 配合待核验':'现有硬件网格'):'教学简模 · 孔位待核验',...extra};
}
function screws(prefix: string,at: number,positions: Vector[],side: string,chip='M2×6 ×4',vertical=false){
  positions.forEach((end,i)=>actor(prefix+i,null,at,{end,approach:vertical?[0,-24,0]:[side==='r'?28:-28,0,0],kind:'screw',label:`${side==='r'?'右':'左'}固定螺丝 ${i+1} · M2×6`,fastener:'M2x6',chip,listGroup:prefix,delay:.38+i*.1,orientationZ:vertical?Math.PI:side==='r'?-Math.PI/2:Math.PI/2,spinAxis:vertical?[0,1,0]:[1,0,0]}));
}
for(const side of ['r','l']){
  const r=side==='r',sign=r?-1:1,at=r?18:25,name=r?'右':'左';
  actor(`${side}_upperMotor`,`${side}_upperMotor`,at,{label:`${name}上端舵机 · ID${SERVO_IDS[side+'_upperMotor']}`,approach:[sign*20,12,22],color:'#242832'});
  actor(`${side}_lowerMotor`,`${side}_lowerMotor`,at,{label:`${name}中部舵机 · ID${SERVO_IDS[side+'_lowerMotor']}`,approach:[-sign*20,3,14],color:'#242832'});
  actor(`${side}_support`,`${side}_support`,at+1,{label:`${name}大腿支撑 · ${r?'P5-04':'P5-05'}`,color:'#f7f8fb',approach:[-sign*32,0,0]});
  actor(`${side}_lowerBearing`,`${side}_lowerBearing`,at+2,{label:`${name}大轴承 · 16×22×4`,color:'#b3bac8',approach:[-sign*30,0,0]});
  screws(`${side}_supportScrew`,at+1,[[sign*40,63,-24],[sign*40,80,-24],[sign*40,83,24],[sign*40,97,24]],side);
  screws(`${side}_joinScrew`,at+3,[[sign*32.5,61,-24.5],[sign*32.5,75,-24.5],[sign*32.5,61,-11],[sign*32.5,75,-11]],side);
  actor(`${side}_upperHorn`,null,at,{kind:'horn',label:`${name}上端副舵盘 · ID${SERVO_IDS[side+'_upperMotor']}`,source:'插座开口同侧 · 安装位示意',end:[sign*72,90,18],start:[sign*72,90,18],carriedBy:`${side}_upperMotor`,removeStep:r?32:33,tray:[sign*96,3,60]});
  actor(`${side}_upperHornScrew`,null,at,{kind:'screw',label:`${name}上端副舵盘中央原装螺丝`,source:'教学简模 · 原装规格待核',end:[sign*74,90,18],start:[sign*74,90,18],carriedBy:`${side}_upperMotor`,removeStep:r?32:33,tray:[sign*84,3,60],orientationZ:r?Math.PI/2:-Math.PI/2,spinAxis:[1,0,0]});
  actor(`${side}_topLink`,`${side}_topLink`,r?34:36,{label:`${name}上端连接件 · ${r?'P3-04':'P3-05'}`,color:'#3d4552',approach:[0,0,12],group:`${side}-top`});
  actor(`${side}_topBearing`,`${side}_topBearing`,r?34:36,{label:`${name}连接件大轴承`,color:'#b3bac8',approach:[-sign*28,0,0],group:`${side}-top`});
  screws(`${side}_topScrew`,r?35:37,[[sign*8,84,32],[sign*8,96,32],[sign*8,84,19],[sign*8,96,19]],side);
  actor(`${side}_sole`,`${side}_sole`,r?38:39,{label:`${name}脚底软垫 · ${r?'P1-03':'P1-04'}`,color:'#e5e9f1',approach:[0,1,55]});
  screws(`${side}_soleScrew`,r?38:39,[[sign*64,1.8,-30],[sign*34,1.8,-30],[sign*64,1.8,9],[sign*34,1.8,9]],side,'M2×6 ×4',true);
  const cableSource='线束教学示意 · 路径和端点待核验';
  actor(`${side}_legWireA`,null,at+4,{kind:'cable',label:`${name}腿内三芯线`,chip:'腿内三芯线',source:cableSource,end:[0,0,0],start:[0,0,0],points:[[sign*57,80,-6],[sign*72,92,0],[sign*73,108,23],[sign*61,108,31],[sign*55,95,29]]});
  actor(`${side}_legWireB`,null,at+5,{kind:'cable',label:`${name}腿上端预留线`,chip:'上端预留线',source:cableSource,end:[0,0,0],start:[0,0,0],points:[[sign*52,96,28],[sign*64,111,34],[sign*84,118,40],[sign*94,96,45],[sign*76,83,45]]});
}
export function chapterFor(index: number){return CHAPTERS.find(c=>index>=c.start&&index<=c.end)||CHAPTERS[0];}
function groupOffset(group: string,index: number,p: number){
  const spec:[number,number,Vector]=group==='r-ankle'?[18,21,[-65,0,45]]:group==='l-ankle'?[25,28,[65,0,45]]:group==='r-top'?[34,35,[35,20,30]]:[36,37,[-35,20,30]];
  if(index<spec[0]!||index>spec[1]!)return[0,0,0];
  if(group.endsWith('-ankle')&&index===spec[0])return spec[2]!.map(v=>v*smooth(p/.4));
  return index===spec[1]?spec[2]!.map(v=>v*(1-smooth(p/.35))):spec[2];
}
for(const [id,mount] of Object.entries(LEG_MOUNTS)){
 const a=ACTORS[id]!,old=[...a.end];a.end=[...mount.end];
 if(a.start)a.start=a.start.map((v,i)=>v+a.end[i]!-old[i]!);
 if(mount.rotation)a.rotation=[...mount.rotation];
 a.holeSource=mount.holeSource;
}
ACTORS.wire!.endpointPlugs=[false,true];ACTORS.l_wire!.endpointPlugs=[false,true];
const servoDock=(id: string,portIndex: number)=>{const a=ACTORS[id]!,port=a.servoPorts![portIndex]!;return a.end.map((n,i)=>n+port.position[i]!+port.normal![i]!*1.65);};
for(const side of ['r','l']){
 const right=side==='r',sign=right?-1:1,motor=right?'motor':'l_motor',plug=right?'plug':'l_plug';
 ACTORS[motor]!.servoPorts=[{position:[right?3:-3,8.5,10.8],normal:[0,0,1],tangent:[1,0,0],evidence:'教学接口；精确键位与针脚待核'}];
 ACTORS[plug]!.end=servoDock(motor,0);
 for(const kind of ['upper','lower']){const id=side+'_'+kind+'Motor';ACTORS[id]!.servoPorts=[-1,1].map(s=>({position:[s*5,6,MESHES[id]!.size[2]!/2+.8],normal:[0,0,1],tangent:[1,0,0],evidence:'双插座教学锚点；物理修订与电气针脚待核'}));}
 const outer=right?0:1,inner=1-outer,from=servoDock(side+'_lowerMotor',inner),to=servoDock(side+'_upperMotor',outer),lead=servoDock(side+'_upperMotor',inner);
 ACTORS[side+'_legWireA']!.points=[from,add(from,[0,0,10]),[sign*75,110,40],add(to,[0,0,10]),to];
 ACTORS[side+'_legWireA']!.dockNormal=[0,0,1];
 ACTORS[side+'_legWireB']!.points![0]=lead;ACTORS[side+'_legWireB']!.points![1]=add(lead,[0,0,10]);
}
export function snapshot(step: number,progress=1){
  const index=Math.min(STEPS.length-1,Math.max(0,Math.trunc(step))),p=clamp(progress),result: State={};
  for(const side of ['r','l']){
    const first=side==='r'?0:9,local=Math.min(8,Math.max(0,index-first)),base=ankleSnapshot(local,index>first+8?1:p),offset=groupOffset(`${side}-ankle`,index,p);
    for(const id of ankleIds){
      const key=keyFor(side,id),a=ACTORS[key]!,pose=base[id]!,delta=a.end.map((v,i)=>v-transform(ANKLE_ACTORS[id]!.end,side)[i]!);
      let position=add(transform(pose.position,side),delta),status=pose.status,visible=index>=first&&pose.visible;
      if(index>=first+9&&id!=='horn'&&id!=='hornScrew')position=add(position,offset);
      if(id==='wire'){
        const start=result[keyFor(side,'plug')]!.position.map((n,i)=>n-offset[i]!),sign=side==='r'?-1:1,connect=side==='r'?22:29,t=index>connect?1:index===connect?smooth(p):0;
        const free=[sign*46,9,39],end=insert(free,servoDock(side+'_lowerMotor',side==='r'?0:1),t);
        result[key]={...pose,visible,position:offset,points:[start,add(start,[0,0,15]),[sign*76,43+30*t,28],add(end,[0,0,12]),end]};
      }else result[key]={...pose,visible,position,status};
    }
  }
  for(const [id,a] of Object.entries(ACTORS)){
    if(id in result)continue;
    let visible=index>=a.step!,position=[...a.end],turn=0,status=visible?'installed':'waiting',opacity=visible?1:0;
    if(index===a.step){const seatFirst=id.endsWith('_support')||id.endsWith('_sole'),t=smooth(a.delay===undefined?(seatFirst?p/.35:p):(p-a.delay)/(1-a.delay));position=mix(a.start!,a.end,t);turn=a.kind==='screw'?t*5:0;status=p>=.999?'installed':'moving';opacity=a.kind==='screw'?clamp((p-.2)*5):1;}
    if(a.carriedBy&&index===a.step){position=add(a.end,result[a.carriedBy]!.position.map((v,i)=>v-ACTORS[a.carriedBy!]!.end[i]!));turn=0;opacity=1;}
    if(a.removeStep!==undefined&&index>=a.removeStep){const t=index===a.removeStep?smooth(a.kind==='screw'?p/.48:(p-.52)/.48):1;position=mix(a.end,a.tray!,t);status=t>=.999?'removed':'moving';turn=a.kind==='screw'?-6*t:0;}
    if(a.group){position=add(position,groupOffset(a.group,index,p));const install=a.group==='r-top'?35:37;if(index<install&&visible)status='prepared';else if(index===install&&p<1)status='moving';}
    const pose:Pose={visible,position,turn,status,opacity};
    if(a.rotation)pose.rotation=[...a.rotation];
    if(a.kind==='cable'){pose.points=a.points!.map((v,i)=>index===a.step&&i===4?add(v,[0,0,22*(1-smooth(p))]):[...v]);if(a.dockNormal)pose.points[pose.points.length-2]=pose.points.at(-1)!.map((n,i)=>n+a.dockNormal![i]!*10);}
    result[id]=pose;
  }
  return result;
}
