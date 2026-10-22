import * as THREE from 'three';
import {toCreasedNormals} from './assets/vendor/BufferGeometryUtils.js';
import {RoomEnvironment} from './assets/vendor/RoomEnvironment.js';
import {createFocusWorkspace} from './focus-workspace.mjs';
const $=s=>document.querySelector(s);
const [model,binary,catalog]=await Promise.all([
  fetch('./assets/model.json').then(r=>r.json()),fetch('./assets/geometry.bin').then(r=>r.arrayBuffer()),fetch('./assets/catalog.json').then(r=>r.json())]);
const canvas=$('#scene'),viewport=$('#viewport'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.setClearColor(0,0);
const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
const parts=model.parts,meshes=new Map(),hardware=new THREE.Group(),locks=new Set(),history=[];
let selected='P4-01',pairLink=false,focus,toastTimer;
let colors=Object.fromEntries(parts.map(p=>[p.id,p.color]));
let assignments=Object.fromEntries(parts.map(p=>[p.id,catalog.products.find(x=>x.series===p.material&&x.hex===p.color)?.id||null]));
function geometry(p){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,p.geometry.positionOffset,p.geometry.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,p.geometry.indexOffset,p.geometry.indexCount).slice(),1));const smooth=toCreasedNormals(g,Math.PI/5);g.dispose();smooth.computeBoundingSphere();return smooth;}
for(const p of parts){const g=geometry(p),m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:p.color,roughness:p.material.startsWith('TPU')?.82:.47,metalness:0,envMapIntensity:.65}));m.userData.assembly=g;meshes.set(p.id,m);}
for(const p of model.hardware)hardware.add(new THREE.Mesh(geometry(p),new THREE.MeshStandardMaterial({color:p.color,roughness:.5,metalness:.12})));
function refresh(){for(const p of parts)meshes.get(p.id).material.color.set(colors[p.id]);focus?.refresh();}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2200);}
function escapeHTML(text){const e=document.createElement('span');e.textContent=text;return e.innerHTML.replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;if(w<=0||h<=0)return;renderer.setSize(w,h,false);focus?.resize();}
focus=createFocusWorkspace({canvas,viewport,meshes,hardware,environment,controls:{enabled:false},escapeHTML,toast,resize,
 getState:()=>({parts,catalog,source:model.source_sha256,selected,colors,assignments,pairLink,historyLength:history.length}),
 select:id=>{selected=id;refresh();},isLocked:id=>locks.has(id),setPair:value=>{pairLink=value;refresh();},
 toggleLock:()=>{locks.has(selected)?locks.delete(selected):locks.add(selected);refresh();},
 apply:(ids,color,productId)=>{history.push({colors:{...colors},assignments:{...assignments}});for(const id of ids)if(!locks.has(id)){colors[id]=color;assignments[id]=productId;}refresh();},
 undo:()=>{const before=history.pop();if(before){colors=before.colors;assignments=before.assignments;refresh();}},
 save:()=>toast('Mock：保存和导出沿用正式工作台，本页只试交互。'),prepare:()=>{},finish:()=>{}
});
focus.enter();
$('#focus-back').disabled=true;$('#focus-back').title='Mock：未接入基础涂装跳转';
$('#focus-save').disabled=true;$('#focus-save').title='Mock：本页不会保存正式方案';
$('.focus-top>strong').innerHTML='专注涂装 <span>Mock v1 · '+(document.body.dataset.variant==='top'?'A 顶部快捷条':'B 模型旁快捷条')+'</span>';
new ResizeObserver(resize).observe(viewport);resize();
function frame(){requestAnimationFrame(frame);renderer.setViewport(0,0,viewport.clientWidth,viewport.clientHeight);renderer.clear();focus.render(renderer);}frame();
window.focusPrototype={ready:true,variant:document.body.dataset.variant,focus,source:model.source_sha256,colors:()=>({...colors}),partCount:parts.length};
