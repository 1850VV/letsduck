import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { toCreasedNormals } from '../vendor/BufferGeometryUtils.js';
import { createAssemblyFocus, isFocusStep } from './assembly-focus.mjs';
import { createAssemblyMagnifier } from './assembly-magnifier.mjs';
import { buildFineCues } from './fine-cues.mjs';
import {createLessonPlayer} from './lesson-player.mjs';
import {createLessonSound} from './lesson-sound.mjs';
import {updateAssemblyCameraDepth} from './camera-depth.mjs';
import {createRenderScheduler} from './render-scheduler.mjs';
import {createRenderQuality} from './render-quality.mjs';
import {fitsForParts} from './model-fit.mjs';
import {buildCableCurve} from './cable-path.mjs';
import {loadHardwareModels} from './hardware-models.mjs';
import {LOOK} from '../shared/duck-look.mjs';
import { STEPS,CHAPTERS,ACTORS,snapshot,chapterFor,OVERVIEW_STEP,PLUG_PAIRS } from './hardware-state.mjs';

import {actorQuaternion,cableStyle,plugPins,guidanceDelta,cameraPreset,cablePlugQuaternion,interpolatePose,socketQuaternion} from './render-pose.mjs';

const $=id=>document.getElementById(id);
const fmt=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
let step=0,progress=1,playing=false,cameraTween=null,uiReady=false,ready=false;
const lessonPlayer=createLessonPlayer(STEPS.map((s,i)=>()=>{const focused=isFocusStep(s.id),count=buildFineCues(i).length;return{durationMs:s.duration*1000*(focused?Math.max(1.8,Math.min(4.5,count*.55)):1),holdMs:focused?900:0,settleMs:focused?1500:900};}));
const lessonSound=createLessonSound();
let currentState=snapshot(0,1),guidanceEndState=snapshot(0,1),backTransition=null;
const host=$('canvas-host'),stage=$('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=LOOK.exposure;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,1600);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.13;
controls.enablePan=true;controls.minDistance=66;controls.maxDistance=1100;controls.maxPolarAngle=Math.PI*.85;
controls.target.set(0,28,0);camera.position.set(...STEPS[0].camera);controls.update();
// letsduck: the studio's light (shared/duck-look.mjs), so a part looks the same on both pages; the key still casts shadows.
const hemi=new THREE.HemisphereLight(0xf1f5ff,0xb6c2d8,2.2);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfffbf7,3.2);key.position.set(-160,380,290);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-250;key.shadow.camera.right=250;key.shadow.camera.top=250;key.shadow.camera.bottom=-250;key.shadow.normalBias=.15;key.shadow.bias=-.0002;scene.add(key);
const fill=new THREE.DirectionalLight(0xdde9ff,1.4);fill.position.set(240,180,-100);scene.add(fill);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=LOOK.environment;room.dispose();pmrem.dispose();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.ShadowMaterial({color:0x536480,opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(210,21,0xd9e1f0,0xe2e8f2);grid.position.y=-.18;grid.material.transparent=true;grid.material.opacity=.23;scene.add(grid);
const renderQuality=createRenderQuality({renderer,scene,key,fill,hemi,ground});
const entities=new Map(),selectables=[];
const metal=new THREE.MeshStandardMaterial({color:0xa9b1bd,metalness:.7,roughness:.31});
const dark=new THREE.MeshStandardMaterial({color:0x252b36,roughness:.59,metalness:.12});
const white=new THREE.MeshStandardMaterial({color:0xf4f5f9,roughness:.43});
function entity(id,object){const materials=new Map();object.userData.actorId=id;object.traverse(o=>{o.userData.actorId=id;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const clone=m=>{if(!materials.has(m)){const copy=m.clone();copy.userData={...m.userData,baseOpacity:m.opacity,baseTransparent:m.transparent};materials.set(m,copy);}return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);}});scene.add(object);entities.set(id,object);selectables.push(object);return object;}
function mesh(g,mat){return new THREE.Mesh(g,mat);}
function screw(length=6,radius=1,countersunk=true){
  const group=new THREE.Group();
  const shaft=mesh(new THREE.CylinderGeometry(radius*.82,radius*.82,length,16),metal);shaft.position.y=-length/2;group.add(shaft);
  const head=mesh(countersunk?new THREE.CylinderGeometry(radius*1.9,radius,.95,24):new THREE.CylinderGeometry(radius*1.85,radius*1.85,1.1,24),metal);head.position.y=.15;group.add(head);
  for(let i=0;i<Math.floor(length/.65);i++){
    const thread=mesh(new THREE.TorusGeometry(radius*.86,.12,5,16),metal);thread.rotation.x=Math.PI/2;thread.position.y=-.55-i*.65;group.add(thread);
  }
  for(let i=0;i<2;i++){const slot=mesh(new THREE.BoxGeometry(radius*2.4,.04,.3),dark);slot.position.y=.71;slot.rotation.y=i*Math.PI/2;group.add(slot);}
  group.rotation.z=-Math.PI/2;return group;
}
function makeHorn(){
  const shape=new THREE.Shape();shape.absarc(0,0,5.6,0,Math.PI*2,false);
  for(let i=0;i<7;i++){const hole=new THREE.Path(),r=i===6?1.15:.62,angle=i*Math.PI/3,x=i===6?0:3.7*Math.cos(angle),y=i===6?0:3.7*Math.sin(angle);hole.absarc(x,y,r,0,Math.PI*2,true);shape.holes.push(hole);}
  const g=new THREE.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:false,curveSegments:24});g.translate(0,0,-.75);g.rotateY(Math.PI/2);return mesh(g,dark);
}
function makePlug(pins=3){const group=new THREE.Group(),body=mesh(new THREE.BoxGeometry(6,4,3.2),white);group.add(body);
  const latch=mesh(new THREE.BoxGeometry(2,1.0,1.5),white);latch.position.set(0,2.25,-.3);group.add(latch);
  for(let i=0;i<pins;i++){const hole=mesh(new THREE.BoxGeometry(.85,1.55,.12),dark);hole.position.set((i-(pins-1)/2)*1.7,-.1,-1.65);group.add(hole);}return group;}
