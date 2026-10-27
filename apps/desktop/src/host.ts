import {startHost,loadAssemblyManifest} from '@letsduck/host';
import type {HostOptions} from '@letsduck/host';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {APP_ORIGIN} from './navigation.js';
import {parseHostRequest,processParentPort} from './ipc.js';
import type {ParentPort} from './ipc.js';
type Host=Pick<Awaited<ReturnType<typeof startHost>>,'url'|'busy'|'close'>;
type Factory=(options:HostOptions)=>Promise<Host>;
export async function startDesktopHost(env:NodeJS.ProcessEnv=process.env,parent?:ParentPort,factory:Factory=startHost,onStopped?:(code:0|1)=>void){
 const repo=fileURLToPath(new URL('../../../',import.meta.url)),manifest=loadAssemblyManifest(env.DUCK_ASSEMBLY_MANIFEST??join(repo,'scripts/assembly-assets.json'));
 const pending=factory({assets:env.DUCK_ASSETS??join(repo,'assets'),frontend:env.DUCK_FRONTEND??join(repo,'frontend/dist'),...(manifest===undefined?{}:{assemblyManifest:manifest}),...(env.DUCK_PERSONAL_DB===undefined?{}:{database:env.DUCK_PERSONAL_DB}),...(env.DUCK_LEGACY_DB===undefined?{}:{legacy:env.DUCK_LEGACY_DB}),uiOrigin:APP_ORIGIN,host:'127.0.0.1',port:0,search:1});
 let host:Host|undefined,closed:Promise<void>|undefined;
 const cleanup=()=>parent?.off('message',message);
 const stop=()=>closed??=(async()=>{let code:0|1=0;try{await(await pending).close();parent?.postMessage({kind:'stopped'});}catch(error){code=1;parent?.postMessage({kind:'failed',message:error instanceof Error?error.message:String(error)});throw error;}finally{cleanup();onStopped?.(code);}})();
 const message=(event:{data:unknown})=>{const request=parseHostRequest(event.data);if(request?.kind==='busy')parent?.postMessage({kind:'busy',id:request.id,busy:host?.busy??true});if(request?.kind==='stop')void stop().catch(()=>{});};
 parent?.on('message',message);
 try{host=await pending;if(!closed)parent?.postMessage({kind:'ready',url:host.url});return{url:host.url,stop};}
 catch(error){cleanup();parent?.postMessage({kind:'failed',message:error instanceof Error?error.message:String(error)});throw error;}
}
async function main(){
 const parent=processParentPort();let stop:(()=>Promise<void>)|undefined,requested=false;
 const signal=()=>{requested=true;if(stop)void stop().catch(error=>{console.error(error);process.exit(1);});};
 process.once('SIGINT',signal);process.once('SIGTERM',signal);
 try{const session=await startDesktopHost(process.env,parent,startHost,code=>{process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);process.exit(code);});stop=session.stop;if(!parent)console.log(session.url);if(requested)await stop();}
 catch(error){console.error(error);process.exit(1);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))void main();
