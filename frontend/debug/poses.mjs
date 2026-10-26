import {ACTORS,OVERVIEW_STEP,snapshot} from '../assemble/full-state.mjs';
export {actorQuaternion} from '../assemble/render-pose.mjs';
export const assemblyActors=ACTORS;
export const completePoses=()=>Object.fromEntries(Object.entries(snapshot(OVERVIEW_STEP,1)).map(([id,pose])=>[id,{pose,actor:ACTORS[id]}]));
