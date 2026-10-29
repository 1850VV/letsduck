/** Explicit historical verification only. Normal builds, tools and tests use TypeScript. */
import {execFileSync} from 'node:child_process';
import {chmod,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join,dirname,sep} from 'node:path';
import {unzipSync} from 'fflate';
export const historicalRevision='d5c38e4fa890a4eca40d8857317ac463163b46c3';
export async function prepareHistoricalSource(options:{revision?:string;repository?:string}={}) {
 const repository=options.repository??resolve(import.meta.dirname,'../..');
 const revision=execFileSync('git',['rev-parse','--verify','--end-of-options',(options.revision??historicalRevision)+'^{commit}'],{cwd:repository,encoding:'utf8'}).trim();
 if(!/^[a-f0-9]{40}$/.test(revision))throw new Error('Historical reference did not resolve to a commit');
 const root=await mkdtemp(join(tmpdir(),'duck-historical-reference-')),directories=new Set([root]);let cleanupPromise:Promise<void>|undefined;
 const cleanup=()=>cleanupPromise??=(async()=>{for(const path of directories)await chmod(path,0o755).catch(()=>{});await rm(root,{recursive:true,force:true});})();
 try{
  const archive=join(root,'source.zip');
  execFileSync('git',['archive','--format=zip','--output',archive,revision],{cwd:repository});
  const files=unzipSync(await readFile(archive));await rm(archive);
  for(const[name,data]of Object.entries(files)){
   if(name.endsWith('/'))continue;const path=resolve(root,name);if(!path.startsWith(root+sep))throw new Error('Invalid historical archive path');
   let parent=dirname(path);while(parent.startsWith(root+sep)){directories.add(parent);parent=dirname(parent);}
   await mkdir(dirname(path),{recursive:true});await writeFile(path,data,{mode:0o444});
  }
  for(const directory of [...directories].sort((a,b)=>b.length-a.length))await chmod(directory,0o555);
  return {root,revision,cleanup};
 }catch(error){await cleanup();throw error;}
}
