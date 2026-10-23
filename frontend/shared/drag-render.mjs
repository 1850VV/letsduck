import * as THREE from 'three';

// Drag at the accepted 0.67 resolution without resizing the main canvas. A
// second, persistent camera keeps Three's per-camera transmission target
// separate: releasing the pointer never reallocates the full-size target.
export function createDragDraw(renderer,scene,camera,fullDraw=()=>renderer.render(scene,camera)) {
  const lowCamera=camera.clone(),quadScene=new THREE.Scene(),quadCamera=new THREE.Camera();
  const quadMaterial=new THREE.RawShaderMaterial({
    uniforms:{image:{value:null}},depthTest:false,depthWrite:false,blending:THREE.NoBlending,toneMapped:false,
    vertexShader:'precision highp float; attribute vec3 position; attribute vec2 uv; varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}',
    fragmentShader:'precision highp float; uniform sampler2D image; varying vec2 vUv; void main(){gl_FragColor=texture2D(image,vUv);}',
  });
  const geometry=new THREE.PlaneGeometry(2,2);quadScene.add(new THREE.Mesh(geometry,quadMaterial));
  const materials=new Map();let target=null,readyKey='',generation=0,failed=false;
  function configuration(){
    const sources=new Set();let supported=true;
    scene.traverse(o=>{if(o.material){if(!o.isMesh)supported=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){sources.add(m);if(!(m.isMeshBasicMaterial||m.isMeshStandardMaterial))supported=false;}}});
    const sorted=[...sources].sort((a,b)=>a.id-b.id),width=renderer.domElement.width,height=renderer.domElement.height;
    const key=[width,height,renderer.transmissionResolutionScale,...sorted.map(m=>m.id+'/'+m.version)].join(':');
    supported&&=width>1&&height>1&&renderer.toneMapping===THREE.ACESFilmicToneMapping&&renderer.outputColorSpace===THREE.SRGBColorSpace&&!scene.overrideMaterial;
    return {key,width,height,sorted,supported};
  }
  function adapted(source){
    const m=source.clone(),display={value:0};
    // r180 turns off display tone mapping for ordinary render targets. Match
    // the default framebuffer before MSAA resolve, but NEVER encode/tone-map
    // the intermediate transmission pass (it must stay in linear light).
    m.onBeforeRender=(r,...args)=>{source.onBeforeRender(r,...args);display.value=r.getRenderTarget()===target?1:0;};
    m.onBeforeCompile=(sh,r)=>{
      source.onBeforeCompile(sh,r);sh.uniforms.uDragDisplay=display;
      sh.fragmentShader='uniform float uDragDisplay;\n'+sh.fragmentShader;
      if(source.toneMapped){
        sh.fragmentShader=THREE.ShaderChunk.tonemapping_pars_fragment+'\n'+sh.fragmentShader;
        sh.fragmentShader=sh.fragmentShader.replace('#include <tonemapping_fragment>','if(uDragDisplay>.5) gl_FragColor.rgb = ACESFilmicToneMapping(gl_FragColor.rgb);');
      }
      sh.fragmentShader=sh.fragmentShader.replace('#include <colorspace_fragment>','if(uDragDisplay>.5) gl_FragColor = sRGBTransferOETF(gl_FragColor);');
    };
    m.customProgramCacheKey=()=>source.customProgramCacheKey()+'-drag-aces-srgb-r180';return m;
  }
  function withLow(fn){
    const saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),viewport:renderer.getViewport(new THREE.Vector4()),scissor:renderer.getScissor(new THREE.Vector4()),scissorTest:renderer.getScissorTest(),auto:renderer.autoClear},changed=[];
    try{
      lowCamera.copy(camera,false);
      for(const [source,m]of materials)m.copy(source);
      scene.traverse(o=>{if(o.isMesh){const original=o.material;changed.push([o,original]);o.material=Array.isArray(original)?original.map(m=>materials.get(m)):materials.get(original);}});
      renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.autoClear=true;
      return fn();
    }finally{
      for(const [o,m]of changed)o.material=m;
      renderer.setRenderTarget(saved.target,saved.face,saved.mip);renderer.autoClear=saved.auto;renderer.setViewport(saved.viewport);renderer.setScissor(saved.scissor);renderer.setScissorTest(saved.scissorTest);
    }
  }
  function low(){
    withLow(()=>renderer.render(scene,lowCamera));
    const auto=renderer.autoClear;
    try{renderer.autoClear=false;renderer.render(quadScene,quadCamera);}finally{renderer.autoClear=auto;}
  }
  function clear(){target?.dispose();target=null;for(const m of materials.values())m.dispose();materials.clear();readyKey='';}
  function disable(){clear();failed=true;}
  return {
    needsPreparation(){const c=configuration();return !failed&&!renderer.getContext().isContextLost()&&c.supported&&c.key!==readyKey;},
    async prepare(canFinish=()=>true){
      const c=configuration(),version=generation;
      if(failed||!c.supported||!canFinish()||renderer.getContext().isContextLost())return false;
      if(c.key===readyKey)return true;
      try{
        readyKey='';
        // Rebuild adapters in source material order to retain Three's sorting.
        for(const m of materials.values())m.dispose();materials.clear();
        for(const source of c.sorted)materials.set(source,adapted(source));
        const w=Math.floor(c.width*.67),h=Math.floor(c.height*.67);
        if(!target||target.width!==w||target.height!==h){target?.dispose();target=new THREE.WebGLRenderTarget(w,h,{samples:4,stencilBuffer:false,resolveDepthBuffer:false,colorSpace:THREE.LinearSRGBColorSpace});quadMaterial.uniforms.image.value=target.texture;}
        // Async compilation happens after a full frame is already shown. A
        // pointer arriving before completion uses the original full-size path.
        const pending=withLow(()=>{
          const gl=renderer.getContext();if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Drag target unavailable');
          return renderer.compileAsync(scene,lowCamera);
        });
        await Promise.all([pending,renderer.compileAsync(quadScene,quadCamera)]);
        if(version!==generation||!canFinish()||c.key!==configuration().key||renderer.getContext().isContextLost())return false;
        // Warm transmission outside pointer transitions, then restore a full
        // image in the same task, so no low-quality flash is presented.
        // Do not feed warmup frames into the full-resolution depth calibration.
        try{low();}finally{renderer.render(scene,camera);}
        if(renderer.getContext().getError()!==renderer.getContext().NO_ERROR)throw Error('Drag warmup failed');
        readyKey=c.key;return true;
      }catch{disable();return false;}
    },
    render(active,eligible=false,state=''){
      const c=active&&readyKey?configuration():null;
      if(c?.supported&&!failed&&c.key===readyKey&&!renderer.getContext().isContextLost()){
        try{low();return;}catch{disable();}
      }
      fullDraw(eligible,state);
    },
    reset(){generation++;clear();failed=false;},
    dispose(){generation++;clear();geometry.dispose();quadMaterial.dispose();failed=true;},
  };
}
