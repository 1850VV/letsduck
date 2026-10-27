interface CompareHoldOptions {button:HTMLButtonElement;stage:HTMLElement;line:HTMLElement;canStart():boolean;begin():void;move(at:number):void;rotate(dx:number,dy:number):void;end():void}
// Track the owned pointer across button chords: releasing right must keep left's comparison alive.
export function bindCompareHold({button,stage,line,canStart,begin,move,rotate,end}:CompareHoldOptions) {
  let pointer:number|null=null,timer:ReturnType<typeof setTimeout>|null=null,active=false,startX=0,lastX=0,dragged=false,at=.5,originX=0,originAt=.5;
  let rotating=false,rotateX=0,rotateY=0,suppressContext=false;
  const fraction=(x:number)=>Math.max(0,Math.min(1,(x-stage.getBoundingClientRect().left)/stage.clientWidth));
  function start(x?:number) {
    if(active||!canStart())return;
    active=true;button.classList.add('on');button.setAttribute('aria-pressed','true');
    line.hidden=x===undefined;if(x!==undefined){at=originAt=fraction(x);line.style.left=at*100+'%';}
    stage.dataset.comparing='original';begin();
  }
  function setRotating(on:boolean){rotating=on;button.classList.toggle('rotating',on);}
  function stop() {
    if(timer!==null)clearTimeout(timer);timer=null;const id=pointer;pointer=null;dragged=false;setRotating(false);
    if(id!==null&&button.hasPointerCapture(id))button.releasePointerCapture(id);
    if(!active)return;
    active=false;button.classList.remove('on');button.setAttribute('aria-pressed','false');line.hidden=true;delete stage.dataset.comparing;end();
  }
  function showCut(value:number) {
    at=Math.max(0,Math.min(1,value));line.hidden=false;line.style.left=at*100+'%';stage.dataset.comparing='split';move(at);
  }
  function drag(x:number) {
    if(!active)return;
    dragged ||= Math.abs(x-startX)>5;
    if(dragged)showCut(originAt+(x-originX)/stage.clientWidth);
  }
  function pointerMove(event:PointerEvent) {
    if(event.pointerId!==pointer)return;
    if(!(event.buttons&1)){stop();return;}
    lastX=event.clientX;
    if(event.pointerType==='mouse'&&(event.buttons&2)) {
      if(!rotating) {
        if(timer!==null)clearTimeout(timer);timer=null;
        if(!active){const b=button.getBoundingClientRect();start(b.left+b.width/2);}
        setRotating(true);suppressContext=true;rotateX=event.clientX;rotateY=event.clientY;showCut(at);
      } else {
        rotate(event.clientX-rotateX,event.clientY-rotateY);rotateX=event.clientX;rotateY=event.clientY;
      }
      return;
    }
    if(rotating){setRotating(false);originX=event.clientX;originAt=at;dragged=true;return;}
    drag(lastX);
  }
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0||pointer!==null||!canStart())return;
    event.preventDefault();stop();pointer=event.pointerId;startX=lastX=originX=event.clientX;button.setPointerCapture(pointer);
    timer=setTimeout(()=>{const b=button.getBoundingClientRect();start(b.left+b.width/2);drag(lastX);},280);
  });
  // Chromium can drop capture when only right is released; window tracking covers that first move.
  window.addEventListener('pointermove',pointerMove,true);
  window.addEventListener('pointerup',event=>{if(event.pointerId===pointer){if(event.buttons&1)pointerMove(event);else stop();}},true);
  window.addEventListener('pointercancel',event=>{if(event.pointerId===pointer)stop();},true);
  button.addEventListener('lostpointercapture',event=>{if(event.pointerId!==pointer)return;if(event.buttons&1)button.setPointerCapture(pointer);else stop();});
  window.addEventListener('pointerdown',()=>{suppressContext=false;},true);
  window.addEventListener('contextmenu',event=>{if(pointer!==null||suppressContext){event.preventDefault();suppressContext=false;}});
  button.addEventListener('contextmenu',event=>event.preventDefault());
  // Phone canvas long-press and the space bar keep their existing whole-model preview.
  button.addEventListener('compare-start',()=>start());button.addEventListener('compare-end',stop);
  window.addEventListener('blur',stop);window.addEventListener('resize',stop);window.addEventListener('pagehide',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('keydown',event=>{if(event.code==='Escape')stop();});
  return {start,stop};
}
