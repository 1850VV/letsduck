export const MODE_NAMES={off:'全部卸载',servo_debug:'舵机设置',shadow:'只推理',hold:'默认姿态',policy:'行走 / 起身',calibrate:'中位校准'};
export function motionFromInput(roller,left={x:0,y:0},right={x:0},keys=new Set()){
 const dz=n=>Math.abs(n)<=.15?0:n,axis=(a,b)=>Number(keys.has(a))-Number(keys.has(b));
 const forward=dz(left.y),limit=roller?{back:.4,side:0,yaw:.25,key:[.4,0,.25]}:{back:.2,side:.3,yaw:1,key:[.2,.15,.5]};
 return [keys.has('w')||keys.has('s')?axis('w','s')*limit.key[0]:forward*(forward<0?limit.back:.4),roller?0:keys.has('a')||keys.has('d')?axis('a','d')*limit.key[1]:dz(-left.x)*limit.side,keys.has('q')||keys.has('e')?axis('q','e')*limit.key[2]:dz(-right.x)*limit.yaw];
}

export const canControl=s=>Number.isFinite(s.feedback_age_ms)&&s.feedback_age_ms>=0&&s.feedback_age_ms<500&&s.imu_ok===true&&(s.control_ready===true||['servo_debug','calibrate'].includes(s.mode));
