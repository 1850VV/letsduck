import {experimentalDuck} from './experimental-access.js';
import type {ExperimentalAccess,ExperimentalDuck} from './experimental-access.js';
interface Hold{id:ExperimentalDuck;x:number;y:number;key:string|undefined;start:number;complete:boolean;frame:number}
interface Options{stage:HTMLElement;access:ExperimentalAccess;pick(event:PointerEvent):string|undefined;focus():string;enabled():boolean;refresh():void}
export function createExperimentalUI({stage,access,pick,focus,enabled,refresh}:Options){
 const find=<T extends HTMLElement=HTMLElement>(id:string)=>document.querySelector<T>('#'+id)!;
 const tip=find('beta-tip'),ring=find('hold-ring'),arc=ring.querySelector<SVGCircleElement>('.arc')!;
 let hold:Hold|null=null,suppressed=false,tipId:string|null=null,timer:number|undefined;
 const serverBlocked=(id:string)=>id==='debug'&&access.edition==='server';
 function arm(){clearTimeout(timer);if(!tip.hidden)timer=window.setTimeout(hide,3000);}
 function hide(){tip.hidden=true;tipId=null;clearTimeout(timer);}
 function position(){
  if(!tipId||tip.hidden)return;
  const b=stage.querySelector<HTMLElement>('[data-duck='+tipId+']');if(!b)return;
  const r=stage.getBoundingClientRect(),rect=b.getBoundingClientRect(),width=tip.offsetWidth,height=tip.offsetHeight;
  let x=rect.right-r.left+12,y=rect.top-r.top+5;
  if(r.width<700){x=rect.left-r.left+rect.width/2-width/2;y=16;}else if(x+width>r.width-8)x=rect.left-r.left-width-12;
  tip.style.left=Math.max(8,Math.min(r.width-width-8,x))+'px';
  const top=Math.max(8,8-r.top),bottom=Math.min(r.height-height-8,innerHeight-r.top-height-8);
  tip.style.top=Math.min(bottom,Math.max(top,y))+'px';
 }
 function show(id:string){
  tipId=id;tip.hidden=false;const denied=serverBlocked(id),unavailable=access.edition===null;
  tip.dataset.notice=denied?'server':'beta';
  find('tip-title').textContent=denied?'仅本地客户端可用':'功能正在内测';
  find('tip-copy').textContent=unavailable?'功能信息暂不可用，请刷新重试。':'内测功能，请勿用于实际生产。';
  find('tip-instruction').textContent=denied?'服务器版不支持设备调试。':'体验请长按 2 秒解锁。';
  position();arm();
 }
 function cancel(){const active=hold!==null;if(hold)cancelAnimationFrame(hold.frame);hold=null;ring.hidden=true;if(active)arm();}
 function end(){if(!hold)return;if(!hold.complete)find('tip-instruction').textContent='体验请长按 2 秒解锁。';cancel();window.setTimeout(()=>{suppressed=false;},0);}
 function start(id:string,x:number,y:number,key?:string){
  if(!enabled()||!experimentalDuck(id)||!access.locked(id)||hold)return;
  show(id);if(serverBlocked(id)||access.edition===null)return;
  clearTimeout(timer);hold={id,x,y,key,start:performance.now(),complete:false,frame:0};
  const r=stage.getBoundingClientRect();ring.style.left=(x-r.left)+'px';ring.style.top=(y-r.top)+'px';ring.hidden=false;
  const tick=(now:number)=>{
   const h=hold;if(!h)return;const p=Math.min(1,(now-h.start)/2000);
   arc.style.strokeDashoffset=String(126*(1-p));ring.setAttribute('aria-valuenow',String(Math.round(p*100)));
   find('tip-instruction').textContent='继续按住 · '+(2-p*2).toFixed(1)+' 秒';
   if(p===1){
    h.complete=true;suppressed=true;ring.hidden=true;
    if(access.unlock(h.id)){refresh();find('tip-copy').textContent=(h.id==='debug'?'调试鸭':'组装鸭')+'已恢复正常。';find('tip-instruction').textContent='现在可以点击进入，之后无需重复解锁。';}
    else{find('tip-copy').textContent='无法保存解锁状态，请允许本地存储后重试。';find('tip-instruction').textContent='';}
    return;
   }
   h.frame=requestAnimationFrame(tick);
  };hold.frame=requestAnimationFrame(tick);
 }
 stage.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||tip.contains(e.target as Node))return;const id=pick(e);if(id)start(id,e.clientX,e.clientY);},{capture:true});
 stage.addEventListener('pointermove',e=>{if(hold&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>6){cancel();hide();}},{capture:true});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,end,{capture:true});
 stage.addEventListener('contextmenu',e=>{if(hold)e.preventDefault();});
 stage.addEventListener('keydown',e=>{
  if(e.key==='Escape'){cancel();hide();return;}if(e.key!==' '&&e.key!=='Enter')return;
  const id=(e.target as Element).closest<HTMLElement>('[data-duck]')?.dataset.duck??focus();
  if(!access.locked(id))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
  const r=stage.querySelector<HTMLElement>('[data-duck='+id+']')!.getBoundingClientRect();start(id,r.left+r.width/2,r.top-25,e.key);
 },{capture:true});
 stage.addEventListener('keyup',e=>{if(hold?.key===e.key){e.preventDefault();e.stopImmediatePropagation();end();}},{capture:true});
 tip.addEventListener('pointerdown',e=>{arm();e.stopPropagation();});find('tip-close').onclick=()=>{cancel();hide();};
 window.addEventListener('blur',()=>{cancel();suppressed=false;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();suppressed=false;}});
 window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});
 return {show,hide,position,get suppressed(){return suppressed;}};
}
