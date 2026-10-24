import * as THREE from 'three';
import {updateAssemblyCameraDepth} from './camera-depth.mjs';
import {withDetailSection} from './detail-section.mjs';

// A second camera in the same scene and WebGL context. No model/camera transforms
// are changed. DOM controls surround a scissored view of the live connection.
export function createAssemblyMagnifier({renderer,scene,camera,stage,host,renderView=(world,view)=>renderer.render(world,view)}) {
  const $=id=>document.getElementById(id),panel=$('focus-zoom'),view=$('focus-zoom-view'),handle=$('focus-zoom-handle'),toggle=$('focus-zoom-toggle'),saved=$('focus-zoom-saved'),savedStep=$('focus-zoom-step'),position=$('focus-zoom-position'),leader=$('focus-zoom-leader');
  const lens=new THREE.PerspectiveCamera(32,1,.1,1600),direction=new THREE.Vector3(.6,.85,-1).normalize();
  let context='',autoPlaced='',manual=null,drag=null,initialized=false,details={visible:false},lastSize='',currentStep='';
  const place=(x,y)=>{const margin=7;panel.style.left=Math.max(margin,Math.min(stage.clientWidth-panel.offsetWidth-margin,x))+'px';panel.style.top=Math.max(margin,Math.min(stage.clientHeight-panel.offsetHeight-margin,y))+'px';};
  const restore=()=>{try{manual=position.value?JSON.parse(position.value):null;}catch{manual=null;}autoPlaced='';};
  saved.addEventListener('change',()=>{autoPlaced='';});position.addEventListener('change',restore);
  const choose=value=>{saved.value=value;savedStep.value=currentStep;autoPlaced='';};
  $('focus-zoom-close').addEventListener('click',()=>{
    choose('0');
    const settings=$('view-settings'),button=!settings||settings.open?toggle.querySelector('button'):null;
    [button,settings?.querySelector('summary'),$('sequence-open')].find(el=>el?.getClientRects().length)?.focus();
  });
  toggle.addEventListener('click',()=>{if(!toggle.hasAttribute('disabled'))choose(details.visible?'0':'2');});
  handle.addEventListener('pointerdown',e=>{if(e.target.closest('button,ryugi-action-icon'))return;const r=panel.getBoundingClientRect(),s=stage.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left-s.left,top:r.top-s.top};handle.setPointerCapture(e.pointerId);e.preventDefault();});
  handle.addEventListener('pointermove',e=>{if(!drag)return;place(drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);});
  const finish=()=>{if(!drag)return;drag=null;manual=[panel.offsetLeft/stage.clientWidth,panel.offsetTop/stage.clientHeight];position.value=JSON.stringify(manual);};
  handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
  const project=v=>{const p=v.clone().project(camera);return{x:(p.x*.5+.5)*host.clientWidth,y:(-p.y*.5+.5)*host.clientHeight};};
  restore();
  return {
    get state(){return structuredClone(details);},
    render(focus,now,stepId) {
      if(stepId&&stepId!==currentStep){currentStep=stepId;if(savedStep.value!==stepId){saved.value='1';savedStep.value=stepId;}}
      const available=!!stepId&&focus.phase!=='none'&&!!focus.boxes?.length;
      const automatic=!!focus.fine&&focus.detailActive!==false;
      const enabled=available&&(saved.value==='2'||saved.value!=='0'&&automatic);
      toggle.toggleAttribute('disabled',!available);if(toggle.dataset.active!==String(enabled))toggle.dataset.active=String(enabled);
      const button=toggle.querySelector('button');if(button){if(button.getAttribute('aria-pressed')!==String(enabled))button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label','局部放大');button.title=available?'本步可手动开关；换步后，小部位自动开启，大部位默认关闭':'本步暂无需要放大的装配细节';}
      const label=$('focus-zoom-toggle-label'),text='局部放大 · '+(enabled?'开':'关');if(label&&label.textContent!==text)label.textContent=text;
      if(!available||!enabled){panel.hidden=true;leader.toggleAttribute('hidden',true);context='';initialized=false;details={visible:false,available,automatic,choice:saved.value};return;}
      const current=focus.boxes.find(b=>b.id===focus.detailId&&b.role!=='moving')||focus.boxes.find(b=>b.role==='target')||focus.boxes.at(-1),id=current.id;
      panel.hidden=false;leader.toggleAttribute('hidden',false);
      const target=new THREE.Vector3(...current.center),moving=focus.boxes.find(b=>b.id===id&&b.role==='moving');
      const area=new THREE.Box3().setFromCenterAndSize(target,new THREE.Vector3(...current.size));
      if(moving&&target.distanceTo(new THREE.Vector3(...moving.center))<25)area.union(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...moving.center),new THREE.Vector3(...moving.size)));
      area.expandByScalar(2.5);
      const sizeKey=stage.clientWidth+'x'+stage.clientHeight;
      if(autoPlaced!==id||lastSize!==sizeKey){
        lastSize=sizeKey;autoPlaced=id;
        if(manual)place(manual[0]*stage.clientWidth,manual[1]*stage.clientHeight);
        else {
          const w=panel.offsetWidth,h=panel.offsetHeight,W=stage.clientWidth,H=stage.clientHeight;
          const anchors=focus.boxes.map(b=>project(new THREE.Vector3(...b.center)));
          const positions=[[W-w-10,50],[W-w-10,H-h-14],[10,H-h-14],[10,50]];
          const cost=([x,y])=>anchors.reduce((n,p)=>n+(p.x>x-18&&p.x<x+w+18&&p.y>y-18&&p.y<y+h+18?1000:0),0)+(x<80&&y<75?80:0);
          positions.sort((a,b)=>cost(a)-cost(b));place(...positions[0]);
        }
      }
      const rect=view.getBoundingClientRect(),base=host.getBoundingClientRect(),x=Math.round(rect.left-base.left),y=Math.round(base.bottom-rect.bottom),w=Math.round(rect.width),h=Math.round(rect.height);
      if(w<1||h<1||x<0||y<0||x+w>host.clientWidth+2||y+h>host.clientHeight+2){details={visible:false,clipped:true};return;}
      const center=area.getCenter(new THREE.Vector3()),radius=area.getBoundingSphere(new THREE.Sphere()).radius;
      lens.aspect=w/h;const fov=Math.min(THREE.MathUtils.degToRad(32),2*Math.atan(Math.tan(THREE.MathUtils.degToRad(16))*lens.aspect));
      const normal=focus.detailDirection?new THREE.Vector3(...focus.detailDirection).normalize():null;
      const approach=normal?normal.clone().multiplyScalar(1.3).add(Math.abs(normal.y)>.8?new THREE.Vector3(.25,0,-.6):new THREE.Vector3(0,.6,.18)).normalize():direction;
      const mainDepth=Math.max(1,-target.clone().applyMatrix4(camera.matrixWorldInverse).z),mainScale=host.clientHeight/(2*mainDepth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
      // Keep the seat magnified even when the user has zoomed the main view in.
      // A distant incoming part can enter this view as it approaches the seat.
      const maxDistance=h/(2*mainScale*1.5*Math.tan(THREE.MathUtils.degToRad(16)));
      const fitDistance=radius/Math.sin(fov/2)*1.1;
      if(fitDistance>maxDistance)center.copy(target);
      const distance=Math.min(maxDistance,Math.max(18,fitDistance)),destination=center.clone().addScaledVector(approach,distance);
      if(context!==id||!initialized){lens.position.copy(destination);lens.userData.target=center.clone();initialized=true;context=id;}
      else{lens.position.lerp(destination,.2);lens.userData.target.lerp(center,.2);}
      const animating=lens.position.distanceToSquared(destination)>1e-8||lens.userData.target.distanceToSquared(center)>1e-8;
      if(!animating){lens.position.copy(destination);lens.userData.target.copy(center);}
      const offset=lens.position.clone().sub(lens.userData.target);if(offset.length()>maxDistance)lens.position.copy(lens.userData.target).add(offset.setLength(maxDistance));
      lens.lookAt(lens.userData.target);updateAssemblyCameraDepth(lens,lens.userData.target);lens.updateProjectionMatrix();lens.updateMatrixWorld();
      const lensScale=h/(2*lens.position.distanceTo(lens.userData.target)*Math.tan(THREE.MathUtils.degToRad(16))),zoom=lensScale/mainScale;
      $('focus-zoom-factor').textContent=zoom.toFixed(1)+'×';$('focus-zoom-title').textContent=(focus.detailTitle||'接头放大')+(stepId==='head-shell-fix'?' · 剖视':'');$('focus-zoom-status').textContent=focus.detailStatus||(focus.phase==='completed'?'已接合':'对准接口');panel.dataset.phase=focus.detailPhase||focus.phase;
      panel.setAttribute('aria-label',(focus.detailTitle||'接头放大')+'窗口');view.setAttribute('aria-label','当前装配部位的实时三维放大画面');
      const shadowAutoUpdate=renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate=false;renderer.autoClear=false;renderer.setScissor(x,y,w,h);renderer.setViewport(x,y,w,h);renderer.setScissorTest(true);renderer.setClearColor(0xf1f5fc,1);renderer.clear(true,true,false);if(stepId==='head-shell-fix')withDetailSection(renderer,center,approach,6,()=>renderView(scene,lens));else renderView(scene,lens);
      renderer.shadowMap.autoUpdate=shadowAutoUpdate;
      renderer.setScissorTest(false);renderer.setViewport(0,0,host.clientWidth,host.clientHeight);renderer.setClearColor(0x000000,0);renderer.autoClear=true;
      const p=project(target),stageRect=stage.getBoundingClientRect(),box=panel.getBoundingClientRect(),left=box.left-stageRect.left,right=box.right-stageRect.left,top=box.top-stageRect.top,bottom=box.bottom-stageRect.top;
      const endX=Math.max(left,Math.min(right,p.x)),endY=p.y<top?top:p.y>bottom?bottom:Math.max(top,Math.min(bottom,p.y));
      const line=$('focus-zoom-line');line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);line.setAttribute('x2',endX);line.setAttribute('y2',endY);$('focus-zoom-dot').setAttribute('cx',p.x);$('focus-zoom-dot').setAttribute('cy',p.y);
      details={visible:true,animating,available,automatic,choice:saved.value,id,zoom,center:center.toArray(),rect:{x,y,w,h},phase:focus.detailPhase||focus.phase,manual:!!manual,section:stepId==='head-shell-fix'};
    }
  };
}