function makeBoard(a){
  const root=new THREE.Group(),size=a.size||[68,2,53],vertical=size[2]<size[1],w=size[0],d=vertical?size[1]:size[2],thickness=vertical?size[2]:size[1];
  const group=new THREE.Group();if(vertical)group.rotation.x=Math.PI/2;root.add(group);
  const uno=a.boardType==='uno-q',pcb=new THREE.MeshStandardMaterial({color:a.color||(uno?0x206b73:0x245995),roughness:.55,metalness:.08});
  group.add(mesh(new THREE.BoxGeometry(w,thickness,d),pcb));
  for(const x of [-w/2+4,w/2-4])for(const z of [-d/2+4,d/2-4]){const hole=mesh(new THREE.TorusGeometry(1.35,.48,5,12),metal);hole.rotation.x=Math.PI/2;hole.position.set(x,thickness/2+.1,z);group.add(hole);}
  const chip=mesh(new THREE.BoxGeometry(w*.32,2.8,d*.3),dark);chip.position.y=thickness/2+1.4;group.add(chip);
  if(!a.ports?.some(p=>p.kind.includes('header')))for(const z of [-d*.38,d*.38]){
    const header=mesh(new THREE.BoxGeometry(w*.76,4,3.3),dark);header.position.set(0,thickness/2+2,z);group.add(header);
    for(let i=0;i<12;i++){const pin=mesh(new THREE.CylinderGeometry(.24,.24,4,5),metal);pin.position.set((i-5.5)*w*.057,thickness/2+4,z);group.add(pin);}
  }
  const label=document.createElement('canvas');label.width=256;label.height=64;const ctx=label.getContext('2d');ctx.fillStyle=a.color||(uno?'#206b73':'#245995');ctx.fillRect(0,0,256,64);ctx.fillStyle='#e3f0e8';ctx.font='bold 27px sans-serif';ctx.textAlign='center';ctx.fillText(uno?'UNO Q':'LUWU',128,42);
  const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;const text=mesh(new THREE.PlaneGeometry(w*.42,d*.16),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));text.rotation.x=-Math.PI/2;text.position.set(0,thickness/2+.08,d*.24);group.add(text);
  const ports=a.ports?.length?a.ports:(uno?[{label:'USB-C',position:[-w/2,3,0],kind:'usb-c'}]:[{position:[w*.3,3,0],kind:'servo'},{position:[-w*.3,3,0],kind:'power'}]);
  for(const port of ports){
    if(port.kind.includes('header')){const body=mesh(new THREE.BoxGeometry(3.4,4,d*.74),dark);body.position.set(...port.position);root.add(body);for(let i=0;i<14;i++){const pin=mesh(new THREE.CylinderGeometry(.24,.24,port.kind==='male-header'?5:1,5),metal);pin.position.set(port.position[0],port.position[1]+(port.kind==='male-header'?-3:2.1),port.position[2]+(i-6.5)*d*.05);root.add(pin);}continue;}
    const usb=port.kind==='usb-c',power=port.kind==='power'||port.kind==='battery',p=mesh(new THREE.BoxGeometry(usb?8:power?5:7,usb?3.3:4,usb?7:4),usb?metal:white),direction=new THREE.Vector3(...(port.direction||(usb?(port.position[0]?[Math.sign(port.position[0]),0,0]:[0,0,Math.sign(port.position[2])||1]):[0,0,1]))),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),direction);p.position.set(...port.position);p.quaternion.copy(rotation);root.add(p);
    if(['usb-c','servo','power','battery'].includes(port.kind))p.userData.focusPort={label:port.label||port.kind};
    const inset=mesh(new THREE.BoxGeometry(usb?5.8:power?3.5:5.2,1.6,.15),dark);inset.position.fromArray(port.position).addScaledVector(direction,usb?3.55:2.05);inset.quaternion.copy(rotation);root.add(inset);
  }
  return root;
}
function makeBattery(a){
  const root=new THREE.Group(),size=a.size||[36,66,18],wrap=new THREE.MeshStandardMaterial({color:0x242932,roughness:.7});root.add(mesh(new THREE.BoxGeometry(...size),wrap));
  for(const sign of [-1,1]){const band=mesh(new THREE.BoxGeometry(size[0]+.2,size[1]*.09,size[2]+.2),dark);band.position.y=sign*size[1]*.3;root.add(band);}return root;
}
function makeCablePlug(type,end=0){
  if(type!=='usb-c'&&type!=='power')return hardwareModels.plug(end);
  if(type!=='usb-c'&&type!=='power')return makePlug();
  const root=new THREE.Group();root.add(mesh(new THREE.BoxGeometry(type==='usb-c'?6:5,3.1,6),type==='usb-c'?metal:white));
  const tip=mesh(new THREE.BoxGeometry(type==='usb-c'?4.8:3.4,1.8,.25),dark);tip.position.z=-3.1;root.add(tip);return root;
}
let hardwareModels=null;
const cableRecords=new Map(),wireMaterial=new THREE.MeshStandardMaterial({color:0x202633,roughness:.64});
function socketAt(point){
 for(const [id,a] of Object.entries(ACTORS)){const pose=currentState[id],ports=a.servoPorts||a.ports;if(!pose?.visible||!ports)continue;const q=actorQuaternion(a,pose);
  for(const port of ports){if(!port.normal&&!port.direction)continue;const normal=new THREE.Vector3(...(port.normal||port.direction)),local=new THREE.Vector3(...port.position).addScaledVector(normal,port.dockOffset??2.25),at=local.applyQuaternion(q).add(new THREE.Vector3(...pose.position));if(at.distanceTo(point)<.12)return q.clone().multiply(socketQuaternion({...port,normal:normal.toArray()}));}
 }return null;
}
function addFocusPorts(root,ports){
 for(const port of ports||[]){if(!port.normal&&!port.direction)continue;
  const size=port.focusSize||[port.kind==='power'||port.kind==='battery'?5:7.5,4.5,1.2];
  const proxy=mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial());proxy.visible=false;proxy.position.fromArray(port.position);proxy.quaternion.copy(socketQuaternion({...port,normal:port.normal||port.direction}));proxy.userData.focusPort={label:port.label||port.id||port.kind};proxy.userData.hardwareAsset='focus-proxy';root.add(proxy);
 }
}
function createActors(){
for(const [id,a] of Object.entries(ACTORS)){
  if(a.kind==='mesh')continue;
  let object;
  if(a.kind==='cable'){
    object=new THREE.Group();const lines=[];
    const style=cableStyle(a),approved=style.type==='servo';for(let i=0;i<style.count;i++){const mat=approved?hardwareModels.wireMaterial():new THREE.MeshStandardMaterial({color:style.colors[i],roughness:.65});const line=mesh(new THREE.BufferGeometry(),mat);lines.push(line);object.add(line);}
    const plugs=[makeCablePlug(a.cableType,0),makeCablePlug(a.cableType,1)];plugs.forEach((p,i)=>{p.visible=style.endpointPlugs[i];object.add(p);});
    cableRecords.set(id,{lines,plugs,type:a.cableType,approved,signature:''});
  }else if(a.kind==='screw'){
    object=new THREE.Group();const match=/M([\d.]+)x([\d.]+)/.exec(a.fastener||'');const child=hardwareModels.screw(a)||screw(match?Number(match[2]):4,match?Number(match[1])/2:1,!!a.fastener&&a.fastener!=='M3x16');
    child.rotation.z=a.orientationZ??-Math.PI/2;object.add(child);
  }else if(a.kind==='board'){object=hardwareModels.board(a);addFocusPorts(object,a.ports);}else if(a.kind==='battery')object=makeBattery(a);else if(a.kind==='adhesive')object=mesh(new THREE.BoxGeometry(...(a.size||[20,.3,16])),new THREE.MeshStandardMaterial({color:0xf1e7cd,transparent:true,opacity:.65,roughness:.8}));else object=a.kind==='horn'?hardwareModels.horn(id):plugPins(a)===3?hardwareModels.plug(PLUG_PAIRS.find(([plug])=>plug===id)?.[2]??0):makePlug(plugPins(a));
  entity(id,object);
}
}
function updateCable(id,points){
  const record=cableRecords.get(id);if(!points?.length||!record)return;
  const rotations=currentState[id].endpointQuaternions;
  const signature=points.flat().map(n=>n.toFixed(4)).join(',')+'|'+(rotations||[]).flat().map(n=>n.toFixed(6)).join(',');if(record.signature===signature)return;record.signature=signature;
  record.plugs[0].position.set(...points[0]);record.plugs[1].position.set(...points.at(-1));
  record.plugs.forEach((plug,i)=>{
    if(rotations?.[i]){plug.quaternion.fromArray(rotations[i]);return;}
    const q=actorQuaternion(ACTORS[id],currentState[id]),world=plug.position.clone().applyQuaternion(q).add(new THREE.Vector3(...currentState[id].position)),socket=socketAt(world);plug.quaternion.copy(socket?q.invert().multiply(socket):cablePlugQuaternion(points,i));
  });
  record.lines.forEach((line,i)=>{
    const lane=(i-(record.lines.length-1)/2)*(record.approved?1.3:.75);
    const curve=buildCableCurve({id,points,plugs:record.plugs,lane,approved:record.approved,state:currentState});
    const geometry=new THREE.TubeGeometry(curve,record.approved?56:40,record.type==='usb-c'?.75:record.type==='power'?.48:record.approved?.52:.31,8,false);line.geometry.dispose();line.geometry=geometry;
  });
}

