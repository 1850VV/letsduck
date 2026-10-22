// Share previews use a canonical public work link only for published works.
import {encodeLook,designNotes} from '../lib/quick-style.mjs';
import {BRAND} from './brand.mjs';
import {drawQR} from './qr.mjs';
import {workURL,loadPublicSite,copyText,UNCONFIGURED_SHARE} from './work-links.mjs';

const RATIOS={'3:4':[1080,1440,'小红书 · 竖版'],'1:1':[1080,1080,'朋友圈 · 方形'],'9:16':[1080,1920,'手机壁纸 · 故事']};
const THEMES={light:{bg:['#f4f6fb','#e3e8f5'],ink:'#17243c',muted:'#6b7891',brand:'#4d6bfe',card:'#ffffffcc'},dark:{bg:['#1a2140','#0d1226'],ink:'#f3f5ff',muted:'#9aa6c6',brand:'#8fa2ff',card:'#ffffff14'}};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mix(hex,to,t){const a=parseInt(hex.slice(1),16),b=parseInt(to.slice(1),16),c=s=>Math.round(((a>>s)&255)*(1-t)+((b>>s)&255)*t);return `rgb(${c(16)},${c(8)},${c(0)})`;}

function wrap(ctx,text,maxWidth){const lines=[''];for(const ch of text){const t=lines.at(-1)+ch;if(ctx.measureText(t).width>maxWidth){lines.push(ch);}else lines[lines.length-1]=t;}return lines;}

export function drawPoster({view,design,parts,products,before,opts,workUrl=null}){
  const [W,H]=RATIOS[opts.ratio],t=THEMES[opts.theme==='dark'?'dark':'light'],cv=document.createElement('canvas');cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const used=[...new Set(parts.map(p=>design.assignments[p.id]))].map(id=>products.get(id)).filter(Boolean);
  const main=design.colors['P5-06']||used[0]?.hex||'#4d6bfe';
  const g=ctx.createLinearGradient(0,0,W*.3,H);
  if(opts.theme==='tint'){g.addColorStop(0,mix(main,'#ffffff',.82));g.addColorStop(1,mix(main,'#ffffff',.6));}else{g.addColorStop(0,t.bg[0]);g.addColorStop(1,t.bg[1]);}
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const pad=72,footH=270,maxRows=Math.max(1,Math.floor((H-footH-140-150-240-54)/74));
  const shown=used.slice(0,maxRows*3),remaining=used.length-shown.length;
  const infoH=(opts.materials?Math.ceil(shown.length/3)*74+24+(remaining?30:0):0)+150,modelH=H-footH-infoH-140;
  ctx.fillStyle=t.brand;ctx.font='700 26px -apple-system,"PingFang SC",sans-serif';ctx.fillText(BRAND.zh+' '+BRAND.en+' · XGO Duck V2',pad,92);
  ctx.drawImage(view.snapshot(W,modelH,{colors:design.colors}),0,120);
  if(opts.compare&&before){const s=Math.round(W*.26),img=view.snapshot(s,Math.round(s*1.15),{colors:before.colors});const x=W-pad-s,y=140;ctx.fillStyle=t.card;ctx.beginPath();ctx.roundRect(x-8,y-8,s+16,s*1.15+52,22);ctx.fill();ctx.drawImage(img,x,y);ctx.fillStyle=t.muted;ctx.font='600 20px sans-serif';ctx.textAlign='center';ctx.fillText('改色前 → 改色后',x+s/2,y+s*1.15+30);ctx.textAlign='left';}
  let y=120+modelH+70;
  ctx.fillStyle=t.ink;ctx.font='800 68px -apple-system,"PingFang SC",sans-serif';for(let size=66;ctx.measureText(design.name||'我的机器鸭').width>W-pad*2&&size>=18;size-=2)ctx.font='800 '+size+'px -apple-system,"PingFang SC",sans-serif';ctx.fillText(design.name||'我的机器鸭',pad,y);y+=52;
  ctx.fillStyle=t.muted;ctx.font='28px -apple-system,"PingFang SC",sans-serif';ctx.fillText([opts.author&&design.author,designNotes(design.colors,design.assignments).count+' 种耗材','35 个打印零件'].filter(Boolean).join(' · '),pad,y);y+=46;
  if(opts.materials)shown.forEach((p,i)=>{const x=pad+(i%3)*((W-pad*2)/3),yy=y+Math.floor(i/3)*74;ctx.fillStyle=p.hex;ctx.beginPath();ctx.roundRect(x,yy,50,50,12);ctx.fill();ctx.strokeStyle='#0002';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=t.ink;ctx.font='600 24px "PingFang SC",sans-serif';ctx.fillText(p.name,x+66,yy+22);ctx.fillStyle=t.muted;ctx.font='19px sans-serif';ctx.fillText(p.series+' '+p.colorCode,x+66,yy+47);});
  if(opts.materials&&remaining){ctx.fillStyle=t.muted;ctx.font='20px "PingFang SC",sans-serif';ctx.fillText('另有 '+remaining+' 种耗材',pad,y+Math.ceil(shown.length/3)*74+16);}
  const fy=H-footH+34,qr=200;
  ctx.fillStyle=t.card;ctx.beginPath();ctx.roundRect(pad-24,fy-24,W-pad*2+48,footH-50,28);ctx.fill();
  ctx.fillStyle=t.ink;ctx.font='700 30px "PingFang SC",sans-serif';
  ctx.fillText(workUrl?'扫码查看这件作品':'我的机器鸭配色',pad,fy+44);
  ctx.fillStyle=t.muted;ctx.font='24px "PingFang SC",sans-serif';
  ctx.fillText(workUrl?'无需登录，打开后可以做同款。':'复制完整配色码，在涂鸭里做同款。',pad,fy+91);
  if(workUrl){
    ctx.font='19px sans-serif';
    wrap(ctx,new URL(workUrl).host,W-pad*2-qr-40).slice(0,2).forEach((line,i)=>ctx.fillText(line,pad,fy+135+i*25));
    drawQR(ctx,workUrl,W-pad-qr,fy,qr);
  }
  return cv;
}
export function lookCode(design,parts,products,withName=true){try{return encodeLook(parts,products,design.assignments,withName?design.name:'');}catch{return '（先为全部零件匹配实际耗材）';}}

