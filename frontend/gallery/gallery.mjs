// 配色广场: official themes plus every work published from the studio, with ratings, remix family
// trees and the shared poster dialog. Works, ratings and 我的方案 come from the API.
import {loadDuck,createDuckView} from '../shared/duck-view.mjs';
import {createPosterDialog,lookCode} from '../shared/poster.mjs';
import {applyBrand} from '../shared/brand.mjs';
import {mountAccount,initAccount,onAccount,requireLogin,account,avatarHTML} from '../shared/profile.mjs';
import {api} from '../shared/api.mjs';
import {loadPublicSite,copyWorkLink,parseWorkLink} from '../shared/work-links.mjs';
import {ZONES} from '../lib/duck-workbench.mjs';
import {THEMES,quickDesign,themeSlots,hsl,isNeutral,decodeLook} from '../lib/quick-style.mjs';
applyBrand();

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const publicSite=await loadPublicSite();
const duck=await loadDuck(),{model,catalog,products}=duck,parts=model.parts;
const view=createDuckView(duck),poster=createPosterDialog({view,parts,products,compact:true});
const match=(p,hex)=>catalog.products.find(x=>x.series===p.material&&x.hex.toUpperCase()===hex.toUpperCase())?.id||null;
const original={colors:Object.fromEntries(parts.map(p=>[p.id,p.color.toUpperCase()])),assignments:Object.fromEntries(parts.map(p=>[p.id,match(p,p.color)]))};

const FAMILY_NAMES={all:'全部',blue:'蓝色系',green:'绿色系',warm:'暖色系',purple:'紫色系',mono:'黑白灰'};
const FAMILY_DOT={blue:'#0056B8',green:'#3F8E43',warm:'#FF6A13',purple:'#5E43B7',mono:'#545454'};
function family(colors){const ext=['P4-01','P5-06','P5-07','P5-01','P5-02','P2-06','P2-03'];const hues=ext.map(id=>colors[id]).filter(c=>c&&!isNeutral(c)).map(c=>hsl(c).h);if(!hues.length)return 'mono';const h=hues[0];return h<75||h>=335?'warm':h<175?'green':h<245?'blue':'purple';}
const OFFICIAL={id:'official',name:'涂鸭官方',avatar:'🦆',color:'#4d6bfe'};
const complete=d=>parts.every(p=>products.has(d.assignments[p.id]));

// ---------- data: official starting points (local) + published works and my schemes (server) ----------
const officials=[{id:'official-0',title:'原厂蓝白',...original,desc:'XGO Duck V2 出厂时的蓝白黑配色，所有改编的起点。'},
  ...THEMES.map((t,i)=>({id:'official-'+(i+1),title:t.name,...quickDesign(parts,products,themeSlots(products,t),t.recipe),desc:'涂装台里的经典配色，「'+t.recipe+'」分配方式。'}))]
  .filter(complete).map(d=>({...d,official:true,author:OFFICIAL,rating:0,count:0,mineVote:0,days:null,created:0}));
let designs=[],schemes=[],loadError='';
const fromWork=w=>({id:w.id,title:w.title,desc:w.description||'在涂装台里配的一只鸭子。',author:w.author,colors:w.design.colors,assignments:w.design.assignments,
  // A remix of an official theme keeps that theme as its parent; works point at works through parentId.
  parent:w.parentId||(/^official-\d+$/.test(w.provenance?.workId||'')?w.provenance.workId:null),provenance:w.provenance,
  rating:w.rating.average,count:w.rating.count,mineVote:w.rating.mine,created:w.created,days:Math.floor((Date.now()-w.created)/864e5),schemeId:w.schemeId});
