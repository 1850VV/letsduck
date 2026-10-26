// The button owns its pointer until release, including when it leaves the stage.
export function bindCompareHold({button,stage,line,canStart,begin,move,end}) {
  let pointer=null,timer=null,active=false,startX=0,lastX=0,dragged=false;
  const fraction=x=>Math.max(0,Math.min(1,(x-stage.getBoundingClientRect().left)/stage.clientWidth));
  function start(x) {
    if(active||!canStart())return;
    active=true;button.classList.add('on');button.setAttribute('aria-pressed','true');
    line.hidden=x===undefined;if(x!==undefined)line.style.left=fraction(x)*100+'%';
    stage.dataset.comparing='original';begin();
  }
  function stop() {
    clearTimeout(timer);timer=null;const id=pointer;pointer=null;dragged=false;
    if(id!==null&&button.hasPointerCapture(id))button.releasePointerCapture(id);
    if(!active)return;
    active=false;button.classList.remove('on');button.setAttribute('aria-pressed','false');line.hidden=true;delete stage.dataset.comparing;end();
  }
  function drag(x) {
    if(!active)return;
    dragged ||= Math.abs(x-startX)>5;if(!dragged)return;
    const at=fraction(x);line.style.left=at*100+'%';stage.dataset.comparing='split';move(at);
  }
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0||pointer!==null||!canStart())return;
    event.preventDefault();stop();pointer=event.pointerId;startX=lastX=event.clientX;button.setPointerCapture(pointer);
    timer=setTimeout(()=>{const b=button.getBoundingClientRect();start(b.left+b.width/2);drag(lastX);},280);
  });
  button.addEventListener('pointermove',event=>{if(event.pointerId===pointer){lastX=event.clientX;drag(lastX);}});
  button.addEventListener('pointerup',event=>{if(event.pointerId===pointer)stop();});
  button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',()=>{if(pointer!==null)stop();});
  button.addEventListener('contextmenu',event=>event.preventDefault());
  // Phone canvas long-press and the space bar keep their existing whole-model preview.
  button.addEventListener('compare-start',()=>start());button.addEventListener('compare-end',stop);
  addEventListener('blur',stop);addEventListener('resize',stop);addEventListener('pagehide',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  addEventListener('keydown',event=>{if(event.code==='Escape')stop();});
  return {start,stop};
}
