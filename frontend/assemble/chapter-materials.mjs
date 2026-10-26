import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {LOOK} from '../shared/duck-look.mjs';
import {ACTORS,STEPS,CHAPTERS,snapshot,chapterFor} from './hardware-state.mjs';
import {chapterMaterials} from './material-catalog.mjs';
import {specimenLayout,arrangeGroups} from './material-layout.mjs';
const $=id=>document.getElementById(id);

/** Chapter inventory owns display clones; assembly entities and their buffers stay intact. */
export function createChapterMaterials({scene,camera,controls,renderer,host,entities,getHardware,getState,pause,stopCamera,applyState,fit,invalidate,resetFocus,clearSelection,hideArrow,onStart,onInspect}){
const stage=$('stage');
let materialTrayActive=false,materialSelection=null,trayReturn=null,trayRows=[],trayGroups=[],trayUnits=[],trayLabels=[],trayUnitLabels=[],trayBox=null;
const trayRoot=new THREE.Group();trayRoot.name='chapter-materials';scene.add(trayRoot);
const trayLabelHost=document.createElement('div');trayLabelHost.id='tray-labels';trayLabelHost.hidden=true;host.append(trayLabelHost);
const materialsButton=document.createElement('button');materialsButton.type='button';materialsButton.id='step-materials';materialsButton.className='stage-pill';materialsButton.textContent='本章零件';stage.append(materialsButton);
const quantityNote=document.createElement('p');quantityNote.className='tray-quantity-note';quantityNote.textContent='按已知数量陈列，大小仅作展示';$('kit-go').before(quantityNote);
function cloneForTray(source,{mutableGeometry=false}={}){
 const root=source.clone(true),materials=new Map();
 root.traverse(o=>{if(!o.isMesh)return;
  if(mutableGeometry){o.geometry=o.geometry.clone();o.userData.trayOwnGeometry=true;}
  const copy=m=>{if(!materials.has(m)){const c=m.clone();c.opacity=c.userData.baseOpacity??1;c.transparent=!!c.userData.baseTransparent;c.userData.trayBaseOpacity=c.opacity;c.userData.trayBaseTransparent=c.transparent;c.userData.trayEmissive=c.emissive?.getHex()??0;c.userData.trayIntensity=c.emissiveIntensity??1;c.userData.trayColor=c.color?.getHex();materials.set(m,c);}return materials.get(m);};
  o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);
 });return root;
}
function sampleFor(m){
 const wrapper=new THREE.Group();
 if(m.kind==='assembly'){
  for(const id of m.ids){const obj=entities.get(id);if(obj?.visible)wrapper.add(cloneForTray(obj,{mutableGeometry:ACTORS[id].kind==='cable'}));}
 }else{
  const id=m.ids.find(id=>entities.has(id)),a=ACTORS[id];let sample;
  if(a.servoPorts)sample=getHardware().servo(id);
  else if(a.kind==='board')sample=getHardware().board(a);
  else if(a.kind==='cable'&&!['power','usb-c'].includes(a.cableType))sample=getHardware().cableModel();
  else if(a.kind==='screw')sample=getHardware().screw(a);
  sample=cloneForTray(sample||entities.get(id),{mutableGeometry:a.kind==='cable'&&['power','usb-c'].includes(a.cableType)});
  sample.visible=true;sample.position.set(0,0,0);sample.quaternion.identity();
  if(a.kind==='screw')sample.rotation.z=Math.PI/2;
  sample.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(sample).getSize(new THREE.Vector3());
  if(size.x<size.y&&size.x<=size.z)sample.rotateZ(-Math.PI/2);else if(size.z<size.y&&size.z<size.x)sample.rotateX(Math.PI/2);
  wrapper.add(sample);
 }
 wrapper.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(wrapper),center=box.getCenter(new THREE.Vector3());
 for(const child of wrapper.children)child.position.sub(new THREE.Vector3(center.x,box.min.y-.75,center.z));
 wrapper.updateMatrixWorld(true);return wrapper;
}
function disposeTray(){
 const disposedMaterials=new Set();
 trayRoot.traverse(o=>{if(!o.isMesh)return;if(o.userData.trayOwnGeometry)o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(!disposedMaterials.has(m)){disposedMaterials.add(m);m.dispose();}});
 trayRoot.clear();trayLabelHost.replaceChildren();trayLabels=[];trayUnitLabels=[];trayGroups=[];trayUnits=[];
 if(trayBox){scene.remove(trayBox);trayBox.geometry.dispose();trayBox.material.dispose();trayBox=null;}
}
function endMaterial(){
 if(!materialTrayActive)return;
 closeInspection();
 const {step,progress}=getState(),saved=trayReturn;materialTrayActive=false;materialSelection=null;trayReturn=null;trayRows=[];
 disposeTray();trayLabelHost.hidden=true;$('kit').hidden=true;document.body.classList.remove('preparing');
 applyState(snapshot(step,progress));fit();
 if(saved){stopCamera();controls.enabled=saved.enabled;controls.enableDamping=false;controls.update();controls.enableDamping=true;camera.position.copy(saved.camera);controls.target.copy(saved.target);controls.maxDistance=saved.maxDistance;camera.far=saved.far;camera.updateProjectionMatrix();controls.update();}
 clearSelection();invalidate();
}
function fitTray(){
 if(!materialTrayActive)return;const box=new THREE.Box3().setFromObject(trayRoot),center=box.getCenter(new THREE.Vector3());
 const radius=box.getSize(new THREE.Vector3()).length()/2;
 const direction=new THREE.Vector3(.04,1.2,1.5).normalize(),right=new THREE.Vector3().crossVectors(camera.up,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize(),tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),tanH=tanV*camera.aspect;
 let distance=controls.minDistance;for(let k=0;k<8;k++){const v=new THREE.Vector3(k&1?box.max.x:box.min.x,k&2?box.max.y:box.min.y,k&4?box.max.z:box.min.z).sub(center);distance=Math.max(distance,v.dot(direction)+Math.max(Math.abs(v.dot(right))/(tanH*.86),Math.abs(v.dot(up))/(tanV*.78)));}
 controls.maxDistance=Math.max(1600,distance*1.5);camera.far=Math.max(trayReturn.far,controls.maxDistance+radius*2);camera.updateProjectionMatrix();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);stopCamera();controls.update();invalidate();
}
function selectTray(index,unitIndex=0){
 if(!materialTrayActive||!trayUnits[index]?.[unitIndex])return;materialSelection={index,unitIndex};
 trayUnits.forEach((units,i)=>units.forEach((unit,j)=>unit.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){
  const active=i===index&&j===unitIndex;m.opacity=m.userData.trayBaseOpacity*(active?1:.78);const transparent=!active||m.userData.trayBaseTransparent;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}
  if(m.color)m.color.setHex(active?0x5578ff:m.userData.trayColor);
  if(m.emissive){m.emissive.setHex(active?0x2858ff:m.userData.trayEmissive);m.emissiveIntensity=active?.45:m.userData.trayIntensity;}
 }})));
 [...$('kit-parts').querySelectorAll('button')].forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.querySelector('.note').hidden=i!==index||!trayRows[i].note;});
 trayLabels.forEach((l,i)=>l.classList.toggle('selected',i===index));
 trayUnitLabels.forEach((labels,i)=>labels.forEach((l,j)=>l.classList.toggle('selected',i===index&&j===unitIndex)));
 if(!trayBox){trayBox=new THREE.Box3Helper(new THREE.Box3(),0x4d6bfe);trayBox.material.depthTest=false;trayBox.material.depthWrite=false;trayBox.renderOrder=40;scene.add(trayBox);}
 trayBox.visible=true;$('kit-parts').querySelectorAll('button')[index]?.scrollIntoView({block:'nearest'});invalidate();
 if(onInspect?.(trayRows[index],unitIndex))closeInspection();else if(inspectionEnabled)openInspection(index,unitIndex);else closeInspection();
}
function showPreparation(c,rows=chapterMaterials(c),title=c.name+' · 本章零件',start=false){
 if(!getState().ready)return;endMaterial();pause();const {step,progress}=getState();
 trayReturn={camera:camera.position.clone(),target:controls.target.clone(),maxDistance:controls.maxDistance,far:camera.far,enabled:controls.enabled};
 const original=snapshot(step,progress);applyState(snapshot(c.end,1));
 trayRows=rows;trayGroups=rows.map((m,i)=>{
  const {size:unitSize,positions}=specimenLayout(m),count=positions.length;
  const group=new THREE.Group();trayRoot.add(group);trayUnits[i]=[];trayUnitLabels[i]=[];
  for(let j=0;j<count;j++){
   const unit=sampleFor(m),size=new THREE.Box3().setFromObject(unit).getSize(new THREE.Vector3());unit.scale.setScalar(unitSize/Math.max(size.x,size.y,size.z));unit.position.fromArray(positions[j]);unit.traverse(o=>{o.userData.trayIndex=i;o.userData.trayUnitIndex=j;});group.add(unit);trayUnits[i].push(unit);
   if(count>1){const label=document.createElement('button');label.type='button';label.className='tray-unit-label';label.textContent=String(j+1);label.setAttribute('aria-label',`${m.name} · 第 ${j+1} 件`);label.addEventListener('click',()=>selectTray(i,j));trayLabelHost.append(label);trayUnitLabels[i].push(label);}
  }
  return group;
 });
 applyState(original);for(const obj of entities.values())obj.visible=false;
 const sizes=trayGroups.map(g=>new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()));
 arrangeGroups(rows,sizes).forEach((p,i)=>trayGroups[i].position.fromArray(p));
 trayGroups.forEach((g,i)=>{const label=document.createElement('span');label.className='tray-label';label.textContent=String(i+1).padStart(2,'0')+' · '+(rows[i].quantity||`×${rows[i].count}`);trayLabelHost.append(label);trayLabels.push(label);});
 $('kit-title').textContent=title;$('kit').querySelector('.kit-eyebrow').textContent=`第 ${CHAPTERS.indexOf(c)+1} / 14 章 · 点零件查看`;
 $('kit-parts').replaceChildren();$('kit-screws-block').hidden=true;
 rows.forEach((m,i)=>{const li=document.createElement('li'),b=document.createElement('button');b.className='material-row';b.type='button';b.setAttribute('aria-pressed','false');
  const ordinal=document.createElement('span');ordinal.className='ordinal';ordinal.textContent=String(i+1).padStart(2,'0');
  const name=document.createElement('strong');name.textContent=m.fastener?m.fastener.replace('x','×')+' 螺丝':m.short||m.name;b.title=m.name;const spec=document.createElement('span');spec.className='spec';spec.textContent=m.spec;
  const quantity=document.createElement('em');quantity.textContent=m.quantity||`×${m.count}`;const note=document.createElement('small');note.className='note';note.textContent=m.note;note.hidden=true;
  b.append(ordinal,name,quantity,spec,note);b.addEventListener('click',()=>selectTray(i));li.append(b);$('kit-parts').append(li);
 });
 $('kit-go').textContent=start?'开始本章':'返回本步';$('kit-go').dataset.start=String(start);
 $('kit').hidden=false;trayLabelHost.hidden=false;materialTrayActive=true;document.body.classList.add('preparing');$('instruction-dialog').close();resetFocus();clearSelection();fit();
}
function inspectMaterial(m){
 const c=chapterFor(getState().step);if(!materialTrayActive)showPreparation(c);
 let index=trayRows.findIndex(row=>row.ids.some(id=>m.ids.includes(id)));
 if(index<0){showPreparation(c,[m],'本步零件');index=0;}selectTray(index);
}
function updateMaterialFrames(){
 if(!materialTrayActive)return;camera.updateMatrixWorld();
 for(const obj of entities.values())obj.visible=false;hideArrow();
 if(trayBox&&materialSelection)trayBox.box.setFromObject(trayUnits[materialSelection.index][materialSelection.unitIndex]).expandByScalar(2);
 trayGroups.forEach((g,i)=>{const b=new THREE.Box3().setFromObject(g),p=b.getCenter(new THREE.Vector3()).project(camera),corners=Array.from({length:8},(_,k)=>new THREE.Vector3(k&1?b.max.x:b.min.x,k&2?b.max.y:b.min.y,k&4?b.max.z:b.min.z).project(camera)),label=trayLabels[i];label.hidden=Math.abs(p.x)>1.1||Math.abs(p.y)>1.1;label.style.left=((p.x*.5+.5)*host.clientWidth)+'px';label.style.top=((-Math.max(...corners.map(p=>p.y))*.5+.5)*host.clientHeight-18)+'px';});
 trayUnitLabels.forEach((labels,i)=>labels.forEach((label,j)=>{const b=new THREE.Box3().setFromObject(trayUnits[i][j]),p=b.getCenter(new THREE.Vector3());p.y=b.min.y;p.project(camera);label.style.left=((p.x*.5+.5)*host.clientWidth)+'px';label.style.top=((-p.y*.5+.5)*host.clientHeight+14)+'px';label.hidden=!trayUnits[i][j].visible||Math.abs(p.x)>1.05||Math.abs(p.y)>1.05;}));
}
materialsButton.addEventListener('click',()=>showPreparation(chapterFor(getState().step)));
$('kit-go').addEventListener('click',()=>{const start=$('kit-go').dataset.start==='true';endMaterial();if(start)onStart();});
$('kit-parts').addEventListener('keydown',ev=>{
 if(ev.key===' '||ev.key==='Enter'){ev.stopPropagation();return;}
 if(!['ArrowDown','ArrowUp'].includes(ev.key))return;ev.preventDefault();ev.stopPropagation();
 const index=[...$('kit-parts').querySelectorAll('button')].indexOf(ev.target.closest('button')),next=Math.max(0,Math.min(trayRows.length-1,index+(ev.key==='ArrowDown'?1:-1)));selectTray(next);$('kit-parts').querySelectorAll('button')[next].focus();
});
let pointerDown=null;renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',ev=>{if(!materialTrayActive||!pointerDown||Math.hypot(ev.clientX-pointerDown[0],ev.clientY-pointerDown[1])>5)return;
 const r=renderer.domElement.getBoundingClientRect(),p=new THREE.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(p,camera);const hit=ray.intersectObjects(trayGroups,true).find(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});if(hit)selectTray(hit.object.userData.trayIndex,hit.object.userData.trayUnitIndex);
});


