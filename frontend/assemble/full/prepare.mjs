export const SERVO_IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34];
export const CHAPTERS=[{id:'prepare',name:'准备与编号',start:0,end:8,sourceStart:0,sourceEnd:126}];
const rows=[
 ['intro','先看完整机器人','认识整机与组装路线',0,3,[],'先看整机，再依次完成准备、双腿、身体、头颈、总装与校准。','这是独立教学原型。可以随时用“整机预览”回到完成态。',''],
 ['boards','临时插合两板','临时插合 UNO Q 与扩展板',3,13,['p_uno','p_extension'],'对准两块板的排针和排母，沿同一方向压合。两块板在教程中是两个独立对象。','板形和接口是教学简模；实物板卡的方向、修订与间距需要核对。','对准排针与排母，压合'],
 ['battery','连接测试电池','插接临时供电电池',13,21,['p_battery','p_powerCable'],'按原片插入电池接头，为接下来的单舵机配置准备供电。','视频提示注意极性；本原型不依据外形推定真实针脚或极性。','电源插接 · 方向待实物核验'],
 ['servo','连接一只舵机','一次只连接一只待配置舵机',21,33,['p_motor','p_servoCable'],'先把三芯线插进舵机，再把另一端插到板上。当前只连接这一只测试舵机。','白色插座开口同侧是副舵盘，另一侧是主舵盘。主盘和输出轴始终不拆。','单只舵机 · 插接到位'],
 ['usb','开机并接电脑','开机并接入 Type-C',33,49,['p_usb','p_uno'],'按视频打开电源，再用 Type-C 线连接电脑。','本页只演示连接顺序，不会启动或连接真实设备。','开机 · 接 Type-C'],
 ['app','导入运行应用','在 Arduino App Lab 导入并运行应用',49,89,['p_uno'],'在自己的电脑中导入 XGO Duck 应用并运行。原片没有完整展示首次环境安装。','本步提供视频对照与教学说明；这里没有实际 App Lab 会话。','应用启动 · 教学说明'],
 ['scan','扫描并居中','进入 Servo setup，扫描并居中当前舵机',89,105,['p_motor'],'打开自己的设备配置地址，进入 Servo setup。Scan all IDs → 找到单只后 Stop scan → Move to 2047 → Write。','设备 IP 和主机名因环境不同，不照抄原片的固定地址。','Scan → Stop → 2047 → Write'],
 ['id','写入参数和ID','写入参数，再设置目标 ID',105,115,['p_motor'],'视频参数为 KP=5、KD=20，点击 Write；填写本只目标 ID，执行 Change ID 并确认成功。','配置时的桌面摆放不代表机械安装朝向。当前网页不向舵机发送参数。','KP 5 · KD 20 · Change ID'],
 ['all-ids','逐只完成15个ID','逐一完成十五只舵机的编号与居中',115,126,['p_motor'],'依次完成 10–14、20–24、30–34。每次只配置一只。之后的机械安装从已编号、已居中的状态开始。','副舵盘：ID30、31保留；ID10、20、32可选拆，本教程保留；其余按安装步骤拆除。主盘全部保留。','先编号与居中，再按 ID 处理副盘'],
];
export const STEPS=rows.map(([id,short,title,sourceStart,sourceEnd,parts,text,check,caption])=>({id:`prepare-${id}`,chapter:'prepare',short,title,sourceStart,sourceEnd,parts,text,check,caption,duration:2.6,camera:[160,160,190],target:[0,18,5],software:sourceStart>=49,servoIds:id==='all-ids'?SERVO_IDS:undefined,overview:id==='intro'}));
const ports=[{label:'三芯舵机口',position:[25,4,15],kind:'servo'},{label:'电池接口',position:[-26,4,15],kind:'power'},{label:'扩展板排针A',position:[-24,-3,0],kind:'male-header'},{label:'扩展板排针B',position:[24,-3,0],kind:'male-header'}];
export const ACTORS={
 p_uno:{kind:'board',boardType:'uno-q',label:'Arduino UNO Q · 教学简模',source:'独立板卡简模 · 接口未实物核验',size:[68,2,53],end:[-35,10,-5],start:[-35,10,-5],step:1,ports:[{label:'USB-C',position:[-34,3,0],kind:'usb-c',direction:[-1,0,0]},{label:'UNO排母A',position:[-24,3,0],kind:'female-header'},{label:'UNO排母B',position:[24,3,0],kind:'female-header'}]},
 p_extension:{kind:'board',boardType:'luwu-extension',label:'陆吾扩展板 · 教学简模',source:'独立板卡简模 · 接口未实物核验',size:[68,2,53],end:[-35,22,-5],start:[-35,55,-5],step:1,ports},
 p_battery:{kind:'battery',label:'临时供电电池 · 教学简模',source:'电池尺寸和接头待实物核验',size:[36,18,66],end:[45,12,-15],start:[68,12,-15],step:2},
 p_motor:{kind:'mesh',sourceId:'right_knee_0',label:'待配置的单只舵机',source:'复用现有舵机网格',color:'#242832',end:[40,22,44],start:[75,22,44],step:3,servoPorts:[{position:[3,8.5,10.8],normal:[0,0,1]}]},
 p_powerCable:{kind:'cable',cableType:'power',endpointPlugs:[false,true],label:'测试电池电源线',source:'走线和极性仅作教学示意',end:[0,0,0],step:2,points:[[45,15,-35],[22,30,-45],[-61,26,44],[-61,26,15.15]]},
 p_servoCable:{kind:'cable',label:'单只舵机测试线',source:'插接与路径示意 · 针脚未核验',end:[0,0,0],step:3,points:[[40,30,54],[40,38,70],[-10,30,55],[-10,26,32],[-10,26,13.7]]},
 p_usb:{kind:'cable',cableType:'usb-c',label:'Type-C 连接线 · 教学简模',source:'仅演示电脑连接方向',end:[0,0,0],step:4,points:[[-75.65,13,-5],[-98,13,-5],[-105,9,20],[-90,5,62]]},
};
const smooth=p=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};
export function snapshot(index,progress=1){
 const result={};
 for(const [id,a] of Object.entries(ACTORS)){
  const t=index===a.step?smooth((id==='p_battery'||id==='p_motor')?progress/.35:progress):1,visible=index>=a.step&&index>0;
  const start=a.start||a.end,position=a.end.map((v,i)=>start[i]+(v-start[i])*t);
  result[id]={visible,position,turn:0,status:visible?(index===a.step&&progress<1?'moving':'installed'):'waiting',opacity:visible?1:0,...(a.points?{points:a.points.map(v=>[...v])}:{})};
 }
 const plugProgress=at=>index>at?1:index===at?smooth((progress-.45)/.55):0;
 result.p_powerCable.points[0]=result.p_battery.position.map((n,i)=>n+[0,3,-20][i]);
 result.p_powerCable.points.at(-1)[2]+=18*(1-plugProgress(2));
 const motorPort=ACTORS.p_motor.servoPorts[0];
 result.p_servoCable.points[0]=result.p_motor.position.map((n,i)=>n+motorPort.position[i]+motorPort.normal[i]*1.65);
 result.p_servoCable.points[1]=result.p_servoCable.points[0].map((n,i)=>n+motorPort.normal[i]*16);
 result.p_servoCable.points.at(-1)[2]+=16*(1-plugProgress(3));
 result.p_usb.points[0][0]-=18*(1-plugProgress(4));
 return result;
}
