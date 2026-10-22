// Thin client for the letsduck API (same origin: nginx proxies /api in production, run.py in development).
import {errorText} from './i18n.mjs';
const KEY='dd-token';
let token=null;try{token=localStorage.getItem(KEY);}catch{}
export const getToken=()=>token;
export function setToken(t){token=t||null;try{t?localStorage.setItem(KEY,t):localStorage.removeItem(KEY);}catch{}}
function failure(code='request_failed',params={},status=0){const error=Object.assign(new Error(),{code,params,status});Object.defineProperty(error,'message',{get:()=>errorText(error)});return error;}
export async function api(method,path,body){
  let res;try{res=await fetch('/api'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body!==undefined?JSON.stringify(body):undefined});}catch{throw failure();}
  let data=null;try{data=await res.json();}catch{}
  if(res.status===401&&token)setToken(null);
  if(!res.ok)throw failure(data?.code||'request_failed',data?.params||{},res.status);
  return data;
}
