import type {DebugScan} from '@letsduck/devices';
import {isRecord} from '../lib/browser.js';
export type BoardId='arduino'|'expansion';
export type DebugView='robot'|'tray'|'circuit';
export interface Device {uid:string;id:number;online:boolean;pos:unknown;kp:unknown;kd:unknown;held?:boolean;jogReady:boolean;parametersLive?:boolean;readbackPending?:boolean}
export interface Mapping {uid:string;from:number;to:number}
export interface Parameters {id:number;kp:number;kd:number}
export interface RuntimeProfile {action_scale?:number;action_alpha?:number;action_alpha_head?:number;gyro_alpha?:number;gravity_tau_s?:number;enabled?:boolean}
export interface MCUStatus {
 mode?:string;feedback_age_ms?:number;imu_ok?:boolean;control_ready?:boolean;feedback_hz?:number;inference_hz?:number;
 recovery?:{phase?:string};pick?:{active?:boolean};roulade?:{active?:boolean;remaining_s?:number};deployment?:RuntimeProfile;roller?:RuntimeProfile;
 head?:number[];mouth?:number;acc?:number[];gyro?:number[];gravity?:number[];angles?:number[];targets?:number[];
 active_model?:string;mcu_command_seq?:number|bigint;sequence_gaps?:number|bigint;mcu_invalid_commands?:number|bigint;
}
export interface DebugSnapshot {devices:Device[];boards:Record<BoardId,{connected:boolean}>;transport:'usb'|'lan';status:MCUStatus;scan:DebugScan;numbering:unknown;onlineIds:number[];error:string}
export interface DebugState {devices:Device[];boards:Record<BoardId,{connected:boolean}>;selectedBoard:BoardId|null;selected:string|undefined;view:DebugView;mode:'single'|'swap'|'custom';batch:Mapping[];busy:boolean;draft:Parameters|null;message:string;status:MCUStatus;transport:'usb'|'lan'|undefined;scan?:DebugScan}
export type DebugAction=(action:string,values?:Record<string,unknown>)=>Promise<Record<string,unknown>>;
export type DebugRun=(action:string,values?:Record<string,unknown>,message?:string,after?:(data:Record<string,unknown>)=>void)=>Promise<Record<string,unknown>|null|undefined>;
const numericArray=(value:unknown):number[]=>{if(!Array.isArray(value))return [];if(!value.every((item:unknown):item is number=>typeof item==='number'))throw Error('控制器数组格式异常');return value;};
function profile(value:unknown):RuntimeProfile|undefined {
 if(!isRecord(value))return undefined;
 const result:RuntimeProfile={};
 for(const key of ['action_scale','action_alpha','action_alpha_head','gyro_alpha','gravity_tau_s'] as const)if(typeof value[key]==='number')result[key]=value[key];
 if(typeof value.enabled==='boolean')result.enabled=value.enabled;
 return result;
}
export function readMCUStatus(value:unknown):MCUStatus {
 if(!isRecord(value))throw Error('控制器状态格式异常');
 const result:MCUStatus={};
 for(const key of ['feedback_age_ms','feedback_hz','inference_hz','mouth'] as const)if(typeof value[key]==='number')result[key]=value[key];
 for(const key of ['mode','active_model'] as const)if(typeof value[key]==='string')result[key]=value[key];
 for(const key of ['imu_ok','control_ready'] as const)if(typeof value[key]==='boolean')result[key]=value[key];
 for(const key of ['mcu_command_seq','sequence_gaps','mcu_invalid_commands'] as const)if(typeof value[key]==='number'||typeof value[key]==='bigint')result[key]=value[key];
 for(const key of ['head','acc','gyro','gravity','angles','targets'] as const)if(Array.isArray(value[key]))result[key]=numericArray(value[key]);
 if(isRecord(value.recovery)&&typeof value.recovery.phase==='string')result.recovery={phase:value.recovery.phase};
 if(isRecord(value.pick)&&typeof value.pick.active==='boolean')result.pick={active:value.pick.active};
 if(isRecord(value.roulade)){result.roulade={};if(typeof value.roulade.active==='boolean')result.roulade.active=value.roulade.active;if(typeof value.roulade.remaining_s==='number')result.roulade.remaining_s=value.roulade.remaining_s;}
 const deployment=profile(value.deployment),roller=profile(value.roller);if(deployment)result.deployment=deployment;if(roller)result.roller=roller;
 return result;
}
export function readDebugSnapshot(value:unknown):DebugSnapshot {
 if(!isRecord(value)||!Array.isArray(value.devices)||!isRecord(value.boards))throw Error('控制器状态格式异常');
 const devices=value.devices.map((item:unknown):Device=>{if(!isRecord(item)||typeof item.id!=='number'||typeof item.online!=='boolean')throw Error('舵机状态格式异常');return {uid:'servo-'+item.id,id:item.id,online:item.online,pos:item.pos,kp:item.kp,kd:item.kd,held:item.held===true,jogReady:false,parametersLive:item.parametersLive===true,readbackPending:item.readbackPending===true};});
 const arduino=value.boards.arduino,expansion=value.boards.expansion,scan=isRecord(value.scan)?value.scan:{};
 return {devices,boards:{arduino:{connected:isRecord(arduino)&&arduino.connected===true},expansion:{connected:isRecord(expansion)&&expansion.connected===true}},transport:value.transport==='lan'?'lan':'usb',status:readMCUStatus(value.status),scan:{active:scan.active===true,checked:typeof scan.checked==='number'?scan.checked:0,total:typeof scan.total==='number'?scan.total:254,found:numericArray(scan.found),stopped:scan.stopped===true,error:typeof scan.error==='string'?scan.error:''},numbering:value.numbering,onlineIds:numericArray(value.onlineIds),error:typeof value.error==='string'?value.error:''};
}
