import {existsSync} from 'node:fs';
import {basename,extname,join} from 'node:path';
import {APP_ORIGIN,localURL,proxyURL} from './navigation.js';
type Fetcher=(url:string,init:RequestInit)=>Promise<Response>;
export function activityCounter(){
 let count=0;const waiting=new Set<()=>void>();
 return{change(delta:1|-1){count+=delta;if(count===0){for(const resolve of waiting)resolve();waiting.clear();}},wait:()=>count===0?Promise.resolve():new Promise<void>(resolve=>waiting.add(resolve))};
}
export function createProtocolHandler(options:{backend:string;panel:()=>Promise<string>;write:(delta:1|-1)=>void;fetch?:Fetcher;accepting?:()=>boolean}){
 return async(request:Request):Promise<Response>=>{
  if(!localURL(request.url))return new Response('Forbidden',{status:403});
  if(new URL(request.url).pathname==='/__desktop/update-panel.js')return new Response(await options.panel(),{headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache'}});
  const target=new URL(proxyURL(request.url,options.backend));
  if(target.origin!==new URL(options.backend).origin)return new Response('Forbidden',{status:403});
  const headers=new Headers(request.headers);headers.delete('host');
  const writing=request.method!=='GET'&&request.method!=='HEAD';
  if(writing&&options.accepting?.()===false)return new Response('Application is closing',{status:503});
  if(writing)options.write(1);
  let released=false;
  const release=()=>{if(writing&&!released){released=true;options.write(-1);}};
  try{
   const init:RequestInit&{duplex?:'half'}={method:request.method,headers,redirect:'manual',signal:request.signal};
   // Custom-scheme Request omits Content-Length; shared Python-compatible HTTP
   // deliberately reads exactly that length instead of accepting chunked JSON.
   if(writing){const bytes=await request.arrayBuffer();init.body=bytes;headers.set('content-length',String(bytes.byteLength));}
   const response=await(options.fetch??fetch)(target.href,init);
   const output=new Headers(response.headers),location=output.get('location');
   if(location){const redirect=new URL(location,options.backend);if(redirect.origin!==new URL(options.backend).origin){await response.body?.cancel();release();return new Response('External redirect refused',{status:502});}output.set('location',APP_ORIGIN+redirect.pathname+redirect.search+redirect.hash);}
   let body=response.body;
   if(writing&&body){
    const reader=body.getReader();
    body=new ReadableStream<Uint8Array<ArrayBuffer>>({
     async pull(controller){try{const chunk=await reader.read();if(chunk.done){release();controller.close();}else controller.enqueue(chunk.value);}catch(error){release();controller.error(error);}},
     async cancel(reason:unknown){try{await reader.cancel(reason);}finally{release();}},
    });
   }else release();
   return new Response(body,{status:response.status,statusText:response.statusText,headers:output});
  }catch(error){release();throw error;}
 };
}
export function reserveDownloadPath(directory:string,filename:string,reserved:Set<string>):string{
 const name=basename(filename.replaceAll('\\','/'))||'download',extension=extname(name),stem=name.slice(0,name.length-extension.length);
 let path=join(directory,name),index=0;
 while(existsSync(path)||reserved.has(path))path=join(directory,stem+' ('+(++index)+')'+extension);
 reserved.add(path);return path;
}
