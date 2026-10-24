import {observationSettings,refreshObservationSettings} from './observation-controller.mjs';
import {applyObservationLighting} from './observation-lighting.mjs';
import {createHardwareLod} from './hardware-lod.mjs';
import * as THREE from '../vendor/three.module.js';
import {createContactPass} from './quality-occlusion.mjs';
import {softenShadows} from './quality-shadows.mjs';
import {prepareEdgeShading,edgeVertexShader,edgeVertexAssignment,edgeFragmentShader,edgeFragmentAssignment} from './quality-edges.mjs';

// The approved hardware already has its own photographed labels, UVs and PBR
// finishes. Upgrade the illumination without repainting those source assets.
export function hardwareFinish(original){
 const material=original.clone();material.userData={...original.userData};
 material.onBeforeCompile=softenShadows;
 material.customProgramCacheKey=()=>`duck-approved-hardware-2`;
 return material;
}

const grainShader=`
  varying vec3 vMattePosition;
  float matteHash(vec3 p){p=fract(p*.3183099+vec3(.17,.31,.73));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float matteNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(mix(matteHash(i),matteHash(i+vec3(1,0,0)),f.x),mix(matteHash(i+vec3(0,1,0)),matteHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(matteHash(i+vec3(0,0,1)),matteHash(i+vec3(1,0,1)),f.x),mix(matteHash(i+vec3(0,1,1)),matteHash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
`;

function matteFinish(original,kind,edges){
  const material=original.clone();material.name='极致 · '+kind;material.userData={...original.userData};
  if(edges)material.defines={...material.defines,DUCK_EDGE_SHADING:1};
  const metal=kind==='metal',lens=kind==='lens',rubber=kind==='rubber';
  material.metalness=metal?.96:0;
  material.roughness=metal?.23:lens?.12:rubber?.79:kind==='motor'?.48:kind==='board'?.5:kind==='connector'?.46:.41;
  material.envMapIntensity=metal?1.4:lens?.55:rubber?.65:1.;
  const luminance=material.color.r*.2126+material.color.g*.7152+material.color.b*.0722;
  if(kind==='motor')material.color.lerp(new THREE.Color(0x202020),.65);
  if(metal)material.color.lerp(new THREE.Color(0xb5b6b4),.5);
  if(kind==='shell'&&luminance>.7)material.color.lerp(new THREE.Color(0xf5f1e9),.65);
  if(material.isMeshPhysicalMaterial){material.clearcoat=lens?.12:0;material.clearcoatRoughness=.1;material.ior=1.48;material.specularIntensity=lens?.45:.95;}
  const strength=metal?.08:lens?.03:kind==='shell'?1:rubber?.5:.65,width=metal?.08:kind==='shell'?.32:.16;
  material.onBeforeCompile=shader=>{
    softenShadows(shader);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMattePosition;\n'+edgeVertexShader()).replace('#include <begin_vertex>','#include <begin_vertex>\nvMattePosition=position;\n'+edgeVertexAssignment());
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+grainShader+edgeFragmentShader())
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        float matteGrain=matteNoise(vMattePosition*8.);
        float matteFootprint=max(length(dFdx(vMattePosition)),length(dFdy(vMattePosition)));
        float matteDetail=1.-smoothstep(.035,.28,matteFootprint);
        float matteMottle=matteNoise(vMattePosition*.7)-.5;
        roughnessFactor=clamp(roughnessFactor+(matteMottle*.045+(matteGrain-.5)*.075*matteDetail)*${strength.toFixed(2)},.09,.96);`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        ${edgeFragmentAssignment(width)}
        float matteHeight=((matteGrain-.5)*.006*matteDetail+matteMottle*.009)*${strength.toFixed(2)};
        vec3 matteDx=dFdx(-vViewPosition),matteDy=dFdy(-vViewPosition);
        vec3 matteR1=cross(matteDy,normal),matteR2=cross(normal,matteDx);
        float matteDet=dot(matteDx,matteR1);
        normal=normalize(abs(matteDet)*normal-sign(matteDet)*(dFdx(matteHeight)*matteR1+dFdy(matteHeight)*matteR2));`);
  };
  material.customProgramCacheKey=()=>`duck-satin-2-${kind}-${edges}`;
  return material;
}

