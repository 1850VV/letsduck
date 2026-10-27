// Addressed devices use server readbacks; a bus address is not a physical serial number.
import {SERVO_BINDINGS} from '../shared/servo-map.mjs';
export const IDS=SERVO_BINDINGS.map(binding=>binding.id);
export const ROLES=SERVO_BINDINGS.map(binding=>binding.role);
export const ACTORS=SERVO_BINDINGS.map(binding=>binding.actorId);
export const role=id=>ROLES[IDS.indexOf(id)]??'未分配安装位';
export function createState(){return {devices:IDS.map(id=>({uid:'servo-'+id,id,kp:null,kd:null,pos:null,online:false,held:false,jogReady:false})),boards:{arduino:{connected:false},expansion:{connected:false}},selectedBoard:null,selected:'servo-12',view:'robot',mode:'single',batch:[],busy:false,draft:null,message:'正在读取控制器状态…',status:{},transport:'usb'};}
export function mergeStatus(s,data){
 const prior=new Map(s.devices.map(d=>[d.id,d]));
 s.devices=data.devices.map(d=>({...d,uid:'servo-'+d.id,jogReady:prior.get(d.id)?.jogReady??false}));
 s.boards=data.boards;s.transport=data.transport;s.status=data.status;s.scan=data.scan;
 if(!s.devices.some(d=>d.uid===s.selected))s.selected=s.devices.find(d=>d.online)?.uid??s.devices[0]?.uid;
}
export const online=s=>s.devices.filter(d=>d.online);
export const duplicate=(s,id)=>online(s).filter(d=>d.id===id).length>1;
export const selected=s=>s.devices.find(d=>d.uid===s.selected);
export function parameterErrors(s,uid,next){
 const d=s.devices.find(d=>d.uid===uid),errors={};
 if(!d?.online)return {device:'当前未在线，连接后重新读取'};
 if(duplicate(s,d.id))return {device:'同号舵机无法分别寻址，请分开连接后改号'};
 for(const [key,max] of [['id',253],['kp',255],['kd',255]])if(!Number.isInteger(next[key])||next[key]<0||next[key]>max)errors[key]=`请输入 0–${max} 的整数`;
 if(!errors.id&&online(s).some(other=>other.uid!==uid&&other.id===next.id))errors.id=`ID${next.id} 已在线，请使用编号互换`;
 return errors;
}
export function legPlan(s){return online(s).filter(d=>d.id>=10&&d.id<=14||d.id>=20&&d.id<=24).map(d=>({uid:d.uid,from:d.id,to:d.id<20?d.id+10:d.id-10}));}
export function mappingError(s,plan){
 if(!plan.length)return '当前没有可修改的在线舵机';
 const sources=new Set(plan.map(p=>p.uid));
 if(new Set(plan.map(p=>p.to)).size!==plan.length)return '目标编号重复，请为每只舵机填写不同编号';
 for(const p of plan){
  const d=s.devices.find(d=>d.uid===p.uid);
  if(!d?.online)return '连接已断开，请重新读取后修改';
  if(duplicate(s,d.id))return '同号舵机无法分别寻址，请分开连接后改号';
  if(!Number.isInteger(p.to)||p.to<0||p.to>253)return '编号范围是 0–253 的整数';
  if(online(s).some(d=>!sources.has(d.uid)&&d.id===p.to))return `ID${p.to} 已被其他在线舵机使用`;
 }
 return '';
}
