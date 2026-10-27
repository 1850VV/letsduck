interface Timing {durationMs:number;holdMs?:number;settleMs?:number}
export const PLAYBACK_RATES=Object.freeze([.5,1,1.5,2,3,4]);

// The clock owns lesson sequencing. Rendering consumes its state; changing the
// rate never recalculates progress from the original start timestamp.
export function createLessonPlayer(timings:(Timing|(()=>Timing))[]){
  if(!timings.length)throw new Error('Lesson needs at least one step');
  let step=0,progress=1,playing=false,autoplay=false,rate=1,finished=false,phase='paused',hold=0,settle=0,last:number|null=null;
  // A timing may be a factory: expensive cue analysis belongs to the visited step, once.
  const resolved=new Map<number,Timing>();
  const timing=()=>{
    const value=timings[step];if(typeof value!=='function')return value;
    if(!resolved.has(step))resolved.set(step,value());
    return resolved.get(step);
  };
  const state=()=>({step,progress,playing,autoplay,rate,finished,phase});
  const seek=(index:number,value=0,{play=false,auto=false}={})=>{
    step=Math.max(0,Math.min(timings.length-1,Math.trunc(index)));progress=Math.max(0,Math.min(1,value));playing=play;autoplay=auto;finished=false;
    hold=progress===0?(timing()!.holdMs||0):0;settle=0;phase=hold?'hold':'motion';last=null;
  };
  return{
    get state(){return state();},seek,
    startAuto(){seek(0,0,{play:true,auto:true});},
    stopAuto(){autoplay=false;playing=false;last=null;},
    pause(){playing=false;last=null;},
    resume(){if(finished||progress===1&&!autoplay)return;playing=true;last=null;},
    setRate(value:number){if(PLAYBACK_RATES.includes(value))rate=value;},
    tick(now:number){
      if(last===null){last=now;return state();}
      let elapsed=Math.max(0,now-last)*rate;last=now;if(!playing)return state();
      if(phase==='settle'){
        settle-=elapsed;
        if(settle<=0){
          if(step===timings.length-1){playing=false;autoplay=false;finished=true;phase='finished';}
          else{step++;progress=0;hold=timing()!.holdMs||0;phase=hold?'hold':'motion';}
        }
        return state();
      }
      if(hold>0){const used=Math.min(hold,elapsed);hold-=used;elapsed-=used;if(hold>0)return state();phase='motion';}
      progress=Math.min(1,progress+elapsed/Math.max(1,timing()!.durationMs));
      if(progress===1){if(autoplay){phase='settle';settle=timing()!.settleMs??1000;}else playing=false;}
      return state();
    }
  };
}