function studioEnvironment(renderer){
  // Warm window, neutral overhead softbox, cool narrow rim; the dark room
  // between the emitters gives curved shells a readable reflection gradient.
  const room=new THREE.Scene(),geometry=new THREE.BoxGeometry(1,1,1),shell=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x282b30,side:THREE.BackSide}));shell.scale.setScalar(16);room.add(shell);
  const softbox=(position,scale,color,power)=>{const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(power)}));m.position.fromArray(position);m.scale.fromArray(scale);room.add(m);};
  softbox([-7,3,4],[.1,8,6],0xffecd6,7);softbox([0,7,1],[6,.1,5],0xfffaf4,4.5);
  softbox([7,2,-3],[.1,6,2],0xd8e8ff,3.5);softbox([2,1,-7],[3,6,.1],0xffffff,2.);
  const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(room,.015);
  const materials=new Set();room.traverse(o=>{if(o.material)materials.add(o.material);});materials.forEach(m=>m.dispose());geometry.dispose();pmrem.dispose();return target;
}

export function createRenderQuality({renderer,scene,key,fill,hemi,ground}){
  const hardwareLod=createHardwareLod({enabled:new URLSearchParams(location.search).get('hardwareLod')!=='0'}),viewSize=new THREE.Vector2();
  const input=document.getElementById('render-quality'),bindings=[],overlays=[],cache=new Map(),geometryCache=new Map(),baseline={environment:scene.environment,environmentIntensity:scene.environmentIntensity,exposure:renderer.toneMappingExposure,toneMapping:renderer.toneMapping,pixelRatio:renderer.getPixelRatio(),shadowType:renderer.shadowMap.type,shadowSize:key.shadow.mapSize.clone(),shadowFar:key.shadow.camera.far,shadowNormalBias:key.shadow.normalBias,keyPosition:key.position.clone(),keyIntensity:key.intensity,keyColor:key.color.clone(),fillPosition:fill.position.clone(),fillIntensity:fill.intensity,fillColor:fill.color.clone(),hemiIntensity:hemi.intensity,groundOpacity:ground.material.opacity,groundMaterial:ground.material};
  const softGround=ground.material.clone();softGround.onBeforeCompile=softenShadows;softGround.customProgramCacheKey=()=>`duck-soft-ground-1`;
  let mode='current',lighting='neutral',studio=null,contact=null,dirty=true,attached=false,lastStats={calls:0,triangles:0};
  function set(value,light=observationSettings.state.lighting){
    const next=value==='ultra'?'ultra':'current',ultra=next==='ultra';if(next===mode&&light===lighting&&attached)return;
    lighting=light;
    mode=next;
    for(const {object,mask}of overlays)object.layers.mask=ultra?2:mask;
    for(const {mesh,original,enhanced,sourceGeometry,enhancedGeometry}of bindings){
      // Cables rebuild their tube geometry as endpoints move. Their geometry
      // is not a display variant and must never be restored from this cache.
      if(sourceGeometry!==enhancedGeometry)mesh.geometry=ultra?enhancedGeometry:sourceGeometry;
      const active=Array.isArray(mesh.material)?mesh.material:[mesh.material],materials=ultra?enhanced:original;
      materials.forEach((m,i)=>{m.opacity=active[i].opacity;m.transparent=active[i].transparent;});mesh.material=Array.isArray(mesh.material)?materials:materials[0];
    }
    if(ultra){
      contact??=createContactPass(renderer);
      renderer.setPixelRatio(Math.min(devicePixelRatio*1.5,2.25));
      ground.material=softGround;ground.material.opacity=.22;renderer.shadowMap.type=THREE.PCFShadowMap;key.shadow.mapSize.set(4096,4096);key.shadow.radius=3;key.shadow.normalBias=.08;
    }else{
      renderer.setPixelRatio(baseline.pixelRatio);
      ground.material=baseline.groundMaterial;ground.material.opacity=baseline.groundOpacity;renderer.shadowMap.type=baseline.shadowType;key.shadow.mapSize.copy(baseline.shadowSize);key.shadow.radius=1;key.shadow.normalBias=baseline.shadowNormalBias;
    }
    applyObservationLighting(lighting,{scene,renderer,key,fill,hemi,baseline,environment:()=>studio??=studioEnvironment(renderer)});
    key.shadow.camera.updateProjectionMatrix();key.shadow.map?.dispose();key.shadow.map=null;key.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;dirty=true;
    scene.traverse(o=>{if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.needsUpdate=true;});
    input.value=mode;input.dataset.active=mode;
  }
  input.addEventListener('change',()=>observationSettings.set('quality',input.value));
  observationSettings.subscribe(state=>{if(attached)set(state.quality,state.lighting);globalThis.dispatchEvent?.(new Event('observation:change'));});
  return{
    attach(entities,actors){
      // Only through-surface instructional frames belong in the overlay pass.
      // GridHelper also disables tone mapping, but must keep scene depth so it
      // cannot appear as a wire grid across the assembled robot.
      scene.traverse(object=>{if(object.material?.toneMapped===false&&object.material.depthTest===false)overlays.push({object,mask:object.layers.mask});});
      for(const[id,root]of entities){const a=actors[id];root.traverse(mesh=>{
        if(!mesh.isMesh)return;const approved=!!mesh.userData.hardwareAsset||!!mesh.material.userData?.approvedHardware;
        // letsduck: printed parts keep the studio's material and the scheme's exact colour in both modes.
        const printed=[mesh.material].flat().some(m=>m.userData?.printed);
        const sourceGeometry=mesh.geometry,edges=!approved&&!printed&&a.kind!=='cable'&&!!sourceGeometry.attributes.position;
        if(edges&&!geometryCache.has(sourceGeometry))geometryCache.set(sourceGeometry,prepareEdgeShading(sourceGeometry));
        const enhancedGeometry=edges?geometryCache.get(sourceGeometry):sourceGeometry,original=Array.isArray(mesh.material)?mesh.material:[mesh.material];
        const enhanced=original.map(m=>{if(!m.isMeshStandardMaterial||m.userData?.printed)return m;if(!cache.has(m)){
          if(approved){cache.set(m,hardwareFinish(m));return cache.get(m);}
          const l=m.color.r*.2126+m.color.g*.7152+m.color.b*.0722;
          const kind=m.metalness>.4||/bearing/i.test(id)?'metal':/h_eyes$/.test(id)?'lens':a.kind==='battery'||/sole|Pad/.test(id)||a.kind==='cable'&&l<.1?'rubber':/motor/i.test(id)&&l<.15?'motor':a.kind==='board'?'board':a.kind==='mesh'?'shell':'connector';cache.set(m,matteFinish(m,kind,edges));
        }return cache.get(m);});bindings.push({mesh,original,enhanced,sourceGeometry,enhancedGeometry});
      });}
      hardwareLod.attach(scene);
      set(observationSettings.state.quality);attached=true;
    },
    sync(){refreshObservationSettings();if(attached)set(observationSettings.state.quality);},
    invalidate(){dirty=true;},
    render(world,camera,id='main'){
      return hardwareLod.withView(camera,renderer.getSize(viewSize).y,id,()=>{
      if(mode!=='ultra'){renderer.render(world,camera);lastStats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};return;}
      const auto=renderer.shadowMap.autoUpdate;renderer.shadowMap.autoUpdate=id==='main'&&dirty;
      lastStats=contact.render(world,camera,id);
      // Red/green guidance is an instructional overlay, so keep its original
      // colors out of photographic tone mapping and contact shading.
      const mask=camera.layers.mask,clear=renderer.autoClear;camera.layers.mask=2;renderer.autoClear=false;renderer.shadowMap.autoUpdate=false;renderer.render(world,camera);
      lastStats.calls+=renderer.info.render.calls;lastStats.triangles+=renderer.info.render.triangles;
      camera.layers.mask=mask;renderer.autoClear=clear;renderer.shadowMap.autoUpdate=auto;if(id==='main')dirty=false;
      });
    },
    get renderStats(){return{...lastStats};},
    get state(){return{hardwareLod:hardwareLod.state,mode,lighting,exposure:renderer.toneMappingExposure,environmentIntensity:scene.environmentIntensity,keyIntensity:key.intensity,hemiIntensity:hemi.intensity,finish:mode==='ultra'?'matte-plastic':'original',pixelRatio:renderer.getPixelRatio(),shadowSize:key.shadow.mapSize.toArray(),materials:cache.size,edgeGeometries:geometryCache.size,contactViews:contact?.state||[]};}
  };
}
