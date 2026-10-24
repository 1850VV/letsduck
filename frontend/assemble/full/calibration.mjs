import {SERVO_IDS} from './prepare.mjs';
export const CHAPTERS=[{id:'calibration',name:'校准与完成',start:0,end:6,sourceStart:1258,sourceEnd:1390.042}];
const rows=[
 ['power','组装后开机','组装完成后开机',1258,1268,'本段只展示教学顺序。核对机械连接和线束，再按视频进入自己的设备配置页面。','本原型不连接硬件；以下仅展示教学顺序。'],
 ['start','启动校准','进入 Calibration，启动校准',1268,1272,'在真实设备界面进入 Calibration，点击 Start calibration，并扶稳机器人。','页面中的成品姿态不表示真实机器人已经校准。'],
 ['servos','逐个调整15个ID','逐个调整所有舵机的机械零位',1272,1284,'按设备界面逐 ID 调整滑块，完成后按 Finish。右腿 10–14，左腿 20–24，头颈和嘴部 30–34。','每个 ID 都需要核对实物关节；本页清单不是设备校准结果。'],
 ['pose','检查身体关节','检查居中、关节与双脚姿态',1284,1364,'对照原片持续微调：身体居中、关节对齐、双脚平放，直到实物能站稳。','本原型的站立模型只用于教学观察，不能替代实物姿态检查。'],
 ['exit','退出校准','完成各关节后退出校准',1364,1374,'全部舵机完成后，按原片点击 Exit，再退出设置页面。','确认所有 ID 已处理，再进行默认姿态检查。'],
 ['default','检查默认姿态','执行 Default pose',1374,1378,'在真实设备上执行 Default pose，观察身体和双腿是否达到预期姿态。','这里不发送运动指令，也不模拟物理平衡。'],
 ['complete','整机完成查看','整机组装教程完成',1378,1390.042,'现在可旋转查看完整机器人，也可跳回任意阶段重播。原片最后展示遥控与行走入口。','这是一份独立教学原型；真实接线、孔位配合和设备校准仍需实物核验。'],
];
export const STEPS=rows.map(([id,short,title,sourceStart,sourceEnd,text,check])=>({id:id==='complete'?'robot-complete':`calibration-${id}`,chapter:'calibration',short,title,sourceStart,sourceEnd,text,check,caption:id==='complete'?'':'教学演示 · 不控制真实设备',parts:[],duration:2.5,camera:[355,295,460],target:[0,125,25],software:true,servoIds:['servos','pose'].includes(id)?SERVO_IDS:undefined,complete:id==='complete'}));
export const ACTORS={};
export const snapshot=()=>({});
