import * as THREE from 'three';
import {SERVO_BINDINGS} from '../shared/servo-map.js';
import {readNumberingReadiness,subscribeNumberingReadiness,updateNumberingReadiness} from '../shared/numbering-readiness.js';

import {applyBrand} from '../shared/brand.js';
import {readDraft} from '../shared/draft.js';
import {completePoses,assemblyActors,actorQuaternion} from '../debug/poses.js';
import {createCarousel} from './carousel.js';
import {loadEdition} from '../shared/edition.js';
import {t,onLocale} from '../shared/i18n.js';
import {ExperimentalAccess,accessStorage,ACCESS_KEY} from './experimental-access.js';
import {createExperimentalUI} from './experimental-ui.js';
import {parseResponseJson} from '../shared/json.js';
import {record,numberArray} from '../shared/guards.js';
import {parseAssemblyManifest} from '../assemble/assembly-manifest.js';
import type {Vec3} from '../shared/types.js';
import type {NumberingReadiness} from '../shared/numbering-readiness.js';
type AssemblyPart=ReturnType<typeof parseAssemblyManifest>['parts'][number];
applyBrand();
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.querySelector<T>('#'+id)!,KEY='letsduck.duck-hub.v1';
const access=new ExperimentalAccess(null,accessStorage());
const entries=[{id:'paint',get name(){return t('hub.paint.name');},get caption(){return t('hub.paint.caption');},color:0x7187f9},{id:'debug',get name(){return t('hub.debug.name');},get caption(){return t('hub.debug.caption');},color:0x3aa276},{id:'assemble',get name(){return t('hub.assemble.name');},get caption(){return t('hub.assemble.caption');},color:0xe5a06a}];
const valid=(id:unknown):id is string=>typeof id==='string'&&entries.some(e=>e.id===id);
let focus='debug',lastUsed:string|null=null,opened:string|null=null,ready=false,carousel:ReturnType<typeof createCarousel>;
try{const stored=localStorage.getItem(KEY);if(valid(stored)){focus=stored;lastUsed=stored;}}catch{}
const host=$('home-viewport'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,3000);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0xa7b4cc,2.7));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-250,550,400);scene.add(key);const fill=new THREE.DirectionalLight(0xffffff,1.8);fill.position.set(300,250,-250);scene.add(fill);
const models=new Map<string,THREE.Group>(),buttons=new Map<string,HTMLButtonElement>(),placements=new Map<string,Vec3>(),stage=document.querySelector<HTMLElement>('.duck-stage')!;let pending=false;
for(const e of entries){const b=document.createElement('button');b.className='duck-choice';b.dataset.duck=e.id;b.innerHTML=`<strong>${e.name}<span class="go">↗</span></strong><small>${e.caption}</small>`;$('duck-labels').append(b);buttons.set(e.id,b);}
const experiment=createExperimentalUI({stage,access,pick:hitAt,focus:()=>focus,name:id=>entries.find(e=>e.id===id)!.name,enabled:()=>ready&&!opened,refresh:()=>{refreshAccess();void refreshHomeStatus();}});
carousel=createCarousel({stage,ids:entries.map(e=>e.id),initial:focus,enabled:()=>ready&&!opened,pick:hitAt,render:positionModels,activate:open});
function invalidate(){if(pending||document.hidden)return;pending=true;requestAnimationFrame(()=>{pending=false;if(!opened){renderer.render(scene,camera);layoutLabels();}});}
function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;
 const mobile=r.width<700;camera.position.set(0,mobile?460:365,mobile?1230:970);camera.lookAt(0,mobile?80:-15,0);camera.updateProjectionMatrix();positionModels();invalidate();}
