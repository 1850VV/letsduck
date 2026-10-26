import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../frontend/vendor/three.module.js';
import {ACTORS,STEPS,snapshot} from '../frontend/assemble/hardware-state.mjs';
import {createHardwareModelFactory} from '../frontend/assemble/hardware-models.mjs';

// These loader-shaped fixtures exercise the real factory and visibility policy.
// The browser check separately loads the photographed GLBs and their exact geometry.
function templates(){
 const assets=['uno-q','extension-board','hd1910-servo','servo-body','servo-horn','servo-rear-horn','servo-cable','screw-m2x6','screw-m3x16','screw-m23x8'];
 return Object.fromEntries(assets.map(id=>{
  const root=new THREE.Group();
  const names=id.includes('horn')?['eight-hole-disc','shaft-hub','retaining-screw']:id==='servo-cable'?['wire-1',...Array.from({length:2},(_,i)=>[`white-plug-${i}`,...Array.from({length:3},(_,j)=>`plug-contact-${i}-${j}`)]).flat()]:['body'];
  for(const name of names){const m=new THREE.Mesh(new THREE.BoxGeometry(.001,.001,.001),new THREE.MeshStandardMaterial());m.name=name;root.add(m);}
  return[id,root];
 }));
}
function visibleMeshes(root,name){const found=[];root.traverse(o=>{if(o.isMesh&&o.name===name){let visible=true;for(let p=o;p;p=p.parent)visible&&=p.visible;if(visible)found.push(o);}});return found;}

test('removing an ankle secondary horn retains its main disc and both modelled hubs',()=>{
 const f=createHardwareModelFactory(templates()),servo=f.servo('motor');
 const i=STEPS.findIndex(s=>s.id==='r-horn');
 f.syncDiscs(new Map([['motor',servo]]),snapshot(i,1));
 assert.equal(visibleMeshes(servo,'eight-hole-disc').length,1,'the main disc remains after secondary removal');
 assert.equal(visibleMeshes(servo,'shaft-hub').length,2,'neither modelled shaft hub follows the detached disc');
 assert.equal(visibleMeshes(f.horn('horn'),'shaft-hub').length,0,'the detachable object contains a disc, not the shaft hub');
});

test('ID13 and ID23 remove their secondary horns before their leg supports are installed',()=>{
 for(const [stepId,horn,screw,support]of [['r-pair','r_lowerHorn','r_lowerHornScrew','r_support'],['l-pair','l_lowerHorn','l_lowerHornScrew','l_support']]){
  const i=STEPS.findIndex(s=>s.id===stepId),start=snapshot(i,0),half=snapshot(i,.55),end=snapshot(i,1);
  assert.ok(ACTORS[horn],`${horn} exists as a detachable actor`);
  assert.equal(start[horn].visible,true);assert.notEqual(half[horn].status,'removed');
  assert.equal(end[horn].status,'removed');assert.equal(end[screw].status,'removed');
  assert.ok(Math.hypot(...start[horn].position.map((n,j)=>n-end[horn].position[j]))>10);
  assert.equal(end[support].visible,false,'support insertion follows secondary removal');
  assert.equal(snapshot(i+1,1)[horn].status,'removed');
 }
});

test('neck and optional-removal IDs keep both discs throughout the tutorial',()=>{
 const f=createHardwareModelFactory(templates());
 for(const id of ['h_motor30','h_motor31','h_motor32','t_motor10','t_motor20']){
  const servo=f.servo(id);
  for(let i=0;i<STEPS.length;i++){
   f.syncDiscs(new Map([[id,servo]]),snapshot(i,1));
   // ID10/20 have an independent retained main-disc actor; count it too.
   const h=id==='t_motor10'?'t_motor10Horn':id==='t_motor20'?'t_motor20Horn':null;
   const independent=h&&snapshot(i,1)[h]?.visible?1:0;
   assert.equal(visibleMeshes(servo,'eight-hole-disc').length+independent,2,`${id}, step ${i}`);
  }
 }
});
