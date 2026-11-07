import {dt,displayError} from './i18n.js';
import type {DebugState} from './types.js';
import {required,isRecord} from '../lib/browser.js';
import {assemblyAssetUrl} from '../shared/url.js';
import {parseResponseJson} from '../shared/json.js';
type Surface=THREE.Mesh<THREE.BufferGeometry,THREE.Material|THREE.Material[]>;
const isMesh=(object:THREE.Object3D):object is Surface=>object instanceof THREE.Mesh;
const materials=(object:{material:THREE.Material|THREE.Material[]}):THREE.Material[]=>Array.isArray(object.material)?object.material:[object.material];
const hasColor=(material:THREE.Material):material is THREE.Material&{color:THREE.Color}=>'color'in material&&material.color instanceof THREE.Color;
interface AssemblyPart {id:string;positionOffset:number;vertexCount:number;indexOffset:number;indexCount:number}
const assemblyPart=(value:unknown):value is AssemblyPart=>isRecord(value)&&typeof value.id==='string'&&['positionOffset','vertexCount','indexOffset','indexCount'].every(key=>typeof value[key]==='number');
function readParts(value:unknown):AssemblyPart[] {if(!isRecord(value)||!Array.isArray(value.parts)||!value.parts.every(assemblyPart))throw displayError('组装模型数据格式异常');return value.parts;}
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {IDS,ACTORS,online,alert} from './state.js';
import {completePoses,actorQuaternion,assemblyActors} from './poses.js';

