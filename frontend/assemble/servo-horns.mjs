import {SERVO_AUDIT} from './hardware-adapters.mjs';

// This photographed HD1910 batch: native/front opens toward the white sockets.
// Geometry front/rear names are not a universal rule for other servo models.
export const SERVO_IDS={motor:14,l_motor:24,r_upperMotor:12,l_upperMotor:22,r_lowerMotor:13,l_lowerMotor:23,t_motor10:10,t_motor20:20,t_motor11:11,t_motor21:21,h_motor32:32,h_motor33:33,h_mouthMotor:34,h_motor30:30,h_motor31:31};
export const HORN_BINDINGS=Object.fromEntries(Object.entries(SERVO_AUDIT.actors).filter(([,a])=>a.existingHorn).map(([id,a])=>[id,a.existingHorn]));
export const LEG_SECONDARY_REMOVALS=[
 {motor:'r_lowerMotor',horn:'r_lowerHorn',screw:'r_lowerHornScrew',stepId:'r-pair',tray:[-96,3,-12]},
 {motor:'l_lowerMotor',horn:'l_lowerHorn',screw:'l_lowerHornScrew',stepId:'l-pair',tray:[96,3,-12]},
];
for(const r of LEG_SECONDARY_REMOVALS)HORN_BINDINGS[r.motor]={actorId:r.horn,screwActorId:r.screw,discSide:'front'};
