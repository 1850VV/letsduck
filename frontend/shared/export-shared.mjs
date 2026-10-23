// Reuse the view's context and environment without changing its scene/camera.
// The output adapter copies Three r180's ACES/sRGB operations before MSAA resolve.
// Standard render targets disable display tone mapping in r180, so merely setting
// texture.colorSpace would silently change the PNG. No physical material changes.
import * as THREE from 'three';

export function createSharedExport({model,printed},{renderer:r,scene,objects},addLights){
 const s=new THREE.Scene(),cam=new THREE.PerspectiveCamera(36,1,.1,3000),owned=[];
 s.environment=scene.environment;s.environmentIntensity=.65;addLights(s);
 const target=new THREE.WebGLRenderTarget(512,512,{samples:4,depthBuffer:true,stencilBuffer:false,colorSpace:THREE.LinearSRGBColorSpace});
 const geo=(p,print,index)=>{
  if(!print)return objects[index].geometry;
  const m=printed.get('part:'+p.id);
  if(!m)throw Error('Missing prepared print mesh '+p.id);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(m.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(m.normals,3));g.setIndex(new THREE.BufferAttribute(m.indices,1));owned.push(g);return g;
 };
 const mat=options=>{
  const m=new THREE.MeshStandardMaterial(options);m.onBeforeCompile=sh=>{
   sh.fragmentShader=THREE.ShaderChunk.tonemapping_pars_fragment+'\n'+sh.fragmentShader;
   sh.fragmentShader=sh.fragmentShader.replace('#include <tonemapping_fragment>','gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);').replace('#include <colorspace_fragment>','gl_FragColor = sRGBTransferOETF(gl_FragColor);');
  };m.customProgramCacheKey=()=> 'offscreen-export-aces-srgb-r180';owned.push(m);return m;
 };
 const items=model.parts.map((p,i)=>{const assembly=geo(p,false,i),print=geo(p,true,i),mesh=new THREE.Mesh(assembly,mat({color:p.color,roughness:p.material.startsWith('TPU')?.82:.47,envMapIntensity:.65}));s.add(mesh);return{p,mesh,assembly,print};});
 const hw=model.hardware.map((h,i)=>{const m=new THREE.Mesh(geo(h,false,i+model.parts.length),mat({color:h.color,roughness:.5,metalness:.12}));s.add(m);return m;});
 const plate=new THREE.Mesh(new THREE.BoxGeometry(258,.5,258),mat({color:0xe0e6f0,roughness:1}));owned.push(plate.geometry);plate.position.y=-1;
 let busy=false;
 function withTarget(fn){
  const saved={target:r.getRenderTarget(),face:r.getActiveCubeFace(),mip:r.getActiveMipmapLevel(),color:r.getClearColor(new THREE.Color()),alpha:r.getClearAlpha(),auto:r.autoClear,exposure:r.toneMappingExposure,viewport:r.getViewport(new THREE.Vector4()),scissor:r.getScissor(new THREE.Vector4()),scissorTest:r.getScissorTest()};
  try{r.setRenderTarget(target);r.setScissorTest(false);r.setClearColor(new THREE.Color().setRGB(244/255,246/255,250/255,THREE.LinearSRGBColorSpace),1);r.autoClear=true;r.toneMappingExposure=1.05;return fn();}
  finally{r.setRenderTarget(saved.target,saved.face,saved.mip);r.setClearColor(saved.color,saved.alpha);r.autoClear=saved.auto;r.toneMappingExposure=saved.exposure;r.setViewport(saved.viewport);r.setScissor(saved.scissor);r.setScissorTest(saved.scissorTest);}
 }
 function assembly(colors){
  s.remove(plate);for(const {p,mesh,assembly}of items){mesh.visible=true;mesh.position.set(0,0,0);mesh.geometry=assembly;mesh.material.color.set(colors[p.id]||p.color);}for(const m of hw)s.add(m);
  cam.up.set(0,1,0);cam.position.set(330,225,460);cam.lookAt(0,130,12);
 }
 return {
  async render(colors){
   if(busy)throw Error('Export already in use');busy=true;const pending=[];
   try{
    const capture=name=>{
     // r180's async read restores the single-sample framebuffer. Explicitly
     // rebind the MSAA target before each next view, or later PNGs repeat cover.
     r.setRenderTarget(target);r.render(s,cam);const pixels=new Uint8Array(512*512*4);
     const read=r.readRenderTargetPixelsAsync(target,0,0,512,512,pixels);
     pending.push(read.then(async()=>{
      const flipped=new Uint8ClampedArray(pixels.length);for(let y=0;y<512;y++)flipped.set(pixels.subarray(y*2048,(y+1)*2048),(511-y)*2048);
      const canvas=document.createElement('canvas');canvas.width=canvas.height=512;canvas.getContext('2d').putImageData(new ImageData(flipped,512,512),0,0);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG encoding failed')),'image/png'));
      return [name,blob];
     }));
    };
    withTarget(()=>{
     assembly(colors);capture('cover');hw.forEach(m=>s.remove(m));s.add(plate);for(const item of items)item.mesh.geometry=item.print;
     for(let i=1;i<=6;i++){
      const cx=((i-1)%3-1)*290,cz=(Math.floor((i-1)/3)-.5)*290;
      for(const {p,mesh}of items){mesh.visible=p.plate===i;mesh.position.set(-cx,0,-cz);}
      cam.position.set(240,440,300);cam.up.set(0,1,0);cam.lookAt(0,6,0);capture('plate'+i);
      cam.position.set(0,465,.001);cam.up.set(0,0,-1);cam.lookAt(0,0,0);capture('top'+i);
     }
    });
    return Object.fromEntries(await Promise.all(pending));
   }finally{await Promise.allSettled(pending);busy=false;}
  },
  dispose(){target.dispose();owned.forEach(o=>o.dispose());},
 };
}
