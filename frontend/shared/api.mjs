// Thin client for the DoodleDuck API (same origin: nginx proxies /api in production, run.py in development).
const KEY='dd-token';
let token=null;try{token=localStorage.getItem(KEY);}catch{}
export const getToken=()=>token;
export function setToken(t){token=t||null;try{t?localStorage.setItem(KEY,t):localStorage.removeItem(KEY);}catch{}}
export async function api(method,path,body){
  const res=await fetch('/api'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body!==undefined?JSON.stringify(body):undefined});
  let data=null;try{data=await res.json();}catch{}
  if(res.status===401&&token)setToken(null);
  if(!res.ok)throw Object.assign(new Error(data?.error||'请求失败（'+res.status+'）'),{status:res.status});
  return data;
}
