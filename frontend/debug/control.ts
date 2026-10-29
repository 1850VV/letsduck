import {t} from './i18n.js';
export const MODE_NAMES: Record<string,string>={get off(){return t('debug.mode.off');},get servo_debug(){return t('debug.mode.servo_debug');},get shadow(){return t('debug.mode.shadow');},get hold(){return t('debug.mode.hold');},get policy(){return t('debug.mode.policy');},get calibrate(){return t('debug.mode.calibrate');}};
export function motionFromInput(roller: boolean,left={x:0,y:0},right:{x:number;y?:number}={x:0},keys: ReadonlySet<string>=new Set()): [number,number,number] {
 const dz=(n: number)=>Math.abs(n)<=.15?0:n,axis=(a: string,b: string)=>Number(keys.has(a))-Number(keys.has(b));
 const forward=dz(left.y),limit=roller?{back:.4,side:0,yaw:.25,key:[.4,0,.25] as const}:{back:.2,side:.3,yaw:1,key:[.2,.15,.5] as const};
 return [keys.has('w')||keys.has('s')?axis('w','s')*limit.key[0]:forward*(forward<0?limit.back:.4),roller?0:keys.has('a')||keys.has('d')?axis('a','d')*limit.key[1]:dz(-left.x)*limit.side,keys.has('q')||keys.has('e')?axis('q','e')*limit.key[2]:dz(-right.x)*limit.yaw];
}

export const canControl=<T extends {feedback_age_ms?: number; imu_ok?: boolean; control_ready?: boolean; mode?: string}>(s:T)=>typeof s.feedback_age_ms==='number'&&Number.isFinite(s.feedback_age_ms)&&s.feedback_age_ms>=0&&s.feedback_age_ms<500&&s.imu_ok===true&&(s.control_ready===true||['servo_debug','calibrate'].includes(s.mode??''));
