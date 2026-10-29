import test from 'node:test';
import assert from 'node:assert/strict';
import {createCarousel} from '../frontend/home/carousel.js';

class Stage extends EventTarget {
 dataset={settled:'true'};clientWidth=1000;
 classList={add(_name:string){},remove(_name:string){}};
 focus(_options?:FocusOptions){}
 setPointerCapture(_id:number){} hasPointerCapture(_id:number){return false;} releasePointerCapture(_id:number){}
 closest(){return null;}
}
class Pointer extends Event {
 readonly pointerId=1;readonly button=0;readonly isPrimary=true;readonly clientY=100;
 constructor(type:string,readonly clientX=100){super(type,{cancelable:true});}
}
class Click extends Event {constructor(readonly detail:number){super('click',{cancelable:true});}}
function fixture(){
 const names=['document','window','Element','matchMedia','requestAnimationFrame','cancelAnimationFrame'] as const;
 const original=names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)] as const);
 const stage=new Stage(),frames=new Map<number,FrameRequestCallback>();let frame=0,hit:string|undefined='paint',enabled=true;
 Object.defineProperties(globalThis,{
  document:{configurable:true,value:new EventTarget()},window:{configurable:true,value:new EventTarget()},Element:{configurable:true,value:Stage},
  matchMedia:{configurable:true,value:()=>({matches:false})},
  requestAnimationFrame:{configurable:true,value:(callback:FrameRequestCallback)=>{frames.set(++frame,callback);return frame;}},
  cancelAnimationFrame:{configurable:true,value:(id:number)=>{frames.delete(id);}},
 });
 const entered:string[]=[];
 const carousel=createCarousel({stage:stage as unknown as HTMLElement,ids:['paint','debug','assemble'],initial:'debug',enabled:()=>enabled,pick:()=>hit,render(){},activate:id=>{entered.push(id);enabled=false;}});
 carousel.jump('debug');
 return {stage,entered,carousel,setHit(id:string|undefined){hit=id;},tap(detail:number){stage.dispatchEvent(new Pointer('pointerdown'));stage.dispatchEvent(new Pointer('pointerup'));stage.dispatchEvent(new Click(detail));},
  dispose(){carousel.stop();for(const [name,descriptor]of original){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name);}}};
}
test('rapid double click enters the first selected side duck while the carousel is still moving',()=>{
 const value=fixture();try{value.tap(1);assert.deepEqual(value.entered,[]);assert.equal(value.stage.dataset.settled,'false');value.tap(2);assert.deepEqual(value.entered,['paint']);}finally{value.dispose();}
});
test('model movement between double-click presses cannot redirect the first duck to its neighbour',()=>{
 const value=fixture();try{value.tap(1);value.setHit('assemble');value.tap(2);assert.deepEqual(value.entered,['paint']);}finally{value.dispose();}
});
test('a drag following a first click cancels the fast-entry candidate',()=>{
 const value=fixture();try{value.tap(1);value.stage.dispatchEvent(new Pointer('pointerdown'));value.stage.dispatchEvent(new Pointer('pointermove',180));value.stage.dispatchEvent(new Pointer('pointerup',180));value.stage.dispatchEvent(new Click(2));assert.deepEqual(value.entered,[]);}finally{value.dispose();}
});
test('single side clicks retain the existing rotate-only behaviour',()=>{
 const value=fixture();try{value.tap(1);assert.deepEqual(value.entered,[]);}finally{value.dispose();}
});
test('an already centred duck enters once on the first click',()=>{
 const value=fixture();try{value.setHit('debug');value.tap(1);value.tap(2);assert.deepEqual(value.entered,['debug']);}finally{value.dispose();}
});
