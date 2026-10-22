import * as THREE from 'three';
import {paintTargets} from './color-workflows.mjs';
import {detailRegion,gridSlots,hexToHsv,hsvToHex} from './focus-rules.mjs';

// One renderer, camera and scene. Copies share immutable source geometry and the
// original part material; only their display transforms belong to this workspace.
export function createFocusWorkspace(api){
  const {canvas,viewport,meshes,hardware}=api,$=s=>document.querySelector(s),esc=api.escapeHTML;
  const state=api.getState,parts=state().parts,partMap=new Map(parts.map(p=>[p.id,p]));
  const scene=new THREE.Scene();scene.environment=api.environment;scene.environmentIntensity=.65;
  scene.add(new THREE.HemisphereLight(0xf1f5ff,0xb6c2d8,2.2));
  const key=new THREE.DirectionalLight(0xfffbf7,3.2);key.position.set(-300,600,900);scene.add(key);
  const fill=new THREE.DirectionalLight(0xdde9ff,1.4);fill.position.set(500,100,-400);scene.add(fill);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,1,6000);camera.position.z=2500;
  const owners={};for(const id of ['whole','detail']){
    const root=new THREE.Group(),content=new THREE.Group();root.add(content);scene.add(root);
    owners[id]={root,content,map:new Map(),layout:'assembly',zoom:1,offset:{x:0,y:0},rotation:[.13,.55,0],ids:[],name:id==='whole'?'整机':'部件',size:new THREE.Vector3()};
  }
  let rotationLinked=true;const viewMemory={whole:{},detail:{}};
  let active=false,tool='select',held=null,hsv={h:225,s:.7,v:1},regionKey='',single=false,lastOwner='whole',gesture=null,swapped=false,pendingSave=false,hoverId=null;
  const edges=new Map(),highlights=[],ray=new THREE.Raycaster(),KEY='duck-focus-layout-v1';
  let palettePosition=null,collapsed=false;
  viewport.insertAdjacentHTML('beforeend',`<section id="focus-ui" hidden aria-label="单视窗专注涂装">
    <div class="focus-top"><button id="focus-back">← 基础涂装</button><strong>专注涂装 <span>XGO Duck V2</span></strong><div><button id="focus-reset">复位摆放</button><button id="focus-swap">交换位置</button><button id="focus-save" class="primary">命名保存并返回 ↗</button></div></div>
    <div class="focus-tools" role="group" aria-label="专注涂装工具"><button data-focus-tool="select">选择 V</button><button data-focus-tool="paint">点涂 B</button><button data-focus-tool="sample">吸管 I</button><i></i><button id="focus-undo">↶ 撤销</button><button id="focus-link" aria-pressed="true">联动旋转 · 开</button><label>整机<select id="focus-layout" aria-label="整机展开方式"><option value="assembly">组装</option><option value="explode">散开</option><option value="array">排列</option></select></label><input id="focus-spread" type="range" min="0" max="150" value="65" aria-label="散开距离" hidden></div>
    <div class="focus-object-label" id="focus-whole-label"><button class="focus-handle" data-move="whole" title="拖动移动整机">⠿ <strong>整机</strong></button><button data-reset-object="whole" aria-label="复位整机角度">↺</button></div>
    <div class="focus-object-label" id="focus-detail-label"><button class="focus-handle" data-move="detail" title="拖动移动部件副本">⠿ <strong id="focus-region-name">部件</strong></button><select id="focus-detail-layout" aria-label="部件展开方式"><option value="assembly">组装</option><option value="explode">散开</option><option value="array">排列</option></select><button data-reset-object="detail" aria-label="复位部件角度">↺</button></div>
    <div id="focus-array-labels"></div><div id="focus-mode-dock" role="group" aria-label="整机展示快捷切换"><div class="mode-segments"><button data-quick-layout="assembly">组装 <kbd>1</kbd></button><button data-quick-layout="explode">散开 <kbd>2</kbd></button><button data-quick-layout="array">排列 <kbd>3</kbd></button></div><button id="focus-return-assembly">收回整机 ↩</button></div>
    <div class="focus-part-picker"><select id="focus-part" aria-label="专注选择零件">${parts.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.id}</option>`).join('')}</select><label><input type="checkbox" id="focus-single">只展示此件</label></div>
    <aside id="focus-palette" aria-label="浮动调色盘"><div class="focus-palette-head"><button class="focus-handle" data-move="palette">⠿ 调色盘</button><button id="focus-collapse" aria-label="收起调色盘" aria-expanded="true">−</button></div><div id="focus-palette-body">
      <div class="focus-part-summary"><strong id="focus-part-name"></strong><span id="focus-part-material"></span><button id="focus-lock">锁定</button></div>
      <div class="focus-scope"><label><input id="focus-pair" type="checkbox">同步对应件</label><small id="focus-scope-note"></small></div>
      <div id="focus-sv" role="slider" tabindex="0" aria-label="饱和度与明度，左右调整饱和度，上下调整明度"><span></span></div>
      <input id="focus-hue" type="range" min="0" max="360" value="225" aria-label="色相">
      <div class="focus-hex-row"><i id="focus-held-chip"></i><input id="focus-hex" maxlength="7" aria-label="专注颜色 HEX"><button id="focus-take-hex" aria-label="拿起目标色">拿色</button></div>
      <p id="focus-held-note" role="status"></p>
      <div class="focus-palette-heading"><strong>项目用色</strong><select id="focus-material" aria-label="专注点涂材料"><option>PLA Basic</option><option>TPU 90A</option></select></div><div id="focus-project-colors" class="focus-swatches"></div>
      <details id="focus-filaments"><summary>真实耗材 <span id="focus-product-count"></span></summary><input id="focus-product-search" type="search" placeholder="搜索颜色 / 色号" aria-label="专注搜索耗材"><div id="focus-products" class="focus-products"></div></details>
      <button id="focus-apply" class="focus-apply">涂到选中零件</button>
    </div></aside>
    <div class="focus-bottom"><span id="focus-status" role="status"></span><span>拖模型旋转 · 拖名称移动 · 滚轮缩放</span></div>
  </section>`);
  $('#presentation').before(Object.assign(document.createElement('button'),{id:'focus-enter',textContent:'专注涂装 ↗'}));
  const ui=$('#focus-ui'),palette=$('#focus-palette');

  function build(owner,ids){
    const o=owners[owner];o.content.clear();o.map.clear();o.ids=[...ids];
    for(const id of ids){const original=meshes.get(id),m=new THREE.Mesh(original.userData.assembly,original.material);m.userData={partId:id,owner};o.content.add(m);o.map.set(id,m);}
    if(owner==='whole'){
      o.hardware=hardware.clone();o.hardware.visible=true;o.hardware.traverse(m=>{m.userData={owner};});o.content.add(o.hardware);
    }
    layout(owner); // No .translate(), .rotate() or attribute writes on source geometry.
  }
  function layout(owner){
    const o=owners[owner],slots=gridSlots(o.ids.length,owner==='whole'?1.2:.9),amount=Number($('#focus-spread').value);
    o.content.position.set(0,0,0);o.root.position.set(0,0,0);o.root.scale.setScalar(1);o.root.rotation.set(0,0,0);o.root.updateMatrixWorld(true);
    o.ids.forEach((id,index)=>{
      const m=o.map.get(id);m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.setScalar(1);m.geometry.computeBoundingBox();
      const center=m.geometry.boundingBox.getCenter(new THREE.Vector3());
      if(o.layout==='explode'){
        const p=partMap.get(id),direction=center.clone().sub(new THREE.Vector3(0,125,0));
        if(direction.lengthSq()<.01)direction.set(index%2?1:-1,0,1);
        m.position.copy(direction.normalize().multiplyScalar(amount*(owner==='whole'?1:.6)));
        // Same direction as the original assembled mesh; no print transforms used.
        if(p.material.startsWith('TPU'))m.position.multiplyScalar(1.12);
      }else if(o.layout==='array'){
        m.rotation.set(.35,.35,0);m.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(m),size=box.getSize(new THREE.Vector3());
        const scale=110/Math.max(size.x,size.y,size.z,1);
        m.scale.setScalar(scale);
        const rotated=center.clone().applyEuler(m.rotation).multiplyScalar(scale);
        m.position.set(slots[index].x-rotated.x,slots[index].y-rotated.y,-rotated.z);
      }
    });
    if(o.hardware)o.hardware.visible=o.layout==='assembly';
    // Measure local transforms independently from previous screen placement.
    o.root.position.set(0,0,0);o.root.scale.setScalar(1);o.root.rotation.set(0,0,0);o.root.updateMatrixWorld(true);
    const box=new THREE.Box3();for(const m of o.map.values())box.expandByObject(m);
    if(o.hardware?.visible)box.expandByObject(o.hardware);
    o.content.position.copy(box.getCenter(new THREE.Vector3()).negate());o.size.copy(box.getSize(new THREE.Vector3()));
    resize();refreshHighlight();
  }
  function updateDetail(){
    const region=detailRegion(parts,state().selected||'P4-01',single),key=region.ids.join('|');
    owners.detail.name=region.name;$('#focus-region-name').textContent=region.name;
    if(key!==regionKey){regionKey=key;owners.detail.zoom=1;build('detail',region.ids);}
  }
  function areas(){
    const w=viewport.clientWidth,h=viewport.clientHeight,narrow=w<900;
    const available=w-(collapsed?68:narrow?236:300),top=narrow?155:136,bottom=h-140;
    const width=Math.max(available,Math.min(w-50,320)),height=Math.max(160,bottom-top);
    const detail={x:width*.245,y:(top+bottom)/2,w:width*.43,h:height*.75};
    const whole={x:width*.72,y:(top+bottom)/2,w:width*.53,h:height};
    if(swapped)[whole.x,detail.x]=[detail.x,whole.x];
    return {whole,detail};
  }
  function resize(){
    if(!active)return;
    const w=viewport.clientWidth,h=viewport.clientHeight;if(w<=0||h<=0)return;
    camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();
    const slots=areas();
    for(const [id,o]of Object.entries(owners)){
      const slot=slots[id];o.root.rotation.fromArray(o.layout==='array'?[0,0,0]:[.13,.55,0]);o.root.scale.setScalar(1);o.root.position.set(0,0,0);o.root.updateMatrixWorld(true);
      const bounds=new THREE.Box3();for(const m of o.map.values())bounds.expandByObject(m);
      if(o.hardware?.visible)bounds.expandByObject(o.hardware);
      const size=bounds.getSize(new THREE.Vector3());o.fit=Math.min(slot.w/Math.max(size.x,1),slot.h/Math.max(size.y,1));
      o.root.rotation.fromArray(o.rotation);
      o.root.scale.setScalar(o.fit*o.zoom);
      const x=THREE.MathUtils.clamp(slot.x+o.offset.x*w,45,w-45),y=THREE.MathUtils.clamp(slot.y+o.offset.y*h,160,h-75);
      o.offset={x:(x-slot.x)/w,y:(y-slot.y)/h};
      o.root.position.set(x-w/2,h/2-y,0);o.root.updateMatrixWorld(true);
      const label=$('#focus-'+id+'-label');label.style.left=x+'px';label.style.top=Math.max(112,y-size.y*o.fit*o.zoom/2-32)+'px';
    }
    positionPalette();positionArrayLabels();const dock=$('#focus-mode-dock');dock.style.left=(document.body.dataset.variant==='top'?450:slots.whole.x)+'px';
  }
  function positionArrayLabels(){
    const w=viewport.clientWidth,h=viewport.clientHeight;camera.updateMatrixWorld(true);
    let html='';
    for(const [owner,o]of Object.entries(owners))if(o.layout==='array')for(const [id,m]of o.map){
      const box=new THREE.Box3().setFromObject(m),v=box.getCenter(new THREE.Vector3());v.y=box.min.y;v.project(camera);
      const x=(v.x+1)*w/2,y=(1-v.y)*h/2+4;
      html+=`<button class="focus-array-label" data-focus-part="${id}" data-owner="${owner}" style="left:${x}px;top:${y}px" title="${esc(partMap.get(id).name)} · ${id}" aria-label="${owner==='whole'?'整机':'部件'}排列：${esc(partMap.get(id).name)}" aria-pressed="${state().selected===id}">${esc(partMap.get(id).name)}</button>`;
    }
    $('#focus-array-labels').innerHTML=html;
  }
  function positionPalette(){
    const w=viewport.clientWidth,h=viewport.clientHeight;
    const x=palettePosition?palettePosition.x*w:w-palette.offsetWidth-20,y=palettePosition?palettePosition.y*h:112;
    palette.style.left=THREE.MathUtils.clamp(x,8,Math.max(8,w-palette.offsetWidth-8))+'px';
    palette.style.top=THREE.MathUtils.clamp(y,102,Math.max(102,h-55))+'px';
    if(palettePosition)palettePosition={x:parseFloat(palette.style.left)/w,y:parseFloat(palette.style.top)/h};
    palette.style.maxHeight=Math.max(80,h-parseFloat(palette.style.top)-52)+'px';
  }
  // This review prototype keeps all state in memory, including under sandboxed Artboards.
  function remember(){}
  function restore(){}
  function readColor(id){const a=state(),p=partMap.get(id);return {color:a.colors[id],productId:a.assignments[id]||null,material:p.material};}
  function take(color,productId=null,material=held?.material||partMap.get(state().selected)?.material||'PLA Basic',autoPaint=true){
    const match=state().catalog.products.find(p=>p.series===material&&p.hex===color.toUpperCase());
    held={color:color.toUpperCase(),productId:productId||match?.id||null,material};hsv=hexToHsv(held.color);if(autoPaint)tool='paint';refresh();
  }
  function clickPart(id){
    const p=partMap.get(id);if(!p)return;
    api.select(id);
    if(tool==='sample'){const c=readColor(id);take(c.color,c.productId,c.material);api.toast('已吸取 '+p.name+' 的颜色与材料');}
    else if(tool==='paint')paint(id);
    else {const c=readColor(id);take(c.color,c.productId,c.material,false);}
  }
  function paint(id){
    if(!held||!partMap.has(id))return;
    if(partMap.get(id).material!==held.material){api.toast('拿着的是 '+held.material+'，请切换到 '+partMap.get(id).material+' 耗材');return;}
    api.apply(paintTargets(parts,[id],state().pairLink),held.color,held.productId);refresh();
  }
  function refreshHighlight(){
    for(const {parent,line}of highlights){parent.remove(line);line.material.dispose();}highlights.length=0;
    if(!active)return;
    const ids=paintTargets(parts,[hoverId||state().selected].filter(Boolean),state().pairLink);
    for(const o of Object.values(owners))for(const id of ids){const m=o.map.get(id);if(!m)continue;
      if(!edges.has(id))edges.set(id,new THREE.EdgesGeometry(m.geometry,28));
      const line=new THREE.LineSegments(edges.get(id),new THREE.LineBasicMaterial({color:api.isLocked(id)?0xc78b35:0x657ef3,transparent:true,opacity:.68}));
      // A child follows only this display instance, including its array scale.
      m.add(line);highlights.push({parent:m,line});
    }
  }
  function renderPalette(){
    if(!held)return;
    $('#focus-material').value=held.material;$('#focus-hex').value=held.color;$('#focus-held-chip').style.background=held.color;
    $('#focus-hue').value=String(hsv.h);$('#focus-sv').style.backgroundColor=hsvToHex(hsv.h,1,1);
    $('#focus-sv').setAttribute('aria-valuetext',`饱和度 ${Math.round(hsv.s*100)}%，明度 ${Math.round(hsv.v*100)}%`);
    $('#focus-sv span').style.left=hsv.s*100+'%';$('#focus-sv span').style.top=(1-hsv.v)*100+'%';
    const product=state().catalog.products.find(p=>p.id===held.productId);
    $('#focus-held-note').textContent=product?`${product.name} · ${product.colorCode} · ${held.material}`:'目标色 · 预览可用，导出前需匹配真实耗材';
    const a=state(),used=[...new Set(parts.filter(p=>p.material===held.material).map(p=>a.colors[p.id]))];
    $('#focus-project-colors').innerHTML=used.map(color=>`<button data-focus-color="${color}" style="--color:${color}" aria-label="拿起项目色 ${color}" title="${color}" aria-pressed="${held.color===color}"></button>`).join('');
    const q=$('#focus-product-search').value.trim().toLowerCase(),products=a.catalog.products.filter(p=>p.series===held.material&&(!q||[p.name,p.nameEn,p.colorCode,p.hex].join(' ').toLowerCase().includes(q)));
    $('#focus-product-count').textContent=products.length+' 款';
    $('#focus-products').innerHTML=products.map(p=>`<button data-focus-product="${p.id}" aria-pressed="${held.productId===p.id}" title="${p.name} ${p.colorCode}"><i style="background:${p.hex}"></i><span>${esc(p.name)}<small>${p.colorCode}</small></span></button>`).join('')||'<p>未找到匹配耗材</p>';
  }
  function refresh(){
    if(!active)return;updateDetail();
    const a=state(),p=partMap.get(a.selected),ids=p?paintTargets(parts,[p.id],a.pairLink):[];
    $('#focus-part').value=p?.id||'';$('#focus-part-name').textContent=p?.name||'点击一个零件';$('#focus-part-material').textContent=p?.material||'';
    $('#focus-pair').checked=a.pairLink;$('#focus-pair').disabled=!p?.pair;
    $('#focus-scope-note').textContent=['P2-06','P3-01'].includes(p?.id)?'两侧同属一个源零件':!p?.pair?'源文件单个零件':a.pairLink?'共 '+ids.length+' 件':'仅当前件';
    $('#focus-lock').disabled=!p;$('#focus-lock').textContent=p&&api.isLocked(p.id)?'解锁':'锁定';
    $('#focus-apply').disabled=!p||api.isLocked(p.id)||p.material!==held?.material;
    $('#focus-undo').disabled=!a.historyLength;
    $('#focus-status').textContent=(tool==='paint'?'点涂':tool==='sample'?'吸取颜色':'选择部件')+(p?' · '+p.name:'')+(p&&api.isLocked(p.id)?' · 已锁定':'')+(a.pairLink&&ids.length>1?' · 同步对应件':'');
    ui.querySelectorAll('[data-focus-tool]').forEach(b=>b.setAttribute('aria-pressed',String(tool===b.dataset.focusTool)));
    $('#focus-spread').hidden=owners.whole.layout!=='explode'&&owners.detail.layout!=='explode';
    palette.classList.toggle('collapsed',collapsed);$('#focus-palette-body').hidden=collapsed;$('#focus-collapse').textContent=collapsed?'+':'−';$('#focus-collapse').setAttribute('aria-label',collapsed?'展开调色盘':'收起调色盘');$('#focus-collapse').setAttribute('aria-expanded',String(!collapsed));
    $('#focus-link').setAttribute('aria-pressed',String(rotationLinked));$('#focus-link').textContent='联动旋转 · '+(rotationLinked?'开':'关');
    ui.querySelectorAll('[data-quick-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.quickLayout===owners.whole.layout)));$('#focus-return-assembly').disabled=owners.whole.layout==='assembly';
    renderPalette();refreshHighlight();
    ui.querySelectorAll('[data-focus-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.focusPart===a.selected)));
  }
  function enter(){
    if(active)return;api.prepare();active=true;tool='select';restore();
    document.body.classList.add('focus-painting');ui.hidden=false;api.controls.enabled=false;
    if(!state().selected)api.select('P4-01');
    held=readColor(state().selected);hsv=hexToHsv(held.color);
    build('whole',parts.map(p=>p.id));regionKey='';updateDetail();refresh();api.resize();resize();
    $('#focus-back').focus();
  }
  function leave(saved=false){
    if(!active)return;remember();active=false;pendingSave=false;gesture=null;hoverId=null;
    document.body.classList.remove('focus-painting');ui.hidden=true;api.controls.enabled=true;canvas.style.cursor='grab';
    refreshHighlight();api.finish();$('#focus-enter').focus();
    if(!saved)api.toast('已返回基础涂装；当前配色保留在工作台');
  }
  function hitAt(clientX,clientY){
    const rect=canvas.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return null;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    ray.setFromCamera(new THREE.Vector2((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1),camera);
    const objects=Object.values(owners).flatMap(o=>[...o.map.values(),...(o.hardware?.visible?o.hardware.children:[])]);
    return ray.intersectObjects(objects,false)[0]?.object||null;
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!active||e.button>2||gesture)return;
    const hit=hitAt(e.clientX,e.clientY),owner=hit?.userData.owner;if(!owner)return;
    lastOwner=owner;const o=owners[owner];gesture={pointer:e.pointerId,x:e.clientX,y:e.clientY,owner,id:hit.userData.partId,rotation:[...o.rotation],offset:{...o.offset},move:e.shiftKey||e.button!==0,moved:false};
    canvas.setPointerCapture(e.pointerId);e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!active)return;
    if(gesture&&gesture.pointer===e.pointerId){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>5)gesture.moved=true;
      if(!gesture.moved)return;const o=owners[gesture.owner];
      if(gesture.move)o.offset={x:gesture.offset.x+dx/viewport.clientWidth,y:gesture.offset.y+dy/viewport.clientHeight};
      else {o.rotation=[gesture.rotation[0]+dy*.008,gesture.rotation[1]+dx*.008,0];if(rotationLinked)owners[gesture.owner==='whole'?'detail':'whole'].rotation=[...o.rotation];}
      resize();return;
    }
    const hit=hitAt(e.clientX,e.clientY),id=hit?.userData.partId||null;
    if(id!==hoverId){hoverId=id;refreshHighlight();}
    canvas.style.cursor=hit?(tool==='paint'?'crosshair':tool==='sample'?'copy':'grab'):'default';
  });
  canvas.addEventListener('pointerup',e=>{
    if(!active||!gesture||gesture.pointer!==e.pointerId)return;
    const g=gesture;gesture=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!g.moved&&g.id&&e.button===0)clickPart(g.id);else remember();
  });
  for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{gesture=null;});
  canvas.addEventListener('pointerleave',()=>{if(active){hoverId=null;refreshHighlight();}});
  canvas.addEventListener('contextmenu',e=>{if(active)e.preventDefault();});
  canvas.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();const owner=hitAt(e.clientX,e.clientY)?.userData.owner||lastOwner,o=owners[owner];o.zoom=THREE.MathUtils.clamp(o.zoom*Math.exp(-e.deltaY*.001),.4,2.5);resize();remember();},{passive:false});
  for(const handle of ui.querySelectorAll('[data-move]')){
    let drag;
    handle.onpointerdown=e=>{if(e.button!==0)return;const id=handle.dataset.move;drag={x:e.clientX,y:e.clientY,id,offset:id==='palette'?{x:parseFloat(palette.style.left)/viewport.clientWidth,y:parseFloat(palette.style.top)/viewport.clientHeight}:{...owners[id].offset}};handle.setPointerCapture(e.pointerId);e.preventDefault();};
    handle.onpointermove=e=>{if(!drag)return;const offset={x:drag.offset.x+(e.clientX-drag.x)/viewport.clientWidth,y:drag.offset.y+(e.clientY-drag.y)/viewport.clientHeight};if(drag.id==='palette'){palettePosition=offset;positionPalette();}else{owners[drag.id].offset=offset;resize();}};
    handle.onpointerup=handle.onpointercancel=()=>{drag=null;remember();};
    handle.onkeydown=e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();const id=handle.dataset.move,dx=e.key==='ArrowLeft'?-20:e.key==='ArrowRight'?20:0,dy=e.key==='ArrowUp'?-20:e.key==='ArrowDown'?20:0;
      if(id==='palette'){palettePosition={x:(parseFloat(palette.style.left)+dx)/viewport.clientWidth,y:(parseFloat(palette.style.top)+dy)/viewport.clientHeight};positionPalette();}else{owners[id].offset.x+=dx/viewport.clientWidth;owners[id].offset.y+=dy/viewport.clientHeight;resize();}remember();};
  }
  function setLayout(owner,value){
    const o=owners[owner];if(o.layout===value)return;
    viewMemory[owner][o.layout]={rotation:[...o.rotation],zoom:o.zoom,offset:{...o.offset}};
    const saved=viewMemory[owner][value];o.layout=value;
    o.rotation=saved?[...saved.rotation]:value==='array'?[0,0,0]:[...o.rotation];o.zoom=saved?.zoom||1;
    if(saved)o.offset={...saved.offset};
    if(rotationLinked)owners[owner==='whole'?'detail':'whole'].rotation=[...o.rotation];
    $('#focus-layout').value=owners.whole.layout;layout(owner);refresh();
  }
  $('#focus-link').onclick=()=>{rotationLinked=!rotationLinked;if(rotationLinked)owners.detail.rotation=[...owners.whole.rotation];refresh();resize();};
  ui.querySelectorAll('[data-quick-layout]').forEach(b=>b.onclick=()=>setLayout('whole',b.dataset.quickLayout));
  $('#focus-return-assembly').onclick=()=>setLayout('whole','assembly');
  $('#focus-enter').onclick=enter;$('#focus-back').onclick=()=>leave();
  $('#focus-layout').onchange=e=>setLayout('whole',e.target.value);$('#focus-detail-layout').onchange=e=>setLayout('detail',e.target.value);
  $('#focus-spread').oninput=()=>{for(const id of ['whole','detail'])if(owners[id].layout==='explode')layout(id);};
  ui.querySelectorAll('[data-focus-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.focusTool;refresh();});
  $('#focus-part').onchange=e=>{api.select(e.target.value);if(tool==='select'){const c=readColor(e.target.value);take(c.color,c.productId,c.material,false);}};
  $('#focus-array-labels').onclick=e=>{const b=e.target.closest('[data-focus-part]');if(b){lastOwner=b.dataset.owner;clickPart(b.dataset.focusPart);}};
  $('#focus-single').onchange=e=>{single=e.target.checked;updateDetail();refresh();};
  $('#focus-pair').onchange=e=>{api.setPair(e.target.checked);refresh();};
  $('#focus-lock').onclick=()=>api.toggleLock();$('#focus-undo').onclick=api.undo;
  $('#focus-apply').onclick=()=>paint(state().selected);
  $('#focus-material').onchange=e=>{const product=state().catalog.products.find(p=>p.series===e.target.value);take(product.hex,product.id,product.series);};
  $('#focus-product-search').oninput=renderPalette;
  $('#focus-project-colors').onclick=e=>{const b=e.target.closest('[data-focus-color]');if(b)take(b.dataset.focusColor);};
  $('#focus-products').onclick=e=>{const b=e.target.closest('[data-focus-product]');if(b){const p=state().catalog.products.find(x=>x.id===b.dataset.focusProduct);take(p.hex,p.id,p.series);}};
  $('#focus-take-hex').onclick=()=>{const color=$('#focus-hex').value.trim();if(/^#[\da-f]{6}$/i.test(color))take(color);else api.toast('请输入六位 HEX，例如 #4D6BFE');};
  $('#focus-hex').onkeydown=e=>{if(e.key==='Enter')$('#focus-take-hex').click();};
  function takeHSV(){const next={...hsv};take(hsvToHex(hsv.h,hsv.s,hsv.v));hsv=next;renderPalette();}
  $('#focus-hue').oninput=e=>{hsv.h=Number(e.target.value);takeHSV();};
  const sv=$('#focus-sv');let svPointer=null;
  function adjustSV(e){const b=sv.getBoundingClientRect();hsv.s=THREE.MathUtils.clamp((e.clientX-b.left)/b.width,0,1);hsv.v=1-THREE.MathUtils.clamp((e.clientY-b.top)/b.height,0,1);takeHSV();}
  sv.onpointerdown=e=>{if(e.button!==0)return;svPointer=e.pointerId;sv.setPointerCapture(e.pointerId);adjustSV(e);};sv.onpointermove=e=>{if(svPointer===e.pointerId)adjustSV(e);};sv.onpointerup=sv.onpointercancel=()=>{svPointer=null;};
  sv.onkeydown=e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();hsv.s=THREE.MathUtils.clamp(hsv.s+(e.key==='ArrowRight'?.02:e.key==='ArrowLeft'?-.02:0),0,1);hsv.v=THREE.MathUtils.clamp(hsv.v+(e.key==='ArrowUp'?.02:e.key==='ArrowDown'?-.02:0),0,1);takeHSV();};
  $('#focus-collapse').onclick=()=>{collapsed=!collapsed;refresh();resize();remember();};
  $('#focus-swap').onclick=()=>{swapped=!swapped;owners.whole.offset={x:0,y:0};owners.detail.offset={x:0,y:0};resize();remember();};
  ui.querySelectorAll('[data-reset-object]').forEach(b=>b.onclick=()=>{const o=owners[b.dataset.resetObject];o.rotation=o.layout==='array'?[0,0,0]:[.13,.55,0];o.zoom=1;if(rotationLinked)owners[b.dataset.resetObject==='whole'?'detail':'whole'].rotation=[...o.rotation];resize();remember();});
  $('#focus-reset').onclick=()=>{swapped=false;palettePosition=null;for(const o of Object.values(owners)){o.offset={x:0,y:0};o.zoom=1;o.rotation=o.layout==='array'?[0,0,0]:[.13,.55,0];}if(rotationLinked)owners.detail.rotation=[...owners.whole.rotation];resize();remember();};
  $('#focus-save').onclick=()=>{pendingSave=true;api.save();};
  // The save callback runs only after the existing scheme store confirms success.
  $('#scheme-save-dialog').addEventListener('close',()=>{pendingSave=false;});
  document.addEventListener('keydown',e=>{if(!active||e.target.closest('input,select,textarea,[contenteditable],[role="slider"]')||$('dialog[open]'))return;
    if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&['1','2','3'].includes(e.key)){e.preventDefault();setLayout('whole',{1:'assembly',2:'explode',3:'array'}[e.key]);return;}
    const next={v:'select',b:'paint',i:'sample',Escape:'select'}[e.key.length===1?e.key.toLowerCase():e.key];if(next){e.preventDefault();tool=next;refresh();}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();api.undo();}
  });
  function screenPosition(owner,id){const m=owners[owner]?.map.get(id);if(!m)return null;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const v=m.geometry.boundingBox.getCenter(new THREE.Vector3());m.localToWorld(v).project(camera);const b=canvas.getBoundingClientRect();return{x:b.left+(v.x+1)*b.width/2,y:b.top+(1-v.y)*b.height/2};}
  return {enter,leave,refresh,resize,isActive:()=>active,render:renderer=>renderer.render(scene,camera),onSaved:()=>{if(active&&pendingSave)leave(true);},
    getState:()=>({rotationLinked,active,tool,held:held&&{...held},single,swapped,collapsed,selected:state().selected,objects:Object.fromEntries(Object.entries(owners).map(([id,o])=>[id,{name:o.name,ids:[...o.ids],layout:o.layout,rotation:[...o.rotation],offset:{...o.offset},zoom:o.zoom,position:o.root.position.toArray(),scale:o.root.scale.x}])),geometryShared:[...owners.whole.map].every(([id,m])=>m.geometry===meshes.get(id).userData.assembly),materialsShared:[...owners.whole.map,...owners.detail.map].every(([id,m])=>m.material===meshes.get(id).material)}),
    screenPosition,hitAt:(x,y)=>{const m=hitAt(x,y);return m?{id:m.userData.partId||null,owner:m.userData.owner}:null;},
    meshColor:(owner,id)=>{const m=owners[owner]?.map.get(id);return m?'#'+m.material.color.getHexString(THREE.SRGBColorSpace):null;}};
}
