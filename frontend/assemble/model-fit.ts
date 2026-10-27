import type {FineCue} from './types.js';
// Approved plug vertices overlap these literal 3MF solids in the assembled pose.
// This is a geometry review finding, not measured real-hardware clearance.
export const MODEL_FIT_ISSUES=Object.freeze([
 {
  "cable": "wire",
  "end": 0,
  "solid": "foot"
 },
 {
  "cable": "wire",
  "end": 1,
  "solid": "f_thighR"
 },
 {
  "cable": "l_wire",
  "end": 0,
  "solid": "l_foot"
 },
 {
  "cable": "l_wire",
  "end": 1,
  "solid": "f_thighL"
 },
 {
  "cable": "r_legWireA",
  "end": 0,
  "solid": "f_thighR"
 },
 {
  "cable": "r_legWireA",
  "end": 1,
  "solid": "f_thighR"
 },
 {
  "cable": "r_legWireB",
  "end": 0,
  "solid": "f_thighR"
 },
 {
  "cable": "r_legWireB",
  "end": 1,
  "solid": "t_yawR"
 },
 {
  "cable": "l_legWireA",
  "end": 0,
  "solid": "f_thighL"
 },
 {
  "cable": "l_legWireA",
  "end": 1,
  "solid": "f_thighL"
 },
 {
  "cable": "l_legWireB",
  "end": 0,
  "solid": "f_thighL"
 },
 {
  "cable": "l_legWireB",
  "end": 1,
  "solid": "t_yawL"
 },
 {
  "cable": "t_rollWireR",
  "end": 1,
  "solid": "t_yawR"
 },
 {
  "cable": "t_rollWireL",
  "end": 1,
  "solid": "t_yawL"
 },
 {
  "cable": "h_wire32",
  "end": 0,
  "solid": "h_yawSupport"
 },

 {
  "cable": "h_wireMouth",
  "end": 0,
  "solid": "h_jaw"
 },
 {
  "cable": "h_wireMouth",
  "end": 0,
  "solid": "h_shell"
 },
 {
  "cable": "h_neckWire",
  "end": 0,
  "solid": "h_pitchSupport"
 },
 {
  "cable": "h_neckWire",
  "end": 1,
  "solid": "f_sideR"
 },
 {
  "cable": "f_bus2",
  "end": 0,
  "solid": "f_sideR"
 }
].map(value=>Object.freeze(value)));
const pairs:Record<string,[string,number]>={plug:['wire',0],l_plug:['l_wire',0],h_plug32:['h_wire32',0],h_plug33:['h_wire33',0],h_plugMouth:['h_wireMouth',0],h_plugNeck:['h_neckWire',1]};
export function fitsForCue(cue:Pick<FineCue,"actorId"|"endpoint">){const [cable,end]=pairs[cue.actorId]||[cue.actorId,cue.endpoint];return MODEL_FIT_ISSUES.filter(i=>i.cable===cable&&i.end===end);}
export function fitsForParts(parts:string[]){return [...SERVO_FIT_CANDIDATES.filter(i=>parts.includes(i.servo)||parts.includes(i.solid)),...MODEL_FIT_ISSUES.filter(i=>parts.includes(i.cable)||parts.includes(i.solid)||(FIT_MOTOR_OWNERS[i.cable]||[]).some(id=>parts.includes(id))||parts.some(id=>pairs[id]?.[0]===i.cable))];}

export const FIT_MOTOR_OWNERS:Record<string,string[]>={wire:['motor','r_lowerMotor'],l_wire:['l_motor','l_lowerMotor'],r_legWireA:['r_lowerMotor','r_upperMotor'],l_legWireA:['l_lowerMotor','l_upperMotor'],r_legWireB:['r_upperMotor','t_motor11'],l_legWireB:['l_upperMotor','t_motor21'],t_rollWireR:['t_motor10','t_motor11'],t_rollWireL:['t_motor20','t_motor21'],h_wire32:['h_motor32'],h_wire33:['h_motor33'],h_wireMouth:['h_mouthMotor'],h_neckWire:['h_motor31','h_motor30'],f_bus2:['h_motor30']};

// Sampled shell intersections are candidates: contact faces and native screw
// details need a CAD/physical fit review before moving or resizing components.
export const SERVO_FIT_CANDIDATES=Object.freeze([
 {
  "servo": "motor",
  "solid": "foot"
 },
 {
  "servo": "l_motor",
  "solid": "l_foot"
 },
 {
  "servo": "r_upperMotor",
  "solid": "r_support"
 },
 {
  "servo": "r_upperMotor",
  "solid": "f_thighR"
 },
 {
  "servo": "l_upperMotor",
  "solid": "l_support"
 },
 {
  "servo": "r_lowerMotor",
  "solid": "r_support"
 },
 {
  "servo": "l_lowerMotor",
  "solid": "l_support"
 },
 {
  "servo": "t_motor10",
  "solid": "t_support"
 },
 {
  "servo": "t_motor10",
  "solid": "f_sideR"
 },
 {
  "servo": "t_motor20",
  "solid": "t_support"
 },
 {
  "servo": "t_motor20",
  "solid": "f_sideL"
 },
 {
  "servo": "t_motor11",
  "solid": "t_yawR"
 },
 {
  "servo": "t_motor11",
  "solid": "t_coverR"
 },
 {
  "servo": "t_motor21",
  "solid": "t_yawL"
 },
 {
  "servo": "t_motor21",
  "solid": "t_coverL"
 },
 {
  "servo": "h_motor32",
  "solid": "h_yawSupport"
 },
 {
  "servo": "h_motor33",
  "solid": "h_platform"
 },
 {
  "servo": "h_motor33",
  "solid": "h_servoSupport"
 },
 {
  "servo": "h_mouthMotor",
  "solid": "h_servoSupport"
 }
].map(value=>Object.freeze(value)));
