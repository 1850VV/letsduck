/** One read-only resource and production-code stage shared by both deliveries. */
import {createHash} from 'node:crypto';
import {lstat,stat,readFile,readdir,mkdir,writeFile,realpath,chmod} from 'node:fs/promises';
import {join,resolve,relative,dirname,basename,sep,isAbsolute} from 'node:path';
import {isJsonObject,parseWireJson} from '@letsduck/domain';
import {loadAssemblyManifest} from '@letsduck/host';

export interface StagedFile {path:string;bytes:number;sha256:string;source:string|null}
export interface StageReceipt {target:string;files:StagedFile[];sourceSha256:string|null}
export interface RuntimeStageOptions {root:string;source?:string;target:string;withoutAssets?:boolean}
interface PlannedFile {path:string;bytes:Buffer;source:string|null;mode:number}
const digest=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
async function info(path:string){try{return await stat(path);}catch(error){if(error instanceof Error&&'code'in error&&error.code==='ENOENT')return null;throw error;}}
function within(path:string,parent:string){const value=relative(parent,path);return value===''||(!value.startsWith('..'+sep)&&value!=='..'&&!isAbsolute(value));}
async function canonical(path:string):Promise<string>{const absolute=resolve(path);try{return await realpath(absolute);}catch(error){if(!(error instanceof Error&&'code'in error&&error.code==='ENOENT'))throw error;const parent=dirname(absolute);if(parent===absolute)throw error;return join(await canonical(parent),basename(absolute));}}
function safeName(name:string){if(!name||name.includes('\\')||name.startsWith('/')||name.split('/').some(part=>part===''||part==='.'||part==='..'))throw new Error('Invalid runtime asset name: '+name);}
export async function newStageTarget(target:string,sources:string[]){
 target=await canonical(target);
 for(const source of sources){const actual=await realpath(source).catch(()=>resolve(source));if(within(target,actual)||within(actual,target))throw new Error('Stage target overlaps source: '+source);}
 try{await lstat(target);throw new Error('Stage target already exists: '+target);}catch(error){if(!(error instanceof Error&&'code'in error&&error.code==='ENOENT'))throw error;}
 return target;
}
async function planned(source:string,path:string):Promise<PlannedFile>{safeName(path);const meta=await stat(source);if(!meta.isFile())throw new Error('Runtime resource is not a file: '+source);return {path,bytes:await readFile(source),source:await realpath(source),mode:meta.mode&0o777};}
async function tree(source:string,prefix:string,excluded:ReadonlySet<string>=new Set()):Promise<PlannedFile[]>{
 const files:PlannedFile[]=[];
 for(const entry of await readdir(source,{withFileTypes:true})){
  if(excluded.has(entry.name)||entry.name.endsWith('.tsbuildinfo'))continue;
  const path=join(source,entry.name),name=prefix+'/'+entry.name,meta=await stat(path);
  if(meta.isDirectory()){if(entry.isSymbolicLink())throw new Error('Directory symlink cannot enter a runtime: '+path);files.push(...await tree(path,name,excluded));}
  else files.push(await planned(path,name));
 }
 return files;
}
async function publish(target:string,files:PlannedFile[],sourceSha256:string|null):Promise<StageReceipt>{
 await mkdir(target,{recursive:true});const receipt:StagedFile[]=[];
 for(const file of files){const path=join(target,file.path);await mkdir(dirname(path),{recursive:true});await writeFile(path,file.bytes,{flag:'wx'});await chmod(path,file.mode);receipt.push({path:file.path,bytes:file.bytes.length,sha256:digest(file.bytes),source:file.source});}
 return {target,files:receipt,sourceSha256};
}
const required=['source.3mf','model.json','catalog.json','export-schema.json','geometry.bin'] as const;
const optional=['filament-catalog.json','filament-profiles.json','geometry.pack.bin','geometry.positions.bin','geometry.positions.bin.br','geometry.positions.bin.gz'] as const;
export async function stageRuntimeAssets(options:RuntimeStageOptions):Promise<StageReceipt>{
 const root=resolve(options.root),source=resolve(options.source??join(root,'assets')),frontend=join(root,'frontend/dist'),manifestPath=join(root,'scripts/assembly-assets.json');
 const target=await newStageTarget(options.target,[source,frontend]),files=await tree(frontend,'frontend');
 files.push(await planned(manifestPath,'assembly-assets.json'));
 for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md'])files.push(await planned(join(root,name),name));
 let sourceSha256:string|null=null;
 if(!options.withoutAssets){
  const assets:PlannedFile[]=[];
  for(const name of required)assets.push(await planned(join(source,name),'assets/'+name));
  const model=assets.find(file=>file.path==='assets/model.json'),original=assets.find(file=>file.path==='assets/source.3mf');
  if(!model||!original)throw new Error('Missing model source');const decoded=parseWireJson(model.bytes.toString('utf8'));sourceSha256=digest(original.bytes);
  if(!isJsonObject(decoded)||decoded.source_sha256!==sourceSha256)throw new Error('3MF source does not match model manifest');
  for(const name of optional)if(await info(join(source,name)))assets.push(await planned(join(source,name),'assets/'+name));
  if(await info(join(source,'assembly'))){
   const manifest=loadAssemblyManifest(manifestPath);if(!manifest)throw new Error('Invalid assembly manifest');
   for(const [name,metadata]of Object.entries({...manifest.files,...manifest.optionalFiles})){
    safeName(name);if(!Object.hasOwn(manifest.files,name)&&!(await info(join(source,'assembly',name))))continue;
    const file=await planned(join(source,'assembly',name),'assets/assembly/'+name);
    if(!isJsonObject(metadata)||typeof metadata.bytes!=='number'||typeof metadata.sha256!=='string'||file.bytes.length!==metadata.bytes||digest(file.bytes)!==metadata.sha256)throw new Error('Assembly asset does not match manifest: '+name);
    assets.push(file);
   }
  }
  files.push(...assets);
 }
 return publish(target,files,sourceSha256);
}

