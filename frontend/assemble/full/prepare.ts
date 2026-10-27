import type {} from '../types.js';
import type {Chapter,Step,Port,Actor,State} from '../types.js';
export const SERVO_IDS=[10,11,12,13,14,20,21,22,23,24,30,31,32,33,34];
export const CHAPTERS: Chapter[]=[{id:'prepare',name:'准备与编号',start:0,end:8,sourceStart:0,sourceEnd:126}];
const rows: [string,string,string,number,number,string[],string,string,string][]=[
 ['intro','先看完整机器人','认识整机与组装路线',0,3,[],'先看整机，再依次完成准备、双腿、身体、头颈、总装与校准。','从“舵机准备”完成编号。可以随时用“整机预览”回到完成态。',''],
 ['boards','临时插合两板','临时插合 UNO Q 与扩展板',3,13,['p_uno','p_extension'],'对准两块板的排针和排母，沿同一方向压合。两块板在教程中是两个独立对象。','板形和接口是教学简模；实物板卡的方向、修订与间距需要核对。','对准排针与排母，压合'],
 ['battery','连接测试电池','插接临时供电电池',13,21,['p_battery','p_powerCable'],'按原片插入电池接头，为接下来的单舵机配置准备供电。','视频提示注意极性；本原型不依据外形推定真实针脚或极性。','电源插接 · 方向待实物核验'],
 ['servo','连接一只舵机','一次只连接一只待配置舵机',21,33,['p_motor','p_servoCable'],'先断开 USB 和电池供电，再将当前一只舵机连接到板上。','换接前先停机并断开 USB 与电池。白色插座同侧是副舵盘，另一侧是主舵盘；主盘和输出轴始终不拆。','单只舵机 · 插接到位'],
 ['usb','开机并接电脑','开机并接入 Type-C',33,49,['p_usb','p_uno'],'按视频打开电源，再用 Type-C 线连接电脑，等待 UNO Q 启动。','USB 是数据连接；拔掉它不代表电池已经断开。','开机 · 接 Type-C'],
 ['app','检查运行应用','准备好 Arduino App Lab 与 Duck OS',49,89,['p_uno'],'首次使用按厂商指引完成 App Lab 安装、Duck OS 烧录和 Wi-Fi 配置。已有系统直接打开“舵机准备”检测。','连接引导包含软件入口；这里不会重复烧录或升级系统。','运行应用 · 检测连接'],
 ['scan','扫描并读取','打开舵机准备，自动检测当前只',89,105,['p_motor'],'只连接当前一只舵机，从“舵机准备”开始本轮。程序扫描响应编号并读取已有参数。','扫描到一个编号也不能证明只有一只实物。接线必须始终按单只操作。','扫描 · 读取 · 保持卸载'],
 ['id','写入并复核','自动写入参数与 ID，再读回复核',105,115,['p_motor'],'程序采用检测到的运行端配置档，明确写入 KP、KD 和目标 ID。只有编号与参数读回一致才计入完成。','参数不能照抄旧视频。中位指令确认不代表机械零位已校准。','匹配配置档 · 写入 · 读回'],
 ['all-ids','逐只完成15个ID','逐一完成十五只舵机的编号',115,126,['p_motor'],'依次完成 10–14、20–24、30–34。完成一只就贴好编号；停机并断开 USB 与电池后再换下一只，上电后自动继续。','按 ID 取件。副舵盘：ID30、31保留；ID10、20、32可选拆，本教程保留；其余按步骤拆除。主盘全部保留，机械零位装配后校准。','15 个 ID · 逐只处理'],
];
export const STEPS: Step[]=rows.map(([id,short,title,sourceStart,sourceEnd,parts,text,check,caption])=>({id:`prepare-${id}`,chapter:'prepare',short,title,sourceStart,sourceEnd,parts,text,check,caption,duration:2.6,camera:[160,160,190],target:[0,18,5],software:sourceStart>=49,servoIds:id==='all-ids'?SERVO_IDS:undefined,overview:id==='intro'}));
const manual: Record<string,Partial<Step>>={
 'prepare-intro':{check:'这里提供组装教学。自动编号需要连接 UNO Q 的本机个人版。'},
 'prepare-app':{text:'按厂商指引完成 Arduino App Lab、Duck OS 与 Wi-Fi 设置，在自己的 UNO Q 上启动机器鸭运行应用。',check:'此环境仅提供教学。自动配置需要本机个人版，也可在设备运行端手动设置。'},
 'prepare-scan':{short:'手动扫描单只',title:'在设备运行端扫描当前舵机',text:'打开自己的 Duck Runtime，进入 Servo setup。Scan all IDs，找到单只后停止扫描，读取参数，再按当前运行端指引执行 Reset Mid，保持卸载。',check:'此页面不发送硬件命令。始终只接一只；参数按匹配固件确认。'},
 'prepare-id':{title:'在设备运行端写入并读回复核',text:'在 Servo setup 填写匹配固件的 KP、KD，执行 Set KpKd；填写目标 ID，执行 Change ID，再读取新编号和参数，确认旧编号不再响应。',check:'不照抄旧视频的参数值。中位指令确认与装配后的零位校准不同。'},
 'prepare-all-ids':{text:'在设备运行端依次完成 10–14、20–24、30–34，并给每只实物贴标签。每次先停机，断开 USB 和电池后再换接。',check:'本环境的编号清单是教学参照，不代表已经写入或完成机械零位校准。副舵盘：ID30、31保留；ID10、20、32可选拆，本教程保留；其余按步骤拆除。主盘全部保留。'},
};
export function preparationCopy(step: Step,automatic: boolean){
 const original=STEPS.find(s=>s.id===step.id);
 return original?{...original,...(!automatic?manual[step.id]:{})}:step;
}
const ports: Port[]=[{label:'三芯舵机口',position:[25,4,15],kind:'servo'},{label:'电池接口',position:[-26,4,15],kind:'power'},{label:'扩展板排针A',position:[-24,-3,0],kind:'male-header'},{label:'扩展板排针B',position:[24,-3,0],kind:'male-header'}];
export const ACTORS: Record<string,Actor>={
 p_uno:{kind:'board',boardType:'uno-q',label:'Arduino UNO Q · 教学简模',source:'独立板卡简模 · 接口未实物核验',size:[68,2,53],end:[-35,10,-5],start:[-35,10,-5],step:1,ports:[{label:'USB-C',position:[-34,3,0],kind:'usb-c',direction:[-1,0,0]},{label:'UNO排母A',position:[-24,3,0],kind:'female-header'},{label:'UNO排母B',position:[24,3,0],kind:'female-header'}]},
 p_extension:{kind:'board',boardType:'luwu-extension',label:'陆吾扩展板 · 教学简模',source:'独立板卡简模 · 接口未实物核验',size:[68,2,53],end:[-35,22,-5],start:[-35,55,-5],step:1,ports},
 p_battery:{kind:'battery',label:'临时供电电池 · 教学简模',source:'电池尺寸和接头待实物核验',size:[36,18,66],end:[45,12,-15],start:[68,12,-15],step:2},
 p_motor:{kind:'mesh',sourceId:'right_knee_0',label:'待配置的单只舵机',source:'复用现有舵机网格',color:'#242832',end:[40,22,44],start:[75,22,44],step:3,servoPorts:[{position:[3,8.5,10.8],normal:[0,0,1]}]},
 p_powerCable:{kind:'cable',cableType:'power',endpointPlugs:[false,true],label:'测试电池电源线',source:'走线和极性仅作教学示意',end:[0,0,0],step:2,points:[[45,15,-35],[22,30,-45],[-61,26,44],[-61,26,15.15]]},
 p_servoCable:{kind:'cable',label:'单只舵机测试线',source:'插接与路径示意 · 针脚未核验',end:[0,0,0],step:3,points:[[40,30,54],[40,38,70],[-10,30,55],[-10,26,32],[-10,26,13.7]]},
 p_usb:{kind:'cable',cableType:'usb-c',label:'Type-C 连接线 · 教学简模',source:'仅演示电脑连接方向',end:[0,0,0],step:4,points:[[-75.65,13,-5],[-98,13,-5],[-105,9,20],[-90,5,62]]},
};
const smooth=(p: number)=>{const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};
export function snapshot(index: number,progress=1){
 const result: State={};
 for(const [id,a] of Object.entries(ACTORS)){
  const t=index===a.step?smooth((id==='p_battery'||id==='p_motor')?progress/.35:progress):1,visible=index>=a.step!&&index>0;
  const start=a.start||a.end,position=a.end.map((v,i)=>start[i]!+(v-start[i]!)*t);
  result[id]={visible,position,turn:0,status:visible?(index===a.step&&progress<1?'moving':'installed'):'waiting',opacity:visible?1:0,...(a.points?{points:a.points.map(v=>[...v])}:{})};
 }
 const plugProgress=(at: number)=>index>at?1:index===at?smooth((progress-.45)/.55):0;
 result.p_powerCable!.points![0]=result.p_battery!.position.map((n,i)=>n+[0,3,-20][i]!);
 result.p_powerCable!.points!.at(-1)![2]!+=18*(1-plugProgress(2));
 const motorPort=ACTORS.p_motor!.servoPorts![0]!;
 result.p_servoCable!.points![0]=result.p_motor!.position.map((n,i)=>n+motorPort.position[i]!+motorPort.normal![i]!*1.65);
 result.p_servoCable!.points![1]=result.p_servoCable!.points![0].map((n,i)=>n+motorPort.normal![i]!*16);
 result.p_servoCable!.points!.at(-1)![2]!+=16*(1-plugProgress(3));
 result.p_usb!.points![0]![0]!-=18*(1-plugProgress(4));
 return result;
}
