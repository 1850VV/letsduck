import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../../frontend/vendor/three.module.js';
import {ACTORS,STEPS,snapshot} from '../../frontend/assemble/hardware-state.mjs';
import {MODEL_FIT_ISSUES,fitsForCue} from '../../frontend/assemble/model-fit.mjs';
import {buildFineCues} from '../../frontend/assemble/fine-cues.mjs';
import {actorQuaternion,cableStyle,cablePlugQuaternion} from '../../frontend/assemble/render-pose.mjs';
const source=readFileSync(new URL('../../frontend/assemble/prototype-v3.mjs',import.meta.url),'utf8');
const updateSource=source.slice(source.indexOf('function updateCable('),source.indexOf('\nconst guideArrow='));
const pathModule=await import('../../frontend/assemble/cable-path.mjs');
const index=JSON.parse(readFileSync(new URL('../../assets/assembly/full-assembly.json',import.meta.url))).parts;
const bytes=readFileSync(new URL('../../assets/assembly/full-assembly.bin',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
function solid(id,state){const p=index.find(p=>p.id===id),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,p.positionOffset,p.vertexCount*3),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,p.indexOffset,p.indexCount),1));const m=new THREE.Mesh(g,material);m.position.fromArray(state[id].position);m.quaternion.copy(actorQuaternion(ACTORS[id],state[id]));m.updateMatrixWorld(true);return m;}
const direction=new THREE.Vector3(1,.317,.153).normalize();
function depth(point,mesh){const ray=new THREE.Raycaster(point,direction),dist=ray.intersectObject(mesh,false).map(h=>h.distance).filter(d=>d>1e-5).sort((a,b)=>a-b),unique=dist.filter((d,i)=>!i||d-dist[i-1]>1e-4);if(unique.length%2!==1)return 0;ray.set(point,direction.clone().negate());return Math.min(unique[0],ray.intersectObject(mesh,false)[0]?.distance||0);}
function renderedLines(id,state){const style=cableStyle(ACTORS[id]),record={lines:Array.from({length:style.count},()=>new THREE.Mesh(new THREE.BufferGeometry())),plugs:[new THREE.Group(),new THREE.Group()],approved:style.type==='servo',type:ACTORS[id].cableType,signature:''};const update=new Function('THREE','cableRecords','currentState','ACTORS','actorQuaternion','socketAt','cablePlugQuaternion','buildCableCurve',updateSource+';return updateCable;')(THREE,new Map([[id,record]]),state,ACTORS,actorQuaternion,()=>null,cablePlugQuaternion,pathModule.buildCableCurve);update(id,state[id].points);return record.lines;}
const cases=[['t-complete','t_baseWire','t_backplate'],['final-battery','f_powerCable','f_batteryTray'],['final-battery','f_powerCable','t_backplate'],['robot-complete','t_rollWireR','t_support'],['robot-complete','r_legWireB','f_sideR'],['robot-complete','l_legWireB','f_sideL'],['robot-complete','r_legWireB','t_yawBearingR'],['robot-complete','l_legWireB','t_yawBearingL'],['head-platform-fix','h_wireMouth','h_platform'],['r-ankle-done','wire','foot'],['t-complete','t_baseWireL','t_yawL'],['t-complete','t_baseWireL','t_backplate'],['t-complete','t_rollWireL','t_yawL'],['t-complete','r_legWireB','r_support'],['head-platform-fix','h_wire33','h_platform'],['head-platform-fix','h_wire33','h_jaw'],['robot-complete','h_wire32','h_servoSupport'],['robot-complete','h_wire32','h_shell'],['robot-complete','h_wire33','h_shell'],['robot-complete','f_powerCable','f_sideL'],['robot-complete','f_bus0','f_sideR'],['robot-complete','f_bus1','f_sideL'],['robot-complete','f_bus2','f_sideL'],['robot-complete','l_wire','f_thighL'],['robot-complete','l_legWireB','f_thighL']];
for(const[stepId,cable,part]of cases)test(`${stepId}: rendered ${cable} avoids ${part}`,()=>{const state=snapshot(STEPS.findIndex(s=>s.id===stepId),1),mesh=solid(part,state),matrix=new THREE.Matrix4().compose(new THREE.Vector3(...state[cable].position),actorQuaternion(ACTORS[cable],state[cable]),new THREE.Vector3(1,1,1));let worst=0,where;for(const line of renderedLines(cable,state)){const attr=line.geometry.attributes.position,rings=attr.count/9;for(let k=2;k<rings-2;k++){const p=new THREE.Vector3();for(let n=0;n<8;n++)p.add(new THREE.Vector3().fromBufferAttribute(attr,k*9+n));p.multiplyScalar(1/8).applyMatrix4(matrix);const d=depth(p,mesh);if(d>worst){worst=d;where=p.toArray();}}line.geometry.dispose();}mesh.geometry.dispose();assert.ok(worst<=.3,`${cable} enters ${part} by ${worst.toFixed(3)} mm at ${JSON.stringify(where)}`);});

test('confirmed plug/3MF clashes remain explicitly pending instead of green connection cues',()=>{
 assert.equal(MODEL_FIT_ISSUES.length,20);
 for(const step of ['head-yaw-wire','l-wire-a','t-motor-l']){
  const cues=buildFineCues(STEPS.findIndex(s=>s.id===step)).filter(c=>fitsForCue(c).length);
  assert.ok(cues.length,step);assert.ok(cues.every(c=>c.fitPending),step);
 }
});
test('third main-bus plug centre stays outside the body at sampled insertion phases',()=>{
 const index=STEPS.findIndex(s=>s.id==='final-buses');
 for(const p of [.66,.69,.72,.75,.78,.81,.84,.87,.90]){
  const state=snapshot(index,p),point=new THREE.Vector3(...state.f_busPlug2.position);
  for(const part of ['f_sideR','f_sideL']){const mesh=solid(part,state);assert.ok(depth(point,mesh)<=.3,`third plug crosses ${part} at ${p}`);mesh.geometry.dispose();}
 }
});

test('the loose ID33 lead stays outside the neck support instead of being left inside it',()=>{
 const state=snapshot(STEPS.length-1,1),mesh=solid('h_pitchSupport',state),pose=state.h_wire33,q=new THREE.Quaternion(...pose.endpointQuaternions[1]),center=new THREE.Vector3(...pose.points.at(-1));
 for(const x of[-3.75,3.75])for(const y of[-2.8,2.8])for(const z of[-2.25,2.25])assert.ok(depth(new THREE.Vector3(x,y,z).applyQuaternion(q).add(center),mesh)<=.3);
 assert.ok(!MODEL_FIT_ISSUES.some(i=>i.cable==='h_wire33'&&i.end===1));mesh.geometry.dispose();
});
