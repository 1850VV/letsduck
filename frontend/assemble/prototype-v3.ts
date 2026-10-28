import {assemblyText,displayStep,displayChapter,displayActor,displayMaterial,assemblyField,assemblyErrorText} from './i18n.js';
import {onLocale} from '../shared/i18n.js';
import {parseResponseJson} from '../shared/json.js';
import {assemblyAssetUrl,sameOriginUrl} from '../shared/url.js';
import {parseAssemblyManifest} from './assembly-manifest.js';
import type {Step,EntityMap,CableMap,Actor,Port,Vector,State,Chapter,MaterialItem,FocusState} from './types.js';
import {byId as $} from './dom.js';
import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import {createPartGeometry} from './part-geometry.js';
import { createAssemblyFocus, isFocusStep } from './assembly-focus.js';
import { createAssemblyMagnifier } from './assembly-magnifier.js';
import { buildFineCues } from './fine-cues.js';
import {createLessonPlayer} from './lesson-player.js';
import {createLessonSound} from './lesson-sound.js';
import {updateAssemblyCameraDepth} from './camera-depth.js';
import {createRenderScheduler} from './render-scheduler.js';
import {stillURL} from '../shared/still.js';
import {createRenderQuality} from './render-quality.js';
import {fitsForParts} from './model-fit.js';
import {buildCableCurve} from './cable-path.js';
import {type HardwareModelFactory,loadHardwareModels} from './hardware-models.js';
import {LOOK} from '../shared/duck-look.js';
import { STEPS,CHAPTERS,ACTORS,snapshot,chapterFor,OVERVIEW_STEP,PLUG_PAIRS } from './hardware-state.js';
import {createDeskMode} from './desk-mode.js';
import {createChapterMaterials} from './chapter-materials.js';
import {createHornSelection,firstVisibleIntersection} from './horn-selection.js';
import {stepMaterials} from './material-catalog.js';
import {resolveServoMap,installationServosForStep} from './servo-map.js';
import {createServoPickup} from './servo-pickup.js';
import {createServoWorkbench} from './servo-setup.js';
import {preparationCopy} from './full/prepare.js';

import {actorQuaternion,cableStyle,plugPins,guidanceDelta,cameraPreset,cablePlugQuaternion,interpolatePose,socketQuaternion} from './render-pose.js';