async function load(){
  let works=[];loadError='';
  try{works=await api('GET','/works');}catch(err){loadError=err.message;}
  try{schemes=account.user?await api('GET','/schemes'):[];}catch{schemes=[];}
  designs=[...works.map(fromWork).filter(complete),...officials.map(d=>({...d}))];
  for(const d of designs){d.family=family(d.colors);d.mine=!!account.user&&d.author.id===account.user.id;}
  for(const d of designs)d.forks=designs.filter(k=>k.parent===d.id).length;
}
const used=d=>[...new Set(parts.map(p=>d.assignments[p.id]))].map(id=>products.get(id)).filter(Boolean);
const plaCount=d=>used(d).filter(p=>p.series==='PLA Basic').length;
const ago=n=>n===null?'官方':n<1?'今天':n<7?n+' 天前':n<30?Math.floor(n/7)+' 周前':Math.floor(n/30)+' 个月前';

// ---------- thumbnails (rendered progressively from the real model) ----------
const thumbs=new Map(),queue=[];let pumping=false;
function thumb(d,angle='hero'){const key=d.id+angle;if(thumbs.has(key))return thumbs.get(key);queue.push([d,angle,key]);pump();return '';}
function pump(){if(pumping)return;pumping=true;requestAnimationFrame(function step(){for(let i=0;i<2&&queue.length;i++){const [d,angle,key]=queue.shift();if(thumbs.has(key))continue;const url=view.snapshot(480,400,{colors:d.colors,angle}).toDataURL('image/png');thumbs.set(key,url);$$(`img[data-thumb="${key}"]`).forEach(img=>{img.src=url;img.classList.add('ready');});}if(queue.length)requestAnimationFrame(step);else pumping=false;});}
const img=(d,angle='hero',cls='',lazy=false)=>{const key=d.id+angle,src=lazy?thumbs.get(key)||'':thumb(d,angle);return `<img class="${cls} ${src?'ready':''}" data-thumb="${key}" src="${src}" alt="${esc(d.title)}">`;};

// ---------- state ----------
let sort='hot',fam='all',tags=new Set(),query='',listTab=null,detailId=null,returnHash='#',confirmDelete=null;
const score=d=>(d.rating*d.count+3.5*3)/(d.count+3);
const heat=d=>d.official?(d.forks*2)/40:(d.forks*2+d.count*d.rating/2+1)/(d.days+3);
function filtered(){
  let list=designs.filter(d=>(fam==='all'||d.family===fam)&&(!query||(d.title+d.author.name+used(d).map(p=>p.name).join('')).toLowerCase().includes(query.toLowerCase())));
  if(tags.has('ams'))list=list.filter(d=>plaCount(d)<=4);if(tags.has('remix'))list=list.filter(d=>d.parent);if(tags.has('official'))list=list.filter(d=>d.official);
  return list.sort(sort==='new'?(a,b)=>b.created-a.created:sort==='top'?(a,b)=>(b.official?-1:score(b))-(a.official?-1:score(a)):(a,b)=>heat(b)-heat(a));
}
let visible=[];