interface PackageData {name:string;version:string;raw:Record<string,unknown>;dependencies:Record<string,string>;optionalDependencies:Record<string,string>}
function dependencies(value:unknown):Record<string,string>{if(value===undefined)return {};if(!isJsonObject(value))throw new Error('Invalid package dependencies');return Object.fromEntries(Object.entries(value).map(([name,version])=>{if(typeof version!=='string')throw new Error('Invalid dependency version: '+name);return [name,version];}));}
async function packageData(path:string):Promise<PackageData>{const raw:unknown=JSON.parse(await readFile(join(path,'package.json'),'utf8'));if(!isJsonObject(raw)||typeof raw.name!=='string'||typeof raw.version!=='string')throw new Error('Invalid production package: '+path);return {name:raw.name,version:raw.version,raw,dependencies:dependencies(raw.dependencies),optionalDependencies:dependencies(raw.optionalDependencies)};}
async function resolveDependency(name:string,from:string):Promise<string>{
 if(!/^(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_.-]+$/.test(name))throw new Error('Invalid production dependency: '+name);
 let directory=from;
 for(;;){const candidate=join(directory,'node_modules',name);if(await info(join(candidate,'package.json')))return realpath(candidate);const parent=dirname(directory);if(parent===directory)break;directory=parent;}
 throw new Error('Missing production dependency '+name+' from '+from);
}
export async function stageProductionApp(options:{root:string;target:string;entry:'desktop'|'browser'}):Promise<StageReceipt>{
 const root=await realpath(options.root),entry=options.entry==='desktop'?'desktop':'local',source=join(root,'apps',entry),target=await newStageTarget(options.target,[join(source,'dist'),join(root,'packages'),join(root,'node_modules')]);
 const main=await packageData(source),files=await tree(join(source,'dist'),'apps/'+entry+'/dist'),registry=new Map<string,string>();
 const workspacePrefix=join(root,'packages')+sep;
 async function dependency(name:string,from:string,parentTarget:string,optionalDependency:boolean):Promise<void>{
  let location:string;try{location=await resolveDependency(name,from);}catch(error){if(optionalDependency&&error instanceof Error&&error.message.startsWith('Missing production dependency'))return;throw error;}
  const top='node_modules/'+name,topSource=registry.get(top),local=await realpath(join(from,'node_modules',name)).catch(()=>null),destination=local===location&&parentTarget?parentTarget+'/node_modules/'+name:!topSource||topSource===location?top:parentTarget+'/node_modules/'+name;
  const previous=registry.get(destination);if(previous===location)return;if(previous)throw new Error('Conflicting production dependency: '+destination);registry.set(destination,location);
  const metadata=await packageData(location);
  if(location.startsWith(workspacePrefix)){
   const compiled=await tree(join(location,'dist'),destination+'/dist');files.push(await planned(join(location,'package.json'),destination+'/package.json'),...compiled);
  }else files.push(...await tree(location,destination,new Set(['node_modules','.git','.github','test','tests','__tests__'])));
  for(const [child]of Object.entries({...metadata.dependencies,...metadata.optionalDependencies}))await dependency(child,location,destination,Object.hasOwn(metadata.optionalDependencies,child));
 }
 for(const [name]of Object.entries({...main.dependencies,...main.optionalDependencies}))await dependency(name,source,'',Object.hasOwn(main.optionalDependencies,name));
 const metadata:Record<string,unknown>={...main.raw,main:'apps/'+entry+'/dist/main.js'};delete metadata.devDependencies;delete metadata.scripts;
 files.push({path:'package.json',source:null,mode:0o644,bytes:Buffer.from(JSON.stringify(metadata,null,2)+'\n')});
 for(const name of ['LICENSE','THIRD_PARTY_NOTICES.md'])files.push(await planned(join(root,name),name));
 return publish(target,files,null);
}