new ResizeObserver(resize).observe(host);document.addEventListener('visibilitychange',invalidate);
function positionModels(angle=carousel.angle,current=focus){
 focus=current;const radius=host.clientWidth<700?185:250;
 for(const [index,e] of entries.entries()){
  const a=(index-1)*Math.PI*2/3+angle,z=Math.cos(a),position:Vec3=[Math.sin(a)*radius,0,z*radius],obj=models.get(e.id),front=e.id===focus;
  if(obj){obj.position.fromArray(position);obj.scale.setScalar(.9+.1*z);obj.rotation.y=(e.id==='paint'?.35:e.id==='assemble'?-.35:.1)+Math.sin(a)*.12;}
  placements.set(e.id,position);const b=buttons.get(e.id)!;b.classList.toggle('front',front);b.setAttribute('data-c-position',String(front));b.style.opacity=String(.64+.36*(z+1)/2);b.style.zIndex=String(Math.round((z+1)*100));
  b.setAttribute('aria-label',access.edition==='server'&&e.id==='debug'?t('beta.debugLabel'):access.locked(e.id)?t('beta.lockedLabel',{name:e.name}):front?t('hub.enter',{name:e.name}):t('hub.rotate',{name:e.name}));
 }
 experiment.position();$('remember-status').textContent=lastUsed?t('hub.recent',{name:entries.find(e=>e.id===lastUsed)!.name}):t('hub.first');invalidate();
}
function layoutLabels(){camera.updateMatrixWorld();for(const e of entries){const obj=models.get(e.id),p=new THREE.Vector3(0,-9,e.id==='debug'?175:95);if(obj){obj.updateMatrixWorld(true);p.applyMatrix4(obj.matrixWorld);}else p.add(new THREE.Vector3(...placements.get(e.id)!));p.project(camera);const b=buttons.get(e.id)!;b.hidden=!ready||p.z>1;const spread=host.clientWidth<700?1.2:1;b.style.left=(p.x*.5*spread+.5)*host.clientWidth+'px';b.style.top=Math.min((-p.y*.5+.5)*host.clientHeight,host.clientHeight-b.offsetHeight-12)+'px';}experiment.position();}
function persist(id:string){if(!valid(id))return;try{localStorage.setItem(KEY,id);}catch{}lastUsed=id;}
// Assembly needs the servos connected in Debug Duck first; the prompt suggests that order but lets the user go on.
// The prompt opens under the cursor, so the second click of a double-click must not choose for the user.
let promptShown=0;const settled=()=>performance.now()-promptShown>400;
function askPrerequisite(){if($('prerequisite').hidden)promptShown=performance.now();$('prerequisite-copy').textContent=t('hub.prerequisite',{count:readNumberingReadiness().verifiedIds.length});$('prerequisite-debug').textContent=t('hub.enter',{name:entries.find(e=>e.id==='debug')!.name});$('prerequisite').hidden=false;$('prerequisite-debug').focus();}
function hidePrerequisite(){$('prerequisite').hidden=true;}
$('prerequisite-debug').onclick=()=>{if(!settled())return;hidePrerequisite();open('debug');};$('prerequisite-skip').onclick=()=>{if(!settled())return;hidePrerequisite();open('assemble',true);};
function open(id:string,skipPrerequisite=false){if(!ready||!valid(id)||experiment.suppressed)return;if(access.locked(id)){experiment.show(id);return;}
 if(id==='assemble'&&!skipPrerequisite&&access.edition==='personal'&&!readNumberingReadiness().ready){experiment.hide();carousel.jump(id);askPrerequisite();return;}
 hidePrerequisite();experiment.hide();carousel.jump(id);opened=id;persist(id);positionModels();
 $('module-window').dataset.module=id;
 $('module-title').textContent=entries.find(e=>e.id===id)!.name;
 $<HTMLIFrameElement>('module-frame').title=t('hub.frame.named',{name:entries.find(e=>e.id===id)!.name});
 $('window-note').textContent='';
 $<HTMLIFrameElement>('module-frame').src=id==='debug'?'/debug/?embedded=1':id==='assemble'?'/assemble/':'/paint';
 $('module-window').hidden=false;document.body.classList.add('module-open');$(id==='paint'?'close-x':'close-module').focus();
}
function close(){if(!opened)return;updatePaint();persist(opened);opened=null;$('module-window').hidden=true;$<HTMLIFrameElement>('module-frame').src='about:blank';document.body.classList.remove('module-open');positionModels();resize();buttons.get(focus)!.focus();}
$('close-module').onclick=close;$('close-x').onclick=close;
$<HTMLIFrameElement>('module-frame').addEventListener('load',()=>{try{$<HTMLIFrameElement>('module-frame').contentWindow?.addEventListener('keydown',e=>{if(e.key==='Escape')close();});}catch{}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){hidePrerequisite();close();}});window.addEventListener('pagehide',()=>{if(opened)persist(opened);});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function hitAt(e:PointerEvent){
 const label=e.target instanceof Element?e.target.closest<HTMLElement>('[data-duck]'):null;
 if(label)return label.dataset.duck;
 const r=host.getBoundingClientRect();
 pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
 scene.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(pointer,camera);
 const hit=raycaster.intersectObjects([...models.values()],true)[0];
 let o:THREE.Object3D|null|undefined=hit?.object;
 while(o&&!o.userData.duckId)o=o.parent;
 const id:unknown=o?.userData.duckId;
 if(typeof id==='string')return id;
 // Keep exact visible geometry first; forgive gaps and edges within each duck's outline.
 const padding=14;let nearest:string|undefined,distance=Infinity;
 for(const [candidate,obj] of models){
  const bounds=new THREE.Box3().setFromObject(obj),point=new THREE.Vector3();
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   point.set(x,y,z).project(camera);
   const px=(point.x*.5+.5)*r.width+r.left,py=(-point.y*.5+.5)*r.height+r.top;
   left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
  }
  if(e.clientX<left-padding||e.clientX>right+padding||e.clientY<top-padding||e.clientY>bottom+padding)continue;
  const proximity=(e.clientX-(left+right)/2)**2+(e.clientY-(top+bottom)/2)**2;
  if(proximity<distance){nearest=candidate;distance=proximity;}
 }
 return nearest;
}
$('reset-carousel').onclick=()=>{try{localStorage.removeItem(KEY);}catch{}lastUsed=null;carousel.rotateTo('debug');};
const servoIds=new Map(SERVO_BINDINGS.map(binding=>[binding.actorId,binding.id]));
function updateReadiness(progress:NumberingReadiness){buttons.get('assemble')!.dataset.numberingReady=String(progress.ready);if(progress.ready)hidePrerequisite();refreshAccess();}