let inspectionEnabled=true;try{inspectionEnabled=localStorage.getItem('duck-material-zoom')!=='off';}catch{}
let inspectionVisible=false,inspectionRoot=null,inspectionDirty=false,inspectionFrame=0,inspectionFlight=null;
const inspectionSwitch=document.createElement('button');inspectionSwitch.type='button';inspectionSwitch.id='inspection-enabled';inspectionSwitch.setAttribute('role','switch');inspectionSwitch.setAttribute('aria-checked',String(inspectionEnabled));inspectionSwitch.setAttribute('aria-label','选中放大');inspectionSwitch.innerHTML='<span>选中放大</span><i aria-hidden="true"></i>';$('kit-parts').before(inspectionSwitch);
quantityNote.textContent='按已知数量陈列，大小仅作展示';
const inspectionScreen=document.createElement('div');inspectionScreen.id='inspection-screen';inspectionScreen.hidden=true;host.append(inspectionScreen);
const inspectionName=document.createElement('strong');inspectionName.className='inspection-name';inspectionScreen.append(inspectionName);
const inspectionSurface=document.createElement('div');inspectionSurface.className='inspection-surface';inspectionScreen.append(inspectionSurface);
const inspectionHint=document.createElement('span');inspectionHint.className='inspection-hint';inspectionHint.textContent='拖动旋转 360° · 滚轮缩放 · 右键平移';inspectionScreen.append(inspectionHint);
const inspectionReturn=document.createElement('button');inspectionReturn.type='button';inspectionReturn.className='inspection-return';inspectionReturn.textContent='收回零件';inspectionReturn.addEventListener('click',()=>closeInspection());inspectionScreen.append(inspectionReturn);
let inspectionScene,inspectionRenderer,inspectionCamera,inspectionControls;
function initInspection(){
 if(inspectionRenderer)return;
 inspectionScene=new THREE.Scene();inspectionScene.environmentIntensity=LOOK.environment;
inspectionScene.add(new THREE.HemisphereLight(0xf1f5ff,0xb6c2d8,2.2));
const inspectionKey=new THREE.DirectionalLight(0xfffbf7,3.2);inspectionKey.position.set(-160,380,290);inspectionScene.add(inspectionKey);
inspectionRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});inspectionRenderer.setPixelRatio(Math.min(devicePixelRatio,1.75));inspectionRenderer.outputColorSpace=THREE.SRGBColorSpace;inspectionRenderer.toneMapping=THREE.ACESFilmicToneMapping;inspectionRenderer.toneMappingExposure=LOOK.exposure;inspectionSurface.append(inspectionRenderer.domElement);
const inspectionPMREM=new THREE.PMREMGenerator(inspectionRenderer);const room=new RoomEnvironment();inspectionScene.environment=inspectionPMREM.fromScene(room,.04).texture;room.dispose();inspectionPMREM.dispose();
inspectionCamera=new THREE.PerspectiveCamera(34,1,.01,10000);
inspectionControls=new OrbitControls(inspectionCamera,inspectionRenderer.domElement);inspectionControls.enablePan=true;inspectionControls.enableDamping=true;inspectionControls.dampingFactor=.1;inspectionControls.minPolarAngle=.01;inspectionControls.maxPolarAngle=Math.PI-.01;
inspectionControls.addEventListener('change',()=>{inspectionDirty=true;});
}
function sizeInspection(){if(!inspectionRenderer)return;const edge=Math.floor(Math.min(host.clientWidth*.88,host.clientHeight*.72,650));inspectionSurface.style.width=edge+'px';inspectionSurface.style.height=edge+'px';inspectionRenderer.setSize(edge,edge,false);inspectionDirty=true;}
window.addEventListener('resize',sizeInspection);
function drawInspection(){if(!inspectionVisible||document.hidden)return;inspectionControls.update();if(inspectionDirty){inspectionRenderer.render(inspectionScene,inspectionCamera);inspectionDirty=false;}inspectionFrame=requestAnimationFrame(drawInspection);}
function disposeInspection(){if(!inspectionRoot)return;const disposed=new Set();inspectionRoot.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(!disposed.has(m)){disposed.add(m);m.dispose();}});inspectionScene.remove(inspectionRoot);inspectionRoot=null;}
function closeInspection(){if(inspectionVisible)controls.enabled=true;inspectionVisible=false;inspectionFlight?.cancel();inspectionFlight=null;cancelAnimationFrame(inspectionFrame);inspectionScreen.hidden=true;disposeInspection();trayUnits.flat().forEach(g=>g.visible=true);if(trayBox)trayBox.visible=!!materialSelection;invalidate();}
function openInspection(index,unitIndex=0){
 if(!materialTrayActive||!trayUnits[index]?.[unitIndex])return;initInspection();controls.enabled=false;
 inspectionFlight?.cancel();cancelAnimationFrame(inspectionFrame);disposeInspection();trayUnits.flat().forEach(g=>g.visible=true);
 const source=trayUnits[index][unitIndex],box=new THREE.Box3().setFromObject(source),points=Array.from({length:8},(_,k)=>new THREE.Vector3(k&1?box.max.x:box.min.x,k&2?box.max.y:box.min.y,k&4?box.max.z:box.min.z).project(camera));
 const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
 const startX=(minX+maxX)*host.clientWidth/4,startY=-(minY+maxY)*host.clientHeight/4-host.clientHeight*.02,startSize=Math.max((maxX-minX)*host.clientWidth/2,(maxY-minY)*host.clientHeight/2);
 inspectionRoot=source.clone(true);inspectionRoot.position.set(0,0,0);inspectionRoot.scale.setScalar(1);inspectionRoot.visible=true;
 const materials=new Map();inspectionRoot.traverse(o=>{if(!o.isMesh)return;const copy=m=>{if(!materials.has(m)){const c=m.clone();c.opacity=m.userData.trayBaseOpacity;c.transparent=m.userData.trayBaseTransparent;if(c.color)c.color.setHex(m.userData.trayColor);if(c.emissive){c.emissive.setHex(m.userData.trayEmissive);c.emissiveIntensity=m.userData.trayIntensity;}materials.set(m,c);}return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);});
 inspectionRoot.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(inspectionRoot),center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;inspectionRoot.position.sub(center);inspectionScene.add(inspectionRoot);
 inspectionControls.enableDamping=false;inspectionControls.update();inspectionControls.enableDamping=true;
 inspectionControls.target.set(0,0,0);inspectionControls.minDistance=radius*1.1;inspectionControls.maxDistance=radius*12;inspectionCamera.near=Math.max(.001,radius*.001);inspectionCamera.far=Math.max(1000,radius*30);inspectionCamera.updateProjectionMatrix();inspectionCamera.position.copy(new THREE.Vector3(.4,.75,1.15).normalize().multiplyScalar(radius/Math.sin(THREE.MathUtils.degToRad(17))*1.08));inspectionControls.update();
 sizeInspection();inspectionName.textContent=trayRows[index].name+(trayUnits[index].length>1?` · 第 ${unitIndex+1} / ${trayUnits[index].length} 件`:'');inspectionScreen.hidden=false;inspectionVisible=true;source.visible=false;if(trayBox)trayBox.visible=false;inspectionDirty=true;drawInspection();
 const scale=Math.max(.02,Math.min(.8,startSize/(inspectionSurface.clientWidth*.68)));
 inspectionFlight=inspectionSurface.animate([{transform:`translate(-50%,-50%) translate(${startX}px,${startY}px) scale(${scale})`,opacity:.35},{transform:'translate(-50%,-50%) translate(0,0) scale(1)',opacity:1}],{duration:480,easing:'cubic-bezier(.2,.75,.2,1)'});
}
inspectionSwitch.addEventListener('click',()=>{inspectionEnabled=!inspectionEnabled;try{localStorage.setItem('duck-material-zoom',inspectionEnabled?'on':'off');}catch{}inspectionSwitch.setAttribute('aria-checked',String(inspectionEnabled));if(!inspectionEnabled)closeInspection();else if(materialSelection)openInspection(materialSelection.index,materialSelection.unitIndex);});
document.addEventListener('visibilitychange',()=>{if(inspectionVisible){cancelAnimationFrame(inspectionFrame);drawInspection();}});

return{get active(){return materialTrayActive;},open(c,options={}){showPreparation(c,options.rows||chapterMaterials(c),options.title||c.name+' · 本章零件',!!options.start);},close:endMaterial,inspect:inspectMaterial,update:updateMaterialFrames,resize(){if(materialTrayActive)fitTray();if(inspectionVisible)sizeInspection();}};
}
