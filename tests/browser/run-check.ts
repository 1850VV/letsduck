/** Executable entry for Page snippets and standalone browser scripts. Never selects an old local port. */
import {spawn} from 'node:child_process';
import {mkdtemp,cp,rm,readdir,readFile,access,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import type {Page} from 'playwright';
import {createBrowserFixture,createCommunityBrowserFixture} from './fixture.js';
import {launchBrowser,required} from './checks.js';
type PageCheck=(page:Page)=>Promise<unknown>;
const isCheck=(value:unknown):value is PageCheck=>typeof value==='function';
const args=process.argv.slice(2),flags=new Map<string,string>();let script=false;
for(let i=0;i<args.length;i++){const flag=required(args[i]);if(flag==='--script'){script=true;continue;}if(!['--url','--check','--fixture','--frontend','--baseline'].includes(flag))throw Error('Unknown flag '+flag);flags.set(flag,required(args[++i],'Missing value for '+flag));}
const entry=flags.get('--check');if(!entry)throw Error('Use --check tests/<browser-check>.ts');
if(!flags.has('--url')&&!flags.has('--fixture'))throw Error('Use --url <owned URL> or --fixture debug|preparation|community');
if(flags.has('--url')&&flags.has('--fixture'))throw Error('Choose --url or --fixture');
const mode=flags.get('--fixture');if(mode&&mode!=='debug'&&mode!=='preparation'&&mode!=='community')throw Error('Fixture must be debug, preparation or community');
let snapshot:string|undefined,fixture:Pick<Awaited<ReturnType<typeof createBrowserFixture>>,'url'|'directory'|'close'>|undefined,browser:Awaited<ReturnType<typeof launchBrowser>>|undefined;
let url=flags.get('--url'),fingerprint:string|undefined,result:unknown,failed:unknown;
try{
 if(mode==='debug'||mode==='preparation'||mode==='community'){snapshot=await mkdtemp(join(tmpdir(),'duck-browser-dist-'));const frontend=join(snapshot,'frontend');await cp(resolve(flags.get('--frontend')??'frontend/dist'),frontend,{recursive:true});
  const digest=createHash('sha256');const files=async(directory:string):Promise<void>=>{for(const file of(await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){digest.update(file.name);if(file.isDirectory())await files(join(directory,file.name));else digest.update(await readFile(join(directory,file.name)));}};await files(frontend);fingerprint=digest.digest('hex');
  fixture=mode==='community'?await createCommunityBrowserFixture(frontend):await createBrowserFixture({mode,frontend});url=fixture.url;process.env.DUCK_FRONTEND_DIST=frontend;
 }
 const ownedUrl=new URL(required(url));if(!['http:','https:'].includes(ownedUrl.protocol))throw Error('Expected HTTP URL');
 const site:unknown=await(await fetch(new URL('/api/site',ownedUrl))).json();if(!site||typeof site!=='object'||!('edition'in site)||(site.edition!=='personal'&&site.edition!=='server'))throw Error('Owned URL did not provide a known edition');process.env.DUCK_BROWSER_EDITION=site.edition;
 if(mode==='preparation')process.env.DUCK_PREPARATION_TEST='1';
 process.env.DUCK_BROWSER_URL=ownedUrl.origin;process.env.ASSEMBLY_TEST_URL=ownedUrl.origin;
 if(flags.has('--baseline')){const baseline=required(flags.get('--baseline'));if(baseline==='same-fixture'&&!fixture)throw Error('same-fixture baseline requires an owned fixture');process.env.DUCK_BASELINE_URL=baseline==='same-fixture'?ownedUrl.origin:baseline;}
 await mkdir('output/integration',{recursive:true});const path=resolve(entry);
 if(script){
  const child=spawn(process.execPath,['--import','tsx',...(path.endsWith('.browser.ts')?['--test']:[]),path],{stdio:'inherit',env:process.env});
  const status=await new Promise<number|null>((done,reject)=>{child.once('error',reject);child.once('exit',done);});if(status!==0)throw Error(`Browser script exited ${String(status)}: ${entry}`);result={script:true,exitCode:status};
 }else{
  const candidate:unknown=await import(pathToFileURL(path).href);if(!candidate||typeof candidate!=='object'||!('default'in candidate)||!isCheck(candidate.default))throw Error('Expected a default Page check; use --script for standalone files');
  browser=await launchBrowser({headless:false});const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'zh-CN'});
  try{result=await candidate.default(await context.newPage());if(result&&typeof result==='object'){if(('pass'in result&&result.pass===false)||('passed'in result&&result.passed===false)||('failed'in result&&Array.isArray(result.failed)&&result.failed.length))throw Error('Browser check reported failures: '+JSON.stringify(result));}}finally{await context.close();}
 }
}catch(error){failed=error;}
finally{
 await browser?.close();const fixtureUrl=fixture?.url,directory=fixture?.directory;await fixture?.close();
 if(directory){await access(directory).then(()=>{throw Error('Fixture directory survived cleanup');},()=>{});try{await fetch(required(fixtureUrl),{signal:AbortSignal.timeout(1000)});throw Error('Fixture listener survived cleanup');}catch(error){if(error instanceof Error&&error.message==='Fixture listener survived cleanup')throw error;}}
 if(snapshot)await rm(snapshot,{recursive:true,force:true});
 console.log(JSON.stringify({check:entry,url,frontendSha256:fingerprint,result,passed:failed===undefined,browserClosed:!script||failed===undefined,fixtureClosed:fixture!==undefined,...(failed?{failure:failed instanceof Error?failed.stack:String(failed)}:{})}));
}
if(failed)throw failed;