export function createPosterDialog({view,parts,products,compact=false}){
  document.body.insertAdjacentHTML('beforeend',`<dialog id="poster-dialog" class="poster-dialog ${compact?'compact':''}" aria-label="分享海报预览">
<div class="poster-head"><h2 id="poster-title">分享海报</h2><button class="poster-x" id="poster-close" aria-label="关闭分享">×</button></div>
<div class="poster-wrap"><div class="poster-stage"><img id="poster-img" alt="分享海报预览"><span class="poster-busy" id="poster-busy">正在生成…</span></div>
<div class="poster-side"><p class="poster-intro">把喜欢的配色发给朋友。<br>扫码或打开链接，直接看这件作品。</p>
<button class="poster-primary poster-link" id="poster-copy-link" disabled>复制作品链接</button>
<div class="poster-manual" id="poster-manual" hidden><p>自动复制未成功，请选择下方链接复制。</p><input readonly id="poster-link-value" aria-label="手动复制作品链接"></div>
<div class="poster-actions"><button id="poster-save" disabled>保存海报</button><a id="poster-open-link" target="_blank" rel="noopener" hidden>打开链接预览</a></div>
<p class="poster-note" id="poster-note"></p><p class="poster-status" id="poster-status" role="status"></p>
<details class="poster-settings" ${compact?'':'open'}><summary>更多海报设置</summary>
<div class="poster-group"><span>尺寸</span><div class="poster-seg" id="poster-ratio">${Object.entries(RATIOS).map(([k,v])=>`<button data-v="${k}"><b>${k}</b><small>${v[2]}</small></button>`).join('')}</div></div>
<div class="poster-group"><span>背景</span><div class="poster-seg small" id="poster-theme"><button data-v="light">浅色</button><button data-v="tint">主色调</button><button data-v="dark">深色</button></div></div>
<div class="poster-group"><span>内容</span><label><input type="checkbox" id="poster-materials" ${compact?'':'checked'}> 耗材清单</label><label><input type="checkbox" id="poster-compare"> 改色前后对比</label><label><input type="checkbox" id="poster-author" checked> 署名</label></div>
<div class="poster-group"><span>配色码 <small>对方粘贴即可带入</small></span><div class="poster-code"><code id="poster-code"></code><button id="poster-copy-code">复制</button></div></div>
<div class="poster-actions"><button id="poster-copy-img" disabled>复制图片</button><button id="poster-share" hidden>分享…</button></div>
</details></div></div></dialog>`);
  const $=s=>document.querySelector(s),dlg=$('#poster-dialog'),opts={ratio:'3:4',theme:'light',materials:!compact,compare:false,author:true};
  let current=null,blob=null,timer,renderVersion=0,openVersion=0;
  const status=m=>{$('#poster-status').textContent=m;clearTimeout(timer);};
  const ready=on=>{for(const id of ['#poster-save','#poster-copy-img','#poster-share'])$(id).disabled=!on;};
  function sync(){for(const [id,key] of [['#poster-ratio','ratio'],['#poster-theme','theme']])dlg.querySelectorAll(id+' button').forEach(b=>b.classList.toggle('on',b.dataset.v===opts[key]));}
  function render(){
    if(!current)return;
    const version=++renderVersion,input=current;blob=null;ready(false);$('#poster-busy').hidden=false;sync();
    requestAnimationFrame(()=>{
      if(version!==renderVersion||!dlg.open)return;
      try{
        const cv=drawPoster({view,parts,products,...input,opts});
        $('#poster-img').src=cv.toDataURL('image/png');$('#poster-img').style.aspectRatio=cv.width+'/'+cv.height;
        cv.toBlob(b=>{if(version!==renderVersion||!dlg.open)return;blob=b;$('#poster-busy').hidden=true;ready(!!b);if(!b)status('海报生成失败，请重新打开重试');},'image/png');
      }catch{if(version===renderVersion){$('#poster-busy').hidden=true;status('海报生成失败，请重新打开重试');}}
    });
  }
  dlg.querySelector('#poster-ratio').onclick=e=>{const b=e.target.closest('button');if(b){opts.ratio=b.dataset.v;render();}};
  dlg.querySelector('#poster-theme').onclick=e=>{const b=e.target.closest('button');if(b){opts.theme=b.dataset.v;render();}};
  for(const k of ['materials','compare','author'])$('#poster-'+k).onchange=e=>{opts[k]=e.target.checked;render();};
  $('#poster-close').onclick=()=>dlg.close();dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close();});
  dlg.addEventListener('close',()=>{++openVersion;++renderVersion;blob=null;ready(false);});
  const fileName=()=>'XGO-Duck-'+(current.design.name||'palette').replace(/[\\/:*?"<>|]/g,'_')+'-'+opts.ratio.replace(':','x')+'.png';
  $('#poster-save').onclick=()=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fileName();a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status('海报已生成，请查看浏览器下载');};
  $('#poster-copy-img').onclick=async()=>{if(!blob)return;try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);status('图片已复制，可粘贴给朋友');}catch{status('此浏览器不支持复制图片，请用“保存海报”');}};
  $('#poster-copy-code').onclick=async()=>{try{await copyText($('#poster-code').textContent);status('配色码已复制');}catch{const selection=getSelection(),range=document.createRange();range.selectNodeContents($('#poster-code'));selection.removeAllRanges();selection.addRange(range);status('复制失败，请手动选择配色码');}};
  $('#poster-copy-link').onclick=async()=>{
    const url=current?.workUrl;if(!url)return;
    try{await copyText(url);$('#poster-manual').hidden=true;status('作品链接已复制');}
    catch{$('#poster-manual').hidden=false;$('#poster-link-value').value=url;$('#poster-link-value').focus();$('#poster-link-value').select();status('尚未复制');}
  };
  $('#poster-share').onclick=async()=>{if(!blob)return;try{await navigator.share({files:[new File([blob],fileName(),{type:'image/png'})],title:current.design.name});}catch{}};
  return {async open(input){
    const version=++openVersion;current=null;++renderVersion;blob=null;ready(false);
    $('#poster-title').textContent='分享「'+(input.design.name||'我的机器鸭')+'」';$('#poster-code').textContent=lookCode(input.design,parts,products);
    $('#poster-compare').disabled=!input.before;opts.compare=!!input.before&&opts.compare;$('#poster-compare').checked=opts.compare;
    $('#poster-copy-link').disabled=true;$('#poster-open-link').hidden=true;$('#poster-open-link').removeAttribute('href');
    $('#poster-manual').hidden=true;$('#poster-note').textContent='';status('');$('#poster-img').removeAttribute('src');$('#poster-busy').hidden=false;
    $('#poster-share').hidden=!(navigator.canShare?.({files:[new File([''],'a.png',{type:'image/png'})]}));
    if(!dlg.open)dlg.showModal();
    const snapshot=structuredClone(input),site=await loadPublicSite();
    if(version!==openVersion||!dlg.open)return;
    current={...snapshot,workUrl:workURL(site,snapshot.workId)};
    $('#poster-copy-link').disabled=!current.workUrl;
    $('#poster-note').textContent=current.workUrl?'朋友无需登录，就能查看作品。':snapshot.workId?UNCONFIGURED_SHARE:'这份方案尚未发布，海报不包含作品二维码。可以先复制配色码，或发布到广场后分享作品。';
    if(current.workUrl){$('#poster-open-link').href=current.workUrl;$('#poster-open-link').hidden=false;}
    render();
  }};
}