function box(parent:THREE.Object3D,size:Vec3,color:THREE.ColorRepresentation,position:Vec3){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.18}));mesh.position.set(...position);parent.add(mesh);return mesh;}
function rod(parent:THREE.Object3D,a:Vec3,b:Vec3,r:number,color:THREE.ColorRepresentation,rEnd=r){const direction=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rEnd,r,direction.length(),12),new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.15}));mesh.position.fromArray(a).addScaledVector(direction,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());parent.add(mesh);return mesh;}
function addAccessory(root:THREE.Group,id:string){const prop=new THREE.Group();prop.name=id==='paint'?'paintbrush':id==='debug'?'computer':'wrench';root.add(prop);
 if(id==='paint'){
  rod(prop,[-78,205,112],[38,225,112],3.2,0xc28547);rod(prop,[-89,203,112],[-75,206,112],5.2,0xd4b67d);
  const bristles=rod(prop,[-111,199,112],[-89,203,112],7,0x485a81,5.2);bristles.scale.z=.55;
  rod(prop,[-112,199,112],[-101,201,112],7.2,0x5979ec,6.4).scale.z=.55;
 }else if(id==='debug'){
  prop.position.set(5,0,118);prop.rotation.y=.08;
  const base=box(prop,[113,5,75],0x7a91ac,[0,3,0]);base.material.metalness=.5;
  box(prop,[87,1,33],0x344861,[0,6,-7]);box(prop,[31,1,17],0xa7b9ce,[0,6,22]);
  for(let i=0;i<9;i++)box(prop,[5,.7,25],0x758ba7,[-35+i*8,7,-7]);
  const lid=new THREE.Group();lid.position.set(0,7,-34);lid.rotation.x=-.14;prop.add(lid);
  box(lid,[113,72,5],0x526b8b,[0,36,0]);box(lid,[101,60,1],0x172d47,[0,36,3]);
  box(lid,[31,3,1],0x6dc5a6,[-22,52,4]);box(lid,[49,2,1],0x8aa5cb,[-13,41,4]);box(lid,[37,2,1],0x8aa5cb,[-19,32,4]);box(lid,[23,2,1],0x7bbda5,[-26,23,4]);
 }else{
  const shape=new THREE.Shape();const points:[number,number][]=[[-5,-13],[5,-13],[6,53],[17,65],[18,80],[10,89],[7,78],[-1,74],[-8,79],[-7,90],[-18,84],[-21,71],[-15,60],[-6,53]];
  shape.moveTo(...points[0]!);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
  const hole=new THREE.Path();hole.absellipse(0,-5,2.6,2.6,0,Math.PI*2,true);shape.holes.push(hole);
  const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:4,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:1,bevelThickness:1}),new THREE.MeshStandardMaterial({color:0x607e9e,metalness:.7,roughness:.3}));prop.add(mesh);prop.position.set(0,227,90);prop.rotation.set(.15,-.1,-2.18);
 }
}
function colour(id:string,part:AssemblyPart){
 const servo=servoIds.has(part.id),head=part.id.startsWith('h_');
 if(id==='debug')return servo?0x405166:0xd2dfed;
 const value=readDraft()?.colors[assemblyActors[part.id]?.sourceId??part.sourceId];if(id==='paint'&&/^#[0-9a-f]{6}$/i.test(value??''))return value!;
 if(servo)return 0x344051;
 if(id==='paint'){if(/jaw|beak|foot|shank/i.test(part.sourceId))return 0xf1a052;if(head)return 0x6682e4;return /body|trunk|head/i.test(part.sourceId)?0xf2f0e8:0x92afd4;}
 return /jaw|beak|foot/i.test(part.sourceId)?0xe9a46d:head?0xe7e9ed:0xe9e2d5;
}
async function init(){
 const edition=await loadEdition();access.edition=edition;if(edition==='personal')subscribeNumberingReadiness(updateReadiness);refreshAccess();
 const [meta,binary,poses]=await Promise.all([fetch('/assemble/assets/full-assembly.json').then(parseResponseJson).then(parseAssemblyManifest),fetch('/assemble/assets/full-assembly.bin').then(r=>r.arrayBuffer()),Promise.resolve(completePoses())]);
 const geometries=new Map<string,THREE.BufferGeometry>();for(const part of meta.parts){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,part.positionOffset,part.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,part.indexOffset,part.indexCount).slice(),1));g.computeVertexNormals();geometries.set(part.id,g);}
 for(const e of entries){const root=new THREE.Group();root.userData.duckId=e.id;scene.add(root);models.set(e.id,root);
  for(const part of meta.parts){const info=poses[part.id];if(!info?.pose?.visible)continue;const isServo=servoIds.has(part.id),ghost=e.id==='debug'&&!isServo;
   const material=new THREE.MeshStandardMaterial({color:colour(e.id,part),roughness:.52,metalness:isServo?.18:.035,transparent:ghost,opacity:ghost?.24:1,depthWrite:!ghost});
   const mesh=new THREE.Mesh(geometries.get(part.id),material);mesh.position.fromArray(info.pose.position);mesh.quaternion.copy(actorQuaternion(assemblyActors[part.id]!,info.pose));mesh.userData.partId=part.id;root.add(mesh);
  }
  const plate=new THREE.Mesh(new THREE.CircleGeometry(88,70),new THREE.MeshBasicMaterial({color:e.color,transparent:true,opacity:.07,depthWrite:false}));plate.rotation.x=-Math.PI/2;plate.position.y=-4;root.add(plate);
  const rim=new THREE.Mesh(new THREE.RingGeometry(86,87,70),new THREE.MeshBasicMaterial({color:e.color,transparent:true,opacity:.17,side:THREE.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.y=-3.5;root.add(rim);
  addAccessory(root,e.id);
 }
 ready=true;refreshAccess();$('home-loading').hidden=true;document.body.dataset.homeReady='true';positionModels();resize();showRequestedHint();
}
positionModels();init().catch(e=>{$('home-loading').textContent=t('hub.loading.failed');ready=true;document.body.dataset.homeReady='true';resize();layoutLabels();showRequestedHint();console.error(e);});

function updatePaint(){const draft=readDraft();for(const child of models.get('paint')?.children??[]){const id:unknown=child.userData.partId;if(typeof id!=='string'||!id||!(child instanceof THREE.Mesh)||!(child.material instanceof THREE.MeshStandardMaterial))continue;const value=draft?.colors[assemblyActors[id]?.sourceId??''];if(/^#[0-9a-f]{6}$/i.test(value??''))child.material.color.set(value!);}const small=buttons.get('paint')?.querySelector('small');if(small)small.textContent=draft?.name?t('hub.paint.resume',{name:draft.name}):t('hub.paint.caption');invalidate();}
window.addEventListener('storage',updatePaint);

async function refreshHomeStatus(){
 if(opened||document.hidden||access.edition!=='personal')return;
 try{const response=await fetch('/api/duck-debug/status');if(!response.ok)return;const data=await parseResponseJson(response);if(!record(data)||!numberArray(data.onlineIds))return;updateNumberingReadiness(data.numbering);const active=new Set(data.onlineIds);
  if(access.locked('debug'))return;
  for(const mesh of models.get('debug')?.children??[]){const id=servoIds.get(mesh.userData.partId);if(id===undefined||!(mesh instanceof THREE.Mesh)||!(mesh.material instanceof THREE.MeshStandardMaterial))continue;const connected=active.has(id);mesh.material.color.setHex(connected?0x2caf76:0x405166);mesh.material.emissive.setHex(connected?0x146e44:0);mesh.material.emissiveIntensity=connected?.25:0;}invalidate();
 }catch{}
}
const statusTimer=setInterval(refreshHomeStatus,2000);window.addEventListener('pagehide',()=>clearInterval(statusTimer),{once:true});

interface OriginalTint{color:THREE.Color;emissive:THREE.Color|null;roughness:number;metalness:number}
const originalTints=new WeakMap<THREE.Material,OriginalTint>();
function refreshAccess(){
 $('profile-slot').textContent=t(access.edition==='server'?'hub.edition.server':'hub.edition.personal');
 for(const id of ['debug','assemble'] as const){
  const locked=access.locked(id),b=buttons.get(id)!;b.classList.toggle('beta-locked',locked);b.dataset.betaLocked=String(locked);b.dataset.betaPermanent=String(id==='debug'&&access.edition==='server');
  b.querySelector('small')!.textContent=id==='debug'&&access.edition==='server'?t('beta.localOnly'):locked?t('beta.badge'):id==='debug'?t('hub.debug.caption'):readNumberingReadiness().ready?t('hub.assemble.caption'):t('hub.numbering',{count:readNumberingReadiness().verifiedIds.length});
  b.querySelector('.go')!.innerHTML=locked?'<svg width="12" height="14" viewBox="0 0 16 18" fill="none" aria-hidden="true"><rect x="3" y="8" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 8V5a3 3 0 0 1 6 0v3" stroke="currentColor" stroke-width="1.5"/></svg>':'↗';
  models.get(id)?.traverse(obj=>{if(!(obj instanceof THREE.Mesh))return;for(const m of Array.isArray(obj.material)?obj.material:[obj.material]){
   if(!(m instanceof THREE.MeshStandardMaterial||m instanceof THREE.MeshBasicMaterial))continue;
   if(locked){
    if(!originalTints.has(m))originalTints.set(m,{color:m.color.clone(),emissive:m instanceof THREE.MeshStandardMaterial?m.emissive.clone():null,roughness:m instanceof THREE.MeshStandardMaterial?m.roughness:0,metalness:m instanceof THREE.MeshStandardMaterial?m.metalness:0});
    m.color.set('#9ba9bb');if(m instanceof THREE.MeshStandardMaterial){m.emissive.set(0);m.roughness=.85;m.metalness=.02;}
   }else{const original=originalTints.get(m);if(!original)continue;m.color.copy(original.color);if(m instanceof THREE.MeshStandardMaterial&&original.emissive){m.emissive.copy(original.emissive);m.roughness=original.roughness;m.metalness=original.metalness;}originalTints.delete(m);}
  }});
 }positionModels();
}
window.addEventListener('storage',e=>{if(e.key===ACCESS_KEY){access.reload();refreshAccess();}});

updateReadiness(readNumberingReadiness());

function showRequestedHint(){const requested=new URLSearchParams(location.search).get('unlock');if(requested&&valid(requested)&&access.locked(requested)){carousel.jump(requested);experiment.show(requested);}}
onLocale(()=>{
 for(const entry of entries)buttons.get(entry.id)!.querySelector('strong')!.firstChild!.textContent=entry.name;
 if(opened){const name=entries.find(entry=>entry.id===opened)!.name;$('module-title').textContent=name;$<HTMLIFrameElement>('module-frame').title=t('hub.frame.named',{name});}
 updatePaint();refreshAccess();
});
