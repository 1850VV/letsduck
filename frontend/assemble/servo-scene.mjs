import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {actorQuaternion} from './render-pose.mjs';

/** Reuse the loaded geometry and hardware; create this view only when opened. */
export function createServoScene({host,labelsHost,hardware,entities,actors,poses,map,onSelect}){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,2000);
 scene.add(new THREE.HemisphereLight(0xffffff,0x8d9bb4,2.7));
 const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(150,240,180);scene.add(key);
 const fill=new THREE.DirectionalLight(0xd2e0ff,1.9);fill.position.set(-130,90,-100);scene.add(fill);
 const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=100;controls.maxDistance=900;controls.maxPolarAngle=Math.PI*.85;
 const tray=new THREE.Group(),robot=new THREE.Group();scene.add(tray,robot);
 const specimens=new Map(),motors=new Map(),labels=new Map();let shown=false,view='',selected=10,done=new Set(),pending=false,draws=0;
 function ownMaterials(object,opacity){object.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();for(const m of [].concat(o.material)){m.transparent=opacity<1;m.opacity=opacity;m.depthWrite=opacity===1;}});}
 map.bindings.forEach((binding,i)=>{
  const group=new THREE.Group(),model=hardware.servo('p_motor');ownMaterials(model,1);
  const center=new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());model.position.sub(center);group.add(model);
  group.position.set((i%5-2)*57,13,(Math.floor(i/5)-1)*61);group.rotation.y=-.2;group.userData.servoId=binding.id;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(25,.5,5,48),new THREE.MeshBasicMaterial({color:0x4d6bfe}));ring.name='selection-ring';ring.rotation.x=-Math.PI/2;ring.position.y=-12;group.add(ring);
  tray.add(group);specimens.set(binding.id,group);
  const label=document.createElement('button');label.type='button';label.className='sv-model-label';label.setAttribute('aria-label',`定位 ID${binding.id}`);label.onclick=()=>onSelect(binding.id);labelsHost.append(label);labels.set(binding.id,label);
 });
 const ids=new Map(map.bindings.map(b=>[b.actorId,b.id]));
 for(const [id,entity] of entities){
  const pose=poses[id];if(!pose?.visible||actors[id]?.kind==='cable')continue;
  const object=entity.clone(true);object.position.fromArray(pose.position);object.quaternion.copy(actorQuaternion(actors[id],pose));
  ownMaterials(object,ids.has(id)?.4:.22);robot.add(object);
  if(ids.has(id)){object.userData.servoId=ids.get(id);motors.set(ids.get(id),object);}
 }
 function invalidate(){if(!shown||document.hidden||pending)return;pending=true;requestAnimationFrame(()=>{pending=false;if(!shown||document.hidden)return;controls.update();renderer.render(scene,camera);draws++;layoutLabels();});}
 function layoutLabels(){
  camera.updateMatrixWorld();
  for(const [id,label] of labels){
   const object=view==='tray'?specimens.get(id):motors.get(id);
   label.hidden=!object||(view==='robot'&&id!==selected&&![14,24,30,34].includes(id));if(label.hidden)continue;
   const p=object.position.clone().add(new THREE.Vector3(view==='tray'?0:id<20?-29:29,view==='tray'?25:12,17)).project(camera);
   label.style.left=(p.x*.5+.5)*host.clientWidth+'px';label.style.top=(-p.y*.5+.5)*host.clientHeight+'px';
   label.hidden=p.z>1||p.z< -1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1;
  }
 }
 function resize(){if(!shown)return;const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();invalidate();}
 function update(next){
  selected=next.selected;done=next.done;
  if(view!==next.view){view=next.view;camera.position.set(...(view==='tray'?[145,265,335]:[365,235,440]));controls.target.set(...(view==='tray'?[0,0,0]:[0,135,15]));controls.update();}
  tray.visible=view==='tray';robot.visible=view==='robot';
  for(const [id,group] of specimens){const ring=group.getObjectByName('selection-ring');ring.visible=id===selected||done.has(id);ring.material.color.setHex(id===selected?0x4d6bfe:0x53a77b);}
  for(const [id,object] of motors)object.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material)){m.opacity=id===selected?1:.3;m.depthWrite=id===selected;if(m.emissive){m.emissive.setHex(id===selected?0x1b2c60:done.has(id)?0x0b291b:0);m.emissiveIntensity=.35;}}});
  for(const [id,label] of labels){label.textContent=(done.has(id)?'✓ ':'ID ')+id;label.classList.toggle('selected',id===selected);label.classList.toggle('done',done.has(id));}
  invalidate();
 }
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
 renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
 renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects([...(view==='tray'?specimens:motors).values()],true)[0];if(hit){let o=hit.object;while(o&&!o.userData.servoId)o=o.parent;if(o)onSelect(o.userData.servoId);}});
 controls.addEventListener('change',invalidate);new ResizeObserver(resize).observe(host);document.addEventListener('visibilitychange',invalidate);
 return {update,setVisible(value){shown=value;if(value){resize();invalidate();}},get stats(){return {tray:specimens.size,robot:motors.size,draws,visible:shown};}};
}
