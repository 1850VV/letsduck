import * as THREE from 'three';

// Conservative projected box test. Near-plane intersections deliberately stay
// candidates: projecting a partly clipped box must never discard a valid hit.
function inside(mesh,camera,x,y) {
  if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();const b=mesh.geometry.boundingBox;
  const m=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(mesh.matrixWorld);
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const v=new THREE.Vector4();
  for(const xx of [b.min.x,b.max.x])for(const yy of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z]){
    v.set(xx,yy,zz,1).applyMatrix4(m);if(v.w<=0)return true;
    const px=v.x/v.w,py=v.y/v.w;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
  }
  return x>=minX-1e-6&&x<=maxX+1e-6&&y>=minY-1e-6&&y<=maxY+1e-6;
}
export function idPicker(renderer,source,camera,pickables,isSplit) {
  const scene=new THREE.Scene(),clones=new Map(),codes=new Map(),ids=[null];
  const target=new THREE.WebGLRenderTarget(1,1,{samples:0,depthBuffer:true,stencilBuffer:false});
  let busy=false;
  return async(clientX,clientY)=>{
    if(busy)return undefined;
    const rect=renderer.domElement.getBoundingClientRect();if(!rect.width||!rect.height)return null;
    let x=(clientX-rect.left)/rect.width,y=(clientY-rect.top)/rect.height;
    if(x<0||x>1||y<0||y>1||isSplit()&&x<.5)return null;if(isSplit())x=(x-.5)*2;
    source.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const cam=camera.clone();cam.aspect=camera.aspect/(isSplit()?2:1);cam.updateProjectionMatrix();cam.updateMatrixWorld(true);
    const all=pickables(),active=new Set(all);
    for(const [mesh,clone] of clones)if(!active.has(mesh)){clone.material.dispose();clones.delete(mesh);}
    const candidates=all.filter(mesh=>inside(mesh,cam,x*2-1,1-y*2));
    if(!candidates.length)return null;
    scene.clear();
    for(const mesh of candidates){
      let clone=clones.get(mesh);
      if(!clone){let code=codes.get(mesh.userData.id);if(!code){code=ids.length;codes.set(mesh.userData.id,code);ids.push(mesh.userData.id);}
        const material=new THREE.ShaderMaterial({uniforms:{code:{value:code/255}},vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float code;void main(){gl_FragColor=vec4(code,0.,0.,1.);}',blending:THREE.NoBlending,toneMapped:false,side:mesh.material.side});
        clone=new THREE.Mesh(mesh.geometry,material);clone.matrixAutoUpdate=false;clones.set(mesh,clone);
      }
      clone.matrix.copy(mesh.matrixWorld);scene.add(clone);
    }
    const width=renderer.domElement.width/(isSplit()?2:1),height=renderer.domElement.height,view=cam.view?.enabled?{...cam.view}:null,aspect=cam.aspect;
    // Pixel centre is the exact pointer ray, including fractional CSS coordinates.
    if(view)cam.setViewOffset(view.fullWidth,view.fullHeight,view.offsetX+(x-.5/width)*view.width,view.offsetY+(y-.5/height)*view.height,view.width/width,view.height/height);
    else cam.setViewOffset(width,height,x*width-.5,y*height-.5,1,1);
    cam.aspect=aspect;cam.updateProjectionMatrix();
    const saved={target:renderer.getRenderTarget(),face:renderer.getActiveCubeFace(),mip:renderer.getActiveMipmapLevel(),color:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha(),auto:renderer.autoClear};
    const pixel=new Uint8Array(4);let read;
    busy=true;
    try{
      try{renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.autoClear=true;renderer.render(scene,cam);read=renderer.readRenderTargetPixelsAsync(target,0,0,1,1,pixel);}
      finally{renderer.setRenderTarget(saved.target,saved.face,saved.mip);renderer.setClearColor(saved.color,saved.alpha);renderer.autoClear=saved.auto;}
      await read;return ids[pixel[0]]||null;
    }finally{busy=false;}
  };
}
