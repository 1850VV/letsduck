// Accounts: a nickname and a simple password. The account is how 我的方案 and published works know
// they are yours on any device; the server keeps a salted hash, never the password itself.
import {api,getToken,setToken} from './api.mjs';

const AVATARS=['🦆','🐤','🐥','🪿','🐣','🦢','🐧','🦜'];
const COLORS=['#4d6bfe','#ff7a59','#2fb37a','#f2b51d','#9b6bff','#ef5da8','#2aa8c9','#5c6a85'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const avatarHTML=(p,cls='')=>`<span class="avatar ${cls}" style="--a:${p.color}">${p.avatar}</span>`;
export const account={user:null};
const listeners=new Set();
export const onAccount=fn=>{listeners.add(fn);return ()=>listeners.delete(fn);};
const changed=()=>listeners.forEach(fn=>fn(account.user));
export async function initAccount(){if(!getToken())return null;try{account.user=await api('GET','/me');}catch{account.user=null;}return account.user;}

let ui=null;
// Resolves with the user once signed in; opens the sign-in dialog when needed (rejects if dismissed).
export function requireLogin(reason){return account.user?Promise.resolve(account.user):ui?ui.ask(reason):Promise.reject(new Error('请先登录'));}

export function mountAccount(slot,{toast=()=>{}}={}){
  document.body.insertAdjacentHTML('beforeend',`<dialog class="profile-dialog" id="auth-dialog" aria-label="登录或注册"><form id="auth-form">
      <div class="pf-head"><span class="pf-eyebrow">涂鸭账号</span><button type="button" class="pf-x" data-close aria-label="关闭">×</button></div>
      <p class="pf-reason" id="auth-reason"></p>
      <div class="pf-tabs" role="tablist"><button type="button" data-mode="login" class="on">登录</button><button type="button" data-mode="register">注册</button></div>
      <label class="pf-field">昵称<input id="auth-name" maxlength="20" required autocomplete="username"></label>
      <label class="pf-field">密码<input id="auth-pass" type="password" minlength="4" required autocomplete="current-password"><small id="auth-hint">至少 4 位，记住就行</small></label>
      <p class="pf-error" id="auth-error" role="alert"></p>
      <button class="pf-save wide" id="auth-submit">登录</button>
    </form></dialog>
    <dialog class="profile-dialog" id="profile-dialog" aria-label="我的账号"><form method="dialog" id="profile-form">
      <div class="pf-head"><span class="pf-eyebrow">我的账号</span><button type="button" class="pf-x" data-close aria-label="关闭">×</button></div>
      <div class="pf-me"><span id="pf-avatar"></span><label>昵称<input id="pf-name" maxlength="20" required autocomplete="nickname"></label></div>
      <div class="pf-pick" id="pf-avatars">${AVATARS.map(a=>`<button type="button" data-avatar="${a}">${a}</button>`).join('')}</div>
      <div class="pf-pick colors" id="pf-colors">${COLORS.map(c=>`<button type="button" data-color="${c}" style="--a:${c}"></button>`).join('')}</div>
      <label class="pf-field">新密码<input id="pf-pass" type="password" minlength="4" placeholder="不改就留空" autocomplete="new-password"></label>
      <p class="pf-error" id="pf-error" role="alert"></p>
      <div class="pf-foot"><button type="button" class="pf-logout" id="pf-logout">退出登录</button><button class="pf-save" value="save">保存</button></div>
    </form></dialog>`);
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const authDlg=$('#auth-dialog'),profDlg=$('#profile-dialog');let mode='login',pending=null,draft=null;
  function chip(){slot.innerHTML=account.user?`<button class="profile-chip" type="button" title="我的账号">${avatarHTML(account.user)}<span>${esc(account.user.name)}</span></button>`:`<button class="profile-chip guest" type="button">登录 / 注册</button>`;}
  function setMode(m){mode=m;$$('#auth-dialog [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));$('#auth-submit').textContent=m==='login'?'登录':'注册并登录';$('#auth-pass').autocomplete=m==='login'?'current-password':'new-password';$('#auth-hint').hidden=m==='login';$('#auth-error').textContent='';}
  function ask(reason){$('#auth-reason').textContent=reason||'';$('#auth-reason').hidden=!reason;setMode('login');authDlg.showModal();setTimeout(()=>$('#auth-name').focus(),30);return new Promise((resolve,reject)=>{pending?.reject(new Error('取消'));pending={resolve,reject};});}
  function paint(){$('#pf-avatar').innerHTML=avatarHTML(draft,'big');$$('[data-avatar]').forEach(b=>b.classList.toggle('on',b.dataset.avatar===draft.avatar));$$('[data-color]').forEach(b=>b.classList.toggle('on',b.dataset.color===draft.color));}
  function openProfile(){draft={...account.user};$('#pf-name').value=draft.name;$('#pf-pass').value='';$('#pf-error').textContent='';paint();profDlg.showModal();}
  slot.addEventListener('click',()=>account.user?openProfile():ask('').catch(()=>{}));
  $$('#auth-dialog [data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  authDlg.querySelector('[data-close]').onclick=()=>authDlg.close();
  authDlg.addEventListener('close',()=>{if(pending&&!account.user){pending.reject(new Error('取消'));pending=null;}});
  $('#auth-form').onsubmit=async e=>{
    e.preventDefault();$('#auth-submit').disabled=true;$('#auth-error').textContent='';
    try{const r=await api('POST','/auth/'+mode,{name:$('#auth-name').value,password:$('#auth-pass').value});setToken(r.token);account.user=r.user;authDlg.close();chip();changed();toast((mode==='login'?'欢迎回来，':'欢迎加入，')+r.user.name);pending?.resolve(r.user);pending=null;}
    catch(err){$('#auth-error').textContent=err.message;}
    finally{$('#auth-submit').disabled=false;}
  };
  $('#pf-avatars').onclick=e=>{const b=e.target.closest('[data-avatar]');if(b){draft.avatar=b.dataset.avatar;paint();}};
  $('#pf-colors').onclick=e=>{const b=e.target.closest('[data-color]');if(b){draft.color=b.dataset.color;paint();}};
  profDlg.querySelector('[data-close]').onclick=()=>profDlg.close();
  $('#profile-form').onsubmit=async e=>{
    e.preventDefault();const body={name:$('#pf-name').value.trim(),avatar:draft.avatar,color:draft.color};if($('#pf-pass').value)body.password=$('#pf-pass').value;
    try{account.user=await api('PATCH','/me',body);profDlg.close();chip();changed();toast('已保存');}catch(err){$('#pf-error').textContent=err.message;}
  };
  $('#pf-logout').onclick=async()=>{try{await api('POST','/auth/logout',{});}catch{}setToken(null);account.user=null;profDlg.close();chip();changed();toast('已退出登录');};
  chip();
  ui={ask,refresh:chip};
  return ui;
}