const stepView=(source:Step)=>displayStep(preparationCopy(source,servoWorkbench?.supported??true));
const fmt=(t:number)=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
let navigationRevision=0,loadFailure:unknown=null;
const renderLoading=()=>{$('loading').textContent=loadFailure?assemblyText('assemble.ui.0038',{p0:assemblyErrorText(loadFailure)}):assemblyText('assemble.ui.0293');};
let step=0,progress=1,playing=false,cameraTween:{from:THREE.Vector3;to:THREE.Vector3;fromTarget:THREE.Vector3;toTarget:THREE.Vector3;start:number;duration:number}|null=null,uiReady=false,ready=false;
let servoWorkbench:Awaited<ReturnType<typeof createServoWorkbench>>|null=null,servoMapping:ReturnType<typeof resolveServoMap>|null=null,servoPickup:ReturnType<typeof createServoPickup>|null=null;
const lessonPlayer=createLessonPlayer(STEPS.map((s,i)=>()=>{const focused=isFocusStep(s.id),count=buildFineCues(i).length;return{durationMs:s.duration*1000*(focused?Math.max(1.8,Math.min(4.5,count*.55)):1),holdMs:focused?900:0,settleMs:focused?1500:900};}));
const lessonSound=createLessonSound();
let currentState=snapshot(0,1),guidanceEndState=snapshot(0,1),backTransition:{from:State;start:number;duration:number}|null=null;
const host=$('canvas-host'),stage=$('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=LOOK.exposure;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,1600);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.13;
controls.enablePan=true;controls.minDistance=66;controls.maxDistance=1100;controls.maxPolarAngle=Math.PI*.85;
controls.target.set(0,28,0);camera.position.fromArray(STEPS[0]!.camera);controls.update();
// letsduck: the studio's light (shared/duck-look.mjs), so a part looks the same on both pages; the key still casts shadows.
const hemi=new THREE.HemisphereLight(0xf1f5ff,0xb6c2d8,2.2);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfffbf7,3.2);key.position.set(-160,380,290);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-250;key.shadow.camera.right=250;key.shadow.camera.top=250;key.shadow.camera.bottom=-250;key.shadow.normalBias=.15;key.shadow.bias=-.0002;scene.add(key);
const fill=new THREE.DirectionalLight(0xdde9ff,1.4);fill.position.set(240,180,-100);scene.add(fill);
const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=LOOK.environment;room.dispose();pmrem.dispose();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.ShadowMaterial({color:0x536480,opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-.2;ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(210,21,0xd9e1f0,0xe2e8f2);grid.position.y=-.18;grid.material.transparent=true;grid.material.opacity=.23;scene.add(grid);
const renderQuality=createRenderQuality({renderer,scene,key,fill,hemi,ground});
const entities:EntityMap=new Map(),selectables:THREE.Object3D[]=[];
const metal=new THREE.MeshStandardMaterial({color:0xa9b1bd,metalness:.7,roughness:.31});
const dark=new THREE.MeshStandardMaterial({color:0x252b36,roughness:.59,metalness:.12});
const white=new THREE.MeshStandardMaterial({color:0xf4f5f9,roughness:.43});
function entity(id:string,object:THREE.Object3D){const materials=new Map<THREE.Material,THREE.Material>();object.userData.actorId=id;object.traverse(o=>{o.userData.actorId=id;if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;const clone=(m:THREE.Material)=>{if(!materials.has(m)){const copy=m.clone();copy.userData={...m.userData,baseOpacity:m.opacity,baseTransparent:m.transparent};materials.set(m,copy);}return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);}});scene.add(object);entities.set(id,object);selectables.push(object);return object;}
function mesh(g:THREE.BufferGeometry,mat:THREE.Material){return new THREE.Mesh(g,mat);}
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
function makeBoard(a:Actor){
  const root=new THREE.Group(),size=a.size||[68,2,53],vertical=size[2]!<size[1]!,w=size[0]!,d=vertical?size[1]:size[2],thickness=vertical?size[2]:size[1];
  const group=new THREE.Group();if(vertical)group.rotation.x=Math.PI/2;root.add(group);
  const uno=a.boardType==='uno-q',pcb=new THREE.MeshStandardMaterial({color:a.color||(uno?0x206b73:0x245995),roughness:.55,metalness:.08});
  group.add(mesh(new THREE.BoxGeometry(w,thickness,d),pcb));
  for(const x of [-w/2+4,w/2-4])for(const z of [-d!/2+4,d!/2-4]){const hole=mesh(new THREE.TorusGeometry(1.35,.48,5,12),metal);hole.rotation.x=Math.PI/2;hole.position.set(x,thickness!/2+.1,z);group.add(hole);}
  const chip=mesh(new THREE.BoxGeometry(w*.32,2.8,d!*.3),dark);chip.position.y=thickness!/2+1.4;group.add(chip);
  if(!a.ports?.some(p=>p.kind!.includes('header')))for(const z of [-d!*.38,d!*.38]){
    const header=mesh(new THREE.BoxGeometry(w*.76,4,3.3),dark);header.position.set(0,thickness!/2+2,z);group.add(header);
    for(let i=0;i<12;i++){const pin=mesh(new THREE.CylinderGeometry(.24,.24,4,5),metal);pin.position.set((i-5.5)*w*.057,thickness!/2+4,z);group.add(pin);}
  }
  const label=document.createElement('canvas');label.width=256;label.height=64;const ctx=label.getContext('2d')!;ctx.fillStyle=a.color||(uno?'#206b73':'#245995');ctx.fillRect(0,0,256,64);ctx.fillStyle='#e3f0e8';ctx.font='bold 27px sans-serif';ctx.textAlign='center';ctx.fillText(uno?'UNO Q':'LUWU',128,42);
  const texture=new THREE.CanvasTexture(label);texture.colorSpace=THREE.SRGBColorSpace;const text=mesh(new THREE.PlaneGeometry(w*.42,d!*.16),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));text.rotation.x=-Math.PI/2;text.position.set(0,thickness!/2+.08,d!*.24);group.add(text);
  const ports=a.ports?.length?a.ports:(uno?[{label:'USB-C',position:[-w/2,3,0],kind:'usb-c'}]:[{position:[w*.3,3,0],kind:'servo'},{position:[-w*.3,3,0],kind:'power'}]);
  for(const port of ports){
    if(port.kind!.includes('header')){const body=mesh(new THREE.BoxGeometry(3.4,4,d!*.74),dark);body.position.fromArray(port.position);root.add(body);for(let i=0;i<14;i++){const pin=mesh(new THREE.CylinderGeometry(.24,.24,port.kind==='male-header'?5:1,5),metal);pin.position.set(port.position[0]!,port.position[1]!+(port.kind==='male-header'?-3:2.1),port.position[2]!+(i-6.5)*d!*.05);root.add(pin);}continue;}
    const usb=port.kind==='usb-c',power=port.kind==='power'||port.kind==='battery',p=mesh(new THREE.BoxGeometry(usb?8:power?5:7,usb?3.3:4,usb?7:4),usb?metal:white),direction=new THREE.Vector3(...(port.direction||(usb?(port.position[0]?[Math.sign(port.position[0]),0,0]:[0,0,Math.sign(port.position[2]!)||1]):[0,0,1]))),rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),direction);p.position.fromArray(port.position);p.quaternion.copy(rotation);root.add(p);
    if(['usb-c','servo','power','battery'].includes(port.kind!))p.userData.focusPort={label:port.label||port.kind};
    const inset=mesh(new THREE.BoxGeometry(usb?5.8:power?3.5:5.2,1.6,.15),dark);inset.position.fromArray(port.position).addScaledVector(direction,usb?3.55:2.05);inset.quaternion.copy(rotation);root.add(inset);
  }
  return root;
}
function makeBattery(a:Actor){
  const root=new THREE.Group(),size=a.size||[36,66,18],wrap=new THREE.MeshStandardMaterial({color:0x242932,roughness:.7});root.add(mesh(new THREE.BoxGeometry(...size),wrap));
  for(const sign of [-1,1]){const band=mesh(new THREE.BoxGeometry(size[0]!+.2,size[1]!*.09,size[2]!+.2),dark);band.position.y=sign*size[1]!*.3;root.add(band);}return root;
}
function makeCablePlug(type:string|undefined,end=0){
  if(type!=='usb-c'&&type!=='power')return hardwareModels!.plug(end);
  if(type!=='usb-c'&&type!=='power')return makePlug();
  const root=new THREE.Group();root.add(mesh(new THREE.BoxGeometry(type==='usb-c'?6:5,3.1,6),type==='usb-c'?metal:white));
  const tip=mesh(new THREE.BoxGeometry(type==='usb-c'?4.8:3.4,1.8,.25),dark);tip.position.z=-3.1;root.add(tip);return root;
}
let hardwareModels:HardwareModelFactory|null=null;
const cableRecords:CableMap=new Map(),wireMaterial=new THREE.MeshStandardMaterial({color:0x202633,roughness:.64});
function socketAt(point:THREE.Vector3){
 for(const [id,a] of Object.entries(ACTORS)){const pose=currentState[id],ports=a.servoPorts||a.ports;if(!pose?.visible||!ports)continue;const q=actorQuaternion(a,pose);
  for(const port of ports){if(!port.normal&&!port.direction)continue;const normal=new THREE.Vector3(...(port.normal||port.direction)!),local=new THREE.Vector3(...port.position).addScaledVector(normal,port.dockOffset??2.25),at=local.applyQuaternion(q).add(new THREE.Vector3(...pose.position));if(at.distanceTo(point)<.12)return q.clone().multiply(socketQuaternion({...port,normal:normal.toArray()}));}
 }return null;
}
function addFocusPorts(root:THREE.Object3D,ports:Port[]|undefined){
 for(const port of ports||[]){if(!port.normal&&!port.direction)continue;
  const size=port.focusSize||[port.kind==='power'||port.kind==='battery'?5:7.5,4.5,1.2];
  const proxy=mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial());proxy.visible=false;proxy.position.fromArray(port.position);proxy.quaternion.copy(socketQuaternion({...port,normal:port.normal||port.direction}));proxy.userData.focusPort={label:port.label||port.id||port.kind};proxy.userData.hardwareAsset='focus-proxy';root.add(proxy);
 }
}
function createActors(){
for(const [id,a] of Object.entries(ACTORS)){
  if(a.kind==='mesh')continue;
  let object:THREE.Object3D|null;
  if(a.kind==='cable'){
    object=new THREE.Group();const lines:THREE.Mesh[]=[];
    const style=cableStyle(a),approved=style.type==='servo';for(let i=0;i<style.count;i++){const mat=approved?hardwareModels!.wireMaterial():new THREE.MeshStandardMaterial({color:style.colors[i]!,roughness:.65});const line=mesh(new THREE.BufferGeometry(),mat);lines.push(line);object.add(line);}
    const plugs=[makeCablePlug(a.cableType,0),makeCablePlug(a.cableType,1)];plugs.forEach((p,i)=>{p.visible=style.endpointPlugs[i]!;object!.add(p);});
    cableRecords.set(id,{lines,plugs,type:a.cableType,approved,signature:''});
  }else if(a.kind==='screw'){
    object=new THREE.Group();const match=/M([\d.]+)x([\d.]+)/.exec(a.fastener||'');const child=hardwareModels!.screw(a)||screw(match?Number(match[2]):4,match?Number(match[1])/2:1,!!a.fastener&&a.fastener!=='M3x16');
    child.rotation.z=a.orientationZ??-Math.PI/2;object.add(child);
  }else if(a.kind==='board'){object=hardwareModels!.board(a);addFocusPorts(object!,a.ports);}else if(a.kind==='battery')object=makeBattery(a);else if(a.kind==='adhesive')object=mesh(new THREE.BoxGeometry(...(a.size||[20,.3,16])),new THREE.MeshStandardMaterial({color:0xf1e7cd,transparent:true,opacity:.65,roughness:.8}));else object=a.kind==='horn'?hardwareModels!.horn(id):plugPins(a)===3?hardwareModels!.plug(PLUG_PAIRS.find(([plug])=>plug===id)?.[2]??0):makePlug(plugPins(a));
  entity(id,object!);
}
}
function updateCable(id:string,points:Vector[]|undefined){
  const record=cableRecords.get(id);if(!points?.length||!record)return;
  const rotations=currentState[id]!.endpointQuaternions;
  const signature=points.flat().map(n=>n.toFixed(4)).join(',')+'|'+(rotations||[]).flat().map(n=>n.toFixed(6)).join(',');if(record.signature===signature)return;record.signature=signature;
  record.plugs[0]!.position.fromArray(points[0]!);record.plugs[1]!.position.fromArray(points.at(-1)!);
  record.plugs.forEach((plug,i)=>{
    if(rotations?.[i]){plug.quaternion.fromArray(rotations[i]);return;}
    const q=actorQuaternion(ACTORS[id]!,currentState[id]!),world=plug.position.clone().applyQuaternion(q).add(new THREE.Vector3(...currentState[id]!.position)),socket=socketAt(world);plug.quaternion.copy(socket?q.invert().multiply(socket):cablePlugQuaternion(points,i));
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
// Parts already in place before this step turn see-through, so the new ones stand out in their real colours.
const GHOST=.28;let settled=new Set<string>();
function settledParts(){
  const s=STEPS[step]!;if(!step||s.complete||s.overview)return new Set<string>();
  const before=snapshot(step-1,1),after=snapshot(step,1),out=new Set<string>();
  for(const [id,p] of Object.entries(before))if(p.visible&&after[id]?.visible&&!s.parts.includes(id)&&Math.hypot(...p.position.map((x,i)=>x-after[id]!.position[i]!))<.01)out.add(id);
  return out;
}
const assemblyMagnifier=createAssemblyMagnifier({renderer,scene,camera,stage,host,renderView:(world,view)=>renderQuality.render(world,view,'detail')});
let selected:string|null=null,selectedAnchor:THREE.Vector3|null=null;
const hornSelection=createHornSelection();
function applyState(state:State){
  currentState=state;renderQuality.invalidate();invalidate();
  for(const [id,obj] of entities){const pose=state[id];if(!pose)continue;obj.visible=pose.visible&&pose.opacity>.001;
    obj.position.fromArray(pose.position);
    if(ACTORS[id]!.kind==='cable'&&obj.visible)updateCable(id,pose.points);
    obj.quaternion.copy(actorQuaternion(ACTORS[id]!,pose));
    obj.traverse(child=>{if(child instanceof THREE.Mesh){const mats=Array.isArray(child.material)?child.material:[child.material];for(const mat of mats){const ghost=settled.has(id);mat.opacity=pose.opacity*(mat.userData.baseOpacity??1)*(ghost?GHOST:1);mat.transparent=ghost||pose.opacity<.999||!!mat.userData.baseTransparent;}}});
  }
  hardwareModels?.syncDiscs(entities,state);
  selection.visible=false;
  const visibleMesh=(id:string)=>ACTORS[id]!.kind==='mesh'&&entities.get(id)?.visible;const active=STEPS[step]!.parts.find(id=>visibleMesh(id)&&Math.hypot(...guidanceDelta(state[id]!,guidanceEndState[id]!))>5)||STEPS[step]!.parts.find(visibleMesh)||STEPS[step]!.parts[0];
  const obj=entities.get(active!);
  if(playing&&obj&&ACTORS[active!]!.kind==='mesh'){
    const at=new THREE.Vector3(...state[active!]!.position),delta=new THREE.Vector3(...guidanceDelta(state[active!]!,guidanceEndState[active!]!)),distance=delta.length();
    guideArrow.visible=distance>5;guideArrow.position.copy(at);if(guideArrow.visible){guideArrow.setDirection(delta.normalize());guideArrow.setLength(Math.min(24,distance),3,1.5);}
  }else guideArrow.visible=false;
}

let aspectScale=1;
function cameraTo(position:Vector,target:Vector,duration=650){const point=new THREE.Vector3(...target),to=new THREE.Vector3(...position).sub(point).multiplyScalar(aspectScale).add(point);cameraTween={from:camera.position.clone(),to,fromTarget:controls.target.clone(),toTarget:point,start:performance.now(),duration};}
function setAttributes(){
  const end=step===STEPS.length-1,playback=lessonPlayer.state;
  const replayLabel=$('replay-label');if(replayLabel)replayLabel.textContent=end?assemblyText("assemble.ui.0001"):assemblyText("assemble.ui.0002");
  const installing=servoMapping&&servoWorkbench?.preparation?.supported&&installationServosForStep(servoMapping,step).some(b=>servoWorkbench!.preparation.view.byId.get(b.id)!.state!=='installed');
  const nextLabel=installing?assemblyText("assemble.ui.0003"):assemblyText("assemble.ui.0004");if($('next').textContent!==nextLabel)$('next').textContent=nextLabel;
  $('next').toggleAttribute('disabled',!!servoWorkbench?.preparation?.saving);
  $('back').toggleAttribute('disabled',step===0);$('replay').toggleAttribute('disabled',step===0);
  $('start').hidden=step!==0||playback.autoplay;$('next').hidden=step===0||end;$('restart').hidden=!end;
  $('pause').hidden=!playing&&!(playback.autoplay||step>0&&progress<1);
  const pauseLabel=$('pause-label');if(pauseLabel)pauseLabel.textContent=playing?assemblyText("assemble.ui.0005"):assemblyText("assemble.ui.0006");
  const autoLabel=$('autoplay-label');if(autoLabel)autoLabel.textContent=assemblyText("assemble.ui.0007")+(playback.autoplay?assemblyText("assemble.ui.0008"):assemblyText("assemble.ui.0009"));
  $('autoplay').toggleAttribute('disabled',!ready);$('autoplay').dataset.active=String(playback.autoplay);const autoButton=$('autoplay').querySelector('button');if(autoButton){autoButton.setAttribute('aria-label',assemblyText("assemble.ui.0010"));autoButton.setAttribute('aria-pressed',String(playback.autoplay));autoButton.title=assemblyText("assemble.ui.0011");}
  $('play-state').textContent=playback.finished?assemblyText("assemble.ui.0012"):playback.autoplay?(playing?(playback.phase==='settle'?assemblyText("assemble.ui.0013"):assemblyText("assemble.ui.0014")):assemblyText("assemble.ui.0015")):playing?assemblyText("assemble.ui.0016"):step===0?assemblyText("assemble.ui.0017"):assemblyText("assemble.ui.0018");$('play-dot').classList.toggle('playing',playing);
}
function updateProgress(){
  const v=Math.round(progress*100);$('motion-percent').textContent=`${v}%`;$('full-saved-progress').value=String(progress);
  $('motion-progress').setAttribute('value',String(v));
}
let renderedChapter:string|null=null,referenceChapter:string|null=null;
function renderSteps(chapter:Chapter){
  if(renderedChapter===chapter.id)return;renderedChapter=chapter.id;
  const scroll=$('step-list').scrollTop,focused=document.activeElement?.closest<HTMLElement>('#step-list [data-step]')?.dataset.step;
  $('step-list').replaceChildren();$('step-list').style.setProperty('--visible-step-count',String(chapter.end-chapter.start+1));
  for(let i=chapter.start;i<=chapter.end;i++){
    const b=document.createElement('button');b.id=`step-${i}`;b.className='step-option';b.type='button';b.dataset.step=String(i);
    for(const [cls,text] of [['number',String(i-chapter.start+1)],['title',stepView(STEPS[i]!).short],['time',fmt(STEPS[i]!.sourceStart)]] satisfies [string,string][]){const span=document.createElement('span');span.className=cls;span.textContent=text;b.append(span);}
    b.addEventListener('click',()=>goStep(i));$('step-list').append(b);
  }
  $('step-list').scrollTop=scroll;if(focused)$('step-list').querySelector<HTMLElement>(`[data-step="${focused}"]`)?.focus({preventScroll:true});
}
function syncReference(){
  const c=chapterFor(step)!,v=$('reference-video');v.pause();
  const seek=()=>{if(chapterFor(step)!.id===c.id)v.currentTime=Math.max(0,STEPS[step]!.sourceStart-c.videoStart!);};
  if(referenceChapter!==c.id){referenceChapter=c.id;v.src=c.video!;v.addEventListener('loadedmetadata',seek,{once:true});v.load();}
  else if(v.readyState>=1)seek();
  $('reference-caption').textContent=assemblyText("assemble.ui.0019",{p0:fmt(c.sourceStart),p1:fmt(c.sourceEnd)});
}
function syncInfo({localeOnly=false}={}){
  const raw=STEPS[step]!,chapter=chapterFor(step)!,s=stepView(raw),c=displayChapter(chapter),local=step-c.start+1;if(localeOnly)renderedChapter=null;guidanceEndState=snapshot(step,1);renderSteps(c);$('software-guide').hidden=!s.software;$('servo-id-list').replaceChildren();for(const id of s.servoIds||[]){const tag=document.createElement('span');tag.textContent=`ID ${id}`;$('servo-id-list').append(tag);}
  $('servo-guide-open').hidden=$('servo-open').hidden||c.id!=='prepare';
  $('software-guide-note').textContent=c.id==='prepare'?(servoWorkbench?.supported?assemblyText("assemble.ui.0020"):assemblyText("assemble.ui.0021")):assemblyText("assemble.ui.0022");
  $('phase-select').setAttribute('value',String(CHAPTERS.indexOf(chapter)));
  $('full-saved-step').value=String(step);if(ready&&!localeOnly)try{localStorage.setItem(SAVED_STEP,JSON.stringify({step,total:STEPS.length}));}catch{}$('step-title').textContent=s.title;$('instruction-summary-title').textContent=s.title;$('step-description').textContent=s.text;$('step-check').textContent=s.check+(fitsForParts(s.parts).length||s.id==='robot-complete'||s.overview?assemblyText("assemble.ui.0023"):'');
  $('step-count').textContent=`${c.name} · ${local} / ${c.end-c.start+1}`;
  $('stage-step').textContent=s.complete?assemblyText("assemble.ui.0024",{p0:c.name}):`${String(local).padStart(2,'0')}  ${s.short}`;
  $('source-time').textContent=`${fmt(s.sourceStart)}—${fmt(s.sourceEnd)}`;
  $('needed-parts').replaceChildren();
  for(const rawMaterial of stepMaterials(step)){const material=displayMaterial(rawMaterial);
    const b=document.createElement('button');b.type='button';b.id=`part-chip-${material.id}`;b.className='part-chip';b.style.setProperty('--c',material.color!);b.title=material.spec;
    const bindings=servoMaterialBindings(material);if(bindings.length&&servoWorkbench?.preparation?.supported)b.dataset.servoIds=bindings.map(b=>b!.id).join(',');
    const dot=document.createElement('i'),label=document.createElement('span');label.textContent=bindings.length?assemblyText("assemble.ui.0025",{p0:bindings.map(b=>'ID'+b!.id).join('、')}):`${material.short} ${material.quantity}`;b.append(dot,label);b.addEventListener('click',()=>{$('instruction-dialog').close();if(bindings.length&&servoWorkbench?.preparation?.supported)servoPickup!.open(bindings[0]!.id);else materials.inspect(rawMaterial);});$('needed-parts').append(b);}
  for(const b of $('step-list').querySelectorAll<HTMLButtonElement>(':scope > *')){const n=Number(b.dataset.step);b.toggleAttribute('aria-current',n===step);if(n===step)b.setAttribute('aria-current','step');b.classList.toggle('done',n<step);b.querySelector('.number')!.textContent=n<step?'✓':STEPS[n]!.complete?'✓':String(n-c.start+1);}
  if(!localeOnly){clearPartInfo();syncReference();settled=settledParts();}else{$('reference-caption').textContent=assemblyText("assemble.ui.0019",{p0:fmt(c.sourceStart),p1:fmt(c.sourceEnd)});if($('reference-check').textContent)$('reference-check').textContent=s.check;}setAttributes();updateProgress();deskMode.sync(step,{localeOnly});
}
function goStep(index:number,{animate=true,back=false,playerDriven=false}={}){
  if(!ready)return;navigationRevision++;servoPickup?.stepChanged();materials.close();const old=currentState,n=Math.max(0,Math.min(STEPS.length-1,index));
  if(!playerDriven)lessonPlayer.seek(n,animate&&n>0?0:1,{play:animate&&n>0});
  const playback=lessonPlayer.state;step=playback.step;progress=playback.progress;playing=playback.playing;
  assemblyFocus.reset();
  backTransition=back?{from:structuredClone(old),start:performance.now(),duration:650}:null;
  if(backTransition){progress=1;playing=false;}
  syncInfo();if(materials.active){cameraTween=null;materials.resize();return;}
  cameraTo(STEPS[step]!.camera,STEPS[step]!.target,650/lessonPlayer.state.rate);
  if(!backTransition)applyState(snapshot(step,progress));
}
function clearPartInfo(){
  resetHornSelection();
  $('part-tooltip').hidden=true;$('part-leader').toggleAttribute('hidden',true);stage.classList.remove('has-part-info');selected=null;selectedAnchor=null;selection.visible=false;
}
function servoMaterialBindings(material:MaterialItem){
  if(!servoMapping||material.kind==='assembly'||!material.ids?.length)return [];
  const found=material.ids.map(id=>servoMapping!.bindings.find(b=>b.actorId===id));return found.every(Boolean)?found:[];
}
function resetHornSelection(){
  hornSelection.clear();delete $('part-tooltip').dataset.horn;$('part-source').hidden=false;
  $('part-leader-line').setAttribute('stroke','#4d6bfe');$('part-leader-dot').setAttribute('fill','#4d6bfe');
}
function showHornInfo(info:NonNullable<ReturnType<ReturnType<typeof createHornSelection>['select']>>){
  $('part-name').textContent=assemblyText(info.role==='main'?'assemble.ui.0270':'assemble.ui.0271');$('part-source').hidden=true;$('part-tooltip').dataset.horn=info.role;$('part-tooltip').style.setProperty('--horn-color',info.color);
  $('part-leader-line').setAttribute('stroke',info.color);$('part-leader-dot').setAttribute('fill',info.color);
  $('part-tooltip').hidden=false;stage.classList.add('has-part-info');renderQuality.invalidate();invalidate();
}
function selectTrayHorn(hit:THREE.Intersection){
  resetHornSelection();const info=hornSelection.select(hit.object);if(!info)return false;
  selected=null;selectedAnchor=null;$('part-leader').hidden=true;showHornInfo(info);return true;
}
function renderActorInfo(id:string){
 const actor=displayActor(id,ACTORS[id]!),binding=servoMapping?.bindings.find(b=>b.actorId===id);$('part-name').textContent=actor.label;$('part-source').textContent=actor.source;
 if(binding){const record=servoWorkbench?.recordFor(binding.id);$('part-name').textContent=`ID${binding.id} · ${assemblyField('binding',String(binding.id),'role',binding.role)}`;$('part-source').textContent=(!servoWorkbench?.historyLoaded?assemblyText('assemble.ui.0026'):record?.state==='verified'?assemblyText('assemble.ui.0027',{p0:String(record.readback!.kp),p1:String(record.readback!.kd)}):record?.state==='reported'?assemblyText('assemble.ui.0028'):assemblyText('assemble.ui.0029'))+(binding.status==='candidate'?assemblyText('assemble.ui.0030'):assemblyText('assemble.ui.0031'));}
}
function selectActor(id:string,point:THREE.Vector3|null=null,hitMesh:THREE.Object3D|null=null){
  resetHornSelection();
  const obj=entities.get(id);if(!obj?.visible)return;
  const info=hornSelection.select(hitMesh),binding=servoMapping?.bindings.find(b=>b.actorId===id);
  if(!info&&binding&&servoWorkbench?.preparation?.supported){clearPartInfo();servoPickup?.open(binding.id);return;}
  selected=id;obj.updateWorldMatrix(true,true);const at=point?.clone()||new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());selectedAnchor=obj.worldToLocal(at);
  renderActorInfo(id);
  $('part-tooltip').classList.toggle('servo-info',!!binding&&!info);
  if(info){lessonPlayer.pause();playing=false;backTransition=null;cameraTween=null;setAttributes();showHornInfo(info);}
  $('part-tooltip').hidden=false;stage.classList.add('has-part-info');
}
$('part-close').addEventListener('click',()=>{clearPartInfo();$('instruction-toggle').focus();});
let pointerDown:[number,number]|null=null;
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointermove',e=>{if(pointerDown&&e.buttons&&Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)cameraTween=null;});
renderer.domElement.addEventListener('wheel',()=>{cameraTween=null;},{passive:true});
renderer.domElement.addEventListener('pointerup',e=>{
  if(materials.active)return;
  if(!pointerDown||Math.hypot(e.clientX-pointerDown[0],e.clientY-pointerDown[1])>5)return;
  const rect=renderer.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,camera);
  const hit=firstVisibleIntersection(ray,selectables);
  if(hit)selectActor(hit.object.userData.actorId,hit.point,hit.object);else clearPartInfo();
});
const materials=createChapterMaterials({scene,camera,controls,renderer,host,entities,onHornPick:selectTrayHorn,getHardware:()=>hardwareModels,getState:()=>({step,progress,ready}),pause(){lessonPlayer.pause();playing=false;backTransition=null;cameraTween=null;setAttributes();},stopCamera(){cameraTween=null;},applyState,fit,invalidate:()=>{renderQuality.invalidate();invalidate();},resetFocus:()=>assemblyFocus.reset(),clearSelection:clearPartInfo,hideArrow(){guideArrow.visible=false;},onInspect(material,unit){const bindings=servoMaterialBindings(material);if(bindings.length&&servoWorkbench?.preparation?.supported){servoPickup?.open((bindings[unit]||bindings[0])!.id);return true;}return false;},onStart(){
  const n=step===0?1:step;lessonPlayer.seek(n,0,{play:true,auto:lessonPlayer.state.autoplay});goStep(n,{playerDriven:true});
}});
const deskMode=createDeskMode({getStep:()=>step,getStepView:index=>stepView(STEPS[index]!),isReady:()=>ready&&!servoWorkbench?.active,openReference:()=>openReference(),canvas:renderer.domElement,openChapter:c=>materials.open(c,{start:true}),closeChapter:()=>materials.close()});
function openReference(){materials.close();$('instruction-dialog').close();const p=$('reference-panel');p.hidden=false;$('reference-toggle').setAttribute('aria-expanded','true');const v=$('reference-video');v.muted=true;v.currentTime=Math.max(0,STEPS[step]!.sourceStart-chapterFor(step)!.videoStart!);v.play().catch(()=>{});}
function closeReference(){$('reference-panel').hidden=true;$('reference-toggle').setAttribute('aria-expanded','false');$('reference-video').pause();lessonSound.setReferenceAudio(false);}
$('reference-video').addEventListener('volumechange',()=>{const v=$('reference-video');if(!$('reference-panel').hidden&&!v.muted&&v.volume>0)lessonSound.setReferenceAudio(true);});
$('instruction-toggle').addEventListener('click',()=>$('instruction-dialog').showModal());
$('instruction-close').addEventListener('click',()=>$('instruction-dialog').close());
$('reference-toggle').addEventListener('click',()=>{$('reference-panel').hidden?openReference():closeReference();});
$('reference-close').addEventListener('click',closeReference);$('source-step').addEventListener('click',openReference);
$('start').addEventListener('click',()=>goStep(1));$('next').addEventListener('click',async()=>{const origin=step,revision=navigationRevision,current=()=>revision===navigationRevision;if((!servoPickup||await servoPickup.completeStep(origin,current))&&current())goStep(origin+1);});$('back').addEventListener('click',()=>goStep(step-1,{animate:false,back:true}));
$('replay').addEventListener('click',()=>goStep(step===OVERVIEW_STEP?STEPS.findIndex(s=>s.id==='final-power'):step));$('restart').addEventListener('click',()=>goStep(0));$('overview').addEventListener('click',()=>goStep(OVERVIEW_STEP,{animate:false}));
$('pause').addEventListener('click',()=>{if(materials.active){$('kit-go').click();return;}playing?lessonPlayer.pause():lessonPlayer.resume();playing=lessonPlayer.state.playing;backTransition=null;setAttributes();});
$('autoplay').addEventListener('click',()=>{if(!ready)return;if(lessonPlayer.state.autoplay){lessonPlayer.stopAuto();playing=false;setAttributes();}else{lessonPlayer.startAuto();goStep(0,{playerDriven:true});}});
$('playback-rate').addEventListener('ryugi-change',ev=>{lessonPlayer.setRate(Number(ev.detail.value));setAttributes();});
$('reset-view').addEventListener('click',()=>materials.active?materials.resize():cameraTo(STEPS[step]!.camera,STEPS[step]!.target));
function sideView(direction:number){const view=cameraPreset(direction,STEPS[step]!);cameraTo(view.position,view.target);}
$('front-view').addEventListener('click',()=>sideView(1));
$('back-view').addEventListener('click',()=>sideView(-1));
$('phase-select').addEventListener('ryugi-change',ev=>{const c=CHAPTERS[Number(ev.detail.value)];if(c&&c.id!==chapterFor(step)!.id)goStep(c.start);});
// The guide reopens at the step you left; the home page reads the same key for its button.
const SAVED_STEP='letsduck-assembly';
let resumeView:SavedView|null=null;
function resumeSaved(){if($('full-saved-step').value!=='0')return;try{const saved=parseSavedView(JSON.parse(localStorage.getItem(SAVED_STEP)!));if(saved&&saved.step>0&&saved.step<STEPS.length){$('full-saved-step').value=String(saved.step);resumeView=saved;}}catch{}}
// Reopen at the camera the last visit left, so its still (index.html) and the first live frame match.
function resumeCamera(){if(resumeView?.camera&&resumeView.step===step){cameraTween=null;camera.position.fromArray(resumeView.camera);controls.target.fromArray(resumeView.target);controls.update();}resumeView=null;}
const STILL='letsduck-still-assemble';
addEventListener('pagehide',()=>{if(!ready)return;try{
  materials.close();
  localStorage.setItem(SAVED_STEP,JSON.stringify({step,total:STEPS.length,camera:camera.position.toArray(),target:controls.target.toArray()}));
  // The main view only: the magnifier's picture belongs inside its frame, which appears with the live page.
  renderQuality.render(scene,camera);localStorage.setItem(STILL,JSON.stringify({vw:innerWidth,vh:innerHeight,image:stillURL(renderer.domElement,host.clientWidth)}));
}catch{}});
function restore(){if(!ready)return;const n=Number($('full-saved-step').value),p=Number($('full-saved-progress').value);goStep(n,{animate:false});progress=Math.max(0,Math.min(1,p));lessonPlayer.seek(step,progress);applyState(snapshot(step,progress));updateProgress();setAttributes();}
$('full-saved-step').addEventListener('change',restore);$('full-saved-step').addEventListener('input',restore);$('full-saved-progress').addEventListener('change',restore);
function initUI(){if(uiReady)return;uiReady=true;document.documentElement.setAttribute('data-theme','light');lessonSound.syncControls();renderQuality.sync();lessonPlayer.setRate(Number($('playback-rate').value));const control=$('motion-progress');control.addEventListener('ryugi-change',ev=>{if(!ready)return;playing=false;backTransition=null;progress=Number(ev.detail.value)/100;lessonPlayer.seek(step,progress);applyState(snapshot(step,progress));updateProgress();setAttributes();});setAttributes();}
document.addEventListener('ryugi-ui:ready',initUI,{once:true});if(customElements.get('ryugi-button'))initUI();

function fit(){const {width,height}=host.getBoundingClientRect();if(width<1||height<1)return;renderer.setSize(width,height,false);camera.aspect=width/height;if(materials.active){materials.resize();invalidate();return;}const scale=Math.max(1,1.07/camera.aspect);controls.minDistance=66*scale;controls.maxDistance=1100*scale;if(Math.abs(scale-aspectScale)>.001){camera.position.sub(controls.target).multiplyScalar(scale/aspectScale).add(controls.target);aspectScale=scale;cameraTween=null;}camera.updateProjectionMatrix();invalidate();}
new ResizeObserver(fit).observe(host);
function updateActionLabel(){
  const caption=stepView(STEPS[step]!).caption,active=ready&&!!caption,label=$('action-indicator');label.hidden=!active;$('motion-label').hidden=active;
  if(active&&$('action-caption').textContent!==caption)$('action-caption').textContent=caption;
}
const leaderPoint=new THREE.Vector3();
function updatePartLeader(){
  const leader=$('part-leader'),obj=entities.get(selected!),label=$('part-tooltip');
  if(!obj?.visible||!selectedAnchor||label.hidden){leader.toggleAttribute('hidden',true);return;}
  obj.updateWorldMatrix(true,false);leaderPoint.copy(selectedAnchor);obj.localToWorld(leaderPoint);leaderPoint.project(camera);
  if(Math.abs(leaderPoint.x)>1||Math.abs(leaderPoint.y)>1||Math.abs(leaderPoint.z)>1){leader.toggleAttribute('hidden',true);return;}
  const rect=stage.getBoundingClientRect(),canvas=host.getBoundingClientRect(),card=label.getBoundingClientRect();
  const x=canvas.left-rect.left+(leaderPoint.x*.5+.5)*canvas.width,y=canvas.top-rect.top+(-leaderPoint.y*.5+.5)*canvas.height;
  const endX=card.left-rect.left+18,endY=card.bottom-rect.top;
  const points=`${x.toFixed(1)},${y.toFixed(1)} ${endX.toFixed(1)},${(endY+10).toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`;
  if($('part-leader-line').getAttribute('points')!==points)$('part-leader-line').setAttribute('points',points);
  $('part-leader-dot').setAttribute('cx',String(x));$('part-leader-dot').setAttribute('cy',String(y));leader.toggleAttribute('hidden',false);
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
document.addEventListener('visibilitychange',()=>scheduler.setActive(!document.hidden&&!servoWorkbench?.active));
function render(now:number){
  if(document.hidden||servoWorkbench?.active)return false;
  if(ready){const before=lessonPlayer.state,playback=lessonPlayer.tick(now);lessonSound.observe(before,playback,now);if(playback.step!==step)goStep(playback.step,{playerDriven:true});else{const moved=progress!==playback.progress,wasPlaying=playing;progress=playback.progress;playing=playback.playing;if(moved){applyState(snapshot(step,progress));updateProgress();}if(wasPlaying!==playing||before.phase!==playback.phase)setAttributes();}}
  if(backTransition){const t=Math.min(1,(now-backTransition.start)/backTransition.duration),ease=t*t*(3-2*t),target=snapshot(step,1),state:State={};
    for(const [id,b] of Object.entries(target)){const a=backTransition.from[id]||b;state[id]=interpolatePose(ACTORS[id]!,a,b,ease);}
    applyState(state);if(t>=1){backTransition=null;applyState(target);}}
  if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration),ease=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,ease);controls.target.lerpVectors(cameraTween.fromTarget,cameraTween.toTarget,ease);if(t>=1)cameraTween=null;}
  const cameraMoving=controls.update();if(!materials.active)updateAssemblyCameraDepth(camera,controls.target);updateActionLabel();
  const focus:FocusState=ready&&!materials.active?assemblyFocus.update(STEPS[step]!.id,progress,currentState,guidanceEndState,now,!!backTransition,camera,host.clientHeight):{phase:'none'};
  if(focus.phase!=='none')guideArrow.visible=false;
  const hint=document.querySelector<HTMLElement>('.real-model')!,message=focus.message||(focus.phase==='aligning'?assemblyText("assemble.ui.0032"):focus.phase==='completed'?assemblyText("assemble.ui.0033"):assemblyText("assemble.ui.0034"));
  if(hint.textContent!==message)hint.textContent=message;
  hint.dataset.focus=focus.phase;
  materials.update();renderQuality.render(scene,camera);assemblyMagnifier.render(focus,now,ready&&!materials.active&&!$('part-tooltip').dataset.horn?STEPS[step]!.id:null);updatePartLeader();servoPickup?.updateLabel();
  return playing||!!backTransition||!!cameraTween||cameraMoving||focus.animating||assemblyMagnifier.state.animating;
}
invalidate();
onLocale(()=>{
  if(!ready){renderLoading();return;}syncInfo({localeOnly:true});
  for(const [i,option]of [...$('phase-select').querySelectorAll('option')].entries()){const chapter=CHAPTERS[i];if(chapter)option.textContent=`${i+1} · ${displayChapter(chapter).name}`;}
  if(selected&&!$('part-tooltip').hidden)renderActorInfo(selected);
  const horn=$('part-tooltip').dataset.horn;if(horn)$('part-name').textContent=assemblyText(horn==='main'?'assemble.ui.0270':'assemble.ui.0271');
  updateActionLabel();renderQuality.invalidate();invalidate();
});
async function load(){
  const [manifest,binary,models,mapData]=await Promise.all([fetch(assemblyAssetUrl('full-assembly.json')).then(r=>{if(!r.ok)throw Error('模型清单加载失败');return parseResponseJson(r).then(parseAssemblyManifest);}),fetch(assemblyAssetUrl('full-assembly.bin')).then(r=>{if(!r.ok)throw Error('模型几何加载失败');return r.arrayBuffer();}),loadHardwareModels(),fetch(sameOriginUrl('/assemble/servo-map.json')).then(parseResponseJson)]);
  servoMapping=resolveServoMap(mapData,{actors:ACTORS,steps:STEPS});
  hardwareModels=models;createActors();
  for(const p of manifest.parts){
    if(/motor/i.test(p.id)){const group=hardwareModels.servo(p.id)!;addFocusPorts(group,ACTORS[p.id]!.servoPorts);entity(p.id,group);continue;}
    const g=createPartGeometry(new Float32Array(binary,p.positionOffset,p.vertexCount*3),new Uint32Array(binary,p.indexOffset,p.indexCount));
    if(p.rotationZ)g.rotateZ(p.rotationZ);const bearing=/bearing/i.test(p.id),motor=/motor/i.test(p.id);
    // letsduck: printed parts arrive from page.mjs in the studio's material, colour and finish.
    const material=ACTORS[p.id]!.material?.clone()||new THREE.MeshPhysicalMaterial({color:ACTORS[p.id]!.color||'#f7f8fb',roughness:bearing?.29:.44,metalness:bearing?.68:motor?.08:0,clearcoat:/foot/i.test(p.id)?.16:0,envMapIntensity:.75});
    const group=new THREE.Group();group.add(mesh(g,material));
    if(motor){const ports=ACTORS[p.id]!.servoPorts||[{position:[3,8.5,p.size[2]!/2+.8],normal:[0,0,1]}];for(const port of ports){const socket=new THREE.Group(),body=mesh(new THREE.BoxGeometry(7,5,1.3),white);body.position.z=-.65;body.userData.focusPort={label:port.id||assemblyText("assemble.ui.0037")};socket.add(body);const inside=mesh(new THREE.BoxGeometry(5.4,3.4,.03),dark);inside.position.z=.01;socket.add(inside);socket.position.fromArray(port.position);socket.quaternion.copy(socketQuaternion(port));socket.userData.servoSocket=true;group.add(socket);}}
    entity(p.id,group);
  }
  renderQuality.attach(entities,ACTORS);ready=true;fit();resumeSaved();restore();resumeCamera();$('loading').hidden=true;document.documentElement.dataset.ready='true';performance.mark('duck-ready');
  servoWorkbench=await createServoWorkbench({map:servoMapping,hardware:hardwareModels,entities,actors:ACTORS,poses:snapshot(OVERVIEW_STEP,1),
    onVisibility(open){if(open){lessonPlayer.pause();playing=false;materials.close();$('instruction-dialog').close();closeReference();$('piano-audio').pause();$('completion-audio').pause();}scheduler.setActive(!open&&!document.hidden);if(!open){fit();invalidate();}},
    onInstall(binding){goStep(binding.stepIndex,{animate:false});materials.close();cameraTo(STEPS[binding.stepIndex]!.camera,STEPS[binding.stepIndex]!.target);selectActor(binding.actorId);},onGuide(){goStep(1,{animate:false});}});
  servoPickup=createServoPickup({stage,map:servoMapping,preparation:servoWorkbench!.preparation,getStep:()=>step,getFirmware:()=>servoWorkbench!.state,
    onOpen(){lessonPlayer.pause();playing=false;cameraTween=null;setAttributes();},onChange:setAttributes,
    getAnchor(id){const object=entities.get(servoMapping!.byId.get(id)!.actorId);if(!object?.visible||materials.active)return null;const p=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3()).project(camera);if(Math.abs(p.x)>1||Math.abs(p.y)>1||Math.abs(p.z)>1)return null;const h=host.getBoundingClientRect(),r=stage.getBoundingClientRect();return{x:h.left-r.left+(p.x*.5+.5)*h.width,y:h.top-r.top+(-p.y*.5+.5)*h.height};}});
  $('servo-guide-open').onclick=()=>{$('instruction-dialog').close();servoWorkbench!.open();};
  syncInfo();
}
load().catch((error:unknown)=>{loadFailure=error;renderLoading();console.error(error);});
// A read-only diagnostic surface for the prototype's browser acceptance checks.
const anklePrototype={get preparation(){const p=servoWorkbench?.preparation;return p?{loaded:p.loaded,saving:p.saving,counts:p.view.counts}:null;},get servo(){return servoWorkbench?.state;},get hardware(){return hardwareModels?.state||{ready:false};},get quality(){return renderQuality.state;},get sound(){return lessonSound.state;},get magnifier(){return assemblyMagnifier.state;},get focus(){return assemblyFocus.state;},get playback(){return lessonPlayer.state;},get renderStats(){return renderQuality.renderStats;},getActorTransform(id:string){const obj=entities.get(id);if(!obj)return null;const axis=new THREE.Vector3(0,-1,0);if(obj.children[0]&&ACTORS[id]!.kind==='screw')axis.applyQuaternion(obj.children[0].quaternion);axis.applyQuaternion(obj.quaternion);return{visible:obj.visible,position:obj.position.toArray(),quaternion:obj.quaternion.toArray(),shaftAxis:axis.toArray(),normal:new THREE.Vector3(0,1,0).applyQuaternion(obj.quaternion).toArray()};},get state(){return{version:3,totalSteps:STEPS.length,totalChapters:CHAPTERS.length,step,stepId:STEPS[step]!.id,chapter:chapterFor(step)!.id,progress,playing,ready,uiReady,backTransition:!!backTransition,cameraTransition:!!cameraTween,camera:camera.position.toArray(),target:controls.target.toArray(),actors:structuredClone(currentState),referenceVisible:!$('reference-panel').hidden};}};

window.anklePrototype=anklePrototype;
declare global {interface Window {anklePrototype:typeof anklePrototype}}
// Retain the original teaching fallback builders; approved hardware owns the active path.
void makeHorn;void makeBoard;void wireMaterial;
interface SavedView {step:number;camera?:number[];target:number[]}
function parseSavedView(value:unknown):SavedView|null {if(!value||typeof value!=="object"||!("step"in value)||typeof value.step!=="number")return null;const vector=(v:unknown):v is number[]=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==="number"&&Number.isFinite(n));if("camera"in value&&vector(value.camera)&&"target"in value&&vector(value.target))return{step:value.step,camera:value.camera,target:value.target};return{step:value.step,target:[]};}
