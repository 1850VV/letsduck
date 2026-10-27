export const APP_ORIGIN='duck://app';
export function localURL(value:string):boolean{try{const url=new URL(value);return url.protocol==='duck:'&&url.hostname==='app'&&!url.port&&!url.username&&!url.password;}catch{return false;}}
export function externalURL(value:string):boolean{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
export function localPermission(origin:string,permission:string):boolean{return localURL(origin)&&['clipboard-sanitized-write','fullscreen'].includes(permission);}
export function proxyURL(value:string,backend:string):string{const url=new URL(value);return new URL(url.pathname+url.search,backend).href;}
