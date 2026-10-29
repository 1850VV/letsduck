import {assemblyText} from './i18n.js';
import {onLocale} from '../shared/i18n.js';
import type {PlaybackState} from './types.js';
import {assemblyAssetUrl} from '../shared/url.js';
import {byId as $} from './dom.js';
import {shouldPlayCompletion} from './sound-policy.js';

const tracks:Record<string,{file:string;label:string}>={
  satie:{file:'piano-satie-gymnopedie.mp3',get label(){return assemblyText('assemble.ui.0090');}},
  mozart:{file:'piano-mozart-andante.mp3',get label(){return assemblyText('assemble.ui.0091');}}
};


export function createLessonSound(){
  const music=$('piano-audio'),cue=$('completion-audio'),details=$('sound-controls'),panel=$('sound-panel');
  let enabled=true,effects=true,volume=.24,track='satie',referenceAudio=false,needsGesture=false,error='',request=0,fadeFrame=0,fadeTimer:ReturnType<typeof setTimeout>|undefined=undefined,lastCueAt=-Infinity,cueCount=0;
  music.src=assemblyAssetUrl(tracks[track]!.file).href;
  cue.src=assemblyAssetUrl('assembly-complete.mp3').href;
  music.volume=0;cue.volume=volume*.35;

  function status(){
    const audible=volume>0&&(enabled||effects),text=(error?assemblyText(error):'')||(!audible?assemblyText("assemble.ui.0092"):referenceAudio?assemblyText("assemble.ui.0093"):enabled?(needsGesture?assemblyText("assemble.ui.0094"):music.paused?assemblyText("assemble.ui.0095"):assemblyText("assemble.ui.0096")+tracks[track]!.label):effects?assemblyText("assemble.ui.0097"):assemblyText("assemble.ui.0098"));
    $('sound-status').textContent=text;$('sound-volume-label').textContent=Math.round(volume*100)+'%';
    details.dataset.active=String(audible);details.dataset.pending=String(enabled&&needsGesture);
    details.querySelector('summary')!.title=text;
  }
  function cancelFade(){cancelAnimationFrame(fadeFrame);clearTimeout(fadeTimer);}
  function fadeTo(target:number,duration:number,done=()=>{}){
    cancelFade();const from=music.volume,start=performance.now();
    const finish=()=>{cancelFade();music.volume=target;done();};
    const frame=(now:number)=>{const p=Math.min(1,(now-start)/duration);music.volume=Math.max(0,Math.min(1,from+(target-from)*p));if(p<1)fadeFrame=requestAnimationFrame(frame);else finish();};
    fadeFrame=requestAnimationFrame(frame);
    // Background tabs may throttle animation frames; muting must still finish promptly.
    fadeTimer=setTimeout(finish,duration+25);
  }
  async function startMusic(){
    if(referenceAudio||!enabled||volume===0)return;
    const token=++request;error='';cancelFade();
    try{
      music.playbackRate=1;await music.play();
      if(token!==request)return;
      if(referenceAudio||!enabled||volume===0){music.pause();return;}
      needsGesture=false;fadeTo(volume,800);status();
    }catch(e){
      if(token!==request)return;
      needsGesture=e instanceof Error&&e.name==='NotAllowedError';
      if(!(e instanceof Error&&e.name==='AbortError')&&!needsGesture)error='assemble.ui.0099';
      status();
    }
  }
  function stopMusic(){
    ++request;needsGesture=false;
    fadeTo(0,180,()=>music.pause());status();
  }
  function positionPanel(){
    if(!details.open)return;
    const rect=details.getBoundingClientRect(),width=Math.min(246,innerWidth-16);
    panel.style.width=width+'px';panel.style.left=Math.max(8,Math.min(innerWidth-width-8,rect.right-width))+'px';
    panel.style.bottom=Math.max(8,innerHeight-rect.top+8)+'px';
    panel.style.maxHeight=Math.max(120,rect.top-16)+'px';
  }
  details.addEventListener('toggle',positionPanel);window.addEventListener('resize',positionPanel);
  document.addEventListener('pointerdown',e=>{if(details.open&&e.target instanceof Element&&!details.contains(e.target)&&!e.target.closest('[role="option"],[role="listbox"]'))details.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&details.open){details.open=false;details.querySelector('summary')!.focus();}});
  $('sound-close').addEventListener('click',()=>{details.open=false;details.querySelector('summary')!.focus();});
  // Retry synchronously from a real gesture when the browser blocks initial autoplay.
  const unlock=()=>{if(enabled&&volume>0&&music.paused)startMusic();};
  document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
  $('music-enabled').addEventListener('ryugi-change',ev=>{enabled=Boolean(ev.detail.value);enabled?startMusic():stopMusic();status();});
  $('effects-enabled').addEventListener('ryugi-change',ev=>{effects=Boolean(ev.detail.value);if(!effects)cue.pause();status();});
  $('piano-track').addEventListener('ryugi-change',ev=>{
    if(!tracks[String(ev.detail.value)]||track===ev.detail.value)return;
    ++request;cancelFade();music.pause();music.volume=0;track=String(ev.detail.value);error='';
    music.src=assemblyAssetUrl(tracks[track]!.file).href;
    enabled?startMusic():status();
  });
  $('sound-volume').addEventListener('ryugi-change',ev=>{
    volume=Math.max(0,Math.min(1,Number(ev.detail.value)/100));cue.volume=volume*.35;
    if(volume===0){cue.pause();stopMusic();}else if(enabled&&!referenceAudio){music.paused?startMusic():fadeTo(volume,100);}
    status();
  });
  music.addEventListener('playing',status);music.addEventListener('pause',status);
  music.addEventListener('error',()=>{error='assemble.ui.0099';status();});
  window.addEventListener('pagehide',()=>{++request;cancelFade();music.pause();cue.pause();});
  onLocale(status);status();startMusic();
  return{
    setReferenceAudio(active:boolean){
      if(referenceAudio===active)return;
      referenceAudio=active;
      if(active){++request;cancelFade();needsGesture=false;music.pause();cue.pause();}
      else if(enabled&&volume>0)startMusic();
      status();
    },
    syncControls(){
      enabled=$('music-enabled').checked;effects=$('effects-enabled').checked;
      volume=Math.max(0,Math.min(1,Number($('sound-volume').value)/100));cue.volume=volume*.35;
      const restored=$('piano-track').value;
      if(restored&&tracks[restored]&&restored!==track){++request;music.pause();track=String(restored);music.src=assemblyAssetUrl(tracks[track]!.file).href;}
      enabled?startMusic():stopMusic();status();
    },
    observe(before:PlaybackState,after:PlaybackState,now:number){
      if(referenceAudio||!shouldPlayCompletion(before,after,now,lastCueAt,effects,volume))return;
      // Reserve the interval even when autoplay is blocked, so cues never queue up.
      lastCueAt=now;cue.currentTime=0;cue.playbackRate=1;cue.volume=volume*.35;
      cue.play().then(()=>{cueCount++;}).catch(()=>{});
    },
    get state(){return{enabled,effects,volume,track,referenceAudio,needsGesture,error,paused:music.paused,currentTime:music.currentTime,playbackRate:music.playbackRate,actualVolume:music.volume,cueCount,cuePaused:cue.paused};}
  };
}
