/** Test-only passive GPU observation. Never changes product scene/material/camera. */
import type {Page} from 'playwright';
export function bufferKey(data:ArrayBufferView){const bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);let hash=2166136261;for(const byte of bytes)hash=Math.imul(hash^byte,16777619);return bytes.length+':'+(hash>>>0).toString(16);}
export interface ModelSignature{key:string;ids:string[]}
export interface ProbeConfig{selector:string;models:ModelSignature[];copies:number;lineup?:boolean}
interface HomePart{id:string;positionOffset:number;indexOffset:number;vertexCount:number;indexCount:number}
export function homeSignatures(parts:HomePart[],binary:Uint8Array,expected:string[]):ModelSignature[]{const signatures=new Map<string,string[]>();for(const id of expected){const part=parts.find(part=>part.id===id);if(!part)throw Error('Missing expected home part '+id);const{positionOffset,indexOffset,vertexCount,indexCount}=part;if(![positionOffset,indexOffset,vertexCount,indexCount].every(value=>Number.isSafeInteger(value)&&value>=0)||positionOffset+vertexCount*12>binary.length||indexOffset+indexCount*4>binary.length)throw Error('Invalid home geometry bounds');const key=bufferKey(binary.subarray(positionOffset,positionOffset+vertexCount*12))+'/'+bufferKey(binary.subarray(indexOffset,indexOffset+indexCount*4));signatures.set(key,[...(signatures.get(key)??[]),id]);}return[...signatures].map(([key,ids])=>({key,ids}));}
export interface InteractionProof{movement:number;movementMs:number;eventAckMs:number;frameMs:number;dx:number;preInputControl:string;preMoveControl:string;frameControl:string;preMoveTransform:string;frameTransform:string}
export interface ProbeState{drawn:string[];firstModelMs:number;usableMs:number;opaquePixels:number;readbackMs:number;frameTimes:number[];errors:string[];interactionChanged:boolean;sampling:boolean;copies:number;initialTransform:string;lastTransform:string;uploadHashMs:number;drawCalls:number;inputMs:number;trustedPointer:boolean;renderer:string;uniformHashMs:number;drawObserverMs:number;interactionProof:InteractionProof|null}
declare global{interface Window{__baselineVisual:ProbeState}}
export async function calibrate(page:Page,url:string,selector:string,expected:string[],copies:number,home?:{parts:HomePart[];binary:Uint8Array}):Promise<ProbeConfig>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));page.on('response',response=>{if(response.status()>=400&&!/\/api\/(duck-debug|servo-setup|servo-preparation)/.test(response.url()))errors.push(response.status()+' '+new URL(response.url()).pathname);});
 await page.addInitScript('globalThis.__name=fn=>fn');await page.goto(url);await page.bringToFront();await page.waitForSelector(selector);
 // Only unmeasured geometry calibration uses readiness. Timed pages require the GPU probe.
 try{await page.waitForFunction(selector=>selector.includes('home-viewport')?document.body.dataset.homeReady==='true':!!window.studioProto,selector,{timeout:60000});}catch(error){throw Error('Calibration preparation failed: '+JSON.stringify(errors),{cause:error});}
 if(home)return{selector,models:homeSignatures(home.parts,home.binary,expected),copies};
 const models=await page.evaluate(({expected})=>{
  const result=new Map<string,Set<string>>();
  function key(data:ArrayBufferView){const bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);let hash=2166136261;for(const byte of bytes)hash=Math.imul(hash^byte,16777619);return bytes.length+':'+(hash>>>0).toString(16);}
  for(const[id,mesh]of window.studioProto.view.stage.meshes){
   if(!expected.includes(id))continue;const position=mesh.geometry.getAttribute('position'),index=mesh.geometry.getIndex();
   if(!position||!index||!ArrayBuffer.isView(position.array)||!ArrayBuffer.isView(index.array))throw Error('Model has no indexed production geometry');
   const signature=key(position.array)+'/'+key(index.array);const ids=result.get(signature)??new Set<string>();ids.add(id);result.set(signature,ids);
  }
  const found=[...result.values()].flatMap(ids=>[...ids]);if(expected.some(id=>!found.includes(id)))throw Error('Incomplete production model set');
  return[...result].map(([key,ids])=>({key,ids:[...ids]}));
 },{expected});
 return{selector,models,copies,lineup:true};
}
function install(config:ProbeConfig){
 const state:ProbeState={drawn:[],firstModelMs:-1,usableMs:-1,opaquePixels:0,readbackMs:0,frameTimes:[],errors:[],interactionChanged:false,sampling:false,copies:config.copies,initialTransform:'',lastTransform:'',uploadHashMs:0,drawCalls:0,inputMs:-1,trustedPointer:false,renderer:'',uniformHashMs:0,drawObserverMs:0,interactionProof:null};window.__baselineVisual=state;
 interface Control{ack:boolean;placement:string;turns:number[]}
 function control():Control{
  if(config.lineup){const canvas=document.querySelector<HTMLCanvasElement>(config.selector),groups=window.studioProto?.view.stage.layer.children??[];return{ack:canvas?.style.cursor==='grabbing'&&window.studioProto?.state.step===1,placement:'',turns:groups.map(group=>group.children[0]?.rotation.y??NaN)};}
  const stage=document.querySelector<HTMLElement>('.duck-stage');return{ack:!!stage?.classList.contains('dragging')&&stage.dataset.settled==='false',placement:JSON.stringify([...document.querySelectorAll<HTMLElement>('[data-duck]')].map(element=>[element.dataset.duck,element.style.opacity,element.style.zIndex])),turns:[]};
 }
 let lastCompleteTransform='',sequence=0,input:{id:number;x:number;control:Control}|undefined,movement:{sequence:number;x:number;ms:number;control:Control;transform:string;ackMs:number}|undefined;
 document.addEventListener('pointerdown',event=>{if(event.isTrusted&&event.button===0&&event.isPrimary&&event.target instanceof Element&&(event.target.matches(config.selector)||event.target.closest('.duck-stage'))){state.trustedPointer=true;state.inputMs=performance.now();input={id:event.pointerId,x:event.clientX,control:control()};movement=undefined;}},true);
 document.addEventListener('pointermove',event=>{if(!event.isTrusted||!input||event.pointerId!==input.id||!(event.buttons&1)||Math.abs(event.clientX-input.x)<=6||event.clientX===(movement?.x??input.x))return;movement={sequence:++sequence,x:event.clientX,ms:performance.now(),control:control(),transform:lastCompleteTransform,ackMs:-1};},true);
 document.addEventListener('pointermove',event=>{if(!event.isTrusted||!input||!movement||event.pointerId!==input.id||event.clientX!==movement.x)return;const after=control();if(after.ack&&(config.lineup||(after.placement!==movement.control.placement&&after.placement!==input.control.placement)))movement.ackMs=performance.now();});
 const release=()=>{input=undefined;movement=undefined;};document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);
 const models=new Map(config.models.map(value=>[value.key,value.ids])),buffers=new WeakMap<WebGLBuffer,string>(),programs=new WeakMap<WebGLProgram,number>(),uniforms=new WeakMap<WebGLUniformLocation,string>();
 interface Vertex{element:WebGLBuffer|null;attributes:Map<number,WebGLBuffer>}
 const vaos=new Map<WebGLVertexArrayObject|null,Vertex>();let vao:WebGLVertexArrayObject|null=null,array:WebGLBuffer|null=null,program:WebGLProgram|null=null,framebuffer:WebGLFramebuffer|null=null,transform='',context:WebGL2RenderingContext|undefined;
 let frameDraws=new Map<string,Set<string>>();
 function vertex(){let value=vaos.get(vao);if(!value){value={element:null,attributes:new Map()};vaos.set(vao,value);}return value;}
 function key(data:ArrayBufferView){const bytes=new Uint8Array(data.buffer,data.byteOffset,data.byteLength);let hash=2166136261;for(const byte of bytes)hash=Math.imul(hash^byte,16777619);return bytes.length+':'+(hash>>>0).toString(16);}
 const prototype=WebGL2RenderingContext.prototype;
 HTMLCanvasElement.prototype.getContext=new Proxy(HTMLCanvasElement.prototype.getContext,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(!context&&result instanceof WebGL2RenderingContext)context=result;return result;}});
 prototype.bindVertexArray=new Proxy(prototype.bindVertexArray,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(receiver instanceof WebGL2RenderingContext&&receiver.canvas instanceof HTMLCanvasElement&&receiver.canvas.matches(config.selector)){context=receiver;vao=args[0] instanceof WebGLVertexArrayObject?args[0]:null;}return result;}});
 prototype.bindBuffer=new Proxy(prototype.bindBuffer,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context){const buffer=args[1] instanceof WebGLBuffer?args[1]:null;if(args[0]===context.ARRAY_BUFFER)array=buffer;if(args[0]===context.ELEMENT_ARRAY_BUFFER)vertex().element=buffer;}return result;}});
 prototype.bufferData=new Proxy(prototype.bufferData,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context&&ArrayBuffer.isView(args[1])){const buffer=args[0]===context.ARRAY_BUFFER?array:args[0]===context.ELEMENT_ARRAY_BUFFER?vertex().element:null;if(buffer){const start=performance.now();buffers.set(buffer,key(args[1]));state.uploadHashMs+=performance.now()-start;}}return result;}});
 prototype.vertexAttribPointer=new Proxy(prototype.vertexAttribPointer,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context&&typeof args[0]==='number'&&array)vertex().attributes.set(args[0],array);return result;}});
 prototype.useProgram=new Proxy(prototype.useProgram,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context){program=args[0] instanceof WebGLProgram?args[0]:null;if(program&&!programs.has(program))programs.set(program,context.getAttribLocation(program,'position'));}return result;}});
 prototype.bindFramebuffer=new Proxy(prototype.bindFramebuffer,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context&&(args[0]===context.FRAMEBUFFER||args[0]===context.DRAW_FRAMEBUFFER))framebuffer=args[1] instanceof WebGLFramebuffer?args[1]:null;return result;}});
 prototype.getUniformLocation=new Proxy(prototype.getUniformLocation,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context&&result instanceof WebGLUniformLocation&&typeof args[1]==='string')uniforms.set(result,args[1]);return result;}});
 prototype.uniformMatrix4fv=new Proxy(prototype.uniformMatrix4fv,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args);if(context&&receiver===context&&args[0] instanceof WebGLUniformLocation&&uniforms.get(args[0])==='modelViewMatrix'&&ArrayBuffer.isView(args[2])){const start=state.sampling?performance.now():0;transform=key(args[2]);if(state.sampling)state.uniformHashMs+=performance.now()-start;}return result;}});
 prototype.drawElements=new Proxy(prototype.drawElements,{apply(target,receiver:unknown,args:unknown[]){const result:unknown=Reflect.apply(target,receiver,args),start=state.sampling?performance.now():0;if(context&&receiver===context&&framebuffer===null&&program){state.drawCalls++;const attributes=vertex(),position=attributes.attributes.get(programs.get(program)??-1),element=attributes.element;if(position&&element){const signature=buffers.get(position)+'/'+buffers.get(element);if(models.has(signature)){const values=frameDraws.get(signature)??new Set<string>();values.add(transform);frameDraws.set(signature,values);if(!state.lastTransform)state.lastTransform=transform;}}}if(state.sampling)state.drawObserverMs+=performance.now()-start;return result;}});
 const raf=window.requestAnimationFrame.bind(window);
 window.requestAnimationFrame=callback=>raf(time=>{
  frameDraws=new Map();state.lastTransform='';callback(time);
  if(!context||!(context.canvas instanceof HTMLCanvasElement)||!context.canvas.matches(config.selector)||config.models.some(model=>(frameDraws.get(model.key)?.size??0)<model.ids.length*state.copies))return;
  if(state.firstModelMs<0){
   const extension=context.getExtension('WEBGL_debug_renderer_info');state.renderer=String(context.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:context.RENDERER));
   const start=performance.now(),pixels=new Uint8Array(context.drawingBufferWidth*context.drawingBufferHeight*4);context.readPixels(0,0,context.drawingBufferWidth,context.drawingBufferHeight,context.RGBA,context.UNSIGNED_BYTE,pixels);
   if(context.getError()!==context.NO_ERROR)state.errors.push('GPU draw/readback error');
   for(let index=3;index<pixels.length;index+=4)if(pixels[index]!>200)state.opaquePixels++;
   state.readbackMs=performance.now()-start;state.firstModelMs=performance.now();state.initialTransform=state.lastTransform;state.drawn=config.models.flatMap(model=>model.ids);
   if(state.opaquePixels<64)state.errors.push('Complete model draw has no foreground pixels');
  }
  const sized=!config.lineup||(window.studioProto?.view.stage.layer.children.length===4&&window.studioProto.view.stage.layer.children.every(group=>group.visible&&group.scale.x>=.9));
  const current=control(),move=movement,down=input;let response=false;
  if(move&&down&&move.ackMs>=0&&current.ack){
   if(config.lineup){const direction=Math.sign(move.x-down.x);response=current.turns.length===4&&down.control.turns.length===4&&move.control.turns.length===4&&current.turns.filter((angle,index)=>{const start=down.control.turns[index],before=move.control.turns[index];return start!==undefined&&before!==undefined&&(angle-start)*direction>1e-5&&(angle-before)*direction>1e-5;}).length>=3;}
   else response=current.placement!==down.control.placement&&current.placement!==move.control.placement;
  }
  // The business response and GPU change must belong to this trusted movement,
  // in this frame. Entrance/hover changes since the loading frame cannot qualify.
  if(state.sampling&&state.trustedPointer&&sized&&response&&move&&down&&state.lastTransform!==move.transform){if(state.frameTimes.at(-1)!==time)state.frameTimes.push(time);state.interactionChanged=true;if(state.usableMs<0){state.usableMs=performance.now();state.interactionProof={movement:move.sequence,movementMs:move.ms,eventAckMs:move.ackMs,frameMs:state.usableMs,dx:move.x-down.x,preInputControl:JSON.stringify(down.control),preMoveControl:JSON.stringify(move.control),frameControl:JSON.stringify(current),preMoveTransform:move.transform,frameTransform:state.lastTransform};}}
  lastCompleteTransform=state.lastTransform;
 });
}
export async function installVisualProbe(page:{addInitScript(script:{content:string}):Promise<unknown>},config:ProbeConfig){await page.addInitScript({content:'globalThis.__name=fn=>fn;('+install.toString()+')('+JSON.stringify(config)+');'});}
