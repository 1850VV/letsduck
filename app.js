import * as THREE from 'three';
import { createWorkflowUI, paintTargets, groupPalette } from './color-workflows.mjs';
import { createDuckWorkbench, schemePatch } from './duck-workbench.mjs';
import {createCommunity, designEnvelope} from './community-store.mjs';
import {createFocusWorkspace} from './focus-workspace.mjs';
let focusWorkspace;
let community, draftProvenance=null,draftName='',workflowUI,duckWorkbench,previewIds=null,previewKey='',thumbnailTimer;
const edgeCache=new WeakMap(),thumbnailCache=new Map();
import { OrbitControls } from './assets/vendor/OrbitControls.js';
import { toCreasedNormals } from './assets/vendor/BufferGeometryUtils.js';
import { RoomEnvironment } from './assets/vendor/RoomEnvironment.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STORAGE='duck-studio-v2';
let catalog,products,baseBindings,oceanBindings,draftBindings,exportPlan,exportPayload;

const groupNames={head:'头部与颈部',body:'身体与机舱',legs:'腿部与脚部'};
let data,parts,base,ocean,draft,active='baseline',selected='P2-06',mode='assembly',compareBase='baseline',filter='all',pairLink=false,history=[],lastAction='',explode=0,toastTimer,storageOK=true;
let scene,referenceScene,renderer,camera,controls,meshMap=new Map(),referenceMap=new Map(),plateGroup,hardwareGroup,referenceHardware,outline,drawCount=0;
const canvas=$('#scene'),viewport=$('#viewport'),raycaster=new THREE.Raycaster();
function scheme(){return active==='baseline'?base:active==='ocean'?ocean:workflowUI?.find(active)?.colors||draft;}
function schemeName(){return active==='baseline'?'DeepSeek · 蓝白黑':active==='ocean'?'深海 · 蓝色外壳':workflowUI?.find(active)?.name||'我的方案';}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2300);}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({schema:2,source:data.source_sha256,draft,draftBindings,draftProvenance,draftName,active,pairLink,pairScopeVersion:1,selected,lastAction}));if(workflowUI&&!workflowUI.persist())throw Error('workflow storage');$('#save-status').textContent='耗材方案已保存';storageOK=true;return true;}catch{$('#save-status').textContent='浏览器保存不可用';storageOK=false;return false;}}
function restore(){try{let saved=JSON.parse(localStorage.getItem(STORAGE));if(!saved)saved=JSON.parse(localStorage.getItem('duck-studio-v1'));if(saved?.source===data.source_sha256&&[1,2].includes(saved.schema)&&parts.every(p=>/^#[\da-f]{6}$/i.test(saved.draft?.[p.id]))){draft=Object.fromEntries(parts.map(p=>[p.id,saved.draft[p.id].toUpperCase()]));draftBindings=Object.fromEntries(parts.map(p=>{const id=saved.schema===1?matchingProduct(p,draft[p.id])?.id:saved.draftBindings?.[p.id];const product=products.get(id);return[p.id,product?.series===p.material&&product.hex===draft[p.id]?id:null];}));active=['baseline','ocean','draft'].includes(saved.active)||/^custom-[a-z\d-]+$/i.test(saved.active||'')?saved.active:'baseline';selected=parts.some(p=>p.id===saved.selected)?saved.selected:selected;pairLink=saved.pairScopeVersion===1&&saved.pairLink===true;draftProvenance=saved.draftProvenance||null;draftName=saved.draftName||'';lastAction=saved.lastAction||'';if(saved.schema===1)lastAction='已保留原型配色；未匹配的目标色请选定实际耗材。';}}catch{storageOK=false;}}
function part(){return parts.find(p=>p.id===selected);}
function snapshot(){history.push({draft:{...draft},draftBindings:{...draftBindings},draftProvenance:structuredClone(draftProvenance),draftName,active,lastAction,lockState:duckWorkbench?.getState()});if(history.length>40)history.shift();}
function beginDraft(){if(active!=='draft'){const meta=currentMetadata();draft={...scheme()};draftBindings={...bindings()};draftProvenance=meta.provenance;draftName=schemeName();duckWorkbench?.useContext('draft',meta.locked,true);}active='draft';}
function applyColor(color,productId=null,explicitIds=null){
 if(!/^#[\da-f]{6}$/i.test(color)){toast('请输入六位颜色值，例如 #4D6BFE');return;}
 const requested=explicitIds||paintTargets(parts,selected?[selected]:[],pairLink);
 const ids=duckWorkbench?duckWorkbench.editable(requested):requested;if(!ids.length){toast('这些零件已锁定，请先解锁改色');return;}
 const targetParts=ids.map(id=>parts.find(p=>p.id===id));const p=targetParts[0];
 if(targetParts.some(x=>!x||x.material!==p.material)){toast('请分别选择 PLA 与 TPU，不能跨材料整组替换');return;}
 color=color.toUpperCase();const product=productId?products.get(productId):matchingProduct(p,color);
 if(productId&&(!product||product.series!==p.material||product.hex!==color)){toast('耗材与零件材料或颜色不一致');return;}
 const id=product?.id||null;if(ids.every(key=>scheme()[key].toUpperCase()===color&&bindings()[key]===id))return;
 snapshot();beginDraft();ids.forEach(key=>{draft[key]=color;draftBindings[key]=id;});
 lastAction=`${ids.length>1?'已修改 '+ids.length+' 个零件':p.name} → ${product?product.name+' · '+product.colorCode:color+'（目标色待匹配）'}`;
 persist();refresh();toast(product?'已绑定 '+product.series+' · '+product.colorCode:'目标色已预览，请选择实际耗材');
}
function chooseColor(color,productId=null){if(workflowUI)return workflowUI.chooseColor(color,productId);applyColor(color,productId);}
function resetColors(ids){ids=duckWorkbench?duckWorkbench.editable(ids):ids;if(!ids.length){toast('这些零件已锁定，请先解锁改色');return;}snapshot();beginDraft();for(const id of ids){draft[id]=base[id];draftBindings[id]=baseBindings[id];}lastAction=`已恢复 ${ids.length} 个零件的基准配色`;persist();refresh();}
function selectPart(id,{scroll=false,raw=false,...options}={}){
 if(workflowUI&&!raw)return workflowUI.selectPart(id,{scroll,...options});
 if(selected!==id)$('#product-search').value='';selected=id;refresh();persist();
 if(scroll){const r=$(`[data-part="${id}"]`);r?.scrollIntoView({block:'nearest',behavior:'smooth'});}
}
function escapeHTML(s){const el=document.createElement('span');el.textContent=s;return el.innerHTML.replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function refreshList(){const search=$('#search').value.trim().toLowerCase();let html='';for(const [group,label]of Object.entries(groupNames)){const rows=parts.filter(p=>p.group===group&&(filter==='all'||filter===group)&&(!search||[p.name,p.originalName,p.id].join(' ').toLowerCase().includes(search)));if(!rows.length)continue;html+=`<div class="group-label"><span>${label}</span><span>${rows.length}</span></div>`;for(const p of rows)html+=`<button class="part-row ${(workflowUI?.isSelected(p.id)??selected===p.id)?'active':''}" data-part="${p.id}" aria-label="选择${p.name}" aria-pressed="${workflowUI?.isSelected(p.id)??selected===p.id}"><span class="part-dot" style="background:${scheme()[p.id]}"></span><span class="part-row-name">${p.name}</span><span class="part-code">${p.id}</span></button>`;}$('#part-list').innerHTML=html||'<p style="padding:20px;color:#9aa5b7">没有匹配的零件</p>';}
function refreshEditor(){const p=part();const editing=Boolean(p);$('#selected-name').textContent=p?.name||'选择一个零件';$('#selected-meta').textContent=p?`打印板 ${String(p.plate).padStart(2,'0')}  /  ${p.id}`:'点击模型或左侧零件列表';$('#material').textContent=p?.material||'—';$('#custom-color').disabled=!editing;$('#hex-input').disabled=!editing;$('#apply-hex').disabled=!editing;$('#reset-part').disabled=!editing;const color=p?scheme()[p.id]:'#FFFFFF';$('#custom-color').value=color.toLowerCase();$('#hex-input').value=color.toUpperCase();refreshProducts();$('#last-action').textContent=lastAction||'选一块颜色，开始你的第一个方案。';$('#undo').disabled=!history.length;$('#part-details').innerHTML=p?`<dt>源文件零件名</dt><dd>${escapeHTML(p.originalName)}</dd><dt>唯一实例</dt><dd>${p.id} / ${p.uuid}</dd><dt>来源对象 / 网格</dt><dd>${p.sourceObject} / ${p.sourcePart} · ${p.triangles.toLocaleString()} 个三角面</dd><dt>装配说明</dt><dd>${p.assemblyEvidence.verified===false?'踝轴为示意定位，待实物校准':'参考官方装配模型定位，未验证装配公差'}</dd>`:'';$('#selected-chip').hidden=!p||mode==='compare';$('#selected-chip').textContent=p?`${p.name}  ·  ${p.id}`:'';}
function refreshCards(){
 const configs=[['baseline','DeepSeek','蓝白黑 · 初始方案',base],['ocean','深海','蓝色外壳 · 对比灵感',ocean],['draft','我的方案','自由探索 · 自动保存',draft],...(workflowUI?.getSaved()||[]).map(x=>[x.id,x.name,'自定义 · 已保存',x.colors])];
 $('#scheme-cards').innerHTML=configs.map(([id,title,sub,colors])=>`<button class="scheme-card ${active===id?'active':''}" data-scheme="${id}" aria-label="切换${escapeHTML(title)}方案" aria-pressed="${active===id}"><img class="scheme-preview" data-scheme-preview="${id}" alt="${escapeHTML(title)}整机配色预览"><div class="scheme-colors"><span style="background:${colors['P4-01']}"></span><span style="background:${colors['P2-03']}"></span><span style="background:${colors['P1-03']}"></span></div><div><strong>${escapeHTML(title)}</strong><small>${sub}</small></div>${active===id?'<span class="scheme-check">●</span>':''}</button>`).join('');
 const count=parts.filter(p=>scheme()[p.id].toUpperCase()!==base[p.id].toUpperCase()).length;$('#change-count').textContent=`相对初始方案 · ${count} 个零件改色`;$('#compare-current').textContent=schemeName();
 clearTimeout(thumbnailTimer);if(thumbnailRenderer)refreshThumbnails();else thumbnailTimer=setTimeout(refreshThumbnails,160);
}
function refreshMaterials(){
 if(!scene)return;const reference=workflowUI?.find(compareBase),colors=scheme(),ref=compareBase==='baseline'?base:reference?.colors||ocean,refIds=compareBase==='baseline'?baseBindings:reference?.assignments||oceanBindings;
 for(const p of parts){const m=meshMap.get(p.id),r=referenceMap.get(p.id);m.material.color.set(colors[p.id]);r.material.color.set(ref[p.id]);applyAppearance(m.material,products.get(bindings()[p.id]));applyAppearance(r.material,products.get(refIds[p.id]));m.material.emissive.set('#000000');}
 updateOutline();drawCount++;
}
function refresh(){refreshList();refreshEditor();refreshCards();refreshMaterials();workflowUI?.refresh();duckWorkbench?.refresh();refreshCommunity();focusWorkspace?.refresh();}
function makeGeometry(p,print=false){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(data.binary,print?p.printPositionOffset:p.geometry.positionOffset,p.geometry.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(data.binary,p.geometry.indexOffset,p.geometry.indexCount).slice(),1));const smooth=toCreasedNormals(g,Math.PI/5);g.dispose();smooth.computeBoundingSphere();return smooth;}
function lighting(s){s.add(new THREE.HemisphereLight(0xf1f5ff,0xb6c2d8,2.2));const key=new THREE.DirectionalLight(0xfffbf7,3.2);key.position.set(-160,380,290);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-220;key.shadow.camera.right=220;key.shadow.camera.top=300;key.shadow.camera.bottom=-160;key.shadow.camera.near=1;key.shadow.camera.far=1000;key.shadow.normalBias=.45;key.shadow.bias=-.00015;s.add(key);const fill=new THREE.DirectionalLight(0xdde9ff,1.4);fill.position.set(240,180,-100);s.add(fill);const floor=new THREE.Mesh(new THREE.PlaneGeometry(1200,1200),new THREE.ShadowMaterial({opacity:.09}));floor.rotation.x=-Math.PI/2;floor.position.y=-.6;floor.receiveShadow=true;s.add(floor);const ring=new THREE.Mesh(new THREE.RingGeometry(111,111.4,100),new THREE.MeshBasicMaterial({color:0xc9d4e5,transparent:true,opacity:.35,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.4;s.add(ring);s.userData.floor=floor;s.userData.ring=ring;}
function initScene(){renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;scene=new THREE.Scene();referenceScene=new THREE.Scene();const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=referenceScene.environment=env.texture;scene.environmentIntensity=referenceScene.environmentIntensity=.65;room.dispose();pmrem.dispose();lighting(scene);lighting(referenceScene);camera=new THREE.PerspectiveCamera(31,1,1,4000);controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=150;controls.maxDistance=2000;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,130,18);
 hardwareGroup=new THREE.Group();referenceHardware=new THREE.Group();for(const p of parts){const g=makeGeometry(p);const mat=new THREE.MeshStandardMaterial({color:p.color,roughness:p.material.startsWith('TPU')?.82:.47,metalness:0,envMapIntensity:.65});const m=new THREE.Mesh(g,mat);m.userData.partId=p.id;m.userData.assembly=g;m.userData.print=makeGeometry(p,true);m.castShadow=true;m.receiveShadow=true;meshMap.set(p.id,m);scene.add(m);const r=new THREE.Mesh(g,mat.clone());r.castShadow=true;r.receiveShadow=true;r.userData.partId=p.id;referenceMap.set(p.id,r);referenceScene.add(r);}for(const h of data.hardware){const g=makeGeometry(h),mat=new THREE.MeshStandardMaterial({color:h.color,roughness:.5,metalness:.12});const m=new THREE.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;hardwareGroup.add(m);referenceHardware.add(m.clone());}scene.add(hardwareGroup);referenceScene.add(referenceHardware);plateGroup=new THREE.Group();for(let i=0;i<6;i++){const board=new THREE.Mesh(new THREE.BoxGeometry(258,1,258),new THREE.MeshBasicMaterial({color:0xbecde1,toneMapped:false}));board.position.set((i%3-1)*290,-1,(Math.floor(i/3)-.5)*290);board.receiveShadow=true;plateGroup.add(board);const cv=document.createElement('canvas');cv.width=256;cv.height=48;const ctx=cv.getContext('2d');ctx.fillStyle='#6a7f9e';ctx.font='500 22px sans-serif';ctx.fillText(`PRINT PLATE 0${i+1}`,6,30);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(140,26),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));label.rotation.x=-Math.PI/2;label.position.set((i%3-1)*290,-.2,(Math.floor(i/3)-.5)*290+146);plateGroup.add(label);}plateGroup.visible=false;scene.add(plateGroup);homeView();new ResizeObserver(resize).observe(viewport);resize();let start;canvas.addEventListener('pointerdown',e=>{if(focusWorkspace?.isActive())return;duckWorkbench?.stopRotation();setScopePreview([],null);start=e.button===0?{x:e.clientX,y:e.clientY}:null;});canvas.addEventListener('pointercancel',()=>{start=null;});canvas.addEventListener('pointerup',e=>{const down=start;start=null;if(focusWorkspace?.isActive()||duckWorkbench?.isPresentation()||!down||e.button!==0||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const box=canvas.getBoundingClientRect(),w=box.width/(mode==='compare'?2:1);let x=e.clientX-box.left;const inReference=mode==='compare'&&x<w;if(mode==='compare'&&x>=w)x-=w;const v=new THREE.Vector2(x/w*2-1,-(e.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(v,camera);const hit=raycaster.intersectObjects(pickableObjects(inReference),false)[0];if(hit?.object.userData.partId){const id=inReference?[...referenceMap].find(([,m])=>m===hit.object)[0]:hit.object.userData.partId;workflowUI.handlePartClick(id,{scroll:true,reference:inReference,shiftKey:e.shiftKey,point:{x:e.clientX,y:e.clientY}});}});canvas.addEventListener('pointermove',hoverCanvas);canvas.addEventListener('pointerleave',()=>setScopePreview([],null));animate();}
function resize(){if(!renderer)return;const w=viewport.clientWidth,h=viewport.clientHeight;if(w<=0||h<=0)return;renderer.setSize(w,h,false);if(focusWorkspace?.isActive()){focusWorkspace.resize();return;}camera.aspect=w/h/(mode==='compare'?2:1);camera.updateProjectionMatrix();if(duckWorkbench)frameParts(parts.filter(p=>meshMap.get(p.id).visible).map(p=>p.id));}
function homeView(angle='hero'){if(!camera)return;controls.minDistance=150;controls.enableDamping=false;controls.update();if(mode==='plates'){camera.position.set(0,1220,360);controls.target.set(0,0,0);controls.maxPolarAngle=Math.PI*.49;}else{controls.target.set(0,130,15);if(angle==='front')camera.position.set(0,150,600);else if(angle==='side')camera.position.set(590,160,15);else if(angle==='back')camera.position.set(0,160,-600);else if(angle==='top')camera.position.set(0,760,16);else camera.position.set(360,225,480);controls.maxPolarAngle=Math.PI*.49;if(mode==='compare'&&Number.isFinite(camera.aspect)&&camera.aspect>0&&camera.aspect<.55)camera.position.sub(controls.target).multiplyScalar(.55/camera.aspect).add(controls.target);}controls.update();frameParts(parts.filter(p=>meshMap.get(p.id).visible).map(p=>p.id));controls.enableDamping=true;}
function animate(){requestAnimationFrame(animate);if(!focusWorkspace?.isActive())controls.update();const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();if(focusWorkspace?.isActive()){focusWorkspace.render(renderer);return;}if(mode==='compare'){renderer.setScissorTest(true);renderer.setViewport(0,0,w/2,h);renderer.setScissor(0,0,w/2,h);renderer.render(referenceScene,camera);renderer.setViewport(w/2,0,w/2,h);renderer.setScissor(w/2,0,w/2,h);renderer.render(scene,camera);renderer.setScissorTest(false);}else renderer.render(scene,camera);}
function applyExplode(){for(const p of parts){const m=meshMap.get(p.id),r=referenceMap.get(p.id);const amount=mode==='plates'?0:explode;const c=new THREE.Vector3(...p.center).sub(new THREE.Vector3(0,125,0));if(c.length())c.normalize();m.position.copy(c).multiplyScalar(amount*.7);r.position.copy(m.position);}if(outline)for(const edge of outline.children)edge.position.copy(meshMap.get(edge.userData.partId).position);hardwareGroup.visible=mode!=='plates'&&explode<30&&!duckWorkbench?.getState().isolated;referenceHardware.visible=hardwareGroup.visible;}
function setMode(next){duckWorkbench?.onModeChange();setScopePreview([],null);mode=next;$$('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===mode);b.setAttribute('aria-selected',b.dataset.mode===mode);});for(const m of meshMap.values())m.geometry=mode==='plates'?m.userData.print:m.userData.assembly;plateGroup.visible=mode==='plates';scene.userData.ring.visible=mode!=='plates';referenceScene.userData.ring.visible=true;$('#compare-labels').hidden=mode!=='compare';$('.compare-divider').hidden=mode!=='compare';$('.view-label').hidden=mode==='compare';$('.viewport-tools').style.top=mode==='compare'?'78px':'';$('#explode-control').hidden=mode==='plates';$('#view-title').textContent=mode==='plates'?'六个打印板 · 原始摆放':'整机配色预览';$('#view-hint').textContent=mode==='compare'?'两侧视角同步 · 右侧为当前方案':mode==='plates'?'点击零件换色 · 与整机使用同一份配色':'拖动旋转 · 滚轮缩放 · 点击零件换色';applyExplode();resize();homeView();refresh();}
function bind(){ $('#part-list').addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)workflowUI.handlePartClick(b.dataset.part,{shiftKey:e.shiftKey});});$('#search').addEventListener('input',refreshList);$('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;$$('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));refreshList();});$('#swatches').addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(b){const product=products.get(b.dataset.product);chooseColor(product.hex,product.id);}});$('#custom-color').addEventListener('change',e=>chooseColor(e.target.value));$('#apply-hex').addEventListener('click',()=>chooseColor($('#hex-input').value));$('#hex-input').addEventListener('keydown',e=>{if(e.key==='Enter')chooseColor(e.target.value);});$('#scheme-cards').addEventListener('click',e=>{const b=e.target.closest('[data-scheme]');if(!b)return;workflowUI.switchScheme(b.dataset.scheme);});$('#duplicate').addEventListener('click',()=>{snapshot();const colors={...scheme()},ids={...bindings()};const meta=currentMetadata();draft=colors;draftBindings=ids;draftProvenance=meta.provenance;draftName=schemeName();duckWorkbench.useContext('draft',meta.locked,true);active='draft';lastAction='已复制当前方案，可以自由改色。';persist();refresh();toast('已复制到“我的方案”');});$('#undo').addEventListener('click',()=>{const previous=history.pop();if(!previous)return;({draft,draftBindings,draftProvenance,draftName,active,lastAction}=previous);if(previous.lockState){duckWorkbench.restoreContexts(previous.lockState);duckWorkbench.persist();}else duckWorkbench.useContext(active,workflowUI.find(active)?.locked||[]);persist();refresh();toast('已撤销上一次修改');});$('#reset-part').addEventListener('click',()=>{workflowUI.resetSelection();});$('#clear-selection').addEventListener('click',()=>selectPart(null));$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));$('#front').addEventListener('click',()=>homeView('front'));$('#side').addEventListener('click',()=>homeView('side'));$('#home-view').addEventListener('click',()=>homeView());$('#explode').addEventListener('input',e=>{explode=Number(e.target.value);applyExplode();});$('#compare-base').addEventListener('change',e=>{compareBase=e.target.value;refreshMaterials();});const showInfo=()=>$('#info-dialog').showModal();$('#about').addEventListener('click',showInfo);$('#scope-note').addEventListener('click',showInfo);$('#close-dialog').addEventListener('click',()=>$('#info-dialog').close());$('#info-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)e.target.close();}});$('#export').addEventListener('click',openExport);bindMaterials();}
async function start(){try{const [model,binary,library]=await Promise.all([fetch('./assets/model.json').then(r=>{if(!r.ok)throw Error('model');return r.json();}),fetch('./assets/geometry.bin').then(r=>{if(!r.ok)throw Error('geometry');return r.arrayBuffer();}),fetch('./assets/catalog.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json();})]);catalog=library;products=new Map(catalog.products.map(p=>[p.id,p]));data={...model,binary};parts=data.parts;base=Object.fromEntries(parts.map(p=>[p.id,p.color]));ocean={...base};for(const p of parts){if(p.color==='#FFFFFF'&&['P4-01','P4-03','P5-01','P5-02','P5-06','P5-07','P6-04','P6-05'].includes(p.id))ocean[p.id]='#0056B8';if(p.color==='#0056B8')ocean[p.id]='#FFFFFF';}baseBindings=Object.fromEntries(parts.map(p=>[p.id,matchingProduct(p,base[p.id])?.id||null]));oceanBindings=Object.fromEntries(parts.map(p=>[p.id,matchingProduct(p,ocean[p.id])?.id||null]));draft={...base};draftBindings={...baseBindings};restore();initWorkflows();if(active.startsWith('custom-')&&!workflowUI.find(active))active='draft';initScene();initDuckWorkbench();initFocusWorkspace();community=createCommunity(data,catalog);bind();initCommunityUI();refresh();$('#assembly-evidence').textContent=data.assembly_note;$('#catalog-source').href=catalog.sourceUrl;$('#loading').hidden=true;window.duckStudio={focus:focusWorkspace,getState:()=>({active,selected,mode,pairLink,targets:workflowUI.targets(),colors:{...scheme()},baseline:{...base},draft:{...draft},partCount:parts.length,hardwareCount:data.hardware.length,assignments:{...bindings()},draftBindings:{...draftBindings},catalogCount:catalog.products.length,source:data.source_sha256,provenance:currentMetadata().provenance,draftProvenance,draftName,community:community.getState(),historyLength:history.length,storageOK,...workflowUI.getState(),workbench:duckWorkbench.getState(),visibleIds:parts.filter(p=>meshMap.get(p.id).visible).map(p=>p.id),previewIds:previewIds||[],camera:{position:camera.position.toArray(),target:controls.target.toArray()}}),getPartScreenPosition(id){const m=meshMap.get(id);m.geometry.computeBoundingBox();const v=m.geometry.boundingBox.getCenter(new THREE.Vector3());m.localToWorld(v);v.project(camera);const b=canvas.getBoundingClientRect(),w=b.width/(mode==='compare'?2:1);return{x:b.left+(v.x+1)/2*w+(mode==='compare'?w:0),y:b.top+(-v.y+1)/2*b.height};},getMeshColor:id=>'#'+meshMap.get(id).material.color.getHexString(THREE.SRGBColorSpace),getReferenceMeshColor:id=>'#'+referenceMap.get(id).material.color.getHexString(THREE.SRGBColorSpace),getGeometryCounts:()=>parts.map(p=>({id:p.id,vertices:meshMap.get(p.id).geometry.attributes.position.count,triangles:(meshMap.get(p.id).geometry.index?.count||meshMap.get(p.id).geometry.attributes.position.count)/3})),getVisibleModelBounds:projectedModelBounds,getRendererInfo:()=>({...renderer.info.render}),ready:true};await handleCommunityNavigation();}catch(e){console.error(e);$('#loading').innerHTML='<strong>模型未能载入</strong><small>请通过本地预览地址打开，并使用支持 WebGL 2 的浏览器。</small><button class="button" id="retry-load">重新载入</button>';$('#retry-load').onclick=()=>location.reload();}}
function bindings(){return active==='baseline'?baseBindings:active==='ocean'?oceanBindings:workflowUI?.find(active)?.assignments||draftBindings;}
function matchingProduct(p,hex){return catalog.products.find(product=>product.series===p.material&&product.hex===hex.toUpperCase());}
function applyAppearance(material,product){const translucent=Boolean(product?.alpha<1);if(material.transparent!==translucent)material.needsUpdate=true;material.transparent=translucent;material.opacity=translucent?.68:1;material.depthWrite=!translucent;}
function refreshProducts(){
 const p=part(),work=workflowUI?.getState(),material=workflowUI?.material()||p?.material,product=products.get(work?.workflow==='paint'?work.held.productId:bindings()[p?.id]),search=$('#product-search').value.trim().toLowerCase();
 $('#product-search').disabled=!material;
 const available=catalog.products.filter(x=>x.series===material);
 const favorites=['10100','10604','10101','10603','10200','10400','51103','51105','51601'];
 const visible=available.filter(x=>[x.name,x.nameEn,x.colorCode,x.hex].join(' ').toLowerCase().includes(search)).sort((a,b)=>{const ai=favorites.indexOf(a.colorCode),bi=favorites.indexOf(b.colorCode);return(ai<0?99:ai)-(bi<0?99:bi);});
 $('#catalog-count').textContent=material?`${available.length} 款 · ${material}`:'请选择零件';
 $('#swatches').innerHTML=visible.map(x=>`<button class="swatch ${product?.id===x.id?'active':''}" data-product="${x.id}" aria-label="${x.series} ${x.name} 色号 ${x.colorCode}" aria-pressed="${product?.id===x.id}"><span class="swatch-color" style="background:${x.hex}">${x.alpha<1?'<i>透</i>':''}</span>${escapeHTML(x.name)}<small>${x.colorCode}</small></button>`).join('')||(p?'<span class="empty-products">没有匹配的产品色号</span>':'');
 $('#product-detail').innerHTML=product?`<strong class="bound-product">${escapeHTML(product.name)} <span>已对应实际产品</span></strong><p>产品色号 ${product.colorCode} · Ø ${product.diameter} mm<br>${product.hex}${product.alpha<1?' · 半透明外观示意':''}</p><a href="${product.productUrl}" target="_blank" rel="noreferrer">拓竹官方产品页 ↗</a>`:p?'<strong class="unbound">目标色尚未匹配耗材</strong><p>选定下方产品色号后，才能导出该零件。</p>':'<p>选择零件以查看材料。</p>';
 $('#target-note').textContent=p&&!product?'当前是目标色预览；不会伪装成厂商色号。':'色号来自官方色表；库存和价格未接入。';
 const missing=parts.filter(x=>!bindings()[x.id]).length;
 $('#export').title=missing?`${missing} 个零件需要匹配实际耗材`:'查看耗材清单并导出可编辑 3MF';
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function postAPI(path,payload){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok){let message;try{message=(await r.json()).error;}catch{}throw Error(message||'本地导出服务不可用，请通过“打开原型.command”启动新版工作台。');}return r;}
async function openExport(){
 exportPlan=null;exportPayload={source_sha256:data.source_sha256,name:schemeName(),assignments:{...bindings()}};
 $('#download-3mf').disabled=$('#download-bom').disabled=true;$('#export-status').textContent='';$('#export-summary').textContent='正在核对零件与耗材…';$('#export-products').innerHTML='';$('#export-parts').innerHTML='';$('#export-notes').innerHTML='';$('#export-details').hidden=true;$('#export-dialog').showModal();
 const missing=parts.filter(p=>!bindings()[p.id]);
 if(missing.length){$('#export-summary').textContent=`还有 ${missing.length} 个零件只有目标色，请先选定实际耗材。`;$('#export-products').innerHTML=missing.map(p=>`<button class="resolve-product" data-resolve="${p.id}"><span style="background:${scheme()[p.id]}"></span>${p.name} · ${p.id} →</button>`).join('');return;}
 try{exportPlan=await(await postAPI('/api/plan',exportPayload)).json();const used=exportPlan.slots.filter(s=>s.used);$('#export-summary').innerHTML=`<div class="export-stats"><span><strong>6</strong> 打印板</span><span><strong>35</strong> 零件</span><span><strong>${used.length}</strong> 种耗材</span><span><strong>${exportPlan.slots.length}</strong> 项目槽</span></div>`;
 $('#export-products').innerHTML=used.map(s=>{const p=s.product,rows=exportPlan.parts.filter(r=>r.slot===s.slot);return`<div class="bom-product"><span class="bom-dot" style="background:${p.hex}"></span><div><strong>${p.series} · ${escapeHTML(p.name)}</strong><small>Bambu Lab · 色号 ${p.colorCode} · ${rows.length} 个零件</small></div><a href="${p.productUrl}" target="_blank" rel="noreferrer">产品页 ↗</a></div>`;}).join('');
 $('#export-parts').innerHTML='<table><thead><tr><th>板 / 零件</th><th>耗材</th><th>色号 / 槽</th></tr></thead><tbody>'+exportPlan.parts.map(p=>`<tr><td>${p.id} ${escapeHTML(p.name)}</td><td>${p.product.series} · ${escapeHTML(p.product.name)}</td><td>${p.product.colorCode} / ${p.slot}</td></tr>`).join('')+'</tbody></table>';
 $('#export-notes').innerHTML='<p class="export-preserve">保留原始网格、尺寸、6 板摆放、对象结构与材料参数。原始 4 槽保留，新颜色按原材料模板追加；最多 16 槽。</p><ul>'+exportPlan.warnings.map(w=>`<li>${escapeHTML(w)}</li>`).join('')+'</ul>';
 $('#export-details').hidden=false;$('#download-3mf').disabled=$('#download-bom').disabled=false;
 }catch(error){$('#export-summary').textContent=error.message;}
}
function captureThumbnails(){
 const output={},r=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});r.setSize(512,512);r.outputColorSpace=THREE.SRGBColorSpace;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=renderer.toneMappingExposure;r.setClearColor(0xf4f6fa,1);
 const s=new THREE.Scene();s.environment=scene.environment;s.environmentIntensity=.65;lighting(s);s.userData.ring.visible=false;s.userData.floor.visible=false;const cam=new THREE.PerspectiveCamera(36,1,.1,3000),clones=[];
 try{
  for(const p of parts){const m=meshMap.get(p.id),clone=new THREE.Mesh(m.userData.assembly,m.material.clone());clone.material.color.set(products.get(exportPayload.assignments[p.id]).hex);s.add(clone);clones.push([p,clone]);}
  const hardware=hardwareGroup.clone();hardware.visible=true;s.add(hardware);cam.position.set(330,225,460);cam.lookAt(0,130,12);r.render(s,cam);output.cover=r.domElement.toDataURL('image/png');s.remove(hardware);
  const plate=new THREE.Mesh(new THREE.BoxGeometry(258,.5,258),new THREE.MeshStandardMaterial({color:0xe0e6f0,roughness:1}));plate.position.y=-1;s.add(plate);
  for(let i=1;i<=6;i++){
   const cx=((i-1)%3-1)*290,cz=(Math.floor((i-1)/3)-.5)*290;
   for(const [p,m]of clones){m.visible=p.plate===i;m.geometry=meshMap.get(p.id).userData.print;m.position.set(-cx,0,-cz);}
   cam.position.set(240,440,300);cam.up.set(0,1,0);cam.lookAt(0,6,0);r.render(s,cam);output['plate'+i]=r.domElement.toDataURL('image/png');
   cam.position.set(0,465,.001);cam.up.set(0,0,-1);cam.lookAt(0,0,0);r.render(s,cam);output['top'+i]=r.domElement.toDataURL('image/png');
  }
  plate.geometry.dispose();plate.material.dispose();return output;
 }finally{for(const [,m]of clones)m.material.dispose();for(const item of [s.userData.floor,s.userData.ring]){item.geometry.dispose();item.material.dispose();}r.dispose();r.forceContextLoss();}
}
function bindMaterials(){
 $('#product-search').addEventListener('input',refreshProducts);
 $('#close-export').addEventListener('click',()=>$('#export-dialog').close());
 $('#export-products').addEventListener('click',e=>{const b=e.target.closest('[data-resolve]');if(b){$('#export-dialog').close();selectPart(b.dataset.resolve,{scroll:true});}});
 $('#download-bom').addEventListener('click',()=>{if(!exportPlan)return;const rows=[['零件编号','板','零件名称','原始名称','材料','品牌','产品色名','产品色号','直径mm','色值','耗材槽','原始预设','官方产品链接','实例UUID'],...exportPlan.parts.map(p=>[p.id,p.plate,p.name,p.originalName,p.product.series,p.product.brand,p.product.name,p.product.colorCode,p.product.diameter,p.product.hex,p.slot,p.product.preset,p.product.productUrl,p.uuid])];const csv='\ufeff'+rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),'XGO-Duck-materials-BOM.csv');});
 $('#download-3mf').addEventListener('click',async()=>{if(!exportPlan)return;const button=$('#download-3mf'),exportName=active;button.disabled=true;$('#export-status').textContent='正在渲染最新板图并校验文件…';try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const thumbnails=captureThumbnails();const response=await postAPI('/api/export',{...exportPayload,thumbnails});downloadBlob(await response.blob(),'XGO-Duck-'+exportName+'-materials.3mf');$('#export-status').textContent='已生成并开始下载：35 个零件分配已核对，原始网格与 6 板结构保持不变。请在切片器中复核后切片。';toast('改色 3MF 已生成');}catch(error){$('#export-status').textContent=error.message;}finally{button.disabled=false;}});
}

function partScreenPosition(id){
 const m=meshMap.get(id);if(!m||!camera)return null;m.geometry.computeBoundingBox();const v=m.geometry.boundingBox.getCenter(new THREE.Vector3());m.localToWorld(v);v.project(camera);const b=canvas.getBoundingClientRect(),w=b.width/(mode==='compare'?2:1);return{x:b.left+(v.x+1)/2*w+(mode==='compare'?w:0),y:b.top+(-v.y+1)/2*b.height};
}
function initWorkflows(){
 workflowUI=createWorkflowUI({
  getState:()=>({parts,catalog,products,colors:scheme(),assignments:bindings(),active,selected,pairLink,source:data.source_sha256,...currentMetadata()}),
  escapeHTML,toast,persist,refresh,screenPosition:partScreenPosition,setPairLink:value=>{pairLink=Boolean(value);},
  selectRaw:(id,scroll=false)=>selectPart(id,{raw:true,scroll}),
  apply:(ids,color,productId)=>applyColor(color,productId,ids),reset:resetColors,
  activate:(id,{resetLocks=false}={})=>{duckWorkbench?.useContext(id,workflowUI.find(id)?.locked||[],resetLocks);active=id;persist();refresh();},clearHistory:()=>{history=[];},
  keepAsDraft:entry=>{draft={...entry.colors};draftBindings={...entry.assignments};draftProvenance=entry.provenance||null;draftName=entry.name;duckWorkbench.useContext('draft',entry.locked,true);active='draft';},
  setCompare:id=>{compareBase=id;refreshMaterials();},onSaved:()=>{focusWorkspace?.onSaved();if(publishAfterSave)openCommunityPublish();}
 });
}

function projectedModelBounds(){
 const bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};camera.updateMatrixWorld(true);
 for(const m of meshMap.values()){if(!m.visible)continue;m.geometry.computeBoundingBox();m.updateMatrixWorld(true);const b=m.geometry.boundingBox;
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){const v=new THREE.Vector3(x,y,z).applyMatrix4(m.matrixWorld).project(camera);bounds.minX=Math.min(bounds.minX,v.x);bounds.maxX=Math.max(bounds.maxX,v.x);bounds.minY=Math.min(bounds.minY,v.y);bounds.maxY=Math.max(bounds.maxY,v.y);}}
 return bounds;
}
function pickableObjects(reference=false){
 const meshes=[...(reference?referenceMap:meshMap).values()].filter(m=>m.visible);
 const hardware=reference?referenceHardware:hardwareGroup;
 return hardware.visible?[...meshes,...hardware.children]:meshes;
}
function updateOutline(){
 if(!scene)return;
 if(outline){scene.remove(outline);outline.children.forEach(o=>o.material.dispose());outline=null;}
 if(mode==='compare'||duckWorkbench?.isPresentation())return;
 const ids=previewIds||workflowUI?.targets()||[];
 if(!ids.length)return;outline=new THREE.Group();
 for(const id of ids){const m=meshMap.get(id);if(!m)continue;let geometry=edgeCache.get(m.geometry);if(!geometry){geometry=new THREE.EdgesGeometry(m.geometry,28);edgeCache.set(m.geometry,geometry);}
  const locked=duckWorkbench?.isLocked(id),edge=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:locked?'#c88b35':previewIds?'#20a9ab':'#647ff5',transparent:true,opacity:.82,depthTest:true}));
  edge.position.copy(m.position);edge.visible=m.visible;edge.userData.partId=id;outline.add(edge);
 }scene.add(outline);
}
function setScopePreview(ids,label){
 if(!scene)return;
 const next=ids?.length&&!duckWorkbench?.isPresentation()?[...new Set(ids)]:null,key=JSON.stringify([next,label]);if(key===previewKey)return;
 previewKey=key;previewIds=next;const hint=$('#scope-preview');
 if(hint){hint.hidden=!next;const available=next?(duckWorkbench?.editable(next)||next).length:0;hint.textContent=next?`${label||'影响范围'} · ${available} 件可改${available<next.length?' · '+(next.length-available)+' 件锁定保留':''}`:'';}
 updateOutline();
}
function hoverCanvas(e){
 if(focusWorkspace?.isActive()||e.buttons||duckWorkbench?.isPresentation())return;
 const box=canvas.getBoundingClientRect(),w=box.width/(mode==='compare'?2:1),left=e.clientX-box.left,inReference=mode==='compare'&&left<w,x=left%w;
 raycaster.setFromCamera(new THREE.Vector2(x/w*2-1,-(e.clientY-box.top)/box.height*2+1),camera);
 const hit=raycaster.intersectObjects(pickableObjects(inReference),false)[0],id=hit?.object.userData.partId;
 canvas.style.cursor=id?'pointer':'grab';
 if(!id||mode==='compare'){setScopePreview([],null);return;}
 const p=parts.find(p=>p.id===id),work=workflowUI.getState();
 if(work.workflow==='paint'&&work.tool==='paint'&&work.held.material!==p.material){setScopePreview([id],p.name);$('#scope-preview').textContent=`${p.name} · 请先拿起 ${p.material} 的颜色`;return;}
 setScopePreview(paintTargets(parts,[id],pairLink),p.name);
}
function setPartVisibility(ids){
 const visible=ids?new Set(ids):null;
 for(const p of parts){meshMap.get(p.id).visible=referenceMap.get(p.id).visible=!visible||visible.has(p.id);}
 hardwareGroup.visible=referenceHardware.visible=!visible&&mode!=='plates'&&explode<30;
 if(outline)for(const line of outline.children)line.visible=meshMap.get(line.userData.partId).visible;
}
function frameParts(ids){
 if(!ids.length||!camera||!Number.isFinite(camera.aspect)||camera.aspect<=0)return;
 const box=new THREE.Box3();for(const id of ids){const m=meshMap.get(id);if(m){m.updateMatrixWorld(true);box.expandByObject(m);}}
 if(box.isEmpty())return;
 const center=box.getCenter(new THREE.Vector3()),direction=camera.position.clone().sub(controls.target).normalize();
 const right=new THREE.Vector3().crossVectors(camera.up,direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2),tanH=tanV*camera.aspect;let distance=55;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const point=new THREE.Vector3(x,y,z).sub(center);
  distance=Math.max(distance,point.dot(direction)+1.17*Math.max(Math.abs(point.dot(right))/tanH,Math.abs(point.dot(up))/tanV));
 }
 if(!Number.isFinite(distance)||!Number.isFinite(tanH)||tanH<=0||!direction.toArray().every(Number.isFinite)||direction.lengthSq()===0)return;
 controls.maxDistance=Math.max(2000,distance*2);camera.far=Math.max(4000,distance+box.getSize(new THREE.Vector3()).length()*2);camera.updateProjectionMatrix();
 const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.update();controls.enableDamping=damping;
}
function focusParts(ids){if(!ids.length)return;duckWorkbench.stopRotation();controls.minDistance=25;frameParts(ids);}
function applyTheme(id,ids){
 const design=allDesigns().find(d=>d.id===id);if(!design)return;
 const patch=schemePatch(parts,ids,duckWorkbench.getState().locked,design,products),changed=Object.keys(patch.colors).filter(key=>scheme()[key]!==patch.colors[key]||bindings()[key]!==patch.assignments[key]);
 if(!changed.length){toast('这些部位已是该方案的颜色，或已锁定');return;}
 snapshot();beginDraft();for(const key of changed){draft[key]=patch.colors[key];draftBindings[key]=patch.assignments[key];}
 lastAction=`从「${design.name}」取色 · 修改 ${changed.length} 件，保留锁定部位`;persist();refresh();toast(lastAction);
}
function allDesigns(){return [{id:'baseline',name:'DeepSeek · 蓝白黑',colors:base,assignments:baseBindings},{id:'ocean',name:'深海 · 蓝色外壳',colors:ocean,assignments:oceanBindings},...workflowUI.getSaved()];}
function initDuckWorkbench(){
 duckWorkbench=createDuckWorkbench({getState:()=>({parts,active,source:data.source_sha256,colors:scheme(),mode,...workflowUI.getState(),targets:workflowUI.targets(),designs:allDesigns()}),escapeHTML,toast,refresh,
  selectSet:(ids,label,options)=>workflowUI.selectSet(ids,label,options),selectPart:id=>workflowUI.selectPart(id,{single:true}),preview:setScopePreview,
  setVisibility:setPartVisibility,focus:focusParts,view:angle=>{duckWorkbench.stopRotation();homeView(angle);},
  rotate:value=>{controls.autoRotate=value;controls.autoRotateSpeed=1.4;},closePopup:()=>workflowUI.closePopup(),applyTheme,
  resetView:()=>{explode=0;$('#explode').value='0';applyExplode();homeView();},saveView:saveShowcase});
 $('#project-colors').addEventListener('pointerover',e=>{const b=e.target.closest('[data-palette-index]');if(!b)return;const group=groupPalette(parts,scheme(),bindings())[Number(b.dataset.paletteIndex)];setScopePreview(group.ids,'项目用色');});
 $('#project-colors').addEventListener('pointerleave',()=>setScopePreview([],null));
 for(const id of ['quick-colors','context-colors','swatches']){const el=$('#'+id);el.addEventListener('pointerover',()=>{if(workflowUI.getState().workflow!=='paint')setScopePreview(workflowUI.targets(),'这次改色的范围');});el.addEventListener('pointerleave',()=>setScopePreview([],null));}
}
function initFocusWorkspace(){
 focusWorkspace=createFocusWorkspace({canvas,viewport,meshes:meshMap,hardware:hardwareGroup,environment:scene.environment,controls,escapeHTML,toast,resize,
  getState:()=>({parts,catalog,source:data.source_sha256,selected,colors:scheme(),assignments:bindings(),pairLink,historyLength:history.length}),
  select:id=>workflowUI.selectPart(id,{open:false}),
  apply:(ids,color,productId)=>applyColor(color,productId,ids),
  setPair:value=>{pairLink=value;persist();refresh();},isLocked:id=>duckWorkbench.isLocked(id),
  toggleLock:()=>$('#lock-selection').click(),undo:()=>$('#undo').click(),save:()=>workflowUI.openSave(),
  prepare:()=>{if(duckWorkbench.isPresentation())$('#exit-presentation').click();duckWorkbench.stopRotation();workflowUI.closePopup();setScopePreview([],null);},
  finish:()=>{setMode('assembly');refresh();resize();}
 });
}
let thumbnailRenderer,thumbnailScene,thumbnailCamera,thumbnailMeshes;
function refreshThumbnails(){
 if(!renderer)return;
 if(!thumbnailRenderer){
  thumbnailRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true});thumbnailRenderer.setSize(220,150);thumbnailRenderer.setClearColor(0xf3f5f9,1);thumbnailRenderer.outputColorSpace=THREE.SRGBColorSpace;thumbnailRenderer.toneMapping=renderer.toneMapping;thumbnailRenderer.toneMappingExposure=renderer.toneMappingExposure;
  thumbnailScene=new THREE.Scene();thumbnailScene.environment=scene.environment;thumbnailScene.environmentIntensity=.65;lighting(thumbnailScene);thumbnailScene.userData.ring.visible=false;
  thumbnailCamera=new THREE.PerspectiveCamera(35,220/150,1,2000);thumbnailCamera.position.set(355,220,475);thumbnailCamera.lookAt(0,135,15);
  thumbnailMeshes=parts.map(p=>{const original=meshMap.get(p.id),m=new THREE.Mesh(original.userData.assembly,original.material.clone());thumbnailScene.add(m);return [p,m];});const hardware=hardwareGroup.clone();hardware.visible=true;thumbnailScene.add(hardware);
 }
 for(const design of [...allDesigns(),{id:'draft',colors:draft,assignments:draftBindings}]){
  const image=$(`[data-scheme-preview="${design.id}"]`);if(!image)continue;
  const key=JSON.stringify([design.colors,design.assignments]);let url=thumbnailCache.get(key);
  if(!url){for(const [p,m]of thumbnailMeshes){m.material.color.set(design.colors[p.id]);applyAppearance(m.material,products.get(design.assignments[p.id]));}thumbnailRenderer.render(thumbnailScene,thumbnailCamera);url=thumbnailRenderer.domElement.toDataURL('image/png');thumbnailCache.set(key,url);if(thumbnailCache.size>40)thumbnailCache.delete(thumbnailCache.keys().next().value);}
  image.src=url;
 }
}
function saveShowcase(){
 duckWorkbench.stopRotation();setScopePreview([],null);const hidden=outline?.visible;if(outline)outline.visible=false;
 try{
  const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);renderer.clear();
  if(mode==='compare'){renderer.setScissorTest(true);renderer.setViewport(0,0,w/2,h);renderer.setScissor(0,0,w/2,h);renderer.render(referenceScene,camera);renderer.setViewport(w/2,0,w/2,h);renderer.setScissor(w/2,0,w/2,h);renderer.render(scene,camera);renderer.setScissorTest(false);}else renderer.render(scene,camera);
  const image=document.createElement('canvas');image.width=canvas.width;image.height=canvas.height+120;const ctx=image.getContext('2d');ctx.fillStyle='#f4f6fa';ctx.fillRect(0,0,image.width,image.height);ctx.drawImage(canvas,0,0);ctx.fillStyle='#24344f';ctx.font='24px sans-serif';ctx.fillText('XGO Duck V2 · '+schemeName(),24,image.height-72);
  ctx.font='16px sans-serif';const label=mode==='compare'?`左：${allDesigns().find(d=>d.id===compareBase)?.name} / 右：${schemeName()}`:mode==='plates'?'6 个打印板 · 当前配色':duckWorkbench.getState().isolated?'选中部位展示':'整机外观预览';ctx.fillText(label+' · 屏幕颜色仅供参考',24,image.height-42);ctx.fillText('装配参考定位，未验证实物公差',24,image.height-17);
  image.toBlob(blob=>{if(blob){downloadBlob(blob,'XGO-Duck-'+mode+'-preview.png');toast('已保存当前展示图');}},'image/png');
 }finally{if(outline)outline.visible=hidden;}
}
start();

