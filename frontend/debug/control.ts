import type {MCUStatus} from './types.js';
import {t} from './i18n.js';
export const MODE_NAMES: Record<string,string>={get off(){return t('debug.mode.off');},get servo_debug(){return t('debug.mode.servo_debug');},get shadow(){return t('debug.mode.shadow');},get hold(){return t('debug.mode.hold');},get policy(){return t('debug.mode.policy');},get calibrate(){return t('debug.mode.calibrate');}};
export function motionFromInput(roller: boolean,left={x:0,y:0},right:{x:number;y?:number}={x:0},keys: ReadonlySet<string>=new Set()): [number,number,number] {
 const dz=(n: number)=>Math.abs(n)<=.15?0:n,axis=(a: string,b: string)=>Number(keys.has(a))-Number(keys.has(b));
 // Walking accepts |vx|<=0.2 only (the board answers 400 above that); roller mode allows 0.4.
 const forward=dz(left.y),limit=roller?{vx:.4,side:0,yaw:.25,key:[.4,0,.25] as const}:{vx:.2,side:.3,yaw:1,key:[.2,.15,.5] as const};
 return [keys.has('w')||keys.has('s')?axis('w','s')*limit.key[0]:forward*limit.vx,roller?0:keys.has('a')||keys.has('d')?axis('a','d')*limit.key[1]:dz(-left.x)*limit.side,keys.has('q')||keys.has('e')?axis('q','e')*limit.key[2]:dz(-right.x)*limit.yaw];
}

export const canControl=<T extends {feedback_age_ms?: number; imu_ok?: boolean; control_ready?: boolean; mode?: string}>(s:T)=>typeof s.feedback_age_ms==='number'&&Number.isFinite(s.feedback_age_ms)&&s.feedback_age_ms>=0&&s.feedback_age_ms<500&&s.imu_ok===true&&(s.control_ready===true||['servo_debug','calibrate'].includes(s.mode??''));

export const DUCK_ACTIONS=['pick','roulade','sitstand','left-kick','right-kick'] as const;
export type DuckAction=typeof DUCK_ACTIONS[number];
/** Same gates as the official runtime page: one-shot actions start only while the duck stands walking and nothing else runs. */
export function actionState(s:MCUStatus){
 const kick=!!(s.left_kick?.active||s.right_kick?.active),sit=!!s.sitstand?.active,prep=!!s.action_preparation?.active,busy=!!(s.pick?.active||s.roulade?.active);
 const walking=s.recovery?.phase==='walk',ready=s.control_ready===true,phase=s.sitstand?.phase??'idle';
 const free=['shadow','policy'].includes(s.mode??'')&&s.recovery?.active===true&&walking&&!kick&&!sit&&!prep&&!busy;
 const allowed:Record<DuckAction,boolean>={pick:free,roulade:free,'left-kick':free&&ready&&!!s.left_kick,'right-kick':free&&ready&&!!s.right_kick,sitstand:!!s.sitstand&&ready&&walking&&!kick&&!prep&&!busy&&phase!=='stand'};
 return {allowed,running:kick||sit||prep||busy,posture:phase==='sit'?'stand' as const:'sit' as const};
}
