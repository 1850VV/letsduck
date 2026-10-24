// Only real playback completions get a cue. Navigation and scrubbing remain quiet.
export function shouldPlayCompletion(before,after,now,lastCueAt,effectsEnabled,volume){
  return effectsEnabled&&volume>0&&before.playing&&before.step===after.step&&
    before.progress<1&&after.progress===1&&now-lastCueAt>=6000;
}