const guideArrow=new THREE.ArrowHelper(new THREE.Vector3(-1,0,0),new THREE.Vector3(),20,0x4d6bfe,4,2);scene.add(guideArrow);
const selection=new THREE.Box3Helper(new THREE.Box3(),0x4d6bfe);scene.add(selection);selection.visible=false;
const assemblyFocus=createAssemblyFocus(scene,entities,cableRecords);
const assemblyMagnifier=createAssemblyMagnifier({renderer,scene,camera,stage,host,renderView:(world,view)=>renderQuality.render(world,view,'detail')});
let selected=null,selectedAnchor=null;
function applyState(state){
  currentState=state;renderQuality.invalidate();invalidate();
  for(const [id,obj] of entities){const pose=state[id];if(!pose)continue;obj.visible=pose.visible&&pose.opacity>.001;
    obj.position.set(...pose.position);
    if(ACTORS[id].kind==='cable'&&obj.visible)updateCable(id,pose.points);
    obj.quaternion.copy(actorQuaternion(ACTORS[id],pose));
    obj.traverse(child=>{if(child.isMesh){const mats=Array.isArray(child.material)?child.material:[child.material];for(const mat of mats){mat.opacity=pose.opacity*(mat.userData.baseOpacity??1);mat.transparent=pose.opacity<.999||!!mat.userData.baseTransparent;}}});
  }
  hardwareModels?.syncDiscs(entities,state);
  selection.visible=false;
  const visibleMesh=id=>ACTORS[id].kind==='mesh'&&entities.get(id)?.visible;const active=STEPS[step].parts.find(id=>visibleMesh(id)&&Math.hypot(...guidanceDelta(state[id],guidanceEndState[id]))>5)||STEPS[step].parts.find(visibleMesh)||STEPS[step].parts[0];
  const obj=entities.get(active);
  if(playing&&obj&&ACTORS[active].kind==='mesh'){
    const at=new THREE.Vector3(...state[active].position),delta=new THREE.Vector3(...guidanceDelta(state[active],guidanceEndState[active])),distance=delta.length();
    guideArrow.visible=distance>5;guideArrow.position.copy(at);if(guideArrow.visible){guideArrow.setDirection(delta.normalize());guideArrow.setLength(Math.min(24,distance),3,1.5);}
  }else guideArrow.visible=false;
}

