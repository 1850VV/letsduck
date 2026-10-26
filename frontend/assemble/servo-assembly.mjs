import {createServoPreparation} from './servo-preparation.mjs';
import {readNumberingReadiness} from '../shared/numbering-readiness.mjs';

/** Assembly declares pickup/installation only. Device configuration belongs to Debug Duck. */
export async function createServoAssembly(map){
 const preparation=createServoPreparation(map),entry=document.getElementById('servo-open');
 const open=()=>location.assign('/debug/?from=assemble');
 let supported=false;
 try{const response=await fetch('/api/site');if(!response.ok)throw Error('站点状态不可用');const site=await response.json();supported=!!site.servoSetup;await preparation.load(site.servoPreparation);}catch{await preparation.load(false);}
 entry.hidden=!supported;entry.textContent='调试鸭';entry.onclick=open;
 return {preparation,active:false,supported,open,
  get historyLoaded(){return !readNumberingReadiness().error;},
  get state(){const r=readNumberingReadiness();return {complete:r.ready,verified:r.verifiedIds,review:r.reviewIds,records:r.records};},
  recordFor(id){return readNumberingReadiness().records.find(r=>r.id===id);}
 };
}
