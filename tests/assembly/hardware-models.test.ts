import {parseGltf} from './fixtures/typed-json.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../../frontend/vendor/three.module.js';
import * as api from '../../frontend/assemble/hardware-models.js';
const close=(a:number,b:number,e=1e-5)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function parseFixture(file:string){
 const data=fs.readFileSync(new URL(`../../assets/assembly/hardware-v2/${file}.glb`,import.meta.url));
 const jsonLength=data.readUInt32LE(12),j=parseGltf(JSON.parse(data.subarray(20,20+jsonLength).toString('utf8'))),binary=data.subarray(28+jsonLength);
 const types:Record<number,typeof Uint8Array|typeof Uint16Array|typeof Uint32Array|typeof Float32Array>={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},sizes:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
 function attribute(index:number){const a=j.accessors[index]!,bv=j.bufferViews[a.bufferView]!,Ctor=types[a.componentType]!,start=(bv.byteOffset||0)+(a.byteOffset||0),count=a.count*sizes[a.type]!;return new THREE.BufferAttribute(new Ctor(binary.buffer.slice(binary.byteOffset+start,binary.byteOffset+start+count*Ctor.BYTES_PER_ELEMENT)),sizes[a.type]!,a.normalized||false);}
 const textures=(j.textures||[]).map(()=>new THREE.Texture());
 const materials=(j.materials||[]).map(m=>{const p=m.pbrMetallicRoughness||{},f=p.baseColorFactor||[1,1,1,1];return new THREE.MeshStandardMaterial({name:m.name,color:new THREE.Color().fromArray(f),opacity:f[3]!,metalness:p.metallicFactor??1,roughness:p.roughnessFactor??1,map:p.baseColorTexture?textures[p.baseColorTexture.index]!:null});});
 const attributes:Record<string,string>={POSITION:'position',NORMAL:'normal',TEXCOORD_0:'uv',COLOR_0:'color'};
 const nodes=j.nodes.map(n=>{const group=new THREE.Group();group.name=n.name||'';if(n.mesh!==undefined){for(const primitive of j.meshes[n.mesh]!.primitives){const geometry=new THREE.BufferGeometry();for(const [key,index] of Object.entries(primitive.attributes))geometry.setAttribute(attributes[key]||key.toLowerCase(),attribute(index));if(primitive.indices!==undefined)geometry.setIndex(attribute(primitive.indices));group.add(new THREE.Mesh(geometry,materials[primitive.material!]));}}if(n.matrix)group.applyMatrix4(new THREE.Matrix4().fromArray(n.matrix));else {if(n.translation)group.position.fromArray(n.translation);if(n.rotation)group.quaternion.fromArray(n.rotation);if(n.scale)group.scale.fromArray(n.scale);}return group;});
 j.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>nodes[i]!.add(nodes[c]!)));const scene=new THREE.Group();(j.scenes[j.scene||0]!.nodes||[]).forEach(i=>scene.add(nodes[i]!));return scene;
}
let factory:ReturnType<typeof api.createHardwareModelFactory>|undefined,templates:Record<string,THREE.Group>={};
function setup(){assert.equal(typeof api?.createHardwareModelFactory,'function','approved hardware factory is not implemented');if(!factory){templates=Object.fromEntries(['uno-q','extension-board','hd1910-servo','servo-body','servo-horn','servo-rear-horn','servo-cable','screw-m2x6','screw-m3x16','screw-m23x8'].map(id=>[id,parseFixture(id)]));factory=api.createHardwareModelFactory(templates);}return factory;}
function meshes(root:THREE.Object3D|null){const out:THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>[]=[];root!.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial)out.push(o);});return out;}
function box(root:THREE.Object3D|null){root!.updateMatrixWorld(true);return new THREE.Box3().setFromObject(root!);}
function disc(root:THREE.Object3D|null,side:string){return root!.children.find(o=>o.userData.hardwareDiscSide===side);}
// Catches missing implementation and an accidental wrong factory export.
test('approved hardware factories are exported',()=>{setup();assert.equal(typeof api.loadHardwareModels,'function');});
// Catches a mm-to-m conversion applied twice, and wrong full-length/under-head seating.
test('screw adapters preserve the three approved shaft lengths and canonical seats',()=>{
 const f=setup();for(const [fastener,minY,maxY] of [['M2x6',-5.375,.625],['M3x16',-16.4,1.43824712038],['M2.3x8',-8,1.48026124388]] satisfies [string,number,number][]){const root=f.screw({fastener}),b=box(root);close(b.min.y,minY!);close(b.max.y,maxY!);assert.ok(meshes(root).every(o=>o.userData.hardwareAsset));}
});
// Catches silently presenting an unknown screw as one of the approved model types.
test('unknown and M2.3x4 fasteners stay on the teaching fallback',()=>{const f=setup();for(const fastener of [null,'','M2.3x4','M2x8','unknown'])assert.equal(f.screw({fastener}),null);});
// Catches an old bounding-box resize that shifts the real axis or a mirrored adapter.
test('all fifteen mechanical and preparation servo axes map to their literal source positions',()=>{
 const f=setup(),expected={p_motor:[.5,-7.5,0],motor:[.5,-7.5,0],l_motor:[-.5,-7.5,0],r_upperMotor:[0,0,7.5],l_upperMotor:[0,0,7.5],r_lowerMotor:[0,-7.5,0],l_lowerMotor:[0,-7.5,0],t_motor10:[0,0,7.5],t_motor20:[0,0,7.5],t_motor11:[0,7.5,0],t_motor21:[0,7.5,0],h_motor32:[7.5,0,0],h_motor33:[7.5,0,0],h_mouthMotor:[-.5,0,-7.5],h_motor30:[0,-7.5,0],h_motor31:[0,7.5,0]};
 for(const [id,want] of Object.entries(expected)){const root=f.servo(id)!,body=root.children.find(o=>o.userData.hardwareRole==='servo-body')!;root!.updateMatrixWorld(true);const got=body.localToWorld(new THREE.Vector3(-.0075,0,0)).toArray();got.forEach((n,i)=>close(n,want[i]!));}
 assert.equal(f.servo('unknown'),null);
});
// Catches duplicate built-in discs/retainers during independent horn and screw animation.
test('independent horn and screw states suppress the matching built-in side',()=>{
 const f=setup(),root=f.servo('r_upperMotor')!,front=disc(root,'front')!,rear=disc(root,'rear')!;const entities=new Map([['r_upperMotor',root]]);
 f.syncDiscs(entities,{r_upperHorn:{visible:false,status:'waiting'},r_upperHornScrew:{visible:false,status:'waiting'}});assert.equal(front.visible,true);assert.equal(rear.visible,true);
 f.syncDiscs(entities,{r_upperHorn:{visible:true,status:'moving'},r_upperHornScrew:{visible:true,status:'moving'}});assert.equal(front.visible,false);assert.equal(rear.visible,true);
 f.syncDiscs(entities,{r_upperHorn:{visible:false,status:'removed'},r_upperHornScrew:{visible:false,status:'removed'}});assert.equal(front.visible,false);
 f.syncDiscs(entities,{r_upperHorn:{visible:false,status:'waiting'},r_upperHornScrew:{visible:true,status:'moving'}});assert.equal(front.visible,true);assert.equal(front.getObjectByName('retaining-screw')!.visible,false);
 const yaw=f.servo('t_motor10')!;f.syncDiscs(new Map([['t_motor10',yaw]]),{t_motor10Horn:{visible:true,status:'installed'}});assert.equal(disc(yaw,'rear')!.visible,false);assert.equal(disc(yaw,'front')!.visible,true);
});
// The confirmed physical batch has a retained main disc even where the old source omitted it.
test('photographed-batch main discs remain on formerly single-disc mechanical sources',()=>{const f=setup();for(const id of ['motor','l_motor','h_mouthMotor']){const root=f.servo(id),rear=disc(root,'rear')!;assert.ok(rear.getObjectByName('eight-hole-disc'));assert.equal(rear.userData.hornRole,'main');let hubs=0;root!.traverse(o=>{if(o.name==='shaft-hub')hubs++;});assert.equal(hubs,2);}assert.ok(disc(f.servo('p_motor'),'rear')!.getObjectByName('eight-hole-disc'));});
// Catches double rotation when state already owns native +Z orientation or a retainer duplication.
test('independent horns are native +Z discs without retaining heads or shaft hubs',()=>{const f=setup(),horn=f.horn('h_coreHorn');assert.ok(horn);assert.equal(horn.getObjectByName('retaining-screw'),undefined);assert.equal(horn.getObjectByName('shaft-hub'),undefined);const b=box(horn);close(b.min.z,0);close(b.max.z,2.05);close(b.max.x,8);assert.equal(f.horn('unknown'),null);});
// Catches a shifted extraction centre or leaving new +Y windows on the old +Y direction.
test('plug extraction recentres the endpoint and maps its contact side to canonical -Z',()=>{const f=setup(),plug=f.plug(),b=box(plug);close(b.min.x,-3.75);close(b.max.x,3.75);close(b.min.y,-2.8);close(b.max.y,2.8);close(b.min.z,-2.25);close(b.max.z,2.25);assert.equal(plug.userData.matingOffsetMm,2.25);assert.equal(f.wireMaterial().userData.approvedHardware,true);});
// Catches loss of native board PBR/texture, accidental actor-size fit, or per-instance geometry copies.
test('board adapters retain native dimensions and share immutable geometry with per-actor material ownership',()=>{
 const f=setup(),a=f.board({boardType:'uno-q',size:[1,1,1]})!,b=f.board({boardType:'uno-q'}),ma=meshes(a),mb=meshes(b);assert.ok(box(a).getSize(new THREE.Vector3()).x>50);assert.equal(ma.length,mb.length);for(let i=0;i<ma.length;i++){assert.equal(ma[i]!.geometry,mb[i]!.geometry);assert.equal(ma[i]!.material,mb[i]!.material);assert.equal(ma[i]!.material.opacity,1);const actorA=ma[i]!.material.clone(),actorB=mb[i]!.material.clone();actorA.opacity=.2;assert.equal(actorB.opacity,1);assert.equal(actorA.map,actorB.map);assert.ok(!ma[i]!.geometry.getAttribute('edgeMask'));}
 assert.equal(a.userData.hardwareRequiresMaterialClone,true);assert.ok(ma.some(o=>o.material.map));assert.ok(f.board({boardType:'luwu-extension'}));assert.equal(f.board({boardType:'other'}),null);
});
// Catches merging triangles away, UV loss, edge attribute expansion or mutable resource diagnostics.
test('resource stats expose one-time compatible merges with unchanged geometry totals',()=>{const f=setup(),state=f.state;assert.equal(state.templatesLoaded,10);assert.ok(state.batches.length>=3);for(const b of state.batches){assert.equal(b.inputTriangles,b.outputTriangles);assert.ok(b.maxBoundsErrorMetres<1e-7);assert.equal(b.inputUvValues,b.outputUvValues);}assert.ok(state.sharedGeometryBytes>0);assert.throws(()=>{state.templatesLoaded=99;},TypeError);});
// Catches submitting undefined to THREE.add when a static template has no loose nodes.
test('fully batchable templates construct without THREE warnings',()=>{setup();const errors:string[]=[],previous=console.error;console.error=(...args)=>errors.push(args.join(' '));try{api.createHardwareModelFactory(templates);}finally{console.error=previous;}assert.deepEqual(errors,[]);});