let aspectScale=1;
function cameraTo(position,target,duration=650){const point=new THREE.Vector3(...target),to=new THREE.Vector3(...position).sub(point).multiplyScalar(aspectScale).add(point);cameraTween={from:camera.position.clone(),to,fromTarget:controls.target.clone(),toTarget:point,start:performance.now(),duration};}
function setAttributes(){
  const end=step===STEPS.length-1,playback=lessonPlayer.state;
  const replayLabel=$('replay-label');if(replayLabel)replayLabel.textContent=end?'红绿框演示':'重播本步';
  $('back').toggleAttribute('disabled',step===0);$('replay').toggleAttribute('disabled',step===0);
  $('start').hidden=step!==0||playback.autoplay;$('next').hidden=step===0||end;$('restart').hidden=!end;
  $('pause').hidden=!playing&&!(playback.autoplay||step>0&&progress<1);
  const pauseLabel=$('pause-label');if(pauseLabel)pauseLabel.textContent=playing?'暂停':'继续播放';
  const autoLabel=$('autoplay-label');if(autoLabel)autoLabel.textContent='自动播放 · '+(playback.autoplay?'开':'关');
  $('autoplay').toggleAttribute('disabled',!ready);$('autoplay').dataset.active=String(playback.autoplay);const autoButton=$('autoplay').querySelector('button');if(autoButton){autoButton.setAttribute('aria-label','自动播放');autoButton.setAttribute('aria-pressed',String(playback.autoplay));autoButton.title='开启后从第0步开始，连续播放全部14个阶段';}
  $('play-state').textContent=playback.finished?'全部播放完成':playback.autoplay?(playing?(playback.phase==='settle'?'本步完成，准备下一步':'自动播放中'):'自动播放已暂停'):playing?'正在演示':step===0?'可以开始':'可旋转查看';$('play-dot').classList.toggle('playing',playing);
}
function updateProgress(){
  const v=Math.round(progress*100);$('motion-percent').textContent=`${v}%`;$('full-saved-progress').value=String(progress);
  $('motion-progress').setAttribute('value',String(v));
}
let renderedChapter=null,referenceChapter=null;
function renderSteps(chapter){
  if(renderedChapter===chapter.id)return;renderedChapter=chapter.id;
  $('step-list').replaceChildren();$('step-list').style.setProperty('--visible-step-count',chapter.end-chapter.start+1);
  for(let i=chapter.start;i<=chapter.end;i++){
    const b=document.createElement('button');b.id=`step-${i}`;b.className='step-option';b.type='button';b.dataset.step=String(i);
    for(const [cls,text] of [['number',String(i-chapter.start+1)],['title',STEPS[i].short],['time',fmt(STEPS[i].sourceStart)]]){const span=document.createElement('span');span.className=cls;span.textContent=text;b.append(span);}
    b.addEventListener('click',()=>goStep(i));$('step-list').append(b);
  }
}
function syncReference(){
  const c=chapterFor(step),v=$('reference-video');v.pause();
  const seek=()=>{if(chapterFor(step).id===c.id)v.currentTime=Math.max(0,STEPS[step].sourceStart-c.videoStart);};
  if(referenceChapter!==c.id){referenceChapter=c.id;v.src=c.video;v.addEventListener('loadedmetadata',seek,{once:true});v.load();}
  else if(v.readyState>=1)seek();
  $('reference-caption').textContent=`截取自你提供的视频 · ${fmt(c.sourceStart)}—${fmt(c.sourceEnd)}`;
}
function syncInfo(){
  const s=STEPS[step],c=chapterFor(step),local=step-c.start+1;guidanceEndState=snapshot(step,1);renderSteps(c);$('software-guide').hidden=!s.software;$('servo-id-list').replaceChildren();for(const id of s.servoIds||[]){const tag=document.createElement('span');tag.textContent=`ID ${id}`;$('servo-id-list').append(tag);}
  $('phase-select').setAttribute('value',String(CHAPTERS.indexOf(c)));
  $('full-saved-step').value=String(step);if(ready)try{localStorage.setItem(SAVED_STEP,JSON.stringify({step,total:STEPS.length}));}catch{}$('step-title').textContent=s.title;$('instruction-summary-title').textContent=s.title;$('step-description').textContent=s.text;$('step-check').textContent=s.check+(fitsForParts(s.parts).length||s.id==='robot-complete'||s.overview?' 新模型配合待核：相关插头与原3MF支架或外壳有几何重叠；保持原尺寸，红框不表示已接合。':'');
  $('step-count').textContent=`${c.name} · ${local} / ${c.end-c.start+1}`;
  $('stage-step').textContent=s.complete?`${c.name} · 完成`:`${String(local).padStart(2,'0')}  ${s.short}`;
  $('source-time').textContent=`${fmt(s.sourceStart)}—${fmt(s.sourceEnd)}`;
  $('needed-parts').replaceChildren();const groups=new Set();
  for(const id of s.parts){const a=ACTORS[id];if(a.listGroup&&groups.has(a.listGroup))continue;if(a.listGroup)groups.add(a.listGroup);
    const b=document.createElement('button');b.type='button';b.id=`part-chip-${id}`;b.className='part-chip';b.style.setProperty('--c',a.color||'#9ba7b9');
    const dot=document.createElement('i'),label=document.createElement('span');label.textContent=a.chip||a.label.split(' · ')[0];b.append(dot,label);b.addEventListener('click',()=>{$('instruction-dialog').close();selectActor(id);});$('needed-parts').append(b);}
  for(const b of $('step-list').children){const n=Number(b.dataset.step);b.toggleAttribute('aria-current',n===step);if(n===step)b.setAttribute('aria-current','step');b.classList.toggle('done',n<step);b.querySelector('.number').textContent=n<step?'✓':STEPS[n].complete?'✓':String(n-c.start+1);}
  clearPartInfo();syncReference();setAttributes();updateProgress();
}
function goStep(index,{animate=true,back=false,playerDriven=false}={}){
  if(!ready)return;const old=currentState,n=Math.max(0,Math.min(STEPS.length-1,index));
  if(!playerDriven)lessonPlayer.seek(n,animate&&n>0?0:1,{play:animate&&n>0});
  const playback=lessonPlayer.state;step=playback.step;progress=playback.progress;playing=playback.playing;
  assemblyFocus.reset();
  backTransition=back?{from:structuredClone(old),start:performance.now(),duration:650}:null;
  if(backTransition){progress=1;playing=false;}
  syncInfo();cameraTo(STEPS[step].camera,STEPS[step].target,650/lessonPlayer.state.rate);
  if(!backTransition)applyState(snapshot(step,progress));
}
function clearPartInfo(){
  $('part-tooltip').hidden=true;$('part-leader').toggleAttribute('hidden',true);stage.classList.remove('has-part-info');selected=null;selectedAnchor=null;selection.visible=false;
}
function selectActor(id,point=null){
  const obj=entities.get(id);if(!obj?.visible)return;selected=id;
  obj.updateWorldMatrix(true,true);const at=point?.clone()||new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());selectedAnchor=obj.worldToLocal(at);
  $('part-name').textContent=ACTORS[id].label;$('part-source').textContent=ACTORS[id].source;
  $('part-tooltip').hidden=false;stage.classList.add('has-part-info');
}
$('part-close').addEventListener('click',()=>{clearPartInfo();$('instruction-toggle').focus();});
let pointerDown=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointermove',e=>{if(pointerDown&&e.buttons&&Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)cameraTween=null;});
renderer.domElement.addEventListener('wheel',()=>{cameraTween=null;},{passive:true});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!pointerDown||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)return;
  const rect=renderer.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);
  const hit=ray.intersectObjects(selectables.filter(o=>o.visible),true).find(h=>h.object.visible);
  if(hit)selectActor(hit.object.userData.actorId,hit.point);else clearPartInfo();
});
function openReference(){$('instruction-dialog').close();const p=$('reference-panel');p.hidden=false;$('reference-toggle').setAttribute('aria-expanded','true');const v=$('reference-video');v.currentTime=Math.max(0,STEPS[step].sourceStart-chapterFor(step).videoStart);v.play().catch(()=>{});}
function closeReference(){$('reference-panel').hidden=true;$('reference-toggle').setAttribute('aria-expanded','false');$('reference-video').pause();}
$('instruction-toggle').addEventListener('click',()=>$('instruction-dialog').showModal());
$('instruction-close').addEventListener('click',()=>$('instruction-dialog').close());
$('reference-toggle').addEventListener('click',()=>{$('reference-panel').hidden?openReference():closeReference();});
$('reference-close').addEventListener('click',closeReference);$('source-step').addEventListener('click',openReference);
$('reference-video').addEventListener('timeupdate',()=>{const v=$('reference-video');if(v.currentTime>=STEPS[step].sourceEnd-chapterFor(step).videoStart-.04)v.pause();});
$('start').addEventListener('click',()=>goStep(1));$('next').addEventListener('click',()=>goStep(step+1));$('back').addEventListener('click',()=>goStep(step-1,{animate:false,back:true}));
$('replay').addEventListener('click',()=>goStep(step===OVERVIEW_STEP?STEPS.findIndex(s=>s.id==='final-power'):step));$('restart').addEventListener('click',()=>goStep(0));$('overview').addEventListener('click',()=>goStep(OVERVIEW_STEP,{animate:false}));
$('pause').addEventListener('click',()=>{playing?lessonPlayer.pause():lessonPlayer.resume();playing=lessonPlayer.state.playing;backTransition=null;setAttributes();});
$('autoplay').addEventListener('click',()=>{if(!ready)return;if(lessonPlayer.state.autoplay){lessonPlayer.stopAuto();playing=false;setAttributes();}else{lessonPlayer.startAuto();goStep(0,{playerDriven:true});}});
$('playback-rate').addEventListener('ryugi-change',ev=>{lessonPlayer.setRate(Number(ev.detail.value));setAttributes();});
$('reset-view').addEventListener('click',()=>cameraTo(STEPS[step].camera,STEPS[step].target));
function sideView(direction){const view=cameraPreset(direction,STEPS[step]);cameraTo(view.position,view.target);}
$('front-view').addEventListener('click',()=>sideView(1));
$('back-view').addEventListener('click',()=>sideView(-1));
$('phase-select').addEventListener('ryugi-change',ev=>{const c=CHAPTERS[Number(ev.detail.value)];if(c&&c.id!==chapterFor(step).id)goStep(c.start);});
// The guide reopens at the step you left; the home page reads the same key for its button.
const SAVED_STEP='letsduck-assembly';
function resumeSaved(){if($('full-saved-step').value!=='0')return;try{const {step:saved}=JSON.parse(localStorage.getItem(SAVED_STEP));if(saved>0&&saved<STEPS.length)$('full-saved-step').value=String(saved);}catch{}}
function restore(){if(!ready)return;const n=Number($('full-saved-step').value),p=Number($('full-saved-progress').value);goStep(n,{animate:false});progress=Math.max(0,Math.min(1,p));lessonPlayer.seek(step,progress);applyState(snapshot(step,progress));updateProgress();setAttributes();}
$('full-saved-step').addEventListener('change',restore);$('full-saved-step').addEventListener('input',restore);$('full-saved-progress').addEventListener('change',restore);
function initUI(){if(uiReady)return;uiReady=true;document.documentElement.setAttribute('data-theme','light');lessonSound.syncControls();renderQuality.sync();lessonPlayer.setRate(Number($('playback-rate').value));const control=$('motion-progress');control.addEventListener('ryugi-change',ev=>{if(!ready)return;playing=false;backTransition=null;progress=Number(ev.detail.value)/100;lessonPlayer.seek(step,progress);applyState(snapshot(step,progress));updateProgress();setAttributes();});setAttributes();}
document.addEventListener('ryugi-ui:ready',initUI,{once:true});if(customElements.get('ryugi-button'))initUI();

