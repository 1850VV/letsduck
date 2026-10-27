export const APP_ORIGIN='duck://app';
export function localURL(value:string):boolean{try{const url=new URL(value);return url.protocol==='duck:'&&url.hostname==='app'&&!url.port&&!url.username&&!url.password&&!url.pathname.replaceAll('\\','/').startsWith('//');}catch{return false;}}
export function externalURL(value:string):boolean{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
export function localPermission(origin:string,permission:string):boolean{return localURL(origin)&&['clipboard-sanitized-write','fullscreen'].includes(permission);}
export function proxyURL(value:string,backend:string):string{
 const source=new URL(value),target=new URL(backend);
 // Assign path components; a network-path reference must never replace authority.
 target.pathname=source.pathname;target.search=source.search;target.hash='';return target.href;
}