// ---------- list views ----------
function strip(d){return `<span class="strip">${used(d).filter(p=>p.series==='PLA Basic').slice(0,5).map(p=>`<i style="--c:${p.hex}"></i>`).join('')}</span>`;}
const stars=d=>d.official?'<span class="star muted">官方配色</span>':d.count?`<span class="star">★ ${d.rating.toFixed(1)} <small>(${d.count})</small></span>`:'<span class="star muted">还没有评分</span>';
function card(d){
  return `<article class="card ${d.mine?'mine':''}" data-id="${d.id}"><a class="visual" href="#d/${d.id}">${img(d,'hero','a')}${img(d,'back','b',true)}<span class="badges">${d.mine?'<b class="me">我的作品</b>':''}${d.official?'<b class="off">🦆 官方</b>':''}${d.parent?'<b>🔁 改编</b>':''}</span><span class="quick">${d.mine&&d.schemeId?`<button data-edit="${d.schemeId}">继续编辑</button>`:`<button data-same="${d.id}">做同款</button>`}</span></a>
  <div class="body"><div class="row"><h3><a href="#d/${d.id}">${esc(d.title)}</a></h3>${strip(d)}</div><div class="author">${avatarHTML(d.author,'sm')}${esc(d.author.name)}<span>· ${ago(d.days)}</span></div>
  <div class="foot">${stars(d)}<span>${d.forks} 次同款</span><span class="${plaCount(d)<=4?'ams':''}" title="${plaCount(d)<=4?'PLA 不超过 4 色，一台 AMS 可以一次打完':''}">${used(d).length} 色</span></div><div class="card-actions"><button data-copy-link="${d.id}" aria-label="复制「${esc(d.title)}」链接">复制链接</button><button data-share="${d.id}" aria-label="分享「${esc(d.title)}」海报">分享海报</button></div></div></article>`;
}
function home(){
  const works=designs.filter(d=>!d.official),authors=new Set(works.map(d=>d.author.id)).size,picks=[...(works.length>=3?works:designs)].sort((a,b)=>heat(b)-heat(a)).slice(0,3),mineCount=works.filter(d=>d.mine).length;
  $('#app').innerHTML=`<section class="hero"><div><span class="eyebrow">配色广场</span><h1>${works.length?`${works.length} 套配色，${authors} 位作者`:'来发布第一套配色 🦆'}</h1><p>看看朋友们把机器鸭涂成了什么样。喜欢就「做同款」带回涂装台接着改，改编会挂在原作的家族树下。</p><div class="hero-actions"><a class="primary" href="../">配一只新的 →</a>${account.user?'':'<button class="ghost" id="hero-login">登录 / 注册</button>'}</div></div><div class="hero-cards">${picks.map((d,i)=>`<a href="#d/${d.id}" style="--i:${i}">${img(d)}<span>${esc(d.title)}</span></a>`).join('')}</div></section>
  ${loadError?`<div class="empty soft">没能连上服务器：${esc(loadError)}。现在只显示官方配色。</div>`:''}
  ${mineCount?`<a class="mine-strip" href="#mine"><span>🦆 你发布了 ${mineCount} 套配色</span><b>去「我的方案」看看 →</b></a>`:''}
  <section class="filters"><div class="sorts">${[['hot','热门'],['new','最新'],['top','高分']].map(([k,l])=>`<button data-sort="${k}" class="${sort===k?'on':''}">${l}</button>`).join('')}</div>
  <div class="fams">${Object.entries(FAMILY_NAMES).map(([k,l])=>`<button data-fam="${k}" class="${fam===k?'on':''}">${k!=='all'?`<i style="--c:${FAMILY_DOT[k]}"></i>`:''}${l}</button>`).join('')}</div>
  <div class="tags">${[['ams','🧩 AMS 一次打完'],['remix','🔁 改编作品'],['official','🦆 官方配色']].map(([k,l])=>`<button data-tag="${k}" class="${tags.has(k)?'on':''}">${l}</button>`).join('')}</div></section>
  <p class="count" id="count"></p><section class="grid" id="grid"></section>`;
  grid();
}
function grid(){visible=filtered();$('#count').textContent=visible.length+' 套配色 · XGO Duck V2';$('#grid').innerHTML=visible.map(card).join('')||'<div class="empty">没有符合条件的配色，<button id="clear">清除筛选</button></div>';}
// 我的方案: what I published plus the private schemes saved to my account in the studio.
function mine(){
  if(!account.user){visible=[];$('#app').innerHTML=`<section class="mine-head"><div><span class="eyebrow">我的方案</span><h1>登录后看看你的鸭子们</h1><p>用昵称 + 简单密码登录，涂装台里保存和发布的方案都会出现在这里，换台电脑也找得回。</p></div><button class="primary" id="mine-login">登录 / 注册</button></section>`;return;}
  const me=account.user,pub=designs.filter(d=>d.mine);visible=pub;
  const priv=schemes.map(s=>({id:'s:'+s.id,schemeId:s.id,title:s.name,colors:s.design.colors,updated:s.updated,published:pub.some(p=>p.schemeId===s.id)}));
  $('#app').innerHTML=`<section class="mine-head"><div><span class="eyebrow">我的方案 · 保存在你的账号里</span><h1>${avatarHTML(me,'big')} ${esc(me.name)} 的鸭子们</h1><p>在涂装台「保存到我的方案」或「发布到广场」，就会出现在这里。</p></div><a class="primary" href="../">＋ 配一只新的</a></section>
  <h2 class="sec">已发布 <small>${pub.length}</small></h2>${pub.length?`<section class="grid">${pub.map(card).join('')}</section>`:'<div class="empty soft">还没有发布过。在涂装台第 3 步点「发布到广场」。</div>'}
  <h2 class="sec">私有方案 <small>${priv.length} · 只有你能看到</small></h2>${priv.length?`<section class="grid">${priv.map(p=>`<article class="card priv" data-id="${p.id}"><a class="visual" href="../#scheme=${encodeURIComponent(p.schemeId)}">${img(p,'hero','a')}<span class="badges">${p.published?'<b class="me">已发布</b>':'<b>私有</b>'}</span><span class="quick"><button data-edit="${p.schemeId}">继续编辑</button></span></a><div class="body"><div class="row"><h3>${esc(p.title)}</h3><span class="strip">${[...new Set(Object.values(p.colors))].slice(0,5).map(c=>`<i style="--c:${c}"></i>`).join('')}</span></div><div class="author"><span>${p.updated?'更新于 '+new Date(p.updated).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''}</span></div></div></article>`).join('')}</section>`:'<div class="empty soft">还没有保存的方案。在涂装台点「保存到我的方案」。</div>'}`;
}

