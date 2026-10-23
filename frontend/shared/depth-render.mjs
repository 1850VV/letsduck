import * as THREE from 'three';
import {preferDepth} from './render-policy.mjs';

// Keep Three.js's original ordering and all material shaders for the colour pass.
export function depthDraw(renderer,scene,camera,material) {
  const override=scene.overrideMaterial,auto=renderer.autoClear,hidden=[];
  scene.traverse(o=>{if(o.isMesh&&o.visible&&(o.material.transparent||!o.material.depthWrite)){hidden.push(o);o.visible=false;}});
  try {
    renderer.autoClear=true;scene.overrideMaterial=material;renderer.render(scene,camera);
    scene.overrideMaterial=override;hidden.forEach(o=>o.visible=true);renderer.autoClear=false;renderer.render(scene,camera);
  } finally {scene.overrideMaterial=override;hidden.forEach(o=>o.visible=true);renderer.autoClear=auto;}
}

// Learn only while the application already needs a frame. Never render to collect
// samples or keep an idle GPU awake. Unsupported/disjoint timers retain one pass.
export function adaptiveDraw(renderer,scene,camera) {
  const material=new THREE.MeshBasicMaterial({colorWrite:false});
  const gl=renderer.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  let pending=null,key='',plain=[],depth=[],round=0,enabled=false,decided=false,waited=0;
  function reset(next){key=next;plain=[];depth=[];round=0;enabled=false;decided=false;}
  return (eligible=false,state='')=>{
    const next=[renderer.domElement.width,renderer.domElement.height,state].join(':');if(key!==next)reset(next);
    if(pending){
      if(gl.isContextLost()||gl.getParameter(ext.GPU_DISJOINT_EXT)||++waited>120){gl.deleteQuery(pending.query);pending=null;decided=true;enabled=false;}
      else if(gl.getQueryParameter(pending.query,gl.QUERY_RESULT_AVAILABLE)){
        const gpu=gl.getQueryParameter(pending.query,gl.QUERY_RESULT)/1e6;
        if(pending.key===key){(pending.depth?depth:plain).push({gpu,cpu:pending.cpu});if(plain.length>=12&&depth.length>=12){enabled=preferDepth(plain,depth);decided=true;}}
        gl.deleteQuery(pending.query);pending=null;
      }
    }
    // No extra pass for unsupported devices, outlines, split views, props or snapshots.
    if(!eligible||!ext||gl.isContextLost()){renderer.render(scene,camera);return;}
    const measure=!decided&&!pending&&!gl.getQuery(ext.TIME_ELAPSED_EXT,gl.CURRENT_QUERY);
    const useDepth=decided?enabled:measure?!!(round++%2):false;
    const query=measure?gl.createQuery():null;
    if(query)gl.beginQuery(ext.TIME_ELAPSED_EXT,query);
    const start=performance.now();
    try{useDepth?depthDraw(renderer,scene,camera,material):renderer.render(scene,camera);}
    finally{if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);pending={query,depth:useDepth,cpu:performance.now()-start,key};waited=0;}}
  };
}
