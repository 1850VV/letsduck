import * as THREE from 'three';
import {OrbitControls} from '../assets/vendor/OrbitControls.js';
import {toCreasedNormals} from '../assets/vendor/BufferGeometryUtils.js';
import {RoomEnvironment} from '../assets/vendor/RoomEnvironment.js';

export function createModelView(model,binary) {
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.setClearColor(0x000000,0);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(31,1,1,4000),meshes=new Map();
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=250;controls.maxDistance=1100;controls.target.set(0,130,15);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.65;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xf1f5ff,0xb6c2d8,2.2));
 for(const [color,intensity,position]of [[0xfffbf7,3.2,[-160,380,290]],[0xdde9ff,1.4,[240,180,-100]]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);scene.add(light);}
 function geometry(p){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(binary,p.geometry.positionOffset,p.geometry.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(binary,p.geometry.indexOffset,p.geometry.indexCount).slice(),1));const smooth=toCreasedNormals(g,Math.PI/5);g.dispose();return smooth;}
 for(const p of model.parts){const mesh=new THREE.Mesh(geometry(p),new THREE.MeshStandardMaterial({color:p.color,roughness:p.material.startsWith('TPU')?.82:.47,envMapIntensity:.65}));scene.add(mesh);meshes.set(p.id,mesh);}
 for(const h of model.hardware)scene.add(new THREE.Mesh(geometry(h),new THREE.MeshStandardMaterial({color:h.color,roughness:.5,metalness:.12})));
 function colors(design){for(const [id,mesh]of meshes)mesh.material.color.set(design.colors[id]);}
 function home(){camera.position.set(360,225,480);camera.lookAt(0,130,15);controls.target.set(0,130,15);controls.update();}
 let host=null,observer=null;
 function resize(){if(!host)return;const w=host.clientWidth,h=host.clientHeight;if(w<=0||h<=0)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();home();if(camera.aspect<.85)camera.position.sub(controls.target).multiplyScalar(.85/camera.aspect).add(controls.target);}
 function mount(el,design){host=el;observer?.disconnect();el.replaceChildren(renderer.domElement);colors(design);observer=new ResizeObserver(resize);observer.observe(el);resize();}
 function thumbnail(design){colors(design);renderer.setSize(540,390);camera.aspect=540/390;camera.updateProjectionMatrix();home();renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}
 let frame;
 function animate(){frame=requestAnimationFrame(animate);if(renderer.domElement.isConnected){controls.update();renderer.render(scene,camera);}}
 animate();
 window.addEventListener('beforeunload',()=>{cancelAnimationFrame(frame);observer?.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});env.dispose();renderer.dispose();});
 return {mount,colors,thumbnail,home};
}
