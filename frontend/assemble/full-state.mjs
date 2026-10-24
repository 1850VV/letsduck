import * as Prepare from './full/prepare.mjs';
import * as Legs from './assembly-state.mjs';
import * as Torso from './full/torso.mjs';
import * as Head from './full/head.mjs';
import * as Final from './full/final.mjs';
import * as Calibration from './full/calibration.mjs';
import {MESHES} from './mesh-spec.mjs';
import {handoffLead} from './wire-handoff.mjs';

const modules=[Prepare,Legs,Torso,Head,Final,Calibration];
const offsets=[],HEAD_STAGING=[120,-95,65];
const videoNames=['prepare','','torso','head','final','calibration'],videoBases=[0,126,496,768,1102,1258];
export const ACTORS={},STEPS=[],CHAPTERS=[];
for(const [m,mod] of modules.entries()){
 const offset=STEPS.length;offsets.push(offset);
 for(const [id,a] of Object.entries(mod.ACTORS)){
  if(ACTORS[id])throw Error(`重复 actorId: ${id}`);
  ACTORS[id]={...a,sourceId:a.sourceId||MESHES[id]?.sourceId,module:m};
 }
 for(const c of mod.CHAPTERS)CHAPTERS.push({...c,start:c.start+offset,end:c.end+offset,video:c.video||`assets/full-${videoNames[m]}.mp4`,videoStart:m===1?c.sourceStart:videoBases[m]});
 for(const s of mod.STEPS){const shift=m===3?HEAD_STAGING:[0,0,0],view=s.overview?Calibration.STEPS.at(-1):s;STEPS.push({...s,camera:view.camera.map((n,i)=>n+shift[i]),target:view.target.map((n,i)=>n+shift[i]),module:m});}
}
export const OVERVIEW_STEP=STEPS.length-1;
const boardLeadSources=[Torso.BOARD_LEADS?.right?.actorId,Torso.BOARD_LEADS?.left?.actorId,'h_headLead'];
for(const [i,id] of boardLeadSources.entries())if(id&&ACTORS[id])ACTORS['f_bus'+i].endpointPlugs=[ACTORS[id].endpointPlugs?.[0]??true,false];
export function chapterFor(index){return CHAPTERS.find(c=>index>=c.start&&index<=c.end)||CHAPTERS[0];}
const shift=(pose,delta)=>({...pose,position:pose.position.map((n,i)=>n+delta[i])});
function hidden(a){return{visible:false,position:[...(a.end||[0,0,0])],turn:0,status:'waiting',opacity:0};}
function complete(){
 const all=snapshot(offsets[4]+modules[4].STEPS.length-1,1);
 for(const [id,a] of Object.entries(ACTORS)){all[id]??=hidden(a);if(all[id].status==='removed')all[id].visible=false;}
 return all;
}
export function snapshot(index,progress=1){
 const n=Math.max(0,Math.min(STEPS.length-1,Math.trunc(index))),p=Math.max(0,Math.min(1,progress)),m=STEPS[n].module,local=n-offsets[m];
 if(STEPS[n].overview||m===5)return complete();
 const all=Object.fromEntries(Object.entries(ACTORS).map(([id,a])=>[id,hidden(a)]));
 if(m===0){Object.assign(all,Prepare.snapshot(local,p));return all;}
 for(let j=1;j<=Math.min(m,4);j++)Object.assign(all,modules[j].snapshot(j===m?local:modules[j].STEPS.length-1,j===m?p:1));
 if(m>=2){
  const legOffsets=m===2?Torso.legOffsets(local,p):{right:[0,0,0],left:[0,0,0]};
  if(m===2&&local===0){const t=Math.min(1,p/.4),blend=t*t*(3-2*t);for(const side of ['right','left'])legOffsets[side]=legOffsets[side].map(n=>n*blend);}
  for(const id of Object.keys(Legs.ACTORS))if(all[id].status!=='removed')all[id]=shift(all[id],id.startsWith('l_')?legOffsets.left:legOffsets.right);
  const patches=Torso.legLeadOverrides?.(m===2?local:Torso.STEPS.length-1,m===2?p:1)||{};
  for(const [id,patch] of Object.entries(patches))all[id]={...all[id],...patch};
 }
 if(m>=3){
  const delta=m===3?HEAD_STAGING:m===4?Final.headOffset(local,p):[0,0,0];
  for(const id of Object.keys(Head.ACTORS))all[id]=shift(all[id],delta);
 }
 if(m===4){
  for(const [i,id] of boardLeadSources.entries()){
   if(!id||!all[id]?.visible)continue;
   const cableId='f_bus'+i,plugId='f_busPlug'+i,cable=all[cableId],plug=all[plugId];
   const initialFree=Final.ACTORS[plugId].start.map((n,j)=>n+cable.position[j]);
   const connected=handoffLead(all[id],cable,plug,initialFree);
   all[cableId]=connected.cable;all[plugId]=connected.plug;all[id]={...all[id],visible:false,opacity:0};
  }
 }
 return all;
}
