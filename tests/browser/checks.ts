import type {Page,Frame} from 'playwright';
import type {} from '../../frontend/studio/studio.js';
import type {} from '../../frontend/assemble/prototype-v3.js';
export function required<T>(value:T|null|undefined,label='Required test fixture missing'):T {if(value==null)throw Error(label);return value;}
export function failure(error:unknown):string{return error instanceof Error?error.stack||error.message:String(error);}
export interface Check {name:string;pass:boolean;detail?:unknown}
export interface Receipt {checks:Check[];errors:string[];consoleErrors:string[];failedRequests:{url:string;error:string|undefined}[];httpErrors:{url:string;status:number}[];writes:{method:string;url:string}[];failure?:string;browserClosed?:boolean}
export function receipt():Receipt{return {checks:[],errors:[],consoleErrors:[],failedRequests:[],httpErrors:[],writes:[]};}
/** Existing module checks model a returning user; onboarding checks opt into firstUse. */
export async function preparePage(page:Page,options:{firstUse?:boolean}={}):Promise<void>{
 if(!options.firstUse)await page.addInitScript(()=>localStorage.setItem('letsduck.experimental-access.v1',JSON.stringify({debug:true,assemble:true})));
 await page.addInitScript(()=>{
  window.__browserChecks={
   input(value:Element):HTMLInputElement{if(!(value instanceof HTMLInputElement))throw Error('Expected input');return value;},
   video(value:Element):HTMLVideoElement{if(!(value instanceof HTMLVideoElement))throw Error('Expected video');return value;},
   query<T extends Element=HTMLElement>(selector:string):T{const value=document.querySelector<T>(selector);if(!value)throw Error('Missing browser fixture '+selector);return value;},
   required<T>(value:T|null|undefined):T{if(value==null)throw Error('Missing browser fixture');return value;},
  };
 });
}
export async function chooseLocale(page:Page,code:string):Promise<void>{
 if(await page.locator('#language-trigger').isHidden())await page.locator('.ph-more').click();
 if(await page.locator('#language-menu').isHidden())await page.locator('#language-trigger').click();
 await page.locator(`[data-locale="${code}"]`).click();
}
declare global {interface Window {
 __browserChecks:{query<T extends Element=HTMLElement>(selector:string):T;required<T>(value:T|null|undefined):T;input(value:Element):HTMLInputElement;video(value:Element):HTMLVideoElement};
 _originalLocaleCanvas?:HTMLCanvasElement;_sameView?:number;_lastView?:number;
}}

export async function playwright():Promise<Pick<typeof import('playwright'),'chromium'>>{
 const path=process.env['PLAYWRIGHT_MODULE'];
 if(!path)return import('playwright');
 const {pathToFileURL}=await import('node:url');const {resolve}=await import('node:path');
 const candidate:unknown=await import(pathToFileURL(resolve(path)).href);
 const valid=(value:unknown):value is Pick<typeof import('playwright'),'chromium'>=>value!==null&&typeof value==='object'&&'chromium'in value&&value.chromium!==null&&typeof value.chromium==='object'&&'launch'in value.chromium&&typeof value.chromium.launch==='function';
 if(!valid(candidate))throw Error('PLAYWRIGHT_MODULE must export the Playwright Chromium driver');return candidate;
}
export async function installRuntime(page:Page|Frame,sourceUnit=false):Promise<void>{
 const [{build},{readFile,readdir},{resolve}]=await Promise.all([import('esbuild'),import('node:fs/promises'),import('node:path')]);
 const assets=await readdir(resolve(process.env.DUCK_FRONTEND_DIST??'frontend/dist','static'));const worker=assets.find(name=>/^positions-worker-[\w-]+\.js$/.test(name));if(!worker)throw Error('Build production positions worker before browser tests');
 const workerUrl=new URL('/static/'+worker,page.url()).href;
 const bundled=await build({entryPoints:[resolve('tests/browser/runtime-entry.ts')],bundle:true,write:false,format:'iife',alias:{three:resolve('frontend/vendor/three.module.js')},target:'es2023',plugins:[{name:'production-model-worker-url',setup(builder){
  if(sourceUnit)builder.onLoad({filter:/\/shared\/duck-view\.ts$/},async args=>{const source=await readFile(args.path,'utf8'),needle='return { invalidate, mount,';if(source.split(needle).length!==2)throw Error('Source unit instrumentation anchor changed');return {contents:source.replace(needle,'window.__sourceUnitInternals={renderer,scene,camera,draw,depthAllowed};return { invalidate, mount,'),loader:'ts',resolveDir:resolve('frontend/shared')};});
  builder.onLoad({filter:/\/shared\/model-loader\.ts$/},async args=>{const source=await readFile(args.path,'utf8'),needle="new URL('./positions-worker.ts',import.meta.url)";if(source.split(needle).length!==2)throw Error('Model worker URL mapping changed');return {contents:source.replace(needle,JSON.stringify(workerUrl)),loader:'ts',resolveDir:resolve('frontend/shared')};});
 }}]});
 const file=required(bundled.outputFiles[0]);await page.addScriptTag({content:file.text});
 await page.evaluate(()=>{if(window.studioProto&&!window.studioProto.view.canvas.isConnected)throw Error('Production view canvas disconnected');});
}