const GREEN=0x2caf76,OFF=0x6b7d97,ALERT={lost:0xd6453d,hot:0xe07a1f,bad:0xd6453d,weak:0xd99a12} as const;
export function createScene({host,labelsHost,onSelect}:{host:HTMLElement;labelsHost:HTMLElement;onSelect(id:number):void}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,2500);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0xa4b5ce,2.6));
 const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(170,330,250);scene.add(key);
 const fill=new THREE.DirectionalLight(0xe1edff,1.8);fill.position.set(-220,100,-180);scene.add(fill);
 const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=85;controls.maxDistance=1500;controls.maxPolarAngle=Math.PI*.85;
 const robot=new THREE.Group(),loose=new THREE.Group();scene.add(robot,loose);
 const robotObjects=new Map<number,THREE.Object3D>();
 let ready=false,state:DebugState|undefined,pending=false,framed=false,template:THREE.Group,center:THREE.Vector3,labels:{el:HTMLElement;position:THREE.Vector3}[]=[],looseSignature='';
 const looseObjects=new Map<string,THREE.Object3D>();
 const modelIds=new Map(ACTORS.map((actor,i)=>[actor,required(IDS[i])]));
 let body:{pivot:THREE.Vector3;forward:THREE.Vector3;left:THREE.Vector3;floor:number;points:Float32Array}|null=null;
 const UP=new THREE.Vector3(0,1,0);
 // A level floor under the duck: the model rests its lowest point on it, and the rim turns green when the body is level.
 const floor=new THREE.Group(),rim=new THREE.Mesh(new THREE.RingGeometry(118,121,96),new THREE.MeshBasicMaterial({color:0x9fb0c8,side:THREE.DoubleSide}));
 floor.add(new THREE.Mesh(new THREE.CircleGeometry(120,96),new THREE.MeshBasicMaterial({color:0xdfe7f2,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide})),rim);floor.rotation.x=-Math.PI/2;scene.add(floor);
 const ownMaterials=(obj:THREE.Object3D)=>obj.traverse(mesh=>{if(isMesh(mesh)){mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();for(const m of materials(mesh))if(hasColor(m))m.userData.baseColor=m.color.clone();}});
 function invalidate(){if(pending||document.hidden)return;pending=true;requestAnimationFrame(()=>{pending=false;controls.update();renderer.render(scene,camera);layoutLabels();});}
 controls.addEventListener('change',invalidate);document.addEventListener('visibilitychange',invalidate);
 function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();invalidate();}
 new ResizeObserver(resize).observe(host);
 function addLabel(text:string,position:THREE.Vector3,kind:string,id?:number){const button=document.createElement(id!==undefined?'button':'span');button.className=kind;button.hidden=true;/* Shown once layoutLabels has placed it. */button.textContent=text;if(id!==undefined){if(button instanceof HTMLButtonElement)button.type='button';button.dataset.model=String(id);button.setAttribute('aria-label',dt("在3D中选择 ID{id}",{id:String(id)}));button.onclick=()=>onSelect(id);}labelsHost.append(button);labels.push({el:button,position});return button;}
 function layoutLabels(){camera.updateMatrixWorld();for(const l of labels){const p=l.position.clone().project(camera);l.el.style.left=(p.x*.5+.5)*host.clientWidth+'px';l.el.style.top=(-p.y*.5+.5)*host.clientHeight+'px';l.el.hidden=p.z>1||p.z< -1||Math.abs(p.x)>1.12||Math.abs(p.y)>1.12;}}
 function paint(object:THREE.Object3D,connected:boolean,chosen:boolean,ghost=false,warn:keyof typeof ALERT|null=null){
  const solid=connected||warn!==null;
  object.traverse(o=>{if(!isMesh(o)||o.userData.selectionRing)return;for(const m of materials(o)){
   if(hasColor(m))m.color.setHex(warn?ALERT[warn]:connected?GREEN:OFF);
   m.transparent=!solid;m.opacity=solid?1:ghost?.16:.28;m.depthWrite=solid;
   if(m instanceof THREE.MeshStandardMaterial){m.emissive.setHex(connected&&!warn?0x0f5e37:0);m.emissiveIntensity=connected&&!warn?.28:0;}
  }});
  const ring=object.getObjectByName('selection-ring');if(ring){ring.visible=chosen;if(isMesh(ring))for(const material of materials(ring))if(hasColor(material))material.color.setHex(0x6d8af8);}
 }
 function specimen(id:number){
  const root=new THREE.Group(),model=template.clone(true);ownMaterials(model);model.position.sub(center);root.add(model);root.userData.servoId=id;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(26,.7,5,48),new THREE.MeshBasicMaterial({color:0x6d8af8,depthTest:false}));ring.name='selection-ring';ring.userData.selectionRing=true;ring.rotation.x=-Math.PI/2;ring.position.y=-15;root.add(ring);return root;
 }
 function fit(){camera.position.set(340,230,440);controls.target.set(0,134,10);controls.update();invalidate();}
 /** Look level at the floor disc, from the duck's front or its left side, so a gap under either foot shows. */
 function look(side:'front'|'side'){
  if(!body)return;const box=new THREE.Box3().setFromObject(robot),c=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
  controls.target.copy(c);camera.position.copy(c).addScaledVector(side==='front'?body.forward:body.left,Math.max(size.x,size.y,size.z)*1.8).setY(c.y+25);controls.update();invalidate();
 }
 /** Tilt the whole duck with the IMU: gravity (x forward, y left, z up) maps onto the model's own axes. */
 function tilt(){
  if(!body)return;const s=required(state).status,g=s.gravity,live=g?.length===3&&s.imu_ok===true&&typeof s.feedback_age_ms==='number'&&s.feedback_age_ms<500;
  const q=new THREE.Quaternion();let level=false;
  if(live){const [x,y,z]=g as [number,number,number],up=body.forward.clone().multiplyScalar(-x).addScaledVector(body.left,-y).addScaledVector(UP,-z);if(up.lengthSq()>1e-6){q.setFromUnitVectors(up.normalize(),UP);level=up.y>Math.cos(THREE.MathUtils.degToRad(1));}}
  const e=new THREE.Matrix4().makeRotationFromQuaternion(q).elements,{pivot:c,points:v}=body;let low=Infinity;
  for(let i=0;i<v.length;i+=3){const h=e[1]!*(v[i]!-c.x)+e[5]!*(v[i+1]!-c.y)+e[9]!*(v[i+2]!-c.z);if(h<low)low=h;}
  robot.quaternion.copy(q);robot.position.copy(c).sub(c.clone().applyQuaternion(q));robot.position.y+=body.floor-c.y-low;robot.updateMatrixWorld(true);
  rim.material.color.setHex(level?GREEN:0x9fb0c8);
 }
 function update(next:DebugState){state=next;if(!ready)return;tilt();const active=new Set(online(required(state)).map(d=>d.id)),d=required(state).devices.find(d=>d.uid===required(state).selected),chosen=d?.id;
  if(!framed){framed=true;fit();}
  // Servo check grades colour the weak and worst servos; a lost or hot servo still shows first.
  const warn=(id:number)=>{const g=required(state).grades?.[id];return alert(required(state),id)??(g==='good'||!g?null:g);};
  for(const [id,obj] of robotObjects)paint(obj,active.has(id),id===chosen,true,warn(id));
  const extras=online(required(state)).filter(d=>!IDS.includes(d.id)),extraSignature=extras.map(d=>d.uid+':'+d.id).join(',');
  if(looseSignature!==extraSignature){
   for(const child of [...loose.children]){loose.remove(child);child.traverse(o=>{if(isMesh(o)){if(o.userData.selectionRing)o.geometry.dispose();materials(o).forEach(m=>m.dispose());}});}
   looseObjects.clear();for(const d of extras){const obj=specimen(d.id);loose.add(obj);looseObjects.set(d.uid,obj);}looseSignature=extraSignature;
  }
  extras.forEach((d,i)=>{const obj=required(looseObjects.get(d.uid));obj.position.set(-125-i*55,80,20);paint(obj,true,d.uid===required(state).selected);});
  labelsHost.replaceChildren();labels=[];
  // Mounted servos label beside their joint; extra (unassigned) servos label above themselves.
  const labelFor=(id:number,obj:THREE.Object3D,mounted:boolean)=>{
   const connected=active.has(id),chosenId=id===chosen;
   if(mounted&&(!chosenId&&!connected||active.size>5&&!chosenId))return;
   let p=obj.position.clone();
   if(mounted){const box=new THREE.Box3().setFromObject(obj);p=box.getCenter(new THREE.Vector3());p.x+=p.x<0?-32:34;const joint=id<30?id%10:-1;p.y+=joint===2?21:joint===3?-1:joint===4?-15:10;}
   else p.add(new THREE.Vector3(0,31,6));
   const el=addLabel(connected?dt('ID {id} · 在线',{id:String(id)}):'ID '+id,p,'model-label',id);el.classList.toggle('online',connected);el.classList.toggle('selected',chosenId);
  };
  for(const [id,obj] of robotObjects)labelFor(id,obj,true);
  for(const [uid,obj] of looseObjects){const d=required(required(state).devices.find(d=>d.uid===uid));labelFor(d.id,obj,false);}
  layoutLabels();invalidate();
 }
 function refreshCopy(){
  if(!state)return;
  const active=new Set(online(state).map(device=>device.id));
  for(const {el}of labels){
   if(el.dataset.model!==undefined){const id=Number(el.dataset.model);el.textContent=active.has(id)?dt('ID {id} · 在线',{id:String(id)}):'ID '+id;el.setAttribute('aria-label',dt('在3D中选择 ID{id}',{id:String(id)}));}
  }
 }
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down:[number,number]|undefined;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6||!ready)return;
  const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...robotObjects.values(),...(loose.visible?looseObjects.values():[])],true).filter(hit=>!hit.object.userData.selectionRing);
  if(hits.length){let obj:THREE.Object3D|null=required(hits[0]).object;while(obj&&obj.userData.servoId===undefined)obj=obj.parent;const id:unknown=obj?.userData.servoId;if(typeof id==='number')onSelect(id);}
 });
 const readyPromise=(async()=>{
  const [gltf,meta,binary,poses]=await Promise.all([new GLTFLoader().loadAsync(assemblyAssetUrl('hardware-v2/hd1910-servo.glb').href),fetch(assemblyAssetUrl('full-assembly.json')).then(parseResponseJson).then(readParts),fetch(assemblyAssetUrl('full-assembly.bin')).then(r=>r.arrayBuffer()),Promise.resolve(completePoses())]);
  template=gltf.scene;template.scale.setScalar(1000);template.updateMatrixWorld(true);center=new THREE.Box3().setFromObject(template).getCenter(new THREE.Vector3());
  for(const part of meta){const info=poses[part.id];if(!info?.pose?.visible)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,part.positionOffset,part.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,part.indexOffset,part.indexCount).slice(),1));g.computeVertexNormals();
   const id=modelIds.get(part.id),material=new THREE.MeshStandardMaterial({color:id===undefined?0xd8e2ef:OFF,roughness:.6,metalness:.06,transparent:true,opacity:id===undefined?.2:.28,depthWrite:false});
   const mesh=new THREE.Mesh(g,material);mesh.position.fromArray(info.pose.position);mesh.quaternion.copy(actorQuaternion(required(assemblyActors[part.id]),info.pose));robot.add(mesh);
   if(id!==undefined){mesh.userData.servoId=id;robotObjects.set(id,mesh);}
  }
  const middle=(...ids:number[])=>ids.reduce((sum,id)=>sum.add(new THREE.Box3().setFromObject(required(robotObjects.get(id))).getCenter(new THREE.Vector3())),new THREE.Vector3()).divideScalar(ids.length);
  // The head sits right above the hips, so the hip line (right 22 → left 12) sets the axes.
  const pivot=middle(12,22),left=middle(12).sub(middle(22)).setY(0).normalize(),forward=left.clone().cross(UP);
  robot.updateMatrixWorld(true);const points:number[]=[],p=new THREE.Vector3();
  robot.traverse(o=>{if(!isMesh(o))return;const a=o.geometry.getAttribute('position');for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(o.matrix);points.push(p.x,p.y,p.z);}});
  const low=points.reduce((m,y,i)=>i%3===1&&y<m?y:m,Infinity);floor.position.set(pivot.x,low-.5,pivot.z);
  body={pivot,forward,left,floor:low,points:new Float32Array(points)};
  ready=true;resize();if(state)update(state);return true;
 })();
 function inspect(){const greens=<K>(map:ReadonlyMap<K,THREE.Object3D>)=>[...map].filter(([,obj])=>{let green=false;obj.traverse(o=>{if(isMesh(o)&&!o.userData.selectionRing&&materials(o).some(m=>hasColor(m)&&m.color.getHex()===GREEN&&m.opacity===1))green=true;});return green;}).map(([id])=>id);return {ready,robotCount:robotObjects.size,greenRobotIds:greens(robotObjects),greenLooseIds:greens(looseObjects).map(uid=>required(required(state).devices.find(d=>d.uid===uid)).id),camera:camera.position.toArray()};}
 return {update,refreshCopy,fit,look,ready:readyPromise,inspect};
}
