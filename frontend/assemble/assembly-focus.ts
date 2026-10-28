import {assemblyText,displayCueLabel} from './i18n.js';
import type {FocusState} from './types.js';
import type {Vector,EntityMap,CableMap,State} from './types.js';
import * as THREE from '../vendor/three.module.js';
import {STEPS,snapshot} from './hardware-state.js';
import {buildFineCues,selectFineCue} from './fine-cues.js';
import {createFineGeometry} from './fine-geometry.js';

// Visual trial only: four explicit assembly actions, with no inferred contacts.
const explicitFocusSteps = new Set(['final-head-join', 'final-board-mate']);
const stepIndices = new Map(STEPS.map((step,index)=>[step.id,index]));
// Discover fine cues for the requested step only; scanning the whole lesson blocks first paint.
export function isFocusStep(step:string) {
  const index=stepIndices.get(step);
  return explicitFocusSteps.has(step)||(index!==undefined&&buildFineCues(index).length>0);
}
const RED = 0xef4949, GREEN = 0x13b879;
const pulseDuration = 1500;
const box = (center:Vector, size:Vector) => new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...center), new THREE.Vector3(...size));

function frame(scene:THREE.Scene) {
  const root = new THREE.Group();
  const dashed = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({color: RED, dashSize: 2, gapSize: 1.4, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
  const corners = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({color: RED, transparent: true, depthTest: false, depthWrite: false, toneMapped: false}));
  root.add(dashed, corners); root.renderOrder = 30; dashed.renderOrder = 30; corners.renderOrder = 31; root.visible = false; scene.add(root);
  let signature = '';
  return {
    hide() { root.visible = false; },
    show(bounds:THREE.Box3, color:number, opacity:number) {
      const size = bounds.getSize(new THREE.Vector3()), key = size.toArray().map(n => n.toFixed(2)).join(',');
      if (key !== signature) {
        signature = key;
        const g = new THREE.BoxGeometry(size.x, size.y, size.z), edges = new THREE.EdgesGeometry(g); g.dispose();
        dashed.geometry.dispose(); dashed.geometry = edges; dashed.computeLineDistances();
        const points = [];
        for (const x of [-1,1]) for (const y of [-1,1]) for (const z of [-1,1]) {
          const p = new THREE.Vector3(x*size.x/2,y*size.y/2,z*size.z/2);
          for (let axis=0;axis<3;axis++) {
            const end = p.clone(), sign = [x,y,z][axis]!, length = Math.min(4,size.getComponent(axis)*.24);
            end.setComponent(axis,end.getComponent(axis)-sign*length); points.push(p.clone(),end);
          }
        }
        corners.geometry.dispose(); corners.geometry = new THREE.BufferGeometry().setFromPoints(points);
      }
      root.position.copy(bounds.getCenter(new THREE.Vector3())); root.visible = true;
      for (const line of [dashed,corners]) { line.material.color.setHex(color); line.material.opacity = opacity; }
    }
  };
}

export function createAssemblyFocus(scene:THREE.Scene, entities:EntityMap, cableRecords:CableMap) {
  const frames = Array.from({length:4},()=>frame(scene));
  const geometry=createFineGeometry(entities,cableRecords),indices=new Map(STEPS.map((s,i)=>[s.id,i]));
  let activeStep = '', clock:Map<string,number> = new Map(), details:FocusState = {phase:'none',boxes:[]};
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const boundsFor = (id:string,padding=3) => {const o=entities.get(id)!;o.updateWorldMatrix(true,true);return new THREE.Box3().setFromObject(o).expandByScalar(padding);};
  const strength = (joinedAt:number,now:number) => reducedMotion.matches || now-joinedAt>=pulseDuration ? .86 : .36+.64*(.5+.5*Math.cos((now-joinedAt)/pulseDuration*Math.PI*6));
  return {
    reset() { activeStep='';clock.clear();frames.forEach(f=>f.hide());details={phase:'none',boxes:[]}; },
    get state() { return structuredClone(details); },
    update(step:string,progress:number,poses:State,end:State,now:number,back:boolean,camera:THREE.PerspectiveCamera,viewportHeight:number) {
      frames.forEach(f=>f.hide());details={phase:'none',boxes:[]};
      if (back||!isFocusStep(step)) return details;
      if(activeStep!==step){activeStep=step;clock.clear();}
      const index=indices.get(step)!,cues=buildFineCues(index);
      if(cues.length&&!(step==='final-head-join'&&progress<cues[0]!.from)){
        const start=snapshot(index,0),resolved=cues.map(c=>geometry.resolve(c,poses,end,start,progress,step+':'+c.id)),choice=selectFineCue(cues,progress)!,current=resolved.find(r=>r.cue.id===choice.id)!,allDone=resolved.every(r=>r.done),draw=[];
        for(const r of resolved){if(r.done&&!clock.has(r.cue.id))clock.set(r.cue.id,now);if(!r.done)clock.delete(r.cue.id);}
        const green=(r:ReturnType<typeof geometry.resolve>)=>({bounds:r.joined,color:GREEN,opacity:strength(clock.get(r.cue.id)!,now),role:'joined',id:r.cue.id});
        if(allDone)draw.push(...resolved.map(green));
        else {
          if(current.done)draw.push(green(current));
          else {draw.push({bounds:current.target,color:RED,opacity:.94,role:'target',id:choice.id});if(current.visible)draw.push({bounds:current.moving,color:RED,opacity:1,role:'moving',id:choice.id});}
          const previous=resolved.filter(r=>r.done&&r!==current&&now-clock.get(r.cue.id)!<pulseDuration).at(-1);if(previous)draw.push(green(previous));
        }
        while(frames.length<draw.length)frames.push(frame(scene));
        draw.forEach((r,i)=>frames[i]!.show(r.bounds,r.color,r.opacity));
        const labels:Record<string,[string,string]>={fasten:[assemblyText("assemble.ui.0062"),assemblyText("assemble.ui.0063")],partial:[assemblyText("assemble.ui.0064"),assemblyText("assemble.ui.0065")],remove:[assemblyText("assemble.ui.0066"),assemblyText("assemble.ui.0067")],connect:[assemblyText("assemble.ui.0068"),assemblyText("assemble.ui.0069")],route:[assemblyText("assemble.ui.0070"),assemblyText("assemble.ui.0071")],seat:[assemblyText("assemble.ui.0072"),assemblyText("assemble.ui.0073")]};
        const status=choice.fitPending?assemblyText("assemble.ui.0074"):labels[choice.operation]![current.done?1:0],title=choice.type==='screw'?assemblyText("assemble.ui.0075"):choice.type==='part'?(choice.operation==='remove'?assemblyText("assemble.ui.0076"):displayCueLabel(choice.label||'')+assemblyText("assemble.ui.0077")):choice.operation==='route'?assemblyText("assemble.ui.0078"):assemblyText("assemble.ui.0079");
        details={fine:true,detailActive:progress>=choice.from,phase:allDone?'completed':'aligning',detailPhase:choice.fitPending?'pending':current.done?'completed':'aligning',detailId:choice.id,detailType:choice.type,detailTitle:title,detailStatus:`${choice.ordinal}/${choice.total} · ${status}`,detailDirection:current.normal.toArray(),message:`${current.done?assemblyText("assemble.ui.0080"):assemblyText("assemble.ui.0081")} · ${status}`,totalTargets:cues.length,completedTargets:resolved.filter(r=>r.done).length,matchedSocket:current.matched,animating:!reducedMotion.matches&&draw.some(r=>r.color===GREEN&&now-clock.get(r.id)!<pulseDuration),pulsing:draw.some(r=>r.color===GREEN&&r.opacity<.85),boxes:draw.map(r=>({id:r.id,role:r.role,color:r.color,opacity:r.opacity,center:r.bounds.getCenter(new THREE.Vector3()).toArray(),size:r.bounds.getSize(new THREE.Vector3()).toArray()}))};
        return details;
      }
      let pending:JoinTarget[]=[], completed:JoinTarget[]=[];
      if(step==='final-head-join') {
        const target=box([0,145.8,41.2],[49,29,42]),delta=new THREE.Vector3(...poses.h_neckA!.position).sub(new THREE.Vector3(...end.h_neckA!.position));
        const moving=target.clone().translate(delta);
        const done=progress>=.999999;
        (done?completed:pending).push({id:'head-neck-joint',moving,target,joined:target.clone().expandByScalar(1)});
      } else if(step==='final-board-mate') {
        const moving=boundsFor('f_extension'),target=boundsFor('f_uno');
        const done=progress>.1&&new THREE.Vector3(...poses.f_extension!.position).distanceTo(new THREE.Vector3(...end.f_extension!.position))<.01;
        (done?completed:pending).push({id:'board-headers',moving,target,joined:moving.clone().union(target)});
      } else {
        const ids=step==='final-power'?['f_powerPlug']:['f_busPlug0','f_busPlug1','f_busPlug2'];
        for(const id of ids){
          // Socket factory: the opening is +2.05 mm from its body, and the
          // seated plug center is another +1.65 mm. Pad the actual bodies only.
          const target=box(end[id]!.position.map((n,i)=>n-(i===1?3.7:0)),[id==='f_powerPlug'?6.2:8.2,5.2,5.2]);
          const moving=boundsFor(id,.6);
          const done=poses[id]!.status==='installed';
          (done?completed:pending).push({id,moving,target,joined:target.clone().union(moving)});
        }
      }
      for(const item of pending)clock.delete(item.id);
      for(const item of completed)if(!clock.has(item.id))clock.set(item.id,now);
      const draw=[];
      if(pending.length){
        const item=pending[0]!;draw.push({bounds:item.target,color:RED,opacity:.94,role:'target',id:item.id},{bounds:item.moving,color:RED,opacity:1,role:'moving',id:item.id});
        const last=completed.at(-1);if(last&&now-clock.get(last.id)!<pulseDuration)draw.push({bounds:last.joined,color:GREEN,opacity:strength(clock.get(last.id)!,now),role:'joined',id:last.id});
      } else if(completed.length){
        // Separate neighboring connectors keep separate completion frames.
        for(const item of completed)draw.push({bounds:item.joined,color:GREEN,opacity:strength(clock.get(item.id)!,now),role:'joined',id:item.id});
      }
      // Small connector frames retain physical size; readability comes from the inset.
      for(const item of draw.filter(()=>step!=='final-power'&&step!=='final-buses')){
        const center=item.bounds.getCenter(new THREE.Vector3()),size=item.bounds.getSize(new THREE.Vector3());
        const depth=Math.max(1,-center.clone().applyMatrix4(camera.matrixWorldInverse).z);
        const worldPerPixel=2*depth*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,viewportHeight);
        const factor=Math.max(1,worldPerPixel*19/Math.max(size.x,size.y,size.z));
        if(factor>1)item.bounds.setFromCenterAndSize(center,size.multiplyScalar(factor));
      }
      draw.forEach((item,i)=>frames[i]!.show(item.bounds,item.color,item.opacity));
      details={phase:pending.length?'aligning':'completed',animating:!reducedMotion.matches&&draw.some(i=>i.color===GREEN&&now-clock.get(i.id)!<pulseDuration),pulsing:draw.some(i=>i.color===GREEN&&i.opacity<.85),boxes:draw.map(i=>({id:i.id,role:i.role,color:i.color,opacity:i.opacity,center:i.bounds.getCenter(new THREE.Vector3()).toArray(),size:i.bounds.getSize(new THREE.Vector3()).toArray()}))};
      return details;
    }
  };
}

interface JoinTarget {id:string;moving:THREE.Box3;target:THREE.Box3;joined:THREE.Box3}
