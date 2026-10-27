/** Keep active authored code in strict TypeScript; pin reviewed vendor and archived tools explicitly. */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,lstat} from 'node:fs/promises';
import {join,resolve,extname,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
const vendorHashes:Readonly<Record<string,string>>={
  "frontend/vendor/three.module.js": "c8211c69345d2e9949dc7a8ac969380497aa0600a5a8ac6a459c8cd02dd9cb8a",
  "frontend/vendor/RoomEnvironment.js": "c20f0b4677f6128a138d7152b85cbef9091f4f45cdfa05adca04d40c1697c7ae",
  "frontend/vendor/meshopt_decoder.mjs": "97901fb3d2d296eeea2a57348a734ef0a17e35f2d4aea5a65223635d3f0e1709",
  "frontend/vendor/three.core.js": "eb077d2417f61d3e6d9264c317cabc4ea35769ed6b0ab533067292a550784c20",
  "frontend/vendor/GLTFLoader.js": "adbbafe8ce40416525b6be0ee5cac0d3782482bcf0122c8ca8ec1ffa77d3440b",
  "frontend/vendor/BufferGeometryUtils.js": "fda7e946b8e0b5ab39b779206589e7a1079a22eb24efb89d7223e03fdfb1f751",
  "frontend/vendor/qrcodegen.mjs": "7e3a4133e5ff7a2b973ef79bb6814295c5107940aa6bb2ff03228c62c71b6a02",
  "frontend/vendor/OrbitControls.js": "b97879c748170baadeb3fb84cea1ffdf4674e283dc06042f34e2acb95a76042c"
};
interface Finding {file:string;rule:string;line?:number}
export async function auditTypeScript(options:{root?:string;files?:readonly string[]}={}){
 const root=options.root??resolve(import.meta.dirname,'../..'),files=options.files??[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean))];
 const findings:Finding[]=[];let checkedFiles=0,typedSources=0,historicalFiles=0,vendorFiles=0;
 for(const file of files){
  const path=join(root,file);try{await lstat(path);}catch(error){if(error instanceof Error&&'code'in error&&error.code==='ENOENT')continue;throw error;}checkedFiles++;
  const suffix=extname(file).toLowerCase();if(!['.js','.mjs','.cjs','.py','.ts','.mts','.cts','.tsx','.json'].includes(suffix))continue;
  if(file.startsWith('tools/history/')){historicalFiles++;continue;}
  if(file.startsWith('frontend/vendor/')){const expected=vendorHashes[file];if(!expected)findings.push({file,rule:'unreviewed-vendor'});else if(createHash('sha256').update(await readFile(path)).digest('hex')!==expected)findings.push({file,rule:'changed-vendor'});else vendorFiles++;continue;}
  if(['.js','.mjs','.cjs'].includes(suffix)){findings.push({file,rule:'active-javascript'});continue;}
  if(suffix==='.py'){findings.push({file,rule:'active-python'});continue;}
  const text=await readFile(path,'utf8');
  if(suffix==='.json'){if(/^tsconfig(?:\.|$)/.test(basename(file))&&/"allowJs"\s*:\s*true/.test(text))findings.push({file,rule:'allow-javascript'});continue;}
  typedSources++;
  const patterns:[string,RegExp][]=[['explicit-any',/(?:\bas\s+any\b|:\s*any\b|<\s*any\s*>)/g],['type-suppression',/^\s*(?:\/\/|\/\*)\s*@ts-(?:ignore|nocheck)\b/gm]];
  for(const[rule,pattern]of patterns)for(const match of text.matchAll(pattern))findings.push({file,rule,line:text.slice(0,match.index).split('\n').length});
 }
 return {checkedFiles,typedSources,historicalFiles,vendorFiles,findings};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){try{const result=await auditTypeScript();console.log(JSON.stringify(result,null,2));process.exitCode=result.findings.length?1:0;}catch(error){console.error(error instanceof Error?error.message:String(error));process.exitCode=1;}}
