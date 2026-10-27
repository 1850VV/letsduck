import {SERVO_AUDIT} from './hardware-adapters.js';

// This photographed HD1910 batch: native/front opens toward the white sockets.
// Geometry front/rear names are not a universal rule for other servo models.
export {SERVO_IDS} from '../shared/servo-map.js';
export const HORN_BINDINGS:Record<string,{actorId:string;screwActorId:string;discSide:string}>=Object.fromEntries(Object.entries(SERVO_AUDIT.actors).filter(([,a])=>a.existingHorn).map(([id,a])=>[id,a.existingHorn!]));
export const LEG_SECONDARY_REMOVALS=[
 {motor:'r_lowerMotor',horn:'r_lowerHorn',screw:'r_lowerHornScrew',stepId:'r-pair',tray:[-96,3,-12]},
 {motor:'l_lowerMotor',horn:'l_lowerHorn',screw:'l_lowerHornScrew',stepId:'l-pair',tray:[96,3,-12]},
];
for(const r of LEG_SECONDARY_REMOVALS)HORN_BINDINGS[r.motor]={actorId:r.horn,screwActorId:r.screw,discSide:'front'};
