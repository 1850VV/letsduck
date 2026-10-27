// One pending frame per page. The consumer returns true only while visual
// state is evolving; invalidation also works during a frame or while hidden.
export function createRenderScheduler({draw,requestFrame=requestAnimationFrame,cancelFrame=cancelAnimationFrame}:{draw:(now:number)=>boolean|void;requestFrame?:typeof requestAnimationFrame;cancelFrame?:typeof cancelAnimationFrame}){
 let active=true,pending:number|null=null,dirty=false,drawing=false;
 const schedule=()=>{if(active&&pending===null&&!drawing)pending=requestFrame(frame);};
 function frame(now:number){
  pending=null;if(!active)return;
  dirty=false;drawing=true;let moving;
  try{moving=draw(now);}finally{drawing=false;}
  if(moving||dirty)schedule();
 }
 return{
  invalidate(){dirty=true;schedule();},
  setActive(value:boolean){active=value;if(!active){if(pending!==null)cancelFrame(pending);pending=null;}else{dirty=true;schedule();}}
 };
}
