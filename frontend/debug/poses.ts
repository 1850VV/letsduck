import {ACTORS,OVERVIEW_STEP,snapshot} from '../assemble/full-state.js';
export {actorQuaternion} from '../assemble/render-pose.js';
export const assemblyActors=ACTORS;
export const completePoses=()=>Object.fromEntries(Object.entries(snapshot(OVERVIEW_STEP,1)).map(([id,pose])=>[id,{pose,actor:ACTORS[id]}]));
