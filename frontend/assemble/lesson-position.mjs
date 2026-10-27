import {STEPS,FLOW_VERSION} from './pdf-flow.mjs';
import {STEPS as legacy} from './hardware-state.mjs';

const validCamera=pose=>Array.isArray(pose)&&pose.length===3&&pose.every(Number.isFinite);
export function saveLessonPosition(step,view={}){
 const n=Math.max(0,Math.min(STEPS.length-1,Math.trunc(step)));
 return {...view,flowVersion:FLOW_VERSION,stepId:STEPS[n].id,step:n,total:STEPS.length};
}
export function restoreLessonPosition(saved){
 let id=saved?.stepId;
 if(!id&&!saved?.flowVersion&&saved?.total===legacy.length&&Number.isInteger(saved.step))id=legacy[saved.step]?.id;
 const found=STEPS.findIndex(s=>s.id===id),step=found<0?0:found,result={step};
 if(saved?.flowVersion===FLOW_VERSION&&found>=0&&validCamera(saved.camera)&&validCamera(saved.target))Object.assign(result,{camera:saved.camera,target:saved.target});
 return result;
}
export const referenceClip=step=>({video:step.video,start:step.sourceStart-step.videoStart,end:step.sourceEnd-step.videoStart});