function fit(){const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;renderer.setSize(width,height,false);camera.aspect=width/height;const scale=Math.max(1,1.07/camera.aspect);controls.minDistance=66*scale;controls.maxDistance=1100*scale;if(Math.abs(scale-aspectScale)>.001){camera.position.sub(controls.target).multiplyScalar(scale/aspectScale).add(controls.target);aspectScale=scale;cameraTween=null;}camera.updateProjectionMatrix();invalidate();}
new ResizeObserver(fit).observe(host);
function updateActionLabel(){
  const caption=STEPS[step].caption,active=ready&&!!caption,label=$('action-indicator');label.hidden=!active;$('motion-label').hidden=active;
  if(active&&$('action-caption').textContent!==caption)$('action-caption').textContent=caption;
}
const leaderPoint=new THREE.Vector3();
function updatePartLeader(){
  const leader=$('part-leader'),obj=entities.get(selected),label=$('part-tooltip');
  if(!obj?.visible||!selectedAnchor||label.hidden){leader.toggleAttribute('hidden',true);return;}
  obj.updateWorldMatrix(true,false);leaderPoint.copy(selectedAnchor);obj.localToWorld(leaderPoint);leaderPoint.project(camera);
  if(Math.abs(leaderPoint.x)>1||Math.abs(leaderPoint.y)>1||Math.abs(leaderPoint.z)>1){leader.toggleAttribute('hidden',true);return;}
  const rect=stage.getBoundingClientRect(),canvas=host.getBoundingClientRect(),card=label.getBoundingClientRect();
  const x=canvas.left-rect.left+(leaderPoint.x*.5+.5)*canvas.width,y=canvas.top-rect.top+(-leaderPoint.y*.5+.5)*canvas.height;
  const endX=card.left-rect.left+18,endY=card.bottom-rect.top;
  const points=`${x.toFixed(1)},${y.toFixed(1)} ${endX.toFixed(1)},${(endY+10).toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`;
  if($('part-leader-line').getAttribute('points')!==points)$('part-leader-line').setAttribute('points',points);
  $('part-leader-dot').setAttribute('cx',x);$('part-leader-dot').setAttribute('cy',y);leader.toggleAttribute('hidden',false);
}
const scheduler=createRenderScheduler({draw:render});
const invalidate=()=>scheduler.invalidate();
// OrbitControls emits change throughout damping, including input-driven changes.
controls.addEventListener('change',invalidate);
// Capture schedules after the current event's handlers have updated state. This
// includes custom controls and magnifier dragging without observing our own DOM writes.
for(const type of ['click','input','change','ryugi-change','pointerdown','pointerup','pointercancel','wheel'])document.addEventListener(type,invalidate,{capture:true,passive:true});
document.addEventListener('pointermove',event=>{if(event.buttons)invalidate();},{capture:true,passive:true});
const previousLoad=THREE.DefaultLoadingManager.onLoad;
THREE.DefaultLoadingManager.onLoad=()=>{previousLoad?.();renderQuality.invalidate();invalidate();};
document.addEventListener('visibilitychange',()=>scheduler.setActive(!document.hidden));
function render(now){
  if(document.hidden)return false;
  if(ready){const before=lessonPlayer.state,playback=lessonPlayer.tick(now);lessonSound.observe(before,playback,now);if(playback.step!==step)goStep(playback.step,{playerDriven:true});else{const moved=progress!==playback.progress,wasPlaying=playing;progress=playback.progress;playing=playback.playing;if(moved){applyState(snapshot(step,progress));updateProgress();}if(wasPlaying!==playing||before.phase!==playback.phase)setAttributes();}}
  if(backTransition){const t=Math.min(1,(now-backTransition.start)/backTransition.duration),ease=t*t*(3-2*t),target=snapshot(step,1),state={};
    for(const [id,b] of Object.entries(target)){const a=backTransition.from[id]||b;state[id]=interpolatePose(ACTORS[id],a,b,ease);}
    applyState(state);if(t>=1){backTransition=null;applyState(target);}}
  if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration),ease=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,ease);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,ease);if(t>=1)cameraTween=null;}
  const cameraMoving=controls.update();updateAssemblyCameraDepth(camera,controls.target);updateActionLabel();
  const focus=ready?assemblyFocus.update(STEPS[step].id,progress,currentState,guidanceEndState,now,!!backTransition,camera,host.clientHeight):{phase:'none'};
  if(focus.phase!=='none')guideArrow.visible=false;
  const hint=document.querySelector('.real-model'),message=focus.message||(focus.phase==='aligning'?'红框 · 对准这两处':focus.phase==='completed'?'绿框 · 本次已装好':'真实零件网格');
  if(hint.textContent!==message)hint.textContent=message;
  hint.dataset.focus=focus.phase;
  renderQuality.render(scene,camera);assemblyMagnifier.render(focus,now,ready?STEPS[step].id:null);updatePartLeader();
  return playing||!!backTransition||!!cameraTween||cameraMoving||focus.animating||assemblyMagnifier.state.animating;
}
invalidate();
async function load(){
  const [manifest,binary,models]=await Promise.all([fetch('./assets/full-assembly.json').then(r=>{if(!r.ok)throw Error('模型清单加载失败');return r.json();}),fetch('./assets/full-assembly.bin').then(r=>{if(!r.ok)throw Error('模型几何加载失败');return r.arrayBuffer();}),loadHardwareModels()]);
  hardwareModels=models;createActors();
  for(const p of manifest.parts){
    if(/motor/i.test(p.id)){const group=hardwareModels.servo(p.id);addFocusPorts(group,ACTORS[p.id].servoPorts);entity(p.id,group);continue;}
    const raw=new THREE.BufferGeometry();raw.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,p.positionOffset,p.vertexCount*3).slice(),3));raw.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,p.indexOffset,p.indexCount).slice(),1));const g=toCreasedNormals(raw,Math.PI/5);raw.dispose();
    if(p.rotationZ)g.rotateZ(p.rotationZ);const bearing=/bearing/i.test(p.id),motor=/motor/i.test(p.id);
    // letsduck: printed parts arrive from page.mjs in the studio's material, colour and finish.
    const material=ACTORS[p.id].material?.clone()||new THREE.MeshPhysicalMaterial({color:ACTORS[p.id].color||'#f7f8fb',roughness:bearing?.29:.44,metalness:bearing?.68:motor?.08:0,clearcoat:/foot/i.test(p.id)?.16:0,envMapIntensity:.75});
    const group=new THREE.Group();group.add(mesh(g,material));
    if(motor){const ports=ACTORS[p.id].servoPorts||[{position:[3,8.5,p.size[2]/2+.8],normal:[0,0,1]}];for(const port of ports){const socket=new THREE.Group(),body=mesh(new THREE.BoxGeometry(7,5,1.3),white);body.position.z=-.65;body.userData.focusPort={label:port.id||'舵机口'};socket.add(body);const inside=mesh(new THREE.BoxGeometry(5.4,3.4,.03),dark);inside.position.z=.01;socket.add(inside);socket.position.fromArray(port.position);socket.quaternion.copy(socketQuaternion(port));socket.userData.servoSocket=true;group.add(socket);}}
    entity(p.id,group);
  }
  renderQuality.attach(entities,ACTORS);ready=true;fit();resumeSaved();restore();$('loading').hidden=true;document.documentElement.dataset.ready='true';
}
load().catch(e=>{$('loading').textContent=`模型没有加载成功：${e.message}`;console.error(e);});
// A read-only diagnostic surface for the prototype's browser acceptance checks.
window.anklePrototype={get hardware(){return hardwareModels?.state||{ready:false};},get quality(){return renderQuality.state;},get sound(){return lessonSound.state;},get magnifier(){return assemblyMagnifier.state;},get focus(){return assemblyFocus.state;},get playback(){return lessonPlayer.state;},get renderStats(){return renderQuality.renderStats;},getActorTransform(id){const obj=entities.get(id);if(!obj)return null;const axis=new THREE.Vector3(0,-1,0);if(obj.children[0]&&ACTORS[id].kind==='screw')axis.applyQuaternion(obj.children[0].quaternion);axis.applyQuaternion(obj.quaternion);return{visible:obj.visible,position:obj.position.toArray(),quaternion:obj.quaternion.toArray(),shaftAxis:axis.toArray(),normal:new THREE.Vector3(0,1,0).applyQuaternion(obj.quaternion).toArray()};},get state(){return{version:3,totalSteps:STEPS.length,totalChapters:CHAPTERS.length,step,stepId:STEPS[step].id,chapter:chapterFor(step).id,progress,playing,ready,uiReady,backTransition:!!backTransition,cameraTransition:!!cameraTween,camera:camera.position.toArray(),target:controls.target.toArray(),actors:structuredClone(currentState),referenceVisible:!$('reference-panel').hidden};}};
