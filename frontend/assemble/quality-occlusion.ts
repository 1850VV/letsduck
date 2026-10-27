import * as THREE from '../vendor/three.module.js';

// A small, deterministic screen-space contact pass. Each view owns its targets;
// opening the detail camera never resizes or reallocates the main camera target.
export function createContactPass(renderer:THREE.WebGLRenderer){
  const views=new Map<string,THREE.WebGLRenderTarget>(),size=new THREE.Vector2(),viewport=new THREE.Vector4(),scissor=new THREE.Vector4(),clear=new THREE.Color();
  void size;
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1),scene=new THREE.Scene();
  const material=new THREE.ShaderMaterial({
    depthTest:false,depthWrite:false,blending:THREE.NoBlending,
    uniforms:{colorMap:{value:null},depthMap:{value:null},inverseProjection:{value:new THREE.Matrix4()},projection:{value:new THREE.Matrix4()},resolution:{value:new THREE.Vector2()},radius:{value:4.5},strength:{value:1.65}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      varying vec2 vUv;
      uniform sampler2D colorMap,depthMap;
      uniform mat4 inverseProjection,projection;
      uniform vec2 resolution;
      uniform float radius,strength;
      vec3 viewPosition(vec2 uv,float depth){vec4 p=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);return p.xyz/p.w;}
      void main(){
        vec4 color=texture2D(colorMap,vUv);float depth=texture2D(depthMap,vUv).x,occlusion=0.;
        vec3 position=viewPosition(vUv,depth);
        vec3 normal=normalize(cross(dFdx(position),dFdy(position)));
        if(depth<.999999&&color.a>.01){
          float pixels=clamp(radius*projection[1][1]*resolution.y/(-2.*position.z),1.5,42.);
          for(int i=0;i<16;i++){
            float angle=float(i)*2.39996323,ring=sqrt((float(i)+.5)/16.);
            vec2 uv=vUv+vec2(cos(angle),sin(angle))*pixels*ring/resolution;
            if(uv.x>0.&&uv.y>0.&&uv.x<1.&&uv.y<1.){
              float sampleDepth=texture2D(depthMap,uv).x;
              vec3 delta=viewPosition(uv,sampleDepth)-position;float distance=length(delta);
              if(sampleDepth<.999999&&distance>.04&&distance<radius){
                float horizon=max(0.,dot(normal,delta/distance)-.12);
                occlusion+=horizon*(1.-smoothstep(radius*.2,radius,distance));
              }
            }
          }
        }
        float ao=clamp(1.-occlusion*strength/16.,.62,1.);
        // Targets contain premultiplied linear color. Tone-map straight color,
        // then restore premultiplication for the transparent browser canvas.
        gl_FragColor=vec4(color.a>.0001?color.rgb/color.a*ao:vec3(0.),color.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb*=gl_FragColor.a;
      }`
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
  function targetFor(id:string,width:number,height:number){
    let t=views.get(id);
    if(!t){
      t=new THREE.WebGLRenderTarget(width,height,{type:THREE.HalfFloatType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,samples:4,depthBuffer:true});
      t.depthTexture=new THREE.DepthTexture(width,height,THREE.UnsignedIntType);views.set(id,t);
    }
    if(t.width!==width||t.height!==height)t.setSize(width,height);
    return t;
  }
  return{
    render(world:THREE.Scene,view:THREE.Camera,id='main'){
      renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clear);
      const scissorTest=renderer.getScissorTest(),alpha=renderer.getClearAlpha(),autoClear=renderer.autoClear,pixelRatio=renderer.getPixelRatio();
      const width=Math.max(1,Math.round(viewport.z*pixelRatio)),height=Math.max(1,Math.round(viewport.w*pixelRatio)),target=targetFor(id,width,height);
      // setRenderTarget already applies the target's physical-pixel viewport.
      renderer.setRenderTarget(target);renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.autoClear=true;renderer.clear();renderer.render(world,view);
      const stats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
      material.uniforms.colorMap!.value=target.texture;material.uniforms.depthMap!.value=target.depthTexture;
      material.uniforms.inverseProjection!.value.copy(view.projectionMatrixInverse);material.uniforms.projection!.value.copy(view.projectionMatrix);material.uniforms.resolution!.value.set(width,height);
      renderer.setRenderTarget(null);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.autoClear=false;
      renderer.render(scene,camera);renderer.setClearColor(clear,alpha);renderer.autoClear=autoClear;
      return stats;
    },
    get state(){return[...views].map(([id,t])=>({id,width:t.width,height:t.height}));}
  };
}