// ---------- detail (an overlay above the list, so closing returns to the same scroll position) ----------
function diff(d,parent){
  const major=(x,z)=>{const c={};for(const id of z.ids)c[x.assignments[id]]=(c[x.assignments[id]]||0)+1;return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0];};
  return ZONES.filter(z=>!z.internal).flatMap(z=>{const a=major(parent,z),b=major(d,z);return a===b?[]:[`<span class="chg">${esc(z.name)}<i style="--c:${products.get(a)?.hex}"></i>→<i style="--c:${products.get(b)?.hex}"></i></span>`];}).join('');
}
const byId=id=>designs.find(x=>x.id===id);
function tree(d){
  let root=d;while(root.parent&&byId(root.parent))root=byId(root.parent);
  const node=x=>{const kids=designs.filter(k=>k.parent===x.id),parent=x.parent&&byId(x.parent);
    return `<li><a class="node ${x.id===d.id?'me':''}" href="#d/${x.id}">${img(x,'hero','')}<span><b>${esc(x.title)}</b><small>${esc(x.author.name)} · ${x.forks} 次同款</small>${parent?`<em>${diff(x,parent)||'微调'}</em>`:'<em class="origin">原作</em>'}</span></a>${kids.length?`<ul>${kids.map(node).join('')}</ul>`:''}</li>`;};
  const size=(function count(x){return 1+designs.filter(k=>k.parent===x.id).reduce((n,k)=>n+count(k),0);})(root);
  return size>1?`<ul class="tree">${node(root)}</ul>`:`<div class="empty-tab"><p>还没有人改编这套配色。</p><a class="primary" href="${sameHref(d)}">做第一个改编 →</a></div>`;
}
const sameHref=d=>'../#look='+lookCode({...d,name:d.title},parts,products)+'&src='+encodeURIComponent(d.title+'|'+d.author.name+'|'+d.id);
function rateUI(d){
  if(d.official)return '<div class="rate"><span>官方配色不参与评分，改编一下发布你的版本吧</span></div>';
  if(d.mine)return `<div class="rate"><span>自己的作品不能评分</span><button class="del ${confirmDelete===d.id?'armed':''}" id="del-work">${confirmDelete===d.id?'再点一次，确认删除':'删除作品'}</button></div>`;
  return `<div class="rate"><span>${account.user?'你觉得这套配色几分？':'登录后可以评分'}</span><div id="stars">${[1,2,3,4,5].map(n=>`<button data-rate="${n}" class="${n<=d.mineVote?'on':''}" aria-label="${n} 星">★</button>`).join('')}</div></div>`;
}
const statsHTML=d=>`<div><b>${d.official?'—':d.count?d.rating.toFixed(1):'—'}<em>★</em></b><small>${d.official?'官方配色':d.count+' 人评分'}</small></div><div><b>${d.forks}</b><small>次做同款</small></div><div><b>${used(d).length}</b><small>种耗材${plaCount(d)<=4?' · AMS 一次打完':''}</small></div>`;
function detail(id){
  const d=byId(id);if(!d){missingDetail();return;}
  if(detailId!==id)confirmDelete=null;
  detailId=id;const parent=d.parent&&byId(d.parent),list=used(d),i=visible.findIndex(x=>x.id===id),prev=i>0?visible[i-1]:null,next=i>=0?visible[i+1]:null;
  const ov=$('#detail');ov.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>ov.classList.add('open'));
  const source=parent?`改编自 <a href="#d/${parent.id}">「${esc(parent.title)}」· ${esc(parent.author.name)}</a>`:d.provenance?`改编自「${esc(d.provenance.title)}」· ${esc(d.provenance.author)}`:d.official?'官方配色':'原创配色';
  $('#detail-body').innerHTML=`<div class="dhead"><button class="dclose" id="dclose" aria-label="关闭">←</button><span>${i>=0?`${i+1} / ${visible.length}`:''}</span><div class="dnav"><button id="dprev" ${prev?'':'disabled'} aria-label="上一套">‹</button><button id="dnext" ${next?'':'disabled'} aria-label="下一套">›</button></div></div>
  <section class="detail"><div class="viewer" id="viewer"><div class="vdock"><div class="seg" id="views">${[['hero','¾'],['front','正'],['side','侧'],['back','背']].map(([k,l],j)=>`<button data-view="${k}" class="${j?'':'on'}">${l}</button>`).join('')}</div><button class="toggle" id="spin" aria-pressed="true">⟳ 转台</button><button class="hold" id="hold">按住看${parent?'原作':'初始配色'}</button></div></div>
  <aside class="info"><span class="eyebrow">${d.mine?'我的作品 · ':''}${d.official?'官方配色':ago(d.days)+' 发布'}</span><h1>${esc(d.title)}</h1><div class="author big">${avatarHTML(d.author)}<span>${esc(d.author.name)}<small>${source}</small></span></div>
  <p class="desc">${esc(d.desc)}</p>${parent?`<div class="changes"><span>改了什么</span>${diff(d,parent)||'<span class="chg">细节微调</span>'}</div>`:''}
  <div class="stats" id="stats">${statsHTML(d)}</div>
  <div class="cta">${d.mine&&d.schemeId?`<a class="primary big" href="../#scheme=${encodeURIComponent(d.schemeId)}">继续编辑</a>`:`<a class="primary big" href="${sameHref(d)}">做同款 · 带入涂装台</a>`}<button class="ghost big" id="copy-link">复制链接</button><button class="ghost big" id="share">分享海报</button></div>
  <div id="rate-slot">${rateUI(d)}</div>
  <details class="bom"><summary>耗材清单 · ${list.length} 种<span>＋</span></summary><ul>${list.map(p=>`<li><i style="--c:${p.hex}"></i><span>${esc(p.name)}<small>${p.series} · ${p.colorCode}</small></span><b>${parts.filter(x=>d.assignments[x.id]===p.id).length} 件</b></li>`).join('')}</ul></details></aside></section>
  <section class="tabs"><div class="tabbar"><button class="on">🔁 改编家族</button></div><div class="tabbody">${tree(d)}</div></section>`;
  $('#detail').scrollTop=0;view.mount($('#viewer'));view.setColors(d.colors);view.setTurntable(true);
  $('#views').onclick=e=>{const b=e.target.closest('[data-view]');if(!b)return;$$('#views button').forEach(x=>x.classList.toggle('on',x===b));view.view(b.dataset.view);};
  $('#spin').onclick=e=>{const on=!view.turntable;view.setTurntable(on);if(!on)view.resetSpin();e.currentTarget.setAttribute('aria-pressed',on);};
  const holdOn=()=>{view.setColors(parent?parent.colors:original.colors);$('#hold').classList.add('on');},holdOff=()=>{view.setColors(d.colors);$('#hold').classList.remove('on');};
  $('#hold').onpointerdown=holdOn;$('#hold').onpointerup=holdOff;$('#hold').onpointerleave=holdOff;
  $('#copy-link').onclick=()=>copyWorkLink(publicSite,d.id,toast);
  $('#share').onclick=()=>poster.open({workId:d.id,design:{...d,name:d.title,author:d.author.name},before:parent?{colors:parent.colors}:original});
  $('#dclose').onclick=closeDetail;$('#dprev').onclick=()=>prev&&(location.hash='#d/'+prev.id);$('#dnext').onclick=()=>next&&(location.hash='#d/'+next.id);
}
function missingDetail(){
  detailId='missing';view.setTurntable(false);
  const ov=$('#detail');ov.hidden=false;ov.classList.add('open');document.body.classList.add('locked');
  $('#detail-body').innerHTML=`<section class="missing-work"><h1>${loadError?'暂时无法读取这件作品':'这件作品暂时看不到了'}</h1><p>${loadError?'连接失败，请稍后重试。':'作品可能已被删除，或链接不完整。'}</p><button class="primary" id="missing-home">返回配色广场</button>${loadError?'<button class="ghost" id="missing-retry">重试</button>':''}</section>`;
  $('#missing-home').onclick=()=>{location.hash='#';};
  if($('#missing-retry'))$('#missing-retry').onclick=refresh;
}
async function rate(d,stars){
  try{await requireLogin('登录后就能给朋友的配色打分');}catch{return;}
  if(d.mine){detail(d.id);return toast('自己的作品不能评分');}
  try{const w=await api('PUT','/works/'+encodeURIComponent(d.id)+'/rating',{stars});Object.assign(d,{rating:w.rating.average,count:w.rating.count,mineVote:w.rating.mine});
    $('#stats').innerHTML=statsHTML(d);$('#rate-slot').innerHTML=rateUI(d);toast('已评 '+stars+' 星');}
  catch(err){toast('评分失败：'+err.message);}
}
async function deleteWork(d){
  if(confirmDelete!==d.id){confirmDelete=d.id;$('#rate-slot').innerHTML=rateUI(d);return;}
  try{await api('DELETE','/works/'+encodeURIComponent(d.id));}catch(err){return toast('删除失败：'+err.message);}
  confirmDelete=null;detailId=null;location.hash=returnHash;await refresh();toast('已删除「'+d.title+'」');
}
$('#detail-body').addEventListener('click',e=>{
  const d=byId(detailId);if(!d)return;
  const r=e.target.closest('[data-rate]');if(r)return rate(d,+r.dataset.rate);
  if(e.target.closest('#del-work'))return deleteWork(d);
});
function closeDetail(){location.hash=returnHash;}
function hideDetail(){const ov=$('#detail');if(ov.hidden)return;ov.classList.remove('open');document.body.classList.remove('locked');view.setTurntable(false);detailId=null;setTimeout(()=>{if(!detailId)ov.hidden=true;},260);}

