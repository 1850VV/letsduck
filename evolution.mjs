// Publish ceremony: an original "evolution" homage. Visuals and sound are drawn/synthesised here; no third-party footage or music.
import * as THREE from 'three';
export const TIMELINE={device:0,shout:1.6,glow:2.6,scan:3.4,flash:5.4,card:6.1};
const ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
export function createEvolution(api){
  const $=s=>document.querySelector(s),reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.insertAdjacentHTML('beforeend',`<div id="evo" hidden><div class="evo-grid"></div><canvas id="evo-scene" aria-hidden="true"></canvas><div class="evo-sub" id="evo-sub"></div><div class="evo-device" id="evo-device"><div class="evo-ring"></div><div class="evo-ring r2"></div><div class="evo-core"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 25V16a8 8 0 0116 0v4h8v6H15z" fill="#ffd23f"/><circle cx="20" cy="15" r="2.2" fill="#0f1430"/></svg></div></div><div class="evo-text" id="evo-text" role="status"></div><div class="evo-flash" id="evo-flash"></div><div class="evo-card" id="evo-card"><span class="evo-eyebrow">EVOLUTION COMPLETE · 进化完成</span><h3 id="evo-name"></h3><div class="evo-strip" id="evo-strip"></div><p id="evo-meta"></p><div class="evo-actions"><button type="button" id="evo-replay">↻ 再看一次</button><button type="button" id="evo-poster">分享海报</button><span></span><button type="button" id="evo-done" class="primary">去广场看看</button></div></div><button type="button" id="evo-skip">跳过</button></div>`);
  let renderer,stage,run=null,audio=null,frame=0;
  function build(){
    renderer=new THREE.WebGLRenderer({canvas:$('#evo-scene'),alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.setClearColor(0,0);
    const {scene,meshes}=api.createShowcase(),box=new THREE.Box3();
    for(const [,m] of meshes){m.geometry.computeBoundingBox();box.union(m.geometry.boundingBox);m.userData.y=m.geometry.boundingBox.getCenter(new THREE.Vector3()).y;}
    const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),radius=Math.max(size.x,size.z)*.62,pivot=new THREE.Group();
    pivot.position.set(center.x,0,center.z);[...scene.children].filter(o=>!o.isLight).forEach(o=>{pivot.attach(o);});scene.add(pivot);
    const rings=[0,1,2].map(i=>{const r=new THREE.Mesh(new THREE.TorusGeometry(radius*(1+i*.18),radius*.012,8,96),new THREE.MeshBasicMaterial({color:i===1?0xffd23f:0x47e0ff,transparent:true,opacity:0,toneMapped:false}));r.rotation.x=Math.PI/2;r.position.set(center.x,0,center.z);scene.add(r);return r;});
    const scan=new THREE.Mesh(new THREE.CylinderGeometry(radius*.95,radius*.95,size.y*.02,64,1,true),new THREE.MeshBasicMaterial({color:0x7ff3ff,transparent:true,opacity:0,side:THREE.DoubleSide,toneMapped:false}));scan.position.set(center.x,0,center.z);scene.add(scan);
    const points=new Float32Array(900);for(let i=0;i<300;i++){points[i*3]=center.x+(Math.random()-.5)*radius*2.4;points[i*3+1]=box.min.y+Math.random()*size.y*1.2;points[i*3+2]=center.z+(Math.random()-.5)*radius*2.4;}
    const sparks=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(points,3)),new THREE.PointsMaterial({color:0xffe08a,size:radius*.03,transparent:true,opacity:0,toneMapped:false}));scene.add(sparks);
    const camera=new THREE.PerspectiveCamera(30,1,1,5000);
    stage={scene,meshes,pivot,rings,scan,sparks,camera,box,size,center};
  }
  function resize(){const c=$('#evo-scene'),w=c.clientWidth,h=c.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const {camera,center,size}=stage,fit=Math.max(1,1.25/(w/h));camera.aspect=w/h;camera.position.set(center.x,center.y+size.y*.45,center.z+size.y*4.6*fit);camera.lookAt(center.x,center.y-size.y*.12,center.z);camera.updateProjectionMatrix();}
  function tone(freq,start,dur,type='square',vol=.05){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+start;o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur+.05);}
  function sweep(start,dur,from,to,vol=.035){const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+start;o.type='sawtooth';o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(audio.destination);o.start(t);o.stop(t+dur+.05);}
  function score(){ // Original 8-bit cue: three device beeps, a rising run, a long sweep and a major chord.
    try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();}catch{audio=null;return;}
    [0,.25,.5].forEach(t=>tone(1320,t,.1,'square',.04));
    [523,587,659,784,880,988,1047,1175,1319,1568].forEach((f,i)=>tone(f,1.4+i*.09,.14,'square',.045));
    sweep(2.6,2.8,180,1400);[523,659,784,1047].forEach(f=>tone(f,5.5,1.4,'triangle',.07));tone(262,5.5,1.4,'square',.03);
  }
  function paint(colors,assignments){for(const [p,m] of stage.meshes){m.material.color.set(colors[p.id]);api.applyAppearance(m.material,assignments?.[p.id]);m.material.emissive.setHex(0);}}
  function play({name,author,before,after,sound=true,onDone,onPoster}){
    if(!stage)build();
    run={start:performance.now(),name,author,before,after,sound,onDone,onPoster,step:-1};
    paint(before.colors,before.assignments);stage.pivot.rotation.y=0;stage.pivot.position.y=0;
    $('#evo').hidden=false;document.body.classList.add('evo-open');resize();
    $('#evo-card').classList.remove('show');$('#evo-text').classList.remove('show');$('#evo-device').className='evo-device';$('#evo-device').style.cssText='opacity:0;transform:scale(.4)';
    $('#evo-sub').textContent='DUCK·EVOLVER · 配色数据同步中';stage.meshes.forEach(([,m])=>m.visible=false);
    if(sound&&!reduce())score();else audio?.suspend();
    if(reduce())run.start-=TIMELINE.card*1000;
    $('#evo-skip').hidden=false;$('#evo-skip').focus();
    cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
  }
  function tick(now){
    if(!run)return;const t=(now-run.start)/1000,d=$('#evo-device'),text=$('#evo-text'),{meshes,pivot,rings,scan,sparks,box,size}=stage;
    if(t<TIMELINE.glow){d.style.opacity='1';d.style.transform=`scale(${.4+ease(t/.6)*.6+(t>TIMELINE.shout?(t-TIMELINE.shout)*.25:0)}) rotate(${t>TIMELINE.shout?(t-TIMELINE.shout)*40:0}deg)`;if(t>TIMELINE.shout&&run.step<1){run.step=1;d.classList.add('fast');text.textContent='机器鸭 超进化——！';text.classList.add('show');$('#evo-sub').textContent='EVOLUTION START';}}
    else{d.style.opacity='0';d.style.transform='scale(2.2)';}
    if(t>=TIMELINE.glow&&run.step<2){run.step=2;meshes.forEach(([,m])=>m.visible=true);text.classList.remove('show');$('#evo-sub').textContent='DUCK·EVOLVER · 重新着色';}
    if(t>=TIMELINE.glow){
      const glow=t<TIMELINE.scan?ease((t-TIMELINE.glow)/.8):t<TIMELINE.flash?1:Math.max(0,1-(t-TIMELINE.flash)/.5);
      const scanY=t<TIMELINE.scan?-Infinity:box.min.y+ease((t-TIMELINE.scan)/(TIMELINE.flash-TIMELINE.scan))*size.y*1.08;
      for(const [p,m] of meshes){
        if(scanY>m.userData.y){if(!m.userData.done){m.userData.done=true;m.material.color.set(run.after.colors[p.id]);api.applyAppearance(m.material,run.after.assignments?.[p.id]);}const fresh=Math.max(0,.6-(scanY-m.userData.y)/size.y*3);m.material.emissive.setRGB(fresh*glow,fresh*glow,fresh*glow);}
        else{m.userData.done=false;m.material.emissive.setRGB(glow*.85,glow*.9,glow);}
      }
      pivot.rotation.y=t<TIMELINE.flash?(t-TIMELINE.glow)**2*1.1:pivot.rotation.y+(-.45-pivot.rotation.y%(Math.PI*2))*.06;
      pivot.position.y=t<TIMELINE.flash?Math.sin(t*6)*size.y*.01:Math.max(0,Math.sin(Math.min(1,(t-TIMELINE.flash)/.6)*Math.PI)*size.y*.12);
      scan.material.opacity=t>=TIMELINE.scan&&t<TIMELINE.flash?.5:0;scan.position.y=Math.max(box.min.y,scanY);
      rings.forEach((r,i)=>{r.material.opacity=t<TIMELINE.flash+.2?.8*glow:Math.max(0,.8-(t-TIMELINE.flash-.2));r.position.y=box.min.y+size.y*(.15+i*.35)+Math.sin(t*3+i)*size.y*.04;r.rotation.z=t*(i%2?2:-2);});
      sparks.material.opacity=t>=TIMELINE.scan&&t<TIMELINE.card+.4?.9:0;sparks.rotation.y=t*.8;
    }
    if(t>=TIMELINE.flash&&run.step<3){run.step=3;const f=$('#evo-flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');text.textContent=run.name+'！';text.classList.add('show');$('#evo-sub').textContent='EVOLUTION COMPLETE';}
    if(t>=TIMELINE.card&&run.step<4){run.step=4;finish();}
    if(run.step>=4)pivot.rotation.y+=.004;
    renderer.render(stage.scene,stage.camera);frame=requestAnimationFrame(tick);
  }
  function finish(){
    paint(run.after.colors,run.after.assignments);stage.meshes.forEach(([,m])=>{m.visible=true;m.userData.done=true;});stage.scan.material.opacity=0;
    const colors=[...new Set(Object.values(run.after.colors))];
    $('#evo-name').textContent=run.name;$('#evo-strip').innerHTML=colors.map(c=>`<i style="background:${c}"></i>`).join('');
    $('#evo-meta').textContent=`${run.author?'by '+run.author+' · ':''}XGO Duck V2 · ${colors.length} 种耗材 · 35 个打印零件`;
    $('#evo-card').classList.add('show');$('#evo-skip').hidden=true;$('#evo-done').focus();setTimeout(()=>$('#evo-text').classList.remove('show'),1400);
  }
  function close(){if(!run)return;const done=run.onDone;run=null;cancelAnimationFrame(frame);audio?.suspend();$('#evo').hidden=true;document.body.classList.remove('evo-open');done?.();}
  $('#evo-skip').onclick=()=>{if(run&&run.step<4){run.start=performance.now()-TIMELINE.card*1000;run.step=Math.max(run.step,3);audio?.suspend();}};
  $('#evo-replay').onclick=()=>{if(run)play(run);};
  $('#evo-poster').onclick=()=>run?.onPoster?.();
  $('#evo-done').onclick=close;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&run){e.preventDefault();if(run.step<4)$('#evo-skip').click();else close();}});
  addEventListener('resize',()=>{if(run)resize();});
  return {play,close,isOpen:()=>Boolean(run)};
}
