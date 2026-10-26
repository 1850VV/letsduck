// Approved Mock v2: inspect this photographed servo batch inside the stage.
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
export function createHornIdentify({pause}){

const stage=document.getElementById('stage');
const panel=document.createElement('section');panel.id='horn-identify';panel.hidden=true;panel.setAttribute('aria-label','主副舵盘图解');
panel.innerHTML=`<header><b>认一认这两个舵盘</b><button id="hi-close" aria-label="收起舵盘图解">×</button></header><p>先找白色插座的开口，再看它朝哪一侧。</p><div class="hi-tabs"><button data-side="secondary" aria-pressed="true">看副舵盘 · 橙色</button><button data-side="main" aria-pressed="false">看主舵盘 · 蓝色</button></div><div id="hi-canvas"><span id="hi-label">副舵盘 · 插座开口同侧</span></div><p class="hi-key" id="hi-explain">橙色圆盘是副舵盘。白色插座的开口也朝向这一侧。</p><button id="hi-photo-toggle">对照这批实物照片 ↗</button><div id="hi-photos" hidden><figure><img data-src="./assets/horn-reference/secondary.jpg" alt="副舵盘实物照片"><figcaption>副舵盘 · 开口同侧</figcaption></figure><figure><img data-src="./assets/horn-reference/main.jpg" alt="主舵盘实物照片"><figcaption>主舵盘 · 另一侧，不拆</figcaption></figure></div><p class="hi-sub">拖动可旋转。这里用颜色帮助识别，实物不按颜色判断。是否拆副盘，仍按当前 ID 步骤；单只展示不代表关节安装朝向。</p>`;
stage.append(panel);
let renderer,scene,camera,controls,model,aspectFit=1;
const draw=()=>{if(panel.hidden||!renderer)return;renderer.render(scene,camera);};
function resize(){if(!renderer||panel.hidden||document.getElementById('hi-canvas').hidden)return;const host=document.getElementById('hi-canvas'),r=host.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;const fit=Math.max(1,1.3/camera.aspect);camera.position.sub(controls.target).multiplyScalar(fit/aspectFit).add(controls.target);aspectFit=fit;controls.minDistance=.045*fit;controls.maxDistance=.14*fit;camera.updateProjectionMatrix();draw();}
async function init(){
 if(renderer){resize();return;}
 const host=document.getElementById('hi-canvas');renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.prepend(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(36,1,.001,1);camera.position.set(.038,.026,.065);
 controls=new OrbitControls(camera,renderer.domElement);controls.target.set(-.003,0,0);controls.enableDamping=false;controls.minDistance=.045;controls.maxDistance=.14;controls.addEventListener('change',draw);
 scene.add(new THREE.HemisphereLight(0xffffff,0xc1cbe0,2.8));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(.07,.09,.12);scene.add(light);const back=new THREE.DirectionalLight(0xffffff,2);back.position.set(-.07,.03,-.12);scene.add(back);
 try{model=(await new GLTFLoader().loadAsync('./assets/hardware-v2/hd1910-servo.glb')).scene;model.traverse(o=>{if(o.isMesh&&/eight-hole-disc-(front|back)/.test(o.name)){o.material=o.material.clone();o.material.color.set(o.name.endsWith('front')?0xef9a35:0x5977ee);o.material.metalness=.12;o.material.roughness=.48;}});scene.add(model);panel.dataset.modelReady='true';resize();}
 catch(e){document.getElementById('hi-label').textContent='模型未加载，请看下方实物照片';document.getElementById('hi-photos').hidden=false;panel.dataset.modelReady='failed';}
}
function open(){document.getElementById('instruction-dialog').close();pause();document.getElementById('hi-photos').hidden=true;document.getElementById('hi-canvas').hidden=false;panel.hidden=false;panel.dataset.side='secondary';showSide('secondary');init();}
function close(){panel.hidden=true;}
function showSide(side){panel.dataset.side=side;panel.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===side)));document.getElementById('hi-label').textContent=side==='main'?'主舵盘 · 另一侧，始终保留':'副舵盘 · 插座开口同侧';document.getElementById('hi-label').style.color=side==='main'?'#3c58c7':'#a65c0d';document.getElementById('hi-explain').textContent=side==='main'?'蓝色圆盘是主舵盘，在插座开口朝向的另一侧。主舵盘始终不拆。':'橙色圆盘是副舵盘。白色插座的开口也朝向这一侧。';if(camera){camera.position.set(.038,.026,side==='main'?-.065:.065).sub(controls.target).multiplyScalar(aspectFit).add(controls.target);controls.update();draw();}}
panel.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{document.getElementById('hi-photos').hidden=true;document.getElementById('hi-canvas').hidden=false;showSide(b.dataset.side);resize();});document.getElementById('hi-close').onclick=close;document.getElementById('hi-photo-toggle').onclick=()=>{const p=document.getElementById('hi-photos');for(const img of p.querySelectorAll('img'))if(!img.getAttribute('src'))img.src=img.dataset.src;p.hidden=!p.hidden;document.getElementById('hi-canvas').hidden=!p.hidden;resize();};
for(const img of panel.querySelectorAll('img'))img.onerror=()=>{document.getElementById('hi-photo-toggle').hidden=true;document.getElementById('hi-photos').hidden=true;document.getElementById('hi-canvas').hidden=false;resize();};
new ResizeObserver(resize).observe(document.getElementById('hi-canvas'));
function help(){const b=document.createElement('button');b.className='horn-help';b.type='button';b.textContent='?';b.setAttribute('aria-label','什么是主副舵盘？点击在视窗中区分');b.onclick=e=>{e.stopPropagation();open();};return b;}
const entry=document.createElement('button');entry.className='horn-stage-entry';entry.type='button';entry.textContent='主 / 副舵盘  ?';entry.title='插座开口同侧是副舵盘；点击看图解';entry.onclick=open;stage.append(entry);
const guard=document.getElementById('guard-card');function decorate(){const heading=guard.querySelector('b');if(heading&&/舵盘/.test(heading.textContent)&&!heading.querySelector('.horn-help'))heading.append(help());}
const inlineHelp=help();document.querySelector('.checkpoint').append(inlineHelp);
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
// Changing steps ends the identification view; there is no saved business state.
return {sync(step){close();const relevant=/舵盘|主副|插座|镜像|校准/.test(step.title+step.text+step.check)||step.parts.some(id=>/motor|horn/i.test(id));entry.hidden=!relevant;inlineHelp.hidden=!relevant;decorate();}};
}
