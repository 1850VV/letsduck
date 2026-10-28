import {dt,displayError} from './i18n.js';
import type {DebugState,DebugView,BoardId} from './types.js';
import {required,isRecord} from '../lib/browser.js';
import {assemblyAssetUrl} from '../shared/url.js';
import {parseResponseJson} from '../shared/json.js';
type Vector=[number,number,number];
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
import {IDS,ACTORS,online} from './state.js';
import {completePoses,actorQuaternion,assemblyActors} from './poses.js';

const GREEN=0x2caf76,OFF=0x6b7d97;
export function createScene({host,labelsHost,onSelect,onBoardSelect}:{host:HTMLElement;labelsHost:HTMLElement;onSelect(id:number):void;onBoardSelect(id:BoardId):void}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,2500);
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0xa4b5ce,2.6));
 const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(170,330,250);scene.add(key);
 const fill=new THREE.DirectionalLight(0xe1edff,1.8);fill.position.set(-220,100,-180);scene.add(fill);
 const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=85;controls.maxDistance=1500;controls.maxPolarAngle=Math.PI*.85;
 const robot=new THREE.Group(),tray=new THREE.Group(),circuit=new THREE.Group(),loose=new THREE.Group();scene.add(robot,tray,circuit,loose);
 const robotObjects=new Map<number,THREE.Object3D>(),trayObjects=new Map<number,THREE.Object3D>(),circuitObjects=new Map<string,THREE.Object3D>();
 let ready=false,state:DebugState|undefined,pending=false,currentView:DebugView|''='',template:THREE.Group,center:THREE.Vector3,labels:{el:HTMLElement;position:THREE.Vector3}[]=[],circuitSignature:string|null=null,looseSignature='';
 const looseObjects=new Map<string,THREE.Object3D>(),boardObjects=new Map<BoardId,THREE.Group>();
 const modelIds=new Map(ACTORS.map((actor,i)=>[actor,required(IDS[i])]));
 const ownMaterials=(obj:THREE.Object3D)=>obj.traverse(mesh=>{if(isMesh(mesh)){mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();for(const m of materials(mesh))if(hasColor(m))m.userData.baseColor=m.color.clone();}});
 function invalidate(){if(pending||document.hidden)return;pending=true;requestAnimationFrame(()=>{pending=false;controls.update();renderer.render(scene,camera);layoutLabels();});}
 controls.addEventListener('change',invalidate);document.addEventListener('visibilitychange',invalidate);
 function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();invalidate();}
 new ResizeObserver(resize).observe(host);
 function addLabel(text:string,position:THREE.Vector3,kind:string,id?:number){const button=document.createElement(id!==undefined?'button':'span');button.className=kind;button.textContent=text;if(id!==undefined){if(button instanceof HTMLButtonElement)button.type='button';button.dataset.model=String(id);button.setAttribute('aria-label',dt("在3D中选择 ID{id}",{id:String(id)}));button.onclick=()=>onSelect(id);}labelsHost.append(button);labels.push({el:button,position});return button;}
 function layoutLabels(){camera.updateMatrixWorld();for(const l of labels){const p=l.position.clone().project(camera);l.el.style.left=(p.x*.5+.5)*host.clientWidth+'px';l.el.style.top=(-p.y*.5+.5)*host.clientHeight+'px';l.el.hidden=p.z>1||p.z< -1||Math.abs(p.x)>1.12||Math.abs(p.y)>1.12;}}
 function paint(object:THREE.Object3D,connected:boolean,chosen:boolean,ghost=false){
  object.traverse(o=>{if(!isMesh(o)||o.userData.selectionRing)return;for(const m of materials(o)){
   if(hasColor(m))m.color.setHex(connected?GREEN:OFF);
   m.transparent=!connected;m.opacity=connected?1:ghost?.16:.28;m.depthWrite=connected;
   if(m instanceof THREE.MeshStandardMaterial){m.emissive.setHex(connected?0x0f5e37:0);m.emissiveIntensity=connected?.28:0;}
  }});
  const ring=object.getObjectByName('selection-ring');if(ring){ring.visible=chosen;if(isMesh(ring))for(const material of materials(ring))if(hasColor(material))material.color.setHex(0x6d8af8);}
 }
 function specimen(id:number){
  const root=new THREE.Group(),model=template.clone(true);ownMaterials(model);model.position.sub(center);root.add(model);root.userData.servoId=id;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(26,.7,5,48),new THREE.MeshBasicMaterial({color:0x6d8af8,depthTest:false}));ring.name='selection-ring';ring.userData.selectionRing=true;ring.rotation.x=-Math.PI/2;ring.position.y=-15;root.add(ring);return root;
 }
 function cube(size:Vector,color:THREE.ColorRepresentation,pos:Vector,parent:THREE.Object3D){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.6,metalness:.1}));mesh.position.set(...pos);parent.add(mesh);return mesh;}
 function wire(points:Vector[],color=0x8aa79c,radius=.8){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return new THREE.Mesh(new THREE.TubeGeometry(curve,25,radius,5,false),new THREE.MeshStandardMaterial({color,roughness:.6}));}
 function boardModel(id:BoardId){
  const obj=new THREE.Group();obj.userData.boardId=id;
  const pcb=cube([65,3,53],OFF,[0,0,0],obj);pcb.userData.statusSurface=true;
  for(const x of [-26,26])for(const z of [-20,20])cube([3,5,3],0xc8cfda,[x,-3,z],obj);
  if(id==='arduino'){
   cube([20,3,20],0x28364b,[2,3,0],obj);cube([12,3,14],0x435066,[19,3,3],obj);
   cube([12,7,11],0xc5d0df,[-30,4,7],obj);cube([8,5,9],0x98a8bb,[-30,3,-12],obj);
   for(const z of [-22,22]){cube([48,5,4],0x263b55,[3,4,z],obj);for(let i=0;i<12;i++)cube([1.2,1,1.5],0xc1b176,[-20+i*4,7,z],obj);}
  }else{
   cube([14,3,12],0x2c3c52,[-5,3,0],obj);cube([10,8,13],0x587b70,[-27,5,-12],obj);
   for(const z of [-13,2,17])for(const x of [10,24]){cube([9,7,9],0xe0e6ee,[x,5,z],obj);cube([5,2,4],0x647a8a,[x,9,z],obj);}
   for(const z of [-22,22])cube([32,4,3],0x344b65,[-10,4,z],obj);
  }
  const ring=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(72,1,60)),new THREE.LineBasicMaterial({color:0x6d8af8,depthTest:false}));ring.name='selection-ring';ring.position.y=-3;obj.add(ring);
  scene.add(obj);boardObjects.set(id,obj);return obj;
 }
 boardModel('arduino');boardModel('expansion');
 function updateBoards(){
  const positions=required(state).view==='robot'?{arduino:[-142,18,-62],expansion:[-142,18,50]}:required(state).view==='tray'?{arduino:[-211,13,-50],expansion:[-211,13,53]}:{arduino:[-190,12,-40],expansion:[-112,12,45]};
  for(const [id,obj] of boardObjects){const connected=required(state).boards[id].connected;obj.position.fromArray(positions[id]);obj.rotation.y=-.1;
   obj.traverse(o=>{if(!isMesh(o))return;for(const m of materials(o)){if(o.userData.statusSurface&&hasColor(m))m.color.setHex(connected?GREEN:OFF);m.transparent=!connected;m.opacity=connected?1:.34;}});
   required(obj.getObjectByName('selection-ring')).visible=required(state).selectedBoard===id;
  }
 }
 function rebuildCircuit(){
  for(const child of [...circuit.children]){circuit.remove(child);child.traverse(o=>{if(isMesh(o)){if(child.userData.generated||o.userData.selectionRing)o.geometry.dispose();materials(o).forEach(m=>m.dispose());}});}
  circuitObjects.clear();const electronics=new THREE.Group();electronics.userData.generated=true;circuit.add(electronics);
  cube([64,4,44],0xa2afc2,[-295,2,-40],electronics);const screen=cube([64,43,3],0x7f91ab,[-295,25,-62],electronics);screen.rotation.x=-.18;cube([57,34,1],0xd4e6f5,[-295,26,-59],electronics);
  cube([38,23,25],0x4b5a72,[-210,12,70],electronics);cube([30,2,15],0x7186a0,[-210,25,70],electronics);
  electronics.add(wire([[-262,7,-36],[-247,12,-20],[-233,15,-32],[-221,16,-33]],required(state).boards.arduino.connected?0x8ba0bd:OFF,1.2));
  electronics.add(wire([[-160,18,-30],[-144,30,-10],[-142,26,10],[-135,19,29]],required(state).boards.expansion.connected?0x71ae91:OFF,1.1));
  electronics.add(wire([[-194,25,70],[-178,37,66],[-151,34,35],[-140,20,33]],0xa2a787,1.1));
  const connected=online(required(state));let previous:Vector=[-79,23,45];
  connected.forEach((d,i)=>{
   const obj=specimen(d.id);obj.position.set(-10+(i%5)*58,22,connected.length>5?(Math.floor(i/5)-1)*62:0);obj.rotation.y=-.15;circuit.add(obj);circuitObjects.set(d.uid,obj);
   const here:Vector=[obj.position.x-18,25,obj.position.z+6];electronics.add(wire([previous,[previous[0]+10,35,previous[2]+14],[here[0]-8,35,here[2]+14],here],0x71ae91,1.05));previous=[obj.position.x+18,25,obj.position.z+6];
  });
 }
 function fit(view:DebugView|undefined=state?.view){
  if(view==='robot'){camera.position.set(340,230,440);controls.target.set(0,134,10);}
  else if(view==='tray'){camera.position.set(120,340,480);controls.target.set(-40,5,0);}
  else{camera.position.set(185,400,475);controls.target.set(-70,10,4);}
  controls.update();invalidate();
 }
 function update(next:DebugState){state=next;if(!ready)return;const active=new Set(online(required(state)).map(d=>d.id)),d=required(state).devices.find(d=>d.uid===required(state).selected),chosen=required(state).selectedBoard?null:d?.id;
  if(currentView!==required(state).view){currentView=required(state).view;fit(required(state).view);}
  robot.visible=required(state).view==='robot';tray.visible=required(state).view==='tray';circuit.visible=required(state).view==='circuit';
  updateBoards();
  for(const [id,obj] of robotObjects)paint(obj,active.has(id),id===chosen,true);
  for(const [id,obj] of trayObjects)paint(obj,active.has(id),id===chosen);
  const signature=online(required(state)).map(d=>d.uid+':'+d.id).join(',')+':'+Number(required(state).boards.arduino.connected)+Number(required(state).boards.expansion.connected);
  if(required(state).view==='circuit'&&circuitSignature!==signature){rebuildCircuit();circuitSignature=signature;}
  for(const [uid,obj] of circuitObjects)paint(obj,true,uid===required(state).selected);
  const extras=online(required(state)).filter(d=>!IDS.includes(d.id)),extraSignature=extras.map(d=>d.uid+':'+d.id).join(',');
  if(looseSignature!==extraSignature){
   for(const child of [...loose.children]){loose.remove(child);child.traverse(o=>{if(isMesh(o)){if(o.userData.selectionRing)o.geometry.dispose();materials(o).forEach(m=>m.dispose());}});}
   looseObjects.clear();for(const d of extras){const obj=specimen(d.id);loose.add(obj);looseObjects.set(d.uid,obj);}looseSignature=extraSignature;
  }
  loose.visible=required(state).view!=='circuit';
  extras.forEach((d,i)=>{const obj=required(looseObjects.get(d.uid));obj.position.set(required(state).view==='robot'?-125-i*55:-164-i*55,required(state).view==='robot'?80:13,20);paint(obj,true,d.uid===required(state).selected);});
  labelsHost.replaceChildren();labels=[];
  const labelFor=(id:number,obj:THREE.Object3D,view:DebugView)=>{
   const connected=active.has(id),chosenId=id===chosen;
   if(view==='robot'&&required(state).selectedBoard)return;
   if(view==='robot'&&!chosenId&&!connected)return;
   if(view==='robot'&&active.size>5&&!chosenId)return;
   let p=obj.position.clone();
   if(view==='robot'){const box=new THREE.Box3().setFromObject(obj);p=box.getCenter(new THREE.Vector3());p.x+=p.x<0?-32:34;const joint=id<30?id%10:-1;p.y+=joint===2?21:joint===3?-1:joint===4?-15:10;}
   else p.add(new THREE.Vector3(0,31,6));
   const el=addLabel(connected?dt('ID {id} · 在线',{id:String(id)}):'ID '+id,p,'model-label',id);el.classList.toggle('online',connected);el.classList.toggle('selected',chosenId);
  };
  if(required(state).view==='robot')for(const [id,obj] of robotObjects)labelFor(id,obj,'robot');
  if(required(state).view==='tray')for(const [id,obj] of trayObjects)labelFor(id,obj,'tray');
  if(required(state).view!=='circuit')for(const [uid,obj] of looseObjects){const d=required(required(state).devices.find(d=>d.uid===uid));labelFor(d.id,obj,'tray');}
  if(required(state).view==='circuit'){
   addLabel(required(state).transport==='lan'?dt("Mac · 网络"):'Mac · USB',new THREE.Vector3(-295,65,-40),'circuit-label').dataset.debugCopy='transport';addLabel(dt("舵机独立电源"),new THREE.Vector3(-210,10,103),'circuit-label').dataset.debugCopy='power';
   for(const [uid,obj] of circuitObjects){const item=required(required(state).devices.find(d=>d.uid===uid));labelFor(item.id,obj,'circuit');}
  }
  for(const [id,obj] of boardObjects){if(required(state).view==='robot'&&required(state).selectedBoard!==id)continue;const name=id==='arduino'?'Arduino UNO Q':dt("舵机扩展板"),el=addLabel(name,obj.position.clone().add(new THREE.Vector3(0,36,0)),'model-label');
   el.classList.toggle('online',required(state).boards[id].connected);el.classList.toggle('selected',required(state).selectedBoard===id);el.dataset.boardModel=id;el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',dt("在3D中选择 {name}",{name}));el.onclick=()=>onBoardSelect(id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onBoardSelect(id);}};
  }
  invalidate();
 }
 function refreshCopy(){
  if(!state)return;
  const active=new Set(online(state).map(device=>device.id));
  for(const {el}of labels){
   if(el.dataset.model!==undefined){const id=Number(el.dataset.model);el.textContent=active.has(id)?dt('ID {id} · 在线',{id:String(id)}):'ID '+id;el.setAttribute('aria-label',dt('在3D中选择 ID{id}',{id:String(id)}));}
   else if(el.dataset.boardModel){const name=el.dataset.boardModel==='arduino'?'Arduino UNO Q':dt('舵机扩展板');el.textContent=name;el.setAttribute('aria-label',dt('在3D中选择 {name}',{name}));}
   else if(el.dataset.debugCopy==='transport')el.textContent=state.transport==='lan'?dt('Mac · 网络'):'Mac · USB';
   else if(el.dataset.debugCopy==='power')el.textContent=dt('舵机独立电源');
  }
 }
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down:[number,number]|undefined;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6||!ready)return;
  const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
  const targets=required(state).view==='robot'?robotObjects:required(state).view==='tray'?trayObjects:circuitObjects;
  const hits=raycaster.intersectObjects([...targets.values(),...boardObjects.values(),...(loose.visible?looseObjects.values():[])],true).filter(hit=>!hit.object.userData.selectionRing);
  if(hits.length){let obj:THREE.Object3D|null=required(hits[0]).object;while(obj&&obj.userData.servoId===undefined&&obj.userData.boardId===undefined)obj=obj.parent;if(obj){const board:unknown=obj.userData.boardId,id:unknown=obj.userData.servoId;if(board==='arduino'||board==='expansion')onBoardSelect(board);else if(typeof id==='number')onSelect(id);}}
 });
 const readyPromise=(async()=>{
  const [gltf,meta,binary,poses]=await Promise.all([new GLTFLoader().loadAsync(assemblyAssetUrl('hardware-v2/hd1910-servo.glb').href),fetch(assemblyAssetUrl('full-assembly.json')).then(parseResponseJson).then(readParts),fetch(assemblyAssetUrl('full-assembly.bin')).then(r=>r.arrayBuffer()),Promise.resolve(completePoses())]);
  template=gltf.scene;template.scale.setScalar(1000);template.updateMatrixWorld(true);center=new THREE.Box3().setFromObject(template).getCenter(new THREE.Vector3());
  IDS.forEach((id,i)=>{const obj=specimen(id);obj.position.set((i%5-2)*57,13,(Math.floor(i/5)-1)*63);obj.rotation.y=-.18;tray.add(obj);trayObjects.set(id,obj);});
  for(const part of meta){const info=poses[part.id];if(!info?.pose?.visible)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,part.positionOffset,part.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,part.indexOffset,part.indexCount).slice(),1));g.computeVertexNormals();
   const id=modelIds.get(part.id),material=new THREE.MeshStandardMaterial({color:id===undefined?0xd8e2ef:OFF,roughness:.6,metalness:.06,transparent:true,opacity:id===undefined?.2:.28,depthWrite:false});
   const mesh=new THREE.Mesh(g,material);mesh.position.fromArray(info.pose.position);mesh.quaternion.copy(actorQuaternion(required(assemblyActors[part.id]),info.pose));robot.add(mesh);
   if(id!==undefined){mesh.userData.servoId=id;robotObjects.set(id,mesh);}
  }
  ready=true;resize();if(state)update(state);return true;
 })();
 function inspect(){const greens=<K>(map:ReadonlyMap<K,THREE.Object3D>)=>[...map].filter(([,obj])=>{let green=false;obj.traverse(o=>{if(isMesh(o)&&!o.userData.selectionRing&&materials(o).some(m=>hasColor(m)&&m.color.getHex()===GREEN&&m.opacity===1))green=true;});return green;}).map(([id])=>id);return {ready,view:currentView,robotCount:robotObjects.size,trayCount:trayObjects.size,greenRobotIds:greens(robotObjects),greenTrayIds:greens(trayObjects),greenBoardIds:greens(boardObjects),boardCount:boardObjects.size,greenLooseIds:greens(looseObjects).map(uid=>required(required(state).devices.find(d=>d.uid===uid)).id),circuitCount:circuitObjects.size,camera:camera.position.toArray()};}
 return {update,refreshCopy,fit,ready:readyPromise,inspect};
}
