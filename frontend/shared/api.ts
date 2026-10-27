// Thin client for the letsduck API; Node and browser retain one exact wire format.
import {errorText} from './i18n.js';
import {jsonStringify,parseResponseJson} from './json.js';
import {record,parseScheme,parseUser,parseWork,parseExportPlan} from './guards.js';
import type {AuthResult,ApiFailure,Scheme,User,Work} from './types.js';
import type {ExportPlan} from '@letsduck/contracts';
const KEY='dd-token';
let token:string|null=null;try{token=localStorage.getItem(KEY);}catch{}
export const getToken=()=>token;
export function setToken(value:string|null){token=value||null;try{value?localStorage.setItem(KEY,value):localStorage.removeItem(KEY);}catch{}}
function failure(code='request_failed',params:Record<string,unknown>={},status=0):ApiFailure {const error=Object.assign(new Error(),{code,params,status});Object.defineProperty(error,'message',{get:()=>errorText(error)});return error;}
function decode(method:string,path:string,value:unknown):unknown {
  if(path==='/me')return parseUser(value);
  if(path==='/schemes'){if(!Array.isArray(value))throw Error('Invalid scheme list response');return value.map(parseScheme);}
  if(path.startsWith('/schemes/')&&method==='PUT')return parseScheme(value);
  if(path==='/works'&&method==='GET'){if(!Array.isArray(value))throw Error('Invalid works response');return value.map(parseWork);}
  if((path==='/works'&&method==='POST')||(path.startsWith('/works/')&&method!=='DELETE'))return parseWork(value);
  if(path==='/plan')return parseExportPlan(value);
  if(path==='/auth/login'||path==='/auth/register'){if(!record(value)||typeof value.token!=='string')throw Error('Invalid account response');return {token:value.token,user:parseUser(value.user)};}
  return value;
}
type SchemePath=`/schemes/${string}`;
type WorkPath=`/works/${string}`;
type Ok={ok:true};
export function api(method:'GET',path:'/me',body?:unknown):Promise<User>;
export function api(method:'GET',path:'/schemes',body?:unknown):Promise<Scheme[]>;
export function api(method:'GET',path:'/works',body?:unknown):Promise<Work[]>;
export function api(method:'GET',path:WorkPath,body?:unknown):Promise<Work>;
export function api(method:'PUT',path:SchemePath,body?:unknown):Promise<Scheme>;
export function api(method:'PUT',path:`/works/${string}/rating`,body?:unknown):Promise<Work>;
export function api(method:'DELETE',path:SchemePath|WorkPath,body?:unknown):Promise<Ok>;
export function api(method:'PATCH',path:'/me',body?:unknown):Promise<User>;
export function api(method:'POST',path:'/works',body?:unknown):Promise<Work>;
export function api(method:'POST',path:'/plan',body?:unknown):Promise<ExportPlan>;
export function api(method:'POST',path:'/auth/login'|'/auth/register',body?:unknown):Promise<AuthResult>;
export function api(method:'POST',path:'/auth/logout',body?:unknown):Promise<Ok>;
export function api(method:string,path:string,body?:unknown):Promise<unknown>;
export async function api(method:string,path:string,body?:unknown):Promise<unknown>{
  let response:Response;try{response=await fetch('/api'+path,{method,headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},...(body!==undefined?{body:jsonStringify(body)}:{})});}catch{throw failure();}
  let data:unknown=null;try{data=await parseResponseJson(response);}catch{}
  if(response.status===401&&token)setToken(null);
  if(!response.ok)throw failure(record(data)&&typeof data.code==='string'?data.code:'request_failed',record(data)&&record(data.params)?data.params:{},response.status);
  return decode(method,path,data);
}
