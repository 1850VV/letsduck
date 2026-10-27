import {assemblyAssetUrl} from '../shared/url.js';
import type {Actor,HardwareAdapter,Pose,EntityMap} from './types.js';
import * as THREE from '../vendor/three.module.js';
import { BOARD_AUDIT, SERVO_AUDIT } from './hardware-adapters.js';
import {HORN_BINDINGS} from './servo-horns.js';

const ASSETS=['uno-q','extension-board','hd1910-servo','servo-body','servo-horn','servo-rear-horn','servo-cable','screw-m2x6','screw-m3x16','screw-m23x8'];
const SCREWS:Record<string,{asset:string;translationY:number}>={M2x6:{asset:'screw-m2x6',translationY:-5.375},M3x16:{asset:'screw-m3x16',translationY:-16.4},'M2.3x8':{asset:'screw-m23x8',translationY:-8}};
const clone=(object:THREE.Object3D)=>object.clone(true);
const meshes=(object:THREE.Object3D)=>{const out:THREE.Mesh[]=[];object.traverse(o=>{if(o instanceof THREE.Mesh)out.push(o);});return out;};
const triangles=(object:THREE.Object3D)=>meshes(object).reduce((n,o)=>n+(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3,0);
const uvValues=(object:THREE.Object3D)=>meshes(object).reduce((n,o)=>n+(o.geometry.getAttribute('uv')?.array.length??0),0);
const bounds=(object:THREE.Object3D)=>{object.updateMatrixWorld(true);return new THREE.Box3().setFromObject(object);};
function freeze<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function mark(root:THREE.Object3D,asset:string){root.traverse(o=>{if(o instanceof THREE.Mesh)o.userData.hardwareAsset=asset;});return root;}
function select(source:THREE.Object3D,names:string[]){const group=new THREE.Group();for(const name of names){const node=source.getObjectByName(name);if(!node)throw Error(`Approved hardware node missing: ${name}`);group.add(clone(node));}return group;}
function compatibleKey(mesh:THREE.Mesh){return `${(Array.isArray(mesh.material)?mesh.material[0]!:mesh.material).uuid}|`+Object.entries(mesh.geometry.attributes).sort(([a],[b])=>a.localeCompare(b)).map(([name,a])=>`${name}:${a.itemSize}:${a.array.constructor.name}:${a.normalized}`).join('|');}
// Bake and merge once per static template. Instances keep these exact shared buffers.
// Separate attribute schemas remain separate batches, so UV-less metal never strips a label UV.
function batchStatic(source:THREE.Object3D,asset:string){
 source.updateMatrixWorld(true);const before=bounds(source),groups=new Map<string,{material:THREE.Material;geometries:THREE.BufferGeometry[];nodeNames:string[]}>(),loose:THREE.Mesh[]=[];
 for(const mesh of meshes(source)){
  const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
  if(Array.isArray(mesh.material)||mesh instanceof THREE.SkinnedMesh||Object.keys(geometry.morphAttributes).length){const leaf=new THREE.Mesh(geometry,mesh.material);leaf.name=mesh.name;loose.push(leaf);continue;}
  const key=compatibleKey(mesh);if(!groups.has(key))groups.set(key,{material:mesh.material,geometries:[],nodeNames:[]});const group=groups.get(key)!;group.geometries.push(geometry);group.nodeNames.push(mesh.name||mesh.parent?.name||asset);
 }
 const root=new THREE.Group();if(loose.length)root.add(...loose);
 for(const {material,geometries,nodeNames} of groups.values()){
  const geometry=new THREE.BufferGeometry(),vertexCount=geometries.reduce((n,g)=>n+g.getAttribute('position').count,0);
  for(const name of Object.keys(geometries[0]!.attributes)){
   const first=geometries[0]!.getAttribute(name),array=new (first.array.constructor as new(length:number)=>THREE.TypedArray)(vertexCount*first.itemSize);let offset=0;
   for(const g of geometries){const attr=g.getAttribute(name);array.set(attr.array,offset);offset+=attr.array.length;}
   geometry.setAttribute(name,new THREE.BufferAttribute(array,first.itemSize,first.normalized));
  }
  const count=geometries.reduce((n,g)=>n+(g.index?.count??g.getAttribute('position').count),0),indices=new Uint32Array(count);let write=0,base=0;
  for(const g of geometries){const n=g.index?.count??g.getAttribute('position').count;for(let i=0;i<n;i++)indices[write++]=base+(g.index?g.index.getX(i):i);base+=g.getAttribute('position').count;}
  geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=`${asset}-batch-${root.children.length}`;mesh.userData.sourceNodeNames=nodeNames;root.add(mesh);geometries.forEach(g=>g.dispose());
 }
 mark(root,asset);const after=bounds(root);
 const comparison={asset,inputMeshes:meshes(source).length,outputMeshes:meshes(root).length,inputTriangles:triangles(source),outputTriangles:triangles(root),inputUvValues:uvValues(source),outputUvValues:uvValues(root),maxBoundsErrorMetres:Math.max(before.min.distanceTo(after.min),before.max.distanceTo(after.max))};
 if(comparison.inputTriangles!==comparison.outputTriangles||comparison.inputUvValues!==comparison.outputUvValues||comparison.maxBoundsErrorMetres>1e-7)throw Error(`Hardware template batching changed geometry: ${asset}`);
 return{root,comparison};
}
function resourceBytes(objects:THREE.Object3D[]){const arrays=new Set<ArrayBufferLike>();for(const root of objects)for(const mesh of meshes(root)){for(const a of Object.values(mesh.geometry.attributes))arrays.add(a.array.buffer);if(mesh.geometry.index)arrays.add(mesh.geometry.index.array.buffer);}return [...arrays].reduce((n,b)=>n+b.byteLength,0);}
function adapter(template:THREE.Object3D,asset:string,spec:HardwareAdapter={}){const group=new THREE.Group();group.name=asset;group.position.fromArray(spec.translationMm||[0,0,0]);if(spec.quaternionXYZW)group.quaternion.fromArray(spec.quaternionXYZW);else group.rotation.set(...((spec.rotationEulerXYZRad||[0,0,0]) as [number,number,number]),'XYZ');group.scale.setScalar(1000);group.add(mark(clone(template),asset));return group;}
function actorRoot(){const root=new THREE.Group();root.userData.hardwareRequiresMaterialClone=true;return root;}

/** Build reusable model factories from already-parsed GLTF scenes.
 * Geometry, textures and template materials are read-only and shared. The caller's
 * entity() clones materials per actor before changing opacity or render quality.
 */
export function createHardwareModelFactory(templates:Record<string,THREE.Object3D|{scene:THREE.Object3D}>){
 const sources=Object.fromEntries(ASSETS.map(id=>{const template=templates[id],value=template&&('scene' in template?template.scene:template);if(!(value instanceof THREE.Object3D))throw Error(`Hardware GLB template missing: ${id}`);return[id,value];}));
 const prepared:Record<string,THREE.Object3D>={},batches:BatchComparison[]=[];
 for(const id of ['uno-q','extension-board','servo-body','screw-m2x6','screw-m3x16','screw-m23x8']){const result=batchStatic(sources[id]!,id);prepared[id]=result.root;batches.push(result.comparison);}
 prepared['servo-horn']=sources['servo-horn']!;prepared['servo-rear-horn']=sources['servo-rear-horn']!;
 for(const end of [0,1]){const plugSource=select(sources['servo-cable']!,[`white-plug-${end}`,`plug-contact-${end}-0`,`plug-contact-${end}-1`,`plug-contact-${end}-2`]),plugBatch=batchStatic(plugSource,'servo-cable');prepared['plug'+end]=plugBatch.root;batches.push({...plugBatch.comparison,part:`plug-${end}`});}
 const wireNode=sources['servo-cable']!.getObjectByName('wire-1');const nativeWire=wireNode&&meshes(wireNode)[0];if(!nativeWire)throw Error('Approved cable wire-1 missing');
 const approvedWireMaterial=Array.isArray(nativeWire.material)?nativeWire.material[0]!:nativeWire.material;approvedWireMaterial.userData={...approvedWireMaterial.userData,approvedHardware:true};
 const hornBindings=Object.fromEntries(Object.entries(HORN_BINDINGS).map(([id,h])=>[h!.actorId,{servoId:id,...h}]));
 const bindings=new WeakMap<THREE.Object3D,ServoBinding>();let instancesCreated=0;
 const stats=freeze({templatesLoaded:ASSETS.length,templateIds:[...ASSETS],sharedGeometryBytes:resourceBytes([...Object.values(prepared),sources['servo-cable']!]),loadedGeometryBytes:resourceBytes(Object.values(sources)),batches});
 function made(root:THREE.Group){instancesCreated++;return root;}
 function hornTemplate(side:string){return select(prepared[side==='rear'?'servo-rear-horn':'servo-horn']!,['eight-hole-disc','retaining-screw']);}
 function syncOne(root:THREE.Object3D,state:Record<string,Pick<Pose,"visible"|"status">>){const binding=bindings.get(root);if(!binding)return;const h=binding.horn;if(!h)return;const disc=binding[h.discSide==='front'?'front':'rear']!,horn=state[h.actorId],screw=state[h.screwActorId];disc.visible=!(horn?.visible||horn?.status==='removed');const retainer=disc.getObjectByName('retaining-screw');if(retainer)retainer.visible=!(screw?.visible||screw?.status==='removed');}
 return {
  board(actor:Pick<Actor,'boardType'|'size'>){const asset=actor.boardType==='uno-q'?'uno-q':actor.boardType==='luwu-extension'?'extension-board':null;if(!asset)return null;const spec=BOARD_AUDIT.adapters[actor.boardType==='uno-q'?'uno-q':'luwu-extension'];if(!spec)throw Error(`Board adapter missing: ${actor.boardType}`);const root=actorRoot();root.add(adapter(prepared[asset]!,asset,spec));return made(root);},
  servo(id:string){const spec=SERVO_AUDIT.actors[id];if(!spec)return null;const root=actorRoot(),body=adapter(prepared['servo-body']!,'servo-body',spec.bodyParent);body.userData.hardwareRole='servo-body';root.userData.hardwareServoId=id;root.add(body);
   const binding:ServoBinding={horn:HORN_BINDINGS[id]};for(const side of ['front','rear'] as const){const asset=side==='rear'?'servo-rear-horn':'servo-horn',part=adapter(hornTemplate(side),asset,spec[side==='front'?'frontHornParent':'rearHornParent']);part.userData.hardwareDiscSide=side;part.userData.hornRole=side==='front'?'secondary':'main';root.add(part);binding[side]=part;
    // The modelled hub stays on the servo when the separate disc leaves it.
    root.add(adapter(select(prepared[asset]!,['shaft-hub']),asset,spec[side==='front'?'frontHornParent':'rearHornParent']));
   }bindings.set(root,binding);return made(root);},
  horn(id:string){const h=hornBindings[id];if(!h)return null;const side=h.discSide,root=actorRoot(),asset=side==='rear'?'servo-rear-horn':'servo-horn';root.userData.hornRole=side==='front'?'secondary':'main';root.add(adapter(select(prepared[asset]!,['eight-hole-disc']),asset));return made(root);},
  screw(actor:Pick<Actor,'fastener'>){const spec=SCREWS[actor.fastener||''];if(!spec)return null;const root=actorRoot();root.add(adapter(prepared[spec.asset]!,spec.asset,{translationMm:[0,spec.translationY,0]}));return made(root);},
  plug(end=0){end=end===1?1:0;const root=actorRoot(),canonical=new THREE.Group();canonical.name='plug-canonical-adapter';canonical.rotation.x=-Math.PI/2;root.userData.matingOffsetMm=2.25;root.userData.nativeWireExitMm=[0,0,end===0?2:-2];root.userData.canonicalWireExitMm=[0,end===0?2:-2,0];root.userData.cableEnd=end;canonical.add(adapter(prepared['plug'+end]!,'servo-cable',{translationMm:[0,0,end===0?67:-67]}));root.add(canonical);return made(root);},
  wireMaterial(){return approvedWireMaterial;},
  cableModel(){const root=actorRoot();root.add(adapter(sources['servo-cable']!,'servo-cable'));return made(root);},
  syncDiscs(entities:EntityMap,state:Record<string,Pick<Pose,"visible"|"status">>){for(const [,entity] of entities){if(bindings.has(entity))syncOne(entity,state);else entity.traverse(root=>{if(bindings.has(root))syncOne(root,state);});}},
  get state(){return freeze({...stats,instancesCreated});},
 };
}

let pending:Promise<HardwareModelFactory>|undefined;
/** Parse each of the ten approved GLBs once; each returned instance shares buffers. */
export async function loadHardwareModels(){
 if(!pending)pending=(async()=>{const {GLTFLoader}=await import('../vendor/GLTFLoader.js'),loader=new GLTFLoader();const entries=await Promise.all(ASSETS.map(async id=>[id,(await loader.loadAsync(assemblyAssetUrl(`hardware-v2/${id}.glb`).href)).scene]));return createHardwareModelFactory(Object.fromEntries(entries));})();
 return pending;
}

export type HardwareModelFactory=ReturnType<typeof createHardwareModelFactory>;
interface BatchComparison {asset:string;inputMeshes:number;outputMeshes:number;inputTriangles:number;outputTriangles:number;inputUvValues:number;outputUvValues:number;maxBoundsErrorMetres:number;part?:string}
interface ServoBinding {horn:typeof HORN_BINDINGS[string]|undefined;front?:THREE.Object3D;rear?:THREE.Object3D}
