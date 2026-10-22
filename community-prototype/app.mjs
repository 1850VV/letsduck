import {createModelView} from './model-view.mjs';
import {createCommunity,readPrivateDesigns} from '../community-store.mjs';

const $=s=>document.querySelector(s);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const VIEW_KEY='duck-studio-community-view-v1';
const FAMILIES=[['all','所有颜色'],['blue','蓝色系'],['green','绿色系'],['warm','暖色系'],['purple','紫色系'],['mono','黑白灰']];
let model,catalog,view,community,sort='score',query='',family='all',noticeTimer;
const thumbs=new Map();

function notice(message){$('#notice').textContent=message;$('#notice').classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').classList.remove('show'),5000);}
function rememberView(){try{sessionStorage.setItem(VIEW_KEY,JSON.stringify({sort,query,family}));}catch{/* Browsing remains available without preference storage. */}}
function privateDesigns(){return readPrivateDesigns(model,catalog).map(s=>({...s,title:s.name||s.title,author:'我的工作室',ownerId:'me',private:true,created:s.created||0}));}
function find(id){return community.find(id)||privateDesigns().find(s=>s.id===id);}
function stats(s){return s.private?{count:0,average:0,rank:0,forks:0}:community.stats(s);}
function thumbnail(s){const key=JSON.stringify(s.colors);if(!thumbs.has(key))thumbs.set(key,view.thumbnail(s));return thumbs.get(key);}
function palette(s){return [...new Set(Object.values(s.colors))].slice(0,5);}
function strip(s){return `<div class="swatch-strip" aria-label="方案配色">${palette(s).map(c=>`<i style="--c:${esc(c)}"></i>`).join('')}</div>`;}
function card(s,i){
 const a=stats(s),label=s.private?'私有方案':sort==='score'?'NO. '+String(i+1).padStart(2,'0'):'新配色';
 return `<article class="card" data-design="${esc(s.id)}"><a href="#detail/${encodeURIComponent(s.id)}" class="card-visual" aria-label="查看${esc(s.title)}"><img src="${thumbnail(s)}" alt="${esc(s.title)}整机配色"><span class="card-rank">${label}</span>${s.ownerId==='me'?'<span class="private-tag">我的方案</span>':''}</a><div class="card-body"><div class="title-line"><h3><a href="#detail/${encodeURIComponent(s.id)}">${esc(s.title)}</a></h3>${strip(s)}</div><div class="author"><span class="avatar">${esc(s.author?.slice(0,1)||'我')}</span>${esc(s.author)}</div><div class="card-footer"><span class="rating">${s.private?'私有 · 未发布':a.count?`<b>★</b> ${a.average.toFixed(1)} <small>(${a.count} 人)</small>`:'等待第一份演示评价'}</span><span>${s.private?'仅自己可见':a.forks+' 次引用'}</span></div></div></article>`;
}
function sorted(items){return [...items].sort((a,b)=>sort==='latest'?b.created-a.created||a.id.localeCompare(b.id):stats(b).rank-stats(a).rank||stats(b).count-stats(a).count||b.created-a.created||a.id.localeCompare(b.id));}
function galleryCards(){
 const items=sorted(community.list().filter(s=>(family==='all'||s.family===family)&&[s.title,s.author].some(x=>x.toLowerCase().includes(query.toLowerCase()))));
 $('#cards').innerHTML=items.length?items.map(card).join(''):'<div class="empty"><h2>暂时没有这套配色</h2><p>试试换个名字或颜色。</p><button id="reset-search">清除筛选</button></div>';
 $('#results').textContent=`${items.length} 套配色 · XGO Duck V2 · 演示数据`;
 $('#reset-search')?.addEventListener('click',()=>{query='';family='all';rememberView();render();});
}
function gallery(){return `<div class="intro"><div><span class="eyebrow">MADE FOR YOUR DUCK</span><h1>给你的机器鸭，找一套新配色。</h1><p>看看大家的灵感，挑一套喜欢的，改成自己的。</p></div><span class="model-chip">XGO Duck V2 · 同一只鸭，无限种个性</span></div><div class="toolbar"><div class="tabs" role="group" aria-label="方案排序"><button data-sort="score" class="${sort==='score'?'active':''}" aria-pressed="${sort==='score'}" title="综合均分与人数排序，避免一票高分领先">高分优先</button><button data-sort="latest" class="${sort==='latest'?'active':''}" aria-pressed="${sort==='latest'}">最新发布</button></div><span class="sort-note">高分排序同时考虑均分与人数</span><div class="search"><input id="search" aria-label="搜索配色或作者" placeholder="搜索配色或作者" value="${esc(query)}"><select id="family" aria-label="主色筛选">${FAMILIES.map(([id,n])=>`<option value="${id}" ${id===family?'selected':''}>${n}</option>`).join('')}</select></div></div><p class="result-note" id="results" role="status"></p><div class="cards" id="cards"></div>`;}
function viewer(){return '<div class="viewer-wrap"><span class="viewer-label">XGO DUCK V2 · 实际模型预览</span><div id="model-view" class="viewer" aria-label="可旋转的机器鸭配色模型"></div><span class="viewer-note">拖动旋转 · 滚轮缩放</span><button class="viewer-home" id="reset-view">复位视角 ↺</button></div>';}
function source(s){
 const p=s.provenance;if(!p?.derivedFromVersionId)return '';
 const origin=community.find(p.derivedFromVersionId),title=p.sourceTitle||origin?.title||'来源配色';
 const name=origin?`<a href="#detail/${encodeURIComponent(p.derivedFromVersionId)}">《${esc(title)}》</a>`:`《${esc(title)}》`;
 return `<div class="source">基于 ${name} · ${esc(p.sourceAuthor||origin?.author||'原作者')} · 保留来源版本</div>`;
}
function materials(s){return [...new Set(Object.values(s.assignments||{}))].map(id=>{
 const p=catalog.products.find(x=>x.id===id);
 return p?`<div class="material-row"><i style="--c:${esc(p.hex)}"></i>${esc(p.series)} · ${esc(p.name)}<span>${esc(p.colorCode)}</span></div>`:'<div class="material-row">目标色尚未匹配耗材，请在涂装台选择实际产品。</div>';
}).join('');}
function detail(s){
 const a=stats(s),own=s.ownerId==='me',vote=community.getState().ratings[s.id]||0;
 const rate=s.private?'<div class="rate-box"><p>这是私有方案，只有显式发布后才进入演示广场。</p></div>':`<div class="rate-box">${own?'这是你的作品':'你会给这套配色几分？'}<div class="stars" role="group" aria-label="给方案评分">${[1,2,3,4,5].map(n=>`<button data-rate="${n}" ${own?'disabled':''} class="${n<=vote?'on':''}" aria-label="评 ${n} 星" aria-pressed="${vote===n}">★</button>`).join('')}</div><div class="rate-note">${own?'自己的作品不能评分。':vote?`你已评 ${vote} 星 · 再点可修改，不重复计票。`:'每人每版本一票，可修改 · 当前使用演示身份。'}</div></div>`;
 return `<a class="back" href="${s.private?'#mine':'#gallery'}">← 返回${s.private?'我的方案':'配色广场'}</a><div class="detail">${viewer()}<div class="detail-info"><span class="eyebrow">${s.private?'PRIVATE COLOR':'COMMUNITY COLOR · 演示作品'}${s.private?'':' / v'+(s.version||1)}</span><h1>${esc(s.title)}</h1><div class="author"><span class="avatar">${esc(s.author?.[0]||'我')}</span>${esc(s.author)}${own?' · 我的方案':''}</div><p>${esc(s.description||'给这只机器鸭的一套新配色。')}</p>${source(s)}${s.private?'':`<div class="stats"><div><strong>${a.count?a.average.toFixed(1):'—'} <span style="font-size:15px;color:#d7a550">★</span></strong><small>${a.count} 人演示评分</small></div><div><strong>${a.forks}</strong><small>次引用</small></div><div><strong>${new Set(Object.values(s.assignments||{})).size}</strong><small>种耗材</small></div></div>`}${rate}<details class="material-list"><summary>查看配色与真实耗材</summary>${materials(s)}</details><button class="primary wide" id="import-design" data-id="${esc(s.id)}">${s.private?'打开私有方案':'带入涂装台，改成我的'} ↗</button><p class="detail-foot">${s.private?'在完整涂装台继续修改 · 当前草稿会先保留':'新建完整私有副本 · 保留原作者与来源'}</p></div></div>`;
}
function mine(){
 const personal=privateDesigns(),published=community.list().filter(s=>s.ownerId==='me').sort((a,b)=>b.created-a.created);
 return `<div class="intro"><div><span class="eyebrow">YOUR COLLECTION</span><h1>从喜欢的，到属于你的。</h1><p>保存默认私有；显式发布后，作品才进入本机演示广场。</p></div><a class="primary action-link" id="start-studio" href="../">继续涂装 ↗</a></div><h2 class="section-heading">私有方案 <span>${personal.length}</span></h2><div class="cards">${personal.length?personal.map(card).join(''):'<div class="empty"><p>在涂装台保存的私有方案会显示在这里。</p><a class="text-link" href="../">打开涂装台 ↗</a></div>'}</div><h2 class="section-heading published-heading">已发布的演示版本 <span>${published.length}</span></h2><div class="cards">${published.length?published.map(card).join(''):'<div class="empty"><p>还没有发布版本。每次模拟发布都会创建独立快照。</p></div>'}</div>`;
}
function importDesign(s){
 try{
  if(s.private){location.href='../?scheme='+encodeURIComponent(s.id);return;}
  const request=community.requestFork(s.id);
  location.href='../?communityFork='+encodeURIComponent(request.id);
 }catch(error){notice(error.message||'这套方案未能带入，请保留当前页面后重试。');}
}
function render(){
 const hash=location.hash.slice(1)||'gallery',[page,rawId]=hash.split('/');
 if(page==='studio'){location.replace('../');return;}
 let id;try{id=decodeURIComponent(rawId||'');}catch{id='';}
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page||(page==='detail'&&a.dataset.nav==='gallery')));
 const s=page==='detail'?find(id):null;
 $('#app').innerHTML=page==='mine'?mine():s?detail(s):page==='detail'?'<div class="empty"><h2>这套方案暂时无法打开</h2><p>来源版本可能不在本机，或模型与耗材校验未通过。</p><a class="text-link" href="#gallery">返回配色广场</a></div>':gallery();
 if(s){
  view.mount($('#model-view'),s);$('#import-design').onclick=()=>importDesign(s);
  $('.stars')?.addEventListener('click',e=>{
   const b=e.target.closest('[data-rate]');if(!b||ownDesign(s))return;
   try{community.rate(s.id,Number(b.dataset.rate));render();$(`[data-rate="${b.dataset.rate}"]`)?.focus();notice('演示评分已保存，改票不会增加人数。');}catch(error){notice(error.message);}
  });
 }else if(page!=='mine'&&page!=='detail'){
  galleryCards();$('#search').oninput=e=>{query=e.target.value;rememberView();galleryCards();};
  $('#family').onchange=e=>{family=e.target.value;rememberView();galleryCards();};
  document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{sort=b.dataset.sort;rememberView();render();$(`[data-sort="${sort}"]`)?.focus();});
 }
 $('#reset-view')?.addEventListener('click',view.home);
}
const ownDesign=s=>s.ownerId==='me';
try{
 const response=await Promise.all([fetch('../assets/model.json'),fetch('../assets/catalog.json'),fetch('../assets/geometry.bin')]);
 if(response.some(r=>!r.ok))throw Error('模型资源读取失败');
 [model,catalog]=await Promise.all([response[0].json(),response[1].json()]);
 const binary=await response[2].arrayBuffer();community=createCommunity(model,catalog);
 try{const saved=JSON.parse(sessionStorage.getItem(VIEW_KEY));if(saved){sort=saved.sort==='latest'?'latest':'score';query=typeof saved.query==='string'?saved.query:'';family=FAMILIES.some(([id])=>id===saved.family)?saved.family:'all';}}catch{/* Use gallery defaults. */}
 view=createModelView(model,binary);community.list().forEach(thumbnail);
 window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
 window.addEventListener('pageshow',event=>{if(event.persisted)render();});
 window.addEventListener('storage',event=>{if(event.key?.startsWith('duck-studio-'))location.reload();});
 render();window.communityPrototype={ready:true,getState:()=>clone({store:community.getState(),seeds:community.list().filter(s=>s.id.startsWith('demo-')),private:privateDesigns(),source:model.source_sha256,sort,query,family})};
}catch(error){console.error(error);$('#app').innerHTML='<div class="empty"><h2>配色广场暂时没有载入</h2><p>请确认本地工作台服务正在运行，再刷新页面。已有浏览器数据会保留。</p><a class="text-link" href="../">返回涂装台</a></div>';}
