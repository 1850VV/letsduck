interface CarouselOptions{stage:HTMLElement;ids:string[];initial:string;enabled():boolean;pick(event:PointerEvent):string|null|undefined;render(angle:number,focus:string):void;activate(id:string):void}
interface Drag{id:number;x:number;y:number;lastX:number;angle:number;dragged:boolean;wasMoving:boolean;hit:string|null|undefined;samples:{x:number;t:number}[]}
interface Spring{target:number;velocity:number;last:number;frame:number}
// Pointer/keyboard interaction shared by the three home ducks.
export function createCarousel({stage,ids,initial,enabled,pick,render,activate}:CarouselOptions){
 const step=Math.PI*2/ids.length,centre=ids.indexOf('debug');
 let angle=(centre-ids.indexOf(initial))*step,down:Drag|null=null,spring:Spring|null=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const focus=()=>ids[((centre-Math.round(angle/step))%ids.length+ids.length)%ids.length]!;
 function draw(){stage.dataset.settled=String(!spring&&!down);render(angle,focus());}
 function cancel(){if(spring)cancelAnimationFrame(spring.frame);spring=null;}
 function settle(target:number,velocity=0){
  cancel();
  if(reduced.matches){angle=target;draw();return;}
  spring={target,velocity,last:performance.now(),frame:0};
  const tick=(now:number)=>{
   if(!spring)return;
   const dt=Math.min(.032,Math.max(.001,(now-spring.last)/1000));spring.last=now;
   spring.velocity+=((spring.target-angle)*155-spring.velocity*24)*dt;angle+=spring.velocity*dt;
   if(Math.abs(spring.target-angle)<.0007&&Math.abs(spring.velocity)<.008){angle=spring.target;spring=null;draw();return;}
   draw();spring.frame=requestAnimationFrame(tick);
  };
  spring.frame=requestAnimationFrame(tick);draw();
 }
 function targetFor(id:string){const base=(centre-ids.indexOf(id))*step;return base+Math.round((angle-base)/(step*ids.length))*step*ids.length;}
 function jump(id:string){cancel();angle=targetFor(id);draw();}
 function select(id:string,wasMoving=!!spring){
  if(!enabled()||!ids.includes(id))return;
  if(id!==focus()||wasMoving)settle(targetFor(id));else activate(id);
 }
 stage.addEventListener('pointerdown',event=>{
  if(!enabled()||event.button!==0||!event.isPrimary||down)return;
  const wasMoving=!!spring;cancel();stage.focus({preventScroll:true});
  down={id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,angle,dragged:false,wasMoving,hit:pick(event),samples:[{x:event.clientX,t:performance.now()}]};
  stage.setPointerCapture(event.pointerId);
 });
 stage.addEventListener('pointermove',event=>{
  if(!down||down.id!==event.pointerId)return;
  const delta=event.clientX-down.x;if(Math.abs(delta)>6)down.dragged=true;if(!down.dragged)return;
  stage.classList.add('dragging');angle=down.angle+delta*step/Math.max(180,stage.clientWidth*.32);
  const now=performance.now();down.samples.push({x:event.clientX,t:now});down.samples=down.samples.filter(sample=>now-sample.t<100);down.lastX=event.clientX;draw();
 });
 function end(event:PointerEvent,cancelled=false){
  if(!down||down.id!==event.pointerId)return;
  const drag=down;down=null;stage.classList.remove('dragging');
  if(stage.hasPointerCapture(event.pointerId))stage.releasePointerCapture(event.pointerId);
  if(drag.dragged){
   const sample=drag.samples[0]!,elapsed=performance.now()-sample.t;
   const velocity=!cancelled&&elapsed>0&&elapsed<150?(drag.lastX-sample.x)/elapsed*1000*step/Math.max(180,stage.clientWidth*.32):0;
   const carry=Math.max(-step*.42,Math.min(step*.42,velocity*.12));
   settle(Math.round((angle+carry)/step)*step,Math.max(-8,Math.min(8,velocity))*.25);
  }else if(!cancelled&&drag.hit)select(drag.hit,drag.wasMoving);
  else settle(Math.round(angle/step)*step);
 }
 stage.addEventListener('pointerup',event=>end(event));
 stage.addEventListener('pointercancel',event=>end(event,true));
 stage.addEventListener('lostpointercapture',event=>end(event,true));
 stage.addEventListener('dragstart',event=>event.preventDefault());
 stage.addEventListener('click',event=>{
  event.preventDefault();if(event.detail===0){const id=event.target instanceof Element?event.target.closest<HTMLElement>('[data-duck]')?.dataset.duck:undefined;if(id)select(id);}
 });
 stage.addEventListener('keydown',event=>{
  if(!enabled())return;
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();settle(Math.round(angle/step)*step+(event.key==='ArrowRight'?step:-step));}
  else if(event.key==='Enter'&&event.target===stage){event.preventDefault();select(focus());}
 });
 function stop(){
  cancel();const pointerId=down?.id;down=null;stage.classList.remove('dragging');
  if(pointerId!==undefined&&stage.hasPointerCapture(pointerId))stage.releasePointerCapture(pointerId);
  angle=Math.round(angle/step)*step;draw();
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',stop,{once:true});
 return {get angle(){return angle;},jump,select,stop,rotateTo:(id:string)=>settle(targetFor(id))};
}