// ---------- routing: list tabs stay mounted underneath the detail overlay ----------
function route(force){
  const h=location.hash,m=h.match(/^#d\/(.+)$/),tab=h==='#mine'?'mine':m?(listTab||'home'):'home';
  if(force||tab!==listTab){listTab=tab;tab==='mine'?mine():home();$$('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===tab));}
  if(!m)returnHash=tab==='mine'?'#mine':'#';
  if(m){try{detail(decodeURIComponent(m[1]));}catch{missingDetail();}}else hideDetail();
}
async function refresh(){await load();route(true);}
addEventListener('hashchange',()=>route());
$('#detail').addEventListener('click',e=>{if(e.target.id==='detail')closeDetail();});
addEventListener('keydown',e=>{
  if(e.target.matches?.('input,textarea')||document.querySelector('dialog[open]'))return;
  if(detailId){if(e.key==='Escape')closeDetail();if(e.key==='ArrowLeft')$('#dprev')?.click();if(e.key==='ArrowRight')$('#dnext')?.click();}
  else if(e.key==='/'){e.preventDefault();$('#q').focus();}
});
$('#app').addEventListener('click',e=>{
  const t=e.target;
  if(t.closest('#hero-login,#mine-login'))return requireLogin('').catch(()=>{});
  const s=t.closest('[data-sort]');if(s){sort=s.dataset.sort;$$('[data-sort]').forEach(x=>x.classList.toggle('on',x===s));return grid();}
  const f=t.closest('[data-fam]');if(f){fam=f.dataset.fam;$$('[data-fam]').forEach(x=>x.classList.toggle('on',x===f));return grid();}
  const g=t.closest('[data-tag]');if(g){tags.has(g.dataset.tag)?tags.delete(g.dataset.tag):tags.add(g.dataset.tag);g.classList.toggle('on');return grid();}
  if(t.closest('#clear')){fam='all';tags.clear();query='';$('#q').value='';return home();}
  const ed=t.closest('[data-edit]');if(ed){e.preventDefault();location.href='../#scheme='+encodeURIComponent(ed.dataset.edit);return;}
  const same=t.closest('[data-same]');if(same){e.preventDefault();location.href=sameHref(byId(same.dataset.same));return;}
  const cp=t.closest('[data-copy-link]');if(cp){e.preventDefault();return copyWorkLink(publicSite,cp.dataset.copyLink,toast);}
  const sh=t.closest('[data-share]');if(sh){e.preventDefault();const d=byId(sh.dataset.share),p=d.parent&&byId(d.parent);return poster.open({workId:d.id,design:{...d,name:d.title,author:d.author.name},before:p?{colors:p.colors}:original});}
});
// Hovering a card warms its back-view thumbnail so the swap is instant.
$('#app').addEventListener('pointerover',e=>{const c=e.target.closest('.card:not(.priv)');if(c)thumb(byId(c.dataset.id),'back');});
$('#q').oninput=e=>{query=e.target.value;if(listTab!=='home')location.hash='#';else grid();};

// ---------- paste a 配色码: preview it here, then open it in the studio ----------
const pasteBox=$('#paste-pop');
$('#paste-btn').onclick=e=>{e.stopPropagation();pasteBox.hidden=!pasteBox.hidden;if(!pasteBox.hidden)$('#paste-input').focus();};
document.addEventListener('click',e=>{if(!e.target.closest('#paste-pop,#paste-btn'))pasteBox.hidden=true;});
$('#paste-input').oninput=e=>{
  const raw=e.target.value.trim(),code=(raw.match(/#look=([^&\s]+)/)||[,raw])[1],out=$('#paste-preview');
  if(!raw){out.innerHTML='';return;}
  const workId=parseWorkLink(raw,publicSite);
  if(workId){const d=byId(workId);out.innerHTML=`<b>${d?esc(d.title):'查看分享的作品'}</b><a class="primary" href="#d/${encodeURIComponent(workId)}" id="paste-work">打开作品 →</a>`;$('#paste-work').onclick=()=>{pasteBox.hidden=true;};return;}

  try{const d=decodeLook(parts,products,code),name=d.name||'分享来的配色';out.innerHTML=`<img src="${view.snapshot(320,240,{colors:d.colors,angle:'hero'}).toDataURL('image/png')}" alt=""><b>${esc(name)}</b><a class="primary" href="../#look=${code}">带入涂装台 →</a>`;}
  catch(err){out.innerHTML=`<small class="warn">${esc(err.message)}</small>`;}
};
let toastTimer;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200);}
const accountUI=mountAccount($('#profile-slot'),{toast});
if(await initAccount())accountUI.refresh();
onAccount(refresh);
await refresh();
window.gallery={get designs(){return designs;}};
