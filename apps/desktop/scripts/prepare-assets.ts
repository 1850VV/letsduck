import {lstat,mkdir,realpath,rm} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {stageRuntimeAssets,stageProductionApp} from '../../../tooling/src/stage-runtime-assets.js';
const root=fileURLToPath(new URL('../../../',import.meta.url)),build=join(root,'apps/desktop/build'),source=resolve(process.env.DUCK_DISTRIBUTABLE_ASSETS??join(root,'assets'));
async function missing(path:string){try{return await lstat(path);}catch(error){if(error instanceof Error&&'code'in error&&error.code==='ENOENT')return null;throw error;}}
async function main(){
 if((await missing(build))?.isSymbolicLink())throw new Error('Desktop build directory cannot be a symlink');
 const canonicalSource=await realpath(source).catch(()=>source),canonicalBuild=await realpath(build).catch(()=>build);
 if(canonicalSource===canonicalBuild||canonicalSource.startsWith(canonicalBuild+sep))throw new Error('Asset source cannot be inside the desktop output');
 await mkdir(build,{recursive:true});
 for(const name of ['app','runtime']){const target=join(build,name);if((await missing(target))?.isSymbolicLink())throw new Error('Desktop stage cannot be a symlink');await rm(target,{recursive:true,force:true});}
 const application=await stageProductionApp({root,target:join(build,'app'),entry:'desktop'});
 const resources=await stageRuntimeAssets({root,source,target:join(build,'runtime'),withoutAssets:process.env.DUCK_PACKAGE_WITHOUT_ASSETS==='1'});
 console.log(JSON.stringify({application,resources}));
}
void main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