// Catches fixed unit conversion or native orientation placed on an actor root that the renderer overwrites.
test('every entity root stays unit scale and identity rotation for fine geometry and actor poses',()=>{const f=setup();for(const root of [f.board({boardType:'uno-q'}),f.servo('motor'),f.horn('horn'),f.screw({fastener:'M2x6'}),f.plug(0),f.plug(1)]){assert.deepEqual(root!.scale.toArray(),[1,1,1]);assert.deepEqual(root!.quaternion.toArray(),[0,0,0,1]);}});
// Catches an overwritten plug Rx adapter and selecting plug-0 for both physical wire exit sides.
test('both plug endpoint adapters survive arbitrary actor poses and keep their distinct wire exits',()=>{
 const f=setup(),poseQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(.3,.4,-.5)),poseAt=new THREE.Vector3(3,7,-11);
 for(const end of [0,1]){const plug=f.plug(end);plug.quaternion.copy(poseQ);plug.position.copy(poseAt);plug.updateMatrixWorld(true);const raw=plug.getObjectByName('servo-cable')!,nativeCentreZ=end===0?-.067:.067,mating=raw.localToWorld(new THREE.Vector3(0,.00225,nativeCentreZ)),want=new THREE.Vector3(0,0,-2.25).applyQuaternion(poseQ).add(poseAt);mating.toArray().forEach((n,i)=>close(n,want.toArray()[i]!));assert.deepEqual(plug.userData.canonicalWireExitMm,[0,end===0?2:-2,0]);assert.deepEqual(plug.userData.nativeWireExitMm,[0,0,end===0?2:-2]);}
 const p0=f.plug(0),p1=f.plug(1),p1b=f.plug(1);assert.notEqual(meshes(p0)[0]!.geometry,meshes(p1)[0]!.geometry);assert.equal(meshes(p1)[0]!.geometry,meshes(p1b)[0]!.geometry);
});
