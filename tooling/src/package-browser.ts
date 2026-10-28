/** Build-time ZIP delivery; launchers never install or discover a system runtime. */
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp,mkdir,readFile,readdir,stat,writeFile,copyFile,chmod,rm,realpath,open} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';
import {zipSync,type Zippable} from 'fflate';
import {isJsonObject} from '@letsduck/domain';
import {newStageTarget,stageProductionApp,stageRuntimeAssets} from './stage-runtime-assets.js';

export interface BrowserPackageOptions {root:string;nodeDirectory:string;platform:'darwin'|'win32';arch:'arm64'|'x64';output:string;source?:string;withoutAssets?:boolean}
export interface BrowserPackageReceipt {output:string;bytes:number;sha256:string;node:{source:string;version:string;platform:string;arch:string;sha256:string};resources:Awaited<ReturnType<typeof stageRuntimeAssets>>;application:Awaited<ReturnType<typeof stageProductionApp>>}
const sha=(data:Buffer)=>createHash('sha256').update(data).digest('hex');
export async function packageBrowser(options:BrowserPackageOptions):Promise<BrowserPackageReceipt>{
 if(!(options.platform==='win32'&&options.arch==='x64'||options.platform==='darwin'&&options.arch==='arm64'))throw new Error('Only Windows x64 and macOS arm64 are supported.');
 const root=await realpath(options.root),source=resolve(options.source??join(root,'assets')),output=await newStageTarget(options.output,[source,join(root,'frontend/dist'),options.nodeDirectory]);
 const nodeSource=join(options.nodeDirectory,options.platform==='win32'?'node.exe':'bin/node');
 const run=spawnSync(nodeSource,['-p','JSON.stringify({version:process.versions.node,platform:process.platform,arch:process.arch})'],{encoding:'utf8',timeout:15_000,env:{...process.env,NODE_OPTIONS:'',NODE_PATH:'',PATH:''}});
 if(run.error||run.status!==0)throw new Error('Cannot verify bundled Node runtime: '+(run.error?.message??run.stderr));
 const measured:unknown=JSON.parse(run.stdout);if(!isJsonObject(measured)||measured.version!=='24.20.0'||typeof measured.platform!=='string'||typeof measured.arch!=='string'||measured.platform!==options.platform||measured.arch!==options.arch)throw new Error('Bundled runtime must be Node24.20.0 for '+options.platform+'/'+options.arch+': '+run.stdout.trim());
 const node={source:await realpath(nodeSource),version:measured.version,platform:measured.platform,arch:measured.arch,sha256:sha(await readFile(nodeSource))};
 const temporary=await mkdtemp(join(tmpdir(),'duck-browser-package-'));
 try{
  const app=join(temporary,'app'),runtime=join(temporary,'runtime');
  const application=await stageProductionApp({root,target:app,entry:'browser'}),resources=await stageRuntimeAssets({root,target:runtime,source,...(options.withoutAssets===undefined?{}:{withoutAssets:options.withoutAssets})});
  const binary=options.platform==='win32'?'node/node.exe':'node/bin/node';await mkdir(dirname(join(temporary,binary)),{recursive:true});await copyFile(nodeSource,join(temporary,binary));await chmod(join(temporary,binary),0o755);await copyFile(join(options.nodeDirectory,'LICENSE'),join(temporary,'node/LICENSE'));
  const command=`#!/bin/sh\nCDPATH= cd -P -- "\${0%/*}" || exit 1\nexport DUCK_ASSETS="$PWD/runtime/assets"\nexport DUCK_FRONTEND="$PWD/runtime/frontend"\nexport DUCK_ASSEMBLY_MANIFEST="$PWD/runtime/assembly-assets.json"\nexec "$PWD/node/bin/node" "$PWD/app/apps/local/dist/main.js" "$@"\n`;
  const batch='@echo off\r\nset "DUCK_ASSETS=%~dp0runtime\\assets"\r\nset "DUCK_FRONTEND=%~dp0runtime\\frontend"\r\nset "DUCK_ASSEMBLY_MANIFEST=%~dp0runtime\\assembly-assets.json"\r\n"%~dp0node\\node.exe" "%~dp0app\\apps\\local\\dist\\main.js" %*\r\nexit /b %errorlevel%\r\n';
  const launcher=options.platform==='win32'?'启动来做鸭.bat':'启动来做鸭.command';await writeFile(join(temporary,launcher),options.platform==='win32'?batch:command);await chmod(join(temporary,launcher),0o755);
  const versionPath=await stat(join(root,'apps/desktop/package.json')).then(()=>join(root,'apps/desktop/package.json'),error=>{if(error instanceof Error&&'code'in error&&error.code==='ENOENT')return join(root,'apps/local/package.json');throw error;});
  const manifest:unknown=JSON.parse(await readFile(versionPath,'utf8'));if(!isJsonObject(manifest)||typeof manifest.version!=='string')throw new Error('Missing application package version');
  const folder='letsduck-'+manifest.version+'-browser-'+options.platform+'-'+options.arch,entries:Zippable={};
  async function archive(directory:string,prefix:string):Promise<void>{for(const entry of await readdir(directory,{withFileTypes:true})){const path=join(directory,entry.name),name=prefix+'/'+entry.name;if(entry.isDirectory())await archive(path,name);else{const mode=(await stat(path)).mode&0o777;entries[name]=[await readFile(path),{level:/\.(?:3mf|mp3|mp4|jpg|png|br|gz)$/.test(name)?0:6,os:3,attrs:((0o100000|mode)<<16)>>>0}];}}}
  await archive(temporary,folder);const bytes=Buffer.from(zipSync(entries));await mkdir(dirname(output),{recursive:true});const handle=await open(output,'wx');try{await handle.writeFile(bytes);}finally{await handle.close();}
  return {output,bytes:bytes.length,sha256:sha(bytes),node,resources,application};
 }finally{await rm(temporary,{recursive:true,force:true});}
}
async function main(){
 const {values}=parseArgs({options:{root:{type:'string'},assets:{type:'string'},'node-dir':{type:'string'},platform:{type:'string'},arch:{type:'string'},output:{type:'string'},'without-assets':{type:'boolean'},help:{type:'boolean'}}});
 if(values.help){console.log('Usage: package-browser --node-dir DIR --platform darwin|win32 --arch arm64|x64 --output NEW_FILE.zip [--assets SOURCE] [--without-assets] [--root ROOT]\nUses the shared compiled personal CLI and built Web. Node directory must contain official Node24.20.0 (bin/node or node.exe) and LICENSE. The runtime is executed and checked before packaging; no runtime downloads, npm or Python.');return;}
 if(!values['node-dir']||!values.output||!['darwin','win32'].includes(values.platform??'')||!['arm64','x64'].includes(values.arch??''))throw new Error('Provide node-dir, platform, arch and a new output ZIP');
 const platform=values.platform;if(platform!=='darwin'&&platform!=='win32')throw new Error('Invalid platform');const arch=values.arch;if(arch!=='arm64'&&arch!=='x64')throw new Error('Invalid architecture');
 const result=await packageBrowser({root:values.root??fileURLToPath(new URL('../../',import.meta.url)),nodeDirectory:values['node-dir'],platform,arch,output:values.output,...((values.assets??process.env.DUCK_DISTRIBUTABLE_ASSETS)===undefined?{}:{source:values.assets??process.env.DUCK_DISTRIBUTABLE_ASSETS!}),...(values['without-assets']===undefined?{}:{withoutAssets:values['without-assets']})});console.log(JSON.stringify(result));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))void main().catch(error=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