export async function mountSourceUnit(page:Page):Promise<void>{
 await installRuntime(page,true);
 await page.evaluate(async()=>{window.__unitData=await window.__duckModules.loadDuck();if(!window.__unitData.geometry)throw Error('Source unit requires production worker geometry');const host=document.createElement('div');host.dataset.sourceUnit='true';Object.assign(host.style,{position:'fixed',left:'-5000px',top:'0',width:'1440px',height:'1000px'});document.body.append(host);window.__unitView=window.__duckModules.createDuckView(window.__unitData);window.__unitView.mount(host);window.__unitView.setTurntable(false);});
 await page.waitForTimeout(1200);
}
export function paintUrl(base:string):string{const value=new URL(base);if(value.pathname==='/')value.pathname=process.env.DUCK_BROWSER_EDITION==='server'?'/':'/paint';return value.href;}
export function pngBytes(url:string):Buffer{const payload=url.split(',')[1];if(!payload)throw Error('Invalid captured PNG');return Buffer.from(payload,'base64');}
/** Every standalone script owns a managed browser and verifies its process tree exits. */
export async function launchBrowser(options:Parameters<typeof import('playwright').chromium.launch>[0]={}){
 const {chromium}=await playwright(),browser=await chromium.launch(browserLaunchOptions(options)),cdp=await browser.newBrowserCDPSession();
 const owned=new Set((await cdp.send('SystemInfo.getProcessInfo')).processInfo.map(item=>item.id));
 const close=browser.close.bind(browser);let closing:Promise<void>|undefined;
 browser.close=options=>closing??=(async()=>{
  try{for(const item of (await cdp.send('SystemInfo.getProcessInfo')).processInfo)owned.add(item.id);}catch{}
  finally{await cdp.detach().catch(()=>{});await close(options);}
  await processesExited(owned);
 })();return browser;
}
export function browserLaunchOptions(options:Parameters<typeof import('playwright').chromium.launch>[0]={}){
 return {...options,...(process.env.DUCK_BROWSER_HEADLESS==='1'?{headless:true}:process.env.DUCK_BROWSER_HEADLESS==='0'?{headless:false}:{}),...(process.env.DUCK_BROWSER_SWIFTSHADER==='1'?{args:[...(options.args??[]),'--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})};
}
/** Instrument a locale event while a modal intentionally makes the header inert. */
export async function dispatchLocale(page:Page,code:string):Promise<void>{await page.locator(`[data-locale="${code}"]`).dispatchEvent('click');await page.waitForFunction(code=>document.documentElement.lang===code,code);}
export async function browserPids(browser:import('playwright').Browser):Promise<number[]>{const session=await browser.newBrowserCDPSession();try{return(await session.send('SystemInfo.getProcessInfo')).processInfo.map(item=>item.id);}finally{await session.detach();}}
export async function processesExited(pids:Iterable<number>):Promise<void>{const live=()=>[...pids].filter(pid=>{try{process.kill(pid,0);return true;}catch{return false;}});for(let i=0;i<40&&live().length;i++)await new Promise(resolve=>setTimeout(resolve,50));if(live().length)throw Error('Owned Chromium processes remain: '+live().join(','));}

/** Standalone checks must name their owned service explicitly. */
export function browserUrl(name='DUCK_BROWSER_URL'):string{const value=process.env[name];if(!value)throw Error('Set '+name+' to an explicitly owned test URL');return new URL(value).origin;}
