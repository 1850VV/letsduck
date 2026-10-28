/** Bounded failure evidence for the owned portable browser; never retries a failed product step. */
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import type {Page} from 'playwright';
import {failure} from './check-support.js';

export function observePortablePage(page:Page,events:unknown[]){
 page.on('pageerror',error=>events.push({kind:'pageerror',message:error.message,pageUrl:page.url()}));
 page.on('console',message=>{if(message.type()==='error')events.push({kind:'console',message:message.text(),location:message.location(),pageUrl:page.url()});});
 page.on('requestfailed',request=>events.push({kind:'requestfailed',url:request.url(),method:request.method(),resourceType:request.resourceType(),failure:request.failure(),pageUrl:page.url()}));
 page.on('response',response=>{if(response.status()>=400)events.push({kind:'httpError',url:response.url(),status:response.status(),resourceType:response.request().resourceType(),pageUrl:page.url()});});
 page.on('framenavigated',frame=>{if(frame===page.mainFrame())events.push({kind:'navigation',url:frame.url()});});
}

type Artifact={path:string;saved:boolean;truncated?:boolean;error?:string};
type DocumentState={url:string;title:string;readyState:string;homeReady:string|null;loading:string|null;bodyText:string;scripts:Array<{src:string;type:string}>;modulePreloads:string[];visibility:string;focused:boolean;viewport:{width:number;height:number}};
interface FailureReceipt{pageUrl:string|null;document:DocumentState|null;documentError:string|null;artifacts:{dom:Artifact;screenshot:Artifact}}
export async function capturePortableFailure(page:Page|undefined,output:string):Promise<FailureReceipt>{
 const receipt:FailureReceipt={pageUrl:page?.url()??null,document:null,documentError:null,artifacts:{dom:{path:join(output,'failure-dom.html'),saved:false},screenshot:{path:join(output,'failure.png'),saved:false}}};
 if(!page){receipt.documentError='No browser page was created';return receipt;}
 try{
  receipt.document=await page.evaluate(()=>({
   url:location.href,title:document.title,readyState:document.readyState,homeReady:document.body?.dataset.homeReady??null,
   loading:document.querySelector('#home-loading')?.textContent?.trim().slice(0,600)??null,bodyText:document.body?.innerText.slice(0,2000)??'',
   scripts:Array.from(document.scripts).slice(0,24).map(script=>({src:script.src,type:script.type})),
   modulePreloads:Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel=modulepreload]')).slice(0,24).map(link=>link.href),
   visibility:document.visibilityState,focused:document.hasFocus(),viewport:{width:innerWidth,height:innerHeight},
  }));
 }catch(error){receipt.documentError=failure(error);}
 await Promise.all([
  (async()=>{try{const html=await page.content(),limit=512*1024;await writeFile(receipt.artifacts.dom.path,html.slice(0,limit));receipt.artifacts.dom.saved=true;receipt.artifacts.dom.truncated=html.length>limit;}catch(error){receipt.artifacts.dom.error=failure(error);}})(),
  (async()=>{try{await page.screenshot({path:receipt.artifacts.screenshot.path,timeout:5000});receipt.artifacts.screenshot.saved=true;}catch(error){receipt.artifacts.screenshot.error=failure(error);}})(),
 ]);
 return receipt;
}