// Community integration uses the existing editor and its private scheme library.
let publishAfterSave=false,publishSnapshot=null;
function currentMetadata(){return {provenance:structuredClone(active==='draft'?draftProvenance:workflowUI?.find(active)?.provenance||null),locked:duckWorkbench?.getState().locked||[]};}
function refreshCommunity(){
 const el=$('#community-context');if(!el)return;
 const source=currentMetadata().provenance;
 el.innerHTML=`<span>${active.startsWith('custom-')?'私有方案 · '+escapeHTML(schemeName()):active==='draft'?'私有草稿':'初始方案'}${source?` · 引用自 <a href="./community-prototype/#detail/${encodeURIComponent(source.derivedFromVersionId)}">《${escapeHTML(source.sourceTitle||'来源方案')}》 · ${escapeHTML(source.sourceAuthor)}</a>`:''}</span><a href="./community-prototype/#mine">我的方案 ↗</a>`;
}
function initCommunityUI(){
 $('.header-actions').insertAdjacentHTML('afterbegin','<a id="community-link" class="button community-link" href="./community-prototype/">配色广场</a><button id="publish-community" class="button">模拟发布</button>');
 $('.workspace-heading').insertAdjacentHTML('beforebegin','<div class="community-demo">社区集成原型 · 演示身份 · 作品与评分仅存本机</div><div id="community-context"></div>');
 document.body.insertAdjacentHTML('beforeend',`<dialog id="community-import-dialog"><form method="dialog"><div class="dialog-head"><h2>先保留已有草稿</h2><button class="icon-button" value="cancel" aria-label="取消带入">×</button></div><p>将现有草稿与原锁定状态保存为私有方案，再创建社区配色的完整副本。已有方案和原作者作品都会保留。</p><p id="community-import-status" role="status"></p><div class="export-actions"><button class="button" value="cancel">取消</button><button class="button subtle" value="continue">保存当前草稿并继续</button></div></form></dialog>
 <dialog id="community-publish-dialog"><form id="community-publish-form"><div class="dialog-head"><h2>发布到演示广场</h2><button type="button" class="icon-button" id="close-community-publish" aria-label="关闭发布">×</button></div><img id="community-publish-preview" alt="当前私有方案的真实模型预览"><div id="community-publish-palette"></div><label class="settings-field">方案名称<input id="community-publish-title" required maxlength="40"></label><label class="settings-field">设计说明<textarea id="community-publish-description" maxlength="240" rows="3"></textarea></label><p id="community-publish-source"></p><label class="settings-check"><input type="checkbox" id="community-publish-consent" required>允许其他人引用此发布版本，继续修改配色。</label><p>模拟发布仅在本机可见。发布后保留此版本快照；再次发布会创建新版本，评分从零开始。</p><p id="community-publish-status" role="status"></p><button type="submit" class="button subtle">确认模拟发布</button></form></dialog>`);
 $('#publish-community').onclick=openCommunityPublish;
 $('#close-community-publish').onclick=()=>$('#community-publish-dialog').close();
 $('#scheme-save-dialog').addEventListener('close',()=>{if(!workflowUI.find(active))publishAfterSave=false;});
 $('#community-publish-form').onsubmit=e=>{e.preventDefault();try{
  if(!publishSnapshot)throw Error('请重新打开发布预览。');
  const result=community.publish(publishSnapshot,{title:$('#community-publish-title').value,description:$('#community-publish-description').value,consent:$('#community-publish-consent').checked});
  $('#community-publish-dialog').close();location.href='./community-prototype/#detail/'+encodeURIComponent(result.id);
 }catch(error){$('#community-publish-status').textContent=error.message;}};
}
function openCommunityPublish(){
 const saved=workflowUI.find(active);
 if(!saved){publishAfterSave=true;workflowUI.openSave();toast('先保存私有方案，再预览并确认模拟发布。');return;}
 publishAfterSave=false;publishSnapshot=designEnvelope(data,{...structuredClone(saved),provenance:currentMetadata().provenance});
 if(!community.validate(publishSnapshot)){toast('请先为全部 35 件匹配实际耗材，再模拟发布。');return;}
 refreshThumbnails();$('#community-publish-preview').src=$(`[data-scheme-preview="${active}"]`)?.src||canvas.toDataURL('image/png');
 $('#community-publish-palette').innerHTML=[...new Set(Object.values(saved.colors))].map(color=>`<i style="background:${color}"></i>`).join('');
 $('#community-publish-title').value=saved.name;$('#community-publish-description').value='';$('#community-publish-consent').checked=false;$('#community-publish-status').textContent='';
 const source=saved.provenance;$('#community-publish-source').textContent=source?`来源：《${source.sourceTitle}》 · ${source.sourceAuthor}，发布时自动保留。`:'35 件完整配色 · 已保存的私有方案';
 $('#community-publish-dialog').showModal();
}
async function handleCommunityNavigation(){
 const params=new URLSearchParams(location.search),requestId=params.get('communityFork'),schemeId=params.get('scheme');
 if(requestId){
  try{
   const request=community.pending(),copyId='custom-'+requestId;
   if(!request||request.id!==requestId){if(workflowUI.find(copyId)){workflowUI.switchScheme(copyId);toast('已打开之前创建的副本，不会重复计数。');}else throw Error('带入请求已失效，请从广场重新选择方案。');}
   else{
    if(!community.validate(request.design))throw Error('模型、35 件映射或耗材不兼容，未切换草稿。');
    const draftLocks=active==='draft'?duckWorkbench.getState().locked:duckWorkbench.contextLocks('draft');
    const hasDraft=parts.some(p=>draft[p.id]!==base[p.id]||draftBindings[p.id]!==baseBindings[p.id])||draftLocks.length||draftProvenance;
    if(hasDraft){const dialog=$('#community-import-dialog');dialog.returnValue='cancel';dialog.showModal();const result=await new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue),{once:true}));if(result!=='continue'){toast('已取消带入，原草稿保留。');window.history.replaceState(null,'',location.pathname);return;}}
    const keys=[STORAGE,'duck-studio-workflows-v1','duck-studio-xgo-workbench-v1','duck-studio-community-v1'];
    const previousStorage=keys.map(key=>[key,localStorage.getItem(key)]),previousSaved=structuredClone(workflowUI.getSaved()),previousActive=active,previousLocks=duckWorkbench.getState(),previousHistory=history,previousAction=lastAction;
    try{
     const entries=[];
     if(hasDraft)entries.push({id:'custom-backup-'+requestId,name:(draftName||'原草稿')+' · 带入前保留',colors:{...draft},assignments:{...draftBindings},provenance:structuredClone(draftProvenance),locked:draftLocks});
     entries.push({id:copyId,name:(request.design.title||'社区配色')+' · 我的改版',colors:{...request.design.colors},assignments:{...request.design.assignments},provenance:request.source,locked:[]});
     workflowUI.addSaved(entries);
     if(!duckWorkbench.useContext(copyId,[],true))throw Error('副本锁定状态保存失败。');
     active=copyId;history=[];lastAction='已创建完整的 35 件私有副本，原方案保持不变。';
     if(!persist())throw Error('草稿保存失败，未完成带入。');
     community.completeFork(requestId,copyId);refresh();toast(lastAction);
    }catch(error){
     active=previousActive;history=previousHistory;lastAction=previousAction;workflowUI.replaceSaved(previousSaved);duckWorkbench.restoreContexts(previousLocks);
     for(const [key,value]of previousStorage){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}}
     refresh();throw error;
    }
   }
  }catch(error){toast(error.message);$('#community-context').textContent=error.message;}
 }else if(schemeId){if(workflowUI.find(schemeId))workflowUI.switchScheme(schemeId);else toast('没有找到这套私有方案；当前草稿保留。');}
 if(params.has('publish'))openCommunityPublish();
 if(location.search)window.history.replaceState(null,'',location.pathname);
}
