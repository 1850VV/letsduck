import type {SetupUiState,SetupRecord,ServoMapping,ResolvedBinding,SetupItem,SetupStatusKind} from './servo-types.js';
type HistoryMap={version:ServoMapping['version'];bindings:Pick<ResolvedBinding,'id'>[]};
/** Classify saved proof without inventing a device connection or running task. */
export function deriveServoHistory(saved:SetupRecord[],map:HistoryMap){
 const records=new Map(saved.map(r=>[r.id,r])),verified=new Set<number>(),review=new Set<number>(),pending=new Set<number>();
 for(const {id} of map.bindings){
  const record=records.get(id),proof=record?.state==='verified'&&record.mapVersion===map.version&&
   (['kp','kd'] as const).every(k=>Number.isFinite(record.profile?.[k])&&record.readback?.[k]===record.profile![k])&&
   (record.sourceId===id||record.oldIdAbsent===true);
  if(proof)verified.add(id);else if(record)review.add(id);else pending.add(id);
 }
 return {records,verified,review,pending};
}
/** Persisted verification and observed connection are intentionally independent. */
export function deriveServoStatus(data:SetupUiState,map:HistoryMap,now=Date.now()){
 const history=deriveServoHistory(data.records||[],map),records=history.records;
 const t:NonNullable<SetupUiState['telemetry']>=data.telemetry||{known:false,ids:[]},fresh=typeof t.observedAt==='number'&&Number.isFinite(t.observedAt)&&now-t.observedAt<=5000;
 const known=!!data.online&&!!t.known&&fresh,online=new Set(known?t.ids:[]);
 const verified=new Set<number>(),review=new Set<number>(),pending=new Set<number>(),items=new Map<number,SetupItem>();
 for(const {id} of map.bindings){
  const record=records.get(id),proof=history.verified.has(id);
  const status:SetupStatusKind=data.phase==='working'&&(data.activeTarget??data.currentId)===id?'working':proof?'verified':record?'review':'pending';
  if(status==='verified')verified.add(id);else if(status==='review')review.add(id);else if(status==='pending')pending.add(id);
  items.set(id,{id,status,record,online:online.has(id),canResume:record?.state==='pending'&&data.phase!=='working'&&!data.running});
 }
 return {items,verified,review,pending,online,known,nextTarget:data.queuedTarget??data.targetId,canHalt:!!data.online&&data.phase!=='working',complete:verified.size===map.bindings.length&&review.size===0&&data.phase!=='working',
  liveFor(id:number){
   if(!online.has(id))return null;
   const inspected=data.inspection;
   if(inspected?.id===id&&inspected.status==='online'&&Number.isFinite(inspected.observedAt)&&now-inspected.observedAt!<=5000&&inspected.readback)
    return inspected;
   const readback=t.readings?.[id];return readback?{id,readback,observedAt:t.observedAt}:null;
  }};
}

/** Presentation never changes a device task; only an explicit start releases manual inspection. */
export class ServoSelection{
 ids:number[];selected:number;labelTarget:number|null;view:string;manual:boolean;initialized:boolean;previous:number|null|undefined;
 constructor(ids:number[]){this.ids=ids;this.selected=ids[0]!;this.labelTarget=null;this.view='robot';this.manual=false;this.initialized=false;this.previous=null;}
 apply(data:Pick<SetupUiState,'currentId'|'targetId'>&Partial<Pick<SetupUiState,'phase'>>){
  if(!this.initialized){this.selected=this.ids.includes(data.currentId!)?data.currentId!:this.ids.includes(data.targetId!)?data.targetId!:this.selected;this.initialized=true;}
  else if(!this.manual&&this.ids.includes(data.currentId!)&&data.currentId!==this.previous)this.selected=data.currentId!;
  this.previous=data.currentId;
 }
 choose(id:number){if(!this.ids.includes(id))return;this.selected=id;this.labelTarget=id;this.manual=true;}
 begin(){this.manual=false;}
 toggle(){this.view=this.view==='robot'?'tray':'robot';}
 sequential(data:Pick<SetupUiState,'targetId'>){this.manual=false;this.labelTarget=null;this.selected=this.ids.includes(data.targetId!)?data.targetId!:this.selected;}
}
