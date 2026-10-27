import type {PlaybackState} from './types.js';
// Only real playback completions get a cue. Navigation and scrubbing remain quiet.
export function shouldPlayCompletion(before:PlaybackState,after:PlaybackState,now:number,lastCueAt:number,effectsEnabled:boolean,volume:number){
  return effectsEnabled&&volume>0&&before.playing&&before.step===after.step&&
    before.progress<1&&after.progress===1&&now-lastCueAt>=6000;
}
